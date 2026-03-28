/**
 * Chat Page (Protected)
 *
 * Main application page after authentication
 * - Displays current user information
 * - Shows user profile with avatar
 * - Logout functionality
 * - RTL support (Q3)
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/Button";

const ChatPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, logout, isLoading } = useAuth();
  const isRTL = i18n.language === "ar";

  const handleLogout = async () => {
    const result = await logout();

    if (result.success) {
      navigate("/auth/login");
    }
  };

  const handleLanguageToggle = () => {
    const newLanguage = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLanguage);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <header className="bg-white shadow-md">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {t("app.title") || "Nexus Chat"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Toggle */}
            <Button
              type="button"
              variant="secondary"
              onClick={handleLanguageToggle}
            >
              {i18n.language === "en" ? "العربية" : "English"}
            </Button>

            {/* Logout Button */}
            <Button
              type="button"
              variant="ghost"
              onClick={handleLogout}
              loading={isLoading}
            >
              {t("auth.logout") || "Logout"}
            </Button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div
            className={`flex items-center gap-6 ${isRTL ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-600">
                <span className="text-xl font-bold text-white">
                  {user?.first_name?.charAt(0) || "U"}
                </span>
              </div>
            </div>

            {/* User Info */}
            <div className={isRTL ? "text-right" : "text-left"}>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t("app.welcome") || "Welcome back"}, {user?.first_name}!
              </h2>
              <p className="text-gray-600 mb-4">
                {t("app.chatDescription") ||
                  "You're authenticated and ready to chat"}
              </p>

              {/* Verification Status */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    user?.is_verified
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {user?.is_verified
                    ? "✓ " + (t("auth.verified") || "Verified")
                    : "⊙ " + (t("auth.unverified") || "Unverified")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3
            className={`text-xl font-bold text-gray-900 mb-6 ${isRTL ? "text-right" : "text-left"}`}
          >
            {t("app.profileInfo") || "Profile Information"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className={isRTL ? "text-right" : "text-left"}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("forms.email") || "Email"}
              </label>
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                {user?.email}
              </p>
            </div>

            {/* First Name */}
            <div className={isRTL ? "text-right" : "text-left"}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("forms.firstName") || "First Name"}
              </label>
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                {user?.first_name}
              </p>
            </div>

            {/* Last Name */}
            <div className={isRTL ? "text-right" : "text-left"}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("forms.lastName") || "Last Name"}
              </label>
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                {user?.last_name}
              </p>
            </div>

            {/* Auth Provider */}
            <div className={isRTL ? "text-right" : "text-left"}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("app.authMethod") || "Authentication Method"}
              </label>
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg capitalize">
                {user?.auth_provider || "Email"}
              </p>
            </div>

            {/* Member Since */}
            <div className={isRTL ? "text-right" : "text-left"}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("app.memberSince") || "Member Since"}
              </label>
              <p className="text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                {new Date(user?.date_joined).toLocaleDateString(i18n.language)}
              </p>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div
              className={`text-3xl mb-4 ${isRTL ? "text-left" : "text-right"}`}
            >
              🔐
            </div>
            <h4
              className={`text-lg font-bold text-gray-900 mb-2 ${isRTL ? "text-right" : "text-left"}`}
            >
              {t("app.feature1") || "Secure"}
            </h4>
            <p
              className={`text-gray-600 text-sm ${isRTL ? "text-right" : "text-left"}`}
            >
              {t("app.feature1Desc") || "Your data is encrypted and secure"}
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div
              className={`text-3xl mb-4 ${isRTL ? "text-left" : "text-right"}`}
            >
              🌍
            </div>
            <h4
              className={`text-lg font-bold text-gray-900 mb-2 ${isRTL ? "text-right" : "text-left"}`}
            >
              {t("app.feature2") || "Multi-Language"}
            </h4>
            <p
              className={`text-gray-600 text-sm ${isRTL ? "text-right" : "text-left"}`}
            >
              {t("app.feature2Desc") || "Supports English and Arabic"}
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div
              className={`text-3xl mb-4 ${isRTL ? "text-left" : "text-right"}`}
            >
              ⚡
            </div>
            <h4
              className={`text-lg font-bold text-gray-900 mb-2 ${isRTL ? "text-right" : "text-left"}`}
            >
              {t("app.feature3") || "Fast"}
            </h4>
            <p
              className={`text-gray-600 text-sm ${isRTL ? "text-right" : "text-left"}`}
            >
              {t("app.feature3Desc") || "Instant authentication and response"}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-600 text-sm ${isRTL ? "text-right" : "text-left"}`}
        >
          © 2026 Nexus Chat. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default ChatPage;
