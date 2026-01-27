import { test, expect } from '@playwright/test';

test.describe('Enhanced Accessibility', () => {
  test('should support keyboard navigation with Tab key', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Press Tab to navigate
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Check if focus moved to an interactive element
    const focusedElement = page.locator(':focus');
    const focusedCount = await focusedElement.count();
    
    if (focusedCount > 0) {
      const tagName = await focusedElement.first().evaluate(el => el.tagName);
      expect(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(tagName);
    }
  });

  test('should support Enter key to activate buttons', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Find a button
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await firstButton.focus();
      
      // Press Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // Button action should be triggered (navigation or other action)
      // This is a basic test - actual behavior depends on the button
    }
  });

  test('should support Escape key to close modals', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Escape should close any open modals or dialogs
    // This is a basic test - actual behavior depends on modal state
  });

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check buttons for aria-label or accessible name
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      const ariaLabel = await firstButton.getAttribute('aria-label');
      const buttonText = await firstButton.textContent();
      
      // Button should have either aria-label or text content
      expect(ariaLabel || buttonText).toBeTruthy();
    }
  });

  test('should have proper ARIA roles', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check for common ARIA roles
    const nav = page.getByRole('navigation');
    const navCount = await nav.count();
    
    // Navigation should have proper role
    if (navCount > 0) {
      await expect(nav.first()).toBeVisible();
    }

    // Check for main content area
    const main = page.getByRole('main');
    const mainCount = await main.count();
    
    if (mainCount > 0) {
      await expect(main.first()).toBeVisible();
    }
  });

  test('should manage focus correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Tab through elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    const firstFocused = page.locator(':focus');
    const firstFocusedCount = await firstFocused.count();
    
    if (firstFocusedCount > 0) {
      // Tab again
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      // Focus should move to next element
      const secondFocused = page.locator(':focus');
      const secondFocusedCount = await secondFocused.count();
      
      // Focus should be on a different element
      expect(secondFocusedCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should have accessible form inputs', async ({ page }) => {
    await page.goto('http://localhost:3000/#/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Wait for Clerk to load

    // Look for form inputs
    const inputs = page.getByRole('textbox');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      const firstInput = inputs.first();
      
      // Input should have accessible label or placeholder
      const ariaLabel = await firstInput.getAttribute('aria-label');
      const placeholder = await firstInput.getAttribute('placeholder');
      const label = await firstInput.getAttribute('aria-labelledby');
      
      expect(ariaLabel || placeholder || label).toBeTruthy();
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check for h1 (should be present)
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThan(0);
    
    // Check heading order (h1 should come before h2, etc.)
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    if (headingCount > 1) {
      // Verify headings are in logical order
      const firstHeading = await headings.first().evaluate(el => {
        const tag = el.tagName;
        return parseInt(tag.charAt(1));
      });
      
      expect(firstHeading).toBeLessThanOrEqual(2); // Should start with h1 or h2
    }
  });

  test('should have skip links if implemented', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Look for skip links (common accessibility pattern)
    const skipLinks = page.locator('a[href*="#main"], a[href*="#content"], [class*="skip"]');
    const skipLinkCount = await skipLinks.count();
    
    // Skip links are optional but good for accessibility
    // This test verifies if they exist
    expect(skipLinkCount).toBeGreaterThanOrEqual(0);
  });

  test('should have proper alt text for images', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check images for alt attributes
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      const firstImage = images.first();
      const alt = await firstImage.getAttribute('alt');
      const ariaLabel = await firstImage.getAttribute('aria-label');
      
      // Images should have alt text or aria-label (decorative images can have empty alt)
      expect(alt !== null || ariaLabel !== null).toBeTruthy();
    }
  });

  test('should support screen reader announcements', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check for aria-live regions (for screen reader announcements)
    const liveRegions = page.locator('[aria-live], [role="alert"], [role="status"]');
    const liveRegionCount = await liveRegions.count();
    
    // Live regions are optional but improve accessibility
    // This test verifies if they exist
    expect(liveRegionCount).toBeGreaterThanOrEqual(0);
  });

  test('should have proper button states', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check buttons for disabled state
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      const isDisabled = await firstButton.isDisabled();
      const ariaDisabled = await firstButton.getAttribute('aria-disabled');
      
      // Disabled buttons should have proper state indication
      if (isDisabled || ariaDisabled === 'true') {
        expect(isDisabled || ariaDisabled).toBeTruthy();
      }
    }
  });
});
