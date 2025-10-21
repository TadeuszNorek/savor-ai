import QueryProvider from "../QueryProvider";
import { AppLayout } from "./AppLayout";
import { Toaster } from "../ui/sonner";

interface AppPageProps {
  selectedRecipeId?: string;
}

/**
 * AppPage Component
 *
 * Client-side wrapper for the app layout.
 * Combines QueryProvider, AppLayout, and Toaster into a single island.
 *
 * @component
 */
export function AppPage({ selectedRecipeId }: AppPageProps) {
  return (
    <QueryProvider>
      <AppLayout selectedRecipeId={selectedRecipeId} />
      <Toaster />
    </QueryProvider>
  );
}
