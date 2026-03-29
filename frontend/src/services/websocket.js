/**
 * WebSocket Service Module
 *
 * Handles WebSocket connections for real-time chat sync
 * across multiple devices/windows via Django Channels
 */

import io from "socket.io-client";

const WS_URL = process.env.REACT_APP_WS_URL || "http://localhost:8000";

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

/**
 * Initialize WebSocket connection
 * @param {string} token - JWT authentication token
 * @param {Object} options - Socket.io options
 * @returns {Object} Socket instance
 */
export const initializeWebSocket = (token, options = {}) => {
  if (socket?.connected) {
    console.log("WebSocket already connected");
    return socket;
  }

  const defaultOptions = {
    reconnection: true,
    reconnectionDelay: RECONNECT_DELAY,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    auth: {
      token,
    },
    ...options,
  };

  socket = io(WS_URL, defaultOptions);

  // Connection handlers
  socket.on("connect", () => {
    console.log("WebSocket connected");
    reconnectAttempts = 0;
  });

  socket.on("connect_error", (error) => {
    console.error("WebSocket connection error:", error);
  });

  socket.on("disconnect", (reason) => {
    console.log("WebSocket disconnected:", reason);
  });

  socket.on("reconnect_attempt", () => {
    reconnectAttempts += 1;
    console.log(
      `Reconnection attempt: ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`,
    );
  });

  return socket;
};

/**
 * Get current socket instance
 * @returns {Object|null} Socket instance or null if not connected
 */
export const getSocket = () => socket;

/**
 * Subscribe to message events
 * @param {Function} callback - Function to call when message received
 */
export const onMessageReceived = (callback) => {
  if (!socket) {
    console.warn("WebSocket not initialized");
    return;
  }

  socket.on("message.new", (data) => {
    console.log("New message received:", data);
    callback(data);
  });

  socket.on("message.updated", (data) => {
    console.log("Message updated:", data);
    callback({ type: "update", data });
  });

  socket.on("message.deleted", (data) => {
    console.log("Message deleted:", data);
    callback({ type: "delete", data });
  });

  return () => {
    socket.off("message.new");
    socket.off("message.updated");
    socket.off("message.deleted");
  };
};

/**
 * Subscribe to session events
 * @param {Function} callback - Function to call when session event occurs
 */
export const onSessionEvent = (callback) => {
  if (!socket) {
    console.warn("WebSocket not initialized");
    return;
  }

  socket.on("session.created", (data) => {
    console.log("Session created:", data);
    callback({ type: "created", data });
  });

  socket.on("session.updated", (data) => {
    console.log("Session updated:", data);
    callback({ type: "updated", data });
  });

  socket.on("session.deleted", (data) => {
    console.log("Session deleted:", data);
    callback({ type: "deleted", data });
  });

  return () => {
    socket.off("session.created");
    socket.off("session.updated");
    socket.off("session.deleted");
  };
};

/**
 * Subscribe to typing indicator events
 * @param {Function} callback - Function to call when typing event
 */
export const onTypingIndicator = (callback) => {
  if (!socket) {
    console.warn("WebSocket not initialized");
    return;
  }

  socket.on("typing.start", (data) => {
    callback({ type: "start", user: data.user });
  });

  socket.on("typing.stop", (data) => {
    callback({ type: "stop", user: data.user });
  });

  return () => {
    socket.off("typing.start");
    socket.off("typing.stop");
  };
};

/**
 * Broadcast typing indicator
 * @param {number} sessionId - Session ID
 * @param {boolean} isTyping - Whether user is typing
 */
export const broadcastTyping = (sessionId, isTyping) => {
  if (!socket?.connected) {
    console.warn("WebSocket not connected");
    return;
  }

  socket.emit("typing", {
    session_id: sessionId,
    is_typing: isTyping,
  });
};

/**
 * Manually broadcast message to all connected clients
 * @param {Object} messageData - Message data to broadcast
 */
export const broadcastMessage = (messageData) => {
  if (!socket?.connected) {
    console.warn("WebSocket not connected");
    return;
  }

  socket.emit("message.broadcast", messageData);
};

/**
 * Disconnect WebSocket
 */
export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("WebSocket disconnected");
  }
};

/**
 * Check if WebSocket is connected
 * @returns {boolean}
 */
export const isConnected = () => {
  return socket?.connected || false;
};
