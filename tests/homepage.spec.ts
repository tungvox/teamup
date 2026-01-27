import { test, expect } from '@playwright/test';

test.describe('Homepage Loading', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    
    // Verify we're not on about:blank
    expect(page.url()).not.toBe('about:blank');
    expect(page.url()).toContain('localhost:3000');
    
    // Wait for root element
    await page.waitForSelector('#root', { timeout: 10000, state: 'visible' });
    
    // Wait for React to render
    await page.waitForTimeout(2000);
    
    // Verify title
    await expect(page).toHaveTitle(/TeamUp/i);
    
    // Verify page has content
    const body = page.locator('body');
    const bodyText = await body.textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(100);
  });

  test('should have all critical elements visible', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Check root element
    const root = page.locator('#root');
    await expect(root).toBeVisible();

    // Check for main content
    const main = page.locator('main');
    await expect(main.first()).toBeVisible({ timeout: 5000 });

    // Check for header
    const header = page.locator('header').first();
    await expect(header).toBeVisible({ timeout: 5000 });
  });
});
