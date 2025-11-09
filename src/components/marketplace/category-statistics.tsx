"use client";

import React from "react";
import { ServiceCategory } from "./categories-carousel";
import { TrendingUp, DollarSign, Star, Users, Tag } from "lucide-react";

interface CategoryStatisticsProps {
  category: ServiceCategory | null;
}

export function CategoryStatistics({ category }: CategoryStatisticsProps) {
  if (!category || !category.statistics) {
    return null;
  }

  const stats = category.statistics;
  const pricing = stats.pricing;
  const rating = stats.rating;

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100 p-3 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Services */}
        {stats.totalServices !== undefined && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-600 font-medium leading-tight">Services</p>
              <p className="text-base font-bold text-gray-900">{stats.totalServices}</p>
            </div>
          </div>
        )}

        {/* Average Price */}
        {pricing && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-600 font-medium leading-tight">Avg. Price</p>
              <p className="text-base font-bold text-gray-900">
                {pricing.currency || "₱"}{pricing.average?.toLocaleString() || "N/A"}
              </p>
              {pricing.min !== undefined && pricing.max !== undefined && (
                <p className="text-xs text-gray-500 leading-tight">
                  {pricing.currency || "₱"}{pricing.min}-{pricing.currency || "₱"}{pricing.max}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Average Rating */}
        {rating && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-green-600 fill-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-600 font-medium leading-tight">Rating</p>
              <p className="text-base font-bold text-gray-900">
                {rating.average?.toFixed(1) || "0.0"}
              </p>
              {rating.totalRatings !== undefined && rating.totalRatings > 0 && (
                <p className="text-xs text-gray-500 leading-tight">
                  {rating.totalRatings} {rating.totalRatings === 1 ? "review" : "reviews"}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Provider Count */}
        {stats.providerCount !== undefined && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-600 font-medium leading-tight">Providers</p>
              <p className="text-base font-bold text-gray-900">
                {stats.providerCount || 0}
              </p>
            </div>
          </div>
        )}

        {/* Subcategories - Show top 3 */}
        {stats.subcategoryDistribution && Array.isArray(stats.subcategoryDistribution) && stats.subcategoryDistribution.length > 0 && (
          <div className="flex items-center gap-2 col-span-2 md:col-span-4 pt-2 border-t border-green-200">
            <Tag className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 font-medium mb-1.5">Subcategories</p>
              <div className="flex flex-wrap gap-1.5">
                {stats.subcategoryDistribution.slice(0, 3).map((item, index: number) => (
                  <span
                    key={index}
                    className="text-xs bg-white px-2 py-0.5 rounded border border-green-200 text-gray-700 font-medium"
                  >
                    {item.subcategory?.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())} ({item.percentage}%)
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

