import { useState, useRef } from "react";
import type { FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import { EmailInput } from "./EmailInput";
import { PasswordInput } from "./PasswordInput";
import { validateAuthForm, hasErrors, normalizeEmail } from "../../lib/auth/validation";
import { sendSessionStartEvent } from "../../lib/auth/telemetry";
import type { AuthFormMode, AuthFormValues, AuthFormErrors } from "../../lib/auth/types";

interface AuthFormProps {
  /** Initial mode - login or register */
  initialMode?: AuthFormMode;
}

/**
 * AuthForm Component
 *
 * Dual-mode authentication form for login and registration.
 * Currently UI-only, ready for backend integration.
 *
 * Features:
 * - Login/Register mode switching
 * - Client-side validation (email format, password length)
 * - Error display (inline and global)
 * - Focus management
 * - Full ARIA support
 * - Loading states
 * - Placeholder for future Supabase Auth integration
 *
 * @component
 */
export function AuthForm({ initialMode = "login" }: AuthFormProps) {
  const [mode, setMode] = useState<AuthFormMode>(initialMode);
  const [values, setValues] = useState<AuthFormValues>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });

  // Refs for focus management
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Handle email change
  const handleEmailChange = (email: string) => {
    setValues((prev) => ({ ...prev, email }));
    if (touched.email) {
      // Clear error on change if field was touched
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  // Handle password change
  const handlePasswordChange = (password: string) => {
    setValues((prev) => ({ ...prev, password }));
    if (touched.password) {
      // Clear error on change if field was touched
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  // Handle email blur (validation trigger)
  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    const emailError = validateAuthForm({ ...values }).email;
    setErrors((prev) => ({ ...prev, email: emailError }));
  };

  // Handle password blur (validation trigger)
  const handlePasswordBlur = () => {
    setTouched((prev) => ({ ...prev, password: true }));
    const passwordError = validateAuthForm({ ...values }).password;
    setErrors((prev) => ({ ...prev, password: passwordError }));
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ email: true, password: true });

    // Validate form
    const validationErrors = validateAuthForm(values);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      // Focus first error field
      if (validationErrors.email) {
        emailRef.current?.focus();
      } else if (validationErrors.password) {
        passwordRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    // Normalize email
    const normalizedEmail = normalizeEmail(values.email);

    try {
      // Call auth API
      if (mode === "login") {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: normalizedEmail,
            password: values.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setErrors({ form: data.error || "Login failed" });
          return;
        }

        // Send session_start telemetry event (best-effort, non-blocking)
        sendSessionStartEvent().catch(() => {
          // Ignore telemetry errors - don't block UX
        });

        // Redirect to /profile on successful login
        window.location.href = "/profile";
      } else {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: normalizedEmail,
            password: values.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setErrors({ form: data.error || "Registration failed" });
          return;
        }

        // Send session_start telemetry event (best-effort, non-blocking)
        sendSessionStartEvent().catch(() => {
          // Ignore telemetry errors - don't block UX
        });

        // Redirect to /profile on successful registration
        window.location.href = "/profile";
      }
    } catch (error) {
      setErrors({
        form: "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle mode switch
  const handleModeSwitch = () => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    // Clear errors when switching modes
    setErrors({});
    // Optionally preserve email value
  };

  const isLogin = mode === "login";
  const isValid = !hasErrors(errors);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isLogin ? "Sign In" : "Create Account"}</CardTitle>
        <CardDescription>
          {isLogin
            ? "Enter your email and password to sign in"
            : "Enter your email and password to create an account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" aria-label={`${isLogin ? "Login" : "Registration"} form`}>
          {/* Global form error */}
          {errors.form && (
            <Alert variant={errors.form.includes("ready") ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.form}</AlertDescription>
            </Alert>
          )}

          {/* Email input */}
          <EmailInput
            ref={emailRef}
            value={values.email}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            error={touched.email ? errors.email : undefined}
            disabled={isSubmitting}
          />

          {/* Password input */}
          <PasswordInput
            ref={passwordRef}
            value={values.password}
            onChange={handlePasswordChange}
            onBlur={handlePasswordBlur}
            error={touched.password ? errors.password : undefined}
            disabled={isSubmitting}
            label={isLogin ? "Password" : "Password (min. 8 characters)"}
          />

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !isValid}
            aria-label={isLogin ? "Sign in" : "Create account"}
          >
            {isSubmitting ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </Button>

          {/* Forgot password link - only show in login mode */}
          {isLogin && (
            <div className="text-center text-sm">
              <a
                href="/auth/forgot"
                className="text-muted-foreground hover:text-primary hover:underline"
              >
                Forgot your password?
              </a>
            </div>
          )}

          {/* Mode switch link */}
          <div className="text-center text-sm">
            {isLogin ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={handleModeSwitch}
                  className="text-primary hover:underline font-medium"
                  disabled={isSubmitting}
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={handleModeSwitch}
                  className="text-primary hover:underline font-medium"
                  disabled={isSubmitting}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
