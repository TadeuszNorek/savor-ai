import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for Login Page
 * This class encapsulates the login page elements and actions
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly signUpButton: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.signInButton = page.getByRole('button', { name: /sign in/i });
    this.signUpButton = page.getByRole('button', { name: /sign up/i });
    this.forgotPasswordLink = page.getByRole('link', {
      name: /forgot password/i,
    });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async waitForNavigation() {
    await this.page.waitForURL(/\/app/);
  }
}
