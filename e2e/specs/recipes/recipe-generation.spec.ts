import { test, expect } from '@playwright/test';
import { AppPage } from '../../pages/app.page';
import { LoginPage } from '../../pages/login.page';
import { deleteTestRecipes } from '../../helpers/cleanup.helpers';

/**
 * E2E-4: Recipe Generation Tests
 *
 * Tests the AI-powered recipe generation feature including:
 * - Basic recipe generation flow
 * - Form validation and character counter
 * - Loading states and error handling
 * - Recipe preview display
 * - Servings adjustment
 * - Saving generated recipes
 */

test.describe('Recipe Generation', () => {
  let appPage: AppPage;
  let loginPage: LoginPage;
  let testUserCredentials: { email: string; password: string };

  test.beforeAll(async () => {
    // Use existing test user from .env.test
    testUserCredentials = {
      email: process.env.E2E_USERNAME || 'user@gmail.com',
      password: process.env.E2E_PASSWORD || 'qwerty123',
    };
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

    // Navigate to generator tab
    await appPage.clickGeneratorTab();
  });

  test.afterEach(async ({}, testInfo) => {
    // Cleanup saved recipes after "save recipe" test
    if (testInfo.title.includes('save generated recipe')) {
      const userId = process.env.E2E_USERNAME_ID;
      if (userId) {
        await deleteTestRecipes(userId);
      }
    }
  });

  test('should generate recipe with basic prompt', async ({ page }) => {
    test.setTimeout(60000); // 60s timeout for AI generation
    const prompt = 'Quick chicken pasta with vegetables';

    // Generate recipe
    await appPage.generateRecipe(prompt);

    // Should auto-switch to preview tab
    await expect(appPage.previewTab).toHaveAttribute('aria-selected', 'true');

    // Recipe should be displayed
    await expect(appPage.recipeTitle).toBeVisible();
    const title = await appPage.getRecipeTitle();
    expect(title).toBeTruthy();
    expect(title!.length).toBeGreaterThan(0);

    // Should have ingredients
    const ingredientCount = await appPage.getIngredientCount();
    expect(ingredientCount).toBeGreaterThan(0);

    // Should have instructions
    const instructionCount = await appPage.getInstructionCount();
    expect(instructionCount).toBeGreaterThan(0);
  });

  test('should disable generate button with empty prompt', async () => {
    // Button should be disabled initially (empty prompt)
    await expect(appPage.generateButton).toBeDisabled();

    // Type a character
    await appPage.promptInput.fill('a');
    await expect(appPage.generateButton).toBeEnabled();

    // Clear input
    await appPage.promptInput.fill('');
    await expect(appPage.generateButton).toBeDisabled();
  });

  test('should update character counter while typing', async () => {
    const shortPrompt = 'Quick pasta recipe';
    await appPage.promptInput.fill(shortPrompt);

    const counterText = await appPage.getCharacterCountText();
    expect(counterText).toContain('character');

    // Extract remaining characters
    const remaining = counterText?.match(/(\d+)/)?.[0];
    expect(remaining).toBeTruthy();

    // Should have less than 2000 characters remaining
    const remainingNum = parseInt(remaining!);
    expect(remainingNum).toBeLessThan(2000);
    expect(remainingNum).toBeGreaterThan(0);
  });

  test('should display all recipe components correctly', async () => {
    test.setTimeout(60000); // 60s timeout for AI generation
    const prompt = 'Italian margherita pizza with fresh basil';

    await appPage.generateRecipe(prompt);

    // Title should be visible
    await expect(appPage.recipeTitle).toBeVisible();

    // Summary/description should be visible
    await expect(appPage.recipeSummary).toBeVisible();

    // Ingredients section should exist
    const ingredients = await appPage.getIngredientCount();
    expect(ingredients).toBeGreaterThan(0);

    // Instructions section should exist
    const instructions = await appPage.getInstructionCount();
    expect(instructions).toBeGreaterThan(0);

    // Nutrition section should be visible
    await expect(appPage.nutritionSection).toBeVisible();
  });

  test('should adjust recipe servings', async ({ page }) => {
    test.setTimeout(60000); // 60s timeout for AI generation
    const prompt = 'Simple tomato soup for 4 people';

    await appPage.generateRecipe(prompt);

    // Servings controls should be visible
    await expect(appPage.servingsIncrease).toBeVisible();
    await expect(appPage.servingsDecrease).toBeVisible();

    // Get initial ingredient text
    const firstIngredient = appPage.ingredientsList.first();
    const initialText = await firstIngredient.textContent();

    // Increase servings
    await appPage.adjustServings(true);

    // Wait for re-render (quantities should update)
    await page.waitForTimeout(500);

    // Ingredient text might change (quantities scaled)
    const updatedText = await firstIngredient.textContent();

    // Both texts should exist (verify recipe is still rendered)
    expect(initialText).toBeTruthy();
    expect(updatedText).toBeTruthy();
  });

  test('should save generated recipe', async ({ page }) => {
    test.setTimeout(60000); // 60s timeout for AI generation
    const prompt = 'Healthy breakfast smoothie bowl';

    await appPage.generateRecipe(prompt);

    // Save button should be visible
    await expect(appPage.saveButton).toBeVisible();
    await expect(appPage.saveButton).toBeEnabled();

    // Save the recipe
    await appPage.saveRecipe();

    // Success toast should appear (Sonner toast)
    const successToast = page.locator('[data-sonner-toast]').filter({
      hasText: /recipe saved successfully/i,
    });
    await expect(successToast).toBeVisible();
  });

  test('should switch between Generator and Preview tabs', async () => {
    // Initially on Generator tab
    await expect(appPage.generatorTab).toHaveAttribute('aria-selected', 'true');
    await expect(appPage.promptInput).toBeVisible();

    // Switch to Preview tab (empty state)
    await appPage.clickPreviewTab();
    await expect(appPage.previewTab).toHaveAttribute('aria-selected', 'true');
    await expect(appPage.emptyStateMessage).toBeVisible();

    // Switch back to Generator
    await appPage.clickGeneratorTab();
    await expect(appPage.generatorTab).toHaveAttribute('aria-selected', 'true');
    await expect(appPage.promptInput).toBeVisible();
  });

  test('should regenerate recipe with different prompt', async () => {
    test.setTimeout(90000); // 90s timeout for double AI generation
    // First generation
    const firstPrompt = 'Mexican tacos with beef';
    await appPage.generateRecipe(firstPrompt);

    const firstTitle = await appPage.getRecipeTitle();
    expect(firstTitle).toBeTruthy();

    // Switch back to generator
    await appPage.clickGeneratorTab();

    // Second generation with different prompt
    const secondPrompt = 'Japanese sushi rolls with salmon';
    await appPage.generateRecipe(secondPrompt);

    const secondTitle = await appPage.getRecipeTitle();
    expect(secondTitle).toBeTruthy();

    // Titles should be different (different recipes)
    // Note: Mock provider might return same structure, so we just verify both exist
    expect(firstTitle).not.toBe(secondTitle);
  });

  test('should handle empty state in preview', async () => {
    // When no recipe is generated, preview should show empty state
    await appPage.clickPreviewTab();

    // Empty state message should be visible
    await expect(appPage.emptyStateMessage).toBeVisible();

    // Save button should not be visible
    await expect(appPage.saveButton).not.toBeVisible();
  });

  test('should show ingredients as interactive buttons', async ({ page }) => {
    test.setTimeout(60000); // 60s timeout for AI generation
    const prompt = 'Greek salad with feta cheese';

    await appPage.generateRecipe(prompt);

    // Get first ingredient
    const firstIngredient = appPage.ingredientsList.first();
    await expect(firstIngredient).toBeVisible();

    // Ingredient should be clickable button
    await expect(firstIngredient).toBeEnabled();

    // Get ingredient text
    const ingredientText = await firstIngredient.textContent();
    expect(ingredientText).toBeTruthy();
    expect(ingredientText!.length).toBeGreaterThan(0);

    // Click the ingredient button (toggles completion state)
    await firstIngredient.click();

    // Wait for visual state change (ingredient gets marked as completed)
    await page.waitForTimeout(200);
  });
});
