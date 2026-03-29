/**
 * SessionItem Component
 *
 * Individual session display in the sidebar with:
 * - Session title
 * - Last message preview
 * - Model indicator
 * - Delete button
 * - Active state indicator
 */

import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export function SessionItem({
  session,
  isActive = false,
  onSelect,
  onDelete,
  loading = false,
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getModelIcon = (model) => {
    switch (model) {
      case "deepseek":
        return "🧠";
      case "llama3":
        return "🦙";
      case "mistral":
        return "⚡";
      default:
        return "🤖";
    }
  };

  const getModelName = (model) => {
    switch (model) {
      case "deepseek":
        return "DeepSeek";
      case "llama3":
        return "LLaMA 3";
      case "mistral":
        return "Mistral";
      default:
        return "Unknown";
    }
  };

  const truncateText = (text, maxLength = 40) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const getLastMessage = () => {
    if (session.messages && session.messages.length > 0) {
      const lastMsg = session.messages[session.messages.length - 1];
      return lastMsg.content;
    }
    return null;
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  if (showDeleteConfirm) {
    return (
      <div
        className={`p-3 mx-2 mb-2 bg-[var(--spark)]/10 border border-[var(--spark)] rounded-lg ${isRTL ? "text-right" : "text-left"}`}
      >
        <p className="text-xs text-[var(--spark)] mb-2 font-500">
          {t("chat:deleteConfirm") || "Delete this chat?"}
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleConfirmDelete}
            className="flex-1 px-2 py-1 bg-[var(--spark)] text-white text-xs font-600 rounded hover:bg-[var(--spark)]/90 transition-colors"
            disabled={loading}
          >
            {loading ? "..." : t("chat:delete") || "Delete"}
          </button>
          <button
            onClick={handleCancelDelete}
            className="flex-1 px-2 py-1 bg-[var(--surface)] text-[var(--paper)] text-xs font-600 rounded hover:bg-[var(--surface)]/80 transition-colors"
            disabled={loading}
          >
            {t("chat:cancel") || "Cancel"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`
        group p-3 mx-2 mb-2 rounded-lg cursor-pointer transition-all duration-200
        ${
          isActive
            ? "bg-[var(--volt)]/20 border border-[var(--volt)]/50"
            : "bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--volt)]/50"
        }
        ${isRTL ? "text-right" : "text-left"}
      `}
    >
      {/* Header: Title and Model */}
      <div
        className={`flex items-center gap-2 mb-2 ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <span className="text-lg flex-shrink-0">
          {getModelIcon(session.ai_model)}
        </span>
        <h3 className="flex-1 text-sm font-600 text-[var(--paper)] truncate">
          {session.title || "Untitled"}
        </h3>
      </div>

      {/* Last Message Preview */}
      <p className="text-xs text-[var(--muted)] truncate mb-2">
        {truncateText(getLastMessage())}
      </p>

      {/* Footer: Meta and Delete Button */}
      <div
        className={`flex items-center justify-between text-xs text-[var(--muted)] ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <span>{new Date(session.updated_at).toLocaleDateString()}</span>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 text-[var(--spark)] hover:text-[var(--spark)]/80 transition-all p-1 rounded hover:bg-[var(--spark)]/10"
          title={t("chat:deleteChat") || "Delete"}
        >
          ✕
        </button>
      </div>

      {/* Active Indicator */}
      {isActive && (
        <div
          className={`absolute top-2 ${isRTL ? "left-2" : "right-2"} w-2 h-2 bg-[var(--volt)] rounded-full`}
        />
      )}
    </div>
  );
}
