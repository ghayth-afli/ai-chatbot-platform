import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
import { useWebSocket } from "../../hooks/useWebSocket";
import styles from "./ChatPage.module.css";

// Sub-components
import Sidebar from "./components/Sidebar";
import ChatHeader from "./components/ChatHeader";
import MessagesArea from "./components/MessagesArea";
import InputArea from "./components/InputArea";
import ProfilePanel from "./components/ProfilePanel";

/**
 * ChatPage Component
 * Main full-featured chat interface with sidebar, header, messages, and input
 * Includes model selection, language toggle, user profile, and chat history
 * Full i18n support for EN/AR bilingual interface with RTL support
 */
export default function ChatPage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const {
    messages,
    sendMessage,
    isLoading,
    currentSession,
    chatSessions,
    createSession,
    loadSessions,
    loadChatHistory,
    deleteSession,
    updateModel,
  } = useChat();

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("nemotron");
  const [authToken, setAuthToken] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null,
  );
  const sessionInitializedRef = useRef(false);

  // Handle RTL direction based on language
  useEffect(() => {
    const isArabic = i18n.language === "ar";
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
    document.body.dir = isArabic ? "rtl" : "ltr";
  }, [i18n.language]);

  // Load chat sessions on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Update model when selectedModel changes
  useEffect(() => {
    if (currentSession) {
      updateModel(currentSession, selectedModel);
    }
  }, [selectedModel, currentSession, updateModel]);

  // Keep auth token in sync with localStorage updates and auth state changes
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncToken = () => {
      setAuthToken(localStorage.getItem("access_token"));
    };

    sessionInitializedRef.current = false;
    syncToken();
    window.addEventListener("storage", syncToken);
    return () => window.removeEventListener("storage", syncToken);
  }, [user]);

  // Auto-select or create a chat session so input is never disabled
  useEffect(() => {
    if (!user || isLoading) {
      return;
    }

    if (!currentSession && chatSessions.length > 0) {
      sessionInitializedRef.current = true;
      loadChatHistory(chatSessions[0].id);
    } else if (
      !currentSession &&
      chatSessions.length === 0 &&
      !sessionInitializedRef.current
    ) {
      sessionInitializedRef.current = true;
      createSession();
    }
  }, [
    chatSessions,
    currentSession,
    isLoading,
    loadChatHistory,
    createSession,
    user,
  ]);

  // Establish WebSocket connection when session + token available
  useWebSocket(currentSession, authToken, {
    onMessage: () => {
      if (currentSession) {
        loadChatHistory(currentSession);
      }
    },
    onSession: () => {
      loadSessions();
    },
    onError: (err) => {
      console.error("WebSocket error:", err);
    },
  });

  // Close sidebar and profile panel on screen resize to larger viewports
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
        setProfilePanelOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSendMessage = (content) => {
    if (!currentSession) {
      console.warn("No active chat session");
      return;
    }
    sendMessage(content, selectedModel);
  };

  const handleNewChat = async () => {
    try {
      const sessionId = await createSession();
      if (sessionId) {
        setSidebarOpen(false); // Close sidebar on mobile after creating new chat
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  const handleSelectChat = async (chatId) => {
    await loadChatHistory(chatId);
    setSidebarOpen(false); // Close sidebar on mobile after selecting chat
  };

  const handleDeleteChat = async (chatId) => {
    await deleteSession(chatId);
    if (currentSession === chatId) {
      // If deleted chat was current, list will be reloaded and currentSession set to null
    }
  };

  return (
    <div className={styles.app}>
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen || false}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onOpenProfile={() => setProfilePanelOpen(true)}
        onNewChat={handleNewChat}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        chatHistory={chatSessions}
        currentChatId={currentSession}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />

      {/* Main Content Area */}
      <main className={styles.main}>
        {/* Header */}
        <ChatHeader
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isSidebarCollapsed={sidebarCollapsed}
          onOpenProfile={() => setProfilePanelOpen(true)}
        />

        {/* Messages Area */}
        <MessagesArea messages={messages} isLoading={isLoading} />

        {/* Input Area */}
        <InputArea
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          disabled={!user || !currentSession}
        />
      </main>

      {/* Profile Panel */}
      <ProfilePanel
        isOpen={profilePanelOpen}
        onClose={() => setProfilePanelOpen(false)}
        user={user}
      />
    </div>
  );
}
