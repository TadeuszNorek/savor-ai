import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object Model for App Page (Main Application)
 * Handles interactions with the main application page including
 * user menu, logout, and navigation
 */
export class AppPage extends BasePage {
  readonly userMenuButton: Locator;
  readonly userMenuLogoutItem: Locator;
  readonly userMenuProfileItem: Locator;
  readonly headerLogo: Locator;
  readonly recipesNavLink: Locator;
  readonly generatorNavLink: Locator;

  constructor(page: Page) {
    super(page);

    // Header navigation
    this.headerLogo = page.getByRole('link', { name: /savorai/i });
    this.recipesNavLink = page.getByRole('link', { name: /recipes/i });
    this.generatorNavLink = page.getByRole('link', { name: /generator/i });

    // User menu elements
    this.userMenuButton = page.getByRole('button').filter({ hasText: /@/ });
    this.userMenuProfileItem = page.getByRole('menuitem', { name: /profile/i });
    this.userMenuLogoutItem = page.getByRole('menuitem', { name: /sign out/i });
  }

  /**
   * Navigate to the app page
   */
  async goto() {
    await this.page.goto('/app');
  }

  /**
   * Check if user is authenticated by verifying user menu presence
   */
  async isAuthenticated(): Promise<boolean> {
    return await this.isVisible(this.userMenuButton);
  }

  /**
   * Get the authenticated user's email from the user menu button
   */
  async getUserEmail(): Promise<string | null> {
    if (!(await this.isAuthenticated())) {
      return null;
    }
    return await this.userMenuButton.textContent();
  }

  /**
   * Open the user menu
   */
  async openUserMenu() {
    await this.userMenuButton.click();
    await this.waitForElement(this.userMenuLogoutItem);
  }

  /**
   * Logout from the application
   * Opens user menu and clicks logout
   */
  async logout() {
    await this.openUserMenu();

    // Wait for logout API call
    const logoutPromise = this.page.waitForResponse(
      (response) => response.url().includes('/api/auth/logout') && response.status() === 200
    );

    await this.userMenuLogoutItem.click();
    await logoutPromise;

    // Wait for redirect to login
    await this.waitForNavigation(/\/login/);
  }

  /**
   * Navigate to profile page via user menu
   */
  async goToProfile() {
    await this.openUserMenu();
    await this.userMenuProfileItem.click();
    await this.waitForNavigation(/\/profile/);
  }

  /**
   * Check if the app page has loaded by verifying key elements
   */
  async waitForAppToLoad() {
    await this.waitForLoadState('networkidle');
    await this.waitForElement(this.userMenuButton);
  }

  /**
   * Navigate to recipes section
   */
  async goToRecipes() {
    await this.recipesNavLink.click();
    await this.page.waitForURL(/\/app/);
  }

  /**
   * Navigate to generator section
   */
  async goToGenerator() {
    await this.generatorNavLink.click();
    await this.page.waitForURL(/\/app#generator/);
  }
}
