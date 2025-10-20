/**
 * Auth API Types and Client Functions
 *
 * TypeScript types and client functions for authentication API endpoints.
 */

/**
 * User object returned from auth endpoints
 */
export interface AuthUser {
  id: string;
  email?: string;
}

/**
 * Success response from login/register endpoints
 */
export interface AuthSuccessResponse {
  user: AuthUser;
}

/**
 * Error response from auth endpoints
 */
export interface AuthErrorResponse {
  error: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Register credentials
 */
export interface RegisterCredentials {
  email: string;
  password: string;
}

/**
 * Call login endpoint
 *
 * @param credentials - Email and password
 * @returns User data or throws error
 */
export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as AuthErrorResponse).error || "Login failed");
  }

  return (data as AuthSuccessResponse).user;
}

/**
 * Call register endpoint
 *
 * @param credentials - Email and password
 * @returns User data or throws error
 */
export async function register(credentials: RegisterCredentials): Promise<AuthUser> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as AuthErrorResponse).error || "Registration failed");
  }

  return (data as AuthSuccessResponse).user;
}

/**
 * Call logout endpoint
 *
 * @throws Error if logout fails
 */
export async function logout(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error((data as AuthErrorResponse).error || "Logout failed");
  }
}
