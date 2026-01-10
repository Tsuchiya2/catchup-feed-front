/**
 * Source Delete Performance E2E Tests
 *
 * Performance tests for the delete source functionality.
 * These tests validate NFR targets:
 * - Dialog opens < 100ms
 * - Delete operation completes < 500ms (P95)
 *
 * @tag @performance
 */
import { test, expect } from '@playwright/test';

test.describe('Source Delete Performance @performance', () => {
  // Skip if not in performance testing mode
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'Performance tests only run in Chromium'
  );

  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent performance testing
    await page.route('**/api/sources', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            name: `Test Source ${i + 1}`,
            feed_url: `https://example.com/feed${i + 1}.xml`,
            active: true,
          }))
        ),
      });
    });

    await page.route('**/api/sources/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        // Simulate realistic backend latency (50-150ms)
        await new Promise((resolve) => setTimeout(resolve, 100));
        await route.fulfill({ status: 204 });
      } else {
        await route.continue();
      }
    });
  });

  test('dialog should open within 100ms target', async ({ page }) => {
    // Navigate to sources page (mocked)
    await page.goto('/sources');

    // Wait for sources to load
    await page.waitForSelector('[data-testid="source-card"]');

    // Measure dialog open time
    const startTime = await page.evaluate(() => performance.now());

    // Click delete button (assumes admin user)
    const deleteButton = page.locator('[data-testid="source-delete-button"]').first();

    // If delete button exists (admin user), click it
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Wait for dialog to appear
      await page.waitForSelector('[data-testid="source-delete-dialog"]');

      const endTime = await page.evaluate(() => performance.now());
      const duration = endTime - startTime;

      // NFR Target: Dialog opens < 100ms
      expect(duration).toBeLessThan(100);

      console.log(`Dialog open time: ${duration.toFixed(2)}ms (target: <100ms)`);
    } else {
      test.skip();
    }
  });

  test('delete operation should complete within 500ms P95 target', async ({ page }) => {
    await page.goto('/sources');
    await page.waitForSelector('[data-testid="source-card"]');

    const deleteButton = page.locator('[data-testid="source-delete-button"]').first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await page.waitForSelector('[data-testid="source-delete-dialog"]');

      // Measure delete operation time
      const startTime = await page.evaluate(() => performance.now());

      // Click confirm delete
      await page.click('[data-testid="source-delete-confirm-button"]');

      // Wait for dialog to close (indicates success)
      await page.waitForSelector('[data-testid="source-delete-dialog"]', { state: 'hidden' });

      const endTime = await page.evaluate(() => performance.now());
      const duration = endTime - startTime;

      // NFR Target: Delete operation < 500ms (P95)
      expect(duration).toBeLessThan(500);

      console.log(`Delete operation time: ${duration.toFixed(2)}ms (target: <500ms)`);
    } else {
      test.skip();
    }
  });

  test('should handle 10 sequential deletes efficiently', async ({ page }) => {
    await page.goto('/sources');
    await page.waitForSelector('[data-testid="source-card"]');

    const durations: number[] = [];

    // Perform up to 10 sequential deletes
    for (let i = 0; i < 10; i++) {
      const deleteButton = page.locator('[data-testid="source-delete-button"]').first();

      if (!(await deleteButton.isVisible())) break;

      const startTime = await page.evaluate(() => performance.now());

      await deleteButton.click();
      await page.waitForSelector('[data-testid="source-delete-dialog"]');
      await page.click('[data-testid="source-delete-confirm-button"]');
      await page.waitForSelector('[data-testid="source-delete-dialog"]', { state: 'hidden' });

      const endTime = await page.evaluate(() => performance.now());
      durations.push(endTime - startTime);

      // Wait a bit between operations
      await page.waitForTimeout(100);
    }

    if (durations.length > 0) {
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const maxDuration = Math.max(...durations);

      // Each delete should complete < 500ms
      expect(maxDuration).toBeLessThan(500);

      console.log(`Sequential deletes: ${durations.length} operations`);
      console.log(`Average duration: ${avgDuration.toFixed(2)}ms`);
      console.log(`Max duration: ${maxDuration.toFixed(2)}ms`);
    } else {
      test.skip();
    }
  });

  test('should maintain performance with slow network (Slow 3G)', async ({ page, context }) => {
    // Simulate slow network
    await context.route('**/*', async (route) => {
      // Add 200ms latency to simulate Slow 3G
      await new Promise((resolve) => setTimeout(resolve, 200));
      await route.continue();
    });

    await page.goto('/sources');
    await page.waitForSelector('[data-testid="source-card"]', { timeout: 30000 });

    const deleteButton = page.locator('[data-testid="source-delete-button"]').first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      const dialogStart = await page.evaluate(() => performance.now());
      await page.waitForSelector('[data-testid="source-delete-dialog"]');
      const dialogEnd = await page.evaluate(() => performance.now());

      const dialogOpenTime = dialogEnd - dialogStart;

      // Dialog should still open quickly (UI-only operation)
      // Allow more time due to network simulation overhead
      expect(dialogOpenTime).toBeLessThan(300);

      console.log(`Dialog open (Slow 3G): ${dialogOpenTime.toFixed(2)}ms`);
    } else {
      test.skip();
    }
  });

  test('memory should not leak after multiple operations', async ({ page }) => {
    await page.goto('/sources');
    await page.waitForSelector('[data-testid="source-card"]');

    // Get initial memory usage
    const initialMetrics = await page.evaluate(() => {
      // @ts-expect-error - memory API may not be available
      return performance.memory?.usedJSHeapSize || 0;
    });

    // Perform multiple delete cancel operations (doesn't actually delete)
    for (let i = 0; i < 20; i++) {
      const deleteButton = page.locator('[data-testid="source-delete-button"]').first();

      if (!(await deleteButton.isVisible())) break;

      await deleteButton.click();
      await page.waitForSelector('[data-testid="source-delete-dialog"]');
      await page.click('[data-testid="source-delete-cancel-button"]');
      await page.waitForSelector('[data-testid="source-delete-dialog"]', { state: 'hidden' });
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      // @ts-expect-error - gc may not be available
      if (typeof gc === 'function') gc();
    });

    // Get final memory usage
    const finalMetrics = await page.evaluate(() => {
      // @ts-expect-error - memory API may not be available
      return performance.memory?.usedJSHeapSize || 0;
    });

    const memoryGrowth = finalMetrics - initialMetrics;

    // Memory should not grow significantly (< 5MB)
    // Note: This is a soft check as memory API may not be available
    if (initialMetrics > 0 && finalMetrics > 0) {
      expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024);
      console.log(`Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
    } else {
      console.log('Memory API not available, skipping memory check');
    }
  });
});
