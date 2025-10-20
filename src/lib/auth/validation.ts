import type { AuthFormValues, AuthFormErrors } from "./types";

/**
 * Email validation - RFC 5322 lite (moderate regex)
 * Max 254 characters
 */
export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim();

  if (!trimmed) {
    return "Email is required";
  }

  if (trimmed.length > 254) {
    return "Email must be 254 characters or less";
  }

  // RFC 5322 lite pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmed)) {
    return "Please enter a valid email address";
  }

  return undefined;
}

/**
 * Password validation
 * Min 8 characters, max 128 characters
 * No whitespace-only passwords
 */
export function validatePassword(password: string): string | undefined {
  if (!password) {
    return "Password is required";
  }

  if (password.trim().length === 0) {
    return "Password cannot be only whitespace";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  if (password.length > 128) {
    return "Password must be 128 characters or less";
  }

  return undefined;
}

/**
 * Validates entire auth form
 * Returns errors object (empty if valid)
 */
export function validateAuthForm(values: AuthFormValues): AuthFormErrors {
  const errors: AuthFormErrors = {};

  const emailError = validateEmail(values.email);
  if (emailError) {
    errors.email = emailError;
  }

  const passwordError = validatePassword(values.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  return errors;
}

/**
 * Checks if form has any errors
 */
export function hasErrors(errors: AuthFormErrors): boolean {
  return !!(errors.email || errors.password || errors.form);
}

/**
 * Normalizes email (trim + lowercase)
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
