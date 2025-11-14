# Specyfikacja modułu autentykacji (Auth) — SavorAI (MVP)

Źródła: PRD (.ai/prd.md, US‑001), stack (.ai/tech-stack.md), istniejące API (`/src/pages/api/*`). Celem jest dodanie rejestracji, logowania, wylogowania i odzyskiwania hasła z wykorzystaniem Supabase Auth, bez naruszania aktualnych kontraktów API i zachowań aplikacji.

## 1. Architektura interfejsu użytkownika

1.1. Trasy i nawigacja
- `GET /login` — Strona logowania/rejestracji (publiczna). Po zalogowaniu: redirect do `/app` (zgodnie z PRD: pierwszy widok to pusty stan listy). Jeśli profil nie istnieje, w `/app` wyświetl baner/CTA do uzupełnienia profilu (link do `/profile`) zamiast przekierowywać.
- `GET /auth/forgot` — Strona „Zapomniałem hasła” (publiczna); wysyła link resetujący hasło.
- `GET /auth/reset` — Strona ustawienia nowego hasła po wejściu z linku Supabase (publiczna; stan „PASSWORD_RECOVERY”).
- `GET /profile` i `GET /app*` — Strony chronione na poziomie UI (guard klientowy). Brak SSR‑gatingu — autoryzacja egzekwowana przez API (Bearer token → 401 → redirect do `/login`).

1.2. Strony Astro i wyspy React
- `src/pages/login.astro` (Astro): Layout, tytuł, opis; montuje `AuthView` (React island `client:load`).
- `src/pages/auth/forgot.astro` (Astro): montuje `ForgotPasswordView`.
- `src/pages/auth/reset.astro` (Astro): montuje `ResetPasswordView`.
- Pozostałe strony (np. `/profile`, `/app`) zachowują obecną strukturę; guardy w React (klient): jeśli brak sesji → redirect do `/login`.

1.3. Komponenty i odpowiedzialności (React)
- `AuthView`
  - Zakładki: „Zaloguj się” / „Zarejestruj się” (lub przełącznik linkowy).
  - Formularze: `LoginForm`, `RegisterForm` (kontrolowane; walidacja klientowa).
  - Po sukcesie: pobierz `session` z Supabase, wywołaj `POST /api/events` z typem `session_start`, przejdź do `/app` i równolegle sprawdź profil (`GET /api/profile`) — jeśli 404, wyświetl CTA w `/app`.
- `LoginForm`
  - Pola: `email`, `password`.
  - Walidacja: email (RFC‑lite), hasło min. 8 znaków.
  - Błędy: mapowane z Supabase (invalid_credentials, rate_limit) + ogólne.
- `RegisterForm`
  - Pola: `email`, `password`.
  - Walidacja: email poprawny, hasło min. 8 (komunikaty o sile hasła opcjonalne w MVP).
  - Flow: `supabase.auth.signUp`; e‑mail weryfikacyjny jeśli skonfigurowany (MVP: dopuszczalne logowanie bez weryfikacji, zależnie od ustawień projektu Supabase).
- `ForgotPasswordView`
  - Pole: `email`.
  - Akcja: `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/reset` })`.
  - Komunikaty: sukces („Sprawdź skrzynkę”), błędy (brak konta — nie ujawniamy, komunikat generyczny).
- `ResetPasswordView`
  - Detekcja: `supabase.auth.onAuthStateChange` → event `PASSWORD_RECOVERY` lub obecność `access_token` w URL; pokaż `NewPasswordForm`.
  - `NewPasswordForm`: pole `password` (+ powtórzenie opcjonalnie), akcja `supabase.auth.updateUser({ password })` → sukces: redirect do `/login` z toastem.
- `Header` (rozszerzenie)
  - Gdy zalogowany: menu użytkownika (email/skrót), „Wyloguj” (wywołuje `supabase.auth.signOut()` → redirect do `/login`).
  - Gdy niezalogowany: link „Zaloguj” do `/login`.
- `AuthGuard` (hook + komponent)
  - `useAuth()` zwraca `session`, `user`, `loading`.
  - `RequireAuth` (HOC): jeśli `!session && !loading` → `navigate('/login')`.

1.4. Walidacja i komunikaty błędów
- Klientowa (natychmiastowa):
  - Email: format (RFC‑lite), trim, lowercase dla porównania, max 254 znaki.
  - Hasło: min. 8 znaków; max 128; brak whitespace‑only.
- Serwerowa (Supabase/HTTP):
  - `invalid_credentials`, `user_not_found`, `email_already_registered` → mapowanie do etykiet pól.
  - Generyjne 5xx → „Spróbuj ponownie za chwilę”.
- A11y: błędy w `aria-describedby`, focus na pierwszym błędnym polu, `aria-live` dla toastów.

1.5. Scenariusze główne
- Rejestracja → (opcjonalna weryfikacja e‑mail) → sesja → event `session_start` → redirect do `/app` (pusty stan kolekcji). Jeśli brak profilu — w `/app` pokaż baner/CTA prowadzący do `/profile`.
- Logowanie → sesja → event `session_start` → redirect do `/app` → w tle sprawdzenie profilu i ewentualny CTA.
- Zapomniane hasło → e‑mail → strona `/auth/reset` → ustaw nowe hasło → redirect do `/login`.
- Wylogowanie → czyszczenie sesji (Supabase) → redirect `/login`.

## 2. Logika backendowa

2.1. Kontrakty i wywołania
- Autentykacja: korzystamy bezpośrednio z Supabase Auth przez SDK (`@supabase/supabase-js`) po stronie klienta. Brak nowych własnych endpointów auth w Astro (aby nie dublować funkcjonalności i nie łamać obecnego modelu autoryzacji Bearer na API).
- Eventy: istniejący `POST /api/events` — używany do `session_start` po uzyskaniu sesji ORAZ przy „zimnym starcie” aplikacji, gdy wykryta jest ważna sesja z localStorage (patrz 3.4 i 4.1). Wymaga nagłówka `Authorization: Bearer {access_token}`.
- Profil: istniejący `/api/profile` (GET → sprawdzenie istnienia po zalogowaniu; 404 → brak profilu — bez redirectu; w `/app` pokaż baner/CTA do uzupełnienia).

2.2. Walidacja danych wejściowych (klient → serwer)
- Formularze walidują pola po stronie klienta. Błędy z Supabase są mapowane do pól / globalnego alertu.
- Hasła nie przechodzą przez własne endpointy — używamy wyłącznie Supabase Auth SDK.

2.3. Obsługa wyjątków i błędów
- Komunikaty Supabase mapowane na:
  - `invalid_credentials` → „Nieprawidłowy e‑mail lub hasło”.
  - `over_rate_limit` → „Zbyt wiele prób, spróbuj później”.
  - Inne → komunikat generyczny.
- Dla `POST /api/events`: 401 (brak/expired token) → ignorujemy event i kontynuujemy flow (best‑effort, bez blokady UX).

2.4. SSR i konfiguracja
- `astro.config.mjs` ma `output: 'server'` (adapter Node). Nie wprowadzamy SSR‑gatingu opartego o sesję, aby nie zmieniać kontraktów. Ochrona odbywa się:
  - na poziomie API (RLS + Bearer),
  - na poziomie UI (guardy klientowe i redirecty).
- API SSR zachowuje dotychczasowy wzorzec: weryfikacja `Authorization` i `supabase.auth.getUser(token)` (jak w profilach i eventach).

## 3. System autentykacji (Supabase Auth)

3.1. Operacje i użyte metody SDK
- Rejestracja: `supabase.auth.signUp({ email, password })`.
- Logowanie: `supabase.auth.signInWithPassword({ email, password })`.
- Wylogowanie: `supabase.auth.signOut()`.
- Zapomniane hasło: `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/reset` })`.
- Ustawienie nowego hasła po linku: `supabase.auth.updateUser({ password })` (po `onAuthStateChange` z `PASSWORD_RECOVERY`).
- Sesja: `supabase.auth.getSession()`; subskrypcja: `supabase.auth.onAuthStateChange`.

3.2. Przechowywanie i użycie tokena
- Token użytkownika przechowywany przez SDK (localStorage). Do wywołań backendowych używamy wrappera `fetchWithAuth`:
  - Pobiera aktualny `access_token` z `getSession()`.
  - Dodaje `Authorization: Bearer {token}` do żądań.
  - Na 401 → „silent sign‑out” (opcjonalnie) + redirect do `/login`.

3.3. Integracja z istniejącym RLS
- Wszystkie dane (profiles, recipes, events) pozostają chronione RLS po `user_id`.
- API Astro już tworzy klienta Supabase z nagłówkiem `Authorization` użytkownika i weryfikuje go `auth.getUser(token)`.

3.4. Telemetria i zgodność z PRD
- Po udanym zalogowaniu/rejestracji klient wyśle `POST /api/events` z `type: 'session_start'` (best‑effort; brak blokowania UX przy błędzie).
- Dodatkowo: przy starcie aplikacji (zimny start), jeśli istnieje ważna sesja (auto‑login) i w bieżącej sesji przeglądarki nie wysłano jeszcze `session_start`, wyślij `POST /api/events` z `type: 'session_start'`. Dedup: flaga w `sessionStorage` (np. `session_start_logged = '1'`).

## 4. Komponenty, serwisy i kontrakty (front)

4.1. Kontekst i hooki
- `AuthProvider` + `useAuth()`
  - Stan: `{ session, user, loading }`.
  - Inicjalizacja: `getSession()` + `onAuthStateChange`.
  - Efekt uboczny: po inicjalizacji, jeśli wykryto ważną sesję i `sessionStorage.getItem('session_start_logged') !== '1'`, wyślij `POST /api/events` (`type: 'session_start'`) i ustaw flagę (best‑effort, ignoruj błędy).
- `RequireAuth`
  - Owrapowanie widoków chronionych; na brak sesji → redirect `/login`.

4.2. Formularze (DTO po stronie UI)
- `LoginFormValues`: `{ email: string; password: string }`.
- `RegisterFormValues`: `{ email: string; password: string }`.
- `ForgotPasswordFormValues`: `{ email: string }`.
- `ResetPasswordFormValues`: `{ password: string }`.

4.3. Serwisy
- `authClient` (wrap nad `supabaseClient.auth`): metody `login`, `register`, `logout`, `requestPasswordReset`, `setNewPassword`, `getSession`.
- `fetchWithAuth(input, init?)`: dodaje nagłówek `Authorization` z aktualnym tokenem; mapuje 401.

4.4. Komunikaty i i18n
- Teksty w PL (MVP), z planem podpięcia do `t()` (Phase 2 i18n). Komunikaty błędów i etykiety formularzy wyprowadzalne do słowników.

## 5. Widoki i przepływy (szczegóły)

5.1. `/login`
- Layout: karta z zakładkami: Logowanie / Rejestracja.
- Logowanie: submit → `authClient.login` → event `session_start` → redirect do `/app` → w tle `GET /api/profile` (jeśli 404, pokaż baner/CTA w `/app`).
- Rejestracja: submit → `authClient.register` → (jeśli włączona weryfikacja e‑mail: pokaż komunikat „Sprawdź pocztę”; inaczej traktuj jak login) → dalej jak wyżej.
- Błędy: inline pod polami i/toast; focus na pierwszym błędnym polu.

5.2. `/auth/forgot`
- Formularz z polem e‑mail; submit → `requestPasswordReset(email)` → toast sukcesu.
- Brak rozróżnienia, czy konto istnieje (ochrona przed enumeracją).

5.3. `/auth/reset`
- Po wejściu z linku: `onAuthStateChange` z `PASSWORD_RECOVERY` lub token w URL.
- Formularz nowego hasła; submit → `setNewPassword(password)` → toast + redirect `/login`.

5.4. Header i wylogowanie
- `Wyloguj` → `authClient.logout()` → redirect `/login` (czyści localStorage SDK).

## 6. Stany, błędy, edge‑case’y
- Brak internetu / timeout: komunikat i możliwość ponowienia akcji.
- Rate limiting Supabase: mapowanie na komunikat „spróbuj później”.
- Token wygasł podczas pracy: pierwsze 401 z API → wyloguj i redirect `/login` (spójny UX).
- Weryfikacja e‑mail (jeśli włączona): UI pokazuje stan „oczekuj na weryfikację”; możliwość ponownego wysłania linku (opcjonalnie, poza MVP).

## 7. Wpływ na istniejący kod i bezpieczeństwo
- Nie zmieniamy kontraktów istniejących endpointów `/api/*`. Wykorzystujemy je poprzez `fetchWithAuth`.
- Middleware (`src/middleware/index.ts`) pozostaje bez zmian; API nadal budują klienta Supabase z nagłówkiem `Authorization` użytkownika.
- RLS nadal egzekwuje izolację per `user_id`.
- Formy haseł nie przechodzą przez własne endpointy — używamy wyłącznie Supabase Auth SDK.

## 8. Kroki wdrożenia
1) UI: dodać strony `login.astro`, `auth/forgot.astro`, `auth/reset.astro` i komponenty `AuthView`, `LoginForm`, `RegisterForm`, `ForgotPasswordView`, `ResetPasswordView`.
2) Auth context: `AuthProvider`, `useAuth`, `RequireAuth` (guardy na `/profile`, `/app*`).
3) Serwisy: `authClient`, `fetchWithAuth` (pobiera token z Supabase i dodaje `Authorization`).
4) Flow po zalogowaniu/rejestracji: wywołanie `POST /api/events` (`session_start`), redirect do `/app`, w tle `GET /api/profile`; dla 404 pokaż baner/CTA „Uzupełnij profil” (link do `/profile`).
5) Header: dodać przyciski „Zaloguj”/„Wyloguj” zależnie od stanu sesji.
6) Walidacja i UX: focus management, toasty, komunikaty po polsku.
7) Testy ręczne: logowanie, rejestracja, zapomniane hasło, reset hasła, wylogowanie, redirect do `/app`, baner/CTA dla braku profilu, event `session_start` (także przy starcie z istniejącą sesją), 401 z API.

---

Spec dostosowany do PRD: po zalogowaniu użytkownik trafia na `/app` (pusty stan kolekcji), a brak profilu sygnalizuje CTA do `/profile`. Uwzględniono wymóg US‑015 — logowanie `session_start` także przy starcie z istniejącą sesją.

