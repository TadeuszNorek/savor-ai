import { ThemeProvider } from "./theme/ThemeProvider";
import { DarkModeToggle } from "./theme/DarkModeToggle";

/**
 * LoginThemeToggle Component
 *
 * Wrapper that provides ThemeProvider context for DarkModeToggle
 * on the login page. Needed because Astro islands don't share context.
 *
 * @component
 */
export function LoginThemeToggle() {
  return (
    <ThemeProvider>
      <div className="fixed top-4 right-4 z-50">
        <DarkModeToggle />
      </div>
    </ThemeProvider>
  );
}
