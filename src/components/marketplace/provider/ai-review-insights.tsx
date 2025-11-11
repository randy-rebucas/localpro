"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Loader2, TrendingUp, TrendingDown, Star } from "lucide-react";
import { useAIReviewInsights } from "@/hooks/useAIFeatures";

interface AIReviewInsightsProps {
  serviceId?: string;
  providerId?: string;
}

export function AIReviewInsights({ serviceId, providerId }: AIReviewInsightsProps) {
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  interface ReviewInsights {
    summary?: {
      totalReviews?: number;
      averageRating?: number;
      sentimentTrend?: "improving" | "declining" | "stable";
    };
    strengths?: Array<{
      strength: string;
      mentionCount: number;
      impact: "high" | "medium" | "low";
    }>;
    improvements?: Array<{
      area: string;
      mentionCount: number;
      priority: "high" | "medium" | "low";
      suggestions?: string[];
    }>;
    themes?: Array<{
      theme: string;
      sentiment: "positive" | "neutral" | "negative";
      frequency: number;
      examples?: string[];
    }>;
  }
  
  const [insights, setInsights] = useState<ReviewInsights | null>(null);
  const { fetchInsights, loading, error } = useAIReviewInsights();

  useEffect(() => {
    if (serviceId || providerId) {
      fetchInsights({
        serviceId,
        providerId,
        timeframe,
      }).then(setInsights).catch(console.error);
    }
  }, [serviceId, providerId, timeframe, fetchInsights]);

  if (loading && !insights) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Review Insights</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Review Insights</h3>
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as "7d" | "30d" | "90d" | "1y")}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1"
        >
          <option value="7d">7 Days</option>
          <option value="30d">30 Days</option>
          <option value="90d">90 Days</option>
          <option value="1y">1 Year</option>
        </select>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded mb-4">
          {error}
        </div>
      )}

      {insights && (
        <div className="space-y-4">
          {insights.summary && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h5 className="font-semibold text-gray-900 mb-3">Summary</h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 mb-1">Total Reviews</div>
                  <div className="text-lg font-bold text-gray-900">
                    {insights.summary.totalReviews}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Average Rating</div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-lg font-bold text-gray-900">
                      {insights.summary.averageRating?.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Sentiment Trend</div>
                  <div
                    className={`font-semibold ${
                      insights.summary.sentimentTrend === "improving"
                        ? "text-green-600"
                        : insights.summary.sentimentTrend === "declining"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {insights.summary.sentimentTrend?.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {insights.strengths && insights.strengths.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h5 className="font-semibold text-gray-900">Strengths</h5>
              </div>
              <div className="space-y-2">
                {insights.strengths.map((strength, i: number) => (
                  <div
                    key={i}
                    className="flex items-start justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">{strength.strength}</div>
                      <div className="text-xs text-gray-600">
                        Mentioned {strength.mentionCount} times
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        strength.impact === "high"
                          ? "bg-green-200 text-green-800"
                          : strength.impact === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {strength.impact} impact
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insights.improvements && insights.improvements.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <h5 className="font-semibold text-gray-900">Areas for Improvement</h5>
              </div>
              <div className="space-y-2">
                {insights.improvements.map((improvement, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-gray-900">{improvement.area}</div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          improvement.priority === "high"
                            ? "bg-red-200 text-red-800"
                            : improvement.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {improvement.priority} priority
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      Mentioned {improvement.mentionCount} times
                    </div>
                    {improvement.suggestions && improvement.suggestions.length > 0 && (
                      <ul className="text-sm text-gray-700 space-y-1">
                        {improvement.suggestions.map((suggestion: string, j: number) => (
                          <li key={j} className="flex items-start gap-1">
                            <span className="text-red-600 mt-0.5">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {insights.themes && insights.themes.length > 0 && (
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Key Themes</h5>
              <div className="space-y-2">
                {insights.themes.map((theme, i: number) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{theme.theme}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          theme.sentiment === "positive"
                            ? "bg-green-100 text-green-700"
                            : theme.sentiment === "negative"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {theme.sentiment}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      Frequency: {theme.frequency}
                    </div>
                    {theme.examples && theme.examples.length > 0 && (
                      <div className="text-xs text-gray-500 italic">
                        &ldquo;{theme.examples[0]}&rdquo;
                      </div>
                    )}
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

