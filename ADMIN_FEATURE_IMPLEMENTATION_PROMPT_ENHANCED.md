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

**API Endpoint Structure:**
Create API endpoints following the established patterns:

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
    const queryParams = Object.fromEntries(searchParams.entries());

    // Add feature-specific parameters
    const featureParams = {
      ...queryParams,
      type: 'admin_feature',
      includeStats: 'true',
      includeAnalytics: 'true'
    };

    const response = await makeAuthenticatedRequestWithPath(
      request,
      'analyticsCustom', // or appropriate endpoint
      [],
      featureParams,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch feature data" },
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
```

**Stats API Route:**
```tsx
// API Route: src/app/api/admin/[feature]/stats/route.ts
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

    // Mock data structure - replace with real data
    const stats = {
      total: 0,
      active: 0,
      pending: 0,
      completed: 0,
      todayCount: 0,
      weekCount: 0,
      monthCount: 0,
      trends: {
        daily: [],
        weekly: [],
        monthly: []
      },
      topItems: [],
      categoryStats: [],
      performanceMetrics: {
        average: 0,
        median: 0,
        p95: 0
      }
    };

    return NextResponse.json({ 
      success: true,
      data: stats 
    });

  } catch (error) {
    console.error('Error fetching feature statistics:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
```

### 🎯 FRONTEND API INTEGRATION

**API Service Functions:**
```tsx
// Create: src/lib/api-[feature].ts
import { API_ENDPOINTS } from './api';

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

  const response = await fetch(`/api/admin/feature?${queryParams}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch feature data');
  }

  return response.json();
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
  return result.data;
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

  return response.json();
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

  return response.json();
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
}
```

### 🧪 TESTING REQUIREMENTS

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
      const mockData = {
        data: [
          { id: '1', name: 'Test Feature', status: 'active', createdAt: '2024-01-01', updatedAt: '2024-01-01' }
        ],
        total: 1,
        page: 1,
        limit: 10
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData)
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

      expect(result).toEqual(mockData);
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Test error' })
      });

      await expect(fetchFeatureData({})).rejects.toThrow('Test error');
    });
  });

  describe('fetchFeatureStats', () => {
    it('should fetch feature statistics', async () => {
      const mockStats = {
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
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockStats })
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

      expect(result).toEqual(mockStats);
    });
  });

  describe('createFeature', () => {
    it('should create a new feature', async () => {
      const newFeature = { name: 'New Feature', status: 'active' as const };
      const createdFeature = { id: '1', ...newFeature, createdAt: '2024-01-01', updatedAt: '2024-01-01' };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createdFeature)
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

      expect(result).toEqual(createdFeature);
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
  const mockFeatureData = [
    { id: '1', name: 'Test Feature 1', status: 'active', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { id: '2', name: 'Test Feature 2', status: 'pending', createdAt: '2024-01-02', updatedAt: '2024-01-02' }
  ];

  const mockStats = {
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
      data: mockFeatureData,
      total: 2,
      page: 1,
      limit: 10
    });

    (apiFeature.fetchFeatureStats as jest.Mock).mockResolvedValue(mockStats);
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
    (apiFeature.fetchFeatureData as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<AdminFeaturePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
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

    // Mock API response
    const mockMakeAuthenticatedRequestWithPath = require('@/lib/api-auth-utils').makeAuthenticatedRequestWithPath;
    mockMakeAuthenticatedRequestWithPath.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] })
    });

    const request = new NextRequest('http://localhost:3000/api/admin/feature');
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
  });
});
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
                {data.length} items found
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

        {data.length === 0 && (
          <div className="text-center py-8">
            <div className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No items found</h3>
            <p className="text-xs text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 🚀 DEPLOYMENT CHECKLIST

- [ ] API endpoints created and tested
- [ ] Frontend components implemented with proper styling
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Responsive design verified
- [ ] Accessibility features tested
- [ ] Performance optimized
- [ ] Documentation updated

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
1. **Consistent styling** matching the audit page
2. **Proper API integration** with error handling
3. **Comprehensive testing** at all levels
4. **Production-ready code** with proper TypeScript types
5. **Accessibility features** and responsive design
6. **Performance optimization** and loading states

Remember: The audit page (`src/app/admin/audit/page.tsx`) is the gold standard. Match its styling patterns exactly for consistency across all admin pages.
```

---

## 🎯 How to Use This Enhanced Prompt

1. **Copy the entire enhanced prompt** from the file above
2. **Paste it when starting** any new admin feature
3. **Follow all patterns exactly** as specified
4. **Implement the API integration** as shown
5. **Write the tests** following the provided examples
6. **Use the deployment checklist** to ensure completeness

## 📚 Additional Resources

- **Base Style Guide**: `ADMIN_STYLE_GUIDE.md`
- **Component Patterns**: `ADMIN_COMPONENT_PATTERNS.md`
- **Implementation Guide**: `ADMIN_IMPLEMENTATION_GUIDE.md`
- **Base Implementation Prompt**: `ADMIN_FEATURE_IMPLEMENTATION_PROMPT.md`
- **Reference Page**: `src/app/admin/audit/page.tsx`

This enhanced prompt ensures that every new admin feature will have consistent styling, proper API integration, comprehensive testing, and production-ready code that matches the established patterns from the audit page.
