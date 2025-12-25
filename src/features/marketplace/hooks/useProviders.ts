"use client";

import useSWR from "swr";
import { API_ENDPOINTS } from "@/lib/api";
import { createSWRKey, swrFetcher } from "@/lib/swr-config";
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
  // Build query params object for createSWRKey
  // Note: We need to handle complex validation and array params
  const queryParams: Record<string, string | number | boolean | null | undefined> = {};
  
  if (params.status && typeof params.status === 'string' && params.status.trim()) {
    queryParams.status = params.status.trim();
  }
  if (params.providerType && typeof params.providerType === 'string' && params.providerType.trim()) {
    queryParams.providerType = params.providerType.trim();
  }
  // Prefer categoryId over category
  if (params.categoryId && typeof params.categoryId === 'string' && /^[0-9a-fA-F]{24}$/.test(params.categoryId.trim())) {
    queryParams.categoryId = params.categoryId.trim();
  } else if (params.category && typeof params.category === 'string' && params.category.trim()) {
    queryParams.category = params.category.trim();
  }
  if (params.location && typeof params.location === 'string' && params.location.trim()) {
    queryParams.location = params.location.trim();
  }
  if (params.city && typeof params.city === 'string' && params.city.trim()) {
    queryParams.city = params.city.trim();
  }
  if (params.state && typeof params.state === 'string' && params.state.trim()) {
    queryParams.state = params.state.trim();
  }
  if (params.minRating !== undefined && params.minRating !== null && !isNaN(params.minRating) && params.minRating > 0) {
    queryParams.minRating = params.minRating;
  }
  if (params.maxDistance !== undefined && params.maxDistance !== null && !isNaN(params.maxDistance) && params.maxDistance > 0) {
    queryParams.maxDistance = params.maxDistance;
  }
  if (params.lat !== undefined && params.lat !== null && !isNaN(params.lat)) {
    queryParams.lat = params.lat;
  }
  if (params.lng !== undefined && params.lng !== null && !isNaN(params.lng)) {
    queryParams.lng = params.lng;
  }
  if (params.featured !== undefined && params.featured !== null) {
    queryParams.featured = params.featured;
  }
  if (params.promoted !== undefined && params.promoted !== null) {
    queryParams.promoted = params.promoted;
  }
  // Handle skills array - join as comma-separated string
  if (params.skills && Array.isArray(params.skills) && params.skills.length > 0) {
    const skillIds = params.skills
      .filter(id => id && typeof id === 'string' && id.trim() !== '')
      .map(id => id.trim());
    if (skillIds.length > 0) {
      queryParams.skills = skillIds.join(",");
    }
  }
  if (params.skillsMatch && (params.skillsMatch === 'any' || params.skillsMatch === 'all')) {
    queryParams.skillsMatch = params.skillsMatch;
  } else if (params.skills && Array.isArray(params.skills) && params.skills.length > 0) {
    queryParams.skillsMatch = "any";
  }
  
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 20;
  queryParams.page = page;
  queryParams.limit = limit;
  
  if (params.sortBy && typeof params.sortBy === 'string' && params.sortBy.trim()) {
    queryParams.sortBy = params.sortBy.trim();
  }
  if (params.sortOrder && (params.sortOrder === 'asc' || params.sortOrder === 'desc')) {
    queryParams.sortOrder = params.sortOrder;
  }

  const swrKey = createSWRKey(API_ENDPOINTS.providers, queryParams);

  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    success?: boolean;
    data?: ProviderResponseItem[];
    pagination?: ProvidersResponse["pagination"];
  }>(
    swrKey,
    swrFetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  // Transform Provider objects to User objects with provider property
  let providers: User[] = [];
  let pagination: PaginationData | null = null;

  if (data) {
    if (data.success && Array.isArray(data.data)) {
      providers = data.data.map((providerItem: ProviderResponseItem): User => {
        const userId = providerItem.userId;
        
        return {
          _id: userId._id,
          firstName: userId.firstName,
          lastName: userId.lastName,
          email: userId.email,
          phoneNumber: userId.phone || '',
          roles: ['provider'],
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
      });
      
      if (data.pagination) {
        pagination = {
          current: data.pagination.current ?? data.pagination.page ?? page,
          pages: data.pagination.pages ?? 1,
          total: data.pagination.total ?? 0,
          limit: data.pagination.limit ?? limit,
          count: data.pagination.count ?? providers.length,
        };
      }
    } else if (Array.isArray(data.data)) {
      providers = (data.data as unknown as User[]) || [];
      pagination = data.pagination ? {
        current: data.pagination.current ?? data.pagination.page ?? page,
        pages: data.pagination.pages ?? 1,
        total: data.pagination.total ?? 0,
        limit: data.pagination.limit ?? limit,
        count: data.pagination.count ?? providers.length,
      } : null;
    }
  }

  return {
    providers,
    loading: isLoading,
    isValidating,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    pagination,
    refetch: mutate,
  };
}

export function useProvider(id: string | null) {
  const swrKey = id ? API_ENDPOINTS.providersById.replace("[id]", id) : null;

  const { data, error, isLoading, mutate } = useSWR<{ data?: Provider; provider?: Provider } | Provider>(
    swrKey,
    swrFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const provider = data ? ((data as { data?: Provider; provider?: Provider }).data || 
                           (data as { data?: Provider; provider?: Provider }).provider || 
                           (data as Provider)) : null;

  return {
    provider,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch: mutate,
  };
}

