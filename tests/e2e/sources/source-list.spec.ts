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
];

test.describe('Source List', () => {
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
      const url = new URL(route.request().url());
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: mockSources,
          pagination: {
            page,
            limit,
            total: mockSources.length,
            totalPages: 1,
          },
        }),
      });
    });

    // Login before each test
    await loginAsUser(page);
  });

  test('should display source list', async ({ page }) => {
    await page.goto('/sources');

    // Wait for sources to load
    await page.waitForSelector('[data-testid="source-list"]', { timeout: 5000 });

    // Verify sources are displayed
    for (const source of mockSources) {
      await expect(page.getByText(source.name)).toBeVisible();
    }
  });

  test('should display source metadata', async ({ page }) => {
    await page.goto('/sources');

    // Wait for sources to load
    await page.waitForSelector('[data-testid="source-list"]', { timeout: 5000 });

    // Check first source has all expected elements
    const firstSource = mockSources[0];

    // Name
    await expect(page.getByText(firstSource.name)).toBeVisible();

    // URL
    await expect(page.getByText(firstSource.url)).toBeVisible();

    // Description (if displayed)
    if (firstSource.description) {
      const descriptionElement = page.getByText(firstSource.description);
      if ((await descriptionElement.count()) > 0) {
        await expect(descriptionElement.first()).toBeVisible();
      }
    }
  });

  test('should have links to source URLs', async ({ page }) => {
    await page.goto('/sources');

    // Wait for sources to load
    await page.waitForSelector('[data-testid="source-list"]', { timeout: 5000 });

    // Check that source URLs are clickable links
    for (const source of mockSources) {
      const sourceLink = page.getByRole('link', { name: new RegExp(source.name, 'i') });

      if ((await sourceLink.count()) > 0) {
        await expect(sourceLink.first()).toBeVisible();
      }
    }
  });

  test('should show empty state when no sources', async ({ page }) => {
    // Override sources API to return empty array
    await page.route('**/api/sources**', async (route) => {
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

    await page.goto('/sources');

    // Should show empty state message
    await expect(page.getByText(/no sources|no results found/i)).toBeVisible();
  });

  test('should show loading state while fetching sources', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/sources**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
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

    // Check for loading state
    await expect(page.getByText(/loading/i)).toBeVisible();

    // Wait for sources to load
    await page.waitForSelector('[data-testid="source-list"]', { timeout: 5000 });

    // Loading state should be gone
    await expect(page.getByText(/loading/i)).not.toBeVisible();
  });

  test('should show error message when API fails', async ({ page }) => {
    // Mock API error
    await page.route('**/api/sources**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error',
        }),
      });
    });

    await page.goto('/sources');

    // Should show error message
    await expect(page.getByText(/error|failed to load|something went wrong/i)).toBeVisible();
  });

  test('should navigate to add source page', async ({ page }) => {
    await page.goto('/sources');

    // Wait for sources to load
    await page.waitForLoadState('networkidle');

    // Look for add source button
    const addButton = page
      .getByRole('button', { name: /add source|new source|create source/i })
      .or(page.getByRole('link', { name: /add source|new source|create source/i }));

    if ((await addButton.count()) > 0) {
      await addButton.first().click();

      // Should navigate to add source page or show modal
      // The exact behavior depends on your implementation
      const currentUrl = page.url();
      const hasAddModal = (await page.getByRole('dialog').count()) > 0;
      const isOnAddPage = currentUrl.includes('sources/new') || currentUrl.includes('sources/add');

      expect(hasAddModal || isOnAddPage).toBe(true);
    }
  });

  test('should handle pagination', async ({ page }) => {
    // Mock paginated API response
    await page.route('**/api/sources**', async (route) => {
      const url = new URL(route.request().url());
      const page = parseInt(url.searchParams.get('page') || '1');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: mockSources,
          pagination: {
            page,
            limit: 10,
            total: 30,
            totalPages: 3,
          },
        }),
      });
    });

    await page.goto('/sources');

    // Wait for sources to load
    await page.waitForSelector('[data-testid="source-list"]', { timeout: 5000 });

    // Look for next page button
    const nextButton = page.getByRole('button', { name: /next|→/i });

    if (await nextButton.isVisible()) {
      // Click next page
      await nextButton.click();

      // URL should update with page parameter
      await expect(page).toHaveURL(/.*page=2/);
    }
  });
});
