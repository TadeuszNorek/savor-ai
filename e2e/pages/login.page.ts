import { type Page, type Locator } from "@playwright/test";

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
    this.emailInput = page.getByRole("textbox", { name: /email/i });
    this.passwordInput = page.locator("input#password");
    this.signInButton = page.getByRole("button", { name: /sign in/i });
    this.signUpButton = page.getByRole("button", { name: /sign up/i });
    this.forgotPasswordLink = page.getByRole("link", {
      name: /forgot password/i,
    });
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    // Wait for form to be ready and hydrated
    await this.page.waitForLoadState("networkidle");
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });

    // Fill form fields - use click first to ensure focus
    await this.emailInput.click();
    await this.emailInput.fill(email);

    await this.passwordInput.click();
    await this.passwordInput.fill(password);

    // Submit form
    await this.signInButton.click();
  }

  async waitForNavigation() {
    await this.page.waitForURL(/\/app/);
  }
}
