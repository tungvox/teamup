import { test, expect } from '@playwright/test';

test.describe('Form Interactions', () => {
  test('should display login form when navigating to login', async ({ page }) => {
    await page.goto('http://localhost:3000/#/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for Clerk SignIn component to load
    await page.waitForTimeout(3000);

    // Clerk redirects to its own domain, so we verify the form elements instead of URL
    // Verify Clerk's sign-in form is visible
    await expect(page.getByRole('heading', { name: /sign in to teamup/i })).toBeVisible({ timeout: 5000 });
    
    // Verify form elements are present
    await expect(page.getByPlaceholder(/enter your email address/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter your password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible();
    
    // Verify redirect URL parameter indicates correct destination
    expect(page.url()).toContain('redirect_url');
    const url = new URL(page.url());
    const redirectUrl = url.searchParams.get('redirect_url');
    expect(redirectUrl).toBeTruthy();
    expect(redirectUrl).toContain('localhost:3000');
    expect(redirectUrl).toContain('login');
  });

  test('should display signup form when navigating to create-profile', async ({ page }) => {
    await page.goto('http://localhost:3000/#/create-profile');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for Clerk SignUp component to load
    await page.waitForTimeout(3000);

    // Clerk redirects to its own domain, so we verify the form elements instead of URL
    // Verify Clerk's sign-up form is visible (heading may vary)
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
    
    // Verify form elements are present
    await expect(page.getByPlaceholder(/enter your email address/i).or(page.getByPlaceholder(/email/i))).toBeVisible();
    
    // Verify redirect URL parameter indicates correct destination
    expect(page.url()).toContain('redirect_url');
    const url = new URL(page.url());
    const redirectUrl = url.searchParams.get('redirect_url');
    expect(redirectUrl).toBeTruthy();
    expect(redirectUrl).toContain('localhost:3000');
    expect(redirectUrl).toContain('create-profile');
  });

  test('should handle form navigation', async ({ page }) => {
    // Start at landing page
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Click Get Started to go to login
    const getStartedButton = page.getByRole('button').filter({ hasText: /get started|bắt đầu/i });
    if (await getStartedButton.isVisible()) {
      await getStartedButton.click();
      
      // Wait for Clerk to load (it redirects to its domain)
      await page.waitForTimeout(3000);
      
      // Verify we're on Clerk's auth page with correct redirect
      expect(page.url()).toContain('redirect_url');
      const url = new URL(page.url());
      const redirectUrl = url.searchParams.get('redirect_url') || url.hash.split('redirect_url=')[1]?.split('&')[0];
      if (redirectUrl) {
        const decodedRedirect = decodeURIComponent(redirectUrl);
        expect(decodedRedirect).toContain('localhost:3000');
      }
      
      // Verify login form is visible
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Search and Filters', () => {
  test('should handle search input on dashboard (if accessible)', async ({ page }) => {
    // Note: This test assumes user is authenticated
    // In a real scenario, you'd set up auth state first
    await page.goto('http://localhost:3000/#/home');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Look for search inputs
    const searchInputs = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="tìm" i]');
    const inputCount = await searchInputs.count();
    
    // If search input exists, test it
    if (inputCount > 0) {
      const searchInput = searchInputs.first();
      await expect(searchInput).toBeVisible({ timeout: 5000 });
      
      // Try typing in search
      await searchInput.fill('test search');
      const value = await searchInput.inputValue();
      expect(value).toBe('test search');
    }
  });
});
