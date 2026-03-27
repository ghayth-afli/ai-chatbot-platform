import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n/config";
import { LanguageProvider } from "./hooks/useLanguage";
import Landing from "./pages/Landing";
import "./App.css";

// Placeholder pages for routing
const LoginPage = () => (
  <div className="p-8 text-center text-paper">
    <h1 className="text-4xl font-bold text-volt mb-4">Login</h1>
    <p className="text-lg text-gray-400">Login page under development</p>
  </div>
);

const SignupPage = () => (
  <div className="p-8 text-center text-paper">
    <h1 className="text-4xl font-bold text-volt mb-4">Sign Up</h1>
    <p className="text-lg text-gray-400">Sign up page under development</p>
  </div>
);

const ChatPage = () => (
  <div className="p-8 text-center text-paper">
    <h1 className="text-4xl font-bold text-volt mb-4">Chat</h1>
    <p className="text-lg text-gray-400">Chat interface under development</p>
  </div>
);

const ProfilePage = () => (
  <div className="p-8 text-center text-paper">
    <h1 className="text-4xl font-bold text-volt mb-4">Profile</h1>
    <p className="text-lg text-gray-400">Profile page under development</p>
  </div>
);

const HistoryPage = () => (
  <div className="p-8 text-center text-paper">
    <h1 className="text-4xl font-bold text-volt mb-4">History</h1>
    <p className="text-lg text-gray-400">Chat history page under development</p>
  </div>
);

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <div className="min-h-screen bg-ink text-paper font-sans">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </BrowserRouter>
        </div>
      </LanguageProvider>
    </I18nextProvider>
  );
}

export default App;
