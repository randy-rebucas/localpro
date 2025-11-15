"use client";

import React from "react";
import { Filter, X, MapPin, Building2 } from "lucide-react";

const providerTypes = [
  { value: "individual", label: "Individual" },
  { value: "business", label: "Business" },
  { value: "agency", label: "Agency" },
];

const providerStatuses = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
];

interface ProviderFilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  status: string;
  onStatusChange: (status: string) => void;
  providerType: string;
  onProviderTypeChange: (type: string) => void;
  location: string;
  onLocationChange: (location: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function ProviderFilterSidebar({
  isOpen,
  onClose,
  status,
  onStatusChange,
  providerType,
  onProviderTypeChange,
  location,
  onLocationChange,
  hasActiveFilters,
  onClearFilters,
}: ProviderFilterSidebarProps) {
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
          isOpen ? "fixed lg:relative inset-y-0 right-0 z-50 lg:z-auto w-80 lg:w-full overflow-y-auto" : ""
        }`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Filters</h2>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              {providerStatuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Provider Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4 inline mr-1" />
              Provider Type
            </label>
            <div className="space-y-2">
              {providerTypes.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="providerType"
                    value={type.value}
                    checked={providerType === type.value}
                    onChange={(e) => onProviderTypeChange(e.target.value)}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{type.label}</span>
                </label>
              ))}
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="providerType"
                  value=""
                  checked={providerType === ""}
                  onChange={(e) => onProviderTypeChange(e.target.value)}
                  className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">All Types</span>
              </label>
            </div>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="Enter location..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear All Filters
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

