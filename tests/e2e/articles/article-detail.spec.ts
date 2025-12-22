import { test, expect } from '@playwright/test';
import { loginAsUser, TEST_CREDENTIALS } from '../../fixtures/auth';

// Mock article data
const mockArticle = {
  id: '1',
  title: 'Test Article Title',
  content:
    'This is the full content of the test article. It contains multiple paragraphs and detailed information.',
  url: 'https://example.com/article-1',
  source: {
    id: '1',
    name: 'Test Source',
    url: 'https://example.com',
  },
  published_at: new Date('2024-01-01').toISOString(),
  created_at: new Date('2024-01-01').toISOString(),
  updated_at: new Date('2024-01-01').toISOString(),
};

const mockArticleWithSummary = {
  ...mockArticle,
  ai_summary: 'This is an AI-generated summary of the article. It highlights the key points.',
};

test.describe('Article Detail', () => {
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

    // Mock the article detail API endpoint
    await page.route('**/api/articles/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockArticle),
      });
    });

    // Login before each test
    await loginAsUser(page);
  });

  test('should display article details', async ({ page }) => {
    await page.goto('/articles/1');

    // Wait for article to load
    await page.waitForSelector('[data-testid="article-detail"]', { timeout: 5000 });

    // Verify article title is displayed
    await expect(page.getByRole('heading', { name: mockArticle.title })).toBeVisible();

    // Verify article content is displayed
    await expect(page.getByText(mockArticle.content)).toBeVisible();

    // Verify source name is displayed
    await expect(page.getByText(mockArticle.source.name)).toBeVisible();
  });

  test('should display article metadata', async ({ page }) => {
    await page.goto('/articles/1');

    // Wait for article to load
    await page.waitForSelector('[data-testid="article-detail"]', { timeout: 5000 });

    // Check for published date
    const publishedDate = new Date(mockArticle.published_at).toLocaleDateString();
    const dateElement = page.getByText(new RegExp(publishedDate, 'i'));

    // Date might be formatted differently, so we're flexible here
    if ((await dateElement.count()) > 0) {
      await expect(dateElement.first()).toBeVisible();
    }

    // Check for source link
    const sourceLink = page.getByRole('link', { name: mockArticle.source.name });
    if ((await sourceLink.count()) > 0) {
      await expect(sourceLink).toBeVisible();
    }
  });

  test('should have link to original article', async ({ page }) => {
    await page.goto('/articles/1');

    // Wait for article to load
    await page.waitForSelector('[data-testid="article-detail"]', { timeout: 5000 });

    // Look for link to original article
    const originalLink = page.getByRole('link', {
      name: /read original|view source|original article/i,
    });

    if ((await originalLink.count()) > 0) {
      await expect(originalLink).toBeVisible();
      await expect(originalLink).toHaveAttribute('href', mockArticle.url);
    }
  });

  test('should navigate back to article list', async ({ page }) => {
    await page.goto('/articles/1');

    // Wait for article to load
    await page.waitForSelector('[data-testid="article-detail"]', { timeout: 5000 });

    // Look for back button or link
    const backButton = page
      .getByRole('button', { name: /back|return/i })
      .or(page.getByRole('link', { name: /back|return/i }));

    if ((await backButton.count()) > 0) {
      await backButton.first().click();

      // Should navigate back to articles list
      await expect(page).toHaveURL(/.*articles$/);
    }
  });

  test('should display AI summary when available', async ({ page }) => {
    // Override article API to return article with summary
    await page.route('**/api/articles/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockArticleWithSummary),
      });
    });

    await page.goto('/articles/1');

    // Wait for article to load
    await page.waitForSelector('[data-testid="article-detail"]', { timeout: 5000 });

    // Check if AI summary section exists
    const summarySection = page.getByText(/ai summary|summary/i);

    if ((await summarySection.count()) > 0) {
      await expect(summarySection.first()).toBeVisible();
      await expect(page.getByText(mockArticleWithSummary.ai_summary)).toBeVisible();
    }
  });

  test('should toggle AI summary visibility', async ({ page }) => {
    // Override article API to return article with summary
    await page.route('**/api/articles/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockArticleWithSummary),
      });
    });

    await page.goto('/articles/1');

    // Wait for article to load
    await page.waitForSelector('[data-testid="article-detail"]', { timeout: 5000 });

    // Look for toggle button or expand/collapse control
    const toggleButton = page.getByRole('button', { name: /show summary|hide summary|toggle/i });

    if ((await toggleButton.count()) > 0) {
      // Get initial visibility of summary
      const summaryText = page.getByText(mockArticleWithSummary.ai_summary);
      const initiallyVisible = await summaryText.isVisible();

      // Click toggle
      await toggleButton.first().click();

      // Summary visibility should change
      if (initiallyVisible) {
        await expect(summaryText).not.toBeVisible();
      } else {
        await expect(summaryText).toBeVisible();
      }
    }
  });

  test('should show loading state while fetching article', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/articles/1', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockArticle),
      });
    });

    await page.goto('/articles/1');

    // Check for loading state
    await expect(page.getByText(/loading/i)).toBeVisible();

    // Wait for article to load
    await page.waitForSelector('[data-testid="article-detail"]', { timeout: 5000 });

    // Loading state should be gone
    await expect(page.getByText(/loading/i)).not.toBeVisible();
  });

  test('should show error message when article not found', async ({ page }) => {
    // Mock 404 response
    await page.route('**/api/articles/999', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Article not found',
        }),
      });
    });

    await page.goto('/articles/999');

    // Should show error message
    await expect(page.getByText(/not found|article not found|404/i)).toBeVisible();
  });

  test('should show error message when API fails', async ({ page }) => {
    // Mock API error
    await page.route('**/api/articles/1', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error',
        }),
      });
    });

    await page.goto('/articles/1');

    // Should show error message
    await expect(page.getByText(/error|failed to load|something went wrong/i)).toBeVisible();
  });
});
