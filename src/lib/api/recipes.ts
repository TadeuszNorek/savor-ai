import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./http";
import type {
  RecipeListResponse,
  RecipeDetailsDTO,
  GenerateRecipeCommand,
  GenerateRecipeResponse,
  SaveRecipeCommand,
  RecipeSummaryDTO,
  ApiError,
  RecipeQueryParams,
} from "../../types";

// ============================================================================
// Recipe API Functions
// ============================================================================

/**
 * Fetches recipe list from GET /api/recipes
 * Supports search, filtering, sorting, and pagination
 * @param params - Query parameters
 * @returns Recipe list response with pagination metadata
 * @throws ApiError on validation or server errors
 */
async function fetchRecipeList(params: RecipeQueryParams): Promise<RecipeListResponse> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.tags) searchParams.set("tags", params.tags);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.cursor) searchParams.set("cursor", params.cursor);
  if (params.offset !== undefined) searchParams.set("offset", params.offset.toString());

  const url = `/api/recipes${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  return apiFetch<RecipeListResponse>(url);
}

/**
 * Fetches recipe details from GET /api/recipes/:id
 * @param id - Recipe ID
 * @returns Recipe details DTO
 * @throws ApiError on 404 or other errors
 */
async function fetchRecipeDetails(id: string): Promise<RecipeDetailsDTO> {
  return apiFetch<RecipeDetailsDTO>(`/api/recipes/${id}`);
}

/**
 * Generates a new recipe via POST /api/recipes/generate
 * @param command - Generate recipe command with prompt
 * @returns Generated recipe response
 * @throws ApiError on validation, 413, 429, or server errors
 */
async function generateRecipe(command: GenerateRecipeCommand): Promise<GenerateRecipeResponse> {
  return apiFetch<GenerateRecipeResponse>("/api/recipes/generate", {
    method: "POST",
    body: JSON.stringify(command),
  });
}

/**
 * Saves a recipe via POST /api/recipes
 * @param command - Save recipe command with recipe and optional tags
 * @returns Recipe summary DTO
 * @throws ApiError on validation, disliked ingredients, 413, or server errors
 */
async function saveRecipe(command: SaveRecipeCommand): Promise<RecipeSummaryDTO> {
  return apiFetch<RecipeSummaryDTO>("/api/recipes", {
    method: "POST",
    body: JSON.stringify(command),
  });
}

/**
 * Deletes a recipe via DELETE /api/recipes/:id
 * @param id - Recipe ID
 * @throws ApiError on 404 or server errors
 */
async function deleteRecipe(id: string): Promise<void> {
  return apiFetch<void>(`/api/recipes/${id}`, {
    method: "DELETE",
  });
}

// ============================================================================
// TanStack Query Hooks
// ============================================================================

/**
 * Infinite query hook for fetching paginated recipe list
 * Uses offset-based pagination (MVP) with support for cursor-based in the future
 * Automatically handles "Load More" functionality
 *
 * @param params - Base query parameters (search, tags, sort, limit)
 * @returns Infinite query result with pages array and fetchNextPage function
 */
export function useRecipesList(params: Omit<RecipeQueryParams, "offset" | "cursor">) {
  return useInfiniteQuery({
    queryKey: ["recipes", params],
    queryFn: ({ pageParam = 0 }) =>
      fetchRecipeList({
        ...params,
        offset: pageParam,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.pagination.has_more) {
        return undefined;
      }
      // Calculate next offset based on accumulated data
      const currentOffset = allPages.reduce((acc, page) => acc + page.data.length, 0);
      return currentOffset;
    },
    initialPageParam: 0,
    retry: false,
  });
}

/**
 * Query hook for fetching single recipe details
 * Returns full recipe data including JSONB
 *
 * @param id - Recipe ID
 * @returns Query result with recipe details
 */
export function useRecipeDetails(id: string) {
  return useQuery({
    queryKey: ["recipe", id],
    queryFn: () => fetchRecipeDetails(id),
    retry: false,
    enabled: !!id, // Only run query if id is provided
  });
}

/**
 * Mutation hook for generating a recipe via AI
 * Does not invalidate any cache as generation doesn't affect saved recipes
 *
 * @returns Mutation result for recipe generation
 */
export function useGenerateRecipeMutation() {
  return useMutation({
    mutationFn: generateRecipe,
  });
}

/**
 * Mutation hook for saving a recipe
 * Invalidates recipe list cache on success to show the new recipe
 *
 * @returns Mutation result for saving recipe
 */
export function useSaveRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveRecipe,
    onSuccess: () => {
      // Invalidate recipe list to refresh with new recipe
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

/**
 * Mutation hook for deleting a recipe
 * Invalidates both recipe list and the specific recipe cache on success
 *
 * @returns Mutation result for deleting recipe
 */
export function useDeleteRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRecipe,
    onSuccess: (_, deletedId) => {
      // Invalidate recipe list to remove deleted recipe
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      // Invalidate the specific recipe cache
      queryClient.invalidateQueries({ queryKey: ["recipe", deletedId] });
    },
  });
}
