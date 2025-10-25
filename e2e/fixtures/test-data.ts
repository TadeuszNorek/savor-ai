/**
 * Test Fixtures
 * Centralized test data for E2E tests
 */

export const TEST_USERS = {
  validUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },
};

export const TEST_RECIPES = {
  sampleRecipe: {
    name: 'Test Recipe',
    description: 'A test recipe for E2E tests',
    ingredients: ['Ingredient 1', 'Ingredient 2'],
    instructions: ['Step 1', 'Step 2'],
  },
};

export const TEST_PROFILES = {
  sampleProfile: {
    displayName: 'Test User',
    dietType: 'vegetarian',
    allergies: ['peanuts', 'shellfish'],
    preferences: ['italian', 'mexican'],
  },
};

/**
 * Common URLs for testing
 */
export const URLS = {
  home: '/',
  login: '/login',
  app: '/app',
  profile: '/profile',
  forgotPassword: '/auth/forgot',
  resetPassword: '/auth/reset',
};

/**
 * Common timeouts for testing
 */
export const TIMEOUTS = {
  short: 5000,
  medium: 10000,
  long: 30000,
};
