/**
 * Chat Page Wrapper (Protected)
 *
 * Loads the main ChatPage component from features/chat
 * Handles authentication and provides context
 */

import React from "react";
import { ChatPage as ChatPageComponent } from "../features/chat/ChatPage";

const ChatPage = () => {
  return <ChatPageComponent />;
};

export default ChatPage;
