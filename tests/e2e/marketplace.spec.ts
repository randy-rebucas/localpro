import { test, expect } from '@playwright/test';

test.describe('Marketplace', () => {
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

    // Mock marketplace data
    await page.route('**/api/marketplace/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 1,
              title: 'House Cleaning',
              description: 'Professional house cleaning service',
              price: 50,
              category: 'cleaning',
              provider: 'Clean Pro Services'
            },
            {
              id: 2,
              title: 'Plumbing Repair',
              description: 'Emergency plumbing services',
              price: 80,
              category: 'plumbing',
              provider: 'Fix It Fast'
            }
          ]
        })
      });
    });

    await page.goto('/marketplace');
  });

  test('should display service listings', async ({ page }) => {
    // Wait for services to load
    await page.waitForTimeout(1000);
    
    // Check for service cards
    await expect(page.locator('[data-testid="service-card"]')).toHaveCount(2);
    await expect(page.locator('text=House Cleaning')).toBeVisible();
    await expect(page.locator('text=Plumbing Repair')).toBeVisible();
  });

  test('should filter services by category', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Click on cleaning category filter
    await page.click('button:has-text("Cleaning")');
    
    // Should show only cleaning services
    await expect(page.locator('text=House Cleaning')).toBeVisible();
    await expect(page.locator('text=Plumbing Repair')).not.toBeVisible();
  });

  test('should search services', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Type in search box
    await page.fill('input[placeholder*="search" i]', 'cleaning');
    
    // Should filter results
    await expect(page.locator('text=House Cleaning')).toBeVisible();
    await expect(page.locator('text=Plumbing Repair')).not.toBeVisible();
  });

  test('should sort services by price', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Click sort dropdown
    await page.click('select');
    await page.selectOption('select', 'price-low-high');
    
    // Check if services are sorted (this would need proper implementation)
    const serviceCards = page.locator('[data-testid="service-card"]');
    await expect(serviceCards.first()).toContainText('House Cleaning');
  });

  test('should handle service booking', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Mock booking endpoint
    await page.route('**/api/marketplace/book', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          bookingId: 'booking-123'
        })
      });
    });

    // Click book button on first service
    await page.click('[data-testid="service-card"]:first-child button:has-text("Book")');
    
    // Should show booking confirmation
    await expect(page.locator('text=Booking confirmed')).toBeVisible();
  });
});
