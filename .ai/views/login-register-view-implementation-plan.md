# Plan implementacji widoku Logowania / Rejestracji

## 1. Przegląd
Widok umożliwia rejestrację oraz logowanie użytkownika za pomocą Supabase Auth. Po pomyślnym uwierzytelnieniu aplikacja ustawia sesję, a następnie kieruje użytkownika do `/profile` (gdy profil nie istnieje) lub do `/app` (gdy profil istnieje). Widok zapewnia walidację formularza, czytelne komunikaty błędów, dostępność (A11y) i integrację z i18n.

## 2. Routing widoku
- Ścieżka: `/login`
- Ochrona: widok publiczny (dostępny bez sesji). Jeśli użytkownik jest już zalogowany, redirect do `/app`.

## 3. Struktura komponentów
- `AuthPage` (kontener widoku)
  - `AuthForm` (formularz logowanie/rejestracja z możliwością przełączania trybu)
    - `EmailInput` (komponent pola e‑mail)
    - `PasswordInput` (komponent pola hasła z opcją pokaż/ukryj)
    - `SubmitButton`
    - `ModeSwitchLink` (przełącznik między „Masz konto? Zaloguj się” / „Nie masz konta? Zarejestruj się”)
  - `Alert`/`FormError` (obsługa błędów globalnych)
  - `Toaster` (powiadomienia o sukcesie/ błędach)

## 4. Szczegóły komponentów
### AuthPage
- Opis: Kontener widoku, odpowiada za detekcję sesji, redirect po zalogowaniu oraz oprawę (layout, i18n, a11y).
- Główne elementy: nagłówek, `AuthForm`, slot na `Alert`/`Toaster`.
- Obsługiwane interakcje: brak bezpośrednich (zdarzenia pochodzą z `AuthForm`).
- Walidacja: brak (delegowana do `AuthForm`).
- Typy: `AuthViewModel`, `AuthFormMode`.
- Propsy: brak (strona).

### AuthForm
- Opis: Formularz dwutrybowy (login/register) z walidacją, wywołaniem Supabase Auth i nawigacją po sukcesie.
- Główne elementy: `EmailInput`, `PasswordInput`, `SubmitButton`, `ModeSwitchLink`.
- Obsługiwane interakcje:
  - Zmiana trybu (login <-> register)
  - Submit formularza (Enter/klik)
  - Pokaż/ukryj hasło
- Walidacja:
  - E‑mail: wymagany, poprawny format RFC 5322 (regex umiarkowany), max 254 znaki.
  - Hasło: wymagane, min 8 znaków, max 128 znaków.
- Typy:
  - DTO: `LoginCommand`, `RegisterCommand` (z `src/types.ts`).
  - ViewModel: `AuthFormValues`, `AuthFormErrors`, `AuthResult`.
- Propsy: `mode: AuthFormMode`, `onSuccess(route: string)`, `onError(error: AuthError)` (opcjonalne; zwykle obsługa lokalna i redirect w komponencie).

### EmailInput
- Opis: Pole tekstowe dla e‑mail z etykietą i komunikatem błędu.
- Główne elementy: `label`, `input[type=email]`, `aria-describedby` dla błędu.
- Interakcje: wpisywanie, blur (walidacja), Enter (submit formularza nadrzędnego).
- Walidacja: jw. (wspólna logika w `AuthForm`).
- Typy: `EmailFieldProps` (value, onChange, error, disabled).
- Propsy: `value: string`, `onChange(v: string)`, `error?: string`, `disabled?: boolean`.

### PasswordInput
- Opis: Pole hasła z przyciskiem pokaż/ukryj i komunikatem błędu.
- Główne elementy: `input[type=password|text]`, `button[aria-label="Pokaż/Ukryj hasło"]`, `aria-live=polite` dla błędu.
- Interakcje: wpisywanie, toggle show/hide, blur (walidacja), Enter.
- Walidacja: min/max długość; opcjonalnie siła hasła (UI hint).
- Typy: `PasswordFieldProps` (value, onChange, error, disabled).
- Propsy: `value: string`, `onChange(v: string)`, `error?: string`, `disabled?: boolean`.

### SubmitButton
- Opis: Przycisk wysyłający, pokazuje stan ładowania.
- Główne elementy: `button[type=submit]`, `aria-busy` podczas przetwarzania.
- Interakcje: klik/Enter.
- Walidacja: disabled gdy formularz niepoprawny.
- Typy: `SubmitButtonProps` (loading, label, disabled).
- Propsy: `loading: boolean`, `disabled?: boolean`, `children?: ReactNode`.

### ModeSwitchLink
- Opis: Link przełączający tryb (login <-> rejestracja).
- Główne elementy: `a`/`button`, opis z i18n.
- Interakcje: klik zmienia `mode` w `AuthForm`.
- Walidacja: brak.
- Typy: `ModeSwitchProps` (mode, onToggle).
- Propsy: `mode: AuthFormMode`, `onToggle(): void`.

## 5. Typy
- Z istniejących (`src/types.ts`):
  - `RegisterCommand`: `{ email: string; password: string; }`
  - `LoginCommand`: `{ email: string; password: string; }`
  - `AuthResponse`: `{ access_token: string; token_type: string; expires_in: number; refresh_token: string; user: { id: string; email: string; created_at: string; } }`
- Nowe (ViewModel):
  - `type AuthFormMode = 'login' | 'register'`
  - `interface AuthFormValues { email: string; password: string; }`
  - `interface AuthFormErrors { email?: string; password?: string; form?: string; }`
  - `interface AuthResult { ok: boolean; error?: string; response?: AuthResponse }`
  - `interface AuthViewModel { mode: AuthFormMode; values: AuthFormValues; errors: AuthFormErrors; loading: boolean; }`
  - `interface EmailFieldProps { value: string; onChange(v: string): void; error?: string; disabled?: boolean; }`
  - `interface PasswordFieldProps { value: string; onChange(v: string): void; error?: string; disabled?: boolean; }`
  - `interface SubmitButtonProps { loading: boolean; disabled?: boolean; children?: React.ReactNode }`
  - `interface ModeSwitchProps { mode: AuthFormMode; onToggle(): void }`

## 6. Zarządzanie stanem
- Lokalny stan formularza w `AuthForm` (`useState` lub `react-hook-form`).
- Globalna sesja przez Supabase SDK; po zalogowaniu zapis sesji (SDK obsługuje tokeny i refresh).
- i18n: `useI18n()` do tekstów (etykiety, błędy) zgodnie z `.ai/ui-plan.md`.
- Brak konieczności TanStack Query w tym widoku (poza ewentualnym sprawdzeniem profilu po sukcesie).

## 7. Integracja API
- Rejestracja: `POST /auth/v1/signup` (Supabase Auth) — użyć SDK: `supabase.auth.signUp({ email, password })`.
- Logowanie: `POST /auth/v1/token?grant_type=password` — SDK: `supabase.auth.signInWithPassword({ email, password })`.
- Wylogowanie (poza widokiem): `POST /auth/v1/logout` — SDK: `supabase.auth.signOut()`.
- Po sukcesie logowania/rejestracji:
  - Pobranie profilu: `GET /api/profile` z `Authorization: Bearer {access_token}`.
    - 200 → redirect do `/app`.
    - 404 → redirect do `/profile` (onboarding profilu).
    - Inne błędy → toast błędu i pozostanie na `/login`.
- (Opcjonalnie) Zdarzenie sesji: `POST /api/events` z `type: 'session_start'` po pierwszym wejściu na `/app` (zwykle nie tu, ale planuje się w shellu aplikacji po udanej autoryzacji).

## 8. Interakcje użytkownika
- Wypełnienie pól e‑mail i hasło → walidacja inline.
- Klik „Zaloguj się” / „Zarejestruj się” → stan ładowania → sukces/niepowodzenie.
- Przełącznik trybu → zachowanie wpisanych wartości e‑mail (opcjonalnie) i reset błędów.
- Pokaż/ukryj hasło → zmiana typu pola, zachowanie focusu.
- Po sukcesie: automatyczny redirect na podstawie istnienia profilu.

## 9. Warunki i walidacja
- E‑mail (wymagany, format, max 254 znaki). Komunikaty i18n.
- Hasło (wymagane, min 8, max 128). Komunikaty i18n.
- Blokada przycisku „Wyślij” gdy formularz niepoprawny lub `loading`.
- Obsługa kodów błędów Supabase:
  - `Invalid login credentials` → komunikat przyjazny.
  - `User already registered` przy signUp → zaproponuj przełączenie trybu.
  - Błędy sieci/serwera → ogólny komunikat + link „spróbuj ponownie”.

## 10. Obsługa błędów
- Błędy walidacji pola: pokaż pod polem (aria‑describedby), rolę `alert` dla globalnego błędu.
- Błędy API: mapowanie na i18n (np. `auth.invalid_credentials`, `auth.user_exists`, `common.network_error`).
- Retry: brak automatycznego (poza możliwością ponownego submitu), usunięcie stanu `loading` po błędzie.

## 11. Kroki implementacji
1. Szkielet strony `AuthPage` (routing `/login`), sprawdzenie istniejącej sesji → redirect do `/app`.
2. Implementacja `AuthForm` (tryb login/register, stan, walidacja, i18n, A11y).
3. Integracja z Supabase SDK (signIn/signUp), obsługa stanów `loading/success/error`).
4. Po sukcesie: `GET /api/profile` (z Bearer token), redirect do `/app` lub `/profile`.
5. Dodanie `Toaster` i mapowanie błędów na komunikaty i18n.
6. Testy ręczne scenariuszy: poprawne logowanie, błędne hasło, użytkownik istnieje, brak sieci; redirecty zgodnie z PRD.
7. Dopracowanie UI (shadcn/ui), dostępność (aria, focus outlines), responsywność.
8. (Opcjonalnie) Telemetria: wywołanie `session_start` po wejściu do aplikacji (poza tym widokiem).
