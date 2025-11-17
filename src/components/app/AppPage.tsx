import { useState, useEffect } from "react";
import QueryProvider from "../QueryProvider";
import { I18nProvider } from "../../lib/contexts/I18nContext";
import { AppLayout } from "./AppLayout";
import { Toaster } from "../ui/sonner";
import { supabaseClient } from "../../db/supabase.client";

interface AppPageProps {
  selectedRecipeId?: string;
}

/**
 * AppPage Component
 *
 * Client-side wrapper for the app layout.
 * Combines I18nProvider, QueryProvider, AppLayout, and Toaster into a single island.
 *
 * @component
 */
export function AppPage({ selectedRecipeId }: AppPageProps) {
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
        <AppLayout selectedRecipeId={selectedRecipeId} />
        <Toaster />
      </QueryProvider>
    </I18nProvider>
  );
}
