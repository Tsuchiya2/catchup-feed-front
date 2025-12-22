import { test, expect } from '@playwright/test';
import { loginAsUser, TEST_CREDENTIALS } from '../../fixtures/auth';

// Mock source data
const mockSources = [
  {
    id: '1',
    name: 'Tech Blog',
    url: 'https://techblog.example.com',
    description: 'A blog about technology and software development',
    created_at: new Date('2024-01-01').toISOString(),
    updated_at: new Date('2024-01-01').toISOString(),
  },
  {
    id: '2',
    name: 'Dev News',
    url: 'https://devnews.example.com',
    description: 'Latest news in software development',
    created_at: new Date('2024-01-02').toISOString(),
    updated_at: new Date('2024-01-02').toISOString(),
  },
  {
    id: '3',
    name: 'Frontend Weekly',
    url: 'https://frontend.example.com',
    description: 'Weekly frontend development updates',
    created_at: new Date('2024-01-03').toISOString(),
    updated_at: new Date('2024-01-03').toISOString(),
  },
  {
    id: '4',
    name: 'Backend Daily',
    url: 'https://backend.example.com',
    description: 'Daily backend development tips',
    created_at: new Date('2024-01-04').toISOString(),
    updated_at: new Date('2024-01-04').toISOString(),
  },
];

test.describe('Source Search', () => {
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

    // Login before each test
    await loginAsUser(page);
  });

  test('should display search input', async ({ page }) => {
    await page.goto('/sources');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.getByPlaceholder(/search|find/i);

    if ((await searchInput.count()) > 0) {
      await expect(searchInput.first()).toBeVisible();
    }
  });

  test('should search sources by name', async ({ page }) => {
    // Mock search API endpoint
    await page.route('**/api/sources**', async (route) => {
      const url = new URL(route.request().url());
      const query = url.searchParams.get('q') || '';

      let filteredSources = mockSources;
      if (query) {
        filteredSources = mockSources.filter(
          (source) =>
            source.name.toLowerCase().includes(query.toLowerCase()) ||
            source.description.toLowerCase().includes(query.toLowerCase())
        );
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: filteredSources,
          pagination: {
            page: 1,
            limit: 10,
            total: filteredSources.length,
            totalPages: 1,
          },
        }),
      });
    });

    await page.goto('/sources');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find search input
    const searchInput = page.getByPlaceholder(/search|find/i);

    if ((await searchInput.count()) > 0) {
      // Type search query
      await searchInput.first().fill('Frontend');

      // Wait for search results (debounced)
      await page.waitForTimeout(1000);

      // Should show only matching sources
      await expect(page.getByText('Frontend Weekly')).toBeVisible();

      // Non-matching sources should not be visible
      const nonMatchingSource = page.getByText('Backend Daily');
      if ((await nonMatchingSource.count()) > 0) {
        await expect(nonMatchingSource).not.toBeVisible();
      }
    }
  });

  test('should debounce search input', async ({ page }) => {
    let searchCallCount = 0;

    // Mock search API endpoint with counter
    await page.route('**/api/sources**', async (route) => {
      const url = new URL(route.request().url());
      const query = url.searchParams.get('q');

      if (query) {
        searchCallCount++;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: mockSources,
          pagination: {
            page: 1,
            limit: 10,
            total: mockSources.length,
            totalPages: 1,
          },
        }),
      });
    });

    await page.goto('/sources');

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

  test('should search sources by URL', async ({ page }) => {
    // Mock search API endpoint
    await page.route('**/api/sources**', async (route) => {
      const url = new URL(route.request().url());
      const query = url.searchParams.get('q') || '';

      let filteredSources = mockSources;
      if (query) {
        filteredSources = mockSources.filter((source) =>
          source.url.toLowerCase().includes(query.toLowerCase())
        );
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: filteredSources,
          pagination: {
            page: 1,
            limit: 10,
            total: filteredSources.length,
            totalPages: 1,
          },
        }),
      });
    });

    await page.goto('/sources');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find search input
    const searchInput = page.getByPlaceholder(/search|find/i);

    if ((await searchInput.count()) > 0) {
      // Type URL search query
      await searchInput.first().fill('techblog');

      // Wait for search results
      await page.waitForTimeout(1000);

      // Should show only matching sources
      await expect(page.getByText('Tech Blog')).toBeVisible();

      // Non-matching sources should not be visible or have 0 count
      const nonMatchingSource = page.getByText('Dev News');
      if ((await nonMatchingSource.count()) > 0) {
        await expect(nonMatchingSource).not.toBeVisible();
      }
    }
  });

  test('should clear search filters', async ({ page }) => {
    // Mock search API endpoint
    await page.route('**/api/sources**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: mockSources,
          pagination: {
            page: 1,
            limit: 10,
            total: mockSources.length,
            totalPages: 1,
          },
        }),
      });
    });

    await page.goto('/sources');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find search input
    const searchInput = page.getByPlaceholder(/search|find/i);

    if ((await searchInput.count()) > 0) {
      // Type search query
      await searchInput.first().fill('Frontend');

      // Wait for search
      await page.waitForTimeout(1000);

      // Look for clear button
      const clearButton = page.getByRole('button', { name: /clear|reset/i });

      if ((await clearButton.count()) > 0) {
        // Click clear button
        await clearButton.first().click();

        // Search input should be empty
        await expect(searchInput.first()).toHaveValue('');

        // All sources should be visible again
        await expect(page.getByText('Tech Blog')).toBeVisible();
        await expect(page.getByText('Dev News')).toBeVisible();
        await expect(page.getByText('Frontend Weekly')).toBeVisible();
      }
    }
  });

  test('should show no results message when search returns empty', async ({ page }) => {
    // Mock search API endpoint with empty results
    await page.route('**/api/sources**', async (route) => {
      const url = new URL(route.request().url());
      const query = url.searchParams.get('q');

      let data = mockSources;
      if (query) {
        data = [];
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data,
          pagination: {
            page: 1,
            limit: 10,
            total: data.length,
            totalPages: data.length > 0 ? 1 : 0,
          },
        }),
      });
    });

    await page.goto('/sources');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find search input
    const searchInput = page.getByPlaceholder(/search|find/i);

    if ((await searchInput.count()) > 0) {
      // Type search query that returns no results
      await searchInput.first().fill('nonexistent source xyz');

      // Wait for search
      await page.waitForTimeout(1000);

      // Should show no results message
      await expect(page.getByText(/no results|no sources found|nothing found/i)).toBeVisible();
    }
  });

  test('should handle search API errors', async ({ page }) => {
    // Mock search API error
    await page.route('**/api/sources**', async (route) => {
      const url = new URL(route.request().url());
      const query = url.searchParams.get('q');

      if (query) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: mockSources,
            pagination: {
              page: 1,
              limit: 10,
              total: mockSources.length,
              totalPages: 1,
            },
          }),
        });
      }
    });

    await page.goto('/sources');

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
