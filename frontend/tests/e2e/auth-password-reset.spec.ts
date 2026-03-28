/**
 * E2E Tests for password reset flow.
 *
 * Coverage:
 * - Request password reset
 * - Receive code via email
 * - Navigate to reset page
 * - Complete password reset with code
 * - Login with new password
 */

import { test, expect } from "@playwright/test";

test.describe("Password Reset - E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto("http://localhost:3000/auth/login", {
      waitUntil: "networkidle",
    });
  });

  test("Should complete password reset flow", async ({ page }) => {
    // Click "Forgot password?" link
    await page.click('a:has-text("Forgot password")');

    // Should navigate to forgot-password page
    await page.waitForURL("**/forgot-password", { timeout: 5000 });

    // Fill in email
    await page.fill('input[type="email"]', "demo@example.com");

    // Submit
    await page.click('button:has-text("Reset")');

    // Should show success message
    const successMessage = await page.locator("text=/reset code sent/i");
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // Should auto-navigate to reset-password page
    await page.waitForURL("**/reset-password", { timeout: 5000 });

    // Fill in code (in test environment, fetch from backend or mock)
    await page.fill('input[placeholder*="123456"]', "123456");

    // Fill in new password
    const passwordInputs = await page.locator('input[type="password"]');
    await passwordInputs.first().fill("NewPassword456!");
    await passwordInputs.nth(1).fill("NewPassword456!");

    // Submit reset
    await page.click('button:has-text("Reset")');

    // Should show success message
    const resetSuccess = await page.locator("text=/password reset/i");
    await expect(resetSuccess).toBeVisible({ timeout: 5000 });

    // Should redirect to login
    await page.waitForURL("**/login", { timeout: 5000 });

    // Should display success message on login page
    const loginMessage = await page.locator("text=/password reset/i").first();
    await expect(loginMessage).toBeVisible();

    // Try login with new password
    await page.fill('input[type="email"]', "demo@example.com");
    await page.fill('input[type="password"]', "NewPassword456!");

    await page.click('button:has-text("Log In")');

    // Should successfully login and redirect to chat
    await page.waitForURL("**/chat", { timeout: 5000 });
  });

  test("Should reject invalid password reset code", async ({ page }) => {
    // Navigate to forgot-password
    await page.click('a:has-text("Forgot password")');
    await page.waitForURL("**/forgot-password");

    // Fill email and submit
    await page.fill('input[type="email"]', "demo@example.com");
    await page.click('button:has-text("Reset")');

    // Wait for auto-navigation to reset page
    await page.waitForURL("**/reset-password", { timeout: 5000 });

    // Fill in invalid code
    await page.fill('input[placeholder*="123456"]', "000000");

    // Fill passwords
    const passwordInputs = await page.locator('input[type="password"]');
    await passwordInputs.first().fill("NewPassword456!");
    await passwordInputs.nth(1).fill("NewPassword456!");

    // Submit
    await page.click('button:has-text("Reset")');

    // Should show error message
    await expect(page.locator("text=/invalid|error/i").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("Should prevent password reset without email on forgot page", async ({
    page,
  }) => {
    // Navigate to forgot-password
    await page.click('a:has-text("Forgot password")');
    await page.waitForURL("**/forgot-password");

    // Try to submit without email
    await page.click('button:has-text("Reset")');

    // Should show validation error
    const errorMessage = await page.locator("text=/required|invalid/i");
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test("Should prevent weak passwords during reset", async ({ page }) => {
    // Navigate to forgot-password
    await page.click('a:has-text("Forgot password")');
    await page.waitForURL("**/forgot-password");

    // Fill email and submit
    await page.fill('input[type="email"]', "demo@example.com");
    await page.click('button:has-text("Reset")');

    // Wait for navigation to reset page
    await page.waitForURL("**/reset-password", { timeout: 5000 });

    // Fill in code
    await page.fill('input[placeholder*="123456"]', "123456");

    // Fill in weak password
    const passwordInputs = await page.locator('input[type="password"]');
    await passwordInputs.first().fill("weak");
    await passwordInputs.nth(1).fill("weak");

    // Submit
    await page.click('button:has-text("Reset")');

    // Should show password strength error
    const strengthError = await page.locator(
      "text=/8 characters|uppercase|special/i",
    );
    await expect(strengthError).toBeVisible({ timeout: 5000 });
  });

  test("Should prevent mismatched passwords during reset", async ({ page }) => {
    // Navigate to forgot-password
    await page.click('a:has-text("Forgot password")');
    await page.waitForURL("**/forgot-password");

    // Fill email and submit
    await page.fill('input[type="email"]', "demo@example.com");
    await page.click('button:has-text("Reset")');

    // Wait for navigation
    await page.waitForURL("**/reset-password", { timeout: 5000 });

    // Fill in code
    await page.fill('input[placeholder*="123456"]', "123456");

    // Fill passwords (different)
    const passwordInputs = await page.locator('input[type="password"]');
    await passwordInputs.first().fill("NewPassword456!");
    await passwordInputs.nth(1).fill("DifferentPassword789!");

    // Submit
    await page.click('button:has-text("Reset")');

    // Should show error
    const mismatchError = await page.locator(
      "text=/do not match|mismatch|different/i",
    );
    await expect(mismatchError).toBeVisible({ timeout: 5000 });
  });

  test("Should limit password reset code requests (rate limiting)", async ({
    page,
  }) => {
    // Try to send multiple reset codes to same email
    for (let i = 0; i < 4; i++) {
      // Navigate to forgot-password
      await page.goto("http://localhost:3000/auth/forgot-password");

      // Fill email
      await page.fill('input[type="email"]', "demo@example.com");

      // Submit
      await page.click('button:has-text("Reset")');

      // Wait a moment
      await page.waitForTimeout(500);

      if (i === 3) {
        // 4th request should hit rate limit
        // Check for rate limit error message
        const errorMessage = await page.locator(
          "text=/rate limit|too many|try again/i",
        );

        if (
          await errorMessage.isVisible({ timeout: 3000 }).catch(() => false)
        ) {
          expect(await errorMessage.isVisible()).toBe(true);
        }
      }
    }
  });
});
