# Plan Testów - SavorAI

## 1. Wprowadzenie i cele testowania

### 1.1 Cel dokumentu
Niniejszy dokument przedstawia kompleksowy plan testów dla aplikacji SavorAI - platformy do generowania i zarządzania przepisami kulinarnymi przy użyciu sztucznej inteligencji.

### 1.2 Cele testowania
- Zapewnienie wysokiej jakości i niezawodności aplikacji
- Weryfikacja poprawności integracji z zewnętrznymi usługami (Supabase, AI providers)
- Potwierdzenie bezpieczeństwa danych użytkowników i poprawności mechanizmów autoryzacji
- Sprawdzenie wydajności aplikacji przy różnych obciążeniach
- Weryfikacja zgodności z wymaganiami funkcjonalnymi i niefunkcjonalnymi
- Identyfikacja i eliminacja błędów przed wdrożeniem produkcyjnym

### 1.3 Zakres zastosowania
Plan testów obejmuje wszystkie komponenty aplikacji SavorAI zbudowanej w architekturze Astro Islands z React, wykorzystującej Supabase jako backend oraz zewnętrzne API do generowania przepisów AI.

## 2. Zakres testów

### 2.1 Obszary objęte testami

#### Frontend
- Komponenty React (islands): AppShell, Header, ProfileForm, AppLayout, GeneratorPanel, RecipeList
- Komponenty UI z biblioteki shadcn/ui
- Zarządzanie stanem (React Query, local/session storage, URL state)
- Routing i nawigacja (Astro routes, client-side navigation)
- Responsywność i dostępność (ARIA, keyboard navigation)
- Tryb ciemny (dark mode)

#### Backend
- Endpointy API Astro (/api/recipes, /api/profile, /api/events)
- Integracja z Supabase (autentykacja, baza danych, RLS)
- Funkcje RPC PostgreSQL (insert_recipe_safe, export_events_ndjson)
- Middleware autentykacji

#### AI Integration
- Providery AI (OpenRouter, Google AI, Mock)
- Generowanie przepisów
- Obsługa timeoutów i błędów
- Rate limiting

#### Baza danych
- Schema i constraints
- Indeksy i performance
- Triggers i funkcje
- Row Level Security (RLS)

### 2.2 Obszary wyłączone z testów
- Testy wewnętrzne bibliotek zewnętrznych (React, Astro, Supabase SDK)
- Testy infrastruktury DigitalOcean (poza smoke tests)
- Szczegółowe testy algorytmów AI (black box testing)

## 3. Typy testów do przeprowadzenia

### 3.1 Testy jednostkowe (Unit Tests)
**Narzędzia:** Vitest, @testing-library/react

**Zakres:**
- Funkcje utility (`normalizeStringArray`, `hasAtLeastOneField`, `isFormDirty`)
- Type guards (`isEventType`, `isDietType`, `isRecipeDifficulty`)
- Mappery danych (profile mappers, DTO transformations)
- Walidatory (prompt validation, recipe schema validation)
- Hooki React (useAuth, useUrlFilters, useScrollRestoration)
- Komponenty prezentacyjne (Button, Card, Alert, Badge)

**Kryteria akceptacji:**
- Pokrycie kodu minimum 80%
- Wszystkie edge cases obsłużone
- Testy wykonują się w <5 sekund

### 3.2 Testy integracyjne (Integration Tests)
**Narzędzia:** Vitest, MSW (Mock Service Worker), @testing-library/react

**Zakres:**
- Integracja komponentów z React Query
- Przepływ danych między komponentami (parent-child communication)
- API endpoints z Supabase Client
- Funkcje RPC PostgreSQL
- AI providers z mock responses
- Middleware autentykacji z Supabase Auth

**Scenariusze:**
- Logowanie użytkownika → pobieranie profilu → wyświetlenie danych
- Generowanie przepisu → zapis do bazy → wyświetlenie na liście
- Filtrowanie przepisów → aktualizacja URL → refetch danych
- Edycja profilu → walidacja → zapis → invalidacja cache
- Usunięcie przepisu → potwierdzenie → refetch listy

**Kryteria akceptacji:**
- Wszystkie główne user flows przetestowane
- Mock API responses realistyczne
- Testy izolowane (bez prawdziwych API calls)

### 3.3 Testy E2E (End-to-End Tests)
**Narzędzia:** Playwright

**Zakres:**
- Pełne przepływy użytkownika od logowania do wykonania akcji
- Interakcje między różnymi stronami aplikacji
- Testy na prawdziwej bazie danych (test environment)
- Testy z prawdziwym mock AI provider

**Scenariusze krytyczne:**

#### E2E-001: Rejestracja i pierwszy przepis
1. Użytkownik rejestruje się przez /login
2. Użytkownik tworzy profil z preferencjami żywieniowymi
3. Użytkownik generuje pierwszy przepis AI
4. Użytkownik zapisuje przepis
5. Przepis pojawia się na liście

#### E2E-002: Zarządzanie przepisami
1. Użytkownik loguje się
2. Użytkownik wyszukuje przepisy po nazwie
3. Użytkownik filtruje przepisy po tagach
4. Użytkownik otwiera szczegóły przepisu
5. Użytkownik usuwa przepis

#### E2E-003: Edycja profilu
1. Użytkownik loguje się
2. Użytkownik przechodzi do /profile
3. Użytkownik edytuje niechciane składniki
4. Użytkownik próbuje wygenerować przepis z niechcianymi składnikami
5. System blokuje zapis przepisu (insert_recipe_safe)

#### E2E-004: Responsywność
1. Test na desktop (1920x1080)
2. Test na tablet (768x1024)
3. Test na mobile (375x667)
4. Sprawdzenie collapsible panels
5. Sprawdzenie mobile navigation

**Kryteria akceptacji:**
- Wszystkie krytyczne scenariusze przechodzą
- Testy działają na Chrome, Firefox, Safari
- Czas wykonania < 10 minut

### 3.4 Testy API (API Tests)
**Narzędzia:** Vitest, Supertest (dla Astro endpoints)

**Zakres:**
- Wszystkie endpointy REST API
- Kody odpowiedzi HTTP
- Walidacja request/response schemas
- Obsługa błędów
- Rate limiting

**Testowane endpointy:**

#### POST /api/recipes/generate
- ✅ 200: Poprawne generowanie z valid prompt
- ❌ 400: Pusty prompt
- ❌ 400: Prompt > 2000 znaków
- ❌ 401: Brak autoryzacji
- ❌ 413: Response > 200KB
- ❌ 429: Rate limit exceeded
- ❌ 503: AI service unavailable

#### GET /api/recipes
- ✅ 200: Lista przepisów użytkownika
- ✅ 200: Pusta lista dla nowego użytkownika
- ✅ 200: Filtrowanie po search query
- ✅ 200: Filtrowanie po tagach
- ✅ 200: Sortowanie (recent/oldest)
- ✅ 200: Paginacja (limit/offset)
- ❌ 401: Brak autoryzacji

#### POST /api/recipes
- ✅ 201: Zapis poprawnego przepisu
- ❌ 400: Niepoprawny RecipeSchema
- ❌ 401: Brak autoryzacji
- ❌ 409: Przepis zawiera disliked ingredients (via RPC)
- ❌ 413: Recipe JSONB > 200KB

#### GET /api/recipes/:id
- ✅ 200: Szczegóły własnego przepisu
- ❌ 401: Brak autoryzacji
- ❌ 403: Próba dostępu do cudzego przepisu (RLS)
- ❌ 404: Nieistniejący przepis

#### DELETE /api/recipes/:id
- ✅ 204: Usunięcie własnego przepisu
- ❌ 401: Brak autoryzacji
- ❌ 403: Próba usunięcia cudzego przepisu (RLS)
- ❌ 404: Nieistniejący przepis

#### GET /api/profile
- ✅ 200: Zwrócenie profilu użytkownika
- ❌ 401: Brak autoryzacji
- ❌ 404: Brak profilu (pierwszy login)

#### POST /api/profile
- ✅ 201: Utworzenie profilu
- ❌ 400: Walidacja - brak wymaganych pól
- ❌ 401: Brak autoryzacji
- ❌ 409: Profil już istnieje

#### PUT /api/profile
- ✅ 200: Aktualizacja profilu
- ❌ 400: Walidacja - niepoprawne dane
- ❌ 401: Brak autoryzacji
- ❌ 404: Brak profilu do aktualizacji

#### POST /api/events
- ✅ 201: Logowanie zdarzenia
- ❌ 400: Niepoprawny event type
- ❌ 401: Brak autoryzacji

**Kryteria akceptacji:**
- Wszystkie endpointy zwracają poprawne kody HTTP
- Response schemas zgodne z TypeScript types
- Error responses mają format ApiError

### 3.5 Testy bezpieczeństwa (Security Tests)

**Zakres:**

#### Autentykacja i autoryzacja
- Test sesji użytkownika (access token, refresh token)
- Test wygasania sesji
- Test logout
- Test próby dostępu bez tokenu (401)
- Test Cross-Site Request Forgery (CSRF)

#### Row Level Security (RLS)
- Test dostępu do własnych przepisów ✅
- Test blokady dostępu do cudzych przepisów ❌
- Test dostępu do własnego profilu ✅
- Test blokady dostępu do cudzego profilu ❌
- Test kaskadowego usuwania przy usunięciu użytkownika

#### Walidacja danych
- Test SQL injection w search query
- Test XSS przez user-generated content (tags, titles)
- Test Path traversal w recipe ID
- Test prototype pollution w JSONB payload

#### Secrets management
- Weryfikacja, że API keys nie są eksponowane do frontendu
- Sprawdzenie SUPABASE_KEY vs PUBLIC_SUPABASE_KEY
- Weryfikacja, że env variables są poprawnie ładowane

#### Rate limiting
- Test limitu requestów na endpoint
- Test blokady po przekroczeniu limitu
- Test resetu limitu po czasie

**Kryteria akceptacji:**
- Zero luk w RLS policies
- Wszystkie user inputs sanitized
- API keys bezpieczne
- Rate limiting działa poprawnie

### 3.6 Testy wydajnościowe (Performance Tests)
**Narzędzia:** Lighthouse, WebPageTest, k6 (load testing)

**Zakres:**

#### Frontend Performance
- Lighthouse score > 90 (Performance, Accessibility, Best Practices, SEO)
- First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s
- Time to Interactive (TTI) < 3.5s
- Cumulative Layout Shift (CLS) < 0.1
- Bundle size < 200KB (gzipped)

#### Backend Performance
- API response time < 200ms (p95)
- Database query time < 50ms (p95)
- Full-text search < 100ms (p95)
- AI generation < 30s (timeout)

#### Load Testing
- 100 concurrent users - response time < 500ms
- 500 concurrent users - response time < 1s
- 1000 concurrent users - server nie crashuje
- Stress test - znajdź breaking point

#### Database Performance
- Test N+1 queries
- Test indeksów (EXPLAIN ANALYZE)
- Test wielkości JSONB payload
- Test paginacji na 10,000+ recipes

**Kryteria akceptacji:**
- Lighthouse > 90 na wszystkich metrykach
- API < 200ms dla 95% requestów
- Brak N+1 queries
- Database queries używają indeksów

### 3.7 Testy UI/UX

**Zakres:**

#### Responsywność
- Desktop: 1920x1080, 1366x768
- Tablet: 1024x768, 768x1024
- Mobile: 414x896 (iPhone 11), 375x667 (iPhone SE), 360x740 (Android)
- Collapsible panels działają poprawnie
- Touch targets min 44x44px na mobile

#### Dark Mode
- Wszystkie komponenty w obu motywach
- Kontrast zgodny z WCAG AA
- Persistence w localStorage
- Brak flashu przy ładowaniu

#### Accessibility (a11y)
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader support (ARIA labels)
- Focus indicators
- Skip links
- Semantic HTML
- Color contrast WCAG AA

#### Browser Compatibility
- Chrome (latest, latest-1)
- Firefox (latest, latest-1)
- Safari (latest, latest-1)
- Edge (latest)
- Mobile Safari (iOS 15+)
- Chrome Mobile (Android 11+)

#### Progressive Enhancement
- Działanie bez JavaScript (gdzie możliwe)
- Local/session storage w trybie prywatnym
- Backdrop filter fallback
- CSS Grid/Flexbox support

**Kryteria akceptacji:**
- WCAG 2.1 Level AA compliance
- Keyboard navigation pełna
- 0 błędów w axe DevTools
- Działa na wszystkich target browsers

### 3.8 Testy regresji (Regression Tests)

**Zakres:**
- Automatyczne uruchomienie po każdym merge do master
- Pełny zestaw testów E2E
- Smoke tests na produkcji po deployment
- Visual regression testing (Percy, Chromatic)

**Kryteria akceptacji:**
- 100% testów E2E przechodzi
- Zero visual regressions
- Smoke tests na prod < 5 minut

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1 Autentykacja użytkownika

#### TC-AUTH-001: Rejestracja nowego użytkownika
**Priorytet:** P0
**Typ:** E2E

**Kroki:**
1. Otwórz /login
2. Wpisz email: `test@example.com`
3. Wpisz hasło: `SecurePass123!`
4. Kliknij "Sign Up"
5. Sprawdź email z potwierdzeniem (w testach: auto-confirm)
6. Przekierowanie do /app

**Oczekiwany rezultat:**
- Użytkownik utworzony w Supabase Auth
- Rekord w tabeli profiles (via trigger)
- Redirect do /app
- Toast "Registration successful"

#### TC-AUTH-002: Logowanie istniejącego użytkownika
**Priorytet:** P0
**Typ:** E2E

**Kroki:**
1. Otwórz /login
2. Wpisz poprawny email i hasło
3. Kliknij "Sign In"

**Oczekiwany rezultat:**
- Access token i refresh token w session
- Redirect do /app
- Header wyświetla email użytkownika

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
- Event 'ai_prompt_sent' i 'ai_recipe_generated' zalogowane

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

#### TC-GEN-004: Timeout AI service
**Priorytet:** P1
**Typ:** Integration

**Kroki:**
1. Mock AI provider z delay > 30s
2. Generuj przepis

**Oczekiwany rezultat:**
- Request timeout po 30s
- Error message: "AI service timed out. Please try again."
- Retry button dostępny

#### TC-GEN-005: AI zwraca niepoprawny JSON
**Priorytet:** P1
**Typ:** Integration

**Kroki:**
1. Mock AI provider zwraca malformed JSON
2. Generuj przepis

**Oczekiwany rezultat:**
- Error handling
- Error message: "Failed to parse AI response"
- Użytkownik może retry

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
- Event 'recipe_saved' zalogowany
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

#### TC-SEARCH-002: Filtrowanie po tagach
**Priorytet:** P1
**Typ:** E2E

**Kroki:**
1. Przepisy z tagami: ["italian"], ["italian", "quick"], ["vegan"]
2. Wybierz tag "italian"

**Oczekiwany rezultat:**
- Zwrócone 2 przepisy z tagiem "italian"
- URL: ?tags=italian
- Tag chip aktywny

#### TC-SEARCH-003: Multi-tag filtering (OR)
**Priorytet:** P2
**Typ:** Integration

**Kroki:**
1. Wybierz tagi: "italian", "vegan"

**Oczekiwany rezultat:**
- Zwrócone przepisy z tagiem "italian" LUB "vegan"
- URL: ?tags=italian,vegan

#### TC-SEARCH-004: Sortowanie
**Priorytet:** P2
**Typ:** E2E

**Kroki:**
1. Lista przepisów z różnymi created_at
2. Zmień sort z "recent" na "oldest"

**Oczekiwany rezultat:**
- Lista posortowana od najstarszego
- URL: ?sort=oldest

#### TC-SEARCH-005: Paginacja
**Priorytet:** P1
**Typ:** Integration

**Kroki:**
1. Użytkownik ma 50 przepisów
2. Limit = 20
3. Scroll do końca listy
4. Kliknij "Load more"

**Oczekiwany rezultat:**
- Infinite scroll załadował kolejne 20
- Total loaded = 40
- hasNextPage = true

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
- Event 'profile_edited' zalogowany
- Query cache invalidated

#### TC-PROFILE-002: Edycja istniejącego profilu
**Priorytet:** P1
**Typ:** E2E

**Kroki:**
1. Użytkownik z profilem
2. Zmień dietType z "vegan" na "vegetarian"
3. Kliknij "Save Changes"

**Oczekiwany rezultat:**
- Profil zaktualizowany (PUT /api/profile)
- Tylko zmienione pola w request body
- Toast "Profile updated successfully"

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

#### TC-PROFILE-004: Walidacja - max 100 items
**Priorytet:** P2
**Typ:** Unit

**Kroki:**
1. Dodaj 101 dislikedIngredients
2. Próbuj zapisać

**Oczekiwany rezultat:**
- Error: "Maximum 100 ingredients allowed"

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

#### TC-DELETE-002: Anulowanie usuwania
**Priorytet:** P2
**Typ:** E2E

**Kroki:**
1. Kliknij "Delete recipe"
2. Kliknij "Cancel" w dialogu

**Oczekiwany rezultat:**
- Dialog zamknięty
- Brak API call
- Przepis NIE usunięty

#### TC-DELETE-003: Próba usunięcia cudzego przepisu
**Priorytet:** P0
**Typ:** Security

**Kroki:**
1. User A próbuje wywołać DELETE /api/recipes/:id dla przepisu User B

**Oczekiwany rezultat:**
- RLS blokuje operację
- 403 Forbidden
- Error message: "You don't have permission to delete this recipe"

## 5. Środowisko testowe

### 5.1 Środowiska

#### Development
- **URL:** http://localhost:4321
- **Database:** Supabase local (Docker)
- **AI Provider:** Mock provider (zero costs)
- **Cel:** Development i unit tests

#### Staging
- **URL:** https://staging.savorai.app
- **Database:** Supabase staging project
- **AI Provider:** OpenRouter (limited budget)
- **Cel:** Integration tests, E2E tests, manual testing

#### Production
- **URL:** https://savorai.app
- **Database:** Supabase production project
- **AI Provider:** OpenRouter/Google AI
- **Cel:** Smoke tests po deployment, monitoring

### 5.2 Konfiguracja środowiska testowego

#### Local Development Setup
```bash
# Install dependencies
npm install

# Setup Supabase local
npx supabase init
npx supabase start
npx supabase db reset

# Run migrations
npm run db:migrate

# Seed test data
npm run db:seed

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
- Izolowana instancja PostgreSQL dla testów
- Reset przed każdym testem suite
- Seed data:
  - 3 test users
  - 50 test recipes
  - 10 test profiles
  - Sample events

### 5.4 Mock Services
- **Mock AI Provider:** Zwraca statyczne przepisy w <1s
- **MSW (Mock Service Worker):** Mockowanie HTTP requests w testach
- **Supabase Test Helpers:** Utilities do mock auth

## 6. Narzędzia do testowania

### 6.1 Framework testowy
- **Vitest** - Unit i integration tests
  - Szybszy od Jest
  - Native ESM support
  - Compatible z Vite ecosystem
  - Coverage reports (c8)

### 6.2 Testing Library
- **@testing-library/react** - Component tests
  - User-centric testing
  - Accessibility-focused
  - Best practices enforcement

### 6.3 E2E Testing
- **Playwright** - End-to-end tests
  - Multi-browser support
  - Auto-wait mechanisms
  - Screenshot/video recording
  - Trace viewer dla debugging

### 6.4 API Testing
- **Supertest** - HTTP assertions dla Astro endpoints
- **MSW** - Mock Service Worker dla external APIs

### 6.5 Performance Testing
- **Lighthouse CI** - Automated performance audits
- **WebPageTest** - Real-world performance testing
- **k6** - Load testing i stress testing

### 6.6 Accessibility Testing
- **axe-core** - Automated a11y testing
- **@axe-core/playwright** - Integration z Playwright
- **Pa11y** - CLI accessibility testing

### 6.7 Visual Regression
- **Percy** lub **Chromatic** - Visual diff testing
- Snapshot testing dla komponentów

### 6.8 Code Quality
- **ESLint** - Linting
- **TypeScript** - Type checking
- **Prettier** - Code formatting

### 6.9 CI/CD
- **GitHub Actions** - Automation pipeline
  - Test runner
  - Coverage reports
  - Deployment gates

### 6.10 Monitoring i Logging
- **Sentry** - Error tracking (production)
- **LogRocket** - Session replay (production)
- **Supabase Logs** - Database query monitoring

## 7. Harmonogram testów

### 7.1 Faza 1: Przygotowanie (Tydzień 1)
- **Dzień 1-2:** Setup środowiska testowego
  - Instalacja narzędzi
  - Konfiguracja Vitest, Playwright
  - Setup mock services
- **Dzień 3-4:** Przygotowanie test data
  - Seed scripts
  - Test fixtures
  - Mock factories
- **Dzień 5:** Dokumentacja i onboarding
  - Guidelines dla team
  - Code review standards

### 7.2 Faza 2: Testy jednostkowe (Tydzień 2)
- **Dzień 1:** Utility functions i helpers
- **Dzień 2:** Type guards i validators
- **Dzień 3:** Mappers i transformers
- **Dzień 4:** React hooks
- **Dzień 5:** UI components (presentational)

**Cel:** 80% code coverage dla utilities i components

### 7.3 Faza 3: Testy integracyjne (Tydzień 3)
- **Dzień 1-2:** API endpoints
  - Wszystkie /api/recipes endpoints
  - Profile endpoints
- **Dzień 3:** Database i RPC functions
  - insert_recipe_safe
  - Full-text search
- **Dzień 4:** AI providers integration
- **Dzień 5:** React Query integration

**Cel:** Wszystkie API endpoints pokryte testami

### 7.4 Faza 4: Testy E2E (Tydzień 4)
- **Dzień 1:** Auth flows
- **Dzień 2:** Recipe generation flow
- **Dzień 3:** Recipe management flow
- **Dzień 4:** Profile management flow
- **Dzień 5:** Search i filtering flows

**Cel:** Wszystkie critical user journeys pokryte

### 7.5 Faza 5: Testy bezpieczeństwa (Tydzień 5)
- **Dzień 1-2:** RLS policies testing
- **Dzień 3:** Input validation i sanitization
- **Dzień 4:** Auth i session security
- **Dzień 5:** Penetration testing (manual)

**Cel:** Zero critical security vulnerabilities

### 7.6 Faza 6: Testy wydajnościowe (Tydzień 6)
- **Dzień 1-2:** Frontend performance (Lighthouse)
- **Dzień 3:** Database query optimization
- **Dzień 4:** Load testing (k6)
- **Dzień 5:** Stress testing i bottleneck analysis

**Cel:** Lighthouse score > 90, API < 200ms

### 7.7 Faza 7: Testy UI/UX (Tydzień 7)
- **Dzień 1:** Responsiveness testing
- **Dzień 2:** Dark mode testing
- **Dzień 3:** Accessibility audit (axe, Pa11y)
- **Dzień 4:** Cross-browser testing
- **Dzień 5:** User acceptance testing (UAT)

**Cel:** WCAG AA compliance, zero critical a11y issues

### 7.8 Faza 8: Regression i finalizacja (Tydzień 8)
- **Dzień 1-2:** Visual regression testing setup
- **Dzień 3:** Smoke tests dla production
- **Dzień 4:** Dokumentacja wyników testów
- **Dzień 5:** Retro i plan ulepszeń

**Cel:** Pełna automatyzacja regression tests

### 7.9 Utrzymanie (Ciągłe)
- **Daily:** Unit tests na PR
- **Daily:** Integration tests na PR
- **Pre-deployment:** Full E2E suite
- **Post-deployment:** Smoke tests
- **Weekly:** Performance regression check
- **Monthly:** Security audit
- **Quarterly:** Penetration testing

## 8. Kryteria akceptacji testów

### 8.1 Kryteria wejścia (Entry Criteria)
Przed rozpoczęciem testów muszą być spełnione:
- ✅ Kod zmergowany do branch testowego
- ✅ Build przechodzi (npm run build)
- ✅ Linter przechodzi (npm run lint)
- ✅ TypeScript kompiluje się bez błędów
- ✅ Środowisko testowe skonfigurowane
- ✅ Test data seed gotowy
- ✅ Dokumentacja API aktualna

### 8.2 Kryteria wyjścia (Exit Criteria)
Testy uznawane za zakończone gdy:
- ✅ Minimum 80% code coverage (unit tests)
- ✅ 100% critical paths pokryte (E2E)
- ✅ 0 P0 bugów otwartych
- ✅ Maksymalnie 5 P1 bugów otwartych
- ✅ Lighthouse score > 90
- ✅ 0 critical security vulnerabilities
- ✅ 0 critical accessibility issues (WCAG AA)
- ✅ Wszystkie regression tests przechodzą
- ✅ Smoke tests na staging OK

### 8.3 Kryteria sukcesu dla poszczególnych typów testów

#### Unit Tests
- ✅ Coverage ≥ 80% (statements, branches, functions)
- ✅ Wszystkie edge cases pokryte
- ✅ Czas wykonania < 30 sekund (cały suite)
- ✅ 0 flaky tests

#### Integration Tests
- ✅ Wszystkie API endpoints przetestowane
- ✅ Wszystkie główne user flows pokryte
- ✅ Czas wykonania < 2 minuty
- ✅ 0 flaky tests

#### E2E Tests
- ✅ Wszystkie critical journeys pokryte
- ✅ Tests działają na Chrome, Firefox, Safari
- ✅ Czas wykonania < 10 minut
- ✅ Screenshot/video dla failed tests
- ✅ Max 5% flaky tests

#### Security Tests
- ✅ Wszystkie RLS policies zweryfikowane
- ✅ OWASP Top 10 addressed
- ✅ 0 critical vulnerabilities
- ✅ Penetration test report approved

#### Performance Tests
- ✅ Lighthouse Performance > 90
- ✅ API p95 < 200ms
- ✅ Database queries p95 < 50ms
- ✅ 100 concurrent users bez degradacji
- ✅ FCP < 1.5s, LCP < 2.5s, CLS < 0.1

#### Accessibility Tests
- ✅ WCAG 2.1 Level AA compliance
- ✅ 0 critical issues w axe
- ✅ Keyboard navigation pełna
- ✅ Screen reader compatibility

### 8.4 Definition of Done dla Bug Fixing
Bug jest uznawany za fixed gdy:
- ✅ Fix zmergowany do master
- ✅ Regression test dodany
- ✅ Peer review completed
- ✅ Manual verification na staging
- ✅ Dokumentacja zaktualizowana (jeśli potrzebna)

## 9. Role i odpowiedzialności w procesie testowania

### 9.1 QA Engineer (Lead)
**Odpowiedzialności:**
- Tworzenie i utrzymanie planu testów
- Definiowanie strategii testowania
- Code review dla test code
- Zarządzanie test automation infrastructure
- Raportowanie statusu testów do stakeholders
- Priorytetyzacja bugów
- Koordynacja testów manualnych
- Mentoring juniorów w zakresie testowania

**Deliverables:**
- Plan testów
- Test reports
- Coverage reports
- Bug severity assessment

### 9.2 Frontend Developer
**Odpowiedzialności:**
- Pisanie unit tests dla komponentów React
- Pisanie integration tests dla React Query
- Fixing bugów UI/UX
- Code review dla frontend code
- Accessibility compliance w komponetach
- Performance optimization

**Deliverables:**
- Unit tests dla nowych features
- Integration tests dla API integration
- Component test coverage ≥ 80%

### 9.3 Backend Developer
**Odpowiedzialności:**
- Pisanie tests dla API endpoints
- Pisanie tests dla RPC functions
- Database migration testing
- Security testing (RLS policies)
- Performance optimization (query tuning)
- Fixing backend bugs

**Deliverables:**
- API tests dla nowych endpoints
- Database migration tests
- RPC function tests
- Query performance benchmarks

### 9.4 Full-Stack Developer
**Odpowiedzialności:**
- E2E tests dla complete user flows
- Integration testing między frontend i backend
- Bug fixing (full-stack)
- CI/CD pipeline maintenance
- Test environment setup

**Deliverables:**
- E2E test scenarios
- Integration test coverage
- CI/CD pipeline scripts

### 9.5 DevOps Engineer
**Odpowiedzialności:**
- Setup i maintenance środowiska testowego
- CI/CD pipeline dla automated testing
- Load testing infrastructure
- Monitoring i alerting dla test failures
- Performance testing infrastructure (k6, Lighthouse CI)

**Deliverables:**
- GitHub Actions workflows
- Test environment configs
- Load testing reports
- Performance benchmarks

### 9.6 Product Owner
**Odpowiedzialności:**
- Definiowanie acceptance criteria
- Priorytetyzacja bugów
- User acceptance testing (UAT)
- Sign-off na release
- Feedback na UX issues

**Deliverables:**
- Acceptance criteria dla features
- UAT results
- Release approval

### 9.7 Security Specialist (Konsultant)
**Odpowiedzialności:**
- Penetration testing (quarterly)
- Security audit (kodu i infrastruktury)
- RLS policy review
- Recommendations dla security improvements

**Deliverables:**
- Penetration test report
- Security audit report
- Vulnerability assessment

## 10. Procedury raportowania błędów

### 10.1 Klasyfikacja błędów

#### Severity Levels

**P0 - Critical (Blocker)**
- System crash lub całkowita niedostępność
- Data loss lub corruption
- Security vulnerability (RLS bypass, XSS, SQL injection)
- Payment/billing failures (jeśli applicable)

**Czas reakcji:** Natychmiastowy
**Czas rozwiązania:** < 4 godziny
**Eskalacja:** Natychmiastowa do CTO/Team Lead

**Przykłady:**
- RLS policy pozwala użytkownikowi A zobaczyć przepisy użytkownika B
- Usunięcie przepisu kasuje wszystkie przepisy użytkownika
- XSS attack możliwy przez recipe title

**P1 - High (Major)**
- Główna funkcjonalność nie działa
- Workaround jest możliwy ale trudny
- Performance degradation > 50%
- Accessibility blocker (WCAG A violation)

**Czas reakcji:** < 4 godziny
**Czas rozwiązania:** < 24 godziny
**Eskalacja:** Do Team Lead po 8h

**Przykłady:**
- AI generation zawsze timeout
- Recipe list nie ładuje się dla > 100 recipes
- Login nie działa na Safari
- Keyboard navigation zepsuta

**P2 - Medium (Normal)**
- Funkcjonalność działa ale z issues
- Workaround łatwy
- UI/UX degradation
- Minor performance issues

**Czas reakcji:** < 24 godziny
**Czas rozwiązania:** < 1 tydzień
**Eskalacja:** Do Team Lead po 3 dniach

**Przykłady:**
- Dark mode ma złe kolory w jednym komponencie
- Tag filtering nie zapisuje się w URL
- Toast notification nie znika automatycznie
- Mobile layout nieco zepsuty

**P3 - Low (Minor)**
- Cosmetic issues
- Edge case bugs
- Nice-to-have improvements
- Documentation errors

**Czas reakcji:** < 1 tydzień
**Czas rozwiązania:** Best effort
**Eskalacja:** Nie wymagana

**Przykłady:**
- Typo w error message
- Icon alignment o 1px
- Console warning (nie error)
- Minor translation issue

### 10.2 Bug Report Template

```markdown
# Bug Report: [Krótki opis błędu]

## Metadata
- **Bug ID:** BUG-XXX
- **Severity:** P0 / P1 / P2 / P3
- **Component:** Frontend / Backend / Database / AI / Infrastructure
- **Reporter:** [Name]
- **Assigned to:** [Name or Unassigned]
- **Created:** YYYY-MM-DD
- **Status:** Open / In Progress / Fixed / Closed / Wontfix

## Description
[Jasny i zwięzły opis problemu]

## Steps to Reproduce
1. [Krok 1]
2. [Krok 2]
3. [Krok 3]
...

## Expected Behavior
[Co powinno się wydarzyć]

## Actual Behavior
[Co faktycznie się wydarzyło]

## Environment
- **Browser:** Chrome 120 / Firefox 121 / Safari 17
- **OS:** Windows 11 / macOS 14 / iOS 17
- **Device:** Desktop / Mobile (iPhone 11) / Tablet
- **Environment:** Development / Staging / Production
- **User role:** Anonymous / Authenticated user
- **URL:** https://staging.savorai.app/app

## Screenshots/Videos
[Załącz screenshoty lub linki do recordings]

## Logs/Error Messages
```
[Paste error logs, console output, network errors]
```

## Additional Context
- **Frequency:** Always / Sometimes / Rare
- **Impact:** X users affected / Y% of sessions
- **Workaround:** [Jeśli istnieje]
- **Related tickets:** BUG-YYY, FEATURE-ZZZ

## Root Cause (po analizie)
[Technical analysis of why the bug occurred]

## Fix Description (po fix)
[What was changed to fix the bug]

## Test Evidence
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing completed
- [ ] Regression test added
```

### 10.3 Bug Lifecycle

```
[Open] → [Triaged] → [Assigned] → [In Progress] → [In Review] → [Fixed] → [Verified] → [Closed]
                ↓
           [Wontfix / Duplicate / Cannot Reproduce]
```

**Stany:**
1. **Open:** Nowy bug zgłoszony
2. **Triaged:** QA Lead zweryfikował i przypisał severity
3. **Assigned:** Bug przypisany do developera
4. **In Progress:** Developer pracuje nad fix
5. **In Review:** PR w code review
6. **Fixed:** PR zmergowany
7. **Verified:** QA zweryfikował fix na staging
8. **Closed:** Bug potwierdzony fixed na production

**Alternatywne zakończenia:**
- **Wontfix:** Bug jest znany ale nie będzie fixowany (tech debt, low priority)
- **Duplicate:** Bug już został zgłoszony (link do original)
- **Cannot Reproduce:** Nie można odtworzyć buga (potrzeba więcej info)

### 10.4 Narzędzia do bug trackingu

**GitHub Issues** - Primary bug tracker
- Labels: `bug`, `P0`, `P1`, `P2`, `P3`, `frontend`, `backend`, `security`
- Projects: Kanban board dla bug status
- Milestones: Target release dla fix

**Sentry** - Automated error tracking (production)
- Auto-create GitHub issues dla nowych errors
- Stack traces i breadcrumbs
- User context dla reproduction

**Linear** (alternative) - Dedicated issue tracker
- Better workflow automation
- Sprint planning integration

### 10.5 Bug Reporting Workflow

#### 1. Discovery
- QA Engineer znajduje bug podczas testów
- Developer znajduje bug podczas development
- User reportuje bug przez support email
- Sentry automatycznie detectuje error

#### 2. Initial Triage (QA Engineer)
- Weryfikacja: czy to faktycznie bug?
- Odtworzenie buga
- Sprawdzenie czy nie jest duplicate
- Przypisanie severity (P0-P3)
- Utworzenie GitHub Issue z pełnym opisem

#### 3. Assignment (QA Lead / Team Lead)
- Przypisanie do odpowiedniego developera
- Dodanie do sprint (P0, P1) lub backlog (P2, P3)
- Notyfikacja assignee

#### 4. Development
- Developer analizuje root cause
- Developer implementuje fix
- Developer dodaje regression test
- Developer tworzy PR z linkiem do issue

#### 5. Code Review
- Peer review kodu
- QA review test coverage
- Approval i merge

#### 6. Verification (QA Engineer)
- Deploy na staging
- Manual testing - weryfikacja fix
- Regression testing - sprawdzenie czy nic się nie zepsuło
- Jeśli OK → move to Verified
- Jeśli NOK → reopen i back to Development

#### 7. Production Deployment
- Deploy na production
- Smoke tests
- Monitoring (Sentry, Logs)

#### 8. Closure
- QA potwierdza fix na production
- Close GitHub Issue
- Update release notes

### 10.6 Communication Channels

**P0 Bugs:**
- Slack: #incidents channel (@here mention)
- Email: team@savorai.app (immediate)
- Status page update (jeśli dotyczy production)

**P1 Bugs:**
- Slack: #bugs channel
- Daily standup mention
- GitHub Issue comments

**P2/P3 Bugs:**
- GitHub Issue comments
- Weekly bug triage meeting

### 10.7 Bug Metrics i Reporting

**Weekly Bug Report:**
- Nowe bugi: X
- Zamknięte bugi: Y
- Open bugs by severity: P0: X, P1: Y, P2: Z, P3: W
- Average time to fix: P0: Xh, P1: Yh
- Bug escape rate: X% (bugs found in production)

**Monthly Quality Report:**
- Test coverage trend
- Bug density (bugs per 1000 LOC)
- Regression rate
- Top bug categories
- Improvement recommendations

### 10.8 Escalation Matrix

**P0 (Critical):**
- 0-1h: QA Engineer → Team Lead
- 1-4h: Team Lead → CTO
- 4h+: CTO → Stakeholders + postmortem planning

**P1 (High):**
- 0-8h: QA Engineer → Team Lead
- 8-24h: Team Lead → CTO
- 24h+: Daily status updates

**P2 (Medium):**
- 0-3 days: QA Engineer → Team Lead
- 3+ days: Weekly status updates

**P3 (Low):**
- No escalation required
- Tracked in backlog

### 10.9 Postmortem Process (dla P0)

Po każdym P0 bug w production:

**1. Incident Timeline**
- Kiedy bug został wprowadzony
- Kiedy został wykryty
- Impact (ilu użytkowników)
- Time to fix

**2. Root Cause Analysis**
- Dlaczego bug się pojawił
- Dlaczego nie został wykryty wcześniej
- Które testy powinny były go złapać

**3. Action Items**
- Nowe testy do dodania
- Process improvements
- Tooling improvements
- Training needs

**4. Follow-up**
- Review po 2 tygodniach
- Verification że action items zostały wykonane

---

## Podsumowanie

Niniejszy plan testów zapewnia kompleksowe pokrycie aplikacji SavorAI we wszystkich krytycznych obszarach. Kluczowe elementy:

✅ **8 typów testów:** Unit, Integration, E2E, API, Security, Performance, UI/UX, Regression
✅ **60+ szczegółowych scenariuszy testowych** dla kluczowych funkcjonalności
✅ **Jasne kryteria akceptacji:** 80% coverage, Lighthouse >90, 0 P0 bugs
✅ **8-tygodniowy harmonogram** implementacji
✅ **Zdefiniowane role i odpowiedzialności** dla całego team
✅ **Szczegółowe procedury bug reporting** z 4 poziomami severity

Plan uwzględnia specyfikę:
- Astro Islands architecture
- Supabase RLS i auth
- AI integration (OpenRouter, Google)
- React Query state management
- Full-stack TypeScript

**Priorytet na bezpieczeństwo:** Szczególny nacisk na RLS policies, input validation, i zabezpieczenie API keys.

**Priorytet na performance:** Lighthouse audits, load testing, database query optimization.

**Priorytet na accessibility:** WCAG AA compliance, keyboard navigation, screen reader support.

Plan jest żywy i będzie aktualizowany w miarę rozwoju projektu.
