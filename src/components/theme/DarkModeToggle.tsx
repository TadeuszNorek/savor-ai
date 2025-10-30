import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

/**
 * DarkModeToggle Component
 *
 * Minimalist toggle switch for light/dark theme.
 * Displays sliding animation when switching between modes.
 *
 * Features:
 * - Animated switch with sun/moon icons
 * - Smooth transitions
 * - Persists choice to localStorage
 * - Keyboard accessible
 *
 * @component
 */
export function DarkModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-muted hover:bg-muted/80"
      aria-label="Toggle theme"
      role="switch"
      aria-checked={isDark}
    >
      {/* Sliding circle */}
      <span
        className={`inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-background shadow-sm transition-transform duration-200 ease-in-out ${
          isDark ? "translate-x-7" : "translate-x-1"
        }`}
      >
        {isDark ? <Moon className="h-3.5 w-3.5 text-foreground" /> : <Sun className="h-3.5 w-3.5 text-foreground" />}
      </span>
    </button>
  );
}
