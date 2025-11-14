<architecture_analysis>
- Kluczowe pliki i elementy biorące udział w autentykacji:
  - Klient Supabase: src/db/supabase.client.ts:1 — inicjalizacja SDK Supabase dla frontendu.
  - Middleware Astro: src/middleware/index.ts:1 — przekazuje klienta Supabase do locals (dla SSR, choć endpointy auth używają klienta z Bearer).
  - API klient profilu (frontend): src/lib/api/profile.ts:1 — wrapper `apiFetch` dodający `Authorization: Bearer <token>`, hooki TanStack Query do GET/POST/PUT profilu, redirect na 401.
  - Endpointy wymagające Bearer:
    - Profil: src/pages/api/profile/index.ts:1 — GET/POST/PUT, weryfikacja `Authorization`, tworzy klienta Supabase z nagłówkiem Bearer, RLS.
    - Zdarzenia: src/pages/api/events.ts:1 — POST, wymaga Bearer, loguje `session_start` (best‑effort).
    - Przepisy: src/pages/api/recipes/*.ts:1 — również wymagają Bearer (generowanie/zapis), istotne po zalogowaniu.
  - Typy/kontrakty: src/types.ts:1 — DTO i typy domeny, w tym Auth DTO (rejestracja/logowanie) i ApiError.
- Główne strony i komponenty (wg spec auth):
  - `/login` (LoginPage) — `AuthView` z `LoginForm` i `RegisterForm`.
  - `/auth/forgot` — `ForgotPasswordView`.
  - `/auth/reset` — `ResetPasswordView` + `NewPasswordForm`.
  - `/app` — AppPage (po zalogowaniu; pusty stan kolekcji); wyświetla CTA do `/profile` jeśli profil nie istnieje.
  - `/profile` — ProfilePage (edycja dietType?, dislikedIngredients[], preferredCuisines[]).
  - `Header` — menu użytkownika (Wyloguj/Log in).
  - `AuthProvider` + `RequireAuth` — zarządzanie sesją i guardy nawigacji (klientowo).
  - `Profile API (client)` + `TanStack Query` — pobieranie/zapis profilu z Bearer.
- Przepływ danych:
  - Logowanie/Rejestracja → Supabase Auth (SDK) → sesja z `access_token` → klientowe wywołania API z `Authorization: Bearer` → endpointy Astro weryfikują token i używają Supabase z RLS → Postgres.
  - Po zalogowaniu i przy „zimnym starcie” z istniejącą sesją wysyłamy `POST /api/events` z `session_start` (best‑effort).
  - `/app` używa `useProfileQuery` do `GET /api/profile`; 404 → CTA do `/profile`, 401 → redirect `/login`.
- Krótki opis funkcjonalności komponentów:
  - AuthView/LoginForm/RegisterForm — formularze, walidacja, wywołania `supabase.auth.signInWithPassword/signUp`.
  - Forgot/Reset — `resetPasswordForEmail` i `updateUser({ password })` na SDK.
  - AuthProvider — hydratuje sesję z Supabase, publikuje `session`, loguje `session_start` (raz na start sesji przeglądarki).
  - Profile API (client) — pobiera token z SDK, dodaje Bearer, obsługuje 401/404, integruje z TanStack Query.
  - Astro API (profile/events/recipes) — weryfikuje Bearer, tworzy klienta Supabase „w imieniu” użytkownika, egzekwuje RLS.
</architecture_analysis>

<mermaid_diagram>
```mermaid
flowchart TD
  %% Warstwa UI (Astro + React)
  subgraph UI["Warstwa UI (Astro + React)"]
    AppLayout["AppLayout / Layout.astro"]
    Header["Header (Logowanie/Wylogowanie)"]
    AuthProvider["AuthProvider (sesja Supabase)"]
    RequireAuth["RequireAuth (guard nawigacji)"]

    LoginPage(("/login — AuthView"))
    AuthView["AuthView"]
    LoginForm["LoginForm (email, hasło)"]
    RegisterForm["RegisterForm (email, hasło)"]

    ForgotPage(("/auth/forgot"))
    ResetPage(("/auth/reset"))

    AppPage(("/app — lista/generator"))
    ProfilePage(("/profile — formularz profilu"))

    ProfileApiClient["Profile API (client: apiFetch)\n+ TanStack Query (useProfileQuery/mutations)"]
  end

  %% Supabase SDK (przeglądarka)
  subgraph SDK["Supabase Auth (SDK w przeglądarce)"]
    SupabaseSDK["Supabase JS SDK\ngetSession/signIn/signUp/signOut/reset/updateUser"]
  end

  %% Warstwa API (Astro endpoints)
  subgraph API["Warstwa API (Astro endpoints)"]
    ApiEvents["/api/events (POST) — session_start"]
    ApiProfile["/api/profile (GET/POST/PUT) — profil"]
    ApiRecipes["/api/recipes* — generacja/zapis (po zalogowaniu)"]
  end

  %% Supabase Backend (weryfikacja i RLS)
  subgraph SUPABASE["Supabase Backend"]
    AuthSrv["Auth Server — weryfikacja tokenów"]
    DBRLS["Postgres + RLS\nprofiles/recipes/events"]
  end

  %% Połączenia UI
  LoginPage --> AuthView
  AuthView --> LoginForm
  AuthView --> RegisterForm
  ForgotPage -.-> SupabaseSDK
  ResetPage -.-> SupabaseSDK

  %% Logowanie/Rejestracja
  LoginForm -- "signInWithPassword" --> SupabaseSDK
  RegisterForm -- "signUp" --> SupabaseSDK
  SupabaseSDK -- "sesja (access_token)" --> AuthProvider

  %% Po zalogowaniu: redirect i event session_start
  AuthProvider -- "redirect → /app" --> AppPage
  AuthProvider == "POST session_start" ==> ApiEvents

  %% Wylogowanie z Header
  Header -- "Wyloguj (signOut)" --> SupabaseSDK
  SupabaseSDK -.-> LoginPage

  %% On cold start (istniejąca sesja)
  OnStart["Start aplikacji"] --> AuthProvider
  AuthProvider -. "jeśli sesja i brak eventu w sessionStorage" .-> ApiEvents

  %% Profile API (client) z Bearer
  AppPage -- "useProfileQuery" --> ProfileApiClient
  ProfileApiClient -- "GET/POST/PUT profilu\nAuthorization: Bearer <token>" --> ApiProfile

  %% Weryfikacja po stronie API
  ApiEvents -- "Authorization: Bearer" --> AuthSrv
  ApiProfile -- "Authorization: Bearer" --> AuthSrv
  ApiRecipes -- "Authorization: Bearer" --> AuthSrv

  %% Dostęp do bazy z RLS
  ApiEvents --> DBRLS
  ApiProfile --> DBRLS
  ApiRecipes --> DBRLS

  %% Odpowiedzi do UI
  ApiProfile -- "200: ProfileDTO" --> ProfileApiClient
  ApiProfile -- "404: brak profilu" --> ProfileApiClient
  ProfileApiClient -. "404 → pokaż CTA 'Uzupełnij profil' w /app" .- AppPage
  ApiProfile -- "401" --> ProfileApiClient
  ProfileApiClient -. "401 → redirect /login" .- LoginPage

  %% Guardy
  RequireAuth --- AppPage
  RequireAuth --- ProfilePage
```
</mermaid_diagram>

