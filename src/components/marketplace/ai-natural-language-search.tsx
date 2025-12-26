"use client";

import React, { useState, useCallback } from "react";
import { Search, Sparkles, Loader2, X, TrendingUp, Info } from "lucide-react";
import { useAINaturalLanguageSearch } from "@/hooks/useAIFeatures";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";
import { logger } from "@/lib/logger";

interface SearchFilters {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  location?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  date?: string;
  time?: string;
}

interface AINaturalLanguageSearchProps {
  onSearchResult: (filters: SearchFilters) => void;
  location?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

export function AINaturalLanguageSearch({
  onSearchResult,
  location,
  lat,
  lng,
  radius,
}: AINaturalLanguageSearchProps) {
  const { settings: appSettings } = useAppSettings();
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  interface SearchResult {
    data?: {
      aiAnalysis?: {
        priceRange?: { min: number; max: number };
        estimatedPrice?: number;
        currency?: string;
        confidence?: number;
        factors?: string[];
      };
      count?: number;
    };
    count?: number;
    interpretedQuery?: string;
  }
  
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const { search, loading, error } = useAINaturalLanguageSearch();

  const defaultCurrency = getDefaultCurrency(appSettings);
  const formatPrice = (amount: number, currency?: string) => {
    return formatCurrency(amount, currency || defaultCurrency, { appSettings });
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    try {
      const result = await search({
        query: query.trim(),
        location,
        lat,
        lng,
        radius,
      });

      setSearchResult(result);

      if (result.filters) {
        onSearchResult(result.filters);
      }

      // Show interpreted query
      if (result.interpretedQuery) {
        logger.debug("AI interpreted query", { interpreted: result.interpretedQuery });
      }
    } catch (err) {
      logger.error("Natural language search failed", err instanceof Error ? err : new Error(String(err)));
      setSearchResult(null);
    }
  }, [query, location, lat, lng, radius, search, onSearchResult]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleSearch();
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Try: 'I need someone to fix my leaky faucet this weekend' or 'affordable house cleaning near me'"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm"
            disabled={loading}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>AI Search</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* AI Analysis Results */}
      {searchResult?.data?.aiAnalysis && !error && (
        <div className="mt-4 p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg border border-accent/20">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Info className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">AI Analysis</h4>
                {(searchResult.data?.count !== undefined || searchResult.count !== undefined) && (
                  <span className="text-xs text-gray-600 bg-white px-2 py-0.5 rounded-full">
                    {searchResult.data?.count ?? searchResult.count} {(searchResult.data?.count ?? searchResult.count) === 1 ? 'service' : 'services'} found
                  </span>
                )}
              </div>
              
              {searchResult.data.aiAnalysis.priceRange && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-white rounded p-2 border border-accent/20">
                    <div className="text-xs text-gray-600 mb-1">Estimated Price Range</div>
                    <div className="text-sm font-semibold text-accent">
                      {formatPrice(searchResult.data.aiAnalysis.priceRange.min, searchResult.data.aiAnalysis.currency)} - {formatPrice(searchResult.data.aiAnalysis.priceRange.max, searchResult.data.aiAnalysis.currency)}
                    </div>
                  </div>
                  {searchResult.data.aiAnalysis.estimatedPrice && (
                    <div className="bg-white rounded p-2 border border-primary/20">
                      <div className="text-xs text-gray-600 mb-1">Average Price</div>
                      <div className="text-sm font-semibold text-primary">
                        {formatPrice(searchResult.data.aiAnalysis.estimatedPrice, searchResult.data.aiAnalysis.currency)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {searchResult.data.aiAnalysis.confidence !== undefined && (
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-xs text-gray-600">
                    Confidence: <span className="font-semibold">{Math.round(searchResult.data.aiAnalysis.confidence * 100)}%</span>
                  </span>
                </div>
              )}

              {searchResult.data.aiAnalysis.factors && searchResult.data.aiAnalysis.factors.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-600 mb-1">Key Factors:</div>
                  <div className="flex flex-wrap gap-1">
                    {searchResult.data.aiAnalysis.factors.map((factor: string, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {searchResult.interpretedQuery && searchResult.interpretedQuery !== query.trim() && (
                <div className="mt-2 pt-2 border-t border-accent/20">
                  <div className="text-xs text-gray-600 mb-1">Interpreted as:</div>
                  <div className="text-xs text-gray-800 italic">&ldquo;{searchResult.interpretedQuery}&rdquo;</div>
                </div>
              )}
            </div>
            <button
              onClick={() => setSearchResult(null)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="mt-3 p-3 bg-primary/5 rounded-lg text-sm text-primary">
          <p className="font-medium mb-1">💡 AI Search Tips:</p>
          <ul className="list-disc list-inside space-y-1 text-primary">
            <li>Describe what you need in natural language</li>
            <li>Mention your location or &ldquo;near me&rdquo;</li>
            <li>Include budget preferences like &ldquo;affordable&rdquo; or &ldquo;budget-friendly&rdquo;</li>
            <li>Specify timing like &ldquo;this weekend&rdquo; or &ldquo;urgent&rdquo;</li>
            <li>Add details like &ldquo;3-bedroom house&rdquo; or &ldquo;commercial space&rdquo;</li>
          </ul>
        </div>
      )}

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 text-xs text-gray-500 hover:text-gray-700"
      >
        {isExpanded ? "Hide tips" : "Show AI search tips"}
      </button>
    </div>
  );
}

