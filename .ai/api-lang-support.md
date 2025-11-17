# Obsługa wielu języków w API: recipes i profiles

Dokument analizuje, jakie zmiany są potrzebne, aby dostosować endpointy `recipes` i `profiles` (kontrakty API, serwisy, schematy Zod/typy, baza) do obsługi wielu języków, oraz proponuje dwie ścieżki:
- podejście rekomendowane (docelowe),
- wariant prostszy (MVP) — tańszy w implementacji, zgodny z założeniami z `.ai/ui-plan.md` (brak lokalizacji treści przepisów w MVP).

## Zakres
- Endpointy: `/api/recipes/generate`, `/api/recipes` (POST), `/api/recipes` (GET), `/api/recipes/:id` (GET/DELETE), `/api/profile` (GET/POST/PUT).
- Warstwy: API (Astro routes), serwisy (`src/lib/services`), schematy/typy (`src/lib/schemas`, `src/types.ts`), baza (Supabase SQL), dokumentacja (`API.md`).

## Stan obecny (skrót)
- Brak świadomości języka w API i modelu danych.
- `recipes.recipe` (JSONB) przechowuje jedną wersję treści; pochodne kolumny (`title`, `summary`, `ingredients_text`, `search_tsv`) wyliczane triggerem z JSONB.
- FTS korzysta z konfiguracji `'simple'` (bez stemmingu dla PL/EN).
- `profiles` nie ma pola preferowanego języka.
- UI plan: i18n tylko dla stałych tekstów UI; brak lokalizacji treści przepisów w MVP.

Ścieżki zmian poniżej zakładają zgodność wsteczną tam, gdzie to możliwe.

## Negocjacja języka i kontrakt API
- Rekomendacja:
  - Dodać obsługę wyboru języka: kolejność priorytetów — `lang` (query/body) → `Accept-Language` → `profile.preferred_language` → domyślnie `en`.
  - Zwracać `Content-Language` w odpowiedziach; dla treści zależnych od języka dodać `Vary: Accept-Language`.
- MVP (proste):
  - Przyjąć `lang` tylko tam, gdzie ma wpływ (głównie `/recipes/generate`), ustawiać `Content-Language` w odpowiedzi. Pozostałe endpointy ignorują `lang` (treść nie jest lokalizowana).

## Profiles: preferowany język użytkownika
- Problem: brak preferencji językowej po stronie backendu utrudnia spójność generacji i późniejszą lokalizację.
- Rekomendacja:
  - Dodać kolumnę `preferred_language text check (preferred_language in ('pl','en'))` do `profiles`.
  - Zaktualizować: `ProfileDTO`, `CreateProfileCommandSchema`, `UpdateProfileCommandSchema`, endpointy `/api/profile` do przyjmowania/zwrotu `preferred_language`.
  - `recipes/generate` używa tej wartości jako domyślnej, jeśli nie podano `lang`.
- MVP: brak zmian w profilu; język przekazywany z UI jako `lang` wyłącznie do generacji.

## Profiles × disliked_ingredients (walidacja a język)
- Problem: RPC `insert_recipe_safe` sprawdza substringy po normalizacji (bez diakrytyków), ale nie mapuje synonimów między językami (np. PL „krewetki” vs EN „shrimp”).
- Rekomendacja:
  - Zapewnić spójność języka między profilem i generacją (preferowany język = język przepisu). Docelowo rozważyć słowniki kanonicznych składników (ID + wielojęzyczne synonimy) albo dopasowanie semantyczne — poza MVP.
- MVP: komunikować w UI/README wymóg spójności językowej; walidacja pozostaje jak jest.

## Recipes – model danych (wielojęzyczność)
- Rekomendacja (pełna lokalizacja):
  - Wydzielić treść zależną od języka do osobnej tabeli `recipe_locales`:
    - `recipes(id, user_id, tags[], default_language, created_at, updated_at)`
    - `recipe_locales(id, recipe_id, lang, recipe jsonb, title, summary, ingredients_text[], search_tsv)`
    - Unikalność `(recipe_id, lang)`, indeksy GIN dla `search_tsv` per język, triggery aktualizujące pochodne pola i TSV przy insert/update.
  - Wyszukiwanie/listy filtrują po `lang` z fallbackiem do `default_language`.
- MVP (proste):
  - Dodać kolumnę `language text not null default 'en'` do `recipes` i zapisywać tylko jedną wersję językową przepisu. Brak dodatkowych tabel.

## Recipes – endpointy (zmiany behawioru)
- GET `/api/recipes` (lista):
  - Rekomendacja: dodać query `lang` (Zod + typy), w serwisie filtrować po `recipe_locales.lang` (lub po `recipes.language` w MVP). Nagłówki: `Content-Language`, `Vary: Accept-Language` (jeśli `Accept-Language` brane pod uwagę).
  - MVP: przyjąć `lang`, ale filtrowanie pozostawić bez zmian; zwracać `Content-Language`=język zapisany przy przepisie (jeśli dostępny), albo pominąć nagłówek.
- GET `/api/recipes/:id` (szczegóły):
  - Rekomendacja: parametr `lang` i fallback do `default_language`; zwracać odpowiednią wersję z `recipe_locales` i `Content-Language`.
  - MVP: zawsze zwraca zapisaną wersję bez lokalizacji; opcjonalnie endpoint może zwracać `Content-Language` na podstawie `recipes.language`.
- POST `/api/recipes` (zapis):
  - Rekomendacja: rozszerzyć `SaveRecipeCommand` o `language` i opcjonalne `translations`. Zapisywać `default_language` i wiersz w `recipe_locales`.
  - MVP: rozszerzyć `SaveRecipeCommand` o `language` i zapisać do `recipes.language` (bez dodatkowych tabel). Brak zmian w `recipe` JSONB.
- POST `/api/recipes/generate` (AI):
  - Rekomendacja: przyjmować `lang` (body lub query). Fallback do `profile.preferred_language` → `Accept-Language` → `en`. Przekazywać do providera AI; logować w event payload.
  - MVP: przyjmować `lang` i wymuszać język odpowiedzi w promptcie AI. Brak zapisu preferencji po stronie backendu.

## Schematy Zod i typy (`src/lib/schemas`, `src/types.ts`)
- Rekomendacja:
  - Dodać typ `LanguageCode = 'pl'|'en'`.
  - `RecipeListQuerySchema` + `RecipeQueryParams`: nowe pole `lang?: LanguageCode`.
  - `SaveRecipeCommandSchema` + `SaveRecipeCommand`: nowe pole `language: LanguageCode` (required w docelowym podejściu).
  - `CreateProfileCommandSchema`/`UpdateProfileCommandSchema` + `ProfileDTO`: `preferred_language?: LanguageCode`.
- MVP:
  - Tylko `lang` w `RecipeListQuerySchema` (dla spójnych kluczy cache po stronie UI) i w `GenerateRecipeCommand` (body/query). `SaveRecipeCommand` i profil bez zmian.

## Serwisy (`src/lib/services`)
- Rekomendacja:
  - `RecipesService.listRecipes(userId, query, lang)` i `getRecipeDetails(id, userId, lang)` — operacje na `recipe_locales`, ze wsparciem fallbacku; generowanie kursora uwzględnia bieżące `lang`.
  - `saveRecipe` — zapis wersji bazowej i locale; w pełni transakcyjnie.
- MVP:
  - Te same sygnatury z dodatkowym `lang`, ale ignorowane w logice zapytań (pozostaje obecne zachowanie). `saveRecipe` tylko zapisuje `language` do `recipes`.

## AI Service (`src/lib/services/ai/ai.service.ts`)
- Rekomendacja:
  - Zmienić sygnaturę `generateRecipe(prompt, profile, lang?: LanguageCode)`; provider dodaje do system prompt wymóg języka; walidacja rozmiaru bez zmian; eventy logują `language` w payload.
- MVP:
  - Dodać opcjonalny `lang` jako dodatkowy argument i tylko dokleić instrukcję językową do promptu; typy pozostawić bez zmian.

## Wyszukiwanie i indeksy (FTS)
- Problem: aktualnie `'simple'` (bez stemmingu) w triggerze i indeksie.
- Rekomendacja:
  - Dla `recipe_locales` generować `search_tsv` poprzez `to_tsvector(<config_for_lang>, normalize_text(...))`, z indeksami GIN per język. Zapytania `.textSearch('search_tsv', search)` będą skuteczniejsze.
- MVP:
  - Pozostawić `'simple'` i jeden `search_tsv`. Wyszukiwanie akceptowalne dla obu języków, bez stemmingu.

## Tagi, kody i lokalizacja
- Rekomendacja:
  - Nie lokalizować wartości domenowych (np. `tags`, `diet_type`, `preferred_cuisines`) w DB — przechowywać jako kanoniczne kody; lokalizacja tylko w UI. Udokumentować to w `API.md`.
- MVP: bez zmian.

## Nagłówki i błędy
- Rekomendacja:
  - Odpowiedzi treściowe: `Content-Language`. Zależność od nagłówka wejściowego: `Vary: Accept-Language`.
  - Komunikaty błędów: zwracać techniczne, angielskie; UI mapuje na przyjazne komunikaty (zgodne z `.ai/ui-plan.md`). Opcjonalnie dodać `code`/`i18n_key` w `ApiError`.
- MVP:
  - `Content-Language` tylko dla generacji i (opcjonalnie) szczegółu przepisu. Reszta bez zmian.

## Cache i klucze zapytań (UI)
- Rekomendacja:
  - Do kluczy TanStack Query dodać `lang`: `['recipes:list', params, lang]`, `['recipe', id, lang]`.
- MVP:
  - Przynajmniej szczegóły (`recipe:id:lang`) i generacja; lista może pozostać bez `lang` dopóki treść nie jest lokalizowana.

## Migracje bazy i kompatybilność
- Rekomendacja (pełna lokalizacja):
  1) Dodać `default_language` do `recipes` (wypełnić `'en'`),
  2) Utworzyć `recipe_locales` + triggery/indeksy (FTS per język),
  3) Zmigrować istniejące rekordy z `recipes.recipe` do `recipe_locales(lang=default_language)`,
  4) Przełączyć API/serwisy na `recipe_locales`,
  5) Docelowo wygasić `recipes.title/summary/ingredients_text/search_tsv`.
- MVP (proste):
  - Jedna migracja: `alter table recipes add column language text not null default 'en'` i uzupełnić istniejące dane. Triggery FTS bez zmian.

## Aktualizacje dokumentacji (`API.md`)
- Rekomendacja:
  - Dodać sekcję „Język odpowiedzi” (parametr `lang`, `Accept-Language`, `Content-Language`, fallbacki),
  - Zmiany kontraktu dla `/recipes` (list/get/save) i `/profile` (preferred_language),
  - Notatka: wartości domenowe (tags/diet_type) nie są lokalizowane; lokalizacja po stronie UI.
- MVP:
  - Udokumentować `lang` w `/recipes/generate`, ewentualnie nagłówki `Content-Language` i fakt, że treść przepisów nie jest lokalizowana w MVP.

## Ryzyka i edge cases
- Niespójność języka między profilem (disliked_ingredients) i treścią przepisu powoduje słabszą walidację (brak mapowania synonimów między językami).
- Starsze rekordy bez pola `language` wymagają migracji z wartością domyślną.
- FTS `'simple'` działa, ale bez stemmingu — gorsza jakość wyników.
- Ewentualne tłumaczenia on‑demand (AI) muszą respektować limit rozmiaru (>200KB odrzucone przez DB i serwis AI).

## Checklist implementacyjny — MVP (proponowana sekwencja)
1) Migracja: `recipes.language text not null default 'en'` (bez zmian triggerów/indeksów).
2) `/api/recipes/generate`: przyjmij `lang` (query/body), przekaż do AI providera (instrukcja „respond in <lang>”); zwróć `Content-Language`.
3) `RecipeListQuerySchema`: opcjonalny `lang` (na potrzeby kluczy cache UI); endpoint może ignorować.
4) `/api/recipes` (POST): opcjonalnie przyjmij `language` i zapisz do `recipes.language` (lub wywnioskuj z generacji jeśli zachodzi bezpośrednio po niej).
5) `/api/recipes/:id` (GET): opcjonalnie zwróć `Content-Language` na podstawie `recipes.language`.
6) `API.md`: dopisz sekcję o `lang` (generate) i brak lokalizacji treści w MVP.

## Checklist implementacyjny — wariant docelowy (recipe_locales)
1) Migracje: `recipes.default_language`, tabela `recipe_locales`, triggery i indeksy (FTS per język), migracja danych.
2) Zmiany typów/Zod: `LanguageCode`, `SaveRecipeCommand.language`, `RecipeQueryParams.lang`, `ProfileDTO.preferred_language` (+ Zod dla profilu).
3) Serwisy: `listRecipes/getRecipeDetails/saveRecipe` pracują na `recipe_locales` z fallbackiem.
4) Endpointy: `lang` (query/path/body) i nagłówki `Content-Language`/`Vary` konsekwentnie; `profiles` przyjmują/zwrot `preferred_language`.
5) Dokumentacja: pełna sekcja „Język odpowiedzi”, kontrakty z `lang`, opis fallbacków.

---

Uwagi końcowe:
- W kontekście `.ai/ui-plan.md` (MVP bez lokalizacji treści przepisów) najbardziej opłacalne jest wdrożenie lekkiego MVP: dodać `lang` do generacji i (opcjonalnie) przechowywać `recipes.language`. Pełna lokalizacja (`recipe_locales`) jest właściwym kierunkiem na później.
