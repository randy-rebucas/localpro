"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X, CheckCircle2 } from "lucide-react";
import { usePreferredFeature, PreferredFeature } from "@/hooks/usePreferredFeature";
import { PACKAGE_REGISTRY } from "@/shared/config/package-registry";

// Feature route to ID mapping
const routeToFeatureId: Record<string, PreferredFeature> = Object.values(PACKAGE_REGISTRY).reduce(
  (acc, pkg) => {
    acc[pkg.route] = pkg.id;
    return acc;
  },
  {} as Record<string, PreferredFeature>
);

// Feature names for display
const featureNames: Record<Exclude<PreferredFeature, null>, string> = {
  marketplace: PACKAGE_REGISTRY.marketplace.label,
  academy: PACKAGE_REGISTRY.academy.label,
  ads: PACKAGE_REGISTRY.ads.label,
  supplies: PACKAGE_REGISTRY.supplies.label,
  rentals: PACKAGE_REGISTRY.rentals.label,
  finance: PACKAGE_REGISTRY.finance.label,
  facility: PACKAGE_REGISTRY.facility.label,
  plus: PACKAGE_REGISTRY.plus.label,
  jobs: PACKAGE_REGISTRY.jobs.label,
  referrals: PACKAGE_REGISTRY.referrals.label,
};

export function PreferredFeaturePrompt() {
  const pathname = usePathname();
  const { setPreferredFeature, hasPreferredFeature, isLoading } = usePreferredFeature();
  const [showPrompt, setShowPrompt] = useState(false);
  const [pendingFeature, setPendingFeature] = useState<PreferredFeature | null>(null);

  const handleDismiss = useCallback(() => {
    if (pendingFeature) {
      sessionStorage.setItem(`preferred_prompt_${pendingFeature}`, "true");
      setShowPrompt(false);
      setPendingFeature(null);
    }
  }, [pendingFeature]);

  // Lock body scroll when prompt is shown
  useEffect(() => {
    if (showPrompt) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPrompt]);

  // Handle escape key
  useEffect(() => {
    if (!showPrompt) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showPrompt, handleDismiss]);

  useEffect(() => {
    // Only show prompt if:
    // 1. Not loading
    // 2. No preferred feature is set
    // 3. User navigated to a feature route
    // 4. Haven't shown prompt for this route yet
    if (isLoading || hasPreferredFeature || showPrompt) {
      return;
    }

    const featureId = routeToFeatureId[pathname];
    if (featureId) {
      // Check if we've already prompted for this feature in this session
      const promptShown = sessionStorage.getItem(`preferred_prompt_${featureId}`);
      if (!promptShown) {
        // Small delay to ensure page is loaded
        const timer = setTimeout(() => {
          setPendingFeature(featureId);
          setShowPrompt(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [pathname, hasPreferredFeature, isLoading, showPrompt]);

  const handleSetAsPreferred = () => {
    if (pendingFeature) {
      setPreferredFeature(pendingFeature);
      sessionStorage.setItem(`preferred_prompt_${pendingFeature}`, "true");
      setShowPrompt(false);
      setPendingFeature(null);
    }
  };

  if (!showPrompt || !pendingFeature) {
    return null;
  }

  const featureName = featureNames[pendingFeature];

  return (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Set {featureName} as Your Preferred Feature?
          </h3>
          
          <p className="text-sm text-gray-600 mb-6">
            Would you like to set <span className="font-semibold text-gray-900">{featureName}</span> as your preferred feature? 
            This will help us redirect you here when you open the app.
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Not Now
            </button>
            <button
              onClick={handleSetAsPreferred}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent hover:from-accent hover:to-green-800 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Yes, Set as Preferred
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

