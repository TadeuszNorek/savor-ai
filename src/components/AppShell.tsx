import { ThemeProvider } from "./theme/ThemeProvider";
import { Header } from "./Header";

/**
 * AppShell Component
 *
 * Renders Header with ThemeProvider context.
 * Used as a separate React island for header functionality.
 *
 * @component
 */
export function AppShell() {
  return (
    <ThemeProvider>
      <Header />
    </ThemeProvider>
  );
}
