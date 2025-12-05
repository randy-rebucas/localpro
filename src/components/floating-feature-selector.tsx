"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { LazyPreferredFeatureModal } from "@/lib/lazy-components";
import { usePreferredFeature } from "@/hooks/usePreferredFeature";

export function FloatingFeatureSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { preferredFeature } = usePreferredFeature();

  return (
    <>
      {/* Floating Toggle Button - positioned above live chat button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 sm:right-6 z-[9990] w-14 h-14 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        aria-label="Open preferred feature selector"
        title="Preferred Feature"
      >
        <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
        {preferredFeature && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {/* Modal - Lazy loaded for better performance */}
      {isOpen && (
        <LazyPreferredFeatureModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

