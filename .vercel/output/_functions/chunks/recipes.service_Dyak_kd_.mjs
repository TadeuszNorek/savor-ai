import { n as normalizeTags } from './recipe.schema_DxgUKZEZ.mjs';

function encodeCursor(createdAt, id) {
  const cursorString = `${createdAt}:${id}`;
  return Buffer.from(cursorString, "utf-8").toString("base64");
}
function decodeCursor(cursor) {
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");
    const lastColonIndex = decoded.lastIndexOf(":");
    if (lastColonIndex === -1) {
      throw new Error("Invalid cursor format: expected 'created_at:id'");
    }
    const createdAt = decoded.substring(0, lastColonIndex);
    const id = decoded.substring(lastColonIndex + 1);
    const dateTest = new Date(createdAt);
    if (isNaN(dateTest.getTime())) {
      throw new Error("Invalid cursor: created_at is not a valid ISO 8601 date");
    }
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
      throw new Error("Invalid cursor: id is not a valid UUID");
    }
    return { createdAt, id };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid cursor")) {
      throw error;
    }
    throw new Error("Invalid cursor: malformed Base64 encoding");
  }
}

class RecipesService {
  constructor(supabase) {
    this.supabase = supabase;
  }
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
  async saveRecipe(userId, command) {
    const { recipe, tags, language } = command;
    const recipeJson = JSON.stringify(recipe);
    const sizeBytes = new TextEncoder().encode(recipeJson).length;
    if (sizeBytes >= 204800) {
      throw new Error(`Recipe too large: ${sizeBytes} bytes (max 204800 bytes)`);
    }
    const normalizedTags = normalizeTags(tags);
    const { data: recipeId, error: rpcError } = await this.supabase.rpc("insert_recipe_safe", {
      p_recipe: recipe,
      p_tags: normalizedTags.length > 0 ? normalizedTags : null,
      p_language: language
    });
    if (rpcError) {
      console.error(`Failed to save recipe for user ${userId}:`, rpcError);
      if (rpcError.message?.includes("disliked ingredient")) {
        throw new Error(`Recipe contains disliked ingredients: ${rpcError.message}`);
      }
      throw new Error(`Failed to save recipe: ${rpcError.message}`);
    }
    if (!recipeId) {
      throw new Error("RPC insert_recipe_safe returned null");
    }
    const { data: summary, error: selectError } = await this.supabase.from("recipes").select("id, user_id, title, summary, tags, language, created_at, updated_at").eq("id", recipeId).single();
    if (selectError || !summary) {
      console.error(`Failed to fetch saved recipe summary ${recipeId}:`, selectError);
      throw new Error("Failed to fetch saved recipe summary");
    }
    return summary;
  }
  /**
   * Get recipe details by ID for a specific user
   * Returns null if recipe doesn't exist or doesn't belong to the user
   *
   * @param id - Recipe UUID
   * @param userId - User ID (from auth.uid())
   * @returns Recipe details or null
   */
  async getRecipeDetails(id, userId) {
    const { data, error } = await this.supabase.from("recipes").select("id, user_id, title, summary, tags, recipe, language, created_at, updated_at").eq("id", id).eq("user_id", userId).single();
    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error(`Failed to fetch recipe ${id} for user ${userId}:`, error);
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }
  /**
   * Delete a recipe by ID for a specific user
   * Returns true if recipe was deleted, false if not found or doesn't belong to user
   *
   * @param id - Recipe UUID
   * @param userId - User ID (from auth.uid())
   * @returns true if deleted, false if not found
   */
  async deleteRecipe(id, userId) {
    const { data, error } = await this.supabase.from("recipes").delete().eq("id", id).eq("user_id", userId).select("id");
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
  async listRecipes(userId, query) {
    const { search, tags, sort = "recent", limit = 20, cursor, offset, lang } = query;
    let queryBuilder = this.supabase.from("recipes").select("id, title, summary, tags, language, created_at", { count: "exact" }).eq("user_id", userId);
    if (lang) {
      queryBuilder = queryBuilder.eq("language", lang);
    }
    if (tags && Array.isArray(tags) && tags.length > 0) {
      queryBuilder = queryBuilder.overlaps("tags", tags);
    }
    if (search) {
      queryBuilder = queryBuilder.textSearch("search_tsv", search, { type: "websearch" });
    }
    const ascending = sort === "oldest";
    queryBuilder = queryBuilder.order("created_at", { ascending }).order("id", { ascending });
    if (cursor) {
      try {
        const { createdAt, id } = decodeCursor(cursor);
        if (sort === "recent") {
          queryBuilder = queryBuilder.or(`created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${id})`);
        } else {
          queryBuilder = queryBuilder.or(`created_at.gt.${createdAt},and(created_at.eq.${createdAt},id.gt.${id})`);
        }
      } catch (error2) {
        throw new Error(`Invalid cursor: ${error2 instanceof Error ? error2.message : "unknown error"}`);
      }
    }
    const fetchLimit = limit + 1;
    queryBuilder = queryBuilder.limit(fetchLimit);
    if (offset !== void 0 && !cursor) {
      queryBuilder = queryBuilder.range(offset, offset + limit);
    }
    const { data, error, count } = await queryBuilder;
    if (error) {
      console.error(`Failed to list recipes for user ${userId}:`, error);
      throw new Error(`Database error: ${error.message}`);
    }
    const items = data || [];
    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;
    const totalCount = count ?? 0;
    let nextCursor = null;
    if (hasMore && resultItems.length > 0) {
      const lastItem = resultItems[resultItems.length - 1];
      nextCursor = encodeCursor(lastItem.created_at, lastItem.id);
    }
    const response = {
      data: resultItems,
      pagination: {
        limit,
        next_cursor: nextCursor,
        has_more: hasMore,
        total_count: totalCount
      }
    };
    if (resultItems.length === 0) {
      response.message = search || tags ? "No recipes found matching your search criteria" : "You haven't saved any recipes yet";
    }
    return response;
  }
}

export { RecipesService as R };
