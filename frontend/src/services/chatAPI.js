/**
 * Chat API Service
 * Handles all backend API calls for chat functionality
 */

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/api";

/**
 * Get authorization headers with token
 */
function getHeaders() {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

/**
 * Create a new chat session
 */
export async function createChatSession(title = null, model = "nemotron") {
  const response = await fetch(`${API_BASE_URL}/chat/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      title: title || `Chat ${new Date().toLocaleDateString()}`,
      model,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create chat session");
  }

  return response.json();
}

/**
 * Get list of chat sessions for the user
 */
export async function getChatSessions(page = 1) {
  const response = await fetch(`${API_BASE_URL}/chat/?page=${page}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch chat sessions");
  }

  return response.json();
}

/**
 * Get a specific chat session with messages
 */
export async function getChatSession(sessionId, page = 1) {
  const response = await fetch(
    `${API_BASE_URL}/chat/${sessionId}/?page=${page}`,
    {
      method: "GET",
      headers: getHeaders(),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch chat session");
  }

  return response.json();
}

/**
 * Send a message to the AI
 */
export async function sendMessage(sessionId, message, model = null) {
  const response = await fetch(`${API_BASE_URL}/chat/${sessionId}/send/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      message,
      ...(model && { model }),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send message");
  }

  return response.json();
}

/**
 * Update the AI model for a session
 */
export async function updateSessionModel(sessionId, model) {
  const response = await fetch(
    `${API_BASE_URL}/chat/${sessionId}/update_model/`,
    {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ model }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update model");
  }

  return response.json();
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(sessionId) {
  const response = await fetch(`${API_BASE_URL}/chat/${sessionId}/`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete chat session");
  }

  return response.json();
}

/**
 * Health check
 */
export async function healthCheck() {
  const response = await fetch(`${API_BASE_URL}/health/`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Health check failed");
  }

  return response.json();
}
