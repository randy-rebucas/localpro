"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  AlertCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { formatCurrency, CURRENCY_CONFIGS } from "@/lib/currency-utils";

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
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stats, setStats] = useState<ServiceStats | null>(null);

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
  const normalizeCurrencyCode = (currency: string | undefined | null): string => {
    // Always return PHP as the only supported currency
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="p-4 space-y-4 relative z-10">
          {/* Header Skeleton */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="h-7 bg-gray-200 rounded w-40 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-56 animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
            </div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-md p-4">
                <div className="h-7 bg-gray-200 rounded w-12 animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Filters Skeleton */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-4 backdrop-blur-sm">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          {/* Services Skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl shadow-md p-5 border-2 border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
                        <div className="flex items-center gap-2">
                          <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-3 animate-pulse"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="bg-gray-50 rounded-lg p-3">
                          <div className="h-6 bg-gray-200 rounded w-8 mx-auto animate-pulse mb-1"></div>
                          <div className="h-4 bg-gray-200 rounded w-16 mx-auto animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-3 lg:mt-0 lg:ml-4">
                    {Array.from({ length: 4 }).map((_, k) => (
                      <div key={k} className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="p-4 relative z-10">
          {/* Header */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-1">My Services</h1>
                <p className="text-gray-600">Manage your service listings</p>
              </div>
              <Link
                href="/marketplace/create-service"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Create New Service
              </Link>
            </div>
          </div>

          {/* Error State */}
          <Card interactive={false} className="bg-gradient-to-br from-white to-red-50/30 border-2 border-red-200 shadow-lg">
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
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="p-4 space-y-4 relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-1">My Services</h1>
              <p className="text-gray-600">Manage your service listings</p>
            </div>
            <Link
              href="/marketplace/create-service"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Create New Service
            </Link>
          </div>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-all p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-gray-700">{stats.totalServices}</div>
              <div className="text-sm text-gray-500">Total Services</div>
            </div>
            <div className="bg-gradient-to-br from-white to-green-50/50 rounded-xl border-2 border-green-200 shadow-md hover:shadow-lg transition-all p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.activeServices}</div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-all p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold text-gray-600">{stats.inactiveServices}</div>
              <div className="text-sm text-gray-500">Inactive</div>
            </div>
            <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-xl border-2 border-blue-200 shadow-md hover:shadow-lg transition-all p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stats.totalBookings}</div>
              <div className="text-sm text-gray-500">Total Bookings</div>
            </div>
            <div className="bg-gradient-to-br from-white to-yellow-50/50 rounded-xl border-2 border-yellow-200 shadow-md hover:shadow-lg transition-all p-4 backdrop-blur-sm">
              <div className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
              </div>
              <div className="text-sm text-gray-500">Avg Rating</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-4 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md hover:border-gray-400 bg-white"
              >
                <option value="all">All Services</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-4">
          {services.length === 0 ? (
            <Card interactive={false} className="bg-gradient-to-br from-white to-gray-50/50 border-2 border-gray-200 shadow-lg">
              <EmptyState
                icon={Plus}
                iconColor="text-green-600"
                iconBgColor="bg-green-100"
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
            </Card>
          ) : (
          <div className="grid gap-4">
            {services.map((service, index) => (
              <div key={service.id || `service-${index}`} className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-5 border-2 border-gray-200 backdrop-blur-sm">
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
                      className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md hover:scale-105"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                    
                    <Link
                      href={`/marketplace/services/${service.id}/edit`}
                      className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-blue-300 text-blue-700 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all shadow-sm hover:shadow-md hover:scale-105"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>

                    {service.status === "ACTIVE" ? (
                      <button
                        onClick={() => updateServiceStatus(service.id, "INACTIVE")}
                        className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-yellow-300 text-yellow-700 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100 transition-all shadow-sm hover:shadow-md hover:scale-105"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => updateServiceStatus(service.id, "ACTIVE")}
                        className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-green-300 text-green-700 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all shadow-sm hover:shadow-md hover:scale-105"
                      >
                        Activate
                      </button>
                    )}

                    <button
                      onClick={() => deleteService(service.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-red-300 text-red-700 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 transition-all shadow-sm hover:shadow-md hover:scale-105"
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
  );
}
