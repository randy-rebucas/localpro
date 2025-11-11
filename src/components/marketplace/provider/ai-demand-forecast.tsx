"use client";

import React, { useState } from "react";
import { TrendingUp, Sparkles, Loader2, Calendar, BarChart3 } from "lucide-react";
import { useAIDemandForecast } from "@/hooks/useAIFeatures";
import { useUserSettings } from "@/hooks/useUserSettings";
import { formatDateWithUserSettings } from "@/lib/date-time-utils";

interface AIDemandForecastProps {
  serviceId?: string;
  category: string;
  location?: string;
}

export function AIDemandForecast({
  serviceId,
  category,
  location,
}: AIDemandForecastProps) {
  const { settings: userSettings } = useUserSettings();
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  interface DemandForecast {
    overallTrend?: "increasing" | "decreasing" | "stable";
    trends?: {
      overall?: "increasing" | "decreasing" | "stable";
      seasonalFactors?: string[];
      recommendations?: string[];
    };
    peakPeriods?: Array<{
      period: string;
      expectedDemand: number;
      recommendation: string;
    }>;
    forecast?: Array<{
      date: string;
      predictedDemand: number;
      confidence: number;
      factors?: string[];
    }>;
  }
  
  const [forecast, setForecast] = useState<DemandForecast | null>(null);
  const { fetchForecast, loading, error } = useAIDemandForecast();

  const handleFetch = async () => {
    try {
      const result = await fetchForecast({
        serviceId,
        category,
        location,
        timeframe,
      });
      setForecast(result);
    } catch (err) {
      console.error("Demand forecast failed", err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Demand Forecast</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Predict future demand patterns to optimize your scheduling and pricing
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Forecast Period
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(["7d", "30d", "90d", "1y"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeframe === period
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {period === "7d"
                  ? "7 Days"
                  : period === "30d"
                  ? "30 Days"
                  : period === "90d"
                  ? "90 Days"
                  : "1 Year"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleFetch}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Forecasting...</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              <span>Get Forecast</span>
            </>
          )}
        </button>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {forecast && (
          <div className="space-y-4 mt-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h5 className="font-semibold text-gray-900">Trend Analysis</h5>
              </div>
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Overall Trend:</span>
                  <span
                    className={`font-semibold ${
                      forecast.trends?.overall === "increasing"
                        ? "text-green-600"
                        : forecast.trends?.overall === "decreasing"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {forecast.trends?.overall?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {forecast.peakPeriods && forecast.peakPeriods.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-3">Peak Periods</h5>
                <div className="space-y-2">
                  {forecast.peakPeriods.map((period, i: number) => (
                    <div
                      key={i}
                      className="border border-gray-200 rounded-lg p-3 bg-yellow-50"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-gray-900">{period.period}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        Expected Demand: {period.expectedDemand}
                      </div>
                      <div className="text-xs text-gray-500">{period.recommendation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {forecast.forecast && forecast.forecast.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-3">Daily Forecast</h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {forecast.forecast.slice(0, 14).map((day, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {formatDateWithUserSettings(day.date, userSettings)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Confidence: {Math.round((day.confidence || 0) * 100)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {day.predictedDemand}
                        </div>
                        <div className="text-xs text-gray-500">bookings</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {forecast.trends?.recommendations && forecast.trends.recommendations.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-900 mb-3">Recommendations</h5>
                <ul className="space-y-1">
                  {forecast.trends.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

