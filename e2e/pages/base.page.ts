import { type Page, type Locator } from "@playwright/test";

/**
 * Base Page Object Model class
 * Provides common functionality for all page objects
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string) {
    await this.page.goto(path);
  }

  /**
   * Wait for navigation to a specific URL pattern
   */
  async waitForNavigation(urlPattern: string | RegExp) {
    await this.page.waitForURL(urlPattern);
  }

  /**
   * Wait for the page to reach a specific load state
   */
  async waitForLoadState(state: "load" | "domcontentloaded" | "networkidle" = "load") {
    await this.page.waitForLoadState(state);
  }

  /**
   * Wait for an element to be visible
   */
  async waitForElement(locator: Locator, timeout?: number) {
    await locator.waitFor({ state: "visible", timeout });
  }

  /**
   * Wait for an element to be hidden
   */
  async waitForElementHidden(locator: Locator, timeout?: number) {
    await locator.waitFor({ state: "hidden", timeout });
  }

  /**
   * Get error message from the page
   * Looks for common error display patterns
   */
  async getErrorMessage(): Promise<string | null> {
    // Try multiple common error selectors
    const errorSelectors = ['[role="alert"]', '[data-testid="error-message"]', ".error-message", ".alert-error"];

    for (const selector of errorSelectors) {
      const errorElement = this.page.locator(selector).first();
      if (await errorElement.isVisible()) {
        return await errorElement.textContent();
      }
    }

    return null;
  }

  /**
   * Get success message from the page
   */
  async getSuccessMessage(): Promise<string | null> {
    const successSelectors = [
      '[role="status"]',
      '[data-testid="success-message"]',
      ".success-message",
      ".alert-success",
    ];

    for (const selector of successSelectors) {
      const successElement = this.page.locator(selector).first();
      if (await successElement.isVisible()) {
        return await successElement.textContent();
      }
    }

    return null;
  }

  /**
   * Take a screenshot with a custom name
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Check if element is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    try {
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Fill input field with text
   */
  async fill(locator: Locator, text: string) {
    await locator.fill(text);
  }

  /**
   * Click on an element with optional delay
   */
  async click(locator: Locator, options?: { delay?: number }) {
    await locator.click(options);
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Reload the current page
   */
  async reload() {
    await this.page.reload();
  }

  /**
   * Go back in browser history
   */
  async goBack() {
    await this.page.goBack();
  }

  /**
   * Wait for a specific timeout
   * Use sparingly - prefer specific wait conditions
   */
  async wait(ms: number) {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Get element by test ID
   * Follows data-testid convention
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Get element by role
   */
  getByRole(
    role: "button" | "link" | "textbox" | "heading" | "img" | "checkbox" | "radio" | "alert" | "status",
    options?: { name?: string | RegExp }
  ): Locator {
    return this.page.getByRole(role, options);
  }

  /**
   * Get element by label text
   */
  getByLabel(text: string | RegExp): Locator {
    return this.page.getByLabel(text);
  }

  /**
   * Get element by text content
   */
  getByText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  /**
   * Get element by placeholder
   */
  getByPlaceholder(text: string | RegExp): Locator {
    return this.page.getByPlaceholder(text);
  }

  /**
   * Check if page has specific URL
   */
  async hasUrl(url: string | RegExp): Promise<boolean> {
    const currentUrl = this.getCurrentUrl();
    if (typeof url === "string") {
      return currentUrl.includes(url);
    }
    return url.test(currentUrl);
  }

  /**
   * Wait for API response
   */
  async waitForResponse(urlPattern: string | RegExp, timeout?: number) {
    return await this.page.waitForResponse(urlPattern, { timeout });
  }

  /**
   * Wait for API request
   */
  async waitForRequest(urlPattern: string | RegExp, timeout?: number) {
    return await this.page.waitForRequest(urlPattern, { timeout });
  }
}
