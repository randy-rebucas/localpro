"use client";

import React, { useEffect, useState } from "react";
import { MessageSquare, Sparkles, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useAIReviewSentiment } from "@/hooks/useAIFeatures";

interface AIReviewSentimentProps {
  serviceId: string;
  reviews?: Array<{
    text: string;
    rating: number;
    author?: string;
  }>;
  compact?: boolean;
}

export function AIReviewSentiment({
  serviceId,
  reviews,
  compact = false,
}: AIReviewSentimentProps) {
  interface ReviewSentiment {
    overallSentiment?: "positive" | "neutral" | "negative";
    sentimentScore?: number;
    summary?: string;
    themes?: Array<{
      theme: string;
      sentiment: "positive" | "neutral" | "negative";
      mentions: number;
      examples: string[];
    }>;
    strengths?: string[];
    weaknesses?: string[];
  }
  
  const [sentiment, setSentiment] = useState<ReviewSentiment | null>(null);
  const [showDetails, setShowDetails] = useState(!compact);
  const { analyze, loading } = useAIReviewSentiment();

  useEffect(() => {
    if (serviceId) {
      analyze({
        serviceId,
        reviews,
      }).then(setSentiment).catch(console.error);
    }
  }, [serviceId, reviews, analyze]);

  if (loading && !sentiment) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-gray-700">Analyzing reviews...</span>
        </div>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  if (!sentiment) return null;

  const sentimentColor =
    sentiment.overallSentiment === "positive"
      ? "text-green-600"
      : sentiment.overallSentiment === "negative"
      ? "text-red-600"
      : "text-gray-600";

  const sentimentBg =
    sentiment.overallSentiment === "positive"
      ? "bg-green-50 border-green-200"
      : sentiment.overallSentiment === "negative"
      ? "bg-red-50 border-red-200"
      : "bg-gray-50 border-gray-200";

  if (compact) {
    return (
      <div className={`rounded-lg p-3 border ${sentimentBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className={`w-4 h-4 ${sentimentColor}`} />
            <span className="text-sm font-medium text-gray-700">Review Analysis</span>
          </div>
          <span className={`text-sm font-semibold ${sentimentColor}`}>
            {sentiment.overallSentiment?.toUpperCase() || "UNKNOWN"}
          </span>
        </div>
        {sentiment.summary && (
          <p className="text-xs text-gray-600 mt-2 line-clamp-2">{sentiment.summary}</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Review Analysis</h3>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </button>
      </div>

      <div className={`rounded-lg p-4 border mb-4 ${sentimentBg}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Sentiment</span>
          <span className={`text-lg font-bold ${sentimentColor}`}>
            {sentiment.overallSentiment?.toUpperCase() || "UNKNOWN"}
          </span>
        </div>
        <div className="text-xs text-gray-600">
          Sentiment Score: {Math.round((sentiment.sentimentScore || 0) * 100)}%
        </div>
        {sentiment.summary && (
          <p className="text-sm text-gray-700 mt-2">{sentiment.summary}</p>
        )}
      </div>

      {showDetails && (
        <div className="space-y-4">
          {sentiment.strengths && sentiment.strengths.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <h4 className="font-semibold text-gray-900">Strengths</h4>
              </div>
              <ul className="space-y-1">
                {sentiment.strengths.map((strength: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sentiment.weaknesses && sentiment.weaknesses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <h4 className="font-semibold text-gray-900">Areas for Improvement</h4>
              </div>
              <ul className="space-y-1">
                {sentiment.weaknesses.map((weakness: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sentiment.themes && sentiment.themes.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Key Themes</h4>
              <div className="space-y-2">
                {sentiment.themes.map((theme, i: number) => (
                  <div key={i} className="border border-gray-200 rounded p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{theme.theme}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
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
                    <div className="text-xs text-gray-600">
                      Mentioned {theme.mentions} {theme.mentions === 1 ? "time" : "times"}
                    </div>
                    {theme.examples && theme.examples.length > 0 && (
                      <div className="mt-1 text-xs text-gray-500 italic">
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

