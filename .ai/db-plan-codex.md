# Schemat Bazy Danych PostgreSQL - SavorAI (MVP)

## 0. Tabela zarządzana przez Supabase Auth

### `auth.users`
**UWAGA:** Ta tabela jest automatycznie tworzona i zarządzana przez system autentykacji Supabase. **NIE należy jej tworzyć ręcznie w migracjach.**

Tabela przechowuje dane użytkowników zarejestrowanych w systemie. Jest zarządzana przez wbudowany moduł Supabase Auth.

**Kluczowe kolumny wykorzystywane w projekcie:**
- `id` (`UUID`, `PRIMARY KEY`) - unikalny identyfikator użytkownika
- `email` (`TEXT`) - adres email użytkownika
- `created_at` (`TIMESTAMPTZ`) - data rejestracji
- `updated_at` (`TIMESTAMPTZ`) - data ostatniej aktualizacji

**Dostęp w politykach RLS:**
- Funkcja `auth.uid()` zwraca `id` aktualnie zalogowanego użytkownika
- Wszystkie tabele aplikacji (`profiles`, `recipes`, `events`) referencjonują `auth.users.id` jako klucz obcy

**Migracje:**
- W migracjach używaj `REFERENCES auth.users(id)` dla kluczy obcych
- Supabase automatycznie zapewnia istnienie tej tabeli w schemacie `auth`

## 1. Tabele aplikacyjne

### `profiles`
Przechowuje preferencje żywieniowe użytkowników (relacja 1:1 z `auth.users`).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `user_id` | `UUID` | `PRIMARY KEY`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Identyfikator użytkownika |
| `diet_type` | `TEXT` | `NULL`, `CHECK (diet_type IN ('vegan', 'vegetarian', 'pescatarian', 'keto', 'paleo', 'gluten_free', 'dairy_free', 'low_carb', 'mediterranean', 'omnivore'))` | Typ diety użytkownika |
| `disliked_ingredients` | `TEXT[]` | `NULL DEFAULT '{}'` | Tablica nielubiane składników (normalizowane do lowercase) |
| `preferred_cuisines` | `TEXT[]` | `NULL DEFAULT '{}'` | Tablica preferowanych kuchni (normalizowane do lowercase) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Data utworzenia profilu |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Data ostatniej modyfikacji |

### `recipes`
Przechowuje wygenerowane i zapisane przez użytkowników przepisy.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unikalny identyfikator przepisu |
| `user_id` | `UUID` | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Właściciel przepisu |
| `recipe` | `JSONB` | `NOT NULL`, `CHECK (octet_length(recipe::text) < 204800)` | Pełny przepis w formacie schema_v1 (limit ~200KB) |
| `tags` | `TEXT[]` | `NULL DEFAULT '{}'` | Tagi przepisu (normalizowane do lowercase) |
| `title` | `TEXT` | `NOT NULL` | Tytuł przepisu (kolumna pochodna z JSON) |
| `summary` | `TEXT` | `NULL` | Podsumowanie/opis przepisu (kolumna pochodna z JSON) |
| `ingredients_text` | `TEXT[]` | `NULL` | Spłaszczona lista składników jako tekst (kolumna pochodna z JSON) |
| `search_tsv` | `TSVECTOR` | `NULL` | Kolumna do wyszukiwania pełnotekstowego (generowana automatycznie) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Data dodania przepisu |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Data ostatniej modyfikacji |

### `events`
Przechowuje zdarzenia systemowe dla celów analitycznych i KPI.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unikalny identyfikator zdarzenia |
| `user_id` | `UUID` | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Użytkownik który wywołał zdarzenie |
| `type` | `TEXT` | `NOT NULL`, `CHECK (type IN ('session_start', 'profile_edited', 'ai_prompt_sent', 'ai_recipe_generated', 'recipe_saved'))` | Typ zdarzenia |
| `payload` | `JSONB` | `NULL` | Opcjonalne dane kontekstowe (np. prompt AI, błędy walidacji) |
| `occurred_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Timestamp zdarzenia |

## 2. Relacje między tabelami

### `profiles` ↔ `auth.users`
- **Relacja:** 1:1 (jeden użytkownik - jeden profil)
- **Klucz obcy:** `profiles.user_id` → `auth.users.id`
- **Kaskada:** `ON DELETE CASCADE`

### `recipes` ↔ `auth.users`
- **Relacja:** N:1 (wiele przepisów - jeden użytkownik)
- **Klucz obcy:** `recipes.user_id` → `auth.users.id`
- **Kaskada:** `ON DELETE CASCADE`

### `events` ↔ `auth.users`
- **Relacja:** N:1 (wiele zdarzeń - jeden użytkownik)
- **Klucz obcy:** `events.user_id` → `auth.users.id`
- **Kaskada:** `ON DELETE CASCADE`

## 3. Indeksy

### Tabela `profiles`
```sql
-- Automatyczny indeks na PRIMARY KEY (user_id)

-- Opcjonalne indeksy GIN dla filtrowania po preferencjach (jeśli potrzeba)
CREATE INDEX IF NOT EXISTS idx_profiles_disliked_ingredients ON profiles USING GIN(disliked_ingredients);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_cuisines ON profiles USING GIN(preferred_cuisines);
```

### Tabela `recipes`
```sql
-- Automatyczny indeks na PRIMARY KEY (id)

-- Indeks dla sortowania i paginacji "ostatnio dodane" z keyset
CREATE INDEX idx_recipes_user_created ON recipes(user_id, created_at DESC, id);

-- Indeks GIN dla filtrowania po tagach (logika OR)
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);

-- Indeks GIN dla wyszukiwania pełnotekstowego
CREATE INDEX idx_recipes_search_tsv ON recipes USING GIN(search_tsv);
```

### Tabela `events`
```sql
-- Automatyczny indeks na PRIMARY KEY (id)

-- Indeks dla filtrowania i sortowania zdarzeń
CREATE INDEX idx_events_user_occurred ON events(user_id, occurred_at DESC);

-- Indeks dla filtrowania po typie zdarzenia
CREATE INDEX idx_events_type_occurred ON events(type, occurred_at DESC);
```

## 4. Wyszukiwanie pełnotekstowe (FTS)

### Funkcja normalizacji tekstu (unaccent + lowercase)
```sql
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION normalize_text(text)
RETURNS text AS $$
  SELECT lower(unaccent($1));
$$ LANGUAGE SQL IMMUTABLE;
```

### Trigger automatycznej aktualizacji kolumn pochodnych w `recipes`
```sql
CREATE OR REPLACE FUNCTION update_recipes_derived_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Ekstrakcja title, summary, ingredients_text z JSONB
  NEW.title := COALESCE(NEW.recipe->>'title', '');
  NEW.summary := COALESCE(NEW.recipe->>'summary', NEW.recipe->>'description', '');

  -- Wyciągamy składniki jako tablicę tekstów
  NEW.ingredients_text := ARRAY(
    SELECT jsonb_array_elements_text(NEW.recipe->'ingredients')
  );

  -- Generowanie wektora wyszukiwania (z unaccent i normalizacją)
  NEW.search_tsv :=
    setweight(to_tsvector('simple', normalize_text(NEW.title)), 'A') ||
    setweight(to_tsvector('simple', normalize_text(COALESCE(NEW.summary, ''))), 'B') ||
    setweight(to_tsvector('simple', normalize_text(array_to_string(NEW.ingredients_text, ' '))), 'C');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipes_derived_columns
BEFORE INSERT OR UPDATE ON recipes
FOR EACH ROW
EXECUTE FUNCTION update_recipes_derived_columns();
```

### Normalizacja tagów i składników w profilu
```sql
CREATE OR REPLACE FUNCTION normalize_profile_arrays()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalizacja do lowercase dla konsystencji
  IF NEW.disliked_ingredients IS NOT NULL THEN
    NEW.disliked_ingredients := ARRAY(
      SELECT normalize_text(elem) FROM unnest(NEW.disliked_ingredients) AS elem
    );
  END IF;

  IF NEW.preferred_cuisines IS NOT NULL THEN
    NEW.preferred_cuisines := ARRAY(
      SELECT normalize_text(elem) FROM unnest(NEW.preferred_cuisines) AS elem
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_normalize_profile_arrays
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION normalize_profile_arrays();
```

## 5. Zasady RLS (Row-Level Security)

### Tabela `profiles`
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Polityka SELECT: użytkownik widzi tylko swój profil
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

-- Polityka INSERT: użytkownik może utworzyć tylko swój profil
CREATE POLICY "Users can create their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Polityka UPDATE: użytkownik może edytować tylko swój profil
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Polityka DELETE: użytkownik może usunąć tylko swój profil
CREATE POLICY "Users can delete their own profile"
ON profiles FOR DELETE
USING (auth.uid() = user_id);
```

### Tabela `recipes`
```sql
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Polityka SELECT: użytkownik widzi tylko swoje przepisy
CREATE POLICY "Users can view their own recipes"
ON recipes FOR SELECT
USING (auth.uid() = user_id);

-- Polityka INSERT: użytkownik może dodać przepis tylko do swojej kolekcji
CREATE POLICY "Users can create their own recipes"
ON recipes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Polityka DELETE: użytkownik może usunąć tylko swoje przepisy
CREATE POLICY "Users can delete their own recipes"
ON recipes FOR DELETE
USING (auth.uid() = user_id);

-- BRAK POLITYKI UPDATE - edycja przepisów wyłączona w MVP
```

### Tabela `events`
```sql
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Polityka INSERT: użytkownik może logować tylko swoje zdarzenia
CREATE POLICY "Users can create their own events"
ON events FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- BRAK polityk SELECT, UPDATE, DELETE - dostęp tylko przez service_role dla analityki
```

## 6. Funkcje RPC

### Funkcja bezpiecznego zapisu przepisu z walidacją "Unikaj"
```sql
CREATE OR REPLACE FUNCTION insert_recipe_safe(
  p_recipe jsonb,
  p_tags text[] DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
  v_disliked text[];
  v_ingredients text[];
  v_recipe_id uuid;
  v_ingredient text;
  v_disliked_item text;
BEGIN
  -- Pobierz user_id z kontekstu auth
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Pobierz listę nielubiane składników użytkownika
  SELECT disliked_ingredients INTO v_disliked
  FROM profiles
  WHERE user_id = v_user_id;

  IF v_disliked IS NULL THEN
    v_disliked := '{}';
  END IF;

  -- Wyciągnij składniki z przepisu
  v_ingredients := ARRAY(
    SELECT normalize_text(jsonb_array_elements_text(p_recipe->'ingredients'))
  );

  -- Sprawdź kolizję (case-insensitive, znormalizowane)
  FOREACH v_ingredient IN ARRAY v_ingredients LOOP
    FOREACH v_disliked_item IN ARRAY v_disliked LOOP
      IF v_ingredient LIKE '%' || v_disliked_item || '%' THEN
        RAISE EXCEPTION 'Recipe contains disliked ingredient: %', v_disliked_item;
      END IF;
    END LOOP;
  END LOOP;

  -- Wstaw przepis
  INSERT INTO recipes (user_id, recipe, tags)
  VALUES (v_user_id, p_recipe, p_tags)
  RETURNING id INTO v_recipe_id;

  -- Loguj zdarzenie recipe_saved
  INSERT INTO events (user_id, type, payload)
  VALUES (v_user_id, 'recipe_saved', jsonb_build_object('recipe_id', v_recipe_id));

  RETURN v_recipe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Funkcja eksportu zdarzeń do NDJSON (tylko service_role)
```sql
CREATE OR REPLACE FUNCTION export_events_ndjson(
  p_from_date timestamptz DEFAULT NULL,
  p_to_date timestamptz DEFAULT NULL
)
RETURNS TABLE (event_json jsonb) AS $$
BEGIN
  -- Tylko rola serwisowa może eksportować
  IF current_setting('request.jwt.claim.role', true) != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: service_role required';
  END IF;

  RETURN QUERY
  SELECT to_jsonb(e.*) AS event_json
  FROM events e
  WHERE (p_from_date IS NULL OR e.occurred_at >= p_from_date)
    AND (p_to_date IS NULL OR e.occurred_at <= p_to_date)
  ORDER BY e.occurred_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 7. Trigger automatycznej aktualizacji `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_recipes_updated_at
BEFORE UPDATE ON recipes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

## 8. Dodatkowe uwagi projektowe

### Normalizacja danych
Wszystkie dane tekstowe w tablicach (`disliked_ingredients`, `preferred_cuisines`, `tags`, `ingredients_text`) są automatycznie normalizowane do lowercase z usunięciem akcentów (`unaccent`) przez triggery. Zapewnia to spójność danych i skuteczne wyszukiwanie oraz walidację.

### Kolumny pochodne w `recipes`
Kolumny `title`, `summary`, `ingredients_text` i `search_tsv` są automatycznie generowane przez trigger `update_recipes_derived_columns` podczas INSERT/UPDATE. Źródłem prawdy pozostaje kolumna `recipe` (JSONB).

### Walidacja schema_v1
Walidacja struktury JSON przepisu względem `schema_v1` odbywa się w warstwie aplikacji przed wysłaniem do bazy. Opcjonalnie można rozszerzyć walidację o `pg_jsonschema` jeśli jest dostępny w środowisku Supabase.

### Blokada "Unikaj"
Funkcja RPC `insert_recipe_safe()` zapewnia bezpieczny INSERT z automatyczną walidacją kolizji składników z listą `disliked_ingredients` (case-insensitive, po normalizacji). Zaleca się używanie tej funkcji zamiast bezpośredniego INSERT w aplikacji.

### Brak edycji przepisów w MVP
Zgodnie z wymaganiami PRD, przepisy zapisane w bazie nie mogą być edytowane (tylko podgląd). Brak polityki UPDATE w RLS dla `recipes` wymusza tę zasadę na poziomie bazy danych.

### Hard delete przepisów
Usuwanie przepisów to hard-delete bez soft-delete (`deleted_at`). Zgodnie z decyzjami projektowymi dla MVP.

### Eksport NDJSON dla analityki
Dostęp do odczytu tabeli `events` jest ograniczony tylko do roli serwisowej (`service_role`). Funkcja `export_events_ndjson()` umożliwia eksport zdarzeń w formacie NDJSON dla potrzeb analizy KPI.

### Limity rozmiaru danych
- Kolumna `recipe` ma CHECK ograniczający rozmiar do ~200KB (`octet_length(recipe::text) < 204800`)
- Zaleca się również limitowanie długości elementów w tablicach `tags` i `ingredients_text` w warstwie aplikacji

### Paginacja keyset
Indeks `idx_recipes_user_created` na `(user_id, created_at DESC, id)` wspiera wydajną paginację keyset dla listy "ostatnio dodane" przepisy. Zalecane podejście do paginacji zamiast OFFSET/LIMIT.

### Język FTS
Używany jest słownik `simple` z `unaccent` dla wsparcia wielojęzycznego. Dla lepszego wsparcia języka polskiego można rozważyć konfigurację słownika `polish` (jeśli dostępny w Supabase).

### Przygotowanie do partycjonowania
Tabela `events` zawiera kolumnę `occurred_at`, która umożliwi przyszłe partycjonowanie po dacie (miesięczne/roczne) gdy wolumen danych przekroczy 1M wierszy. W MVP partycjonowanie nie jest implementowane.

### CASCADE przy usunięciu użytkownika
Wszystkie klucze obce do `auth.users(id)` mają ustawione `ON DELETE CASCADE`, co automatycznie usuwa wszystkie powiązane dane użytkownika (profil, przepisy, zdarzenia) przy usunięciu konta.

### Schema `public`
Wszystkie tabele aplikacyjne są tworzone w domyślnym schemacie `public`. Schemat `auth` jest zarezerwowany dla tabel zarządzanych przez Supabase Auth.

### Automatyczne logowanie zdarzeń
Funkcja `insert_recipe_safe()` automatycznie loguje zdarzenie `recipe_saved` do tabeli `events`. Inne zdarzenia (`session_start`, `profile_edited`, `ai_prompt_sent`, `ai_recipe_generated`) powinny być logowane przez warstwę aplikacji.