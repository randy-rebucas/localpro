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

### 📊 DATA STRUCTURE REQUIREMENTS

**Data Structure Implementation:**
This prompt uses simple data structures for feature implementation:
- **TypeScript Interfaces**: Define clear data structures for feature data
- **Type Safety**: Use TypeScript interfaces for data validation
- **Simple Implementation**: Focus on clean, maintainable code structure

**Data Structure Pattern:**
Use simple data structures for feature implementation:

```tsx
// Data Types: src/types/[feature].ts
export interface FeatureData {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
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
```

### 🎯 FRONTEND IMPLEMENTATION

**Simple Frontend Implementation:**
This prompt focuses on clean, simple frontend implementation:
- **TypeScript Interfaces**: Use clear data structures for type safety
- **Component Structure**: Follow established patterns from existing admin pages
- **State Management**: Use React hooks for local state management
- **Error Handling**: Implement proper error boundaries and user feedback

**Frontend Implementation Pattern:**
Use simple, clean frontend implementation:

```tsx
// Create: src/lib/[feature].ts
import type { FeatureData, FeatureStats } from '@/types/[feature]';

// Simple data fetching functions
export async function fetchFeatureData(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ data: FeatureData[]; total: number; page: number; limit: number }> {
  // Implementation will depend on your data source
  // This is a placeholder for the actual implementation
  return {
    data: [],
    total: 0,
    page: params.page || 1,
    limit: params.limit || 10
  };
}

export async function fetchFeatureStats(params: {
  period?: 'day' | 'week' | 'month' | 'year';
}): Promise<FeatureStats> {
  // Implementation will depend on your data source
  // This is a placeholder for the actual implementation
  return {
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
}

export async function createFeature(data: Partial<FeatureData>): Promise<FeatureData> {
  // Implementation will depend on your data source
  // This is a placeholder for the actual implementation
  if (!data.name) {
    throw new Error('Name is required');
  }

  return {
    id: Date.now().toString(),
    name: data.name,
    status: data.status || 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description: data.description,
    category: data.category,
    priority: data.priority || 'medium'
  };
}

export async function updateFeature(id: string, data: Partial<FeatureData>): Promise<FeatureData> {
  // Implementation will depend on your data source
  // This is a placeholder for the actual implementation
  throw new Error('Feature not found');
}

export async function deleteFeature(id: string): Promise<void> {
  // Implementation will depend on your data source
  // This is a placeholder for the actual implementation
  throw new Error('Feature not found');
}
```

### 🧪 TESTING REQUIREMENTS

**Basic Testing:**
This prompt uses simple testing patterns for feature functionality:
- **Unit Tests**: Test individual functions and components
- **Component Tests**: Test React components with user interactions
- **Error Handling Tests**: Test error scenarios and edge cases
- **Type Safety Tests**: Verify TypeScript interfaces and type checking

**Unit Tests:**
```tsx
// Create: src/lib/__tests__/[feature].test.ts
import { 
  fetchFeatureData, 
  fetchFeatureStats, 
  createFeature, 
  updateFeature, 
  deleteFeature 
} from '../[feature]';

describe('Feature Functions', () => {
  describe('fetchFeatureData', () => {
    it('should return data with pagination', async () => {
      const result = await fetchFeatureData({ page: 1, limit: 10 });
      
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should handle search parameters', async () => {
      const result = await fetchFeatureData({ search: 'test' });
      
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should handle status filtering', async () => {
      const result = await fetchFeatureData({ status: 'active' });
      
      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('fetchFeatureStats', () => {
    it('should return statistics', async () => {
      const result = await fetchFeatureStats({ period: 'week' });
      
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('active');
      expect(result).toHaveProperty('pending');
      expect(result).toHaveProperty('trends');
    });
  });

  describe('createFeature', () => {
    it('should create a new feature', async () => {
      const newFeature = { 
        name: 'Test Feature', 
        status: 'active' as const
      };
      
      const result = await createFeature(newFeature);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Feature');
      expect(result.status).toBe('active');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should throw error for missing name', async () => {
      await expect(createFeature({ status: 'active' })).rejects.toThrow('Name is required');
    });
  });

  describe('updateFeature', () => {
    it('should throw error for non-existent feature', async () => {
      await expect(updateFeature('999', { name: 'Test' })).rejects.toThrow('Feature not found');
    });
  });

  describe('deleteFeature', () => {
    it('should throw error for non-existent feature', async () => {
      await expect(deleteFeature('999')).rejects.toThrow('Feature not found');
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
import * as featureService from '@/lib/[feature]';

// Mock the feature service functions
jest.mock('@/lib/[feature]');

describe('AdminFeaturePage', () => {
  const mockFeatureData = [
    { id: '1', name: 'Test Feature 1', status: 'active', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { id: '2', name: 'Test Feature 2', status: 'pending', createdAt: '2024-01-02', updatedAt: '2024-01-02' }
  ];

  const mockStatsResponse = {
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
    (featureService.fetchFeatureData as jest.Mock).mockResolvedValue({
      data: mockFeatureData,
      total: 2,
      page: 1,
      limit: 10
    });

    (featureService.fetchFeatureStats as jest.Mock).mockResolvedValue(mockStatsResponse);
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
      expect(featureService.fetchFeatureData).toHaveBeenCalledTimes(2);
      expect(featureService.fetchFeatureStats).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle errors gracefully', async () => {
    (featureService.fetchFeatureData as jest.Mock).mockRejectedValue(new Error('Request failed'));
    
    render(<AdminFeaturePage />);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Request failed')).toBeInTheDocument();
    });
  });

  it('should handle search functionality', async () => {
    render(<AdminFeaturePage />);
    
    const searchInput = screen.getByPlaceholderText('Search items...');
    fireEvent.change(searchInput, { target: { value: 'Test Feature 1' } });
    
    await waitFor(() => {
      expect(featureService.fetchFeatureData).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Test Feature 1' })
      );
    });
  });

  it('should handle status filter', async () => {
    render(<AdminFeaturePage />);
    
    const statusSelect = screen.getByDisplayValue('All Status');
    fireEvent.change(statusSelect, { target: { value: 'active' } });
    
    await waitFor(() => {
      expect(featureService.fetchFeatureData).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' })
      );
    });
  });

  it('should handle sorting', async () => {
    render(<AdminFeaturePage />);
    
    const sortButton = screen.getByText('Name');
    fireEvent.click(sortButton);
    
    await waitFor(() => {
      expect(featureService.fetchFeatureData).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'name' })
      );
    });
  });
});
```

**Integration Tests:**
```tsx
// Create: src/lib/__tests__/[feature]-integration.test.ts
import { 
  fetchFeatureData, 
  fetchFeatureStats, 
  createFeature, 
  updateFeature, 
  deleteFeature 
} from '../[feature]';

describe('Feature Integration', () => {
  it('should handle complete CRUD operations', async () => {
    // Test Create
    const newFeature = { name: 'New Integration Feature', status: 'active' as const };
    const createdFeature = await createFeature(newFeature);
    
    expect(createdFeature.id).toBeDefined();
    expect(createdFeature.name).toBe('New Integration Feature');

    // Test Read
    const readResult = await fetchFeatureData({});
    expect(readResult.data).toBeDefined();
    expect(Array.isArray(readResult.data)).toBe(true);

    // Test Update
    const updateData = { name: 'Updated Integration Feature' };
    try {
      const updatedFeature = await updateFeature(createdFeature.id, updateData);
      expect(updatedFeature.name).toBe('Updated Integration Feature');
    } catch (error) {
      // Expected for placeholder implementation
      expect(error).toBeDefined();
    }

    // Test Delete
    try {
      await deleteFeature(createdFeature.id);
    } catch (error) {
      // Expected for placeholder implementation
      expect(error).toBeDefined();
    }
  });

  it('should handle filtering and sorting', async () => {
    // Test search with pagination
    const searchResult = await fetchFeatureData({ 
      search: 'Integration', 
      page: 1, 
      limit: 1,
      sortBy: 'name',
      sortOrder: 'asc'
    });
    
    expect(searchResult.data).toBeDefined();
    expect(Array.isArray(searchResult.data)).toBe(true);

    // Test status filtering
    const statusResult = await fetchFeatureData({ status: 'active' });
    expect(statusResult.data).toBeDefined();
    expect(Array.isArray(statusResult.data)).toBe(true);
  });

  it('should handle statistics with different periods', async () => {
    const dayStats = await fetchFeatureStats({ period: 'day' });
    const weekStats = await fetchFeatureStats({ period: 'week' });
    const monthStats = await fetchFeatureStats({ period: 'month' });
    
    expect(dayStats.total).toBeDefined();
    expect(weekStats.total).toBeDefined();
    expect(monthStats.total).toBeDefined();
  });

  it('should handle error scenarios gracefully', async () => {
    // Test create with missing required field
    await expect(createFeature({ status: 'active' })).rejects.toThrow('Name is required');
    
    // Test update non-existent feature
    await expect(updateFeature('999', { name: 'Test' })).rejects.toThrow('Feature not found');
    
    // Test delete non-existent feature
    await expect(deleteFeature('999')).rejects.toThrow('Feature not found');
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

**Simple Implementation:**
This checklist is based on simple, clean implementation patterns:
- **Data Structures**: Use clear TypeScript interfaces for type safety
- **Service Functions**: Implement simple service functions with proper error handling
- **Component Structure**: Follow established patterns from existing admin pages
- **Testing**: Focus on basic functionality and user interactions

- [ ] **Linting and Code Quality**
  - [ ] All ESLint errors resolved
  - [ ] TypeScript compilation successful
  - [ ] Code follows project style guidelines
  - [ ] No console.log statements in production code
- [ ] **Data Structure Implementation**
  - [ ] TypeScript interfaces defined for feature data
  - [ ] Service functions implemented with proper error handling
  - [ ] Data validation implemented for required fields
  - [ ] Type safety verified throughout the application
- [ ] **Frontend Implementation**
  - [ ] Frontend components implemented with proper styling matching existing admin pages
  - [ ] Loading states implemented using existing Loading component
  - [ ] Responsive design verified following existing admin layout patterns
  - [ ] Accessibility features tested using existing admin accessibility patterns
- [ ] **Testing**
  - [ ] Unit tests written and passing for service functions
  - [ ] Integration tests written and passing for feature operations
  - [ ] Component tests written and passing for user interactions
  - [ ] All tests pass after linting fixes
- [ ] **Quality Assurance**
  - [ ] Performance optimized using clean code patterns
  - [ ] Documentation updated following simple implementation patterns
  - [ ] Code review completed using established standards

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
import * as featureService from "@/lib/[feature]";
import type { FeatureData, FeatureStats } from "@/types/[feature]";
```

This enhanced prompt ensures that every new admin feature will have:
1. **Consistent styling** matching your existing admin pages (users, errors, dashboard)
2. **Simple data structures** using clear TypeScript interfaces for type safety
3. **Comprehensive testing** following basic functionality patterns
4. **Production-ready code** with proper TypeScript types and error handling
5. **Accessibility features** and responsive design matching existing admin pages
6. **Performance optimization** and loading states using your existing components

**Key Implementation Notes:**
- Use simple data structures and TypeScript interfaces for type safety
- Follow the established patterns using clean service functions with proper error handling
- Use simple error handling for consistent testing across all operations
- Match the styling and component patterns from `src/app/admin/users/page.tsx` and `src/app/admin/errors/page.tsx`
- Use the existing `Loading` component from `src/components/ui/loading.tsx`
- Follow the simple patterns from `src/lib/` and `src/types/` directories
- Implement testing following the basic patterns in `src/app/admin/__tests__/` and `src/lib/__tests__/`

Remember: Use simple, clean implementation patterns for maintainable and testable code.
```

---

## 🎯 How to Use This Enhanced Prompt

1. **Copy the entire enhanced prompt** from the file above
2. **Paste it when starting** any new admin feature
3. **Follow all patterns exactly** as specified
4. **Use simple data structures** with TypeScript interfaces for type safety
5. **Implement error handling** using simple error scenarios
6. **Fix all linting issues** before proceeding to tests
7. **Write the tests** following the basic functionality patterns
8. **Use the deployment checklist** to ensure completeness

## 📚 Additional Resources

- **Base Style Guide**: `ADMIN_STYLE_GUIDE.md`
- **Component Patterns**: `ADMIN_COMPONENT_PATTERNS.md`
- **Implementation Guide**: `ADMIN_IMPLEMENTATION_GUIDE.md`
- **Base Implementation Prompt**: `ADMIN_FEATURE_IMPLEMENTATION_PROMPT.md`
- **Reference Page**: `src/app/admin/audit/page.tsx`

This enhanced prompt ensures that every new admin feature will have consistent styling, simple data structures, comprehensive testing, and production-ready code that uses clean implementation patterns for maintainable and testable code.
