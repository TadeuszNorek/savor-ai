# Testing Quick Start Guide

## Overview

This project uses a comprehensive testing setup with:
- **Vitest** for unit and integration tests
- **Playwright** for E2E tests
- **Testing Library** for React component testing
- **MSW** for API mocking

## Quick Commands

### Unit Tests
```bash
npm test                  # Run tests in watch mode
npm run test:run          # Run tests once
npm run test:ui           # Run tests with UI
npm run test:coverage     # Run tests with coverage report
```

### E2E Tests
```bash
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Run E2E tests in UI mode
npm run test:e2e:debug    # Debug E2E tests
npm run test:e2e:codegen  # Generate test code
```

### All Tests
```bash
npm run test:all          # Run both unit and E2E tests
```

## Project Structure

```
tests/
├── unit/              # Unit tests for utilities and components
├── integration/       # Integration tests for API calls
├── mocks/            # MSW mock handlers
│   ├── handlers.ts   # API mock definitions
│   └── server.ts     # MSW server setup
├── utils/            # Test utilities and helpers
│   └── test-utils.tsx # Custom render with providers
└── setup.ts          # Global test setup

e2e/
├── pages/            # Page Object Models
│   └── login.page.ts # Example POM
├── fixtures/         # Test data and fixtures
│   └── test-data.ts  # Centralized test data
└── *.spec.ts         # E2E test files
```

## Writing Your First Test

### Unit Test Example

Create `tests/unit/my-function.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/lib/myFunction';

describe('myFunction', () => {
  it('should work correctly', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Component Test Example

Create `tests/unit/MyComponent.test.tsx`:

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

### E2E Test Example

Create `e2e/my-feature.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test('should test my feature', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Welcome')).toBeVisible();
});
```

## Best Practices

### Unit Tests
1. Test one thing at a time
2. Use descriptive test names
3. Follow Arrange-Act-Assert pattern
4. Mock external dependencies
5. Aim for 80%+ coverage

### E2E Tests
1. Use Page Object Model
2. Test critical user journeys
3. Keep tests independent
4. Use meaningful selectors (role, label, text)
5. Add screenshots for failures

## Mocking API Calls

Add handlers to `tests/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/recipes', () => {
    return HttpResponse.json({
      data: [{ id: '1', name: 'Test Recipe' }]
    });
  }),
];
```

## Debugging Tests

### Vitest Debugging
```bash
npm run test:ui          # Visual debugging
npm run test:watch       # Watch mode for quick feedback
```

### Playwright Debugging
```bash
npm run test:e2e:debug   # Step-by-step debugging
npx playwright show-report  # View HTML report
```

## Coverage Reports

Run coverage and view the report:
```bash
npm run test:coverage
# Open coverage/index.html in browser
```

Coverage thresholds (80%):
- Lines
- Functions
- Branches
- Statements

## CI/CD

Tests run automatically on:
- Every push to main/master/develop
- Every pull request
- Before deployment

See `.github/workflows/test.yml` for configuration.

## Troubleshooting

### Common Issues

**Tests fail with import errors**
- Check `vitest.config.ts` alias configuration
- Ensure TypeScript paths match

**Playwright can't find elements**
- Use `npx playwright codegen` to generate selectors
- Check if element is visible/ready
- Use `page.pause()` to debug

**MSW not intercepting requests**
- Verify handlers are defined in `tests/mocks/handlers.ts`
- Check server setup in `tests/setup.ts`
- Ensure URLs match exactly

## Resources

- [Full Testing Documentation](./tests/README.md)
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [MSW Docs](https://mswjs.io/)

## Next Steps

1. Run example tests: `npm test`
2. Explore test files in `tests/` and `e2e/`
3. Write tests for your features
4. Check coverage: `npm run test:coverage`
5. Run E2E tests: `npm run test:e2e`
