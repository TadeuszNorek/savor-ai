import type { APIRoute } from "astro";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { GenerateRecipeCommandSchema } from "../../../lib/schemas/recipe.schema";
import { AiService } from "../../../lib/services/ai/ai.service";
import { EventsService } from "../../../lib/services/events.service";
import { AiError, AiTimeoutError, AiProviderError } from "../../../lib/services/ai/types";
import type { ApiError, GenerateRecipeResponse } from "../../../types";
import type { Database } from "../../../db/database.types";

// Disable prerendering for this endpoint (SSR only)
export const prerender = false;

/**
 * POST /api/recipes/generate
 * Generate a recipe using AI based on user prompt
 *
 * Authentication: Required (Bearer token)
 * Rate Limit: 10 generations per hour per user
 * Request Body: { prompt: string }
 * Response: { recipe: RecipeSchema, generation_id: string, generated_at: string }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const requestId = uuidv4();

  try {
    // ========================================================================
    // 1. Authentication
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
    // 2. Rate Limiting (429)
    // ========================================================================
    const eventsService = new EventsService(supabase);

    try {
      const generationCount = await eventsService.countEventsInWindow(
        userId,
        "ai_recipe_generated",
        60 // 1 hour window
      );

      if (generationCount >= 10) {
        return jsonError(
          429,
          "Too Many Requests",
          "Generation limit exceeded. Please try again later.",
          { retry_after: 3600 },
          requestId
        );
      }
    } catch (error) {
      console.error("Rate limit check failed:", error);
      // Continue anyway - don't block user due to rate limit check failure
    }

    // ========================================================================
    // 3. Request Body Validation (400)
    // ========================================================================
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return jsonError(400, "Bad Request", "Invalid JSON in request body", undefined, requestId);
    }

    const validation = GenerateRecipeCommandSchema.safeParse(body);
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

    const { prompt } = validation.data;

    // ========================================================================
    // 4. Fetch User Profile (optional)
    // ========================================================================
    let profile;
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      profile = profileData || undefined;
    } catch (error) {
      // Profile is optional, continue without it
      console.log("No profile found for user, continuing without preferences");
    }

    // ========================================================================
    // 5. Log AI Prompt Sent Event
    // ========================================================================
    try {
      await eventsService.createEvent(userId, {
        type: "ai_prompt_sent",
        payload: {
          prompt_preview: EventsService.truncatePrompt(prompt, 256),
          request_id: requestId,
          model: import.meta.env.AI_MODEL,
        },
      });
    } catch (error) {
      console.error("Failed to log ai_prompt_sent event:", error);
      // Continue anyway - event logging failure shouldn't block generation
    }

    // ========================================================================
    // 6. Generate Recipe with AI (with retry)
    // ========================================================================
    let recipe;
    try {
      const aiService = AiService.fromEnv();
      recipe = await aiService.generateRecipe(prompt, profile);
    } catch (error) {
      // Handle AI-specific errors
      if (error instanceof AiTimeoutError) {
        return jsonError(
          503,
          "Service Unavailable",
          "AI service timed out. Please try again.",
          undefined,
          requestId
        );
      }

      if (error instanceof AiProviderError) {
        const statusCode = error.statusCode && error.statusCode >= 500 ? 503 : 500;
        return jsonError(
          statusCode,
          statusCode === 503 ? "Service Unavailable" : "Internal Server Error",
          "Failed to generate recipe. Please try again.",
          undefined,
          requestId
        );
      }

      // Size limit check
      if (error instanceof Error && error.message.includes("exceeds size limit")) {
        return jsonError(
          413,
          "Payload Too Large",
          "Generated recipe is too large. Please try a simpler prompt.",
          undefined,
          requestId
        );
      }

      // Generic AI error
      console.error("AI generation failed:", error);
      return jsonError(
        500,
        "Internal Server Error",
        "Failed to generate recipe. Please try again.",
        undefined,
        requestId
      );
    }

    // ========================================================================
    // 7. Log AI Recipe Generated Event
    // ========================================================================
    const generationId = uuidv4();
    try {
      await eventsService.createEvent(userId, {
        type: "ai_recipe_generated",
        payload: {
          generation_id: generationId,
          title: recipe.title,
          tags: recipe.tags || [],
          request_id: requestId,
        },
      });
    } catch (error) {
      console.error("Failed to log ai_recipe_generated event:", error);
      // Continue anyway - event logging failure shouldn't block response
    }

    // ========================================================================
    // 8. Return Success Response (200)
    // ========================================================================
    const response: GenerateRecipeResponse = {
      recipe,
      generation_id: generationId,
      generated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in /api/recipes/generate:", error);
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
