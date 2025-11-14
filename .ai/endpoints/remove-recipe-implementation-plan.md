# API Endpoint Implementation Plan: DELETE /api/recipes/:id

## 1. Przegląd punktu końcowego
- Cel: Trwałe (hard delete) usunięcie przepisu użytkownika po identyfikatorze.
- Zakres: Tylko przepisy należące do uwierzytelnionego użytkownika; brak wpływu na inne tabele (brak zależności poza FK do auth.users).
- Autoryzacja: Wymagany token Bearer (Supabase Auth). Brak body w żądaniu.
- Konwencja: Endpoint SSR w Astro (`src/pages/api/recipes/[id].ts`), z `export const prerender = false`.

## 2. Szczegóły żądania
- Metoda HTTP: DELETE
- Struktura URL: `/api/recipes/:id`
- Nagłówki:
  - Wymagane: `Authorization: Bearer {token}`
- Parametry:
  - Path params (wymagane): `id` – UUID v4
  - Query params: brak
- Body: brak

## 3. Wykorzystywane typy
- `ApiError` – standardowa struktura błędu (src/types.ts)
- `UuidSchema` – walidacja UUID (src/lib/schemas/common.schema.ts)
- Typy tabel: `Tables<"recipes">` (pośrednio w serwisie), lecz sam endpoint nie zwraca treści przy 204.

## 4. Szczegóły odpowiedzi
- 204 No Content – sukces, przepis usunięty; puste body, nagłówki: `Cache-Control: no-store`
- 400 Bad Request – nieprawidłowy `id` (nie-UUID)
- 401 Unauthorized – brak lub niepoprawny token
- 404 Not Found – przepis nie istnieje lub nie należy do użytkownika
- 500 Internal Server Error – błąd bazy danych lub nieoczekiwany błąd serwera

## 5. Przepływ danych
- Wejście: żądanie HTTP DELETE z nagłówkiem `Authorization` i `:id` w ścieżce.
- Uwierzytelnienie: `locals.supabase.auth.getUser(token)` – pozyskanie `userId`.
- Walidacja: `UuidSchema.safeParse(params.id)` – weryfikacja formatu ID.
- Operacja: `RecipesService.deleteRecipe(recipeId, userId)` – pojedyncze zapytanie `DELETE` z warunkami `id` oraz `user_id`.
- Wyjście: 204 przy skutecznym usunięciu; 404 gdy brak dopasowanej krotki; pozostałe statusy wg sekcji błędów.

## 6. Względy bezpieczeństwa
- Autoryzacja po stronie API: Token wymagany; brak ekstrapolacji danych z innych kont.
- Brak ujawniania informacji o istnieniu zasobu innego użytkownika (zawsze 404, jeśli nie należy do użytkownika).
- Nagłówki anty-cache: `Cache-Control: no-store` (dane prywatne/stan).
- Zgodność z zasadami: korzystanie z `locals.supabase` (z middleware), Zod do walidacji, brak dostępu bezpośredniego do klienta globalnego.
- Ograniczenie wektora enumeracji: odpowiedzi 404 dla nieautoryzowanego dostępu do cudzych ID.

## 7. Obsługa błędów
- 400: ID nie przechodzi walidacji UUID (Zod) – `ApiError.details` z komunikatem walidacji.
- 401: Brak nagłówka `Authorization` lub niepoprawny/wygaśnięty token – `ApiError`.
- 404: `DELETE` nie usunął żadnego wiersza (przepis nie istnieje lub należy do kogoś innego) – `ApiError` z `error: "Not Found"` i `message: "Recipe not found"`.
- 500: Błąd Supabase/PostgREST – log na serwerze (`console.error` z `requestId`, `userId`, `recipeId`), odpowiedź `ApiError` 500.

## 8. Rozważania dotyczące wydajności
- Zapytanie `DELETE` jest złożone po indeksowanych kolumnach (`id` – PK i `user_id` – indeksowana w praktyce w większości schematów). Koszt minimalny.
- Jedno trafienie do bazy; brak dodatkowych round-tripów. Brak potrzeby transakcji.
- Brak payloadu w odpowiedzi (204) – mniejszy ruch sieciowy.

## 9. Etapy wdrożenia
1) Serwis
   - Rozszerz `src/lib/services/recipes.service.ts` o metodę:
     - `async deleteRecipe(id: string, userId: string): Promise<boolean>`
     - Implementacja supabase-js:
       - `const { data, error } = await supabase.from("recipes").delete().eq("id", id).eq("user_id", userId).select("id");`
       - Jeśli `error` – rzuć `Error` (obsłuży to endpoint -> 500)
       - Zwróć `Boolean(data && data.length > 0)` – informacja, czy cokolwiek usunięto

2) Endpoint
   - W pliku `src/pages/api/recipes/[id].ts` dodaj handler `export const DELETE: APIRoute = async (...) => { ... }` obok istniejącego `GET`:
     - Wygeneruj `requestId` (uuidv4)
     - Sprawdź nagłówek `Authorization` (wzorzec jak w `GET`/`index.ts`): jeśli brak/niepoprawny – 401
     - `locals.supabase.auth.getUser(token)` -> `userId` lub 401 przy błędzie/autentykacji
     - Waliduj `params.id` przez `UuidSchema.safeParse(...)`: błąd -> 400 z details
     - `const ok = await recipesService.deleteRecipe(recipeId, userId)`
       - `ok === true` -> 204 No Content (z nagłówkiem `Cache-Control: no-store`)
       - `ok === false` -> 404 Not Found (bez ujawniania własności zasobu)
     - `catch` na nieoczekiwane wyjątki -> 500 (log z `requestId`)
   - Zastosuj lokalny helper `jsonError(...)` (jak w istniejących endpointach) dla spójności formatów błędów.

3) Spójność i zasady
   - `export const prerender = false` (jak w pozostałych endpointach)
   - Zod do walidacji UUID (z `UuidSchema`)
   - Supabase z `context.locals.supabase`
   - Brak ciała odpowiedzi dla 204 (puste body)

4) Walidacja (ręczna)
   - 401: brak nagłówka `Authorization`
   - 400: `:id` nie jest UUID
   - 404: poprawny UUID, ale nie istnieje lub nie należy do użytkownika
   - 204: poprawny UUID, należy do użytkownika i został usunięty
   - 500: sztuczne wymuszenie błędu DB (np. tymczasowa modyfikacja), w praktyce obserwowalne w logach serwera

5) Nagłówki i meta
   - Wszystkie odpowiedzi błędów: `Content-Type: application/json`
   - 204: `Cache-Control: no-store`
   - Dołącz `request_id` w odpowiedziach błędów (ułatwia diagnostykę)

6) Scenariusze brzegowe
   - Wielokrotne DELETE tego samego ID: pierwsze -> 204, kolejne -> 404 (już nie istnieje)
   - Próba usunięcia cudzego przepisu: 404 (bez ujawniania istnienia)
   - Token wygasły/niepoprawny: 401

---

Przykładowy szkic implementacji (dla kontekstu – nie jest to część odpowiedzi runtime API):

```ts
// src/lib/services/recipes.service.ts
async deleteRecipe(id: string, userId: string): Promise<boolean> {
  const { data, error } = await this.supabase
    .from("recipes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");

  if (error) {
    console.error(`Failed to delete recipe ${id} for user ${userId}:`, error);
    throw new Error(`Database error: ${error.message}`);
  }

  return Array.isArray(data) && data.length > 0;
}
```

```ts
// src/pages/api/recipes/[id].ts
export const DELETE: APIRoute = async ({ request, params, locals }) => {
  const requestId = uuidv4();

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonError(401, "Unauthorized", "Missing or invalid authorization header", undefined, requestId);
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const { data: userData, error: authError } = await locals.supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return jsonError(401, "Unauthorized", "Invalid or expired token", undefined, requestId);
    }

    const idValidation = UuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      return jsonError(400, "Bad Request", "Invalid recipe ID format", { id: idValidation.error.errors.map(e => e.message) }, requestId);
    }

    const recipesService = new RecipesService(locals.supabase);
    const ok = await recipesService.deleteRecipe(idValidation.data, userData.user.id);

    if (!ok) {
      return jsonError(404, "Not Found", "Recipe not found", undefined, requestId);
    }

    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unexpected error in DELETE /api/recipes/:id:", error);
    return jsonError(500, "Internal Server Error", "An unexpected error occurred", undefined, requestId);
  }
};
```

