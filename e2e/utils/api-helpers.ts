import { APIRequestContext } from '@playwright/test';

export class ApiHelpers {
  constructor(private apiContext: APIRequestContext) {}

  async login(phone: string, code: string) {
    // Send verification code
    await this.apiContext.post('/api/auth/send-code', {
      data: { phone },
    });

    // Verify code
    const response = await this.apiContext.post('/api/auth/verify-code', {
      data: { phone, code },
    });

    return response.json();
  }

  async createService<T extends Record<string, unknown>>(serviceData: T, token: string) {
    return this.apiContext.post('/api/marketplace/services', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: serviceData,
    });
  }

  async createSupply<T extends Record<string, unknown>>(supplyData: T, token: string) {
    return this.apiContext.post('/api/supplies', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: supplyData,
    });
  }

  async createBooking<T extends Record<string, unknown>>(bookingData: T, token: string) {
    return this.apiContext.post('/api/marketplace/bookings', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: bookingData,
    });
  }
}