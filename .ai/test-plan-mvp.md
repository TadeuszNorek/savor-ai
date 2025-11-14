# Plan Testów MVP - SavorAI

## 1. Wprowadzenie i cele testowania

### 1.1 Cel dokumentu
Plan testów dla MVP aplikacji SavorAI - platformy do generowania i zarządzania przepisami kulinarnymi przy użyciu AI.

### 1.2 Cele testowania MVP
- Zapewnienie poprawności kluczowych funkcji MVP (zgodnie z PRD)
- Weryfikacja bezpieczeństwa (RLS, autentykacja)
- Potwierdzenie poprawności integracji z Supabase i AI providers
- Identyfikacja i eliminacja błędów krytycznych przed wdrożeniem
- Osiągnięcie minimalnego poziomu jakości dla publicznego uruchomienia

### 1.3 Zakres MVP
Test plan pokrywa 15 user stories z PRD (US-001 do US-016), koncentrując się na:
- Autentykacja i RLS (US-001, US-014)
- Profil użytkownika i dark mode (US-002, US-003)
- Generowanie przepisów AI (US-004, US-005)
- Blokada "Unikaj" (US-007)
- CRUD przepisów (US-008, US-009, US-011)
- Wyszukiwanie i filtrowanie (US-010)
- Events logging dla KPI (US-013, US-015)

## 2. Zakres testów

### 2.1 Obszary objęte testami

#### Frontend
- Komponenty React (AppShell, Header, ProfileForm, AppLayout, GeneratorPanel, RecipeList)
- Komponenty UI (shadcn/ui)
- Zarządzanie stanem (React Query, sessionStorage)
- Routing (Astro routes)
- Responsywność (mobile, tablet, desktop)
- Dark mode

#### Backend
- Endpointy API (/api/recipes, /api/profile, /api/events)
- Integracja z Supabase (Auth, Database, RLS)
- Funkcje RPC PostgreSQL (insert_recipe_safe, export_events_ndjson)
- Middleware autentykacji

#### AI Integration
- Providery AI (OpenRouter, Google AI, Mock)
- Generowanie przepisów
- Obsługa timeoutów i błędów
- Walidacja RecipeSchema

#### Baza danych
- Schema i constraints
- Row Level Security (RLS)
- Funkcje i triggers

### 2.2 Obszary wyłączone z MVP
- Load testing i stress testing (>100 concurrent users)
- Visual regression testing (Percy/Chromatic)
- Penetration testing (podstawowa weryfikacja manualna wystarczy)
- Advanced performance optimization
- A/B testing infrastructure

## 3. Typy testów

### 3.1 Testy jednostkowe (Unit Tests)
**Narzędzia:** Vitest, @testing-library/react

**Zakres:**
- Funkcje utility (`normalizeStringArray`, `hasAtLeastOneField`, `isFormDirty`)
- Type guards (`isEventType`, `isDietType`, `isRecipeDifficulty`)
- Mappery danych (profile mappers, DTO transformations)
- Walidatory (prompt validation, RecipeSchema validation)
- Hooki React (useAuth, useUrlFilters, useScrollRestoration)
- Komponenty prezentacyjne (Button, Card, Alert, Badge)

**Kryteria akceptacji:**
- Pokrycie kodu minimum 80%
- Wszystkie edge cases obsłużone
- Czas wykonania < 30 sekund

### 3.2 Testy integracyjne (Integration Tests)
**Narzędzia:** Vitest, MSW (Mock Service Worker), @testing-library/react

**Zakres:**
- Integracja komponentów z React Query
- API endpoints z Supabase Client
- Funkcje RPC PostgreSQL (insert_recipe_safe)
- AI providers z mock responses
- Middleware autentykacji

**Scenariusze kluczowe:**
- Logowanie → pobieranie profilu → wyświetlenie danych
- Generowanie przepisu → zapis do bazy → wyświetlenie na liście
- Filtrowanie przepisów → aktualizacja URL → refetch danych
- Edycja profilu → walidacja → zapis → invalidacja cache
- Usunięcie przepisu → refetch listy

**Kryteria akceptacji:**
- Wszystkie główne user flows przetestowane
- Mock API responses realistyczne
- Testy izolowane (bez prawdziwych API calls)

### 3.3 Testy E2E (End-to-End Tests)
**Narzędzia:** Playwright

**Scenariusze krytyczne:**

#### E2E-001: Rejestracja i pierwszy przepis
1. Rejestracja przez /login
2. Utworzenie profilu z preferencjami
3. Generowanie pierwszego przepisu AI
4. Zapis przepisu
5. Weryfikacja na liście

#### E2E-002: Zarządzanie przepisami
1. Logowanie
2. Wyszukiwanie przepisów po nazwie
3. Filtrowanie po tagach
4. Otwieranie szczegółów
5. Usuwanie przepisu

#### E2E-003: Blokada "Unikaj"
1. Logowanie
2. Edycja profilu - dodanie dislikedIngredients
3. Generowanie przepisu z disliked ingredient
4. Weryfikacja blokady zapisu
5. Komunikat ostrzegawczy

#### E2E-004: Responsywność
1. Desktop (1920x1080)
2. Tablet (768x1024)
3. Mobile (375x667)
4. Collapsible panels
5. Dark mode switch

**Kryteria akceptacji:**
- Wszystkie krytyczne scenariusze przechodzą
- Testy działają na Chrome, Firefox
- Czas wykonania < 10 minut

### 3.4 Testy API (API Tests)
**Narzędzia:** Vitest, Supertest

**Testowane endpointy:**

#### POST /api/recipes/generate
- ✅ 200: Poprawne generowanie
- ❌ 400: Pusty prompt
- ❌ 400: Prompt > 2000 znaków
- ❌ 401: Brak autoryzacji
- ❌ 413: Response > 200KB

#### GET /api/recipes
- ✅ 200: Lista przepisów użytkownika
- ✅ 200: Filtrowanie po search query
- ✅ 200: Filtrowanie po tagach
- ✅ 200: Sortowanie (recent)
- ❌ 401: Brak autoryzacji

#### POST /api/recipes
- ✅ 201: Zapis poprawnego przepisu
- ❌ 400: Niepoprawny RecipeSchema
- ❌ 401: Brak autoryzacji
- ❌ 409: Przepis zawiera disliked ingredients (via RPC)

#### DELETE /api/recipes/:id
- ✅ 204: Usunięcie własnego przepisu
- ❌ 401: Brak autoryzacji
- ❌ 403: Próba usunięcia cudzego przepisu (RLS)
- ❌ 404: Nieistniejący przepis

#### GET /api/profile
- ✅ 200: Zwrócenie profilu użytkownika
- ❌ 401: Brak autoryzacji

#### POST /api/profile
- ✅ 201: Utworzenie profilu
- ❌ 400: Brak wymaganych pól
- ❌ 401: Brak autoryzacji

#### PUT /api/profile
- ✅ 200: Aktualizacja profilu
- ❌ 400: Niepoprawne dane
- ❌ 401: Brak autoryzacji

#### POST /api/events
- ✅ 201: Logowanie zdarzenia
- ❌ 400: Niepoprawny event type
- ❌ 401: Brak autoryzacji

### 3.5 Testy bezpieczeństwa (Security Tests)

#### Row Level Security (RLS)
- ✅ Test dostępu do własnych przepisów
- ❌ Test blokady dostępu do cudzych przepisów
- ✅ Test dostępu do własnego profilu
- ❌ Test blokady dostępu do cudzego profilu

#### Autentykacja
- Test sesji użytkownika
- Test wygasania sesji
- Test logout
- Test próby dostępu bez tokenu (401)

#### Walidacja danych
- Test SQL injection w search query
- Test XSS przez user-generated content (tags, titles)
- Test niepoprawnych typów w RecipeSchema

#### Secrets management
- Weryfikacja, że API keys nie są eksponowane do frontendu
- Sprawdzenie SUPABASE_KEY vs PUBLIC_SUPABASE_KEY

**Kryteria akceptacji:**
- Zero luk w RLS policies
- Wszystkie user inputs sanitized
- API keys bezpieczne

### 3.6 Testy wydajnościowe (Podstawowe)
**Narzędzia:** Lighthouse

**Zakres MVP:**
- Lighthouse score > 80 (Performance, Accessibility, Best Practices, SEO)
- First Contentful Paint (FCP) < 2s
- Largest Contentful Paint (LCP) < 3s
- Cumulative Layout Shift (CLS) < 0.1
- Bundle size < 300KB (gzipped)
- API response time < 500ms (p95)
- Database query time < 100ms (p95)

**Post-MVP:** Load testing z k6, stress testing

### 3.7 Testy UI/UX

#### Responsywność
- Desktop: 1920x1080, 1366x768
- Tablet: 1024x768, 768x1024
- Mobile: 375x667 (iPhone SE), 414x896 (iPhone 11)
- Collapsible panels działają poprawnie
- Touch targets min 44x44px na mobile

#### Dark Mode
- Wszystkie komponenty w obu motywach
- Kontrast zgodny z WCAG AA
- Persistence w localStorage
- Brak flashu przy ładowaniu

#### Accessibility (podstawowe)
- Keyboard navigation (Tab, Enter, Escape)
- ARIA labels dla interactive elements
- Focus indicators
- Color contrast WCAG AA
- Semantic HTML

#### Browser Compatibility
- Chrome (latest)
- Firefox (latest)
- Safari (latest - desktop i mobile)

**Kryteria akceptacji:**
- Podstawowa keyboard navigation działa
- 0 critical issues w axe DevTools
- Działa na target browsers

## 4. Scenariusze testowe

### 4.1 Autentykacja użytkownika

#### TC-AUTH-001: Rejestracja nowego użytkownika
**Priorytet:** P0
**Typ:** E2E

**Kroki:**
1. Otwórz /login
2. Wpisz email: `test@example.com`
3. Wpisz hasło: `SecurePass123!`
4. Kliknij "Sign Up"
5. Przekierowanie do /app

**Oczekiwany rezultat:**
- Użytkownik utworzony w Supabase Auth
- Rekord w tabeli profiles (via trigger)
- Redirect do /app
- Event `session_start` zalogowany

#### TC-AUTH-002: Logowanie istniejącego użytkownika
**Priorytet:** P0
**Typ:** E2E

**Kroki:**
1. Otwórz /login
2. Wpisz poprawny email i hasło
3. Kliknij "Sign In"

**Oczekiwany rezultat:**
- Access token w session
- Redirect do /app
- Header wyświetla email użytkownika
- Event `session_start` zalogowany

#### TC-AUTH-003: Wylogowanie
**Priorytet:** P0
**Typ:** E2E

**Kroki:**
1. Zaloguj się
2. Kliknij UserMenu
3. Kliknij "Logout"

**Oczekiwany rezultat:**
- Session cleared
- Redirect do /login
- Brak dostępu do /app (401 redirect)

#### TC-AUTH-004: Próba dostępu bez autentykacji
**Priorytet:** P0
**Typ:** Integration

**Kroki:**
1. Bez zalogowania otwórz /app
2. Bez zalogowania wywołaj GET /api/recipes

**Oczekiwany rezultat:**
- Redirect do /login
- API zwraca 401 Unauthorized

### 4.2 Generowanie przepisów AI

#### TC-GEN-001: Generowanie przepisu z poprawnym promptem
**Priorytet:** P0
**Typ:** E2E

**Kroki:**
1. Zaloguj się
2. Przejdź do Generator tab
3. Wpisz prompt: "Quick pasta with tomatoes and basil"
4. Kliknij "Generate recipe"
5. Poczekaj na response (max 30s)

**Oczekiwany rezultat:**
- Loading indicator pokazany
- Po zakończeniu: RecipeSchema wyświetlony w Preview
- Draft zapisany w sessionStorage
- Event `ai_prompt_sent` i `ai_recipe_generated` zalogowane

#### TC-GEN-002: Generowanie z pustym promptem
**Priorytet:** P1
**Typ:** Unit

**Kroki:**
1. Prompt = ""
2. Kliknij "Generate recipe"

**Oczekiwany rezultat:**
- Button disabled
- Brak API call

#### TC-GEN-003: Generowanie z promptem > 2000 znaków
**Priorytet:** P1
**Typ:** Integration

**Kroki:**
1. Wpisz prompt z 2001 znakami
2. Kliknij "Generate recipe"

**Oczekiwany rezultat:**
- API zwraca 400 Bad Request
- Error message: "Prompt must be between 1-2000 characters"

#### TC-GEN-004: AI zwraca niepoprawny JSON
**Priorytet:** P1
**Typ:** Integration

**Kroki:**
1. Mock AI provider zwraca malformed JSON
2. Generuj przepis

**Oczekiwany rezultat:**
- Error handling
- Error message: "Failed to parse AI response"
- Użytkownik może retry
- Automatic retry (1×) wykonany

#### TC-GEN-005: Edukacyjne placeholdery
**Priorytet:** P2
**Typ:** E2E

**Kroki:**
1. Otwórz Generator
2. Zobacz placeholdery/chipy
3. Kliknij chip "Obiad śródziemnomorski 30 min"

**Oczekiwany rezultat:**
- Chip wstawia tekst do promptu
- Użytkownik może edytować i wysłać

### 4.3 Zapisywanie przepisów

#### TC-SAVE-001: Zapis wygenerowanego przepisu
**Priorytet:** P0
**Typ:** E2E

**Kroki:**
1. Wygeneruj przepis AI
2. W Preview kliknij "Save recipe"
3. Opcjonalnie dodaj tagi
4. Potwierdź zapis

**Oczekiwany rezultat:**
- Przepis zapisany w tabeli recipes
- Event `recipe_saved` zalogowany
- Przepis pojawia się na liście
- Toast "Recipe saved successfully"
- Draft usunięty z sessionStorage

#### TC-SAVE-002: Blokada zapisu z disliked ingredients
**Priorytet:** P0
**Typ:** Integration

**Kroki:**
1. Profil ma dislikedIngredients = ["garlic"]
2. Przepis zawiera "garlic" w ingredients
3. Próbuj zapisać przepis

**Oczekiwany rezultat:**
- insert_recipe_safe RPC zwraca error
- API zwraca 409 Conflict
- Error message: "Recipe contains disliked ingredients: garlic"
- Przycisk "Save" disabled lub komunikat ostrzegawczy
- Przepis NIE zapisany

#### TC-SAVE-003: Zapis przepisu > 200KB
**Priorytet:** P1
**Typ:** Integration

**Kroki:**
1. RecipeSchema z bardzo długimi polami (>200KB total)
2. Próbuj zapisać

**Oczekiwany rezultat:**
- API zwraca 413 Payload Too Large
- Error message: "Recipe exceeds 200KB limit"

#### TC-SAVE-004: Walidacja RecipeSchema
**Priorytet:** P1
**Typ:** Unit

**Testowane przypadki:**
- Brak title → error
- prep_time_minutes < 0 → error
- servings < 1 → error
- difficulty nie w ["easy", "medium", "hard"] → error
- ingredients nie array → error
- instructions nie array → error

### 4.4 Wyszukiwanie i filtrowanie

#### TC-SEARCH-001: Full-text search
**Priorytet:** P1
**Typ:** Integration

**Kroki:**
1. Użytkownik ma przepisy: "Pasta Carbonara", "Chicken Pasta", "Tomato Soup"
2. Wpisz w search: "pasta"
3. Naciśnij Enter

**Oczekiwany rezultat:**
- Zwrócone 2 przepisy: "Pasta Carbonara", "Chicken Pasta"
- URL zaktualizowany: ?search=pasta
- List refetch wykonany

#### TC-SEARCH-002: Filtrowanie po tagach (OR logic)
**Priorytet:** P1
**Typ:** E2E

**Kroki:**
1. Przepisy z tagami: ["italian"], ["italian", "quick"], ["vegan"]
2. Wybierz tagi: "italian", "vegan"

**Oczekiwany rezultat:**
- Zwrócone przepisy z tagiem "italian" LUB "vegan" (wszystkie 3)
- URL: ?tags=italian,vegan
- Tag chips aktywne

#### TC-SEARCH-003: Sortowanie
**Priorytet:** P2
**Typ:** E2E

**Kroki:**
1. Lista przepisów z różnymi created_at
2. Domyślny sort "recent"

**Oczekiwany rezultat:**
- Lista posortowana od najnowszego
- Najnowszy przepis na górze

#### TC-SEARCH-004: Puste stany
**Priorytet:** P2
**Typ:** E2E

**Kroki:**
1. Nowy użytkownik bez przepisów
2. Otwórz /app

**Oczekiwany rezultat:**
- Empty state wyświetlony
- CTA "Generate your first recipe"
- Komunikat edukacyjny

### 4.5 Zarządzanie profilem

#### TC-PROFILE-001: Utworzenie profilu (pierwszy login)
**Priorytet:** P0
**Typ:** E2E

**Kroki:**
1. Nowy użytkownik (bez profilu)
2. Otwórz /profile
3. Wybierz dietType: "vegan"
4. Dodaj dislikedIngredients: "garlic", "onion"
5. Dodaj preferredCuisines: "italian"
6. Kliknij "Create Profile"

**Oczekiwany rezultat:**
- Profil utworzony (POST /api/profile)
- Toast "Profile created successfully"
- Event `profile_edited` zalogowany
- Query cache invalidated
- KPI-1: profil ma co najmniej jedno pole wypełnione

#### TC-PROFILE-002: Edycja istniejącego profilu
**Priorytet:** P1
**Typ:** E2E

**Kroki:**
1. Użytkownik z profilem
2. Zmień dietType z "vegan" na "vegetarian"
3. Kliknij "Save Changes"

**Oczekiwany rezultat:**
- Profil zaktualizowany (PUT /api/profile)
- Toast "Profile updated successfully"
- Event `profile_edited` zalogowany

#### TC-PROFILE-003: Walidacja - brak pól
**Priorytet:** P1
**Typ:** Unit

**Kroki:**
1. Wszystkie pola puste
2. Kliknij "Create Profile"

**Oczekiwany rezultat:**
- Error: "At least one field must be filled"
- Button disabled
- Brak API call

#### TC-PROFILE-004: Dark mode
**Priorytet:** P2
**Typ:** E2E

**Kroki:**
1. Zaloguj się
2. Przełącz dark mode
3. Odśwież stronę

**Oczekiwany rezultat:**
- Dark mode aktywny
- Preferencja zapisana w localStorage
- Dark mode NIE wpływa na KPI-1 (nie jest polem profilu)

### 4.6 Usuwanie przepisów

#### TC-DELETE-001: Usunięcie przepisu z potwierdzeniem
**Priorytet:** P1
**Typ:** E2E

**Kroki:**
1. Otwórz szczegóły przepisu
2. Kliknij "Delete recipe"
3. Dialog potwierdzenia wyświetlony
4. Kliknij "Delete" w dialogu

**Oczekiwany rezultat:**
- API DELETE /api/recipes/:id wywołane
- 204 No Content
- Przepis usunięty z bazy
- Redirect do /app
- Przepis zniknął z listy
- Query cache invalidated

#### TC-DELETE-002: Próba usunięcia cudzego przepisu (RLS)
**Priorytet:** P0
**Typ:** Security

**Kroki:**
1. User A próbuje wywołać DELETE /api/recipes/:id dla przepisu User B

**Oczekiwany rezultat:**
- RLS blokuje operację
- 403 Forbidden
- Error message: "You don't have permission to delete this recipe"

### 4.7 Events logging (KPI)

#### TC-EVENTS-001: Session start
**Priorytet:** P1
**Typ:** Integration

**Kroki:**
1. Użytkownik loguje się

**Oczekiwany rezultat:**
- Event `session_start` zapisany w tabeli events
- Timestamp i user_id poprawne
- KPI-2: event liczony do AUW

#### TC-EVENTS-002: Profile edited
**Priorytet:** P1
**Typ:** Integration

**Kroki:**
1. Użytkownik edytuje profil

**Oczekiwany rezultat:**
- Event `profile_edited` zapisany
- Timestamp i user_id poprawne

#### TC-EVENTS-003: AI recipe generated
**Priorytet:** P1
**Typ:** Integration

**Kroki:**
1. Użytkownik generuje przepis

**Oczekiwany rezultat:**
- Event `ai_prompt_sent` zapisany
- Event `ai_recipe_generated` zapisany po sukcesie
- KPI-2: event `ai_recipe_generated` liczony do aktywności generowania

#### TC-EVENTS-004: Recipe saved
**Priorytet:** P1
**Typ:** Integration

**Kroki:**
1. Użytkownik zapisuje przepis

**Oczekiwany rezultat:**
- Event `recipe_saved` zapisany
- Timestamp i user_id poprawne

#### TC-EVENTS-005: Eksport NDJSON
**Priorytet:** P2
**Typ:** API

**Kroki:**
1. Wywołaj funkcję export_events_ndjson

**Oczekiwany rezultat:**
- Eksport zwraca NDJSON
- Format zgodny z dokumentacją
- Możliwość agregacji KPI

## 5. Środowisko testowe

### 5.1 Środowiska

#### Development
- **URL:** http://localhost:4321
- **Database:** Supabase local (Docker)
- **AI Provider:** Mock provider (zero costs)
- **Cel:** Development i unit tests

#### Staging
- **URL:** https://staging.savorai.app (opcjonalne)
- **Database:** Supabase staging project
- **AI Provider:** Mock/OpenRouter (limited budget)
- **Cel:** Integration tests, E2E tests

#### Production
- **URL:** https://savorai.app
- **Database:** Supabase production
- **AI Provider:** OpenRouter/Google AI
- **Cel:** Smoke tests po deployment

### 5.2 Konfiguracja środowiska testowego

#### Local Development Setup
```bash
# Install dependencies
npm install

# Setup Supabase local (opcjonalne)
npx supabase init
npx supabase start

# Run migrations
npm run db:migrate

# Start dev server
npm run dev
```

#### Environment Variables (.env.test)
```
# Supabase
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=<anon-key>
PUBLIC_SUPABASE_URL=http://localhost:54321
PUBLIC_SUPABASE_KEY=<anon-key>

# AI Provider (mock for tests)
AI_PROVIDER=mock
AI_TIMEOUT_MS=5000
```

### 5.3 Test Database
- Izolowana instancja dla testów
- Reset przed każdym testem suite
- Seed data:
  - 2-3 test users
  - 10-20 test recipes
  - Sample profiles
  - Sample events

### 5.4 Mock Services
- **Mock AI Provider:** Zwraca statyczne przepisy w <1s
- **MSW (Mock Service Worker):** Mockowanie HTTP requests

## 6. Narzędzia do testowania

### 6.1 Framework testowy
- **Vitest** - Unit i integration tests
  - Native ESM support
  - Compatible z Vite ecosystem
  - Coverage reports (c8)

### 6.2 Testing Library
- **@testing-library/react** - Component tests
  - User-centric testing
  - Accessibility-focused

### 6.3 E2E Testing
- **Playwright** - End-to-end tests
  - Multi-browser support
  - Auto-wait mechanisms
  - Screenshot/video recording

### 6.4 API Testing
- **Supertest** - HTTP assertions
- **MSW** - Mock Service Worker

### 6.5 Performance Testing (MVP)
- **Lighthouse** - Basic performance audits
- **Chrome DevTools** - Manual performance checks

### 6.6 Accessibility Testing
- **axe-core** - Automated a11y testing
- **@axe-core/playwright** - Integration z Playwright

### 6.7 Code Quality
- **ESLint** - Linting
- **TypeScript** - Type checking
- **Prettier** - Code formatting

### 6.8 CI/CD
- **GitHub Actions** - Automation pipeline
  - Test runner
  - Coverage reports
  - Deployment gates

## 7. Harmonogram testów MVP (4 tygodnie)

### Tydzień 1: Przygotowanie i Unit Tests
**Dzień 1-2:** Setup środowiska testowego
- Instalacja narzędzi (Vitest, Playwright, MSW)
- Konfiguracja test environment
- Setup mock services (Mock AI Provider)
- Przygotowanie test fixtures

**Dzień 3-5:** Testy jednostkowe
- Utility functions (normalizeStringArray, hasAtLeastOneField, etc.)
- Type guards (isEventType, isDietType, isRecipeDifficulty)
- Validators (prompt validation, RecipeSchema)
- Mappers (profile mappers, DTO transformations)
- React hooks (useAuth, useUrlFilters)

**Cel tygodnia:**
- ✅ Środowisko testowe gotowe
- ✅ 80% coverage dla utilities i hooks
- ✅ Unit tests < 30s execution time

### Tydzień 2: Integration Tests i API Tests
**Dzień 1-2:** API endpoints
- POST /api/recipes/generate (wszystkie przypadki)
- GET /api/recipes (lista, search, filtering)
- POST /api/recipes (zapis, walidacja)
- DELETE /api/recipes/:id

**Dzień 3-4:** Profile i Events
- GET/POST/PUT /api/profile
- POST /api/events
- Funkcje RPC (insert_recipe_safe, export_events_ndjson)

**Dzień 5:** React Query integration
- Integracja komponentów z API
- Cache invalidation
- Error handling

**Cel tygodnia:**
- ✅ Wszystkie API endpoints pokryte
- ✅ RPC functions przetestowane
- ✅ Integration tests < 2 minuty

### Tydzień 3: E2E Tests i Security
**Dzień 1:** Auth flows
- TC-AUTH-001: Rejestracja
- TC-AUTH-002: Logowanie
- TC-AUTH-003: Wylogowanie
- TC-AUTH-004: Unauthorized access

**Dzień 2:** Recipe generation i save
- TC-GEN-001: Generowanie przepisu
- TC-GEN-002, 003, 004: Edge cases
- TC-SAVE-001: Zapis przepisu
- TC-SAVE-002: Blokada "Unikaj"

**Dzień 3:** Recipe management
- TC-SEARCH-001, 002: Wyszukiwanie i filtrowanie
- TC-DELETE-001: Usuwanie
- TC-EVENTS-001 do 005: Events logging

**Dzień 4:** Profile management
- TC-PROFILE-001: Utworzenie profilu
- TC-PROFILE-002: Edycja
- TC-PROFILE-004: Dark mode

**Dzień 5:** Security (RLS)
- TC-DELETE-002: RLS dla recipes
- RLS dla profiles
- Input validation i sanitization
- Secrets management verification

**Cel tygodnia:**
- ✅ Wszystkie critical E2E scenarios przechodzą
- ✅ RLS policies zweryfikowane (zero luk)
- ✅ E2E tests < 10 minut

### Tydzień 4: UI/UX, Performance i Bug Fixes
**Dzień 1:** Responsywność
- Desktop (1920x1080, 1366x768)
- Tablet (768x1024)
- Mobile (375x667, 414x896)
- Collapsible panels
- Touch targets

**Dzień 2:** Dark mode i accessibility
- Dark mode w wszystkich komponentach
- Kontrast WCAG AA
- Keyboard navigation
- ARIA labels
- axe DevTools audit

**Dzień 3:** Cross-browser testing
- Chrome (latest)
- Firefox (latest)
- Safari (desktop i mobile)
- Edge (latest)

**Dzień 4:** Performance
- Lighthouse audit (target >80)
- Bundle size check (<300KB)
- API response times
- Database query performance

**Dzień 5:** Bug fixes i finalizacja
- Fix P0/P1 bugs
- Regression testing
- Test documentation update
- Final smoke tests

**Cel tygodnia:**
- ✅ Lighthouse score > 80
- ✅ 0 P0 bugs, max 5 P1 bugs
- ✅ WCAG AA basics met
- ✅ Cross-browser compatibility OK

### Utrzymanie (Ciągłe)
- **Daily:** Unit tests na PR
- **Daily:** Integration tests na PR
- **Pre-deployment:** E2E tests smoke suite
- **Post-deployment:** Basic smoke tests
- **Weekly:** Coverage report review

## 8. Kryteria akceptacji

### 8.1 Kryteria wejścia (Entry Criteria)
- ✅ Kod zmergowany do branch testowego
- ✅ Build przechodzi (npm run build)
- ✅ Linter przechodzi (npm run lint)
- ✅ TypeScript kompiluje się bez błędów
- ✅ Środowisko testowe skonfigurowane

### 8.2 Kryteria wyjścia (Exit Criteria)
- ✅ Minimum 80% code coverage (unit tests)
- ✅ 100% critical paths pokryte (E2E)
- ✅ 0 P0 bugów otwartych
- ✅ Maksymalnie 5 P1 bugów otwartych
- ✅ Lighthouse score > 80
- ✅ 0 critical security vulnerabilities (RLS OK)
- ✅ Podstawowa accessibility (WCAG AA critical issues = 0)
- ✅ Wszystkie scenariusze P0 przechodzą

### 8.3 Kryteria sukcesu dla typów testów

#### Unit Tests
- ✅ Coverage ≥ 80% (statements, branches, functions)
- ✅ Edge cases pokryte
- ✅ Czas wykonania < 30 sekund
- ✅ 0 flaky tests

#### Integration Tests
- ✅ Wszystkie API endpoints przetestowane
- ✅ Główne user flows pokryte
- ✅ Czas wykonania < 2 minuty
- ✅ 0 flaky tests

#### E2E Tests
- ✅ Wszystkie critical journeys pokryte
- ✅ Tests działają na Chrome, Firefox
- ✅ Czas wykonania < 10 minut
- ✅ Screenshot dla failed tests
- ✅ Max 5% flaky tests

#### Security Tests
- ✅ Wszystkie RLS policies zweryfikowane
- ✅ 0 critical vulnerabilities
- ✅ Input validation działa
- ✅ API keys secure

#### Performance Tests (MVP)
- ✅ Lighthouse Performance > 80
- ✅ API p95 < 500ms
- ✅ FCP < 2s, LCP < 3s, CLS < 0.1
- ✅ Bundle size < 300KB

#### Accessibility Tests (MVP)
- ✅ 0 critical issues w axe
- ✅ Basic keyboard navigation
- ✅ Color contrast WCAG AA
- ✅ ARIA labels dla key interactions

## 9. Role i odpowiedzialności (uproszczone dla MVP)

### 9.1 Developer (Full-Stack)
**Odpowiedzialności:**
- Pisanie unit tests dla nowych features
- Pisanie integration tests dla API
- Fixing bugów (frontend + backend)
- Code review
- E2E tests dla critical flows
- CI/CD pipeline maintenance

**Deliverables:**
- Unit tests (80% coverage)
- Integration tests dla API
- E2E tests dla user flows
- Bug fixes

### 9.2 QA Engineer / Tech Lead (Part-time)
**Odpowiedzialności:**
- Plan testów maintenance
- Manual testing (exploratory)
- Security testing (RLS verification)
- Bug triage i priorytetyzacja
- Test reports
- Release sign-off

**Deliverables:**
- Test plan updates
- Bug reports
- Test coverage reports
- Release approval

### 9.3 Product Owner
**Odpowiedzialności:**
- Definiowanie acceptance criteria
- User acceptance testing (UAT)
- Priorytetyzacja bugów
- Release decision

**Deliverables:**
- Acceptance criteria
- UAT feedback
- Release go/no-go

## 10. Procedury raportowania błędów

### 10.1 Klasyfikacja błędów

#### P0 - Critical (Blocker)
- System crash lub całkowita niedostępność
- Data loss lub corruption
- Security vulnerability (RLS bypass, XSS, SQL injection)
- Complete feature breakdown

**Czas reakcji:** Natychmiastowy
**Czas rozwiązania:** < 24 godziny
**Eskalacja:** Natychmiastowa do Team Lead

**Przykłady:**
- RLS policy pozwala użytkownikowi A zobaczyć przepisy użytkownika B
- Nie można zalogować się (auth broken)
- Usunięcie przepisu kasuje wszystkie przepisy użytkownika
- XSS attack możliwy przez recipe title

#### P1 - High (Major)
- Główna funkcjonalność nie działa
- Workaround jest możliwy ale trudny
- Significant UX degradation
- Major accessibility issue

**Czas reakcji:** < 4 godziny
**Czas rozwiązania:** < 3 dni
**Eskalacja:** Do Team Lead po 24h

**Przykłady:**
- AI generation zawsze timeout
- Recipe list nie ładuje się dla > 50 recipes
- Login nie działa na Safari
- Blokada "Unikaj" nie działa
- Search nie zwraca rezultatów

#### P2 - Medium (Normal)
- Funkcjonalność działa ale z issues
- Workaround łatwy
- UI/UX degradation
- Minor performance issues

**Czas reakcji:** < 24 godziny
**Czas rozwiązania:** < 1 tydzień

**Przykłady:**
- Dark mode ma złe kolory w jednym komponencie
- Tag filtering nie zapisuje się w URL
- Toast notification nie znika automatycznie
- Mobile layout nieco zepsuty

#### P3 - Low (Minor)
- Cosmetic issues
- Edge case bugs
- Nice-to-have improvements
- Documentation errors

**Czas reakcji:** Best effort
**Czas rozwiązania:** Backlog

**Przykłady:**
- Typo w error message
- Icon alignment o 1px
- Console warning (nie error)

### 10.2 Bug Report Template

```markdown
# Bug Report: [Krótki opis błędu]

## Metadata
- **Bug ID:** BUG-XXX
- **Severity:** P0 / P1 / P2 / P3
- **Component:** Frontend / Backend / Database / AI
- **Reporter:** [Name]
- **Created:** YYYY-MM-DD
- **Status:** Open / In Progress / Fixed / Closed

## Description
[Jasny opis problemu]

## Steps to Reproduce
1. [Krok 1]
2. [Krok 2]
3. [Krok 3]

## Expected Behavior
[Co powinno się wydarzyć]

## Actual Behavior
[Co faktycznie się wydarzyło]

## Environment
- **Browser:** Chrome 120 / Firefox 121 / Safari 17
- **OS:** Windows 11 / macOS 14 / iOS 17
- **Device:** Desktop / Mobile / Tablet
- **Environment:** Development / Staging / Production
- **URL:** https://savorai.app/app

## Screenshots/Videos
[Załącz screenshoty]

## Logs/Error Messages
```
[Paste console output, network errors]
```

## Additional Context
- **Frequency:** Always / Sometimes / Rare
- **Workaround:** [Jeśli istnieje]
- **Related tickets:** BUG-YYY
```

### 10.3 Bug Lifecycle

```
[Open] → [Triaged] → [Assigned] → [In Progress] → [In Review] → [Fixed] → [Verified] → [Closed]
                ↓
           [Wontfix / Duplicate]
```

### 10.4 Narzędzia do bug trackingu

**GitHub Issues** - Primary bug tracker
- Labels: `bug`, `P0`, `P1`, `P2`, `P3`, `frontend`, `backend`, `security`
- Projects: Kanban board
- Milestones: Target release

### 10.5 Communication Channels

**P0 Bugs:**
- GitHub Issue (urgent label)
- Slack/Discord (immediate @mention)

**P1 Bugs:**
- GitHub Issue
- Daily standup mention

**P2/P3 Bugs:**
- GitHub Issue
- Weekly triage

### 10.6 Eskalacja

**P0 (Critical):**
- 0-4h: Developer → Team Lead
- 4-24h: Team Lead → Product Owner
- 24h+: Daily updates + postmortem planning

**P1 (High):**
- 0-24h: Developer → Team Lead
- 24h+: Daily updates

**P2/P3:**
- No escalation required
- Tracked in backlog

## 11. Metryki testowania

### 11.1 Coverage Metrics
- **Unit test coverage:** ≥ 80%
- **API endpoint coverage:** 100%
- **E2E critical paths:** 100%

### 11.2 Quality Metrics
- **Bugs found:** Track by severity
- **Bug escape rate:** Bugs found in production / total bugs
- **Test execution time:** Unit <30s, Integration <2min, E2E <10min
- **Flaky test rate:** < 5%

### 11.3 Performance Metrics
- **Lighthouse score:** > 80
- **API response time (p95):** < 500ms
- **Page load time (LCP):** < 3s

### 11.4 Weekly Test Report
- Testy wykonane: X/Y
- Coverage: X%
- Nowe bugi: P0: X, P1: Y, P2: Z
- Zamknięte bugi: X
- Open bugs: P0: X, P1: Y

## 12. Podsumowanie

Plan testów MVP dla SavorAI zapewnia **realistyczne pokrycie** kluczowych funkcji przy **ograniczonych zasobach**:

✅ **7 typów testów:** Unit, Integration, E2E, API, Security, Performance (basic), UI/UX
✅ **40+ scenariuszy testowych** pokrywających wszystkie 15 user stories z PRD
✅ **Jasne kryteria:** 80% coverage, Lighthouse >80, 0 P0 bugs
✅ **4-tygodniowy harmonogram** implementacji
✅ **Uproszczone role** (Developer + QA/Tech Lead part-time)
✅ **Szczegółowe procedury bug reporting** (P0-P3)

**Kluczowe priorytety:**
1. **Bezpieczeństwo:** RLS policies, autentykacja, input validation
2. **Core features:** Generowanie AI, blokada "Unikaj", CRUD przepisów
3. **Events logging:** Dla KPI-1 i KPI-2 z PRD
4. **Basic UX:** Responsywność, dark mode, accessibility basics

Plan jest **żywy** i będzie aktualizowany w miarę rozwoju projektu.

**Next steps:**
1. Setup środowiska testowego (Tydzień 1, Dzień 1-2)
2. Implementacja pierwszych unit tests (Tydzień 1, Dzień 3)
3. CI/CD pipeline setup (GitHub Actions)
