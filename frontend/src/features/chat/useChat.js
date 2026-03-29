/**
 * useChat Hook
 *
 * Custom React hook for managing chat state and operations
 * Handles sessions, messages, loading states, and errors
 */

import { useState, useCallback, useEffect } from "react";
import {
  createSession,
  getSessions,
  getSessionMessages,
  sendMessage,
  deleteSession,
  updateSessionModel,
} from "../services/chatService";

export const useChat = (token) => {
  // Session state
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);

  // Message state
  const [messages, setMessages] = useState([]);
  const [currentModel, setCurrentModel] = useState("deepseek");

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  // Load all sessions on init
  useEffect(() => {
    loadSessions();
  }, [token]);

  /**
   * Load all user sessions
   */
  const loadSessions = useCallback(
    async (page = 1) => {
      if (!token) return;

      setLoading(true);
      setError(null);

      const result = await getSessions(page);

      if (result.success) {
        setSessions(result.data.sessions || []);
      } else {
        setError(result.error || "Failed to load sessions");
      }

      setLoading(false);
    },
    [token],
  );

  /**
   * Create a new chat session
   */
  const handleCreateSession = useCallback(
    async (title = null, model = "deepseek", language = "en") => {
      setLoading(true);
      setError(null);

      const result = await createSession(title, model, language);

      if (result.success) {
        const newSession = result.data;
        setSessions((prev) => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        setCurrentSession(newSession);
        setCurrentModel(newSession.model);
        setMessages([]);
        return newSession.id;
      } else {
        setError(result.error || "Failed to create session");
        return null;
      }
    },
    [],
  );

  /**
   * Load messages for a specific session
   */
  const handleLoadSession = useCallback(async (sessionId, page = 1) => {
    setLoading(true);
    setError(null);

    const result = await getSessionMessages(sessionId, page);

    if (result.success) {
      setCurrentSessionId(sessionId);
      setCurrentSession({
        id: result.data.session_id,
        model: result.data.model || "deepseek",
      });
      setMessages(result.data.messages || []);
      setCurrentModel(result.data.model || "deepseek");
      return result.data;
    } else {
      setError(result.error || "Failed to load session");
      return null;
    }
  }, []);

  /**
   * Send a message and get AI response
   */
  const handleSendMessage = useCallback(
    async (messageText, model = null) => {
      if (!currentSessionId) {
        setError("No session selected");
        return null;
      }

      if (!messageText || !messageText.trim()) {
        setError("Message cannot be empty");
        return null;
      }

      setSending(true);
      setError(null);

      // Add optimistic user message
      const optimisticUserMsg = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: messageText,
        created_at: new Date().toISOString(),
        isOptimistic: true,
      };

      setMessages((prev) => [...prev, optimisticUserMsg]);

      const result = await sendMessage(currentSessionId, messageText, model);

      if (result.success) {
        // Remove optimistic message and add real ones
        const aiResponse = result.data.response;
        const aiModel = result.data.model;

        setMessages((prev) =>
          prev.filter((msg) => msg.id !== optimisticUserMsg.id),
        );

        // Add actual user and AI messages
        setMessages((prev) => [
          ...prev,
          {
            id: `user-${Date.now()}`,
            role: "user",
            content: messageText,
            created_at: new Date().toISOString(),
          },
          {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: aiResponse,
            model: aiModel,
            created_at: new Date().toISOString(),
          },
        ]);

        // Update current model if changed
        if (model) {
          setCurrentModel(model);
        }

        return result.data;
      } else {
        // Remove optimistic message on error
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== optimisticUserMsg.id),
        );
        setError(result.error || "Failed to send message");
        return null;
      }
    },
    [currentSessionId],
  );

  /**
   * Delete a session
   */
  const handleDeleteSession = useCallback(
    async (sessionId) => {
      setError(null);

      const result = await deleteSession(sessionId);

      if (result.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));

        // If deleted session was current, clear it
        if (sessionId === currentSessionId) {
          setCurrentSessionId(null);
          setCurrentSession(null);
          setMessages([]);
        }

        return true;
      } else {
        setError(result.error || "Failed to delete session");
        return false;
      }
    },
    [currentSessionId],
  );

  /**
   * Update session AI model
   */
  const handleUpdateSessionModel = useCallback(
    async (sessionId, model) => {
      setError(null);

      const result = await updateSessionModel(sessionId, model);

      if (result.success) {
        // Update session in list
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId ? { ...s, model: result.data.model } : s,
          ),
        );

        // Update current model if this is current session
        if (sessionId === currentSessionId) {
          setCurrentModel(result.data.model);
          setCurrentSession((prev) => ({
            ...prev,
            model: result.data.model,
          }));
        }

        return result.data;
      } else {
        setError(result.error || "Failed to update model");
        return null;
      }
    },
    [currentSessionId],
  );

  /**
   * Clear all messages (but keep session)
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Session data
    sessions,
    currentSessionId,
    currentSession,
    currentModel,

    // Message data
    messages,

    // State
    loading,
    sending,
    error,

    // Actions
    createSession: handleCreateSession,
    loadSession: handleLoadSession,
    sendMessage: handleSendMessage,
    deleteSession: handleDeleteSession,
    updateSessionModel: handleUpdateSessionModel,
    clearMessages,
    clearError,
    reloadSessions: loadSessions,
  };
};
