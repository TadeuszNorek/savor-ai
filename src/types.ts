import type { Database, Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// ============================================================================
// Language Support
// ============================================================================

/**
 * Supported language codes
 * Centralized definition for easy extension (add 'es', 'fr', 'de', etc.)
 */
export type LanguageCode = 'pl' | 'en';

/**
 * Default language for the application
 * Used as fallback when user has no language preference set
 */
export const DEFAULT_LANGUAGE: LanguageCode = 'en';

// ============================================================================
// Core Domain Types
// ============================================================================

/**
 * Recipe Schema (schema_v1)
 * This is the JSONB structure stored in the recipes.recipe column
 */
export interface RecipeSchema {
  title: string;
  summary?: string;
  description?: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  cuisine?: string;
  ingredients: string[];
  instructions: string[];
  tags?: string[];
  dietary_info?: {
    vegetarian?: boolean;
    vegan?: boolean;
    gluten_free?: boolean;
    dairy_free?: boolean;
    nut_free?: boolean;
    [key: string]: boolean | undefined;
  };
  nutrition?: {
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    [key: string]: number | undefined;
  };
}

/**
 * Diet type enum - must match database CHECK constraint
 */
export type DietType =
  | "vegan"
  | "vegetarian"
  | "pescatarian"
  | "keto"
  | "paleo"
  | "gluten_free"
  | "dairy_free"
  | "low_carb"
  | "mediterranean"
  | "omnivore";

/**
 * Event type enum - must match database CHECK constraint
 */
export type EventType = "session_start" | "profile_edited" | "ai_prompt_sent" | "ai_recipe_generated" | "recipe_saved";

/**
 * Recipe difficulty level
 */
export type RecipeDifficulty = "easy" | "medium" | "hard";

/**
 * Recipe sort order for list queries
 */
export type RecipeSortOrder = "recent" | "oldest";

// ============================================================================
// Profile DTOs
// ============================================================================

/**
 * Profile DTO - returned from GET /api/profile
 * Direct mapping from profiles table Row
 */
export type ProfileDTO = Tables<"profiles">;

/**
 * Create Profile Command - body for POST /api/profile
 * All fields optional as user can provide any combination
 * Server manages user_id, created_at, updated_at
 */
export type CreateProfileCommand = Omit<TablesInsert<"profiles">, "user_id" | "created_at" | "updated_at">;

/**
 * Update Profile Command - body for PUT /api/profile
 * All fields optional for partial updates
 * Server manages user_id and timestamps
 */
export type UpdateProfileCommand = Omit<TablesUpdate<"profiles">, "user_id" | "created_at" | "updated_at">;

// ============================================================================
// Recipe DTOs
// ============================================================================

/**
 * Generate Recipe Command - body for POST /api/recipes/generate
 * User prompt for AI recipe generation
 */
export interface GenerateRecipeCommand {
  prompt: string;
  lang?: LanguageCode; // Optional language override (defaults to profile.preferred_language or 'en')
}

/**
 * Generate Recipe Response - response from POST /api/recipes/generate
 * Contains generated recipe and metadata
 */
export interface GenerateRecipeResponse {
  recipe: RecipeSchema;
  generation_id: string;
  generated_at: string;
}

/**
 * Save Recipe Command - body for POST /api/recipes
 * User submits recipe with optional tags and language
 * Server manages id, user_id, derived fields, and timestamps
 */
export interface SaveRecipeCommand {
  recipe: RecipeSchema;
  tags?: string[];
  language: LanguageCode; // Required - language in which recipe was generated
}

/**
 * Recipe Summary DTO - returned from POST /api/recipes
 * Lightweight summary after successful save
 */
export type RecipeSummaryDTO = Pick<
  Tables<"recipes">,
  "id" | "user_id" | "title" | "summary" | "tags" | "language" | "created_at" | "updated_at"
>;

/**
 * Recipe List Item DTO - individual item in GET /api/recipes response
 * Minimal data for list display (no full recipe JSONB)
 */
export type RecipeListItemDTO = Pick<Tables<"recipes">, "id" | "title" | "summary" | "tags" | "language" | "created_at">;

/**
 * Recipe Details DTO - returned from GET /api/recipes/:id
 * Complete recipe data including full JSONB
 * Excludes internal database fields (search_tsv, ingredients_text)
 */
export type RecipeDetailsDTO = Omit<Tables<"recipes">, "search_tsv" | "ingredients_text">;

/**
 * Recipe Query Params - query parameters for GET /api/recipes
 * Used for search, filtering, sorting, and pagination
 */
export interface RecipeQueryParams {
  search?: string;
  tags?: string; // Comma-separated tag list for OR filtering
  sort?: RecipeSortOrder;
  limit?: number;
  cursor?: string; // Base64 encoded (created_at:id) for keyset pagination
  offset?: number; // Alternative to cursor for simple pagination
  lang?: LanguageCode; // Optional language filter (show only recipes in specific language)
}

/**
 * Pagination metadata included in list responses
 */
export interface PaginationMeta {
  limit: number;
  next_cursor: string | null;
  has_more: boolean;
  total_count: number;
}

/**
 * Recipe List Response - response from GET /api/recipes
 * Container for paginated recipe list
 */
export interface RecipeListResponse {
  data: RecipeListItemDTO[];
  pagination: PaginationMeta;
  message?: string; // Optional message for empty states
}

// ============================================================================
// Event DTOs
// ============================================================================

/**
 * Create Event Command - body for POST /api/events
 * User can explicitly log events (primarily session_start)
 * Server manages id, user_id, occurred_at
 */
export interface CreateEventCommand {
  type: EventType;
  payload?: Database["public"]["Tables"]["events"]["Row"]["payload"];
}

/**
 * Event DTO - returned from POST /api/events
 * Direct mapping from events table Row
 */
export type EventDTO = Tables<"events">;

// ============================================================================
// Auth DTOs
// ============================================================================

/**
 * Register Command - body for POST /auth/v1/signup
 */
export interface RegisterCommand {
  email: string;
  password: string;
}

/**
 * Login Command - body for POST /auth/v1/token
 * Same structure as RegisterCommand
 */
export type LoginCommand = RegisterCommand;

/**
 * Auth Response - response from Supabase Auth endpoints
 * Returned on successful registration/login
 */
export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    created_at: string;
  };
}

// ============================================================================
// Error DTOs
// ============================================================================

/**
 * Standard API Error Response
 * All error responses follow this format
 */
export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  request_id?: string;
}

/**
 * Validation Error Details
 * Used in ApiError.details for 400 Bad Request responses
 */
export type ValidationErrorDetails = Record<string, string | string[]>;

// ============================================================================
// RPC Function Types
// ============================================================================

/**
 * Arguments for insert_recipe_safe RPC function
 * Server-side validation against disliked ingredients
 */
export interface InsertRecipeSafeArgs {
  p_recipe: RecipeSchema;
  p_tags?: string[];
  p_language?: LanguageCode; // Language in which recipe was generated (defaults to 'en')
}

/**
 * Arguments for export_events_ndjson RPC function
 * Service role only - for analytics export
 */
export interface ExportEventsNdjsonArgs {
  p_from_date?: string;
  p_to_date?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Type guard to check if value is a valid EventType
 */
export function isEventType(value: string): value is EventType {
  return ["session_start", "profile_edited", "ai_prompt_sent", "ai_recipe_generated", "recipe_saved"].includes(value);
}

/**
 * Type guard to check if value is a valid DietType
 */
export function isDietType(value: string): value is DietType {
  return [
    "vegan",
    "vegetarian",
    "pescatarian",
    "keto",
    "paleo",
    "gluten_free",
    "dairy_free",
    "low_carb",
    "mediterranean",
    "omnivore",
  ].includes(value);
}

/**
 * Type guard to check if value is a valid RecipeDifficulty
 */
export function isRecipeDifficulty(value: string): value is RecipeDifficulty {
  return ["easy", "medium", "hard"].includes(value);
}

/**
 * Type guard to check if value is a valid LanguageCode
 */
export function isLanguageCode(value: string): value is LanguageCode {
  return ["pl", "en"].includes(value);
}

// ============================================================================
// Frontend ViewModel Types
// ============================================================================

/**
 * List Filters View Model
 * Represents the current state of filters in the recipe list
 * Synchronized with URL search params
 */
export interface ListFiltersVM {
  search?: string;
  tags: string[];
  sort: RecipeSortOrder;
  limit: number;
  offset?: number;
  cursor?: string | null;
}

/**
 * Generator Draft View Model
 * Represents the state of the recipe generator panel
 * Persisted in sessionStorage
 */
export interface GeneratorDraftVM {
  prompt: string;
  recipe?: RecipeSchema;
  generationId?: string;
  generatedAt?: string;
}

/**
 * Recipe Card View Model
 * Alias for RecipeListItemDTO - used in list display
 */
export type RecipeCardVM = RecipeListItemDTO;

/**
 * Preview Panel Mode
 * Determines whether showing a draft (from generator) or saved recipe
 */
export type PreviewMode = "draft" | "saved";

/**
 * UI Error
 * Frontend-friendly error type mapped from ApiError
 * Includes standardized error codes and user-friendly messages
 */
export interface UiError {
  code: 400 | 401 | 404 | 413 | 429 | 500 | 503;
  message: string;
  details?: Record<string, unknown>;
}
