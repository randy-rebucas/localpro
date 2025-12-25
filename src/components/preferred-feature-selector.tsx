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
  Briefcase,
  Star,
  Gift,
  CheckCircle2,
  Sparkles,
  X,
  Edit2,
  ArrowRight,
} from "lucide-react";
import { usePreferredFeature, PreferredFeature } from "@/hooks/usePreferredFeature";
import { PACKAGE_REGISTRY } from "@/shared/config/package-registry";

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
    route: PACKAGE_REGISTRY.marketplace.route,
  },
  {
    id: "academy",
    name: "Academy",
    description: "Learn & grow",
    icon: <GraduationCap className="w-6 h-6" />,
    iconBgColor: "bg-green-100",
    iconTextColor: "text-green-600",
    route: PACKAGE_REGISTRY.academy.route,
  },
  {
    id: "ads",
    name: "Ads",
    description: "Promote business",
    icon: <Megaphone className="w-6 h-6" />,
    iconBgColor: "bg-teal-100",
    iconTextColor: "text-teal-600",
    route: PACKAGE_REGISTRY.ads.route,
  },
  {
    id: "supplies",
    name: "Supplies",
    description: "Equipment & tools",
    icon: <Package className="w-6 h-6" />,
    iconBgColor: "bg-orange-100",
    iconTextColor: "text-orange-600",
    route: PACKAGE_REGISTRY.supplies.route,
  },
  {
    id: "rentals",
    name: "Rentals",
    description: "Rent equipment",
    icon: <Car className="w-6 h-6" />,
    iconBgColor: "bg-red-100",
    iconTextColor: "text-red-600",
    route: PACKAGE_REGISTRY.rentals.route,
  },
  {
    id: "finance",
    name: "Finance",
    description: "Manage money",
    icon: <CreditCard className="w-6 h-6" />,
    iconBgColor: "bg-purple-100",
    iconTextColor: "text-purple-600",
    route: PACKAGE_REGISTRY.finance.route,
  },
  {
    id: "facility",
    name: "FacilityCare",
    description: "Maintenance services",
    icon: <Home className="w-6 h-6" />,
    iconBgColor: "bg-emerald-100",
    iconTextColor: "text-emerald-600",
    route: PACKAGE_REGISTRY.facility.route,
  },
  {
    id: "jobs",
    name: "Jobs",
    description: "Find work opportunities",
    icon: <Briefcase className="w-6 h-6" />,
    iconBgColor: "bg-indigo-100",
    iconTextColor: "text-indigo-600",
    route: PACKAGE_REGISTRY.jobs.route,
  },
  {
    id: "plus",
    name: "LocalPro Plus",
    description: "Premium features",
    icon: <Star className="w-6 h-6" />,
    iconBgColor: "bg-yellow-100",
    iconTextColor: "text-yellow-600",
    route: PACKAGE_REGISTRY.plus.route,
  },
  {
    id: "referrals",
    name: "Referrals",
    description: "Earn rewards",
    icon: <Gift className="w-6 h-6" />,
    iconBgColor: "bg-pink-100",
    iconTextColor: "text-pink-600",
    route: PACKAGE_REGISTRY.referrals.route,
  },
];

export function PreferredFeatureSelector() {
  const { preferredFeature, setPreferredFeature, clearPreferredFeature, hasPreferredFeature } = usePreferredFeature();
  const [selectedFeature, setSelectedFeature] = useState<PreferredFeature>(preferredFeature);
  const [isChanging, setIsChanging] = useState(false);
  const router = useRouter();

  // Sync selectedFeature with preferredFeature when it changes
  useEffect(() => {
    setSelectedFeature(preferredFeature);
  }, [preferredFeature]);

  const handleFeatureSelect = (feature: FeatureOption) => {
    setSelectedFeature(feature.id);
  };

  const handleConfirm = () => {
    if (selectedFeature) {
      setPreferredFeature(selectedFeature);
      setIsChanging(false);
      // Find the route for the selected feature
      const feature = featureOptions.find((f) => f.id === selectedFeature);
      if (feature) {
        router.push(feature.route);
      }
    }
  };

  const handleChange = () => {
    setIsChanging(true);
    setSelectedFeature(preferredFeature);
  };

  const handleRemove = () => {
    clearPreferredFeature();
    setIsChanging(false);
    setSelectedFeature(null);
  };

  const handleCancelChange = () => {
    setIsChanging(false);
    setSelectedFeature(preferredFeature);
  };

  // Get current feature details
  const currentFeature = preferredFeature
    ? featureOptions.find((f) => f.id === preferredFeature)
    : null;

  // Show compact card when feature is selected and not changing
  if (hasPreferredFeature && currentFeature && !isChanging) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-md border border-green-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={`w-12 h-12 ${currentFeature.iconBgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <div className={currentFeature.iconTextColor}>{currentFeature.icon}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-green-600 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-gray-900">Preferred Feature</h3>
              </div>
              <p className="text-base font-bold text-gray-900 truncate">{currentFeature.name}</p>
              <p className="text-xs text-gray-600 mt-0.5">{currentFeature.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
            <button
              onClick={() => router.push(currentFeature.route)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex-1 sm:flex-initial"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="sm:inline">Go</span>
            </button>
            <button
              onClick={handleChange}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors flex-1 sm:flex-initial"
              title="Change preferred feature"
            >
              <Edit2 className="w-4 h-4" />
              <span className="sm:inline">Change</span>
            </button>
            <button
              onClick={handleRemove}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-red-50 border border-gray-300 hover:border-red-300 rounded-lg transition-colors flex-1 sm:flex-initial"
              title="Remove preferred feature"
            >
              <X className="w-4 h-4" />
              <span className="sm:inline">Remove</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 lg:p-8 mb-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {isChanging ? "Change Your Preferred Feature" : "Select Your Preferred Feature"}
          </h3>
          <p className="text-sm text-gray-600">
            {isChanging
              ? "Select a different feature or remove your current preference."
              : "Choose your preferred feature to get quick access when you open the app. You can change this anytime."}
          </p>
        </div>
      </div>

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
              <div className={`flex flex-col items-center text-center space-y-2 ${!isEnabled ? "opacity-60" : ""}`}>
                <div
                  className={`
                    w-12 h-12 ${feature.iconBgColor} rounded-lg flex items-center justify-center
                    ${isSelected ? "scale-110" : ""}
                    transition-transform duration-200
                  `}
                >
                  <div className={feature.iconTextColor}>{feature.icon}</div>
                </div>
                <div>
                  <h4
                    className={`
                      text-sm font-semibold mb-1
                      ${isSelected ? "text-green-700" : "text-gray-900"}
                    `}
                  >
                    {feature.name}
                  </h4>
                  <p className="text-xs text-gray-500">{feature.description}</p>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 z-20">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        {isChanging && (
          <button
            onClick={handleCancelChange}
            className="px-6 py-2.5 rounded-lg font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-all duration-200"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={!selectedFeature}
          className={`
            px-6 py-2.5 rounded-lg font-semibold text-white
            transition-all duration-200
            ${
              selectedFeature
                ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg"
                : "bg-gray-300 cursor-not-allowed"
            }
          `}
        >
          {isChanging ? "Update Selection" : "Confirm Selection"}
        </button>
      </div>
    </div>
  );
}

