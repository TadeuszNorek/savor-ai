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
Przechowuje preferencje żywieniowe użytkowników.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `user_id` | `UUID` | `PRIMARY KEY`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Identyfikator użytkownika |
| `diet_type` | `diet_type_enum` | `NULL` | Typ diety użytkownika |
| `disliked_ingredients` | `TEXT[]` | `NULL DEFAULT '{}'` | Tablica nielubiane składników |
| `preferred_cuisines` | `TEXT[]` | `NULL DEFAULT '{}'` | Tablica preferowanych kuchni |
| `dark_mode_enabled` | `BOOLEAN` | `NOT NULL DEFAULT false` | Preferencja trybu ciemnego |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Data utworzenia profilu |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Data ostatniej modyfikacji |

**Typ ENUM:**
```sql
CREATE TYPE diet_type_enum AS ENUM (
  'vegan',
  'vegetarian',
  'pescatarian',
  'keto',
  'paleo',
  'gluten_free',
  'dairy_free',
  'low_carb',
  'mediterranean',
  'omnivore'
);
```

### `recipes`
Przechowuje wygenerowane i zapisane przez użytkowników przepisy.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Unikalny identyfikator przepisu |
| `user_id` | `UUID` | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Właściciel przepisu |
| `recipe_json` | `JSONB` | `NOT NULL` | Pełny przepis w formacie schema_v1 |
| `title` | `TEXT` | `NOT NULL` | Tytuł przepisu (denormalizowany z JSON) |
| `description` | `TEXT` | `NULL` | Opis przepisu (denormalizowany z JSON) |
| `tags` | `TEXT[]` | `NULL DEFAULT '{}'` | Tagi przepisu |
| `search_vector` | `TSVECTOR` | `NULL` | Kolumna do wyszukiwania pełnotekstowego |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Data dodania przepisu |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Data ostatniej modyfikacji |

### `events`
Przechowuje zdarzenia systemowe dla celów analitycznych i KPI.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Unikalny identyfikator zdarzenia |
| `user_id` | `UUID` | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE` | Użytkownik który wywołał zdarzenie |
| `event_type` | `TEXT` | `NOT NULL`, `CHECK (event_type IN ('session_start', 'profile_edited', 'ai_prompt_sent', 'ai_recipe_generated', 'recipe_saved'))` | Typ zdarzenia |
| `event_data` | `JSONB` | `NULL` | Opcjonalne dane kontekstowe |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Timestamp zdarzenia |

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
```

### Tabela `recipes`
```sql
-- Automatyczny indeks na PRIMARY KEY (id)
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX idx_recipes_search_vector ON recipes USING GIN(search_vector);
```

### Tabela `events`
```sql
-- Automatyczny indeks na PRIMARY KEY (id)
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_type_created ON events(event_type, created_at DESC);
```

## 4. Wyszukiwanie pełnotekstowe (FTS)

### Trigger automatycznej aktualizacji `search_vector`
```sql
CREATE OR REPLACE FUNCTION update_recipes_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string((NEW.recipe_json->'ingredients')::TEXT[], ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipes_search_vector
BEFORE INSERT OR UPDATE ON recipes
FOR EACH ROW
EXECUTE FUNCTION update_recipes_search_vector();
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

-- Polityka UPDATE: użytkownik może edytować tylko swoje przepisy
CREATE POLICY "Users can update their own recipes"
ON recipes FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Polityka DELETE: użytkownik może usunąć tylko swoje przepisy
CREATE POLICY "Users can delete their own recipes"
ON recipes FOR DELETE
USING (auth.uid() = user_id);
```

### Tabela `events`
```sql
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Polityka INSERT: użytkownik może logować tylko swoje zdarzenia
CREATE POLICY "Users can create their own events"
ON events FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Brak polityk SELECT, UPDATE, DELETE - dostęp tylko przez service_role dla analityki
```

## 6. Dodatkowe uwagi projektowe

### Denormalizacja w tabeli `recipes`
Kolumny `title` i `description` są celowo denormalizowane z `recipe_json` aby:
- Uprościć zapytania wyszukiwania i wyświetlania list
- Poprawić wydajność indeksów FTS
- Umożliwić szybkie sortowanie bez parsowania JSON

### Obsługa JSON Schema v1
Kolumna `recipe_json` przechowuje pełną strukturę przepisu zgodną z schema_v1. Walidacja schematu powinna odbywać się w warstwie aplikacji przed zapisem do bazy.

### Eksport zdarzeń do NDJSON
Administratorzy mogą eksportować dane z tabeli `events` przy użyciu klucza `service_role` Supabase, który omija polityki RLS:
```sql
SELECT jsonb_build_object(
  'user_id', user_id,
  'event_type', event_type,
  'event_data', event_data,
  'created_at', created_at
)
FROM events
ORDER BY created_at;
```

### Przygotowanie do partycjonowania
Tabela `events` zawiera kolumnę `created_at`, która umożliwi przyszłe partycjonowanie po dacie, gdy wolumen danych wzrośnie.

### Timestamp automatyczny
Wszystkie tabele posiadają kolumny `created_at` i `updated_at` (z wyjątkiem `events`, która ma tylko `created_at`). Kolumna `updated_at` powinna być aktualizowana automatycznie przez trigger:

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
