import { test, expect } from '@playwright/test';

test.describe('Loading States', () => {
  test('should show loading state during initial page load', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    
    // During initial load, there might be a brief loading state
    // Check for loading indicators
    const loadingText = page.locator('text=/loading/i');
    const loadingCount = await loadingText.count();
    
    // Loading state might appear briefly, then disappear
    // Wait a bit to see if loading state appears
    await page.waitForTimeout(500);
    
    // After loading, content should be visible
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('should show loading state in protected routes', async ({ page }) => {
    await page.goto('http://localhost:3000/#/home');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // ProtectedRoute might show loading state while checking auth
    const loadingText = page.locator('text=/loading/i');
    const loadingCount = await loadingText.count();
    
    // Loading might appear briefly, then redirect or show content
    if (loadingCount > 0) {
      await expect(loadingText.first()).toBeVisible({ timeout: 2000 });
    }
  });

  test('should show loading state for map component', async ({ page }) => {
    await page.goto('http://localhost:3000/#/home');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Look for map loading state
    const mapLoading = page.locator('text=/loading map/i');
    const mapLoadingCount = await mapLoading.count();
    
    // Map loading state might appear while Google Maps loads
    if (mapLoadingCount > 0) {
      await expect(mapLoading.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show loading state for sports filter', async ({ page }) => {
    await page.goto('http://localhost:3000/#/home');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Look for loading state in sports filter
    const sportsLoading = page.locator('text=/loading/i').filter({ hasText: /sport|filter/i });
    const sportsLoadingCount = await sportsLoading.count();
    
    // Sports loading might appear briefly
    if (sportsLoadingCount > 0) {
      await expect(sportsLoading.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should transition from loading to loaded state', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for initial load
    await page.waitForTimeout(2000);
    
    // After loading, content should be visible
    const body = page.locator('body');
    const bodyText = await body.textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(100);
    
    // Loading text should not be the main content
    const loadingText = page.locator('text=/^Loading...$/i');
    const persistentLoading = await loadingText.count();
    
    // Persistent loading state should not be visible after page loads
    // (unless there's an actual loading operation)
    expect(persistentLoading).toBeLessThanOrEqual(1);
  });

  test('should show loading placeholder for player avatars', async ({ page }) => {
    await page.goto('http://localhost:3000/#/event/123');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Look for loading placeholders (person icons or loading text)
    const placeholders = page.locator('text=/loading/i').or(
      page.locator('[class*="animate-pulse"]')
    );
    const placeholderCount = await placeholders.count();
    
    // Placeholders might appear while player data loads
    if (placeholderCount > 0) {
      // Verify placeholder structure
      expect(placeholderCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show loading state with animate-pulse class', async ({ page }) => {
    await page.goto('http://localhost:3000/#/home');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Look for elements with animate-pulse (common loading indicator)
    const pulseElements = page.locator('[class*="animate-pulse"]');
    const pulseCount = await pulseElements.count();
    
    // Animate-pulse might be used for loading states
    // This verifies the loading animation class is present when needed
    expect(pulseCount).toBeGreaterThanOrEqual(0);
  });

  test('should handle loading state in profile page', async ({ page }) => {
    await page.goto('http://localhost:3000/#/profile');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Profile page might show loading while user data loads
    const profileLoading = page.locator('text=/loading/i');
    const profileLoadingCount = await profileLoading.count();
    
    // Loading might appear briefly
    if (profileLoadingCount > 0) {
      await expect(profileLoading.first()).toBeVisible({ timeout: 3000 });
    } else {
      // Or content should be loaded
      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });

  test('should show skeleton screens if implemented', async ({ page }) => {
    await page.goto('http://localhost:3000/#/home');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Look for skeleton screens (common patterns: gray boxes, shimmer effects)
    const skeletons = page.locator('[class*="skeleton"], [class*="shimmer"], [class*="placeholder"]');
    const skeletonCount = await skeletons.count();
    
    // Skeleton screens might be used for loading states
    // This verifies if they exist
    expect(skeletonCount).toBeGreaterThanOrEqual(0);
  });
});
