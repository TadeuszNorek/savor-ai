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
import { supabaseClient } from "../../db/supabase.client";

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
    console.log("[AuthForm] Submit started, mode:", mode);

    // Mark all fields as touched
    setTouched({ email: true, password: true });

    // Validate form
    const validationErrors = validateAuthForm(values);
    setErrors(validationErrors);
    console.log("[AuthForm] Validation errors:", validationErrors);

    if (hasErrors(validationErrors)) {
      console.log("[AuthForm] Validation failed, stopping");
      // Focus first error field
      if (validationErrors.email) {
        emailRef.current?.focus();
      } else if (validationErrors.password) {
        passwordRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);
    console.log("[AuthForm] Starting auth request...");

    // Normalize email
    const normalizedEmail = normalizeEmail(values.email);
    console.log("[AuthForm] Normalized email:", normalizedEmail);

    try {
      // Use Supabase Auth SDK directly (client-side auth per auth-spec.md)
      if (mode === "login") {
        console.log("[AuthForm] Calling signInWithPassword...");
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email: normalizedEmail,
          password: values.password,
        });

        console.log("[AuthForm] signInWithPassword response:", { data: !!data, error: error?.message });

        if (error) {
          // Map Supabase errors to user-friendly messages
          let message = "Login failed";

          if (error.message.includes("Invalid login credentials")) {
            message = "Invalid email or password";
          } else if (error.message.includes("Email not confirmed")) {
            message = "Please verify your email address";
          } else if (error.message.includes("rate")) {
            message = "Too many attempts. Please try again later";
          }

          console.log("[AuthForm] Login error:", message);
          setErrors({ form: message });
          return;
        }

        console.log("[AuthForm] Login successful, waiting for session...");
        // Wait for session to be saved to localStorage (prevent race condition)
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify session is available
        const { data: sessionData } = await supabaseClient.auth.getSession();
        console.log("[AuthForm] Session check:", { hasSession: !!sessionData.session });
        if (!sessionData.session) {
          console.log("[AuthForm] Session not available!");
          setErrors({ form: "Session error. Please try again." });
          return;
        }

        // Send session_start telemetry event (best-effort, non-blocking)
        console.log("[AuthForm] Sending telemetry...");
        sendSessionStartEvent().catch(() => {
          // Ignore telemetry errors - don't block UX
        });

        // Redirect to /app on successful login
        console.log("[AuthForm] Redirecting to /app");
        window.location.href = "/app";
      } else {
        const { data, error } = await supabaseClient.auth.signUp({
          email: normalizedEmail,
          password: values.password,
        });

        if (error) {
          setErrors({ form: error.message || "Registration failed" });
          return;
        }

        // Wait for session to be saved to localStorage (prevent race condition)
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify session is available
        const { data: sessionData } = await supabaseClient.auth.getSession();
        if (!sessionData.session) {
          setErrors({ form: "Session error. Please try again." });
          return;
        }

        // Send session_start telemetry event (best-effort, non-blocking)
        sendSessionStartEvent().catch(() => {
          // Ignore telemetry errors - don't block UX
        });

        // Redirect to /app on successful registration
        window.location.href = "/app";
      }
    } catch (error) {
      console.error("[AuthForm] Caught error:", error);
      setErrors({
        form: "Network error. Please check your connection and try again.",
      });
    } finally {
      console.log("[AuthForm] Submit finished");
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
