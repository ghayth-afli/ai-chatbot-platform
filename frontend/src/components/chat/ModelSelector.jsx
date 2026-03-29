/**
 * ModelSelector Component
 *
 * Dropdown selector for AI models with:
 * - Model information (name, description)
 * - Availability status
 * - Performance indicators
 */

import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export function ModelSelector({
  selectedModel = "nemotron",
  onModelChange,
  disabled = false,
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [isOpen, setIsOpen] = useState(false);

  const models = [
    {
      id: "nemotron",
      name: "Nemotron",
      icon: "🚀",
      description: "NVIDIA's super 120B model with free tier",
      speed: "medium",
    },
    {
      id: "liquid",
      name: "Liquid",
      icon: "💧",
      description: "Fast thinking with LFM 2.5 technology",
      speed: "fast",
    },
    {
      id: "trinity",
      name: "Trinity",
      icon: "✨",
      description: "Arcee AI's efficient mini model",
      speed: "fast",
    },
  ];

  const selectedModelData = models.find((m) => m.id === selectedModel);

  const getSpeedBadge = (speed) => {
    switch (speed) {
      case "fast":
        return "bg-[var(--volt)]/20 text-[var(--volt)]";
      case "medium":
        return "bg-[var(--plasma)]/20 text-[var(--plasma)]";
      default:
        return "bg-[var(--ice)]/20 text-[var(--ice)]";
    }
  };

  const handleSelect = (modelId) => {
    onModelChange?.(modelId);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      {/* Main Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)]
          rounded-lg flex items-center justify-between
          hover:border-[var(--volt)]/50 transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isRTL ? "flex-row-reverse text-right" : ""}
        `}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{selectedModelData?.icon}</span>
          <div className={isRTL ? "text-right" : "text-left"}>
            <p className="text-sm font-600 text-[var(--paper)]">
              {selectedModelData?.name}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {t("chat:selectModel") || "Select model"}
            </p>
          </div>
        </div>

        <svg
          className={`w-5 h-5 text-[var(--muted)] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`
            absolute top-full ${isRTL ? "right-0" : "left-0"} mt-2 w-full
            bg-[var(--surface)] border border-[var(--border)] rounded-lg
            shadow-lg overflow-hidden z-50
          `}
        >
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => handleSelect(model.id)}
              className={`
                w-full px-4 py-3 text-left hover:bg-[var(--surface)]/80
                transition-colors border-b border-[var(--border)]/50
                last:border-b-0 flex items-center gap-3
                ${isRTL ? "flex-row-reverse text-right" : ""}
                ${selectedModel === model.id ? "bg-[var(--volt)]/10" : ""}
              `}
            >
              <span className="text-2xl flex-shrink-0">{model.icon}</span>

              <div className="flex-1">
                <p className="font-600 text-[var(--paper)]">{model.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {model.description}
                </p>
              </div>

              <div
                className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <span
                  className={`text-xs font-500 px-2 py-1 rounded ${getSpeedBadge(model.speed)}`}
                >
                  {model.speed === "fast"
                    ? "⚡ Fast"
                    : model.speed === "medium"
                      ? "⏱️ Med"
                      : "🐢 Slow"}
                </span>

                {selectedModel === model.id && (
                  <svg
                    className="w-5 h-5 text-[var(--volt)]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
