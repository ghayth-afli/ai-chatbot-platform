/**
 * WebSocket Service Module
 *
 * Handles WebSocket connections for real-time chat sync
 * across multiple devices/windows via Django Channels
 */

const WS_BASE_URL = process.env.REACT_APP_WS_URL || "ws://localhost:8000";

let sockets = {}; // Map of session_id -> WebSocket connection

/**
 * Initialize WebSocket connection for a specific chat session
 * @param {string} sessionId - Chat session ID
 * @param {string} token - JWT authentication token
 * @returns {Promise<WebSocket|null>} WebSocket instance or null if connection fails
 */
export const initializeWebSocket = async (sessionId, token) => {
  if (sockets[sessionId]?.readyState === WebSocket.OPEN) {
    return sockets[sessionId];
  }

  return new Promise((resolve) => {
    let resolved = false; // Track if already resolved

    const resolveOnce = (value) => {
      if (!resolved) {
        resolved = true;
        resolve(value);
      }
    };

    try {
      const wsUrl = `${WS_BASE_URL}/ws/chat/${sessionId}/?token=${token}`;
      console.log(`[WebSocket] Connecting to ${wsUrl}`);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log(`[WebSocket] Connected to session ${sessionId}`);
        sockets[sessionId] = ws;
        resolveOnce(ws);
      };

      ws.onerror = (error) => {
        console.error(
          `[WebSocket] Connection error for session ${sessionId}:`,
          error,
        );
        sockets[sessionId] = null;
        resolveOnce(null);
      };

      ws.onclose = () => {
        console.log(`[WebSocket] Disconnected from session ${sessionId}`);
        sockets[sessionId] = null;
      };

      // Timeout after 5 seconds - if no connection, resolve with null
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.warn(
            `[WebSocket] Connection timeout for session ${sessionId}`,
          );
          ws.close();
          sockets[sessionId] = null;
          resolveOnce(null);
        }
      }, 5000);
    } catch (error) {
      console.error(
        `[WebSocket] Failed to create connection for session ${sessionId}:`,
        error,
      );
      resolveOnce(null);
    }
  });
};

/**
 * Get current socket instance for a session
 * @param {string} sessionId - Session ID
 * @returns {WebSocket|null} WebSocket instance or null if not connected
 */
export const getSocket = (sessionId) => sockets[sessionId] || null;

/**
 * Subscribe to message events on a WebSocket
 * @param {WebSocket} ws - WebSocket instance
 * @param {Function} callback - Function to call when message received
 */
export const onMessageReceived = (ws, callback) => {
  if (!ws) {
    return () => {}; // No-op if WebSocket not available
  }

  const messageEventTypes = [
    "message",
    "message.new",
    "message.updated",
    "message.deleted",
  ];

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (messageEventTypes.includes(data.type)) {
        callback(data);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  ws.addEventListener("message", handleMessage);

  return () => {
    ws.removeEventListener("message", handleMessage);
  };
};

/**
 * Subscribe to session events on a WebSocket
 * @param {WebSocket} ws - WebSocket instance
 * @param {Function} callback - Function to call when session event occurs
 */
export const onSessionEvent = (ws, callback) => {
  if (!ws) {
    return () => {}; // No-op if WebSocket not available
  }

  const sessionEventTypes = [
    "session.updated",
    "session.deleted",
    "user_join",
    "user_leave",
  ];

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (sessionEventTypes.includes(data.type)) {
        callback(data);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  ws.addEventListener("message", handleMessage);

  return () => {
    ws.removeEventListener("message", handleMessage);
  };
};

/**
 * Subscribe to typing indicator events
 * @param {WebSocket} ws - WebSocket instance
 * @param {Function} callback - Function to call when typing event
 */
export const onTypingIndicator = (ws, callback) => {
  if (!ws) {
    return () => {}; // No-op if WebSocket not available
  }

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "typing.start" || data.type === "typing.stop") {
        callback(data);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  ws.addEventListener("message", handleMessage);

  return () => {
    ws.removeEventListener("message", handleMessage);
  };
};

/**
 * Disconnect WebSocket and clean up
 * @param {string} sessionId - Session ID
 */
export const disconnectWebSocket = (sessionId) => {
  const ws = sockets[sessionId];
  if (ws) {
    ws.close();
    sockets[sessionId] = null;
  }
};

/**
 * Check if WebSocket is connected
 * @param {string} sessionId - Session ID
 * @returns {boolean} True if WebSocket is open
 */
export const isConnected = (sessionId) => {
  const ws = sockets[sessionId];
  return ws?.readyState === WebSocket.OPEN;
};
