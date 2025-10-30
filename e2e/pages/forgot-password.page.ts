import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for Forgot Password Page
 * This class encapsulates the forgot password page elements and actions
 */
export class ForgotPasswordPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly sendButton: Locator;
  readonly backToLoginLink: Locator;
  readonly successMessage: Locator;
  readonly errorAlert: Locator;
  readonly formElement: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole("textbox", { name: /email/i });
    this.sendButton = page.getByRole("button", {
      name: /send reset instructions/i,
    });
    this.backToLoginLink = page.getByRole("link", { name: /sign in/i });
    this.successMessage = page.getByText(/check your email/i);
    this.errorAlert = page.locator('[role="alert"]');
    this.formElement = page.getByRole("form", {
      name: /forgot password form/i,
    });
  }

  /**
   * Navigate to forgot password page
   */
  async goto() {
    await this.page.goto("/auth/forgot");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Request password reset for given email
   */
  async requestReset(email: string) {
    await this.emailInput.waitFor({ state: "visible" });

    await this.emailInput.click();
    await this.emailInput.fill(email);

    await this.sendButton.click();
  }

  /**
   * Get success card title
   */
  getSuccessTitle() {
    return this.page.getByText("Check your email", { exact: true });
  }

  /**
   * Get success message text
   */
  getSuccessDescription() {
    return this.page.getByText(/we've sent password reset instructions/i);
  }

  /**
   * Click back to sign in link
   */
  async clickBackToLogin() {
    await this.backToLoginLink.click();
  }
}
