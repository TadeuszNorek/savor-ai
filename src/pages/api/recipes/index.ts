import type { APIRoute } from "astro";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { RecipeListQuerySchema } from "../../../lib/schemas/recipes.schema";
import { SaveRecipeCommandSchema } from "../../../lib/schemas/recipe.schema";
import { RecipesService } from "../../../lib/services/recipes.service";
import { EventsService } from "../../../lib/services/events.service";
import type {
  ApiError,
  RecipeListResponse,
  RecipeQueryParams,
  SaveRecipeCommand,
  RecipeSummaryDTO,
} from "../../../types";
import type { Database } from "../../../db/database.types";

// Disable prerendering for this endpoint (SSR only)
export const prerender = false;

/**
 * GET /api/recipes
 * List user's recipes with search, filtering, and pagination
 *
 * Authentication: Required (Bearer token)
 * Query Parameters:
 * - search: Full-text search (optional)
 * - tags: Comma-separated tags for OR filtering (optional)
 * - sort: "recent" | "oldest" (default: "recent")
 * - limit: 1-100 (default: 20)
 * - cursor: Base64 cursor for pagination (optional)
 * - offset: Offset pagination alternative (optional)
 *
 * Response: RecipeListResponse with paginated data and metadata
 */
export const GET: APIRoute = async ({ request, url }) => {
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
    const supabase = createClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verify token and get user
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData?.user) {
      return jsonError(401, "Unauthorized", "Invalid or expired token", undefined, requestId);
    }

    const userId = userData.user.id;

    // ========================================================================
    // 2. Parse and validate query parameters
    // ========================================================================
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validation = RecipeListQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      const details = validation.error.errors.reduce(
        (acc, err) => {
          const field = err.path.join(".");
          acc[field] = err.message;
          return acc;
        },
        {} as Record<string, string>
      );

      return jsonError(400, "Bad Request", "Invalid query parameters", details, requestId);
    }

    const validatedQuery = validation.data as RecipeQueryParams;

    // ========================================================================
    // 3. Fetch recipes from database
    // ========================================================================
    const recipesService = new RecipesService(supabase);
    let response: RecipeListResponse;

    try {
      response = await recipesService.listRecipes(userId, validatedQuery);
    } catch (error) {
      // Check if it's a cursor validation error (400) or database error (500)
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("Invalid cursor")) {
        return jsonError(400, "Bad Request", errorMessage, { cursor: "Invalid cursor format or data" }, requestId);
      }

      // Database error
      console.error(`Database error listing recipes for user ${userId}:`, error);
      return jsonError(500, "Internal Server Error", "Failed to fetch recipes", undefined, requestId);
    }

    // ========================================================================
    // 4. Return success response
    // ========================================================================
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in GET /api/recipes:", error);
    return jsonError(500, "Internal Server Error", "An unexpected error occurred", undefined, requestId);
  }
};

/**
 * POST /api/recipes
 * Save a recipe to user's collection
 *
 * Authentication: Required (Bearer token)
 * Request Body: SaveRecipeCommand
 * - recipe: RecipeSchema (required) - full recipe object
 * - tags: string[] (optional) - array of tags (max 20, normalized to lowercase)
 *
 * Response: 201 Created with RecipeSummaryDTO and Location header
 */
export const POST: APIRoute = async ({ request }) => {
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
    const supabase = createClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

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
    } catch {
      return jsonError(400, "Bad Request", "Invalid JSON in request body", undefined, requestId);
    }

    const validation = SaveRecipeCommandSchema.safeParse(body);
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

    const recipeCommand = validation.data as SaveRecipeCommand;

    // ========================================================================
    // 3. Save recipe via service (includes size check, RPC call, etc.)
    // ========================================================================
    const recipesService = new RecipesService(supabase);
    let savedRecipe: RecipeSummaryDTO;

    try {
      savedRecipe = await recipesService.saveRecipe(userId, recipeCommand);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Check for specific error types
      if (errorMessage.includes("Recipe too large")) {
        return jsonError(
          413,
          "Payload Too Large",
          "Recipe exceeds maximum size limit",
          { max_size_bytes: 204800 },
          requestId
        );
      }

      if (errorMessage.includes("disliked ingredient")) {
        return jsonError(
          400,
          "Bad Request",
          "Recipe contains disliked ingredients",
          { message: errorMessage },
          requestId
        );
      }

      // General database/RPC error
      console.error(`Failed to save recipe for user ${userId}:`, error);
      return jsonError(500, "Internal Server Error", "Failed to save recipe", undefined, requestId);
    }

    // ========================================================================
    // 4. Log recipe_saved event (best-effort, non-blocking)
    // ========================================================================
    try {
      const eventsService = new EventsService(supabase);
      await eventsService.createEvent(userId, {
        type: "recipe_saved",
        payload: {
          recipe_id: savedRecipe.id,
          title: savedRecipe.title,
          tags: savedRecipe.tags,
          language: recipeCommand.language,
          request_id: requestId,
        },
      });
    } catch (error) {
      // Log error but don't block response
      console.error(`Failed to log recipe_saved event for user ${userId}:`, error);
    }

    // ========================================================================
    // 5. Return success response (201 Created)
    // ========================================================================
    return new Response(JSON.stringify(savedRecipe), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Content-Language": recipeCommand.language,
        Location: `/api/recipes/${savedRecipe.id}`,
        "X-Request-ID": requestId,
      },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in POST /api/recipes:", error);
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
