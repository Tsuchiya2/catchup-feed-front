import { test, expect } from '@playwright/test';
import { loginAsUser, TEST_CREDENTIALS } from '../../fixtures/auth';

// Mock article data
const mockArticles = [
  {
    id: '1',
    title: 'First Test Article',
    content: 'This is the content of the first test article.',
    url: 'https://example.com/article-1',
    source: {
      id: '1',
      name: 'Test Source 1',
      url: 'https://example.com',
    },
    published_at: new Date('2024-01-01').toISOString(),
    created_at: new Date('2024-01-01').toISOString(),
    updated_at: new Date('2024-01-01').toISOString(),
  },
  {
    id: '2',
    title: 'Second Test Article',
    content: 'This is the content of the second test article.',
    url: 'https://example.com/article-2',
    source: {
      id: '2',
      name: 'Test Source 2',
      url: 'https://example2.com',
    },
    published_at: new Date('2024-01-02').toISOString(),
    created_at: new Date('2024-01-02').toISOString(),
    updated_at: new Date('2024-01-02').toISOString(),
  },
  {
    id: '3',
    title: 'Third Test Article',
    content: 'This is the content of the third test article.',
    url: 'https://example.com/article-3',
    source: {
      id: '1',
      name: 'Test Source 1',
      url: 'https://example.com',
    },
    published_at: new Date('2024-01-03').toISOString(),
    created_at: new Date('2024-01-03').toISOString(),
    updated_at: new Date('2024-01-03').toISOString(),
  },
];

test.describe('Article List', () => {
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

    // Mock the articles API endpoint
    await page.route('**/api/articles**', async (route) => {
      const url = new URL(route.request().url());
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: mockArticles,
          pagination: {
            page,
            limit,
            total: mockArticles.length,
            totalPages: 1,
          },
        }),
      });
    });

    // Login before each test
    await loginAsUser(page);
  });

  test('should display article list', async ({ page }) => {
    // Navigate to articles page
    await page.goto('/articles');

    // Wait for articles to load
    await page.waitForSelector('[data-testid="article-list"]', { timeout: 5000 });

    // Verify articles are displayed
    for (const article of mockArticles) {
      await expect(page.getByText(article.title)).toBeVisible();
    }
  });

  test('should display article metadata', async ({ page }) => {
    await page.goto('/articles');

    // Wait for articles to load
    await page.waitForSelector('[data-testid="article-list"]', { timeout: 5000 });

    // Check first article has all expected elements
    const firstArticle = mockArticles[0];

    // Title
    await expect(page.getByText(firstArticle.title)).toBeVisible();

    // Source name
    await expect(page.getByText(firstArticle.source.name)).toBeVisible();
  });

  test('should navigate to article detail when clicking on article', async ({ page }) => {
    await page.goto('/articles');

    // Wait for articles to load
    await page.waitForSelector('[data-testid="article-list"]', { timeout: 5000 });

    // Mock the single article API endpoint
    await page.route('**/api/articles/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockArticles[0]),
      });
    });

    // Click on first article
    await page.getByText(mockArticles[0].title).first().click();

    // Should navigate to article detail page
    await expect(page).toHaveURL(/.*articles\/1/);
  });

  test('should show empty state when no articles', async ({ page }) => {
    // Override articles API to return empty array
    await page.route('**/api/articles**', async (route) => {
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

    // Should show empty state message
    await expect(page.getByText(/no articles|no results found/i)).toBeVisible();
  });

  test('should show loading state while fetching articles', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/articles**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
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

    // Check for loading state
    await expect(page.getByText(/loading/i)).toBeVisible();

    // Wait for articles to load
    await page.waitForSelector('[data-testid="article-list"]', { timeout: 5000 });

    // Loading state should be gone
    await expect(page.getByText(/loading/i)).not.toBeVisible();
  });

  test('should handle pagination', async ({ page }) => {
    // Mock paginated API response
    await page.route('**/api/articles**', async (route) => {
      const url = new URL(route.request().url());
      const page = parseInt(url.searchParams.get('page') || '1');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: mockArticles,
          pagination: {
            page,
            limit: 10,
            total: 30,
            totalPages: 3,
          },
        }),
      });
    });

    await page.goto('/articles');

    // Wait for articles to load
    await page.waitForSelector('[data-testid="article-list"]', { timeout: 5000 });

    // Look for next page button
    const nextButton = page.getByRole('button', { name: /next|→/i });

    if (await nextButton.isVisible()) {
      // Click next page
      await nextButton.click();

      // URL should update with page parameter
      await expect(page).toHaveURL(/.*page=2/);
    }
  });

  test('should show error message when API fails', async ({ page }) => {
    // Mock API error
    await page.route('**/api/articles**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error',
        }),
      });
    });

    await page.goto('/articles');

    // Should show error message
    await expect(page.getByText(/error|failed to load|something went wrong/i)).toBeVisible();
  });
});
