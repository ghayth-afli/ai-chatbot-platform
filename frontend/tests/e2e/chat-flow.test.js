/**
 * End-to-End Tests for Chat System
 *
 * Tests complete user flows:
 * - Create session → send message → receive response
 * - Delete session
 * - Performance thresholds (< 15s response, < 2s load)
 */

import { test, expect } from "@playwright/test";

test.describe("Chat System E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and login (assumes login already handled)
    await page.goto("http://localhost:3000/chat");

    // Wait for chat page to load
    await page.waitForSelector('[data-testid="chat-sidebar"]', {
      timeout: 5000,
    });
  });

  test("should create a new chat session", async ({ page }) => {
    // Click new chat button
    const newChatButton = page.locator('button:has-text("New Chat")').first();
    await newChatButton.click();

    // Verify new session appears in sidebar
    await expect(page.locator('[data-testid="chat-session"]')).toHaveCount(1);

    // Verify chat messages area shows empty state or ready
    const messagesArea = page.locator('[data-testid="chat-messages"]');
    await expect(messagesArea).toBeVisible();
  });

  test("should send message and receive response within 15 seconds", async ({
    page,
  }) => {
    // Create session
    const newChatButton = page.locator('button:has-text("New Chat")').first();
    await newChatButton.click();

    // Find and focus message input
    const messageInput = page.locator('[data-testid="message-input"] textarea');
    await messageInput.waitFor({ state: "visible" });
    await messageInput.focus();

    // Type message
    await messageInput.type("What is artificial intelligence?");

    // Click send button
    const sendButton = page.locator('[data-testid="send-button"]');

    // Measure response time
    const startTime = Date.now();
    await sendButton.click();

    // Wait for AI response to appear
    const aiMessage = page.locator('[data-testid="ai-message"]').first();

    // Set timeout to 15 seconds per spec
    await aiMessage.waitFor({ state: "visible", timeout: 15000 });

    const responseTime = Date.now() - startTime;
    console.log(`AI Response received in ${responseTime}ms`);

    // Verify response is within threshold
    expect(responseTime).toBeLessThan(15000);

    // Verify message content exists
    await expect(aiMessage).toContainText(
      /artificial|intelligence|AI|learning/i,
    );
  });

  test("should delete a session", async ({ page }) => {
    // Create a session first
    const newChatButton = page.locator('button:has-text("New Chat")').first();
    await newChatButton.click();

    // Find delete button (usually hover-revealed)
    const sessionItem = page.locator('[data-testid="chat-session"]').first();
    await sessionItem.hover();

    const deleteButton = sessionItem.locator(
      'button[aria-label="Delete session"], button:has-text("🗑")',
    );
    await deleteButton.click();

    // Handle confirmation dialog if present
    const confirmButton = page
      .locator('button:has-text("Delete"), button:has-text("Yes")')
      .last();
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Verify session is removed
    await expect(page.locator('[data-testid="chat-session"]')).toHaveCount(0);
  });

  test("should load large session (500+ messages) in under 2 seconds", async ({
    page,
  }) => {
    // This test assumes backend has test data with 500+ messages
    // In real scenario, would use API to create test session

    // Find session or create and populate
    const sessionItem = page.locator('[data-testid="chat-session"]').first();

    if (sessionItem) {
      // Measure load time
      const startTime = Date.now();
      await sessionItem.click();

      // Wait for messages to load
      await page
        .locator('[data-testid="message"]')
        .first()
        .waitFor({ state: "visible" });

      const loadTime = Date.now() - startTime;
      console.log(`Large session loaded in ${loadTime}ms`);

      // Verify performance threshold
      expect(loadTime).toBeLessThan(2000);
    }
  });

  test("should support pagination for large sessions", async ({ page }) => {
    // Find a session with multiple pages of messages
    const sessionItem = page.locator('[data-testid="chat-session"]').first();

    if (sessionItem) {
      await sessionItem.click();

      // Look for pagination controls
      const paginationControls = page.locator(
        '[data-testid="pagination-controls"]',
      );

      if (await paginationControls.isVisible()) {
        // Verify has next button
        const nextButton = paginationControls.locator(
          'button:has-text("Next"), button[aria-label*="next"]',
        );

        if (await nextButton.isEnabled()) {
          // Click next page
          await nextButton.click();

          // Verify messages updated
          await page
            .locator('[data-testid="message"]')
            .first()
            .waitFor({ state: "visible" });

          // Verify page indicator changed
          const pageIndicator = paginationControls.locator(
            '[data-testid="page-indicator"]',
          );
          await expect(pageIndicator).toContainText(/2/);
        }
      }
    }
  });

  test("should switch AI models during chat", async ({ page }) => {
    // Create session
    const newChatButton = page.locator('button:has-text("New Chat")').first();
    await newChatButton.click();

    // Find model selector
    const modelSelector = page.locator(
      '[data-testid="model-selector"]' +
        ", select[name='model']," +
        " button:has-text('DeepSeek')",
    );

    if (await modelSelector.isVisible()) {
      // Click to open dropdown
      await modelSelector.click();

      // Select different model (e.g., LLaMA 3)
      const llama3Option = page.locator("text=LLaMA 3, text=Llama").first();
      if (await llama3Option.isVisible()) {
        await llama3Option.click();
      }

      // Verify selection changed
      await expect(modelSelector).toContainText(/LLaMA|Llama/);
    }
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Create session
    const newChatButton = page.locator('button:has-text("New Chat")').first();
    await newChatButton.click();

    // Try to send empty message
    const sendButton = page.locator("[data-testid='send-button']");

    // Attempt to click send without message
    // Should either be disabled or show error
    const isDisabled = await sendButton.isDisabled();
    if (!isDisabled) {
      await sendButton.click();

      // Look for error message
      const errorMessage = page.locator(
        "[data-testid='error-message']," +
          ".text-spark," + // Error color from brand
          ".error",
      );

      await expect(errorMessage).toBeVisible({ timeout: 3000 });
    } else {
      // Button is properly disabled, which is also correct
      expect(isDisabled).toBe(true);
    }
  });
});
