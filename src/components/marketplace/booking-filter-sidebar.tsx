"use client";

import React from "react";
import { Filter, X, Calendar, User } from "lucide-react";

const bookingStatuses = [
  { value: "all", label: "All Bookings" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const bookingTypes = [
  { value: "all", label: "All Bookings" },
  { value: "client", label: "As Client" },
  { value: "provider", label: "As Provider" },
];

interface BookingFilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  dateFrom: string;
  onDateFromChange: (date: string) => void;
  dateTo: string;
  onDateToChange: (date: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function BookingFilterSidebar({
  isOpen,
  onClose,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  hasActiveFilters,
  onClearFilters,
}: BookingFilterSidebarProps) {
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
        className={`bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border-2 border-gray-200/50 overflow-hidden sticky top-24 backdrop-blur-sm ${
          isOpen ? "fixed lg:relative inset-y-0 right-0 z-50 lg:z-auto w-80 lg:w-full overflow-y-auto" : ""
        }`}
      >
        <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-green-50/50 to-blue-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-bold text-gray-900 text-lg">Filters</h2>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close filters"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all hover:border-green-400 hover:shadow-md font-medium"
              aria-label="Filter bookings by status"
            >
              {bookingStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Booking Type
            </label>
            <div className="space-y-2">
              {bookingTypes.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="bookingType"
                    value={type.value}
                    checked={typeFilter === type.value}
                    onChange={(e) => onTypeFilterChange(e.target.value)}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date Range
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => onDateFromChange(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all hover:border-green-400 hover:shadow-md font-medium"
                  aria-label="Filter bookings from date"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => onDateToChange(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all hover:border-green-400 hover:shadow-md font-medium"
                  aria-label="Filter bookings to date"
                />
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="w-full px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-red-50 hover:to-red-100 hover:text-red-700 hover:border-2 hover:border-red-300 transition-all text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              aria-label="Clear all filters"
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

