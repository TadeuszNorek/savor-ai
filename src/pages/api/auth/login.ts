import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

/**
 * POST /api/auth/login
 * Authenticates user with email and password
 *
 * Request body:
 * {
 *   "email": string,
 *   "password": string
 * }
 *
 * Response 200:
 * {
 *   "user": {
 *     "id": string,
 *     "email": string
 *   }
 * }
 *
 * Response 400:
 * {
 *   "error": string
 * }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Supabase server instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Map Supabase errors to user-friendly messages
      let message = "Authentication failed";

      if (error.message.includes("Invalid login credentials")) {
        message = "Invalid email or password";
      } else if (error.message.includes("Email not confirmed")) {
        message = "Please verify your email address";
      } else if (error.message.includes("rate")) {
        message = "Too many attempts. Please try again later";
      }

      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return user data
    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Login error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
