/**
 * Chat Service Module
 *
 * Handles all API calls for chat operations:
 * - Creating sessions
 * - Sending messages
 * - Loading chat history
 * - Deleting sessions
 * - Updating model
 */

import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const CHAT_API = `${API_BASE_URL}/api/chat`;

/**
 * Send a message to the AI and get a response
 * @param {number} sessionId - Session ID
 * @param {string} message - User message text
 * @param {string} [model] - Optional model override
 * @returns {Promise} Response from AI
 */
export const sendMessage = async (sessionId, message, model = null) => {
  try {
    const payload = {
      message,
      ...(model && { model }),
    };

    console.log(`📤 Sending message to session ${sessionId}:`, payload);

    const response = await axios.post(
      `${CHAT_API}/${sessionId}/send/`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log(
      `✅ Message API response (status ${response.status}):`,
      response.data,
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Error sending message:", error);
    console.error("Error response:", error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to send message",
    };
  }
};

/**
 * Create a new chat session
 * @param {string} [title] - Optional session title
 * @param {string} [model] - Optional model selection
 * @param {string} [language] - Language ('en' or 'ar')
 * @returns {Promise} Created session data
 */
export const createSession = async (
  title = null,
  model = "nemotron",
  language = "en",
) => {
  try {
    const payload = {
      ...(title && { title }),
      model,
      language,
    };

    const response = await axios.post(CHAT_API + "/", payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error creating session:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to create session",
    };
  }
};

/**
 * Load all sessions for current user
 * @param {number} [page] - Page number (1-indexed)
 * @returns {Promise} List of sessions with pagination
 */
export const getSessions = async (page = 1) => {
  try {
    const response = await axios.get(`${CHAT_API}/?page=${page}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error loading sessions:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to load sessions",
    };
  }
};

/**
 * Load messages for a specific session
 * @param {number} sessionId - Session ID
 * @param {number} [page] - Page number (1-indexed)
 * @returns {Promise} Session data with messages
 */
export const getSessionMessages = async (sessionId, page = 1) => {
  try {
    const response = await axios.get(`${CHAT_API}/${sessionId}/?page=${page}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error loading session messages:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to load session",
    };
  }
};

/**
 * Delete a session
 * @param {number} sessionId - Session ID to delete
 * @returns {Promise} Deletion confirmation
 */
export const deleteSession = async (sessionId) => {
  try {
    const response = await axios.delete(`${CHAT_API}/${sessionId}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error deleting session:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to delete session",
    };
  }
};

/**
 * Update session AI model
 * @param {number} sessionId - Session ID
 * @param {string} model - New model ('nemotron', 'liquid', 'trinity')
 * @returns {Promise} Updated session data
 */
export const updateSessionModel = async (sessionId, model) => {
  try {
    const response = await axios.put(
      `${CHAT_API}/${sessionId}/update_model/`,
      { model },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
          "Content-Type": "application/json",
        },
      },
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error updating session model:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Failed to update model",
    };
  }
};

/**
 * Helper for optimistic rendering
 * Creates a temporary message object for UI display
 */
export const createOptimisticMessage = (content, role = "user") => {
  return {
    id: `temp-${Date.now()}`,
    role,
    content,
    created_at: new Date().toISOString(),
    isOptimistic: true,
  };
};
