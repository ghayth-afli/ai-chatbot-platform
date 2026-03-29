/**
 * DeleteSessionButton Component
 *
 * Displays a delete button with confirmation dialog for removing chat sessions.
 * Handles:
 * - Delete confirmation dialog
 * - Loading state during deletion
 * - Error handling and user feedback
 * - RTL support
 * - i18n support
 */

import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export const DeleteSessionButton = ({
  sessionId,
  sessionTitle,
  onDelete,
  disabled = false,
  className = "",
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      if (onDelete) {
        await onDelete(sessionId);
      }
      setShowConfirm(false);
    } catch (error) {
      console.error("Delete failed:", error);
      // Error handling is typically done by parent component
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <>
      {/* Delete Button */}
      <button
        onClick={handleDeleteClick}
        disabled={disabled || loading}
        className={`
          px-3 py-1.5 rounded text-sm font-500
          bg-[var(--spark)]/10 text-[var(--spark)]
          hover:bg-[var(--spark)]/20
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
          ${className}
        `}
        title={t("chat:deleteChat") || "Delete chat"}
      >
        {loading ? "..." : "🗑"}
      </button>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${
            isRTL ? "rtl" : "ltr"
          }`}
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 max-w-md shadow-lg">
            {/* Title */}
            <h3 className="text-lg font-600 text-[var(--paper)] mb-2">
              {t("chat:deleteConfirmTitle") || "Delete conversation?"}
            </h3>

            {/* Message */}
            <p className="text-sm text-[var(--muted)] mb-1">
              {t("chat:deleteConfirmMessage") ||
                "This action cannot be undone. All messages in this conversation will be permanently deleted."}
            </p>

            {/* Session Title Preview */}
            {sessionTitle && (
              <div className="bg-[var(--ink)]/50 rounded px-3 py-2 my-3 text-sm text-[var(--paper)]">
                <strong>{sessionTitle}</strong>
              </div>
            )}

            {/* Action Buttons */}
            <div
              className={`flex gap-3 mt-6 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              {/* Cancel Button */}
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded font-500 text-sm
                  bg-[var(--surface)] border border-[var(--border)]
                  text-[var(--paper)]
                  hover:bg-[var(--border)]
                  disabled:opacity-50
                  transition-colors"
              >
                {t("chat:cancel") || "Cancel"}
              </button>

              {/* Confirm Delete Button */}
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded font-600 text-sm
                  bg-[var(--spark)] text-white
                  hover:bg-[var(--spark)]/90
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors"
              >
                {loading
                  ? t("chat:deleting") || "Deleting..."
                  : t("chat:delete") || "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
