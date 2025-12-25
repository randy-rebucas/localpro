import type { Page } from "@playwright/test";

export class Helpers {
  constructor(private page: Page) {}

  async waitForApiResponse(urlPattern: string, timeout = 30000) {
    return this.page.waitForResponse(
      (response) => response.url().includes(urlPattern) && response.status() === 200,
      { timeout }
    );
  }

  async fillForm(formData: Record<string, string>) {
    for (const [field, value] of Object.entries(formData)) {
      await this.page.fill(`[name="${field}"]`, value);
    }
  }

  async selectOption(selector: string, value: string) {
    await this.page.selectOption(selector, value);
  }

  async uploadFile(selector: string, filePath: string) {
    await this.page.setInputFiles(selector, filePath);
  }

  async waitForToast(message: string) {
    await this.page.waitForSelector(`text=${message}`, { timeout: 5000 });
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }
}