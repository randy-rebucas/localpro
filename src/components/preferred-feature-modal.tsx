"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Package,
  GraduationCap,
  CreditCard,
  Car,
  Megaphone,
  Home,
  Star,
  CheckCircle2,
  Sparkles,
  X,
} from "lucide-react";
import { usePreferredFeature, PreferredFeature } from "@/hooks/usePreferredFeature";

interface FeatureOption {
  id: PreferredFeature;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconTextColor: string;
  route: string;
}

const featureOptions: FeatureOption[] = [
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Buy & sell locally",
    icon: <Store className="w-6 h-6" />,
    iconBgColor: "bg-blue-100",
    iconTextColor: "text-blue-600",
    route: "/marketplace",
  },
  {
    id: "academy",
    name: "Academy",
    description: "Learn & grow",
    icon: <GraduationCap className="w-6 h-6" />,
    iconBgColor: "bg-green-100",
    iconTextColor: "text-green-600",
    route: "/academy",
  },
  {
    id: "ads",
    name: "Ads",
    description: "Promote business",
    icon: <Megaphone className="w-6 h-6" />,
    iconBgColor: "bg-teal-100",
    iconTextColor: "text-teal-600",
    route: "/ads",
  },
  {
    id: "supplies",
    name: "Supplies",
    description: "Equipment & tools",
    icon: <Package className="w-6 h-6" />,
    iconBgColor: "bg-orange-100",
    iconTextColor: "text-orange-600",
    route: "/supplies",
  },
  {
    id: "rentals",
    name: "Rentals",
    description: "Rent equipment",
    icon: <Car className="w-6 h-6" />,
    iconBgColor: "bg-red-100",
    iconTextColor: "text-red-600",
    route: "/rentals",
  },
  {
    id: "finance",
    name: "Finance",
    description: "Manage money",
    icon: <CreditCard className="w-6 h-6" />,
    iconBgColor: "bg-purple-100",
    iconTextColor: "text-purple-600",
    route: "/finance",
  },
  {
    id: "facility",
    name: "FacilityCare",
    description: "Maintenance services",
    icon: <Home className="w-6 h-6" />,
    iconBgColor: "bg-emerald-100",
    iconTextColor: "text-emerald-600",
    route: "/facility-care",
  },
  {
    id: "plus",
    name: "LocalPro Plus",
    description: "Premium features",
    icon: <Star className="w-6 h-6" />,
    iconBgColor: "bg-yellow-100",
    iconTextColor: "text-yellow-600",
    route: "/plus",
  },
];

interface PreferredFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PreferredFeatureModal({ isOpen, onClose }: PreferredFeatureModalProps) {
  const { preferredFeature, setPreferredFeature, clearPreferredFeature } = usePreferredFeature();
  const [selectedFeature, setSelectedFeature] = useState<PreferredFeature>(preferredFeature);
  const router = useRouter();

  // Sync selectedFeature with preferredFeature when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFeature(preferredFeature);
    }
  }, [isOpen, preferredFeature]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFeatureSelect = (feature: FeatureOption) => {
    setSelectedFeature(feature.id);
  };

  const handleConfirm = () => {
    // Only allow marketplace to be selected
    if (selectedFeature === "marketplace") {
      setPreferredFeature(selectedFeature);
      onClose();
      // Navigate to the marketplace
      router.push("/marketplace");
    }
  };

  const handleRemove = () => {
    clearPreferredFeature();
    setSelectedFeature(null);
    onClose();
  };

  const currentFeature = preferredFeature
    ? featureOptions.find((f) => f.id === preferredFeature)
    : null;

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      style={{ zIndex: 99999 }}
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-auto flex flex-col relative overflow-hidden"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Preferred Feature</h2>
              <p className="text-xs sm:text-sm text-gray-600 truncate">Choose your preferred feature for quick access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0 ml-2"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Current Selection */}
          {currentFeature && (
            <div className="flex-shrink-0 px-4 sm:px-6 py-4 bg-green-50 border-b border-green-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Current Selection:</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${currentFeature.iconBgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <div className={currentFeature.iconTextColor}>{currentFeature.icon}</div>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{currentFeature.name}</p>
                  <p className="text-xs text-gray-600 truncate">{currentFeature.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Feature Selection Grid */}
          <div className="px-4 sm:px-6 py-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {featureOptions.map((feature) => {
              const isSelected = selectedFeature === feature.id;
              const isEnabled = feature.id === "marketplace";
              return (
                <button
                  key={feature.id}
                  onClick={() => isEnabled && handleFeatureSelect(feature)}
                  disabled={!isEnabled}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all duration-200 overflow-hidden
                    ${
                      isSelected
                        ? "border-green-500 bg-green-50 shadow-md"
                        : isEnabled
                        ? "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                        : "border-gray-100 bg-gray-50 cursor-not-allowed"
                    }
                    ${!isEnabled ? "blur-[0.5px]" : ""}
                  `}
                >
                  {!isEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/30 backdrop-blur-[2px]">
                      <div className="bg-white/90 px-3 py-1 rounded-full border border-gray-300 shadow-sm">
                        <span className="text-xs font-semibold text-gray-700">Coming Soon</span>
                      </div>
                    </div>
                  )}
                  <div className={`flex flex-col items-center text-center space-y-2 w-full ${!isEnabled ? "opacity-60" : ""}`}>
                    <div
                      className={`
                        w-12 h-12 ${feature.iconBgColor} rounded-lg flex items-center justify-center flex-shrink-0
                        ${isSelected ? "scale-110" : ""}
                        transition-transform duration-200
                      `}
                    >
                      <div className={feature.iconTextColor}>{feature.icon}</div>
                    </div>
                    <div className="w-full min-w-0">
                      <h4
                        className={`
                          text-xs sm:text-sm font-semibold mb-1 truncate
                          ${isSelected ? "text-green-700" : "text-gray-900"}
                        `}
                      >
                        {feature.name}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-2">{feature.description}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-20">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleRemove}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors whitespace-nowrap"
              >
                Remove Preference
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 sm:px-6 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={selectedFeature !== "marketplace"}
                  className={`
                    px-4 sm:px-6 py-2 text-sm font-semibold text-white rounded-lg transition-all duration-200 whitespace-nowrap
                    ${
                      selectedFeature === "marketplace"
                        ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg"
                        : "bg-gray-300 cursor-not-allowed"
                    }
                  `}
                >
                  {preferredFeature ? "Update" : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

