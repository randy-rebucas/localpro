"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, CheckCircle, AlertCircle, Target } from "lucide-react";
import { useAIListingOptimizer } from "@/hooks/useAIFeatures";

interface ListingOptimization {
  currentScore?: number;
  maxScore?: number;
  seoScore?: {
    current?: number;
    potential?: number;
    keywords?: string[];
  };
  visibilityScore?: {
    current?: number;
    potential?: number;
    factors?: string[];
  };
  improvements?: Array<{
    area: string;
    impact: "high" | "medium" | "low";
    current: string;
    suggested: string;
    reason: string;
  }>;
}

interface AIListingOptimizerProps {
  serviceId: string;
  onOptimizationComplete?: (optimization: ListingOptimization) => void;
}

export function AIListingOptimizer({
  serviceId,
  onOptimizationComplete,
}: AIListingOptimizerProps) {
  const [optimization, setOptimization] = useState<ListingOptimization | null>(null);
  const { optimize, loading, error } = useAIListingOptimizer();

  const handleOptimize = async () => {
    try {
      const result = await optimize({ serviceId });
      setOptimization(result);
      onOptimizationComplete?.(result);
    } catch (err) {
      console.error("Listing optimization failed", err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Listing Optimizer</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Get AI-powered recommendations to improve your service listing&apos;s visibility and performance
      </p>

      {!optimization ? (
        <div>
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
                <Target className="w-4 h-4" />
                <span>Optimize Listing</span>
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Optimization Results</h4>
            <button
              onClick={() => setOptimization(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Re-analyze
            </button>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-600" />
              <h5 className="font-semibold text-gray-900">Overall Score</h5>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-sm text-gray-600">Current</div>
                <div className="text-2xl font-bold text-gray-900">
                  {optimization.currentScore?.toFixed(0) || 0}
                </div>
              </div>
              <div className="text-gray-400">/</div>
              <div>
                <div className="text-sm text-gray-600">Potential</div>
                <div className="text-2xl font-bold text-green-600">
                  {optimization.maxScore?.toFixed(0) || 100}
                </div>
              </div>
            </div>
          </div>

          {optimization.seoScore && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h5 className="font-semibold text-gray-900 mb-2">SEO Score</h5>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Current</span>
                <span className="font-semibold text-gray-900">
                  {optimization.seoScore.current?.toFixed(0)}/100
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Potential</span>
                <span className="font-semibold text-green-600">
                  {optimization.seoScore.potential?.toFixed(0)}/100
                </span>
              </div>
              {optimization.seoScore.keywords && optimization.seoScore.keywords.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-600 mb-1">Recommended Keywords</div>
                  <div className="flex flex-wrap gap-1">
                    {optimization.seoScore.keywords.map((keyword: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-green-200 text-green-800 rounded text-xs"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {optimization.improvements && optimization.improvements.length > 0 && (
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Recommended Improvements</h5>
              <div className="space-y-3">
                {optimization.improvements.map((improvement, i: number) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {improvement.impact === "high" ? (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                        <span className="font-semibold text-gray-900">{improvement.area}</span>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          improvement.impact === "high"
                            ? "bg-red-100 text-red-700"
                            : improvement.impact === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {improvement.impact} impact
                      </span>
                    </div>
                    <div className="ml-7 space-y-2 text-sm">
                      <div>
                        <div className="text-gray-600 mb-1">Current:</div>
                        <div className="text-gray-900 bg-white p-2 rounded border">
                          {improvement.current}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Suggested:</div>
                        <div className="text-gray-900 bg-green-50 p-2 rounded border border-green-200">
                          {improvement.suggested}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 italic">{improvement.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {optimization.visibilityScore && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h5 className="font-semibold text-gray-900 mb-2">Visibility Score</h5>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Current</span>
                <span className="font-semibold text-gray-900">
                  {optimization.visibilityScore.current?.toFixed(0)}/100
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Potential</span>
                <span className="font-semibold text-purple-600">
                  {optimization.visibilityScore.potential?.toFixed(0)}/100
                </span>
              </div>
              {optimization.visibilityScore.factors && optimization.visibilityScore.factors.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-600 mb-1">Key Factors</div>
                  <ul className="text-xs text-gray-700 space-y-1">
                    {optimization.visibilityScore.factors.map((factor: string, i: number) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-purple-600 mt-0.5">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

