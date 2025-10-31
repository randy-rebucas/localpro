"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  Calendar, 
  Clock, 
  // MapPin, 
  // User, 
  Phone, 
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  MessageCircle,
  Star,
  CreditCard,
  Download
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";

interface Booking {
  id: string;
  service: {
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    duration: number;
    provider: {
      id: string;
      name: string;
      phone: string;
      email: string;
      avatar?: string;
      rating: number;
      reviewCount: number;
    };
  };
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  date: string;
  time: string;
  duration: number;
  totalPrice: number;
  notes?: string;
  contactPhone: string;
  contactEmail: string;
  createdAt: string;
  updatedAt: string;
  paymentStatus: "PENDING" | "PAID" | "REFUNDED";
  paymentMethod?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export default function BookingDetailPage() {
  const params = useParams();
  // const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.marketplaceBookings}/${params.id}`, createAuthFetchOptions());
      
      if (!response.ok) {
        throw new Error("Booking not found");
      }

      const data = await response.json();
      setBooking(data);
    } catch (error) {
      console.error("Error fetching booking:", error);
      setError("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchBooking();
    }
  }, [params.id, fetchBooking]);

  const updateBookingStatus = async (status: string) => {
    try {
      setUpdating(true);
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.marketplaceBookingStatus}/${params.id}/status`, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update booking status");
      }

      // Refresh booking data
      fetchBooking();
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("Failed to update booking status. Please try again.");
    } finally {
      setUpdating(false);
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
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "CONFIRMED":
        return <CheckCircle className="w-4 h-4" />;
      case "IN_PROGRESS":
        return <AlertCircle className="w-4 h-4" />;
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4" />;
      case "CANCELLED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Booking Not Found</h2>
        <p className="text-gray-600 mb-6">{error || "The booking you're looking for doesn't exist."}</p>
        <Link
          href="/marketplace/bookings"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Back to Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/marketplace/bookings"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </Link>
      </div>

      {/* Booking Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-700 mb-2">{booking.service.name}</h1>
            <div className="flex items-center gap-4 mb-4">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                {getStatusIcon(booking.status)}
                {booking.status.replace('_', ' ')}
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                booking.paymentStatus === "PAID" 
                  ? "bg-green-100 text-green-800" 
                  : booking.paymentStatus === "PENDING"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}>
                <CreditCard className="w-4 h-4" />
                {booking.paymentStatus}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">
              {formatPrice(booking.totalPrice)}
            </div>
            <div className="text-sm text-gray-500">Total Amount</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Service Details</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-1">Service Description</h3>
                <p className="text-gray-600">{booking.service.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">Category</h3>
                  <p className="text-gray-600 capitalize">{booking.service.category.toLowerCase().replace('_', ' ')}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">Duration</h3>
                  <p className="text-gray-600">{booking.duration} minutes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Booking Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">Scheduled Date & Time</h3>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(booking.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 mt-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(booking.time)}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">Contact Information</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{booking.contactPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{booking.contactEmail}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">Service Location</h3>
                  {booking.address ? (
                    <div className="text-gray-600">
                      <p>{booking.address.street}</p>
                      <p>{booking.address.city}, {booking.address.state} {booking.address.zipCode}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Location to be confirmed</p>
                  )}
                </div>
                {booking.notes && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">Special Notes</h3>
                    <p className="text-gray-600">{booking.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Payment Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Service Fee</span>
                <span className="font-medium">{formatPrice(booking.service.price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Platform Fee</span>
                <span className="font-medium">{formatPrice(booking.totalPrice - booking.service.price)}</span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Total</span>
                  <span className="text-lg font-bold text-green-600">{formatPrice(booking.totalPrice)}</span>
                </div>
              </div>
              {booking.paymentMethod && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Payment Method: {booking.paymentMethod}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Provider Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Service Provider</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                {booking.service.provider.avatar ? (
                  <Image
                    src={booking.service.provider.avatar}
                    alt={booking.service.provider.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-medium text-gray-600">
                    {booking.service.provider.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-700">{booking.service.provider.name}</h4>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">
                    {booking.service.provider.rating.toFixed(1)} ({booking.service.provider.reviewCount} reviews)
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{booking.service.provider.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{booking.service.provider.email}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <MessageCircle className="w-4 h-4" />
                Message
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Phone className="w-4 h-4" />
                Call
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Actions</h3>
            <div className="space-y-3">
              {booking.status === "PENDING" && (
                <button
                  onClick={() => updateBookingStatus("CANCELLED")}
                  disabled={updating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Booking
                </button>
              )}

              {booking.status === "COMPLETED" && (
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors">
                  <Star className="w-4 h-4" />
                  Leave Review
                </button>
              )}

              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Download Receipt
              </button>

              <Link
                href={`/marketplace/services/${booking.service.id}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
              >
                View Service
              </Link>
            </div>
          </div>

          {/* Booking Timeline */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Booking Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Booking Created</p>
                  <p className="text-xs text-gray-500">{new Date(booking.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {booking.status !== "PENDING" && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Booking Confirmed</p>
                    <p className="text-xs text-gray-500">{new Date(booking.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              {booking.status === "COMPLETED" && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Service Completed</p>
                    <p className="text-xs text-gray-500">{new Date(booking.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
