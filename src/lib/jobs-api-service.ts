/**
 * Real Jobs API Service
 * Implements actual API calls to backend job board services
 * Falls back to mock data when backend is unavailable or in development mode
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL, API_ENDPOINTS } from './api';
import { createAuthFetchOptions } from './auth-utils';
import { logger } from './logger';
import { DEV_CONFIG } from './env';

// API Error class
export class JobsAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'JobsAPIError';
  }
}

// Generic API request wrapper with error handling
async function jobsApiRequest<T>(
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
        let errorMessage = `Jobs API request failed: ${response.status} ${response.statusText}`;
        let errorCode: string | undefined;

        // Try to parse error response
        if (contentType?.includes('application/json')) {
          try {
            const errorData = await response.json();
            if (errorData.message) errorMessage = errorData.message;
            if (errorData.error) errorMessage = errorData.error;
            if (errorData.code) errorCode = errorData.code;
          } catch (parseError) {
            logger.warn('Failed to parse jobs error response', { parseError });
          }
        } else {
          try {
            const text = await response.text();
            if (text) errorMessage = text.substring(0, 200);
          } catch (textError) {
            logger.warn('Failed to read jobs error response text', { textError });
          }
        }

        throw new JobsAPIError(errorMessage, response.status, errorCode);
      }

      // Parse successful response
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        throw new JobsAPIError('Expected JSON response', response.status);
      }

    } catch (error) {
      const isLastAttempt = attempt === retries;

      if (error instanceof JobsAPIError) {
        // Don't retry API errors (4xx, 5xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Retry 5xx errors and network errors
        if (!isLastAttempt) {
          logger.warn(`Jobs API request failed (attempt ${attempt}/${retries}), retrying...`, {
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
          logger.warn(`Jobs Network error (attempt ${attempt}/${retries}), retrying...`, {
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

  throw new Error('Unexpected error in jobs API request');
}

// Jobs API Service
export class RealJobsService {
  // Jobs Management
  async getJobs(params?: {
    category?: string;
    location?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    minSalary?: number;
    maxSalary?: number;
    type?: string;
    experience?: string;
    keywords?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
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

      const endpoint = `${API_ENDPOINTS.jobs}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await jobsApiRequest<{ data: any[]; total: number; hasMore: boolean }>(endpoint);

      return response;
    } catch (error) {
      logger.error('Real jobs get jobs failed', error);
      return { data: [], total: 0, hasMore: false };
    }
  }

  async searchJobs(searchParams: any): Promise<{ data: any[]; total: number; hasMore: boolean }> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const endpoint = `${API_ENDPOINTS.jobsSearch}?${queryParams.toString()}`;
      const response = await jobsApiRequest<{ data: any[]; total: number; hasMore: boolean }>(endpoint);

      return response;
    } catch (error) {
      logger.error('Real jobs search jobs failed', error);
      return { data: [], total: 0, hasMore: false };
    }
  }

  async getJobById(jobId: string): Promise<any> {
    try {
      const response = await jobsApiRequest<{ data: any }>(
        `${API_ENDPOINTS.jobsById}/${jobId}`
      );
      return response.data;
    } catch (error) {
      logger.error('Real jobs get job by ID failed', error);
      throw error;
    }
  }

  async getMyJobs(): Promise<any[]> {
    try {
      const response = await jobsApiRequest<{ data: any[] }>(
        API_ENDPOINTS.jobsMyJobs
      );
      return response.data;
    } catch (error) {
      logger.error('Real jobs get my jobs failed', error);
      return [];
    }
  }

  async createJob(jobData: any): Promise<any> {
    try {
      const response = await jobsApiRequest<{ data: any }>(
        API_ENDPOINTS.jobs,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jobData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real jobs create job failed', error);
      throw error;
    }
  }

  async updateJob(jobId: string, jobData: any): Promise<any> {
    try {
      const response = await jobsApiRequest<{ data: any }>(
        `${API_ENDPOINTS.jobsById}/${jobId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jobData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real jobs update job failed', error);
      throw error;
    }
  }

  async deleteJob(jobId: string): Promise<void> {
    try {
      await jobsApiRequest(
        `${API_ENDPOINTS.jobsById}/${jobId}`,
        {
          method: 'DELETE',
        }
      );
    } catch (error) {
      logger.error('Real jobs delete job failed', error);
      throw error;
    }
  }

  // Categories
  async getCategories(): Promise<any[]> {
    try {
      const response = await jobsApiRequest<{ data: any[] }>(
        API_ENDPOINTS.jobsCategories
      );
      return response.data;
    } catch (error) {
      logger.error('Real jobs get categories failed', error);
      return [];
    }
  }

  // Applications
  async getMyApplications(): Promise<any[]> {
    try {
      const response = await jobsApiRequest<{ data: any[] }>(
        API_ENDPOINTS.jobsMyApplications
      );
      return response.data;
    } catch (error) {
      logger.error('Real jobs get my applications failed', error);
      return [];
    }
  }

  async applyForJob(jobId: string, applicationData: any): Promise<any> {
    try {
      const response = await jobsApiRequest<{ data: any }>(
        `${API_ENDPOINTS.jobsApply}/${jobId}/apply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(applicationData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real jobs apply for job failed', error);
      throw error;
    }
  }

  async getJobApplications(jobId: string): Promise<any[]> {
    try {
      const response = await jobsApiRequest<{ data: any[] }>(
        `${API_ENDPOINTS.jobsApplications}/${jobId}/applications`
      );
      return response.data;
    } catch (error) {
      logger.error('Real jobs get job applications failed', error);
      return [];
    }
  }

  async getApplicationById(applicationId: string): Promise<any> {
    try {
      const response = await jobsApiRequest<{ data: any }>(
        `${API_ENDPOINTS.jobsApplicationsById}/${applicationId}`
      );
      return response.data;
    } catch (error) {
      logger.error('Real jobs get application by ID failed', error);
      throw error;
    }
  }

  async updateApplicationStatus(applicationId: string, status: string, data?: any): Promise<any> {
    try {
      const response = await jobsApiRequest<{ data: any }>(
        `${API_ENDPOINTS.jobsApplicationStatus}/${applicationId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, ...data }),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real jobs update application status failed', error);
      throw error;
    }
  }

  // Logo/Images
  async uploadLogo(jobId: string, logo: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('logo', logo);

      const response = await jobsApiRequest<{ data: any }>(
        `${API_ENDPOINTS.jobsLogo}/${jobId}/logo`,
        {
          method: 'POST',
          body: formData,
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real jobs upload logo failed', error);
      throw error;
    }
  }

  // Statistics
  async getStatistics(jobId?: string): Promise<any> {
    try {
      let endpoint = API_ENDPOINTS.jobsStats;
      if (jobId) {
        endpoint = `${API_ENDPOINTS.jobsStats}/${jobId}`;
      }

      const response = await jobsApiRequest<{ data: any }>(endpoint);
      return response.data;
    } catch (error) {
      logger.error('Real jobs get statistics failed', error);
      return {};
    }
  }
}

// Singleton instance
export const realJobsService = new RealJobsService();



