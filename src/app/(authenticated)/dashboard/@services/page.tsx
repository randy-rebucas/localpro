"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  Package, 
  GraduationCap, 
  Car, 
  Star, 
  Home, 
  Megaphone, 
  DollarSign,
  CheckCircle2,
  XCircle,
  Users,
  Briefcase,
  Wallet,
  ShoppingCart,
  Building,
  Clock,
  ArrowRight,
  LucideIcon
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";

interface Feature {
  key: string;
  name: string;
  enabled: boolean;
  icon: React.ReactNode;
  color: string;
  description?: string;
  services?: string[];
  route?: string;
  category?: string;
  users?: number;
  lastUpdated?: string;
  featured?: boolean;
}

// Icon mapping function - maps icon names to Lucide icons
const getIconComponent = (iconName?: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    Shield,
    Package,
    GraduationCap,
    Car,
    Star,
    Home,
    Megaphone,
    DollarSign,
    Users,
    Briefcase,
    Wallet,
    ShoppingCart,
    Building,
  };
  
  if (iconName && iconMap[iconName]) {
    return iconMap[iconName];
  }
  return Shield; // Default icon
};

// Icon and color mapping for features
const featureConfig: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  marketplace: {
    name: "Marketplace",
    icon: <Shield className="w-6 h-6" />,
    color: "bg-gray-100 text-gray-700"
  },
  supplies: {
    name: "Supplies",
    icon: <Package className="w-6 h-6" />,
    color: "bg-amber-100 text-amber-700"
  },
  academy: {
    name: "Academy",
    icon: <GraduationCap className="w-6 h-6" />,
    color: "bg-green-100 text-green-700"
  },
  rentals: {
    name: "Rentals",
    icon: <Car className="w-6 h-6" />,
    color: "bg-blue-100 text-blue-700"
  },
  localProPlus: {
    name: "LocalPro Plus",
    icon: <Star className="w-6 h-6" />,
    color: "bg-yellow-100 text-yellow-700"
  },
  facilityCare: {
    name: "Facility Care",
    icon: <Home className="w-6 h-6" />,
    color: "bg-emerald-100 text-emerald-700"
  },
  ads: {
    name: "Ads",
    icon: <Megaphone className="w-6 h-6" />,
    color: "bg-purple-100 text-purple-700"
  },
  finance: {
    name: "Finance",
    icon: <DollarSign className="w-6 h-6" />,
    color: "bg-red-100 text-red-700"
  },
  jobBoard: {
    name: "Job Board",
    icon: <Shield className="w-6 h-6" />,
    color: "bg-indigo-100 text-indigo-700"
  },
  referrals: {
    name: "Referrals",
    icon: <Star className="w-6 h-6" />,
    color: "bg-pink-100 text-pink-700"
  },
  analytics: {
    name: "Analytics",
    icon: <Shield className="w-6 h-6" />,
    color: "bg-cyan-100 text-cyan-700"
  },
  payments: {
    name: "Payments",
    icon: <DollarSign className="w-6 h-6" />,
    color: "bg-teal-100 text-teal-700"
  }
};

interface AppSettingsFeatures {
  [key: string]: {
    enabled: boolean;
    [key: string]: unknown;
  } | boolean;
}

interface AppSettingsResponse {
  success: boolean;
  data: {
    features?: AppSettingsFeatures;
    [key: string]: unknown;
  };
}

export default function ServicesPage() {
  const router = useRouter();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch app settings to get all features
  useEffect(() => {
    const fetchAppSettings = async () => {
      try {
        setLoading(true);
        const url = `${API_BASE_URL}${API_ENDPOINTS.settingsApp}`;
        const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

        if (response.ok) {
          const data: AppSettingsResponse = await response.json();
          const featuresData = data?.data?.features || {};

          // Convert all features to Feature array
          const featuresList: Feature[] = Object.entries(featuresData)
            .filter(([key]) => {
              // Skip nested objects like payments.paypal, payments.paymaya, etc.
              // Only include top-level features
              return !key.includes('.') && key !== 'payments' && key !== 'analytics';
            })
            .map(([key, value]) => {
              // Determine if feature is enabled and extract details
              let enabled = false;
              let featureDetails: Record<string, unknown> = {};
              
              if (typeof value === 'boolean') {
                enabled = value;
              } else if (typeof value === 'object' && value !== null) {
                enabled = (value as { enabled: boolean }).enabled ?? false;
                featureDetails = value as Record<string, unknown>;
              }

              // Get icon from settings or fallback to config
              let iconElement: React.ReactNode;
              if (featureDetails.icon && typeof featureDetails.icon === 'string') {
                const IconComponent = getIconComponent(featureDetails.icon);
                iconElement = <IconComponent className="w-6 h-6" />;
              } else {
                iconElement = featureConfig[key]?.icon || <Shield className="w-6 h-6" />;
              }

              // Get color from settings or fallback to config
              const color = (typeof featureDetails.color === 'string' ? featureDetails.color : null) || 
                featureConfig[key]?.color || 
                "bg-gray-100 text-gray-700";
              
              // Get name from settings or fallback to config
              const name = (typeof featureDetails.name === 'string' ? featureDetails.name : null) || 
                featureConfig[key]?.name || 
                key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();

              return {
                key,
                name,
                enabled,
                icon: iconElement,
                color,
                description: typeof featureDetails.description === 'string' ? featureDetails.description : undefined,
                services: Array.isArray(featureDetails.services) ? featureDetails.services : [],
                route: typeof featureDetails.route === 'string' ? featureDetails.route : undefined,
                category: typeof featureDetails.category === 'string' ? featureDetails.category : undefined,
                users: typeof featureDetails.users === 'number' ? featureDetails.users : undefined,
                lastUpdated: typeof featureDetails.lastUpdated === 'string' ? featureDetails.lastUpdated : undefined,
                featured: typeof featureDetails.featured === 'boolean' ? featureDetails.featured : false,
              };
            })
            .sort((a, b) => {
              // Sort by featured first, then enabled, then by name
              if (a.featured !== b.featured) {
                return a.featured ? -1 : 1;
              }
              if (a.enabled !== b.enabled) {
                return a.enabled ? -1 : 1;
              }
              return a.name.localeCompare(b.name);
            });

          setFeatures(featuresList);
        } else {
          setFeatures([]);
        }
      } catch (error) {
        console.error("Failed to fetch app settings:", error);
        setFeatures([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppSettings();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600">Loading features...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {features.map((feature) => (
          <div
            key={feature.key}
            className={`bg-white rounded-xl shadow-sm p-4 border transition-all duration-200 cursor-pointer hover:shadow-md ${
              feature.featured 
                ? "border-amber-300 border-2" 
                : "border-gray-200"
            } ${feature.enabled ? "hover:border-blue-300" : "opacity-75"}`}
            onClick={() => {
              if (feature.enabled && feature.route) {
                router.push(feature.route);
              }
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center`}>
                {feature.icon}
              </div>
              <div className="flex flex-col items-end gap-1">
                {feature.featured && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    <Star className="w-3 h-3" />
                    <span>Featured</span>
                  </div>
                )}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  feature.enabled 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {feature.enabled ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Enabled</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" />
                      <span>Disabled</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <h3 className="text-base font-semibold text-gray-800 mb-1">
              {feature.name}
            </h3>
            
            {feature.description && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {feature.description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-1 mb-2">
              {feature.category && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                  {feature.category}
                </span>
              )}
              {feature.services && feature.services.length > 0 && (
                <span className="text-xs bg-gray-50 text-gray-700 px-2 py-0.5 rounded-md border border-gray-200">
                  {feature.services.length} {feature.services.length === 1 ? 'service' : 'services'}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {feature.users !== undefined && feature.users > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{feature.users.toLocaleString()}</span>
                  </div>
                )}
                {feature.lastUpdated && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{feature.lastUpdated}</span>
                  </div>
                )}
              </div>
              {feature.enabled && feature.route && (
                <ArrowRight className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {features.length === 0 && !loading && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No features found</h3>
          <p className="text-gray-500">
            Unable to load features from the API
          </p>
        </div>
      )}
    </div>
  );
}
