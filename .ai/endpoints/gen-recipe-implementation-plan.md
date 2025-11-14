# API Endpoint Implementation Plan: POST /api/recipes/generate

## 1. Przegląd punktu końcowego
- Cel: Jednorazowe wygenerowanie przepisu kulinarnego na podstawie `prompt` i profilu użytkownika (preferencje dietetyczne), z rejestrowaniem zdarzeń (`ai_prompt_sent`, `ai_recipe_generated`) i jedną próbą ponowienia w przypadku niepowodzenia.
- Zwraca: Obiekt przepisu w formacie `RecipeSchema` wraz z metadanymi (`generation_id`, `generated_at`).
- Zakres: Tylko generowanie (bez zapisu do bazy). Limit rozmiaru wyniku ~200KB (spójnie z CHECK w DB).
- Uwierzytelnianie: Wymagany nagłówek `Authorization: Bearer {token}` (Supabase Auth). 401 jeśli brak/niepoprawny.

## 2. Szczegóły żądania
- Metoda HTTP: `POST`
- URL: `/api/recipes/generate`
- Nagłówki:
  - `Authorization: Bearer {token}` (wymagany)
  - `Content-Type: application/json`
- Parametry zapytania: brak
- Request Body (JSON):
  - `GenerateRecipeCommand` (z `src/types.ts`):
    - `prompt: string` (wymagany)
  - Walidacja (Zod):
    - `prompt`: string, `trim()`, długość 1..2000, bez znaków sterujących (sanity check), odfiltrowanie potencjalnych wstrzyknięć (np. sekwencji system prompt) – miękka normalizacja.

## 3. Wykorzystywane typy
- DTO/Command (z `src/types.ts`):
  - `GenerateRecipeCommand` (body)
  - `GenerateRecipeResponse` (200 OK)
  - `RecipeSchema` (rdzeń danych)
  - `ApiError` (format błędów 4xx/5xx)
  - `EventType` (do logowania zdarzeń: `ai_prompt_sent`, `ai_recipe_generated`)
- Zewnętrzne/nowe (wewnętrzne serwisy):
  - `AiProvider` (interfejs): `generateRecipe(prompt: string, profile?: ProfileDTO): Promise<RecipeSchema>`
  - `AiGenerationResult`: `{ recipe: RecipeSchema; raw?: unknown }` (opcjonalne)
  - `RequestContext`: `{ userId: string; requestId: string; supabase: SupabaseClient }`

## 4. Szczegóły odpowiedzi
- 200 OK (`GenerateRecipeResponse`):
  - `recipe: RecipeSchema`
  - `generation_id: string` (UUID v4)
  - `generated_at: string` (ISO 8601, UTC)
- Błędy (`ApiError`):
  - 400 Bad Request: nieprawidłowe dane wejściowe (np. brak/za długi `prompt`)
  - 401 Unauthorized: brak/niepoprawny token
  - 413 Payload Too Large: wygenerowany przepis > 200KB (po `JSON.stringify`, `Buffer.byteLength`)
  - 429 Too Many Requests: >10 wygenerowań/h na użytkownika (`retry_after: 3600` w sekundach)
  - 500 Internal Server Error: trwała awaria generowania po 1 retry
  - 503 Service Unavailable: chwilowe problemy dostawcy AI (timeout, 5xx)

## 5. Przepływ danych
1) Autoryzacja
   - Odczyt nagłówka `Authorization` → weryfikacja przez `context.locals.supabase.auth.getUser()`.
   - Wygenerowanie `requestId` (UUID) do korelacji logów i odpowiedzi błędów.

2) Rate limiting (429)
   - Zapytanie do `events` (RLS): zlicz `type = 'ai_recipe_generated'` dla `user_id` w oknie ostatniej 1h.
   - Jeśli `>=10` → 429 z `retry_after: 3600`.

3) Walidacja wejścia (400)
   - Zod schema dla `GenerateRecipeCommand` (1..2000 znaków, `trim`).

4) Kontekst użytkownika
   - Pobranie profilu z `profiles` (opcjonalny). Brak profilu = neutralne preferencje.

5) Rejestracja zdarzenia wejściowego
   - Insert `events`: `type='ai_prompt_sent'`, `payload`: { prompt_preview: first 256 chars, request_id, model?: string }.
   - Uwaga na prywatność: nie zapisujemy pełnych promptów (tylko skrót/preview).

6) Wywołanie AI (1 retry)
   - `AiService.generateRecipe(prompt, profile)` z limitem czasu (np. 30s) i jedną próbą ponowienia (krótki backoff, np. 500–1000ms) dla błędów możliwych do powtórzenia (timeout/5xx).
   - Provider wybierany na podstawie `import.meta.env.AI_PROVIDER` ∈ {`openrouter`, `google`}. Klucze: `OPENROUTER_API_KEY` lub `GOOGLE_API_KEY`.

7) Walidacja i ograniczenia wyniku
   - Walidacja `RecipeSchema` (Zod) – wymagane pola zgodne z typem; dopuszczalne wartości (`difficulty`, `dietary_info` itp.).
   - Limit rozmiaru: `Buffer.byteLength(JSON.stringify(recipe), 'utf8') < 204800`. Przekroczenie → 413.

8) Rejestracja zdarzenia wyjściowego
   - Insert `events`: `type='ai_recipe_generated'`, `payload`: { generation_id, title: recipe.title, tags: recipe.tags, request_id }.

9) Odpowiedź 200
   - Zbudowanie `GenerateRecipeResponse` i zwrot `application/json`.

## 6. Względy bezpieczeństwa
- Uwierzytelnianie i autoryzacja: wyłącznie zalogowani użytkownicy; brak dostępu anonimowego.
- RLS w Supabase: insert do `events` tylko dla `auth.uid()`; brak odczytu `events` przez użytkownika (zachowanie prywatności).
- Walidacja wejścia (Zod) i sanity checks (długość `prompt`, znaki sterujące) – minimalizacja ryzyka prompt injection i nadużyć.
- Ograniczenie logowania: tylko `prompt_preview` (maks. 256 znaków) + `request_id`; bez PII i sekretów.
- Konfiguracja przez `import.meta.env` (Astro): unikać wycieków kluczy do klienta; klucze AI wyłącznie po stronie serwera.
- Nagłówki bezpieczeństwa i CORS: zgodnie z globalną konfiguracją Astro; endpoint serwerowy (SSR), `export const prerender = false`.
- Odporność na DoS: rate limit aplikacyjny (zdarzenia), timeouty AI, ograniczenie rozmiaru odpowiedzi.

## 7. Obsługa błędów
- Mapowanie wyjątków na `ApiError` z `request_id`:
  - 400: ZodError (lista pól w `details`), `message`: czytelny dla użytkownika.
  - 401: brak/nieprawidłowy token.
  - 413: `octet length` > 200KB (zgodność z DB CHECK).
  - 429: przekroczony limit w oknie 1h (obliczany z `events`).
  - 503: timeout/5xx od dostawcy AI (pierwsze niepowodzenie), jeśli retry nie startuje lub też się nie powiedzie z powodu 5xx.
  - 500: błąd po nieudanym retry (np. walidacja wyniku AI, niespodziewane wyjątki).
- Logowanie błędów: serwerowe logi aplikacyjne z `request_id`. Brak dedykowanej tabeli błędów – wykorzystać telemetrię serwera; nie rozbudowywać `events` o nowe typy bez zmian w schemacie.

## 8. Rozważania dotyczące wydajności
- Minimalizacja tokenów: instruktarz dla AI zawężony i deterministyczny (krótki system prompt, enumeracja pól `RecipeSchema`).
- Timeout i retry: 30s timeout, 1 retry z krótkim backoff – balans koszt/UX.
- Brak zapisu do DB w tym endpointcie (poza `events`) – szybka ścieżka odpowiedzi.
- Normalizacja i walidacja po stronie serwera – unikanie kosztów kolejnych wywołań.
- Możliwość przyszłego cache (hash(prompt+profil)) – poza MVP.

## 9. Kroki implementacji
1) Struktura plików
   - `src/pages/api/recipes/generate.ts` – endpoint (Astro server endpoint)
   - `src/lib/services/ai/ai.service.ts` – fasada (wybór providera, retry, timeout)
   - `src/lib/services/ai/providers/openrouter.provider.ts` – OpenRouter adapter
   - `src/lib/services/ai/providers/google.provider.ts` – Google AI Studio adapter
   - `src/lib/services/events.service.ts` – pomocnik do wstawiania zdarzeń
   - `src/lib/schemas/recipe.schema.ts` – Zod dla `RecipeSchema` i komend

2) Endpoint (`generate.ts`)
   - `export const prerender = false`
   - `export const POST: APIRoute = async ({ request, locals }) => { ... }`
   - Pobierz token z `Authorization`, waliduj użytkownika przez `locals.supabase.auth.getUser()`.
   - Parsuj i waliduj body (Zod: `GenerateRecipeCommand`).
   - Sprawdź 429 (zlicz `ai_recipe_generated` w events w oknie 1h).
   - Pobierz profil (opcjonalny) z `profiles`.
   - Zaloguj `ai_prompt_sent` (tylko preview promptu + `request_id`).
   - Wywołaj `AiService.generateRecipe()` z retry i timeout.
   - Zweryfikuj `RecipeSchema` + limit 200KB (413 gdy przekroczony).
   - Zaloguj `ai_recipe_generated` i zwróć 200 z `GenerateRecipeResponse`.

3) Serwis AI (`ai.service.ts`)
   - `generateRecipe(prompt, profile)` – buduje finalny prompt (system+user), wywołuje odpowiedni provider.
   - Implementuje retry (1x) z backoff; rozróżnia błędy retryable (timeout/5xx) vs non-retryable (4xx, walidacja modelu).
   - Zwraca `RecipeSchema`; dodatkowo może zwrócić `raw` do debugowania w logach serwera (nie w API).

4) Providerzy
   - OpenRouter: `POST https://openrouter.ai/api/v1/chat/completions` (model konfigurowalny), klucz w nagłówku.
   - Google AI Studio: odpowiedni endpoint models/generateContent; klucz w nagłówku.
   - Wymuszona struktura odpowiedzi: proś model o JSON w dokładnym kształcie `RecipeSchema` (bez komentarzy, bez markdown).

5) Walidacja i schematy (Zod)
   - `GenerateRecipeCommandSchema`
   - `RecipeSchemaZ` – odzwierciedla `RecipeSchema` (m.in. `difficulty ∈ {'easy','medium','hard'}`, listy `ingredients`/`instructions`, opcjonalne `dietary_info`, `tags`).

6) Zdarzenia (`events.service.ts`)
   - `logEvent(userId, type: EventType, payload?: unknown)` – insert z RLS przez `locals.supabase`.
   - Dodaj `request_id` do payloadu dla korelacji.

7) Konfiguracja środowiska
   - `AI_PROVIDER`, `OPENROUTER_API_KEY`/`GOOGLE_API_KEY` w `.env` (tylko serwer).
   - Ewentualne: `AI_MODEL`, `AI_TIMEOUT_MS`.

8) Testy i weryfikacja (jeśli istnieje infrastruktura testowa)
   - Testy jednostkowe: walidacja Zod, ograniczenia 200KB, normalizacja promptu.
   - Testy integracyjne: ścieżka 200, 400 (zła walidacja), 401 (brak tokenu), 413 (za duży wynik), 429 (limit), 500/503 (awarie AI).
   - Smoke test manualny z tokenem Supabase i przykładowym promptem.

9) Monitorowanie
   - Logi serwera z `request_id`, pomiar czasu generowania, statusy retry.
   - Agregacja metryk z tabeli `events` (KPI: wykorzystanie funkcji, średni czas generowania, skuteczność bez retry).

