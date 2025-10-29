import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../src/db/database.types';

/**
 * Create Supabase admin client for cleanup operations
 * Uses service role key to bypass RLS policies
 */
function getSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Delete all recipes for a specific user
 *
 * @param userId - User ID whose recipes to delete
 * @returns Number of recipes deleted
 */
export async function deleteTestRecipes(userId: string): Promise<number> {
  const supabase = getSupabaseAdminClient();

  // Get count before deletion
  const { count, error: countError } = await supabase
    .from('recipes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    throw new Error(`Failed to count recipes: ${countError.message}`);
  }

  // Delete all recipes for user
  const { error } = await supabase.from('recipes').delete().eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete recipes: ${error.message}`);
  }

  return count || 0;
}

/**
 * Delete a specific recipe by ID
 *
 * @param recipeId - Recipe ID to delete
 */
export async function deleteTestRecipe(recipeId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from('recipes').delete().eq('id', recipeId);

  if (error) {
    throw new Error(`Failed to delete recipe: ${error.message}`);
  }
}

/**
 * Delete all events for a specific user
 * Useful for cleaning up telemetry data
 *
 * @param userId - User ID whose events to delete
 * @returns Number of events deleted
 */
export async function deleteTestEvents(userId: string): Promise<number> {
  const supabase = getSupabaseAdminClient();

  // Get count before deletion
  const { count, error: countError } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    throw new Error(`Failed to count events: ${countError.message}`);
  }

  // Delete all events for user
  const { error } = await supabase.from('events').delete().eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete events: ${error.message}`);
  }

  return count || 0;
}

/**
 * Delete user profile
 *
 * @param userId - User ID whose profile to delete
 */
export async function deleteTestProfile(userId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from('profiles').delete().eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete profile: ${error.message}`);
  }
}

/**
 * Delete a test user and all associated data
 * Deletes in correct order: recipes → events → profile → user
 *
 * @param userId - User ID to delete
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();

  // Delete in order: recipes, events, profile, then auth user
  try {
    // 1. Delete recipes
    await deleteTestRecipes(userId);

    // 2. Delete events
    await deleteTestEvents(userId);

    // 3. Delete profile
    await deleteTestProfile(userId);

    // 4. Delete auth user (this might cascade delete if configured)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      throw new Error(`Failed to delete auth user: ${authError.message}`);
    }
  } catch (error) {
    throw new Error(
      `Failed to delete test user: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete multiple test users and their data
 *
 * @param userIds - Array of user IDs to delete
 */
export async function deleteTestUsers(userIds: string[]): Promise<void> {
  for (const userId of userIds) {
    await deleteTestUser(userId);
  }
}

/**
 * Clean up all data for a user (keep the user account)
 * Useful when you want to reset a user's data but keep the account
 *
 * @param userId - User ID whose data to clean
 */
export async function cleanupUserData(userId: string): Promise<void> {
  await deleteTestRecipes(userId);
  await deleteTestEvents(userId);
  await deleteTestProfile(userId);
}

/**
 * Reset test data - delete all test users
 * DANGEROUS: Only use for test cleanup, identifies test users by email pattern
 *
 * @param emailPattern - Pattern to identify test users (default: "test-.*@example.com")
 */
export async function resetTestData(
  emailPattern: string = 'test-.*@example.com'
): Promise<void> {
  const supabase = getSupabaseAdminClient();

  // List all users (admin only)
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  if (!data || !data.users) {
    return;
  }

  // Filter test users by email pattern
  const regex = new RegExp(emailPattern);
  const testUsers = data.users.filter((user: any) => {
    const email = user.email;
    return email && regex.test(email);
  });

  // Delete each test user
  for (const user of testUsers) {
    await deleteTestUser(user.id);
  }
}

/**
 * Create a test recipe for a user
 * Useful for setting up test data
 *
 * @param userId - User ID to create recipe for
 * @param recipeData - Recipe data
 * @returns Created recipe ID
 */
export async function createTestRecipe(
  userId: string,
  recipeData: {
    title: string;
    recipe: unknown;
    tags?: string[];
    summary?: string;
  }
): Promise<string> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: userId,
      title: recipeData.title,
      recipe: recipeData.recipe as any,
      tags: recipeData.tags || [],
      summary: recipeData.summary || '',
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create test recipe: ${error.message}`);
  }

  return data.id;
}

/**
 * Create test profile for a user
 *
 * @param userId - User ID to create profile for
 * @param profileData - Profile data
 */
export async function createTestProfile(
  userId: string,
  profileData?: {
    diet_type?: string;
    disliked_ingredients?: string[];
    preferred_cuisines?: string[];
  }
): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from('profiles').insert({
    user_id: userId,
    diet_type: profileData?.diet_type || null,
    disliked_ingredients: profileData?.disliked_ingredients || null,
    preferred_cuisines: profileData?.preferred_cuisines || null,
  });

  if (error) {
    throw new Error(`Failed to create test profile: ${error.message}`);
  }
}

/**
 * Count recipes for a user
 * Useful for assertions in tests
 *
 * @param userId - User ID
 * @returns Number of recipes
 */
export async function countUserRecipes(userId: string): Promise<number> {
  const supabase = getSupabaseAdminClient();

  const { count, error } = await supabase
    .from('recipes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to count recipes: ${error.message}`);
  }

  return count || 0;
}

/**
 * Get all recipes for a user
 * Useful for test setup verification
 *
 * @param userId - User ID
 * @returns Array of recipes
 */
export async function getUserRecipes(userId: string) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get recipes: ${error.message}`);
  }

  return data;
}
