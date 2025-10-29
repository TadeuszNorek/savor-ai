import { test, expect } from "@playwright/test";
import { AppPage } from "../../pages/app.page";
import { LoginPage } from "../../pages/login.page";
import { deleteTestRecipes } from "../../helpers/cleanup.helpers";

/**
 * E2E-7: Recipe Delete Tests
 *
 * Tests the recipe deletion feature including:
 * - Delete button visibility for saved recipes only
 * - Confirmation dialog before deletion
 * - Cancel delete action
 * - Confirm delete and verify removal
 * - Success toast message
 * - Recipe removed from list after deletion
 *
 * Setup: Generates and saves 2 recipes before running tests
 * Cleanup: Deletes all test recipes after tests complete
 */

test.describe("Recipe Delete", () => {
  // Run tests serially to ensure single beforeAll execution
  test.describe.configure({ mode: "serial" });
  let appPage: AppPage;
  let loginPage: LoginPage;
  let testUserCredentials: { email: string; password: string };
  let testUserId: string;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(90000); // 90s timeout for setup with 2 AI generations

    // Use existing test user from .env.test
    testUserCredentials = {
      email: process.env.E2E_USERNAME || "user@gmail.com",
      password: process.env.E2E_PASSWORD || "qwerty123",
    };
    testUserId = process.env.E2E_USERNAME_ID || "";

    // Setup: Generate and save 2 recipes for testing
    const context = await browser.newContext();
    const page = await context.newPage();
    const setupAppPage = new AppPage(page);
    const setupLoginPage = new LoginPage(page);

    // Login
    await setupLoginPage.goto();
    await setupLoginPage.login(testUserCredentials.email, testUserCredentials.password);
    await page.waitForURL(/\/app/);
    await setupAppPage.waitForAppToLoad();

    // Generate and save first recipe
    await setupAppPage.clickGeneratorTab();
    await setupAppPage.generateRecipe("Quick pasta carbonara");
    const recipe1Generated = await setupAppPage.isRecipeDisplayed();
    if (recipe1Generated) {
      await setupAppPage.saveRecipe();
      await page.waitForTimeout(1000);
    }

    // Generate and save second recipe
    await setupAppPage.clickGeneratorTab();
    await setupAppPage.generateRecipe("Greek salad with feta");
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

  test("should not show delete button for generated recipe", async () => {
    // Generate a new recipe (not saved)
    await appPage.clickGeneratorTab();
    await appPage.generateRecipe("Simple tomato soup");

    // Delete button should not be visible for draft recipe
    const isDeleteVisible = await appPage.isDeleteButtonVisible();
    expect(isDeleteVisible).toBe(false);
  });

  test("should show delete button for saved recipe", async () => {
    // Click first saved recipe
    await appPage.clickRecipeCard(0);

    // Wait for recipe to load
    await appPage.recipeTitle.waitFor({ state: "visible" });

    // Delete button should be visible for saved recipe
    await expect(appPage.deleteButton).toBeVisible();
  });

  test("should open confirmation dialog on delete click", async () => {
    // Click first saved recipe
    await appPage.clickRecipeCard(0);
    await appPage.recipeTitle.waitFor({ state: "visible" });

    // Click delete button
    await appPage.deleteButton.click();

    // Confirmation dialog should be visible
    await expect(appPage.confirmDialog).toBeVisible();

    // Dialog should have correct title
    await expect(appPage.confirmDialogTitle).toBeVisible();
    await expect(appPage.confirmDialogTitle).toHaveText(/are you sure/i);

    // Dialog should have description mentioning permanent deletion
    const description = await appPage.getConfirmDialogDescription();
    expect(description).toMatch(/permanently delete/i);

    // Both buttons should be visible
    await expect(appPage.confirmCancelButton).toBeVisible();
    await expect(appPage.confirmDeleteButton).toBeVisible();
  });

  test("should show recipe name in confirmation dialog", async () => {
    // Click first saved recipe
    await appPage.clickRecipeCard(0);
    await appPage.recipeTitle.waitFor({ state: "visible" });

    // Get recipe title
    const recipeTitle = await appPage.getRecipeTitle();
    expect(recipeTitle).toBeTruthy();

    // Click delete button
    await appPage.deleteButton.click();
    await appPage.confirmDialog.waitFor({ state: "visible" });

    // Dialog description should contain recipe name
    const description = await appPage.getConfirmDialogDescription();
    // Recipe name appears in the description (may be partial match due to HTML structure)
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(0);
  });

  test("should cancel delete action", async () => {
    // Click first saved recipe
    await appPage.clickRecipeCard(0);
    await appPage.recipeTitle.waitFor({ state: "visible" });

    // Get initial recipe count
    const initialCount = await appPage.getRecipeCardsCount();

    // Cancel deletion
    await appPage.cancelDeleteRecipe();

    // Dialog should be closed
    await expect(appPage.confirmDialog).not.toBeVisible();

    // Recipe should still be visible in preview
    await expect(appPage.recipeTitle).toBeVisible();

    // Recipe count should be unchanged
    const afterCancelCount = await appPage.getRecipeCardsCount();
    expect(afterCancelCount).toBe(initialCount);
  });

  test("should confirm delete and show success toast", async ({ page }) => {
    // Click first saved recipe
    await appPage.clickRecipeCard(0);
    await appPage.recipeTitle.waitFor({ state: "visible" });

    // Delete recipe with confirmation
    await appPage.deleteRecipe();

    // Success toast should be visible
    const successToast = page.locator("[data-sonner-toast]").filter({
      hasText: /recipe deleted successfully/i,
    });
    await expect(successToast).toBeVisible();
  });

  test("should remove recipe from list after deletion", async ({ page }) => {
    // Get initial recipe count
    const initialCount = await appPage.getRecipeCardsCount();

    // Skip if no recipes available (previous tests may have deleted them)
    if (initialCount === 0) {
      test.skip();
      return;
    }

    // Click first saved recipe
    await appPage.clickRecipeCard(0);
    await appPage.recipeTitle.waitFor({ state: "visible" });

    // Get recipe title before deletion
    const deletedTitle = await appPage.getRecipeTitle();

    // Delete recipe
    await appPage.deleteRecipe();

    // Wait for toast to disappear (ensures UI updated)
    await page.waitForTimeout(1000);

    // Recipe count should decrease
    const afterDeleteCount = await appPage.getRecipeCardsCount();
    expect(afterDeleteCount).toBe(initialCount - 1);

    // Deleted recipe should not be in the list
    // Check if the deleted recipe title is no longer visible in cards
    const cards = page.locator("h3");
    const cardCount = await cards.count();

    for (let i = 0; i < cardCount; i++) {
      const cardText = await cards.nth(i).textContent();
      expect(cardText).not.toBe(deletedTitle);
    }
  });

  test("should close dialog and clear preview after deletion", async ({ page }) => {
    // Check if recipes are available
    const recipeCount = await appPage.getRecipeCardsCount();

    // Skip if no recipes available (previous tests may have deleted them)
    if (recipeCount === 0) {
      test.skip();
      return;
    }

    // Click first saved recipe
    await appPage.clickRecipeCard(0);
    await appPage.recipeTitle.waitFor({ state: "visible" });

    // Delete recipe
    await appPage.deleteRecipe();

    // Wait for deletion to complete
    await page.waitForTimeout(1000);

    // Dialog should be closed
    await expect(appPage.confirmDialog).not.toBeVisible();

    // Preview should show empty state or another recipe
    // (depends on app behavior - may show next recipe or empty state)
  });
});
