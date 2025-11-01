"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MessageCircle,
  Star,
  Store,
  SlidersHorizontal
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";

// Booking Entity Interface (matching data-entities.md)
interface Booking {
  _id?: string;
  id?: string;
  service: {
    _id?: string;
    id?: string;
    title?: string;
    name?: string;
    category?: string;
    subcategory?: string;
    pricing?: {
      type?: 'hourly' | 'fixed' | 'per_sqft' | 'per_item';
      basePrice?: number;
      currency?: string;
    };
    provider?: {
      _id?: string;
      id?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      avatar?: string;
    };
  } | string; // Can be populated object or just ID
  client: {
    _id?: string;
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    avatar?: string;
  } | string; // Can be populated object or just ID
  provider: {
    _id?: string;
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    avatar?: string;
  } | string; // Can be populated object or just ID
  bookingDate: string | Date;
  duration: number; // in hours
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    coordinates?: {
      lat?: number;
      lng?: number;
    };
  };
  specialInstructions?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  pricing?: {
    basePrice?: number;
    additionalFees?: Array<{
      description?: string;
      amount?: number;
    }>;
    totalAmount?: number;
    currency?: string;
  };
  payment?: {
    status?: 'pending' | 'paid' | 'refunded' | 'failed';
    method?: 'cash' | 'card' | 'bank_transfer' | 'paypal' | 'paymaya';
    transactionId?: string;
    paidAt?: string | Date;
  };
  review?: {
    rating?: number;
    comment?: string;
    createdAt?: string | Date;
    categories?: {
      quality?: number;
      timeliness?: number;
      communication?: number;
      value?: number;
    };
    wouldRecommend?: boolean;
    photos?: Array<{
      url?: string;
      publicId?: string;
      thumbnail?: string;
    }>;
  };
  communication?: {
    messages?: Array<{
      sender?: string | {
        _id?: string;
        id?: string;
      };
      message?: string;
      timestamp?: string | Date;
      type?: 'text' | 'image' | 'file';
    }>;
    lastMessageAt?: string | Date;
  };
  timeline?: Array<{
    status?: string;
    timestamp?: string | Date;
    note?: string;
    updatedBy?: string | {
      _id?: string;
      id?: string;
    };
  }>;
  documents?: Array<{
    name?: string;
    url?: string;
    publicId?: string;
    type?: string;
    uploadedBy?: string | {
      _id?: string;
      id?: string;
    };
    uploadedAt?: string | Date;
  }>;
  beforePhotos?: Array<{
    url?: string;
    publicId?: string;
    thumbnail?: string;
  }>;
  afterPhotos?: Array<{
    url?: string;
    publicId?: string;
    thumbnail?: string;
  }>;
  completionNotes?: string;
  clientSatisfaction?: {
    rating?: number;
    feedback?: string;
    submittedAt?: string | Date;
  };
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  
  // Legacy fields for backward compatibility
  date?: string;
  time?: string;
  totalPrice?: number;
  notes?: string;
  contactPhone?: string;
  contactEmail?: string;
  paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED' | 'pending' | 'paid' | 'refunded';
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  
  // Normalize booking data from API response
  const normalizeBooking = useCallback((booking: any): Booking => {
    return {
      ...booking,
      _id: booking._id || booking.id,
      id: booking.id || booking._id,
      // Handle service
      service: typeof booking.service === 'string'
        ? { id: booking.service }
        : {
            _id: booking.service?._id || booking.service?.id,
            id: booking.service?.id || booking.service?._id,
            title: booking.service?.title || booking.service?.name,
            name: booking.service?.name || booking.service?.title,
            category: booking.service?.category,
            subcategory: booking.service?.subcategory,
            pricing: booking.service?.pricing,
            provider: booking.service?.provider
          },
      // Handle client
      client: typeof booking.client === 'string'
        ? { id: booking.client }
        : {
            _id: booking.client?._id || booking.client?.id,
            id: booking.client?.id || booking.client?._id,
            name: booking.client?.name,
            firstName: booking.client?.firstName,
            lastName: booking.client?.lastName,
            phone: booking.client?.phone || booking.contactPhone,
            email: booking.client?.email || booking.contactEmail,
            avatar: booking.client?.avatar
          },
      // Handle provider
      provider: typeof booking.provider === 'string'
        ? { id: booking.provider }
        : typeof booking.service?.provider === 'object'
          ? {
              _id: booking.service.provider?._id || booking.service.provider?.id,
              id: booking.service.provider?.id || booking.service.provider?._id,
              name: booking.service.provider?.name,
              firstName: booking.service.provider?.firstName,
              lastName: booking.service.provider?.lastName,
              phone: booking.service.provider?.phone,
              email: booking.service.provider?.email,
              avatar: booking.service.provider?.avatar
            }
          : {
              _id: booking.provider?._id || booking.provider?.id,
              id: booking.provider?.id || booking.provider?._id,
              name: booking.provider?.name,
              firstName: booking.provider?.firstName,
              lastName: booking.provider?.lastName,
              phone: booking.provider?.phone,
              email: booking.provider?.email,
              avatar: booking.provider?.avatar
            },
      // Handle booking date
      bookingDate: booking.bookingDate || booking.date || new Date(),
      // Handle status (normalize to lowercase)
      status: (booking.status || 'pending').toLowerCase() as Booking['status'],
      // Handle pricing
      pricing: booking.pricing || {
        basePrice: booking.totalPrice || booking.service?.pricing?.basePrice || 0,
        totalAmount: booking.totalPrice || booking.pricing?.totalAmount || 0,
        currency: booking.pricing?.currency || booking.service?.pricing?.currency || 'USD',
        additionalFees: booking.pricing?.additionalFees || []
      },
      // Handle payment
      payment: booking.payment || {
        status: (booking.paymentStatus || 'pending').toLowerCase() as 'pending' | 'paid' | 'refunded' | 'failed',
        method: booking.payment?.method || 'cash',
        transactionId: booking.payment?.transactionId,
        paidAt: booking.payment?.paidAt
      },
      // Handle address
      address: booking.address || {},
      // Handle special instructions
      specialInstructions: booking.specialInstructions || booking.notes,
      // Set defaults
      duration: booking.duration || 0,
      communication: booking.communication || { messages: [] },
      timeline: booking.timeline || [],
      documents: booking.documents || [],
      beforePhotos: booking.beforePhotos || [],
      afterPhotos: booking.afterPhotos || []
    };
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      if (statusFilter !== "all") {
        params.append("status", statusFilter.toLowerCase());
      }
      
      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }
      
      if (dateFrom) {
        params.append("dateFrom", dateFrom);
      }
      
      if (dateTo) {
        params.append("dateTo", dateTo);
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceMyBookings}?${params.toString()}`;
      console.log("Fetching bookings from:", url);

      const response = await fetch(url, createAuthFetchOptions());
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to fetch bookings: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Bookings API Response:", data);
      console.log("Response type:", typeof data);
      console.log("Is array:", Array.isArray(data));
      console.log("Has bookings property:", data && 'bookings' in data);
      console.log("Has data property:", data && 'data' in data);
      
      // Ensure bookings is always an array and normalize
      let bookingsData: Booking[] = [];
      if (Array.isArray(data)) {
        bookingsData = data.map((booking: any) => normalizeBooking(booking));
        console.log("Using direct array data");
      } else if (data && Array.isArray(data.bookings)) {
        bookingsData = data.bookings.map((booking: any) => normalizeBooking(booking));
        console.log("Using data.bookings array");
      } else if (data && Array.isArray(data.data)) {
        bookingsData = data.data.map((booking: any) => normalizeBooking(booking));
        console.log("Using data.data array");
      } else {
        console.warn("Unexpected API response structure:", data);
        console.warn("Available properties:", data ? Object.keys(data) : 'null/undefined');
        bookingsData = [];
      }
      
      console.log("Final bookings data:", bookingsData);
      console.log("Bookings count:", bookingsData.length);
      
      setBookings(bookingsData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("Failed to load bookings. Please try again.");
      // Ensure bookings is always an array even on error
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      // Normalize status to lowercase
      const normalizedStatus = status.toLowerCase();
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.marketplaceBookingStatus}/${bookingId}/status`, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify({ status: normalizedStatus }),
      }));

      if (!response.ok) {
        throw new Error("Failed to update booking status");
      }

      // Refresh bookings
      fetchBookings();
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("Failed to update booking status. Please try again.");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "in_progress":
        return <AlertCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatStatusLabel = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    return normalizedStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const statusOptions = [
    { value: "all", label: "All Bookings" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card interactive={false}>
          <EmptyState
            icon={AlertCircle}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
            title="Failed to Load Bookings"
            description={error}
            actions={[
              {
                type: "button",
                onClick: () => fetchBookings(),
                label: "Try Again",
                variant: "primary"
              },
              {
                type: "link",
                href: "/marketplace",
                label: "Browse Services",
                variant: "secondary"
              }
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="My Bookings"
        subtitle="Manage your service bookings"
        actions={[
          {
            type: "link",
            href: "/marketplace",
            label: "Browse Services",
            icon: Store,
            variant: "primary"
          }
        ]}
      />

      {/* Main Layout: Filters on Left, Content on Right */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Sidebar - Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <Card className="p-4 sticky top-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <SlidersHorizontal className="w-5 h-5 text-gray-400" />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Bookings</option>
                  <option value="client">As Client</option>
                  <option value="provider">As Provider</option>
                </select>
              </div>
              
              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Clear Filters */}
              <div>
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setTypeFilter("all");
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </Card>
        </aside>

        {/* Right Content Area */}
        <div className="flex-1 space-y-4">
          {/* Bookings List */}
          <div className="space-y-4">
        {!Array.isArray(bookings) || bookings.length === 0 ? (
          <Card interactive={false}>
            <EmptyState
              icon={Calendar}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100"
              title="No Bookings Found"
              description={
                statusFilter === "all" 
                  ? "You haven't made any bookings yet. Start exploring services and book your first appointment!" 
                  : `No bookings with status "${statusFilter.toLowerCase()}". Try changing the filter or browse available services.`
              }
              actions={[
                {
                  type: "link",
                  href: "/marketplace",
                  label: "Browse Services",
                  icon: Store,
                  variant: "primary"
                },
                ...(statusFilter !== "all" ? [{
                  type: "button" as const,
                  onClick: () => setStatusFilter("all"),
                  label: "Show All Bookings",
                  variant: "secondary" as const
                }] : [])
              ]}
            />
          </Card>
        ) : (
          <div className="grid gap-4">
            {Array.isArray(bookings) && bookings.map((booking) => {
              const bookingId = booking.id || booking._id || '';
              
              // Get service name
              const serviceName = typeof booking.service === 'object' && !Array.isArray(booking.service)
                ? (booking.service.title || booking.service.name || 'Unknown Service')
                : 'Unknown Service';
              
              // Get provider info
              const provider = typeof booking.provider === 'object' && !Array.isArray(booking.provider)
                ? booking.provider
                : typeof booking.service === 'object' && !Array.isArray(booking.service) && booking.service.provider
                  ? booking.service.provider
                  : {};
              const providerName = provider.name || 
                (provider.firstName && provider.lastName 
                  ? `${provider.firstName} ${provider.lastName}` 
                  : provider.firstName || provider.lastName || 'Unknown Provider');
              
              // Get booking date
              const bookingDate = booking.bookingDate 
                ? new Date(booking.bookingDate) 
                : booking.date 
                  ? new Date(booking.date) 
                  : new Date();
              
              // Get total price
              const totalPrice = booking.pricing?.totalAmount || booking.totalPrice || 0;
              const currency = booking.pricing?.currency || 'USD';
              
              // Get payment status
              const paymentStatus = booking.payment?.status || booking.paymentStatus || 'pending';
              
              // Get address
              const address = booking.address || {};
              const addressString = address.street 
                ? `${address.street}, ${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}`.trim()
                : address.city && address.state
                  ? `${address.city}, ${address.state}`
                  : address.city || address.state || 'Location not specified';
              
              // Get duration
              const durationHours = booking.duration || 0;
              
              return (
                <div key={bookingId} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-700 mb-1">
                            {serviceName}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              {formatStatusLabel(booking.status)}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              paymentStatus === "paid" || paymentStatus === "PAID"
                                ? "bg-green-100 text-green-800" 
                                : paymentStatus === "pending" || paymentStatus === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : paymentStatus === "refunded" || paymentStatus === "REFUNDED"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {formatStatusLabel(paymentStatus)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(totalPrice)}
                          </div>
                          <div className="text-sm text-gray-500">Total</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(bookingDate.toISOString())}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{durationHours > 0 ? `${durationHours} hour${durationHours !== 1 ? 's' : ''}` : 'Duration not specified'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            <span>{providerName}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {provider.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{provider.phone}</span>
                            </div>
                          )}
                          {provider.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span>{provider.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{addressString}</span>
                          </div>
                        </div>
                      </div>

                      {(booking.specialInstructions || booking.notes) && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Special Instructions:</h4>
                          <p className="text-sm text-gray-600">{booking.specialInstructions || booking.notes}</p>
                        </div>
                      )}
                      
                      {booking.pricing?.additionalFees && booking.pricing.additionalFees.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Additional Fees:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {booking.pricing.additionalFees.map((fee, idx) => (
                              <li key={idx}>
                                {fee.description || 'Additional fee'}: {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(fee.amount || 0)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 mt-4 lg:mt-0 lg:ml-6">
                      <Link
                        href={`/marketplace/bookings/${bookingId}`}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Link>
                      
                      {booking.status === "pending" && (
                        <button
                          onClick={() => updateBookingStatus(bookingId, "cancelled")}
                          className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel Booking
                        </button>
                      )}

                      {booking.status === "completed" && !booking.review?.rating && (
                        <button className="flex items-center justify-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors">
                          <Star className="w-4 h-4" />
                          Leave Review
                        </button>
                      )}

                      {booking.communication && (
                        <button className="flex items-center justify-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors">
                          <MessageCircle className="w-4 h-4" />
                          Message {booking.status === 'completed' ? 'Provider' : 'Provider'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
