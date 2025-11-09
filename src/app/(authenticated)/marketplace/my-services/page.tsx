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
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  rating: number;
  reviewCount: number;
  bookingCount: number;
  totalEarnings: number;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}


export default function MyServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

      const data = await response.json();
      logger.debug("Services API response", { hasData: !!data, isArray: Array.isArray(data) });
      setServices(Array.isArray(data) ? data : data.services || []);
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
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.marketplaceServiceById}/${serviceId}`, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify({ status }),
      }));

      if (!response.ok) {
        throw new Error("Failed to update service status");
      }

      fetchServices();
    } catch (error) {
      logger.error("Error updating service status", error instanceof Error ? error : new Error(String(error)), { serviceId, status });
      alert("Failed to update service status. Please try again.");
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
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
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
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
      <div className="p-4 space-y-4">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Services Skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
                      <div className="flex items-center gap-2">
                        <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-3 animate-pulse"></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="text-center space-y-1">
                        <div className="h-6 bg-gray-200 rounded w-8 mx-auto animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-12 mx-auto animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-3 lg:mt-0 lg:ml-4">
                  {Array.from({ length: 4 }).map((_, k) => (
                    <div key={k} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-700">My Services</h1>
            <p className="text-gray-600">Manage your service listings</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/marketplace/create-service"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create New Service
            </Link>
          </div>
        </div>

        {/* Error State */}
        <Card interactive={false}>
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
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <PageHeader
        title="My Services"
        subtitle="Manage your service listings"
        actions={[
          {
            type: "link",
            href: "/marketplace/create-service",
            label: "Create New Service",
            icon: Plus,
            variant: "primary"
          }
        ]}
      />


      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
      <div className="space-y-3">
        {services.length === 0 ? (
          <Card interactive={false}>
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
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-700 mb-1">
                          {service.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
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
                        <div className="text-xl font-bold text-green-600">
                          {formatPrice(service.price)}
                        </div>
                        <div className="text-sm text-gray-500">per service</div>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">{service.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-700">{service.bookingCount}</div>
                        <div className="text-sm text-gray-500">Bookings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-700">{formatPrice(service.totalEarnings)}</div>
                        <div className="text-sm text-gray-500">Earnings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-700">{formatDuration(service.duration)}</div>
                        <div className="text-sm text-gray-500">Duration</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-700 capitalize">{service.category.toLowerCase()}</div>
                        <div className="text-sm text-gray-500">Category</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-3 lg:mt-0 lg:ml-4">
                    <Link
                      href={`/marketplace/services/${service.id}`}
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                    
                    <Link
                      href={`/marketplace/services/${service.id}/edit`}
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>

                    {service.status === "ACTIVE" ? (
                      <button
                        onClick={() => updateServiceStatus(service.id, "INACTIVE")}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => updateServiceStatus(service.id, "ACTIVE")}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        Activate
                      </button>
                    )}

                    <button
                      onClick={() => deleteService(service.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
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
  );
}
