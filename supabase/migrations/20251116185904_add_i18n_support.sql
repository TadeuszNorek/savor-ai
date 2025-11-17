-- ============================================================================
-- Migration: Add i18n (internationalization) support
-- ============================================================================
-- Description: Adds language support for profiles and recipes
--   - profiles.preferred_language: user's preferred UI and recipe language
--   - recipes.language: language in which recipe was generated
--
-- Tables affected: profiles, recipes
-- Functions affected: insert_recipe_safe
--
-- Notes:
--   - Default language: 'en' (English)
--   - Supported languages: 'pl' (Polish), 'en' (English)
--   - Easy to extend with new languages (just add to CHECK constraint)
-- ============================================================================

-- ============================================================================
-- SECTION 1: Add language columns
-- ============================================================================

-- Add preferred_language to profiles
ALTER TABLE profiles
ADD COLUMN preferred_language text NOT NULL DEFAULT 'en'
CHECK (preferred_language IN ('pl', 'en'));

COMMENT ON COLUMN profiles.preferred_language IS
'User preferred language for UI and recipe generation. Determines language of dietary preferences and generated recipes.';

-- Add language to recipes
ALTER TABLE recipes
ADD COLUMN language text NOT NULL DEFAULT 'en'
CHECK (language IN ('pl', 'en'));

COMMENT ON COLUMN recipes.language IS
'Language in which the recipe was generated. Must match language used in profile preferences for proper disliked ingredients validation.';

-- ============================================================================
-- SECTION 2: Update existing data with default language
-- ============================================================================

-- Set default language for existing profiles (if any)
-- This ensures backward compatibility
UPDATE profiles
SET preferred_language = 'en'
WHERE preferred_language IS NULL;

-- Set default language for existing recipes (if any)
-- This ensures backward compatibility
UPDATE recipes
SET language = 'en'
WHERE language IS NULL;

-- ============================================================================
-- SECTION 3: Create indexes for performance
-- ============================================================================

-- Index for filtering recipes by language
-- Useful for optional language filtering in recipe list
CREATE INDEX idx_recipes_language ON recipes(language);

-- Composite index for common query: user's recipes in specific language
-- Improves performance when filtering by user_id AND language
CREATE INDEX idx_recipes_user_language ON recipes(user_id, language);

COMMENT ON INDEX idx_recipes_language IS
'Index for filtering recipes by language. Used in GET /api/recipes?lang=pl|en';

COMMENT ON INDEX idx_recipes_user_language IS
'Composite index for filtering user recipes by language. Optimizes queries like: user_id = X AND language = Y';

-- ============================================================================
-- SECTION 4: Update RPC insert_recipe_safe
-- ============================================================================

-- Drop old version
DROP FUNCTION IF EXISTS insert_recipe_safe(jsonb, text[]);

-- Recreate with language parameter
CREATE OR REPLACE FUNCTION insert_recipe_safe(
  p_recipe jsonb,
  p_tags text[] DEFAULT NULL,
  p_language text DEFAULT 'en'  -- NEW: language parameter
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_recipe_id uuid;
  v_disliked text[];
  v_ingredients text[];
  v_ingredient text;
  v_disliked_item text;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate language parameter
  IF p_language NOT IN ('pl', 'en') THEN
    RAISE EXCEPTION 'Invalid language: %. Must be pl or en', p_language;
  END IF;

  -- Get user's disliked ingredients (normalized)
  SELECT COALESCE(disliked_ingredients, '{}')
  INTO v_disliked
  FROM profiles
  WHERE user_id = v_user_id;

  -- Extract and normalize ingredients from recipe JSON
  SELECT array_agg(normalize_text(value::text))
  INTO v_ingredients
  FROM jsonb_array_elements_text(p_recipe->'ingredients');

  -- Check for disliked ingredients (case-insensitive substring match)
  FOREACH v_ingredient IN ARRAY v_ingredients LOOP
    FOREACH v_disliked_item IN ARRAY v_disliked LOOP
      IF normalize_text(v_ingredient) LIKE '%' || normalize_text(v_disliked_item) || '%' THEN
        RAISE EXCEPTION 'Recipe contains disliked ingredient: % (matches: %)',
          v_ingredient, v_disliked_item;
      END IF;
    END LOOP;
  END LOOP;

  -- Insert recipe with language
  INSERT INTO recipes (user_id, recipe, tags, language)
  VALUES (v_user_id, p_recipe, p_tags, p_language)
  RETURNING id INTO v_recipe_id;

  RETURN v_recipe_id;
END;
$$;

COMMENT ON FUNCTION insert_recipe_safe IS
'Safely insert recipe after checking for disliked ingredients. Validates language parameter and stores language metadata with recipe.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION insert_recipe_safe(jsonb, text[], text) TO authenticated;
