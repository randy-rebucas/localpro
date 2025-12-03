"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Plus,
  Star,
  Home,
  X,
  CheckCircle2,
  Headphones,
  HelpCircle,
  MapPin,
  Navigation,
  Clock,
  Shield,
  Wrench,
  Leaf,
  Bug,
  Lock,
  Sparkles,
  ClipboardList
} from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useRoleAccess } from "@/components/role-guard";

export interface FacilityCareService {
  _id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  status: 'active' | 'inactive' | 'pending';
  pricing: {
    basePrice: number;
    type: 'hourly' | 'daily' | 'monthly' | 'fixed' | 'per_sqm';
    currency: string;
  };
  location: {
    address: string;
    city: string;
    state: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  images: string[];
  features: string[];
  provider: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    reviewCount: number;
    verified: boolean;
  };
  rating: {
    average: number;
    count: number;
  };
  availability: {
    schedule?: string;
    responseTime?: string;
  };
  serviceArea: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

const popularCategories = ['Janitorial', 'Landscaping', 'Pest Control', 'Maintenance', 'Security'];

const categoryIcons: Record<string, React.ReactNode> = {
  'Janitorial': <Sparkles className="w-4 h-4" />,
  'Landscaping': <Leaf className="w-4 h-4" />,
  'Pest Control': <Bug className="w-4 h-4" />,
  'Maintenance': <Wrench className="w-4 h-4" />,
  'Security': <Lock className="w-4 h-4" />,
};

const serviceTips = [
  "Request multiple quotes for comparison",
  "Check provider certifications and insurance",
  "Read reviews from similar facilities"
];

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Popular" },
];

// Helper function to validate and normalize service data from API
const validateServiceData = (service: unknown): FacilityCareService | null => {
  if (!service || typeof service !== 'object') return null;
  
  const serviceObj = service as Record<string, unknown>;
  
  // Extract pricing data
  const pricingData = serviceObj.pricing as Record<string, unknown> || {};
  const basePrice = typeof pricingData.basePrice === 'number' ? pricingData.basePrice : 0;
  const pricingType = (pricingData.type as string) || 'fixed';
  const currency = (pricingData.currency as string) || 'PHP';
  
  // Extract location data
  const locationData = serviceObj.location as Record<string, unknown> || {};
  
  // Extract provider info
  const providerData = serviceObj.provider as Record<string, unknown> || {};
  const providerFirstName = (providerData.firstName as string) || '';
  const providerLastName = (providerData.lastName as string) || '';
  const providerName = `${providerFirstName} ${providerLastName}`.trim() || (providerData.name as string) || 'Unknown Provider';
  const providerId = (providerData._id as string) || (providerData.id as string) || '';
  
  // Extract rating data
  const ratingData = serviceObj.rating as Record<string, unknown> || {};
  
  // Determine status
  let status: 'active' | 'inactive' | 'pending' = 'active';
  if (serviceObj.isActive === false) {
    status = 'inactive';
  } else if (serviceObj.status === 'pending') {
    status = 'pending';
  }
  
  return {
    _id: (serviceObj._id as string) || (serviceObj.id as string) || '',
    name: (serviceObj.name as string) || (serviceObj.title as string) || 'Unnamed Service',
    description: (serviceObj.description as string) || '',
    category: (serviceObj.category as string) || 'Other',
    subcategory: (serviceObj.subcategory as string) || '',
    status: status,
    pricing: {
      basePrice: basePrice,
      type: pricingType as 'hourly' | 'daily' | 'monthly' | 'fixed' | 'per_sqm',
      currency: currency,
    },
    location: {
      address: (locationData.address as string) || '',
      city: (locationData.city as string) || '',
      state: (locationData.state as string) || '',
      coordinates: locationData.coordinates as { lat: number; lng: number } | undefined,
    },
    images: Array.isArray(serviceObj.images) ? (serviceObj.images as string[]) : [],
    features: Array.isArray(serviceObj.features) ? (serviceObj.features as string[]) : [],
    provider: {
      id: providerId,
      name: providerName,
      avatar: (providerData.avatar as string) || undefined,
      rating: (providerData.rating as number) || 0,
      reviewCount: (providerData.reviewCount as number) || 0,
      verified: Boolean(providerData.isVerified || providerData.verified),
    },
    rating: {
      average: (ratingData.average as number) || 0,
      count: (ratingData.count as number) || 0,
    },
    availability: {
      schedule: (serviceObj.schedule as string) || undefined,
      responseTime: (serviceObj.responseTime as string) || undefined,
    },
    serviceArea: Array.isArray(serviceObj.serviceArea) ? (serviceObj.serviceArea as string[]) : [],
    isActive: serviceObj.isActive !== false,
    isFeatured: Boolean(serviceObj.isFeatured),
    createdAt: (serviceObj.createdAt as string) || new Date().toISOString(),
    updatedAt: (serviceObj.updatedAt as string) || new Date().toISOString(),
  };
};

export default function FacilityCarePage() {
  const { settings: appSettings } = useAppSettings();
  const { isClient, isProvider, isAdmin } = useRoleAccess();
  const canCreateFacilityCare = isProvider || isAdmin;
  const [services, setServices] = useState<FacilityCareService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [location, setLocation] = useState("");
  const [useNearby, setUseNearby] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("relevance");
  const router = useRouter();

  // Filter options
  const categoryOptions = categories.length > 0 ? ['All Categories', ...categories] : ['All Categories', 'janitorial', 'landscaping', 'pest_control', 'maintenance', 'security'];
  const statusOptions = ['All Statuses', 'Active', 'Inactive'];

  // Get user location for nearby search
  useEffect(() => {
    if (navigator.geolocation && useNearby) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          logger.warn('Could not get user location', { 
            error: error instanceof Error ? error.message : String(error)
          });
          setUseNearby(false);
        }
      );
    }
  }, [useNearby]);

  // Set default categories (no dedicated endpoint available)
  const initializeCategories = useCallback(() => {
    const defaultCategories = ['janitorial', 'landscaping', 'pest_control', 'maintenance', 'security', 'hvac', 'electrical', 'plumbing'];
    setCategories(defaultCategories);
  }, []);

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        
        let url = `${API_BASE_URL}${API_ENDPOINTS.facilityCare}`;
        
        // If nearby is enabled and we have location, use nearby endpoint
        if (useNearby && userLocation) {
          url = `${API_BASE_URL}${API_ENDPOINTS.facilityCareNearby}?lat=${userLocation.lat}&lng=${userLocation.lng}`;
        }
        
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch facility care services');
        }

        const data = await response.json();
        const servicesData = data.services || data.data || data.items || data.results || [];
        const rawServices = Array.isArray(servicesData) ? servicesData : [];
        const validatedServices = rawServices.map(validateServiceData).filter(Boolean) as FacilityCareService[];
        
        setServices(validatedServices);
      } catch (error) {
        logger.error('Error fetching facility care services', error instanceof Error ? error : new Error(String(error)));
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [useNearby, userLocation]);

  // Initialize categories on mount
  useEffect(() => {
    initializeCategories();
  }, [initializeCategories]);

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           service.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All Categories" || service.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesStatus = selectedStatus === "All Statuses" || 
                          (selectedStatus === "Active" && service.isActive) ||
                          (selectedStatus === "Inactive" && !service.isActive);
      const matchesLocation = !location || 
                             service.location.city.toLowerCase().includes(location.toLowerCase()) ||
                             service.location.state.toLowerCase().includes(location.toLowerCase());
      
      return matchesSearch && matchesCategory && matchesStatus && matchesLocation;
    });
  }, [services, searchQuery, selectedCategory, selectedStatus, location]);

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "All Categories") count++;
    if (selectedStatus !== "All Statuses") count++;
    if (location) count++;
    if (useNearby) count++;
    return count;
  }, [selectedCategory, selectedStatus, location, useNearby]);

  const formatPrice = (price: number) => {
    return formatCurrency(price, 'PHP', {
      appSettings,
      showSymbol: true,
    });
  };

  const formatPriceType = (type: string) => {
    const typeMap: Record<string, string> = {
      'hourly': '/hr',
      'daily': '/day',
      'monthly': '/mo',
      'fixed': '',
      'per_sqm': '/sqm',
    };
    return typeMap[type] || '';
  };

  const clearFilters = () => {
    setSelectedCategory("All Categories");
    setSelectedStatus("All Statuses");
    setLocation("");
    setSearchQuery("");
    setUseNearby(false);
  };

  const sortedServices = useMemo(() => {
    const sorted = [...filteredServices];
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'price-low':
        return sorted.sort((a, b) => a.pricing.basePrice - b.pricing.basePrice);
      case 'price-high':
        return sorted.sort((a, b) => b.pricing.basePrice - a.pricing.basePrice);
      case 'rating':
        return sorted.sort((a, b) => b.rating.average - a.rating.average);
      case 'popular':
        return sorted.sort((a, b) => b.rating.count - a.rating.count);
      default:
        return sorted;
    }
  }, [filteredServices, sortBy]);

  const handleCreateService = () => {
    router.push('/facility-care/create');
  };

  // Get featured services
  const featuredServices = useMemo(() => {
    return sortedServices.filter(s => s.isFeatured);
  }, [sortedServices]);

  const regularServices = useMemo(() => {
    return sortedServices.filter(s => !s.isFeatured);
  }, [sortedServices]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header Skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded-lg w-full mb-4"></div>
            <div className="flex gap-3">
              <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
              <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
              <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border-2 border-gray-200 p-6 animate-pulse">
                    <div className="space-y-4">
                      <div className="h-48 bg-gray-200 rounded-lg"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Facility Care — Maintenance & Services
              </h1>
              <p className="text-gray-600">
                Professional facility maintenance, cleaning, and care services for your property.
              </p>
            </div>
            {(canCreateFacilityCare || isProvider || isAdmin) && (
              <button
                onClick={handleCreateService}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                List Service
              </button>
            )}
          </div>
        </div>

        {/* Subheader - Feature Links */}
        <div className="mb-6 flex items-center gap-6 border-b border-gray-200 pb-4 flex-wrap">
          <Link 
            href="/facility-care/my-requests" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors group"
          >
            <ClipboardList className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">My Requests</span>
          </Link>
          <Link 
            href="/facility-care/verified" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors group"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Verified Providers</span>
          </Link>
          <Link 
            href="/support" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors group"
          >
            <Headphones className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Support</span>
          </Link>
        </div>
          
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search facility care services, providers, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6 space-y-6 sticky top-24">
              {/* Filters Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                  {activeFiltersCount > 0 && (
                    <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-medium rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                
                {/* Nearby Toggle */}
                <div className="mb-4">
                  <button
                    onClick={() => setUseNearby(!useNearby)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                      useNearby 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                        : 'border-gray-300 hover:border-emerald-500 hover:bg-emerald-50'
                    }`}
                  >
                    <Navigation className={`w-4 h-4 ${useNearby ? 'text-emerald-600' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium">Use my location</span>
                  </button>
                </div>

                {/* Category Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white font-medium"
                  >
                    {categoryOptions.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white font-medium"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="City or area"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Want to Offer Services - for clients */}
              {isClient && !isProvider && !isAdmin && (
                <div className="pt-6 border-t-2 border-gray-200">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-start gap-3 mb-3">
                      <Home className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">Want to Offer Services?</h3>
                        <p className="text-xs text-gray-600 mt-1">Upgrade to a provider account to list your facility care services.</p>
                      </div>
                    </div>
                    <Link
                      href="/plus?upgrade=provider"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-sm hover:shadow-md font-medium text-sm"
                    >
                      Upgrade Now
                    </Link>
                  </div>
                </div>
              )}

              {/* Popular Categories */}
              <div className="pt-6 border-t-2 border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Popular Categories</h2>
                <div className="flex flex-wrap gap-2">
                  {popularCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSearchQuery(category)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                        searchQuery === category
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {categoryIcons[category]}
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Tips */}
              <div className="pt-6 border-t-2 border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Service Tips</h2>
                <ul className="space-y-3">
                  {serviceTips.map((tip, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Need Help Section */}
              <div className="pt-6 border-t-2 border-gray-200">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                  <div className="flex items-start gap-3 mb-3">
                    <HelpCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Need Help?</h3>
                      <p className="text-xs text-gray-600 mt-1">Our team can help you find the right facility care services.</p>
                    </div>
                  </div>
                  <Link
                    href="/support"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 transition-all border border-emerald-200 font-medium text-sm"
                  >
                    <Shield className="w-4 h-4" />
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Sort and Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-gray-600 text-sm">
                {sortedServices.length} service{sortedServices.length !== 1 ? 's' : ''} found
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white font-medium"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured Services Section */}
            {featuredServices.length > 0 && (
              <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <h2 className="text-lg font-bold text-gray-900">Featured Services</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredServices.slice(0, 3).map((service) => (
                    <ServiceCard key={service._id} service={service} formatPrice={formatPrice} formatPriceType={formatPriceType} featured />
                  ))}
                </div>
              </div>
            )}

            {/* Services Grid */}
            {sortedServices.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-8">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                    <Home className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No services found</h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery || activeFiltersCount > 0
                      ? "Try adjusting your filters to see more results."
                      : "Get started by listing your first facility care service."}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 font-semibold"
                      >
                        Clear Filters
                      </button>
                    )}
                    {(canCreateFacilityCare || isProvider || isAdmin) && (
                      <button
                        onClick={handleCreateService}
                        className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow-md font-medium"
                      >
                        List Your First Service
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {regularServices.map((service) => (
                  <ServiceCard key={service._id} service={service} formatPrice={formatPrice} formatPriceType={formatPriceType} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Service Card Component
interface ServiceCardProps {
  service: FacilityCareService;
  formatPrice: (price: number) => string;
  formatPriceType: (type: string) => string;
  featured?: boolean;
}

function ServiceCard({ service, formatPrice, formatPriceType, featured = false }: ServiceCardProps) {
  return (
    <Link
      href={`/facility-care/${service._id}`}
      className={`group bg-white rounded-xl border-2 ${featured ? 'border-yellow-300' : 'border-gray-200'} hover:border-emerald-300 hover:shadow-xl transition-all duration-300 overflow-hidden`}
    >
      <div className="relative">
        {service.images.length > 0 ? (
          <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
            <Image
              src={service.images[0]}
              alt={service.name}
              width={400}
              height={300}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Home className="w-12 h-12 text-gray-400" />
          </div>
        )}
        {featured && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-yellow-500 text-white rounded text-xs font-bold flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              Featured
            </span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg text-sm font-bold text-gray-900 shadow-md">
            {formatPrice(service.pricing.basePrice)}{formatPriceType(service.pricing.type)}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-emerald-600 transition-colors">
          {service.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {service.description}
        </p>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-sm font-semibold text-gray-700">{service.rating.average.toFixed(1)}</span>
            <span className="text-xs text-gray-500">({service.rating.count})</span>
          </div>
          {service.location.city && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              {service.location.city}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
            {categoryIcons[service.category] || <Home className="w-3 h-3" />}
            {service.category}
          </span>
          {service.availability?.responseTime && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {service.availability.responseTime}
            </span>
          )}
        </div>
        {service.provider.verified && (
          <div className="flex items-center gap-1 text-xs text-emerald-600 mb-3">
            <CheckCircle2 className="w-3 h-3" />
            Verified Provider
          </div>
        )}
        <button className="w-full px-4 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-sm hover:shadow-md font-medium text-sm">
          Request Quote
        </button>
      </div>
    </Link>
  );
}
