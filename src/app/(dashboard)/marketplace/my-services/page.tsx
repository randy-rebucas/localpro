"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Plus,
  Edit,
  Trash2,
  Eye,
  Star
} from "lucide-react";

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
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/marketplace/my-services?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }

      const data = await response.json();
      setServices(Array.isArray(data) ? data : data.services || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      setError("Failed to load services. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);


  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const updateServiceStatus = async (serviceId: string, status: string) => {
    try {
      const response = await fetch(`/api/marketplace/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update service status");
      }

      fetchServices();
    } catch (error) {
      console.error("Error updating service status:", error);
      alert("Failed to update service status. Please try again.");
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/marketplace/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error("Failed to delete service");
      }

      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchServices}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
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
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-700 mb-1">No services found</h3>
            <p className="text-gray-500 mb-4">
              {statusFilter === "all" 
                ? "You haven't created any services yet." 
                : `No services with status "${statusFilter.toLowerCase()}".`
              }
            </p>
            <Link
              href="/marketplace/create-service"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Your First Service
            </Link>
          </div>
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
