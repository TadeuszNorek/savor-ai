import { test, expect } from "@playwright/test";
import { SignupPage } from "../../pages/signup.page";
import { AppPage } from "../../pages/app.page";
import { INVALID_CREDENTIALS, generateTestUser, getUniqueTestEmail } from "../../fixtures/test-users";
import { createTestUser, deleteTestUser } from "../../helpers/auth.helpers";

/**
 * E2E Tests for Signup Flow
 *
 * Tests user registration functionality including:
 * - Valid/invalid signup attempts
 * - Form validation
 * - Email uniqueness
 * - Session creation after signup
 */
test.describe("Signup Flow", () => {
  let signupPage: SignupPage;
  let appPage: AppPage;
  let createdUserIds: string[] = [];

  test.beforeEach(async ({ page }) => {
    signupPage = new SignupPage(page);
    appPage = new AppPage(page);
  });

  test.afterEach(async () => {
    // Cleanup: Delete any users created during tests
    for (const userId of createdUserIds) {
      try {
        await deleteTestUser(userId);
      } catch {
        /* Ignore */
      }
    }
    createdUserIds = [];
  });

  /**
   * TEST 1: Sign up with valid data
   * Verifies successful registration flow
   * - User can sign up with valid email and password
   * - Redirected to /app after signup
   * - Session is created
   *
   * NOTE: Skipped - signup requires email confirmation in Supabase test environment.
   * This would require either:
   * 1. Disabling email confirmation in Supabase settings
   * 2. Implementing email verification flow in tests
   * 3. Using API to bypass email confirmation
   */
  test.skip("should sign up successfully with valid credentials", async ({ page }) => {
    // Use real-looking email domain
    const timestamp = Date.now();
    const testUser = {
      email: `e2etest${timestamp}@gmail.com`,
      password: "TestPassword123!",
    };

    // Arrange: Navigate to signup
    await signupPage.goto();

    // Act: Use signup() method which has proper waiting
    await signupPage.signup(testUser.email, testUser.password);

    // Assert: Should redirect to /app
    await page.waitForURL(/\/app/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/app/);

    // Assert: User menu should be visible (user is authenticated)
    await expect(appPage.userMenuButton).toBeVisible({ timeout: 5000 });
  });

  /**
   * TEST 2: Invalid email format error
   * Tests form validation for invalid email format
   */
  test("should show error for invalid email format", async ({ page }) => {
    // Arrange: Navigate to signup
    await signupPage.goto();

    // Act: Fill form with invalid email
    await signupPage.emailInput.click();
    await signupPage.emailInput.fill(INVALID_CREDENTIALS.invalidEmail.email);

    await signupPage.passwordInput.click();
    await signupPage.passwordInput.fill(INVALID_CREDENTIALS.invalidEmail.password);

    // Trigger validation by blurring password field
    await signupPage.passwordInput.blur();
    await page.waitForTimeout(500);

    // Assert: Should still be on login page (not redirected)
    await expect(page).toHaveURL(/\/login/);

    // Assert: Submit button should be disabled due to invalid email
    const createButton = signupPage.createAccountButton;
    await expect(createButton).toBeDisabled();
  });

  /**
   * TEST 3: Weak password error
   * Tests form validation for password that's too short
   */
  test("should show error for weak password (less than 8 characters)", async ({ page }) => {
    const testEmail = getUniqueTestEmail("weak-password");

    // Arrange: Navigate to signup
    await signupPage.goto();

    // Act: Fill form with weak password
    await signupPage.emailInput.click();
    await signupPage.emailInput.fill(testEmail);

    await signupPage.passwordInput.click();
    await signupPage.passwordInput.fill(INVALID_CREDENTIALS.shortPassword.password);

    // Trigger validation by blurring password field
    await signupPage.passwordInput.blur();
    await page.waitForTimeout(500);

    // Assert: Should still be on login page (not redirected)
    await expect(page).toHaveURL(/\/login/);

    // Assert: Submit button should be disabled due to weak password
    const createButton = signupPage.createAccountButton;
    await expect(createButton).toBeDisabled();
  });

  /**
   * TEST 4: Existing email error
   * Tests that signup fails when email already exists
   */
  test("should show error when email already exists", async ({ page }) => {
    // Arrange: Create a test user first
    const existingUser = generateTestUser();
    const createdUser = await createTestUser(existingUser);
    expect(createdUser.id).toBeDefined();
    createdUserIds.push(createdUser.id as string);

    // Navigate to signup
    await signupPage.goto();

    // Act: Try to sign up with the same email
    await signupPage.emailInput.click();
    await signupPage.emailInput.fill(existingUser.email);
    await signupPage.passwordInput.click();
    await signupPage.passwordInput.fill(existingUser.password);
    await signupPage.createAccountButton.click();

    // Assert: Error message should be displayed
    await page.waitForSelector('[role="alert"]', { timeout: 5000 });
    const errorMessage = signupPage.getErrorAlert();
    await expect(errorMessage).toBeVisible();

    // Supabase may return different errors: "User already registered", "Session error", etc.
    await expect(errorMessage).toContainText(/already registered|already exists|session error/i);

    // Assert: Should still be on login page (not redirected)
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TEST 5: Form disabled during submission
   * Tests that form is disabled while signup request is in progress
   */
  test("should disable form during submission", async ({ page }) => {
    const testUser = generateTestUser();

    // Arrange: Navigate to signup
    await signupPage.goto();

    // Act: Fill form
    await signupPage.emailInput.fill(testUser.email);
    await signupPage.passwordInput.fill(testUser.password);

    // Click submit and immediately check if button is disabled
    const submitPromise = signupPage.createAccountButton.click();

    // Assert: Button text should change to "Processing..."
    await expect(signupPage.createAccountButton).toContainText(/processing/i, {
      timeout: 2000,
    });

    // Assert: Form fields should be disabled during submission
    await expect(signupPage.emailInput).toBeDisabled();
    await expect(signupPage.passwordInput).toBeDisabled();

    // Wait for submission to complete
    await submitPromise;
    await page.waitForTimeout(2000);
  });

  /**
   * TEST 6: Switch to login form
   * Tests switching from signup to login mode
   */
  test("should allow switching to login form", async ({ page }) => {
    // Arrange: Navigate to signup
    await signupPage.goto();

    // Assert: Should be in signup mode
    await expect(signupPage.createAccountButton).toBeVisible();
    await expect(page.getByText(/already have an account/i)).toBeVisible();

    // Act: Click "Sign in" link to switch to login
    await signupPage.switchToLogin();

    // Assert: Should switch to login mode
    // The submit button should now say "Sign In" instead of "Create Account"
    const signInButton = page.getByRole("button", { name: /^sign in$/i });
    await expect(signInButton).toBeVisible({ timeout: 5000 });

    // Assert: "Sign up" link should now be visible (for switching back)
    await expect(page.getByText(/don't have an account/i)).toBeVisible();
  });

  /**
   * TEST 7: Session persistence after signup
   * Tests that session persists after page refresh
   *
   * NOTE: Skipped - depends on TEST 1 (successful signup) which is blocked by
   * Supabase email confirmation requirements in test environment.
   */
  test.skip("should persist session after signup and refresh", async ({ page }) => {
    // Use real-looking email domain
    const timestamp = Date.now();
    const testUser = {
      email: `session${timestamp}@gmail.com`,
      password: "TestPassword123!",
    };

    // Arrange: Navigate to signup and complete signup
    await signupPage.goto();
    await signupPage.signup(testUser.email, testUser.password);
    await signupPage.waitForNavigation();

    // Assert: Should be on /app page
    await expect(page).toHaveURL(/\/app/);

    // Act: Refresh the page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Assert: Should still be authenticated
    await expect(page).toHaveURL(/\/app/);
    await expect(appPage.userMenuButton).toBeVisible({ timeout: 5000 });
  });

  /**
   * TEST 8: Empty fields validation
   * Tests that form validates required fields
   */
  test("should not allow submission with empty fields", async ({ page }) => {
    // Arrange: Navigate to signup
    await signupPage.goto();

    // Act: Try to submit without filling any fields
    await signupPage.createAccountButton.click();
    await page.waitForTimeout(500);

    // Assert: Should still be on login page
    await expect(page).toHaveURL(/\/login/);

    // Assert: Submit button should be disabled (form is invalid)
    const createButton = signupPage.createAccountButton;
    const isDisabled = await createButton.isDisabled();
    expect(isDisabled).toBe(true);
  });
});
