"use client";

import React, { useState } from "react";
import { TrendingUp, Sparkles, Loader2, DollarSign, BarChart3, AlertCircle } from "lucide-react";
import { useAIPricingOptimizer } from "@/hooks/useAIFeatures";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";

interface PricingOptimization {
  recommendedPrice?: {
    min?: number;
    max?: number;
    optimal?: number;
    currency?: string;
  };
  currentMarketAverage?: number;
  competitiveness?: "high" | "medium" | "low";
  expectedImpact?: {
    bookings?: {
      change: number;
      percentage: number;
    };
    revenue?: {
      change: number;
      percentage: number;
    };
  };
  factors?: Array<{
    factor: string;
    recommendation: string;
    impact: number;
  }>;
}

interface AIPricingOptimizerProps {
  serviceId?: string;
  currentPrice: number;
  category: string;
  location?: string;
  onOptimizationComplete?: (optimization: PricingOptimization) => void;
}

export function AIPricingOptimizer({
  serviceId,
  currentPrice,
  category,
  location,
  onOptimizationComplete,
}: AIPricingOptimizerProps) {
  const { settings: appSettings } = useAppSettings();
  const [optimization, setOptimization] = useState<PricingOptimization | null>(null);
  const { optimize, loading, error } = useAIPricingOptimizer();

  const defaultCurrency = getDefaultCurrency(appSettings);
  const formatPrice = (amount: number, currency?: string) => {
    return formatCurrency(amount, currency || defaultCurrency, { appSettings });
  };

  const handleOptimize = async () => {
    try {
      const result = await optimize({
        serviceId,
        category,
        currentPrice,
        location,
      });
      setOptimization(result);
      onOptimizationComplete?.(result);
    } catch (err) {
      console.error("Pricing optimization failed", err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Pricing Optimizer</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Get AI-powered pricing recommendations based on market analysis and demand patterns
      </p>

      {!optimization ? (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Current Price:</span>
                <div className="font-semibold text-gray-900">{formatPrice(currentPrice)}</div>
              </div>
              <div>
                <span className="text-gray-600">Category:</span>
                <div className="font-semibold text-gray-900 capitalize">{category}</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleOptimize}
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
                <TrendingUp className="w-4 h-4" />
                <span>Optimize Pricing</span>
              </>
            )}
          </button>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Pricing Recommendations</h4>
            <button
              onClick={() => setOptimization(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Re-analyze
            </button>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h5 className="font-semibold text-gray-900">Recommended Price Range</h5>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className="text-gray-600 mb-1">Minimum</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatPrice(optimization.recommendedPrice?.min || 0, optimization.recommendedPrice?.currency)}
                </div>
              </div>
              <div className="text-center bg-green-100 rounded p-2">
                <div className="text-gray-700 mb-1 font-medium">Optimal</div>
                <div className="text-xl font-bold text-green-700">
                  {formatPrice(optimization.recommendedPrice?.optimal || 0, optimization.recommendedPrice?.currency)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-600 mb-1">Maximum</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatPrice(optimization.recommendedPrice?.max || 0, optimization.recommendedPrice?.currency)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h5 className="font-semibold text-gray-900">Market Comparison</h5>
            </div>
            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Current Market Average:</span>
                <span className="font-semibold text-gray-900">
                  {formatPrice(optimization.currentMarketAverage || 0, optimization.recommendedPrice?.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Competitiveness:</span>
                <span
                  className={`font-semibold ${
                    optimization.competitiveness === "high"
                      ? "text-green-600"
                      : optimization.competitiveness === "medium"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {optimization.competitiveness?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {optimization.expectedImpact && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h5 className="font-semibold text-gray-900 mb-3">Expected Impact</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600 mb-1">Bookings</div>
                <div
                  className={`font-semibold ${
                    (optimization.expectedImpact.bookings?.change ?? 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {(optimization.expectedImpact.bookings?.change ?? 0) >= 0 ? "+" : ""}
                  {optimization.expectedImpact.bookings?.change ?? 0} (
                  {(optimization.expectedImpact.bookings?.percentage ?? 0) >= 0 ? "+" : ""}
                  {optimization.expectedImpact.bookings?.percentage ?? 0}%)
                </div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Revenue</div>
                <div
                  className={`font-semibold ${
                    (optimization.expectedImpact.revenue?.change ?? 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {(optimization.expectedImpact.revenue?.change ?? 0) >= 0 ? "+" : ""}
                  {formatPrice(Math.abs(optimization.expectedImpact.revenue?.change ?? 0), optimization.recommendedPrice?.currency)} (
                  {(optimization.expectedImpact.revenue?.percentage ?? 0) >= 0 ? "+" : ""}
                  {optimization.expectedImpact.revenue?.percentage ?? 0}%)
                </div>
              </div>
            </div>
          </div>
          )}

          {optimization.factors && optimization.factors.length > 0 && (
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Key Factors</h5>
              <div className="space-y-2">
                {optimization.factors.map((factor, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm"
                  >
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{factor.factor}</div>
                      <div className="text-gray-600">{factor.recommendation}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Impact: {factor.impact > 0 ? "+" : ""}
                        {factor.impact}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

