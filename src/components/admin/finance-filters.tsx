"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Filter, Search } from "lucide-react";
import { logger } from "@/lib/logger";

interface FinanceFiltersProps {
  onFiltersChange: (filters: FinanceFilters) => void;
  className?: string;
}

export interface FinanceFilters {
  search: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  category: string;
}

export function FinanceFilters({ onFiltersChange, className = "" }: FinanceFiltersProps) {
  const [filters, setFilters] = useState<FinanceFilters>({
    search: '',
    type: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
    category: 'all'
  });

  const handleFilterChange = (key: keyof FinanceFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      type: 'all',
      status: 'all',
      startDate: '',
      endDate: '',
      category: 'all'
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          >
            <option value="all">All Types</option>
            <option value="revenue">Revenue</option>
            <option value="expense">Expense</option>
            <option value="withdrawal">Withdrawal</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          >
            <option value="all">All Categories</option>
            <option value="marketing">Marketing</option>
            <option value="operations">Operations</option>
            <option value="development">Development</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <Button
            onClick={() => logger.debug('Date range clicked')}
            variant="outline"
            className="flex items-center"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Button>

          <Button
            onClick={clearFilters}
            variant="outline"
            className="flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
}
