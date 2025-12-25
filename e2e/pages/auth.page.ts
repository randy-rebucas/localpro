import { Page, Locator, expect } from '@playwright/test';

export class AuthPage {
  readonly page: Page;
  readonly phoneInput: Locator;
  readonly sendCodeButton: Locator;
  readonly codeInputs: Locator;
  readonly verifyButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.phoneInput = page.locator('input[type="tel"]');
    this.sendCodeButton = page.getByRole('button', { name: /send verification code/i });
    this.codeInputs = page.locator('input[autocomplete="one-time-code"]');
    this.verifyButton = page.getByRole('button', { name: /verify\s*&\s*sign in/i });
  }

  async goto() {
    await this.page.goto('/auth');
  }

  async enterPhone(phone: string) {
    await this.phoneInput.fill(phone);
  }

  async sendVerificationCode() {
    await this.sendCodeButton.click();
  }

  async enterCode(code: string) {
    await expect(this.codeInputs).toHaveCount(6);

    const digits = code.replace(/\D/g, '').slice(0, 6);
    if (digits.length !== 6) {
      throw new Error(`Expected a 6-digit verification code, got "${code}"`);
    }

    for (let i = 0; i < 6; i++) {
      await this.codeInputs.nth(i).fill(digits[i]);
    }
  }

  async verifyCode() {
    await this.verifyButton.click();
  }

  async login(phone: string, code: string) {
    await this.goto();
    await this.enterPhone(phone);
    await this.sendVerificationCode();
    await this.enterCode(code);
    await this.verifyCode();
  }
}