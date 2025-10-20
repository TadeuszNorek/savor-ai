import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance, supabaseClient } from "../db/supabase.client.ts";

/**
 * Public paths that don't require authentication
 * Includes login page, password reset pages, and auth API endpoints
 */
const PUBLIC_PATHS = [
  "/login",
  "/auth/forgot",
  "/auth/reset",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
];

/**
 * Authentication middleware
 * - Attaches Supabase client to context.locals
 * - Checks user session for protected routes
 * - Redirects to /login if not authenticated
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, cookies, url, request, redirect } = context;

  // Attach client-side Supabase client to locals (for backward compatibility)
  locals.supabase = supabaseClient;

  // Skip auth check for public paths
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  // Create server-side Supabase instance for authentication
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Get authenticated user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Set user in locals if authenticated
  if (user) {
    locals.user = {
      id: user.id,
      email: user.email,
    };
  } else {
    // Redirect to login for protected routes
    return redirect("/login");
  }

  return next();
});
