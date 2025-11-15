"use client";

import React from "react";
import {
  LazyAIServiceRecommendations,
  LazyAIPriceEstimator,
  LazyAIServiceMatcher
} from "@/lib/lazy-components";

interface AIFeaturesSectionProps {
  showAIFeatures: {
    recommendations: boolean;
    priceEstimator: boolean;
    serviceMatcher: boolean;
  };
  location: string;
  lat?: number;
  lng?: number;
}

export function AIFeaturesSection({
  showAIFeatures,
  location,
  lat,
  lng,
}: AIFeaturesSectionProps) {
  return (
    <>
      {/* AI Service Recommendations */}
      {showAIFeatures.recommendations && (
        <div className="mb-6">
          <LazyAIServiceRecommendations
            location={location}
            lat={lat}
            lng={lng}
            limit={5}
          />
        </div>
      )}

      {/* AI Service Matcher */}
      {showAIFeatures.serviceMatcher && (
        <div className="mb-6">
          <LazyAIServiceMatcher
            location={location}
            lat={lat}
            lng={lng}
          />
        </div>
      )}

      {/* Floating AI Price Estimator */}
      {showAIFeatures.priceEstimator && (
        <div className="fixed bottom-6 left-6 z-[9999] max-w-sm w-96">
          <LazyAIPriceEstimator />
        </div>
      )}
    </>
  );
}

