/**
 * Rate Limiting E2E Tests (Playwright)
 *
 * Tests for rate limit enforcement at 100 requests/minute
 * - Send 100+ rapid requests
 * - Verify UI shows rate limit error
 * - Verify countdown timer appears
 * - Verify chat input is disabled during cooldown
 */

import { test, expect, Page } from "@playwright/test";

test.describe("Rate Limiting", () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Navigate to app
    await page.goto("http://localhost:3000/chat");

    // Wait for chat interface to be ready
    await page.waitForSelector('[data-testid="chat-input"]', {
      timeout: 10000,
    });

    // Clear any rate limit data from localStorage
    await page.evaluate(() => {
      localStorage.removeItem("rate_limit_retry_after");
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test("Should block request 101 after 100 rapid requests", async () => {
    const sessionId = await page.evaluate(() => {
      // Extract session ID from the URL or app state
      const match = window.location.pathname.match(/\/chat\/(\d+)/);
      return match ? parseInt(match[1]) : null;
    });

    if (!sessionId) {
      test.skip();
      return;
    }

    // Send 100 rapid requests
    let successCount = 0;
    for (let i = 0; i < 100; i++) {
      await page.fill('[data-testid="chat-input"]', `Message ${i + 1}`);
      await page.click('[data-testid="send-button"]', {
        waitUntil: "networkidle",
      });
      successCount++;
    }

    expect(successCount).toBe(100);

    // Request 101 should fail with rate limit error
    await page.fill('[data-testid="chat-input"]', "Message 101");
    await page.click('[data-testid="send-button"]');

    // Wait for rate limit error to appear
    const rateLimitError = await page.waitForSelector(".rate-limit-error", {
      timeout: 5000,
    });

    expect(rateLimitError).toBeTruthy();

    // Verify error message contains rate limit text
    const errorText = await page.textContent(".rate-limit-error");
    expect(errorText).toContain("100 requests per minute");
  });

  test("Should display countdown timer in rate limit error", async () => {
    // Simulate rate limit by sending 101 requests quickly
    // (Simplified: directly check for rate limit error component)

    // Trigger rate limit error programmatically
    await page.evaluate(async () => {
      const sessionId = 1; // Mock session
      const token = localStorage.getItem("access_token");

      // Send many requests to trigger rate limit
      for (let i = 0; i < 101; i++) {
        try {
          await fetch("/api/chat/1/send/", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: `Test ${i}` }),
          });
        } catch (e) {
          // Ignore errors
        }
      }
    });

    // Wait for rate limit error with countdown
    const countdownTimer = await page.waitForSelector(".countdown-text", {
      timeout: 5000,
    });

    expect(countdownTimer).toBeTruthy();

    // Get initial countdown value
    const initialCountdown = await page.textContent(".countdown-text");
    expect(initialCountdown).toMatch(/^\d+s$/);

    // Wait 2 seconds and verify countdown decreased
    await page.waitForTimeout(2000);
    const decreasedCountdown = await page.textContent(".countdown-text");

    const initialSeconds = parseInt(initialCountdown || "0");
    const decreasedSeconds = parseInt(decreasedCountdown || "0");

    expect(decreasedSeconds).toBeLessThan(initialSeconds);
  });

  test("Should disable chat input during rate limit cooldown", async () => {
    // Trigger rate limit error
    await page.evaluate(async () => {
      const token = localStorage.getItem("access_token");

      // Send many requests
      for (let i = 0; i < 101; i++) {
        try {
          await fetch("/api/chat/1/send/", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: `Test ${i}` }),
          });
        } catch (e) {
          // Ignore
        }
      }
    });

    // Wait for rate limit error
    await page.waitForSelector(".rate-limit-error", { timeout: 5000 });

    // Get chat input element
    const chatInput = await page.$('[data-testid="chat-input"]');
    const sendButton = await page.$('[data-testid="send-button"]');

    // Verify input/button are disabled
    const isInputDisabled = await page.evaluate(
      (el) =>
        el?.hasAttribute("disabled") || el?.classList.contains("disabled"),
      chatInput,
    );

    const isButtonDisabled = await page.evaluate(
      (el) =>
        el?.hasAttribute("disabled") || el?.classList.contains("disabled"),
      sendButton,
    );

    expect(isInputDisabled || isButtonDisabled).toBeTruthy();
  });

  test("Should re-enable chat input when countdown reaches zero", async () => {
    // This test would ideally use time manipulation or a shorter cooldown for testing
    // For now, we'll skip if time manipulation isn't available

    test.skip();
  });

  test("Should show rate limit error in correct language", async () => {
    // Check for English error message
    await page.evaluate(async () => {
      const token = localStorage.getItem("access_token");

      for (let i = 0; i < 101; i++) {
        try {
          await fetch("/api/chat/1/send/", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              "Accept-Language": "en",
            },
            body: JSON.stringify({ message: `Test ${i}` }),
          });
        } catch (e) {
          // Ignore
        }
      }
    });

    // Wait for error message
    const errorText = await page.waitForSelector(".rate-limit-error", {
      timeout: 5000,
    });
    const text = await page.textContent(".rate-limit-error");

    // Check for English indicators
    expect(text).toMatch(/requests per minute/i);
  });

  test("Should show Retry-After header value in countdown", async () => {
    // Intercept the 429 response to verify Retry-After header
    let retryAfterValue = 0;

    await page.on("response", (response) => {
      if (response.status() === 429) {
        const retryAfter = response.headers()["retry-after"];
        retryAfterValue = parseInt(retryAfter || "60");
      }
    });

    // Trigger rate limit
    await page.evaluate(async () => {
      const token = localStorage.getItem("access_token");

      for (let i = 0; i < 101; i++) {
        try {
          await fetch("/api/chat/1/send/", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: `Test ${i}` }),
          }).catch(() => {});
        } catch (e) {
          // Ignore
        }
      }
    });

    // Wait for rate limit error
    await page.waitForSelector(".rate-limit-error", { timeout: 5000 });

    if (retryAfterValue > 0) {
      // Verify the countdown starts with the Retry-After value
      const countdownText = await page.textContent(".countdown-text");
      const countdownSeconds = parseInt(countdownText || "0");

      // Should be close to retryAfterValue (within 1 second due to timing)
      expect(Math.abs(countdownSeconds - retryAfterValue)).toBeLessThanOrEqual(
        1,
      );
    }
  });

  test("Should display rate limit error message from backend", async () => {
    // Trigger rate limit
    await page.evaluate(async () => {
      const token = localStorage.getItem("access_token");

      for (let i = 0; i < 101; i++) {
        try {
          await fetch("/api/chat/1/send/", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: `Test ${i}` }),
          }).catch(() => {});
        } catch (e) {
          // Ignore
        }
      }
    });

    // Wait for error message
    const errorMessage = await page.waitForSelector(".rate-limit-message", {
      timeout: 5000,
    });

    expect(errorMessage).toBeTruthy();

    const messageContent = await page.textContent(".rate-limit-message");
    expect(messageContent?.length).toBeGreaterThan(0);
  });
});
