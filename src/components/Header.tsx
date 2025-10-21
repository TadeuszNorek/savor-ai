import { DarkModeToggle } from "./theme/DarkModeToggle";
import { Button } from "./ui/button";
import { UserMenu } from "./auth/UserMenu";
import { useAuth } from "../lib/auth/useAuth";

/**
 * Header Component
 *
 * Main application header with logo, navigation, and user controls.
 *
 * Features:
 * - Logo/brand
 * - Dark mode toggle
 * - User menu with logout (when authenticated)
 * - Sign in link (when not authenticated)
 * - Language switch (placeholder for Phase 2)
 * - Responsive design
 *
 * @component
 */
export function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo/Brand */}
        <div className="mr-4 flex">
          <a href="/" className="mr-6 flex items-center space-x-2">
            <span className="text-xl font-bold">SavorAI</span>
          </a>
        </div>

        {/* Spacer */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-2">
            {/* Dark Mode Toggle */}
            <DarkModeToggle />

            {/* Language Switch - Placeholder for Phase 2 */}
            {/* <LanguageSwitch /> */}

            {/* User Info / Auth */}
            {!loading && (
              <>
                {user ? (
                  // Show user menu when authenticated
                  <UserMenu email={user.email ?? "User"} />
                ) : (
                  // Show sign in link when not authenticated
                  <Button variant="ghost" size="sm" asChild>
                    <a href="/login">Sign In</a>
                  </Button>
                )}
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
