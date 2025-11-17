import { v4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { L as LanguageCodeSchema } from '../../chunks/profile.schema_CiYfmczZ.mjs';
import { S as SaveRecipeCommandSchema } from '../../chunks/recipe.schema_DxgUKZEZ.mjs';
import { R as RecipesService } from '../../chunks/recipes.service_Dyak_kd_.mjs';
import { E as EventsService } from '../../chunks/events.service_BC3NX19O.mjs';
export { renderers } from '../../renderers.mjs';

const RecipeSortOrderSchema = z.enum(["recent", "oldest"], {
  errorMap: () => ({ message: "Sort must be 'recent' or 'oldest'" })
});
const RecipeListQuerySchema = z.object({
  // Full-text search across title, summary, ingredients
  search: z.string().trim().max(200, "Search query too long (max 200 characters)").optional().transform((val) => val && val.length > 0 ? val : void 0),
  // Comma-separated tags for OR filtering
  tags: z.string().trim().max(200, "Tags parameter too long (max 200 characters)").optional().transform((val) => {
    if (!val || val.length === 0) return void 0;
    return val.toLowerCase().split(",").map((t) => t.trim()).filter((t) => t.length > 0);
  }),
  // Sort order (default: recent)
  sort: RecipeSortOrderSchema.default("recent"),
  // Pagination limit (default: 20, range: 1-100)
  limit: z.string().optional().default("20").transform((val) => parseInt(val, 10)).pipe(z.number().int().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100")),
  // Cursor-based pagination (Base64 encoded "created_at:id")
  cursor: z.string().trim().optional().transform((val) => val && val.length > 0 ? val : void 0),
  // Offset-based pagination (alternative to cursor)
  offset: z.string().optional().transform((val) => val && val.length > 0 ? parseInt(val, 10) : void 0).pipe(z.number().int().nonnegative("Offset must be non-negative").optional()),
  // Language filter (optional - show only recipes in specific language)
  lang: LanguageCodeSchema.optional()
}).strict().refine(
  (data) => {
    return !(data.cursor !== void 0 && data.offset !== void 0);
  },
  {
    message: "Cannot use both 'cursor' and 'offset' parameters",
    path: ["cursor"]
  }
);

const prerender = false;
const GET = async ({ request, url }) => {
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
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validation = RecipeListQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const details = validation.error.errors.reduce(
        (acc, err) => {
          const field = err.path.join(".");
          acc[field] = err.message;
          return acc;
        },
        {}
      );
      return jsonError(400, "Bad Request", "Invalid query parameters", details, requestId);
    }
    const validatedQuery = validation.data;
    const recipesService = new RecipesService(supabase);
    let response;
    try {
      response = await recipesService.listRecipes(userId, validatedQuery);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("Invalid cursor")) {
        return jsonError(400, "Bad Request", errorMessage, { cursor: "Invalid cursor format or data" }, requestId);
      }
      console.error(`Database error listing recipes for user ${userId}:`, error);
      return jsonError(500, "Internal Server Error", "Failed to fetch recipes", void 0, requestId);
    }
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/recipes:", error);
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
    const validation = SaveRecipeCommandSchema.safeParse(body);
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
    const recipeCommand = validation.data;
    const recipesService = new RecipesService(supabase);
    let savedRecipe;
    try {
      savedRecipe = await recipesService.saveRecipe(userId, recipeCommand);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
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
      console.error(`Failed to save recipe for user ${userId}:`, error);
      return jsonError(500, "Internal Server Error", "Failed to save recipe", void 0, requestId);
    }
    try {
      const eventsService = new EventsService(supabase);
      await eventsService.createEvent(userId, {
        type: "recipe_saved",
        payload: {
          recipe_id: savedRecipe.id,
          title: savedRecipe.title,
          tags: savedRecipe.tags,
          language: recipeCommand.language,
          request_id: requestId
        }
      });
    } catch (error) {
      console.error(`Failed to log recipe_saved event for user ${userId}:`, error);
    }
    return new Response(JSON.stringify(savedRecipe), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Content-Language": recipeCommand.language,
        Location: `/api/recipes/${savedRecipe.id}`,
        "X-Request-ID": requestId
      }
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/recipes:", error);
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
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
