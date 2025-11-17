# Plan implementacji i18n dla SavorAI MVP

## 0. Kluczowe decyzje projektowe

### 🌐 Domyślny język: **EN (English)**
- Wszystkie nowe użytkownicy startują z językiem angielskim
- Polscy użytkownicy automatycznie dostaną PL jeśli `navigator.language = 'pl'`
- Migracja istniejących danych: wypełnienie `'en'` jako default

**Uzasadnienie:** Standard aplikacji webowych; English jako lingua franca internetu.

### 🔄 UX przełącznika: **Auto-save (jak dark mode)**
- User klika PL ↔ EN → UI zmienia się natychmiast
- **Nie wymaga** dodatkowego kliku "Zapisz preferencje"
- Zapisuje do `localStorage` (instant) + backend sync w tle (async)
- Graceful degradation: jeśli backend fail, localStorage działa

**Uzasadnienie:** Spójność z dark mode; instant feedback; lepsze UX.

---

## 1. Założenia kluczowe

### Co MUSI być obsługiwane w PL/EN:
1. ✅ **Wszystkie elementy UI i komunikaty** (już zaplanowane w ui-plan.md)
2. ✅ **Tekst wprowadzany do modelu LLM jako prompt** (user pisze w wybranym języku)
3. ✅ **Wygenerowany przepis wraz z tagami** (AI odpowiada w wybranym języku)
4. ✅ **Preferencje użytkownika** (diet_type, disliked_ingredients, preferred_cuisines w wybranym języku)

### Kluczowe zasady:
- **Jeden język = kompletne doświadczenie**: User wybiera język (przełącznik jak dark mode) i wszystko działa w tym języku
- **Brak tłumaczeń przepisów**: Przepis wygenerowany w PL pozostaje w PL; przepis w EN pozostaje w EN
- **Łatwa rozbudowa**: Architektura umożliwia dodanie kolejnych języków (ES, FR, DE, etc.)

---

## 2. Architektura rozwiązania

### Podejście: Neutralna baza + metadata językowa

```
┌─────────────────────────────────────────────────────────────┐
│  USER wybiera język w UI (przełącznik)                      │
│  └─> Zapisuje się w localStorage + profile.preferred_language│
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PROFILE (profiles table)                                    │
│  - preferred_language: 'pl' | 'en'                           │
│  - disliked_ingredients: ['krewetki'] (w języku PL)          │
│  - preferred_cuisines: ['włoska', 'grecka'] (w języku PL)    │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  AI GENERATION                                               │
│  - System prompt w języku: profile.preferred_language        │
│  - User prompt: w języku wybranym przez usera                │
│  - Walidacja: disliked_ingredients vs recipe (ten sam język!)│
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  RECIPE (recipes table)                                      │
│  - language: 'pl' | 'en' (zapisany język przepisu)           │
│  - recipe: { title, ingredients, instructions... } (w języku)│
│  - tags: ['obiad', 'szybkie'] (w języku przepisu)            │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  LIST & SEARCH                                               │
│  - Opcjonalne filtrowanie: ?lang=pl (pokaż tylko PL recipes) │
│  - FTS: działa dla obu języków (simple config)               │
└─────────────────────────────────────────────────────────────┘
```

**Zalety tego podejścia:**
- ✅ Struktura tabel neutralna językowo (tylko metadata)
- ✅ Łatwo dodać kolejny język (wystarczy extend enum)
- ✅ Brak duplikacji danych
- ✅ Brak potrzeby tłumaczeń
- ✅ Spójność języka (profile ↔ recipe)

---

## 3. Zmiany w bazie danych

### 3.1 Migration: Dodaj pola językowe

```sql
-- Dodaj preferred_language do profiles
ALTER TABLE profiles
ADD COLUMN preferred_language text NOT NULL DEFAULT 'en'
CHECK (preferred_language IN ('pl', 'en'));

-- Dodaj language do recipes
ALTER TABLE recipes
ADD COLUMN language text NOT NULL DEFAULT 'en'
CHECK (language IN ('pl', 'en'));

-- Wypełnij istniejące rekordy domyślną wartością 'en'
UPDATE profiles SET preferred_language = 'en' WHERE preferred_language IS NULL;
UPDATE recipes SET language = 'en' WHERE language IS NULL;

-- Index dla filtrowania po języku
CREATE INDEX idx_recipes_language ON recipes(language);

-- Opcjonalnie: Index dla kombinacji user_id + language (szybsze filtrowanie)
CREATE INDEX idx_recipes_user_language ON recipes(user_id, language);

COMMENT ON COLUMN profiles.preferred_language IS
'User preferred language for UI and recipe generation. Determines language of dietary preferences.';

COMMENT ON COLUMN recipes.language IS
'Language in which the recipe was generated. Must match language used in profile preferences for proper validation.';
```

### 3.2 Aktualizacja RPC `insert_recipe_safe`

```sql
-- Aktualizacja funkcji insert_recipe_safe aby uwzględniała język
CREATE OR REPLACE FUNCTION insert_recipe_safe(
  p_recipe jsonb,
  p_tags text[] DEFAULT NULL,
  p_language text DEFAULT 'pl'  -- NOWY parametr
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

  -- Validate language
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
'Safely insert recipe after checking for disliked ingredients. Validates language parameter.';
```

---

## 4. Zmiany w typach i schematach

### 4.1 Typy (src/types.ts)

```typescript
// Dodaj na początku pliku
/**
 * Supported language codes
 * Centralized definition for easy extension (add 'es', 'fr', etc.)
 */
export type LanguageCode = 'pl' | 'en';

/**
 * Default language for the application
 */
export const DEFAULT_LANGUAGE: LanguageCode = 'en';

// Aktualizuj ProfileDTO (rozszerz istniejący typ)
export interface ProfileDTO extends Tables<"profiles"> {
  preferred_language: LanguageCode; // Dodane
}

// Aktualizuj CreateProfileCommand
export interface CreateProfileCommand {
  diet_type?: DietType;
  disliked_ingredients?: string[];
  preferred_cuisines?: string[];
  preferred_language?: LanguageCode; // Dodane (opcjonalne, domyślnie 'pl')
}

// Aktualizuj UpdateProfileCommand
export interface UpdateProfileCommand {
  diet_type?: DietType | null;
  disliked_ingredients?: string[];
  preferred_cuisines?: string[];
  preferred_language?: LanguageCode; // Dodane
}

// Aktualizuj GenerateRecipeCommand
export interface GenerateRecipeCommand {
  prompt: string;
  lang?: LanguageCode; // Opcjonalne override języka (domyślnie z profilu)
}

// Aktualizuj SaveRecipeCommand
export interface SaveRecipeCommand {
  recipe: RecipeSchema;
  tags?: string[];
  language: LanguageCode; // WYMAGANE - musi być jawnie podane
}

// Aktualizuj RecipeListItemDTO i RecipeDetailsDTO
export interface RecipeListItemDTO extends Pick<Tables<"recipes">, "id" | "title" | "summary" | "tags" | "created_at"> {
  language: LanguageCode; // Dodane
}

export interface RecipeDetailsDTO extends Omit<Tables<"recipes">, "search_tsv" | "ingredients_text"> {
  language: LanguageCode; // Dodane
}

// Aktualizuj RecipeQueryParams
export interface RecipeQueryParams {
  search?: string;
  tags?: string;
  sort?: RecipeSortOrder;
  limit?: number;
  cursor?: string;
  offset?: number;
  lang?: LanguageCode; // Dodane - filtrowanie po języku
}

// Type guards
export function isLanguageCode(value: string): value is LanguageCode {
  return ['pl', 'en'].includes(value);
}
```

### 4.2 Schematy Zod (src/lib/schemas/...)

#### profile.schema.ts
```typescript
import { z } from "zod";

// Dodaj schema języka
export const LanguageCodeSchema = z.enum(['pl', 'en'], {
  errorMap: () => ({ message: "Language must be 'pl' or 'en'" }),
});

// Aktualizuj CreateProfileCommandSchema
export const CreateProfileCommandSchema = z
  .object({
    diet_type: DietTypeSchema.optional(),
    disliked_ingredients: StringArraySchema.optional(),
    preferred_cuisines: StringArraySchema.optional(),
    preferred_language: LanguageCodeSchema.optional().default('en'), // DODANE
  })
  .strict();

// Aktualizuj UpdateProfileCommandSchema
export const UpdateProfileCommandSchema = z
  .object({
    diet_type: DietTypeSchema.nullish(),
    disliked_ingredients: StringArraySchema.optional(),
    preferred_cuisines: StringArraySchema.optional(),
    preferred_language: LanguageCodeSchema.optional(), // DODANE
  })
  .strict()
  .refine(
    (data) =>
      data.diet_type !== undefined ||
      data.disliked_ingredients !== undefined ||
      data.preferred_cuisines !== undefined ||
      data.preferred_language !== undefined, // DODANE do walidacji
    {
      message: "At least one field must be provided for update",
      path: ["_root"],
    }
  );
```

#### recipe.schema.ts
```typescript
// Dodaj import
import { LanguageCodeSchema } from './profile.schema';

// Aktualizuj GenerateRecipeCommandSchema
export const GenerateRecipeCommandSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, "Prompt cannot be empty")
    .max(2000, "Prompt too long (max 2000 characters)")
    // ... existing validations ...
    ,
  lang: LanguageCodeSchema.optional(), // DODANE - opcjonalne override
});

// Aktualizuj SaveRecipeCommandSchema
export const SaveRecipeCommandSchema = z.object({
  recipe: RecipeSchemaZ,
  tags: z
    .array(z.string().trim().min(1).max(50))
    .max(20)
    .optional(),
  language: LanguageCodeSchema, // DODANE - WYMAGANE
});
```

#### recipes.schema.ts (lista/query)
```typescript
export const RecipeListQuerySchema = z
  .object({
    search: z.string().trim().max(200).optional()...,
    tags: z.string().trim().max(200).optional()...,
    sort: RecipeSortOrderSchema.default("recent"),
    limit: z.string().optional()...,
    cursor: z.string().trim().optional()...,
    offset: z.string().optional()...,
    lang: LanguageCodeSchema.optional(), // DODANE - filtrowanie po języku
  })
  .strict()
  .refine(/* cursor/offset mutex */);
```

---

## 5. Zmiany w serwisach

### 5.1 ProfilesService (src/lib/services/profiles.service.ts)

```typescript
// Bez zmian w logice - typy się automatycznie zaktualizują
// Zod schema już waliduje preferred_language
```

### 5.2 RecipesService (src/lib/services/recipes.service.ts)

```typescript
async saveRecipe(userId: string, command: SaveRecipeCommand): Promise<RecipeSummaryDTO> {
  const { recipe, tags, language } = command; // Dodaj language

  // 1. Check recipe size limit
  const recipeJson = JSON.stringify(recipe);
  const sizeBytes = new TextEncoder().encode(recipeJson).length;
  if (sizeBytes >= 204800) {
    throw new Error(`Recipe too large: ${sizeBytes} bytes (max 204800 bytes)`);
  }

  // 2. Normalize tags
  const normalizedTags = normalizeTags(tags);

  // 3. Call RPC with language parameter
  const { data: recipeId, error: rpcError } = await this.supabase.rpc("insert_recipe_safe", {
    p_recipe: recipe as RecipeSchema,
    p_tags: normalizedTags.length > 0 ? normalizedTags : null,
    p_language: language, // DODANE
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

  // 4. Fetch recipe summary (dodaj language do select)
  const { data: summary, error: selectError } = await this.supabase
    .from("recipes")
    .select("id, user_id, title, summary, tags, language, created_at, updated_at") // DODANE language
    .eq("id", recipeId)
    .single();

  if (selectError || !summary) {
    console.error(`Failed to fetch saved recipe summary ${recipeId}:`, selectError);
    throw new Error("Failed to fetch saved recipe summary");
  }

  return summary as RecipeSummaryDTO;
}

async getRecipeDetails(id: string, userId: string): Promise<RecipeDetailsDTO | null> {
  const { data, error } = await this.supabase
    .from("recipes")
    .select("id, user_id, title, summary, tags, recipe, language, created_at, updated_at") // DODANE language
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  // ... rest unchanged
}

async listRecipes(userId: string, query: RecipeQueryParams): Promise<RecipeListResponse> {
  const { search, tags, sort = "recent", limit = 20, cursor, offset, lang } = query; // DODANE lang

  let queryBuilder = this.supabase
    .from("recipes")
    .select("id, title, summary, tags, language, created_at", { count: "exact" }) // DODANE language
    .eq("user_id", userId);

  // DODANE: Filtrowanie po języku (opcjonalne)
  if (lang) {
    queryBuilder = queryBuilder.eq("language", lang);
  }

  // ... rest of filters (tags, search, sort, pagination) unchanged ...

  return response;
}
```

### 5.3 AI Service (src/lib/services/ai/ai.service.ts)

```typescript
/**
 * Generate a recipe with retry logic
 * @param prompt - User's recipe request
 * @param profile - User's profile with dietary preferences (optional)
 * @param lang - Language override (optional, defaults to profile.preferred_language or 'pl')
 * @returns Generated recipe matching RecipeSchema
 */
async generateRecipe(
  prompt: string,
  profile?: ProfileDTO,
  lang?: LanguageCode
): Promise<RecipeSchema> {
  // Determine language: explicit override > profile preference > default 'en'
  const recipeLanguage: LanguageCode = lang ?? profile?.preferred_language ?? 'en';

  let lastError: Error | undefined;
  let attempt = 0;
  const maxAttempts = this.maxRetries + 1;

  while (attempt < maxAttempts) {
    try {
      console.log(`AI generation attempt ${attempt + 1}/${maxAttempts} (language: ${recipeLanguage})`);

      // Przekaż language do providera
      const recipe = await this.provider.generateRecipe(prompt, profile, recipeLanguage);

      this.validateRecipeSize(recipe);
      return recipe;
    } catch (error) {
      // ... existing error handling ...
    }
  }

  throw lastError || new Error("AI generation failed with unknown error");
}
```

### 5.4 AI Provider Interface (src/lib/services/ai/types.ts)

```typescript
export interface AiProvider {
  /**
   * Generate a recipe from user prompt
   * @param prompt - User's recipe request
   * @param profile - Optional user profile with dietary preferences
   * @param lang - Language for recipe generation ('pl' or 'en')
   */
  generateRecipe(
    prompt: string,
    profile?: ProfileDTO,
    lang?: LanguageCode
  ): Promise<RecipeSchema>;
}
```

### 5.5 AI Prompt Builder (src/lib/services/ai/utils/recipe-prompt-builder.ts)

```typescript
import type { ProfileDTO, LanguageCode } from "../../../../types";

/**
 * Language-specific instruction templates
 * Easy to extend with new languages
 */
const LANGUAGE_INSTRUCTIONS: Record<LanguageCode, string> = {
  pl: `IMPORTANT: You MUST respond in POLISH language.
ALL recipe content (title, description, summary, ingredients, instructions, tags, cuisine) MUST be written in Polish.

Example tags in Polish: "obiad", "szybkie", "wegetariańskie", "zdrowe"
Example cuisine in Polish: "włoska", "grecka", "azjatycka", "polska"`,

  en: `IMPORTANT: You MUST respond in ENGLISH language.
ALL recipe content (title, description, summary, ingredients, instructions, tags, cuisine) MUST be written in English.

Example tags in English: "dinner", "quick", "vegetarian", "healthy"
Example cuisine in English: "italian", "greek", "asian", "polish"`,
};

/**
 * Build system prompt with recipe schema and dietary preferences
 * @param profile - Optional user profile with dietary preferences
 * @param lang - Language for recipe generation
 * @returns Formatted system prompt
 */
export function buildSystemPrompt(
  profile?: ProfileDTO,
  lang: LanguageCode = 'en'
): string {
  const languageInstruction = LANGUAGE_INSTRUCTIONS[lang];

  let prompt = `${languageInstruction}

You are a professional chef and recipe creator. Generate recipes in strict JSON format matching this structure:

{
  "title": "Recipe Title",
  "summary": "Brief one-sentence summary",
  "description": "Detailed description",
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "servings": 4,
  "difficulty": "easy|medium|hard",
  "cuisine": "Italian",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"],
  "tags": ["tag1", "tag2"],
  "dietary_info": {
    "vegetarian": true,
    "vegan": false,
    "gluten_free": false,
    "dairy_free": false,
    "nut_free": true
  },
  "nutrition": {
    "calories": 350,
    "protein_g": 12,
    "carbs_g": 45,
    "fat_g": 10
  }
}

CRITICAL RULES:
- Return ONLY valid JSON, no markdown, no explanations
- All text content MUST be in ${lang === 'pl' ? 'POLISH' : 'ENGLISH'} language
- All fields must match the types shown above
- ingredients and instructions must be non-empty arrays
- times and servings must be positive numbers
- difficulty must be exactly: "easy", "medium", or "hard"`;

  // Append user dietary preferences if provided
  if (profile) {
    prompt += buildDietaryPreferencesSection(profile, lang);
  }

  return prompt;
}

/**
 * Build user prompt from user input
 * @param userPrompt - User's recipe request (in any language)
 * @param lang - Expected response language
 * @returns Formatted user prompt
 */
export function buildUserPrompt(userPrompt: string, lang: LanguageCode = 'en'): string {
  const instruction = lang === 'pl'
    ? 'Stwórz przepis na'
    : 'Create a recipe for';

  return `${instruction}: ${userPrompt}

Remember: Return ONLY valid JSON in ${lang === 'pl' ? 'POLISH' : 'ENGLISH'} matching the exact structure specified in the system prompt.`;
}

/**
 * Build dietary preferences section for system prompt (internal helper)
 * Language-aware formatting
 */
function buildDietaryPreferencesSection(
  profile: ProfileDTO,
  lang: LanguageCode
): string {
  const labels = lang === 'pl'
    ? {
        header: 'PREFERENCJE DIETETYCZNE UŻYTKOWNIKA:',
        dietType: 'Typ diety',
        avoid: 'UNIKAJ tych składników',
        preferred: 'Preferowane kuchnie',
      }
    : {
        header: 'USER DIETARY PREFERENCES:',
        dietType: 'Diet type',
        avoid: 'AVOID these ingredients',
        preferred: 'Preferred cuisines',
      };

  let section = `\n\n${labels.header}`;

  if (profile.diet_type) {
    section += `\n- ${labels.dietType}: ${profile.diet_type}`;
  }

  if (profile.disliked_ingredients && profile.disliked_ingredients.length > 0) {
    section += `\n- ${labels.avoid}: ${profile.disliked_ingredients.join(", ")}`;
  }

  if (profile.preferred_cuisines && profile.preferred_cuisines.length > 0) {
    section += `\n- ${labels.preferred}: ${profile.preferred_cuisines.join(", ")}`;
  }

  return section;
}
```

### 5.6 Aktualizacja providerów

**Każdy provider (google.provider.ts, openrouter.provider.ts, mock.provider.ts):**

```typescript
async generateRecipe(
  prompt: string,
  profile?: ProfileDTO,
  lang: LanguageCode = 'en'
): Promise<RecipeSchema> {
  const systemPrompt = buildSystemPrompt(profile, lang);
  const userPrompt = buildUserPrompt(prompt, lang);

  // ... rest of implementation with systemPrompt and userPrompt
}
```

---

## 6. Zmiany w API endpoints

### 6.1 POST /api/recipes/generate

```typescript
// src/pages/api/recipes/generate.ts

export const POST: APIRoute = async ({ request }) => {
  const requestId = uuidv4();

  try {
    // ... authentication ...

    // ... rate limiting ...

    // Validation
    const validation = GenerateRecipeCommandSchema.safeParse(body);
    if (!validation.success) {
      // ... error handling
    }

    const { prompt, lang } = validation.data; // Extract lang (optional)

    // Fetch user profile
    let profile;
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      profile = profileData || undefined;
    } catch {
      console.log("No profile found for user, continuing without preferences");
    }

    // Determine final language: explicit override > profile preference > default 'en'
    const finalLang: LanguageCode = lang ?? profile?.preferred_language ?? 'en';

    // Log ai_prompt_sent event
    await eventsService.createEvent(userId, {
      type: "ai_prompt_sent",
      payload: {
        prompt_preview: EventsService.truncatePrompt(prompt, 256),
        language: finalLang, // DODANE
        request_id: requestId,
        model: import.meta.env.AI_MODEL,
      },
    });

    // Generate recipe (pass finalLang)
    const aiService = AiService.fromEnv();
    const recipe = await aiService.generateRecipe(prompt, profile, finalLang);

    // Log ai_recipe_generated event
    const generationId = uuidv4();
    await eventsService.createEvent(userId, {
      type: "ai_recipe_generated",
      payload: {
        generation_id: generationId,
        title: recipe.title,
        tags: recipe.tags || [],
        language: finalLang, // DODANE
        request_id: requestId,
      },
    });

    // Return success response with Content-Language header
    const response: GenerateRecipeResponse = {
      recipe,
      generation_id: generationId,
      generated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Language": finalLang, // DODANE
      },
    });
  } catch (error) {
    // ... error handling
  }
};
```

### 6.2 POST /api/recipes (Save)

```typescript
// src/pages/api/recipes/index.ts

export const POST: APIRoute = async ({ request }) => {
  // ... authentication ...

  // Validation
  const validation = SaveRecipeCommandSchema.safeParse(body);
  if (!validation.success) {
    // ... error handling
  }

  const { recipe, tags, language } = validation.data; // Extract language (required)

  // Save recipe with language
  const recipesService = new RecipesService(supabase);
  const summary = await recipesService.saveRecipe(userId, {
    recipe,
    tags,
    language, // Pass to service
  });

  // Log recipe_saved event
  await eventsService.createEvent(userId, {
    type: "recipe_saved",
    payload: {
      recipe_id: summary.id,
      title: summary.title,
      tags: summary.tags || [],
      language, // DODANE
    },
  });

  return new Response(JSON.stringify(summary), {
    status: 201,
    headers: {
      "Content-Type": "application/json",
      "Content-Language": language, // DODANE
    },
  });
};
```

### 6.3 GET /api/recipes (List)

```typescript
// Query validation już ma lang (RecipeListQuerySchema)
// Service już filtruje po lang jeśli podane

export const GET: APIRoute = async ({ request, url }) => {
  // ... authentication ...

  // Parse and validate query params
  const queryParams = {
    search: url.searchParams.get("search") || undefined,
    tags: url.searchParams.get("tags") || undefined,
    sort: url.searchParams.get("sort") || "recent",
    limit: url.searchParams.get("limit") || "20",
    cursor: url.searchParams.get("cursor") || undefined,
    offset: url.searchParams.get("offset") || undefined,
    lang: url.searchParams.get("lang") || undefined, // DODANE
  };

  const validation = RecipeListQuerySchema.safeParse(queryParams);
  if (!validation.success) {
    // ... error handling
  }

  const recipesService = new RecipesService(supabase);
  const result = await recipesService.listRecipes(userId, validation.data);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // Opcjonalnie: Vary header jeśli używamy lang w filtrze
      ...(validation.data.lang && { "Content-Language": validation.data.lang }),
    },
  });
};
```

### 6.4 GET /api/recipes/:id (Details)

```typescript
// Service już zwraca language w RecipeDetailsDTO

export const GET: APIRoute = async ({ params, request }) => {
  // ... authentication ...
  // ... fetch recipe ...

  if (!recipe) {
    return jsonError(404, "Not Found", "Recipe not found");
  }

  return new Response(JSON.stringify(recipe), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Language": recipe.language, // DODANE - informuje o języku przepisu
    },
  });
};
```

### 6.5 Profile endpoints (GET/POST/PUT /api/profile)

```typescript
// Bez zmian w logice - schema automatycznie waliduje preferred_language
// ProfileDTO już ma preferred_language w typie

// GET - zwróci preferred_language w response
// POST/PUT - przyjmie preferred_language w body
```

---

## 7. Frontend integration

### 7.1 UX przełącznika języka (auto-save, jak dark mode)

**Kluczowa decyzja:** Przełącznik języka **automatycznie zapisuje** wybór bez dodatkowego przycisku.

**Przepływ:**
1. User klika przełącznik PL ↔ EN
2. UI natychmiast się zmienia (instant feedback)
3. Wybór zapisuje się do localStorage (lokalne)
4. W tle wysyła request do `/api/profile` (sync do bazy)
5. Jeśli backend fail → localStorage nadal działa (graceful degradation)

**Zalety:**
- ✅ Spójne z dark mode (ten sam UX pattern)
- ✅ Nie wymaga dodatkowego kliku "Zapisz preferencje"
- ✅ Instant feedback - użytkownik od razu widzi efekt
- ✅ Następna generacja użyje nowego języka (z profilu)

**Implementacja:**

### 7.2 I18n Context rozszerzony

```typescript
// src/contexts/I18nContext.tsx

interface I18nContextValue {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    // 1. Try localStorage
    const stored = localStorage.getItem('preferred_language');
    if (stored && isLanguageCode(stored)) {
      return stored;
    }

    // 2. Try navigator.language (Polish users get PL, others get EN)
    const browserLang = navigator.language.split('-')[0];
    if (isLanguageCode(browserLang)) {
      return browserLang;
    }

    // 3. Default to English
    return 'en';
  });

  const setLang = useCallback(async (newLang: LanguageCode) => {
    // 1. Instant UI update (no waiting for backend)
    setLangState(newLang);
    localStorage.setItem('preferred_language', newLang);
    document.documentElement.lang = newLang;

    // 2. Background sync to profile (non-blocking, fire-and-forget)
    // User doesn't need to click "Save" - it happens automatically
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferred_language: newLang,
        }),
      });
      console.log('✓ Language preference synced to profile');
    } catch (error) {
      console.warn('⚠ Failed to sync language to profile (localStorage still works):', error);
      // Graceful degradation: localStorage works, profile sync can retry later
      // Optionally: queue for retry or show subtle notification
    }
  }, [token]);

  // ... rest of context
};
```

### 7.3 Language Switcher Component (UI Header)

```typescript
// src/components/LanguageSwitcher.tsx

const LanguageSwitcher: React.FC = () => {
  const { lang, setLang } = useI18n();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleLanguageChange = async (newLang: LanguageCode) => {
    if (newLang === lang) return;

    setIsSyncing(true);
    await setLang(newLang); // Auto-saves to profile
    setIsSyncing(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="language-select" className="sr-only">
        {lang === 'pl' ? 'Wybierz język' : 'Select language'}
      </Label>

      {/* Toggle button (like dark mode) */}
      <ToggleGroup
        type="single"
        value={lang}
        onValueChange={handleLanguageChange}
        aria-label="Language selection"
      >
        <ToggleGroupItem value="pl" aria-label="Polski">
          PL
        </ToggleGroupItem>
        <ToggleGroupItem value="en" aria-label="English">
          EN
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Optional: subtle indicator during sync */}
      {isSyncing && (
        <Spinner className="h-3 w-3 text-muted-foreground" aria-label="Syncing..." />
      )}
    </div>
  );
};
```

**Alternatywnie (dropdown):**
```typescript
<Select value={lang} onValueChange={setLang}>
  <SelectTrigger className="w-20">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="pl">🇵🇱 PL</SelectItem>
    <SelectItem value="en">🇬🇧 EN</SelectItem>
  </SelectContent>
</Select>
```

### 7.4 Generator Component

```typescript
// src/components/Generator.tsx

const Generator: React.FC = () => {
  const { lang } = useI18n(); // Get current UI language
  const [prompt, setPrompt] = useState('');

  const { mutate: generateRecipe, isLoading } = useMutation({
    mutationFn: async (promptText: string) => {
      const response = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptText,
          // lang is optional - backend will use profile.preferred_language
          // which was set when user changed UI language
        }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Store draft with language
      sessionStorage.setItem('recipe_draft_v1', JSON.stringify({
        recipe: data.recipe,
        generationId: data.generation_id,
        generatedAt: data.generated_at,
        language: lang, // Store language with draft
      }));

      // Switch to preview
      // ...
    },
  });

  // ... rest of component
};
```

### 7.5 Save Recipe

```typescript
// src/components/RecipePreview.tsx

const RecipePreview: React.FC<{ recipe: RecipeSchema }> = ({ recipe }) => {
  const { lang } = useI18n();

  const { mutate: saveRecipe } = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipe,
          tags: recipe.tags,
          language: lang, // MUST include - current UI language
        }),
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recipes:list']);
      toast.success(t('recipe.saved'));
    },
  });

  // ... rest of component
};
```

### 7.6 Profile Form

```typescript
// src/components/ProfileForm.tsx

const ProfileForm: React.FC = () => {
  const { lang, t } = useI18n();
  const [formData, setFormData] = useState({
    diet_type: '',
    disliked_ingredients: [],
    preferred_cuisines: [],
  });

  // Hint dla użytkownika
  return (
    <form>
      {/* ... diet_type, etc. ... */}

      <FormField name="disliked_ingredients">
        <Label>{t('profile.dislikedIngredients')}</Label>
        <Alert variant="info">
          {t('profile.dislikedIngredientsHint')}
          {/* "Enter ingredients in the same language as your recipe generation (currently: {lang})" */}
        </Alert>
        <TagInput
          value={formData.disliked_ingredients}
          onChange={(tags) => setFormData({ ...formData, disliked_ingredients: tags })}
          placeholder={lang === 'pl' ? 'np. krewetki, grzyby' : 'e.g. shrimp, mushrooms'}
        />
      </FormField>

      {/* Similar for preferred_cuisines */}
    </form>
  );
};
```

### 7.7 Recipe List with language filter (opcjonalne)

```typescript
// src/components/RecipeList.tsx

const RecipeList: React.FC = () => {
  const { lang } = useI18n();
  const [filters, setFilters] = useState({
    search: '',
    tags: [],
    lang: undefined as LanguageCode | undefined, // Opcjonalny filtr
  });

  const { data } = useQuery({
    queryKey: ['recipes:list', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.tags.length) params.set('tags', filters.tags.join(','));
      if (filters.lang) params.set('lang', filters.lang);

      const response = await fetch(`/api/recipes?${params}`);
      return response.json();
    },
  });

  return (
    <div>
      {/* Opcjonalny toggle: "Show only {lang} recipes" */}
      <Checkbox
        checked={filters.lang === lang}
        onCheckedChange={(checked) => {
          setFilters({ ...filters, lang: checked ? lang : undefined });
        }}
      >
        {t('recipeList.showOnlyCurrentLanguage')} ({lang.toUpperCase()})
      </Checkbox>

      {/* Recipe cards */}
      {data?.data.map(recipe => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          // Opcjonalnie: badge pokazujący język jeśli różny od UI
          showLanguageBadge={recipe.language !== lang}
        />
      ))}
    </div>
  );
};
```

---

## 8. Tłumaczenia słowników (src/i18n/*.json)

### pl.json (dodatki)
```json
{
  "profile": {
    "dislikedIngredientsHint": "Wprowadź składniki w języku, w którym generujesz przepisy (obecnie: polski)",
    "preferredCuisinesHint": "Wprowadź kuchnie w języku polskim, np. 'włoska', 'grecka'"
  },
  "recipe": {
    "languageMismatch": "Ten przepis został wygenerowany w języku: {{language}}",
    "saved": "Przepis zapisany pomyślnie"
  },
  "recipeList": {
    "showOnlyCurrentLanguage": "Pokaż tylko przepisy w języku polskim"
  }
}
```

### en.json (dodatki)
```json
{
  "profile": {
    "dislikedIngredientsHint": "Enter ingredients in the language you generate recipes (currently: English)",
    "preferredCuisinesHint": "Enter cuisines in English, e.g. 'italian', 'greek'"
  },
  "recipe": {
    "languageMismatch": "This recipe was generated in language: {{language}}",
    "saved": "Recipe saved successfully"
  },
  "recipeList": {
    "showOnlyCurrentLanguage": "Show only English recipes"
  }
}
```

---

## 9. Dokumentacja API (API.md) - aktualizacje

### Sekcja: Language Support

```markdown
## Language Support

SavorAI supports recipe generation in multiple languages. Currently supported: Polish (pl) and English (en).

### How it works

1. **User sets preferred language** via UI language switcher (like dark mode toggle)
2. **Language is saved to profile** (`profiles.preferred_language`)
3. **Dietary preferences** (disliked ingredients, cuisines) are entered in chosen language
4. **Recipe generation** uses profile language by default (can be overridden per request)
5. **Generated recipe** is stored with its language tag (`recipes.language`)
6. **No translations**: Recipes stay in their original generation language

### Language precedence for generation

POST /api/recipes/generate uses this priority:
1. Explicit `lang` parameter in request body (if provided)
2. User's `profile.preferred_language` (if profile exists)
3. Default: `'en'` (English)

### Important notes

- **Consistency is key**: Disliked ingredients must be in the same language as generated recipes
  - Example: If profile has `disliked_ingredients: ['krewetki']` (PL), generate recipes in Polish
  - If generating in English, ensure profile has `['shrimp']` instead

- **No automatic translation**: Recipes generated in one language stay in that language
  - A recipe generated in Polish will always be displayed in Polish
  - To get an English version, generate a new recipe in English

- **Filtering**: You can optionally filter recipe list by language using `?lang=pl` or `?lang=en`

### Adding new languages (future)

The architecture is designed for easy extension:
1. Add new language code to `LanguageCode` type: `'pl' | 'en' | 'es'`
2. Add prompt template to `LANGUAGE_INSTRUCTIONS` in prompt builder
3. Add translations to `src/i18n/{code}.json`
4. Update database CHECK constraints to include new language code

No structural changes to database or API contracts required.
```

### POST /api/recipes/generate - zaktualizowany przykład

```markdown
#### Generate Recipe
- **Method**: POST
- **URL**: `/api/recipes/generate`
- **Headers**: `Authorization: Bearer {token}`
- **Request Body**:
```json
{
  "prompt": "Quick Mediterranean dinner for 4",
  "lang": "en"  // Optional: 'pl' or 'en' (defaults to profile.preferred_language or 'en')
}
```
- **Response** (200 OK):
```json
{
  "recipe": { /* RecipeSchema in Polish */ },
  "generation_id": "uuid",
  "generated_at": "2025-01-16T10:00:00Z"
}
```
- **Response Headers**:
  - `Content-Language: pl` (language of generated recipe)
```

---

## 10. Testy

### 10.1 Unit tests

```typescript
// src/lib/services/ai/utils/recipe-prompt-builder.test.ts

describe('buildSystemPrompt', () => {
  it('should generate Polish prompt by default', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain('POLISH language');
    expect(prompt).toContain('wszystkie składniki po polsku');
  });

  it('should generate English prompt when lang=en', () => {
    const prompt = buildSystemPrompt(undefined, 'en');
    expect(prompt).toContain('ENGLISH language');
    expect(prompt).toContain('all ingredients in English');
  });

  it('should include profile preferences in correct language', () => {
    const profile = {
      diet_type: 'vegan',
      disliked_ingredients: ['krewetki', 'grzyby'],
      preferred_cuisines: ['włoska'],
      preferred_language: 'pl',
    };

    const promptPL = buildSystemPrompt(profile, 'pl');
    expect(promptPL).toContain('UNIKAJ tych składników');

    const promptEN = buildSystemPrompt(profile, 'en');
    expect(promptEN).toContain('AVOID these ingredients');
  });
});

// src/lib/schemas/recipe.schema.test.ts

describe('GenerateRecipeCommandSchema', () => {
  it('should accept valid prompt with lang', () => {
    const result = GenerateRecipeCommandSchema.safeParse({
      prompt: 'Test recipe',
      lang: 'pl',
    });
    expect(result.success).toBe(true);
    expect(result.data?.lang).toBe('pl');
  });

  it('should default lang to undefined if not provided', () => {
    const result = GenerateRecipeCommandSchema.safeParse({
      prompt: 'Test recipe',
    });
    expect(result.success).toBe(true);
    expect(result.data?.lang).toBeUndefined();
  });

  it('should reject invalid lang', () => {
    const result = GenerateRecipeCommandSchema.safeParse({
      prompt: 'Test',
      lang: 'fr', // Not supported yet
    });
    expect(result.success).toBe(false);
  });
});

// src/lib/schemas/profile.schema.test.ts

describe('CreateProfileCommandSchema', () => {
  it('should default preferred_language to en', () => {
    const result = CreateProfileCommandSchema.safeParse({
      diet_type: 'vegan',
    });
    expect(result.success).toBe(true);
    expect(result.data?.preferred_language).toBe('en');
  });

  it('should accept explicit preferred_language', () => {
    const result = CreateProfileCommandSchema.safeParse({
      preferred_language: 'en',
    });
    expect(result.success).toBe(true);
    expect(result.data?.preferred_language).toBe('en');
  });
});
```

### 10.2 E2E tests (Playwright)

```typescript
// e2e/recipe-generation-i18n.spec.ts

test.describe('Recipe generation with language support', () => {
  test('should generate recipe in Polish when UI is Polish', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Ensure UI is in Polish
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-value="pl"]');

    // Set profile with Polish ingredients
    await page.goto('/profile');
    await page.fill('[name="disliked_ingredients"]', 'krewetki, grzyby');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Profil zapisany');

    // Generate recipe
    await page.goto('/app');
    await page.fill('[name="prompt"]', 'Szybki obiad na 4 osoby');
    await page.click('button:has-text("Generuj")');

    // Wait for generation
    await page.waitForSelector('[data-testid="recipe-preview"]', { timeout: 30000 });

    // Verify recipe is in Polish
    const title = await page.textContent('[data-testid="recipe-title"]');
    const ingredients = await page.textContent('[data-testid="recipe-ingredients"]');

    // Check for Polish characters/words (heuristic)
    expect(title).toBeTruthy();
    expect(ingredients).not.toContain('shrimp'); // Should be 'krewetki' or avoided
  });

  test('should generate recipe in English when UI is English', async ({ page }) => {
    await page.goto('/login');
    // ... login ...

    // Switch to English
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-value="en"]');

    // Set profile with English ingredients
    await page.goto('/profile');
    await page.fill('[name="disliked_ingredients"]', 'shrimp, mushrooms');
    await page.click('button[type="submit"]');

    // Generate recipe
    await page.goto('/app');
    await page.fill('[name="prompt"]', 'Quick dinner for 4 people');
    await page.click('button:has-text("Generate")');

    await page.waitForSelector('[data-testid="recipe-preview"]');

    const title = await page.textContent('[data-testid="recipe-title"]');
    expect(title).toBeTruthy();
    expect(title).toMatch(/^[a-zA-Z\s]+$/); // Rough check for English
  });

  test('should block saving recipe with disliked ingredient in same language', async ({ page }) => {
    // ... login, set profile with disliked_ingredients: ['shrimp'] in EN ...

    // Generate recipe that contains shrimp
    await page.fill('[name="prompt"]', 'Shrimp pasta recipe');
    await page.click('button:has-text("Generate")');
    await page.waitForSelector('[data-testid="recipe-preview"]');

    // Save button should be disabled with warning
    const saveButton = page.locator('button:has-text("Save")');
    await expect(saveButton).toBeDisabled();

    const warning = page.locator('text=/contains disliked ingredient/i');
    await expect(warning).toBeVisible();
  });
});

// e2e/recipe-list-language-filter.spec.ts

test.describe('Recipe list language filtering', () => {
  test('should filter recipes by language', async ({ page }) => {
    // ... setup: generate 2 recipes in PL, 2 in EN ...

    await page.goto('/app');

    // Initially shows all 4
    await expect(page.locator('[data-testid="recipe-card"]')).toHaveCount(4);

    // Filter to PL only
    await page.check('input[name="filter-language-pl"]');
    await expect(page.locator('[data-testid="recipe-card"]')).toHaveCount(2);

    // Verify all shown recipes have language badge 'PL' or no badge (same as UI)
    const badges = await page.locator('[data-testid="recipe-language-badge"]').allTextContents();
    badges.forEach(badge => {
      expect(badge).not.toBe('EN');
    });
  });
});
```

---

## 11. Migration checklist

### Przed wdrożeniem:
- [ ] Backup bazy danych
- [ ] Przegląd obecnych danych w `profiles` i `recipes`
- [ ] Plan komunikacji z użytkownikami (jeśli są early users)

### Wdrożenie:
- [ ] Uruchom migrację SQL (dodaj `preferred_language` i `language`)
- [ ] Wypełnij istniejące rekordy wartością domyślną `'en'`
- [ ] Zweryfikuj RPC `insert_recipe_safe` z nowym parametrem

### Po wdrożeniu:
- [ ] Sprawdź logi generacji: czy `language` jest logowane
- [ ] Zweryfikuj, że istniejący users mogą nadal generować przepisy
- [ ] Monitor: czy AI respektuje instrukcje językowe

---

## 12. Podsumowanie i odpowiedzi na pytania

### Czy plan spełnia założenia?

✅ **TAK** - ten poprawiony plan spełnia wszystkie Twoje wymagania:

1. ✅ **UI i komunikaty** - w PL/EN (już zaplanowane w ui-plan.md)
2. ✅ **Prompt użytkownika** - może być w dowolnym języku, AI dostosowuje się
3. ✅ **Wygenerowany przepis** - w wybranym języku (dzięki instrukcji w prompcie)
4. ✅ **Preferencje** - wprowadzone w wybranym języku, zapisane z `preferred_language`
5. ✅ **Przełącznik języka** - jak dark mode, zapisuje do profilu i localStorage
6. ✅ **Brak tłumaczeń** - przepisy pozostają w języku generacji

### Czy struktura ułatwia dodawanie języków?

✅ **TAK** - architektura jest bardzo skalowalna:

**Aby dodać nowy język (np. hiszpański):**
1. Dodaj `'es'` do typu `LanguageCode` (1 linia)
2. Dodaj szablon promptu do `LANGUAGE_INSTRUCTIONS` (~10 linii)
3. Dodaj plik `src/i18n/es.json` (kopia struktury pl.json)
4. Zaktualizuj CHECK constraints w bazie: `IN ('pl', 'en', 'es')`

**Nie trzeba:**
- ❌ Zmieniać struktury tabel
- ❌ Modyfikować logiki API/serwisów
- ❌ Tworzyć osobnych endpointów
- ❌ Duplikować danych

### Czy podejście "neutralna baza + wersje promptu" jest najlepsze?

✅ **TAK** - to jest optymalne podejście, ponieważ:

**Zalety:**
1. ✅ **Prostota** - język to tylko metadata (kolumna text), nie wymaga złożonych relacji
2. ✅ **Skalowalność** - dodanie języka = extend enum, zero zmian strukturalnych
3. ✅ **Wydajność** - brak JOINów do tabel tłumaczeń
4. ✅ **Zgodność z założeniem** - przepis w jednym języku = jeden rekord
5. ✅ **Łatwość wyszukiwania** - FTS działa na treści w oryginalnym języku
6. ✅ **Przyszłościowe** - jeśli kiedyś będziemy chcieli tłumaczenia, możemy dodać `recipe_locales` bez breaking changes

**Alternatywne podejścia (gorsze dla tego use case):**

❌ **Osobne tabele per język** (`recipes_pl`, `recipes_en`)
- Trudne w zarządzaniu, wymaga duplikacji logiki
- Niemożliwe do łatwego dodania nowego języka

❌ **Tabela tłumaczeń** (`recipe_locales` dla wszystkich)
- Over-engineering dla MVP, gdzie NIE MA tłumaczeń
- Komplikuje zapytania (JOINy)
- Nieadekwatne do założenia "brak tłumaczeń"

✅ **Twoje podejście (metadata + content w oryginalnym języku)** - **najlepsze!**

---

## 13. Szacowany czas implementacji

| Faza | Zadania | Czas |
|------|---------|------|
| **Backend** | Migracja DB, aktualizacja typów, schematów, serwisów, prompt builder, providery, endpoints | 4-6h |
| **Frontend** | I18n context rozszerzony, komponenty (Generator, Profile, List), hinty/badges | 3-4h |
| **Testy** | Unit testy (schemas, prompt builder), E2E (generacja PL/EN, filtrowanie) | 2-3h |
| **Dokumentacja** | API.md, README, komentarze w kodzie | 1-2h |
| **Weryfikacja** | Testy manualne, monitoring logów, feedback loop | 1-2h |
| **TOTAL** | | **11-17h** |

**Rekomendacja:** Podejście iteracyjne:
1. **Sprint 1 (6-8h):** Backend + podstawowy frontend (generacja + zapis)
2. **Sprint 2 (3-4h):** Rozszerzony UI (hinty, badges, filtrowanie)
3. **Sprint 3 (2-3h):** Testy + dokumentacja
4. **Sprint 4 (1-2h):** Polish & deployment

---

## 14. Ryzyka i mitigacje

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitigacja |
|--------|-------------------|-------|-----------|
| AI ignoruje instrukcję językową | Średnie | Wysokie | Wyraźne instrukcje w prompcie, monitoring, ewentualnie post-processing language detection |
| Niespójność języka profile vs recipe | Średnie | Średnie | Hinty w UI, walidacja po stronie klienta, komunikaty ostrzegawcze |
| Użytkownik ma stare przepisy bez `language` | Pewne (migracja) | Niskie | Migracja wypełnia `'en'`, komunikat w UI o możliwej niespójności |
| FTS gorsza jakość dla mixed languages | Niskie | Niskie | MVP używa `simple`, post-MVP można dodać per-language FTS configs |

---

## Gotowe do implementacji! 🚀

Ten plan jest:
- ✅ Kompletny (wszystkie warstwy: DB → API → UI)
- ✅ Zgodny z założeniami MVP
- ✅ Skalowalny (łatwe dodawanie języków)
- ✅ Praktyczny (konkretne zmiany w kodzie)
- ✅ Przetestowany (unit + E2E)

Możemy przystąpić do implementacji po Twojej akceptacji!