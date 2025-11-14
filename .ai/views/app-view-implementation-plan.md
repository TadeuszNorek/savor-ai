# Plan implementacji widoku Aplikacja

## 1. Przegląd
Widok Master‑Detail z layoutem 2‑kolumnowym. Lewy panel zawiera wyszukiwarkę, filtry tagów (OR), sortowanie i listę kart przepisów z paginacją „Załaduj więcej”. Prawy panel obsługuje dwie zakładki: Generator (wysyłanie promptu do AI) oraz Podgląd (szkic po generacji lub szczegóły zapisanego przepisu). Widok respektuje auth guards (RLS), parametry listy w URL i deep‑link do szczegółów: `/app/recipes/:id`.

## 2. Routing widoku
- Ścieżki:
  - `/app` — główny layout (lista + Generator/Podgląd).
  - `/app/recipes/:id` — deep‑link; prawy panel otwiera Podgląd zapisanego przepisu o podanym `id`.
  - (Mobile) opcjonalnie alias `/app/generator` dla wymuszenia zakładki Generator (przełącznik tabs).
- Ochrona dostępu: middleware `src/middleware/index.ts` przekierowuje nieautoryzowanych na `/login` (401).
- Zachowanie stanu listy: parametry (`search`, `tags`, `sort`, `limit`, `offset`) w URL; restauracja scrolla lewego panelu.

## 3. Struktura komponentów
- AppLayout (grid 2 kolumny)
  - LeftPanel
    - SearchBar
    - TagFilterChips
    - SortSelect
    - RecipeList
      - RecipeCard (pozycja listy)
    - PaginationLoadMore
    - EmptyState / ErrorPanel / Skeleton
  - RightPanel
    - Tabs (Generator | Podgląd)
    - GeneratorPanel (zakładka)
      - TextareaWithCounter
      - GenerateButton
      - RetryIndicator
      - ValidationPanel (wyniku AI)
      - Alert (limity/awarie)
    - PreviewPanel (zakładka)
      - RecipePreview (render JSON→HTML)
      - SaveButton
      - RestoreDraftButton (jeśli szkic w sessionStorage)
      - DeleteButton + AlertDialog
      - Badge/Chips (tagi; klik dodaje filtr w lewym panelu)
- Globalne: Toaster, Tooltip, Alert (shadcn/ui), ErrorBoundary.

## 4. Szczegóły komponentów
### AppLayout
- Opis: Kontener layoutu 2‑kolumnowego (Tailwind grid), zawiera LeftPanel i RightPanel.
- Główne elementy: `<div class="grid lg:grid-cols-[420px_1fr] gap-4">`.
- Interakcje: Brak (propaguje zdarzenia dzieci).
- Walidacja: Brak.
- Typy: `SelectedRecipeId?: string`, `ActiveTab: 'generator'|'preview'`.
- Propsy: `{ selectedRecipeId?: string; activeTab: 'generator'|'preview'; onTabChange(tab); }`.

### LeftPanel
- Opis: Panel listy z filtrami, wyszukiwaniem i sortowaniem.
- Główne elementy: SearchBar, TagFilterChips, SortSelect, RecipeList, PaginationLoadMore, EmptyState/ErrorPanel/Skeleton.
- Interakcje: zmiana filtrów aktualizuje URL; klik karty wybiera przepis (nawigacja do `/app/recipes/:id`).
- Walidacja: długość `search` ≤ 200; poprawny `limit` 1–100; `tags` jako CSV w URL.
- Typy: `RecipeListResponse`, `RecipeListItemDTO`, `RecipeQueryParams`, `PaginationMeta`, `ApiError`.
- Propsy: `{ query: ListFiltersVM; selectedId?: string; onSelect(id: string); }`.

### SearchBar
- Opis: Pole wyszukiwania pełnotekstowego.
- Główne elementy: `<input type="search">`, przycisk „Szukaj”/debounce.
- Interakcje: `onChange`, `onSubmit`, Enter; reset przycisk „Wyczyść”.
- Walidacja: string trim, max 200 (zgodnie z `RecipeListQuerySchema`).
- Typy: `value: string`, `maxLength = 200`.
- Propsy: `{ value: string; onChange(v); onSubmit(); disabled?: boolean; }`.

### TagFilterChips
- Opis: Filtry tagów w logice OR (dowolny z wybranych).
- Główne elementy: grupa `<button role="checkbox">`/`<Toggle>`.
- Interakcje: toggle chipów aktualizuje `tags` w URL; „Wyczyść filtry”.
- Walidacja: normalizacja do lowercase, unikatowe.
- Typy: `selected: string[]; allTags: string[]` (agregowane z listy);
- Propsy: `{ selected: string[]; allTags: string[]; onChange(next: string[]); }`.

### SortSelect
- Opis: Wybór sortowania („ostatnio dodane” domyślnie).
- Główne elementy: `<Select>` shadcn/ui.
- Interakcje: zmiana `sort` w URL; resetuje `offset`/`cursor`.
- Walidacja: `'recent'|'oldest'`.
- Typy: `RecipeSortOrder`.
- Propsy: `{ value: RecipeSortOrder; onChange(v: RecipeSortOrder); }`.

### RecipeList
- Opis: Lista kart przepisów w oparciu o `RecipeListResponse` (TanStack `useInfiniteQuery`).
- Główne elementy: `ul>li`/`Card` (tytuł, tagi, timestamp), skeletony.
- Interakcje: klik karty → `onSelect(id)` (nawigacja); `onLoadMore()`.
- Walidacja: brak (serwer waliduje zapytanie).
- Typy: `RecipeListItemDTO[]`, `PaginationMeta`.
- Propsy: `{ pages: RecipeListResponse[]; isLoading: boolean; isError: boolean; selectedId?: string; onSelect(id); onLoadMore(); hasNextPage: boolean; }`.

### RecipeCard
- Opis: Pojedyncza karta listy (tytuł, tagi, `created_at`).
- Główne elementy: `Card`, `Badge`.
- Interakcje: klik karty wybiera przepis.
- Walidacja: brak.
- Typy: `RecipeListItemDTO`.
- Propsy: `{ item: RecipeListItemDTO; selected?: boolean; onClick(); }`.

### PaginationLoadMore
- Opis: Przycisk ładowania kolejnej strony (offset lub cursor, MVP: offset).
- Główne elementy: `Button`.
- Interakcje: `onClick` wywołuje `fetchNextPage()`.
- Walidacja: brak.
- Typy: `hasMore: boolean`.
- Propsy: `{ hasMore: boolean; isLoading: boolean; onClick(); }`.

### Tabs
- Opis: Zakładki „Generator” i „Podgląd”.
- Główne elementy: `Tabs`/`TabsList` (shadcn/ui).
- Interakcje: `onChange` zmienia stan `activeTab` i (mobile) może aktualizować routing.
- Walidacja: brak.
- Typy: `'generator'|'preview'`.
- Propsy: `{ value: 'generator'|'preview'; onChange(v); }`.

### GeneratorPanel
- Opis: UI do wysyłania promptu i prezentacji szkicu.
- Główne elementy: TextareaWithCounter (limit 2000), GenerateButton, RetryIndicator, ValidationPanel, Alert (413/500/503).
- Interakcje: `onGenerate(prompt)`, blokada przy pustym/za długim promptcie, pokaz retry 1/1.
- Walidacja: prompt: min 1, max 2000, kontrolne znaki/suspicious patterns (zgodnie z `GenerateRecipeCommandSchema`).
- Typy: `GenerateRecipeCommand`, `GenerateRecipeResponse`, `ApiError`.
- Propsy: `{ draft: GeneratorDraftVM; onDraftChange(d); onGenerated(r: GenerateRecipeResponse); }`.

### TextareaWithCounter
- Opis: Pole promptu z licznikiem i maksymalną długością.
- Główne elementy: `<textarea>`, licznik.
- Interakcje: `onChange`, licznik maleje.
- Walidacja: max 2000 (frontend) + komunikaty.
- Typy: `value: string`.
- Propsy: `{ value: string; maxLength?: number; onChange(v); disabled?: boolean; }`.

### GenerateButton / RetryIndicator / ValidationPanel
- Opis: Kontrolki sterujące generacją i walidacją wyniku (Zod na `RecipeSchemaZ`).
- Interakcje: `onClick` → POST `/api/recipes/generate`; RetryIndicator pokazuje automatyczny retry (serwer 1×) + ewentualny ręczny przycisk „Ponów”.
- Walidacja: rozmiar wyniku (komunikat 413), błędy 503/500/429.
- Typy: `loading: boolean`, `error?: ApiError`.
- Propsy: `{ loading: boolean; error?: ApiError; onRetry?(); }`.

### PreviewPanel
- Opis: Podgląd szkicu (z generatora) lub szczegółów zapisanego przepisu.
- Główne elementy: RecipePreview, SaveButton, RestoreDraftButton, DeleteButton (+AlertDialog), Chips tagów.
- Interakcje: Save (POST `/api/recipes`), Delete (DELETE `/api/recipes/:id`), klik tagu → dodanie filtra.
- Walidacja: blokada Save przy „Unikaj” (nielubiane składniki) w profilu; walidacja typu.
- Typy: `RecipeSchema`, `RecipeDetailsDTO`, `SaveRecipeCommand`, `RecipeSummaryDTO`, `ApiError`.
- Propsy: `{ mode: 'draft'|'saved'; recipe?: RecipeSchema; details?: RecipeDetailsDTO; onSaved(summary); onDeleted(id); onTagClick(tag); }`.

### RecipePreview
- Opis: Renderuje JSON do semantycznego HTML (tytuł, czasy, porcje, atrybuty, listy składników i instrukcji, tagi badge).
- Główne elementy: typografia `prose`, struktury semantyczne.
- Interakcje: klik w `Badge` → `onTagClick(tag)`.
- Walidacja: długości pól zgodnie z `RecipeSchemaZ` (komunikaty tooltip/aria-live).
- Typy: `RecipeSchema | RecipeDetailsDTO`.
- Propsy: `{ data: RecipeSchema | RecipeDetailsDTO; onTagClick(tag); readonly?: boolean; }`.

### SaveButton
- Opis: Zapisuje szkic do kolekcji; disabled gdy trafia „Unikaj”.
- Główne elementy: `Button` + `Tooltip` (powód disabled, link do `/profile`).
- Interakcje: `onClick` → POST `/api/recipes`; toast sukcesu; invalidacja listy.
- Walidacja: lokalny check „Unikaj” + rozmiar JSON (ostrożnościowo; serwer finalnie weryfikuje 413).
- Typy: `SaveRecipeCommand`, `ApiError`.
- Propsy: `{ disabled: boolean; disabledReason?: string; onClick(); }`.

### DeleteButton
- Opis: Usuwa zapisany przepis (hard delete) z potwierdzeniem.
- Główne elementy: `AlertDialog` (shadcn/ui), `Button`.
- Interakcje: `onConfirm` → DELETE `/api/recipes/:id`; po sukcesie czyszczenie `selectedId` i invalidacja listy.
- Walidacja: brak (serwer RLS/404).
- Typy: `ApiError`.
- Propsy: `{ recipeId: string; onDeleted(id); }`.

### EmptyState / ErrorPanel / Skeleton
- Opis: Stany puste i błędów listy oraz ładowania.
- Główne elementy: CTA „Wygeneruj pierwszy przepis!”, opisy błędów (401/404/413/500/503/429 mapowane do przyjaznych komunikatów), skeleton karty.
- Interakcje: CTA przełącza zakładkę na Generator; „Spróbuj ponownie”.
- Walidacja: brak.
- Typy: `ApiError`.
- Propsy: `{ message?: string; onCta?(); }`.

## 5. Typy
- Istniejące (z `src/types.ts`):
  - `RecipeSchema`, `RecipeListItemDTO`, `RecipeDetailsDTO`, `RecipeListResponse`, `PaginationMeta`.
  - `RecipeQueryParams` (klient buduje jako URLSearchParams), `RecipeSortOrder`.
  - `GenerateRecipeCommand`, `GenerateRecipeResponse`, `SaveRecipeCommand`, `RecipeSummaryDTO`, `ApiError`.
- Nowe (ViewModel/DTO frontendu):
  - `ListFiltersVM`:
    - `search?: string; tags: string[]; sort: 'recent'|'oldest'; limit: number; offset?: number; cursor?: string | null`.
  - `GeneratorDraftVM`:
    - `prompt: string; recipe?: RecipeSchema; generationId?: string; generatedAt?: string`.
  - `RecipeCardVM` (opcjonalnie, alias `RecipeListItemDTO`).
  - `PreviewMode = 'draft'|'saved'`.
  - `UiError = { code: 400|401|404|413|429|500|503; message: string; details?: Record<string, unknown> }` (mapowane z `ApiError`).

## 6. Zarządzanie stanem
- React Query (`QueryProvider`):
  - Lista: `useInfiniteQuery` z kluczem `['recipes', filters]`; `getNextPageParam` na bazie `pagination.has_more` i `offset` (MVP) lub `next_cursor` (docelowo).
  - Szczegóły: `useQuery(['recipe', id], GET /api/recipes/:id)`.
  - Mutacje: `useMutation` dla generate/save/delete; invalidacja `['recipes']` po zapisie/usunięciu.
- URL ↔ stan:
  - Aktualizacja `URLSearchParams` przy zmianie filtrów; odczyt na mount.
  - Reset `offset/cursor` po zmianie `search/tags/sort/limit`.
- Scroll listy:
  - `useScrollRestoration(containerRef, key=location.search)` zapisuje/odtwarza `scrollTop` z `sessionStorage`.
- Szkic generatora:
  - `sessionStorage['generatorDraft']` jako źródło prawdy; `RestoreDraftButton` przywraca.
- Zakładki:
  - `activeTab` w stanie lokalnym; auto‑przełączenie na „Podgląd (Szkic)” po udanej generacji.

## 7. Integracja API
- `GET /api/recipes?search&tags&sort&limit&offset|cursor`
  - Request: nagłówek `Authorization: Bearer {token}`.
  - Response: `RecipeListResponse`.
  - Błędy: 400 (parametry/cursor), 401 (redirect do `/login`), 500.
- `GET /api/recipes/:id`
  - Response: `RecipeDetailsDTO`; 404 gdy brak lub cudze; 401/500 jak wyżej.
- `POST /api/recipes/generate`
  - Body: `GenerateRecipeCommand { prompt }`.
  - Response: `GenerateRecipeResponse { recipe, generation_id, generated_at }`.
  - Błędy: 400 (walidacja promptu), 413 (za duży wynik), 429 (limit generacji), 500/503.
- `POST /api/recipes`
  - Body: `SaveRecipeCommand { recipe, tags? }`.
  - Response: `201` + `RecipeSummaryDTO`; nagłówek `Location`.
  - Błędy: 400 („disliked ingredient”), 413 (za duży JSON), 401/500.
- `DELETE /api/recipes/:id`
  - Response: `204`; Błędy: 404/401/500.
- Klient HTTP: wspólny helper `apiFetch` (wydzielić do `src/lib/api/http.ts`) + hooki w `src/lib/api/recipes.ts` (`useRecipesList`, `useRecipeDetails`, `useGenerateRecipeMutation`, `useSaveRecipeMutation`, `useDeleteRecipeMutation`).

## 8. Interakcje użytkownika
- Wyszukiwanie: wpis → Enter/„Szukaj” aktualizuje URL i odświeża listę; `aria-live` ogłasza liczbę wyników.
- Filtry tagów: toggle chipów → aktualizacja URL; przycisk „Wyczyść”.
- Sortowanie: zmiana opcji → reset paginacji; ponowne pobranie.
- Lista: klik karty → przejście do `/app/recipes/:id`; lewy panel zachowuje filtry i scroll (restauracja).
- Generator: wpis promptu (licznik), klik „Generuj” → loading, retry 1× po stronie serwera; sukces przełącza na zakładkę Podgląd (Szkic).
- Podgląd (Szkic): „Zapisz” → POST `/api/recipes`; toast sukcesu, invalidacja listy, możliwość przejścia do zapisanego.
- Podgląd (Zapisany): „Usuń” → potwierdzenie → DELETE; toast sukcesu; powrót do zakładki Generator i/lub pusty Podgląd.
- Kliknięcie tagu w podglądzie/kartach: dodaje tag do filtrów w lewym panelu i odświeża listę.

## 9. Warunki i walidacja
- Lista (`GET /api/recipes`):
  - `search` max 200, `tags` CSV max 200 znaków, `limit` 1–100, `cursor` XOR `offset`.
- Generator (`POST /api/recipes/generate`):
  - `prompt` min 1, max 2000, bez znaków kontrolnych, bez wzorców „prompt injection”.
- Zapis (`POST /api/recipes`):
  - `RecipeSchemaZ` (tytuł ≤ 200, składniki 1–100, instrukcje 1–50, tagi ≤ 20 itd.).
  - Rozmiar JSON ≤ 200KB (ostateczna walidacja na backendzie; frontend pre‑check opcjonalny).
  - „Unikaj”: klient sprawdza `profile.disliked_ingredients` vs `recipe.ingredients` (contains, case‑insensitive) → jeśli trafienie, `SaveButton` disabled + tooltip + link do `/profile`.

## 10. Obsługa błędów
- 401: globalnie w `apiFetch` → redirect do `/login`.
- 400: pokaz komunikaty walidacyjne (field‑level); dla „disliked ingredient” — dedykowany alert z przyciskiem „Edytuj profil”.
- 404: w szczegółach — panel Podglądu z komunikatem „Przepis nie istnieje lub brak dostępu”, CTA powrotu.
- 413: generacja/zapis — Alert „Za duży wynik/przepis” + wskazanie limitu (200KB) i sugestie.
- 429: generacja — toast z „Poczekaj X s” (z `retry_after` gdy dostępny).
- 500/503: przyjazny Alert + przycisk „Spróbuj ponownie”; telemetry nie blokuje UX.
- Network: toasty błędów; exponential backoff po stronie AI (serwer) — UI pokazuje RetryIndicator.

## 11. Kroki implementacji
1. Routing: utwórz `src/pages/app.astro` i `src/pages/app/recipes/[id].astro` (wspólny layout + przekazanie `selectedRecipeId`).
2. API klient: wyodrębnij `apiFetch` do `src/lib/api/http.ts`; dodaj `src/lib/api/recipes.ts` z hookami (list/details/generate/save/delete).
3. Komponenty lewego panelu: `SearchBar`, `TagFilterChips`, `SortSelect`, `RecipeList`, `RecipeCard`, `PaginationLoadMore`, `EmptyState`, `ErrorPanel`, skeletony.
4. Komponenty prawego panelu: `Tabs`, `GeneratorPanel` (TextareaWithCounter, GenerateButton, RetryIndicator, ValidationPanel, Alert), `PreviewPanel` (RecipePreview, SaveButton, RestoreDraftButton, DeleteButton + AlertDialog).
5. Stan i URL: `ListFiltersVM` + synchronizacja z `URLSearchParams`; reset paginacji po zmianie filtrów; `useScrollRestoration` dla listy.
6. Integracja API: podłącz hooki do komponentów; invalidacje cache (`['recipes']`) po zapisie/usunięciu; mapowanie błędów do UI.
7. A11y/i18n: etykiety ARIA, `aria-live` dla statusów, focus management; przygotuj klucze i18n (PL gotowe, EN w Phase 2).
8. Testy ręczne scenariuszy: puste listy, filtry OR, sort, deep‑link, 401→/login, 413/429/500/503; weryfikacja RLS (brak dostępu do cudzych danych).
9. Dopieszczenie UX: toasty sukcesu/błędów, tooltipy, skeletony; responsywność (tabs na mobile).
