# 🔄 KOMPLETNY FLOW GENEROWANIA PRZEPISU - KROK PO KROKU

## PRZEGLĄD ARCHITEKTURY

```
USER (Frontend)
│
├─ 1. Wprowadza prompt w textarea (max 2000 znaków)
├─ 2. Klika "Generate Recipe"
│
▼
API ENDPOINT: POST /api/recipes/generate
│
├─ 3. Autentykacja (Bearer token)
├─ 4. Rate limiting (10/godz)
├─ 5. Walidacja promptu (Zod)
├─ 6. Pobieranie profilu użytkownika (optional)
├─ 7. Event log: ai_prompt_sent
│
▼
AI SERVICE (Facade Pattern)
│
├─ 8. Wybór providera: Mock / OpenRouter / Google
├─ 9. Retry logic (max 1 retry z exponential backoff)
├─ 10. Walidacja rozmiaru (200KB limit)
│
▼
AI PROVIDER (OpenRouter/Google/Mock)
│
├─ 11. Budowanie system promptu (RecipePromptBuilder) + preferencje profilu
├─ 12. Wysłanie do LLM (LLMRequestManager) + Timeout
├─ 13. Parsowanie JSON z odpowiedzi (RecipeResponseParser) + Cleanup
├─ 14. Walidacja przez RecipeSchemaZ (RecipeResponseParser)
│
▼
RESPONSE & PREVIEW DISPLAY (Frontend)
│
├─ 15. Event log: ai_recipe_generated
├─ 16. Zwrot JSON: {recipe, generation_id, generated_at}
├─ 17. Zapis do sessionStorage (draft)
├─ 18. Auto-switch na Preview tab
└─ 19. Render przepisu w RecipePreview
```

---

## KROK 1: Pobranie promptu od użytkownika 🖊️

### Lokalizacja: `src/components/app/GeneratorPanel.tsx`

```tsx
// Stan promptu
const [prompt, setPrompt] = useState("");

// Walidacja
const isPromptValid = prompt.trim().length >= 1 && prompt.trim().length <= 2000;

// Wysyłka
const handleGenerate = () => {
  generateMutation.mutate(
    { prompt: prompt.trim() },  // ← Trimowany prompt
    {
      onSuccess: (response) => {
        // Zapis draftu do sessionStorage
        const draft = {
          prompt: prompt.trim(),
          recipe: response.recipe,
          generationId: response.generation_id,
          generatedAt: response.generated_at,
        };
        sessionStorage.setItem("generatorDraft", JSON.stringify(draft));
        onGenerated(response);  // Przełącz na Preview
      }
    }
  );
};
```

### Komponent: `TextareaWithCounter.tsx`
- **Licznik znaków**: `{value.length} / {maxLength}`
- **Limity kolorów**:
  - Żółty: < 100 pozostałych
  - Czerwony: limit osiągnięty
- **Accessibility**: `aria-describedby`, `aria-live="polite"`

**Frontend validation**:
```typescript
- Min: 1 znak
- Max: 2000 znaków
- Auto-trim na wysyłce
```

---

## KROK 2: Wysyłka HTTP do API 📡

### Lokalizacja: `src/lib/api/recipes.ts`

```typescript
async function generateRecipe(command: GenerateRecipeCommand): Promise<GenerateRecipeResponse> {
  return apiFetch<GenerateRecipeResponse>("/api/recipes/generate", {
    method: "POST",
    body: JSON.stringify(command),  // { prompt: string }
  });
}
```

### HTTP Client: `src/lib/api/http.ts`

```typescript
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = await getAccessToken();  // Supabase JWT

  const headers = {
    "Content-Type": "application/json",
    ...(token && { "Authorization": `Bearer ${token}` })
  };

  const response = await fetch(url, { ...options, headers });

  // Auto-redirect na /login przy 401
  if (response.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  return response.json();
}
```

**Request format**:
```json
POST /api/recipes/generate
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "prompt": "Quick vegan pasta for 2 people"
}
```

---

## KROK 3: API Endpoint - Przetwarzanie 🔐

### Lokalizacja: `src/pages/api/recipes/generate.ts`

### 3.1 Autentykacja
```typescript
const authHeader = request.headers.get("Authorization");
const token = authHeader.replace("Bearer ", "").trim();

const supabase = createClient<Database>(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_KEY,
  {
    global: { headers: { Authorization: `Bearer ${token}` } }
  }
);

const { data: userData, error } = await supabase.auth.getUser(token);
if (error || !userData?.user) {
  return jsonError(401, "Unauthorized");
}

const userId = userData.user.id;
```

### 3.2 Rate Limiting
```typescript
const generationCount = await eventsService.countEventsInWindow(
  userId,
  "ai_recipe_generated",
  60  // 60 minut window
);

if (generationCount >= 10) {
  return jsonError(429, "Too Many Requests",
    "Generation limit exceeded",
    { retry_after: 3600 }
  );
}
```

### 3.3 Walidacja promptu (Zod)
```typescript
const validation = GenerateRecipeCommandSchema.safeParse(body);

// GenerateRecipeCommandSchema checks:
// - min 1, max 2000 znaków
// - trim
// - brak control characters (oprócz \n \t)
// - ochrona przed prompt injection:
//   ❌ "ignore previous instructions"
//   ❌ "system:"
//   ❌ "assistant:"
```

### 3.4 Pobieranie profilu użytkownika
```typescript
let profile;
try {
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  profile = profileData || undefined;  // ← OPTIONAL!
} catch (error) {
  // Jeśli brak profilu, kontynuuj bez niego
  console.log("No profile found, continuing without preferences");
}
```

**Struktura profilu**:
```typescript
interface ProfileDTO {
  user_id: string;
  diet_type?: string;  // np. "vegan", "vegetarian"
  disliked_ingredients?: string[];  // ["nuts", "mushrooms"]
  preferred_cuisines?: string[];  // ["Italian", "Asian"]
  created_at: string;
  updated_at: string;
}
```

### 3.5 Event logging - prompt sent
```typescript
await eventsService.createEvent(userId, {
  type: "ai_prompt_sent",
  payload: {
    prompt_preview: EventsService.truncatePrompt(prompt, 256),  // pierwsze 256 znaków
    request_id: requestId,
    model: import.meta.env.AI_MODEL
  }
});
```

---

## KROK 4: AI Service - Generowanie 🤖

### Lokalizacja: `src/lib/services/ai/ai.service.ts`

```typescript
async generateRecipe(prompt: string, profile?: ProfileDTO): Promise<RecipeSchema> {
  let lastError: Error | undefined;
  let attempt = 0;
  const maxAttempts = this.maxRetries + 1;  // 1 + 1 retry = 2 próby

  while (attempt < maxAttempts) {
    try {
      // Wywołanie providera
      const recipe = await this.provider.generateRecipe(prompt, profile);

      // Walidacja rozmiaru (200KB limit)
      this.validateRecipeSize(recipe);

      return recipe;  // ✅ Sukces

    } catch (error) {
      lastError = error;
      attempt++;

      // Sprawdź czy można retry'ować
      const isRetryable = error instanceof AiError && error.isRetryable;

      if (!isRetryable || attempt >= maxAttempts) {
        break;  // Nie retry'uj
      }

      // Exponential backoff z jitter
      const delay = this.calculateBackoff(attempt);
      // 500ms * 2^(attempt-1) + jitter (30%), max 5s
      await this.sleep(delay);
    }
  }

  throw lastError;  // ❌ Wszystkie próby nieudane
}
```

**Retry logic**:
```
Attempt 1: 0ms (natychmiast)
Attempt 2: ~500-650ms (0.5s + jitter)
Max: 5000ms
```

**Retryable errors**:
- `AiTimeoutError` (timeout)
- `AiProviderError` z statusCode >= 500

**Non-retryable errors**:
- `AiValidationError` (zły JSON)
- `AiProviderError` z statusCode 4xx

---

## KROK 5: AI Provider - Konstrukcja promptu 💬

### **REFACTOR**: Centralized Utilities (2025-01)

Kod budowania promptów został wydzielony do **shared utilities** używanych przez wszystkie providery:

### 5.1 RecipePromptBuilder - System & User Prompts

**Lokalizacja**: `src/lib/services/ai/utils/recipe-prompt-builder.ts`

```typescript
export class RecipePromptBuilder {
  /**
   * Build system prompt with recipe schema and dietary preferences
   */
  static buildSystemPrompt(profile?: ProfileDTO): string {
    // Base prompt z JSON schema i regułami
    let prompt = `You are a professional chef and recipe creator. Generate recipes in strict JSON format matching this structure:

{
  "title": "Recipe Title",
  "summary": "Brief one-sentence summary",
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "servings": 4,
  "difficulty": "easy|medium|hard",
  "cuisine": "Italian",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["step 1", "step 2"],
  "tags": ["tag1", "tag2"],
  "dietary_info": { "vegetarian": true, "vegan": false, ... },
  "nutrition": { "calories": 350, "protein_g": 12, ... }
}

CRITICAL RULES:
- Return ONLY valid JSON, no markdown, no explanations
- All fields must match the types shown above
- ingredients and instructions must be non-empty arrays
- times and servings must be positive numbers
- difficulty must be exactly: "easy", "medium", or "hard"`;

    // Wzbogacenie o profil użytkownika
    if (profile) {
      prompt += this.buildDietaryPreferencesSection(profile);
    }

    return prompt;
  }

  private static buildDietaryPreferencesSection(profile: ProfileDTO): string {
    let section = `\n\nUSER DIETARY PREFERENCES:`;

    if (profile.diet_type) {
      section += `\n- Diet type: ${profile.diet_type}`;
    }

    if (profile.disliked_ingredients?.length > 0) {
      section += `\n- AVOID these ingredients: ${profile.disliked_ingredients.join(", ")}`;
    }

    if (profile.preferred_cuisines?.length > 0) {
      section += `\n- Preferred cuisines: ${profile.preferred_cuisines.join(", ")}`;
    }

    return section;
  }

  /**
   * Build user prompt from user input
   */
  static buildUserPrompt(userPrompt: string): string {
    return `Create a recipe for: ${userPrompt}

Remember: Return ONLY valid JSON matching the exact structure specified in the system prompt.`;
  }
}
```

**Przykład wywołania w providerze**:
```typescript
// W OpenRouterProvider lub GoogleProvider
const systemPrompt = RecipePromptBuilder.buildSystemPrompt(profile);
const userPrompt = RecipePromptBuilder.buildUserPrompt(prompt);
```

### 5.2 LLMRequestManager - Wysyłka HTTP z timeout

**Lokalizacja**: `src/lib/services/ai/utils/llm-request-manager.ts`

```typescript
export class LLMRequestManager {
  /**
   * Execute HTTP request with timeout handling
   */
  static async executeWithTimeout(
    fetchFn: (signal: AbortSignal) => Promise<Response>,
    timeout: number,
    providerName: string
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetchFn(controller.signal);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // Timeout detection
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AiTimeoutError(`${providerName} request timed out after ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Handle HTTP response errors
   */
  static async handleResponseError(response: Response, providerName: string): Promise<void> {
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new AiProviderError(`${providerName} API error: ${errorText}`, response.status);
    }
  }

  /**
   * Extract content from response JSON using path
   * Example paths:
   * - OpenRouter: ["choices", "0", "message", "content"]
   * - Google: ["candidates", "0", "content", "parts", "0", "text"]
   */
  static extractContent(data: any, contentPath: string[], providerName: string): string {
    let current = data;

    for (const key of contentPath) {
      current = !isNaN(Number(key)) ? current[Number(key)] : current[key];
      if (current == null) {
        throw new AiProviderError(`No content in ${providerName} response`);
      }
    }

    if (typeof current !== "string" || !current) {
      throw new AiProviderError(`No content in ${providerName} response`);
    }

    return current;
  }
}
```

**Przykład wywołania w OpenRouterProvider**:
```typescript
// 1. Execute request with timeout
const response = await LLMRequestManager.executeWithTimeout(
  (signal) => fetch(`${this.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`,
      "HTTP-Referer": "https://savor-ai.app",
      "X-Title": "Savor AI Recipe Generator"
    },
    body: JSON.stringify({
      model: this.model,  // "anthropic/claude-3.5-sonnet"
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    }),
    signal  // ← AbortSignal for timeout
  }),
  this.timeout,  // 30000ms
  "OpenRouter"
);

// 2. Handle HTTP errors
await LLMRequestManager.handleResponseError(response, "OpenRouter");

// 3. Parse and extract
const data = await response.json();
const content = LLMRequestManager.extractContent(
  data,
  ["choices", "0", "message", "content"],
  "OpenRouter"
);
```

---

## KROK 6: Parsowanie i walidacja odpowiedzi ✅

### **REFACTOR**: RecipeResponseParser

**Lokalizacja**: `src/lib/services/ai/utils/recipe-response-parser.ts`

```typescript
export class RecipeResponseParser {
  /**
   * Parse and validate recipe JSON from AI response
   * Handles markdown cleanup + Zod validation in one call
   */
  static parseAndValidate(content: string): RecipeSchema {
    // Step 1: Extract JSON from markdown if needed
    const rawJson = this.extractJSON(content);

    // Step 2: Parse JSON string to object
    const parsed = this.parseJSON(rawJson);

    // Step 3: Validate against RecipeSchema
    const validated = this.validateSchema(parsed);

    return validated;
  }

  /**
   * Extract JSON from markdown code blocks
   * Handles: ```json ... ```, ``` ... ```, or plain JSON
   */
  private static extractJSON(content: string): string {
    const cleaned = content.trim();

    // Check for markdown code blocks
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    return cleaned;  // No code block found, return as-is
  }

  /**
   * Parse JSON string to object
   */
  private static parseJSON(jsonString: string): unknown {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new AiValidationError(`Failed to parse recipe JSON: ${message}`);
    }
  }

  /**
   * Validate parsed object against RecipeSchema using Zod
   */
  private static validateSchema(data: unknown): RecipeSchema {
    try {
      return RecipeSchemaZ.parse(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new AiValidationError(`Recipe schema validation failed: ${message}`);
    }
  }
}
```

**Przykład wywołania w providerze**:
```typescript
// Po otrzymaniu content z LLM
const validated = RecipeResponseParser.parseAndValidate(content);
return validated;
```

**RecipeSchemaZ checks** (`src/lib/schemas/recipe.schema.ts`):
```typescript
{
  title: z.string().min(1).max(200),                          // wymagane
  summary: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  prep_time_minutes: z.number().int().nonnegative().max(1440), // max 24h
  cook_time_minutes: z.number().int().nonnegative().max(1440),
  servings: z.number().int().positive().max(100),             // 1-100
  difficulty: z.enum(["easy", "medium", "hard"]),             // tylko te 3
  cuisine: z.string().max(50).optional(),
  ingredients: z.array(z.string().min(1).max(500)).min(1).max(100),  // 1-100 items
  instructions: z.array(z.string().min(1).max(2000)).min(1).max(50), // 1-50 steps
  tags: z.array(z.string().min(1).max(50)).max(20).optional(), // max 20 tagów
  dietary_info: DietaryInfoSchema,  // optional booleans
  nutrition: NutritionSchema        // optional numbers
}
```

### 6.3 Walidacja rozmiaru

```typescript
private validateRecipeSize(recipe: RecipeSchema): void {
  const json = JSON.stringify(recipe);
  const sizeBytes = Buffer.byteLength(json, "utf8");
  const maxBytes = 200 * 1024;  // 200KB

  if (sizeBytes > maxBytes) {
    throw new Error(
      `Generated recipe exceeds size limit: ${sizeBytes} bytes (max ${maxBytes} bytes)`
    );
  }
}
```

---

## KROK 7: Response z API 📤

### Lokalizacja: `src/pages/api/recipes/generate.ts` (kontynuacja)

```typescript
// Po udanym generowaniu:
const generationId = uuidv4();

// Event log
await eventsService.createEvent(userId, {
  type: "ai_recipe_generated",
  payload: {
    generation_id: generationId,
    title: recipe.title,
    tags: recipe.tags || [],
    request_id: requestId
  }
});

// Response JSON
const response: GenerateRecipeResponse = {
  recipe,                          // ← Pełny RecipeSchema
  generation_id: generationId,     // ← UUID
  generated_at: new Date().toISOString()  // ← ISO timestamp
};

return new Response(JSON.stringify(response), {
  status: 200,
  headers: {
    "Content-Type": "application/json",
    "X-Request-Id": requestId
  }
});
```

**Response format**:
```json
{
  "recipe": {
    "title": "Quick Vegan Pasta Primavera",
    "summary": "A light and fresh pasta with seasonal vegetables",
    "prep_time_minutes": 10,
    "cook_time_minutes": 15,
    "servings": 2,
    "difficulty": "easy",
    "cuisine": "Italian",
    "ingredients": [
      "200g pasta",
      "1 zucchini, diced",
      "1 bell pepper, diced",
      "..."
    ],
    "instructions": [
      "Bring a large pot of salted water to boil",
      "Add pasta and cook according to package instructions",
      "..."
    ],
    "tags": ["vegan", "pasta", "quick", "easy"],
    "dietary_info": {
      "vegan": true,
      "vegetarian": true,
      "dairy_free": true
    },
    "nutrition": {
      "calories": 420,
      "protein_g": 12,
      "carbs_g": 75,
      "fat_g": 8
    }
  },
  "generation_id": "550e8400-e29b-41d4-a716-446655440000",
  "generated_at": "2025-10-22T18:30:00.000Z"
}
```

---

## KROK 8: Wyświetlenie w Preview 🎨

### 8.1 Zapis do sessionStorage

```typescript
// GeneratorPanel.tsx - onSuccess callback
const draft: GeneratorDraftVM = {
  prompt: prompt.trim(),
  recipe: response.recipe,
  generationId: response.generation_id,
  generatedAt: response.generated_at
};
sessionStorage.setItem("generatorDraft", JSON.stringify(draft));
```

### 8.2 Auto-switch na Preview tab

```typescript
// RightPanel.tsx
const handleGenerated = (response: GenerateRecipeResponse) => {
  setDraftRecipe(response.recipe);  // Stan lokalny
  setActiveTab("preview");          // Przełącz tab
  onRecipeGenerated?.();            // Notify parent (clear selection)
};
```

### 8.3 Render w RecipePreview

**Lokalizacja**: `src/components/app/RecipePreview.tsx`

**Główne sekcje**:
```tsx
<article className="space-y-6">
  {/* 1. Header */}
  <h1>{recipe.title}</h1>
  <p className="italic">{recipe.cuisine}</p>
  <p>{recipe.summary}</p>
  <p>{recipe.description}</p>

  {/* 2. Tags & Dietary Info */}
  <div className="flex gap-2">
    {/* Dietary badges (emerald pills) */}
    {recipe.dietary_info?.vegan && <Badge>vegan</Badge>}

    {/* Regular tags (colored squares) */}
    {tags.map(tag => (
      <Badge onClick={() => onTagClick(tag)}>{tag}</Badge>
    ))}
  </div>

  {/* 3. Meta Info */}
  <div className="flex gap-4">
    <Clock /> Prep: {prep_time}m | Cook: {cook_time}m
    <Users /> {currentServings} servings (adjustable)
    <ChefHat /> {difficulty}
  </div>

  {/* 4. Nutrition Facts */}
  {nutrition && (
    <div className="grid grid-cols-2">
      <Flame /> {calories} cal
      <Beef /> {protein_g}g protein
      <Wheat /> {carbs_g}g carbs
      <Droplet /> {fat_g}g fat
    </div>
  )}

  {/* 5. Ingredients (checkable) */}
  <section>
    <h2>Ingredients</h2>
    {ingredients.map((ing, i) => (
      <div onClick={() => toggleIngredient(i)}>
        <CheckCircle2 className={completed ? "text-primary" : ""} />
        <span className={completed ? "line-through" : ""}>
          {scaleIngredient(ing)}  {/* Auto-scaling based on servings */}
        </span>
      </div>
    ))}
  </section>

  {/* 6. Instructions (checkable steps) */}
  <section>
    <h2>Instructions</h2>
    {instructions.map((step, i) => (
      <div onClick={() => toggleStep(i)}>
        <span className="number">{i + 1}</span>
        <span className={completed ? "line-through" : ""}>{step}</span>
      </div>
    ))}
  </section>
</article>
```

**Interaktywne features**:
- ✅ **Servings adjuster**: Zmienia składniki proporcjonalnie
- ✅ **Checkable ingredients**: Click to mark as gathered
- ✅ **Checkable steps**: Click to mark as completed
- ✅ **Tag filtering**: Click tag → filtruje listę przepisów
- ✅ **Scaling logic**: Wykrywa liczby w składnikach i skaluje je

---

## OBSŁUGA BŁĘDÓW ⚠️

### Frontend - GenerateButton.tsx

```typescript
function getGenerationErrorMessage(error: ApiError) {
  // 400 Bad Request
  if (error.message.includes("validation")) {
    return {
      title: "Invalid prompt",
      description: "Prompt must be 1-2000 characters without forbidden patterns",
      canRetry: false
    };
  }

  // 413 Payload Too Large
  if (error.message.includes("too large")) {
    return {
      title: "Result too large",
      description: "Generated recipe exceeds 200KB. Try a simpler prompt.",
      canRetry: true
    };
  }

  // 429 Too Many Requests
  if (error.message.includes("too many")) {
    const retryAfter = error.details?.retry_after || 60;
    return {
      title: "Rate limit exceeded",
      description: `Please wait ${retryAfter} seconds before trying again`,
      canRetry: false
    };
  }

  // 503 Service Unavailable
  if (error.message.includes("unavailable")) {
    return {
      title: "AI service unavailable",
      description: "AI service is temporarily unavailable",
      canRetry: true
    };
  }

  // 500 Internal Server Error
  return {
    title: "Server error",
    description: "Something went wrong. Please try again.",
    canRetry: true
  };
}
```

### Retry button

```tsx
{error && errorInfo.canRetry && (
  <Button onClick={onRetry}>
    <RefreshCw /> Try again
  </Button>
)}
```

---

## MOCK PROVIDER - Development Mode 🧪

**Obecnie aktywny**: `AI_PROVIDER=mock` w `.env`

```typescript
// Mock Provider zwraca gotowe szablony bez API call
async generateRecipe(prompt: string, profile?: ProfileDTO): Promise<RecipeSchema> {
  // Symulacja opóźnienia sieci (1-2s)
  await this.sleep(1500 + Math.random() * 500);

  // Wykrywanie typu przepisu z promptu
  if (prompt.includes("pasta")) return PASTA_TEMPLATE;
  if (prompt.includes("curry")) return CURRY_TEMPLATE;
  if (prompt.includes("salad")) return SALAD_TEMPLATE;
  // ... 7 szablonów total

  // Dostosowanie do profilu
  if (profile?.diet_type === "vegan") {
    recipe.dietary_info.vegan = true;
    recipe.tags.push("vegan");
  }

  return recipe;
}
```

**Zalety Mock Provider**:
- ✅ Brak kosztów API
- ✅ Deterministyczne wyniki
- ✅ Symulacja opóźnień
- ✅ Idealne do UI development

---

## PODSUMOWANIE - Kluczowe punkty 🎯

| Etap | Czas | Walidacja | Error Handling |
|------|------|-----------|----------------|
| **Frontend input** | <1ms | Client-side (1-2000 chars) | Disabled button |
| **HTTP request** | ~10ms | Bearer token | 401 → redirect /login |
| **API endpoint** | ~50ms | Zod schema, rate limit | 400/429/401 responses |
| **Profile fetch** | ~20ms | Optional (może nie istnieć) | Continue without profile |
| **AI generation** | 3-15s | RecipeSchemaZ + size (200KB) | Retry x1 with backoff |
| **Response** | ~10ms | JSON serialization | 500/503 errors |
| **Preview render** | <100ms | React render | N/A |

**Total time**: **~5-20 sekund** (w zależności od providera)

**Success rate założenia**:
- Mock: 99.9% (prawie zawsze działa)
- OpenRouter: 95-98% (zależy od API)
- Google: 95-98%

**Rate limits**:
- **10 generacji/godzinę/użytkownik**
- Tracking przez eventy `ai_recipe_generated`

**Konfiguracja providera**:
```env
# Development (obecnie)
AI_PROVIDER=mock

# Production (do zmiany)
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-...
AI_MODEL=anthropic/claude-3.5-sonnet  # optional

# lub
AI_PROVIDER=google
GOOGLE_API_KEY=AIza...
AI_MODEL=gemini-1.5-flash  # optional
```

---

## PROVIDERY - STATUS IMPLEMENTACJI (po refactorze 2025-01)

### ✅ Shared Utilities (NOWE!)

Kod wspólny dla wszystkich providerów:

**`RecipePromptBuilder`** (`src/lib/services/ai/utils/recipe-prompt-builder.ts`)
- Budowanie system promptu z JSON schema
- Wzbogacanie o profil użytkownika (diet_type, disliked_ingredients, preferred_cuisines)
- Budowanie user promptu

**`RecipeResponseParser`** (`src/lib/services/ai/utils/recipe-response-parser.ts`)
- Ekstrakcja JSON z markdown code blocks
- Parsowanie JSON
- Walidacja przez Zod (RecipeSchemaZ)

**`LLMRequestManager`** (`src/lib/services/ai/utils/llm-request-manager.ts`)
- Execute request z timeout handling (AbortController)
- Handle HTTP response errors
- Extract content z odpowiedzi (różne ścieżki dla różnych providerów)
- Wrap network errors

### ✅ OpenRouter Provider
**Plik**: `src/lib/services/ai/providers/openrouter.provider.ts`
- ✅ Używa **wszystkich shared utilities**
- ✅ Domyślny model: `anthropic/claude-3.5-sonnet`
- ✅ OpenAI-compatible API format
- ✅ Content path: `["choices", "0", "message", "content"]`

### ✅ Google Gemini Provider
**Plik**: `src/lib/services/ai/providers/google.provider.ts`
- ✅ Używa **wszystkich shared utilities**
- ✅ Domyślny model: `gemini-1.5-flash` (szybki i tani)
- ✅ **Bonus**: `responseMimeType: "application/json"` - natywny JSON z API!
- ✅ Content path: `["candidates", "0", "content", "parts", "0", "text"]`

### ✅ AI Service Factory
**Plik**: `src/lib/services/ai/ai.service.ts`
- `AiService.fromEnv()` automatycznie wybiera providera z `.env`
- Walidacja: wymaga klucza API dla prawdziwych providerów
- Obsługa retry logic z exponential backoff (max 1 retry)
- Walidacja rozmiaru (200KB limit)

**Zalety refactoru**:
- ✅ **DRY**: Brak duplikacji kodu między providerami
- ✅ **Testability**: Utilities można testować osobno
- ✅ **Consistency**: Wszystkie providery używają tego samego promptu i walidacji
- ✅ **Maintainability**: Zmiana formatu promptu w jednym miejscu

---

## JAK PRZEŁĄCZYĆ NA PRAWDZIWY PROVIDER

### Option 1: OpenRouter (Claude 3.5 Sonnet)

W pliku `.env` zmień:
```env
# Z:
AI_PROVIDER=mock

# Na:
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-<twój-klucz>

# Opcjonalnie (domyślnie już jest claude-3.5-sonnet):
# AI_MODEL=anthropic/claude-3.5-sonnet
# AI_TIMEOUT_MS=30000
```

### Option 2: Google Gemini

```env
AI_PROVIDER=google
GOOGLE_API_KEY=AIza<twój-klucz>

# Opcjonalnie:
# AI_MODEL=gemini-1.5-flash  # lub gemini-1.5-pro
# AI_TIMEOUT_MS=30000
```

**Restart serwera**: `npm run dev`

**To wszystko!** 🎉
