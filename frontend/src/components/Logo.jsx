/**
 * Platform Logo Component
 *
 * Displays the nexus. AI platform logo with:
 * - Animated logomark (SVG)
 * - Wordmark "nexus."
 * - AI PLATFORM badge
 * - Full brand styling
 */

import React from "react";

const Logo = ({ size = "md", clickable = false, onClick = null }) => {
  const sizes = {
    sm: { mark: 32, font: 16, gap: 8 },
    md: { mark: 48, font: 22, gap: 12 },
    lg: { mark: 64, font: 32, gap: 16 },
  };

  const sizeConfig = sizes[size];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: `${sizeConfig.gap}px`,
        cursor: clickable ? "pointer" : "default",
        transition: clickable ? "transform 0.2s ease" : "none",
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (clickable) {
          e.currentTarget.style.transform = "scale(1.05)";
        }
      }}
      onMouseLeave={(e) => {
        if (clickable) {
          e.currentTarget.style.transform = "scale(1)";
        }
      }}
    >
      {/* Logomark */}
      <div
        style={{
          width: `${sizeConfig.mark}px`,
          height: `${sizeConfig.mark}px`,
          background: "rgba(123, 92, 255, 0.15)",
          border: "2px solid rgba(123, 92, 255, 0.4)",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width={sizeConfig.mark - 12}
          height={sizeConfig.mark - 12}
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Semicircle arc */}
          <path
            d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14"
            stroke="#C8FF00"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Vertical line */}
          <path
            d="M14 21L14 14"
            stroke="#7B5CFF"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Circle at bottom */}
          <circle cx="14" cy="21" r="2" fill="#C8FF00" />
          {/* Arrow pointing up */}
          <path
            d="M10 11.5L14 7L18 11.5"
            stroke="#C8FF00"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Wordmark + Badge */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {/* Wordmark */}
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: "800",
            fontSize: `${sizeConfig.font}px`,
            letterSpacing: "-0.02em",
            color: "#F5F3EF",
            display: "flex",
            alignItems: "baseline",
            gap: "2px",
          }}
        >
          nexus
          <span style={{ color: "#C8FF00" }}>.</span>
        </div>

        {/* AI PLATFORM Badge */}
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: `${Math.max(8, sizeConfig.font * 0.35)}px`,
            fontWeight: "700",
            background: "rgba(123, 92, 255, 0.2)",
            border: "1px solid rgba(123, 92, 255, 0.4)",
            color: "#7B5CFF",
            padding: "3px 8px",
            borderRadius: "100px",
            letterSpacing: "0.08em",
            display: "inline-flex",
            width: "fit-content",
          }}
        >
          AI PLATFORM
        </div>
      </div>
    </div>
  );
};

export default Logo;
