"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, CheckCircle, Building2, Heart } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { User } from "@/types/users";
import { checkFavorite, toggleFavorite } from "@/lib/favorites-utils";
import { logger } from "@/lib/logger";
import { useSession } from "@/hooks/useAuth";

interface ProviderGridProps {
  providers: User[];
  loading: boolean;
  hasActiveFilters: boolean;
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
    count: number;
  } | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  viewMode: 'grid' | 'list';
  selectedCategory?: string | null;
  selectedSkills?: string[];
}

function ProviderCard({ user, viewMode }: { user: User; viewMode: 'grid' | 'list' }) {
  // Get current user session
  const { data: session } = useSession();
  const currentUserId = session?.user?._id || session?.user?.id || session?.user?.userId;
  
  // Access provider data from user.provider (may be null)
  const provider = user.provider;

  const providerId = provider?._id || user._id;
  const providerUserId = user._id; // The user ID of the provider
  const name = provider?.businessInfo?.businessName || 
               `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
               'Unknown Provider';
  
  // Get location from provider business address or user profile address
  const location = provider?.businessInfo?.businessAddress 
    ? `${provider.businessInfo.businessAddress.city || ''}${provider.businessInfo.businessAddress.city && provider.businessInfo.businessAddress.state ? ', ' : ''}${provider.businessInfo.businessAddress.state || ''}`
    : user.profile?.address
    ? `${user.profile.address.city || ''}${user.profile.address.city && user.profile.address.state ? ', ' : ''}${user.profile.address.state || ''}`
    : '';

  const rating = provider?.performance?.rating || provider?.rating?.average || 0;
  const totalReviews = provider?.performance?.totalReviews || provider?.rating?.count || 0;
  const avatarUrl = user.profile?.avatar?.url || user.profile?.avatar?.thumbnail;
  const hasAvatar = avatarUrl && avatarUrl !== '/placeholder-avatar.png' && !avatarUrl.includes('placeholder');
  const isGrid = viewMode === 'grid';
  
  // Check if current user is viewing their own profile
  const isOwnProfile = currentUserId && providerUserId && (
    currentUserId === providerUserId || 
    currentUserId === providerId
  );
  
  // Favorite state
  const [isFavorited, setIsFavorited] = useState(false);
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // Check if provider is favorited on mount (only if not own profile)
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!providerId || isOwnProfile) {
        setIsCheckingFavorite(false);
        return;
      }
      
      try {
        setIsCheckingFavorite(true);
        const favorited = await checkFavorite('provider', providerId);
        setIsFavorited(favorited);
      } catch (error) {
        logger.error('Error checking favorite status', error instanceof Error ? error : new Error(String(error)), { providerId });
      } finally {
        setIsCheckingFavorite(false);
      }
    };

    checkFavoriteStatus();
  }, [providerId, isOwnProfile]);

  // Listen for favorites updated event (only if not own profile)
  useEffect(() => {
    if (!providerId || isOwnProfile) return;
    
    const handleFavoritesUpdated = async () => {
      try {
        const favorited = await checkFavorite('provider', providerId);
        setIsFavorited(favorited);
      } catch (error) {
        logger.error('Error checking favorite status after update', error instanceof Error ? error : new Error(String(error)), { providerId });
      }
    };

    window.addEventListener('favoritesUpdated', handleFavoritesUpdated);
    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdated);
    };
  }, [providerId, isOwnProfile]);
  
  // Get initials from name
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  const initials = getInitials(name);

  // Handle favorite toggle
  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent favoriting self
    if (isOwnProfile) {
      return;
    }
    
    if (isToggling || isCheckingFavorite || !providerId) return;
    
    try {
      setIsToggling(true);
      const newFavoriteStatus = await toggleFavorite('provider', providerId);
      setIsFavorited(newFavoriteStatus);
    } catch (error) {
      logger.error('Error toggling favorite', error instanceof Error ? error : new Error(String(error)), { providerId });
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Link
      href={`/marketplace/providers/${providerId}`}
      className={`bg-white rounded-2xl shadow-md border border-gray-200/50 overflow-hidden hover:shadow-2xl hover:border-green-300 transition-all duration-300 group relative ${isGrid ? 'flex flex-col h-full' : 'flex flex-row items-stretch'} transform hover:-translate-y-1`}
    >
      {/* Decorative gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/0 to-blue-50/0 group-hover:from-green-50/50 group-hover:to-blue-50/30 transition-all duration-300 pointer-events-none rounded-2xl"></div>
      
      {/* Favorite Button - Top Right (hidden if own profile) */}
      {!isOwnProfile && (
        <button
          onClick={handleFavoriteToggle}
          disabled={isToggling || isCheckingFavorite}
          className={`absolute top-3 right-3 z-20 bg-white rounded-full p-2 shadow-lg transition-all duration-300 ${
            isFavorited 
              ? 'opacity-100 text-red-500 hover:text-red-600 hover:scale-110' 
              : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:scale-110'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart 
            className={`w-5 h-5 transition-all ${isFavorited ? 'fill-red-500' : ''} ${isToggling ? 'animate-pulse' : ''}`} 
          />
        </button>
      )}
      
      {/* Provider Image */}
      <div className={`relative ${isGrid ? 'w-full h-48' : 'w-48 flex-shrink-0'} bg-gradient-to-br from-green-100 via-green-200 to-blue-100 overflow-hidden ${isGrid ? '' : 'self-stretch'} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
        {hasAvatar && avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes={isGrid ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : "192px"}
            unoptimized={avatarUrl.startsWith('http://localhost') || !avatarUrl.startsWith('http')}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${isGrid ? 'h-48' : 'min-h-[12rem]'} relative`}>
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
              {initials}
            </div>
            {/* Animated ring */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-24 h-24 border-2 border-green-300/50 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 p-5 flex flex-col ${isGrid ? 'min-h-0' : 'justify-between'} relative z-10`}>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-green-700 transition-colors">{name}</h3>
                {provider?.verification?.identityVerified && (
                  <div className="flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-xs text-green-700 font-medium">Verified</span>
                  </div>
                )}
                {provider?.providerType && (
                  <span className="text-xs bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold flex-shrink-0 border border-blue-200">
                    {provider.providerType === 'business' ? 'Business' : 
                     provider.providerType === 'agency' ? 'Agency' : 'Individual'}
                  </span>
                )}
              </div>
              
              {/* Location */}
              {location && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-3 group-hover:text-gray-700 transition-colors">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-green-600" />
                  <span className="truncate font-medium">{location}</span>
                </div>
              )}

              {/* Business Description */}
              {provider?.businessInfo?.businessDescription ? (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">{provider.businessInfo.businessDescription}</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Bottom Section - Rating and Actions */}
        <div className={isGrid ? 'mt-auto pt-4 border-t border-gray-100' : 'flex items-end justify-between gap-4 pt-4'}>
          {/* Left Side - Rating */}
          <div className={isGrid ? 'w-full mb-3' : 'flex items-center gap-4 flex-wrap'}>
            {rating > 0 && (
              <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-bold text-gray-900">{rating.toFixed(1)}</span>
                {totalReviews > 0 && (
                  <span className="text-xs text-gray-600 font-medium">({totalReviews} reviews)</span>
                )}
              </div>
            )}
          </div>

          {/* Right Side - View Profile Button */}
          <div className={`flex ${isGrid ? 'w-full' : 'flex-shrink-0'}`}>
            <button 
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/marketplace/providers/${providerId}`;
              }}
              className={`${isGrid ? 'w-full' : ''} px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm font-semibold hover:from-green-700 hover:to-green-800 active:scale-95 transition-all shadow-md hover:shadow-lg group-hover:shadow-xl`}
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProviderGrid({
  providers,
  loading,
  hasActiveFilters,
  pagination,
  currentPage,
  onPageChange,
  viewMode,
}: ProviderGridProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" text="Loading providers..." />
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {hasActiveFilters ? 'No providers match your filters' : 'No providers found'}
        </h3>
        <p className="text-gray-600">
          {hasActiveFilters 
            ? 'Try adjusting your filters to see more results.'
            : 'Check back later for new providers.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6'
        : 'space-y-4'
      }>
        {providers.map((user, index) => (
          <div
            key={user._id}
            className="animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ProviderCard
              user={user}
              viewMode={viewMode}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-5 py-2.5 border-2 border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 hover:border-green-400 transition-all font-medium text-gray-700 hover:text-green-700 disabled:hover:bg-transparent disabled:hover:border-gray-300 disabled:hover:text-gray-700"
          >
            Previous
          </button>
          <div className="px-5 py-2.5 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl">
            <span className="text-sm font-semibold text-gray-700">
              Page <span className="text-green-700">{currentPage}</span> of <span className="text-green-700">{pagination.pages}</span>
            </span>
          </div>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pagination.pages}
            className="px-5 py-2.5 border-2 border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 hover:border-green-400 transition-all font-medium text-gray-700 hover:text-green-700 disabled:hover:bg-transparent disabled:hover:border-gray-300 disabled:hover:text-gray-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

