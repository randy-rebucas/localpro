import { test, expect } from '@playwright/test';
import { MarketplacePage } from '../../pages/marketplace.page';

test.describe('Journey 5: Browse and Book Service', () => {
  let marketplacePage: MarketplacePage;

  test.beforeEach(async ({ page }) => {
    marketplacePage = new MarketplacePage(page);
  });

  test('should reach the payment step for a service booking (happy path, no submission)', async ({ page }) => {
    // Step 1: Navigate to marketplace
    await marketplacePage.goto();
    await expect(page).toHaveURL(/.*marketplace/);

    // Step 2: Browse service listings
    await expect(marketplacePage.viewDetailsButtons.first()).toBeVisible();

    // Step 3: Apply filters
    // Category names are dynamic; only run this step if that category exists in the sidebar.
    const cleaningCategory = page.getByRole('button', { name: /^Cleaning$/i });
    if (await cleaningCategory.count()) {
      await marketplacePage.filterByCategory('Cleaning');
    }

    // Step 4: Open service details
    await marketplacePage.openServiceDetails(0);
    await expect(page).toHaveURL(/.*marketplace\/services\/[^/]+/);

    // Step 6: Review service details
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Description$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Provider$/i })).toBeVisible();

    // Step 7: Click "Book Service"
    await marketplacePage.bookServiceFromDetail();
    await expect(page).toHaveURL(/.*marketplace\/services\/[^/]+\/book/);

    // Step 8: Fill Step 1 (Date/Time/Location)
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + 1);
    const dateString = bookingDate.toISOString().split('T')[0];

    await page.locator('input[type="date"]').fill(dateString);
    await page.locator('input[type="time"]').fill('10:00');
    await page.getByRole('combobox', { name: /location search/i }).fill('Manila');
    await page.locator('input[type="number"]').fill('2');

    await page.getByRole('button', { name: /^Next$/i }).click();

    // Step 9: Fill Step 2 (Address)
    const addressInputs = page.locator('input[type="text"]');
    // Address step has 5 text inputs: street, city, state, zip, country
    await expect(addressInputs).toHaveCount(5);
    await addressInputs.nth(0).fill('123 Test Street');
    await addressInputs.nth(1).fill('Test City');
    await addressInputs.nth(2).fill('Test State');
    await addressInputs.nth(3).fill('12345');
    await addressInputs.nth(4).fill('Philippines');

    await page.getByRole('button', { name: /^Next$/i }).click();

    // Step 10: Summary -> Continue to Payment
    await expect(page.getByRole('heading', { name: /^Booking Summary$/i })).toBeVisible();
    await page.getByRole('button', { name: /continue to payment/i }).click();

    // Step 11: Payment Method step is visible (do not submit/confirm to avoid backend dependencies)
    await expect(page.getByRole('heading', { name: /^Payment Method$/i })).toBeVisible();
  });

  test('should handle booking errors gracefully', async ({ page }) => {
    await marketplacePage.goto();
    await marketplacePage.openServiceDetails(0);
    await marketplacePage.bookServiceFromDetail();

    // Try to proceed without filling required fields
    const nextButton = page.getByRole('button', { name: /^Next$/i });
    await expect(nextButton).toBeDisabled();
  });
});