"use client";

import React, { useState } from "react";
import { Calculator, Sparkles, Loader2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useAIPriceEstimator } from "@/hooks/useAIFeatures";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";

import type { PriceEstimate, PriceEstimateParams } from "@/lib/ai-utils";

interface AIPriceEstimatorProps {
  onEstimateComplete?: (estimate: PriceEstimate) => void;
}

export function AIPriceEstimator({ onEstimateComplete }: AIPriceEstimatorProps) {
  const { settings: appSettings } = useAppSettings();
  const [formData, setFormData] = useState({
    serviceType: "",
    category: "",
    subcategory: "",
    location: "",
    duration: "",
    propertySize: "", // Keep for backward compatibility
    propertyType: "residential",
    complexity: "standard" as "simple" | "moderate" | "complex" | "standard",
    additionalInfo: "", // New format
    additionalRequirements: [] as string[], // Legacy format
  });
  const [estimate, setEstimate] = useState<PriceEstimate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { estimate: estimatePrice, loading, error } = useAIPriceEstimator();

  const defaultCurrency = getDefaultCurrency(appSettings);
  const formatPrice = (amount: number, currency?: string) => {
    return formatCurrency(amount, currency || defaultCurrency, { appSettings });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serviceType || !formData.category) return;

    try {
      // Build payload matching API structure
      const payload: PriceEstimateParams = {
        serviceType: formData.serviceType,
        category: formData.category,
      };
      
      // Add optional fields only if they have values
      if (formData.subcategory) payload.subcategory = formData.subcategory;
      if (formData.location) payload.location = formData.location;
      if (formData.duration) payload.duration = parseFloat(formData.duration);
      if (formData.propertySize) payload.propertySize = parseFloat(formData.propertySize); // Legacy support
      if (formData.propertyType) payload.propertyType = formData.propertyType;
      if (formData.complexity) payload.complexity = formData.complexity;
      
      // Use additionalInfo if provided, otherwise fall back to additionalRequirements
      if (formData.additionalInfo) {
        payload.additionalInfo = formData.additionalInfo;
      } else if (formData.additionalRequirements.length > 0) {
        payload.additionalRequirements = formData.additionalRequirements;
      }
      
      const result = await estimatePrice(payload);
      setEstimate(result);
      onEstimateComplete?.(result);
    } catch (err) {
      console.error("Price estimation failed", err);
    }
  };

  if (!showForm && !estimate) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Price Estimator</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Get an instant price estimate for your service needs
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Get Price Estimate
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Price Estimator</h3>
        </div>
        {estimate && (
          <button
            onClick={() => {
              setEstimate(null);
              setShowForm(false);
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Reset
          </button>
        )}
      </div>

      {!estimate ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Type *
            </label>
            <input
              type="text"
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              placeholder="e.g., House cleaning, Plumbing repair"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: "" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select category</option>
              <option value="cleaning">Cleaning</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="moving">Moving</option>
              <option value="landscaping">Landscaping</option>
              <option value="painting">Painting</option>
              <option value="other">Other</option>
            </select>
          </div>

          {formData.category === "cleaning" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory
              </label>
              <select
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select subcategory (optional)</option>
                <option value="residential_cleaning">Residential Cleaning</option>
                <option value="office_cleaning">Office Cleaning</option>
                <option value="deep_cleaning">Deep Cleaning</option>
                <option value="move_in_cleaning">Move-in Cleaning</option>
                <option value="move_out_cleaning">Move-out Cleaning</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (hours)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 3"
                min="1"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complexity
              </label>
              <select
                value={formData.complexity}
                onChange={(e) =>
                  setFormData({ ...formData, complexity: e.target.value as "simple" | "moderate" | "complex" | "standard" })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="standard">Standard</option>
                <option value="simple">Simple</option>
                <option value="moderate">Moderate</option>
                <option value="complex">Complex</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property Size (sq ft) - Optional
            </label>
            <input
              type="number"
              value={formData.propertySize}
              onChange={(e) => setFormData({ ...formData, propertySize: e.target.value })}
              placeholder="e.g., 1500"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City or address (e.g., Manila)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Information
            </label>
            <textarea
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
              placeholder="e.g., 3 bedroom house, regular cleaning"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[80px]"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide any additional details about your service needs
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Estimating...</span>
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4" />
                <span>Get Estimate</span>
              </>
            )}
          </button>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-gray-900">Estimated Price Range</h4>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {formatPrice(estimate.estimatedPrice?.min || 0, estimate.estimatedPrice?.currency)} - {formatPrice(estimate.estimatedPrice?.max || 0, estimate.estimatedPrice?.currency)}
            </div>
            <div className="text-sm text-gray-600">
              Average: {formatPrice(estimate.estimatedPrice?.average || 0, estimate.estimatedPrice?.currency)}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="text-gray-500">
                Confidence: <span className="font-semibold">{Math.round((estimate.confidence || 0) * 100)}%</span>
              </span>
              {estimate.aiConfidence && (
                <span className={`px-2 py-0.5 rounded-full font-medium ${
                  estimate.aiConfidence === 'high' 
                    ? 'bg-green-100 text-green-700' 
                    : estimate.aiConfidence === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {estimate.aiConfidence.toUpperCase()} Confidence
                </span>
              )}
            </div>
          </div>

          {estimate.factors && estimate.factors.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Price Factors</h4>
              <div className="space-y-2">
                {estimate.factors.map((factor, i: number) => {
                  // Handle both string array format and object format
                  const factorName = typeof factor === 'string' ? factor : factor.factor;
                  const factorDesc = typeof factor === 'string' ? null : factor.description;
                  const factorImpact = typeof factor === 'string' ? null : factor.impact;
                  
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm"
                    >
                      {factorImpact === "positive" ? (
                        <TrendingDown className="w-4 h-4 text-green-600 mt-0.5" />
                      ) : factorImpact === "negative" ? (
                        <TrendingUp className="w-4 h-4 text-red-600 mt-0.5" />
                      ) : (
                        <div className="w-4 h-4 mt-0.5" />
                      )}
                      <div>
                        {factorDesc ? (
                          <>
                            <span className="font-medium">{factorName}:</span>{" "}
                            <span className="text-gray-600">{factorDesc}</span>
                          </>
                        ) : (
                          <span className="text-gray-700">{factorName}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(estimate.marketComparison || estimate.marketData) && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Market Comparison</h4>
              {estimate.marketComparison ? (
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-blue-50 p-2 rounded text-center">
                    <div className="text-xs text-gray-600">25th Percentile</div>
                    <div className="font-semibold">
                      {formatPrice(estimate.marketComparison.percentile25 || 0, estimate.estimatedPrice?.currency)}
                    </div>
                  </div>
                  <div className="bg-green-50 p-2 rounded text-center">
                    <div className="text-xs text-gray-600">50th Percentile</div>
                    <div className="font-semibold">
                      {formatPrice(estimate.marketComparison.percentile50 || 0, estimate.estimatedPrice?.currency)}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded text-center">
                    <div className="text-xs text-gray-600">75th Percentile</div>
                    <div className="font-semibold">
                      {formatPrice(estimate.marketComparison.percentile75 || 0, estimate.estimatedPrice?.currency)}
                    </div>
                  </div>
                </div>
              ) : estimate.marketData && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  {estimate.marketData.averagePrice !== null && estimate.marketData.averagePrice !== undefined ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Market Average:</span>
                        <span className="font-semibold text-gray-900">
                          {formatPrice(estimate.marketData.averagePrice, estimate.estimatedPrice?.currency)}
                        </span>
                      </div>
                      {estimate.marketData.priceRange && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Market Range:</span>
                          <span className="font-semibold text-gray-900">
                            {formatPrice(estimate.marketData.priceRange.min, estimate.estimatedPrice?.currency)} - {formatPrice(estimate.marketData.priceRange.max, estimate.estimatedPrice?.currency)}
                          </span>
                        </div>
                      )}
                      {estimate.marketData.sampleSize !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sample Size:</span>
                          <span className="font-semibold text-gray-900">{estimate.marketData.sampleSize} services</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-2">
                      <p className="text-sm">Insufficient market data available</p>
                      <p className="text-xs mt-1">Sample size: {estimate.marketData.sampleSize || 0} services</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

