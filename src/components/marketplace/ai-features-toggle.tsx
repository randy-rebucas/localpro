"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { PreferredFeatureSelector } from "@/components/preferred-feature-selector";

interface AIFeaturesState {
  recommendations: boolean;
  priceEstimator: boolean;
  serviceMatcher: boolean;
}

interface AIFeaturesToggleProps {
  showAIFeatures: AIFeaturesState;
  onToggleAIFeatures: (features: AIFeaturesState) => void;
  preferredFeatureSelectorOpen: boolean;
  onTogglePreferredFeatureSelector: (open: boolean) => void;
}

export function AIFeaturesToggle({
  showAIFeatures,
  onToggleAIFeatures,
  preferredFeatureSelectorOpen,
  onTogglePreferredFeatureSelector,
}: AIFeaturesToggleProps) {
  return (
    <>
      {/* Floating AI Features Toggle */}
      <div className="hidden lg:flex fixed bottom-6 right-6 z-[9998] flex-col gap-3">
        <button
          onClick={() => onToggleAIFeatures({ ...showAIFeatures, priceEstimator: !showAIFeatures.priceEstimator })}
          className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          aria-label="Toggle AI Price Estimator"
          title="AI Price Estimator"
        >
          <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={() => onToggleAIFeatures({ ...showAIFeatures, serviceMatcher: !showAIFeatures.serviceMatcher })}
          className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          aria-label="Toggle AI Service Matcher"
          title="AI Service Matcher"
        >
          <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={() => onTogglePreferredFeatureSelector(!preferredFeatureSelectorOpen)}
          className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          aria-label="Toggle preferred feature selector"
          title="Preferred Feature"
        >
          {preferredFeatureSelectorOpen ? (
            <span className="text-white text-xl">×</span>
          ) : (
            <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      {/* Floating Preferred Feature Selector */}
      {preferredFeatureSelectorOpen && (
        <div className="hidden lg:block fixed right-6 top-24 z-[9997] max-w-sm w-80 transition-all duration-300 ease-in-out">
          <PreferredFeatureSelector />
        </div>
      )}
    </>
  );
}

