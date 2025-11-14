# Plan implementacji widoku Profilu preferencji

## 1. Przegląd
Widok pozwala użytkownikowi utworzyć lub edytować profil preferencji żywieniowych, na który składają się: `dietType?`, `dislikedIngredients[]`, `preferredCuisines[]`. Profil służy do personalizacji generowanych przepisów oraz do blokady zapisu „Unikaj” (recipes z nielubianymi składnikami nie mogą zostać zapisane). Zapisy profilu logują zdarzenie `profile_edited`. Widok jest dostępny wyłącznie dla zalogowanych użytkowników (RLS po stronie bazy wymusza separację danych per `user_id`).

## 2. Routing widoku
- Ścieżka: `/profile`
- Dostęp: tylko zalogowani (401 → redirect do `/login`).
- Nawigacja po logowaniu: jeśli brak profilu → `/profile`, w przeciwnym wypadku → `/app` (zgodnie z UI planem).
- SEO/SSR: strona klientowa (React island w Astro). Bez prerenderingu prywatnych danych.

## 3. Struktura komponentów
- `ProfilePage` (Astro, wrapper strony)
- `ProfileView` (React, wyspa; orkiestruje pobranie i zapis)
- `ProfileForm` (React, formularz kontrolowany)
- `DietTypeSelect` (select z enumem DietType, z opcją „brak”/wyczyść)
- `TagsInput` (x2: dla `dislikedIngredients`, `preferredCuisines` — dodawanie/usuwanie chipów)
- `SaveButton` (z obsługą stanu zapisu, disabled wg walidacji)
- `Alert`/`ErrorPanel` (błędy walidacji i serwera)
- `Toaster` (komunikaty sukcesu/błędu)
- `Skeleton/Spinner` (stany ładowania)

Hierarchia (drzewo komponentów — uproszczone):
- `ProfilePage`
  - `ProfileView`
    - `ProfileForm`
      - `DietTypeSelect`
      - `TagsInput[name="dislikedIngredients"]`
      - `TagsInput[name="preferredCuisines"]`
      - `SaveButton`
    - `Alert`/`ErrorPanel`
    - `Toaster`

## 4. Szczegóły komponentów
### ProfilePage (Astro)
- Opis: Strona Astro odpowiadająca trasie `/profile`. Renderuje nagłówek/layout i montuje `ProfileView` (React) jako wyspę (`client:load`).
- Główne elementy: kontener, tytuł, opis, mount React.
- Interakcje: brak (delegowane do React).
- Walidacja: n/d.
- Typy: n/d.
- Propsy: n/d.

### ProfileView (React)
- Opis: Główny komponent widoku. Pobiera profil (`GET /api/profile`), obsługuje 401/404, utrzymuje tryb `create|update`, steruje zapisami (POST/PUT), invaliduje cache `['profile']` i wyświetla toasty.
- Główne elementy: nagłówek, `ProfileForm`, `Alert`/`ErrorPanel`, `Skeleton/Spinner`.
- Interakcje: inicjalne pobranie; submit formularza; obsługa błędów; redirect na 401.
- Walidacja: na poziomie `ProfileForm` + mapowanie 400 z API (details → pola).
- Typy: `ProfileDTO`, `ApiError`, lokalny `ProfileOperation = 'create' | 'update'`.
- Propsy: brak.

### ProfileForm (React)
- Opis: Formularz kontrolowany z trzema polami: `dietType?`, `dislikedIngredients[]`, `preferredCuisines[]`. Zapewnia walidację po stronie klienta zgodną z backendem.
- Główne elementy: `DietTypeSelect`, dwa `TagsInput`, `SaveButton`, helpery i podpowiedzi.
- Interakcje: onChange pól; dodawanie/usuwanie pozycji chipów; submit; reset do wartości z serwera; czyszczenie pola `dietType` (ustawia `null`).
- Walidacja: 
  - Wymaganie PRD: co najmniej jedno pole musi być wypełnione (dla create i update).
  - Dla tablic: każdy item 1–50 znaków po `trim()`; maks. 100 elementów; deduplikacja; lowercase.
  - `dietType` musi być jednym z enumów lub `null` (clear).
- Typy: `ProfileFormValues` (patrz sekcja Typy).
- Propsy: 
  - `initialValues?: ProfileFormValues`
  - `mode: 'create' | 'update'`
  - `onSubmit(values: ProfileFormValues): Promise<void>`

### DietTypeSelect
- Opis: Select z listą wartości `DietType` + opcja „Brak” (ustawia `null`).
- Główne elementy: `Label`, `Select`, `HelperText`.
- Interakcje: wybór, wyczyszczenie.
- Walidacja: jeśli ustawione, musi być poprawną wartością `DietType`.
- Typy: używa `DietType`.
- Propsy: `value: DietType | null`, `onChange: (v: DietType | null) => void`.

### TagsInput
- Opis: Pole do edycji list stringów z chipami i autouzupełnianiem (prosty input + Enter/Comma dodaje, X usuwa).
- Główne elementy: `Input`, lista chipów, helper/limit.
- Interakcje: dodaj, usuń, klawiatura (Enter, Backspace na pustym usuwa ostatni).
- Walidacja: każdy element 1–50 znaków po `trim()`; normalizacja: `toLowerCase()`, `trim()`, deduplikacja; max 100; błędy inline.
- Typy: `string[]`.
- Propsy: `value: string[]`, `onChange: (v: string[]) => void`, `name: 'dislikedIngredients' | 'preferredCuisines'`.

### SaveButton
- Opis: Przycisk zapisu ze stanem ładowania i `disabled` wg walidacji i braku zmian.
- Główne elementy: `Button`.
- Interakcje: klik/submit; focus management po błędach.
- Walidacja: disabled jeśli formularz nie spełnia wymagań lub brak zmian vs `initialValues`.
- Propsy: `loading: boolean`, `disabled: boolean`.

### Alert / ErrorPanel
- Opis: Wyświetla błędy walidacji i komunikaty z API (400/409/500). 401 skutkuje redirectem w `ProfileView`.
- Główne elementy: `Alert`/`Callout`/`Toaster`.
- Interakcje: zamknięcie/dismiss.
- Typy: `ApiError` (mapowanie `details` → pola), teksty i18n.
- Propsy: `error?: ApiError | null`.

## 5. Typy
- Importowane z `src/types.ts`:
  - `DietType`
  - `ProfileDTO`
  - `CreateProfileCommand`
  - `UpdateProfileCommand`
  - `ApiError`

- Nowe typy (ViewModel i pomocnicze):
  - `type ProfileOperation = 'create' | 'update'`
  - `interface ProfileFormValues {`
    - `dietType: DietType | null`
    - `dislikedIngredients: string[]`
    - `preferredCuisines: string[]`
    - `}`
  - Mapowanie ViewModel ↔ DTO/Commands:
    - z `ProfileDTO` → `ProfileFormValues`: `diet_type ?? null`, reszta bez zmian.
    - `create`: `CreateProfileCommand = { diet_type?: DietType, disliked_ingredients?: string[], preferred_cuisines?: string[] }` (pomiń pola puste).
    - `update`: `UpdateProfileCommand = { diet_type?: DietType | null, disliked_ingredients?: string[], preferred_cuisines?: string[] }` (użyj `null` aby wyczyścić dietę; pomiń niezmienione pola).

## 6. Zarządzanie stanem
- Biblioteka: TanStack Query (dodać `@tanstack/react-query`). Globalny `QueryClientProvider` w layoucie lub lokalnie w `ProfileView` jeśli reszta UI nie jest gotowa.
- Klucze i cache:
  - `['profile']` — `GET /api/profile`
  - invalidacja po sukcesie POST/PUT.
- Stany lokalne:
  - Formularz (`ProfileFormValues`), dirty/pristine, błędy per pole.
  - UI: loading, error, success toast.
- i18n: teksty etykiet, helperów, komunikatów w `t()` (Phase 2 z UI planu). Na MVP można użyć stałych PL.

## 7. Integracja API
- Autoryzacja: `Authorization: Bearer {token}`; token z `supabaseClient.auth.getSession()` po stronie klienta.

- `GET /api/profile`
  - 200 → `ProfileDTO` (ustaw `initialValues`, tryb `update`).
  - 404 → brak profilu (ustaw `initialValues` puste, tryb `create`).
  - 401 → redirect do `/login`.

- `POST /api/profile` (create)
  - Body: `CreateProfileCommand` (pola opcjonalne; UI egzekwuje ≥1 pole wg PRD).
  - 201 → sukces; toast „Profil utworzony”; invaliduj `['profile']`.
  - 400 → walidacja (mapuj `details` → pola).
  - 409 → profil istnieje (przełącz na `update` i spróbuj PUT lub wyświetl komunikat).
  - 401/500 → komunikat + ewentualny redirect (401).

- `PUT /api/profile` (update)
  - Body: `UpdateProfileCommand` (≥1 pole wymagane przez API; UI to egzekwuje). `diet_type: null` czyści wartość.
  - 200 → sukces; toast „Profil zapisany”; invaliduj `['profile']`. Backend loguje `profile_edited`.
  - 400/404/401/500 → obsługa jak wyżej.

Nagłówki wspólne: `Content-Type: application/json`, `Authorization`.

## 8. Interakcje użytkownika
- Edycja pól formularza; dodawanie/usuwanie tagów; wybór/wyczyszczenie diety.
- Klik „Zapisz”:
  - `create`: wyślij POST; po 201 pokaż toast, zablokuj przycisk na czas requestu.
  - `update`: wyślij PUT; po 200 pokaż toast; backend loguje `profile_edited`.
- Błędy walidacji: focus na pierwszym błędnym polu, komunikaty inline oraz toast zbiorczy.
- 401 z API: natychmiastowy redirect do `/login`.

## 9. Warunki i walidacja
- Wymagania PRD: co najmniej jedno z pól musi być wypełnione (dotyczy create i update w UI).
- Spójność z backendem (Zod):
  - `dietType` ∈ `DietType` lub `null` podczas aktualizacji (clear).
  - Tablice: element 1–50 znaków (po `trim()`), max 100 pozycji; normalizacja: lowercase + deduplikacja.
- Przycisk „Zapisz” aktywny gdy: formularz jest poprawny i zawiera zmiany względem `initialValues`.

## 10. Obsługa błędów
- 401 Unauthorized: przekierowanie do `/login`.
- 404 Not Found (GET): brak profilu — pokaż stan „Utwórz profil” (tryb `create`).
- 400 Bad Request: mapuj `details` do pól; komunikat zbiorczy w `Alert`.
- 409 Conflict (POST): profil istnieje — zaproponuj przejście do edycji (PUT).
- 500 Internal Server Error: komunikat o błędzie i zachęta do ponowienia.
- Sieć/timeout: toast błędu, ochrona przed wielokrotnym submittem.

## 11. Kroki implementacji
1) Routing i strona:
   - Dodaj `src/pages/profile.astro` (layout + mount `ProfileView` jako wyspa React `client:load`).
   - Upewnij się, że trasa jest chroniona po stronie klienta (redirect na 401 z API).

2) Zależności i kontekst danych:
   - Zainstaluj `@tanstack/react-query` i skonfiguruj `QueryClientProvider` (globalnie w layoucie lub lokalnie w `ProfileView`).
   - Skonfiguruj `Toaster` globalnie (jeśli brak) lub lokalnie dla widoku.

3) Typy i utilsy:
   - Dodaj typ `ProfileFormValues` (ViewModel) i funkcje mapujące do/z `CreateProfileCommand`/`UpdateProfileCommand`.
   - Dodaj normalizację tablic (trim, lowercase, dedupe) — spójnie z backendem.

4) Integracja API:
   - `useProfileQuery` (GET `/api/profile`): zwraca `ProfileDTO | null` (null dla 404), obsługuje 401.
   - `useCreateProfileMutation` (POST) i `useUpdateProfileMutation` (PUT): zwracają wynik i invalidują `['profile']` po sukcesie.
   - Pozyskanie tokenu: `const { data } = await supabaseClient.auth.getSession(); const token = data.session?.access_token`.

5) Formularz i komponenty UI:
   - Zbuduj `ProfileForm` z polami: `DietTypeSelect`, `TagsInput[x2]`, `SaveButton`.
   - Walidacja klientowa (Zod lub ręczna) zgodna z backendem; focus na pierwszym błędnym polu.
   - Stany disabled/loading na przyciskach.

6) Logika zapisu i UX:
   - W `ProfileView` zdecyduj `mode` (`create|update`) na bazie wyniku GET.
   - Submit: w trybie `create` → POST (≥1 pole), w trybie `update` → PUT (≥1 pole lub rzeczywista zmiana).
   - Toastery sukcesu/błędu; po sukcesie pozostaw na stronie.

7) A11y i i18n:
   - Etykiety, `aria-*`, kolejność focusu; komunikaty `aria-live` dla toastów.
   - Przygotuj teksty w PL; docelowo podłącz `t()` (Phase 2 i18n z UI planu).

8) Testy ręczne (MVP):
   - Scenariusze: brak profilu→create, istniejący→update, 401→redirect, 400 mapowanie błędów, 409 po POST, czyszczenie `dietType` przez `null`.
   - Sprawdź invalidację cache i ponowny render.

9) Telemetria:
   - Brak wywołań po stronie klienta — `profile_edited` loguje backend na PUT (best‑effort).

—

Realizacja jest w pełni zgodna z PRD (US‑002), opisem endpointu `/api/profile` oraz przyjętym stackiem (Astro + React + TypeScript + Tailwind + shadcn/ui + Supabase). Plan uwzględnia strategię cache/inwalidacji, zasady A11y, i ścieżki błędów (401/404/400/409/500) oraz docelową integrację i18n.

