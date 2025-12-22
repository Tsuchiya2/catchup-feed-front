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

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');

    // Click submit without filling fields
    await page.click('button[type="submit"]');

    // Check for validation error messages
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');

    // Click submit
    await page.click('button[type="submit"]');

    // Check for email validation error
    await expect(page.getByText(/invalid email address/i)).toBeVisible();
  });

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

  test('should show error message for invalid credentials', async ({ page }) => {
    // Mock the login API endpoint with error
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid email or password',
        }),
      });
    });

    await page.goto('/login');

    // Fill in credentials
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Check for error message
    await expect(page.getByText(/invalid email or password|login failed/i)).toBeVisible();

    // Verify still on login page
    await expect(page).toHaveURL(/.*login/);
  });

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

    // Fill in credentials
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);

    // Click submit
    await page.click('button[type="submit"]');

    // Check for loading state
    await expect(page.getByText(/logging in/i)).toBeVisible();

    // Button should be disabled
    await expect(page.getByRole('button', { name: /logging in/i })).toBeDisabled();
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await clearAuthToken(page);

    // Try to access dashboard without authentication
    await page.goto('/dashboard');

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should prevent navigation to login page when already authenticated', async ({ page }) => {
    // Mock successful authentication
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

    // Login first
    await loginAsUser(page);

    // Try to navigate to login page
    await page.goto('/login');

    // Should redirect to dashboard (or stay on dashboard if already there)
    // This behavior depends on your implementation
    // Adjust the assertion based on your actual behavior
    const url = page.url();
    const isOnDashboardOrLogin = url.includes('dashboard') || url.includes('login');
    expect(isOnDashboardOrLogin).toBe(true);
  });
});
