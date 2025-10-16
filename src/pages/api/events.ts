import type { APIRoute } from "astro";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { CreateEventCommandSchema } from "../../lib/schemas/events.schema";
import { EventsService } from "../../lib/services/events.service";
import type { ApiError } from "../../types";
import type { Database } from "../../db/database.types";

// Disable prerendering for this endpoint (SSR only)
export const prerender = false;

/**
 * POST /api/events
 * Log an event explicitly from the client
 *
 * Authentication: Required (Bearer token)
 * Primary use: Client-side logging of session_start events
 * Other events (profile_edited, ai_prompt_sent, etc.) are typically logged server-side
 *
 * Request Body: { type: EventType, payload?: Json }
 * Response: 201 Created with EventDTO
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

    const validation = CreateEventCommandSchema.safeParse(body);
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

    const eventInput = validation.data;

    // ========================================================================
    // 3. Create event in database
    // ========================================================================
    const eventsService = new EventsService(supabase);

    try {
      await eventsService.createEvent(userId, eventInput);
    } catch (error) {
      console.error(`Failed to create event for user ${userId}:`, error);
      return jsonError(
        500,
        "Internal Server Error",
        "Failed to create event",
        undefined,
        requestId
      );
    }

    // ========================================================================
    // 4. Return success response (204 No Content)
    // ========================================================================
    // Note: Events are for analytics only. Per RLS policy, we don't return event data.
    // 204 No Content is appropriate for successful creation without response body.
    return new Response(null, {
      status: 204,
      headers: {
        "X-Request-ID": requestId,
      },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    console.error("Unexpected error in POST /api/events:", error);
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
