import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { PasswordInput } from "./PasswordInput";
import { validatePassword } from "../../lib/auth/validation";
import { supabaseClient } from "../../db/supabase.client";

/**
 * ResetPasswordForm Component
 *
 * Form for setting a new password after clicking reset link.
 * Detects PASSWORD_RECOVERY state from Supabase.
 *
 * Features:
 * - Detects password recovery session
 * - Password validation
 * - Calls Supabase updateUser
 * - Shows success/error states
 * - Full accessibility
 *
 * @component
 */
export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [touched, setTouched] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);

  // Check for password recovery session on mount
  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();

        // Check if this is a password recovery session
        if (session) {
          setIsRecoverySession(true);
        } else {
          setFormError("Invalid or expired password reset link.");
        }
      } catch (error) {
        console.error("Failed to check recovery session:", error);
        setFormError("Failed to verify reset link. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    checkRecoverySession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoverySession(true);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched) {
      setPasswordError(undefined);
    }
  };

  const handlePasswordBlur = () => {
    setTouched(true);
    const error = validatePassword(password);
    setPasswordError(error);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Mark as touched
    setTouched(true);

    // Validate password
    const error = validatePassword(password);
    setPasswordError(error);

    if (error) {
      passwordRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setFormError(undefined);

    try {
      // Update user password
      const { error } = await supabaseClient.auth.updateUser({ password });

      if (error) {
        console.error("Password update error:", error);
        setFormError("Failed to update password. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Success
      setIsSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } catch (error) {
      console.error("Unexpected error:", error);
      setFormError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>Verifying reset link...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Password updated!</CardTitle>
          <CardDescription>Your password has been successfully reset.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              You can now sign in with your new password. Redirecting to login page...
            </AlertDescription>
          </Alert>

          <div className="mt-6 text-center">
            <Button variant="ghost" size="sm" asChild>
              <a href="/login">Go to Sign In</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state (invalid/expired link)
  if (!isRecoverySession) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Reset link expired</CardTitle>
          <CardDescription>This password reset link is invalid or has expired.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError || "Invalid reset link."}</AlertDescription>
          </Alert>

          <div className="mt-6 text-center">
            <Button variant="default" asChild>
              <a href="/auth/forgot">Request New Reset Link</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Form state
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>
          Enter a new password for your account. Make sure it's at least 8 characters long.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Reset password form">
          {/* Form error */}
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {/* Password input */}
          <PasswordInput
            ref={passwordRef}
            value={password}
            onChange={handlePasswordChange}
            onBlur={handlePasswordBlur}
            error={touched ? passwordError : undefined}
            disabled={isSubmitting}
            label="New Password (min. 8 characters)"
          />

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !!passwordError}
            aria-label="Update password"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </Button>

          {/* Back to login link */}
          <div className="text-center text-sm">
            <p>
              Remember your password?{" "}
              <a
                href="/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </a>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
