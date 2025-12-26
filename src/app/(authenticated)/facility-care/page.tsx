"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  ClipboardList,
  Filter,
  Grid3x3,
  List,
  ArrowUp,
  ArrowDown,
  Tag
} from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useRoleAccess } from "@/components/role-guard";
import { Broadcaster } from "@/components/broadcaster";

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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [location, setLocation] = useState("");
  const [useNearby, setUseNearby] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("relevance");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const itemsPerPage = 12;
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

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = !debouncedSearch || 
                           service.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                           service.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                           service.category.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory = selectedCategory === "All Categories" || service.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesStatus = selectedStatus === "All Statuses" || 
                          (selectedStatus === "Active" && service.isActive) ||
                          (selectedStatus === "Inactive" && !service.isActive);
      const matchesLocation = !location || 
                             service.location.city.toLowerCase().includes(location.toLowerCase()) ||
                             service.location.state.toLowerCase().includes(location.toLowerCase());
      
      return matchesSearch && matchesCategory && matchesStatus && matchesLocation;
    });
  }, [services, debouncedSearch, selectedCategory, selectedStatus, location]);

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
    setDebouncedSearch("");
    setUseNearby(false);
    setCurrentPage(1);
  };

  const sortedServices = useMemo(() => {
    const sorted = [...filteredServices];
    
    let result: FacilityCareService[];
    switch (sortBy) {
      case 'newest':
        result = sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'price-low':
        result = sorted.sort((a, b) => a.pricing.basePrice - b.pricing.basePrice);
        break;
      case 'price-high':
        result = sorted.sort((a, b) => b.pricing.basePrice - a.pricing.basePrice);
        break;
      case 'rating':
        result = sorted.sort((a, b) => b.rating.average - a.rating.average);
        break;
      case 'popular':
        result = sorted.sort((a, b) => b.rating.count - a.rating.count);
        break;
      default:
        result = sorted;
    }
    
    // Apply sort order
    if (sortOrder === "asc" && sortBy !== "relevance") {
      result = result.reverse();
    }
    
    return result;
  }, [filteredServices, sortBy, sortOrder]);

  // Pagination logic
  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedServices.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedServices, currentPage]);

  const totalPages = Math.ceil(sortedServices.length / itemsPerPage);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCreateService = () => {
    router.push('/facility-care/create');
  };

  // Get featured services
  const featuredServices = useMemo(() => {
    return sortedServices.filter(s => s.isFeatured);
  }, [sortedServices]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent/10/30 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent/10/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-0">
        {/* Broadcaster - Only shown for clients */}
        <Broadcaster />

        {/* Header Section - Following Reference Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-start justify-between mb-4">
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
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent/90 rounded-lg hover:from-accent/90 hover:to-accent transition-all shadow-lg shadow-accent/30 hover:shadow-xl hover:scale-105 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                List Service
              </button>
            )}
          </div>
        </div>

        {/* Quick Links Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-b border-gray-200 pb-4">
            <Link 
              href="/facility-care/my-requests" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <ClipboardList className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">My Requests</span>
            </Link>
            <Link 
              href="/facility-care/verified" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <CheckCircle2 className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Verified Providers</span>
            </Link>
            <Link 
              href="/support" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <Headphones className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Support</span>
            </Link>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Left Sidebar - Filters */}
            <>
              {/* Mobile Filter Drawer Overlay */}
              {isFilterDrawerOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  onClick={() => setIsFilterDrawerOpen(false)}
                />
              )}

              {/* Filter Sidebar */}
              <aside
                className={`bg-white rounded-2xl shadow-lg border border-gray-100 lg:w-[280px] flex-shrink-0 lg:sticky lg:top-24 ${
                  isFilterDrawerOpen
                    ? "fixed right-0 top-0 h-full w-80 z-50 lg:relative lg:w-[280px] lg:h-auto"
                    : "hidden lg:block"
                }`}
              >
                {/* Header Section */}
                <div className="bg-gradient-to-r from-accent/10 to-emerald-50 px-6 py-4 border-b border-accent/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-md">
                        <Filter className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                        <p className="text-xs text-gray-600">Refine your search</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsFilterDrawerOpen(false)}
                      className="lg:hidden text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Filter Content Area */}
                <div className="p-6 space-y-8">
                  {/* Nearby Toggle */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-accent" />
                      <label className="text-sm font-semibold text-gray-900">Location</label>
                    </div>
                    <button
                      onClick={() => setUseNearby(!useNearby)}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all ${
                        useNearby 
                          ? 'border-accent bg-accent/10 text-accent' 
                          : 'border-gray-200 hover:border-accent/50 hover:bg-accent/5'
                      }`}
                    >
                      <Navigation className={`w-4 h-4 ${useNearby ? 'text-accent' : 'text-gray-500'}`} />
                      <span className="text-sm font-medium">Use my location</span>
                    </button>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-accent" />
                      <label className="text-sm font-semibold text-gray-900">Category</label>
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    >
                      {categoryOptions.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                      <label className="text-sm font-semibold text-gray-900">Status</label>
                    </div>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  {/* Location Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-accent" />
                      <label className="text-sm font-semibold text-gray-900">Location</label>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter location..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-4 py-2.5 pr-11 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                      />
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-accent text-white hover:bg-accent/90 flex items-center justify-center transition-colors"
                        title="Detect location"
                        onClick={() => setUseNearby(!useNearby)}
                      >
                        <MapPin className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 border-2 border-transparent hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* Want to Offer Services - for clients */}
                {isClient && !isProvider && !isAdmin && (
                  <div className="px-6 pb-6">
                    <div className="bg-gradient-to-br from-accent/10 to-emerald-50 rounded-lg p-4 border border-accent/20">
                      <div className="flex items-start gap-3 mb-3">
                        <Home className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">Want to Offer Services?</h3>
                          <p className="text-xs text-gray-600 mt-1">Upgrade to a provider account to list your facility care services.</p>
                        </div>
                      </div>
                      <Link
                        href="/plus?upgrade=provider"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-all shadow-sm hover:shadow-md font-medium text-sm"
                      >
                        Upgrade Now
                      </Link>
                    </div>
                  </div>
                )}

                {/* Popular Categories */}
                <div className="px-6 pb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Popular Categories</h2>
                  <div className="flex flex-wrap gap-2">
                    {popularCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSearchQuery(category)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                          searchQuery === category
                            ? "bg-accent text-white border-accent"
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
                <div className="px-6 pb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Service Tips</h2>
                  <ul className="space-y-3">
                    {serviceTips.map((tip, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Need Help Section */}
                <div className="px-6 pb-6">
                  <div className="bg-gradient-to-br from-accent/10 to-emerald-50 rounded-lg p-4 border border-accent/20">
                    <div className="flex items-start gap-3 mb-3">
                      <HelpCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">Need Help?</h3>
                        <p className="text-xs text-gray-600 mt-1">Our team can help you find the right facility care services.</p>
                      </div>
                    </div>
                    <Link
                      href="/support"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-accent rounded-lg hover:bg-accent/10 transition-all border border-accent/20 font-medium text-sm"
                    >
                      <Shield className="w-4 h-4" />
                      Contact Support
                    </Link>
                  </div>
                </div>
              </aside>
            </>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Mobile Filters Button */}
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className="lg:hidden w-full px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center gap-2 text-gray-700 font-medium hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 bg-accent text-white text-xs font-medium rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Unified Controls Bar */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Search - 70% */}
                  <div className="w-full sm:w-[70%] relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search facility care services, providers, or categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Sort - 20% */}
                  <div className="w-full sm:w-[20%] flex items-center gap-1.5">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="flex-1 px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="newest">Date</option>
                      <option value="price-low">Price</option>
                      <option value="rating">Rating</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className="flex-shrink-0 w-10 h-10 flex items-center justify-center border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      title={sortOrder === "asc" ? "Ascending" : "Descending"}
                    >
                      {sortOrder === "asc" ? (
                        <ArrowUp className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>

                  {/* Display Mode - 10% */}
                  <div className="w-full sm:w-[10%] flex items-center justify-end">
                    <div className="bg-gray-100 rounded-lg p-1 flex items-center gap-1">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-1.5 rounded transition-all ${
                          viewMode === "grid"
                            ? "bg-white text-accent shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                        title="Grid view"
                      >
                        <Grid3x3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-1.5 rounded transition-all ${
                          viewMode === "list"
                            ? "bg-white text-accent shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                        title="List view"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Count */}
              <div className="text-sm text-gray-600">
                {sortedServices.length > 0 ? (
                  <>
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedServices.length)} of {sortedServices.length} results
                  </>
                ) : (
                  <>No results found</>
                )}
              </div>

              {/* Featured Services Section */}
              {featuredServices.length > 0 && (
                <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <h2 className="text-lg font-bold text-gray-900">Featured Services</h2>
                  </div>
                  <div className={viewMode === "grid" 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    : "space-y-4"
                  }>
                    {featuredServices.slice(0, 3).map((service) => (
                      <ServiceCard 
                        key={service._id} 
                        service={service} 
                        formatPrice={formatPrice} 
                        formatPriceType={formatPriceType} 
                        featured 
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Services Results */}
              {sortedServices.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-8">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/20">
                      <Home className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No services found</h3>
                    <p className="text-gray-600 mb-6">
                      {debouncedSearch || activeFiltersCount > 0
                        ? "Try adjusting your filters to see more results."
                        : "Get started by listing your first facility care service."}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={clearFilters}
                          className="px-6 py-3 bg-gradient-to-r from-accent to-accent/90 text-white rounded-lg hover:from-accent/90 hover:to-accent transition-all shadow-lg shadow-accent/30 hover:shadow-xl hover:scale-105 font-semibold"
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
                <>
                  <div className={viewMode === "grid" 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    : "space-y-4"
                  }>
                    {paginatedServices.map((service) => (
                      <ServiceCard 
                        key={service._id} 
                        service={service} 
                        formatPrice={formatPrice} 
                        formatPriceType={formatPriceType} 
                        viewMode={viewMode}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedServices.length)} of {sortedServices.length} results
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Previous
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum: number;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    currentPage === pageNum
                                      ? "bg-accent text-white"
                                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
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
  viewMode?: 'grid' | 'list';
}

const ServiceCard = React.memo(function ServiceCard({ service, formatPrice, formatPriceType, featured = false, viewMode = 'grid' }: ServiceCardProps) {
  const serviceId = service._id;
  
  if (viewMode === 'list') {
    return (
      <Link
        href={`/facility-care/${serviceId}`}
        className={`group bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300 overflow-hidden flex flex-row items-stretch ${
          featured ? "ring-2 ring-yellow-400" : ""
        }`}
      >
        {/* Image - Left Side */}
        <div className="relative w-64 flex-shrink-0">
          {service.images.length > 0 ? (
            <div className="w-full h-full bg-gray-100 overflow-hidden">
              <Image
                src={service.images[0]}
                alt={service.name}
                width={256}
                height={200}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
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
        </div>

        {/* Content - Right Side */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-accent transition-colors line-clamp-1">
                {service.name}
              </h3>
              <span className="px-3 py-1 bg-accent/10 text-accent rounded-lg text-sm font-bold flex-shrink-0 ml-4">
                {formatPrice(service.pricing.basePrice)}{formatPriceType(service.pricing.type)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {service.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              {service.location.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {service.location.city}
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded text-xs font-medium">
                {categoryIcons[service.category] || <Home className="w-3 h-3" />}
                {service.category}
              </span>
              {service.availability?.responseTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {service.availability.responseTime}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-semibold text-gray-700">{service.rating.average.toFixed(1)}</span>
              <span className="text-xs text-gray-500">({service.rating.count})</span>
            </div>
            {service.provider.verified && (
              <span className="flex items-center gap-1 text-xs text-accent">
                <CheckCircle2 className="w-4 h-4" />
                Verified
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Grid view
  return (
    <Link
      href={`/facility-care/${serviceId}`}
      className={`group bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300 overflow-hidden flex flex-col ${
        featured ? "ring-2 ring-yellow-400" : ""
      }`}
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
        <button className="w-full px-4 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-all shadow-sm hover:shadow-md font-medium text-sm">
          Request Quote
        </button>
      </div>
    </Link>
  );
});
