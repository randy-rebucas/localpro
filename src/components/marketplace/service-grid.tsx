"use client";

import React from "react";
import { Loader2, ChevronLeft, ChevronRight, Search, FilterX, Package } from "lucide-react";
import { ServiceCard } from "./service-card";
import { MarketplaceService } from "@/hooks/useCategoryServices";
import { ServiceCategory } from "./categories-carousel";
import { CURRENCY_CONFIGS, getCurrencySymbol } from "@/lib/currency-utils";

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
  viewMode?: 'grid' | 'list';
  selectedCategory?: ServiceCategory | null;
}

export function ServiceGrid({ 
  featuredServices = [], 
  services = [], 
  loading = false, 
  hasActiveFilters = false,
  pagination = null,
  onPageChange,
  viewMode = 'grid',
  selectedCategory = null,
}: ServiceGridProps) {
  // Helper function to normalize currency to currency code
  // Converts currency symbols to their corresponding codes
  const normalizeCurrencyCode = (currency: string | undefined | null): string => {
    if (!currency) return 'PHP';
    
    // If it's already a valid currency code, return it
    if (CURRENCY_CONFIGS[currency.toUpperCase()]) {
      return currency.toUpperCase();
    }
    
    // Map currency symbols to codes
    const symbolToCode: Record<string, string> = {
      '₱': 'PHP',
      '$': 'USD',
      '€': 'EUR',
      '£': 'GBP',
      '¥': 'JPY',
      'A$': 'AUD',
      'C$': 'CAD',
      'S$': 'SGD',
    };
    
    // Check if it's a symbol
    const normalized = currency.trim();
    if (symbolToCode[normalized]) {
      return symbolToCode[normalized];
    }
    
    // Try to find by symbol in configs
    for (const [code, config] of Object.entries(CURRENCY_CONFIGS)) {
      if (config.symbol === normalized) {
        return code;
      }
    }
    
    // Default to PHP if not found
    return 'PHP';
  };

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
    
    // Get pricing info - ensure currency is normalized to code for conversion base
    const pricing = service.pricing || {};
    const price = pricing.basePrice || service.basePrice || service.price || 0;
    // Normalize currency to ensure it's a currency code (not symbol) for proper conversion base
    const rawCurrency = pricing.currency || service.currency;
    const currencyCode = normalizeCurrencyCode(rawCurrency);
    // Convert currency code to symbol for display
    const currency = getCurrencySymbol(currencyCode);
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
    
    // Get image URL - check images array first, then fallback to single image field
    let imageUrl: string | undefined = undefined;
    if (service.images && Array.isArray(service.images) && service.images.length > 0) {
      const firstImage = service.images[0];
      imageUrl = firstImage?.url || firstImage?.thumbnail || undefined;
    } else {
      // Check for alternative image fields
      const serviceWithImage = service as MarketplaceService & { image?: string; imageUrl?: string };
      imageUrl = serviceWithImage.image || serviceWithImage.imageUrl || undefined;
    }
    
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
      imageUrl: imageUrl,
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
    const EmptyIcon = hasActiveFilters ? FilterX : Package;
    const categoryName = selectedCategory?.name;
    
    const title = hasActiveFilters 
      ? "No services found" 
      : categoryName
        ? `No services in ${categoryName}`
        : "No services available";
    
    const description = hasActiveFilters
      ? categoryName
        ? `No services match your filters in ${categoryName}. Try adjusting your filters to see more results.`
        : "Try adjusting your filters to see more results"
      : categoryName
        ? `There are currently no services available in this category. Check back later or explore other categories.`
        : "Check back later or explore other categories";

    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <EmptyIcon className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 text-center max-w-md mb-6">
          {description}
        </p>
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Search className="w-4 h-4" />
            <span>Try removing some filters or expanding your search</span>
          </div>
        )}
        {categoryName && !hasActiveFilters && (
          <div className="mt-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-xs font-medium text-green-700">Category: {categoryName}</span>
          </div>
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
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {featuredServicesToRender.map((service) => (
              <ServiceCard key={service.id} {...service} viewMode={viewMode} />
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
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {servicesToRender.map((service) => (
              <ServiceCard key={service.id} {...service} viewMode={viewMode} />
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

