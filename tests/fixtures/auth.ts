import { Page } from '@playwright/test';

/**
 * Default test credentials for E2E testing
 */
export const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'testpassword123',
};

/**
 * Authentication fixture options
 */
export interface LoginOptions {
  email?: string;
  password?: string;
}

/**
 * Helper function to log in as a user
 * Navigates to login page, fills in credentials, submits form, and waits for redirect
 *
 * @param page - Playwright Page object
 * @param options - Optional custom credentials
 */
export async function loginAsUser(page: Page, options: LoginOptions = {}): Promise<void> {
  const { email = TEST_CREDENTIALS.email, password = TEST_CREDENTIALS.password } = options;

  // Navigate to login page
  await page.goto('/login');

  // Wait for the login form to be visible
  await page.waitForSelector('form', { state: 'visible' });

  // Fill in email
  await page.fill('input[type="email"]', email);

  // Fill in password
  await page.fill('input[type="password"]', password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard (successful login)
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

/**
 * Helper function to log out
 * Clicks the logout button/link and waits for redirect to login
 *
 * @param page - Playwright Page object
 */
export async function logout(page: Page): Promise<void> {
  // Look for logout button/link - adjust selector based on your UI
  const logoutButton = page.getByRole('button', { name: /logout|sign out/i });

  // Click logout
  await logoutButton.click();

  // Wait for redirect to login page
  await page.waitForURL('**/login', { timeout: 5000 });
}

/**
 * Helper function to set authentication token directly in localStorage
 * Useful for tests that don't require full login flow
 *
 * @param page - Playwright Page object
 * @param token - JWT token to set
 */
export async function setAuthToken(page: Page, token: string): Promise<void> {
  await page.evaluate((authToken) => {
    localStorage.setItem('authToken', authToken);
  }, token);
}

/**
 * Helper function to clear authentication token from localStorage
 *
 * @param page - Playwright Page object
 */
export async function clearAuthToken(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  });
}

/**
 * Helper function to check if user is authenticated
 * Checks for presence of auth token in localStorage
 *
 * @param page - Playwright Page object
 * @returns True if authenticated, false otherwise
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return !!localStorage.getItem('authToken');
  });
}
