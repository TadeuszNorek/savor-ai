<authentication_analysis>
- Przepływy autentykacji (wg PRD i spec):
  - Logowanie: formularz → Supabase Auth (signIn) → sesja (access_token) →
    event `session_start` → redirect do `/app`.
  - Rejestracja: formularz → Supabase Auth (signUp) → (opcjonalnie)
    weryfikacja e‑mail → sesja → `session_start` → `/app`.
  - Zimny start: istniejąca sesja w SDK → `session_start` 1× (best‑effort).
  - Wylogowanie: Header → signOut → redirect do `/login`.
  - Wywołania API: `Authorization: Bearer <token>` w każdym żądaniu.
  - Weryfikacja tokenu: po stronie Astro API z Supabase Auth; RLS w DB.
  - Wygasanie tokenu: SDK odświeża; przy 401 próbujemy odświeżenie i retry;
    w razie niepowodzenia redirect do `/login`.
- Aktorzy i interakcje:
  - Przeglądarka (UI + SDK), Middleware (locals.supabase), Astro API, Supabase
    Auth (weryfikacja). DB z RLS w tle (bezpośrednio za API).
- Weryfikacja/odświeżanie tokenów:
  - Weryfikacja w Astro API (nagłówek Bearer). Odświeżanie w SDK (przeglądarka)
    transparentnie; na 401 ścieżka retry lub redirect.
- Kroki (skrót): logowanie/rejestracja → sesja → `session_start` → `/app` →
  wywołania API z Bearer → weryfikacja tokenu → odpowiedź lub 401 → refresh
  w SDK → retry lub redirect.
</authentication_analysis>

<mermaid_diagram>
```mermaid
sequenceDiagram
autonumber
participant Browser as Przeglądarka (UI + SDK)
participant MW as Middleware (Astro)
participant API as Astro API
participant AUTH as Supabase Auth

Note over Browser: Użytkownik otwiera /login
Browser->>AUTH: Logowanie (email, hasło)
activate AUTH
AUTH-->>Browser: Sesja (access_token)
deactivate AUTH

par Równolegle po zalogowaniu
  Browser->>API: POST session_start (Bearer)
  activate API
  API->>AUTH: Weryfikacja tokenu
  AUTH-->>API: Token OK
  API-->>Browser: 204 No Content
  deactivate API
and
  Browser->>Browser: Redirect do /app
end

Note over Browser: /app ładuje stan i profil
Browser->>API: GET profil (Bearer)
activate MW
MW-->>API: locals.supabase przygotowane
deactivate MW
activate API
API->>AUTH: Weryfikacja tokenu
AUTH-->>API: Token OK
alt Profil istnieje
  API-->>Browser: 200 ProfileDTO
else Brak profilu
  API-->>Browser: 404 (brak profilu)
  Browser-->>Browser: Pokaż CTA "Uzupełnij profil"
end
deactivate API

Note over Browser: Wywołania chronionych funkcji (np. przepisy)
Browser->>API: Żądanie (Bearer)
activate API
API->>AUTH: Weryfikacja tokenu
alt Token ważny
  AUTH-->>API: OK
  API-->>Browser: 2xx / wynik
else Token nieważny
  AUTH-->>API: 401 Unauthorized
  API-->>Browser: 401 Unauthorized
  Browser->>Browser: SDK próbuje odświeżyć token
  alt Odświeżanie udane
    Browser->>API: Retry z nowym Bearer
    API->>AUTH: Weryfikacja tokenu
    AUTH-->>API: OK
    API-->>Browser: 2xx / wynik
  else Odświeżanie nieudane
    Browser->>Browser: Wyczyść sesję i redirect /login
  end
end
deactivate API

Note over Browser: Zimny start z istniejącą sesją
Browser->>Browser: Jeśli sesja i brak flagi, wyślij session_start
Browser->>API: POST session_start (Bearer)
API->>AUTH: Weryfikacja tokenu
AUTH-->>API: OK
API-->>Browser: 204

Note over Browser: Wylogowanie z menu Header
Browser->>Browser: signOut (SDK)
Browser->>Browser: Redirect do /login
```
</mermaid_diagram>

