"use client";

import React from "react";
import { Grid3x3, List } from "lucide-react";

interface BookingControlsBarProps {
  sortBy: string;
  onSortByChange: (sortBy: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function BookingControlsBar({
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  viewMode,
  onViewModeChange,
}: BookingControlsBarProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        {/* Left Side - Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-gray-700 hidden sm:block">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-700"
            aria-label="Sort bookings by"
          >
            <option value="bookingDate">Booking Date</option>
            <option value="createdAt">Date Created</option>
            <option value="status">Status</option>
            <option value="totalAmount">Total Amount</option>
            <option value="serviceName">Service Name</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-700"
            aria-label="Sort order"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {/* Right Side - View Mode Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-md transition-all duration-200 ${
              viewMode === 'grid'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Grid View"
            aria-label="Switch to grid view"
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-md transition-all duration-200 ${
              viewMode === 'list'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="List View"
            aria-label="Switch to list view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

