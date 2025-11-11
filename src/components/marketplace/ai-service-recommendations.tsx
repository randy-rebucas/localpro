"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, TrendingUp, MapPin, Star, Loader2 } from "lucide-react";
import { useAIServiceRecommendations } from "@/hooks/useAIFeatures";
import { useSession } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";
import Link from "next/link";

interface Service {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  pricing?: {
    basePrice?: number;
    currency?: string;
  };
  provider?: {
    firstName?: string;
    name?: string;
  };
  rating?: {
    average?: number;
    count?: number;
  };
  location?: string;
  [key: string]: unknown;
}

interface AIServiceRecommendationsProps {
  location?: string;
  lat?: number;
  lng?: number;
  limit?: number;
  onServiceClick?: (service: Service) => void;
}

export function AIServiceRecommendations({
  location,
  lat,
  lng,
  limit = 5,
  onServiceClick,
}: AIServiceRecommendationsProps) {
  const { data: session } = useSession();
  const { settings: appSettings } = useAppSettings();
  const { recommendations, fetchRecommendations, loading } = useAIServiceRecommendations();
  const [showAll, setShowAll] = useState(false);

  const defaultCurrency = getDefaultCurrency(appSettings);
  const formatPrice = (amount: number, currency?: string) => {
    return formatCurrency(amount, currency || defaultCurrency, { appSettings });
  };

  useEffect(() => {
    fetchRecommendations({
      userId: session?.user?.id,
      location,
      lat,
      lng,
      limit: showAll ? 10 : limit,
    });
  }, [session?.user?.id, location, lat, lng, limit, showAll, fetchRecommendations]);

  if (loading && recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Recommendations for You</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  const displayRecommendations = showAll ? recommendations : recommendations.slice(0, limit);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Recommendations for You</h3>
        </div>
        <TrendingUp className="w-5 h-5 text-green-600" />
      </div>

      <div className="space-y-4">
        {displayRecommendations.map((rec, index) => {
          const service = (rec.service || rec) as Service;
          const reasons = Array.isArray(rec.reasons) ? rec.reasons : [];
          const score = typeof rec.score === 'number' ? rec.score : 0;

          return (
            <div
              key={service._id || service.id || index}
              className="border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {service.title || service.name}
                  </h4>
                  {service.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {service.description}
                    </p>
                  )}
                </div>
                <div className="ml-4 text-right">
                  <div className="text-xs font-medium text-green-600 mb-1">
                    {Math.round(score * 100)}% match
                  </div>
                  {service.pricing?.basePrice && (
                    <div className="text-sm font-semibold text-gray-900">
                      {formatPrice(service.pricing.basePrice, service.pricing.currency)}
                    </div>
                  )}
                </div>
              </div>

              {reasons.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">Why we recommend this:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {reasons.slice(0, 2).map((reason: string, i: number) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-green-600 mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                {service.provider && (
                  <div className="flex items-center gap-1">
                    <span>{service.provider.firstName || service.provider.name}</span>
                  </div>
                )}
                {service.rating?.average && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span>{service.rating.average.toFixed(1)}</span>
                    {service.rating.count && (
                      <span className="text-gray-400">({service.rating.count})</span>
                    )}
                  </div>
                )}
                {service.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{service.location}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <Link
                  href={`/marketplace/services/${service._id || service.id}`}
                  className="flex-1 text-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  onClick={() => onServiceClick?.(service)}
                >
                  View Service
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {recommendations.length > limit && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 w-full text-center text-sm text-green-600 hover:text-green-700 font-medium"
        >
          {showAll ? "Show Less" : `Show ${recommendations.length - limit} More Recommendations`}
        </button>
      )}
    </div>
  );
}

