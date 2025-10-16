import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { EventType, EventDTO, CreateEventCommand } from "../../types";

/**
 * Events Service
 * Handles logging of application events to the events table
 */
export class EventsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create an event in the events table
   * Used by POST /api/events endpoint and internally by other endpoints
   *
   * Note: Events are for analytics only. Per RLS policy, users can insert but not read events.
   * Returns void on success to comply with RLS restrictions.
   *
   * @param userId - The user ID (from auth session)
   * @param input - Event data (type and optional payload)
   * @returns void on success
   * @throws Error if database insert fails
   */
  async createEvent(
    userId: string,
    input: CreateEventCommand
  ): Promise<void> {
    const { error } = await this.supabase
      .from("events")
      .insert({
        user_id: userId,
        type: input.type,
        payload: input.payload ?? null,
      });

    if (error) {
      console.error(`Failed to create event ${input.type} for user ${userId}:`, error);
      throw new Error(`Failed to create event: ${error.message}`);
    }
  }

  /**
   * Count events of a specific type for a user within a time window
   * Used for rate limiting
   * @param userId - The user ID
   * @param type - Event type to count
   * @param windowMinutes - Time window in minutes (default: 60)
   * @returns Number of events in the window
   */
  async countEventsInWindow(userId: string, type: EventType, windowMinutes: number = 60): Promise<number> {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    const { count, error } = await this.supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", type)
      .gte("occurred_at", windowStart);

    if (error) {
      console.error(`Failed to count events ${type} for user ${userId}:`, error);
      throw new Error(`Failed to count events: ${error.message}`);
    }

    return count ?? 0;
  }

  /**
   * Truncate prompt for logging (privacy-preserving)
   * Only stores first N characters as preview
   * @param prompt - Full prompt text
   * @param maxLength - Maximum length for preview (default: 256)
   * @returns Truncated prompt
   */
  static truncatePrompt(prompt: string, maxLength: number = 256): string {
    if (prompt.length <= maxLength) {
      return prompt;
    }
    return prompt.slice(0, maxLength) + "...";
  }
}
