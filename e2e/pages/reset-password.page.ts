import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for Reset Password Page
 * This class encapsulates the reset password page elements and actions
 */
export class ResetPasswordPage {
  readonly page: Page;
  readonly passwordInput: Locator;
  readonly updateButton: Locator;
  readonly backToLoginLink: Locator;
  readonly successMessage: Locator;
  readonly errorAlert: Locator;
  readonly expiredLinkMessage: Locator;
  readonly requestNewLinkButton: Locator;
  readonly formElement: Locator;

  constructor(page: Page) {
    this.page = page;
    this.passwordInput = page.locator('input#password');
    this.updateButton = page.getByRole('button', {
      name: /update password/i,
    });
    this.backToLoginLink = page.getByRole('link', { name: /sign in/i });
    this.successMessage = page.getByText(/password updated/i);
    this.errorAlert = page.locator('[role="alert"]');
    this.expiredLinkMessage = page.getByText(/reset link expired/i);
    this.requestNewLinkButton = page.getByRole('link', {
      name: /request new reset link/i,
    });
    this.formElement = page.getByRole('form', {
      name: /reset password form/i,
    });
  }

  /**
   * Navigate to reset password page
   * NOTE: This page requires a valid password recovery token in URL
   */
  async goto(token?: string) {
    const url = token ? `/auth/reset?token=${token}` : '/auth/reset';
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Set new password
   */
  async resetPassword(newPassword: string) {
    await this.passwordInput.waitFor({ state: 'visible' });

    await this.passwordInput.click();
    await this.passwordInput.fill(newPassword);

    await this.updateButton.click();
  }

  /**
   * Get success card title
   */
  getSuccessTitle() {
    return this.page.getByRole('heading', { name: /password updated/i });
  }

  /**
   * Get success description
   */
  getSuccessDescription() {
    return this.page.getByText(/you can now sign in with your new password/i);
  }

  /**
   * Get expired link title
   */
  getExpiredLinkTitle() {
    return this.page.getByText('Reset link expired', { exact: true });
  }

  /**
   * Click back to sign in link
   */
  async clickBackToLogin() {
    await this.backToLoginLink.click();
  }

  /**
   * Click request new link button
   */
  async clickRequestNewLink() {
    await this.requestNewLinkButton.click();
  }

  /**
   * Check if page shows loading state
   */
  async isLoading() {
    const loadingText = this.page.getByText(/verifying reset link/i);
    return await loadingText.isVisible();
  }
}
