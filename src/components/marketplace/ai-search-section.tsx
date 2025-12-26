"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { LazyAINaturalLanguageSearch } from "@/lib/lazy-components";

interface AISearchSectionProps {
  location: string;
  lat?: number;
  lng?: number;
  radius: number;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  onCategoryKeyChange: (key: string | null) => void;
  onSubcategoryChange: (subcategory: string | null) => void;
  onMinRatingChange: (rating: number) => void;
  onLocationChange: (location: string) => void;
  onLocationCoordinatesChange: (coordinates: { lat: number; lng: number } | null) => void;
  onRadiusChange: (radius: number) => void;
}

export function AISearchSection({
  location,
  lat,
  lng,
  radius,
  priceRange,
  onPriceRangeChange,
  onCategoryKeyChange,
  onSubcategoryChange,
  onMinRatingChange,
  onLocationChange,
  onLocationCoordinatesChange,
  onRadiusChange,
}: AISearchSectionProps) {
  return (
    <div className="mb-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <Sparkles className="w-4 h-4 inline mr-1 text-accent" />
          Discover Services
        </label>
        <LazyAINaturalLanguageSearch
          onSearchResult={(filters) => {
            if (filters.category) onCategoryKeyChange(filters.category);
            if (filters.subcategory) onSubcategoryChange(filters.subcategory);
            if (filters.minPrice !== undefined) onPriceRangeChange([filters.minPrice, priceRange[1]]);
            if (filters.maxPrice !== undefined) onPriceRangeChange([priceRange[0], filters.maxPrice]);
            if (filters.minRating !== undefined) onMinRatingChange(filters.minRating);
            if (filters.location) onLocationChange(filters.location);
            if (filters.lat && filters.lng) {
              onLocationCoordinatesChange({ lat: filters.lat, lng: filters.lng });
              if (filters.radius) onRadiusChange(filters.radius);
            }
          }}
          location={location}
          lat={lat}
          lng={lng}
          radius={radius}
        />
      </div>
    </div>
  );
}

