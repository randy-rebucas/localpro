# Enhanced Admin Feature Implementation Prompt

## 🎯 Use this enhanced prompt when implementing new admin features with API integration and testing

Copy and paste this prompt when working on new admin features to ensure consistent styling, proper API integration, and comprehensive testing.

---

## 📋 Enhanced Implementation Prompt

```
You are implementing a new admin feature for the LocalPro platform. Follow these comprehensive guidelines based on the established audit page patterns, API integration patterns, and testing requirements.

### 🎨 STYLING REQUIREMENTS (Same as base prompt)

**Page Structure:**
- Use `space-y-4` for main container spacing
- Implement responsive design with mobile-first approach
- Follow the established component hierarchy

**Page Header Pattern:**
```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
      {pageTitle}
    </h1>
    <p className="text-gray-600 text-sm">{pageDescription}</p>
  </div>
  <div className="mt-2 sm:mt-0 flex items-center space-x-2">
    {/* Action buttons with proper styling */}
  </div>
</div>
```

### 🔌 API INTEGRATION REQUIREMENTS

**Based on Existing Admin Features:**
This prompt is based on the actual implemented admin features in your codebase:
- **Users Management**: `src/app/api/admin/users/` - User CRUD operations with pagination, filtering, and sorting
- **Error Monitoring**: `src/app/api/admin/errors/` - Error logs with statistics and resolution tracking  
- **Dashboard Analytics**: `src/app/api/admin/dashboard/` - Comprehensive admin dashboard with multiple data sources
- **User Statistics**: `src/app/api/admin/users/stats/` - User analytics and metrics
- **Error Statistics**: `src/app/api/admin/errors/stats/` - Error analytics and trends

**API Endpoint Structure:**
Create API endpoints following the established patterns from existing admin features:

```tsx
// API Route: src/app/api/admin/[feature]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '50';
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query parameters for the backend API
    const queryParams: Record<string, string> = {
      page,
      limit,
      sortBy,
      sortOrder
    };

    if (search) queryParams.search = search;
    if (status && status !== 'all') queryParams.status = status;

    // Make authenticated request to the backend API
    // Use actual endpoints from your API_ENDPOINTS like:
    // - 'usersById' for user management
    // - 'analyticsUser' for user analytics  
    // - 'supplies' for supplies management
    // - 'analyticsOverview' for dashboard data
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'featureEndpoint', // Replace with actual endpoint from API_ENDPOINTS
      [],
      queryParams,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch feature data from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching feature data:", error);
    
    let errorMessage = "Internal server error";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = "Request timeout - the external service is taking too long to respond";
        statusCode = 504;
      } else if (error.message.includes('fetch failed')) {
        errorMessage = "Unable to connect to external service - please try again later";
        statusCode = 503;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: statusCode }
    );
  }
}

// POST /api/admin/[feature] - Create a new feature item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, status = 'active' } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Make authenticated request to the backend API to create feature
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'featureEndpoint', // Replace with actual endpoint
      [],
      {},
      { 
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to create feature in backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating feature:', error);
    
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - the external service is taking too long to respond';
        statusCode = 504;
      } else if (error.message.includes('fetch failed')) {
        errorMessage = 'Unable to connect to external service - please try again later';
        statusCode = 503;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: statusCode }
    );
  }
}
```

**Stats API Route:**
```tsx
// API Route: src/app/api/admin/[feature]/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-session";
import { makeAuthenticatedRequestWithPath } from "@/lib/api-auth-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    // Build query parameters for the backend API
    const queryParams: Record<string, string> = {
      period
    };

    // Make authenticated request to the backend API for feature statistics
    // Use actual analytics endpoints from your API_ENDPOINTS like:
    // - 'analyticsUser' for user statistics
    // - 'analyticsOverview' for dashboard analytics
    // - 'logsStats' for error statistics
    const response = await makeAuthenticatedRequestWithPath(
      request,
      'analyticsFeature', // Replace with actual analytics endpoint from API_ENDPOINTS
      [],
      queryParams,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch feature statistics from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching feature statistics:', error);
    
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - the external service is taking too long to respond';
        statusCode = 504;
      } else if (error.message.includes('fetch failed')) {
        errorMessage = 'Unable to connect to external service - please try again later';
        statusCode = 503;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: statusCode }
    );
  }
}
```

### 🎯 FRONTEND API INTEGRATION

**Based on Existing Frontend Patterns:**
This prompt uses patterns from your actual implemented admin pages:
- **Users Page**: `src/app/admin/users/page.tsx` - User management with filtering, sorting, and pagination
- **Errors Page**: `src/app/admin/errors/page.tsx` - Error monitoring with statistics and actions
- **Dashboard Page**: `src/app/admin/page.tsx` - Comprehensive admin dashboard with multiple widgets
- **Admin Layout**: `src/app/admin/layout.tsx` - Consistent admin navigation and structure

**API Service Functions:**
```tsx
// Create: src/lib/api-[feature].ts
import { API_ENDPOINTS } from './api';

// Use actual API endpoints from your existing codebase:
// - API_ENDPOINTS.usersById for user management
// - API_ENDPOINTS.analyticsUser for user analytics
// - API_ENDPOINTS.analyticsOverview for dashboard data
// - API_ENDPOINTS.supplies for supplies management
// - API_ENDPOINTS.logsStats for error statistics

export interface FeatureData {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
  // Add feature-specific fields
}

export interface FeatureStats {
  total: number;
  active: number;
  pending: number;
  completed: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  trends: {
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ week: string; count: number }>;
    monthly: Array<{ month: string; count: number }>;
  };
  topItems: Array<{ id: string; name: string; count: number }>;
  categoryStats: Array<{ category: string; count: number }>;
  performanceMetrics: {
    average: number;
    median: number;
    p95: number;
  };
}

export async function fetchFeatureData(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ data: FeatureData[]; total: number; page: number; limit: number }> {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.search) queryParams.set('search', params.search);
  if (params.status) queryParams.set('status', params.status);
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

  // Use actual API routes from your existing admin features:
  // - /api/admin/users for user management
  // - /api/admin/errors for error monitoring
  // - /api/admin/dashboard for dashboard data
  // - /api/admin/users/stats for user statistics
  // - /api/admin/errors/stats for error statistics
  const response = await fetch(`/api/admin/feature?${queryParams}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch feature data');
  }

  const result = await response.json();
  
  // Ensure the response has the expected structure
  if (!result.data || !Array.isArray(result.data)) {
    throw new Error('Invalid response format from API');
  }
  
  return {
    data: result.data,
    total: result.total || result.data.length,
    page: result.page || params.page || 1,
    limit: result.limit || params.limit || 10
  };
}

export async function fetchFeatureStats(params: {
  period?: 'day' | 'week' | 'month' | 'year';
}): Promise<FeatureStats> {
  const queryParams = new URLSearchParams();
  
  if (params.period) queryParams.set('period', params.period);

  const response = await fetch(`/api/admin/feature/stats?${queryParams}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch feature statistics');
  }

  const result = await response.json();
  
  // Validate the response structure
  if (!result.success || !result.data) {
    throw new Error('Invalid response format from stats API');
  }
  
  // Ensure all required fields are present with defaults
  const stats = result.data;
  return {
    total: stats.total || 0,
    active: stats.active || 0,
    pending: stats.pending || 0,
    completed: stats.completed || 0,
    todayCount: stats.todayCount || 0,
    weekCount: stats.weekCount || 0,
    monthCount: stats.monthCount || 0,
    trends: {
      daily: stats.trends?.daily || [],
      weekly: stats.trends?.weekly || [],
      monthly: stats.trends?.monthly || []
    },
    topItems: stats.topItems || [],
    categoryStats: stats.categoryStats || [],
    performanceMetrics: {
      average: stats.performanceMetrics?.average || 0,
      median: stats.performanceMetrics?.median || 0,
      p95: stats.performanceMetrics?.p95 || 0
    }
  };
}

export async function createFeature(data: Partial<FeatureData>): Promise<FeatureData> {
  const response = await fetch('/api/admin/feature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create feature');
  }

  const result = await response.json();
  
  // Validate the response structure
  if (!result.id || !result.name) {
    throw new Error('Invalid response format from create API');
  }
  
  return result;
}

export async function updateFeature(id: string, data: Partial<FeatureData>): Promise<FeatureData> {
  const response = await fetch(`/api/admin/feature/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update feature');
  }

  const result = await response.json();
  
  // Validate the response structure
  if (!result.id || !result.name) {
    throw new Error('Invalid response format from update API');
  }
  
  return result;
}

export async function deleteFeature(id: string): Promise<void> {
  const response = await fetch(`/api/admin/feature/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete feature');
  }

  // Validate successful deletion
  const result = await response.json().catch(() => ({}));
  if (result.success === false) {
    throw new Error(result.error || 'Failed to delete feature');
  }
}
```

### 🧪 TESTING REQUIREMENTS

**Based on Existing Test Patterns:**
This prompt uses testing patterns from your actual implemented admin features:
- **Users API Tests**: `src/app/api/admin/__tests__/` - API route testing with authentication and authorization
- **Users Page Tests**: `src/app/admin/__tests__/users-page.test.tsx` - Component testing with API mocking
- **API Utils Tests**: `src/lib/__tests__/api-users.test.ts` - API service function testing

**Unit Tests:**
```tsx
// Create: src/lib/__tests__/[feature]-api.test.ts
import { 
  fetchFeatureData, 
  fetchFeatureStats, 
  createFeature, 
  updateFeature, 
  deleteFeature 
} from '../api-feature';

// Mock fetch
global.fetch = jest.fn();

describe('Feature API', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('fetchFeatureData', () => {
    it('should fetch feature data with correct parameters', async () => {
      const apiResponse = {
        data: [
          { id: '1', name: 'Test Feature', status: 'active', createdAt: '2024-01-01', updatedAt: '2024-01-01' }
        ],
        total: 1,
        page: 1,
        limit: 10
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiResponse)
      });

      const result = await fetchFeatureData({ page: 1, limit: 10 });

      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/feature?page=1&limit=10',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })
      );

      expect(result).toEqual(apiResponse);
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'API request failed' })
      });

      await expect(fetchFeatureData({})).rejects.toThrow('API request failed');
    });

    it('should handle invalid response format', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      });

      await expect(fetchFeatureData({})).rejects.toThrow('Invalid response format from API');
    });
  });

  describe('fetchFeatureStats', () => {
    it('should fetch feature statistics', async () => {
      const apiStatsResponse = {
        success: true,
        data: {
          total: 100,
          active: 80,
          pending: 15,
          completed: 5,
          todayCount: 10,
          weekCount: 50,
          monthCount: 100,
          trends: { daily: [], weekly: [], monthly: [] },
          topItems: [],
          categoryStats: [],
          performanceMetrics: { average: 10, median: 8, p95: 20 }
        }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiStatsResponse)
      });

      const result = await fetchFeatureStats({ period: 'week' });

      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/feature/stats?period=week',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })
      );

      expect(result).toEqual(apiStatsResponse.data);
    });

    it('should handle stats API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Stats API failed' })
      });

      await expect(fetchFeatureStats({})).rejects.toThrow('Stats API failed');
    });

    it('should handle invalid stats response format', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false })
      });

      await expect(fetchFeatureStats({})).rejects.toThrow('Invalid response format from stats API');
    });
  });

  describe('createFeature', () => {
    it('should create a new feature', async () => {
      const newFeature = { name: 'New Feature', status: 'active' as const };
      const apiResponse = { id: '1', ...newFeature, createdAt: '2024-01-01', updatedAt: '2024-01-01' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiResponse)
      });

      const result = await createFeature(newFeature);

      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/feature',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(newFeature)
        })
      );

      expect(result).toEqual(apiResponse);
    });

    it('should handle create API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Create failed' })
      });

      await expect(createFeature({ name: 'Test' })).rejects.toThrow('Create failed');
    });

    it('should handle invalid create response format', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' })
      });

      await expect(createFeature({ name: 'Test' })).rejects.toThrow('Invalid response format from create API');
    });
  });
});
```

**Component Tests:**
```tsx
// Create: src/app/admin/__tests__/[feature]-page.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import AdminFeaturePage from '../[feature]/page';
import * as apiFeature from '@/lib/api-feature';

// Mock the API functions
jest.mock('@/lib/api-feature');

describe('AdminFeaturePage', () => {
  const apiFeatureData = [
    { id: '1', name: 'Test Feature 1', status: 'active', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { id: '2', name: 'Test Feature 2', status: 'pending', createdAt: '2024-01-02', updatedAt: '2024-01-02' }
  ];

  const apiStatsResponse = {
    total: 2,
    active: 1,
    pending: 1,
    completed: 0,
    todayCount: 1,
    weekCount: 2,
    monthCount: 2,
    trends: { daily: [], weekly: [], monthly: [] },
    topItems: [],
    categoryStats: [],
    performanceMetrics: { average: 10, median: 8, p95: 20 }
  };

  beforeEach(() => {
    (apiFeature.fetchFeatureData as jest.Mock).mockResolvedValue({
      data: apiFeatureData,
      total: 2,
      page: 1,
      limit: 10
    });

    (apiFeature.fetchFeatureStats as jest.Mock).mockResolvedValue(apiStatsResponse);
  });

  it('should render the page header', async () => {
    render(<AdminFeaturePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Feature Management')).toBeInTheDocument();
      expect(screen.getByText('Manage feature items and settings')).toBeInTheDocument();
    });
  });

  it('should display stats cards', async () => {
    render(<AdminFeaturePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Items')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Active Items')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('should display feature data in table', async () => {
    render(<AdminFeaturePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Test Feature 2')).toBeInTheDocument();
    });
  });

  it('should handle refresh action', async () => {
    render(<AdminFeaturePage />);
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(apiFeature.fetchFeatureData).toHaveBeenCalledTimes(2);
      expect(apiFeature.fetchFeatureStats).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle API errors gracefully', async () => {
    (apiFeature.fetchFeatureData as jest.Mock).mockRejectedValue(new Error('API request failed'));
    
    render(<AdminFeaturePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('API request failed')).toBeInTheDocument();
    });
  });

  it('should handle API response validation errors', async () => {
    (apiFeature.fetchFeatureData as jest.Mock).mockRejectedValue(new Error('Invalid response format from API'));
    
    render(<AdminFeaturePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Invalid response format from API')).toBeInTheDocument();
    });
  });
});
```

**Integration Tests:**
```tsx
// Create: src/app/api/admin/__tests__/[feature]/route.test.ts
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock dependencies
jest.mock('@/lib/server-session');
jest.mock('@/lib/api-auth-utils');

describe('/api/admin/feature', () => {
  it('should return 401 for unauthorized requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/feature');
    const response = await GET(request);
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 for non-admin users', async () => {
    // Mock session with non-admin user
    const mockGetServerSession = require('@/lib/server-session').getServerSession;
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', role: 'client' }
    });

    const request = new NextRequest('http://localhost:3000/api/admin/feature');
    const response = await GET(request);
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Admin access required');
  });

  it('should return feature data for admin users', async () => {
    // Mock session with admin user
    const mockGetServerSession = require('@/lib/server-session').getServerSession;
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', role: 'admin' }
    });

    // Mock API response with real data structure
    const mockMakeAuthenticatedRequestWithPath = require('@/lib/api-auth-utils').makeAuthenticatedRequestWithPath;
    mockMakeAuthenticatedRequestWithPath.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        data: [
          { id: '1', name: 'Test Feature', status: 'active', createdAt: '2024-01-01', updatedAt: '2024-01-01' }
        ],
        total: 1,
        page: 1,
        limit: 10
      })
    });

    const request = new NextRequest('http://localhost:3000/api/admin/feature');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
    expect(data.data).toBeDefined();
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should handle external API errors', async () => {
    const mockGetServerSession = require('@/lib/server-session').getServerSession;
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', role: 'admin' }
    });

    const mockMakeAuthenticatedRequestWithPath = require('@/lib/api-auth-utils').makeAuthenticatedRequestWithPath;
    mockMakeAuthenticatedRequestWithPath.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'External API error' })
    });

    const request = new NextRequest('http://localhost:3000/api/admin/feature');
    const response = await GET(request);
    
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('External API error');
  });
});
```

### 🔧 LINTING AND CODE QUALITY

**Pre-Test Linting Requirements:**
Before running any tests, ensure all code passes linting checks:

```bash
# Run ESLint to check for code quality issues
npm run lint

# Auto-fix any fixable linting issues
npm run lint:fix

# Check TypeScript compilation
npm run type-check
```

**Common Linting Issues to Fix:**
- Unused imports and variables
- Missing return types on functions
- Inconsistent code formatting
- Missing error handling in try-catch blocks
- Unused parameters in functions
- Missing JSDoc comments for public functions
- Inconsistent quote usage (single vs double quotes)
- Missing semicolons
- Unreachable code after return statements

**Linting Configuration:**
Ensure your code follows the project's ESLint configuration:
- Use consistent indentation (2 spaces)
- Prefer const/let over var
- Use arrow functions for callbacks
- Implement proper error boundaries
- Use TypeScript strict mode
- Follow React hooks rules
- Implement proper prop validation

**Pre-Commit Checklist:**
- [ ] All linting errors resolved
- [ ] TypeScript compilation successful
- [ ] No console.log statements in production code
- [ ] All imports are used
- [ ] Proper error handling implemented
- [ ] Code follows project style guidelines

### 🔍 REAL API DATA HANDLING

**Data Validation and Error Handling:**
```tsx
// Add to your feature page component
const validateApiResponse = (response: any, expectedFields: string[]) => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid API response format');
  }
  
  for (const field of expectedFields) {
    if (!(field in response)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  return true;
};

// Usage in fetchData function
const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);

    const [dataResponse, statsResponse] = await Promise.all([
      apiFeature.fetchFeatureData({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sortBy,
        sortOrder
      }),
      apiFeature.fetchFeatureStats({ period: 'week' })
    ]);

    // Validate API responses
    validateApiResponse(dataResponse, ['data', 'total']);
    validateApiResponse(statsResponse, ['total', 'active', 'pending']);

    setData(dataResponse.data);
    setTotalCount(dataResponse.total);
    setStats(statsResponse);
    setLastUpdated(new Date());
  } catch (err) {
    console.error('Error fetching feature data:', err);
    setError(err instanceof Error ? err.message : 'Failed to load feature data');
  } finally {
    setLoading(false);
  }
}, [currentPage, itemsPerPage, searchTerm, statusFilter, sortBy, sortOrder]);
```

**API Response Type Safety:**
```tsx
// Add response validation types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
}

// Update your API functions to handle real responses
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (result.success === false) {
    throw new Error(result.error || 'API request failed');
  }
  
  return result.data || result;
};
```

### 🎯 COMPLETE FEATURE IMPLEMENTATION

**Main Feature Page:**
```tsx
// Create: src/app/admin/[feature]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  RefreshCw, 
  Filter, 
  Download, 
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import * as apiFeature from "@/lib/api-feature";
import type { FeatureData, FeatureStats } from "@/lib/api-feature";

export default function AdminFeaturePage() {
      const [data, setData] = useState<FeatureData[]>([]);
      const [stats, setStats] = useState<FeatureStats | null>(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [refreshing, setRefreshing] = useState(false);
      const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
      const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [dataResponse, statsResponse] = await Promise.all([
        apiFeature.fetchFeatureData({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          sortBy,
          sortOrder
        }),
        apiFeature.fetchFeatureStats({ period: 'week' })
      ]);

      setData(dataResponse.data);
      setTotalCount(dataResponse.total);
      setStats(statsResponse);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching feature data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feature data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh feature data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSort = (field: 'name' | 'status' | 'createdAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading feature data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Feature Management
          </h1>
          <p className="text-gray-600 text-sm">Manage feature items and settings</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Items</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.total.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.todayCount} today
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0 ml-4">
                <div className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Active Items</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.active.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Currently active
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg flex-shrink-0 ml-4">
                <div className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Pending Items</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.pending.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Awaiting approval
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0 ml-4">
                <div className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Completed</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.completed.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  This period
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0 ml-4">
                <div className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white rounded shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="w-3 h-3 mr-1" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Download className="w-3 h-3 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search items..."
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="text-xs text-gray-500">
                {totalCount} items found
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Feature Items</h3>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">Sort:</span>
              <button
                onClick={() => handleSort('name')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'name' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Name
                {sortBy === 'name' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('status')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'status' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Status
                {sortBy === 'status' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('createdAt')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'createdAt' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Date
                {sortBy === 'createdAt' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-3 h-3" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Edit className="w-3 h-3" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No items found</h3>
            <p className="text-xs text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters or search criteria.' 
                : 'No feature items have been created yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 🚀 DEPLOYMENT CHECKLIST

**Based on Existing Admin Features:**
This checklist is based on the actual deployment patterns from your implemented admin features:
- **Users Management**: Successfully deployed with full CRUD operations
- **Error Monitoring**: Successfully deployed with statistics and resolution tracking
- **Dashboard Analytics**: Successfully deployed with multiple data sources
- **User Statistics**: Successfully deployed with analytics and metrics

- [ ] **Linting and Code Quality**
  - [ ] All ESLint errors resolved
  - [ ] TypeScript compilation successful
  - [ ] Code follows project style guidelines
  - [ ] No console.log statements in production code
- [ ] **API Integration**
  - [ ] API endpoints created and tested using existing patterns
  - [ ] Error handling implemented following established patterns
  - [ ] Authentication and authorization verified using existing auth flow
- [ ] **Frontend Implementation**
  - [ ] Frontend components implemented with proper styling matching existing admin pages
  - [ ] Loading states implemented using existing Loading component
  - [ ] Responsive design verified following existing admin layout patterns
  - [ ] Accessibility features tested using existing admin accessibility patterns
- [ ] **Testing**
  - [ ] Unit tests written and passing following existing test patterns
  - [ ] Integration tests written and passing using existing API test patterns
  - [ ] All tests pass after linting fixes
- [ ] **Quality Assurance**
  - [ ] Performance optimized following existing admin performance patterns
  - [ ] Documentation updated following existing admin documentation patterns
  - [ ] Code review completed using existing admin code review standards

### 📚 REQUIRED IMPORTS

```tsx
import { 
  RefreshCw, 
  Filter, 
  Download, 
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import * as apiFeature from "@/lib/api-feature";
import type { FeatureData, FeatureStats } from "@/lib/api-feature";
```

This enhanced prompt ensures that every new admin feature will have:
1. **Consistent styling** matching your existing admin pages (users, errors, dashboard)
2. **Proper API integration** using your actual API endpoints and patterns
3. **Comprehensive testing** following your existing test patterns
4. **Production-ready code** with proper TypeScript types and error handling
5. **Accessibility features** and responsive design matching existing admin pages
6. **Performance optimization** and loading states using your existing components

**Key Implementation Notes:**
- Use actual API endpoints from your `API_ENDPOINTS` configuration
- Follow the established patterns from `src/app/api/admin/users/` and `src/app/api/admin/errors/`
- Match the styling and component patterns from `src/app/admin/users/page.tsx` and `src/app/admin/errors/page.tsx`
- Use the existing `Loading` component from `src/components/ui/loading.tsx`
- Follow the authentication patterns from `src/lib/server-session.ts` and `src/lib/api-auth-utils.ts`
- Implement testing following the patterns in `src/app/admin/__tests__/` and `src/lib/__tests__/`

Remember: Your existing admin features are the gold standard. Match their patterns exactly for consistency across all admin pages.
```

---

## 🎯 How to Use This Enhanced Prompt

1. **Copy the entire enhanced prompt** from the file above
2. **Paste it when starting** any new admin feature
3. **Follow all patterns exactly** as specified
4. **Implement the API integration** as shown
5. **Fix all linting issues** before proceeding to tests
6. **Write the tests** following the provided examples
7. **Use the deployment checklist** to ensure completeness

## 📚 Additional Resources

- **Base Style Guide**: `ADMIN_STYLE_GUIDE.md`
- **Component Patterns**: `ADMIN_COMPONENT_PATTERNS.md`
- **Implementation Guide**: `ADMIN_IMPLEMENTATION_GUIDE.md`
- **Base Implementation Prompt**: `ADMIN_FEATURE_IMPLEMENTATION_PROMPT.md`
- **Reference Page**: `src/app/admin/audit/page.tsx`

This enhanced prompt ensures that every new admin feature will have consistent styling, proper API integration, comprehensive testing, and production-ready code that matches the established patterns from the audit page.
