# API Endpoint Implementation Plan: Log Event

## 1. Przegląd punktu końcowego
- Cel: jawne logowanie zdarzenia `session_start` przez klienta aplikacji na potrzeby analityki. Pozostałe typy zdarzeń są zapisywane głównie po stronie serwera.
- Ścieżka: `POST /api/events`
- Uwierzytelnianie: wymagany nagłówek `Authorization: Bearer {token}` (Supabase JWT)
- Baza danych: tabela `public.events` (`id`, `user_id`, `type`, `payload`, `occurred_at`)

## 2. Szczegóły żądania
- Metoda HTTP: `POST`
- URL: `/api/events`
- Nagłówki:
  - `Authorization: Bearer {token}` (wymagany)
  - `Content-Type: application/json`
- Parametry:
  - Wymagane: `body.type`
  - Opcjonalne: `body.payload`
- Body (JSON):
  ```json
  {
    "type": "session_start",
    "payload": {
      "user_agent": "Mozilla/5.0...",
      "platform": "web"
    }
  }
  ```
- Walidacja (Zod):
  - `type`: enum z dozwolonymi wartościami: `"session_start" | "profile_edited" | "ai_prompt_sent" | "ai_recipe_generated" | "recipe_saved"` (spójne z `EventType` w `src/types.ts` oraz CHECK constraint w DB)
  - `payload`: dowolny poprawny JSON (zalecany limit rozmiaru, np. ≤ 8 KB po serializacji)
- Ograniczenia/uwagi:
  - Źródłem `user_id` jest sesja użytkownika (token); klient nie może podawać `user_id` w treści żądania.
  - Endpoint przeznaczony głównie dla `session_start`; inne zdarzenia rejestrowane z backendu.

## 3. Szczegóły odpowiedzi
- Sukces (`201 Created`): zwracany obiekt zdarzenia (EventDTO) w strukturze:
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "type": "session_start",
    "payload": {
      "user_agent": "Mozilla/5.0...",
      "platform": "web"
    },
    "occurred_at": "2025-01-16T10:00:00Z"
  }
  ```
- Błędy:
  - `400 Bad Request`: nieprawidłowe dane wejściowe (walidacja, przekroczony limit `payload`)
  - `401 Unauthorized`: brak lub nieprawidłowy token
  - `500 Internal Server Error`: błąd wewnętrzny (np. insert do DB)
- Format błędów (ApiError):
  ```json
  {
    "error": "Validation failed",
    "message": "...",
    "details": {"field": "reason"},
    "request_id": "..."
  }
  ```

## 4. Przepływ danych
1. API route (`/api/events`) pobiera nagłówek `Authorization` i wyciąga token Bearer.
2. Używa `Astro.locals.supabase` do weryfikacji użytkownika: `supabase.auth.getUser(token)`.
3. Parsuje `request.json()`, waliduje treść Zod-em (typ oraz JSON-owość `payload`, limit rozmiaru).
4. Buduje rekord do wstawienia: `{ user_id, type, payload }` (czas `occurred_at` ustawia DB `DEFAULT NOW()`).
5. Wstawia do `public.events` przez Supabase: `insert(...).select('*').single()` i zwraca wynik z kodem `201`.
6. W przypadku błędów walidacji/uwierzytelnienia zwraca odpowiednio `400`/`401`, a dla wyjątków serwera `500`.

## 5. Względy bezpieczeństwa
- Uwierzytelnianie: wymagane JWT Supabase; odrzuć żądania bez/ze złym tokenem (`401`).
- Autoryzacja: `user_id` brany wyłącznie z sesji; klient nie może nadpisać `user_id`.
- Walidacja danych: Zod; `type` z whitelisty; `payload` wyłącznie JSON, limit rozmiaru; sanityzacja ewentualnych stringów (np. `user_agent`).
- Ekspozycja danych: nie ujawniaj szczegółów wyjątków DB; zwracaj bezpieczne komunikaty.
- Sekrety/konfiguracja: używaj `import.meta.env`; nie importuj klienta Supabase bezpośrednio w endpointach (użyj `context.locals`).
- Rate limiting (opcjonalnie): ogranicz częstotliwość wywołań (np. po IP/user_id) po stronie reverse proxy lub middleware.

## 6. Obsługa błędów
- Scenariusze:
  - Brak nagłówka `Authorization` albo zły format → `401` z komunikatem o braku autoryzacji.
  - Token nieprawidłowy/wygasły → `401`.
  - Niepoprawny JSON w body → `400` (parse error).
  - `type` spoza listy dozwolonych → `400` (szczegóły walidacji).
  - Przekroczony limit rozmiaru `payload` → `400`.
  - Błąd wstawienia do DB → `500` (bezpieczny komunikat, log po stronie serwera).
- Logowanie błędów: `console.error` z `request_id`/korelacją; w MVP brak osobnej tabeli błędów (możliwa integracja z Sentry w przyszłości).

## 7. Wydajność
- Operacja jednostkowa (`INSERT`) — niskie obciążenie.
- Ogranicz rozmiar `payload`, by uniknąć dużych alokacji i I/O.
- Używaj `insert(...).select('*').single()` aby uniknąć dodatkowego zapytania po `id`.
- Indeksy: klucz główny `id` wystarczy dla zapisu; ewentualne raportowanie/eksport już pokrywa funkcja `export_events_ndjson` w DB.

## 8. Kroki implementacji
1) Walidacja (Zod): dodaj `src/lib/validation/events.schema.ts`
   - `CreateEventCommandSchema = z.object({ type: z.enum(["session_start","profile_edited","ai_prompt_sent","ai_recipe_generated","recipe_saved"]), payload: z.any().optional() }).strict()`
   - Dodaj `refine`, który odrzuca `payload` większy niż np. 8192 bajty po `JSON.stringify`.

2) Serwis: dodaj `src/lib/services/events.service.ts`
   - `export async function createEvent(supabase: typeof import('../../db/supabase.client').supabaseClient, userId: string, input: { type: EventType; payload?: Json | null; })`
   - Wykonaj `supabase.from('events').insert({ user_id: userId, type: input.type, payload: input.payload ?? null }).select('*').single()`
   - Zwróć `EventDTO` albo rzuć kontrolowany błąd serwisowy.

3) Endpoint Astro: dodaj `src/pages/api/events.ts`
   - `export const prerender = false`
   - `export async function POST({ request, locals }: APIContext)`
   - Pobierz i zweryfikuj token z `Authorization` (format `Bearer <token>`). Użyj `locals.supabase.auth.getUser(token)` do uzyskania `user.id`.
   - Parsuj JSON, waliduj Zod-em (`CreateEventCommandSchema`).
   - Wywołaj `createEvent(locals.supabase, user.id, input)`.
   - Zwróć `201` z nowo utworzonym zdarzeniem.
   - Zwracaj błędy w formacie `ApiError` (`400`/`401`/`500`).

4) Pomocnicze odpowiedzi HTTP: `src/lib/http.ts`
   - Helpery `json(data, status=200)` i `error(status, { error, message, details, request_id })` dla spójności odpowiedzi.

5) Typy
   - Wykorzystaj istniejące: `CreateEventCommand`, `EventDTO`, `EventType` z `src/types.ts` oraz typy DB z `src/db/database.types.ts`.

6) Testy ręczne (propozycja)
   - `curl -i -X POST http://localhost:4321/api/events -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"type":"session_start","payload":{"platform":"web"}}'`

7) Zgodność z zasadami projektu
   - Endpoint w `src/pages/api`, walidacja Zod, logika w `src/lib/services`, Supabase z `context.locals`, statusy HTTP: `201/400/401/500`.

