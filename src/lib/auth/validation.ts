import type { AuthFormValues, AuthFormErrors } from "./types";

/**
 * Email validation - RFC 5322 lite (moderate regex)
 * Max 254 characters
 * Returns translation key instead of translated message
 */
export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim();

  if (!trimmed) {
    return "validation.emailRequired";
  }

  if (trimmed.length > 254) {
    return "validation.emailTooLong";
  }

  // RFC 5322 lite pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmed)) {
    return "validation.emailInvalid";
  }

  return undefined;
}

/**
 * Password validation
 * Min 8 characters, max 128 characters
 * No whitespace-only passwords
 * Returns translation key instead of translated message
 */
export function validatePassword(password: string): string | undefined {
  if (!password) {
    return "validation.passwordRequired";
  }

  if (password.trim().length === 0) {
    return "validation.passwordWhitespace";
  }

  if (password.length < 8) {
    return "validation.passwordTooShort";
  }

  if (password.length > 128) {
    return "validation.passwordTooLong";
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
