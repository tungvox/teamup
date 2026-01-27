import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Wait for React to render
  });

  test('should display landing page with all key elements', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/TeamUp/i);

    // Check for TeamUp logo/brand
    const logo = page.locator('text=TeamUp').first();
    await expect(logo).toBeVisible();

    // Check for main heading (should contain "Find" or "Squad" or similar)
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    const headingText = await heading.textContent();
    expect(headingText).toBeTruthy();
    expect(headingText!.length).toBeGreaterThan(0);

    // Check for "Get Started" or similar CTA button
    const ctaButton = page.getByRole('button').filter({ hasText: /get started|bắt đầu/i });
    await expect(ctaButton).toBeVisible();

    // Check for feature pills/badges (location, groups, analytics icons)
    const featureIcons = page.locator('[class*="material-symbols-outlined"]');
    const iconCount = await featureIcons.count();
    expect(iconCount).toBeGreaterThan(0);

    // Check for stats card (active players)
    const statsCard = page.locator('text=/12,405|active|players/i');
    await expect(statsCard.first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to login page when clicking Get Started', async ({ page }) => {
    // Find and click the Get Started button
    const getStartedButton = page.getByRole('button').filter({ hasText: /get started|bắt đầu/i });
    await expect(getStartedButton).toBeVisible();
    
    await getStartedButton.click();

    // Wait for Clerk to load (it redirects to its domain)
    await page.waitForTimeout(3000);
    
    // Verify we're on Clerk's auth page with correct redirect
    expect(page.url()).toContain('redirect_url');
    const url = new URL(page.url());
    const redirectUrl = url.searchParams.get('redirect_url');
    expect(redirectUrl).toBeTruthy();
    expect(redirectUrl).toContain('localhost:3000');
    expect(redirectUrl).toContain('login');
    
    // Verify login form is visible
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible({ timeout: 5000 });
    
    // Check that we're not on the landing page anymore
    const heading = page.getByRole('heading', { name: /sign in/i });
    const headingText = await heading.textContent();
    expect(headingText).toContain('Sign in'); // Verify it's the login page, not landing
  });

  test('should display feature badges correctly', async ({ page }) => {
    // Check for location feature
    const locationFeature = page.locator('text=/local games|trận đấu địa phương/i');
    await expect(locationFeature.first()).toBeVisible({ timeout: 5000 });

    // Check for find players feature
    const playersFeature = page.locator('text=/find players|tìm người chơi/i');
    await expect(playersFeature.first()).toBeVisible({ timeout: 5000 });

    // Check for track stats feature
    const statsFeature = page.locator('text=/track stats|theo dõi thống kê/i');
    await expect(statsFeature.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have responsive layout', async ({ page }) => {
    // Check that main content is visible (use .first() since there are nested main elements)
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible();

    // Check viewport
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();
    expect(viewport!.width).toBeGreaterThan(0);
    expect(viewport!.height).toBeGreaterThan(0);
  });
});
