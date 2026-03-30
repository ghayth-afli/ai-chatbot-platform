/**
 * RateLimitError Component
 *
 * Displays a rate limit error message with a countdown timer.
 * Shows "Try again in {seconds}s" and updates every second until 0.
 *
 * Props:
 * - retryAfter: number of seconds until retry is allowed
 * - onRetryReady: callback when countdown reaches 0
 * - compact: boolean to show compact version
 */

import React, { useState, useEffect } from "react";
import { useTranslation } from "i18next";
import "./RateLimitError.css";

const RateLimitError = ({
  retryAfter = 60,
  onRetryReady = null,
  compact = false,
}) => {
  const { t } = useTranslation();
  const [secondsRemaining, setSecondsRemaining] = useState(retryAfter);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      setIsExpired(true);
      if (onRetryReady) {
        onRetryReady();
      }
      return;
    }

    const timer = setTimeout(() => {
      setSecondsRemaining(secondsRemaining - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsRemaining, onRetryReady]);

  if (compact) {
    return (
      <div className="rate-limit-error compact">
        <span className="rate-limit-icon">⏱️</span>
        <span className="rate-limit-message">
          {isExpired
            ? t("common.retry", "Try Again")
            : t("error.rate_limit_short", { seconds: secondsRemaining })}
        </span>
      </div>
    );
  }

  return (
    <div className={`rate-limit-error ${isExpired ? "expired" : "active"}`}>
      <div className="rate-limit-header">
        <span className="rate-limit-icon">⏱️</span>
        <h3 className="rate-limit-title">Rate Limited</h3>
      </div>

      <div className="rate-limit-body">
        <p className="rate-limit-message">
          {t("error.rate_limit", { seconds: secondsRemaining })}
        </p>

        <div className="rate-limit-countdown">
          <div className="countdown-circle">
            <svg viewBox="0 0 100 100" className="countdown-svg">
              <circle cx="50" cy="50" r="40" className="countdown-circle-bg" />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="countdown-circle-progress"
                style={{
                  strokeDasharray: `${((retryAfter - secondsRemaining) / retryAfter) * 251} 251`,
                }}
              />
            </svg>
            <span className="countdown-text">{secondsRemaining}s</span>
          </div>
        </div>

        {isExpired && (
          <p className="rate-limit-expired">✅ You can try again now</p>
        )}
      </div>

      <div className="rate-limit-tips">
        <p className="tip-title">Tips:</p>
        <ul>
          <li>Maximum 100 requests per minute</li>
          <li>Wait for the timer to complete</li>
          <li>Window resets after 60 seconds</li>
        </ul>
      </div>
    </div>
  );
};

export default RateLimitError;
