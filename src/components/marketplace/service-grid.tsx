"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { ServiceCard } from "./service-card";
import { MarketplaceService } from "@/hooks/useCategoryServices";

interface ServiceGridProps {
  featuredServices?: MarketplaceService[];
  services?: MarketplaceService[];
  loading?: boolean;
}

export function ServiceGrid({ featuredServices = [], services = [], loading = false }: ServiceGridProps) {
  // Transform services to match ServiceCard props
  const transformService = (service: MarketplaceService, index: number) => {
    const serviceId = service._id || service.id || `service-${index}`;
    
    // Handle rating - could be a number or an object with {average, count}
    let rating: number = 0;
    let reviewCount: number = 0;
    
    if (typeof service.rating === 'number') {
      rating = service.rating;
    } else if (service.rating && typeof service.rating === 'object') {
      const ratingObj = service.rating as any;
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

  if (allServices.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-600">No services available in this category</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Featured Services Section */}
      {featuredServicesToRender.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-green-600 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900">Featured Services</h2>
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
            </div>
          )}
          <div className="space-y-4">
            {servicesToRender.map((service) => (
              <ServiceCard key={service.id} {...service} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

