# SWR Migration Guide

This document outlines the migration from TanStack Query to SWR for data fetching in the LocalPro application.

## Overview

**SWR** (stale-while-revalidate) is now the preferred data fetching library instead of TanStack Query. SWR provides:
- Automatic revalidation
- Request deduplication
- Built-in caching
- Focus revalidation
- Simpler API than TanStack Query

## Configuration

SWR is configured globally in `src/lib/swr-config.ts` and provided via `SWRProvider` in the root layout.

### Key Features

1. **Authentication-aware fetcher**: Automatically includes auth tokens
2. **Error handling**: Automatic retry with configurable options
3. **Revalidation**: Automatic revalidation on focus, reconnect, and mount
4. **Request deduplication**: Multiple requests to the same endpoint are deduplicated

## Usage Examples

### Basic Data Fetching

```tsx
import useSWR from 'swr';
import { API_ENDPOINTS } from '@/lib/api';
import { swrFetcher } from '@/lib/swr-config';

function MyComponent() {
  const { data, error, isLoading } = useSWR(
    API_ENDPOINTS.supplies,
    swrFetcher
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* Render data */}</div>;
}
```

### With Query Parameters

```tsx
import useSWR from 'swr';
import { createSWRKey, swrFetcher } from '@/lib/swr-config';
import { API_ENDPOINTS } from '@/lib/api';

function SuppliesList() {
  const key = createSWRKey(API_ENDPOINTS.supplies, {
    page: 1,
    limit: 20,
    category: 'tools',
  });

  const { data, error, isLoading } = useSWR(key, swrFetcher);

  // ...
}
```

### Conditional Fetching

```tsx
function UserProfile({ userId }: { userId: string | null }) {
  const key = userId ? `${API_ENDPOINTS.authProfile}?userId=${userId}` : null;

  const { data, error, isLoading } = useSWR(key, swrFetcher);

  // SWR won't fetch if key is null
  // ...
}
```

### Mutations

SWR doesn't have built-in mutations like TanStack Query. Use the `mutate` function to revalidate:

```tsx
function CreateSupplyForm() {
  const { mutate } = useSWR(API_ENDPOINTS.supplies, swrFetcher);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: SupplyData) => {
    setIsSubmitting(true);
    try {
      await fetch(API_ENDPOINTS.supplies, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      // Revalidate the supplies list
      mutate();
    } finally {
      setIsSubmitting(false);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Public Endpoints (No Auth)

```tsx
const { data, error, isLoading } = useSWR(
  API_ENDPOINTS.marketplaceServicesCategories,
  (url) => swrFetcher(url, { skipAuth: true })
);
```

## Migration from TanStack Query

### Before (TanStack Query)

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function MyComponent() {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['supplies'],
    queryFn: () => fetch('/api/supplies').then(r => r.json()),
  });

  const mutation = useMutation({
    mutationFn: (data) => fetch('/api/supplies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
    },
  });

  // ...
}
```

### After (SWR)

```tsx
import useSWR from 'swr';
import { API_ENDPOINTS } from '@/lib/api';
import { swrFetcher } from '@/lib/swr-config';

function MyComponent() {
  const { data, error, isLoading, mutate } = useSWR(
    API_ENDPOINTS.supplies,
    swrFetcher
  );

  const handleCreate = async (supplyData: SupplyData) => {
    await fetch(API_ENDPOINTS.supplies, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplyData),
    });
    mutate(); // Revalidate
  };

  // ...
}
```

## Key Differences

| Feature | TanStack Query | SWR |
|---------|---------------|-----|
| Mutations | Built-in `useMutation` | Manual with `mutate()` |
| Query Keys | Array-based keys | String-based keys |
| Cache Management | `queryClient.invalidateQueries()` | `mutate(key)` |
| Provider | Required `QueryClientProvider` | Optional `SWRConfig` |
| Devtools | Separate package | Built-in (browser devtools) |

## Best Practices

1. **Use `createSWRKey` for query parameters**: Ensures consistent key generation
2. **Use conditional keys for conditional fetching**: `const key = condition ? endpoint : null`
3. **Call `mutate()` after mutations**: To revalidate related data
4. **Use `keepPreviousData: true`**: For pagination to avoid loading states
5. **Disable revalidation for static data**: Use `revalidateOnFocus: false`

## Example Hooks

See `src/hooks/useSWRExample.ts` for complete examples of:
- List fetching with pagination
- Single item fetching
- Conditional fetching
- Mutations
- Public endpoints

## Configuration Options

Global SWR configuration is in `src/lib/swr-config.ts`:

- `revalidateOnFocus`: Revalidate when window gains focus (default: true)
- `revalidateOnReconnect`: Revalidate when network reconnects (default: true)
- `dedupingInterval`: Request deduplication window (default: 2000ms)
- `errorRetryCount`: Number of retry attempts (default: 3)
- `shouldRetryOnError`: Custom retry logic

You can override these per-hook:

```tsx
const { data } = useSWR(key, swrFetcher, {
  revalidateOnFocus: false,
  refreshInterval: 5000,
});
```

