import { test, expect } from "@playwright/test";
import { ForgotPasswordPage } from "../../pages/forgot-password.page";
import { ResetPasswordPage } from "../../pages/reset-password.page";
import { INVALID_CREDENTIALS, PRIMARY_TEST_USER } from "../../fixtures/test-users";

/**
 * E2E Tests for Password Reset Flow
 *
 * Tests password reset functionality including:
 * - Forgot password request
 * - Email validation
 * - Reset password with valid/invalid links
 * - Password validation
 */
test.describe("Password Reset Flow", () => {
  let forgotPasswordPage: ForgotPasswordPage;
  let resetPasswordPage: ResetPasswordPage;

  test.beforeEach(async ({ page }) => {
    forgotPasswordPage = new ForgotPasswordPage(page);
    resetPasswordPage = new ResetPasswordPage(page);
  });

  /**
   * TEST 1: Request password reset with valid email
   * Verifies UI flow for requesting password reset
   */
  test("should show success message after requesting password reset", async ({ page }) => {
    // Arrange: Navigate to forgot password page
    await forgotPasswordPage.goto();

    // Act: Request password reset with valid email
    await forgotPasswordPage.requestReset(PRIMARY_TEST_USER.email);

    // Assert: Should show success message
    await expect(forgotPasswordPage.getSuccessTitle()).toBeVisible({
      timeout: 5000,
    });
    await expect(forgotPasswordPage.getSuccessDescription()).toBeVisible();

    // Assert: Should show the email address in success message
    await expect(page.getByText(PRIMARY_TEST_USER.email)).toBeVisible();
  });

  /**
   * TEST 2: Invalid email format error
   * Tests form validation for invalid email
   */
  test("should show error for invalid email format", async ({ page }) => {
    // Arrange: Navigate to forgot password page
    await forgotPasswordPage.goto();

    // Act: Try to request reset with invalid email
    await forgotPasswordPage.emailInput.click();
    await forgotPasswordPage.emailInput.fill(INVALID_CREDENTIALS.invalidEmail.email);

    // Trigger validation
    await forgotPasswordPage.emailInput.blur();
    await page.waitForTimeout(500);

    // Assert: Submit button should be disabled
    await expect(forgotPasswordPage.sendButton).toBeDisabled();

    // Try to submit
    await forgotPasswordPage.sendButton.click({ force: true });

    // Assert: Should still be on forgot password page
    await expect(page).toHaveURL(/\/auth\/forgot/);
  });

  /**
   * TEST 3: Empty email error
   * Tests that form validates required field
   */
  test("should not allow submission with empty email", async ({ page }) => {
    // Arrange: Navigate to forgot password page
    await forgotPasswordPage.goto();

    // Act: Try to submit without filling email
    await forgotPasswordPage.sendButton.click({ force: true });

    // Assert: Should still be on forgot password page
    await expect(page).toHaveURL(/\/auth\/forgot/);

    // Assert: Submit button should be disabled
    await expect(forgotPasswordPage.sendButton).toBeDisabled();
  });

  /**
   * TEST 4: Back to login link
   * Tests navigation back to login page
   */
  test("should navigate back to login from forgot password page", async ({ page }) => {
    // Arrange: Navigate to forgot password page
    await forgotPasswordPage.goto();

    // Act: Click back to login link
    await forgotPasswordPage.clickBackToLogin();

    // Assert: Should navigate to login page
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TEST 5: Expired/invalid reset link
   * Tests that expired links show appropriate error
   */
  test("should show error for invalid reset link", async ({ page }) => {
    // Arrange: Navigate to reset password page without valid token
    await resetPasswordPage.goto();

    // Wait for page to load and check session
    await page.waitForTimeout(2000);

    // Assert: Should show expired link message
    await expect(resetPasswordPage.getExpiredLinkTitle()).toBeVisible({
      timeout: 5000,
    });
    await expect(resetPasswordPage.errorAlert).toBeVisible();

    // Assert: Should show "Request New Reset Link" button
    await expect(resetPasswordPage.requestNewLinkButton).toBeVisible();
  });

  /**
   * TEST 6: Request new link from expired page
   * Tests navigation from expired link to forgot password
   */
  test("should navigate to forgot password from expired link page", async ({ page }) => {
    // Arrange: Navigate to reset password page without valid token
    await resetPasswordPage.goto();
    await page.waitForTimeout(2000);

    // Act: Click "Request New Reset Link"
    await resetPasswordPage.clickRequestNewLink();

    // Assert: Should navigate to forgot password page
    await expect(page).toHaveURL(/\/auth\/forgot/);
  });

  /**
   * TEST 7: Password validation on reset form
   * NOTE: Skipped - requires valid password recovery session which needs email confirmation
   */
  test.skip("should validate password strength on reset form", async () => {
    // This test requires a valid password recovery token from email
    // Skip for now as it's not feasible in E2E without email access
  });

  /**
   * TEST 8: Successful password reset
   * NOTE: Skipped - requires valid password recovery session which needs email confirmation
   */
  test.skip("should successfully reset password and redirect to login", async () => {
    // This test requires a valid password recovery token from email
    // Skip for now as it's not feasible in E2E without email access
  });
});
