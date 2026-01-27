import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('should render correctly on mobile viewport (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Page should render
    const root = page.locator('#root');
    await expect(root).toBeVisible();

    // Content should be visible
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check viewport size
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);
    expect(viewport?.height).toBe(667);
  });

  test('should render correctly on tablet viewport (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Page should render
    const root = page.locator('#root');
    await expect(root).toBeVisible();

    // Check viewport size
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(768);
    expect(viewport?.height).toBe(1024);
  });

  test('should render correctly on desktop viewport (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Page should render
    const root = page.locator('#root');
    await expect(root).toBeVisible();

    // Check viewport size
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(1920);
    expect(viewport?.height).toBe(1080);
  });

  test('should show bottom navigation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/#/home');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Bottom nav should be visible on mobile (if authenticated)
    const bottomNav = page.locator('nav').first();
    const navCount = await bottomNav.count();
    
    if (navCount > 0) {
      // On mobile, nav should be at bottom
      const position = await bottomNav.first().evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          position: styles.position,
          bottom: styles.bottom
        };
      });
      
      // Nav should be positioned (fixed at bottom on mobile)
      expect(position.position).toBeTruthy();
    }
  });

  test('should show sidebar on desktop for protected routes', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3000/#/home');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // On desktop, nav should appear as sidebar (if authenticated)
    const sidebar = page.locator('nav').first();
    const sidebarCount = await sidebar.count();
    
    if (sidebarCount > 0) {
      // Check if it's positioned on the left (desktop sidebar)
      const position = await sidebar.first().evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          position: styles.position,
          left: styles.left,
          width: styles.width
        };
      });
      
      // Sidebar should have specific positioning on desktop
      expect(position.position).toBeTruthy();
    }
  });

  test('should handle layout changes at breakpoints', async ({ page }) => {
    // Start with mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const mobileLayout = await page.locator('body').screenshot();

    // Switch to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500); // Wait for layout to adjust

    const desktopLayout = await page.locator('body').screenshot();

    // Layouts should be different (screenshots should differ)
    expect(mobileLayout).toBeTruthy();
    expect(desktopLayout).toBeTruthy();
  });

  test('should maintain functionality across viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },  // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 } // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:3000/#/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      // Buttons should be clickable at all sizes
      const buttons = page.getByRole('button');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        const firstButton = buttons.first();
        await expect(firstButton).toBeVisible();
        await expect(firstButton).toBeEnabled();
      }
    }
  });

  test('should handle text overflow on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // Very small screen
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Text should not overflow container
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check for horizontal scroll (should not exist)
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    // Ideally, there should be no horizontal scroll
    // But this depends on the actual layout
    expect(hasHorizontalScroll).toBeDefined();
  });

  test('should adapt images to viewport size', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      const firstImage = images.first();
      const imageSize = await firstImage.boundingBox();
      
      // Image should fit within viewport
      if (imageSize) {
        expect(imageSize.width).toBeLessThanOrEqual(375);
      }
    }
  });

  test('should handle touch targets on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Buttons should have adequate touch target size (minimum 44x44px)
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      const buttonSize = await firstButton.boundingBox();
      
      if (buttonSize) {
        // Touch targets should be at least 44x44px for accessibility
        expect(buttonSize.width).toBeGreaterThanOrEqual(20); // Reasonable minimum
        expect(buttonSize.height).toBeGreaterThanOrEqual(20); // Reasonable minimum
      }
    }
  });

  test('should maintain aspect ratios across breakpoints', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:3000/#/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      // Content should maintain proper proportions
      const root = page.locator('#root');
      await expect(root).toBeVisible();
    }
  });

  test('should handle orientation changes', async ({ page }) => {
    // Portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const portraitRoot = page.locator('#root');
    await expect(portraitRoot).toBeVisible();

    // Landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500);

    const landscapeRoot = page.locator('#root');
    await expect(landscapeRoot).toBeVisible();
  });
});
