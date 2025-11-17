import { useState } from "react";
import { User, LogOut, UserCircle } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { clearSessionStartTracking } from "../../lib/auth/telemetry";
import { useI18n } from "../../lib/contexts/I18nContext";

interface UserMenuProps {
  /** User email to display */
  email: string;
}

/**
 * UserMenu Component
 *
 * Dropdown menu for authenticated users with logout functionality.
 *
 * Features:
 * - Display user email
 * - Logout button with API call
 * - Loading state during logout
 * - Error handling
 *
 * @component
 */
export function UserMenu({ email }: UserMenuProps) {
  const { t } = useI18n();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Clear session_start tracking for next login
      clearSessionStartTracking();

      // Redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
      // Show error to user (could use toast here)
      alert(t('header.logoutFailed'));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center space-x-2" disabled={isLoggingOut}>
          <User className="h-4 w-4" />
          <span className="text-sm max-w-[150px] truncate hidden sm:inline">{email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{t('header.account')}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <a href="/profile" className="flex items-center">
            <UserCircle className="mr-2 h-4 w-4" />
            <span>{t('header.profile')}</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? t('header.signingOut') : t('header.signOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
