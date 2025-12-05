"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Star, CheckCircle2, Heart, Clock, User, Image as ImageIcon } from "lucide-react";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency-utils";

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
  const [isNavigating, setIsNavigating] = React.useState(false);
  
  // Always use PHP currency symbol
  const currencySymbol = getCurrencySymbol('PHP');
  
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
    <div className={`bg-slate-900/80 rounded-xl shadow-lg border border-slate-800 overflow-hidden hover:shadow-xl hover:border-emerald-500/50 transition-all group relative ${isGrid ? 'flex flex-col h-full' : 'flex flex-row items-stretch'}`}>
      {/* Favorite Icon - Top Right */}
      <div className="absolute top-3 right-3 z-10">
        <div className="bg-slate-800 rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-slate-700">
          <Heart className="w-4 h-4 text-pink-400" />
        </div>
      </div>

      {/* Service Image */}
      <div className={`relative ${isGrid ? 'w-full h-48' : 'w-48 flex-shrink-0'} bg-slate-800 overflow-hidden ${isGrid ? '' : 'self-stretch'} flex items-center justify-center`}>
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
          <ImageIcon className="w-12 h-12 text-slate-600 mb-2" />
          <span className="text-xs text-slate-500 text-center px-2">No Image</span>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 p-4 flex flex-col ${isGrid ? 'min-h-0' : 'justify-between'}`}>
        <div>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold text-white">{title}</h3>
                {isVerified && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                )}
                {subcategory && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-medium">
                    {subcategory.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                )}
              </div>
              
              {/* Provider Name */}
              {providerName && (
                <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-1">
                  <User className="w-3 h-3" />
                  <span>{providerName}</span>
                </div>
              )}
              
              {/* Location */}
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                <MapPin className="w-3 h-3" />
                <span>{location}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-slate-400 line-clamp-2 mb-3">{description}</p>
          )}

          {/* Features - Show first 2-3 features */}
          {features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {features.slice(0, 3).map((feature, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700"
                >
                  {feature}
                </span>
              ))}
              {features.length > 3 && (
                <span className="text-xs text-slate-500 px-2 py-0.5">
                  +{features.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Section - Price, Rating, and Actions */}
        <div className={isGrid ? 'mt-auto pt-4 border-t border-slate-800' : 'flex items-end justify-between gap-4'}>
          {/* Left Side - Price, Rating, Duration */}
          <div className={isGrid ? 'w-full' : 'flex items-center gap-4 flex-wrap'}>
            {/* Price */}
            <div>
              <div className="flex items-baseline gap-1">
                <span className={`${isGrid ? 'text-2xl' : 'text-xl'} font-bold text-emerald-400`}>
                  {currencySymbol}{price.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">/{pricingTypeLabel}</span>
              </div>
            </div>

            {/* Rating and Duration */}
            <div className="flex items-center gap-3">
              {rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-white">{rating.toFixed(1)}</span>
                  {reviewCount > 0 && (
                    <span className="text-xs text-slate-500">({reviewCount})</span>
                  )}
                </div>
              )}
              
              {duration && (
                <div className="flex items-center gap-1 text-xs text-slate-400">
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
              className={`${isGrid ? 'w-full' : ''} px-4 py-2.5 bg-slate-800 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700 hover:text-white active:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isNavigating ? 'Loading...' : 'View Details'}
            </button>
            <button 
              onClick={handleBookNow}
              disabled={!isActive || isNavigating}
              className={`${isGrid ? 'w-full' : ''} px-4 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 active:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25`}
            >
              {isNavigating ? 'Loading...' : 'Book Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

