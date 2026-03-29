/**
 * useWebSocket Hook
 *
 * Custom React hook for managing WebSocket connections
 * and handling real-time chat session updates
 */

import { useEffect, useRef } from "react";
import {
  initializeWebSocket,
  onMessageReceived,
  onSessionEvent,
  disconnectWebSocket,
} from "../services/websocket";

/**
 * Initialize WebSocket for a specific chat session
 * @param {string} sessionId - Chat session ID
 * @param {string} token - JWT authentication token
 * @param {Object} handlers - Event handlers {onMessage, onSession, onError}
 * @returns {Object} WebSocket API with connect, disconnect, send methods
 */
export const useWebSocket = (sessionId, token, handlers = {}) => {
  const wsRef = useRef(null);
  const unsubscribersRef = useRef([]);

  // Initialize WebSocket connection
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!sessionId || !token) {
      return;
    }

    (async () => {
      try {
        const ws = await initializeWebSocket(sessionId, token);

        if (ws) {
          wsRef.current = ws;

          // Subscribe to message events
          if (handlers.onMessage) {
            const unsubMsg = onMessageReceived(ws, handlers.onMessage);
            unsubscribersRef.current.push(unsubMsg);
          }

          // Subscribe to session events
          if (handlers.onSession) {
            const unsubSession = onSessionEvent(ws, handlers.onSession);
            unsubscribersRef.current.push(unsubSession);
          }
        } else {
          // WebSocket connection failed - will use REST API
          if (handlers.onError) {
            handlers.onError("WebSocket connection failed");
          }
        }
      } catch (error) {
        if (handlers.onError) {
          handlers.onError(error.message);
        }
      }
    })();

    // Cleanup on unmount or when dependencies change
    return () => {
      unsubscribersRef.current.forEach((unsubscribe) => unsubscribe());
      unsubscribersRef.current = [];
      disconnectWebSocket(sessionId);
      wsRef.current = null;
    };
  }, [sessionId, token]);

  // API for sending messages over WebSocket
  const send = (data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  };

  // API for checking connection status
  const isConnected = () => {
    return wsRef.current?.readyState === WebSocket.OPEN;
  };

  return {
    send,
    isConnected,
    ws: wsRef.current,
  };
};
