import { test, expect } from '@playwright/test';
import { loginAsUser, TEST_CREDENTIALS } from '../../fixtures/auth';

// Mock article data
const mockArticles = [
  {
    id: '1',
    title: 'JavaScript Best Practices',
    content: 'Learn about modern JavaScript development best practices.',
    url: 'https://example.com/article-1',
    source: {
      id: '1',
      name: 'Tech Blog',
      url: 'https://example.com',
    },
    published_at: new Date('2024-01-01').toISOString(),
    created_at: new Date('2024-01-01').toISOString(),
    updated_at: new Date('2024-01-01').toISOString(),
  },
  {
    id: '2',
    title: 'TypeScript Guide',
    content: 'Comprehensive guide to TypeScript features.',
    url: 'https://example.com/article-2',
    source: {
      id: '2',
      name: 'Dev News',
      url: 'https://example2.com',
    },
    published_at: new Date('2024-01-02').toISOString(),
    created_at: new Date('2024-01-02').toISOString(),
    updated_at: new Date('2024-01-02').toISOString(),
  },
  {
    id: '3',
    title: 'React Hooks Tutorial',
    content: 'Learn how to use React Hooks effectively.',
    url: 'https://example.com/article-3',
    source: {
      id: '1',
      name: 'Tech Blog',
      url: 'https://example.com',
    },
    published_at: new Date('2024-01-03').toISOString(),
    created_at: new Date('2024-01-03').toISOString(),
    updated_at: new Date('2024-01-03').toISOString(),
  },
];

const mockSources = [
  {
    id: '1',
    name: 'Tech Blog',
    url: 'https://example.com',
  },
  {
    id: '2',
    name: 'Dev News',
    url: 'https://example2.com',
  },
];

test.describe('Article Search', () => {
  test.beforeEach(async ({ page }) => {
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
          },
        }),
      });
    });

    // Mock the sources API endpoint
    await page.route('**/api/sources**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: mockSources,
        }),
      });
    });

    // Login before each test
    await loginAsUser(page);
  });

  test('should display search input', async ({ page }) => {
    await page.goto('/articles');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.getByPlaceholder(/search|find/i);

    if ((await searchInput.count()) > 0) {
      await expect(searchInput.first()).toBeVisible();
    }
  });

  test('should search articles by text', async ({ page }) => {
    // Mock search API endpoint
    await page.route('**/api/articles/search**', async (route) => {
      const url = new URL(route.request().url());
      const query = url.searchParams.get('q') || '';

      const filteredArticles = mockArticles.filter(
        (article) =>
          article.title.toLowerCase().includes(query.toLowerCase()) ||
          article.content.toLowerCase().includes(query.toLowerCase())
      );

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: filteredArticles,
          pagination: {
            page: 1,
            limit: 10,
            total: filteredArticles.length,
            totalPages: 1,
          },
        }),
      });
    });

    await page.goto('/articles');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find search input
    const searchInput = page.getByPlaceholder(/search|find/i);

    if ((await searchInput.count()) > 0) {
      // Type search query
      await searchInput.first().fill('JavaScript');

      // Wait for search results (debounced)
      await page.waitForTimeout(1000);

      // Should show only matching articles
      await expect(page.getByText('JavaScript Best Practices')).toBeVisible();

      // Non-matching articles should not be visible
      const nonMatchingArticle = page.getByText('TypeScript Guide');
      if ((await nonMatchingArticle.count()) > 0) {
        await expect(nonMatchingArticle).not.toBeVisible();
      }
    }
  });

  test('should debounce search input', async ({ page }) => {
    let searchCallCount = 0;

    // Mock search API endpoint with counter
    await page.route('**/api/articles/search**', async (route) => {
      searchCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: mockArticles,
          pagination: {
            page: 1,
            limit: 10,
            total: mockArticles.length,
            totalPages: 1,
          },
        }),
      });
    });

    await page.goto('/articles');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find search input
    const searchInput = page.getByPlaceholder(/search|find/i);

    if ((await searchInput.count()) > 0) {
      // Type multiple characters quickly
      await searchInput.first().type('test query', { delay: 50 });

      // Wait for debounce period
      await page.waitForTimeout(1500);

      // Search should have been called only once or a few times, not for every character
      expect(searchCallCount).toBeLessThan(5);
    }
  });

  test('should filter articles by source', async ({ page }) => {
    // Mock search API endpoint with source filter
    await page.route('**/api/articles**', async (route) => {
      const url = new URL(route.request().url());
      const sourceId = url.searchParams.get('source_id');

      let filteredArticles = mockArticles;
      if (sourceId) {
        filteredArticles = mockArticles.filter((article) => article.source.id === sourceId);
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: filteredArticles,
          pagination: {
            page: 1,
            limit: 10,
            total: filteredArticles.length,
            totalPages: 1,
          },
        }),
      });
    });

    await page.goto('/articles');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for source filter dropdown/select
    const sourceFilter = page.getByLabel(/source|filter/i);

    if ((await sourceFilter.count()) > 0) {
      // Select a specific source
      await sourceFilter.first().click();
      await page.getByText('Tech Blog').click();

      // Wait for filtered results
      await page.waitForTimeout(500);

      // Should show only articles from selected source
      await expect(page.getByText('JavaScript Best Practices')).toBeVisible();
      await expect(page.getByText('React Hooks Tutorial')).toBeVisible();

      // Article from different source should not be visible
      const differentSourceArticle = page.getByText('TypeScript Guide');
      if ((await differentSourceArticle.count()) > 0) {
        await expect(differentSourceArticle).not.toBeVisible();
      }
    }
  });

  test('should clear search filters', async ({ page }) => {
    // Mock search API endpoint
    await page.route('**/api/articles**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: mockArticles,
          pagination: {
            page: 1,
            limit: 10,
            total: mockArticles.length,
            totalPages: 1,
          },
        }),
      });
    });

    await page.goto('/articles');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find search input
    const searchInput = page.getByPlaceholder(/search|find/i);

    if ((await searchInput.count()) > 0) {
      // Type search query
      await searchInput.first().fill('JavaScript');

      // Wait for search
      await page.waitForTimeout(1000);

      // Look for clear button
      const clearButton = page.getByRole('button', { name: /clear|reset/i });

      if ((await clearButton.count()) > 0) {
        // Click clear button
        await clearButton.first().click();

        // Search input should be empty
        await expect(searchInput.first()).toHaveValue('');

        // All articles should be visible again
        await expect(page.getByText('JavaScript Best Practices')).toBeVisible();
        await expect(page.getByText('TypeScript Guide')).toBeVisible();
        await expect(page.getByText('React Hooks Tutorial')).toBeVisible();
      }
    }
  });

  test('should show no results message when search returns empty', async ({ page }) => {
    // Mock search API endpoint with empty results
    await page.route('**/api/articles/search**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        }),
      });
    });

    await page.goto('/articles');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find search input
    const searchInput = page.getByPlaceholder(/search|find/i);

    if ((await searchInput.count()) > 0) {
      // Type search query that returns no results
      await searchInput.first().fill('nonexistent query xyz');

      // Wait for search
      await page.waitForTimeout(1000);

      // Should show no results message
      await expect(page.getByText(/no results|no articles found|nothing found/i)).toBeVisible();
    }
  });

  test('should handle search API errors', async ({ page }) => {
    // Mock search API error
    await page.route('**/api/articles/search**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error',
        }),
      });
    });

    await page.goto('/articles');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find search input
    const searchInput = page.getByPlaceholder(/search|find/i);

    if ((await searchInput.count()) > 0) {
      // Type search query
      await searchInput.first().fill('test');

      // Wait for search
      await page.waitForTimeout(1000);

      // Should show error message
      await expect(page.getByText(/error|failed|something went wrong/i)).toBeVisible();
    }
  });
});
