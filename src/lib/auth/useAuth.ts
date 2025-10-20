import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseClient } from "../../db/supabase.client";
import { sendSessionStartOnColdStart } from "./telemetry";

/**
 * Authentication state
 */
export interface AuthState {
  user: User | null;
  loading: boolean;
}

/**
 * useAuth Hook
 *
 * Client-side hook for accessing current user session.
 * Automatically subscribes to auth state changes.
 *
 * @returns Current user and loading state
 *
 * @example
 * const { user, loading } = useAuth();
 * if (loading) return <Spinner />;
 * if (user) return <div>Welcome {user.email}</div>;
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Send session_start event on cold start (if session exists and not already sent)
      if (session?.user) {
        sendSessionStartOnColdStart().catch(() => {
          // Ignore telemetry errors - don't block UX
        });
      }
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
