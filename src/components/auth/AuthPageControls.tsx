import { ThemeProvider } from "../theme/ThemeProvider";
import { DarkModeToggle } from "../theme/DarkModeToggle";
import { LanguageToggle } from "./LanguageToggle";

/**
 * AuthPageControls Component
 *
 * Groups theme and language toggles for auth pages.
 * Positioned in the top-right corner with proper spacing between controls.
 *
 * Features:
 * - Dark mode toggle
 * - Language switcher (PL/EN)
 * - Proper spacing and alignment
 * - ThemeProvider context for dark mode
 *
 * @component
 */
export function AuthPageControls() {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <ThemeProvider>
        <LanguageToggle />
        <DarkModeToggle />
      </ThemeProvider>
    </div>
  );
}
