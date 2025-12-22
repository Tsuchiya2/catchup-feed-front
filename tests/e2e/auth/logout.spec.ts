import { test, expect } from '@playwright/test';
import { loginAsUser, isAuthenticated, TEST_CREDENTIALS } from '../../fixtures/auth';

test.describe('Logout Flow', () => {
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

    // Login before each test
    await loginAsUser(page);
  });

  test('should successfully logout', async ({ page }) => {
    // Mock the logout API endpoint
    await page.route('**/api/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Logged out successfully',
        }),
      });
    });

    // Verify user is authenticated
    expect(await isAuthenticated(page)).toBe(true);

    // Find and click logout button
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    await logoutButton.click();

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });

    // Verify auth token is cleared
    expect(await isAuthenticated(page)).toBe(false);
  });

  test('should clear user session data on logout', async ({ page }) => {
    // Mock the logout API endpoint
    await page.route('**/api/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Logged out successfully',
        }),
      });
    });

    // Check that user has auth token
    const hasTokenBefore = await page.evaluate(() => {
      return !!localStorage.getItem('authToken');
    });
    expect(hasTokenBefore).toBe(true);

    // Logout
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    await logoutButton.click();

    // Wait for redirect to login
    await page.waitForURL('**/login', { timeout: 5000 });

    // Verify all auth-related data is cleared
    const authData = await page.evaluate(() => {
      return {
        authToken: localStorage.getItem('authToken'),
        refreshToken: localStorage.getItem('refreshToken'),
      };
    });

    expect(authData.authToken).toBeNull();
    expect(authData.refreshToken).toBeNull();
  });

  test('should not allow access to protected routes after logout', async ({ page }) => {
    // Mock the logout API endpoint
    await page.route('**/api/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Logged out successfully',
        }),
      });
    });

    // Logout
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    await logoutButton.click();

    // Wait for redirect to login
    await page.waitForURL('**/login', { timeout: 5000 });

    // Try to access dashboard
    await page.goto('/dashboard');

    // Should redirect back to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should handle logout API errors gracefully', async ({ page }) => {
    // Mock the logout API endpoint with error
    await page.route('**/api/auth/logout', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error',
        }),
      });
    });

    // Logout
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    await logoutButton.click();

    // Even with API error, frontend should clear local storage and redirect
    await page.waitForURL('**/login', { timeout: 5000 });

    // Verify auth token is cleared even on API error
    expect(await isAuthenticated(page)).toBe(false);
  });
});
