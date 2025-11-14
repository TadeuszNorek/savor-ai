# API Endpoint Implementation Plan: GET /api/profile

## 1. Przegląd punktu końcowego
- Cel: Zwraca profil żywieniowy zalogowanego użytkownika na podstawie tokena Supabase.
- Kontekst: Dane przechowywane w tabeli `profiles` (relacja 1:1 z `auth.users`).
- Odbiorcy: UI klienta (do prefillu preferencji i filtrów AI/recipe).

## 2. Szczegóły żądania
- Metoda HTTP: GET
- Struktura URL: `/api/profile`
- Nagłówki:
  - Wymagane: `Authorization: Bearer {token}` (Supabase Access Token)
- Parametry:
  - Wymagane: brak
  - Opcjonalne: brak
- Request Body: brak

## 3. Wykorzystywane typy
- `ProfileDTO` (src/types.ts) — bezpośrednie mapowanie wiersza z `profiles` (user_id, diet_type, disliked_ingredients, preferred_cuisines, created_at, updated_at).
- `ApiError` (src/types.ts) — standardowy kształt odpowiedzi błędu.
- `Database` (src/db/database.types.ts) — typ klienta Supabase w warstwie serwisów.

## 3. Szczegóły odpowiedzi
- 200 OK — JSON: `ProfileDTO`
  - Przykład:
    - `{"user_id":"uuid","diet_type":"vegetarian","disliked_ingredients":["mushrooms","olives"],"preferred_cuisines":["italian","mediterranean"],"created_at":"ISO","updated_at":"ISO"}`
- 401 Unauthorized — JSON: `ApiError` z `error: "Unauthorized"`, `message: "Valid authentication token required"` lub komunikat o nieprawidłowym nagłówku.
- 404 Not Found — JSON: `ApiError` z `error: "Profile not found"`, `message: "Please create your profile first"`.
- 500 Internal Server Error — JSON: `ApiError` ze zanonimizowanym opisem usterki.
  - Nagłówki odpowiedzi: `Content-Type: application/json`, dla treści spersonalizowanej dodać `Cache-Control: no-store`.

## 4. Przepływ danych
1) Klient wywołuje `GET /api/profile` z nagłówkiem `Authorization`.
2) Endpoint (Astro Server Endpoint) weryfikuje nagłówek i token przez `locals.supabase.auth.getUser(...)`.
3) Na podstawie `user.id` wykonywane jest zapytanie do `profiles`:
   - `.from('profiles').select('*').eq('user_id', userId).single()`
4) Mapowanie odpowiedzi 1:1 na `ProfileDTO` i zwrot 200.
5) Jeżeli brak rekordu — 404 z komunikatem ze specyfikacji.
6) Błędy uwierzytelnienia — 401; nieoczekiwane błędy — 500.

Warstwa serwisów:
- `ProfilesService` (`src/lib/services/profiles.service.ts`):
  - `getProfileByUserId(userId: string): Promise<ProfileDTO | null>` — hermetyzuje zapytania i obsługę kodów błędów bazy.

## 5. Względy bezpieczeństwa
- Uwierzytelnianie: wymagany `Authorization: Bearer {token}`; weryfikacja via `locals.supabase.auth.getUser(token)`.
- Autoryzacja/RLS: tabelę `profiles` należy chronić politykami RLS tak, aby użytkownik odczytywał wyłącznie wiersz `user_id = auth.uid()`.
- Brak treści żądania minimalizuje ryzyka walidacyjne; nie logować wrażliwych danych.
- Nie ujawniać błędów bazodanowych w odpowiedzi — tylko generyczne `500` i `request_id` do korelacji w logach.
- `export const prerender = false` — endpoint tylko SSR.
 - Caching: odpowiedzi są spersonalizowane — ustawić `Cache-Control: no-store` i nie używać CDN cache.

## 6. Obsługa błędów
- 401 Unauthorized:
  - Brak/nieprawidłowy nagłówek `Authorization` (brak prefixu Bearer / wygasły token / błąd Supabase Auth).
- 404 Not Found:
  - Brak profilu w tabeli `profiles` dla `user_id`.
- 500 Internal Server Error:
  - Inne błędy (np. błąd połączenia z DB). Log do konsoli z `request_id`.

Notatka o logowaniu zdarzeń:
- W projekcie istnieje tabela `events` i `EventsService`, ale do odczytu profilu brak odpowiedniego typu zdarzenia w enumie (brak `profile_read`). Dla GET nie logujemy zdarzeń aplikacyjnych; wystarczy log serwerowy (konsola). Ewentualne rozszerzenie enum o `profile_read` poza zakresem tego wdrożenia.

## 7. Wydajność
- Pojedyncze proste zapytanie po kluczu głównym (user_id PK) + `.single()` — O(1).
- Brak agregacji i joinów — minimalny narzut.
- Odpowiedź ~kilkaset bajtów — znikomy transfer.
 - Brak CDN cache (no-store) zgodnie z bezpieczeństwem i prywatnością użytkownika.

## 8. Kroki implementacji
1) Serwis profili
   - Utwórz `src/lib/services/profiles.service.ts` z klasą `ProfilesService` (konstruktor: `SupabaseClient<Database>`; metoda: `getProfileByUserId(userId)` zwraca `ProfileDTO | null`).
   - Obsłuż `PGRST116` (brak wiersza) jako `null`; inne błędy — rzuć `Error` (będą zamieniane na 500).

2) Endpoint API
   - Dodaj plik `src/pages/api/profile.ts`.
   - `export const prerender = false`.
   - `export const GET: APIRoute = async ({ request, locals }) => { ... }`.
   - Walidacja nagłówka `Authorization` (sprawdzenie prefixu `Bearer `; opcjonalnie Zod dla string startsWith).
   - `locals.supabase.auth.getUser(token)`; brak użytkownika => 401.
   - `ProfilesService.getProfileByUserId(userId)`:
     - `null` => 404 z ciałem: `{ error: "Profile not found", message: "Please create your profile first" }`.
     - rekord => 200 z `ProfileDTO` (pełne pole `*`).
   - Użyj lokalnego helpera `jsonError(...)` tak jak w `src/pages/api/recipes/index.ts` (spójny kształt `ApiError`).
   - Generuj `request_id` (np. `uuidv4()`) i dołączaj do błędów oraz logów serwera.

3) Walidacja i spójność typów
   - Brak body/query — zdefiniuj mały Zod schema dla nagłówka (opcjonalne, zgodnie z regułami backend).
   - Zwracany typ JSON zgodny z `ProfileDTO` (zgodność z `src/db/database.types.ts`).

4) Testy manualne (smoke)
   - 200: użytkownik z istniejącym profilem.
   - 404: użytkownik bez profilu.
   - 401: brak/niepoprawny token.
   - 500: zasymulować błąd DB (np. tymczasowo odłączyć) — sprawdzić format odpowiedzi i `request_id`.

5) Dodatki (opcjonalnie, poza MVP)
   - E2E: kontrakt odpowiedzi zgodny z `ProfileDTO`.
   - Rozszerzenie enum `events.type` o `profile_read` i rejestrowanie odczytów profilu (gdy biznesowo potrzebne).
