import { test, expect } from '@playwright/test';

test.describe('UI Elements and Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
  });

  test('should have correct page structure', async ({ page }) => {
    // Check for root element
    const root = page.locator('#root');
    await expect(root).toBeVisible();

    // Check for body
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check that page has content
    const bodyText = await body.textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(100); // Should have substantial content
  });

  test('should display header with logo', async ({ page }) => {
    // Look for header element
    const header = page.locator('header').first();
    await expect(header).toBeVisible({ timeout: 5000 });

    // Check for TeamUp branding
    const logo = page.locator('text=TeamUp').first();
    await expect(logo).toBeVisible();
  });

  test('should have proper styling classes applied', async ({ page }) => {
    // Check that Tailwind classes are applied
    const body = page.locator('body');
    const bodyClasses = await body.getAttribute('class');
    expect(bodyClasses).toBeTruthy();
    expect(bodyClasses).toContain('bg-background'); // Your custom background class
  });

  test('should load images correctly', async ({ page }) => {
    // Check for background images or user avatars
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Check first image loads
      const firstImage = images.first();
      await expect(firstImage).toBeVisible({ timeout: 5000 });
    }
  });

  test('should have interactive buttons', async ({ page }) => {
    // Find buttons
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    // Check that buttons are visible and clickable
    const firstButton = buttons.first();
    await expect(firstButton).toBeVisible();
    await expect(firstButton).toBeEnabled();
  });

  test('should display stats card with numbers', async ({ page }) => {
    // Look for the stats card (active players: 12,405)
    const statsText = page.locator('text=/12,405|12[.,]405/i');
    await expect(statsText.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have proper viewport and responsive design', async ({ page }) => {
    // Check viewport size
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();
    
    // Test different viewport sizes
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.waitForTimeout(500);
    const root = page.locator('#root');
    await expect(root).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 720 }); // Desktop
    await page.waitForTimeout(500);
    await expect(root).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check for h1
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThan(0);
    await expect(h1.first()).toBeVisible();
  });

  test('should have accessible button labels', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      const buttonText = await firstButton.textContent();
      expect(buttonText).toBeTruthy();
      expect(buttonText!.trim().length).toBeGreaterThan(0);
    }
  });
});
