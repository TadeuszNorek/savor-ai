import type { APIRoute } from "astro";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { CreateProfileCommandSchema, UpdateProfileCommandSchema } from "../../../lib/schemas/profile.schema";
import { ProfilesService, ProfileConflictError, ProfileNotFoundError } from "../../../lib/services/profiles.service";
import { EventsService } from "../../../lib/services/events.service";
import type { ApiError, CreateProfileCommand, UpdateProfileCommand, ProfileDTO } from "../../../types";
import type { Database } from "../../../db/database.types";

// Disable prerendering for this endpoint (SSR only)
export const prerender = false;

/**
 * GET /api/profile
 * Retrieve dietary preferences profile for authenticated user
 *
 * Authentication: Required (Bearer token)
 * Response: 200 OK with ProfileDTO
 * Errors:
 * - 401 Unauthorized: Missing or invalid token
 * - 404 Not Found: Profile doesn't exist (use POST to create)
 * - 500 Internal Server Error: Database errors
 */
export const GET: APIRoute = async ({ request, locals }) => {
  const requestId = uuidv4();

  try {
    // ========================================================================
    // 1. Authentication - Verify Bearer token
    // ========================================================================
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonError(
        401,
        "Unauthorized",
        "Missing or invalid authorization header",
        undefined,
        requestId
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // Create Supabase client with user's token for RLS to work
    const supabase = createClient<Database>(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Verify token and get user
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData?.user) {
      return jsonError(401, "Unauthorized", "Invalid or expired token", undefined, requestId);
    }

    const userId = userData.user.id;

    // ========================================================================
    // 2. Fetch profile via service
    // ========================================================================
    const profilesService = new ProfilesService(supabase);
    let profile: ProfileDTO | null;

    try {
      profile = await profilesService.getProfile(userId);
    } catch (error) {
      // General database error
      console.error(`Failed to fetch profile for user ${userId}:`, error);
      return jsonError(
        500,
        "Internal Server Error",
        "Failed to fetch profile",
        undefined,
        requestId
      );
    }

    // ========================================================================
    // 3. Handle profile not found
    // ========================================================================
    if (!profile) {
      return jsonError(
        404,
        "Not Found",
        "Profile not found; use POST /api/profile to create",
        undefined,
        requestId
      );
    }

    // ========================================================================
    // 4. Return success response (200 OK)
    // ========================================================================
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Request-ID": requestId,
      },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in GET /api/profile:", error);
    return jsonError(
      500,
      "Internal Server Error",
      "An unexpected error occurred",
      undefined,
      requestId
    );
  }
};

/**
 * POST /api/profile
 * Create initial dietary preferences profile for authenticated user
 *
 * Authentication: Required (Bearer token)
 * Request Body: CreateProfileCommand (all fields optional)
 * - diet_type: DietType enum (optional)
 * - disliked_ingredients: string[] (optional, normalized to lowercase)
 * - preferred_cuisines: string[] (optional, normalized to lowercase)
 *
 * Response: 201 Created with ProfileDTO
 * Errors:
 * - 400 Bad Request: Invalid JSON or validation errors
 * - 401 Unauthorized: Missing or invalid token
 * - 409 Conflict: Profile already exists (use PUT /api/profile)
 * - 500 Internal Server Error: Database errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const requestId = uuidv4();

  try {
    // ========================================================================
    // 1. Authentication - Verify Bearer token
    // ========================================================================
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonError(
        401,
        "Unauthorized",
        "Missing or invalid authorization header",
        undefined,
        requestId
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // Create Supabase client with user's token for RLS to work
    const supabase = createClient<Database>(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Verify token and get user
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData?.user) {
      return jsonError(401, "Unauthorized", "Invalid or expired token", undefined, requestId);
    }

    const userId = userData.user.id;

    // ========================================================================
    // 2. Parse and validate request body
    // ========================================================================
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return jsonError(400, "Bad Request", "Invalid JSON in request body", undefined, requestId);
    }

    const validation = CreateProfileCommandSchema.safeParse(body);
    if (!validation.success) {
      const details = validation.error.errors.reduce(
        (acc, err) => {
          const field = err.path.join(".");
          acc[field] = err.message;
          return acc;
        },
        {} as Record<string, string>
      );

      return jsonError(400, "Bad Request", "Validation failed", details, requestId);
    }

    const profileCommand = validation.data as CreateProfileCommand;

    // ========================================================================
    // 3. Create profile via service
    // ========================================================================
    const profilesService = new ProfilesService(supabase);
    let profile: ProfileDTO;

    try {
      profile = await profilesService.createProfile(userId, profileCommand);
    } catch (error) {
      // Handle profile conflict (already exists)
      if (error instanceof ProfileConflictError) {
        return jsonError(
          409,
          "Conflict",
          "Profile already exists; use PUT /api/profile to update",
          undefined,
          requestId
        );
      }

      // General database error
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Failed to create profile for user ${userId}:`, error);
      return jsonError(
        500,
        "Internal Server Error",
        "Failed to create profile",
        undefined,
        requestId
      );
    }

    // ========================================================================
    // 4. Log profile_edited event (best-effort, non-blocking)
    // ========================================================================
    try {
      const eventsService = new EventsService(supabase);
      await eventsService.createEvent(userId, {
        type: "profile_edited",
        payload: {
          action: "created",
          request_id: requestId,
        },
      });
    } catch (error) {
      // Log error but don't block response
      console.error(`Failed to log profile_edited event for user ${userId}:`, error);
    }

    // ========================================================================
    // 5. Return success response (201 Created)
    // ========================================================================
    return new Response(JSON.stringify(profile), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
      },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in POST /api/profile:", error);
    return jsonError(
      500,
      "Internal Server Error",
      "An unexpected error occurred",
      undefined,
      requestId
    );
  }
};

/**
 * PUT /api/profile
 * Update dietary preferences profile for authenticated user
 *
 * Authentication: Required (Bearer token)
 * Request Body: UpdateProfileCommand (at least one field required)
 * - diet_type: DietType enum (optional, can be null to clear)
 * - disliked_ingredients: string[] (optional, normalized to lowercase)
 * - preferred_cuisines: string[] (optional, normalized to lowercase)
 *
 * Response: 200 OK with updated ProfileDTO
 * Errors:
 * - 400 Bad Request: Invalid JSON, validation errors, or no fields provided
 * - 401 Unauthorized: Missing or invalid token
 * - 404 Not Found: Profile doesn't exist (use POST to create)
 * - 500 Internal Server Error: Database errors
 */
export const PUT: APIRoute = async ({ request, locals }) => {
  const requestId = uuidv4();

  try {
    // ========================================================================
    // 1. Authentication - Verify Bearer token
    // ========================================================================
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonError(
        401,
        "Unauthorized",
        "Missing or invalid authorization header",
        undefined,
        requestId
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // Create Supabase client with user's token for RLS to work
    const supabase = createClient<Database>(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Verify token and get user
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData?.user) {
      return jsonError(401, "Unauthorized", "Invalid or expired token", undefined, requestId);
    }

    const userId = userData.user.id;

    // ========================================================================
    // 2. Parse and validate request body
    // ========================================================================
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return jsonError(400, "Bad Request", "Invalid JSON in request body", undefined, requestId);
    }

    const validation = UpdateProfileCommandSchema.safeParse(body);
    if (!validation.success) {
      const details = validation.error.errors.reduce(
        (acc, err) => {
          const field = err.path.join(".");
          acc[field] = err.message;
          return acc;
        },
        {} as Record<string, string>
      );

      return jsonError(400, "Bad Request", "Validation failed", details, requestId);
    }

    const profileCommand = validation.data as UpdateProfileCommand;

    // ========================================================================
    // 3. Update profile via service
    // ========================================================================
    const profilesService = new ProfilesService(supabase);
    let profile: ProfileDTO;

    try {
      profile = await profilesService.updateProfile(userId, profileCommand);
    } catch (error) {
      // Handle profile not found
      if (error instanceof ProfileNotFoundError) {
        return jsonError(
          404,
          "Not Found",
          "Profile not found; use POST /api/profile to create",
          undefined,
          requestId
        );
      }

      // General database error
      console.error(`Failed to update profile for user ${userId}:`, error);
      return jsonError(
        500,
        "Internal Server Error",
        "Failed to update profile",
        undefined,
        requestId
      );
    }

    // ========================================================================
    // 4. Log profile_edited event (best-effort, non-blocking)
    // ========================================================================
    try {
      const eventsService = new EventsService(supabase);
      const changedFields = Object.keys(profileCommand);
      await eventsService.createEvent(userId, {
        type: "profile_edited",
        payload: {
          action: "updated",
          changed_fields: changedFields,
          request_id: requestId,
        },
      });
    } catch (error) {
      // Log error but don't block response
      console.error(`Failed to log profile_edited event for user ${userId}:`, error);
    }

    // ========================================================================
    // 5. Return success response (200 OK)
    // ========================================================================
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Request-ID": requestId,
      },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in PUT /api/profile:", error);
    return jsonError(
      500,
      "Internal Server Error",
      "An unexpected error occurred",
      undefined,
      requestId
    );
  }
};

/**
 * Helper function to create JSON error responses
 */
function jsonError(
  status: number,
  error: string,
  message: string,
  details?: Record<string, unknown>,
  requestId?: string
): Response {
  const body: ApiError = {
    error,
    message,
    details,
    request_id: requestId,
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
