import { supabaseClient } from "../../db/supabase.client";

/**
 * SessionStorage key for tracking if session_start event was sent
 */
const SESSION_START_KEY = "session_start_logged";

/**
 * Send session_start event to analytics
 *
 * Best-effort: Does not throw errors, logs failures to console.
 * Requires authenticated user session.
 *
 * @returns Promise that resolves when event is sent (or fails silently)
 */
export async function sendSessionStartEvent(): Promise<void> {
  try {
    // Get current session and access token
    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();

    if (sessionError || !session?.access_token) {
      console.debug("Cannot send session_start event: No valid session");
      return;
    }

    // Send event to /api/events
    const response = await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        type: "session_start",
      }),
    });

    if (!response.ok) {
      console.debug(
        `session_start event failed: ${response.status} ${response.statusText}`
      );
    } else {
      console.debug("session_start event sent successfully");
    }
  } catch (error) {
    // Best-effort: Log and ignore errors
    console.debug("Failed to send session_start event:", error);
  }
}

/**
 * Send session_start event on cold start (if not already sent in this browser session)
 *
 * Uses sessionStorage to track if event was already sent.
 * Best-effort: Does not throw errors.
 *
 * @returns Promise that resolves when event is sent or skipped
 */
export async function sendSessionStartOnColdStart(): Promise<void> {
  try {
    // Check if already sent in this browser session
    if (sessionStorage.getItem(SESSION_START_KEY) === "1") {
      console.debug("session_start event already sent in this session");
      return;
    }

    // Send event
    await sendSessionStartEvent();

    // Mark as sent
    sessionStorage.setItem(SESSION_START_KEY, "1");
  } catch (error) {
    // Best-effort: Ignore sessionStorage errors
    console.debug("Failed to track session_start in sessionStorage:", error);
  }
}

/**
 * Clear session_start tracking flag
 * Call this on logout to allow fresh tracking on next login
 */
export function clearSessionStartTracking(): void {
  try {
    sessionStorage.removeItem(SESSION_START_KEY);
  } catch (error) {
    console.debug("Failed to clear session_start tracking:", error);
  }
}
