"use client";

import React from "react";
import { MapPin, Star, CheckCircle2, Heart, Clock, User, Image as ImageIcon } from "lucide-react";

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
}

export function ServiceCard({
  id,
  title = `Professional Service ${id}`,
  description = "Professional service provider with years of experience and excellent reviews.",
  location = "Location not specified",
  providerName,
  rating = 0,
  reviewCount = 0,
  price = 0,
  currency = "₱",
  pricingType = "service",
  duration,
  features = [],
  subcategory,
  isVerified = false,
  isActive = true,
  imageUrl,
}: ServiceCardProps) {
  // Format pricing type for display
  const pricingTypeLabel = pricingType === 'hourly' ? 'hr' : pricingType === 'fixed' ? 'service' : pricingType;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group flex flex-row relative items-stretch">
      {/* Favorite Icon - Top Right */}
      <div className="absolute top-3 right-3 z-10">
        <div className="bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <Heart className="w-4 h-4 text-pink-500" />
        </div>
      </div>

      {/* Service Image - Horizontal List Style */}
      <div className="relative w-48 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden self-stretch flex items-center justify-center">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-auto object-cover min-h-full"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.style.display = 'none';
              const placeholder = e.currentTarget.parentElement?.querySelector('.image-placeholder');
              if (placeholder) {
                (placeholder as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div 
          className={`image-placeholder w-full h-full flex flex-col items-center justify-center min-h-[12rem] ${imageUrl ? 'hidden' : 'flex'}`}
        >
          <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
          <span className="text-xs text-gray-500 text-center px-2">No Image</span>
        </div>
      </div>

      {/* Content - List Style */}
      <div className="flex-1 p-4 flex flex-col justify-between">
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Rating Stars */}
            {rating > 0 && (
              <div className="bg-white rounded-lg px-2 py-1 border border-gray-200">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-semibold text-gray-900">{rating.toFixed(1)}</span>
                  {reviewCount > 0 && (
                    <span className="text-xs text-gray-500">({reviewCount})</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Duration */}
            {duration && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Clock className="w-3 h-3" />
                <span>{duration}</span>
              </div>
            )}
            
            {/* Price */}
            <div>
              <span className="text-xl font-bold text-green-600">
                {currency}{price.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500">/{pricingTypeLabel}</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              View Details
            </button>
            <button 
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isActive}
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

