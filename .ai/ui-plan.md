# UI Plan: SavorAI (MVP)

## 1. Przegląd i Zasady
- Wzorzec: Master–Detail (desktop: 2 kolumny; mobile: zakładki/routing).
- Tech: Astro 5 + React 19 + TypeScript 5 + Tailwind 4 + shadcn/ui.
- Backend: Supabase (Auth, Postgres, RLS). API po stronie Astro (`/src/pages/api`).
- Zarządzanie stanem:
  - Globalny: sesja/auth (React Context lub Supabase SDK w komponencie AppShell).
  - Serwerowy: TanStack Query (cache, invalidacje, retry = 0 globalnie; 1× ręczny retry dla generacji AI).
  - Lokalny szkic: pamięć + `sessionStorage` (źródło prawdy: `sessionStorage`).
- A11y i UI: WCAG AA, ARIA, focus outlines, skeletony i toasty, dark mode (auto + przełącznik).
- i18n: dwa języki (PL/EN); słowniki `src/i18n/pl.json` i `src/i18n/en.json`; lekki provider i hook `useI18n()`; domyślna detekcja `navigator.language` z przełącznikiem w `Header` i zapisem w `localStorage` (fallback EN); brak lokalizacji treści przepisów w MVP.

## 2. Widoki i Nawigacja
- Top‑level trasy (ścieżki stron widoczne dla użytkownika):
  - `/login` — logowanie/rejestracja (Supabase Auth). Po zalogowaniu: jeśli brak profilu → `/profile`, inaczej → `/app`.
  - `/profile` — edycja profilu (dietType?, dislikedIngredients[], preferredCuisines[]).
  - `/app` — layout Master–Detail: lewy panel (lista/filtry), prawy panel (Generator/Podgląd).
  - Szczegóły w prawym panelu: `/app/recipes/:id` (deep link; lewy panel zachowuje stan listy).
- Desktop: stała lista po lewej + zakładki (Generator/Podgląd) po prawej.
- Mobile: jednokolumnowo; przełączanie między „Kolekcja” i „Generator” (tabs/routing). Zachowanie stanu listy między trasami.
- Auth guards: dostęp do `/app*` i `/profile` wymaga sesji (401 → `/login`).
- Header: przełącznik języka (PL/EN) z zapisem w `localStorage`; domyślnie wg `navigator.language`.

### 1. Widok Logowania / Rejestracji
- Ścieżka: `/login`
- Cel: Uwierzytelnienie użytkownika (Supabase Auth) i ustanowienie sesji.
- Kluczowe informacje: formularz e-mail/hasło, komunikaty błędów, link do rejestracji, stan ładowania.
- Kluczowe komponenty: `AuthForm`, `Button`, `Input`, `Alert`, `Toaster`.
- UX/A11y/Bezpieczeństwo: Walidacja klient/serwer, focus management; po zalogowaniu redirect do `/app` lub (gdy brak profilu) do `/profile`; 401 → `/login`; token zarządzany przez SDK Supabase.

### 2. Widok Profilu preferencji
- Ścieżka: `/profile`
- Cel: Utworzenie/edycja profilu (dietType?, dislikedIngredients[], preferredCuisines[]) dla personalizacji i blokady „Unikaj”.
- Kluczowe informacje: bieżące wartości profilu, podpowiedzi pól, status zapisu, wpływ na generację.
- Kluczowe komponenty: `Form` (select, tags/combobox, chips), `Button Save`, `Alert`, `Toaster`.
- UX/A11y/Bezpieczeństwo: Po zapisie log `profile_edited`; invalidacja `['profile']`; focus po błędach; 401 → `/login`; dane chronione RLS.

### 3. Widok Aplikacja (shell z lewym panelem)
- Ścieżka: `/app`
- Cel: Stały lewy panel (wyszukiwanie, filtry, sort, lista) oraz prawy panel (Generator/Podgląd) w jednym layoucie.
- Kluczowe informacje: parametry wyszukiwania (URL), liczba wyników, lista kart przepisów, stany puste/błędów, aktywna zakładka.
- Kluczowe komponenty: `AppLayout` (grid 2-kolumnowy), `SearchBar`, `TagFilterChips` (OR), `SortSelect`, `RecipeList`, `PaginationLoadMore`, `Tabs` (Generator/Podgląd).
- UX/A11y/Bezpieczeństwo: Zachowanie scrolla listy; parametry listy w URL; deep-link `/app/recipes/:id` renderuje w prawym panelu; auth guards dla `/app*`.

### 4. Widok Generator przepisu (zakładka)
- Ścieżka: zakładka w `/app` (desktop) / trasa `/app/generator` (mobile)
- Cel: Wysłanie promptu do AI, otrzymanie przepisu w `schema_v1`, utworzenie szkicu.
- Kluczowe informacje: licznik i limit promptu, stany generowania/ponawiania (1/1), komunikaty 400/413/500/503, walidacja wyniku.
- Kluczowe komponenty: `TextareaWithCounter`, `GenerateButton`, `RetryIndicator`, `Alert` (limity/awarie), `ValidationPanel` (Zod), `Tabs`.
- UX/A11y/Bezpieczeństwo: Auto-przełączenie na „Podgląd (Szkic)” po sukcesie; 1× retry; blokada „Generuj” przy naruszeniach; logi `ai_prompt_sent`/`ai_recipe_generated`; 401 → `/login`.

### 5. Widok Podgląd przepisu (Szkic/Zapisany)
- Ścieżka: prawa kolumna w `/app` (po generacji) oraz `/app/recipes/:id` (szczegóły zapisanego)
- Cel: Render treści przepisu, weryfikacja „Unikaj”, akcje: Zapisz/Usuń/Przywróć szkic.
- Kluczowe informacje: tytuł, tagi, czasy, składniki i instrukcje, atrybuty dietetyczne, ostrzeżenia „Unikaj”.
- Kluczowe komponenty: `RecipePreview` (typografia prose), `SaveButton` (disabled z tooltipem przy trafieniu „Unikaj”), `DeleteButton` + `AlertDialog`, `RestoreDraftButton`, `Badge/Chips` dla tagów.
- UX/A11y/Bezpieczeństwo: Klik tagu dodaje filtr w lewym panelu; `Save` zapisuje JSON do `/api/recipes`; usuwanie z potwierdzeniem i invalidacją listy; RLS chroni dostęp.

## 3. Architektura Stanu i Cache
- TanStack Query — klucze:
  - `profile`
  - `recipes:list(params)` — parametry: `search?: string`, `tags?: string` (csv), `sort?: 'recent'|'oldest'`, `limit?: number`, `offset?: number` (MVP: offset/limit)
  - `recipe:id`
- Invalidacje:
  - Po zapisie profilu → `invalidate(['profile'])`.
  - Po zapisie/usunięciu przepisu → `invalidate(['recipes:list'])` i ewentualnie `['recipe', id]`.
- Persistencja szkicu:
  - Klucz `recipe_draft_v1` w `sessionStorage` (nadpisywany przy każdej nowej generacji, opcja „Przywróć szkic”).
- Retry i limity:
  - Globalnie `retry: 0`; dla generacji AI ręczny 1× retry z UI.

## 4. Integracja API i Parametry URL
- Endpointy:
  - `POST /api/recipes/generate` — generacja przepisu (schema_v1).
  - `POST /api/recipes` — zapis wygenerowanego przepisu (tags opcjonalne).
  - `GET /api/recipes?search=&tags=&sort=&limit=&offset=` — lista (MVP).
  - `GET /api/recipes/:id` — szczegóły przepisu.
  - `DELETE /api/recipes/:id` — usunięcie przepisu.
  - `GET/POST /api/profile` — odczyt/zapis profilu.
  - `POST /api/events` — `session_start` (klient); pozostałe logowane serwerowo.
- Query params (deep linking): `search`, `tags` (csv, OR), `sort`, `limit`, `offset`.

## 5. Obsługa Błędów i UX
- Mapowanie statusów:
  - `401` → redirect do `/login` (zachowanie intencji powrotu).
  - `404` → pusty stan „Nie znaleziono”, link powrotu.
  - `413` → komunikat o limitach (prompt/odpowiedź), blokada „Generuj”.
  - `500/503` → alert + możliwość ponowienia (generacja 1× retry).
- Komunikacja:
  - Toastery (zapis/usunięcie/sukcesy), Alerty (błędy/limity), Skeleton/Spinner (ładowanie).
  - Walidacje inline w formularzach; tooltip przy zablokowanym „Zapisz” (trafienie „Unikaj”).
  - Tłumaczenia: wszystkie komunikaty, etykiety i CTA pobierane z warstwy i18n; fallback do EN.

## 6. Dostępność i Motyw
- WCAG AA: kontrasty, focus management, semantyczne nagłówki/listy, role ARIA.
- Klawiatura: pełna nawigacja, widoczny focus, sekwencja tab.
- Dark mode: auto z `prefers-color-scheme` + przełącznik (stan w `localStorage`).
- i18n+A11y: atrybut `lang` na `<html>` ustawiany zgodnie z wyborem języka; teksty alternatywne/aria-labels tłumaczone; komunikaty statusu (`aria-live`) zgodne z językiem.

## 7. i18n i Lokalizacja
- Zakres: interfejs w dwóch językach — polskim (PL) i angielskim (EN); dotyczy stałych tekstów UI (etykiety, przyciski, komunikaty, empty states, toasty, błędy). Treść przepisów nie jest lokalizowana w MVP.
- Strategia: słowniki `src/i18n/pl.json` i `src/i18n/en.json`; lekki `I18nProvider` i hook `useI18n()` dla React; funkcja `t(key, params?)` do pobierania tłumaczeń.
- Detekcja/przełączanie: domyślnie na podstawie `navigator.language` (mapowane do `pl`/`en`), ręczny przełącznik języka w `Header`; wybór zapisywany w `localStorage` z bezpiecznym fallbackiem do `en`.
- A11y: ustawiaj `lang` na elemencie `<html>` zgodnie z aktualnym językiem; aria-labels i komunikaty statusu (`aria-live`) tłumaczone.
- Komponenty: `LanguageSwitch` (w `Header`), `I18nProvider`, pliki słowników w `src/i18n`.
- Integracja w widokach: wszystkie komunikaty/etykiety/CTA w `/login`, `/profile`, `/app` (lista, generator, podgląd) czerpią teksty przez `t()`; toasty/alerty z warstwy i18n; błędy (401/404/413/500) mapowane do tłumaczeń.
- Fazy:
  - Phase 1: interfejs PL (teksty stałe); przygotuj `pl.json` jako źródło tłumaczeń.
  - Phase 2: dodaj `en.json`, `I18nProvider` + `useI18n()`, `LanguageSwitch` w `Header`, detekcję `navigator.language`, zapis wyboru w `localStorage`, podłącz komponenty do `t()`.
- Kryteria (po Phase 2): UI przełącza się między PL/EN; wybór języka zapamiętywany; `<html lang>` odzwierciedla język; wszystkie stałe teksty są tłumaczone; treść przepisów pozostaje bez lokalizacji.

## 8. Wydajność i Prostota MVP
- Cache umiarkowany (staleTime/cacheTime dobrane konserwatywnie).
- Odłożone: prefetch na hover, optimistic updates, cursor pagination, złożone scroll preservation, animacje.
- Skeletony minimalizują CLS; komponenty dzielone per widok.

## 9. Telemetria i Zdarzenia
- Klient: `session_start` na starcie sesji (po uzyskaniu sesji, 1×).
- Serwer: `ai_prompt_sent`, `ai_recipe_generated`, `recipe_saved`, `profile_edited` (zgodnie z logiką backendu).
- Brak PII w payloadach; spójny `request_id` w logach.

## 10. Inwentarz Komponentów (shadcn/ui + własne)
- Shell/Nawigacja: `AppLayout`, `Header` (logo, language switch, dark-mode switch, user menu), `Tabs`.
- Lista (lewy panel): `SearchBar`, `TagFilterChips` (OR), `SortSelect`, `RecipeList` (Card + meta), `PaginationLoadMore` (MVP: offset), `EmptyState`, `ErrorPanel`.
- Generator (prawy panel): `TextareaWithCounter`, `GenerateButton`, `RetryIndicator`, `ValidationPanel`, `Alert` (413/500/503).
- Podgląd/Szczegóły: `RecipePreview` (JSON→typografia prose/HTML), `Badge/Chips` (tagi → filtr), `SaveButton` (disabled przy „Unikaj” + tooltip + link do `/profile`), `RestoreDraftButton`, `DeleteButton` + `AlertDialog`, `Skeleton/Spinner`.
- Globalne: `Toaster`, `Tooltip`, `Alert`, `ErrorBoundary`, `LanguageSwitch`.

## 11. Etapy Wdrożenia
Phase 1 — Core MVP (2–3 tygodnie):
- Auth flow (`/login`), redirect do `/profile` po pierwszym logowaniu.
- Formularz profilu (diet, disliked, cuisines) z zapisem.
- Generator: textarea + „Generuj” + podstawowe błędy/limity.
- Podgląd przepisu: bazowe renderowanie JSON.
- Zapis przepisu: `POST /api/recipes` + toast sukcesu.
- Prosta lista przepisów (bez filtrów), ładowanie i empty states.
- Podstawowa obsługa błędów (toasty/alerty), skeleton/spinner.
- Interfejs w języku polskim (teksty stałe; przygotuj plik `pl.json` jako źródło tłumaczeń na później).

Phase 2 — Polish (1–2 tygodnie):
- Persistencja szkicu (`sessionStorage`) + „Przywróć szkic”.
- Search + tag filters (OR) + sort w liście.
- Usuwanie przepisu + potwierdzenie.
- Zaawansowane mapowanie błędów (401, 404, 413) i 1× retry dla generacji AI.
- Empty states z CTA.
- Query params w URL dla listy (`search`, `tags`, `sort`, `limit`, `offset`).
- i18n: słowniki `pl.json`/`en.json`, `I18nProvider` + `useI18n()`, `LanguageSwitch` w `Header`, detekcję `navigator.language`, pamięć w `localStorage`, aktualizacja komponentów do `t()`.

## 12. Kryteria Akceptacji (MVP)
- Użytkownik może: zalogować się, uzupełnić profil, wygenerować 1 przepis, zapisać go, zobaczyć go na liście, wyświetlić szczegóły.
- Błędy 401/404/413/500 są komunikowane zgodnie z planem; 401 prowadzi do `/login`.
- UI działa na desktopie i mobile; dark mode działa ręcznie i automatycznie.
- Szkic przepisu jest pamiętany między przeładowaniami (po wdrożeniu Phase 2).
- Po Phase 2: UI dostępny w PL i EN; przełącznik języka działa i zapamiętuje wybór; `<html lang>` odzwierciedla aktualny język; komunikaty/etykiety/CTA są tłumaczone; treść przepisów nie jest lokalizowana.

## 13. Out-of-Scope na MVP (do rozważenia później)
- Prefetch na hover/focus, optimistic updates, cursor pagination.
- Zaawansowane scroll preservation i animacje.
- Zaawansowane raportowanie/telemetria i eksperymenty UX.