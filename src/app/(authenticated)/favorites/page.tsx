"use client";

/**
 * Favorites Page
 * 
 * Item Type to Data Model Mapping:
 * - 'service' → Marketplace Service (uses /api/marketplace/services)
 * - 'provider' → Provider (uses /api/providers)
 * - 'course' → Course (uses /api/academy/courses)
 * - 'supply' → Product (uses /api/supplies/products)
 * - 'job' → Job (uses /api/jobs)
 */

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Heart,
  Star,
  MapPin,
  Clock,
  Wrench,
  GraduationCap,
  Package,
  Building2,
  Trash2,
  Eye,
  RefreshCw,
  CheckCircle,
  Edit,
  Tag,
  FileText,
  Briefcase
} from "lucide-react";
import { Broadcaster } from "@/components/broadcaster";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/loading";
import { apiRequest, API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency } from "@/lib/currency-utils";
import { getUserPreferredCurrency } from "@/lib/user-settings-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";

// Types
type FavoriteType = 'services' | 'providers' | 'courses' | 'supplies' | 'jobs';
type ItemType = 'service' | 'provider' | 'course' | 'supply' | 'job'; // API uses singular

/**
 * Item Type to Data Model Mapping:
 * - 'service' → Marketplace Service (uses /api/marketplace/services)
 * - 'provider' → Provider (uses /api/providers)
 * - 'course' → Course (uses /api/academy/courses)
 * - 'supply' → Product (uses /api/supplies/products)
 * - 'job' → Job (uses /api/jobs)
 */
interface Favorite {
  _id: string;
  user?: string; // User ID who favorited
  itemType: ItemType;
  itemId: string;
  notes?: string;
  tags?: string[];
  item?: Record<string, unknown>; // Populated item data (Service | Provider | Course | Product)
  metadata?: {
    addedAt?: string;
    lastViewedAt?: string;
    viewCount?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface FavoriteItem {
  id: string;
  _id: string;
  type: FavoriteType;
  itemType: ItemType;
  itemId: string;
  notes?: string;
  tags?: string[];
  data: Record<string, unknown>;
}

interface Service {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  category?: string;
  provider?: {
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  } | string;
  pricing?: {
    type?: string;
    basePrice?: number;
    currency?: string;
  };
  images?: Array<{ url?: string; thumbnail?: string }> | string[];
  serviceArea?: string[];
}

interface Provider {
  _id?: string;
  id?: string;
  userId?: string | {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    phoneNumber?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      name?: string;
      avatar?: {
        url?: string;
        thumbnail?: string;
      };
      bio?: string;
      address?: {
        city?: string;
        state?: string;
        country?: string;
        zipCode?: string;
        street?: string;
        coordinates?: {
          lat?: number;
          lng?: number;
        };
      };
      skills?: string[];
      rating?: number;
    };
    verification?: {
      phoneVerified?: boolean;
      emailVerified?: boolean;
      identityVerified?: boolean;
      isVerified?: boolean;
    };
    badges?: Array<{
      name?: string;
      description?: string;
      icon?: string;
    }>;
    roles?: string[];
    isActive?: boolean;
  };
  firstName?: string;
  lastName?: string;
  name?: string;
  businessName?: string;
  status?: string;
  providerType?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    avatar?: {
      url?: string;
      thumbnail?: string;
    };
    bio?: string;
    address?: {
      city?: string;
      state?: string;
      country?: string;
    };
    skills?: string[];
    rating?: number;
  };
  businessInfo?: {
    businessName?: string;
    businessDescription?: string;
    businessAddress?: {
      city?: string;
      state?: string;
      country?: string;
    };
  } | string; // Can be ObjectId string if not populated
  rating?: {
    average?: number;
    count?: number;
  };
  performance?: {
    rating?: number;
    totalReviews?: number;
  } | string; // Can be ObjectId string if not populated
  verification?: {
    isVerified?: boolean;
    identityVerified?: boolean;
  } | string; // Can be ObjectId string if not populated
  onboarding?: {
    completed?: boolean;
    steps?: Array<{
      step?: string;
      completed?: boolean;
      completedAt?: string;
    }>;
    currentStep?: string;
    progress?: number;
  };
  settings?: {
    profileVisibility?: string;
    showContactInfo?: boolean;
    showPricing?: boolean;
    showReviews?: boolean;
  };
  metadata?: {
    lastActive?: string;
    profileViews?: number;
    searchRanking?: number;
    featured?: boolean;
    promoted?: boolean;
    tags?: string[];
    notes?: string | null;
  };
  avatar?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

interface Course {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  category?: string;
  instructor?: {
    _id?: string;
    id?: string;
    name?: string;
  } | string;
  price?: number;
  thumbnail?: string;
  rating?: number;
  studentsCount?: number;
}

interface Supply {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  category?: string;
  supplier?: {
    _id?: string;
    id?: string;
    businessName?: string;
  } | string;
  pricing?: {
    price?: number;
    currency?: string;
  };
  images?: Array<{ url?: string; thumbnail?: string }> | string[];
  location?: {
    city?: string;
    state?: string;
  };
}

interface Job {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  company?: {
    name?: string;
    logo?: {
      url?: string;
      thumbnail?: string;
    };
    location?: {
      city?: string;
      state?: string;
      country?: string;
      isRemote?: boolean;
      remoteType?: string;
    };
  };
  category?: string | {
    _id?: string;
    name?: string;
  };
  subcategory?: string;
  jobType?: string;
  experienceLevel?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: string;
    isNegotiable?: boolean;
    isConfidential?: boolean;
  };
  isRemote?: boolean;
  status?: string;
  tags?: string[];
}

export default function FavoritesPage() {
  const router = useRouter();
  const { settings: userSettings } = useUserSettings();
  const { settings: appSettings } = useAppSettings();
  const [activeTab, setActiveTab] = useState<FavoriteType>('services');
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Unused state variables - reserved for future features
  const [viewMode] = useState<"grid" | "list">("grid");
  // const [searchQuery, setSearchQuery] = useState("");
  const [searchInput] = useState("");
  const [sortBy] = useState('dateAdded');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  // const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState<string>("");
  const [favoriteIds, setFavoriteIds] = useState<{
    services: string[];
    providers: string[];
    courses: string[];
    supplies: string[];
    jobs: string[];
  }>({
    services: [],
    providers: [],
    courses: [],
    supplies: [],
    jobs: []
  });
  const [stats, setStats] = useState<{
    total: number;
    byType: Record<ItemType, number>;
  } | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 12,
    count: 0
  });
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Currency formatting helper
  const formatPrice = useCallback((price: number, currency?: string | null, suffix?: string) => {
    // Priority: 1. Provided currency, 2. User preferred currency, 3. App default currency
    const currencyCode = currency || getUserPreferredCurrency(userSettings) || getDefaultCurrency(appSettings);
    const formatted = formatCurrency(price, currencyCode, {
      appSettings,
      showSymbol: true,
    });
    return suffix ? `${formatted}${suffix}` : formatted;
  }, [userSettings, appSettings]);

  // Map API itemType to FavoriteType
  const mapItemTypeToFavoriteType = (itemType: ItemType): FavoriteType => {
    switch (itemType) {
      case 'service': return 'services';
      case 'provider': return 'providers';
      case 'course': return 'courses';
      case 'supply': return 'supplies';
      case 'job': return 'jobs';
    }
  };

  // Map FavoriteType to API itemType
  const mapFavoriteTypeToItemType = (type: FavoriteType): ItemType => {
    switch (type) {
      case 'services': return 'service';
      case 'providers': return 'provider';
      case 'courses': return 'course';
      case 'supplies': return 'supply';
      case 'jobs': return 'job';
    }
  };

  // Get API endpoint for fetching item by type and ID
  const getItemEndpoint = (itemType: ItemType, itemId: string): string => {
    switch (itemType) {
      case 'service':
        // Marketplace Service
        return `${API_ENDPOINTS.marketplaceServiceById}/${itemId}`;
      case 'provider':
        // Provider
        return `${API_ENDPOINTS.providersById.replace('[id]', itemId)}`;
      case 'course':
        // Course
        return `${API_ENDPOINTS.academyCoursesById}/${itemId}`;
      case 'supply':
        // Product (from supplies/products)
        return `${API_ENDPOINTS.suppliesProductsById.replace('[id]', itemId)}`;
      case 'job':
        // Job
        return `${API_ENDPOINTS.jobsById}/${itemId}`;
    }
  };

  // Fetch item data if not populated by API
  const fetchItemData = useCallback(async (itemType: ItemType, itemId: string): Promise<Record<string, unknown> | null> => {
    try {
      const endpoint = getItemEndpoint(itemType, itemId);
      const data = await apiRequest<Record<string, unknown>>(endpoint);
      return data;
    } catch (error) {
      logger.error('Error fetching item data', error instanceof Error ? error : new Error(String(error)), { itemType, itemId });
      return null;
    }
  }, []);

  // Fetch favorites statistics
  const fetchStats = useCallback(async () => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.favoritesStats}`;
      const response = await fetch(url, createAuthFetchOptions()).then(res => res.json());
      setStats(response.stats || response);
    } catch (error) {
      logger.error('Error fetching favorites stats', error instanceof Error ? error : new Error(String(error)));
    }
  }, []);

  // Fetch favorites data from API
  const fetchFavorites = useCallback(async (type?: FavoriteType) => {
    setLoading(true);
    setError(null);
    
    try {
      let response: { 
        success?: boolean;
        count?: number;
        total?: number;
        page?: number;
        pages?: number;
        data?: Favorite[]; 
        favorites?: Favorite[]; 
        favorite?: Favorite;
      };
      
      if (type) {
        // Fetch by type
        const itemType = mapFavoriteTypeToItemType(type);
        const url = `${API_BASE_URL}${API_ENDPOINTS.favoritesByType}/${itemType}`;
        response = await fetch(url, createAuthFetchOptions()).then(res => res.json());
      } else {
        // Fetch all favorites
        const url = `${API_BASE_URL}${API_ENDPOINTS.favorites}`;
        response = await fetch(url, createAuthFetchOptions()).then(res => res.json());
      }

      // Handle different response formats: { data: [...] } or { favorites: [...] } or { favorite: {...} }
      // API returns { success, count, total, page, pages, data: [...] }
      const favoritesList = response.data || response.favorites || (response.favorite ? [response.favorite] : []);
      
      // Transform API favorites to FavoriteItem format
      // If item is not populated, fetch it separately
      const transformedFavorites: FavoriteItem[] = await Promise.all(
        favoritesList.map(async (fav: Favorite) => {
          let itemData = fav.item;
          
          // If item is not populated, fetch it using the correct endpoint
          if (!itemData || Object.keys(itemData).length === 0) {
            const fetchedData = await fetchItemData(fav.itemType, fav.itemId);
            if (fetchedData) {
              itemData = fetchedData;
            }
          }
          
          // For providers, handle the API response structure where userId is populated
          if (fav.itemType === 'provider' && itemData) {
            const providerData = itemData as Record<string, unknown>;
            
            // Handle case where userId is a populated User object (from API response)
            if ('userId' in providerData && providerData.userId && typeof providerData.userId === 'object') {
              const userId = providerData.userId as Record<string, unknown>;
              const userProfile = userId.profile as Record<string, unknown> | undefined;
              
              // Merge provider and user data for easier access
              itemData = {
                ...providerData,
                // Extract user fields to top level
                firstName: userId.firstName || userProfile?.firstName,
                lastName: userId.lastName || userProfile?.lastName,
                email: userId.email,
                phone: userId.phone || userId.phoneNumber,
                // Merge profile data
                profile: {
                  ...userProfile,
                  avatar: userProfile?.avatar,
                  bio: userProfile?.bio,
                  address: userProfile?.address,
                },
                // Merge verification from user
                verification: {
                  ...(providerData.verification as Record<string, unknown> || {}),
                  ...(userId.verification as Record<string, unknown> || {}),
                  identityVerified: (userId.verification as Record<string, unknown>)?.identityVerified || false,
                  isVerified: (userId.verification as Record<string, unknown>)?.identityVerified || false,
                },
                // Provider-specific fields
                status: providerData.status,
                providerType: providerData.providerType,
                onboarding: providerData.onboarding,
                settings: providerData.settings,
                metadata: providerData.metadata,
              };
            }
            // Handle case where provider is nested in user object (alternative format)
            else if ('provider' in providerData && providerData.provider && typeof providerData.provider === 'object') {
              const nestedProvider = providerData.provider as Record<string, unknown>;
              const userData = providerData as Record<string, unknown>;
              
              itemData = {
                ...userData,
                ...nestedProvider,
                firstName: userData.firstName || (nestedProvider.profile as Record<string, unknown>)?.firstName,
                lastName: userData.lastName || (nestedProvider.profile as Record<string, unknown>)?.lastName,
                businessInfo: nestedProvider.businessInfo || userData.businessInfo,
                profile: nestedProvider.profile || userData.profile,
              };
            }
          }
          
          return {
            id: fav.itemId,
            _id: fav._id,
            type: mapItemTypeToFavoriteType(fav.itemType),
            itemType: fav.itemType,
            itemId: fav.itemId,
            notes: fav.notes,
            tags: fav.tags,
            data: itemData || {}
          };
        })
      );

      setFavorites(transformedFavorites);
      
      // Update favorite IDs for stats
      const idsByType = {
        services: transformedFavorites.filter(f => f.type === 'services').map(f => f.itemId),
        providers: transformedFavorites.filter(f => f.type === 'providers').map(f => f.itemId),
        courses: transformedFavorites.filter(f => f.type === 'courses').map(f => f.itemId),
        supplies: transformedFavorites.filter(f => f.type === 'supplies').map(f => f.itemId),
        jobs: transformedFavorites.filter(f => f.type === 'jobs').map(f => f.itemId)
      };
      setFavoriteIds(idsByType);
      
      // Fetch stats
      fetchStats();
    } catch (error) {
      logger.error('Error fetching favorites', error instanceof Error ? error : new Error(String(error)));
      setError(error instanceof Error ? error.message : 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, [fetchItemData, fetchStats]);

  // Remove from favorites
  const removeFavorite = useCallback(async (id: string, type: FavoriteType) => {
    try {
      const favorite = favorites.find(f => f.id === id && f.type === type);
      const itemType = mapFavoriteTypeToItemType(type);
      
      let url: string;
      if (favorite?._id) {
        // Use favorite ID if available
        url = `${API_BASE_URL}${API_ENDPOINTS.favoritesById}/${favorite._id}`;
      } else {
        // Use itemType and itemId
        url = `${API_BASE_URL}${API_ENDPOINTS.favoritesByItem}/${itemType}/${id}`;
      }
      
      const response = await fetch(url, createAuthFetchOptions({
        method: 'DELETE'
      }));
      
      if (!response.ok) {
        throw new Error('Failed to remove favorite');
      }
      
      // Update state
      setFavorites(prev => prev.filter(fav => !(fav.id === id && fav.type === type)));
      setFavoriteIds(prev => ({
        ...prev,
        [type]: prev[type].filter(favId => favId !== id)
      }));
      
      toast.success('Removed from favorites');
      
      // Refresh stats
      fetchStats();
      
      // Dispatch custom event for header to update
      window.dispatchEvent(new Event('favoritesUpdated'));
    } catch (error) {
      logger.error('Error removing favorite', error instanceof Error ? error : new Error(String(error)), { favoriteId: id, favoriteType: type });
      toast.error('Failed to remove favorite');
    }
  }, [favorites, fetchStats]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchInput);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]);

  // Add to favorites (unused but kept for potential future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _addFavorite = useCallback(async (itemType: ItemType, itemId: string, notes?: string, tags?: string[]) => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.favorites}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemType,
          itemId,
          notes,
          tags
        })
      }));

      if (!response.ok) {
        throw new Error('Failed to add favorite');
      }

      toast.success('Added to favorites');
      
      // Refresh favorites
      await fetchFavorites();
      await fetchStats();
      
      // Dispatch custom event for header to update
      window.dispatchEvent(new Event('favoritesUpdated'));
      
      return await response.json();
    } catch (error) {
      logger.error('Error adding favorite', error instanceof Error ? error : new Error(String(error)), { itemType, itemId });
      toast.error('Failed to add favorite');
      throw error;
    }
  }, [fetchFavorites, fetchStats]);

  // Check if item is favorited (unused but kept for potential future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _checkFavorite = useCallback(async (itemType: ItemType, itemId: string): Promise<boolean> => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.favoritesCheck}/${itemType}/${itemId}`;
      const response = await fetch(url, createAuthFetchOptions());
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.isFavorited || false;
    } catch (error) {
      logger.error('Error checking favorite', error instanceof Error ? error : new Error(String(error)), { itemType, itemId });
      return false;
    }
  }, []);

  // Update favorite (notes/tags)
  const updateFavorite = useCallback(async (favoriteId: string, notes?: string, tags?: string[]) => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.favoritesById}/${favoriteId}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes,
          tags
        })
      }));

      if (!response.ok) {
        throw new Error('Failed to update favorite');
      }

      toast.success('Favorite updated');
      
      // Refresh favorites
      await fetchFavorites();
      
      return await response.json();
    } catch (error) {
      logger.error('Error updating favorite', error instanceof Error ? error : new Error(String(error)), { favoriteId });
      toast.error('Failed to update favorite');
      throw error;
    }
  }, [fetchFavorites]);

  // Filter favorites by active tab, search, and tags
  const filteredFavorites = React.useMemo(() => {
    return favorites.filter(fav => {
      // Filter by active tab
      if (fav.type !== activeTab) return false;
      
      // Filter by search query
      if (debouncedSearchQuery) {
        const searchLower = debouncedSearchQuery.toLowerCase();
        const data = fav.data;
        const title = (data.title || data.name || '').toString().toLowerCase();
        const description = (data.description || '').toString().toLowerCase();
        const notes = (fav.notes || '').toLowerCase();
        
        if (!title.includes(searchLower) && 
            !description.includes(searchLower) && 
            !notes.includes(searchLower)) {
          return false;
        }
      }
      
      // Filter by tag
      if (tagFilter && (!fav.tags || !fav.tags.includes(tagFilter))) {
        return false;
      }
      
      return true;
    });
  }, [favorites, activeTab, debouncedSearchQuery, tagFilter]);

  // Sort favorites
  const sortedFavorites = React.useMemo(() => {
    return [...filteredFavorites].sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;
      
      switch (sortBy) {
        case 'name': {
          const aName = (a.data.title || a.data.name || '').toString().toLowerCase();
          const bName = (b.data.title || b.data.name || '').toString().toLowerCase();
          aValue = aName;
          bValue = bName;
          break;
        }
        case 'dateAdded':
        default: {
          aValue = new Date(a._id ? new Date(a._id).getTime() : 0).getTime();
          bValue = new Date(b._id ? new Date(b._id).getTime() : 0).getTime();
          break;
        }
      }
      
      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
  }, [filteredFavorites, sortBy, sortOrder]);

  // Get all unique tags from favorites
  // Unused - reserved for future tag filtering feature
  // const allTags = React.useMemo(() => {
  //   const tags = new Set<string>();
  //   favorites.forEach(fav => {
  //     if (fav.tags) {
  //       fav.tags.forEach(tag => tags.add(tag));
  //     }
  //   });
  //   return Array.from(tags).sort();
  // }, [favorites]);

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (tagFilter) count++;
    return count;
  }, [tagFilter]);

  const clearFilters = () => {
    setTagFilter("");
  };

  // Client-side pagination
  const paginatedFavorites = React.useMemo(() => {
    const startIndex = (pagination.current - 1) * pagination.limit;
    return sortedFavorites.slice(startIndex, startIndex + pagination.limit);
  }, [sortedFavorites, pagination]);

  const totalPages = Math.ceil(sortedFavorites.length / pagination.limit);

  // Reset to page 1 when filters or search change
  React.useEffect(() => {
    if (pagination.current !== 1 && sortedFavorites.length > 0) {
      setPagination(prev => ({ ...prev, current: 1 }));
    }
  }, [activeTab, debouncedSearchQuery, tagFilter, pagination, sortedFavorites.length]);

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setPagination(prev => ({ ...prev, current: page }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  // Get icon for type
  const getTypeIcon = (type: FavoriteType) => {
    switch (type) {
      case 'services':
        return Wrench;
      case 'providers':
        return Building2;
      case 'courses':
        return GraduationCap;
      case 'supplies':
        return Package;
      case 'jobs':
        return Briefcase;
    }
  };

  // Get count for tab
  const getTabCount = (type: FavoriteType) => {
    if (stats?.byType) {
      const itemType = mapFavoriteTypeToItemType(type);
      return stats.byType[itemType] || 0;
    }
    return favoriteIds[type].length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent/10/30 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-8 space-y-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/90 text-white flex items-center justify-center shadow-lg shadow-accent/30">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Favorites</h1>
              <p className="text-sm text-gray-600">Your saved items and services</p>
            </div>
          </div>
          <ListSkeleton />
        </div>
      </div>
    );
  }

  const totalFavorites = stats?.total || (
    favoriteIds.services.length + 
    favoriteIds.providers.length + 
    favoriteIds.courses.length + 
    favoriteIds.supplies.length +
    favoriteIds.jobs.length
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent/10/30 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-0">
        {/* Broadcaster - Only shown for clients */}
        <Broadcaster />

        {/* Header Section - Following Reference Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Favorites — Your Saved Items & Services
              </h1>
              <p className="text-gray-600">
                {totalFavorites > 0 ? (
                  <span>{totalFavorites} saved item{totalFavorites !== 1 ? 's' : ''} across all categories</span>
                ) : (
                  <span>Save items you love for easy access later</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="flex flex-wrap gap-1 p-2">
              {(['services', 'providers', 'courses', 'supplies', 'jobs'] as FavoriteType[]).map((type) => {
                const Icon = getTypeIcon(type);
                const count = getTabCount(type);
                const isActive = activeTab === type;
                
                return (
                  <button
                    key={type}
                    onClick={() => setActiveTab(type)}
                    className={`px-4 py-2.5 flex items-center gap-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-accent to-accent/90 text-white shadow-md shadow-accent/30 font-semibold transform hover:scale-105'
                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-accent/10 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="capitalize font-medium">{type}</span>
                    {count > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Main Content Area */}
            <div className="flex-1 min-w-0 space-y-6">

              {/* Results Count */}
              <div className="text-sm text-gray-600">
                {sortedFavorites.length > 0 ? (
                  <>
                    Showing {((pagination.current - 1) * pagination.limit) + 1} to {Math.min(pagination.current * pagination.limit, sortedFavorites.length)} of {sortedFavorites.length} results
                  </>
                ) : (
                  <>No results found</>
                )}
              </div>

              {/* Content */}
              {error ? (
                <div className="bg-white rounded-xl border-2 border-red-200 shadow-lg">
                  <EmptyState
                    icon={Heart}
                    iconColor="text-red-600"
                    iconBgColor="bg-red-100"
                    title="Unable to Load Favorites"
                    description={error}
                    actions={[
                      {
                        type: "button",
                        onClick: fetchFavorites,
                        label: "Try Again",
                        icon: RefreshCw,
                        variant: "primary"
                      }
                    ]}
                  />
                </div>
              ) : sortedFavorites.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg">
                  <EmptyState
                    icon={Heart}
                    iconColor="text-gray-600"
                    iconBgColor="bg-gray-100"
                    title={`No Favorite ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                    description={debouncedSearchQuery || activeFiltersCount > 0 
                      ? `No ${activeTab} match your search or filters. Try adjusting your criteria.`
                      : `You haven't saved any ${activeTab} to your favorites yet. Start exploring to find items you love!`
                    }
                    actions={[
                      ...(activeFiltersCount > 0 ? [{
                        type: "button" as const,
                        onClick: clearFilters,
                        label: "Clear Filters",
                        variant: "primary" as const
                      }] : []),
                      {
                        type: "link" as const,
                        href: activeTab === 'services' ? '/marketplace' : 
                              activeTab === 'providers' ? '/marketplace/providers' :
                              activeTab === 'courses' ? '/academy' :
                              activeTab === 'supplies' ? '/supplies' :
                              '/jobs',
                        label: `Browse ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`,
                        variant: "primary" as const
                      }
                    ]}
                  />
                </div>
              ) : (
                <>
                  <div className={`grid gap-4 ${
                    viewMode === "grid" 
                      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                      : "grid-cols-1"
                  }`}>
                    {paginatedFavorites.map((favorite) => (
                      <FavoriteCard
                        key={`${favorite.type}-${favorite.id}`}
                        favorite={favorite}
                        viewMode={viewMode}
                        onRemove={removeFavorite}
                        onUpdate={updateFavorite}
                        onView={(id, type) => {
                          const routes: Record<FavoriteType, string> = {
                            services: `/marketplace/services/${id}`,
                            providers: `/marketplace/providers/${id}`,
                            courses: `/academy/courses/${id}`,
                            supplies: `/supplies/${id}`,
                            jobs: `/jobs/${id}`
                          };
                          router.push(routes[type]);
                        }}
                        formatPrice={formatPrice}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                          Showing {((pagination.current - 1) * pagination.limit) + 1} to {Math.min(pagination.current * pagination.limit, sortedFavorites.length)} of {sortedFavorites.length} results
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePageChange(pagination.current - 1)}
                            disabled={pagination.current === 1}
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Previous
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum: number;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (pagination.current <= 3) {
                                pageNum = i + 1;
                              } else if (pagination.current >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = pagination.current - 2 + i;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    pagination.current === pageNum
                                      ? "bg-accent text-white"
                                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => handlePageChange(pagination.current + 1)}
                            disabled={pagination.current === totalPages}
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FavoriteCardProps {
  favorite: FavoriteItem;
  viewMode: "grid" | "list";
  onRemove: (id: string, type: FavoriteType) => void;
  onUpdate: (favoriteId: string, notes?: string, tags?: string[]) => Promise<void>;
  onView: (id: string, type: FavoriteType) => void;
  formatPrice: (price: number, currency?: string | null, suffix?: string) => string;
}

const FavoriteCard = React.memo(function FavoriteCard({
  favorite,
  viewMode,
  onRemove,
  onUpdate,
  onView,
  formatPrice
}: FavoriteCardProps) {
  const { id, _id, type, data, notes, tags } = favorite;
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNotes, setEditNotes] = useState(notes || '');
  const [editTags, setEditTags] = useState(tags?.join(', ') || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const renderContent = () => {
    switch (type) {
      case 'services':
        return <ServiceCard service={data as unknown as Service} viewMode={viewMode} formatPrice={formatPrice} />;
      case 'providers':
        return <ProviderCard provider={data as unknown as Provider} viewMode={viewMode} />;
      case 'courses':
        return <CourseCard course={data as unknown as Course} viewMode={viewMode} formatPrice={formatPrice} />;
      case 'supplies':
        return <SupplyCard supply={data as unknown as Supply} viewMode={viewMode} formatPrice={formatPrice} />;
      case 'jobs':
        return <JobCard job={data as unknown as Job} viewMode={viewMode} formatPrice={formatPrice} />;
    }
  };

  const handleUpdate = async () => {
    if (!_id) return;
    
    setIsUpdating(true);
    try {
      const tagsArray = editTags.split(',').map(t => t.trim()).filter(t => t.length > 0 && t.length <= 50);
      await onUpdate(_id, editNotes || undefined, tagsArray.length > 0 ? tagsArray : undefined);
      setShowEditModal(false);
    } catch {
      // Error handled in onUpdate
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Card className={`${viewMode === "list" ? "flex flex-col gap-4 p-5" : "relative flex flex-col"} group hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-accent/30 rounded-xl overflow-hidden bg-white`}>
        <div className={viewMode === "list" ? "flex-1 relative" : "relative"}>
          {renderContent()}
          
          {/* Notes and Tags Display */}
          {(notes || (tags && tags.length > 0)) && (
            <div className={`${viewMode === "list" ? "mt-4" : "p-5 pt-0"} space-y-2`}>
              {notes && (
                <div className="flex items-start gap-2 text-sm text-gray-600 bg-accent/10 p-2 rounded-lg border border-accent/20">
                  <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
                  <p className="line-clamp-2">{notes}</p>
                </div>
              )}
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-accent/10 text-accent rounded-full border border-accent/20">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Card Footer with Actions */}
        <div className={`${viewMode === "list" ? "border-t border-gray-200 pt-3 mt-2" : "border-t border-gray-200 pt-3 px-5 pb-3"} flex items-center justify-end gap-2`}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView(id, type)}
            className="transition-all bg-white shadow-md border border-gray-300 hover:bg-accent/10 hover:border-accent transform hover:scale-110 hover:shadow-lg"
            title="View details"
          >
            <Eye className="w-4 h-4 text-accent" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowEditModal(true)}
            className="transition-all bg-gradient-to-br from-white to-gray-50 shadow-md border border-gray-300 hover:from-primary/10 hover:to-primary/5 hover:border-primary transform hover:scale-110 hover:shadow-lg"
            title="Edit notes and tags"
          >
            <Edit className="w-4 h-4 text-primary" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(id, type)}
            className="transition-all text-red-600 hover:text-red-700 hover:bg-gradient-to-br hover:from-red-50 hover:to-pink-50 bg-white shadow-md border border-red-300 hover:border-red-400 transform hover:scale-110 hover:shadow-lg"
            title="Remove from favorites"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Edit Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditModal(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Edit Favorite</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (max 500 characters)
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setEditNotes(e.target.value);
                  }
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={4}
                placeholder="Add notes about this favorite..."
              />
              <p className="text-xs text-gray-500 mt-1">{editNotes.length}/500</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated, max 50 chars each)
              </label>
              <input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="recommended, quality, etc."
              />
              <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setShowEditModal(false)}
                variant="ghost"
                className="flex-1"
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                className="flex-1 bg-gradient-to-r from-accent to-accent/90 text-white hover:from-accent/90 hover:to-accent"
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

function ServiceCard({ service, viewMode, formatPrice }: { service: Service; viewMode: "grid" | "list"; formatPrice: (price: number, currency?: string | null, suffix?: string) => string }) {
  const imageUrl = Array.isArray(service.images) && service.images.length > 0
    ? (typeof service.images[0] === 'string' ? service.images[0] : service.images[0].url || service.images[0].thumbnail)
    : null;
  
  const providerName = typeof service.provider === 'object' && service.provider
    ? (service.provider.name || `${service.provider.firstName || ''} ${service.provider.lastName || ''}`.trim())
    : 'Unknown Provider';

  const price = service.pricing?.basePrice 
    ? formatPrice(service.pricing.basePrice, service.pricing.currency, service.pricing.type === 'hourly' ? '/hr' : '')
    : 'Price on request';

  return (
    <div className={`${viewMode === "list" ? "flex gap-4" : ""}`}>
      {imageUrl && (
        <div className={`${viewMode === "list" ? "w-48 h-32 flex-shrink-0" : "w-full h-48"} bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl overflow-hidden ${viewMode === "list" ? "" : "mb-4"} shadow-md`}>
          <Image
            src={imageUrl}
            alt={service.title}
            width={viewMode === "list" ? 192 : 400}
            height={viewMode === "list" ? 128 : 192}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className={viewMode === "list" ? "flex-1" : "p-5"}>
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {service.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
          {service.description}
        </p>
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-gray-600 font-medium">{providerName}</span>
          <span className="font-semibold text-accent">{price}</span>
        </div>
        {service.serviceArea && service.serviceArea.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg inline-flex border border-gray-200">
            <MapPin className="w-3.5 h-3.5" />
            <span>{service.serviceArea[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ProviderCard({ provider, viewMode }: { provider: Provider; viewMode: "grid" | "list" }) {
  // Handle userId as populated object (from API response structure)
  const userId = typeof provider.userId === 'object' ? provider.userId : null;
  const userProfile = userId?.profile;
  const userVerification = userId?.verification;
  
  // Extract name from nested structure (prioritize businessInfo, then userId, then provider fields)
  const name = (typeof provider.businessInfo === 'object' && provider.businessInfo?.businessName) ||
               provider.businessName ||
               (typeof provider.businessInfo === 'object' && provider.businessInfo?.businessName) ||
               userProfile?.name ||
               provider.profile?.name ||
               provider.name ||
               (userId?.firstName || provider.firstName || userProfile?.firstName
                 ? `${userId?.firstName || provider.firstName || userProfile?.firstName || ''} ${userId?.lastName || provider.lastName || userProfile?.lastName || ''}`.trim()
                 : null) ||
               'Unknown Provider';

  // Extract location from nested structure
  const location = (typeof provider.businessInfo === 'object' && provider.businessInfo?.businessAddress)
    ? `${provider.businessInfo.businessAddress.city || ''}${provider.businessInfo.businessAddress.city && provider.businessInfo.businessAddress.state ? ', ' : ''}${provider.businessInfo.businessAddress.state || ''}`
    : userProfile?.address
    ? `${userProfile.address.city || ''}${userProfile.address.city && userProfile.address.state ? ', ' : ''}${userProfile.address.state || ''}`
    : provider.profile?.address
    ? `${provider.profile.address.city || ''}${provider.profile.address.city && provider.profile.address.state ? ', ' : ''}${provider.profile.address.state || ''}`
    : provider.location
    ? `${provider.location.city || ''}${provider.location.city && provider.location.state ? ', ' : ''}${provider.location.state || ''}`
    : '';

  // Extract rating from nested structure
  const rating = (typeof provider.performance === 'object' && provider.performance?.rating) ||
                 (typeof provider.rating === 'object' && provider.rating?.average) ||
                 userProfile?.rating ||
                 provider.profile?.rating ||
                 (typeof provider.rating === 'number' ? provider.rating : 0) ||
                 0;

  // Check verification status (check both userId.verification and provider.verification)
  const isVerified = (typeof provider.verification === 'object' && (provider.verification?.isVerified || provider.verification?.identityVerified)) ||
                    (userVerification?.identityVerified || userVerification?.isVerified) ||
                    false;

  return (
    <div className={viewMode === "list" ? "flex-1" : "p-5"}>
      <div className="flex items-start gap-4">
        <div className={`${viewMode === "list" ? "w-12 h-12" : "w-16 h-16"} bg-gradient-to-br from-accent to-accent/90 rounded-xl flex items-center justify-center text-white ${viewMode === "list" ? "text-lg" : "text-xl"} font-bold flex-shrink-0 shadow-lg shadow-accent/30`}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`${viewMode === "list" ? "text-base" : "text-lg"} font-bold text-gray-900`}>{name}</h3>
            {isVerified && (
              <CheckCircle className="w-4 h-4 text-accent" />
            )}
          </div>
          {location && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3 bg-gray-50 px-2.5 py-1.5 rounded-lg inline-flex border border-gray-200">
              <MapPin className="w-3.5 h-3.5" />
              <span>{location}</span>
            </div>
          )}
          {rating > 0 && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 px-2.5 py-1.5 rounded-lg inline-flex shadow-sm">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-sm font-semibold text-gray-900">{typeof rating === 'number' ? rating.toFixed(1) : rating}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CourseCard({ course, viewMode, formatPrice }: { course: Course; viewMode: "grid" | "list"; formatPrice: (price: number, currency?: string | null, suffix?: string) => string }) {
  const imageUrl = course.thumbnail;

  const instructorName = typeof course.instructor === 'object' && course.instructor
    ? course.instructor.name
    : 'Unknown Instructor';

  return (
    <div className={`${viewMode === "list" ? "flex gap-4" : ""}`}>
      {imageUrl && (
        <div className={`${viewMode === "list" ? "w-48 h-32 flex-shrink-0" : "w-full h-48"} bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl overflow-hidden ${viewMode === "list" ? "" : "mb-4"} shadow-md`}>
          <Image
            src={imageUrl}
            alt={course.title}
            width={viewMode === "list" ? 192 : 400}
            height={viewMode === "list" ? 128 : 192}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className={viewMode === "list" ? "flex-1" : "p-5"}>
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
          {course.description}
        </p>
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-gray-600 font-medium">{instructorName}</span>
          {course.price !== undefined && (
            <span className="font-semibold text-accent">
              {formatPrice(course.price)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-3">
          {course.rating && (
            <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-semibold text-gray-900">{course.rating.toFixed(1)}</span>
            </div>
          )}
          {course.studentsCount !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">{course.studentsCount} students</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SupplyCard({ supply, viewMode, formatPrice }: { supply: Supply; viewMode: "grid" | "list"; formatPrice: (price: number, currency?: string | null, suffix?: string) => string }) {
  const imageUrl = Array.isArray(supply.images) && supply.images.length > 0
    ? (typeof supply.images[0] === 'string' ? supply.images[0] : supply.images[0].url || supply.images[0].thumbnail)
    : null;

  const supplierName = typeof supply.supplier === 'object' && supply.supplier
    ? supply.supplier.businessName
    : 'Unknown Supplier';

  const price = supply.pricing?.price
    ? formatPrice(supply.pricing.price, supply.pricing.currency)
    : 'Price on request';

  return (
    <div className={`${viewMode === "list" ? "flex gap-4" : ""}`}>
      {imageUrl && (
        <div className={`${viewMode === "list" ? "w-48 h-32 flex-shrink-0" : "w-full h-48"} bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl overflow-hidden ${viewMode === "list" ? "" : "mb-4"} shadow-md`}>
          <Image
            src={imageUrl}
            alt={supply.name}
            width={viewMode === "list" ? 192 : 400}
            height={viewMode === "list" ? 128 : 192}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className={viewMode === "list" ? "flex-1" : "p-5"}>
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {supply.name}
        </h3>
        {supply.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
            {supply.description}
          </p>
        )}
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-gray-600 font-medium">{supplierName}</span>
          <span className="font-semibold text-accent">{price}</span>
        </div>
        {supply.location && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg inline-flex border border-gray-200">
            <MapPin className="w-3.5 h-3.5" />
            <span>{supply.location.city}{supply.location.state ? `, ${supply.location.state}` : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function JobCard({ job, viewMode, formatPrice }: { job: Job; viewMode: "grid" | "list"; formatPrice: (price: number, currency?: string | null, suffix?: string) => string }) {
  const companyLogo = job.company?.logo?.url || job.company?.logo?.thumbnail;
  const companyName = job.company?.name || 'Unknown Company';
  
  const categoryName = typeof job.category === 'object' && job.category
    ? job.category.name
    : job.category || job.subcategory || 'Uncategorized';

  const location = job.company?.location
    ? `${job.company.location.city || ''}${job.company.location.city && job.company.location.state ? ', ' : ''}${job.company.location.state || ''}`
    : '';

  const isRemote = job.isRemote || job.company?.location?.isRemote;

  // Format salary
  let salaryDisplay = 'Salary not specified';
  if (job.salary) {
    if (job.salary.isConfidential) {
      salaryDisplay = 'Confidential';
    } else if (job.salary.min && job.salary.max) {
      const min = formatPrice(job.salary.min, job.salary.currency);
      const max = formatPrice(job.salary.max, job.salary.currency);
      const period = job.salary.period === 'yearly' ? '/yr' : job.salary.period === 'monthly' ? '/mo' : job.salary.period === 'hourly' ? '/hr' : '';
      salaryDisplay = `${min} - ${max}${period}`;
      if (job.salary.isNegotiable) {
        salaryDisplay += ' (negotiable)';
      }
    } else if (job.salary.min) {
      const min = formatPrice(job.salary.min, job.salary.currency);
      const period = job.salary.period === 'yearly' ? '/yr' : job.salary.period === 'monthly' ? '/mo' : job.salary.period === 'hourly' ? '/hr' : '';
      salaryDisplay = `From ${min}${period}`;
      if (job.salary.isNegotiable) {
        salaryDisplay += ' (negotiable)';
      }
    }
  }

  return (
    <div className={`${viewMode === "list" ? "flex gap-4" : ""}`}>
      {companyLogo && (
        <div className={`${viewMode === "list" ? "w-48 h-32 flex-shrink-0" : "w-full h-48"} bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl overflow-hidden ${viewMode === "list" ? "" : "mb-4"} shadow-md flex items-center justify-center`}>
          <Image
            src={companyLogo}
            alt={companyName}
            width={viewMode === "list" ? 192 : 400}
            height={viewMode === "list" ? 128 : 192}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      {!companyLogo && (
        <div className={`${viewMode === "list" ? "w-48 h-32 flex-shrink-0" : "w-full h-48"} bg-gradient-to-br from-primary to-indigo-600 rounded-xl overflow-hidden ${viewMode === "list" ? "" : "mb-4"} shadow-md flex items-center justify-center`}>
          <Briefcase className="w-16 h-16 text-white" />
        </div>
      )}
      <div className={viewMode === "list" ? "flex-1" : "p-5"}>
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {job.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
          {job.description}
        </p>
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-gray-600 font-medium">{companyName}</span>
          {salaryDisplay !== 'Salary not specified' && (
            <span className="font-semibold text-accent">{salaryDisplay}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {categoryName && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
              <Briefcase className="w-3.5 h-3.5" />
              <span>{categoryName}</span>
            </div>
          )}
          {(location || isRemote) && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
              <MapPin className="w-3.5 h-3.5" />
              <span>{isRemote ? 'Remote' : location || 'Location not specified'}</span>
            </div>
          )}
          {job.jobType && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
              <Clock className="w-3.5 h-3.5" />
              <span className="capitalize">{job.jobType.replace('_', ' ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
