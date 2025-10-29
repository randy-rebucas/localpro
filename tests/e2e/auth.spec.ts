import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should display login form', async ({ page }) => {
    // Check if login form elements are present
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for invalid phone number', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation error
    await expect(page.locator('text=Phone number is required')).toBeVisible();
  });

  test('should handle phone number input', async ({ page }) => {
    const phoneInput = page.locator('input[type="tel"]');
    
    // Test phone number formatting
    await phoneInput.fill('1234567890');
    await expect(phoneInput).toHaveValue('1234567890');
  });

  test('should navigate to verification page after phone submission', async ({ page }) => {
    // Mock successful phone submission
    await page.route('**/api/auth/send-code', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Code sent' })
      });
    });

    await page.fill('input[type="tel"]', '1234567890');
    await page.click('button[type="submit"]');
    
    // Should show verification form
    await expect(page.locator('input[type="text"][placeholder*="code" i]')).toBeVisible();
  });

  test('should handle verification code submission', async ({ page }) => {
    // Mock verification endpoint
    await page.route('**/api/auth/verify-code', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true, 
          user: { id: 1, phone: '1234567890', role: 'client' },
          token: 'mock-jwt-token'
        })
      });
    });

    // Fill verification code
    await page.fill('input[type="text"][placeholder*="code" i]', '123456');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error for invalid verification code', async ({ page }) => {
    // Mock failed verification
    await page.route('**/api/auth/verify-code', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: false, 
          error: 'Invalid verification code' 
        })
      });
    });

    await page.fill('input[type="text"][placeholder*="code" i]', '000000');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid verification code')).toBeVisible();
  });
});
