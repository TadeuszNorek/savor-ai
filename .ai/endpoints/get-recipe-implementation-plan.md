# API Endpoint Implementation Plan: GET /api/recipes/:id — Get Recipe Details

## 1. Przegląd punktu końcowego
Punkt końcowy zwraca kompletne szczegóły pojedynczego przepisu (wraz z pełnym polem `recipe` typu JSONB) należącego do uwierzytelnionego użytkownika. Dostęp wymaga tokenu Bearer. W przypadku braku uprawnień lub nieistniejącego zasobu zwracany jest kod 404 (bez ujawniania istnienia zasobu).

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: `/api/recipes/:id`
- Parametry:
  - Wymagane: `id` (UUID) — parametr ścieżki
  - Opcjonalne: brak
- Nagłówki:
  - Wymagane: `Authorization: Bearer {token}`
- Request Body: brak

## 3. Wykorzystywane typy
- `RecipeDetailsDTO` — pełne dane przepisu do zwrócenia (src/types.ts)
- `ApiError` — zunifikowany format błędów (src/types.ts)
- `ValidationErrorDetails` — szczegóły walidacji dla 400 (src/types.ts)

## 3. Szczegóły odpowiedzi
- 200 OK — `RecipeDetailsDTO` (pola: `id`, `user_id`, `title`, `summary`, `tags`, `recipe`, `created_at`, `updated_at`)
- 401 Unauthorized — `ApiError { error, message, request_id }`
- 404 Not Found — `ApiError { error: "Recipe not found", message, request_id }`
- 400 Bad Request — `ApiError { error: "Bad Request", message, details, request_id }` (np. nieprawidłowy UUID)
- 500 Internal Server Error — `ApiError { error, message, request_id }`

Nagłówek odpowiedzi: `Content-Type: application/json`. Rozważyć `Cache-Control: no-store` (dane wrażliwe, prywatne).

## 4. Przepływ danych
1. Wejście do handlera `GET` w `src/pages/api/recipes/[id].ts` (SSR, `export const prerender = false`).
2. Weryfikacja nagłówka `Authorization` (format `Bearer <JWT>`). Jeśli brak/niepoprawny → 401.
3. Walidacja parametru ścieżki `id` jako UUID (np. Zod `z.string().uuid()`). Jeśli niepoprawny → 400.
4. Pobranie użytkownika: `locals.supabase.auth.getUser(jwt)` z tokenem wyjętym z nagłówka. Jeśli brak użytkownika/niepoprawny token → 401.
5. Zapytanie do bazy (Supabase/Postgres):
   - Tabela `recipes`
   - Filtry: `.eq('id', id).eq('user_id', userId)`; użyj `.select('id,user_id,title,summary,tags,recipe,created_at,updated_at').single()`
   - Jeśli rekord nie istnieje lub nie należy do użytkownika → 404 (nie ujawniamy istnienia zasobu innym).
6. Zwrócenie 200 z rekordem zmapowanym do `RecipeDetailsDTO`.
7. Logowanie błędów tylko po stronie serwera (console.error z `request_id`). Zdarzenia w tabeli `events` nie są wymagane dla odczytu (brak odpowiedniego typu eventu i brak wymogu biznesowego).

## 5. Względy bezpieczeństwa
- Uwierzytelnianie: Wymagany `Bearer` JWT; używać `locals.supabase.auth.getUser(jwt)` (przekazać JWT jawnie) — nie polegać na globalnym stanie klienta.
- Autoryzacja: Filtruj po `id` i `user_id` (dopasowanie do właściciela). Zwracaj 404 dla zasobu nieistniejącego i cudzych zasobów (brak 403, by nie ujawniać istnienia).
- Walidacja danych wejściowych: `id` jako UUID (Zod). Odrzuć puste lub nieprawidłowe wartości kodem 400.
- Ograniczenie ujawnianych pól: selekcja tylko wymaganych pól; nie zwracać kolumn wewnętrznych (`search_tsv`, `ingredients_text`).
- Nagłówki: Ustawić `Cache-Control: no-store` dla odpowiedzi (prywatne dane użytkownika). `Content-Type: application/json`.
- Minimalizacja logów: logować tylko metadane błędów i `request_id` bez treści JWT lub wrażliwych danych.

## 6. Obsługa błędów
- 400 Bad Request: nieprawidłowy `id` (nie-UUID). Body: `ApiError` z `details` zawierającym informację o polu `id`.
- 401 Unauthorized: brak nagłówka Bearer lub niepoprawny/wygaśnięty token (`auth.getUser(jwt)` zwraca błąd lub brak usera).
- 404 Not Found: brak rekordu o `id` lub `user_id != auth.uid()` — jednolity komunikat „Recipe not found”.
- 500 Internal Server Error: błędy niespodziewane (np. błąd Supabase/PG). Logować z `request_id`, zwrócić ogólny komunikat bez szczegółów systemowych.

Format błędu: `ApiError { error, message, details?, request_id }` ujednolicony z istniejącymi endpointami.

## 7. Wydajność
- Zapytanie po kluczu głównym `recipes.id` (indeks PK) + filtr `user_id` — bardzo szybkie; dodatkowe indeksy nie są wymagane.
- Selekcja tylko niezbędnych kolumn minimalizuje wolumen JSON.
- Brak potrzeby cache (dane prywatne); można jawnie ustawić `Cache-Control: no-store`.

## 8. Kroki implementacji
1. Schemat walidacji UUID
   - Dodaj prosty schemat: np. `const UuidSchema = z.string().uuid();`
   - Możesz umieścić lokalnie w pliku endpointu lub dodać `src/lib/schemas/common.schema.ts` (jeśli planujemy współdzielić w innych miejscach).
2. Service domenowy
   - Utwórz `src/lib/services/recipes.service.ts`:
     - Klasa `RecipesService` z metodą `getRecipeDetails(supabase, id: string, userId: string)` zwracającą `RecipeDetailsDTO | null`.
     - Implementacja: `from('recipes').select('id,user_id,title,summary,tags,recipe,created_at,updated_at').eq('id', id).eq('user_id', userId).single()`.
3. Endpoint Astro
   - Utwórz plik `src/pages/api/recipes/[id].ts` z:
     - `export const prerender = false;`
     - `export const GET: APIRoute = async ({ request, params, locals }) => { ... }`
     - Krok 1: `requestId = uuidv4()` (do śledzenia błędów).
     - Krok 2: Weryfikacja i parsowanie nagłówka `Authorization` → pobranie `jwt`.
     - Krok 3: Walidacja `params.id` przez Zod; jeśli błąd → 400.
     - Krok 4: `locals.supabase.auth.getUser(jwt)`; brak usera/błąd → 401.
     - Krok 5: Wywołanie `RecipesService.getRecipeDetails(locals.supabase, id, userId)`; brak danych → 404.
     - Krok 6: Zwrócenie 200 z danymi; nagłówki: `Content-Type: application/json`, `Cache-Control: no-store`.
     - Błędy: funkcja pomocnicza `jsonError(status, error, message, details?, requestId?)` zgodna z istniejącą w `generate.ts`.
4. Spójność z regułami implementacji
   - Użyj `locals.supabase` (nie importować klienta bezpośrednio w handlerze), Zod do walidacji, SSR-only (`prerender = false`).
   - Typy zwrotów wg `src/types.ts`.
5. Testy ręczne (przykłady)
   - 200: `GET /api/recipes/<valid-uuid>` z prawidłowym Bearer i zasobem użytkownika.
   - 401: brak/niepoprawny Bearer.
   - 400: `id` nie-UUID.
   - 404: `id` nieistniejący lub istniejący, lecz innego użytkownika.
   - 500: zasymulować błąd bazy (np. celowo błędna selekcja w trybie developerskim — tylko lokalnie).

