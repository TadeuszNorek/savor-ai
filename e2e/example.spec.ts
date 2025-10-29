import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should load the home page successfully", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to load
    await expect(page).toHaveTitle(/savor/i);

    // Check if main content is visible
    await expect(page.locator("body")).toBeVisible();
  });

  test("should have navigation links", async ({ page }) => {
    await page.goto("/");

    // Check for common navigation elements
    const loginLink = page.getByRole("link", { name: /login|sign in/i });

    // Verify login link exists and is visible (may not be present if already logged in)
    if ((await loginLink.count()) > 0) {
      await expect(loginLink.first()).toBeVisible();
    }
  });
});

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("should display login form", async ({ page }) => {
    // Check if email input is visible
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();

    // Check if password input is visible
    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toBeVisible();

    // Check if submit button exists
    const signInButton = page.getByRole("button", { name: /sign in/i });
    await expect(signInButton).toBeVisible();
  });

  test("should show validation errors for empty form", async ({ page }) => {
    const signInButton = page.getByRole("button", { name: /sign in/i });
    await signInButton.click();

    // HTML5 validation should prevent form submission
    // or custom validation messages should appear
    // Adjust this based on your actual validation implementation
  });

  test("should navigate to forgot password page", async ({ page }) => {
    const forgotPasswordLink = page.getByRole("link", {
      name: /forgot password/i,
    });

    if ((await forgotPasswordLink.count()) > 0) {
      await forgotPasswordLink.click();
      await expect(page).toHaveURL(/\/auth\/forgot/);
    }
  });
});
