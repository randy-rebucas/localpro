"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { User } from "@/types/users";
import { Provider } from "@/types/providers";

export interface ProvidersParams {
  status?: string;
  providerType?: string;
  category?: string;
  skills?: string[];
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
      
      // Add filter parameters
      if (params.status) queryParams.append("status", params.status);
      if (params.providerType) queryParams.append("providerType", params.providerType);
      if (params.category) queryParams.append("category", params.category);
      if (params.location) queryParams.append("location", params.location);
      if (params.city) queryParams.append("city", params.city);
      if (params.state) queryParams.append("state", params.state);
      if (params.minRating) queryParams.append("minRating", params.minRating.toString());
      if (params.maxDistance) queryParams.append("maxDistance", params.maxDistance.toString());
      if (params.lat !== undefined) queryParams.append("lat", params.lat.toString());
      if (params.lng !== undefined) queryParams.append("lng", params.lng.toString());
      if (params.featured !== undefined) queryParams.append("featured", params.featured.toString());
      if (params.promoted !== undefined) queryParams.append("promoted", params.promoted.toString());
      
      // Add skills as comma-separated string - using skill IDs
      if (params.skills && params.skills.length > 0) {
        // Ensure we're using IDs (filter out empty strings)
        const skillIds = params.skills.filter(id => id && id.trim() !== '');
        if (skillIds.length > 0) {
          queryParams.append("skills", skillIds.join(","));
        }
      }
      
      // Add skillsMatch parameter (defaults to 'any' if skills are provided)
      if (params.skillsMatch) {
        queryParams.append("skillsMatch", params.skillsMatch);
      } else if (params.skills && params.skills.length > 0) {
        queryParams.append("skillsMatch", "any"); // Default to 'any' when skills are provided
      }
      
      const page = params.page || 1;
      const limit = params.limit || 20;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      // Use /api/providers endpoint instead of /api/users
      const url = `${API_BASE_URL}${API_ENDPOINTS.providers}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch providers: ${response.status}`);
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
            roles: userId.roles || (userId.role ? [userId.role] : ['client']),
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

