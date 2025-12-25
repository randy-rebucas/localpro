/**
 * Example SWR Hooks
 * 
 * This file demonstrates how to use SWR for data fetching
 * instead of TanStack Query. These are example patterns
 * that can be adapted for your specific use cases.
 */

import useSWR from 'swr';
import { API_ENDPOINTS } from '@/lib/api';
import { createSWRKey, swrFetcher } from '@/lib/swr-config';

type PaginationLike = {
  current?: number;
  pages?: number;
  total?: number;
  limit?: number;
  count?: number;
};

type ListResponse<T> = {
  data?: T[];
  pagination?: PaginationLike;
};

type SuppliesResponse<T> = ListResponse<T> & {
  supplies?: T[];
};

type SupplyResponse<T> = {
  data?: T;
  supply?: T;
};

type ProfileResponse<T> = {
  data?: T;
  profile?: T;
};

type CategoriesResponse<T> = {
  data?: T[];
  categories?: T[];
  pagination?: PaginationLike;
};

// ============ Example: Fetching a list ============

interface UseSuppliesOptions {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

/**
 * Example hook for fetching supplies using SWR
 * 
 * @example
 * ```tsx
 * function SuppliesList() {
 *   const { data, error, isLoading, mutate } = useSupplies({ page: 1, limit: 20 });
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   
 *   return (
 *     <div>
 *       {data?.supplies?.map(supply => (
 *         <SupplyCard key={supply.id} supply={supply} />
 *       ))}
 *       <button onClick={() => mutate()}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSupplies(options: UseSuppliesOptions = {}) {
  const key = createSWRKey(API_ENDPOINTS.supplies, {
    page: options.page,
    limit: options.limit,
    category: options.category,
    search: options.search,
  });

  const { data, error, isLoading, isValidating, mutate } = useSWR<SuppliesResponse<unknown>>(
    key,
    swrFetcher,
    {
      // Revalidate every 30 seconds
      refreshInterval: 30000,
      // Keep previous data while revalidating
      keepPreviousData: true,
    }
  );

  return {
    supplies: data?.supplies || data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isValidating,
    error,
    mutate, // Function to manually revalidate
  };
}

// ============ Example: Fetching a single item ============

/**
 * Example hook for fetching a single supply by ID
 * 
 * @example
 * ```tsx
 * function SupplyDetail({ id }: { id: string }) {
 *   const { supply, isLoading, error } = useSupply(id);
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!supply) return <div>Not found</div>;
 *   
 *   return <SupplyDetailView supply={supply} />;
 * }
 * ```
 */
export function useSupply(id: string | null) {
  const key = id ? `${API_ENDPOINTS.supplies}/${id}` : null;

  const { data, error, isLoading, mutate } = useSWR<SupplyResponse<unknown>>(
    key,
    swrFetcher,
    {
      // Don't revalidate automatically for single items
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    supply: data?.supply || data?.data || null,
    isLoading,
    error,
    mutate,
  };
}

// ============ Example: Conditional fetching ============

/**
 * Example hook with conditional fetching
 * Only fetches when enabled is true
 */
export function useUserProfile(userId: string | null, enabled = true) {
  const key = enabled && userId ? `${API_ENDPOINTS.authProfile}?userId=${userId}` : null;

  const { data, error, isLoading, mutate } = useSWR<ProfileResponse<unknown>>(
    key,
    swrFetcher
  );

  return {
    profile: data?.profile || data?.data || null,
    isLoading,
    error,
    mutate,
  };
}

// ============ Example: Mutations with SWR ============

/**
 * Example mutation pattern using SWR
 * 
 * Note: SWR doesn't have built-in mutations like TanStack Query.
 * You can use the mutate function or create custom mutation hooks.
 * 
 * @example
 * ```tsx
 * function CreateSupplyForm() {
 *   const { mutate } = useSupplies();
 *   const [isSubmitting, setIsSubmitting] = useState(false);
 *   
 *   const handleSubmit = async (data) => {
 *     setIsSubmitting(true);
 *     try {
 *       await createSupply(data);
 *       // Revalidate the supplies list
 *       mutate();
 *     } finally {
 *       setIsSubmitting(false);
 *     }
 *   };
 *   
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useCreateSupply() {
  // This is a pattern - you'd implement the actual mutation
  // using fetch or your API client
  return async (supplyData: unknown) => {
    const response = await fetch(`${API_ENDPOINTS.supplies}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(supplyData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create supply');
    }
    
    return response.json();
  };
}

// ============ Example: Public endpoint (no auth) ============

/**
 * Example hook for public endpoints that don't require authentication
 */
export function usePublicData() {
  const { data, error, isLoading } = useSWR<CategoriesResponse<unknown>>(
    API_ENDPOINTS.marketplaceServicesCategories,
    (url) => swrFetcher(url, { skipAuth: true }),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    categories: data?.categories || data?.data || [],
    isLoading,
    error,
  };
}

