import { useState, useEffect } from "react";
import { ThemeProvider } from "./theme/ThemeProvider";
import { I18nProvider } from "../lib/contexts/I18nContext";
import { Header } from "./Header";
import { supabaseClient } from "../db/supabase.client";

/**
 * AppShell Component
 *
 * Renders Header with ThemeProvider and I18nProvider contexts.
 * Used as a separate React island for header functionality.
 *
 * @component
 */
export function AppShell() {
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
    <ThemeProvider>
      <I18nProvider authToken={authToken}>
        <Header />
      </I18nProvider>
    </ThemeProvider>
  );
}
