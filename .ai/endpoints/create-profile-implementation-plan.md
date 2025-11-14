# API Endpoint Implementation Plan: Create User Profile

## 1. Przegląd punktu końcowego
Tworzy początkowy profil preferencji żywieniowych dla uwierzytelnionego użytkownika. Endpoint tworzy jeden rekord na użytkownika (relacja 1:1), normalizuje dane wejściowe (lowercase, deduplikacja), a w przypadku istnienia profilu zwraca 409 z komunikatem o konieczności użycia PUT do aktualizacji.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Struktura URL: /api/profile
- Nagłówki:
  - Authorization: Bearer {token}
- Parametry:
  - Wymagane: nagłówek Authorization z ważnym tokenem
  - Opcjonalne w body:
    - diet_type: enum [vegan, vegetarian, pescatarian, keto, paleo, gluten_free, dairy_free, low_carb, mediterranean, omnivore]
    - disliked_ingredients: string[] (zostaną znormalizowane do lowercase, przycięte, bez pustych i zdeduplikowane)
    - preferred_cuisines: string[] (jak wyżej)
- Request Body (JSON):
  {
    "diet_type": "vegetarian",
    "disliked_ingredients": ["mushrooms", "olives"],
    "preferred_cuisines": ["italian", "mediterranean"]
  }

## 3. Wykorzystywane typy
- DTO i komendy (src/types.ts):
  - ProfileDTO — odpowiedź po utworzeniu (mapa do `profiles`)
  - CreateProfileCommand — dane wejściowe do utworzenia (wszystko opcjonalne)
  - ApiError, ValidationErrorDetails — zunifikowany format błędu
  - DietType — enum zgodny z CHECK w DB
- Schematy walidacji (do dodania):
  - CreateProfileCommandSchema (Zod) w `src/lib/schemas/profile.schema.ts`
- Serwisy:
  - EventsService (istnieje) — rejestrowanie `profile_edited`
  - ProfilesService (do dodania) — logika DB i normalizacja profilu
- Klient DB/Auth:
  - SupabaseClient z `context.locals.supabase` (middleware ustawia klienta)

## 3. Szczegóły odpowiedzi
- 201 Created (application/json): nowo utworzony profil w formacie ProfileDTO:
  {
    "user_id": "uuid",
    "diet_type": "vegetarian",
    "disliked_ingredients": ["mushrooms", "olives"],
    "preferred_cuisines": ["italian", "mediterranean"],
    "created_at": "2025-01-15T10:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z"
  }
- Błędy (ApiError):
  - 400 Bad Request — niepoprawny JSON lub walidacja (details: ValidationErrorDetails)
  - 401 Unauthorized — brak/niepoprawny token
  - 409 Conflict — profil już istnieje (użyj PUT /api/profile)
  - 500 Internal Server Error — błąd serwera/DB

## 4. Przepływ danych
1) Autoryzacja: odczyt nagłówka `Authorization`, pozyskanie usera przez `locals.supabase.auth.getUser(token)`.
2) Parsowanie JSON i walidacja przez Zod (`CreateProfileCommandSchema`).
3) Normalizacja pól tablicowych: lowercase, trim, filtr pustych, deduplikacja; walidacja `diet_type` względem enum.
4) Wstawienie do `profiles` jednym zapytaniem `insert(...).select().single()` z `user_id = auth.uid()`; bez pre-checku — minimalizuje wyścigi.
5) Obsługa konfliktu (unikalność `profiles.user_id`): mapowanie błędu DB (np. 23505) na HTTP 409.
6) Po sukcesie: log zdarzenia `profile_edited` w `events` z payloadem `{ action: 'created' }` (nie blokuje odpowiedzi przy błędzie logowania).
7) Zwrot 201 z rekordem profilu.

## 5. Względy bezpieczeństwa
- Uwierzytelnianie: wymagany Bearer token; brak sesji — token pobierany z nagłówka.
- Autoryzacja: operacja tylko na `auth.uid()` (user_id z tokena); nie przyjmuje `user_id` z klienta.
- Walidacja danych: Zod (typy, długości, limity, enumy), sanity checks na stringach; transformacje do formy kanonicznej.
- Ograniczenie ujawniania danych: w 409 komunikat ogólny bez szczegółów danych; błędy 401/404 nie ujawniają posiadania zasobu innego użytkownika.
- RLS (po stronie Supabase): zasady insert/select/update ograniczone do `auth.uid() = user_id` (do potwierdzenia w migracjach/konfiguracji).
- Logowanie: unikać PII w payloadach zdarzeń; logować tylko potrzebne informacje techniczne.

## 6. Obsługa błędów
- 400 Bad Request:
  - JSON nie do zparsowania
  - Walidacja Zod (np. `diet_type` poza dozwolonym zbiorem; elementy tablic puste/za długie)
- 401 Unauthorized:
  - Brak nagłówka Authorization lub niepoprawny format
  - Token wygasły/nieprawidłowy (`auth.getUser` zwraca błąd)
- 409 Conflict:
  - Próba ponownego utworzenia profilu dla tego samego `user_id` (unikalność/PK)
- 500 Internal Server Error:
  - Inne błędy DB lub niespodziewane wyjątki
- Rejestrowanie: błędy 5xx logowane do konsoli serwera; opcjonalnie Event `profile_edited` z payloadem typu `{ error: true, stage: 'insert' }` tylko dla statystyk (nie wymagane, nie blokujące).

## 7. Rozważania dotyczące wydajności
- Pojedyncze wstawienie — minimalne obciążenie DB; brak pre-checku eliminuje dodatkowe zapytanie i warunki wyścigu.
- Wsparcie dla wysokiej współbieżności: reliance na unikalnym kluczu `profiles.user_id`; obsługa 23505 -> 409.
- Rozmiar payloadu: niewielki; transformacje po stronie serwera są O(n) względem liczby elementów tablic.
- Brak cache (dane prywatne); odpowiedź z nagłówkiem `Cache-Control: no-store` opcjonalnie.

## 8. Etapy wdrożenia
1) Schemat walidacji (Zod)
   - Utwórz plik `src/lib/schemas/profile.schema.ts` z:
     - `CreateProfileCommandSchema`:
       - `diet_type`: `z.enum([...])`.optional()
       - `disliked_ingredients`: `z.array(z.string().trim().min(1).max(50)).max(100).optional()` + `.transform(...)` do lowercase, deduplikacji i filtracji pustych
       - `preferred_cuisines`: jak wyżej, z limitem np. 50 pozycji
     - Eksportuj typy wejścia/wyjścia jeśli potrzebne
2) Serwis profili
   - Dodaj `src/lib/services/profiles.service.ts` z metodą:
     - `createProfile(userId: string, cmd: CreateProfileCommand): Promise<ProfileDTO>`
       - Zastosuj normalizację (helpers w serwisie)
       - `insert` do `profiles` z `user_id = userId`, `diet_type`, `disliked_ingredients ?? []`, `preferred_cuisines ?? []`
       - `.select('*').single()`; mapuj błąd 23505 na sygnalizację konfliktu do warstwy API
3) Endpoint API
   - Utwórz `src/pages/api/profile/index.ts` z:
     - `export const prerender = false`
     - `export const POST: APIRoute = async ({ request, locals }) => { ... }`
     - Wzorzec jak w `src/pages/api/recipes/index.ts`/`generate.ts`:
       - Sprawdzenie Authorization (Bearer), `auth.getUser(token)`
       - `request.json()` + walidacja Zod (z budową `details` dla 400)
       - Wywołanie `ProfilesService.createProfile(...)`
       - Obsługa konfliktu -> 409 z komunikatem „Profile already exists; use PUT /api/profile”
       - Po sukcesie: log `EventsService.logEvent(userId, 'profile_edited', { action: 'created', request_id })` w `try/catch` (nie blokuje)
       - Odpowiedź 201 z rekordem i nagłówkiem `Content-Type: application/json`
       - Pomocnicza funkcja `jsonError(...)` zgodna ze wzorcem w istniejących endpointach
4) Zgodność z zasadami projektu
   - Użyj `locals.supabase` (nie importuj klienta bezpośrednio)
   - Zod do walidacji
   - Normalizacja danych wejściowych w serwisie
   - Kody statusu: 201/400/401/409/500
5) Testy manualne (curl/httpie)
   - 201: POST z poprawnym body i tokenem
   - 409: powtórny POST z tym samym tokenem
   - 400: nieprawidłowy JSON, błędne `diet_type`, puste elementy tablic
   - 401: brak/niepoprawny nagłówek Authorization

---

Pliki do dodania/aktualizacji:
- `src/lib/schemas/profile.schema.ts` — Zod schema wejścia
- `src/lib/services/profiles.service.ts` — logika DB/normalizacja
- `src/pages/api/profile/index.ts` — handler POST z autoryzacją i mapowaniem błędów

Zależności i konwencje:
- Stack: Astro 5 + TypeScript 5, Supabase, Zod
- Reguły: użycie `export const prerender = false`, Zod w endpointach, logika w `src/lib/services`, `locals.supabase` z middleware

