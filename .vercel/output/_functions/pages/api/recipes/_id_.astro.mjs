import { v4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { R as RecipesService } from '../../../chunks/recipes.service_Dyak_kd_.mjs';
export { renderers } from '../../../renderers.mjs';

const UuidSchema = z.string().uuid({
  message: "Invalid UUID format"
});

const prerender = false;
const GET = async ({ request, params }) => {
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
    const idValidation = UuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      const details = {
        id: idValidation.error.errors.map((e) => e.message).join(", ")
      };
      return jsonError(400, "Bad Request", "Invalid recipe ID format", details, requestId);
    }
    const recipeId = idValidation.data;
    const recipesService = new RecipesService(supabase);
    let recipe;
    try {
      recipe = await recipesService.getRecipeDetails(recipeId, userId);
    } catch (error) {
      console.error(`Database error fetching recipe ${recipeId}:`, error);
      return jsonError(500, "Internal Server Error", "Failed to fetch recipe", void 0, requestId);
    }
    if (!recipe) {
      return jsonError(404, "Not Found", "Recipe not found", void 0, requestId);
    }
    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Language": recipe.language,
        "Cache-Control": "no-store"
        // Private user data - don't cache
      }
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/recipes/:id:", error);
    return jsonError(500, "Internal Server Error", "An unexpected error occurred", void 0, requestId);
  }
};
const DELETE = async ({ request, params }) => {
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
    const idValidation = UuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      const details = {
        id: idValidation.error.errors.map((e) => e.message).join(", ")
      };
      return jsonError(400, "Bad Request", "Invalid recipe ID format", details, requestId);
    }
    const recipeId = idValidation.data;
    const recipesService = new RecipesService(supabase);
    let deleted;
    try {
      deleted = await recipesService.deleteRecipe(recipeId, userId);
    } catch (error) {
      console.error(`Database error deleting recipe ${recipeId}:`, error);
      return jsonError(500, "Internal Server Error", "Failed to delete recipe", void 0, requestId);
    }
    if (!deleted) {
      return jsonError(404, "Not Found", "Recipe not found", void 0, requestId);
    }
    return new Response(null, {
      status: 204,
      headers: {
        "Cache-Control": "no-store"
        // Private user data - don't cache
      }
    });
  } catch (error) {
    console.error("Unexpected error in DELETE /api/recipes/:id:", error);
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
  DELETE,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
