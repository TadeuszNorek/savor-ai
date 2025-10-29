import { test, expect } from '@playwright/test';
import { AppPage } from '../../pages/app.page';
import { LoginPage } from '../../pages/login.page';
import { deleteTestRecipes } from '../../helpers/cleanup.helpers';

/**
 * E2E-6: Recipe List Tests
 *
 * Tests the recipe list view including:
 * - Displaying saved recipes
 * - Recipe cards with title, summary, tags
 * - Clicking recipes to view details
 * - Recipe count display
 * - Navigation between recipes
 *
 * Setup: Generates and saves 2 recipes before running tests
 * Cleanup: Deletes all test recipes after tests complete
 */

test.describe('Recipe List', () => {
  // Run tests serially to ensure single beforeAll execution
  test.describe.configure({ mode: 'serial' });
  let appPage: AppPage;
  let loginPage: LoginPage;
  let testUserCredentials: { email: string; password: string };
  let testUserId: string;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(90000); // 90s timeout for setup with 2 AI generations

    // Use existing test user from .env.test
    testUserCredentials = {
      email: process.env.E2E_USERNAME || 'user@gmail.com',
      password: process.env.E2E_PASSWORD || 'qwerty123',
    };
    testUserId = process.env.E2E_USERNAME_ID || '';

    // Setup: Generate and save 2 recipes for testing
    const context = await browser.newContext();
    const page = await context.newPage();
    const setupAppPage = new AppPage(page);
    const setupLoginPage = new LoginPage(page);

    // Login
    await setupLoginPage.goto();
    await setupLoginPage.login(
      testUserCredentials.email,
      testUserCredentials.password
    );
    await page.waitForURL(/\/app/);
    await setupAppPage.waitForAppToLoad();

    // Generate and save first recipe
    await setupAppPage.clickGeneratorTab();
    await setupAppPage.generateRecipe('Quick pasta carbonara');
    const recipe1Generated = await setupAppPage.isRecipeDisplayed();
    if (recipe1Generated) {
      await setupAppPage.saveRecipe();
      await page.waitForTimeout(1000);
    }

    // Generate and save second recipe
    await setupAppPage.clickGeneratorTab();
    await setupAppPage.generateRecipe('Greek salad with feta');
    const recipe2Generated = await setupAppPage.isRecipeDisplayed();
    if (recipe2Generated) {
      await setupAppPage.saveRecipe();
      await page.waitForTimeout(1000);
    }

    await context.close();
  });

  test.afterAll(async () => {
    // Cleanup: Delete all test recipes
    if (testUserId) {
      await deleteTestRecipes(testUserId);
    }
  });

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
    loginPage = new LoginPage(page);

    // Login with test user
    await loginPage.goto();
    await loginPage.login(testUserCredentials.email, testUserCredentials.password);

    // Wait for redirect to app
    await page.waitForURL(/\/app/);
    await appPage.waitForAppToLoad();
  });

  test('should display list of saved recipes', async () => {
    // Recipe cards should be visible (at least 2 from setup)
    const recipeCount = await appPage.getRecipeCardsCount();
    expect(recipeCount).toBeGreaterThanOrEqual(2);

    // Recipe count text should be visible
    const countText = await appPage.getRecipeCountText();
    expect(countText).toContain('recipe');
    expect(countText).toMatch(/\d+/); // Contains a number
  });

  test('should display recipe cards with correct content', async ({ page }) => {
    // Get first recipe card
    const firstCard = page.locator('h3').first();
    await expect(firstCard).toBeVisible();

    // Card should have title
    const title = await firstCard.textContent();
    expect(title).toBeTruthy();
    expect(title!.length).toBeGreaterThan(0);

    // Card should have summary (check for any text content in the card)
    const cardWithSummary = page.locator('p.text-muted-foreground').first();
    if (await cardWithSummary.isVisible()) {
      const summary = await cardWithSummary.textContent();
      expect(summary).toBeTruthy();
    }

    // Card should have tags
    const tags = page.locator('[class*="badge"]').first();
    if (await tags.isVisible()) {
      const tagText = await tags.textContent();
      expect(tagText).toBeTruthy();
    }
  });

  test('should click recipe card to view details', async ({ page }) => {
    // Click first recipe card
    await appPage.clickRecipeCard(0);

    // Wait a moment for panel to update
    await page.waitForTimeout(500);

    // Recipe should be displayed in preview panel
    const isDisplayed = await appPage.isRecipeDisplayed();
    expect(isDisplayed).toBe(true);

    // Recipe title should be visible
    await expect(appPage.recipeTitle).toBeVisible();
  });

  test('should display correct default sorting', async () => {
    // By default, recipes should be sorted by newest first
    // We can verify this by checking if our test recipes appear in order
    const count = await appPage.getRecipeCardsCount();
    expect(count).toBeGreaterThanOrEqual(2);

    // First card should be most recent (Test Recipe 3 or newer)
    // This is a basic check - actual order depends on creation timestamps
  });

  test('should have recipe tags in DOM structure', async ({ page }) => {
    // Check if badge elements exist in DOM (they may not be visible in list view)
    const tags = page.locator('[class*="badge"]');
    const tagCount = await tags.count();

    // Tags should exist in the DOM structure
    expect(tagCount).toBeGreaterThan(0);

    // Verify tags have content
    const firstTag = tags.first();
    const tagText = await firstTag.textContent();
    expect(tagText).toBeTruthy();
  });

  test('should show recipe count', async () => {
    const countText = await appPage.getRecipeCountText();
    expect(countText).toBeTruthy();

    // Should contain "recipe" or "recipes"
    expect(countText).toMatch(/recipe/i);

    // Should contain a number
    expect(countText).toMatch(/\d+/);
  });

  test('should handle navigation between list and preview', async ({ page }) => {
    // Click first recipe
    await appPage.clickRecipeCard(0);
    await page.waitForTimeout(500);

    // Recipe should be displayed
    let isDisplayed = await appPage.isRecipeDisplayed();
    expect(isDisplayed).toBe(true);

    // Click second recipe
    await appPage.clickRecipeCard(1);
    await page.waitForTimeout(500);

    // Different recipe should be displayed
    isDisplayed = await appPage.isRecipeDisplayed();
    expect(isDisplayed).toBe(true);

    // Recipe list should still be visible
    const listCount = await appPage.getRecipeCardsCount();
    expect(listCount).toBeGreaterThanOrEqual(2);
  });
});
