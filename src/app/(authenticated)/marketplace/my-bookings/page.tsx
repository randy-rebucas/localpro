"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Store
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { CommunicationAPI } from "@/lib/communication-utils";

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
  userRole?: 'client' | 'provider'; // Role of the current user viewing this booking
  
  // Legacy fields for backward compatibility
  date?: string;
  time?: string;
  totalPrice?: number;
  notes?: string;
  contactPhone?: string;
  contactEmail?: string;
  paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED' | 'pending' | 'paid' | 'refunded';
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [messaging, setMessaging] = useState<string | null>(null);
  
  // Normalize booking data from API response
  const normalizeBooking = useCallback((booking: Partial<Booking> & Record<string, unknown>): Booking => {
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
        : (() => {
            const client = booking.client as Record<string, unknown>;
            const profile = client?.profile as Record<string, unknown> | undefined;
            const avatar = profile?.avatar as Record<string, unknown> | undefined;
            return {
              _id: String(client?._id || client?.id || ''),
              id: String(client?.id || client?._id || ''),
              name: String(client?.name || ''),
              firstName: String(client?.firstName || ''),
              lastName: String(client?.lastName || ''),
              phone: String(client?.phone || client?.phoneNumber || booking.contactPhone || ''),
              email: String(client?.email || booking.contactEmail || ''),
              avatar: String(client?.avatar || avatar?.url || avatar?.thumbnail || '')
            } as Booking['client'];
          })(),
      // Handle provider
      provider: typeof booking.provider === 'string'
        ? { id: booking.provider }
        : (() => {
            const serviceProvider = typeof booking.service === 'object' && booking.service !== null && typeof booking.service.provider === 'object' && booking.service.provider !== null
              ? booking.service.provider as Record<string, unknown>
              : null;
            const provider = booking.provider as Record<string, unknown>;
            const targetProvider = serviceProvider || provider;
            const profile = targetProvider?.profile as Record<string, unknown> | undefined;
            const avatar = profile?.avatar as Record<string, unknown> | undefined;
            
            return {
              _id: String(targetProvider?._id || targetProvider?.id || ''),
              id: String(targetProvider?.id || targetProvider?._id || ''),
              name: String(targetProvider?.name || ''),
              firstName: String(targetProvider?.firstName || ''),
              lastName: String(targetProvider?.lastName || ''),
              phone: String(targetProvider?.phone || targetProvider?.phoneNumber || ''),
              email: String(targetProvider?.email || ''),
              avatar: String(targetProvider?.avatar || avatar?.url || avatar?.thumbnail || '')
            } as Booking['provider'];
          })(),
      // Handle booking date
      bookingDate: booking.bookingDate || booking.date || new Date(),
      // Handle status (normalize to lowercase)
      status: (booking.status || 'pending').toLowerCase() as Booking['status'],
      // Handle pricing
      pricing: booking.pricing ? {
        ...booking.pricing,
        basePrice: booking.pricing.basePrice ?? booking.totalPrice ?? (typeof booking.service === 'object' && booking.service !== null ? booking.service.pricing?.basePrice : undefined) ?? 0,
        totalAmount: booking.pricing.totalAmount ?? booking.totalPrice ?? 0,
        currency: booking.pricing.currency ?? (typeof booking.service === 'object' && booking.service !== null ? booking.service.pricing?.currency : undefined) ?? 'USD',
        additionalFees: booking.pricing.additionalFees ?? []
      } : {
        basePrice: booking.totalPrice ?? (typeof booking.service === 'object' && booking.service !== null ? booking.service.pricing?.basePrice : undefined) ?? 0,
        totalAmount: booking.totalPrice ?? 0,
        currency: (typeof booking.service === 'object' && booking.service !== null ? booking.service.pricing?.currency : undefined) ?? 'USD',
        additionalFees: []
      },
      // Handle payment
      payment: booking.payment ? {
        ...booking.payment,
        status: booking.payment.status ?? (booking.paymentStatus ? (booking.paymentStatus.toLowerCase() as 'pending' | 'paid' | 'refunded' | 'failed') : 'pending'),
        method: booking.payment.method ?? 'cash',
        transactionId: booking.payment.transactionId,
        paidAt: booking.payment.paidAt
      } : {
        status: (booking.paymentStatus || 'pending').toLowerCase() as 'pending' | 'paid' | 'refunded' | 'failed',
        method: 'cash',
        transactionId: undefined,
        paidAt: undefined
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
      logger.debug("Fetching bookings", { url, filters: { statusFilter, typeFilter, dateFrom, dateTo } });

      const response = await fetch(url, createAuthFetchOptions());
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error("Bookings API error", undefined, {
          status: response.status,
          statusText: response.statusText,
          hasErrorData: !!errorData
        });
        throw new Error(`Failed to fetch bookings: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      logger.debug("Bookings API response", { 
        isArray: Array.isArray(data),
        hasSuccess: data && 'success' in data,
        hasData: data && 'data' in data,
        hasDataBookings: data && data.data && 'bookings' in data.data,
        hasBookings: data && 'bookings' in data
      });
      
      // Ensure bookings is always an array and normalize
      let bookingsData: Booking[] = [];
      
      // Handle new structure: { success: true, data: { bookings: [], pagination: {}, stats: {} } }
      if (data && data.success && data.data && Array.isArray(data.data.bookings)) {
        bookingsData = (data.data.bookings as Array<Partial<Booking> & Record<string, unknown>>).map((booking) => normalizeBooking(booking));
        logger.debug("Using data.data.bookings array", { count: bookingsData.length });
      } 
      // Handle legacy structure: direct array
      else if (Array.isArray(data)) {
        bookingsData = data.map((booking: Partial<Booking> & Record<string, unknown>) => normalizeBooking(booking));
        logger.debug("Using direct array data", { count: bookingsData.length });
      } 
      // Handle legacy structure: { bookings: [] }
      else if (data && Array.isArray(data.bookings)) {
        bookingsData = (data.bookings as Array<Partial<Booking> & Record<string, unknown>>).map((booking) => normalizeBooking(booking));
        logger.debug("Using data.bookings array", { count: bookingsData.length });
      } 
      // Handle legacy structure: { data: [] }
      else if (data && Array.isArray(data.data)) {
        bookingsData = (data.data as Array<Partial<Booking> & Record<string, unknown>>).map((booking) => normalizeBooking(booking));
        logger.debug("Using data.data array", { count: bookingsData.length });
      } 
      else {
        logger.warn("Unexpected API response structure", { 
          hasData: !!data,
          properties: data ? Object.keys(data) : [],
          hasDataProperty: data && data.data ? Object.keys(data.data) : []
        });
        bookingsData = [];
      }
      
      logger.debug("Bookings loaded", { count: bookingsData.length });
      
      setBookings(bookingsData);
    } catch (error) {
      logger.error("Error fetching bookings", error instanceof Error ? error : new Error(String(error)));
      setError("Failed to load bookings. Please try again.");
      // Ensure bookings is always an array even on error
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, dateFrom, dateTo, normalizeBooking]);

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
      logger.error("Error updating booking status", error instanceof Error ? error : new Error(String(error)), { bookingId, status });
      alert("Failed to update booking status. Please try again.");
    }
  };

  const handleMessage = useCallback(async (booking: Booking) => {
    if (messaging) return;

    // Determine who to message based on userRole
    // If userRole is 'provider', message the client; if 'client', message the provider
    const userRole = booking.userRole || 'client'; // Default to client if not specified
    const otherParty = userRole === 'provider' 
      ? (booking.client && typeof booking.client === 'object' ? booking.client : null)
      : (booking.provider && typeof booking.provider === 'object' ? booking.provider : null);
    
    if (!otherParty || typeof otherParty === 'string') {
      alert('Contact information is not available.');
      return;
    }

    const otherPartyId = otherParty._id || otherParty.id;
    if (!otherPartyId) {
      alert('Contact ID is not available.');
      return;
    }

    const bookingId = booking.id || booking._id || '';
    setMessaging(bookingId);

    try {
      let conversationId: string | undefined;
      
      // Try to get existing conversation
      try {
        const response = await CommunicationAPI.getConversationWithUser(String(otherPartyId));
        const conversation = response?.data?.conversation || response?.conversation || response?.data || response;
        conversationId = conversation?._id || conversation?.id;
      } catch (error) {
        // If conversation doesn't exist (404), create a new one
        if (error instanceof Error && (error.message.includes('404') || error.message.includes('Failed to fetch'))) {
          logger.debug('Conversation not found, creating new one', { otherPartyId });
          
          // Get service name
          const serviceName = typeof booking.service === 'object' && !Array.isArray(booking.service)
            ? (booking.service.title || booking.service.name || 'Service')
            : 'Service';
          
          // Create conversation with booking context
          const conversationData: {
            participants: string[];
            type: string;
            subject: string;
            context?: { bookingId: string };
          } = {
            participants: [String(otherPartyId)],
            type: 'booking',
            subject: `Booking: ${serviceName}`
          };
          
          if (bookingId) {
            conversationData.context = { bookingId: String(bookingId) };
          }
          
          const createResponse = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.communicationConversations}`,
            createAuthFetchOptions({
              method: 'POST',
              body: JSON.stringify(conversationData)
            })
          );
          
          if (!createResponse.ok) {
            throw new Error(`Failed to create conversation: ${createResponse.status}`);
          }
          
          const createData = await createResponse.json();
          const newConversation = createData?.data?.conversation || createData?.conversation || createData?.data || createData;
          conversationId = newConversation?._id || newConversation?.id;
        } else {
          throw error;
        }
      }

      if (conversationId) {
        // Navigate to messages page with conversation ID
        router.push(`/messages?conversationId=${conversationId}`);
      } else {
        throw new Error('Failed to get conversation ID from response');
      }
    } catch (error) {
      logger.error('Error opening conversation', error instanceof Error ? error : new Error(String(error)), { otherPartyId });
      alert('Failed to open conversation. Please try again.');
    } finally {
      setMessaging(null);
    }
  }, [messaging, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Bookings Skeleton */}
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
                        <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-3 lg:mt-0 lg:ml-4">
                  {Array.from({ length: 3 }).map((_, k) => (
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
            <h1 className="text-xl font-bold text-gray-700">My Bookings</h1>
            <p className="text-gray-600">Manage your service bookings</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/marketplace"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
            >
              <Store className="w-4 h-4" />
              Browse Services
            </Link>
          </div>
        </div>

        {/* Error State */}
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
    <div className="p-4 space-y-4">
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
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
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
          <div className="flex-1">
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
          <div className="flex-1">
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
          <div className="flex items-end">
            <button
              onClick={() => {
                setStatusFilter("all");
                setTypeFilter("all");
                setDateFrom("");
                setDateTo("");
              }}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {!Array.isArray(bookings) || bookings.length === 0 ? (
          <Card interactive={false}>
            <EmptyState
              icon={Calendar}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100"
              title={
                statusFilter === "all" 
                  ? "No Bookings Yet" 
                  : `No ${statusFilter.toLowerCase()} bookings`
              }
              description={
                statusFilter === "all" 
                  ? "You haven't made any bookings yet. Start exploring services and book your first appointment!" 
                  : `You don't have any bookings with status "${statusFilter.toLowerCase()}". Try changing the filter or browse available services.`
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
              const providerId = provider._id || provider.id;
              
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
                <div key={bookingId} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-base font-semibold text-gray-700 mb-2">
                            {serviceName}
                          </h3>
                          <div className="flex items-center gap-4 mb-1 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500">Booking Status:</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                {getStatusIcon(booking.status)}
                                {formatStatusLabel(booking.status)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500">Payment Status:</span>
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
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(totalPrice)}
                          </div>
                          <div className="text-sm text-gray-500">Total</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>{formatDate(bookingDate.toISOString())}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>{durationHours > 0 ? `${durationHours} hour${durationHours !== 1 ? 's' : ''}` : 'Duration not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 flex-shrink-0 text-gray-600" />
                          {providerId ? (
                            <Link 
                              href={`/marketplace/providers/${providerId}`}
                              className="truncate font-semibold text-green-600 hover:text-green-700 hover:underline transition-all cursor-pointer px-2 py-1 rounded-md hover:bg-green-50"
                            >
                              {providerName}
                            </Link>
                          ) : (
                            <span className="truncate text-gray-600">{providerName}</span>
                          )}
                        </div>
                        {provider.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{provider.phone}</span>
                          </div>
                        )}
                        {provider.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{provider.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{addressString}</span>
                        </div>
                      </div>

                      {(booking.specialInstructions || booking.notes) && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Special Instructions:</h4>
                          <p className="text-sm text-gray-600 line-clamp-2">{booking.specialInstructions || booking.notes}</p>
                        </div>
                      )}
                      
                      {booking.pricing?.additionalFees && booking.pricing.additionalFees.length > 0 && (
                        <div className="mb-3">
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

                    <div className="flex flex-col gap-2 mt-3 lg:mt-0 lg:ml-4">
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

                      <button
                        onClick={() => handleMessage(booking)}
                        disabled={messaging === (booking.id || booking._id || '')}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {messaging === (booking.id || booking._id || '') ? 'Opening...' : 'Message'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
