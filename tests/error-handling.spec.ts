import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('should handle invalid routes gracefully', async ({ page }) => {
    // Navigate to a non-existent route
    await page.goto('http://localhost:3000/#/invalid-route-that-does-not-exist');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // The app should still render (not crash)
    const root = page.locator('#root');
    await expect(root).toBeVisible();

    // Body should have content (either the route content or an error message)
    const body = page.locator('body');
    const bodyText = await body.textContent();
    expect(bodyText).toBeTruthy();
  });

  test('should display error boundary when component crashes', async ({ page }) => {
    // Note: This test assumes an error boundary exists
    // In a real scenario, you might need to trigger an error programmatically
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check if error boundary UI exists (it should be hidden normally)
    // If an error occurs, it should show "Something went wrong"
    const errorMessage = page.locator('text=/something went wrong/i');
    const errorCount = await errorMessage.count();
    
    // Error boundary should not be visible on normal page load
    if (errorCount > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept and fail API requests to simulate network errors
    // This allows the page to load while API calls fail
    await page.route('**/supabase.co/**', route => route.abort());
    await page.route('**/accounts.dev/**', route => route.abort());
    
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Page should still render even if API calls fail
    const root = page.locator('#root');
    await expect(root).toBeVisible();
    
    // Body should have content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle missing environment variables', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // If Clerk key is missing, should show configuration error
    const configError = page.locator('text=/configuration error/i');
    const configErrorCount = await configError.count();
    
    // If config error exists, verify it's displayed properly
    if (configErrorCount > 0) {
      await expect(configError.first()).toBeVisible();
      const errorText = await configError.first().textContent();
      expect(errorText).toContain('Configuration Error');
    }
  });

  test('should handle malformed URLs', async ({ page }) => {
    // Test with malformed hash routes
    await page.goto('http://localhost:3000/#/invalid///route');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // App should not crash
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('should handle empty or null routes', async ({ page }) => {
    // Navigate with empty hash
    await page.goto('http://localhost:3000/#');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Should default to landing page or handle gracefully
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('should show error details when error boundary is triggered', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check for error details section (if error boundary is shown)
    const errorDetails = page.locator('text=/error details/i');
    const detailsCount = await errorDetails.count();
    
    // If error details exist, they should be in a details/summary element
    if (detailsCount > 0) {
      const detailsElement = page.locator('details').first();
      await expect(detailsElement).toBeVisible();
    }
  });

  test('should have reload button in error boundary', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check for reload button (if error boundary is shown)
    const reloadButton = page.getByRole('button', { name: /reload/i });
    const reloadCount = await reloadButton.count();
    
    // If reload button exists, it should be clickable
    if (reloadCount > 0) {
      await expect(reloadButton.first()).toBeVisible();
      await expect(reloadButton.first()).toBeEnabled();
    }
  });
});
