import type { APIRoute } from "astro";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { UuidSchema } from "../../../lib/schemas/common.schema";
import { RecipesService } from "../../../lib/services/recipes.service";
import type { ApiError, RecipeDetailsDTO } from "../../../types";
import type { Database } from "../../../db/database.types";

// Disable prerendering for this endpoint (SSR only)
export const prerender = false;

/**
 * GET /api/recipes/:id
 * Get recipe details by ID
 *
 * Authentication: Required (Bearer token)
 * Authorization: User can only access their own recipes
 * Response: RecipeDetailsDTO with full recipe JSONB
 */
export const GET: APIRoute = async ({ request, params, locals }) => {
  const requestId = uuidv4();

  try {
    // ========================================================================
    // 1. Authentication - Verify Bearer token
    // ========================================================================
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonError(401, "Unauthorized", "Missing or invalid authorization header", undefined, requestId);
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
    // 2. Validate recipe ID parameter (must be UUID)
    // ========================================================================
    const idValidation = UuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      const details = {
        id: idValidation.error.errors.map((e) => e.message).join(", "),
      };
      return jsonError(400, "Bad Request", "Invalid recipe ID format", details, requestId);
    }

    const recipeId = idValidation.data;

    // ========================================================================
    // 3. Fetch recipe from database
    // ========================================================================
    const recipesService = new RecipesService(supabase);
    let recipe: RecipeDetailsDTO | null;

    try {
      recipe = await recipesService.getRecipeDetails(recipeId, userId);
    } catch (error) {
      // Database error
      console.error(`Database error fetching recipe ${recipeId}:`, error);
      return jsonError(500, "Internal Server Error", "Failed to fetch recipe", undefined, requestId);
    }

    // ========================================================================
    // 4. Handle not found (recipe doesn't exist or doesn't belong to user)
    // ========================================================================
    if (!recipe) {
      // Don't reveal if recipe exists but belongs to another user
      return jsonError(404, "Not Found", "Recipe not found", undefined, requestId);
    }

    // ========================================================================
    // 5. Return success response
    // ========================================================================
    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store", // Private user data - don't cache
      },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in GET /api/recipes/:id:", error);
    return jsonError(500, "Internal Server Error", "An unexpected error occurred", undefined, requestId);
  }
};

/**
 * DELETE /api/recipes/:id
 * Delete a recipe by ID (hard delete)
 *
 * Authentication: Required (Bearer token)
 * Authorization: User can only delete their own recipes
 * Response: 204 No Content on success
 */
export const DELETE: APIRoute = async ({ request, params, locals }) => {
  const requestId = uuidv4();

  try {
    // ========================================================================
    // 1. Authentication - Verify Bearer token
    // ========================================================================
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonError(401, "Unauthorized", "Missing or invalid authorization header", undefined, requestId);
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
    // 2. Validate recipe ID parameter (must be UUID)
    // ========================================================================
    const idValidation = UuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      const details = {
        id: idValidation.error.errors.map((e) => e.message).join(", "),
      };
      return jsonError(400, "Bad Request", "Invalid recipe ID format", details, requestId);
    }

    const recipeId = idValidation.data;

    // ========================================================================
    // 3. Delete recipe from database
    // ========================================================================
    const recipesService = new RecipesService(supabase);
    let deleted: boolean;

    try {
      deleted = await recipesService.deleteRecipe(recipeId, userId);
    } catch (error) {
      // Database error
      console.error(`Database error deleting recipe ${recipeId}:`, error);
      return jsonError(500, "Internal Server Error", "Failed to delete recipe", undefined, requestId);
    }

    // ========================================================================
    // 4. Handle not found (recipe doesn't exist or doesn't belong to user)
    // ========================================================================
    if (!deleted) {
      // Don't reveal if recipe exists but belongs to another user
      return jsonError(404, "Not Found", "Recipe not found", undefined, requestId);
    }

    // ========================================================================
    // 5. Return success response
    // ========================================================================
    return new Response(null, {
      status: 204,
      headers: {
        "Cache-Control": "no-store", // Private user data - don't cache
      },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in DELETE /api/recipes/:id:", error);
    return jsonError(500, "Internal Server Error", "An unexpected error occurred", undefined, requestId);
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
