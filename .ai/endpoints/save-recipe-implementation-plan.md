# Plan wdrożenia endpointu API: Save Recipe (POST /api/recipes)

## 1. Przegląd punktu końcowego
Zapisuje wygenerowany przepis do kolekcji użytkownika. Waliduje strukturę `recipe` względem schema_v1, weryfikuje limit rozmiaru (~200 KB), normalizuje `tags`, sprawdza nielubiane składniki przez RPC `insert_recipe_safe` i loguje zdarzenie `recipe_saved`. Zwraca lekki „summary” zapisanego przepisu.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- URL: `/api/recipes`
- Nagłówki:
  - Wymagane: `Authorization: Bearer {token}`
  - Treść: `Content-Type: application/json; charset=utf-8`
- Parametry:
  - Wymagane: brak parametrów URL
  - Opcjonalne: brak parametrów URL
- Request Body (SaveRecipeCommand):
  - `recipe: RecipeSchema` (wymagane) — pełny obiekt przepisu zgodny z `schema_v1`
  - `tags?: string[]` (opcjonalne) — lista tagów, normalizowana do lowercase, deduplikowana
- Ograniczenia i walidacja wejścia:
  - `recipe` walidowany przez Zod (`RecipeSchemaZ`): tytuł, czasy, porcje, `ingredients[]`, `instructions[]`, opcjonalne `dietary_info`, `nutrition`, itp.
  - `tags`: max 20 pozycji, każdy element 1..50 znaków, lowercase, bez pustych/duplikatów
  - Limit rozmiaru: `octet_length(JSON.stringify(recipe)) < 204800` (zwróć 413, gdy przekroczony)

## 3. Wykorzystywane typy
- `src/types.ts:121` `SaveRecipeCommand`
- `src/lib/schemas/recipe.schema.ts` `RecipeSchemaZ` (walidacja `recipe`)
- `src/types.ts:139` `RecipeSummaryDTO` (odpowiedź 201)
- `src/types.ts` `ApiError`, `ValidationErrorDetails`
- `src/types.ts` `InsertRecipeSafeArgs` (argumenty RPC)

## 3. Szczegóły odpowiedzi
- 201 Created — `RecipeSummaryDTO`:
  - Pola: `id`, `user_id`, `title`, `summary`, `tags`, `created_at`, `updated_at`
  - Nagłówki: `Content-Type: application/json`, `Location: /api/recipes/{id}`
- 400 Bad Request — walidacja JSON (schema): `ApiError { error: "Validation failed", message, details }`
- 400 Bad Request — nielubiane składniki: `ApiError { error: "Recipe contains disliked ingredient", message, details?: { blocked_ingredients: string[] } }`
- 401 Unauthorized — brak/niepoprawny token: `ApiError`
- 413 Payload Too Large — przekroczony limit ~200KB: `ApiError { error: "Recipe too large" }`
- 500 Internal Server Error — błędy serwera/DB: `ApiError`

## 4. Przepływ danych
1. Uwierzytelnienie
   - Odczytaj `Authorization: Bearer <JWT>`; zwróć 401, jeśli brak/niepoprawny.
   - `const { data, error } = await locals.supabase.auth.getUser(token)`; jeśli brak `data.user` → 401.
   - `userId = data.user.id`.
2. Parsowanie i walidacja body (400)
   - `await request.json()` z obsługą błędów JSON.
   - Zod: `SaveRecipeCommandSchema = z.object({ recipe: RecipeSchemaZ, tags: z.array(z.string().min(1).max(50)).max(20).optional() })`.
   - Normalizacja `tags`: trim, lowercase, deduplikacja, odfiltrowanie pustych.
3. Limit rozmiaru (413)
   - Zmierz bajty: `new TextEncoder().encode(JSON.stringify(recipe)).length`.
   - Jeśli ≥ 204800 → 413 `Recipe too large`.
4. Zapis przez RPC (walidacja nielubianych składników)
   - Wywołaj: `rpc('insert_recipe_safe', { p_recipe: recipe, p_tags: tags })`.
   - Oczekiwany wynik: `id: string` nowego przepisu (funkcja korzysta z `auth.uid()` i przestrzega RLS).
   - Obsłuż błąd RPC z informacją o nielubianych składnikach → 400 z `blocked_ingredients`.
5. Odczyt podsumowania i odpowiedź
   - `select('id,user_id,title,summary,tags,created_at,updated_at').eq('id', id).single()`.
   - Zwróć 201 z JSON i `Location`.
6. Logowanie zdarzenia (best-effort)
   - `EventsService.logEvent(userId, 'recipe_saved', { recipe_id: id, title, tags, request_id })`.
   - Błędy logowania nie blokują odpowiedzi (tylko `console.error`).

## 5. Względy bezpieczeństwa
- Uwierzytelnianie: wymagany Bearer JWT; weryfikacja przez `locals.supabase.auth.getUser(token)`.
- Autoryzacja i RLS: zapis realizuje RPC z `auth.uid()`; brak możliwości wstrzyknięcia `user_id` z klienta.
- Walidacja wejścia: Zod dla `recipe` i `tags`; twardy limit rozmiaru; sanity-check tekstów.
- Normalizacja danych: `tags` do lowercase zgodnie z konwencją kolumny w DB; przycięcie długości; deduplikacja.
- Ograniczenie ujawnianych pól: zwracaj tylko `RecipeSummaryDTO` (bez pełnego JSONB).
- Bezpieczne zapytania: wyłącznie API Supabase; brak ręcznego SQL.
- Prywatność/logi: nie logować treści całego `recipe`; do logów tylko metadane (`request_id`, `recipe_id`).

## 6. Obsługa błędów
- 400 Validation failed: szczegóły z Zod w `ApiError.details` (np. `ingredients`, `instructions`).
- 400 Disliked ingredient: mapuj błąd RPC do `ApiError` z `blocked_ingredients` (lista przecięć `profiles.disliked_ingredients` z `recipe.ingredients`).
- 401 Unauthorized: brak/niepoprawny Bearer; wyczyść wszelkie skutki uboczne.
- 413 Payload Too Large: przekroczony limit 200 KB dla `recipe`.
- 500 Internal Server Error: wyjątki Supabase/PG/nieoczekiwane przypadki; loguj z `request_id`.
- Format błędu spójny z istniejącymi endpointami: `ApiError { error, message, details?, request_id }`.

## 7. Wydajność
- Limit rozmiaru `recipe` w DB już wymusza `octet_length < 204800`; weryfikuj również po stronie serwera, by oszczędzić zasoby.
- RPC łączy walidację i insert w 1 round-trip (mniej zapytań i transferu).
- Indeksy: wykorzystanie istniejących PK/BTREE na `recipes(id)`, `recipes(user_id, created_at)` (dla późniejszych odczytów).
- Unikaj pobierania pełnego JSONB w odpowiedzi — zwracaj tylko summary.

## 8. Kroki implementacji
1. Walidacja Zod
   - Rozszerz `src/lib/schemas/recipe.schema.ts` o `SaveRecipeCommandSchema` (wykorzystaj `RecipeSchemaZ`).
   - Dodaj helper normalizacji tagów (lowercase, trim, deduplikacja, limit długości).
2. Serwis domenowy
   - Dodaj do `src/lib/services/recipes.service.ts` metodę `saveRecipe(userId, cmd: SaveRecipeCommand): Promise<RecipeSummaryDTO>`:
     - Sprawdzenie rozmiaru JSON.
     - `rpc('insert_recipe_safe', { p_recipe: cmd.recipe, p_tags: normalizedTags })` → `id`.
     - `select` summary po `id` i zwrot `RecipeSummaryDTO`.
     - Mapowanie błędów RPC (nielubiane składniki → 400).
3. Endpoint Astro
   - W `src/pages/api/recipes/index.ts` dodaj `export const POST: APIRoute = async ({ request, locals }) => { ... }`:
     - `prerender = false` (już obecne w pliku).
     - Generuj `request_id = uuidv4()`.
     - Autoryzacja przez `locals.supabase.auth.getUser(token)`.
     - Walidacja JSON (Zod) + limit rozmiaru.
     - Delegacja do `RecipesService.saveRecipe`.
     - Po sukcesie: `EventsService.logEvent('recipe_saved', ...)` (best-effort).
     - Zwróć 201 z `RecipeSummaryDTO` i `Location`.
     - Spójna funkcja `jsonError(...)` jak w pozostałych endpointach.
4. Testy ręczne/integracyjne
   - 201: poprawny `recipe` + `tags` (również z duplikatami/mieszanymi wielkościami liter → sprawdź normalizację).
   - 400: niezgodność z `RecipeSchemaZ` (np. brak `ingredients`), błąd `disliked ingredient`.
   - 401: brak/niepoprawny Bearer.
   - 413: payload > 200 KB.
   - 500: symulacja błędu RPC/bazy.
5. Dokumentacja
   - Zaktualizuj sekcję API: przykład body, odpowiedzi 201, mapowanie błędów 400/413/401/500, nagłówki, `Location`.

