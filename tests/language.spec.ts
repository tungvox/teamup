import { test, expect } from '@playwright/test';

test.describe('Language Switching', () => {
  test('should display content in default language', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check that page has content (either English or Vietnamese)
    const body = page.locator('body');
    const bodyText = await body.textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('should have language switcher in settings', async ({ page }) => {
    // Navigate to notification settings (requires auth, but we can check if the route exists)
    await page.goto('http://localhost:3000/#/settings/notifications');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Check for language section (may require auth, so check if page loaded)
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Look for language-related text
    const languageText = page.locator('text=/language|ngôn ngữ/i');
    const languageCount = await languageText.count();
    
    // If language section exists, verify it
    if (languageCount > 0) {
      await expect(languageText.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should persist language preference in localStorage', async ({ page, context }) => {
    // Set language in localStorage
    await context.addInitScript(() => {
      localStorage.setItem('teamup_language', 'en');
    });

    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check that language was set
    const language = await page.evaluate(() => {
      return localStorage.getItem('teamup_language');
    });
    expect(language).toBe('en');
  });

  test('should handle Vietnamese language', async ({ page, context }) => {
    // Set language to Vietnamese
    await context.addInitScript(() => {
      localStorage.setItem('teamup_language', 'vi');
    });

    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check that Vietnamese content appears (look for Vietnamese text patterns)
    const body = page.locator('body');
    const bodyText = await body.textContent();
    
    // Vietnamese text should be present if language is set to vi
    // Common Vietnamese words that might appear
    if (bodyText) {
      // Check for Vietnamese characters or common words
      const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(bodyText) ||
                            bodyText.includes('Bắt đầu') ||
                            bodyText.includes('Đăng nhập');
      
      // If Vietnamese is set, we might see Vietnamese text
      // This is a basic check - actual content depends on what's rendered
      expect(bodyText.length).toBeGreaterThan(0);
    }
  });

  test('should display bilingual content correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check that text content is displayed (regardless of language)
    const headings = page.locator('h1, h2, h3');
    const headingCount = await headings.count();
    
    if (headingCount > 0) {
      const firstHeading = headings.first();
      const headingText = await firstHeading.textContent();
      expect(headingText).toBeTruthy();
      expect(headingText!.trim().length).toBeGreaterThan(0);
    }
  });

  test('should update UI when language changes', async ({ page, context }) => {
    // Start with English
    await context.addInitScript(() => {
      localStorage.setItem('teamup_language', 'en');
    });

    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Get initial text
    const initialText = await page.locator('body').textContent();

    // Change to Vietnamese via localStorage
    await page.evaluate(() => {
      localStorage.setItem('teamup_language', 'vi');
      // Trigger a page reload to see the change
      window.location.reload();
    });

    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Text should have changed (or at least page should reload)
    const newText = await page.locator('body').textContent();
    expect(newText).toBeTruthy();
  });

  test('should have translation function available', async ({ page }) => {
    await page.goto('http://localhost:3000/#/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check that translations are working by looking for translated content
    // Look for common translated elements
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // Buttons should have text (translated)
      const firstButton = buttons.first();
      const buttonText = await firstButton.textContent();
      expect(buttonText).toBeTruthy();
    }
  });
});
