/**
 * Auth ViewModel Types
 * Used for login/register UI components
 */

/**
 * Auth form mode - login or register
 */
export type AuthFormMode = "login" | "register";

/**
 * Auth form values (ViewModel)
 */
export interface AuthFormValues {
  email: string;
  password: string;
}

/**
 * Auth form field errors
 */
export interface AuthFormErrors {
  email?: string;
  password?: string;
  form?: string; // Global form error
}

/**
 * Auth result (placeholder for future backend integration)
 */
export interface AuthResult {
  ok: boolean;
  error?: string;
}

/**
 * Auth view model - complete form state
 */
export interface AuthViewModel {
  mode: AuthFormMode;
  values: AuthFormValues;
  errors: AuthFormErrors;
  loading: boolean;
}
