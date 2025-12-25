import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly headerTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    // Dashboard uses parallel routes; the most stable "loaded" signal is the header H1.
    this.headerTitle = page.getByRole('heading', { level: 1 }).first();
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async waitForLoad() {
    await this.headerTitle.waitFor({ state: 'visible' });
  }
}