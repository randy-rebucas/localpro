"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, CheckCircle, Building2 } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { User } from "@/types/users";

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
  // Access provider data from user.provider (may be null)
  const provider = user.provider;

  const providerId = provider?._id || user._id;
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
  const isGrid = viewMode === 'grid';

  return (
    <Link
      href={`/marketplace/providers/${providerId}`}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group relative ${isGrid ? 'flex flex-col h-full' : 'flex flex-row items-stretch'}`}
    >
      {/* Provider Image */}
      <div className={`relative ${isGrid ? 'w-full h-40' : 'w-40 flex-shrink-0'} bg-gradient-to-br from-green-100 to-green-200 overflow-hidden ${isGrid ? '' : 'self-stretch'} flex items-center justify-center`}>
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            fill
            className="object-cover"
            sizes={isGrid ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : "192px"}
            unoptimized={avatarUrl.startsWith('http://localhost') || !avatarUrl.startsWith('http')}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${isGrid ? 'h-40' : 'min-h-[10rem]'}`}>
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 p-4 flex flex-col ${isGrid ? 'min-h-0' : 'justify-between'}`}>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h3 className="text-base font-semibold text-gray-900 truncate">{name}</h3>
                {provider?.verification?.identityVerified && (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
                {provider?.providerType && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium flex-shrink-0">
                    {provider.providerType === 'business' ? 'Business' : 
                     provider.providerType === 'agency' ? 'Agency' : 'Individual'}
                  </span>
                )}
              </div>
              
              {/* Location */}
              {location && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
              )}

              {/* Business Description */}
              {provider?.businessInfo?.businessDescription ? (
                <p className="text-xs text-gray-600 line-clamp-2 mb-3">{provider.businessInfo.businessDescription}</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Bottom Section - Rating and Actions */}
        <div className={isGrid ? 'mt-auto pt-3 border-t border-gray-100' : 'flex items-end justify-between gap-4 pt-3'}>
          {/* Left Side - Rating */}
          <div className={isGrid ? 'w-full mb-2' : 'flex items-center gap-4 flex-wrap'}>
            {rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-gray-900">{rating.toFixed(1)}</span>
                {totalReviews > 0 && (
                  <span className="text-xs text-gray-500">({totalReviews})</span>
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
              className={`${isGrid ? 'w-full' : ''} px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 active:bg-green-800 transition-all shadow-sm hover:shadow-md`}
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
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
        : 'space-y-3'
      }>
        {providers.map((user) => (
          <ProviderCard
            key={user._id}
            user={user}
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {pagination.pages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pagination.pages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

