/**
 * useWebSocket Hook
 *
 * Custom React hook for managing WebSocket connections
 * and handling real-time message/session updates
 */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  initializeWebSocket,
  getSocket,
  onMessageReceived,
  onSessionEvent,
  onTypingIndicator,
  disconnectWebSocket,
  isConnected,
} from "../services/websocket";

export const useWebSocket = (token, enabled = true) => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const messageUnsubscribeRef = useRef(null);
  const sessionUnsubscribeRef = useRef(null);
  const typingUnsubscribeRef = useRef(null);

  // Initialize WebSocket
  useEffect(() => {
    if (!enabled || !token) {
      return;
    }

    try {
      initializeWebSocket(token);
      setConnected(isConnected());

      // Monitor connection state
      const socket = getSocket();
      if (socket) {
        const handleConnect = () => setConnected(true);
        const handleDisconnect = () => setConnected(false);

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);

        return () => {
          socket.off("connect", handleConnect);
          socket.off("disconnect", handleDisconnect);
        };
      }
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
    }
  }, [token, enabled]);

  // Subscribe to message events
  useEffect(() => {
    if (!connected) {
      return;
    }

    messageUnsubscribeRef.current = onMessageReceived((data) => {
      if (data.type === "update") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.data.message_id ? { ...msg, ...data.data } : msg,
          ),
        );
      } else if (data.type === "delete") {
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== data.data.message_id),
        );
      } else {
        // New message
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => {
      if (messageUnsubscribeRef.current) {
        messageUnsubscribeRef.current();
      }
    };
  }, [connected]);

  // Subscribe to session events
  useEffect(() => {
    if (!connected) {
      return;
    }

    sessionUnsubscribeRef.current = onSessionEvent((data) => {
      if (data.type === "created") {
        setSessions((prev) => [data.data, ...prev]);
      } else if (data.type === "updated") {
        setSessions((prev) =>
          prev.map((sess) =>
            sess.id === data.data.session_id ? { ...sess, ...data.data } : sess,
          ),
        );
      } else if (data.type === "deleted") {
        setSessions((prev) =>
          prev.filter((sess) => sess.id !== data.data.session_id),
        );
      }
    });

    return () => {
      if (sessionUnsubscribeRef.current) {
        sessionUnsubscribeRef.current();
      }
    };
  }, [connected]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!connected) {
      return;
    }

    typingUnsubscribeRef.current = onTypingIndicator((data) => {
      setTypingUsers((prev) => {
        if (data.type === "start") {
          return { ...prev, [data.user]: true };
        } else {
          const next = { ...prev };
          delete next[data.user];
          return next;
        }
      });
    });

    return () => {
      if (typingUnsubscribeRef.current) {
        typingUnsubscribeRef.current();
      }
    };
  }, [connected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
      if (messageUnsubscribeRef.current) messageUnsubscribeRef.current();
      if (sessionUnsubscribeRef.current) sessionUnsubscribeRef.current();
      if (typingUnsubscribeRef.current) typingUnsubscribeRef.current();
    };
  }, []);

  const addMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const broadcastMessage = useCallback((message) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("message.broadcast", message);
    }
  }, []);

  const updateSessionList = useCallback((newSessions) => {
    setSessions(newSessions);
  }, []);

  return {
    connected,
    messages,
    sessions,
    typingUsers,
    addMessage,
    broadcastMessage,
    updateSessionList,
    clearMessages: () => setMessages([]),
    clearSessions: () => setSessions([]),
  };
};
