"use client";

import React from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { ServiceCard } from "./service-card";
import { MarketplaceService } from "@/hooks/useCategoryServices";

interface Pagination {
  current: number;
  pages: number;
  total: number;
  limit: number;
  count: number;
}

interface ServiceGridProps {
  featuredServices?: MarketplaceService[];
  services?: MarketplaceService[];
  loading?: boolean;
  hasActiveFilters?: boolean;
  pagination?: Pagination | null;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export function ServiceGrid({ 
  featuredServices = [], 
  services = [], 
  loading = false, 
  hasActiveFilters = false,
  pagination = null,
  onPageChange,
}: ServiceGridProps) {
  // Transform services to match ServiceCard props
  const transformService = (service: MarketplaceService, index: number) => {
    const serviceId = service._id || service.id || `service-${index}`;
    
    // Handle rating - could be a number or an object with {average, count}
    let rating: number = 0;
    let reviewCount: number = 0;
    
    if (typeof service.rating === 'number') {
      rating = service.rating;
    } else if (service.rating && typeof service.rating === 'object') {
      const ratingObj = service.rating as { 
        average?: number; 
        rating?: number; 
        count?: number; 
        totalRatings?: number; 
        totalReviews?: number; 
      };
      rating = ratingObj.average || ratingObj.rating || 0;
      reviewCount = ratingObj.count || ratingObj.totalRatings || ratingObj.totalReviews || 0;
    }
    
    // Use reviewCount from service if rating was a number
    if (typeof service.rating === 'number') {
      reviewCount = service.reviewCount || service.totalRatings || 0;
    }
    
    // Get provider name
    const providerName = service.provider 
      ? `${service.provider.firstName || ''} ${service.provider.lastName || ''}`.trim() || service.provider.name
      : null;
    
    // Get pricing info
    const pricing = service.pricing || {};
    const price = pricing.basePrice || service.basePrice || service.price || 0;
    const currency = pricing.currency || service.currency || '₱';
    const pricingType = pricing.type || 'service';
    
    // Get service area/location
    const serviceArea = service.serviceArea || [];
    const location = service.location || (serviceArea.length > 0 ? serviceArea.join(', ') : "Location not specified");
    
    // Get duration estimate
    const duration = service.estimatedDuration;
    const durationText = duration 
      ? duration.min && duration.max 
        ? `${duration.min}-${duration.max} hrs`
        : duration.min 
          ? `${duration.min}+ hrs`
          : duration.max
            ? `Up to ${duration.max} hrs`
            : null
      : null;
    
    return {
      id: typeof serviceId === 'string' ? parseInt(serviceId.slice(-6), 16) || index : serviceId,
      serviceId: serviceId,
      title: service.title || "Professional Service",
      description: service.description || "",
      location: location,
      providerName: providerName,
      rating: rating,
      reviewCount: reviewCount,
      price: price,
      currency: currency,
      pricingType: pricingType,
      duration: durationText,
      features: service.features || [],
      serviceType: service.serviceType,
      subcategory: service.subcategory,
      isVerified: service.isVerified || service.provider?.isVerified || false,
      isActive: service.isActive !== false,
    };
  };

  const featuredServicesToRender = featuredServices.map((service, index) => transformService(service, index));
  const servicesToRender = services.map((service, index) => transformService(service, index + featuredServices.length));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          <p className="text-sm text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  const allServices = [...featuredServicesToRender, ...servicesToRender];
  const totalCount = featuredServicesToRender.length + servicesToRender.length;

  if (allServices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-gray-600 mb-2">
          {hasActiveFilters 
            ? "No services match your filters" 
            : "No services available in this category"}
        </p>
        {hasActiveFilters && (
          <p className="text-xs text-gray-500">Try adjusting your filter criteria</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Results Count */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <span className="font-medium">{totalCount}</span>
          <span>{totalCount === 1 ? 'service' : 'services'} found</span>
        </div>
      )}

      {/* Featured Services Section */}
      {featuredServicesToRender.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-green-600 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900">Featured Services</h2>
            {featuredServicesToRender.length > 0 && (
              <span className="text-sm text-gray-500">({featuredServicesToRender.length})</span>
            )}
          </div>
          <div className="space-y-4">
            {featuredServicesToRender.map((service) => (
              <ServiceCard key={service.id} {...service} />
            ))}
          </div>
        </div>
      )}

      {/* Regular Services Section */}
      {servicesToRender.length > 0 && (
        <div>
          {featuredServicesToRender.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gray-300 rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-900">All Services</h2>
              {servicesToRender.length > 0 && (
                <span className="text-sm text-gray-500">({servicesToRender.length})</span>
              )}
            </div>
          )}
          <div className="space-y-4">
            {servicesToRender.map((service) => (
              <ServiceCard key={service.id} {...service} />
            ))}
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
          {/* Pagination Info */}
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{((pagination.current - 1) * pagination.limit) + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(pagination.current * pagination.limit, pagination.total)}
            </span>{" "}
            of <span className="font-medium">{pagination.total}</span> results
          </div>

          {/* Pagination Buttons */}
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => onPageChange && onPageChange(pagination.current - 1)}
              disabled={pagination.current === 1 || loading}
              className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                pagination.current === 1 || loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-green-500"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {(() => {
                const pages: number[] = [];
                
                if (pagination.pages <= 5) {
                  // Show all pages if 5 or less
                  for (let i = 1; i <= pagination.pages; i++) {
                    pages.push(i);
                  }
                } else if (pagination.current <= 3) {
                  // Show first 5 pages
                  for (let i = 1; i <= 5; i++) {
                    pages.push(i);
                  }
                } else if (pagination.current >= pagination.pages - 2) {
                  // Show last 5 pages
                  for (let i = pagination.pages - 4; i <= pagination.pages; i++) {
                    pages.push(i);
                  }
                } else {
                  // Show current page with 2 before and 2 after
                  for (let i = pagination.current - 2; i <= pagination.current + 2; i++) {
                    pages.push(i);
                  }
                }

                return pages.map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange && onPageChange(pageNum)}
                    disabled={loading}
                    className={`w-10 h-10 text-sm font-medium rounded-lg transition-all ${
                      pagination.current === pageNum
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-green-500"
                    } ${loading ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    {pageNum}
                  </button>
                ));
              })()}
            </div>

            {/* Next Button */}
            <button
              onClick={() => onPageChange && onPageChange(pagination.current + 1)}
              disabled={pagination.current === pagination.pages || loading}
              className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                pagination.current === pagination.pages || loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-green-500"
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

