"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  AlertCircle,
  Briefcase,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { ServiceFilterSidebar } from "@/components/marketplace/service-filter-sidebar";
import { ServiceControlsBar } from "@/components/marketplace/service-controls-bar";

interface Service {
  id: string;
  _id?: string;
  name: string;
  title?: string; // API field name
  description: string;
  category: string;
  price: number;
  pricing?: {
    type: string;
    basePrice: number;
    currency: string;
  };
  duration: number;
  estimatedDuration?: {
    min: number;
    max: number;
  };
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  isActive?: boolean; // API field name
  rating: number;
  ratingObj?: {
    average: number;
    count: number;
  };
  reviewCount: number;
  bookingCount: number;
  totalEarnings: number;
  images?: string[] | Array<{
    url: string;
    publicId?: string;
    thumbnail?: string;
    alt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ServiceStats {
  totalServices: number;
  activeServices: number;
  inactiveServices: number;
  averageRating: number;
  totalBookings: number;
}

interface ApiResponse {
  success?: boolean;
  data?: {
    services?: Service[];
    pagination?: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
    stats?: ServiceStats;
  };
  services?: Service[]; // Legacy support
}

export default function MyServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceMyServices}?${params.toString()}`;
      logger.debug("Fetching services from", { url });
      
      const response = await fetch(url, createAuthFetchOptions());
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error("API Error", undefined, {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Failed to fetch services: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse | Service[] = await response.json();
      logger.debug("Services API response", { 
        hasData: !!data, 
        isArray: Array.isArray(data),
        hasSuccess: !Array.isArray(data) && 'success' in data,
        hasDataProperty: !Array.isArray(data) && 'data' in data
      });
      
      // Handle different response structures
      let rawServicesData: unknown[] = [];
      let statsData: ServiceStats | null = null;
      
      if (Array.isArray(data)) {
        // Direct array response (legacy)
        rawServicesData = data;
      } else if (data.success && data.data) {
        // New structure: { success: true, data: { services: [], pagination: {}, stats: {} } }
        rawServicesData = data.data.services || [];
        statsData = data.data.stats || null;
      } else if (data.services) {
        // Legacy structure: { services: [] }
        rawServicesData = Array.isArray(data.services) ? data.services : [];
      } else {
        logger.warn("Unexpected API response structure", { 
          hasData: !!data,
          properties: data ? Object.keys(data) : []
        });
        rawServicesData = [];
      }
      
      // Normalize service data to match our interface
      const normalizedServices: Service[] = rawServicesData.map((service: unknown, index: number) => {
        const serviceRecord = service as Record<string, unknown>;
        const id = serviceRecord.id || serviceRecord._id || `service-${index}-${Date.now()}`;
        
        // Handle rating - can be object {average, count} or number
        let rating = 0;
        let reviewCount = 0;
        if (serviceRecord.rating) {
          if (typeof serviceRecord.rating === 'object' && serviceRecord.rating !== null && 'average' in serviceRecord.rating) {
            const ratingObj = serviceRecord.rating as { average?: number; count?: number };
            rating = ratingObj.average || 0;
            reviewCount = ratingObj.count || 0;
          } else if (typeof serviceRecord.rating === 'number') {
            rating = serviceRecord.rating;
            reviewCount = (serviceRecord.reviewCount as number) || 0;
          }
        }
        
        // Handle pricing - can be object {type, basePrice, currency} or direct price
        const pricingObj = serviceRecord.pricing as { basePrice?: number; currency?: string } | undefined;
        const price = pricingObj?.basePrice || (serviceRecord.price as number) || (serviceRecord.basePrice as number) || 0;
        const currency = pricingObj?.currency || 'PHP';
        
        // Handle duration - can be object {min, max} or number
        let duration = 0;
        if (serviceRecord.estimatedDuration) {
          if (typeof serviceRecord.estimatedDuration === 'object' && serviceRecord.estimatedDuration !== null) {
            const durationObj = serviceRecord.estimatedDuration as { min?: number; max?: number };
            // Use average of min and max, or max if min is not available
            duration = durationObj.max || durationObj.min || 0;
          } else {
            duration = serviceRecord.estimatedDuration as number;
          }
        } else if (serviceRecord.duration) {
          duration = serviceRecord.duration as number;
        }
        
        // Handle status - convert isActive boolean to status string
        let status: "ACTIVE" | "INACTIVE" | "PENDING" = "PENDING";
        if (serviceRecord.status) {
          status = (serviceRecord.status as string).toUpperCase() as "ACTIVE" | "INACTIVE" | "PENDING";
        } else if (serviceRecord.isActive !== undefined) {
          status = serviceRecord.isActive ? "ACTIVE" : "INACTIVE";
        }
        
        // Handle images - can be array of strings or array of objects
        let images: string[] = [];
        if (serviceRecord.images && Array.isArray(serviceRecord.images)) {
          images = serviceRecord.images.map((img: unknown) => {
            if (typeof img === 'string') return img;
            const imgObj = img as { url?: string; thumbnail?: string };
            return imgObj.url || imgObj.thumbnail || '';
          }).filter((url: string) => url);
        }
        
        // Handle name/title
        const name = (serviceRecord.name as string) || (serviceRecord.title as string) || 'Untitled Service';
        
        return {
          ...serviceRecord,
          id: id as string,
          name,
          price,
          pricing: pricingObj || { type: 'fixed', basePrice: price, currency },
          duration,
          status,
          rating,
          reviewCount,
          bookingCount: (serviceRecord.bookingCount as number) || 0,
          totalEarnings: (serviceRecord.totalEarnings as number) || 0,
          images,
        } as Service;
      });
      
      const servicesData = normalizedServices;
      
      logger.debug("Services extracted", { count: servicesData.length, hasStats: !!statsData });
      setServices(servicesData);
      setStats(statsData);
    } catch (error) {
      logger.error("Error fetching services", error instanceof Error ? error : new Error(String(error)));
      setError(error instanceof Error ? error.message : "Failed to load services. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);


  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const updateServiceStatus = async (serviceId: string, status: string) => {
    try {
      let response;
      
      // Use deactivate endpoint when deactivating
      if (status === "INACTIVE") {
        response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.marketplaceServiceDeactivate}/${serviceId}/deactivate`, createAuthFetchOptions({
          method: 'PATCH',
        }));
      } else if (status === "ACTIVE") {
        // Use activate endpoint when activating
        response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.marketplaceServiceActivate}/${serviceId}/activate`, createAuthFetchOptions({
          method: 'PATCH',
        }));
      } else {
        // For other statuses, use the standard PUT endpoint
        response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.marketplaceServiceById}/${serviceId}`, createAuthFetchOptions({
          method: 'PUT',
          body: JSON.stringify({ status }),
        }));
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || "Failed to update service status";
        throw new Error(errorMessage);
      }

      // Refresh the services list
      await fetchServices();
    } catch (error) {
      logger.error("Error updating service status", error instanceof Error ? error : new Error(String(error)), { serviceId, status });
      const errorMessage = error instanceof Error ? error.message : "Failed to update service status. Please try again.";
      alert(errorMessage);
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.marketplaceServiceById}/${serviceId}`, createAuthFetchOptions({
        method: 'DELETE',
      }));

      if (!response.ok) {
        throw new Error("Failed to delete service");
      }

      fetchServices();
    } catch (error) {
      logger.error("Error deleting service", error instanceof Error ? error : new Error(String(error)), { serviceId });
      alert("Failed to delete service. Please try again.");
    }
  };

  // Normalize currency to PHP only
  const normalizeCurrencyCode = (_currency: string | undefined | null): string => {
    void _currency;
    return 'PHP';
  };

  const formatPrice = (price: number, currency: string | undefined = 'PHP') => {
    // Normalize currency to code for conversion base
    const currencyCode = normalizeCurrencyCode(currency);
    // Use formatCurrency which now uses symbols
    return formatCurrency(price, currencyCode);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200";
      case "INACTIVE":
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200";
      case "PENDING":
        return "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-200";
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const hasActiveFilters = useMemo(() => {
    return Boolean(statusFilter !== "all");
  }, [statusFilter]);

  // Memoized filter drawer handlers
  const handleOpenFilters = useCallback(() => {
    setFilterDrawerOpen(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setFilterDrawerOpen(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setStatusFilter("all");
  }, []);

  // Back button handler
  const handleBack = useCallback(() => {
    router.push('/marketplace');
  }, [router]);

  // Sort services
  const sortedServices = useMemo(() => {
    if (!Array.isArray(services)) return [];
    
    const sorted = [...services].sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortBy) {
        case "createdAt":
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case "name":
          aValue = a.name || "";
          bValue = b.name || "";
          break;
        case "price":
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case "rating":
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        case "bookingCount":
          aValue = a.bookingCount || 0;
          bValue = b.bookingCount || 0;
          break;
        case "totalEarnings":
          aValue = a.totalEarnings || 0;
          bValue = b.totalEarnings || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [services, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <div className="mb-8">
            <div className="mb-4">
              <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded w-40 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-56 animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="lg:w-64 hidden lg:block">
              <div className="h-96 bg-gray-200 rounded-2xl animate-pulse"></div>
            </div>
            <div className="flex-1 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg">
                  <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <div key={j} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <div className="mb-8">
            <div className="mb-4">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back to marketplace"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Marketplace</span>
              </button>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Services</h1>
                <p className="text-sm text-gray-500 mt-0.5">Manage your service listings</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-12 rounded-lg">
            <EmptyState
              icon={AlertCircle}
              iconColor="text-red-600"
              iconBgColor="bg-red-100"
              title="Failed to Load Services"
              description={error}
              actions={[
                {
                  type: "button",
                  onClick: fetchServices,
                  label: "Try Again",
                  variant: "primary"
                },
                {
                  type: "link",
                  href: "/marketplace/create-service",
                  label: "Create New Service",
                  variant: "secondary"
                }
              ]}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Header Section */}
        <div className="mb-8">
          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back to marketplace"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Marketplace</span>
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Services</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {services.length > 0 ? `${services.length} ${services.length === 1 ? 'service' : 'services'}` : 'Manage your service listings'}
                </p>
              </div>
            </div>
            <Link
              href="/marketplace/create-service"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Create New Service
            </Link>
          </div>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="text-2xl font-bold text-gray-700">{stats.totalServices}</div>
              <div className="text-sm text-gray-500">Total Services</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="text-2xl font-bold text-emerald-600">{stats.activeServices}</div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="text-2xl font-bold text-gray-600">{stats.inactiveServices}</div>
              <div className="text-sm text-gray-500">Inactive</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalBookings}</div>
              <div className="text-sm text-gray-500">Total Bookings</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
              </div>
              <div className="text-sm text-gray-500">Avg Rating</div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Sidebar - Filters */}
          <ServiceFilterSidebar
            isOpen={filterDrawerOpen}
            onClose={handleCloseFilters}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <button
                onClick={handleOpenFilters}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                aria-label="Open filters"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                    1
                  </span>
                )}
              </button>
            </div>

            {/* Controls Bar */}
            <div className="mb-6">
              <ServiceControlsBar
                sortBy={sortBy}
                onSortByChange={setSortBy}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>

            {/* Error State */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-medium text-red-800 mb-1">
                  Error loading services
                </p>
                <p className="text-xs text-red-600">
                  {error}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Please try refreshing the page or adjusting your filters.
                </p>
              </div>
            )}

            {/* Services List */}
            <div className="space-y-4">
              {sortedServices.length === 0 ? (
                <div className="bg-white p-12 rounded-lg">
                  <EmptyState
                    icon={Plus}
                    iconColor="text-emerald-600"
                    iconBgColor="bg-emerald-100"
                    title={
                      statusFilter === "all" 
                        ? "No Services Yet" 
                        : `No ${statusFilter.toLowerCase()} services`
                    }
                    description={
                      statusFilter === "all" 
                        ? "Start building your service business by creating your first service listing. Share your skills and start earning!" 
                        : `You don't have any services with status "${statusFilter.toLowerCase()}". Try changing the filter or create a new service.`
                    }
                    actions={[
                      {
                        type: "link",
                        href: "/marketplace/create-service",
                        label: "Create Your First Service",
                        variant: "primary"
                      },
                      ...(statusFilter !== "all" ? [{
                        type: "button" as const,
                        onClick: () => setStatusFilter("all"),
                        label: "Show All Services",
                        variant: "secondary" as const
                      }] : [])
                    ]}
                  />
                </div>
              ) : (
                <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}`}>
                  {sortedServices.map((service, index) => (
                    <div key={service.id || `service-${index}`} className={`bg-white border-l-4 border-l-emerald-500 ${viewMode === 'grid' ? 'rounded-lg shadow-md' : ''} hover:shadow-lg transition-all duration-300 p-5`}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {service.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(service.status)}`}>
                            {service.status}
                          </span>
                          <div className="flex items-center gap-1">
                            {renderStars(service.rating)}
                            <span className="text-sm text-gray-500">
                              ({service.reviewCount} reviews)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                          {formatPrice(service.price, service.pricing?.currency)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {service.pricing?.type === 'hourly' 
                            ? 'per hour' 
                            : service.pricing?.type === 'fixed'
                            ? 'fixed price'
                            : service.pricing?.type === 'per_sqft'
                            ? 'per square foot'
                            : service.pricing?.type === 'per_item'
                            ? 'per item'
                            : 'per service'}
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">{service.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div className="text-center bg-gradient-to-br from-blue-50/50 to-indigo-50/50 p-3 rounded-lg border border-blue-100">
                        <div className="text-xl font-bold text-gray-700">{service.bookingCount}</div>
                        <div className="text-sm text-gray-500">Bookings</div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-green-50/50 to-emerald-50/50 p-3 rounded-lg border border-green-100">
                        <div className="text-xl font-bold text-gray-700">{formatPrice(service.totalEarnings, service.pricing?.currency)}</div>
                        <div className="text-sm text-gray-500">Earnings</div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-purple-50/50 to-pink-50/50 p-3 rounded-lg border border-purple-100">
                        <div className="text-xl font-bold text-gray-700">{formatDuration(service.duration)}</div>
                        <div className="text-sm text-gray-500">Duration</div>
                      </div>
                      <div className="text-center bg-gradient-to-br from-amber-50/50 to-orange-50/50 p-3 rounded-lg border border-amber-100">
                        <div className="text-xl font-bold text-gray-700 capitalize">{service.category.toLowerCase()}</div>
                        <div className="text-sm text-gray-500">Category</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-3 lg:mt-0 lg:ml-4">
                    <Link
                      href={`/marketplace/services/${service.id}`}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-lg hover:scale-105"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                    
                    <Link
                      href={`/marketplace/services/${service.id}/edit`}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border border-blue-300 text-blue-700 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all shadow-sm hover:shadow-lg hover:scale-105"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>

                    {service.status === "ACTIVE" ? (
                      <button
                        onClick={() => updateServiceStatus(service.id, "INACTIVE")}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 border border-yellow-300 text-yellow-700 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100 transition-all shadow-sm hover:shadow-lg hover:scale-105"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => updateServiceStatus(service.id, "ACTIVE")}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 border border-green-300 text-green-700 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all shadow-sm hover:shadow-lg hover:scale-105"
                      >
                        Activate
                      </button>
                    )}

                    <button
                      onClick={() => deleteService(service.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 text-red-700 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 transition-all shadow-sm hover:shadow-lg hover:scale-105"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
