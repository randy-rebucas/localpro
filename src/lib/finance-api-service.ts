/**
 * Real Finance API Service
 * Implements actual API calls to backend finance services
 * Falls back to mock data when backend is unavailable or in development mode
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL, API_ENDPOINTS } from './api';
import { createAuthFetchOptions } from './auth-utils';
import { logger } from './logger';
import { DEV_CONFIG } from './env';

// API Error class
export class FinanceAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'FinanceAPIError';
  }
}

// Generic API request wrapper with error handling
async function financeApiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 3
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, createAuthFetchOptions(options));
      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        let errorMessage = `Finance API request failed: ${response.status} ${response.statusText}`;
        let errorCode: string | undefined;

        // Try to parse error response
        if (contentType?.includes('application/json')) {
          try {
            const errorData = await response.json();
            if (errorData.message) errorMessage = errorData.message;
            if (errorData.error) errorMessage = errorData.error;
            if (errorData.code) errorCode = errorData.code;
          } catch (parseError) {
            logger.warn('Failed to parse finance error response', { parseError });
          }
        } else {
          try {
            const text = await response.text();
            if (text) errorMessage = text.substring(0, 200);
          } catch (textError) {
            logger.warn('Failed to read finance error response text', { textError });
          }
        }

        throw new FinanceAPIError(errorMessage, response.status, errorCode);
      }

      // Parse successful response
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        throw new FinanceAPIError('Expected JSON response', response.status);
      }

    } catch (error) {
      const isLastAttempt = attempt === retries;

      if (error instanceof FinanceAPIError) {
        // Don't retry API errors (4xx, 5xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Retry 5xx errors and network errors
        if (!isLastAttempt) {
          logger.warn(`Finance API request failed (attempt ${attempt}/${retries}), retrying...`, {
            url,
            error: error.message,
            status: error.status
          });
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
      } else {
        // Network or other errors
        if (!isLastAttempt) {
          logger.warn(`Finance Network error (attempt ${attempt}/${retries}), retrying...`, {
            url,
            error: error.message
          });
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
      }

      throw error;
    }
  }

  throw new Error('Unexpected error in finance API request');
}

// Finance API Service
export class RealFinanceService {
  // Overview/Dashboard
  async getOverview(): Promise<any> {
    try {
      const response = await financeApiRequest<{ data: any }>(
        API_ENDPOINTS.financeOverview
      );
      return response.data;
    } catch (error) {
      logger.error('Real finance get overview failed', error);
      return {};
    }
  }

  // Transactions
  async getTransactions(params?: {
    type?: 'all' | 'earnings' | 'expenses';
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; total: number; hasMore: boolean }> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const endpoint = `${API_ENDPOINTS.financeTransactions}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await financeApiRequest<{ data: any[]; total: number; hasMore: boolean }>(endpoint);

      return response;
    } catch (error) {
      logger.error('Real finance get transactions failed', error);
      return { data: [], total: 0, hasMore: false };
    }
  }

  // Earnings
  async getEarnings(params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; total: number; hasMore: boolean }> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const endpoint = `${API_ENDPOINTS.financeEarnings}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await financeApiRequest<{ data: any[]; total: number; hasMore: boolean }>(endpoint);

      return response;
    } catch (error) {
      logger.error('Real finance get earnings failed', error);
      return { data: [], total: 0, hasMore: false };
    }
  }

  // Expenses
  async getExpenses(params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; total: number; hasMore: boolean }> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const endpoint = `${API_ENDPOINTS.financeExpenses}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await financeApiRequest<{ data: any[]; total: number; hasMore: boolean }>(endpoint);

      return response;
    } catch (error) {
      logger.error('Real finance get expenses failed', error);
      return { data: [], total: 0, hasMore: false };
    }
  }

  async addExpense(expenseData: any): Promise<any> {
    try {
      const response = await financeApiRequest<{ data: any }>(
        API_ENDPOINTS.financeExpenseAdd,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expenseData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real finance add expense failed', error);
      throw error;
    }
  }

  // Reports
  async getReports(params?: {
    type?: string;
    startDate?: string;
    endDate?: string;
    format?: 'json' | 'pdf' | 'csv';
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const endpoint = `${API_ENDPOINTS.financeReports}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await financeApiRequest<{ data: any }>(endpoint);

      return response.data;
    } catch (error) {
      logger.error('Real finance get reports failed', error);
      return {};
    }
  }

  // Withdrawals
  async requestWithdrawal(withdrawalData: any): Promise<any> {
    try {
      const response = await financeApiRequest<{ data: any }>(
        API_ENDPOINTS.financeWithdraw,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(withdrawalData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real finance request withdrawal failed', error);
      throw error;
    }
  }

  async getWithdrawals(): Promise<any[]> {
    try {
      const response = await financeApiRequest<{ data: any[] }>(
        API_ENDPOINTS.financeWithdrawalsProcess
      );
      return response.data;
    } catch (error) {
      logger.error('Real finance get withdrawals failed', error);
      return [];
    }
  }

  // Tax Documents
  async getTaxDocuments(): Promise<any[]> {
    try {
      const response = await financeApiRequest<{ data: any[] }>(
        API_ENDPOINTS.financeTaxDocuments
      );
      return response.data;
    } catch (error) {
      logger.error('Real finance get tax documents failed', error);
      return [];
    }
  }

  // Wallet Settings
  async getWalletSettings(): Promise<any> {
    try {
      const response = await financeApiRequest<{ data: any }>(
        API_ENDPOINTS.financeWalletSettings
      );
      return response.data;
    } catch (error) {
      logger.error('Real finance get wallet settings failed', error);
      return {};
    }
  }

  async updateWalletSettings(settings: any): Promise<any> {
    try {
      const response = await financeApiRequest<{ data: any }>(
        API_ENDPOINTS.financeWalletSettings,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real finance update wallet settings failed', error);
      throw error;
    }
  }

  // Top-ups
  async requestTopUp(topUpData: any): Promise<any> {
    try {
      const response = await financeApiRequest<{ data: any }>(
        API_ENDPOINTS.financeTopUp,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(topUpData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real finance request top up failed', error);
      throw error;
    }
  }

  async getMyTopUps(): Promise<any[]> {
    try {
      const response = await financeApiRequest<{ data: any[] }>(
        API_ENDPOINTS.financeTopUpsMyRequests
      );
      return response.data;
    } catch (error) {
      logger.error('Real finance get my top ups failed', error);
      return [];
    }
  }

  async getTopUps(): Promise<any[]> {
    try {
      const response = await financeApiRequest<{ data: any[] }>(
        API_ENDPOINTS.financeTopUps
      );
      return response.data;
    } catch (error) {
      logger.error('Real finance get top ups failed', error);
      return [];
    }
  }

  async processTopUp(topUpId: string, action: 'approve' | 'reject', data?: any): Promise<any> {
    try {
      const response = await financeApiRequest<{ data: any }>(
        `${API_ENDPOINTS.financeTopUpProcess}/${topUpId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ...data }),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real finance process top up failed', error);
      throw error;
    }
  }
}

// Singleton instance
export const realFinanceService = new RealFinanceService();



