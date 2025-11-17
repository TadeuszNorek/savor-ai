import { v4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { E as EventsService } from '../../chunks/events.service_BC3NX19O.mjs';
export { renderers } from '../../renderers.mjs';

const EventTypeSchema = z.enum([
  "session_start",
  "profile_edited",
  "ai_prompt_sent",
  "ai_recipe_generated",
  "recipe_saved"
]);
const MAX_PAYLOAD_SIZE = 8192;
const CreateEventCommandSchema = z.object({
  type: EventTypeSchema,
  payload: z.any().optional()
}).strict().refine(
  (data) => {
    if (!data.payload) return true;
    try {
      const serialized = JSON.stringify(data.payload);
      return serialized.length <= MAX_PAYLOAD_SIZE;
    } catch {
      return false;
    }
  },
  {
    message: `Payload size must not exceed ${MAX_PAYLOAD_SIZE} bytes when serialized`,
    path: ["payload"]
  }
);

const prerender = false;
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
    const validation = CreateEventCommandSchema.safeParse(body);
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
    const eventInput = validation.data;
    const eventsService = new EventsService(supabase);
    try {
      await eventsService.createEvent(userId, eventInput);
    } catch (error) {
      console.error(`Failed to create event for user ${userId}:`, error);
      return jsonError(500, "Internal Server Error", "Failed to create event", void 0, requestId);
    }
    return new Response(null, {
      status: 204,
      headers: {
        "X-Request-ID": requestId
      }
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/events:", error);
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
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
