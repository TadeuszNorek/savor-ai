import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

/**
 * POST /api/auth/logout
 * Signs out the current user and clears session cookies
 *
 * Response 200:
 * null
 *
 * Response 400:
 * {
 *   "error": string
 * }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      return new Response(JSON.stringify({ error: "Logout failed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return success
    return new Response(null, { status: 200 });
  } catch (err) {
    console.error("Logout error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
