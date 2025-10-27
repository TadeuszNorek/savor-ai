import { type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { LoginPage } from '../pages/login.page';

/**
 * User credentials interface
 */
export interface UserCredentials {
  email: string;
  password: string;
}

/**
 * Test user data
 */
export interface TestUser extends UserCredentials {
  id?: string;
}

/**
 * Create Supabase admin client for test user management
 * Uses service role key which bypasses RLS policies
 */
function getSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env'
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Login as a user using the login form
 * This simulates real user behavior through the UI
 *
 * @param page - Playwright page instance
 * @param credentials - User email and password
 */
export async function loginAsUser(
  page: Page,
  credentials: UserCredentials
): Promise<void> {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login(credentials.email, credentials.password);
  await loginPage.waitForNavigation();
}

/**
 * Login via API (faster, for setup purposes)
 * Use this when you need authentication but don't need to test the login flow
 * Note: This method directly calls the auth API endpoint
 *
 * @param page - Playwright page instance
 * @param credentials - User email and password
 */
export async function loginViaAPI(
  page: Page,
  credentials: UserCredentials
): Promise<void> {
  // Call the login API endpoint directly
  const response = await page.request.post('/api/auth/login', {
    data: {
      email: credentials.email,
      password: credentials.password,
    },
  });

  if (!response.ok()) {
    const error = await response.json();
    throw new Error(`Login via API failed: ${error.error || 'Unknown error'}`);
  }

  // Navigate to app to verify session
  await page.goto('/app');
  await page.waitForURL(/\/app/);
}

/**
 * Create a new test user in Supabase
 * Returns user credentials
 *
 * @param userData - Optional user data (email, password)
 * @returns Created user credentials with ID
 */
export async function createTestUser(
  userData?: Partial<TestUser>
): Promise<TestUser> {
  const supabase = getSupabaseAdminClient();

  // Generate unique email if not provided
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const email = userData?.email || `test-${timestamp}-${randomString}@example.com`;
  const password = userData?.password || 'TestPassword123!';

  // Create user via Supabase Admin API
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email for test users
  });

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`);
  }

  return {
    id: data.user.id,
    email,
    password,
  };
}

/**
 * Delete a test user from Supabase
 *
 * @param userId - User ID to delete
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    throw new Error(`Failed to delete test user: ${error.message}`);
  }
}

/**
 * Logout the current user
 * Clears all authentication state
 *
 * @param page - Playwright page instance
 */
export async function logoutUser(page: Page): Promise<void> {
  // Call logout API endpoint
  await page.request.post('/api/auth/logout');

  // Navigate to login page to verify logout
  await page.goto('/login');
  await page.waitForURL(/\/login/);
}

/**
 * Get authentication token from cookies
 * Useful for API testing
 *
 * @param page - Playwright page instance
 * @returns Access token or null if not found
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies();

  // Supabase stores tokens in specific cookie names
  const authCookie = cookies.find(
    (cookie) =>
      cookie.name.includes('sb-') &&
      (cookie.name.includes('auth-token') || cookie.name.includes('access-token'))
  );

  if (!authCookie) {
    return null;
  }

  // Try to extract token from cookie value
  try {
    const value = decodeURIComponent(authCookie.value);
    // Supabase cookies might be JSON encoded
    if (value.startsWith('{') || value.startsWith('[')) {
      const parsed = JSON.parse(value);
      return parsed.access_token || parsed.token || value;
    }
    return value;
  } catch {
    return authCookie.value;
  }
}

/**
 * Save authentication state to file
 * Useful for reusing login state across tests
 *
 * @param page - Playwright page instance
 * @param path - File path to save state
 */
export async function saveAuthState(page: Page, path: string): Promise<void> {
  await page.context().storageState({ path });
}

/**
 * Check if user is authenticated
 *
 * @param page - Playwright page instance
 * @returns True if user is logged in
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const currentUrl = page.url();

  // If on /app route, user is authenticated
  if (currentUrl.includes('/app')) {
    return true;
  }

  // Check for auth cookies
  const token = await getAuthToken(page);
  return token !== null;
}

/**
 * Wait for authentication to complete
 * Useful after login/register actions
 *
 * @param page - Playwright page instance
 * @param timeout - Maximum time to wait in ms
 */
export async function waitForAuth(
  page: Page,
  timeout: number = 5000
): Promise<void> {
  await page.waitForURL(/\/app/, { timeout });
}