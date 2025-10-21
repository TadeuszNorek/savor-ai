import { supabaseClient } from "../../db/supabase.client";
import type { ApiError } from "../../types";

/**
 * Gets the current session access token
 * @returns Access token or null if not authenticated
 */
async function getAccessToken(): Promise<string | null> {
  const { data } = await supabaseClient.auth.getSession();
  const token = data.session?.access_token ?? null;
  console.log("[API] getAccessToken:", token ? `Token present (${token.substring(0, 20)}...)` : "No token");
  return token;
}

/**
 * Fetches from API with authorization header
 * Handles authentication, redirects on 401, and error parsing
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Response data
 * @throws ApiError on non-2xx responses
 */
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = await getAccessToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options?.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  console.log("[API] Response status:", response.status, "URL:", url);

  // Handle 401 Unauthorized - redirect to login
  if (response.status === 401) {
    console.log("[API] 401 Unauthorized - redirecting to /login");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  // Handle non-2xx responses
  if (!response.ok) {
    console.log("[API] Non-2xx response, trying to parse as JSON...");
    const contentType = response.headers.get("content-type");
    console.log("[API] Content-Type:", contentType);

    // Check if response is JSON
    if (contentType && contentType.includes("application/json")) {
      const error: ApiError = await response.json();
      console.log("[API] Error response:", error);
      throw error;
    } else {
      // Response is not JSON (might be HTML error page)
      const text = await response.text();
      console.log("[API] Non-JSON error response:", text.substring(0, 200));
      throw {
        error: "Server Error",
        message: `Server returned ${response.status}: ${response.statusText}`,
      } as ApiError;
    }
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  console.log("[API] Parsing successful response as JSON...");
  const contentType = response.headers.get("content-type");
  console.log("[API] Success Content-Type:", contentType);

  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    console.error("[API] Expected JSON but got:", text.substring(0, 200));
    throw {
      error: "Invalid Response",
      message: "Server did not return JSON",
    } as ApiError;
  }

  return response.json();
}
