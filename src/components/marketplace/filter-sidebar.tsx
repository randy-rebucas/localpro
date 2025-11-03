"use client";

import React from "react";
import {
  Filter,
  X,
  DollarSign,
  Award,
  Clock,
  MapPin,
  Star,
} from "lucide-react";

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sidebarCategory?: string;
  onCategoryChange?: (category: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
  isAvailable: boolean;
  onAvailabilityChange: (available: boolean) => void;
  location: string;
  onLocationChange: (location: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function FilterSidebar({
  isOpen,
  onClose,
  priceRange,
  onPriceRangeChange,
  minRating,
  onMinRatingChange,
  isAvailable,
  onAvailabilityChange,
  location,
  onLocationChange,
  hasActiveFilters,
  onClearFilters,
}: FilterSidebarProps) {
  return (
    <aside
      className={`lg:w-64 flex-shrink-0 ${isOpen ? "block" : "hidden lg:block"}`}
    >
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24 ${
          isOpen
            ? "fixed right-0 top-0 h-full w-80 z-50 overflow-y-auto lg:relative lg:w-auto lg:h-auto lg:z-auto"
            : ""
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-md">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                <p className="text-xs text-gray-600">Refine your search</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-white/50 transition-colors"
              aria-label="Close filters"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Filter Content */}
        <div className="p-6 space-y-8">

          {/* Price Range */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <label className="text-sm font-semibold text-gray-900">Price Range</label>
            </div>
            <div className="space-y-5">
              {/* Price Display */}
              <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3 border border-green-100">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Min</p>
                  <span className="text-base font-bold text-green-700">
                    ₱{priceRange[0].toLocaleString()}
                  </span>
                </div>
                <div className="w-px h-8 bg-green-200"></div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Max</p>
                  <span className="text-base font-bold text-green-700">
                    ₱{priceRange[1].toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Dual Range Slider Container */}
              <div className="relative py-2">
                {/* Track Background */}
                <div className="absolute inset-0 h-2 bg-gray-200 rounded-full top-1/2 transform -translate-y-1/2"></div>
                {/* Active Range */}
                <div
                  className="absolute h-2 bg-green-500 rounded-full top-1/2 transform -translate-y-1/2"
                  style={{
                    left: `${(priceRange[0] / 10000) * 100}%`,
                    width: `${((priceRange[1] - priceRange[0]) / 10000) * 100}%`,
                  }}
                ></div>

                {/* Min Slider */}
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={priceRange[0]}
                  onChange={(e) => {
                    const newMin = parseInt(e.target.value);
                    onPriceRangeChange([
                      Math.min(newMin, priceRange[1] - 100),
                      priceRange[1],
                    ]);
                  }}
                  className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb z-10 top-1/2 transform -translate-y-1/2"
                  style={{
                    zIndex: priceRange[0] > priceRange[1] - 500 ? 20 : 10,
                  }}
                />

                {/* Max Slider */}
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={priceRange[1]}
                  onChange={(e) => {
                    const newMax = parseInt(e.target.value);
                    onPriceRangeChange([
                      priceRange[0],
                      Math.max(newMax, priceRange[0] + 100),
                    ]);
                  }}
                  className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb z-10 top-1/2 transform -translate-y-1/2"
                  style={{
                    zIndex: priceRange[1] < priceRange[0] + 500 ? 20 : 10,
                  }}
                />
              </div>
            </div>

            {/* Custom Slider Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
              .slider-thumb::-webkit-slider-thumb {
                appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #16a34a;
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              }
              .slider-thumb::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #16a34a;
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              }
              .slider-thumb:focus {
                outline: none;
              }
              .slider-thumb:focus::-webkit-slider-thumb {
                box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2);
              }
              .slider-thumb:focus::-moz-range-thumb {
                box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2);
              }
            ` }} />
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Ratings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-green-600" />
              <label className="text-sm font-semibold text-gray-900">Rating</label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onMinRatingChange(0)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  minRating === 0
                    ? "bg-green-600 text-white shadow-md shadow-green-200"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200"
                }`}
              >
                All
              </button>
              {[4, 4.5, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => onMinRatingChange(rating)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    minRating === rating
                      ? "bg-green-600 text-white shadow-md shadow-green-200"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200"
                  }`}
                >
                  <Star
                    className={`w-4 h-4 ${
                      minRating === rating ? "fill-white" : "fill-yellow-400 text-yellow-400"
                    }`}
                  />
                  {rating}+
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Availability Toggle */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600" />
              <label className="text-sm font-semibold text-gray-900">Availability</label>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
              <div>
                <span className="text-sm font-semibold text-gray-900 block">Available Now</span>
                <span className="text-xs text-gray-500">Show only immediate availability</span>
              </div>
              <button
                onClick={() => onAvailabilityChange(!isAvailable)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ${
                  isAvailable ? "bg-green-600 shadow-lg shadow-green-200" : "bg-gray-300"
                }`}
                role="switch"
                aria-checked={isAvailable}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                    isAvailable ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Location Selector */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" />
              <label className="text-sm font-semibold text-gray-900">Location</label>
            </div>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search location..."
                value={location}
                onChange={(e) => onLocationChange(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-medium bg-white hover:border-gray-300 transition-colors placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <>
              <div className="border-t border-gray-100"></div>
              <button
                onClick={onClearFilters}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all border-2 border-transparent hover:border-gray-300 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

