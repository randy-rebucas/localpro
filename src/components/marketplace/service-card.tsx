"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Star, CheckCircle2, Heart, Clock, User, Image as ImageIcon } from "lucide-react";
import { getCurrencySymbol, CURRENCY_CONFIGS } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { getDefaultCurrency } from "@/lib/settings-utils";

interface ServiceCardProps {
  id: number;
  serviceId?: string | number;
  title?: string;
  description?: string;
  location?: string;
  providerName?: string | null;
  rating?: number;
  reviewCount?: number;
  price?: number;
  currency?: string;
  pricingType?: string;
  duration?: string | null;
  features?: string[];
  serviceType?: string;
  subcategory?: string;
  isVerified?: boolean;
  isActive?: boolean;
  imageUrl?: string;
  viewMode?: 'grid' | 'list';
}

export function ServiceCard({
  id,
  serviceId,
  title = `Professional Service ${id}`,
  description = "Professional service provider with years of experience and excellent reviews.",
  location = "Location not specified",
  providerName,
  rating = 0,
  reviewCount = 0,
  price = 0,
  currency,
  pricingType = "service",
  duration,
  features = [],
  subcategory,
  isVerified = false,
  isActive = true,
  imageUrl,
  viewMode = 'list',
}: ServiceCardProps) {
  const router = useRouter();
  const { settings: appSettings } = useAppSettings();
  const [isNavigating, setIsNavigating] = React.useState(false);
  
  // Get default currency from app settings
  const defaultCurrencyCode = getDefaultCurrency(appSettings);
  const defaultCurrencySymbol = getCurrencySymbol(defaultCurrencyCode);
  
  // Normalize currency - ensure it's a symbol (convert code to symbol if needed)
  const normalizeCurrencyToSymbol = (curr: string | undefined): string => {
    // Use default from app settings if not provided
    if (!curr) return defaultCurrencySymbol;
    
    // If it's already a symbol, return it
    const symbolMap: Record<string, string> = {
      '₱': '₱', '$': '$', '€': '€', '£': '£', '¥': '¥', 'A$': 'A$', 'C$': 'C$', 'S$': 'S$'
    };
    if (symbolMap[curr]) return curr;
    
    // If it's a currency code, convert to symbol
    if (CURRENCY_CONFIGS[curr.toUpperCase()]) {
      return getCurrencySymbol(curr.toUpperCase());
    }
    
    // Try to find by symbol in configs
    for (const [, config] of Object.entries(CURRENCY_CONFIGS)) {
      if (config.symbol === curr) {
        return curr;
      }
    }
    
    // Default to app settings currency symbol
    return defaultCurrencySymbol;
  };
  
  const currencySymbol = normalizeCurrencyToSymbol(currency);
  
  // Format pricing type for display
  const pricingTypeLabel = pricingType === 'hourly' ? 'hr' : pricingType === 'fixed' ? 'service' : pricingType;
  const isGrid = viewMode === 'grid';
  
  // Get the actual service ID to use for navigation - ensure it's a string
  const actualServiceId = String(serviceId || id);
  
  // Handle View Details click
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isNavigating) return;
    
    setIsNavigating(true);
    router.push(`/marketplace/services/${actualServiceId}`);
    // Reset after a short delay to allow navigation
    setTimeout(() => setIsNavigating(false), 1000);
  };
  
  // Handle Book Now click
  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isActive || isNavigating) return;
    
    setIsNavigating(true);
    router.push(`/marketplace/services/${actualServiceId}/book`);
    // Reset after a short delay to allow navigation
    setTimeout(() => setIsNavigating(false), 1000);
  };
  
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group relative ${isGrid ? 'flex flex-col h-full' : 'flex flex-row items-stretch'}`}>
      {/* Favorite Icon - Top Right */}
      <div className="absolute top-3 right-3 z-10">
        <div className="bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <Heart className="w-4 h-4 text-pink-500" />
        </div>
      </div>

      {/* Service Image */}
      <div className={`relative ${isGrid ? 'w-full h-48' : 'w-48 flex-shrink-0'} bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden ${isGrid ? '' : 'self-stretch'} flex items-center justify-center`}>
        {imageUrl ? (
          <Image 
            src={imageUrl} 
            alt={title || "Service image"}
            fill
            className="object-cover"
            sizes="192px"
            unoptimized={imageUrl.startsWith('http://localhost') || !imageUrl.startsWith('http')}
          />
        ) : null}
        <div 
          className={`image-placeholder w-full h-full flex flex-col items-center justify-center ${isGrid ? 'h-48' : 'min-h-[12rem]'} ${imageUrl ? 'hidden' : 'flex'}`}
        >
          <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
          <span className="text-xs text-gray-500 text-center px-2">No Image</span>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 p-4 flex flex-col ${isGrid ? 'min-h-0' : 'justify-between'}`}>
        <div>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold text-gray-900">{title}</h3>
                {isVerified && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
                {subcategory && (
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-md font-medium">
                    {subcategory.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                )}
              </div>
              
              {/* Provider Name */}
              {providerName && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                  <User className="w-3 h-3" />
                  <span>{providerName}</span>
                </div>
              )}
              
              {/* Location */}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPin className="w-3 h-3" />
                <span>{location}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{description}</p>
          )}

          {/* Features - Show first 2-3 features */}
          {features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {features.slice(0, 3).map((feature, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-gray-50 text-gray-700 px-2 py-0.5 rounded-md border border-gray-200"
                >
                  {feature}
                </span>
              ))}
              {features.length > 3 && (
                <span className="text-xs text-gray-500 px-2 py-0.5">
                  +{features.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Section - Price, Rating, and Actions */}
        <div className={isGrid ? 'mt-auto pt-4 border-t border-gray-100' : 'flex items-end justify-between gap-4'}>
          {/* Left Side - Price, Rating, Duration */}
          <div className={isGrid ? 'w-full' : 'flex items-center gap-4 flex-wrap'}>
            {/* Price */}
            <div>
              <div className="flex items-baseline gap-1">
                <span className={`${isGrid ? 'text-2xl' : 'text-xl'} font-bold text-green-600`}>
                  {currencySymbol}{price.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500">/{pricingTypeLabel}</span>
              </div>
            </div>

            {/* Rating and Duration */}
            <div className="flex items-center gap-3">
              {rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-gray-900">{rating.toFixed(1)}</span>
                  {reviewCount > 0 && (
                    <span className="text-xs text-gray-500">({reviewCount})</span>
                  )}
                </div>
              )}
              
              {duration && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  <span>{duration}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - CTA Buttons */}
          <div className={`flex ${isGrid ? 'flex-col gap-2 w-full' : 'gap-2 flex-shrink-0'}`}>
            <button 
              onClick={handleViewDetails}
              disabled={isNavigating}
              className={`${isGrid ? 'w-full' : ''} px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 active:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isNavigating ? 'Loading...' : 'View Details'}
            </button>
            <button 
              onClick={handleBookNow}
              disabled={!isActive || isNavigating}
              className={`${isGrid ? 'w-full' : ''} px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 active:bg-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md`}
            >
              {isNavigating ? 'Loading...' : 'Book Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

