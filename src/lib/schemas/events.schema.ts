import { z } from "zod";

/**
 * Event Type Schema
 * Must match EventType in src/types.ts and CHECK constraint in database
 */
const EventTypeSchema = z.enum([
  "session_start",
  "profile_edited",
  "ai_prompt_sent",
  "ai_recipe_generated",
  "recipe_saved",
]);

/**
 * Payload size limit in bytes (8 KB)
 * Prevents excessive payload sizes that could impact database performance
 */
const MAX_PAYLOAD_SIZE = 8192;

/**
 * Create Event Command Schema
 * Validates the body of POST /api/events
 *
 * Rules:
 * - type: Must be one of the allowed EventType values
 * - payload: Optional JSON data, limited to 8 KB when serialized
 */
export const CreateEventCommandSchema = z
  .object({
    type: EventTypeSchema,
    payload: z.any().optional(),
  })
  .strict()
  .refine(
    (data) => {
      // If no payload, always valid
      if (!data.payload) return true;

      // Check serialized size
      try {
        const serialized = JSON.stringify(data.payload);
        return serialized.length <= MAX_PAYLOAD_SIZE;
      } catch {
        // If JSON.stringify fails, it's invalid JSON
        return false;
      }
    },
    {
      message: `Payload size must not exceed ${MAX_PAYLOAD_SIZE} bytes when serialized`,
      path: ["payload"],
    }
  );

/**
 * Type inference for CreateEventCommand after Zod validation
 */
export type CreateEventCommandInput = z.infer<typeof CreateEventCommandSchema>;
