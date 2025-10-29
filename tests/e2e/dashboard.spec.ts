import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          phone: '1234567890',
          role: 'client',
          name: 'Test User'
        })
      });
    });

    // Mock dashboard data
    await page.route('**/api/dashboard/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            services: [],
            announcements: [],
            activity: []
          }
        })
      });
    });

    await page.goto('/dashboard');
  });

  test('should display dashboard layout', async ({ page }) => {
    // Check for main dashboard elements
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should show loading states', async ({ page }) => {
    // Check for skeleton loading components
    await expect(page.locator('.animate-pulse')).toBeVisible();
  });

  test('should handle empty state', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Should show empty state when no data
    await expect(page.locator('text=No content available')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if layout adapts to mobile
    await expect(page.locator('main')).toBeVisible();
  });
});
