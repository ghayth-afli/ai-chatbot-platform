import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
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
  const { messages, sendMessage, isLoading } = useChat();

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("deepseek-chat");
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  // Handle RTL direction based on language
  useEffect(() => {
    const isArabic = i18n.language === "ar";
    document.documentElement.dir = isArabic ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
    document.body.dir = isArabic ? "rtl" : "ltr";
  }, [i18n.language]);

  // Close sidebar on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSendMessage = (content) => {
    sendMessage(content, selectedModel);
  };

  const handleNewChat = () => {
    // Reset current chat
    setCurrentChatId(null);
    // In a real app, create new chat in backend
  };

  return (
    <div className={styles.app}>
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen || false}
        onClose={() => setSidebarOpen(false)}
        onOpenProfile={() => setProfilePanelOpen(true)}
        onNewChat={handleNewChat}
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        onSelectChat={(id) => setCurrentChatId(id)}
      />

      {/* Main Content Area */}
      <main className={styles.main}>
        {/* Header */}
        <ChatHeader
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenProfile={() => setProfilePanelOpen(true)}
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
        user={user}
      />
    </div>
  );
}
