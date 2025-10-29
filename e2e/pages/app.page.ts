import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object Model for App Page (Main Application)
 * Handles interactions with the main application page including
 * user menu, logout, navigation, and recipe generation
 */
export class AppPage extends BasePage {
  // Header & Navigation
  readonly userMenuButton: Locator;
  readonly userMenuLogoutItem: Locator;
  readonly userMenuProfileItem: Locator;
  readonly headerLogo: Locator;
  readonly recipesNavLink: Locator;
  readonly generatorNavLink: Locator;

  // Tabs
  readonly generatorTab: Locator;
  readonly previewTab: Locator;

  // Generator Panel
  readonly promptInput: Locator;
  readonly generateButton: Locator;
  readonly characterCounter: Locator;
  readonly errorAlert: Locator;
  readonly retryButton: Locator;

  // Preview Panel
  readonly recipeTitle: Locator;
  readonly recipeSummary: Locator;
  readonly recipeCuisine: Locator;
  readonly recipeDescription: Locator;
  readonly saveButton: Locator;
  readonly restoreDraftButton: Locator;
  readonly emptyStateMessage: Locator;

  // Recipe Details
  readonly servingsDecrease: Locator;
  readonly servingsIncrease: Locator;
  readonly ingredientsList: Locator;
  readonly instructionsList: Locator;
  readonly nutritionSection: Locator;

  // Delete Recipe (AlertDialog)
  readonly deleteButton: Locator;
  readonly confirmDialog: Locator;
  readonly confirmDialogTitle: Locator;
  readonly confirmDialogDescription: Locator;
  readonly confirmCancelButton: Locator;
  readonly confirmDeleteButton: Locator;

  // Recipe List (Left Panel)
  readonly searchInput: Locator;
  readonly sortSelect: Locator;
  readonly recipeCards: Locator;
  readonly emptyStateList: Locator;
  readonly loadingSkeletons: Locator;
  readonly loadMoreButton: Locator;
  readonly recipeCountText: Locator;

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

    // Tabs
    this.generatorTab = page.getByRole('tab', { name: /generator/i });
    this.previewTab = page.getByRole('tab', { name: /preview/i });

    // Generator Panel elements
    this.promptInput = page.locator('#recipe-prompt');
    this.generateButton = page.getByRole('button', {
      name: /generate recipe/i,
    });
    this.characterCounter = page.locator('#prompt-counter');
    this.errorAlert = page.locator('[role="alert"]');
    this.retryButton = page.getByRole('button', { name: /try again/i });

    // Preview Panel elements
    this.recipeTitle = page.locator('h1').first();
    this.recipeSummary = page.locator('article p').first();
    this.recipeCuisine = page.locator('article').getByText(/cuisine/i);
    this.recipeDescription = page.locator('article p').nth(1);
    this.saveButton = page.getByRole('button', { name: /save recipe/i });
    this.restoreDraftButton = page.getByRole('button', {
      name: /restore from draft/i,
    });
    this.emptyStateMessage = page.getByText(/no recipe selected/i);

    // Recipe Details elements
    this.servingsDecrease = page.getByRole('button', {
      name: /decrease servings/i,
    });
    this.servingsIncrease = page.getByRole('button', {
      name: /increase servings/i,
    });
    // Ingredients are buttons in list items within article
    this.ingredientsList = page.locator('article').locator('ul').first().locator('li button');
    // Instructions are buttons with "Toggle step" aria-label
    this.instructionsList = page.locator('button[aria-label^="Toggle step"]');
    this.nutritionSection = page.getByRole('heading', { name: /nutrition/i });

    // Delete Recipe elements (AlertDialog)
    this.deleteButton = page.getByRole('button', { name: /delete recipe/i });
    this.confirmDialog = page.getByRole('alertdialog');
    this.confirmDialogTitle = page.getByRole('alertdialog').getByRole('heading', { name: /are you sure/i });
    this.confirmDialogDescription = page.getByRole('alertdialog').locator('[class*="AlertDescription"]').or(page.getByText(/permanently delete/i));
    this.confirmCancelButton = page.getByRole('button', { name: /cancel/i });
    this.confirmDeleteButton = page.getByRole('alertdialog').getByRole('button', { name: /^delete$/i });

    // Recipe List elements (Left Panel)
    this.searchInput = page.getByRole('searchbox');
    this.sortSelect = page.getByRole('combobox', { name: /sort/i });
    this.recipeCards = page.getByRole('button', { name: /recipe card/i }).or(page.locator('[role="button"]').locator('h3'));
    this.emptyStateList = page.getByText(/no recipes found/i);
    this.loadingSkeletons = page.locator('[data-skeleton]');
    this.loadMoreButton = page.getByRole('button', { name: /load more/i });
    this.recipeCountText = page.locator('.sr-only[aria-live="polite"]');
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

  /**
   * Click Generator tab
   */
  async clickGeneratorTab() {
    await this.generatorTab.click();
    await this.promptInput.waitFor({ state: 'visible' });
  }

  /**
   * Click Preview tab
   */
  async clickPreviewTab() {
    await this.previewTab.click();
  }

  /**
   * Generate a recipe with given prompt
   * @param prompt - The recipe prompt/description
   */
  async generateRecipe(prompt: string) {
    // Ensure we're on generator tab
    if (!(await this.promptInput.isVisible())) {
      await this.clickGeneratorTab();
    }

    await this.promptInput.waitFor({ state: 'visible' });
    await this.promptInput.click();
    await this.promptInput.fill(prompt);

    // Wait for API response
    const generatePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/recipes/generate') &&
        (response.status() === 200 || response.status() >= 400)
    );

    await this.generateButton.click();

    // Wait for generation to complete
    await generatePromise;

    // Wait for preview tab to be auto-selected (on success) or error alert (on failure)
    await Promise.race([
      this.recipeTitle.waitFor({ state: 'visible', timeout: 5000 }),
      this.errorAlert.waitFor({ state: 'visible', timeout: 5000 }),
    ]);
  }

  /**
   * Check if generate button is disabled
   */
  async isGenerateButtonDisabled(): Promise<boolean> {
    return await this.generateButton.isDisabled();
  }

  /**
   * Check if generate button is in loading state
   */
  async isGenerating(): Promise<boolean> {
    const loadingButton = this.page.getByRole('button', {
      name: /generating/i,
    });
    return await loadingButton.isVisible();
  }

  /**
   * Get character count text
   */
  async getCharacterCountText(): Promise<string | null> {
    return await this.characterCounter.textContent();
  }

  /**
   * Get error message from alert
   */
  async getErrorMessage(): Promise<string | null> {
    if (!(await this.errorAlert.isVisible())) {
      return null;
    }
    return await this.errorAlert.textContent();
  }

  /**
   * Check if recipe is displayed in preview
   */
  async isRecipeDisplayed(): Promise<boolean> {
    return await this.recipeTitle.isVisible();
  }

  /**
   * Get displayed recipe title
   */
  async getRecipeTitle(): Promise<string | null> {
    if (!(await this.isRecipeDisplayed())) {
      return null;
    }
    return await this.recipeTitle.textContent();
  }

  /**
   * Save the displayed recipe
   */
  async saveRecipe() {
    await this.saveButton.waitFor({ state: 'visible' });

    const savePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/recipes') &&
        response.request().method() === 'POST' &&
        (response.status() === 200 || response.status() === 201)
    );

    await this.saveButton.click();

    await savePromise;

    // Wait for success toast (Sonner renders as list item with data-sonner-toast)
    await this.page
      .locator('[data-sonner-toast]')
      .filter({ hasText: /recipe saved successfully/i })
      .waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Check if save button is disabled
   */
  async isSaveButtonDisabled(): Promise<boolean> {
    return await this.saveButton.isDisabled();
  }

  /**
   * Adjust servings by clicking increase/decrease buttons
   */
  async adjustServings(increase: boolean) {
    const button = increase ? this.servingsIncrease : this.servingsDecrease;
    await button.click();
  }

  /**
   * Get ingredient count
   */
  async getIngredientCount(): Promise<number> {
    return await this.ingredientsList.count();
  }

  /**
   * Get instruction step count
   */
  async getInstructionCount(): Promise<number> {
    return await this.instructionsList.count();
  }

  /**
   * Search for recipes
   */
  async searchRecipes(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
  }

  /**
   * Get recipe cards count
   */
  async getRecipeCardsCount(): Promise<number> {
    return await this.recipeCards.count();
  }

  /**
   * Click on a recipe card by index
   */
  async clickRecipeCard(index: number) {
    await this.recipeCards.nth(index).click();
  }

  /**
   * Check if empty state is visible
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return await this.emptyStateList.isVisible();
  }

  /**
   * Check if loading skeletons are visible
   */
  async areLoadingSkeletonsVisible(): Promise<boolean> {
    const count = await this.loadingSkeletons.count();
    return count > 0;
  }

  /**
   * Get recipe count text (e.g., "Found 5 recipes")
   */
  async getRecipeCountText(): Promise<string | null> {
    return await this.recipeCountText.textContent();
  }

  /**
   * Click Load More button
   */
  async clickLoadMore() {
    await this.loadMoreButton.click();
  }

  /**
   * Delete recipe with confirmation
   */
  async deleteRecipe() {
    // Click delete button to open dialog
    await this.deleteButton.click();
    await this.confirmDialog.waitFor({ state: 'visible' });

    // Wait for delete API call
    const deletePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/recipes/') &&
        response.request().method() === 'DELETE' &&
        (response.status() === 200 || response.status() === 204)
    );

    // Confirm deletion
    await this.confirmDeleteButton.click();

    await deletePromise;

    // Wait for success toast
    await this.page
      .locator('[data-sonner-toast]')
      .filter({ hasText: /recipe deleted successfully/i })
      .waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Cancel recipe deletion
   */
  async cancelDeleteRecipe() {
    // Click delete button to open dialog
    await this.deleteButton.click();
    await this.confirmDialog.waitFor({ state: 'visible' });

    // Click cancel
    await this.confirmCancelButton.click();

    // Dialog should close
    await this.confirmDialog.waitFor({ state: 'hidden' });
  }

  /**
   * Check if delete button is visible
   */
  async isDeleteButtonVisible(): Promise<boolean> {
    return await this.deleteButton.isVisible();
  }

  /**
   * Check if delete button is disabled
   */
  async isDeleteButtonDisabled(): Promise<boolean> {
    return await this.deleteButton.isDisabled();
  }

  /**
   * Get confirmation dialog description text
   */
  async getConfirmDialogDescription(): Promise<string | null> {
    if (!(await this.confirmDialog.isVisible())) {
      return null;
    }
    return await this.confirmDialogDescription.textContent();
  }
}
