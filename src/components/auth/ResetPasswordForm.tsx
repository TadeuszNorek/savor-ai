import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { PasswordInput } from "./PasswordInput";
import { validatePassword } from "../../lib/auth/validation";
import { useI18n } from "../../lib/contexts/I18nContext";
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
 * - Translated UI
 *
 * @component
 */
export function ResetPasswordForm() {
  const { t } = useI18n();
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
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();

        // Check if this is a password recovery session
        if (session) {
          setIsRecoverySession(true);
        } else {
          setFormError(t('auth.passwordResetError'));
        }
      } catch (error) {
        console.error("Failed to check recovery session:", error);
        setFormError(t('auth.passwordResetError'));
      } finally {
        setIsLoading(false);
      }
    };

    checkRecoverySession();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event) => {
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
        setFormError(t('auth.passwordResetError'));
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
      setFormError(t('auth.passwordResetError'));
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t('auth.resetPasswordTitle')}</CardTitle>
          <CardDescription>Verifying reset link...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">{t('common.loading')}</div>
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
          <CardTitle>{t('auth.passwordResetSuccess')}</CardTitle>
          <CardDescription>{t('auth.resetPasswordDescription')}</CardDescription>
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
              <a href="/login">{t('auth.signIn')}</a>
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
            <AlertDescription>{formError || t('auth.passwordResetError')}</AlertDescription>
          </Alert>

          <div className="mt-6 text-center">
            <Button variant="default" asChild>
              <a href="/auth/forgot">{t('auth.sendResetInstructions')}</a>
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
        <CardTitle>{t('auth.resetPasswordTitle')}</CardTitle>
        <CardDescription>
          {t('auth.resetPasswordDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" aria-label={t('auth.resetPasswordTitle')}>
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
            error={touched && passwordError ? t(passwordError) : undefined}
            disabled={isSubmitting}
            label={t('auth.newPassword')}
          />

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !!passwordError}
            aria-label={t('auth.resetPassword')}
          >
            {isSubmitting ? t('auth.resetting') : t('auth.resetPassword')}
          </Button>

          {/* Back to login link */}
          <div className="text-center text-sm">
            <p>
              {t('auth.rememberPassword')}{" "}
              <a href="/login" className="text-primary hover:underline font-medium">
                {t('auth.signIn')}
              </a>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
