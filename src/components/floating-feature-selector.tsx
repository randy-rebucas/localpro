"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { PreferredFeatureModal } from "@/components/preferred-feature-modal";
import { usePreferredFeature } from "@/hooks/usePreferredFeature";

export function FloatingFeatureSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { preferredFeature } = usePreferredFeature();

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9998] w-14 h-14 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        aria-label="Open preferred feature selector"
        title="Preferred Feature"
      >
        <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
        {preferredFeature && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {/* Modal */}
      <PreferredFeatureModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

