# Test Standards for catchup-feed-frontend

**Purpose**: Enforce consistent test patterns across unit, integration, and E2E tests based on actual codebase conventions.

---

## Test File Organization

### File Naming & Location
- **Unit/Integration Tests**: `*.test.ts` or `*.test.tsx` adjacent to source file
- **API Tests**: `__tests__/` directory for isolated test suites
- **E2E Tests**: `tests/e2e/` directory organized by feature
- **Test Factories**: `src/__test__/factories/` for reusable mock data

**Examples from codebase**:
```
✓ src/components/ui/button.test.tsx
✓ src/hooks/useArticle.test.ts
✓ src/lib/api/endpoints/__tests__/sources.test.ts
✓ src/__test__/factories/articleFactory.ts
✓ tests/e2e/auth/login.spec.ts
```

### Test Structure Pattern
All tests follow the **Arrange-Act-Assert (AAA)** pattern with explicit comments:

**From**: `/Users/yujitsuchiya/catchup-feed-frontend/src/lib/api/endpoints/__tests__/sources.test.ts`
```typescript
it('should call GET /sources endpoint', async () => {
  // Arrange
  const mockResponse: SourcesResponse = [
    {
      id: 1,
      name: 'Test Source',
      feed_url: 'https://example.com/feed.xml',
      active: true,
      last_crawled_at: '2025-01-15T10:00:00Z',
    },
  ];
  vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

  // Act
  const result = await getSources();

  // Assert
  expect(apiClient.get).toHaveBeenCalledTimes(1);
  expect(apiClient.get).toHaveBeenCalledWith('/sources');
  expect(result).toEqual(mockResponse);
});
```

---

## Test Imports & Setup

### Required Imports Pattern
**From**: `/Users/yujitsuchiya/catchup-feed-frontend/src/components/auth/LoginForm.test.tsx`
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentUnderTest } from './ComponentUnderTest';
```

### Mock Setup Pattern
- Always use `vi.mock()` at top level before tests
- Clear/restore mocks in `beforeEach`/`afterEach`
- Use descriptive mock names prefixed with `mock`

**From**: `/Users/yujitsuchiya/catchup-feed-frontend/src/components/auth/LoginForm.test.tsx`
```typescript
// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('LoginForm Integration Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });
});
```

---

## Test Naming Conventions

### Test Suite Organization
Use nested `describe` blocks for logical grouping:

**From**: `/Users/yujitsuchiya/catchup-feed-frontend/src/hooks/useDebounce.test.ts`
```typescript
describe('useDebounce', () => {
  describe('Basic Functionality', () => {
    it('should return initial value immediately', () => {
      // test implementation
    });
  });

  describe('Default Delay', () => {
    it('should use default delay of 300ms', () => {
      // test implementation
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      // test implementation
    });
  });
});
```

### Test Description Format
- **Component Tests**: "should [expected behavior] when [condition]"
- **Hook Tests**: "should [action/return] [details]"
- **API Tests**: "should [action] [API operation]"
- **Utility Tests**: "should [transform/validate] [input] [details]"

**Examples from codebase**:
```typescript
✓ "should render button with text"
✓ "should handle click events"
✓ "should fetch article by ID"
✓ "should call GET /sources endpoint"
✓ "should debounce value changes by specified delay"
```

---

## Component Testing Patterns

### Basic Rendering Tests
**From**: `/Users/yujitsuchiya/catchup-feed-frontend/src/components/ui/button.test.tsx`
```typescript
describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button', { name: /custom/i });
    expect(button).toHaveClass('custom-class');
  });
});
```

### User Interaction Tests
**From**: `/Users/yujitsuchiya/catchup-feed-frontend/src/components/ui/button.test.tsx`
```typescript
it('should handle click events', async () => {
  const handleClick = vi.fn();
  const user = userEvent.setup();

  render(<Button onClick={handleClick}>Click me</Button>);

  const button = screen.getByRole('button', { name: /click me/i });
  await user.click(button);

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Form Validation Tests
**From**: `/Users/yujitsuchiya/catchup-feed-frontend/src/components/auth/LoginForm.test.tsx`
```typescript
describe('Form Validation', () => {
  it('should show validation error when email is empty', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<LoginForm />);

    // Act
    const submitButton = screen.getByRole('button', { name: /login/i });
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });
});
```

### Accessibility Tests
**From**: `/Users/yujitsuchiya/catchup-feed-frontend/src/components/articles/ArticleCard.test.tsx`
```typescript
describe('Accessibility', () => {
  it('should have semantic article element', () => {
    const article = createMockArticle();
    render(<ArticleCard article={article} />);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('should have time element with datetime attribute', () => {
    const publishedAt = '2025-01-15T10:00:00Z';
    const article = createMockArticle({ published_at: publishedAt });
    render(<ArticleCard article={article} />);
    const timeElement = screen.getByRole('time');
    expect(timeElement).toHaveAttribute('datetime', publishedAt);
  });
});
```

---

## Hook Testing Patterns

### QueryClientProvider Wrapper
**From**: `/Users/yujitsuchiya/catchup-feed-frontend/src/hooks/useArticle.test.ts`
```typescript
describe('useArticle', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    const Wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    Wrapper.displayName = 'TestQueryClientProvider';
    return Wrapper;
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch article by ID', async () => {
    vi.mocked(articleApi.getArticle).mockResolvedValue(mockArticle);

    const { result } = renderHook(() => useArticle(1), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.article).toBe(null);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.article).toEqual(mockArticle);
  });
});
```

### Timer Testing
**From**: `/Users/yujitsuchiya/catchup-feed-frontend/src/hooks/useDebounce.test.ts`
```typescript
describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce value changes by specified delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated' });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Advance timer
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('updated');
  });
});
```

---

## API Endpoint Testing Patterns

### Mocking apiClient
**From**: `/Users/yujitsuchiya/catchup-feed-frontend/src/lib/api/endpoints/__tests__/sources.test.ts`
```typescript
// Mock the API client
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Sources API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSources', () => {
    it('should call GET /sources endpoint', async () => {
      // Arrange
      const mockResponse: SourcesResponse = [/* mock data */];
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      // Act
      const result = await getSources();

      // Assert
      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/sources');
      expect(result).toEqual(mockResponse);
    });
  });
});
```

### Error Handling Tests
**From**: `/Users/yujitsuchiya/catchup-feed-frontend/src/lib/api/endpoints/__tests__/sources.test.ts`
```typescript
describe('Error Handling', () => {
  it('should propagate API errors', async () => {
    // Arrange
    const mockError = new ApiError('Server Error', 500);
    vi.mocked(apiClient.get).mockRejectedValue(mockError);

    // Act & Assert
    await expect(getSources()).rejects.toThrow(ApiError);
    await expect(getSources()).rejects.toThrow('Server Error');
  });

  it('should throw ApiError on 404 Not Found', async () => {
    // Arrange
    const mockError = new ApiError('Not Found', 404);
    vi.mocked(apiClient.put).mockRejectedValue(mockError);

    // Act & Assert
    await expect(updateSourceActive(999, true)).rejects.toThrow(ApiError);
    await expect(updateSourceActive(999, true)).rejects.toThrow('Not Found');

    const error = await updateSourceActive(999, true).catch((e) => e);
    expect(error.status).toBe(404);
  });
});
```

---

## Test Data Factories

### Factory Pattern
**From**: `/Users/yujitsuchiya/catchup-feed-frontend/src/__test__/factories/articleFactory.ts`
```typescript
/**
 * Article Mock Data Factory
 *
 * Centralized factory for creating mock Article objects in tests.
 * Ensures consistency across all test files.
 */

import type { Article } from '@/types/api';

const defaultArticle: Article = {
  id: 1,
  source_id: 1,
  source_name: 'Tech Blog',
  title: 'Test Article Title',
  url: 'https://example.com/article',
  summary: 'This is a test article summary for testing purposes.',
  published_at: '2025-01-01T00:00:00Z',
  created_at: '2025-01-01T00:00:00Z',
};

/**
 * Creates a single mock article with optional overrides.
 */
export function createMockArticle(overrides: Partial<Article> = {}): Article {
  return {
    ...defaultArticle,
    ...overrides,
  };
}

/**
 * Creates multiple mock articles with sequential IDs.
 */
export function createMockArticles(
  count: number,
  overridesArray: Partial<Article>[] = []
): Article[] {
  return Array.from({ length: count }, (_, index) => {
    const overrides = overridesArray[index] || {};
    return createMockArticle({
      id: index + 1,
      title: `Test Article ${index + 1}`,
      ...overrides,
    });
  });
}
```

### Using Factories in Tests
**From**: `/Users/yujitsuchiya/catchup-feed-frontend/src/components/articles/ArticleCard.test.tsx`
```typescript
import { createMockArticle } from '@/__test__/factories/articleFactory';

describe('ArticleCard', () => {
  it('should render article title', () => {
    const article = createMockArticle({ title: 'My Article Title' });
    render(<ArticleCard article={article} />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'My Article Title' })
    ).toBeInTheDocument();
  });
});
```

---

## Edge Case & Boundary Testing

### Comprehensive Edge Case Coverage
**From**: `/Users/yujitsuchiya/catchup-feed-frontend/src/components/articles/ArticleCard.test.tsx`
```typescript
describe('Edge Cases', () => {
  it('should handle missing title gracefully', () => {
    const article = createMockArticle({ title: '' });
    render(<ArticleCard article={article} />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Untitled Article' })
    ).toBeInTheDocument();
  });

  it('should handle whitespace-only title', () => {
    const article = createMockArticle({ title: '   ' });
    render(<ArticleCard article={article} />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Untitled Article' })
    ).toBeInTheDocument();
  });

  it('should handle special characters in title', () => {
    const article = createMockArticle({ title: '<script>alert("xss")</script>' });
    render(<ArticleCard article={article} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      '<script>alert("xss")</script>'
    );
  });

  it('should handle null published_at', () => {
    const article = createMockArticle();
    article.published_at = null as unknown as string;
    render(<ArticleCard article={article} />);
    expect(screen.queryByRole('time')).not.toBeInTheDocument();
  });
});
```

### Validation & Boundary Tests
**From**: `/Users/yujitsuchiya/catchup-feed-frontend/src/lib/api/utils/__tests__/pagination.test.ts`
```typescript
describe('boundary values', () => {
  it('should use default page when page is 0', () => {
    const result = buildPaginationQuery(0, 10);
    expect(result).toBe('?page=1&limit=10');
  });

  it('should use default page when page is negative', () => {
    const result = buildPaginationQuery(-5, 10);
    expect(result).toBe('?page=1&limit=10');
  });

  it('should use default limit when limit is not in available sizes', () => {
    const result = buildPaginationQuery(1, 15);
    expect(result).toBe('?page=1&limit=10');
  });
});
```

---

## E2E Testing with Playwright

### Test Structure
**From**: `/Users/yujitsuchiya/catchup-feed-frontend/tests/e2e/auth/login.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import { loginAsUser, clearAuthToken, TEST_CREDENTIALS } from '../../fixtures/auth';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear auth tokens before each test
    await page.goto('/');
    await clearAuthToken(page);
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/login');

    // Check if login form elements are visible
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
  });
});
```

### API Mocking in E2E Tests
**From**: `/Users/yujitsuchiya/catchup-feed-frontend/tests/e2e/auth/login.spec.ts`
```typescript
test('should successfully login with valid credentials', async ({ page }) => {
  // Mock the login API endpoint
  await page.route('**/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: '1',
          email: TEST_CREDENTIALS.email,
          name: 'Test User',
        },
      }),
    });
  });

  // Use the login helper
  await loginAsUser(page);

  // Verify redirect to dashboard
  await expect(page).toHaveURL(/.*dashboard/);
});
```

### Testing Loading States
**From**: `/Users/yujitsuchiya/catchup-feed-frontend/tests/e2e/auth/login.spec.ts`
```typescript
test('should show loading state during login', async ({ page }) => {
  // Mock slow API response
  await page.route('**/api/auth/login', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: '1',
          email: TEST_CREDENTIALS.email,
        },
      }),
    });
  });

  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
  await page.fill('input[type="password"]', TEST_CREDENTIALS.password);
  await page.click('button[type="submit"]');

  // Check for loading state
  await expect(page.getByText(/logging in/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /logging in/i })).toBeDisabled();
});
```

---

## Coverage Requirements

### Minimum Coverage Targets
- **Unit Tests**: 80% line coverage minimum
- **Integration Tests**: All critical user flows
- **E2E Tests**: Major user journeys (auth, CRUD operations)

### Test Categories Required
Every component/function MUST test:
1. ✅ Happy path / successful cases
2. ✅ Error handling / failure cases
3. ✅ Edge cases (null, undefined, empty, whitespace)
4. ✅ Boundary values (min, max, zero, negative)
5. ✅ Accessibility (ARIA labels, roles, semantic HTML)
6. ✅ Loading states (for async operations)
7. ✅ Validation (for forms and inputs)

**Example Coverage from codebase**:
```typescript
// ✓ LoginForm.test.tsx has all categories:
// - Happy path: successful login
// - Error handling: invalid credentials, network errors
// - Edge cases: empty fields, whitespace, rapid submissions
// - Validation: email format, required fields
// - Accessibility: ARIA labels, roles, live regions
// - Loading states: form submission in progress
```

---

## Enforcement Checklist

### Before Committing Tests
- [ ] All tests follow AAA pattern with explicit comments
- [ ] Test descriptions clearly state expected behavior
- [ ] Mocks are cleared in `beforeEach` and restored in `afterEach`
- [ ] All async operations use `await` and `waitFor`
- [ ] Edge cases tested: null, undefined, empty, whitespace
- [ ] Accessibility tested: roles, ARIA labels, semantic elements
- [ ] No hardcoded test data (use factories instead)
- [ ] Error messages tested for all failure paths
- [ ] Loading states tested for async operations
- [ ] Test names follow conventions (should [action] when [condition])

### Code Review Checklist
- [ ] Tests are co-located with source files (or in `__tests__/`)
- [ ] Test factories used for complex mock data
- [ ] No test interdependencies (each test is isolated)
- [ ] No skipped tests without explanation (`.skip` with comment)
- [ ] Performance: timers use `vi.useFakeTimers()` appropriately
- [ ] All mocked modules listed at top of file
- [ ] Integration tests cover critical user flows
- [ ] E2E tests mock external APIs consistently

---

## Anti-Patterns to Avoid

### ❌ Don't: Test Implementation Details
```typescript
// Bad - testing internal state
expect(component.state.value).toBe('test');

// Good - testing behavior
expect(screen.getByRole('textbox')).toHaveValue('test');
```

### ❌ Don't: Use Hardcoded Test Data
```typescript
// Bad - hardcoded data
const article = { id: 1, title: 'Test', /* ... */ };

// Good - use factory
const article = createMockArticle({ title: 'Test' });
```

### ❌ Don't: Share State Between Tests
```typescript
// Bad - shared mutable state
let sharedData = [];
it('test 1', () => { sharedData.push(1); });
it('test 2', () => { sharedData.push(2); }); // depends on test 1

// Good - isolated state
it('test 1', () => {
  const data = [];
  data.push(1);
});
```

### ❌ Don't: Forget to Wait for Async
```typescript
// Bad - not waiting
it('should update', () => {
  fireEvent.click(button);
  expect(screen.getByText('Updated')).toBeInTheDocument(); // flaky!
});

// Good - wait for async
it('should update', async () => {
  await user.click(button);
  await waitFor(() => {
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });
});
```

---

## Testing Tools & Libraries

- **Test Framework**: Vitest
- **Component Testing**: @testing-library/react
- **User Interactions**: @testing-library/user-event
- **E2E Testing**: Playwright (@playwright/test)
- **Mocking**: vi (from Vitest)
- **Assertions**: expect (from Vitest)

---

## Quick Reference Examples

### Component Test Template
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<MyComponent />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('should handle click events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<MyComponent onClick={handleClick} />);
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null props', () => {
      render(<MyComponent value={null} />);
      expect(screen.queryByText('Value')).not.toBeInTheDocument();
    });
  });
});
```

### Hook Test Template
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value', () => {
    const { result } = renderHook(() => useMyHook('initial'));
    expect(result.current).toBe('initial');
  });

  it('should update after delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useMyHook(value),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('updated');
  });
});
```

### API Test Template
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { myApiFunction } from './api';
import { apiClient } from '@/lib/api/client';

vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('myApiFunction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call API with correct parameters', async () => {
    // Arrange
    const mockResponse = { data: 'test' };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    // Act
    const result = await myApiFunction();

    // Assert
    expect(apiClient.get).toHaveBeenCalledWith('/endpoint');
    expect(result).toEqual(mockResponse);
  });

  it('should handle API errors', async () => {
    // Arrange
    const mockError = new Error('API Error');
    vi.mocked(apiClient.get).mockRejectedValue(mockError);

    // Act & Assert
    await expect(myApiFunction()).rejects.toThrow('API Error');
  });
});
```

---

**Last Updated**: 2026-01-05
**Based on**: Actual test patterns from catchup-feed-frontend codebase
**Enforced by**: Code review process and CI/CD pipeline
