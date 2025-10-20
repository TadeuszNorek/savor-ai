import { forwardRef, useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  /** Current password value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Validation error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Blur handler for validation trigger */
  onBlur?: () => void;
  /** Label text (default: "Password") */
  label?: string;
}

/**
 * PasswordInput Component
 *
 * Password input field with show/hide toggle, label, and error display.
 * Supports validation and accessibility features.
 *
 * Features:
 * - Show/hide password toggle
 * - ARIA error handling
 * - Focus management
 * - Auto-complete support
 * - Disabled state support
 *
 * @component
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ value, onChange, error, disabled, onBlur, label = "Password" }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const hasError = !!error;

    const toggleShowPassword = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <div className="space-y-2">
        <Label htmlFor="password">{label}</Label>
        <div className="relative">
          <Input
            ref={ref}
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={hasError ? "password-error" : undefined}
            className={`pr-10 ${hasError ? "border-destructive" : ""}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={toggleShowPassword}
            disabled={disabled}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
          </Button>
        </div>
        {hasError && (
          <p id="password-error" className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
