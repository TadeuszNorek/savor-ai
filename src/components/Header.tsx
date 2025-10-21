import { DarkModeToggle } from "./theme/DarkModeToggle";
import { Button } from "./ui/button";
import { UserMenu } from "./auth/UserMenu";
import { useAuth } from "../lib/auth/useAuth";
import { BookOpen, Sparkles } from "lucide-react";

/**
 * Header Component
 *
 * Main application header with logo, navigation, and user controls.
 *
 * Features:
 * - Logo/brand
 * - Navigation links (Recipes, Generator)
 * - Dark mode toggle
 * - User menu with profile and logout (when authenticated)
 * - Sign in link (when not authenticated)
 * - Responsive design with proper spacing
 *
 * @component
 */
export function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        {/* Logo/Brand */}
        <div className="mr-6 flex">
          <a href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">SavorAI</span>
          </a>
        </div>

        {/* Main Navigation - visible when authenticated */}
        {user && !loading && (
          <nav className="hidden md:flex items-center space-x-1 mr-4">
            <Button variant="ghost" size="sm" asChild>
              <a href="/app" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Recipes
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/app#generator" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Generator
              </a>
            </Button>
          </nav>
        )}

        {/* Spacer */}
        <div className="flex flex-1 items-center justify-end space-x-3">
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
        </div>
      </div>
    </header>
  );
}
