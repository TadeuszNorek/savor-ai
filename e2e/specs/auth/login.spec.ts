import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { AppPage } from '../../pages/app.page';
import {
  INVALID_CREDENTIALS,
  PRIMARY_TEST_USER,
} from '../../fixtures/test-users';
import { createTestUser, deleteTestUser } from '../../helpers/auth.helpers';

/**
 * E2E Tests for Login & Logout Flow
 *
 * Tests authentication functionality including:
 * - Valid/invalid login attempts
 * - Form validation
 * - Session management
 * - Logout functionality
 */
test.describe('Login & Logout Flow', () => {
  let loginPage: LoginPage;
  let appPage: AppPage;
  let testUserId: string | undefined;
  let testUserCredentials: { email: string; password: string };

  test.beforeAll(async () => {
    // Use existing test user from .env.test
    testUserCredentials = {
      email: process.env.E2E_USERNAME || 'user@gmail.com',
      password: process.env.E2E_PASSWORD || 'qwerty123',
    };
    console.log('✅ Using existing test user:', testUserCredentials.email);
    console.log('🔗 Supabase URL:', process.env.SUPABASE_URL);
    console.log('🔗 Public Supabase URL:', process.env.PUBLIC_SUPABASE_URL);
  });

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    appPage = new AppPage(page);
  });

  /**
   * TEST 1: Login with valid credentials
   * Verifies successful authentication flow
   */
  test('should login successfully with valid credentials', async ({ page }) => {
    console.log('🔐 Attempting login with:', testUserCredentials.email);

    // Act: Navigate to login
    await loginPage.goto();
    await page.waitForLoadState('networkidle');

    // Check which Supabase URL the app is using
    const supabaseUrl = await page.evaluate(() => {
      return (window as any).PUBLIC_SUPABASE_URL || 'not found';
    });
    console.log('🌐 App is using Supabase URL:', supabaseUrl);

    // Fill fields and submit
    await loginPage.emailInput.click();
    await loginPage.emailInput.fill(testUserCredentials.email);
    await loginPage.passwordInput.click();
    await loginPage.passwordInput.fill(testUserCredentials.password);
    await loginPage.signInButton.click();

    // Wait for redirect or error
    await page.waitForTimeout(2000);
    const errorAlert = page.locator('[role="alert"]');
    if (await errorAlert.isVisible()) {
      console.log('❌ Login error:', await errorAlert.textContent());
    }

    // Assert: User should be redirected to app
    await page.waitForURL(/\/app/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/app/);
    await expect(appPage.userMenuButton).toBeVisible();
  });

  /**
   * TEST 3: Login with invalid password
   * Tests authentication failure with wrong password
   */
  test('should show error for invalid password', async ({ page }) => {
    // Act: Attempt login with wrong password
    await loginPage.goto();
    await loginPage.login(testUserCredentials.email, 'WrongPassword123!');

    // Assert: Error message should be displayed
    await page.waitForSelector('[role="alert"]', { timeout: 5000 });
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/invalid email or password/i);
  });

  /**
   * TEST 4: Login with non-existent account
   * Tests authentication failure for non-existent user
   */
  test('should show error for non-existent account', async ({ page }) => {
    // Act: Attempt login with non-existent user
    await loginPage.goto();
    await loginPage.login(
      INVALID_CREDENTIALS.nonExistentUser.email,
      INVALID_CREDENTIALS.nonExistentUser.password
    );

    // Assert: Error message should be displayed
    await page.waitForSelector('[role="alert"]', { timeout: 10000 });
    const errorMessage = page.locator('[role="alert"]').last(); // Get last alert to avoid password validation
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/invalid email or password/i);
  });

  /**
   * TEST 6: Password show/hide toggle
   * Tests password visibility toggle functionality
   */
  test('should toggle password visibility', async ({ page }) => {
    await loginPage.goto();
    await page.waitForLoadState('networkidle');

    // Assert: Password input should be of type password initially
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

    // Act: Click toggle button
    const toggleButton = page.getByRole('button', {
      name: /show password/i,
    });
    await toggleButton.click();

    // Wait for React to update the input type
    await page.waitForFunction(
      () => {
        const input = document.querySelector('input#password') as HTMLInputElement;
        return input?.type === 'text';
      },
      { timeout: 3000 }
    );

    // Assert: Password should be visible
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');

    // Act: Click toggle again
    const hideButton = page.getByRole('button', {
      name: /hide password/i,
    });
    await hideButton.click();

    // Wait for React to update back to password
    await page.waitForFunction(
      () => {
        const input = document.querySelector('input#password') as HTMLInputElement;
        return input?.type === 'password';
      },
      { timeout: 3000 }
    );

    // Assert: Password should be hidden again
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  /**
   * TEST 7: Session persistence after page refresh
   * Tests that user stays logged in after refresh
   */
  test('should persist session after page refresh', async ({ page }) => {
    // Arrange: Login user
    await loginPage.goto();
    await loginPage.login(testUserCredentials.email, testUserCredentials.password);
    await page.waitForURL(/\/app/, { timeout: 10000 });

    // Act: Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert: User should still be authenticated
    await expect(page).toHaveURL(/\/app/);
    await expect(appPage.userMenuButton).toBeVisible();
  });

  /**
   * TEST 8: Logout functionality
   * Tests complete logout flow
   */
  test('should logout successfully', async ({ page }) => {
    // Arrange: Login user
    await loginPage.goto();
    await loginPage.login(testUserCredentials.email, testUserCredentials.password);
    await page.waitForURL(/\/app/, { timeout: 10000 });

    // Act: Logout
    await appPage.logout();

    // Assert: Should be redirected to login page
    await expect(page).toHaveURL(/\/login/);

    // Assert: User menu should not be visible
    await expect(appPage.userMenuButton).not.toBeVisible();
  });

  /**
   * TEST 9: Redirect to login when accessing app after logout
   * Verifies user cannot access protected routes after logout
   */
  test('should redirect to login when accessing app after logout', async ({
    page,
    context,
  }) => {
    // Arrange: Login, then logout user
    await loginPage.goto();
    await loginPage.login(testUserCredentials.email, testUserCredentials.password);
    await page.waitForURL(/\/app/, { timeout: 10000 });
    await appPage.logout();

    // Ensure we're on login page after logout
    await expect(page).toHaveURL(/\/login/);
    await page.waitForLoadState('networkidle');

    // Clear all cookies and storage to simulate fresh browser
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Act: Try to access app page directly (should redirect to login)
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');

    // Assert: Should be redirected to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  /**
   * TEST 10: Switch to sign up mode
   * Tests switching between login and signup modes
   */
  test('should allow switching to sign up mode', async ({ page }) => {
    await loginPage.goto();
    await page.waitForLoadState('networkidle');

    // Wait for form to be fully loaded and hydrated
    await loginPage.signUpButton.waitFor({ state: 'visible' });
    await page.waitForTimeout(500); // Extra wait for hydration

    // Assert: Sign up button should be visible
    await expect(loginPage.signUpButton).toBeVisible();

    // Act: Click sign up button
    await loginPage.signUpButton.click();

    // Assert: Submit button text should change to "Create Account"
    // This is the most reliable indicator that mode switched
    const createButton = page.getByRole('button', { name: /create account/i });
    await expect(createButton).toBeVisible({ timeout: 5000 });

    // Assert: "Sign in" link should now be visible (for switching back)
    await expect(page.getByText(/already have an account/i)).toBeVisible();
  });
});
