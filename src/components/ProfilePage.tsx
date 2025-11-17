import { useState, useEffect } from "react";
import QueryProvider from "./QueryProvider";
import { I18nProvider } from "../lib/contexts/I18nContext";
import ProfileView from "./ProfileView";
import { Toaster } from "./ui/sonner";
import { supabaseClient } from "../db/supabase.client";

/**
 * ProfilePage Component
 *
 * Client-side only wrapper for the profile view.
 * Combines I18nProvider, QueryProvider, ProfileView, and Toaster into a single island.
 *
 * @component
 */
export default function ProfilePage() {
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session token
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setAuthToken(session?.access_token ?? null);
    });

    // Subscribe to auth state changes to update token
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setAuthToken(session?.access_token ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <I18nProvider authToken={authToken}>
      <QueryProvider>
        <ProfileView />
        <Toaster />
      </QueryProvider>
    </I18nProvider>
  );
}
