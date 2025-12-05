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
  Grid,
  List,
  CheckCircle,
  Edit,
  Tag,
  FileText,
  Briefcase
} from "lucide-react";
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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

  // Filter favorites by active tab
  const filteredFavorites = favorites.filter(fav => fav.type === activeTab);

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
      <div className="min-h-screen bg-slate-950 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-8 space-y-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-red-500/25">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent mb-1">Favorites</h1>
              <p className="text-sm text-slate-400">Your saved items and services</p>
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
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-red-500/25">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent mb-1">Favorites</h1>
              <p className="text-sm text-slate-400">
                {totalFavorites > 0 ? (
                  <span className="font-medium text-slate-300">{totalFavorites} saved item{totalFavorites !== 1 ? 's' : ''}</span>
                ) : (
                  <span>Your saved items and services</span>
                )}
              </p>
            </div>
          </div>
          {filteredFavorites.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className={`p-2.5 rounded-lg transition-all border ${
                  viewMode === "grid"
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
                title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
              >
                {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

      {/* Tabs */}
      <div className="bg-slate-900/80 rounded-xl shadow-lg border border-slate-800 overflow-hidden backdrop-blur-sm">
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
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="capitalize font-medium">{type}</span>
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="bg-slate-900/80 to-red-500/10 rounded-xl border border-red-500/30 shadow-lg">
          <EmptyState
            icon={Heart}
            iconColor="text-red-400"
            iconBgColor="bg-red-500/20"
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
      ) : filteredFavorites.length === 0 ? (
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 shadow-lg">
          <EmptyState
            icon={Heart}
            iconColor="text-gray-600"
            iconBgColor="bg-gray-100"
            title={`No Favorite ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
            description={`You haven't saved any ${activeTab} to your favorites yet. Start exploring to find items you love!`}
            actions={[
              {
                type: "link",
                href: activeTab === 'services' ? '/marketplace' : 
                      activeTab === 'providers' ? '/marketplace/providers' :
                      activeTab === 'courses' ? '/marketplace/courses' :
                      activeTab === 'supplies' ? '/marketplace/supplies' :
                      '/jobs',
                label: `Browse ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`,
                variant: "primary"
              }
            ]}
          />
        </div>
      ) : (
        <div className={`grid gap-4 ${
          viewMode === "grid" 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
            : "grid-cols-1"
        }`}>
          {filteredFavorites.map((favorite) => (
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
                  courses: `/marketplace/courses/${id}`,
                  supplies: `/marketplace/supplies/${id}`,
                  jobs: `/jobs/${id}`
                };
                router.push(routes[type]);
              }}
              formatPrice={formatPrice}
            />
          ))}
        </div>
      )}
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
      <Card className={`${viewMode === "list" ? "flex flex-col gap-4 p-5" : "relative flex flex-col"} group hover:shadow-xl transition-all duration-300 border border-gray-200 rounded-xl overflow-hidden bg-gradient-to-br from-white to-gray-50/50`}>
        <div className={viewMode === "list" ? "flex-1 relative" : "relative"}>
          {renderContent()}
          
          {/* Notes and Tags Display */}
          {(notes || (tags && tags.length > 0)) && (
            <div className={`${viewMode === "list" ? "mt-4" : "p-5 pt-0"} space-y-2`}>
              {notes && (
                <div className="flex items-start gap-2 text-sm text-gray-600 bg-gradient-to-r from-blue-50/50 to-emerald-50/50 p-2 rounded-lg">
                  <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="line-clamp-2">{notes}</p>
                </div>
              )}
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-full">
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
            className="transition-all bg-gradient-to-br from-white to-gray-50 shadow-md border border-gray-300 hover:from-emerald-50 hover:to-green-50 hover:border-emerald-400 transform hover:scale-110 hover:shadow-lg"
            title="View details"
          >
            <Eye className="w-4 h-4 text-emerald-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowEditModal(true)}
            className="transition-all bg-gradient-to-br from-white to-gray-50 shadow-md border border-gray-300 hover:from-blue-50 hover:to-indigo-50 hover:border-blue-400 transform hover:scale-110 hover:shadow-lg"
            title="Edit notes and tags"
          >
            <Edit className="w-4 h-4 text-blue-600" />
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
                className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700"
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
          <span className="font-semibold text-emerald-600">{price}</span>
        </div>
        {service.serviceArea && service.serviceArea.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500 bg-gradient-to-r from-gray-50 to-emerald-50/50 px-2.5 py-1.5 rounded-lg inline-flex shadow-sm">
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
        <div className={`${viewMode === "list" ? "w-12 h-12" : "w-16 h-16"} bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white ${viewMode === "list" ? "text-lg" : "text-xl"} font-bold flex-shrink-0 shadow-lg shadow-emerald-500/30`}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`${viewMode === "list" ? "text-base" : "text-lg"} font-bold text-gray-900`}>{name}</h3>
            {isVerified && (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          {location && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3 bg-gradient-to-r from-gray-50 to-emerald-50/50 px-2.5 py-1.5 rounded-lg inline-flex shadow-sm">
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
            <span className="font-semibold text-emerald-600">
              {formatPrice(course.price)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-3">
          {course.rating && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 px-2.5 py-1.5 rounded-lg shadow-sm">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-semibold text-gray-900">{course.rating.toFixed(1)}</span>
            </div>
          )}
          {course.studentsCount !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gradient-to-r from-gray-50 to-emerald-50/50 px-2.5 py-1.5 rounded-lg shadow-sm">
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
          <span className="font-semibold text-emerald-600">{price}</span>
        </div>
        {supply.location && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500 bg-gradient-to-r from-gray-50 to-emerald-50/50 px-2.5 py-1.5 rounded-lg inline-flex shadow-sm">
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
        <div className={`${viewMode === "list" ? "w-48 h-32 flex-shrink-0" : "w-full h-48"} bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl overflow-hidden ${viewMode === "list" ? "" : "mb-4"} shadow-md flex items-center justify-center`}>
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
            <span className="font-semibold text-emerald-600">{salaryDisplay}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {categoryName && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gradient-to-r from-gray-50 to-blue-50/50 px-2.5 py-1.5 rounded-lg shadow-sm">
              <Briefcase className="w-3.5 h-3.5" />
              <span>{categoryName}</span>
            </div>
          )}
          {(location || isRemote) && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gradient-to-r from-gray-50 to-emerald-50/50 px-2.5 py-1.5 rounded-lg shadow-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span>{isRemote ? 'Remote' : location || 'Location not specified'}</span>
            </div>
          )}
          {job.jobType && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gradient-to-r from-purple-50 to-pink-50/50 px-2.5 py-1.5 rounded-lg shadow-sm">
              <Clock className="w-3.5 h-3.5" />
              <span className="capitalize">{job.jobType.replace('_', ' ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
