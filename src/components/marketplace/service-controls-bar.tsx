"use client";

import React from "react";
import { MapPin, Grid3x3, List, Loader2 } from "lucide-react";

interface ServiceControlsBarProps {
  locationCoordinates: { lat: number; lng: number } | null;
  radius: number;
  detectingLocation: boolean;
  onDetectLocation: () => void;
  onClearLocation: () => void;
  onRadiusChange: (radius: number) => void;
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  groupByCategory: boolean;
  onGroupByCategoryChange: (group: boolean) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function ServiceControlsBar({
  locationCoordinates,
  radius,
  detectingLocation,
  onDetectLocation,
  onClearLocation,
  onRadiusChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  groupByCategory,
  onGroupByCategoryChange,
  viewMode,
  onViewModeChange,
}: ServiceControlsBarProps) {
  return (
    <div className="mb-6 bg-white rounded-xl p-4 lg:p-5 shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        {/* Left Side - Location Detection */}
        <div className="flex-1 w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={onDetectLocation}
              disabled={detectingLocation}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm hover:shadow-md"
            >
              {detectingLocation ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Detecting...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  <span>Detect Current Location</span>
                </>
              )}
            </button>
            
            {locationCoordinates && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">{(radius / 1000).toFixed(1)} km radius</span>
                <button
                  onClick={onClearLocation}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          
          {/* Radius Slider */}
          {locationCoordinates && (
            <div className="mt-3 space-y-2">
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={radius}
                onChange={(e) => onRadiusChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                style={{
                  background: `linear-gradient(to right, #16a34a 0%, #16a34a ${((radius - 1000) / (50000 - 1000)) * 100}%, #e5e7eb ${((radius - 1000) / (50000 - 1000)) * 100}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Sort, Group, and View Mode Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors hover:border-gray-400"
          >
            <option value="createdAt">Date Created</option>
            <option value="basePrice">Price</option>
            <option value="rating">Rating</option>
            <option value="title">Title</option>
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors hover:border-gray-400"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          {/* Group By Category Toggle */}
          <label className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-md hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={groupByCategory}
              onChange={(e) => onGroupByCategoryChange(e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
            />
            <span className="text-sm text-gray-700 whitespace-nowrap">Group by Category</span>
          </label>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grid View"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

