import { Page, Locator } from '@playwright/test';

export class MarketplacePage {
  readonly page: Page;
  readonly viewDetailsButtons: Locator;
  readonly bookNowButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.viewDetailsButtons = page.getByRole('button', { name: /^view details$/i });
    this.bookNowButtons = page.getByRole('button', { name: /^book now$/i });
  }

  async goto() {
    await this.page.goto('/marketplace');
  }

  async filterByCategory(category: string) {
    // Category filter is implemented as a list of buttons in the FilterSidebar.
    await this.page.getByRole('button', { name: new RegExp(`^${category}$`, 'i') }).click();
  }

  async openServiceDetails(index = 0) {
    await this.viewDetailsButtons.nth(index).click();
  }

  async bookServiceFromList(index = 0) {
    await this.bookNowButtons.nth(index).click();
  }

  async bookServiceFromDetail() {
    // On the service details page, "Book Now" is a link.
    await this.page.getByRole('link', { name: /^book now$/i }).click();
  }
}