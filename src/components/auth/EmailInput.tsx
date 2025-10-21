import { forwardRef } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface EmailInputProps {
  /** Current email value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Validation error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Blur handler for validation trigger */
  onBlur?: () => void;
}

/**
 * EmailInput Component
 *
 * Email input field with label and error display.
 * Supports validation and accessibility features.
 *
 * Features:
 * - Auto-complete for email
 * - ARIA error handling
 * - Focus management
 * - Disabled state support
 *
 * @component
 */
export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({ value, onChange, error, disabled, onBlur }, ref) => {
    const hasError = !!error;

    return (
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          ref={ref}
          id="email"
          type="email"
          autoComplete="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? "email-error" : undefined}
          className={hasError ? "border-destructive" : ""}
        />
        {hasError && (
          <p id="email-error" className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

EmailInput.displayName = "EmailInput";
