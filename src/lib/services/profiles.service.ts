import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { CreateProfileCommand, UpdateProfileCommand, ProfileDTO } from "../../types";

/**
 * Error thrown when profile already exists (for POST operations)
 */
export class ProfileConflictError extends Error {
  constructor(message: string = "Profile already exists") {
    super(message);
    this.name = "ProfileConflictError";
  }
}

/**
 * Error thrown when profile is not found (for GET/PUT operations)
 */
export class ProfileNotFoundError extends Error {
  constructor(message: string = "Profile not found") {
    super(message);
    this.name = "ProfileNotFoundError";
  }
}

/**
 * Profiles Service
 * Handles CRUD operations for user profiles
 */
export class ProfilesService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create a new profile for the user
   * Uses single insert operation to minimize race conditions
   * Relies on unique constraint on profiles.user_id to prevent duplicates
   *
   * @param userId - The user ID (from auth session)
   * @param command - Profile data (all fields optional)
   * @returns Created profile
   * @throws ProfileConflictError if profile already exists (23505 unique violation)
   * @throws Error for other database errors
   */
  async createProfile(userId: string, command: CreateProfileCommand): Promise<ProfileDTO> {
    const { data, error } = await this.supabase
      .from("profiles")
      .insert({
        user_id: userId,
        diet_type: command.diet_type ?? null,
        disliked_ingredients: command.disliked_ingredients ?? [],
        preferred_cuisines: command.preferred_cuisines ?? [],
      })
      .select("*")
      .single();

    // Handle unique constraint violation (profile already exists)
    if (error) {
      // PostgreSQL error code 23505 = unique_violation
      if (error.code === "23505" || error.message.includes("duplicate key")) {
        throw new ProfileConflictError("Profile already exists; use PUT /api/profile to update");
      }

      console.error(`Failed to create profile for user ${userId}:`, error);
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    if (!data) {
      throw new Error("Profile created but no data returned");
    }

    return data;
  }

  /**
   * Get profile for the user
   *
   * @param userId - The user ID (from auth session)
   * @returns User's profile or null if not found
   * @throws Error for database errors
   */
  async getProfile(userId: string): Promise<ProfileDTO | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Profile not found is not an error - return null
    if (error && error.code === "PGRST116") {
      return null;
    }

    if (error) {
      console.error(`Failed to get profile for user ${userId}:`, error);
      throw new Error(`Failed to get profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Update existing profile for the user
   * All fields in command are optional (partial update)
   *
   * @param userId - The user ID (from auth session)
   * @param command - Profile data to update (partial)
   * @returns Updated profile
   * @throws ProfileNotFoundError if profile doesn't exist
   * @throws Error for other database errors
   */
  async updateProfile(userId: string, command: UpdateProfileCommand): Promise<ProfileDTO> {
    // Build update object conditionally to support null values
    // (undefined means "don't update", null means "clear the value")
    const updateFields: any = {
      updated_at: new Date().toISOString(),
    };

    if (command.diet_type !== undefined) {
      updateFields.diet_type = command.diet_type; // can be null or DietType enum
    }
    if (command.disliked_ingredients !== undefined) {
      updateFields.disliked_ingredients = command.disliked_ingredients;
    }
    if (command.preferred_cuisines !== undefined) {
      updateFields.preferred_cuisines = command.preferred_cuisines;
    }

    const { data, error } = await this.supabase
      .from("profiles")
      .update(updateFields)
      .eq("user_id", userId)
      .select("*")
      .single();

    // Profile not found
    if (error && error.code === "PGRST116") {
      throw new ProfileNotFoundError("Profile not found; use POST /api/profile to create");
    }

    if (error) {
      console.error(`Failed to update profile for user ${userId}:`, error);
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    if (!data) {
      throw new Error("Profile updated but no data returned");
    }

    return data;
  }
}
