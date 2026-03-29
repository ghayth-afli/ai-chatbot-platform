import { useState, useCallback } from "react";

/**
 * useChat Hook
 * Manages chat state and API communication with the backend
 * Handles WebSocket connection, sending messages, and receiving responses
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);

  // Send a message to the backend
  const sendMessage = useCallback(async (message, model = "deepseek-chat") => {
    try {
      setIsLoading(true);
      setError(null);

      // Add user message to chat
      const userMessage = {
        id: Date.now(),
        role: "user",
        content: message,
        model,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // TODO: Connect to actual backend API
      // For now, return mock response
      const aiMessage = {
        id: Date.now() + 1,
        role: "ai",
        content: "Mock response from AI model",
        model,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(err.message);
      console.error("Error sending message:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new chat session
  const createSession = useCallback(() => {
    const sessionId = Date.now();
    setCurrentSession(sessionId);
    setMessages([]);
    return sessionId;
  }, []);

  // Load chat history
  const loadChatHistory = useCallback(async (sessionId) => {
    try {
      setIsLoading(true);
      // TODO: Connect to actual backend API to fetch chat history
      setCurrentSession(sessionId);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a session
  const deleteSession = useCallback(
    async (sessionId) => {
      try {
        // TODO: Connect to actual backend API
        if (currentSession === sessionId) {
          setCurrentSession(null);
          setMessages([]);
        }
      } catch (err) {
        setError(err.message);
      }
    },
    [currentSession],
  );

  return {
    messages,
    isLoading,
    error,
    currentSession,
    sendMessage,
    createSession,
    loadChatHistory,
    deleteSession,
  };
}
