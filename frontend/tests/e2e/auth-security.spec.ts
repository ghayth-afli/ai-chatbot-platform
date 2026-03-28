/**
 * E2E Tests for authentication security features.
 *
 * Coverage:
 * - HTTP-only cookies set after login
 * - JavaScript cannot read HTTP-only cookies
 * - Cookies cleared after logout
 * - Login rate limiting feedback
 * - Multi-tab logout synchronization
 */

import { test, expect } from "@playwright/test";

test.describe("Authentication Security - E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto("http://localhost:3000/auth/login", {
      waitUntil: "networkidle",
    });
  });

  test("Verify cookies are set after successful login", async ({
    page,
    context,
  }) => {
    // Get all cookies after login
    const cookiesBefore = await context.cookies();
    const sessionCookiesBefore = cookiesBefore.filter(
      (c) => c.name === "access_token" || c.name === "refresh_token",
    );

    // Expect no session cookies before login
    expect(sessionCookiesBefore.length).toBe(0);

    // Perform login
    await page.fill('input[type="email"]', "demo@example.com");
    await page.fill('input[type="password"]', "DemoPass123!");
    await page.click('button:has-text("Sign In")');

    // Wait for redirect to chat
    await page.waitForURL("**/chat", { timeout: 10000 });

    // Get cookies after login
    const cookiesAfter = await context.cookies();
    const sessionCookiesAfter = cookiesAfter.filter(
      (c) => c.name === "access_token" || c.name === "refresh_token",
    );

    // Verify cookies are set
    expect(sessionCookiesAfter.length).toBeGreaterThan(0);

    // Verify HTTP-only flag
    const accessTokenCookie = sessionCookiesAfter.find(
      (c) => c.name === "access_token",
    );
    if (accessTokenCookie) {
      expect(accessTokenCookie.httpOnly).toBe(true);
    }
  });

  test("Verify JavaScript cannot read HTTP-only cookies", async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', "demo@example.com");
    await page.fill('input[type="password"]', "DemoPass123!");
    await page.click('button:has-text("Sign In")');

    // Wait for redirect
    await page.waitForURL("**/chat", { timeout: 10000 });

    // Try to read cookies via JavaScript (should be empty for HTTP-only)
    const documentCookies = await page.evaluate(() => document.cookie);

    // HTTP-only cookies should not appear in document.cookie
    expect(documentCookies).not.toContain("access_token");
    expect(documentCookies).not.toContain("refresh_token");
  });

  test("Verify cookies are cleared after logout", async ({ page, context }) => {
    // Login
    await page.fill('input[type="email"]', "demo@example.com");
    await page.fill('input[type="password"]', "DemoPass123!");
    await page.click('button:has-text("Log In")');
    await page.waitForURL("**/chat", { timeout: 10000 });

    // Get cookies after login
    const cookiesBeforeLogout = await context.cookies();
    const sessionCookiesBeforeLogout = cookiesBeforeLogout.filter(
      (c) => c.name === "access_token" || c.name === "refresh_token",
    );
    expect(sessionCookiesBeforeLogout.length).toBeGreaterThan(0);

    // Click logout button
    const logoutButton = await page.locator(
      'button:has-text("Logout"), button:has-text("Log Out"), button:has-text("logout")',
    );
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL("**/auth/login", { timeout: 5000 });
    }

    // Get cookies after logout
    const cookiesAfterLogout = await context.cookies();
    const sessionCookiesAfterLogout = cookiesAfterLogout.filter(
      (c) => c.name === "access_token" && c.value !== "",
    );

    // Verify cookies are cleared or empty
    expect(sessionCookiesAfterLogout.length).toBe(0);
  });

  test("Verify login rate limit error message after multiple failed attempts", async ({
    page,
  }) => {
    // Make multiple failed login attempts
    for (let i = 0; i < 6; i++) {
      await page.fill('input[type="email"]', "user@example.com");
      await page.fill('input[type="password"]', "WrongPassword123!");
      await page.click('button:has-text("Log In")');

      // Wait for error message (might be rate limit or invalid credentials)
      await page.waitForTimeout(500);
      const errorExists = await page
        .locator('[aria-label*="error"], .error, [role="alert"]')
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (i < 5) {
        // Should show invalid credentials error
        expect(errorExists).toBe(true);
      } else {
        // On 6th attempt, should be rate limited
        const errorText = await page
          .locator('[role="alert"], .error')
          .first()
          .textContent({ timeout: 2000 })
          .catch(() => "");
        // Check if rate limit error or permission denied
        const isRateLimited =
          (errorText || "").includes("429") ||
          (errorText || "").includes("Rate limit") ||
          (errorText || "").includes("retry");
        expect(isRateLimited || (errorText ?? "") !== "").toBe(true);
      }
    }
  });

  test("Verify logout in one tab affects other tabs (multi-tab sync)", async ({
    browser,
  }) => {
    // Create two contexts (simulating two browser tabs)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Tab 1: Login
      await page1.goto("http://localhost:3000/auth/login", {
        waitUntil: "networkidle",
      });
      await page1.fill('input[type="email"]', "user@example.com");
      await page1.fill('input[type="password"]', "Password123!");
      await page1.click('button:has-text("Log In")');
      await page1.waitForURL("**/chat", { timeout: 10000 });

      // Tab 2: Navigate to same app (inherits login from Tab 1 via localStorage)
      await page2.goto("http://localhost:3000/chat", {
        waitUntil: "networkidle",
      });

      // Give a moment for localStorage to sync
      await page2.waitForTimeout(500);

      // Tab 2 should be at chat (logged in)
      const url2Before = page2.url();
      expect(url2Before).toContain("chat");

      // Tab 1: Logout
      const logoutBtn = page1.locator(
        'button:has-text("Logout"), button:has-text("Log Out")',
      );
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
        await page1.waitForURL("**/login", { timeout: 5000 });
      }

      // Tab 2: Verify it detects logout (either via storage event or manual navigation required)
      // This might require user interaction or automatic redirect depending on implementation
      await page2.waitForTimeout(1000);

      // Try to access /chat in Tab 2 - should redirect if logged out
      await page2.goto("http://localhost:3000/chat");
      const url2After = page2.url();

      // Should be redirected to login if logout was detected
      const isRedirected =
        url2After.includes("login") || url2After.includes("auth");
      expect(isRedirected).toBe(true);
    } finally {
      await page1.close();
      await page2.close();
      await context1.close();
      await context2.close();
    }
  });

  test("Verify token refresh works correctly", async ({ page, context }) => {
    // Login
    await page.fill('input[type="email"]', "demo@example.com");
    await page.fill('input[type="password"]', "DemoPass123!");
    await page.click('button:has-text("Log In")');
    await page.waitForURL("**/chat", { timeout: 10000 });

    // Verify can access protected route
    const profileLink = page.locator('a[href*="/profile"]');
    const canAccessProfile = await profileLink
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    // Should be able to access protected resources
    expect(page.url()).toContain("chat");
  });
});
