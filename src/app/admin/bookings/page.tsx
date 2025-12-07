"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  RefreshCw,
  Filter,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Coins,
  User,
  MapPin,
  Star
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";

interface Booking {
  _id: string;
  service: {
    _id: string;
    title: string;
    category?: string;
    subcategory?: string;
    pricing?: {
      type?: string;
      basePrice?: number;
      currency?: string;
    };
    images?: Array<{ url?: string; thumbnail?: string }>;
  };
  client: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    profile?: { avatar?: { url?: string } };
  };
  provider: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    profile?: { avatar?: { url?: string } };
  };
  bookingDate: string;
  duration: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  specialInstructions?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  pricing: {
    basePrice?: number;
    totalAmount: number;
    currency: string;
    additionalFees?: Array<{ name: string; amount: number }>;
  };
  payment: {
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    method?: string;
    paidAt?: string;
    transactionId?: string;
  };
  review?: {
    rating: number;
    comment?: string;
    createdAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface BookingStatistics {
  totalBookings?: number;
  pendingBookings?: number;
  confirmedBookings?: number;
  completedBookings?: number;
  cancelledBookings?: number;
  totalRevenue?: number;
  avgRating?: number;
}

export default function AdminBookingsPage() {
  const { settings: appSettings } = useAppSettings();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'bookingDate' | 'createdAt' | 'totalAmount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [statistics, setStatistics] = useState<BookingStatistics | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchStatistics = useCallback(async () => {
    // Calculate statistics from bookings data
    const pending = bookings.filter(b => b.status === 'pending').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const totalRevenue = bookings
      .filter(b => b.payment.status === 'paid')
      .reduce((sum, b) => sum + (b.pricing.totalAmount || 0), 0);
    const ratings = bookings.filter(b => b.review?.rating).map(b => b.review!.rating);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    setStatistics({
      totalBookings: bookings.length,
      pendingBookings: pending,
      confirmedBookings: confirmed,
      completedBookings: completed,
      cancelledBookings: cancelled,
      totalRevenue,
      avgRating
    });
  }, [bookings]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!getApiToken()) {
        logger.warn('No API token found');
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.set('search', searchTerm);
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);
      if (paymentFilter !== 'all') queryParams.set('paymentStatus', paymentFilter);
      queryParams.set('sortBy', sortBy);
      queryParams.set('sortOrder', sortOrder);
      queryParams.set('limit', '100');

      const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceBookings}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch bookings`);
      }

      const result = await response.json();
      
      let bookingsData: Booking[] = [];
      if (result.success && result.data) {
        if (result.data.bookings) {
          bookingsData = result.data.bookings;
        } else if (Array.isArray(result.data)) {
          bookingsData = result.data;
        }
      } else if (Array.isArray(result)) {
        bookingsData = result;
      }

      setBookings(bookingsData);
      setTotalCount(bookingsData.length);
      setLastUpdated(new Date());
    } catch (err) {
      logger.error('Error fetching bookings', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortBy, sortOrder, statusFilter, paymentFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (bookings.length > 0) {
      fetchStatistics();
    }
  }, [bookings, fetchStatistics]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSort = (field: 'bookingDate' | 'createdAt' | 'totalAmount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceBookingStatus}/${bookingId}/status`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update booking status');
      }

      toast.success(`Booking ${newStatus} successfully`);
      await fetchData();
    } catch (err) {
      logger.error('Error updating booking status', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to update booking status');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading bookings..." />
      </div>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
          <p className="text-gray-600 text-sm">View and manage all service bookings</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-900">{statistics.totalBookings || 0}</p>
              </div>
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-xl font-bold text-yellow-600">{statistics.pendingBookings || 0}</p>
              </div>
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Confirmed</p>
                <p className="text-xl font-bold text-blue-600">{statistics.confirmedBookings || 0}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-xl font-bold text-green-600">{statistics.completedBookings || 0}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Cancelled</p>
                <p className="text-xl font-bold text-red-600">{statistics.cancelledBookings || 0}</p>
              </div>
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(statistics.totalRevenue || 0, getDefaultCurrency(appSettings), { appSettings })}
                </p>
              </div>
              <Coins className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Avg Rating</p>
                <p className="text-xl font-bold text-yellow-600">{(statistics.avgRating || 0).toFixed(1)}</p>
              </div>
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="w-3 h-3 mr-1" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                <Download className="w-3 h-3 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment</label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="all">All Payment</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPaymentFilter('all');
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="text-xs text-gray-500">
                {totalCount} bookings found
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Bookings</h3>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">Sort:</span>
              <button
                onClick={() => handleSort('bookingDate')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'bookingDate' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Date
                {sortBy === 'bookingDate' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('totalAmount')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'totalAmount' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Amount
                {sortBy === 'totalAmount' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('createdAt')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'createdAt' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Created
                {sortBy === 'createdAt' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div>
                      <div className="text-xs font-semibold text-gray-900">{booking.service?.title || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{booking.service?.category || ''}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-3 h-3 text-gray-400 mr-1" />
                      <div>
                        <div className="text-xs text-gray-900">
                          {booking.client?.firstName} {booking.client?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{booking.client?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-3 h-3 text-gray-400 mr-1" />
                      <div>
                        <div className="text-xs text-gray-900">
                          {booking.provider?.firstName} {booking.provider?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{booking.provider?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-900">
                      {new Date(booking.bookingDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {booking.duration}h duration
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs font-semibold text-gray-900">
                      {formatCurrency(booking.pricing.totalAmount, booking.pricing.currency || getDefaultCurrency(appSettings), { appSettings })}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.payment.status)}`}>
                      {booking.payment.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedBooking(booking);
                          setViewModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View details"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      {booking.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(booking._id, 'confirmed')}
                            className="text-green-600 hover:text-green-900"
                            title="Confirm"
                            disabled={submitting}
                          >
                            <CheckCircle className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(booking._id, 'cancelled')}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel"
                            disabled={submitting}
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bookings.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No bookings found</h3>
            <p className="text-xs text-gray-500">Try adjusting your filters.</p>
          </div>
        )}
      </div>

      {/* View Booking Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedBooking(null);
        }}
        title="Booking Details"
        size="xl"
      >
        {selectedBooking && (
          <div className="space-y-6">
            {/* Service Info */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Service</h4>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-lg font-semibold">{selectedBooking.service?.title}</p>
                <p className="text-sm text-gray-600">{selectedBooking.service?.category} / {selectedBooking.service?.subcategory}</p>
              </div>
            </div>

            {/* Client & Provider */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Client</h4>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="font-medium">{selectedBooking.client?.firstName} {selectedBooking.client?.lastName}</p>
                  <p className="text-sm text-gray-600">{selectedBooking.client?.email}</p>
                  <p className="text-sm text-gray-600">{selectedBooking.client?.phoneNumber}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Provider</h4>
                <div className="bg-green-50 p-3 rounded">
                  <p className="font-medium">{selectedBooking.provider?.firstName} {selectedBooking.provider?.lastName}</p>
                  <p className="text-sm text-gray-600">{selectedBooking.provider?.email}</p>
                  <p className="text-sm text-gray-600">{selectedBooking.provider?.phoneNumber}</p>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Booking Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Date</label>
                  <p className="text-sm">{new Date(selectedBooking.bookingDate).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Duration</label>
                  <p className="text-sm">{selectedBooking.duration} hours</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Created</label>
                  <p className="text-sm">{new Date(selectedBooking.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            {selectedBooking.address && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Location</h4>
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    {selectedBooking.address.street && <p>{selectedBooking.address.street}</p>}
                    <p>
                      {selectedBooking.address.city}, {selectedBooking.address.state} {selectedBooking.address.zipCode}
                    </p>
                    {selectedBooking.address.country && <p>{selectedBooking.address.country}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Special Instructions */}
            {selectedBooking.specialInstructions && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Special Instructions</h4>
                <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded">{selectedBooking.specialInstructions}</p>
              </div>
            )}

            {/* Payment */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Payment</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <label className="text-xs font-medium text-gray-500">Amount</label>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(selectedBooking.pricing.totalAmount, selectedBooking.pricing.currency || getDefaultCurrency(appSettings), { appSettings })}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <label className="text-xs font-medium text-gray-500">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedBooking.payment.status)}`}>
                    {selectedBooking.payment.status}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <label className="text-xs font-medium text-gray-500">Method</label>
                  <p className="text-sm">{selectedBooking.payment.method || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Review */}
            {selectedBooking.review && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Review</h4>
                <div className="bg-yellow-50 p-3 rounded">
                  <div className="flex items-center mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < selectedBooking.review!.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                    <span className="ml-2 text-sm font-medium">{selectedBooking.review.rating}/5</span>
                  </div>
                  {selectedBooking.review.comment && (
                    <p className="text-sm text-gray-700">{selectedBooking.review.comment}</p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              {selectedBooking.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedBooking._id, 'confirmed');
                      setViewModalOpen(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                    disabled={submitting}
                  >
                    Confirm Booking
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedBooking._id, 'cancelled');
                      setViewModalOpen(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    disabled={submitting}
                  >
                    Cancel Booking
                  </button>
                </>
              )}
              {selectedBooking.status === 'confirmed' && (
                <button
                  onClick={() => {
                    handleUpdateStatus(selectedBooking._id, 'completed');
                    setViewModalOpen(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  disabled={submitting}
                >
                  Mark Completed
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

