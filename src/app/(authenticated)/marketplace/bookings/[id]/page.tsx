"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { logger } from "@/lib/logger";
import { useAppSettings } from "@/hooks/useAppSettings";
import { getDefaultCurrency } from "@/lib/settings-utils";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency-utils";

interface Booking {
  _id?: string;
  id?: string;
  service: {
    _id?: string;
    id?: string;
    title?: string;
    name?: string;
    description?: string;
    category?: string;
    price?: number;
    duration?: number;
    pricing?: {
      basePrice?: number;
      currency?: string;
      type?: string;
    };
    provider?: string | {
      _id?: string;
      id?: string;
      firstName?: string;
      lastName?: string;
      name?: string;
      phoneNumber?: string;
      phone?: string;
      email?: string;
      profile?: {
        avatar?: string;
      };
      avatar?: string;
      rating?: number;
      reviewCount?: number;
    };
  };
  provider?: {
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    phoneNumber?: string;
    phone?: string;
    email?: string;
    profile?: {
      avatar?: string;
    };
    avatar?: string;
    rating?: number;
    reviewCount?: number;
  };
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  date?: string;
  time?: string;
  bookingDate?: string;
  duration: number;
  totalPrice?: number;
  notes?: string;
  contactPhone?: string;
  contactEmail?: string;
  createdAt: string;
  updatedAt: string;
  paymentStatus?: "PENDING" | "PAID" | "REFUNDED" | "pending" | "paid" | "refunded";
  payment?: {
    status?: string;
    method?: string;
  };
  paymentMethod?: string;
  pricing?: {
    basePrice?: number;
    totalAmount?: number;
    currency?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { settings: appSettings } = useAppSettings();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.marketplaceBookings}/${params.id}`, createAuthFetchOptions());
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to fetch booking: ${response.status}`);
      }

      const data = await response.json();
      // Handle different response structures: { success: true, data: {...} } or direct booking object
      const bookingData = data?.data || data?.booking || data;
      
      if (!bookingData) {
        throw new Error("Booking data is missing from response");
      }
      
      setBooking(bookingData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load booking details";
      logger.error("Error fetching booking", error instanceof Error ? error : new Error(String(error)), { bookingId: params.id });
      setError(errorMessage);
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
      }));

      if (!response.ok) {
        throw new Error("Failed to update booking status");
      }

      // Refresh booking data
      fetchBooking();
    } catch (error) {
      logger.error("Error updating booking status", error instanceof Error ? error : new Error(String(error)), { bookingId: params.id, status });
      alert("Failed to update booking status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = useCallback((price: number, currency?: string) => {
    // Priority: 1. Provided currency, 2. Booking pricing currency, 3. Service pricing currency, 4. App settings default
    const currencyCode = currency || 
      booking?.pricing?.currency || 
      (typeof booking?.service?.pricing === 'object' ? booking.service.pricing.currency : undefined) ||
      getDefaultCurrency(appSettings);
    return formatCurrencyUtil(price, currencyCode, {
      appSettings,
    });
  }, [booking, appSettings]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const formatTime = useCallback((timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }, []);

  const handleDownloadReceipt = useCallback(async () => {
    if (!booking) return;

    try {
      // Dynamically import jsPDF
      const { default: jsPDF } = await import('jspdf');
      
      const bookingId = booking._id || booking.id || params.id;
      const serviceName = booking.service?.name || booking.service?.title || 'Service';
      const bookingDate = booking.date ? formatDate(booking.date) : booking.bookingDate ? formatDate(booking.bookingDate) : 'N/A';
      const bookingTime = booking.time ? formatTime(booking.time) : booking.bookingDate ? new Date(booking.bookingDate).toLocaleTimeString() : 'N/A';
      const totalAmount = booking.totalPrice || booking.pricing?.totalAmount || 0;
      const servicePrice = booking.service?.price || booking.pricing?.basePrice || 0;
      const platformFee = totalAmount - servicePrice;
      const currency = booking.pricing?.currency || booking.service?.pricing?.currency || getDefaultCurrency(appSettings);
      const formattedTotal = formatPrice(totalAmount, currency);
      const formattedServicePrice = formatPrice(servicePrice, currency);
      const formattedPlatformFee = formatPrice(platformFee, currency);
      const paymentMethod = booking.paymentMethod || booking.payment?.method || 'N/A';
      const paymentStatus = booking.paymentStatus || booking.payment?.status || 'PENDING';
      const bookingStatus = booking.status || 'PENDING';
      const providerName = booking.provider?.name || 
        (booking.provider?.firstName && booking.provider?.lastName ? `${booking.provider.firstName} ${booking.provider.lastName}` : 
        booking.provider?.firstName || booking.provider?.lastName || 'Provider');
      const address = booking.address ? 
        `${booking.address.street || ''}, ${booking.address.city || ''}, ${booking.address.state || ''} ${booking.address.zipCode || ''}`.trim() : 
        'N/A';

      // Create PDF document - A4 format
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Helper function to add text
      const addText = (text: string, x: number, y: number, options: { fontSize?: number; fontStyle?: string; align?: 'left' | 'center' | 'right'; color?: [number, number, number]; maxWidth?: number } = {}) => {
        const { fontSize = 12, fontStyle = 'normal', align = 'left', color = [0, 0, 0], maxWidth } = options;
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        doc.setTextColor(color[0], color[1], color[2]);
        
        const textMaxWidth = maxWidth || (pageWidth - (x * 2));
        const lines = doc.splitTextToSize(text, textMaxWidth);
        doc.text(lines, x, y, { align });
        return lines.length * (fontSize * 0.35) + 2;
      };

      // Helper to draw status badge with yellow background
      const drawStatusBadge = (text: string, x: number, y: number) => {
        doc.setFillColor(255, 243, 205); // Light yellow background #FFF3CD
        doc.setTextColor(133, 100, 4); // Dark yellow text #856404
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const textWidth = doc.getTextWidth(text);
        const padding = 5;
        const badgeHeight = 8;
        doc.roundedRect(x, y - badgeHeight, textWidth + (padding * 2), badgeHeight + 2, 1.5, 1.5, 'F');
        doc.text(text, x + padding, y - 1);
        return textWidth + (padding * 2) + 3;
      };

      // Load and add logo at top center
      let logoAdded = false;
      let logoHeight = 0;
      try {
        const logoResponse = await fetch('/logo-only.svg');
        if (logoResponse.ok) {
          const logoText = await logoResponse.text();
          const img = document.createElement('img');
          const svgBlob = new Blob([logoText], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = 100;
                canvas.height = 100;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0, 100, 100);
                  const imgData = canvas.toDataURL('image/png');
                  
                  // Add logo to PDF at top center
                  const logoWidth = 30;
                  logoHeight = 30;
                  doc.addImage(imgData, 'PNG', (pageWidth - logoWidth) / 2, yPos, logoWidth, logoHeight);
                  logoAdded = true;
                }
                URL.revokeObjectURL(url);
                resolve();
              } catch (err) {
                URL.revokeObjectURL(url);
                reject(err);
              }
            };
            img.onerror = () => {
              URL.revokeObjectURL(url);
              reject(new Error('Failed to load logo'));
            };
            img.src = url;
          });
        }
      } catch (logoError) {
        logger.debug('Logo loading failed', { error: logoError });
      }
      
      // Fallback logo
      if (!logoAdded) {
        doc.setFillColor(76, 175, 80);
        doc.roundedRect((pageWidth - 30) / 2, yPos, 30, 30, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('LP', pageWidth / 2, yPos + 18, { align: 'center' });
        logoHeight = 30;
      }

      yPos += logoHeight + 10;

      // Header Section - "Booking Receipt" title (centered, green, large)
      yPos += addText('Booking Receipt', pageWidth / 2, yPos, { fontSize: 24, fontStyle: 'bold', align: 'center', color: [76, 175, 80] });
      yPos += 5;
      
      // Receipt number
      yPos += addText(`Receipt #${bookingId}`, pageWidth / 2, yPos, { fontSize: 11, align: 'center', color: [0, 0, 0] });
      yPos += 8;
      
      // Green horizontal line (2px border-bottom equivalent)
      doc.setDrawColor(76, 175, 80);
      doc.setLineWidth(0.7);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 12;

      // Two-column grid layout (matching HTML grid)
      const columnWidth = (pageWidth - (margin * 3)) / 2;
      const leftX = margin;
      const rightX = margin + columnWidth + margin;
      const columnStartY = yPos;

      // Left Column: Booking Details
      // Section header (h3 style: gray, uppercase, 14px equivalent)
      yPos += addText('BOOKING DETAILS', leftX, yPos, { fontSize: 10, fontStyle: 'bold', color: [102, 102, 102] });
      yPos += 6;
      
      // Info paragraphs (16px font equivalent)
      yPos += addText(`Service: ${serviceName}`, leftX, yPos, { fontSize: 12 });
      yPos += addText(`Date: ${bookingDate}`, leftX, yPos, { fontSize: 12 });
      yPos += addText(`Time: ${bookingTime}`, leftX, yPos, { fontSize: 12 });
      yPos += addText(`Duration: ${booking.duration} ${booking.duration === 1 ? 'hour' : 'hours'}`, leftX, yPos, { fontSize: 12 });
      
      // Status badge - inline with "Status:" label
      const statusLabelY = yPos + 3;
      addText('Status: ', leftX, statusLabelY, { fontSize: 12 });
      const statusText = bookingStatus.toLowerCase();
      const statusLabelWidth = doc.getTextWidth('Status: ');
      drawStatusBadge(statusText, leftX + statusLabelWidth, statusLabelY);
      yPos += 8;

      // Right Column: Payment Information
      let rightY = columnStartY;
      // Section header
      rightY += addText('PAYMENT INFORMATION', rightX, rightY, { fontSize: 10, fontStyle: 'bold', color: [102, 102, 102] });
      rightY += 6;
      
      // Info paragraphs
      rightY += addText(`Payment Method: ${paymentMethod}`, rightX, rightY, { fontSize: 12 });
      
      // Payment status badge - inline with "Payment Status:" label
      const paymentStatusLabelY = rightY + 3;
      addText('Payment Status: ', rightX, paymentStatusLabelY, { fontSize: 12 });
      const paymentStatusText = paymentStatus.toLowerCase();
      const paymentStatusLabelWidth = doc.getTextWidth('Payment Status: ');
      drawStatusBadge(paymentStatusText, rightX + paymentStatusLabelWidth, paymentStatusLabelY);
      rightY += 8;
      
      rightY += addText(`Provider: ${providerName}`, rightX, rightY, { fontSize: 12 });
      rightY += addText(`Location: ${address}`, rightX, rightY, { fontSize: 12, maxWidth: columnWidth });

      // Use the maximum Y position from both columns
      yPos = Math.max(yPos, rightY) + 12;

      // Pricing Table (no section header, just the table)
      // Table header with gray background (#f5f5f5)
      const tableHeaderY = yPos;
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, tableHeaderY - 6, pageWidth - (margin * 2), 8, 'F');
      yPos += addText('Description', margin + 3, yPos, { fontSize: 11, fontStyle: 'bold' });
      addText('Amount', pageWidth - margin - 3, yPos, { fontSize: 11, fontStyle: 'bold', align: 'right' });
      yPos += 8;

      // Service Fee row
      yPos += addText('Service Fee', margin + 3, yPos, { fontSize: 11 });
      addText(formattedServicePrice, pageWidth - margin - 3, yPos, { fontSize: 11, align: 'right' });
      yPos += 7;

      // Platform Fee row
      if (platformFee > 0) {
        yPos += addText('Platform Fee', margin + 3, yPos, { fontSize: 11 });
        addText(formattedPlatformFee, pageWidth - margin - 3, yPos, { fontSize: 11, align: 'right' });
        yPos += 7;
      }

      // Total row with highlighted background (#f9f9f9) and larger font (18px equivalent)
      const totalRowY = yPos;
      doc.setFillColor(249, 249, 249);
      doc.rect(margin, totalRowY - 2, pageWidth - (margin * 2), 10, 'F');
      yPos += addText('Total', margin + 3, yPos, { fontSize: 13, fontStyle: 'bold' });
      addText(formattedTotal, pageWidth - margin - 3, yPos, { fontSize: 13, fontStyle: 'bold', align: 'right' });
      yPos += 15;

      // Special Instructions (if available)
      if (booking.notes) {
        if (yPos > pageHeight - 50) {
          doc.addPage();
          yPos = margin;
        }
        yPos += addText('SPECIAL INSTRUCTIONS', margin, yPos, { fontSize: 11, fontStyle: 'bold' });
        yPos += 6;
        yPos += addText(booking.notes, margin, yPos, { fontSize: 11, maxWidth: pageWidth - (margin * 2) });
        yPos += 12;
      }

      // Footer section (matching HTML footer style)
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }
      
      // Footer top border (1px solid #ddd)
      doc.setDrawColor(221, 221, 221);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
      
      // Footer text (12px, gray #666, centered)
      addText(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { fontSize: 9, align: 'center', color: [102, 102, 102] });
      yPos += 5;
      addText('Thank you for using our service!', pageWidth / 2, yPos, { fontSize: 9, align: 'center', color: [102, 102, 102] });

      // Save PDF
      const fileName = `booking-receipt-${bookingId}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      logger.debug('PDF receipt downloaded', { bookingId });
    } catch (error) {
      logger.error('Error generating PDF receipt', error instanceof Error ? error : new Error(String(error)), { bookingId: booking._id || booking.id });
      alert('Failed to generate PDF. Please ensure jspdf is installed: npm install jspdf');
    }
  }, [booking, params.id, appSettings, formatPrice, formatDate, formatTime]);

  const handleViewService = useCallback(() => {
    if (!booking) return;
    
    const serviceId = booking.service?.id || booking.service?._id;
    if (serviceId) {
      router.push(`/marketplace/services/${serviceId}`);
    }
  }, [booking, router]);

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
            <h1 className="text-2xl font-bold text-gray-700 mb-2">{booking.service?.name || booking.service?.title || 'Service'}</h1>
            <div className="flex items-center gap-4 mb-4">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                {getStatusIcon(booking.status)}
                {booking.status.replace('_', ' ')}
              </span>
              {(() => {
                const paymentStatus = booking.paymentStatus || booking.payment?.status || 'PENDING';
                return (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    paymentStatus === "PAID" || paymentStatus === "paid"
                      ? "bg-green-100 text-green-800" 
                      : paymentStatus === "PENDING" || paymentStatus === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    <CreditCard className="w-4 h-4" />
                    {paymentStatus.toUpperCase()}
                  </span>
                );
              })()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">
              {formatPrice(booking.totalPrice || booking.pricing?.totalAmount || 0)}
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
                <p className="text-gray-600">{booking.service?.description || 'No description available'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">Category</h3>
                  <p className="text-gray-600 capitalize">{booking.service?.category ? booking.service.category.toLowerCase().replace('_', ' ') : 'N/A'}</p>
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
                    <span>{booking.date ? formatDate(booking.date) : booking.bookingDate ? formatDate(booking.bookingDate) : 'Not scheduled'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 mt-1">
                    <Clock className="w-4 h-4" />
                    <span>{booking.time ? formatTime(booking.time) : booking.bookingDate ? new Date(booking.bookingDate).toLocaleTimeString() : 'Not scheduled'}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">Contact Information</h3>
                  <div className="space-y-1">
                    {booking.contactPhone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{booking.contactPhone}</span>
                      </div>
                    )}
                    {booking.contactEmail && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{booking.contactEmail}</span>
                      </div>
                    )}
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
                <span className="font-medium">{formatPrice(booking.service?.price || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Platform Fee</span>
                <span className="font-medium">{formatPrice((booking.totalPrice || 0) - (booking.service?.price || 0))}</span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Total</span>
                  <span className="text-lg font-bold text-green-600">{formatPrice(booking.totalPrice || booking.pricing?.totalAmount || 0)}</span>
                </div>
              </div>
              {(booking.paymentMethod || booking.payment?.method) && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Payment Method: {booking.paymentMethod || booking.payment?.method}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Provider Information */}
          {(() => {
            // Get provider from top-level booking.provider or booking.service.provider
            const provider = booking.provider || (typeof booking.service?.provider === 'object' ? booking.service.provider : null);
            
            if (!provider || typeof provider === 'string') {
              return null; // Don't render if provider is missing or just an ID
            }

            const providerName = provider.name || 
              (provider.firstName && provider.lastName ? `${provider.firstName} ${provider.lastName}` : 
              provider.firstName || provider.lastName || 'Provider');
            const providerAvatar = provider.avatar || provider.profile?.avatar;
            const providerPhone = provider.phone || provider.phoneNumber || 'N/A';
            const providerEmail = provider.email || 'N/A';
            const providerRating = provider.rating || 0;
            const providerReviewCount = provider.reviewCount || 0;
            const initials = providerName.charAt(0).toUpperCase();

            return (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Service Provider</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    {providerAvatar ? (
                      <Image
                        src={providerAvatar}
                        alt={providerName}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-medium text-gray-600">
                        {initials}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">{providerName}</h4>
                    {providerRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">
                          {providerRating.toFixed(1)} {providerReviewCount > 0 && `(${providerReviewCount} reviews)`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {providerPhone !== 'N/A' && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{providerPhone}</span>
                    </div>
                  )}
                  {providerEmail !== 'N/A' && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{providerEmail}</span>
                    </div>
                  )}
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
            );
          })()}

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

              <button 
                onClick={handleDownloadReceipt}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Receipt
              </button>

              {(booking.service?.id || booking.service?._id) && (
                <button
                  onClick={handleViewService}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  View Service
                </button>
              )}
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
