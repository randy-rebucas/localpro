"use client";

import React from "react";
import { Grid3x3, List } from "lucide-react";

interface ProviderControlsBarProps {
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function ProviderControlsBar({
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  viewMode,
  onViewModeChange,
}: ProviderControlsBarProps) {
  return (
    <div className="bg-gradient-to-r from-white to-gray-50/50 rounded-2xl p-4 lg:p-5 shadow-lg border border-gray-200/50 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        {/* Left Side - Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="px-4 py-2 text-xs sm:text-sm border-2 border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all hover:border-green-400 hover:shadow-md font-medium text-gray-700"
          >
            <option value="createdAt">Date Created</option>
            <option value="rating">Rating</option>
            <option value="name">Name</option>
            <option value="status">Status</option>
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
            className="px-4 py-2 text-xs sm:text-sm border-2 border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all hover:border-green-400 hover:shadow-md font-medium text-gray-700"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {/* Right Side - View Mode Toggle */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-1.5 shadow-inner">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2.5 rounded-lg transition-all duration-200 ${
              viewMode === 'grid'
                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-300/50 scale-105'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
            title="Grid View"
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2.5 rounded-lg transition-all duration-200 ${
              viewMode === 'list'
                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-300/50 scale-105'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

