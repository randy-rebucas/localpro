"use client";

import React, { useState } from "react";
import { Calendar, Sparkles, Loader2, Clock, TrendingUp } from "lucide-react";
import { useAISchedulingAssistant } from "@/hooks/useAIFeatures";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useUserSettings } from "@/hooks/useUserSettings";
import { formatCurrency } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";
import { formatDateWithUserSettings } from "@/lib/date-time-utils";

interface AISchedulingAssistantProps {
  serviceId?: string;
  providerId?: string;
  existingBookings?: Array<{
    date: string;
    time: string;
    duration: number;
    location?: string;
  }>;
}

export function AISchedulingAssistant({
  serviceId,
  providerId,
  existingBookings,
}: AISchedulingAssistantProps) {
  const { settings: appSettings } = useAppSettings();
  const { settings: userSettings } = useUserSettings();
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split("T")[0],
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });
  interface SchedulingRecommendation {
    date: string;
    timeSlots?: Array<{
      start: string;
      end: string;
      score?: number;
    }>;
    optimization?: {
      travelTime?: number;
      efficiency?: number;
      revenue?: number;
    };
    suggestions?: string[];
  }
  
  const [recommendations, setRecommendations] = useState<SchedulingRecommendation[]>([]);
  const { getRecommendations, loading, error } = useAISchedulingAssistant();

  const defaultCurrency = getDefaultCurrency(appSettings);
  const formatPrice = (amount: number) => {
    return formatCurrency(amount, defaultCurrency, { appSettings });
  };

  const handleGetRecommendations = async () => {
    try {
      const result = await getRecommendations({
        serviceId,
        providerId,
        dateRange: {
          start: dateRange.start,
          end: dateRange.end,
        },
        existingBookings,
      });
      setRecommendations(result);
    } catch (err) {
      console.error("Scheduling recommendations failed", err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Scheduling Assistant</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Get AI-powered scheduling recommendations to optimize your time and maximize efficiency
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <button
          onClick={handleGetRecommendations}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4" />
              <span>Get Recommendations</span>
            </>
          )}
        </button>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-4 mt-4">
            <h4 className="font-semibold text-gray-900">
              Scheduling Recommendations
            </h4>
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {formatDateWithUserSettings(rec.date, userSettings)}
                    </div>
                  </div>
                </div>

                {rec.timeSlots && rec.timeSlots.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">Recommended Time Slots</div>
                    <div className="space-y-2">
                      {rec.timeSlots.map((slot, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-900">
                              {slot.start} - {slot.end}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              Score: {Math.round((slot.score || 0) * 100)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {rec.optimization && (
                  <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div className="bg-blue-50 p-2 rounded text-center">
                      <div className="text-xs text-gray-600">Travel Time</div>
                      <div className="font-semibold text-gray-900">
                        {rec.optimization.travelTime} min
                      </div>
                    </div>
                    <div className="bg-green-50 p-2 rounded text-center">
                      <div className="text-xs text-gray-600">Efficiency</div>
                      <div className="font-semibold text-green-700">
                        {Math.round((rec.optimization.efficiency || 0) * 100)}%
                      </div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded text-center">
                      <div className="text-xs text-gray-600">Revenue</div>
                      <div className="font-semibold text-purple-700">
                        {formatPrice(rec.optimization.revenue || 0)}
                      </div>
                    </div>
                  </div>
                )}

                {rec.suggestions && rec.suggestions.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-1">Suggestions</div>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {rec.suggestions.map((suggestion: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <TrendingUp className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

