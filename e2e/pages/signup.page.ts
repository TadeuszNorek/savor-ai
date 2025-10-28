import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for Signup Page
 * This class encapsulates the signup form elements and actions
 *
 * Note: Signup uses the same AuthForm component as login,
 * but in "register" mode
 */
export class SignupPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly createAccountButton: Locator;
  readonly signInButton: Locator;
  readonly formElement: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole('textbox', { name: /email/i });
    this.passwordInput = page.locator('input#password');
    this.createAccountButton = page.getByRole('button', { name: /create account/i });
    this.signInButton = page.getByRole('button', { name: /sign in/i });
    this.formElement = page.getByRole('form', { name: /registration form/i });
  }

  /**
   * Navigate to login page and switch to signup mode
   */
  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');

    // Switch to signup mode by clicking "Sign up" link
    const signUpLink = this.page.getByRole('button', { name: /sign up/i });
    await signUpLink.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(500); // Wait for hydration
    await signUpLink.click();

    // Wait for mode to switch
    await this.createAccountButton.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Fill signup form and submit
   */
  async signup(email: string, password: string) {
    // Wait for form to be ready and hydrated
    await this.page.waitForLoadState('networkidle');
    await this.emailInput.waitFor({ state: 'visible' });
    await this.passwordInput.waitFor({ state: 'visible' });

    // Fill form fields - use click first to ensure focus
    await this.emailInput.click();
    await this.emailInput.fill(email);

    await this.passwordInput.click();
    await this.passwordInput.fill(password);

    // Submit form
    await this.createAccountButton.click();
  }

  /**
   * Wait for navigation to app after successful signup
   */
  async waitForNavigation() {
    await this.page.waitForURL(/\/app/, { timeout: 10000 });
  }

  /**
   * Get error alert element
   */
  getErrorAlert() {
    return this.page.locator('[role="alert"]');
  }

  /**
   * Get specific error message by field
   */
  getFieldError(fieldName: 'email' | 'password') {
    // Field errors appear next to inputs
    const fieldId = fieldName === 'email' ? 'email' : 'password';
    return this.page.locator(`#${fieldId}-error`);
  }

  /**
   * Switch back to login mode
   */
  async switchToLogin() {
    await this.signInButton.click();
    // Wait for mode to switch - the "Sign In" submit button should appear
    const signInSubmitButton = this.page.getByRole('button', { name: /^sign in$/i });
    await signInSubmitButton.waitFor({ state: 'visible', timeout: 5000 });
  }
}
