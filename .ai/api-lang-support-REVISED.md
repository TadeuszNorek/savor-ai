# Obsługa języka polskiego w API - Plan zrewidowany (MVP)

## Podsumowanie wykonawcze

**KLUCZOWA ZMIANA:** Obecny plan w `api-lang-support.md` jest zbyt rozbudowany dla MVP.

Na podstawie analizy:
- `.ai/ui-plan.md` (linie 102-111) jasno stwierdza: **"brak lokalizacji treści przepisów w MVP"**
- `.ai/prd.md` - aplikacja dla polskich użytkowników, brak wymagań wielojęzyczności treści
- Obecna implementacja nie zawiera żadnych elementów wielojęzycznych

**Rekomendacja:** Dla MVP wystarczy minimalne podejście bez zmian w bazie danych.

---

## 1. Kontekst i założenia MVP

### Co JUŻ JEST zaplanowane (ui-plan.md):
✅ Lokalizacja **interfejsu** w PL/EN (stałe teksty UI)
✅ Słowniki `src/i18n/pl.json` i `src/i18n/en.json`
✅ Przełącznik języka w Header
✅ Zapis wyboru w localStorage

### Co NIE JEST w zakresie MVP:
❌ Lokalizacja treści przepisów
❌ Wielojęzyczne wersje tego samego przepisu
❌ Tłumaczenia składników/instrukcji

### Obecny stan implementacji:
- Baza: `profiles` i `recipes` bez pól językowych
- Schematy: brak `lang` w query/command
- Services: brak obsługi języka
- AI prompt builder: brak instrukcji językowych

---

## 2. Problem do rozwiązania

**Użytkownicy polscy** będą generować przepisy, ale domyślnie AI (bez instrukcji) może odpowiadać po angielsku.

**Rozwiązanie minimalne:**
Umożliwić użytkownikowi wybór języka generacji (głównie PL vs EN) poprzez parametr `lang` w API, który zostanie przekazany do AI jako instrukcja językowa.

**Nie potrzebujemy:**
- Zapisywać języka w bazie danych (brak potrzeby filtrowania/wyszukiwania po języku)
- Tworzyć wielojęzycznych wersji przepisów
- Dodawać pól do profilu

---

## 3. Zakres zmian dla MVP

### 3.1 API: `/api/recipes/generate` (POST)

**Zmiana:** Dodać opcjonalny parametr `lang` w body lub query.

**Schema (src/lib/schemas/recipe.schema.ts):**
```typescript
export const GenerateRecipeCommandSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, "Prompt cannot be empty")
    .max(2000, "Prompt too long (max 2000 characters)")
    // ... existing validations ...
    ,

  // NOWE: opcjonalny język generacji
  lang: z.enum(['pl', 'en']).optional().default('pl'),
});
```

**Types (src/types.ts):**
```typescript
export interface GenerateRecipeCommand {
  prompt: string;
  lang?: 'pl' | 'en'; // Domyślnie 'pl'
}

export type LanguageCode = 'pl' | 'en';
```

**Endpoint (src/pages/api/recipes/generate.ts):**
```typescript
// Po walidacji (linia ~105):
const { prompt, lang = 'pl' } = validation.data;

// Przekazać do AI service (linia ~143):
const recipe = await aiService.generateRecipe(prompt, profile, lang);

// Logowanie eventu z językiem (linia ~188-196):
await eventsService.createEvent(userId, {
  type: "ai_recipe_generated",
  payload: {
    generation_id: generationId,
    title: recipe.title,
    tags: recipe.tags || [],
    language: lang, // Dodać do payload dla analytics
    request_id: requestId,
  },
});
```

**Nagłówek odpowiedzi:**
```typescript
return new Response(JSON.stringify(response), {
  status: 200,
  headers: {
    "Content-Type": "application/json",
    "Content-Language": lang, // Informacja o języku odpowiedzi
  },
});
```

---

### 3.2 AI Service

**Zmiana:** Rozszerzyć sygnaturę `generateRecipe()` o parametr `lang`.

**Service (src/lib/services/ai/ai.service.ts):**
```typescript
async generateRecipe(
  prompt: string,
  profile?: ProfileDTO,
  lang: 'pl' | 'en' = 'pl' // Domyślnie polski
): Promise<RecipeSchema> {
  let lastError: Error | undefined;
  let attempt = 0;
  const maxAttempts = this.maxRetries + 1;

  while (attempt < maxAttempts) {
    try {
      console.log(`AI generation attempt ${attempt + 1}/${maxAttempts} (language: ${lang})`);

      // Przekazać lang do providera
      const recipe = await this.provider.generateRecipe(prompt, profile, lang);

      this.validateRecipeSize(recipe);
      return recipe;
    } catch (error) {
      // ... existing error handling ...
    }
  }

  throw lastError || new Error("AI generation failed with unknown error");
}
```

**Provider interface (src/lib/services/ai/types.ts):**
```typescript
export interface AiProvider {
  generateRecipe(
    prompt: string,
    profile?: ProfileDTO,
    lang?: 'pl' | 'en' // Nowy parametr
  ): Promise<RecipeSchema>;
}
```

---

### 3.3 AI Prompt Builder

**Zmiana:** Dodać instrukcję językową do system prompt.

**Prompt builder (src/lib/services/ai/utils/recipe-prompt-builder.ts):**
```typescript
export function buildSystemPrompt(profile?: ProfileDTO, lang: 'pl' | 'en' = 'pl'): string {
  // Instrukcja językowa na początku
  const languageInstruction = lang === 'pl'
    ? 'IMPORTANT: Respond in POLISH language. All recipe content (title, description, ingredients, instructions) must be in Polish.'
    : 'IMPORTANT: Respond in ENGLISH language. All recipe content (title, description, ingredients, instructions) must be in English.';

  let prompt = `${languageInstruction}

You are a professional chef and recipe creator. Generate recipes in strict JSON format matching this structure:

{
  "title": "Recipe Title",
  // ... rest of schema ...
}

CRITICAL RULES:
- Return ONLY valid JSON, no markdown, no explanations
- All text content MUST be in ${lang === 'pl' ? 'POLISH' : 'ENGLISH'}
- All fields must match the types shown above
// ... rest of rules ...
`;

  if (profile) {
    prompt += buildDietaryPreferencesSection(profile);
  }

  return prompt;
}
```

**Aktualizacja wywołań:**
```typescript
// W każdym providerze (google.provider.ts, openrouter.provider.ts):
async generateRecipe(
  prompt: string,
  profile?: ProfileDTO,
  lang: 'pl' | 'en' = 'pl'
): Promise<RecipeSchema> {
  const systemPrompt = buildSystemPrompt(profile, lang); // Przekazać lang
  const userPrompt = buildUserPrompt(prompt);

  // ... rest of implementation ...
}
```

---

## 4. Co NIE jest zmieniane w MVP

### 4.1 Baza danych
❌ **Bez zmian w schema** - nie dodajemy:
- `recipes.language` (nie ma potrzeby filtrowania)
- `profiles.preferred_language` (wybór z UI jest wystarczający)
- `recipe_locales` (brak wielojęzycznych wersji)

**Uzasadnienie:**
- UI plan jasno: "brak lokalizacji treści przepisów w MVP"
- Brak wymagania wyszukiwania/filtrowania po języku
- Oszczędność czasu implementacji i testów
- Prostsze rollback jeśli pojawią się problemy

### 4.2 Pozostałe endpointy
❌ **Bez zmian w:**
- `GET /api/recipes` - nie przyjmuje `lang` (nie ma lokalizacji)
- `GET /api/recipes/:id` - nie zwraca `Content-Language` (brak pola w DB)
- `POST /api/recipes` - nie przyjmuje `language` (nie zapisujemy)
- `/api/profile` - nie dodajemy `preferred_language`

### 4.3 Schematy i typy
❌ **Bez zmian w:**
- `RecipeListQuerySchema` - bez `lang`
- `SaveRecipeCommandSchema` - bez `language`
- `ProfileDTO` - bez `preferred_language`

---

## 5. Frontend integration

### 5.1 Jak UI będzie korzystać z `lang`?

**Opcja A: Zgodnie z wyborem języka UI (rekomendowane)**
```typescript
// W komponencie Generator
const { lang } = useI18n(); // 'pl' lub 'en' z kontekstu i18n

const generateRecipe = async (prompt: string) => {
  const response = await fetch('/api/recipes/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      lang // Zgodny z językiem UI
    }),
  });
  // ...
};
```

**Opcja B: Niezależny wybór języka przepisu**
```typescript
// Dodatkowy select w UI generatora
<select value={recipeLang} onChange={(e) => setRecipeLang(e.target.value)}>
  <option value="pl">Polski</option>
  <option value="en">English</option>
</select>
```

**Rekomendacja:** Opcja A (zgodność z językiem UI) dla prostoty MVP.

### 5.2 Klucze cache TanStack Query

**Bez zmian** - przepisy nie są lokalizowane, więc cache pozostaje:
```typescript
// Bez lang w kluczach (treść nie jest lokalizowana)
['recipes:list', params] // bez lang
['recipe', id]           // bez lang
```

---

## 6. Dokumentacja (API.md)

### Zmiana w sekcji POST /api/recipes/generate:

```markdown
#### Generate Recipe
- **Method**: POST
- **URL**: `/api/recipes/generate`
- **Description**: Generate a recipe using AI based on user prompt
- **Headers**: `Authorization: Bearer {token}`
- **Request Body**:
```json
{
  "prompt": "Obiad śródziemnomorski na 4 osoby",
  "lang": "pl"  // Opcjonalnie: 'pl' (domyślnie) lub 'en'
}
```
- **Response** (200 OK):
```json
{
  "recipe": { /* RecipeSchema */ },
  "generation_id": "uuid",
  "generated_at": "ISO-8601 timestamp"
}
```
- **Headers**: `Content-Language: pl` (język wygenerowanego przepisu)
```

### Nowa sekcja: Język generacji

```markdown
## Language Support (MVP)

### Recipe Generation Language
- Recipes can be generated in Polish (pl) or English (en)
- Use the optional `lang` parameter in POST /api/recipes/generate
- Default language: `pl` (Polish)
- The generated recipe content (title, description, ingredients, instructions) will be in the requested language

### Important MVP limitations:
- Recipe content is NOT localized after generation (no translations)
- No filtering/searching by language (language is not stored in database)
- No user preference storage for language (must specify per generation)
- UI interface has separate i18n (PL/EN) independent from recipe content language

### Choosing recipe language:
**Recommended:** Match recipe language with UI language for consistency:
- If user has UI in Polish → generate recipes in Polish
- If user has UI in English → generate recipes in English

**Note:** This is a MVP implementation. Full multi-language support with recipe translations and language preferences may be added post-MVP.
```

---

## 7. Checklist implementacyjny (MVP)

### Faza 1: Backend (1-2h)
- [ ] Dodać `LanguageCode = 'pl' | 'en'` do `src/types.ts`
- [ ] Rozszerzyć `GenerateRecipeCommandSchema` o `lang?: z.enum(['pl', 'en']).default('pl')`
- [ ] Rozszerzyć `GenerateRecipeCommand` type o `lang?: LanguageCode`
- [ ] Rozszerzyć `AiProvider` interface o parametr `lang`
- [ ] Zaktualizować `AiService.generateRecipe()` o parametr `lang`
- [ ] Zaktualizować `buildSystemPrompt()` o parametr `lang` i instrukcję językową
- [ ] Zaktualizować wszystkie providery (Google, OpenRouter, Mock) o przekazywanie `lang`
- [ ] Zaktualizować endpoint `/api/recipes/generate`:
  - Wyciągnąć `lang` z walidacji
  - Przekazać do `aiService.generateRecipe()`
  - Dodać `language: lang` do payload eventu `ai_recipe_generated`
  - Dodać nagłówek `Content-Language` do odpowiedzi

### Faza 2: Frontend integration (30min - 1h)
- [ ] W komponencie Generator użyć `lang` z `useI18n()` context
- [ ] Przekazać `lang` w body requestu do `/api/recipes/generate`
- [ ] (Opcjonalnie) Dodać komunikat w UI o języku generowanego przepisu

### Faza 3: Dokumentacja (15-30min)
- [ ] Zaktualizować `API.md`:
  - Dodać `lang` parameter do POST /api/recipes/generate
  - Dodać sekcję "Language Support (MVP)"
  - Zaznaczyć ograniczenia MVP (brak lokalizacji treści)
- [ ] Zaktualizować README z informacją o obsłudze języków

### Faza 4: Testy (1-2h)
- [ ] Unit testy dla `buildSystemPrompt(profile, 'pl')` i `buildSystemPrompt(profile, 'en')`
- [ ] Unit testy dla walidacji `GenerateRecipeCommandSchema` z `lang`
- [ ] E2E test: generacja przepisu w PL
- [ ] E2E test: generacja przepisu w EN
- [ ] Weryfikacja manualna: czy AI rzeczywiście generuje w żądanym języku

**Szacowany czas całkowity: 3-5h**

---

## 8. Post-MVP (backlog)

Gdy pojawi się potrzeba pełnej wielojęzyczności:

### 8.1 Faza: Tracking języka (łatwe)
- Dodać `recipes.language text not null default 'pl'` do bazy
- Zapisywać język przy tworzeniu przepisu w `POST /api/recipes`
- Zwracać `Content-Language` w `GET /api/recipes/:id`
- Umożliwić filtrowanie po języku w `GET /api/recipes?lang=pl`

### 8.2 Faza: Preferencje użytkownika (średnie)
- Dodać `profiles.preferred_language text check (preferred_language in ('pl','en'))`
- Używać jako domyślnej wartości `lang` w generacji
- UI: zapamiętywać wybór użytkownika

### 8.3 Faza: Pełna lokalizacja (trudne)
- Tabela `recipe_locales(recipe_id, lang, recipe jsonb, ...)`
- Triggery i indeksy per język
- FTS z konfiguracją językową (polish/english zamiast simple)
- API do tłumaczeń (manualnych lub przez AI)
- Fallback do `default_language` gdy brak tłumaczenia

---

## 9. Ryzyka i edge cases (MVP)

### 9.1 AI może zignorować instrukcję językową
**Ryzyko:** Model AI nie zawsze przestrzega instrukcji języka w 100%.

**Mitigacja:**
- Wyraźna instrukcja na początku system prompt (IMPORTANT, MUST)
- Powtórzenie w CRITICAL RULES
- Monitoring: sprawdzić logi `ai_recipe_generated` event payload
- Jeśli problem się pojawi: rozważyć walidację języka po generacji (np. language detection library)

### 9.2 Niespójność języka między UI a przepisami
**Ryzyko:** Użytkownik ma UI w PL, ale wygenerował przepis w EN (lub odwrotnie).

**Mitigacja:**
- Domyślnie: `lang` = język UI (przekazywany automatycznie)
- (Opcjonalnie) Badge w UI pokazujący język przepisu
- Komunikat: "Przepis wygenerowany w języku: English" po generacji

### 9.3 Składniki w różnych językach vs. disliked_ingredients
**Ryzyko:** Profil ma `disliked_ingredients: ['krewetki']` (PL), ale przepis w EN ma `shrimp` → walidacja nie złapie.

**Mitigacja (MVP):**
- Komunikować w UI/README: "Unikane składniki muszą być w tym samym języku co generowane przepisy"
- Sugestia: jeśli użytkownik wybiera EN do generacji, pokazać hint: "Ensure disliked ingredients are in English"

**Mitigacja (post-MVP):**
- Słownik synonimów składników PL↔EN
- Lub: normalizacja semantyczna (embeddings)

---

## 10. Porównanie z poprzednim planem

| Aspekt | Plan poprzedni (api-lang-support.md) | Plan zrewidowany (MVP) |
|--------|-------------------------------------|------------------------|
| **Zakres** | Pełna lokalizacja treści przepisów | Tylko język generacji |
| **Baza danych** | Nowe kolumny + tabela `recipe_locales` | Bez zmian |
| **Profiles** | Dodać `preferred_language` | Bez zmian |
| **Recipes** | Dodać `language` lub `recipe_locales` | Bez zmian |
| **API contracts** | Rozbudowane (`lang` wszędzie) | Tylko `/recipes/generate` |
| **FTS** | Per-language config (polish/english) | Bez zmian (simple) |
| **Cache keys** | `['recipe', id, lang]` | Bez zmian |
| **Czas impl.** | 1-2 tygodnie | 3-5 godzin |
| **Zgodność z UI plan** | ❌ Sprzeczne (ui-plan: brak lokalizacji treści) | ✅ Zgodne |

**Wnioski:**
- Poprzedni plan był **over-engineered** dla MVP
- Nowy plan jest **minimalny, pragmatyczny i zgodny z założeniami MVP**
- Łatwo rozszerzyć post-MVP jeśli będzie potrzeba

---

## 11. Kryteria akceptacji (MVP)

### Must-have:
✅ Użytkownik może wygenerować przepis z `lang=pl` → treść w języku polskim
✅ Użytkownik może wygenerować przepis z `lang=en` → treść w języku angielskim
✅ Domyślnie (bez parametru) → przepis w języku polskim
✅ Nagłówek `Content-Language` w odpowiedzi `/api/recipes/generate`
✅ Event `ai_recipe_generated` zawiera `language` w payload
✅ Testy jednostkowe dla prompt buildera z `lang`
✅ Testy E2E dla generacji w PL i EN
✅ Dokumentacja API zaktualizowana

### Nice-to-have (opcjonalne):
○ Komunikat w UI o języku wygenerowanego przepisu
○ Badge/label pokazujący język przepisu w podglądzie
○ Hint dla użytkownika o spójności języka z `disliked_ingredients`

---

## 12. Podsumowanie

**Kluczowa decyzja:** Dla MVP nie wprowadzamy zmian w bazie danych ani lokalizacji treści przepisów.

**Implementujemy:**
- Parametr `lang` w `/api/recipes/generate` (PL/EN)
- Przekazanie do AI jako instrukcja językowa w prompcie
- Nagłówek `Content-Language` w odpowiedzi
- Logging języka w eventach

**Nie implementujemy (post-MVP):**
- `recipes.language` / `recipe_locales`
- `profiles.preferred_language`
- Filtrowanie/wyszukiwanie po języku
- FTS per-language
- Tłumaczenia przepisów

**Zalety tego podejścia:**
1. ✅ Zgodność z `.ai/ui-plan.md` (brak lokalizacji treści w MVP)
2. ✅ Minimalny scope (3-5h vs 1-2 tygodnie)
3. ✅ Brak zmian w bazie → brak migracji, brak ryzyka
4. ✅ Łatwo rozszerzyć post-MVP jeśli zajdzie potrzeba
5. ✅ Pokrywa rzeczywistą potrzebę: polscy użytkownicy generują przepisy po polsku

**Kiedy rozważyć rozszerzenie:**
- Znaczący ruch użytkowników anglojęzycznych
- Potrzeba filtrowania/wyszukiwania po języku
- Wymaganie tłumaczeń tego samego przepisu
- Feedback użytkowników o potrzebie wielojęzyczności

---

**Autor:** Claude (rewizja planu)
**Data:** 2025-01-16
**Status:** Rekomendowany do wdrożenia w MVP
**Zastępuje:** `.ai/api-lang-support.md` (zbyt rozbudowany)
