# Plan wdrożenia endpointu API: List Recipes (GET /api/recipes)

## 1. Przegląd punktu końcowego
Zwraca listę zapisanych przepisów zalogowanego użytkownika z wyszukiwaniem pełnotekstowym, filtrowaniem po tagach oraz paginacją (cursor lub offset). Zwraca lekkie rekordy (bez pełnego JSONB przepisu), wraz z metadanymi paginacji.

## 2. Szczegóły żądania
- Metoda HTTP: GET
- URL: /api/recipes
- Nagłówki: `Authorization: Bearer {token}` (wymagany)
- Parametry:
  - Wymagane: brak
  - Opcjonalne:
    - `search` (string) – pełnotekstowe wyszukiwanie po `title`, `summary`, `ingredients_text` (poprzez kolumnę `search_tsv`).
    - `tags` (string) – CSV tagów do filtrowania OR (np. `quick,italian`).
    - `sort` ("recent" | "oldest") – domyślnie `recent`.
    - `limit` (number) – domyślnie 20, zakres [1..100].
    - `cursor` (string) – Base64 zakodowane `created_at:id` dla keyset pagination.
    - `offset` (number) – alternatywa dla `cursor`; liczba nieujemna.
  - Reguły walidacji:
    - `cursor` i `offset` są wzajemnie wykluczające (jeśli oba obecne → 400).
    - `limit` w zakresie [1..100] (inaczej → 400).
    - `sort` ∈ {`recent`,`oldest`} (inaczej → 400).
    - `cursor` poprawne Base64 i poprawny format `ISO8601:id` (w innym razie → 400).
    - `tags` oraz `search` przycięte i ograniczone długościowo (np. do 200 znaków); normalizacja do lowercase dla tagów.
- Body: brak

## 3. Wykorzystywane typy
- `src/types.ts:136` `RecipeListItemDTO`
- `src/types.ts:150` `RecipeQueryParams`
- `src/types.ts:164` `PaginationMeta`
- `src/types.ts:175` `RecipeListResponse`
- `src/types.ts` `ApiError`

## 3. Szczegóły odpowiedzi
- 200 OK – lista przepisów i metadane paginacji:
  - `data: RecipeListItemDTO[]` – pola: `id`, `title`, `summary`, `tags`, `created_at`.
  - `pagination: PaginationMeta` – `limit`, `next_cursor`, `has_more`, `total_count`.
  - `message?: string` – opcjonalny komunikat dla pustego zbioru (np. „No recipes found…”).
- 200 OK (pusty wynik) – `data: []`, `has_more: false`, `next_cursor: null`, `total_count: 0`, opcjonalny `message`.
- 400 Bad Request – `ApiError` z `details` wskazującymi niepoprawne pola (np. `limit`, `cursor`).
- 401 Unauthorized – brak/niepoprawny token.
- 500 Internal Server Error – błąd serwera/bazy/Supabase.

## 4. Przepływ danych
1. Uwierzytelnienie: pobierz `supabase` z `Astro.locals` i wyprowadź `user.id` (401 przy braku sesji).
2. Walidacja query (Zod): `search`, `tags`, `sort`, `limit`, `cursor`, `offset`; reguły wykluczeń i zakresów.
3. Budowa zapytania (Supabase → Postgres):
   - `from('recipes')`
   - `select('id,title,summary,tags,created_at', { count: 'exact' })`
   - `eq('user_id', user.id)` (RLS ma dodatkowo wzmocnić izolację danych).
   - Filtrowanie tagów: `overlaps('tags', parsedTags[])` (OR po tagach).
   - Wyszukiwanie: `.textSearch('search_tsv', search, { type: 'websearch' })`.
   - Sortowanie: `recent` → `order('created_at', { ascending: false }).order('id', { ascending: false })`; `oldest` odwrotnie.
4. Paginacja:
   - Cursor: dekoduj Base64 → `(cursorCreatedAt, cursorId)`; w zależności od `sort` dodaj filtr:
     - `recent` (DESC): rekordy gdzie `(created_at, id) < (cursorCreatedAt, cursorId)`.
     - `oldest` (ASC): rekordy gdzie `(created_at, id) > (cursorCreatedAt, cursorId)`.
   - Offset: `.range(offset, offset + limit)`; stosować głównie dla małych odchyleń.
   - Pobieraj `limit + 1` elementów przy cursor pagination do detekcji `has_more`.
5. Agregacja metadanych:
   - `total_count` z meta Supabase (`count: 'exact'`, zapytanie HEAD lub osobne lekkie zapytanie licznikowe z tymi samymi filtrami bez paginacji).
   - `has_more` = `items.length > limit` (przy cursor) lub `offset + items.length < total_count` (przy offset).
   - `next_cursor` = Base64(`last.created_at:last.id`) gdy `has_more`, inaczej `null`.
6. Mapowanie odpowiedzi na `RecipeListResponse`; pusty zbiór z opcjonalnym `message`.

## 5. Względy bezpieczeństwa
- Autoryzacja: wymagany `Bearer` token; użycie `supabase.auth.getUser()` z kontekstu serwera; brak danych bez sesji.
- RLS w Postgres: polityki ograniczające dostęp do `recipes` po `user_id` (ON SELECT), kaskady na relacjach.
- Walidacja wejścia (Zod): ochrona przed nieprawidłowymi danymi i błędami formatu (Base64, zakresy, enum).
- Ograniczenia: `limit` maks. 100; twarde limity długości `search`/`tags`.
- Parametryzacja: wyłącznie metody Supabase/operatory (brak ręcznego konkatenowania SQL).
- Prywatność: nie ujawniaj, czy inne zasoby istnieją; brak `404` dla listy; spójne komunikaty błędów.
- Rate limiting (opcjonalnie w middleware) dla ochrony przed nadużyciami.

## 6. Obsługa błędów
- 400 ValidationError (`ApiError.details`):
  - `limit`: poza zakresem 1..100
  - `sort`: nieobsługiwany
  - `cursor`: błędny Base64 lub format `created_at:id`
  - `offset`: wartość ujemna
  - `tags`/`search`: przekroczony limit długości
- 401 Unauthorized: brak sesji lub nieważny token.
- 500 Internal Server Error: błędy Supabase/połączenia/nieprzewidziane wyjątki.
- Logowanie: strukturalne logi serwera (z `request_id`) dla 4xx/5xx; brak wpisu do `events` (dostępne typy zdarzeń nie obejmują listowania).

## 7. Wydajność
- Indeksy:
  - `recipes (user_id, created_at, id)` – B-Tree pod filtrowanie i sort/paginację (ASC/DESC).
  - `recipes.search_tsv` – GIN dla FTS.
  - `recipes.tags` – GIN dla operatora `&&` (overlaps).
- Paginacja cursorowa jako domyślna (mniej kosztowna niż duże offsety).
- Ogranicz selekcję do niezbędnych kolumn listy (bez `recipe` JSONB).
- Liczenie: użyj metadanych `count: 'exact'` z zapytaniem HEAD/oddzielnym licznikowym, by uniknąć dużych transferów.
- Normalizacja wejścia (lowercase tagów) zgodnie z danymi w DB.

## 8. Etapy wdrożenia
1. Walidacja (Zod):
   - Dodać `src/lib/validation/recipes.zod.ts` z `recipeListQuerySchema` (mapowane do `RecipeQueryParams`).
   - Reguły: mutual-exclusion `cursor`/`offset`, zakres `limit`, enum `sort`, limity długości.
2. Serwis:
   - Utworzyć `src/lib/services/recipes.service.ts` z `listRecipes(supabase, userId, query): Promise<RecipeListResponse>`.
   - Logika: budowa filtrów (tags/search), sortowanie, paginacja (cursor/offset), obliczenie `total_count`/`has_more`/`next_cursor`.
   - Pomocniczo: `src/lib/utils/cursor.ts` (parse/encode Base64 `created_at:id`).
3. Endpoint API (Astro):
   - `src/pages/api/recipes.ts`:
     - `export const prerender = false`.
     - `export async function GET({ locals, url })` – autoryzacja przez `locals.supabase`, walidacja query (Zod), delegacja do serwisu, mapowanie na `200` lub `400/401/500` (`ApiError`).
     - Nagłówki: `Content-Type: application/json`.
4. Testy ręczne/integracyjne:
   - Scenariusze: bez filtrów; z `search`; z `tags`; `sort=oldest`; `limit` graniczne; `cursor`/`offset`; pusty wynik; niepoprawne parametry.
5. Wydajność/DB (jeśli brak):
   - Zweryfikować istnienie indeksów GIN (na `search_tsv`, `tags`) i B-Tree (`user_id, created_at, id`).
6. Dokumentacja:
   - Opisać parametry i przykłady użycia (README sekcja API) zgodnie ze specyfikacją oraz strukturę błędów `ApiError`.

