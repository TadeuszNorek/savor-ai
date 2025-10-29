# Testing Documentation

This project uses **Vitest** for unit tests and **Playwright** for E2E tests.

## Unit Tests (Vitest)

### Running Unit Tests

```bash
# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Writing Unit Tests

- Place unit tests in `tests/unit/` directory
- Name test files with `.test.ts` or `.test.tsx` extension
- Use the Page Object Model pattern for component tests
- Follow the Arrange-Act-Assert pattern

#### Example Unit Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText(/my component/i)).toBeInTheDocument();
  });
});
```

### Mocking HTTP Requests

This project uses **MSW (Mock Service Worker)** for mocking HTTP requests in tests.

- Define request handlers in `tests/mocks/handlers.ts`
- The MSW server is automatically set up in `tests/setup.ts`

#### Example MSW Handler

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/user', () => {
    return HttpResponse.json({ name: 'John Doe' });
  }),
];
```

### Coverage Requirements

- Minimum 80% coverage for lines, functions, branches, and statements
- Run `npm run test:coverage` to check coverage
- Coverage reports are generated in `coverage/` directory

## E2E Tests (Playwright)

### Running E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Generate test code with Playwright Codegen
npm run test:e2e:codegen
```

### Writing E2E Tests

- Place E2E tests in `e2e/` directory
- Name test files with `.spec.ts` extension
- Use the Page Object Model pattern for better maintainability
- Place page objects in `e2e/pages/` directory
- Place test fixtures in `e2e/fixtures/` directory

#### Example E2E Test

```typescript
import { test, expect } from '@playwright/test';

test('should navigate to home page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/savor/i);
});
```

#### Example Page Object

```typescript
import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    // ... rest of login logic
  }
}
```

### Playwright Best Practices

1. **Use Locators**: Prefer `page.getByRole()`, `page.getByLabel()`, `page.getByText()` over CSS selectors
2. **Auto-wait**: Playwright automatically waits for elements to be ready
3. **Page Object Model**: Encapsulate page logic in Page Object classes
4. **Test Isolation**: Each test should be independent and isolated
5. **Visual Regression**: Use `expect(page).toHaveScreenshot()` for visual testing
6. **Debugging**: Use `--debug` flag or `.pause()` for step-by-step debugging

## Running All Tests

```bash
# Run both unit and E2E tests
npm run test:all
```

## CI/CD Integration

Tests are automatically run in CI/CD pipelines. The configuration:

- Unit tests run on every commit
- E2E tests run before deployment
- Coverage reports are generated and tracked
- Failed tests block the deployment

## Test Structure

```
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── mocks/            # MSW handlers and server setup
└── setup.ts          # Global test setup

e2e/
├── pages/            # Page Object Models
├── fixtures/         # Test fixtures and data
└── *.spec.ts         # E2E test files
```

## Troubleshooting

### Vitest Issues

- If tests fail to import modules, check `vitest.config.ts` alias configuration
- For DOM-related tests, ensure `environment: 'jsdom'` is set in config
- Clear Vitest cache: `npx vitest --clearCache`

### Playwright Issues

- If browsers are not installed: `npx playwright install chromium`
- For slow tests, check network throttling and timeouts
- Use trace viewer for debugging: `npx playwright show-trace trace.zip`
- Generate test report: `npx playwright show-report`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
