import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { sessionId: routeSessionId } = useParams();
  const {
    messages,
    sendMessage,
    isLoading,
    currentSession,
    chatSessions,
    createSession,
    resetActiveSession,
    loadSessions,
    loadChatHistory,
    deleteSession,
    updateModel,
    exportSession,
  } = useChat();

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("nemotron");
  const [authToken, setAuthToken] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null,
  );
  const canCreateNewChat = true;
  const skipNextHistoryLoadRef = useRef(false);
  const hasMessages = messages.length > 0;
  const [isExporting, setIsExporting] = useState(false);

  const profileStats = useMemo(() => {
    const modelsUsed = new Set(
      messages.map((message) => message.model).filter(Boolean),
    );

    return {
      chats: chatSessions.length,
      messages: messages.length,
      models: modelsUsed.size,
    };
  }, [chatSessions, messages]);

  const profilePreferences = useMemo(() => {
    const planLabel =
      user?.plan_status || user?.subscription_plan || user?.plan || "Free";

    const formattedModel = selectedModel
      ? selectedModel.charAt(0).toUpperCase() + selectedModel.slice(1)
      : "";

    return {
      language: i18n.language === "ar" ? "Arabic" : "English",
      model: formattedModel,
      plan: planLabel,
    };
  }, [i18n.language, selectedModel, user]);

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

    syncToken();
    window.addEventListener("storage", syncToken);
    return () => window.removeEventListener("storage", syncToken);
  }, [user]);

  // Load session from URL param when needed
  useEffect(() => {
    if (!routeSessionId) {
      return;
    }

    if (skipNextHistoryLoadRef.current) {
      skipNextHistoryLoadRef.current = false;
      return;
    }

    if (routeSessionId !== currentSession) {
      loadChatHistory(routeSessionId);
      return;
    }

    if (!hasMessages) {
      loadChatHistory(routeSessionId);
    }
  }, [routeSessionId, currentSession, loadChatHistory, hasMessages]);

  // Clear active session when URL has no id
  useEffect(() => {
    if (!routeSessionId && currentSession) {
      resetActiveSession();
    }
  }, [routeSessionId, currentSession, resetActiveSession]);

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

  const handleSendMessage = useCallback(
    async (content) => {
      let sessionId = currentSession;

      if (!sessionId) {
        const newSession = await createSession();
        sessionId = newSession?.id;
        if (!sessionId) {
          console.warn("Unable to create a chat session");
          return;
        }
        skipNextHistoryLoadRef.current = true;
        navigate(`/chat/${sessionId}`);
      } else if (routeSessionId !== sessionId) {
        navigate(`/chat/${sessionId}`);
      }

      sendMessage(content, selectedModel, sessionId);
    },
    [
      createSession,
      currentSession,
      navigate,
      routeSessionId,
      selectedModel,
      sendMessage,
    ],
  );

  const handleLogout = useCallback(async () => {
    try {
      const result = await logout();
      if (result?.success !== false) {
        setProfilePanelOpen(false);
        navigate("/login");
      } else {
        console.error("Logout failed", result?.error);
      }
    } catch (error) {
      console.error("Unexpected logout error", error);
    }
  }, [logout, navigate]);

  const handleNewChat = useCallback(() => {
    navigate("/chat");
    resetActiveSession();
    setSidebarOpen(false);
  }, [navigate, resetActiveSession, setSidebarOpen]);

  const handleSelectChat = useCallback(
    (chatId) => {
      if (!chatId) {
        return;
      }

      if (chatId !== routeSessionId) {
        navigate(`/chat/${chatId}`);
      }

      setSidebarOpen(false);
    },
    [navigate, routeSessionId, setSidebarOpen],
  );

  const handleDeleteChat = useCallback(
    async (chatId) => {
      const wasCurrent = currentSession === chatId;
      await deleteSession(chatId);
      if (wasCurrent) {
        navigate("/chat");
      }
    },
    [currentSession, deleteSession, navigate],
  );

  const handleExportChat = useCallback(
    async ({ format, language }) => {
      if (!currentSession || isExporting) {
        return;
      }

      try {
        setIsExporting(true);
        const { blob, filename } = await exportSession(
          currentSession,
          format,
          language,
        );

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Failed to export chat", error);
      } finally {
        setIsExporting(false);
      }
    },
    [currentSession, exportSession, isExporting],
  );

  return (
    <div className={styles.app}>
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen || false}
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onOpenProfile={() => setProfilePanelOpen(true)}
        onNewChat={handleNewChat}
        canCreateNewChat={canCreateNewChat}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        chatHistory={chatSessions}
        currentChatId={currentSession}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onExportChat={handleExportChat}
        exportDisabled={!currentSession || isExporting}
        exportLoading={isExporting}
        user={user}
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
          onLogout={handleLogout}
        />

        {/* Messages Area */}
        <MessagesArea messages={messages} isLoading={isLoading} />

        {/* Input Area */}
        <InputArea
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          disabled={!user}
        />
      </main>

      {/* Profile Panel */}
      <ProfilePanel
        isOpen={profilePanelOpen}
        onClose={() => setProfilePanelOpen(false)}
        onLogout={handleLogout}
        user={user}
        stats={profileStats}
        preferences={profilePreferences}
      />
    </div>
  );
}
