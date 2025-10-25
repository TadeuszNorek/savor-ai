# Testing Guide - Savor AI

**Kompletny przewodnik po testowaniu projektu**

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Quick Commands](#quick-commands)
3. [Testing Strategy](#testing-strategy)
4. [Implementation Plan](#implementation-plan)
5. [Project Structure](#project-structure)
6. [Writing Tests](#writing-tests)
7. [Best Practices](#best-practices)
8. [Debugging](#debugging)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This project uses a comprehensive testing setup with:

- **Vitest** - Unit and integration tests
- **Playwright** - E2E tests (Chromium only)
- **Testing Library** - React component testing
- **MSW (Mock Service Worker)** - API mocking

### Coverage Goal

Minimum **80% code coverage** for:
- ✅ Lines
- ✅ Functions
- ✅ Branches
- ✅ Statements

---

## Quick Commands

### Unit Tests
```bash
npm test                  # Run tests in watch mode
npm run test:run          # Run tests once
npm run test:ui           # Run tests with UI
npm run test:coverage     # Run tests with coverage report
npm run test:watch        # Watch mode (alias for npm test)
```

### E2E Tests
```bash
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Run E2E tests in UI mode
npm run test:e2e:debug    # Debug E2E tests
npm run test:e2e:codegen  # Generate test code with Playwright
```

### All Tests
```bash
npm run test:all          # Run both unit and E2E tests
```

---

## Testing Strategy

### 🎯 Layered Approach

Testy implementujemy **warstwami** - od fundamentalnych komponentów (bez zależności) do najbardziej złożonych (z wieloma zależnościami).

**Dlaczego ta strategia?**

1. ✅ **Szybkie feedback** - proste testy są szybkie do napisania i uruchomienia
2. ✅ **Solidne fundamenty** - dobrze przetestowane podstawowe funkcje wspierają bardziej złożone testy
3. ✅ **Minimalizacja mockowania** - testowanie rzeczywistych implementacji gdzie to możliwe
4. ✅ **Wysoka wartość biznesowa** - priorytet dla krytycznych ścieżek użytkownika

---

## Implementation Plan

> **Szczegółowe TODO listy:**
> - Unit Tests: `UNIT_TESTS_TASKS.md` (52 taski)
> - E2E Tests: `E2E_TESTS_TASKS.md` (13 tasków)

### 📊 Total Scope

```
Unit Tests:     52 pliki testowe  |  ~480 testów  |  3-4 tygodnie
E2E Tests:      13 plików spec    |  ~128 testów  |  1.5-2 tygodnie
─────────────────────────────────────────────────────────────────
TOTAL:          65 plików         |  ~608 testów  |  5-6 tygodni
```

---

### 🎯 Unit Tests - 10 Faz

#### **Faza 1: Utilities & Pure Functions** (KRYTYCZNY)

**Dlaczego najpierw:**
- Brak zależności zewnętrznych
- Deterministyczne wyniki
- Szybkie do napisania
- Fundamentalne dla reszty aplikacji

**Co testujemy:**
- `src/lib/utils.ts` - funkcja `cn()` ✅
- `src/lib/utils/cursor.ts` - paginacja kursorowa

**Oszacowanie:** 15-20 testów | Priority: HIGH

---

#### **Faza 2: Validation & Schemas** (KRYTYCZNY)

**Dlaczego teraz:**
- Bezpieczeństwo typu
- Walidacja danych wejściowych
- Krytyczne dla bezpieczeństwa aplikacji
- Używane w całej aplikacji

**Co testujemy:**
- `src/lib/auth/validation.ts` - email, password validation
- `src/lib/schemas/common.schema.ts` - UUID validation
- `src/lib/schemas/recipe.schema.ts` - Recipe schema
- `src/lib/schemas/profile.schema.ts` - Profile schema

**Oszacowanie:** 50-65 testów | Priority: HIGH

---

#### **Faza 3: Mappers & Transformers** (WYSOKI)

**Dlaczego teraz:**
- Zależność tylko od schematów
- Krytyczne dla integralności danych
- Transformacje DTO ↔ ViewModel

**Co testujemy:**
- `src/lib/mappers/profile.ts` - Profile transformations
- `src/lib/services/ai/utils/recipe-response-parser.ts` - AI response parsing

**Oszacowanie:** 40-50 testów | Priority: HIGH/MEDIUM

---

#### **Faza 4: UI Components - Shadcn/ui** (WYSOKI)

**Dlaczego teraz:**
- Podstawowe building blocks UI
- Wysokie pokrycie z małym wysiłkiem
- Używane w całej aplikacji

**Co testujemy:**
- `src/components/ui/button.tsx` ✅
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/skeleton.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/tooltip.tsx`

**Oszacowanie:** 40-50 testów | Priority: HIGH

---

#### **Faza 5: Custom Hooks** (WYSOKI)

**Dlaczego teraz:**
- Reusable logic
- Często używane w komponentach
- Można testować izolowanie

**Co testujemy:**
- `src/lib/hooks/useUrlFilters.ts` - URL parameter handling
- `src/lib/hooks/useScrollRestoration.ts` - Scroll position restoration

**Oszacowanie:** 20-25 testów | Priority: HIGH

---

#### **Faza 6: API Clients** (ŚREDNI)

**Dlaczego teraz:**
- Używają MSW do mockowania
- Setup już gotowy
- Krytyczne dla komunikacji z backendem

**Co testujemy:**
- `src/lib/api/http.ts` - HTTP client
- `src/lib/api/recipes.ts` - Recipes API
- `src/lib/api/profile.ts` - Profile API

**Oszacowanie:** 45-55 testów | Priority: MEDIUM

---

#### **Faza 7: Auth Components** (KRYTYCZNY)

**Dlaczego teraz:**
- Krytyczna funkcjonalność
- Security-critical
- Wymaga dobrze przetestowanych validatorów (już done)

**Co testujemy:**
- `src/components/auth/EmailInput.tsx`
- `src/components/auth/PasswordInput.tsx`
- `src/components/auth/AuthForm.tsx`
- `src/lib/auth/api.ts` - Auth API
- `src/lib/auth/useAuth.ts` - Auth hook

**Oszacowanie:** 45-55 testów | Priority: HIGH

---

#### **Faza 8: Application Components** (ŚREDNI)

**Dlaczego teraz:**
- Złożone komponenty biznesowe
- Wymagają wielu zależności
- Wysoka wartość biznesowa

**Co testujemy:**
- Recipe Components: RecipeCard, RecipeList, RecipePreview, SearchBar, SortSelect
- Profile Components: TagsInput, DietTypeSelect, ProfileForm

**Oszacowanie:** 65-80 testów | Priority: MEDIUM

---

#### **Faza 9: Services** (ŚREDNI)

**Dlaczego teraz:**
- Business logic layer
- Orchestration
- Wymaga mockowania API

**Co testujemy:**
- `src/lib/services/recipes.service.ts`
- `src/lib/services/profiles.service.ts`
- `src/lib/services/events.service.ts`

**Oszacowanie:** 35-40 testów | Priority: MEDIUM

---

#### **Faza 10: AI Providers** (NISKI)

**Dlaczego na końcu:**
- Najbardziej złożone
- Zewnętrzne zależności
- Wymaga rozbudowanego mockowania
- Nie wpływa na podstawową funkcjonalność

**Co testujemy:**
- AI Utilities: recipe-prompt-builder, llm-request-manager
- AI Providers: mock, google, openrouter
- AI Service: orchestration, fallback logic

**Oszacowanie:** 75-95 testów | Priority: LOW

---

### 🏆 Milestones

#### **MILESTONE 1: Fundamenty** (Fazy 1-3)
```
Tasks:      TASK 1-6 z UNIT_TESTS_TASKS.md
Tests:      ~120 testów
Time:       2-3 dni
Priority:   KRYTYCZNY
Coverage:   Utilities, validation, schemas, mappers
```

#### **MILESTONE 2: UI & Hooks** (Fazy 4-5)
```
Tasks:      TASK 7-17 z UNIT_TESTS_TASKS.md
Tests:      ~65 testów
Time:       2-3 dni
Priority:   WYSOKI
Coverage:   UI components, custom hooks
```

#### **MILESTONE 3: Auth** (Faza 7)
```
Tasks:      TASK 18-22 z UNIT_TESTS_TASKS.md
Tests:      ~45 testów
Time:       1-2 dni
Priority:   KRYTYCZNY
Coverage:   Auth components, auth logic
```

#### **MILESTONE 4: API & Components** (Fazy 6, 8)
```
Tasks:      TASK 23-40 z UNIT_TESTS_TASKS.md
Tests:      ~120 testów
Time:       1-1.5 tygodnia
Priority:   ŚREDNI
Coverage:   API clients, app components
```

#### **MILESTONE 5: Services & AI** (Fazy 9-10)
```
Tasks:      TASK 41-49 z UNIT_TESTS_TASKS.md
Tests:      ~130 testów
Time:       1 tydzień
Priority:   ŚREDNI/NISKI
Coverage:   Services, AI providers
```

---

### 🎯 E2E Tests - Critical User Journeys

**Implementacja: PO zakończeniu Unit Tests**

#### **Journey 1: Authentication**
- Login/Logout
- Sign up
- Password reset

**Oszacowanie:** 30 testów | 2-3 dni

#### **Journey 2: Recipe Generation**
- AI-powered recipe creation
- Regenerate recipe

**Oszacowanie:** 12 testów | 1-2 dni

#### **Journey 3: Recipe CRUD**
- Save recipe
- View recipe list & details
- Delete recipe

**Oszacowanie:** 28 testów | 3-4 dni

#### **Journey 4: Search & Filter**
- Search recipes
- Filter by tags
- Sort recipes

**Oszacowanie:** 28 testów | 3-4 dni

#### **Journey 5: Profile Management**
- Create/update profile
- Manage preferences

**Oszacowanie:** 15 testów | 2 dni

#### **Journey 6: Navigation & UI**
- Navigation flows
- Dark mode
- Responsive UI

**Oszacowanie:** 10 testów | 1 dzień

---

### 📊 Priorytety - Podsumowanie

| Priorytet | Fazy | Testy | Czas |
|-----------|------|-------|------|
| **KRYTYCZNY** | 1-3, 7 | ~165 testów | 4-6 dni |
| **WYSOKI** | 4-5 | ~65 testów | 2-3 dni |
| **ŚREDNI** | 6, 8-9 | ~195 testów | 2-3 tygodnie |
| **NISKI** | 10 | ~75 testów | 1 tydzień |

**Rekomendacja:** Zrób Milestones 1-3 (priorytety KRYTYCZNY + WYSOKI) w pierwszej kolejności.

---

### ✅ Metryki Sukcesu

- ✅ Wszystkie testy przechodzą
- ✅ Coverage >80% we wszystkich kategoriach (lines, functions, branches, statements)
- ✅ Czas wykonania unit tests <30s
- ✅ Brak flaky tests
- ✅ CI/CD pipeline zielony

---

## Project Structure

```
tests/
├── unit/                 # Unit tests for utilities and components
│   ├── utils/           # Utility function tests
│   ├── auth/            # Auth validation tests
│   ├── schemas/         # Zod schema tests
│   ├── mappers/         # DTO/ViewModel mapper tests
│   ├── hooks/           # Custom hook tests
│   ├── api/             # API client tests
│   ├── services/        # Service layer tests
│   └── components/      # React component tests
│       ├── ui/          # Shadcn/ui components
│       ├── auth/        # Auth components
│       ├── app/         # App components
│       └── profile/     # Profile components
│
├── integration/          # Integration tests for API flows
│   └── api.test.ts      # API integration tests ✅
│
├── mocks/               # MSW mock handlers
│   ├── handlers.ts      # API mock definitions
│   └── server.ts        # MSW server setup
│
├── utils/               # Test utilities and helpers
│   └── test-utils.tsx   # Custom render with providers
│
└── setup.ts             # Global test setup (MSW, Testing Library)

e2e/
├── pages/               # Page Object Models
│   ├── base.page.ts     # Base POM class
│   ├── login.page.ts    # Login page ✅
│   ├── app.page.ts      # Main app page
│   └── ...
│
├── helpers/             # E2E helpers
│   ├── auth.helpers.ts  # Auth utilities
│   └── cleanup.helpers.ts # Data cleanup
│
├── fixtures/            # Test data and fixtures
│   ├── test-data.ts     # Centralized test data ✅
│   └── test-users.ts    # User credentials
│
└── specs/               # E2E test files
    ├── auth/            # Authentication tests
    ├── recipes/         # Recipe CRUD tests
    ├── search/          # Search & filter tests
    └── profile/         # Profile management tests
```

---

## Writing Tests

### Unit Test Example

Create `tests/unit/my-function.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/lib/myFunction';

describe('myFunction', () => {
  it('should work correctly', () => {
    // Arrange
    const input = 'test input';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected output');
  });
});
```

---

### Component Test Example

Create `tests/unit/components/MyComponent.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText(/my component/i)).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<MyComponent onClick={handleClick} />);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

---

### E2E Test Example

Create `e2e/specs/my-feature.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display welcome message', async ({ page }) => {
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.getByRole('link', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
```

---

### Mocking API Calls (MSW)

Add handlers to `tests/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // GET request
  http.get('/api/recipes', () => {
    return HttpResponse.json({
      data: [
        { id: '1', name: 'Test Recipe', description: 'A test recipe' }
      ]
    });
  }),

  // POST request
  http.post('/api/recipes', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: body
    }, { status: 201 });
  }),

  // Error scenario
  http.delete('/api/recipes/:id', () => {
    return new HttpResponse(null, { status: 500 });
  }),
];
```

The MSW server is automatically set up in `tests/setup.ts` and will intercept all HTTP requests during tests.

---

## Best Practices

### Unit Tests

1. ✅ **Test one thing at a time** - Each test should verify a single behavior
2. ✅ **Use descriptive test names** - Name should describe what is being tested
3. ✅ **Follow Arrange-Act-Assert pattern** - Organize test code clearly
4. ✅ **Mock external dependencies** - Use MSW for API calls, vi.fn() for functions
5. ✅ **Aim for 80%+ coverage** - But focus on meaningful tests, not arbitrary percentages
6. ✅ **Test edge cases** - Empty inputs, null values, invalid data
7. ✅ **Keep tests fast** - Avoid unnecessary waits or sleeps
8. ✅ **Make tests independent** - Each test should work in isolation

### E2E Tests

1. ✅ **Use Page Object Model** - Encapsulate page logic in classes
2. ✅ **Test critical user journeys** - Focus on happy paths and common errors
3. ✅ **Keep tests independent** - Each test should set up its own data
4. ✅ **Use meaningful selectors** - Prefer getByRole, getByLabel, getByText over CSS
5. ✅ **Add screenshots for failures** - Playwright does this automatically
6. ✅ **Leverage auto-wait** - Playwright waits for elements automatically
7. ✅ **Clean up test data** - Use cleanup helpers to remove test data
8. ✅ **Use fixtures for test data** - Centralize test data in fixtures/

### Component Tests

1. ✅ **Test from user perspective** - Test what users see and do
2. ✅ **Use Testing Library queries** - getByRole, getByLabelText, etc.
3. ✅ **Test accessibility** - Verify proper ARIA attributes
4. ✅ **Use userEvent over fireEvent** - More realistic user interactions
5. ✅ **Don't test implementation details** - Test behavior, not internals

---

## Debugging

### Vitest Debugging

```bash
# Visual debugging with UI
npm run test:ui

# Watch mode for quick feedback
npm run test:watch

# Run specific test file
npx vitest tests/unit/utils/cursor.test.ts

# Run tests matching pattern
npx vitest --grep "should encode cursor"

# Debug in VS Code
# Add breakpoint and press F5 (Debug Vitest test)
```

### Playwright Debugging

```bash
# Step-by-step debugging
npm run test:e2e:debug

# UI mode for interactive debugging
npm run test:e2e:ui

# View HTML report
npx playwright show-report

# View trace
npx playwright show-trace trace.zip

# Generate test code
npm run test:e2e:codegen
```

---

## Coverage Reports

Run coverage and view the report:

```bash
npm run test:coverage
# Open coverage/index.html in browser
```

**Coverage Thresholds (80%):**
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

**Tips:**
- Focus on critical paths first
- Don't chase 100% coverage
- Test behavior, not implementation
- Some files may not need 80% (e.g., config files)

---

## CI/CD

Tests run automatically on:
- ✅ Every push to main/master/develop
- ✅ Every pull request
- ✅ Before deployment

See `.github/workflows/test.yml` for configuration.

**CI Pipeline:**
1. Install dependencies
2. Run unit tests
3. Run unit tests with coverage
4. Run E2E tests
5. Upload coverage reports
6. Upload Playwright reports

---

## Troubleshooting

### Common Issues

#### **Tests fail with import errors**
```bash
# Solution 1: Check vitest.config.ts alias configuration
# Solution 2: Ensure TypeScript paths match
# Solution 3: Clear Vitest cache
npx vitest --clearCache
```

#### **Playwright can't find elements**
```bash
# Solution 1: Use codegen to generate selectors
npx playwright codegen

# Solution 2: Check if element is visible
await expect(page.getByText('foo')).toBeVisible();

# Solution 3: Use page.pause() to debug
await page.pause();

# Solution 4: Check trace
npx playwright show-trace trace.zip
```

#### **MSW not intercepting requests**
```bash
# Solution 1: Verify handlers in tests/mocks/handlers.ts
# Solution 2: Check server setup in tests/setup.ts
# Solution 3: Ensure URLs match exactly
# Solution 4: Check if server is listening
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
```

#### **Flaky E2E tests**
```bash
# Solution 1: Use Playwright auto-wait (don't use waitForTimeout)
# Solution 2: Use proper locators (getByRole, not CSS)
# Solution 3: Ensure data cleanup between tests
# Solution 4: Use retry mechanism
test.describe.configure({ retries: 2 });
```

#### **Coverage not updating**
```bash
# Solution 1: Clear coverage cache
rm -rf coverage/

# Solution 2: Ensure files are imported in tests
# Solution 3: Check coverage exclude patterns in vitest.config.ts
```

---

## Resources

### Documentation
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [MSW Docs](https://mswjs.io/)

### Project Docs
- `UNIT_TESTS_TASKS.md` - Unit test TODO list (52 tasks)
- `E2E_TESTS_TASKS.md` - E2E test TODO list (13 tasks)
- `tests/README.md` - Detailed testing documentation

### Quick Links
- [Vitest API](https://vitest.dev/api/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [MSW Examples](https://mswjs.io/docs/basics/response-resolver)

---

## Getting Started

### Quick Start Checklist

```bash
# 1. Install dependencies (already done)
npm install

# 2. Run example tests to verify setup
npm test

# 3. Check coverage
npm run test:coverage

# 4. Run E2E tests
npm run test:e2e

# 5. Open TODO list and start implementing
code UNIT_TESTS_TASKS.md

# 6. Find first task
# TASK 1: tests/unit/utils/cursor.test.ts

# 7. Write tests following examples above

# 8. Commit after each task
git commit -m "test: add cursor pagination tests (15 tests)"

# 9. Repeat for all 52 tasks

# 10. Move to E2E tests
code E2E_TESTS_TASKS.md
```

---

## Next Steps

1. ✅ Read this guide
2. ✅ Open `UNIT_TESTS_TASKS.md`
3. ✅ Start with **TASK 1** (cursor.test.ts)
4. ✅ Write tests following best practices
5. ✅ Run `npm run test:watch` during development
6. ✅ Check coverage with `npm run test:coverage`
7. ✅ Commit after each task
8. ✅ Complete Milestones 1-3 first (KRYTYCZNY + WYSOKI)
9. ✅ Continue with Milestones 4-5
10. ✅ Move to E2E tests (`E2E_TESTS_TASKS.md`)

---

**Start here:** `UNIT_TESTS_TASKS.md` → TASK 1

*Last updated: 2025-10-25*
