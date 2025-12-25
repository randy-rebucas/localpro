/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/marketplace/hooks/useProviders' instead.
 */
export * from '@/features/marketplace/hooks/useProviders';
import { useState, useRef, useCallback, useEffect } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { User } from "@/types/users";
import { Provider } from "@/types/providers";

export interface ProvidersParams {
  status?: string;
  providerType?: string;
  category?: string; // Deprecated: use categoryId instead
  categoryId?: string; // Category ObjectId
  skills?: string[]; // Skill IDs (ObjectIds)
  skillsMatch?: 'any' | 'all';
  city?: string;
  state?: string;
  minRating?: number;
  maxDistance?: number;
  lat?: number;
  lng?: number;
  featured?: boolean;
  promoted?: boolean;
  location?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface ProvidersResponse {
  success?: boolean;
  data?: Provider[] | { users?: User[]; pagination?: { current: number; pages: number; total: number; limit: number; count: number } };
  users?: User[];
  pagination?: {
    page?: number;
    current?: number;
    pages: number;
    total: number;
    limit: number;
    count?: number;
  };
}

// Provider response structure from /api/providers
interface ProviderResponseItem {
  _id: string;
  userId: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    profileImage?: string;
    profile?: {
      avatar?: {
        url?: string;
        thumbnail?: string;
      };
      address?: {
        city?: string;
        state?: string;
      };
    };
  };
  status?: string;
  providerType?: string;
  professionalInfo?: Provider["professionalInfo"];
  businessInfo?: Provider["businessInfo"];
  verification?: Provider["verification"];
  preferences?: Provider["preferences"];
  performance?: Provider["performance"];
  metadata?: Provider["metadata"];
  createdAt?: string;
  updatedAt?: string;
}

interface PaginationData {
  current: number;
  pages: number;
  total: number;
  limit: number;
  count: number;
}

export function useProviders(params: ProvidersParams = {}) {
  const [providers, setProviders] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const mountedRef = useRef(true);

  const fetchProviders = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      
      // Add filter parameters - only add if they have valid values
      if (params.status && typeof params.status === 'string' && params.status.trim()) {
        queryParams.append("status", params.status.trim());
      }
      if (params.providerType && typeof params.providerType === 'string' && params.providerType.trim()) {
        queryParams.append("providerType", params.providerType.trim());
      }
      // Prefer categoryId (ObjectId) over category (key)
      if (params.categoryId && typeof params.categoryId === 'string' && params.categoryId.trim()) {
        // Validate it looks like an ObjectId (24 hex characters)
        const categoryId = params.categoryId.trim();
        if (/^[0-9a-fA-F]{24}$/.test(categoryId)) {
          queryParams.append("categoryId", categoryId);
        } else {
          logger.warn("Invalid categoryId format, skipping", { categoryId });
        }
      } else if (params.category && typeof params.category === 'string' && params.category.trim()) {
        // Fallback to category key for backward compatibility
        queryParams.append("category", params.category.trim());
      }
      if (params.location && typeof params.location === 'string' && params.location.trim()) {
        queryParams.append("location", params.location.trim());
      }
      if (params.city && typeof params.city === 'string' && params.city.trim()) {
        queryParams.append("city", params.city.trim());
      }
      if (params.state && typeof params.state === 'string' && params.state.trim()) {
        queryParams.append("state", params.state.trim());
      }
      if (params.minRating !== undefined && params.minRating !== null && !isNaN(params.minRating) && params.minRating > 0) {
        queryParams.append("minRating", params.minRating.toString());
      }
      if (params.maxDistance !== undefined && params.maxDistance !== null && !isNaN(params.maxDistance) && params.maxDistance > 0) {
        queryParams.append("maxDistance", params.maxDistance.toString());
      }
      if (params.lat !== undefined && params.lat !== null && !isNaN(params.lat)) {
        queryParams.append("lat", params.lat.toString());
      }
      if (params.lng !== undefined && params.lng !== null && !isNaN(params.lng)) {
        queryParams.append("lng", params.lng.toString());
      }
      if (params.featured !== undefined && params.featured !== null) {
        queryParams.append("featured", params.featured.toString());
      }
      if (params.promoted !== undefined && params.promoted !== null) {
        queryParams.append("promoted", params.promoted.toString());
      }
      
      // Add skills as comma-separated string - using skill IDs (ObjectIds)
      if (params.skills && Array.isArray(params.skills) && params.skills.length > 0) {
        // Ensure we're using valid ObjectIds (filter out empty strings and invalid values)
        const skillIds = params.skills
          .filter(id => {
            if (!id || typeof id !== 'string') return false;
            const trimmed = id.trim();
            // Validate ObjectId format (24 hex characters) or allow if it's a valid string
            return trimmed !== '' && (/^[0-9a-fA-F]{24}$/.test(trimmed) || trimmed.length > 0);
          })
          .map(id => id.trim());
        if (skillIds.length > 0) {
          queryParams.append("skills", skillIds.join(","));
        }
      }
      
      // Add skillsMatch parameter (defaults to 'any' if skills are provided)
      if (params.skillsMatch && (params.skillsMatch === 'any' || params.skillsMatch === 'all')) {
        queryParams.append("skillsMatch", params.skillsMatch);
      } else if (params.skills && Array.isArray(params.skills) && params.skills.length > 0) {
        queryParams.append("skillsMatch", "any"); // Default to 'any' when skills are provided
      }
      
      const page = params.page && params.page > 0 ? params.page : 1;
      const limit = params.limit && params.limit > 0 ? params.limit : 20;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      
      if (params.sortBy && typeof params.sortBy === 'string' && params.sortBy.trim()) {
        queryParams.append("sortBy", params.sortBy.trim());
      }
      if (params.sortOrder && (params.sortOrder === 'asc' || params.sortOrder === 'desc')) {
        queryParams.append("sortOrder", params.sortOrder);
      }

      // Use /api/providers endpoint instead of /api/users
      const url = `${API_BASE_URL}${API_ENDPOINTS.providers}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Fetching providers', {
          url,
          params: Object.fromEntries(queryParams.entries()),
          paramsCount: queryParams.toString().split('&').length
        });
      }
      
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `Failed to fetch providers: ${response.status}`;
        let errorDetails: { error?: string; message?: string; [key: string]: unknown } | null = null;
        
        try {
          const errorData = await response.json() as { error?: string; message?: string; [key: string]: unknown };
          errorDetails = errorData;
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = `Failed to fetch providers: ${response.status} ${response.statusText}`;
        }
        
        logger.error("Error fetching providers", new Error(errorMessage), {
          status: response.status,
          statusText: response.statusText,
          url,
          params: Object.fromEntries(queryParams.entries()),
          errorDetails
        });
        
        throw new Error(errorMessage);
      }

      const responseData: { success?: boolean; data?: ProviderResponseItem[]; pagination?: ProvidersResponse["pagination"] } = await response.json();
      
      let providersData: User[] = [];
      let paginationData = null;

      // Debug logging
      logger.debug("Providers API response", { 
        hasSuccess: responseData.success,
        hasData: !!responseData.data,
        dataLength: Array.isArray(responseData.data) ? responseData.data.length : 0,
        hasPagination: !!responseData.pagination
      });

      // Handle /api/providers response structure: { success: true, data: Provider[], pagination: {...} }
      if (responseData.success && Array.isArray(responseData.data)) {
        // Transform Provider objects to User objects with provider property
        providersData = responseData.data.map((providerItem: ProviderResponseItem): User => {
          const userId = providerItem.userId;
          
          // Create User object with provider data
          const user: User = {
            _id: userId._id,
            firstName: userId.firstName,
            lastName: userId.lastName,
            email: userId.email,
            phoneNumber: userId.phone || '',
            roles: ['provider'], // Default to provider role since this is a provider endpoint
            profile: {
              avatar: userId.profile?.avatar || (userId.profileImage ? {
                url: userId.profileImage,
                thumbnail: userId.profileImage
              } : undefined),
              address: userId.profile?.address
            },
            provider: {
              _id: providerItem._id,
              userId: userId._id,
              status: providerItem.status as Provider["status"],
              providerType: providerItem.providerType as Provider["providerType"],
              professionalInfo: providerItem.professionalInfo,
              businessInfo: providerItem.businessInfo,
              verification: providerItem.verification,
              preferences: providerItem.preferences,
              performance: providerItem.performance,
              metadata: providerItem.metadata,
              createdAt: providerItem.createdAt ? new Date(providerItem.createdAt) : undefined,
              updatedAt: providerItem.updatedAt ? new Date(providerItem.updatedAt) : undefined,
            }
          };
          
          return user;
        });
        
        // Handle pagination - convert page to current if needed
        if (responseData.pagination) {
          paginationData = {
            current: responseData.pagination.current ?? responseData.pagination.page ?? page,
            pages: responseData.pagination.pages ?? 1,
            total: responseData.pagination.total ?? 0,
            limit: responseData.pagination.limit ?? limit,
            count: responseData.pagination.count ?? providersData.length,
          };
        }
      } else if (Array.isArray(responseData.data)) {
        // Fallback: if data is array but no success flag
        providersData = (responseData.data as unknown as User[]) || [];
        paginationData = responseData.pagination ? {
          current: responseData.pagination.current ?? responseData.pagination.page ?? page,
          pages: responseData.pagination.pages ?? 1,
          total: responseData.pagination.total ?? 0,
          limit: responseData.pagination.limit ?? limit,
          count: responseData.pagination.count ?? providersData.length,
        } : null;
      }

      // Log how many users have provider data
      const usersWithProvider = providersData.filter(user => user.provider);
      logger.debug("Providers data processed", {
        totalUsers: providersData.length,
        usersWithProvider: usersWithProvider.length,
        usersWithoutProvider: providersData.length - usersWithProvider.length
      });

      if (mountedRef.current) {
        setProviders(providersData);
        setPagination(paginationData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching providers", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setProviders([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchProviders();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchProviders]);

  return {
    providers,
    loading,
    error,
    pagination,
    refetch: fetchProviders,
  };
}

export function useProvider(id: string | null) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchProvider = useCallback(async () => {
    if (!id || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.providersById.replace("[id]", id)}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch provider: ${response.status}`);
      }

      const data = await response.json();
      const providerData = data?.data || data?.provider || data;

      if (mountedRef.current) {
        setProvider(providerData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching provider", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setProvider(null);
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    fetchProvider();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchProvider]);

  return {
    provider,
    loading,
    error,
    refetch: fetchProvider,
  };
}

