# Architektura UI dla SavorAI (MVP)

## 1. Przegląd struktury UI

SavorAI (MVP) to aplikacja webowa w układzie desktopowym 2‑kolumnowym: lewy panel zawiera wyszukiwanie, filtry tagów i listę zapisanych przepisów; prawy panel to obszar roboczy z zakładkami „Generator” i „Podgląd”. Na urządzeniach mobilnych widoki są rozdzielone na pełnoekranowe trasy (lista/generator/podgląd). Generowanie i kolekcja są dostępne wyłącznie po zalogowaniu (Supabase Auth, RLS). Stan danych i cache obsługuje TanStack Query (klucze: `profile`, `recipes:list(params)`, `recipe:id`), szkic ostatnio wygenerowanego przepisu trzymany jest w pamięci i `sessionStorage` (nadpisywany przy każdej nowej generacji).

Interakcje z API: generowanie (`POST /api/recipes/generate`), zapis/lista/szczegóły/usuwanie (`/api/recipes`), profil (`/api/profile`), oraz logowanie zdarzeń sesji (`POST /api/events`). UI eksponuje limity (długość promptu, rozmiar odpowiedzi), mapuje błędy (401→/login, 404→Nie znaleziono, 400 walidacje, 413 limity) i zapewnia dostępność (ARIA, focus, kontrast WCAG AA) oraz dark mode.

## 2. Lista widoków

- Nazwa widoku: Logowanie / Rejestracja
  - Ścieżka widoku: `/login`
  - Główny cel: Uwierzytelnienie użytkownika (Supabase Auth) i ustanowienie sesji.
  - Kluczowe informacje do wyświetlenia: Formularz e‑mail/hasło, komunikaty błędów (nieprawidłowe dane), link do rejestracji, stan ładowania.
  - Kluczowe komponenty widoku: `AuthForm`, `Button`, `Input`, `Alert`, `Toaster`.
  - UX, dostępność i względy bezpieczeństwa: Walidacja po stronie klienta i serwera; komunikaty dostępne dla czytników ekranu; po zalogowaniu redirect do `/app` lub (gdy brak profilu) do `/profile`; przechowywanie tokenu bezpiecznie (SDK Supabase).

- Nazwa widoku: Profil preferencji
  - Ścieżka widoku: `/profile`
  - Główny cel: Utworzenie/edycja profilu (dietType?, dislikedIngredients[], preferredCuisines[]) w celu personalizacji generacji i blokady „Unikaj”.
  - Kluczowe informacje do wyświetlenia: Aktualne wartości profilu, podpowiedzi pól, status zapisu, informacja o wpływie na generację.
  - Kluczowe komponenty widoku: `Form` (select, tags/combobox, chips), `Button Save`, `Alert`, `Toaster`.
  - UX, dostępność i względy bezpieczeństwa: Zapis wysyła zdarzenie `profile_edited`; po sukcesie invalidacja `profile`; focus management po walidacjach; 401 przekierowuje do `/login`; dane ograniczone przez RLS.

- Nazwa widoku: Aplikacja (shell z lewym panelem)
  - Ścieżka widoku: `/app`
  - Główny cel: Zapewnienie stałego lewego panelu (wyszukiwanie, filtry, sort, lista) oraz prawego panelu (Generator/Podgląd) w ramach jednego layoutu.
  - Kluczowe informacje do wyświetlenia: Parametry wyszukiwania (query string), liczba wyników, lista kart przepisów, stany puste i błędów, w prawym panelu aktywna zakładka.
  - Kluczowe komponenty widoku: `AppLayout` (grid 2‑kolumnowy), `SearchBar`, `TagFilterChips` (logika OR), `SortSelect`, `RecipeList`, `PaginationLoadMore`, `Tabs` (Generator/Podgląd).
  - UX, dostępność i względy bezpieczeństwa: Zachowanie scrolla listy przy nawigacji do szczegółów; prefetch `recipe:id` na hover/focus; parametry listy w URL; brak generacji bez logowania; dark mode.

- Nazwa widoku: Generator przepisu (zakładka)
  - Ścieżka widoku: `/app/generator` (lub zakładka w `/app`)
  - Główny cel: Wysłanie promptu do AI, otrzymanie pojedynczego przepisu w `schema_v1`, utworzenie szkicu.
  - Kluczowe informacje do wyświetlenia: Licznik znaków promptu i limit, stan generowania/ponawiania (1/1), komunikaty o 400/413/500/503, wynikowa walidacja JSON i ewentualne naruszenia.
  - Kluczowe komponenty widoku: `TextareaWithCounter`, `GenerateButton`, `RetryIndicator`, `Alert` (limity/awarie), `ValidationPanel` (Zod/ajv), `Tabs`.
  - UX, dostępność i względy bezpieczeństwa: Auto‑przełączenie na „Podgląd (Szkic)” po sukcesie; 1× retry na porażce; blokada „Generuj” przy przekroczeniu limitu; logowanie `ai_prompt_sent`/`ai_recipe_generated` po stronie serwera; 401→/login.

- Nazwa widoku: Podgląd przepisu (Szkic/Zapisany)
  - Ścieżka widoku: część prawego panelu w `/app` (po generacji) oraz szczegóły pod `/app/recipes/:id`
  - Główny cel: Renderowanie JSON→MD/HTML, weryfikacja blokady „Unikaj”, działania: Zapisz/Usuń/Przywróć szkic.
  - Kluczowe informacje do wyświetlenia: Tytuł, tagi, czasy/przygotowanie, składniki i instrukcje, atrybuty dietetyczne, ostrzeżenia „Unikaj”.
  - Kluczowe komponenty widoku: `RecipePreview` (typografia prose), `SaveButton` (disabled z tooltipem przy trafieniu „Unikaj”), `DeleteButton` + `AlertDialog`, `RestoreDraftButton`, `Badge/Chips` dla tagów.
  - UX, dostępność i względy bezpieczeństwa: Klik tagu dodaje filtr w lewym panelu bez zmiany aktywnego podglądu; `Save` zapisuje pełny JSON do `/api/recipes`; przy usuwaniu: potwierdzenie, optymistyczna aktualizacja i invalidacja listy; RLS chroni dostęp.

- Nazwa widoku: Szczegóły przepisu
  - Ścieżka widoku: `/app/recipes/:id`
  - Główny cel: Wyświetlenie pełnych danych przepisu (zapisany rekord), akcja usuwania.
  - Kluczowe informacje do wyświetlenia: Dane `recipe`, metadane (id, timestamps, tagi), informacja „tylko podgląd”.
  - Kluczowe komponenty widoku: `RecipePreview`, `DeleteButton` + `AlertDialog`, `Skeleton/Spinner` dla ładowania.
  - UX, dostępność i względy bezpieczeństwa: Prefetch na hover w liście; zachowanie scrolla listy; 404 stan „Nie znaleziono”; 401→/login.

- Nazwa widoku: Strona 404 / stany błędów
  - Ścieżka widoku: „*” (nieznane trasy) oraz kontekstowe panele błędów w widokach
  - Główny cel: Czytelne komunikaty i opcje powrotu/ponowienia.
  - Kluczowe informacje do wyświetlenia: 404 nie znaleziono; 400 walidacje; 413 komunikat o limitach; 500/503 awarie AI.
  - Kluczowe komponenty widoku: `EmptyState`, `Alert`, `Button` (Powrót/Ponów), `Link` do właściwych sekcji.
  - UX, dostępność i względy bezpieczeństwa: Komunikaty precyzyjne, zrozumiałe i dostępne; unikanie ujawniania szczegółów technicznych; ochrona przed nadużyciami (rate‑limit komunikowane jako 429 z `retry_after`).

## 3. Mapa podróży użytkownika

- Pierwsza sesja (główny przepływ):
  1) Wejście → automatyczne logowanie zdarzenia `session_start` (`POST /api/events`).
  2) Brak sesji → `/login` → logowanie (sukces).
  3) Sprawdzenie profilu: jeśli brak, redirect do `/profile` → wypełnienie i zapis (`POST /api/profile`).
  4) Przejście do `/app` → lewy panel: pusta lista (CTA do generacji), prawy panel: zakładka „Generator”.
  5) Użytkownik wpisuje prompt (licznik znaków) → `POST /api/recipes/generate` → 1× retry przy błędzie.
  6) Walidacja JSON (`schema_v1`). Przy błędach blokada zapisu i panel naruszeń.
  7) Auto‑przełączenie na „Podgląd (Szkic)” → jeśli trafienie „Unikaj”, `Save` nieaktywny z tooltipem i linkiem do `/profile`.
  8) Zapis przepisu (`POST /api/recipes`) → toast sukcesu → invalidacja `recipes:list`.
  9) Lista pokazuje nowy element; klik w kartę → podświetlenie + nawigacja do `/app/recipes/:id`, scroll listy zachowany.
  10) W szczegółach klik tagu → dodanie filtra w lewym panelu → lista aktualizuje się bez zmiany podglądu.
  11) Wyszukiwanie: wpis z debounce (300–500 ms), filtry OR po tagach, sort „ostatnio dodane”, paginacja przyciskiem „Pokaż więcej”.
  12) Usuwanie: `DELETE /api/recipes/:id` → potwierdzenie, optymistyczne usunięcie, invalidacja listy.

- Przypadki alternatywne i błędy:
  - 401 w dowolnym miejscu → redirect do `/login` (zachowanie intencji powrotu).
  - 413 podczas generacji → komunikat o limitach i wskazanie maksów; przycisk ponów aktywny.
  - 404 dla nieistniejącego `:id` → ekran „Nie znaleziono” z powrotem do `/app`.
  - Awaria AI (500/503) → bannery/alerty, umożliwienie ponowienia 1×, jasny komunikat.

## 4. Układ i struktura nawigacji

- Trasy najwyższego poziomu:
  - `/login` (logowanie/rejestracja)
  - `/profile` (edycja preferencji; pierwsze uruchomienie po logowaniu bez profilu)
  - `/app` (layout z lewym panelem i prawym obszarem roboczym)
  - `/app/generator` (alias zakładki „Generator” w prawym panelu)
  - `/app/recipes/:id` (szczegóły przepisu w prawym panelu, lista po lewej)

- Zasady nawigacji i straże:
  - Dostęp do `/app*` i `/profile` wymaga zalogowania (401→`/login`).
  - Po zalogowaniu: jeśli brak profilu → redirect do `/profile`, inaczej → `/app`.
  - Lewy panel utrzymuje stan filtrów/sortowania w query string; prawy panel przełącza zakładki bez resetu listy.

- Desktop vs mobile:
  - Desktop: grid 2‑kolumnowy, zakładki w prawym panelu; lista stale widoczna.
  - Mobile: pełnoekranowe trasy dla listy, generatora i podglądu; przeniesienie zakładek do top tabs lub routingu; stan listy zachowany między trasami.

- Wydajność i prefetch:
  - Prefetch szczegółów `recipe:id` na hover/focus w liście.
  - Paginacja kursorem z przyciskiem „Pokaż więcej”; cache umiarkowany (staleTime/cacheTime dobrane eksperymentalnie).

## 5. Kluczowe komponenty

- Nawigacja i shell
  - `AppLayout` (grid, lewy panel, prawy panel), `Header` (logo, przełącznik dark mode, menu użytkownika), `Tabs` (Generator/Podgląd).

- Lewy panel (lista)
  - `SearchBar` (z licznikiem i limitami, debounce), `TagFilterChips` (OR), `SortSelect` (domyślnie „ostatnio dodane”), `RecipeList` (karty: tytuł, tagi, timestamp), `PaginationLoadMore`, `EmptyState`, `ErrorPanel`.

- Generator i szkic
  - `TextareaWithCounter` (max długość promptu), `GenerateButton` (stany: generowanie/ponawianie 1/1), `Alert` (413/500/503), `ValidationPanel` (naruszenia `schema_v1`), `RetryIndicator`.

- Podgląd i szczegóły przepisu
  - `RecipePreview` (render JSON→MD/HTML, typografia prose), `Badge/Chips` (tagi, klik dodaje filtr), `SaveButton` (disabled przy „Unikaj” + tooltip + link „Edytuj profil”), `RestoreDraftButton`, `DeleteButton` + `AlertDialog`, `Skeleton/Spinner`.

- Globalne UX i dostępność
  - `Toaster` (informacje o zapisach/usunięciach/błędach), `Tooltip`, `Alert`, `ErrorBoundary`, `Spinner/Skeleton`, wskaźniki focusu, kontrast WCAG AA, dark mode (auto z `prefers-color-scheme` + przełącznik, stan w `localStorage`).

- Zdarzenia i telemetria
  - `session_start` wysyłane przez klienta (`POST /api/events`), pozostałe zdarzenia logowane serwerowo; brak PII w payloadach; spójne ID sesji.

