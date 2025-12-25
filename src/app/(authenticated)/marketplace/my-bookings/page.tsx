"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft,
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
  X,
  Filter
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { CommunicationAPI } from "@/lib/communication-utils";
import { BookingFilterSidebar } from "@/components/marketplace/booking-filter-sidebar";
import { BookingControlsBar } from "@/components/marketplace/booking-controls-bar";
import { useAppSettings } from "@/hooks/useAppSettings";
import { getDefaultCurrency } from "@/lib/settings-utils";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency-utils";

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
  } | string;
  client: {
    _id?: string;
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    avatar?: string;
  } | string;
  provider: {
    _id?: string;
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    avatar?: string;
  } | string;
  bookingDate: string | Date;
  duration: number;
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
  userRole?: 'client' | 'provider';
  
  // Legacy fields
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
  const { settings: appSettings } = useAppSettings();
  
  // Get default currency from app settings
  const defaultCurrency = getDefaultCurrency(appSettings);
  
  // Helper to format currency with app settings
  const formatPrice = useCallback((price: number, currency?: string) => {
    const currencyCode = currency || defaultCurrency;
    return formatCurrencyUtil(price, currencyCode, {
      appSettings,
    });
  }, [appSettings, defaultCurrency]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [messaging, setMessaging] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>("bookingDate");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    categories: {
      quality: 5,
      timeliness: 5,
      communication: 5,
      value: 5
    },
    wouldRecommend: false
  });
  
  // Normalize booking data from API response
  const normalizeBooking = useCallback((booking: Partial<Booking> & Record<string, unknown>): Booking => {
    return {
      ...booking,
      _id: booking._id || booking.id,
      id: booking.id || booking._id,
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
      bookingDate: booking.bookingDate || booking.date || new Date(),
      status: (booking.status || 'pending').toLowerCase() as Booking['status'],
      pricing: booking.pricing ? {
        ...booking.pricing,
        basePrice: booking.pricing.basePrice ?? booking.totalPrice ?? (typeof booking.service === 'object' && booking.service !== null ? booking.service.pricing?.basePrice : undefined) ?? 0,
        totalAmount: booking.pricing.totalAmount ?? booking.totalPrice ?? 0,
        currency: booking.pricing.currency ?? (typeof booking.service === 'object' && booking.service !== null ? booking.service.pricing?.currency : undefined) ?? defaultCurrency,
        additionalFees: booking.pricing.additionalFees ?? []
      } : {
        basePrice: booking.totalPrice ?? (typeof booking.service === 'object' && booking.service !== null ? booking.service.pricing?.basePrice : undefined) ?? 0,
        totalAmount: booking.totalPrice ?? 0,
        currency: (typeof booking.service === 'object' && booking.service !== null ? booking.service.pricing?.currency : undefined) ?? defaultCurrency,
        additionalFees: []
      },
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
      address: booking.address || {},
      specialInstructions: booking.specialInstructions || booking.notes,
      duration: booking.duration || 0,
      communication: booking.communication || { messages: [] },
      timeline: booking.timeline || [],
      documents: booking.documents || [],
      beforePhotos: booking.beforePhotos || [],
      afterPhotos: booking.afterPhotos || []
    };
  }, [defaultCurrency]);

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

      // Try the my-bookings endpoint first
      let url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceMyBookings}?${params.toString()}`;
      logger.debug("Fetching bookings", { url, filters: { statusFilter, typeFilter, dateFrom, dateTo } });

      let response = await fetch(url, createAuthFetchOptions());
      
      // If my-bookings returns 501 (Not Implemented), fall back to the general bookings endpoint
      if (response.status === 501) {
        logger.warn("my-bookings endpoint not implemented, falling back to bookings endpoint", { status: response.status });
        url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceBookings}?${params.toString()}`;
        response = await fetch(url, createAuthFetchOptions());
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle 501 (Not Implemented) gracefully - don't log as error since it's expected
        if (response.status === 501) {
          logger.warn("Bookings API endpoint not implemented", {
            status: response.status,
            statusText: response.statusText,
            url
          });
          setError("This feature is currently unavailable. The bookings API is not yet implemented on the server.");
          setBookings([]);
          return;
        }
        
        // Log other errors normally
        logger.error("Bookings API error", undefined, {
          status: response.status,
          statusText: response.statusText,
          hasErrorData: !!errorData,
          url
        });
        
        // Provide user-friendly error message for other errors
        if (response.status === 401) {
          setError("Please log in to view your bookings.");
        } else if (response.status >= 500) {
          setError("Server error. Please try again later.");
        } else {
          setError("Failed to load bookings. Please try again.");
        }
        setBookings([]);
        return;
      }

      const data = await response.json();
      logger.debug("Bookings API response", { 
        isArray: Array.isArray(data),
        hasSuccess: data && 'success' in data,
        hasData: data && 'data' in data,
        hasDataBookings: data && data.data && 'bookings' in data.data,
        hasBookings: data && 'bookings' in data
      });
      
      let bookingsData: Booking[] = [];
      
      if (data && data.success && data.data && Array.isArray(data.data.bookings)) {
        bookingsData = (data.data.bookings as Array<Partial<Booking> & Record<string, unknown>>).map((booking) => normalizeBooking(booking));
        logger.debug("Using data.data.bookings array", { count: bookingsData.length });
      } 
      else if (Array.isArray(data)) {
        bookingsData = data.map((booking: Partial<Booking> & Record<string, unknown>) => normalizeBooking(booking));
        logger.debug("Using direct array data", { count: bookingsData.length });
      } 
      else if (data && Array.isArray(data.bookings)) {
        bookingsData = (data.bookings as Array<Partial<Booking> & Record<string, unknown>>).map((booking) => normalizeBooking(booking));
        logger.debug("Using data.bookings array", { count: bookingsData.length });
      } 
      else if (data && data.success && Array.isArray(data.data)) {
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
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, dateFrom, dateTo, normalizeBooking]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateBookingStatus = useCallback(async (bookingId: string, status: string) => {
    if (updatingStatus) return;
    
    try {
      setUpdatingStatus(bookingId);
      const normalizedStatus = status.toLowerCase();
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.marketplaceBookingStatus}/${bookingId}/status`, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify({ status: normalizedStatus }),
      }));

      if (!response.ok) {
        throw new Error("Failed to update booking status");
      }

      await fetchBookings();
    } catch (error) {
      logger.error("Error updating booking status", error instanceof Error ? error : new Error(String(error)), { bookingId, status });
      alert("Failed to update booking status. Please try again.");
    } finally {
      setUpdatingStatus(null);
    }
  }, [fetchBookings, updatingStatus]);

  const handleOpenReview = useCallback((bookingId: string) => {
    setReviewModalOpen(bookingId);
    setReviewForm({
      rating: 5,
      comment: '',
      categories: {
        quality: 5,
        timeliness: 5,
        communication: 5,
        value: 5
      },
      wouldRecommend: false
    });
  }, []);

  const handleCloseReview = useCallback(() => {
    setReviewModalOpen(null);
  }, []);

  const handleSubmitReview = useCallback(async (bookingId: string) => {
    if (submittingReview) return;

    try {
      setSubmittingReview(true);
      
      const reviewData = {
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim() || undefined,
        categories: reviewForm.categories,
        wouldRecommend: reviewForm.wouldRecommend
      };

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.marketplaceBookingReview}/${bookingId}/review`,
        createAuthFetchOptions({
          method: 'POST',
          body: JSON.stringify(reviewData),
        })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to submit review');
      }

      await fetchBookings();
      handleCloseReview();
      alert('Review submitted successfully!');
    } catch (error) {
      logger.error('Error submitting review', error instanceof Error ? error : new Error(String(error)), { bookingId });
      alert(error instanceof Error ? error.message : 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  }, [reviewForm, submittingReview, fetchBookings, handleCloseReview]);

  const handleMessage = useCallback(async (booking: Booking) => {
    if (messaging) return;

    const userRole = booking.userRole || 'client';
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
      
      try {
        const response = await CommunicationAPI.getConversationWithUser(String(otherPartyId));
        const conversation = response?.data?.conversation || response?.conversation || response?.data || response;
        conversationId = conversation?._id || conversation?.id;
      } catch (error) {
        if (error instanceof Error && (error.message.includes('404') || error.message.includes('Failed to fetch'))) {
          logger.debug('Conversation not found, creating new one', { otherPartyId });
          
          const serviceName = typeof booking.service === 'object' && !Array.isArray(booking.service)
            ? (booking.service.title || booking.service.name || 'Service')
            : 'Service';
          
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

  // Helper functions
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const formatTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  }, []);

  const getStatusColor = useCallback((status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "pending":
        return "bg-yellow-50 text-yellow-700";
      case "confirmed":
        return "bg-blue-50 text-blue-700";
      case "in_progress":
        return "bg-purple-50 text-purple-700";
      case "completed":
        return "bg-emerald-50 text-emerald-700";
      case "cancelled":
        return "bg-red-50 text-red-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
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
  }, []);

  const formatStatusLabel = useCallback((status: string) => {
    const normalizedStatus = status.toLowerCase();
    return normalizedStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  const handleClearFilters = useCallback(() => {
    setStatusFilter("all");
    setTypeFilter("all");
    setDateFrom("");
    setDateTo("");
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (typeFilter !== "all") count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [statusFilter, typeFilter, dateFrom, dateTo]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(statusFilter !== "all" || typeFilter !== "all" || dateFrom || dateTo);
  }, [statusFilter, typeFilter, dateFrom, dateTo]);

  // Memoized filter drawer handlers
  const handleOpenFilters = useCallback(() => {
    setFilterDrawerOpen(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setFilterDrawerOpen(false);
  }, []);

  // Back button handler
  const handleBack = useCallback(() => {
    router.push('/marketplace');
  }, [router]);

  // Sort bookings
  const sortedBookings = useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    
    const sorted = [...bookings].sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortBy) {
        case "bookingDate":
          aValue = new Date(a.bookingDate || a.date || 0);
          bValue = new Date(b.bookingDate || b.date || 0);
          break;
        case "createdAt":
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        case "totalAmount":
          aValue = a.pricing?.totalAmount || a.totalPrice || 0;
          bValue = b.pricing?.totalAmount || b.totalPrice || 0;
          break;
        case "serviceName":
          const aServiceName = typeof a.service === 'object' && !Array.isArray(a.service)
            ? (a.service.title || a.service.name || '')
            : '';
          const bServiceName = typeof b.service === 'object' && !Array.isArray(b.service)
            ? (b.service.title || b.service.name || '')
            : '';
          aValue = aServiceName;
          bValue = bServiceName;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [bookings, sortBy, sortOrder]);

  // Loading state
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

  // Error state
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
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Bookings</h1>
                <p className="text-sm text-gray-500 mt-0.5">Manage your service appointments</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-12 rounded-lg">
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
                  label: "Browse Providers",
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
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Bookings</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {bookings.length > 0 ? `${bookings.length} ${bookings.length === 1 ? 'booking' : 'bookings'}` : 'Manage your service appointments'}
                </p>
              </div>
            </div>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
            >
              <Store className="w-4 h-4" />
              Browse Providers
            </Link>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Sidebar - Filters */}
          <BookingFilterSidebar
            isOpen={filterDrawerOpen}
            onClose={handleCloseFilters}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
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
                {activeFiltersCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Controls Bar */}
            <div className="mb-6">
              <BookingControlsBar
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
                  Error loading bookings
                </p>
                <p className="text-xs text-red-600">
                  {error}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Please try refreshing the page or adjusting your filters.
                </p>
              </div>
            )}

            {/* Bookings List */}
            <div role="list" aria-label="Bookings list">
              {!Array.isArray(sortedBookings) || sortedBookings.length === 0 ? (
            <div className="bg-white p-12">
              <EmptyState
                icon={Calendar}
                iconColor="text-emerald-600"
                iconBgColor="bg-emerald-100"
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
                    label: "Browse Providers",
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
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'} role="list">
              {Array.isArray(sortedBookings) && sortedBookings.map((booking) => {
                const bookingId = booking.id || booking._id || '';
                
                const serviceName = typeof booking.service === 'object' && !Array.isArray(booking.service)
                  ? (booking.service.title || booking.service.name || 'Unknown Service')
                  : 'Unknown Service';
                
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
                
                const bookingDate = booking.bookingDate 
                  ? new Date(booking.bookingDate) 
                  : booking.date 
                    ? new Date(booking.date) 
                    : new Date();
                
                const totalPrice = booking.pricing?.totalAmount || booking.totalPrice || 0;
                const currency = booking.pricing?.currency || defaultCurrency;
                
                const paymentStatus = booking.payment?.status || booking.paymentStatus || 'pending';
                
                const address = booking.address || {};
                const addressString = address.street 
                  ? `${address.street}, ${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}`.trim()
                  : address.city && address.state
                    ? `${address.city}, ${address.state}`
                    : address.city || address.state || 'Location not specified';
                
                const durationHours = booking.duration || 0;
                
                return (
                  <div 
                    key={bookingId} 
                    className={`bg-white border-l-4 border-l-emerald-500 ${viewMode === 'grid' ? 'rounded-lg shadow-md h-full flex flex-col' : ''}`}
                    role="listitem"
                    aria-label={`Booking for ${serviceName}`}
                  >
                    <div className={`${viewMode === 'grid' ? 'p-4 flex flex-col flex-1' : 'p-6'}`}>
                      {/* Top Section - Service Name, Status, Price */}
                      <div className={`flex flex-col ${viewMode === 'grid' ? 'gap-3' : 'lg:flex-row lg:items-start lg:justify-between gap-4'} mb-4`}>
                        <div className="flex-1 min-w-0">
                          <h3 className={`${viewMode === 'grid' ? 'text-lg' : 'text-xl'} font-bold text-gray-900 mb-2 line-clamp-2`}>
                            {serviceName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              {formatStatusLabel(booking.status)}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ${
                              paymentStatus === "paid" || paymentStatus === "PAID"
                                ? "bg-emerald-50 text-emerald-700" 
                                : paymentStatus === "pending" || paymentStatus === "PENDING"
                                ? "bg-yellow-50 text-yellow-700"
                                : paymentStatus === "refunded" || paymentStatus === "REFUNDED"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-red-50 text-red-700"
                            }`}>
                              {formatStatusLabel(paymentStatus)}
                            </span>
                          </div>
                        </div>
                        <div className={`flex-shrink-0 ${viewMode === 'grid' ? 'text-left' : 'text-right'}`}>
                          <div className={`${viewMode === 'grid' ? 'text-2xl' : 'text-3xl'} font-bold text-emerald-600 mb-1`}>
                            {formatPrice(totalPrice, currency)}
                          </div>
                          <div className="text-xs text-gray-500">Total Amount</div>
                        </div>
                      </div>

                      {/* Key Information Grid */}
                      <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-3 ${viewMode === 'grid' ? 'mb-4 pb-4' : 'mb-6 pb-6'} border-b border-gray-200`}>
                        <div className="flex items-start gap-2">
                          <div className={`flex-shrink-0 ${viewMode === 'grid' ? 'w-8 h-8' : 'w-10 h-10'} bg-emerald-50 flex items-center justify-center rounded`}>
                            <Calendar className={`${viewMode === 'grid' ? 'w-4 h-4' : 'w-5 h-5'} text-emerald-600`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Date & Time</div>
                            <div className={`${viewMode === 'grid' ? 'text-xs' : 'text-sm'} font-semibold text-gray-900`}>{formatDate(bookingDate.toISOString())}</div>
                            <div className="text-xs text-gray-600">{formatTime(bookingDate.toISOString())}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <div className={`flex-shrink-0 ${viewMode === 'grid' ? 'w-8 h-8' : 'w-10 h-10'} bg-blue-50 flex items-center justify-center rounded`}>
                            <Clock className={`${viewMode === 'grid' ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Duration</div>
                            <div className={`${viewMode === 'grid' ? 'text-xs' : 'text-sm'} font-semibold text-gray-900`}>
                              {durationHours > 0 ? `${durationHours} hour${durationHours !== 1 ? 's' : ''}` : 'Not specified'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <div className={`flex-shrink-0 ${viewMode === 'grid' ? 'w-8 h-8' : 'w-10 h-10'} bg-purple-50 flex items-center justify-center rounded`}>
                            <User className={`${viewMode === 'grid' ? 'w-4 h-4' : 'w-5 h-5'} text-purple-600`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Provider</div>
                            {providerId ? (
                              <Link 
                                href={`/marketplace/providers/${providerId}`}
                                className={`${viewMode === 'grid' ? 'text-xs' : 'text-sm'} font-semibold text-emerald-600 hover:text-emerald-700 hover:underline truncate block`}
                              >
                                {providerName}
                              </Link>
                            ) : (
                              <div className={`${viewMode === 'grid' ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 truncate`}>{providerName}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <div className={`flex-shrink-0 ${viewMode === 'grid' ? 'w-8 h-8' : 'w-10 h-10'} bg-orange-50 flex items-center justify-center rounded`}>
                            <MapPin className={`${viewMode === 'grid' ? 'w-4 h-4' : 'w-5 h-5'} text-orange-600`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Location</div>
                            <div className={`${viewMode === 'grid' ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 truncate`}>{addressString}</div>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information - Only show if available */}
                      {(provider.phone || provider.email) && (
                        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-3 ${viewMode === 'grid' ? 'mb-4 pb-4' : 'mb-6 pb-6'} border-b border-gray-200`}>
                          {provider.phone && (
                            <div className="flex items-center gap-2">
                              <div className={`flex-shrink-0 ${viewMode === 'grid' ? 'w-8 h-8' : 'w-10 h-10'} bg-teal-50 flex items-center justify-center rounded`}>
                                <Phone className={`${viewMode === 'grid' ? 'w-4 h-4' : 'w-5 h-5'} text-teal-600`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Phone</div>
                                <a href={`tel:${provider.phone}`} className={`${viewMode === 'grid' ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 hover:text-emerald-600 transition-colors`}>
                                  {provider.phone}
                                </a>
                              </div>
                            </div>
                          )}
                          {provider.email && (
                            <div className="flex items-center gap-2">
                              <div className={`flex-shrink-0 ${viewMode === 'grid' ? 'w-8 h-8' : 'w-10 h-10'} bg-indigo-50 flex items-center justify-center rounded`}>
                                <Mail className={`${viewMode === 'grid' ? 'w-4 h-4' : 'w-5 h-5'} text-indigo-600`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Email</div>
                                <a href={`mailto:${provider.email}`} className={`${viewMode === 'grid' ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 hover:text-emerald-600 transition-colors truncate block`}>
                                  {provider.email}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Additional Info */}
                      {(booking.specialInstructions || booking.notes) && (
                        <div className={`${viewMode === 'grid' ? 'mb-4' : 'mb-6'} p-3 bg-gray-50 border-l-4 border-l-gray-300 rounded-r`}>
                          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Special Instructions</h4>
                          <p className={`${viewMode === 'grid' ? 'text-xs' : 'text-sm'} text-gray-700 leading-relaxed line-clamp-3`}>{booking.specialInstructions || booking.notes}</p>
                        </div>
                      )}
                      
                      {booking.pricing?.additionalFees && booking.pricing.additionalFees.length > 0 && (
                        <div className={`${viewMode === 'grid' ? 'mb-4' : 'mb-6'} p-3 bg-amber-50 border-l-4 border-l-amber-400 rounded-r`}>
                          <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">Additional Fees</h4>
                          <ul className={`${viewMode === 'grid' ? 'space-y-1.5' : 'space-y-2'}`}>
                            {booking.pricing.additionalFees.map((fee, idx) => (
                              <li key={idx} className={`flex items-center justify-between ${viewMode === 'grid' ? 'text-xs' : 'text-sm'}`}>
                                <span className="text-gray-700 truncate pr-2">{fee.description || 'Additional fee'}</span>
                                <span className="font-semibold text-gray-900 flex-shrink-0">
                                  {formatPrice(fee.amount || 0, currency)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className={`flex flex-wrap gap-2 ${viewMode === 'grid' ? 'pt-4 mt-auto' : 'pt-6'} border-t border-gray-200`}>
                        <Link
                          href={`/marketplace/bookings/${bookingId}`}
                          className={`inline-flex items-center gap-1.5 ${viewMode === 'grid' ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'} font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all rounded`}
                        >
                          <Eye className={viewMode === 'grid' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                          {viewMode === 'grid' ? 'Details' : 'View Details'}
                        </Link>
                        
                        {booking.status === "pending" && (
                          <button
                            onClick={() => updateBookingStatus(bookingId, "cancelled")}
                            disabled={updatingStatus === bookingId}
                            className={`inline-flex items-center gap-1.5 ${viewMode === 'grid' ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'} font-semibold text-red-700 bg-white border-2 border-red-300 hover:bg-red-50 hover:border-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded`}
                            aria-label={`Cancel booking for ${serviceName}`}
                            aria-busy={updatingStatus === bookingId}
                          >
                            <XCircle className={viewMode === 'grid' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                            {updatingStatus === bookingId ? (viewMode === 'grid' ? 'Cancelling...' : 'Cancelling...') : (viewMode === 'grid' ? 'Cancel' : 'Cancel Booking')}
                          </button>
                        )}

                        {booking.status === "completed" && !booking.review?.rating && (
                          <button 
                            onClick={() => handleOpenReview(bookingId)}
                            className={`inline-flex items-center gap-1.5 ${viewMode === 'grid' ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'} font-semibold text-emerald-700 bg-white border-2 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 transition-all rounded`}
                            aria-label={`Leave review for ${serviceName}`}
                          >
                            <Star className={viewMode === 'grid' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                            {viewMode === 'grid' ? 'Review' : 'Leave Review'}
                          </button>
                        )}

                        <button
                          onClick={() => handleMessage(booking)}
                          disabled={messaging === (booking.id || booking._id || '')}
                          className={`inline-flex items-center gap-1.5 ${viewMode === 'grid' ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'} font-semibold text-blue-700 bg-white border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded`}
                          aria-label={`Message provider about ${serviceName}`}
                          aria-busy={messaging === (booking.id || booking._id || '')}
                        >
                          <MessageCircle className={viewMode === 'grid' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                          {messaging === (booking.id || booking._id || '') ? 'Opening...' : (viewMode === 'grid' ? 'Message' : 'Message')}
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
        </div>
      </div>

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">Leave a Review</h2>
              <button
                onClick={handleCloseReview}
                className="p-1.5 hover:bg-gray-100 transition-colors"
                aria-label="Close review modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Overall Rating */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Overall Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                      className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                      aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-9 h-9 transition-colors ${
                          star <= reviewForm.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-gray-400'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-base font-bold text-gray-700">
                    {reviewForm.rating} / 5
                  </span>
                </div>
              </div>

              {/* Category Ratings */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-4">
                  Category Ratings
                </label>
                <div className="space-y-4">
                  {Object.entries(reviewForm.categories).map(([category, rating]) => (
                    <div key={category} className="p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-900 capitalize">
                          {category}
                        </span>
                        <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-1">{rating} / 5</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm(prev => ({
                              ...prev,
                              categories: {
                                ...prev.categories,
                                [category]: star
                              }
                            }))}
                            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                            aria-label={`Rate ${category} ${star} star${star !== 1 ? 's' : ''}`}
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${
                                star <= rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300 hover:text-gray-400'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label htmlFor="review-comment" className="block text-sm font-bold text-gray-900 mb-2">
                  Your Review
                </label>
                <textarea
                  id="review-comment"
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 text-sm border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                  placeholder="Share your experience with this service..."
                />
              </div>

              {/* Would Recommend */}
              <div className="flex items-center gap-3 p-4 bg-emerald-50">
                <input
                  type="checkbox"
                  id="would-recommend"
                  checked={reviewForm.wouldRecommend}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, wouldRecommend: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="would-recommend" className="text-sm font-semibold text-gray-900 cursor-pointer">
                  I would recommend this service
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseReview}
                  disabled={submittingReview}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmitReview(reviewModalOpen)}
                  disabled={submittingReview || reviewForm.rating < 1}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
