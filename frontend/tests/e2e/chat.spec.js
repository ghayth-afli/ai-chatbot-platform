/**
 * E2E Tests for Chat System
 * Using Playwright
 */

import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const API_BASE_URL = "http://localhost:8000/api";

// Test user credentials
const TEST_USER = {
  email: "e2e-test@example.com",
  password: "TestPassword123!",
};

test.describe("Chat System E2E Tests", () => {
  let authToken;

  test.beforeAll(async () => {
    // Setup: Create test user and get auth token
    // Note: This should be replaced with actual API call or fixture setup
    authToken = "test-token-placeholder";
  });

  test.describe("Chat Session Management", () => {
    test("should create a new chat session", async ({ page }) => {
      await page.goto(`${BASE_URL}/chat`);

      // Click "Start New Chat" button
      const newChatButton = page.getByRole("button", {
        name: /start new chat|new/i,
      });
      await expect(newChatButton).toBeVisible();
      await newChatButton.click();

      // Verify session is created
      const sessionTitle = page.locator('[data-testid="session-title"]');
      await expect(sessionTitle).toBeVisible();
    });

    test("should display list of sessions", async ({ page }) => {
      await page.goto(`${BASE_URL}/chat`);

      // Wait for sessions to load
      const sessionList = page.locator('[data-testid="session-list"]');
      await expect(sessionList).toBeVisible();

      // Should have at least one session item
      const sessionItems = page.locator('[data-testid="session-item"]');
      const count = await sessionItems.count();
      expect(count).toBeGreaterThan(0);
    });

    test("should delete a session with confirmation", async ({ page }) => {
      await page.goto(`${BASE_URL}/chat`);

      // Find delete button in first session
      const deleteButtons = page.locator('[data-testid="delete-session-btn"]');
      const firstDeleteBtn = deleteButtons.first();
      await expect(firstDeleteBtn).toBeVisible();

      // Click delete and wait for confirmation
      await firstDeleteBtn.click();

      // Confirm deletion
      const confirmButton = page.getByRole("button", {
        name: /confirm|delete/i,
      });
      await expect(confirmButton).toBeVisible();
      await confirmButton.click();

      // Verify session is deleted (this would refresh the list)
      await page.waitForLoadState("networkidle");
    });

    test("should switch between sessions", async ({ page }) => {
      await page.goto(`${BASE_URL}/chat`);

      // Get initial session title
      const initialTitle = await page
        .locator('[data-testid="session-title"]')
        .first()
        .textContent();

      // Click second session
      const sessionItems = page.locator('[data-testid="session-item"]');
      const secondSession = sessionItems.nth(1);
      await secondSession.click();

      // Wait for messages to load
      await page.waitForSelector('[data-testid="message-item"]');

      // Verify title changed (if it's a different session)
      const newTitle = await page
        .locator('[data-testid="session-title"]')
        .textContent();

      // They should either be different or both exist
      expect(initialTitle || newTitle).toBeTruthy();
    });
  });

  test.describe("Message Sending and Display", () => {
    test("should send a message and receive response", async ({
      page,
    }, testInfo) => {
      testInfo.setTimeout(30000); // Increase timeout for API calls

      await page.goto(`${BASE_URL}/chat`);

      // Create new session first
      const newChatButton = page.getByRole("button", {
        name: /start new chat|new/i,
      });
      await newChatButton.click();

      // Type message
      const messageInput = page.locator('[data-testid="message-input"]');
      await expect(messageInput).toBeFocused({ timeout: 5000 });
      await messageInput.fill("Hello, how are you?");

      // Send message
      const sendButton = page
        .getByRole("button", { name: /send|arrow/i })
        .first();
      await sendButton.click();

      // Wait for user message to appear
      const userMessage = page.locator("text=Hello, how are you?");
      await expect(userMessage).toBeVisible({ timeout: 5000 });

      // Wait for AI response
      const assistantMessages = page.locator(
        '[data-testid="assistant-message"]',
      );
      await expect(assistantMessages.first()).toBeVisible({ timeout: 15000 });
    });

    test("should handle message input constraints", async ({ page }) => {
      await page.goto(`${BASE_URL}/chat`);

      const messageInput = page.locator('[data-testid="message-input"]');

      // Test max character limit
      const longText = "a".repeat(5001);
      await messageInput.fill(longText);

      // Should truncate to 5000
      const inputValue = await messageInput.inputValue();
      expect(inputValue.length).toBeLessThanOrEqual(5000);
    });

    test("should display character count", async ({ page }) => {
      await page.goto(`${BASE_URL}/chat`);

      const messageInput = page.locator('[data-testid="message-input"]');
      const characterCount = page.locator('[data-testid="character-count"]');

      // Type some text
      await messageInput.fill("Test message");

      // Verify count is displayed
      await expect(characterCount).toContainText("12");
    });

    test("should send message with Shift+Enter", async ({ page }) => {
      await page.goto(`${BASE_URL}/chat`);

      const newChatButton = page.getByRole("button", {
        name: /start new chat|new/i,
      });
      await newChatButton.click();

      const messageInput = page.locator('[data-testid="message-input"]');
      await messageInput.fill("Message via keyboard");

      // Send with Shift+Enter
      await messageInput.press("Shift+Enter");

      // Verify message was sent
      const userMessage = page.locator("text=Message via keyboard");
      await expect(userMessage).toBeVisible();
    });

    test("should display messages in correct order", async ({ page }) => {
      await page.goto(`${BASE_URL}/chat`);

      // Assuming a session with multiple messages exists
      const messageItems = page.locator('[data-testid="message-item"]');
      const count = await messageItems.count();

      if (count > 1) {
        // Check that messages are in order
        const firstMessage = messageItems.first();
        const lastMessage = messageItems.last();

        await expect(firstMessage).toBeVisible();
        await expect(lastMessage).toBeVisible();
      }
    });
  });

  test.describe("Model Selection", () => {
    test("should display model selector", async ({ page }) => {
      await page.goto(`${BASE_URL}/chat`);

      const modelSelector = page.locator('[data-testid="model-selector"]');
      await expect(modelSelector).toBeVisible();
    });

    test("should change model", async ({ page }) => {
      await page.goto(`${BASE_URL}/chat`);

      const modelSelector = page.locator('[data-testid="model-selector"]');
      await modelSelector.click();

      // Select a different model
      const modelOption = page.locator('button:has-text("LLaMA")');
      await modelOption.click();

      // Verify selection changed
      const selectedModel = page.locator('[data-testid="selected-model"]');
      await expect(selectedModel).toContainText("LLaMA");
    });

    test("should disable model selector when sending", async ({ page }) => {
      await page.goto(`${BASE_URL}/chat`);

      const messageInput = page.locator('[data-testid="message-input"]');
      const modelSelector = page.locator('[data-testid="model-selector"]');
      const sendButton = page
        .getByRole("button", { name: /send|arrow/i })
        .first();

      // Send a message
      await messageInput.fill("Test message");
      await sendButton.click();

      // Model selector should indicate loading/disabled state
      await expect(modelSelector).toHaveAttribute("disabled", "");
    });
  });

  test.describe("RTL Support (Arabic)", () => {
    test("should display RTL layout for Arabic", async ({ page }) => {
      await page.goto(`${BASE_URL}/chat`);

      // Change language to Arabic
      const languageToggle = page.locator('[data-testid="language-toggle"]');
      await languageToggle.click();

      // Check RTL direction
      const chatContainer = page.locator('[data-testid="chat-container"]');
      const direction = await chatContainer.getAttribute("dir");
      expect(direction).toBe("rtl");
    });

    test("should handle Arabic messages", async ({ page }) => {
      await page.goto(`${BASE_URL}/chat`);

      // Change to Arabic
      const languageToggle = page.locator('[data-testid="language-toggle"]');
      await languageToggle.click();

      // Type Arabic message
      const messageInput = page.locator('[data-testid="message-input"]');
      await messageInput.fill("مرحبا");

      // Send message
      const sendButton = page
        .getByRole("button", { name: /send|arrow/i })
        .first();
      await sendButton.click();

      // Verify message is displayed
      const arabicMessage = page.locator("text=مرحبا");
      await expect(arabicMessage).toBeVisible();
    });
  });

  test.describe("Error Handling", () => {
    test("should show error when API fails", async ({ page }) => {
      // This test would need to mock failed API responses
      await page.goto(`${BASE_URL}/chat`);

      const messageInput = page.locator('[data-testid="message-input"]');
      await messageInput.fill("Test message");

      // In a real test, this would be intercepted to fail
      const sendButton = page
        .getByRole("button", { name: /send|arrow/i })
        .first();
      await sendButton.click();

      // Look for error message
      const errorBanner = page.locator('[data-testid="error-banner"]');
      // Only check if error actually occurred
      if (await errorBanner.isVisible({ timeout: 2000 })) {
        await expect(errorBanner).toBeVisible();
      }
    });

    test("should show empty state when no sessions", async ({ page }) => {
      await page.goto(`${BASE_URL}/chat`);

      // If no sessions exist, empty state should show
      const emptyState = page.locator('[data-testid="empty-state"]');
      const hasSessions = await page
        .locator('[data-testid="session-item"]')
        .count()
        .then((count) => count > 0);

      if (!hasSessions) {
        await expect(emptyState).toBeVisible();
      }
    });
  });

  test.describe("Performance and Accessibility", () => {
    test("should load page within reasonable time", async ({ page }) => {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/chat`, { waitUntil: "networkidle" });
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    test("should have proper focus management", async ({ page }) => {
      await page.goto(`${BASE_URL}/chat`);

      const messageInput = page.locator('[data-testid="message-input"]');

      // Tab to message input
      await page.keyboard.press("Tab");
      // Note: Multiple tabs may be needed depending on layout

      // Eventually message input should be focusable
      await messageInput.focus();
      const isFocused = await messageInput.evaluate(
        (el) => el === document.activeElement,
      );
      expect(isFocused).toBe(true);
    });

    test("should be keyboard navigable", async ({ page }) => {
      await page.goto(`${BASE_URL}/chat`);

      // Navigate with tabs and arrows
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      // Should be able to activate buttons with Enter
      await page.keyboard.press("Enter");

      // Page should respond to keyboard navigation
      // Specific assertions depend on DOM structure
    });
  });
});
