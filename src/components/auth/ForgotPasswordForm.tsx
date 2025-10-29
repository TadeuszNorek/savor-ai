import { useState, useRef } from "react";
import type { FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { EmailInput } from "./EmailInput";
import { validateEmail, normalizeEmail } from "../../lib/auth/validation";
import { supabaseClient } from "../../db/supabase.client";

/**
 * ForgotPasswordForm Component
 *
 * Form for requesting a password reset email.
 *
 * Features:
 * - Email validation
 * - Calls Supabase resetPasswordForEmail
 * - Shows success message without revealing if account exists
 * - Error handling
 * - Full accessibility
 *
 * @component
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [touched, setTouched] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched) {
      setEmailError(undefined);
    }
  };

  const handleEmailBlur = () => {
    setTouched(true);
    const error = validateEmail(email);
    setEmailError(error);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Mark as touched
    setTouched(true);

    // Validate email
    const error = validateEmail(email);
    setEmailError(error);

    if (error) {
      emailRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setFormError(undefined);

    const normalizedEmail = normalizeEmail(email);

    try {
      // Request password reset email
      const { error } = await supabaseClient.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });

      if (error) {
        console.error("Password reset error:", error);
        setFormError("Failed to send reset email. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Show success message (don't reveal if account exists)
      setIsSuccess(true);
    } catch (error) {
      console.error("Unexpected error:", error);
      setFormError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            If an account exists with this email, you will receive password reset instructions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              We've sent password reset instructions to <strong>{email}</strong>. Please check your inbox and spam
              folder.
            </AlertDescription>
          </Alert>

          <div className="mt-6 text-center">
            <Button variant="ghost" size="sm" asChild>
              <a href="/login">Back to Sign In</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you instructions to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Forgot password form">
          {/* Form error */}
          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {/* Email input */}
          <EmailInput
            ref={emailRef}
            value={email}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            error={touched ? emailError : undefined}
            disabled={isSubmitting}
          />

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !!emailError}
            aria-label="Send reset instructions"
          >
            {isSubmitting ? "Sending..." : "Send Reset Instructions"}
          </Button>

          {/* Back to login link */}
          <div className="text-center text-sm">
            <p>
              Remember your password?{" "}
              <a href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </a>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
