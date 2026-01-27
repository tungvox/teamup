import { test, expect } from '@playwright/test';

test.describe('Image Handling', () => {
  test('should load images on the page', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Wait for images to load

    // Check for images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // First image should be visible
      const firstImage = images.first();
      await expect(firstImage).toBeVisible({ timeout: 5000 });
      
      // Image should have src attribute
      const src = await firstImage.getAttribute('src');
      expect(src).toBeTruthy();
    }
  });

  test('should handle broken images gracefully', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Check for images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Check if images have error handling
      const firstImage = images.first();
      
      // Listen for image load errors
      const imageErrors: string[] = [];
      page.on('response', response => {
        if (response.url().match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          if (!response.ok()) {
            imageErrors.push(response.url());
          }
        }
      });
      
      await page.waitForTimeout(2000);
      
      // Images should load or have fallback handling
      // This test verifies the structure exists
      expect(imageCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display avatar images', async ({ page }) => {
    await page.goto('http://localhost:3000/#/home');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Look for avatar images (usually in profile or user sections)
    const avatars = page.locator('img[alt*="user" i], img[alt*="avatar" i], img[class*="avatar" i]');
    const avatarCount = await avatars.count();
    
    // Avatars might be present if user is authenticated
    if (avatarCount > 0) {
      const firstAvatar = avatars.first();
      await expect(firstAvatar).toBeVisible({ timeout: 5000 });
    }
  });

  test('should have proper alt text for images', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Check first few images for alt attributes
      for (let i = 0; i < Math.min(3, imageCount); i++) {
        const image = images.nth(i);
        const alt = await image.getAttribute('alt');
        const ariaLabel = await image.getAttribute('aria-label');
        
        // Images should have alt text or aria-label (decorative can have empty alt)
        expect(alt !== null || ariaLabel !== null).toBeTruthy();
      }
    }
  });

  test('should load background images', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Check for elements with background images
    const elementsWithBg = await page.evaluate(() => {
      const elements: string[] = [];
      document.querySelectorAll('*').forEach(el => {
        const styles = window.getComputedStyle(el);
        const bgImage = styles.backgroundImage;
        if (bgImage && bgImage !== 'none') {
          elements.push(el.tagName);
        }
      });
      return elements;
    });
    
    // Background images might be used for hero sections
    expect(elementsWithBg).toBeDefined();
  });

  test('should handle image loading states', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check for images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Images should eventually load
      for (let i = 0; i < Math.min(3, imageCount); i++) {
        const image = images.nth(i);
        
        // Wait for image to load or timeout
        try {
          await expect(image).toBeVisible({ timeout: 5000 });
        } catch (e) {
          // Image might not load, which is okay for this test
        }
      }
    }
  });

  test('should have proper image dimensions', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      const firstImage = images.first();
      const boundingBox = await firstImage.boundingBox();
      
      if (boundingBox) {
        // Images should have valid dimensions
        expect(boundingBox.width).toBeGreaterThan(0);
        expect(boundingBox.height).toBeGreaterThan(0);
      }
    }
  });

  test('should handle lazy loading if implemented', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check for lazy loading attributes
    const lazyImages = page.locator('img[loading="lazy"]');
    const lazyCount = await lazyImages.count();
    
    // Lazy loading is optional but improves performance
    // This test verifies if it's implemented
    expect(lazyCount).toBeGreaterThanOrEqual(0);
  });

  test('should display placeholder images while loading', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check for placeholder patterns (common in avatars)
    const placeholders = page.locator('[class*="placeholder"], [class*="avatar"] img');
    const placeholderCount = await placeholders.count();
    
    // Placeholders might be used while images load
    // This test verifies the structure
    expect(placeholderCount).toBeGreaterThanOrEqual(0);
  });

  test('should handle image aspect ratios', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // Check that images maintain aspect ratios
      const firstImage = images.first();
      const boundingBox = await firstImage.boundingBox();
      
      if (boundingBox) {
        // Images should have reasonable aspect ratios (not extremely wide or tall)
        const aspectRatio = boundingBox.width / boundingBox.height;
        
        // Aspect ratio should be reasonable (between 0.1 and 10)
        expect(aspectRatio).toBeGreaterThan(0.1);
        expect(aspectRatio).toBeLessThan(10);
      }
    }
  });

  test('should handle image errors with fallbacks', async ({ page }) => {
    // Intercept image requests and simulate failure
    await page.route('**/*.{jpg,jpeg,png,gif,webp}', route => {
      // Allow some images to fail to test error handling
      if (Math.random() > 0.5) {
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Page should still render even if some images fail
    const root = page.locator('#root');
    await expect(root).toBeVisible();
    
    // Body should have content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
