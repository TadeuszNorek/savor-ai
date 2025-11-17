import { v4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { C as CreateProfileCommandSchema, U as UpdateProfileCommandSchema } from '../../chunks/profile.schema_CiYfmczZ.mjs';
import { E as EventsService } from '../../chunks/events.service_BC3NX19O.mjs';
export { renderers } from '../../renderers.mjs';

class ProfileConflictError extends Error {
  constructor(message = "Profile already exists") {
    super(message);
    this.name = "ProfileConflictError";
  }
}
class ProfileNotFoundError extends Error {
  constructor(message = "Profile not found") {
    super(message);
    this.name = "ProfileNotFoundError";
  }
}
class ProfilesService {
  constructor(supabase) {
    this.supabase = supabase;
  }
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
  async createProfile(userId, command) {
    const { data, error } = await this.supabase.from("profiles").insert({
      user_id: userId,
      diet_type: command.diet_type ?? null,
      disliked_ingredients: command.disliked_ingredients ?? [],
      preferred_cuisines: command.preferred_cuisines ?? []
    }).select("*").single();
    if (error) {
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
  async getProfile(userId) {
    const { data, error } = await this.supabase.from("profiles").select("*").eq("user_id", userId).single();
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
  async updateProfile(userId, command) {
    const updateFields = {
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (command.diet_type !== void 0) {
      updateFields.diet_type = command.diet_type;
    }
    if (command.disliked_ingredients !== void 0) {
      updateFields.disliked_ingredients = command.disliked_ingredients;
    }
    if (command.preferred_cuisines !== void 0) {
      updateFields.preferred_cuisines = command.preferred_cuisines;
    }
    const { data, error } = await this.supabase.from("profiles").update(updateFields).eq("user_id", userId).select("*").single();
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

const prerender = false;
const GET = async ({ request }) => {
  const requestId = v4();
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonError(401, "Unauthorized", "Missing or invalid authorization header", void 0, requestId);
    }
    const token = authHeader.replace("Bearer ", "").trim();
    const supabase = createClient("https://oefboqgqosdzebdheypd.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZmJvcWdxb3NkemViZGhleXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5ODY1MjIsImV4cCI6MjA3NTU2MjUyMn0.ByADk4BoOO1c6CwlYCydfhYmeDNp2YyUhBMg12t1BdM", {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return jsonError(401, "Unauthorized", "Invalid or expired token", void 0, requestId);
    }
    const userId = userData.user.id;
    const profilesService = new ProfilesService(supabase);
    let profile;
    try {
      profile = await profilesService.getProfile(userId);
    } catch (error) {
      console.error(`Failed to fetch profile for user ${userId}:`, error);
      return jsonError(500, "Internal Server Error", "Failed to fetch profile", void 0, requestId);
    }
    if (!profile) {
      return jsonError(404, "Not Found", "Profile not found; use POST /api/profile to create", void 0, requestId);
    }
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Request-ID": requestId
      }
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/profile:", error);
    return jsonError(500, "Internal Server Error", "An unexpected error occurred", void 0, requestId);
  }
};
const POST = async ({ request }) => {
  const requestId = v4();
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonError(401, "Unauthorized", "Missing or invalid authorization header", void 0, requestId);
    }
    const token = authHeader.replace("Bearer ", "").trim();
    const supabase = createClient("https://oefboqgqosdzebdheypd.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZmJvcWdxb3NkemViZGhleXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5ODY1MjIsImV4cCI6MjA3NTU2MjUyMn0.ByADk4BoOO1c6CwlYCydfhYmeDNp2YyUhBMg12t1BdM", {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return jsonError(401, "Unauthorized", "Invalid or expired token", void 0, requestId);
    }
    const userId = userData.user.id;
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, "Bad Request", "Invalid JSON in request body", void 0, requestId);
    }
    const validation = CreateProfileCommandSchema.safeParse(body);
    if (!validation.success) {
      const details = validation.error.errors.reduce(
        (acc, err) => {
          const field = err.path.join(".");
          acc[field] = err.message;
          return acc;
        },
        {}
      );
      return jsonError(400, "Bad Request", "Validation failed", details, requestId);
    }
    const profileCommand = validation.data;
    const profilesService = new ProfilesService(supabase);
    let profile;
    try {
      profile = await profilesService.createProfile(userId, profileCommand);
    } catch (error) {
      if (error instanceof ProfileConflictError) {
        return jsonError(
          409,
          "Conflict",
          "Profile already exists; use PUT /api/profile to update",
          void 0,
          requestId
        );
      }
      console.error(`Failed to create profile for user ${userId}:`, error);
      return jsonError(500, "Internal Server Error", "Failed to create profile", void 0, requestId);
    }
    try {
      const eventsService = new EventsService(supabase);
      await eventsService.createEvent(userId, {
        type: "profile_edited",
        payload: {
          action: "created",
          request_id: requestId
        }
      });
    } catch (error) {
      console.error(`Failed to log profile_edited event for user ${userId}:`, error);
    }
    return new Response(JSON.stringify(profile), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId
      }
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/profile:", error);
    return jsonError(500, "Internal Server Error", "An unexpected error occurred", void 0, requestId);
  }
};
const PUT = async ({ request }) => {
  const requestId = v4();
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonError(401, "Unauthorized", "Missing or invalid authorization header", void 0, requestId);
    }
    const token = authHeader.replace("Bearer ", "").trim();
    const supabase = createClient("https://oefboqgqosdzebdheypd.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZmJvcWdxb3NkemViZGhleXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5ODY1MjIsImV4cCI6MjA3NTU2MjUyMn0.ByADk4BoOO1c6CwlYCydfhYmeDNp2YyUhBMg12t1BdM", {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return jsonError(401, "Unauthorized", "Invalid or expired token", void 0, requestId);
    }
    const userId = userData.user.id;
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonError(400, "Bad Request", "Invalid JSON in request body", void 0, requestId);
    }
    const validation = UpdateProfileCommandSchema.safeParse(body);
    if (!validation.success) {
      const details = validation.error.errors.reduce(
        (acc, err) => {
          const field = err.path.join(".");
          acc[field] = err.message;
          return acc;
        },
        {}
      );
      return jsonError(400, "Bad Request", "Validation failed", details, requestId);
    }
    const profileCommand = validation.data;
    const profilesService = new ProfilesService(supabase);
    let profile;
    try {
      profile = await profilesService.updateProfile(userId, profileCommand);
    } catch (error) {
      if (error instanceof ProfileNotFoundError) {
        return jsonError(404, "Not Found", "Profile not found; use POST /api/profile to create", void 0, requestId);
      }
      console.error(`Failed to update profile for user ${userId}:`, error);
      return jsonError(500, "Internal Server Error", "Failed to update profile", void 0, requestId);
    }
    try {
      const eventsService = new EventsService(supabase);
      const changedFields = Object.keys(profileCommand);
      await eventsService.createEvent(userId, {
        type: "profile_edited",
        payload: {
          action: "updated",
          changed_fields: changedFields,
          request_id: requestId
        }
      });
    } catch (error) {
      console.error(`Failed to log profile_edited event for user ${userId}:`, error);
    }
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Request-ID": requestId
      }
    });
  } catch (error) {
    console.error("Unexpected error in PUT /api/profile:", error);
    return jsonError(500, "Internal Server Error", "An unexpected error occurred", void 0, requestId);
  }
};
function jsonError(status, error, message, details, requestId) {
  const body = {
    error,
    message,
    details,
    request_id: requestId
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST,
  PUT,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
