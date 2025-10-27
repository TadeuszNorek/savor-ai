/**
 * Test User Credentials
 * Real test users that should exist in the test database
 *
 * IMPORTANT:
 * - These users should be created in your test database before running E2E tests
 * - Use auth.helpers.ts createTestUser() to create them
 * - Use cleanup.helpers.ts to delete them after tests
 *
 * DIFFERENCE from test-data.ts:
 * - test-data.ts: Mock/fake data for stubs and examples
 * - test-users.ts: Real credentials for actual database users
 */

import type { UserCredentials } from '../helpers/auth.helpers';

/**
 * Primary test user - has full profile and recipes
 * Use for: Most standard tests, login flows, recipe operations
 */
export const PRIMARY_TEST_USER: UserCredentials = {
  email: 'e2e-primary@test.example.com',
  password: 'TestPassword123!',
};

/**
 * Secondary test user - minimal setup
 * Use for: Testing new user flows, profile creation, empty states
 */
export const SECONDARY_TEST_USER: UserCredentials = {
  email: 'e2e-secondary@test.example.com',
  password: 'TestPassword123!',
};

/**
 * User with existing profile and preferences
 * Use for: Testing recipe generation with preferences, filtering
 */
export const USER_WITH_PROFILE: UserCredentials & {
  profile?: {
    diet_type: string;
    disliked_ingredients: string[];
    preferred_cuisines: string[];
  };
} = {
  email: 'e2e-with-profile@test.example.com',
  password: 'TestPassword123!',
  profile: {
    diet_type: 'vegetarian',
    disliked_ingredients: ['peanuts', 'shellfish'],
    preferred_cuisines: ['italian', 'indian'],
  },
};

/**
 * User with saved recipes
 * Use for: Testing recipe list, search, filter, delete operations
 */
export const USER_WITH_RECIPES: UserCredentials = {
  email: 'e2e-with-recipes@test.example.com',
  password: 'TestPassword123!',
};

/**
 * Fresh user for signup tests
 * Use for: Registration flow tests (will be created during test)
 * NOTE: This user should NOT exist before the test
 */
export const SIGNUP_TEST_USER: UserCredentials = {
  email: 'e2e-signup@test.example.com',
  password: 'TestPassword123!',
};

/**
 * User for password reset tests
 * Use for: Forgot password, reset password flows
 */
export const PASSWORD_RESET_USER: UserCredentials = {
  email: 'e2e-reset-password@test.example.com',
  password: 'TestPassword123!',
};

/**
 * All test users in one array
 * Useful for bulk operations (create all, delete all)
 */
export const ALL_TEST_USERS = [
  PRIMARY_TEST_USER,
  SECONDARY_TEST_USER,
  USER_WITH_PROFILE,
  USER_WITH_RECIPES,
  PASSWORD_RESET_USER,
] as const;

/**
 * Invalid credentials for testing error states
 * These should NOT exist in the database
 */
export const INVALID_CREDENTIALS = {
  nonExistentUser: {
    email: 'nonexistent@test.example.com',
    password: 'WrongPassword123!',
  },
  invalidEmail: {
    email: 'invalid-email-format',
    password: 'TestPassword123!',
  },
  shortPassword: {
    email: 'test@test.example.com',
    password: 'short',
  },
  emptyCredentials: {
    email: '',
    password: '',
  },
} as const;

/**
 * Test user roles/states
 * For testing different user scenarios
 */
export const USER_STATES = {
  // User who just signed up, no profile yet
  newUser: SECONDARY_TEST_USER,

  // User with complete profile
  activeUser: USER_WITH_PROFILE,

  // User with recipes saved
  userWithData: USER_WITH_RECIPES,

  // User for isolated tests (gets cleaned after each test)
  isolatedUser: PRIMARY_TEST_USER,
} as const;

/**
 * Helper to get a unique test user email
 * Useful for creating one-off test users
 *
 * @param prefix - Optional prefix for the email
 * @returns Unique email address
 */
export function getUniqueTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `e2e-${prefix}-${timestamp}-${random}@test.example.com`;
}

/**
 * Helper to generate test user credentials
 *
 * @param email - Optional custom email
 * @param password - Optional custom password
 * @returns User credentials
 */
export function generateTestUser(
  email?: string,
  password: string = 'TestPassword123!'
): UserCredentials {
  return {
    email: email || getUniqueTestEmail(),
    password,
  };
}

/**
 * Check if email is a test user email
 *
 * @param email - Email to check
 * @returns True if email matches test pattern
 */
export function isTestUserEmail(email: string): boolean {
  return /^e2e-.*@test\.example\.com$/.test(email);
}
