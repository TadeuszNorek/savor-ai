# API Endpoint Implementation Plan: Update User Profile

## 1. Przegląd punktu końcowego
- Cel: Aktualizacja profilu preferencji żywieniowych zalogowanego użytkownika oraz rejestracja zdarzenia `profile_edited`.
- Ścieżka: `PUT /api/profile`
- Autentykacja: Wymagany nagłówek `Authorization: Bearer {token}` (Supabase Auth przez `locals.supabase`).
- Zasób: Tabela `public.profiles` (relacja 1:1 do `auth.users`).

## 2. Szczegóły żądania
- Metoda HTTP: `PUT`
- URL: `/api/profile`
- Nagłówki:
  - `Authorization: Bearer {token}` – wymagany
  - `Content-Type: application/json`
- Parametry URL: brak
- Body (wszystkie pola opcjonalne; co najmniej jedno wymagane do aktualizacji):
  - `diet_type`: jeden z: `vegan | vegetarian | pescatarian | keto | paleo | gluten_free | dairy_free | low_carb | mediterranean | omnivore`; dopuszczalne `null` (czyszczenie pola)
  - `disliked_ingredients`: `string[]`; normalizacja do lowercase; deduplikacja; rekomendowane limity: maks. 100 pozycji, każda 1–50 znaków
  - `preferred_cuisines`: `string[]`; normalizacja do lowercase; deduplikacja; rekomendowane limity: maks. 50 pozycji, każda 1–50 znaków
- Walidacja wejścia (Zod; `src/lib/schemas/profile.schema.ts`):
  - Poprawność typu i wartości (`diet_type` zgodne z enum)
  - Co najmniej jedno pole w body (refine)
  - Normalizacja tablic: `trim -> toLowerCase -> filter(non-empty) -> unique`
  - Ochrona przed znakami sterującymi w elementach tablic

## 3. Szczegóły odpowiedzi
- 200 OK – zaktualizowany rekord profilu:
  - Struktura: `{ user_id, diet_type, disliked_ingredients, preferred_cuisines, created_at, updated_at }`
  - Nagłówki: `Content-Type: application/json`, `Cache-Control: no-store`
- Kody błędów (kształt `ApiError`):
  - 400 Bad Request – niepoprawny JSON / walidacja (z `details` dla pól)
  - 401 Unauthorized – brak lub niepoprawny token
  - 404 Not Found – profil nie istnieje (instrukcja: utwórz przez `POST /api/profile`)
  - 500 Internal Server Error – błąd bazy/dostępu

## 4. Przepływ danych
1) Autentykacja:
   - Odczyt nagłówka `Authorization`
   - `locals.supabase.auth.getUser(token)`; odrzucenie 401 dla braku/nieprawidłowego tokena
2) Parsowanie i walidacja body:
   - `request.json()` -> walidacja przez `UpdateProfileCommandSchema.safeParse`
   - 400 z `details` przy błędach walidacji lub pustym body (brak pól do aktualizacji)
3) Aktualizacja profilu:
   - Jedno zapytanie: `update(validated)` z `eq('user_id', userId)` i `select('*').single()`
   - Normalizacja wartości (lowercase, deduplikacja) po walidacji, przed UPDATE
   - Jeśli brak zaktualizowanych wierszy -> 404
4) Rejestracja zdarzenia:
   - `EventsService.logEvent(userId, 'profile_edited', { changed_fields, request_id })`
   - Logowanie błędu rejestracji zdarzenia tylko do konsoli (nie blokować sukcesu odpowiedzi)
5) Odpowiedź 200 z pełnym rekordem profilu i nagłówkiem `Cache-Control: no-store`

## 5. Względy bezpieczeństwa
- Wymuszona autentykacja (Bearer token); brak ujawniania informacji o innych użytkownikach
- Walidacja i sanityzacja wejścia (enum `diet_type`, rozmiary tablic, brak znaków sterujących)
- Normalizacja danych do lowercase zgodnie z założeniami DB
- Minimalizacja danych w odpowiedzi (tylko pola profilu; brak danych wrażliwych)
- Brak cache po stronie serwera/pośredników (`Cache-Control: no-store`)
- Ograniczenie efektów ubocznych do jednego UPDATE; brak ujawniania szczegółów DB w komunikatach o błędach

## 6. Obsługa błędów
- 400 Bad Request:
  - Nieprawidłowy JSON w body
  - Błędy walidacji Zod (np. `diet_type` poza dozwolonym zakresem, zbyt długie elementy)
  - Brak pól do aktualizacji
- 401 Unauthorized: brak/niepoprawny nagłówek Bearer lub wygasły token
- 404 Not Found: brak profilu dla `user_id`
- 500 Internal Server Error: błąd połączenia/DB/nieoczekiwany wyjątek
- Logowanie błędów: `console.error` (brak dedykowanej tabeli błędów w schemacie)
- Spójny kształt błędu (`ApiError`): `{ error, message, details?, request_id? }`

## 7. Rozważania dotyczące wydajności
- Jeden round-trip do DB dla aktualizacji i zwrotu danych (`update(...).select('*').single()`)
- Klucz główny `profiles.user_id` zapewnia szybkie dopasowanie; brak potrzeby dodatkowych indeksów
- Brak kosztownych joinów/procesów; end-point I/O-bounded
- Ograniczenia długości i liczności tablic po stronie walidacji – mniejsze payloady i szybsza serializacja

## 8. Etapy wdrożenia
1) Schemat walidacji (Zod): `src/lib/schemas/profile.schema.ts`
   - `DietTypeSchema = z.enum([...])`
   - `StringArrayNormalizedSchema` z normalizacją i limitami
   - `UpdateProfileCommandSchema = z.object({ diet_type?: DietTypeSchema.nullish(), disliked_ingredients?: StringArrayNormalizedSchema, preferred_cuisines?: StringArrayNormalizedSchema }).refine(atLeastOneField)`
   - Eksport typów wejścia/wyjścia
2) Serwis profilu: `src/lib/services/profiles.service.ts`
   - `constructor(private supabase: SupabaseClient<Database>) {}` (spójnie z istniejącymi serwisami)
   - `getByUserId(userId): Promise<ProfileDTO | null>` (opcjonalnie)
   - `updateByUserId(userId, patch: UpdateProfileCommand): Promise<ProfileDTO | null>` – `update(...).eq('user_id', userId).select('*').single()`; zwrot `null` jeśli brak rekordu
3) Endpoint API: `src/pages/api/profile.ts`
   - `export const prerender = false`
   - `export const PUT: APIRoute = async ({ request, locals }) => { ... }`
   - Wzorzec obsługi: autentykacja -> walidacja -> aktualizacja -> event -> odpowiedź
   - Helper `jsonError(...)` zgodny z istniejącymi endpointami (`recipes`)
   - Nagłówki odpowiedzi: `Content-Type: application/json`, `Cache-Control: no-store`
4) Zdarzenia: użycie `EventsService` do `profile_edited` (payload: `changed_fields`, `request_id`)
5) Typy: korzystanie z istniejących `ProfileDTO`, `UpdateProfileCommand`, `ApiError` z `src/types.ts`
6) Manualna weryfikacja (lokalnie):
   - 200: aktualizacja co najmniej jednego pola, event zalogowany
   - 400: brak pól w body / walidacja
   - 401: brak/niepoprawny Bearer token
   - 404: użytkownik bez rekordu w `profiles`
   - 500: symulacja błędu DB (np. wyłączenie sieci)

---

Przykładowe szkice (do wykorzystania przy implementacji):

```ts
// src/lib/schemas/profile.schema.ts
import { z } from 'zod'

export const DietTypeSchema = z.enum([
  'vegan','vegetarian','pescatarian','keto','paleo','gluten_free','dairy_free','low_carb','mediterranean','omnivore'
])

const item = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .refine((v) => !/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/.test(v), 'Invalid control characters')

export const StringArrayNormalizedSchema = z
  .array(item)
  .max(100)
  .transform((arr) => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const s of arr.map((x) => x.toLowerCase())) {
      if (s && !seen.has(s)) { seen.add(s); out.push(s) }
    }
    return out
  })

export const UpdateProfileCommandSchema = z
  .object({
    diet_type: DietTypeSchema.nullish(),
    disliked_ingredients: StringArrayNormalizedSchema.optional(),
    preferred_cuisines: StringArrayNormalizedSchema.optional(),
  })
  .strict()
  .refine((v) => v.diet_type !== undefined || v.disliked_ingredients !== undefined || v.preferred_cuisines !== undefined, {
    message: 'At least one field must be provided',
    path: ['root'],
  })
```

```ts
// src/lib/services/profiles.service.ts (szkic)
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../db/database.types'
import type { ProfileDTO, UpdateProfileCommand } from '../../types'

export class ProfilesService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async updateByUserId(userId: string, patch: UpdateProfileCommand): Promise<ProfileDTO | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) throw new Error(`Database error: ${error.message}`)
    return data ?? null
  }
}
```

```ts
// src/pages/api/profile.ts (szkic handlera)
import type { APIRoute } from 'astro'
import { v4 as uuidv4 } from 'uuid'
import { UpdateProfileCommandSchema } from '../../lib/schemas/profile.schema'
import { ProfilesService } from '../../lib/services/profiles.service'
import { EventsService } from '../../lib/services/events.service'
import type { ApiError } from '../../types'

export const prerender = false

export const PUT: APIRoute = async ({ request, locals }) => {
  const requestId = uuidv4()
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonError(401, 'Unauthorized', 'Missing or invalid authorization header', undefined, requestId)
    }
    const token = authHeader.replace('Bearer ', '').trim()
    const { data: userData, error: authError } = await locals.supabase.auth.getUser(token)
    if (authError || !userData?.user) {
      return jsonError(401, 'Unauthorized', 'Invalid or expired token', undefined, requestId)
    }
    const userId = userData.user.id

    let body: unknown
    try { body = await request.json() } catch { return jsonError(400, 'Bad Request', 'Invalid JSON in request body', undefined, requestId) }
    const parsed = UpdateProfileCommandSchema.safeParse(body)
    if (!parsed.success) {
      const details = Object.fromEntries(parsed.error.errors.map(e => [e.path.join('.'), e.message]))
      return jsonError(400, 'Bad Request', 'Validation failed', details, requestId)
    }

    const service = new ProfilesService(locals.supabase)
    const updated = await service.updateByUserId(userId, parsed.data)
    if (!updated) {
      return jsonError(404, 'Not Found', 'Profile not found', { message: 'Please create profile first using POST /api/profile' }, requestId)
    }

    // best-effort event log
    try {
      const events = new EventsService(locals.supabase)
      const changed = Object.keys(parsed.data)
      await events.logEvent(userId, 'profile_edited', { changed_fields: changed, request_id: requestId })
    } catch (e) { console.error('Failed to log profile_edited:', e) }

    return new Response(JSON.stringify(updated), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Unexpected error in PUT /api/profile:', error)
    return jsonError(500, 'Internal Server Error', 'An unexpected error occurred', undefined, requestId)
  }
}

function jsonError(status: number, error: string, message: string, details?: Record<string, unknown>, requestId?: string): Response {
  const body: ApiError = { error, message, details, request_id: requestId }
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
```

