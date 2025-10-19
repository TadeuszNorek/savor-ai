import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseClient } from "../../db/supabase.client";
import type {
  ProfileDTO,
  CreateProfileCommand,
  UpdateProfileCommand,
  ApiError,
} from "../../types";

// ============================================================================
// API Client Helpers
// ============================================================================

/**
 * Gets the current session access token
 * @returns Access token or null if not authenticated
 */
async function getAccessToken(): Promise<string | null> {
  const { data } = await supabaseClient.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Fetches from API with authorization header
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Response
 * @throws ApiError on non-2xx responses
 */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
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

  // Handle 401 Unauthorized - redirect to login
  if (response.status === 401) {
    // Redirect to login page
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  // Handle non-2xx responses
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ============================================================================
// Profile API Functions
// ============================================================================

/**
 * Fetches user profile from GET /api/profile
 * @returns ProfileDTO or null if 404
 * @throws ApiError on other errors
 */
async function fetchProfile(): Promise<ProfileDTO | null> {
  try {
    return await apiFetch<ProfileDTO>("/api/profile");
  } catch (error) {
    // 404 means no profile exists - return null
    if ((error as ApiError).error === "Not Found") {
      return null;
    }
    throw error;
  }
}

/**
 * Creates a new profile via POST /api/profile
 * @param command - Create profile command
 * @returns Created profile DTO
 * @throws ApiError on validation or conflict errors
 */
async function createProfile(command: CreateProfileCommand): Promise<ProfileDTO> {
  return apiFetch<ProfileDTO>("/api/profile", {
    method: "POST",
    body: JSON.stringify(command),
  });
}

/**
 * Updates existing profile via PUT /api/profile
 * @param command - Update profile command
 * @returns Updated profile DTO
 * @throws ApiError on validation or not found errors
 */
async function updateProfile(command: UpdateProfileCommand): Promise<ProfileDTO> {
  return apiFetch<ProfileDTO>("/api/profile", {
    method: "PUT",
    body: JSON.stringify(command),
  });
}

// ============================================================================
// TanStack Query Hooks
// ============================================================================

/**
 * Query hook for fetching user profile
 * Returns null if profile doesn't exist (404)
 * Redirects to /login on 401
 */
export function useProfileQuery() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    retry: false, // Don't retry on 401 or 404
  });
}

/**
 * Mutation hook for creating a new profile
 * Invalidates profile cache on success
 */
export function useCreateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProfile,
    onSuccess: () => {
      // Invalidate and refetch profile query
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

/**
 * Mutation hook for updating existing profile
 * Invalidates profile cache on success
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      // Invalidate and refetch profile query
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
