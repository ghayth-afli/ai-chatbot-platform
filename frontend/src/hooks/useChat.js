import { useState, useCallback } from "react";
import * as chatAPI from "../services/chatAPI";

const TITLE_MAX_LENGTH = 60;
const PLACEHOLDER_PREFIXES = ["chat", "new chat"];

const isPlaceholderTitle = (title = "") => {
  const normalized = title.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return PLACEHOLDER_PREFIXES.some((prefix) => normalized.startsWith(prefix));
};

const buildTitlePreview = (text = "") => {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return null;
  }

  if (cleaned.length <= TITLE_MAX_LENGTH) {
    return cleaned[0].toUpperCase() + cleaned.slice(1);
  }

  const truncated = cleaned.slice(0, TITLE_MAX_LENGTH).trimEnd();
  const lastSpace = truncated.lastIndexOf(" ");
  const finalSlice = lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated;
  return `${finalSlice}…`;
};

/**
 * useChat Hook
 * Manages chat state and API communication with the backend
 * Handles creating sessions, sending messages, loading history, and managing chat data
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);

  // Send a message to the backend
  const sendMessage = useCallback(
    async (message, model = "nemotron", sessionOverride = null) => {
      const sessionId = sessionOverride || currentSession;
      if (!sessionId) {
        setError("No active chat session");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Add user message to chat immediately
        const userMessage = {
          id: Date.now(),
          role: "user",
          content: message,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);

        const previewTitle = buildTitlePreview(message);
        if (previewTitle) {
          setChatSessions((prev) =>
            prev.map((session) =>
              session.id === sessionId && isPlaceholderTitle(session.title)
                ? { ...session, title: previewTitle }
                : session,
            ),
          );
        }

        // Send to backend API
        const response = await chatAPI.sendMessage(sessionId, message, model);

        // Backend returns `response` + metadata instead of `ai_message`
        const aiContent = response.ai_message?.content || response.response;
        if (aiContent) {
          const aiMessage = {
            id: response.ai_message_id || Date.now() + 1,
            role: "assistant",
            content: aiContent,
            model: response.ai_message?.model || response.model || model,
            timestamp:
              response.ai_message?.created_at || new Date().toISOString(),
          };

          setMessages((prev) => [...prev, aiMessage]);
        }

        if (response.session_title) {
          setChatSessions((prev) =>
            prev.map((session) =>
              session.id === sessionId
                ? { ...session, title: response.session_title }
                : session,
            ),
          );
        }

        return response;
      } catch (err) {
        const errorMsg = err.message || "Failed to send message";
        setError(errorMsg);
        console.error("Error sending message:", err);

        // Remove the user message if sending failed
        setMessages((prev) =>
          prev.filter((msg) => msg.role !== "user" || msg.content !== message),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [currentSession],
  );

  // Create a new chat session
  const createSession = useCallback(async (title = null) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await chatAPI.createChatSession(title);
      const sessionId = response.id;

      setCurrentSession((prev) => prev || sessionId);
      setMessages([]);
      setChatSessions((prev) => [{ ...response }, ...prev]);

      return response;
    } catch (err) {
      const errorMsg = err.message || "Failed to create session";
      setError(errorMsg);
      console.error("Error creating session:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetActiveSession = useCallback(() => {
    setCurrentSession(null);
    setMessages([]);
  }, []);

  // Load list of chat sessions
  const loadSessions = useCallback(async (page = 1) => {
    try {
      setError(null);

      const response = await chatAPI.getChatSessions(page);
      setChatSessions(response.results || response.sessions || []);

      return response;
    } catch (err) {
      const errorMsg = err.message || "Failed to fetch sessions";
      setError(errorMsg);
      console.error("Error loading sessions:", err);
    }
  }, []);

  // Load chat history for a specific session
  const loadChatHistory = useCallback(async (sessionId, page = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await chatAPI.getChatSession(sessionId, page);

      setCurrentSession(sessionId);

      // Format messages from backend
      const formattedMessages = (response.messages || []).map((msg) => ({
        id: msg.id,
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
        model: msg.model,
        timestamp: msg.created_at || new Date().toISOString(),
      }));

      setMessages(formattedMessages);

      return response;
    } catch (err) {
      const errorMsg = err.message || "Failed to fetch chat history";
      setError(errorMsg);
      console.error("Error loading chat history:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a session
  const deleteSession = useCallback(
    async (sessionId) => {
      try {
        setError(null);

        await chatAPI.deleteChatSession(sessionId);

        if (currentSession === sessionId) {
          setCurrentSession(null);
          setMessages([]);
        }

        // Reload sessions
        await loadSessions();

        return true;
      } catch (err) {
        const errorMsg = err.message || "Failed to delete session";
        setError(errorMsg);
        console.error("Error deleting session:", err);
      }
    },
    [currentSession],
  );

  // Update session model
  const updateModel = useCallback(async (sessionId, model) => {
    try {
      setError(null);

      const response = await chatAPI.updateSessionModel(sessionId, model);

      return response;
    } catch (err) {
      const errorMsg = err.message || "Failed to update model";
      setError(errorMsg);
      console.error("Error updating model:", err);
    }
  }, []);

  const exportSession = useCallback(
    async (sessionId, format = "text", language = "en") => {
      return chatAPI.exportChatSession(sessionId, format, language);
    },
    [],
  );

  return {
    messages,
    isLoading,
    error,
    currentSession,
    chatSessions,
    sendMessage,
    createSession,
    resetActiveSession,
    loadChatHistory,
    loadSessions,
    deleteSession,
    updateModel,
    exportSession,
  };
}
