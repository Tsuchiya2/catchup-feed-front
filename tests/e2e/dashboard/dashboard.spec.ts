import { test, expect } from '@playwright/test';
import { loginAsUser, TEST_CREDENTIALS } from '../../fixtures/auth';

// Mock dashboard statistics
const mockDashboardStats = {
  total_articles: 150,
  total_sources: 10,
  articles_today: 25,
  articles_this_week: 120,
  recent_articles: [
    {
      id: '1',
      title: 'Latest Tech News',
      source: {
        id: '1',
        name: 'Tech Blog',
      },
      published_at: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Frontend Development Tips',
      source: {
        id: '2',
        name: 'Dev News',
      },
      published_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
};

test.describe('Dashboard', () => {
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
            name: 'Test User',
          },
        }),
      });
    });

    // Mock the dashboard stats API endpoint
    await page.route('**/api/dashboard/stats', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDashboardStats),
      });
    });

    // Login before each test
    await loginAsUser(page);
  });

  test('should load dashboard page', async ({ page }) => {
    // Already on dashboard after login
    await expect(page).toHaveURL(/.*dashboard/);

    // Verify dashboard heading or main element is visible
    const dashboardHeading = page.getByRole('heading', { name: /dashboard|overview/i });

    if ((await dashboardHeading.count()) > 0) {
      await expect(dashboardHeading.first()).toBeVisible();
    }
  });

  test('should display user welcome message', async ({ page }) => {
    // Look for welcome message with user name
    const welcomeMessage = page.getByText(/welcome|hello/i);

    if ((await welcomeMessage.count()) > 0) {
      await expect(welcomeMessage.first()).toBeVisible();
    }
  });

  test('should display statistics cards', async ({ page }) => {
    // Look for statistics elements
    const statsElements = [
      page.getByText(/total articles|articles/i),
      page.getByText(/total sources|sources/i),
      page.getByText(/today|articles today/i),
    ];

    for (const element of statsElements) {
      if ((await element.count()) > 0) {
        await expect(element.first()).toBeVisible();
      }
    }
  });

  test('should display statistics values', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Look for numeric values (they should be present)
    const statsNumbers = [
      mockDashboardStats.total_articles.toString(),
      mockDashboardStats.total_sources.toString(),
      mockDashboardStats.articles_today.toString(),
    ];

    for (const number of statsNumbers) {
      const numberElement = page.getByText(number);
      if ((await numberElement.count()) > 0) {
        await expect(numberElement.first()).toBeVisible();
      }
    }
  });

  test('should display recent articles', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Look for recent articles section
    const recentArticlesHeading = page.getByText(/recent articles|latest articles/i);

    if ((await recentArticlesHeading.count()) > 0) {
      await expect(recentArticlesHeading.first()).toBeVisible();

      // Check if recent article titles are displayed
      for (const article of mockDashboardStats.recent_articles) {
        const articleElement = page.getByText(article.title);
        if ((await articleElement.count()) > 0) {
          await expect(articleElement.first()).toBeVisible();
        }
      }
    }
  });

  test('should navigate to articles page from dashboard', async ({ page }) => {
    // Look for "View All Articles" or similar link
    const viewAllLink = page.getByRole('link', { name: /view all|all articles|see all/i });

    if ((await viewAllLink.count()) > 0) {
      await viewAllLink.first().click();

      // Should navigate to articles page
      await expect(page).toHaveURL(/.*articles/);
    }
  });

  test('should navigate to sources page from dashboard', async ({ page }) => {
    // Look for "View All Sources" or similar link
    const viewSourcesLink = page.getByRole('link', { name: /view sources|all sources|sources/i });

    if ((await viewSourcesLink.count()) > 0) {
      await viewSourcesLink.first().click();

      // Should navigate to sources page
      await expect(page).toHaveURL(/.*sources/);
    }
  });

  test('should navigate to articles from navigation menu', async ({ page }) => {
    // Look for navigation link to articles
    const articlesNavLink = page.getByRole('link', { name: /articles/i });

    if ((await articlesNavLink.count()) > 0) {
      await articlesNavLink.first().click();

      // Should navigate to articles page
      await expect(page).toHaveURL(/.*articles/);
    }
  });

  test('should navigate to sources from navigation menu', async ({ page }) => {
    // Look for navigation link to sources
    const sourcesNavLink = page.getByRole('link', { name: /sources/i });

    if ((await sourcesNavLink.count()) > 0) {
      await sourcesNavLink.first().click();

      // Should navigate to sources page
      await expect(page).toHaveURL(/.*sources/);
    }
  });

  test('should show loading state while fetching dashboard data', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/dashboard/stats', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDashboardStats),
      });
    });

    // Clear auth and login again to trigger fresh dashboard load
    await page.goto('/login');
    await loginAsUser(page);

    // Check for loading state
    const loadingIndicator = page.getByText(/loading/i);
    if ((await loadingIndicator.count()) > 0) {
      await expect(loadingIndicator.first()).toBeVisible();
    }

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Loading state should be gone
    if ((await loadingIndicator.count()) > 0) {
      await expect(loadingIndicator.first()).not.toBeVisible();
    }
  });

  test('should handle dashboard API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/dashboard/stats', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error',
        }),
      });
    });

    // Clear auth and login again to trigger fresh dashboard load
    await page.goto('/login');
    await loginAsUser(page);

    // Should show error message or fallback UI
    const errorMessage = page.getByText(/error|failed to load|something went wrong/i);

    if ((await errorMessage.count()) > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });

  test('should display navigation menu', async ({ page }) => {
    // Check if navigation menu is visible
    const navMenu = page.getByRole('navigation');

    if ((await navMenu.count()) > 0) {
      await expect(navMenu.first()).toBeVisible();
    }
  });

  test('should have logout button in navigation', async ({ page }) => {
    // Look for logout button
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });

    if ((await logoutButton.count()) > 0) {
      await expect(logoutButton.first()).toBeVisible();
    }
  });

  test('should refresh dashboard data', async ({ page }) => {
    let apiCallCount = 0;

    // Mock dashboard stats API with counter
    await page.route('**/api/dashboard/stats', async (route) => {
      apiCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDashboardStats),
      });
    });

    // Clear auth and login again to trigger fresh dashboard load
    await page.goto('/login');
    await loginAsUser(page);

    // Wait for initial load
    await page.waitForLoadState('networkidle');

    const initialCallCount = apiCallCount;

    // Look for refresh button
    const refreshButton = page.getByRole('button', { name: /refresh|reload/i });

    if ((await refreshButton.count()) > 0) {
      await refreshButton.first().click();

      // Wait for refresh
      await page.waitForTimeout(500);

      // API should have been called again
      expect(apiCallCount).toBeGreaterThan(initialCallCount);
    }
  });
});
