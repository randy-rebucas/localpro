# Hooks Migration Guide: From fetch + useEffect to SWR

This guide shows how to migrate existing hooks from `fetch + useEffect` patterns to SWR.

## Migration Pattern

### Before (fetch + useEffect)

```typescript
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

export function useMyData(params: MyParams = {}) {
  const [data, setData] = useState<MyType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.filter) queryParams.append("filter", params.filter);
      queryParams.append("page", (params.page || 1).toString());

      const url = `${API_BASE_URL}${API_ENDPOINTS.myEndpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const responseData = await response.json();
      const myData = responseData?.data || responseData || [];

      if (mountedRef.current) {
        setData(myData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching data", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setData([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
```

### After (SWR)

```typescript
"use client";

import useSWR from "swr";
import { API_ENDPOINTS } from "@/lib/api";
import { createSWRKey, swrFetcher } from "@/lib/swr-config";

export function useMyData(params: MyParams = {}) {
  const swrKey = createSWRKey(API_ENDPOINTS.myEndpoint, {
    filter: params.filter,
    page: params.page || 1,
  });

  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    data?: MyType[];
  } | MyType[]>(
    swrKey,
    swrFetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  // Normalize response data
  const myData = Array.isArray(data) 
    ? data 
    : (data as { data?: MyType[] })?.data || [];

  return {
    data: myData,
    loading: isLoading,
    isValidating,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch: mutate,
  };
}
```

## Key Changes

### 1. Remove Manual State Management

**Before:**
- `useState` for data, loading, error
- `useRef` for mounted tracking
- Manual loading/error state management

**After:**
- SWR handles all state automatically
- No need for mounted refs
- Loading and error states come from SWR

### 2. Replace fetch with SWR

**Before:**
```typescript
const response = await fetch(url, createAuthFetchOptions());
const data = await response.json();
```

**After:**
```typescript
const { data, error, isLoading } = useSWR(swrKey, swrFetcher);
```

### 3. Use createSWRKey for Query Parameters

**Before:**
```typescript
const queryParams = new URLSearchParams();
if (params.filter) queryParams.append("filter", params.filter);
const url = `${API_BASE_URL}${API_ENDPOINTS.endpoint}?${queryParams.toString()}`;
```

**After:**
```typescript
const swrKey = createSWRKey(API_ENDPOINTS.endpoint, {
  filter: params.filter,
});
```

### 4. Remove useEffect

**Before:**
```typescript
useEffect(() => {
  fetchData();
}, [fetchData]);
```

**After:**
- No useEffect needed! SWR automatically fetches when the key changes

### 5. Handle Conditional Fetching

**Before:**
```typescript
const fetchData = useCallback(async () => {
  if (!id) return;
  // fetch...
}, [id]);
```

**After:**
```typescript
const swrKey = id ? `${API_ENDPOINTS.endpoint}/${id}` : null;
// SWR won't fetch if key is null
```

## Common Patterns

### Pattern 1: List with Pagination

```typescript
export function useItems(params: { page?: number; limit?: number } = {}) {
  const swrKey = createSWRKey(API_ENDPOINTS.items, {
    page: params.page || 1,
    limit: params.limit || 10,
  });

  const { data, error, isLoading, mutate } = useSWR(swrKey, swrFetcher, {
    keepPreviousData: true, // Keep previous page data while loading next
    revalidateOnFocus: false,
  });

  return {
    items: data?.data || data?.items || [],
    pagination: data?.pagination,
    loading: isLoading,
    error: error?.message,
    refetch: mutate,
  };
}
```

### Pattern 2: Single Item

```typescript
export function useItem(id: string | null) {
  const swrKey = id ? `${API_ENDPOINTS.items}/${id}` : null;

  const { data, error, isLoading, mutate } = useSWR(swrKey, swrFetcher, {
    revalidateOnFocus: false, // Don't revalidate single items on focus
  });

  return {
    item: data?.data || data?.item || data || null,
    loading: isLoading,
    error: error?.message,
    refetch: mutate,
  };
}
```

### Pattern 3: Real-time Data (Polling)

```typescript
export function useRealtimeData() {
  const { data, error, isLoading, mutate } = useSWR(
    API_ENDPOINTS.realtime,
    swrFetcher,
    {
      refreshInterval: 30000, // Poll every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    data: data?.data || data,
    loading: isLoading,
    error: error?.message,
    refetch: mutate,
  };
}
```

### Pattern 4: Dashboard/Analytics (Auto-refresh)

```typescript
export function useDashboard(params: DashboardParams = {}) {
  const swrKey = createSWRKey(API_ENDPOINTS.dashboard, {
    timeframe: params.timeframe,
  });

  const { data, error, isLoading, mutate } = useSWR(swrKey, swrFetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true,
  });

  return {
    dashboard: data?.data || data,
    loading: isLoading,
    error: error?.message,
    refetch: mutate,
  };
}
```

### Pattern 5: Public Endpoint (No Auth)

```typescript
export function usePublicData() {
  const { data, error, isLoading } = useSWR(
    API_ENDPOINTS.publicEndpoint,
    (url) => swrFetcher(url, { skipAuth: true }),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    data: data?.data || data,
    loading: isLoading,
    error: error?.message,
  };
}
```

## Response Normalization

Different APIs return data in different formats. Handle this in the hook:

```typescript
// Handle multiple response formats
const items = Array.isArray(data)
  ? data
  : (data as { data?: Item[] })?.data
  || (data as { items?: Item[] })?.items
  || (data as { results?: Item[] })?.results
  || [];
```

## Error Handling

SWR provides error objects. Convert to string for backward compatibility:

```typescript
error: error ? (error instanceof Error ? error.message : String(error)) : null
```

## Mutations

For mutations (POST, PUT, DELETE), use the `mutate` function:

```typescript
const handleCreate = async (newItem: ItemData) => {
  try {
    await fetch(API_ENDPOINTS.items, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    mutate(); // Revalidate the list
  } catch (error) {
    // Handle error
  }
};
```

## Benefits of Migration

1. **Less Code**: No manual state management, useEffect, or mounted refs
2. **Automatic Caching**: SWR caches responses automatically
3. **Request Deduplication**: Multiple components requesting same data = one request
4. **Revalidation**: Automatic revalidation on focus, reconnect, or interval
5. **Error Retry**: Built-in retry logic
6. **Type Safety**: Better TypeScript support

## Migration Checklist

- [ ] Replace imports: Remove `useState`, `useEffect`, `useCallback`, `useRef`
- [ ] Add SWR imports: `import useSWR from "swr"`
- [ ] Replace fetch logic with `useSWR` hook
- [ ] Use `createSWRKey` for query parameters
- [ ] Remove `useEffect` for data fetching
- [ ] Normalize response data
- [ ] Update return values to match SWR API
- [ ] Test the hook in components
- [ ] Remove unused imports and code

## Examples of Migrated Hooks

See these files for complete examples:
- `src/features/supplies/hooks/useSupplies.ts` - List, single item, and orders
- `src/features/analytics/hooks/useDashboardAnalytics.ts` - Dashboard, realtime, time series

## Next Steps

1. Identify hooks that use `fetch + useEffect`
2. Follow the migration pattern above
3. Test thoroughly
4. Update components using the hooks if needed

