import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  RecipeDetailsDTO,
  RecipeListResponse,
  RecipeListItemDTO,
  RecipeQueryParams,
  SaveRecipeCommand,
  RecipeSummaryDTO,
  RecipeSchema,
} from "../../types";
import { decodeCursor, encodeCursor } from "../utils/cursor";
import { normalizeTags } from "../schemas/recipe.schema";

/**
 * Recipes Service
 * Handles recipe-related database operations
 */
export class RecipesService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Save a recipe to user's collection
   * Validates recipe size, checks for disliked ingredients via RPC, and returns summary
   *
   * @param userId - User ID (from auth.uid())
   * @param command - Recipe data and optional tags
   * @returns Recipe summary DTO
   * @throws Error if recipe too large (>200KB)
   * @throws Error if recipe contains disliked ingredients
   * @throws Error if database operation fails
   */
  async saveRecipe(userId: string, command: SaveRecipeCommand): Promise<RecipeSummaryDTO> {
    const { recipe, tags } = command;

    // 1. Check recipe size limit (200 KB = 204800 bytes)
    const recipeJson = JSON.stringify(recipe);
    const sizeBytes = new TextEncoder().encode(recipeJson).length;

    if (sizeBytes >= 204800) {
      throw new Error(`Recipe too large: ${sizeBytes} bytes (max 204800 bytes)`);
    }

    // 2. Normalize tags (lowercase, trim, deduplicate)
    const normalizedTags = normalizeTags(tags);

    // 3. Call RPC insert_recipe_safe to insert recipe with disliked ingredient check
    // RPC uses auth.uid() internally and respects RLS
    const { data: recipeId, error: rpcError } = await this.supabase.rpc("insert_recipe_safe", {
      p_recipe: recipe as RecipeSchema,
      p_tags: normalizedTags.length > 0 ? normalizedTags : null,
    });

    if (rpcError) {
      console.error(`Failed to save recipe for user ${userId}:`, rpcError);

      // Check if error is about disliked ingredients
      // RPC returns error message with ingredient details
      if (rpcError.message?.includes("disliked ingredient")) {
        throw new Error(`Recipe contains disliked ingredients: ${rpcError.message}`);
      }

      throw new Error(`Failed to save recipe: ${rpcError.message}`);
    }

    if (!recipeId) {
      throw new Error("RPC insert_recipe_safe returned null");
    }

    // 4. Fetch recipe summary (select only needed fields)
    const { data: summary, error: selectError } = await this.supabase
      .from("recipes")
      .select("id, user_id, title, summary, tags, created_at, updated_at")
      .eq("id", recipeId)
      .single();

    if (selectError || !summary) {
      console.error(`Failed to fetch saved recipe summary ${recipeId}:`, selectError);
      throw new Error("Failed to fetch saved recipe summary");
    }

    return summary as RecipeSummaryDTO;
  }

  /**
   * Get recipe details by ID for a specific user
   * Returns null if recipe doesn't exist or doesn't belong to the user
   *
   * @param id - Recipe UUID
   * @param userId - User ID (from auth.uid())
   * @returns Recipe details or null
   */
  async getRecipeDetails(id: string, userId: string): Promise<RecipeDetailsDTO | null> {
    const { data, error } = await this.supabase
      .from("recipes")
      .select("id, user_id, title, summary, tags, recipe, created_at, updated_at")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      // Recipe not found or user doesn't have access
      if (error.code === "PGRST116") {
        // PostgreSQL error: no rows returned
        return null;
      }
      // Other database errors
      console.error(`Failed to fetch recipe ${id} for user ${userId}:`, error);
      throw new Error(`Database error: ${error.message}`);
    }

    return data as RecipeDetailsDTO;
  }

  /**
   * Delete a recipe by ID for a specific user
   * Returns true if recipe was deleted, false if not found or doesn't belong to user
   *
   * @param id - Recipe UUID
   * @param userId - User ID (from auth.uid())
   * @returns true if deleted, false if not found
   */
  async deleteRecipe(id: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("recipes")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
      .select("id");

    if (error) {
      console.error(`Failed to delete recipe ${id} for user ${userId}:`, error);
      throw new Error(`Database error: ${error.message}`);
    }

    return Array.isArray(data) && data.length > 0;
  }

  /**
   * List recipes for a user with filtering, search, and pagination
   *
   * @param userId - User ID (from auth.uid())
   * @param query - Query parameters (search, tags, sort, limit, cursor/offset)
   * @returns Paginated list of recipes with metadata
   */
  async listRecipes(userId: string, query: RecipeQueryParams): Promise<RecipeListResponse> {
    const { search, tags, sort = "recent", limit = 20, cursor, offset } = query;

    // Start building query
    let queryBuilder = this.supabase
      .from("recipes")
      .select("id, title, summary, tags, created_at", { count: "exact" })
      .eq("user_id", userId);

    // Apply tag filtering (OR logic with overlaps)
    if (tags && Array.isArray(tags) && tags.length > 0) {
      queryBuilder = queryBuilder.overlaps("tags", tags);
    }

    // Apply full-text search
    if (search) {
      queryBuilder = queryBuilder.textSearch("search_tsv", search, { type: "websearch" });
    }

    // Apply sorting
    const ascending = sort === "oldest";
    queryBuilder = queryBuilder.order("created_at", { ascending }).order("id", { ascending });

    // Apply cursor-based pagination
    if (cursor) {
      try {
        const { createdAt, id } = decodeCursor(cursor);

        if (sort === "recent") {
          // DESC: get records before cursor
          queryBuilder = queryBuilder.or(`created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`);
        } else {
          // ASC: get records after cursor
          queryBuilder = queryBuilder.or(`created_at.gt.${createdAt},and(created_at.eq.${createdAt},id.gt.${id})`);
        }
      } catch (error) {
        throw new Error(`Invalid cursor: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    }

    // Fetch limit + 1 to detect if there are more results
    const fetchLimit = limit + 1;
    queryBuilder = queryBuilder.limit(fetchLimit);

    // Apply offset pagination if cursor not used
    if (offset !== undefined && !cursor) {
      queryBuilder = queryBuilder.range(offset, offset + limit);
    }

    // Execute query
    const { data, error, count } = await queryBuilder;

    if (error) {
      console.error(`Failed to list recipes for user ${userId}:`, error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Calculate pagination metadata
    const items = (data || []) as RecipeListItemDTO[];
    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;
    const totalCount = count ?? 0;

    // Generate next cursor
    let nextCursor: string | null = null;
    if (hasMore && resultItems.length > 0) {
      const lastItem = resultItems[resultItems.length - 1];
      nextCursor = encodeCursor(lastItem.created_at, lastItem.id);
    }

    // Build response
    const response: RecipeListResponse = {
      data: resultItems,
      pagination: {
        limit,
        next_cursor: nextCursor,
        has_more: hasMore,
        total_count: totalCount,
      },
    };

    // Add message for empty results
    if (resultItems.length === 0) {
      response.message = search || tags
        ? "No recipes found matching your search criteria"
        : "You haven't saved any recipes yet";
    }

    return response;
  }
}
