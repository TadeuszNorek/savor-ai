<conversation_summary>
<decisions>
1. Uwierzytelnianie przez `auth.users` (Supabase) i referencja użytkownika wyłącznie przez `user_id uuid` w każdej tabeli.
2. Profil 1:1: tabela `profiles` z `user_id uuid PRIMARY KEY`, `created_at`, `updated_at`.
3. Pole `dietType` jako `text` z CHECK ograniczającym do dozwolonych wartości (bez enum w MVP).
4. `dislikedIngredients` oraz `preferredCuisines` przechowywane jako `text[]` w `profiles`.
5. Preferencja „dark mode” tylko w `localStorage` (poza bazą w MVP).
6. Tabela `recipes` z `id uuid PK`, `user_id uuid NOT NULL`, `recipe jsonb NOT NULL`, `tags text[]`, `created_at`, `updated_at`.
7. Kolumny pochodne w `recipes`: `title text`, `summary text`, `ingredients_text text[]`, `search_tsv tsvector` (generated/maintained).
8. Brak edycji zapisanych przepisów w MVP; dopuszczalne tylko INSERT/DELETE właściciela.
9. Usuwanie przepisów jako hard-delete (bez `deleted_at` w MVP).
10. Walidacja `recipe jsonb` względem `schema_v1` w aplikacji (opcjonalnie `pg_jsonschema` po stronie DB).
11. Blokada „Unikaj”: normalizacja składników do lowercase/unaccent i sprawdzanie kolizji z profilem; preferowana ścieżka INSERT przez bezpieczną funkcję RPC.
12. Full-text search: `search_tsv = to_tsvector(unaccent(...))` na tytule/opisie/składnikach; GIN na `search_tsv`.
13. Filtr tagów (OR) wsparty GIN na `tags` (`text[]`).
14. Sortowanie „ostatnio dodane”: indeks B-tree `(user_id, created_at DESC)` i paginacja keyset.
15. Logi KPI w tabeli `events`: `id uuid PK`, `user_id uuid`, `type text CHECK (...)`, `payload jsonb`, `occurred_at timestamptz DEFAULT now()`.
16. Dostęp do `events`: użytkownicy tylko INSERT; brak SELECT/UPDATE/DELETE; rola serwisowa ma SELECT (np. do eksportu).
17. Eksport NDJSON przez `COPY (SELECT to_jsonb(e.*))`/RPC dostępny wyłącznie dla roli serwisowej.
18. Klucze obce do `auth.users(id)` z `ON DELETE CASCADE` w `profiles`, `recipes`, `events`.
19. Brak referencyjnych słowników dla diet/kuchni w MVP (zwykły `text`/`text[]`).
20. RLS dla `profiles`: `SELECT/UPDATE` wyłącznie gdy `user_id = auth.uid()`, `WITH CHECK (user_id = auth.uid())`.
21. RLS dla `recipes`: `SELECT/DELETE` wyłącznie właściciel (`user_id = auth.uid()`), brak UPDATE.
22. RLS dla `events`: `INSERT` tylko z `user_id = auth.uid()`; brak SELECT dla public.
23. Brak partycjonowania w MVP; rozważyć dla `events` > 1M wierszy (po dacie).
24. Limity danych: CHECK na rozmiar `recipe` (~200 KB) oraz rozsądne długości `tags`/`ingredients_text`.
25. Paginacja listy przepisów: keyset po `(created_at, id)` dla stabilności i wydajności.
26. Brak duplikacji prompt/odpowiedź AI w `recipes`; szczegóły w `events.payload` dla `ai_prompt_sent`/`ai_recipe_generated`.
27. Schemat `public` w MVP (bez dedykowanego schematu).
28. Normalizacja tagów i składników do lowercase + `unaccent` (spójność i lepsze wyszukiwanie).
</decisions>

<matched_recommendations>
1. JSONB jako nośnik pełnego przepisu z kolumnami pochodnymi do wyszukiwania i FTS.
2. RLS per użytkownik dla `profiles` i `recipes`; `events` tylko do INSERT przez usera.
3. FTS z `unaccent` i GIN; GIN na `tags` dla filtra OR.
4. Indeks `(user_id, created_at DESC)` i paginacja keyset dla „ostatnio dodane”.
5. Walidacja `schema_v1` w aplikacji; opcjonalnie `pg_jsonschema` jako CHECK.
6. Blokada „Unikaj” z normalizacją danych + bezpieczny INSERT przez RPC.
7. Logowanie zdarzeń w `events` i eksport NDJSON tylko rolą serwisową.
8. ON DELETE CASCADE do sprzątania danych po usunięciu konta.
9. Brak partycjonowania w MVP; plan na przyszłość dla `events`.
10. Limity rozmiaru `recipe` i higiena danych (lowercase/unaccent, ograniczenia długości).
</matched_recommendations>

<database_planning_summary>
Główne wymagania (z PRD):
- Zapis i przegląd prywatnych przepisów generowanych przez AI (JSON zgodny z `schema_v1`).
- Minimalne wyszukiwanie: FTS po tytule/opisie/składnikach; filtr tagów OR; sortowanie „ostatnio dodane”.
- Profil preferencji (dietType?, dislikedIngredients[], preferredCuisines[]); blokada zapisu przy kolizji z „Unikaj”.
- Autentykacja i RLS per użytkownik; brak udostępniania publicznego.
- Logowanie zdarzeń (session_start, profile_edited, ai_prompt_sent, ai_recipe_generated, recipe_saved) i eksport NDJSON KPI.

Encje i relacje:
- `profiles(user_id PK, diet_type text, disliked_ingredients text[], preferred_cuisines text[], created_at, updated_at)` → FK do `auth.users(id)` (CASCADE). RLS: SELECT/UPDATE własne, WITH CHECK.
- `recipes(id PK, user_id, recipe jsonb, tags text[], title text, summary text, ingredients_text text[], search_tsv tsvector, created_at, updated_at)` → FK do `auth.users(id)` (CASCADE). RLS: SELECT/DELETE własne; brak UPDATE.
- `events(id PK, user_id, type text CHECK (...), payload jsonb, occurred_at timestamptz DEFAULT now())` → FK do `auth.users(id)` (CASCADE). RLS: INSERT własne; SELECT tylko rola serwisowa.

Indeksy i wydajność:
- GIN na `recipes.search_tsv` dla FTS (z `unaccent`).
- GIN na `recipes.tags` (`text[]`) dla filtra OR (`&&`).
- B-tree `(user_id, created_at DESC)` dla sort/paginacji; ewentualnie `(user_id, created_at DESC, id)` pod keyset.
- Opcjonalny GIN dla `profiles.disliked_ingredients`/`preferred_cuisines` jeśli będzie potrzeba filtracji.

Walidacja i spójność danych:
- Walidacja `recipe` względem `schema_v1` w aplikacji; opcjonalny CHECK przez `pg_jsonschema` (jeśli dostępny w Supabase).
- CHECK limitu rozmiaru `recipe` (~200 KB). Utrzymywać rozsądne limity długości elementów tablic.
- Normalizacja do lowercase i `unaccent` dla `tags` i `ingredients_text` (trigger/generate w DB lub w aplikacji).

Bezpieczeństwo i dostęp:
- RLS wymuszające własność rekordów (`auth.uid()`); brak SELECT do `events` dla public.
- INSERT `recipes` przez RPC, które odrzuci kolizje z „Unikaj” (case-insensitive, po normalizacji).
- Eksport NDJSON dostępny wyłącznie dla roli serwisowej (funkcja lub `COPY`).

Skalowalność i utrzymanie:
- Brak partycjonowania w MVP; planowane partycjonowanie miesięczne/roczne `events` po dacie przy dużych wolumenach.
- ON DELETE CASCADE upraszcza utrzymanie przy usunięciu konta.
- Paginacja keyset zwiększa wydajność listy przepisów.
</database_planning_summary>

<unresolved_issues>
1. Finalna lista dozwolonych wartości `dietType` do CHECK (np. vegan, vegetarian, keto, paleo, itp.).
2. Źródło prawdy i format `schema_v1` przepisu (dokładne pola do odczytu `title/summary/ingredients_text`).
3. Decyzja: czy blokadę „Unikaj” egzekwować wyłącznie w aplikacji, czy również twardo w DB (RPC/trigger)?
4. Język FTS: `simple` + `unaccent` czy dedykowany `polish` (dostępność w Supabase)?
5. Czy `title/summary/ingredients_text` mają być kolumnami generated (expression) czy utrzymywane triggerem przy INSERT?
6. Kształt `events.type` (pełna lista) i standard `payload` (np. schemat dla prompt/odpowiedzi AI, błędów walidacji).
7. Polityka retencji dla `events` (okres przechowywania/log rotation) i ewentualne partycjonowanie.
8. Dokładny limit rozmiaru `recipe` oraz maks. długości elementów `tags`/`ingredients_text`.
9. Czy przewidzieć mechanizm deduplikacji przepisów (hash) lub unikalność tytułu w obrębie użytkownika?
10. Sposób nadawania/edycji `tags` w przyszłości (czy dopuścić UPDATE wyłącznie `tags`).
</unresolved_issues>
</conversation_summary>
