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
  Download,
  BarChart3
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { useAppSettings } from "@/hooks/useAppSettings";
import { getDefaultCurrency } from "@/lib/settings-utils";
import { formatCurrency as formatCurrencyUtil, CURRENCY_CONFIGS } from "@/lib/currency-utils";
import { useRoleAccess } from "@/components/role-guard";
import { CommunicationAPI } from "@/lib/communication-utils";

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
  const { isServiceProvider, isAdmin } = useRoleAccess();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [messaging, setMessaging] = useState(false);

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
    // Normalize currency to ensure it's a currency code (not symbol)
    const normalizeCurrencyCode = (currency: string | undefined | null): string => {
      if (!currency) return getDefaultCurrency(appSettings);
      
      // If it's already a valid currency code, return it
      if (CURRENCY_CONFIGS[currency.toUpperCase()]) {
        return currency.toUpperCase();
      }
      
      // Map currency symbols to codes
      const symbolToCode: Record<string, string> = {
        '₱': 'PHP',
        '$': 'USD',
        '€': 'EUR',
        '£': 'GBP',
        '¥': 'JPY',
        'A$': 'AUD',
        'C$': 'CAD',
        'S$': 'SGD',
        '±': 'PHP', // Fallback for unrecognized symbols
      };
      
      // Check if it's a symbol
      const normalized = currency.trim();
      if (symbolToCode[normalized]) {
        return symbolToCode[normalized];
      }
      
      // Try to find by symbol in configs
      for (const [code, config] of Object.entries(CURRENCY_CONFIGS)) {
        if (config.symbol === normalized) {
          return code;
        }
      }
      
      // Default to app settings currency
      return getDefaultCurrency(appSettings);
    };
    
    // Priority: 1. Provided currency, 2. Booking pricing currency, 3. Service pricing currency, 4. App settings default
    const rawCurrency = currency || 
      booking?.pricing?.currency || 
      (typeof booking?.service?.pricing === 'object' ? booking.service.pricing.currency : undefined) ||
      getDefaultCurrency(appSettings);
    
    const currencyCode = normalizeCurrencyCode(rawCurrency);
    return formatCurrencyUtil(price, currencyCode, {
      appSettings,
      showSymbol: true,
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
      // Format booking date and time properly for PDF
      let bookingDate = 'N/A';
      let bookingTime = 'N/A';
      
      if (booking.date) {
        // Format date without weekday for PDF (more compact)
        const date = new Date(booking.date);
        bookingDate = date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      } else if (booking.bookingDate) {
        const date = new Date(booking.bookingDate);
        bookingDate = date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      }
      
      if (booking.time) {
        bookingTime = formatTime(booking.time);
      } else if (booking.bookingDate) {
        const bookingDateTime = new Date(booking.bookingDate);
        bookingTime = bookingDateTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      }
      const totalAmount = booking.totalPrice || booking.pricing?.totalAmount || 0;
      const servicePrice = booking.service?.price || booking.pricing?.basePrice || 0;
      const platformFee = totalAmount - servicePrice;
      
      // Normalize currency to ensure it's a currency code (not symbol)
      const normalizeCurrencyCode = (currency: string | undefined | null): string => {
        if (!currency) return getDefaultCurrency(appSettings);
        
        // If it's already a valid currency code, return it
        if (CURRENCY_CONFIGS[currency.toUpperCase()]) {
          return currency.toUpperCase();
        }
        
        // Map currency symbols to codes
        const symbolToCode: Record<string, string> = {
          '₱': 'PHP',
          '$': 'USD',
          '€': 'EUR',
          '£': 'GBP',
          '¥': 'JPY',
          'A$': 'AUD',
          'C$': 'CAD',
          'S$': 'SGD',
        };
        
        // Check if it's a symbol
        const normalized = currency.trim();
        if (symbolToCode[normalized]) {
          return symbolToCode[normalized];
        }
        
        // Try to find by symbol in configs
        for (const [code, config] of Object.entries(CURRENCY_CONFIGS)) {
          if (config.symbol === normalized) {
            return code;
          }
        }
        
        // Default to app settings currency
        return getDefaultCurrency(appSettings);
      };
      
      const rawCurrency = booking.pricing?.currency || booking.service?.pricing?.currency;
      const currency = normalizeCurrencyCode(rawCurrency);
      const formattedTotal = formatPrice(totalAmount, currency);
      const formattedServicePrice = formatPrice(servicePrice, currency);
      const formattedPlatformFee = formatPrice(platformFee, currency);
      const paymentMethod = booking.paymentMethod || booking.payment?.method || 'N/A';
      const paymentStatus = booking.paymentStatus || booking.payment?.status || 'PENDING';
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
        
        // Calculate proper maxWidth based on alignment
        let textMaxWidth: number;
        if (maxWidth) {
          textMaxWidth = maxWidth;
        } else if (align === 'center') {
          // For centered text, use full page width minus margins
          textMaxWidth = pageWidth - (margin * 2);
        } else if (align === 'right') {
          // For right-aligned text, calculate from x to margin
          textMaxWidth = x - margin;
        } else {
          // For left-aligned text, calculate from x to right margin
          textMaxWidth = pageWidth - x - margin;
        }
        
        // Only split text if it actually needs to be split
        // For short single words (like "INVOICE"), don't split
        if (!text.includes(' ') && text.length <= 15) {
          // Check if text fits without splitting
          const textWidth = doc.getTextWidth(text);
          if (textWidth <= textMaxWidth) {
            // Single word that fits - render directly without splitting
            doc.text(text, x, y, { align });
            return fontSize * 0.35 + 2;
          }
        }
        
        // Split text for longer content or multi-word text
        const lines = doc.splitTextToSize(text, textMaxWidth);
        doc.text(lines, x, y, { align });
        return lines.length * (fontSize * 0.35) + 2;
      };

      // Load and add logo at top left
      let logoAdded = false;
      const logoHeight = 20; // Default height
      const logoWidth = 20;
      const logoY = yPos;
      
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
                  
                  // Add logo to PDF at top left
                  doc.addImage(imgData, 'PNG', margin, logoY, logoWidth, logoHeight);
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
      
      // Fallback logo - positioned on left
      if (!logoAdded) {
        doc.setFillColor(76, 175, 80);
        doc.roundedRect(margin, logoY, logoWidth, logoHeight, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('LP', margin + 10, logoY + 12, { align: 'center' });
      }

      // Invoice Header - positioned to the right of logo, aligned with logo top
      const invoiceTitleX = margin + logoWidth + 8;
      const invoiceTitleY = logoY + (logoHeight / 2) - 4; // Center align with logo
      addText('INVOICE', invoiceTitleX, invoiceTitleY, { fontSize: 22, fontStyle: 'bold', color: [0, 0, 0] });
      
      yPos += logoHeight + 8;

      // Invoice details in two columns
      const leftX = margin;
      const rightX = pageWidth / 2 + 20; // Start right column from middle of page
      
      // Left side - Invoice number and date - improved readability
      addText('Invoice #:', leftX, yPos, { fontSize: 10, color: [60, 60, 60] });
      addText(String(bookingId || 'N/A'), leftX + 30, yPos, { fontSize: 10, fontStyle: 'bold', color: [0, 0, 0] });
      yPos += 5;
      
      const invoiceDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      addText('Date:', leftX, yPos, { fontSize: 10, color: [60, 60, 60] });
      addText(invoiceDate, leftX + 30, yPos, { fontSize: 10, color: [0, 0, 0] });
      
      // Right side - Booking details - compressed and improved
      const bookingDateLabelX = rightX;
      const bookingDateValueX = pageWidth - margin - 5; // Right align to page edge
      
      // Booking Date - single line, right aligned
      addText('Booking Date:', bookingDateLabelX, yPos - 5, { fontSize: 10, color: [60, 60, 60] });
      // Truncate if too long and ensure it fits
      const bookingDateText = bookingDate.length > 25 ? bookingDate.substring(0, 22) + '...' : bookingDate;
      addText(bookingDateText, bookingDateValueX, yPos - 5, { fontSize: 10, color: [0, 0, 0], align: 'right' });
      
      // Time - single line, right aligned
      addText('Time:', bookingDateLabelX, yPos, { fontSize: 10, color: [60, 60, 60] });
      addText(bookingTime, bookingDateValueX, yPos, { fontSize: 10, color: [0, 0, 0], align: 'right' });
      
      yPos += 10;

      // Horizontal line separator
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Bill To / Service Information section
      const sectionWidth = (pageWidth - (margin * 3)) / 2;
      const billToX = margin;
      const serviceInfoX = margin + sectionWidth + margin;

      // Bill To section - improved readability
      yPos += addText('Bill To', billToX, yPos, { fontSize: 11, fontStyle: 'bold', color: [0, 0, 0] });
      yPos += 5;
      const customerName = booking.contactEmail || 'Customer';
      yPos += addText(customerName, billToX, yPos, { fontSize: 10, color: [0, 0, 0] });
      if (booking.contactPhone) {
        yPos += addText(booking.contactPhone, billToX, yPos, { fontSize: 10, color: [0, 0, 0] });
      }
      if (address && address !== 'N/A') {
        yPos += addText(address, billToX, yPos, { fontSize: 10, color: [0, 0, 0], maxWidth: sectionWidth });
      }
      
      // Service Information section - improved readability
      // Calculate starting Y position based on Bill To content
      const billToLines = 1 + (booking.contactPhone ? 1 : 0) + (address && address !== 'N/A' ? 1 : 0);
      let serviceInfoY = yPos - (billToLines * 5);
      serviceInfoY += addText('Service Information', serviceInfoX, serviceInfoY, { fontSize: 11, fontStyle: 'bold', color: [0, 0, 0] });
      serviceInfoY += 5;
      serviceInfoY += addText(serviceName, serviceInfoX, serviceInfoY, { fontSize: 10, color: [0, 0, 0], maxWidth: sectionWidth });
      serviceInfoY += 4;
      const providerLabelY = serviceInfoY;
      addText('Provider:', serviceInfoX, providerLabelY, { fontSize: 10, color: [60, 60, 60] });
      addText(providerName, serviceInfoX + 25, providerLabelY, { fontSize: 10, fontStyle: 'bold', color: [0, 0, 0] });
      serviceInfoY += 4;
      const durationLabelY = serviceInfoY;
      addText('Duration:', serviceInfoX, durationLabelY, { fontSize: 10, color: [60, 60, 60] });
      addText(`${booking.duration} ${booking.duration === 1 ? 'hour' : 'hours'}`, serviceInfoX + 25, durationLabelY, { fontSize: 10, color: [0, 0, 0] });
      serviceInfoY += 4;
      
      yPos = Math.max(yPos, serviceInfoY) + 10;

      // Items Table - Simple and clean
      // Table header
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      const tableHeaderY = yPos;
      doc.line(margin, tableHeaderY, pageWidth - margin, tableHeaderY);
      yPos += 6;
      
      // Header text - improved readability
      addText('Description', margin + 5, yPos, { fontSize: 11, fontStyle: 'bold', color: [0, 0, 0] });
      addText('Amount', pageWidth - margin - 5, yPos, { fontSize: 11, fontStyle: 'bold', align: 'right', color: [0, 0, 0] });
      yPos += 6;
      
      // Line under header
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 7;

      // Service Fee row - improved readability
      yPos += addText('Service Fee', margin + 5, yPos, { fontSize: 11, color: [0, 0, 0] });
      addText(formattedServicePrice, pageWidth - margin - 5, yPos - 7, { fontSize: 11, fontStyle: 'bold', align: 'right', color: [0, 0, 0] });
      yPos += 4;

      // Platform Fee row - improved readability
      if (platformFee > 0) {
        yPos += addText('Platform Fee', margin + 5, yPos, { fontSize: 11, color: [0, 0, 0] });
        addText(formattedPlatformFee, pageWidth - margin - 5, yPos - 7, { fontSize: 11, fontStyle: 'bold', align: 'right', color: [0, 0, 0] });
        yPos += 4;
      }

      // Total section - clean separator
      yPos += 2;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 7;
      
      // Total row
      addText('Total', margin + 5, yPos, { fontSize: 13, fontStyle: 'bold' });
      addText(formattedTotal, pageWidth - margin - 5, yPos, { fontSize: 13, fontStyle: 'bold', align: 'right' });
      yPos += 10;
      
      // Payment information below total - improved readability
      yPos += 5;
      addText('Payment Information', margin + 5, yPos, { fontSize: 11, fontStyle: 'bold', color: [0, 0, 0] });
      yPos += 6;
      addText(`Payment Method:`, margin + 5, yPos, { fontSize: 10, color: [60, 60, 60] });
      addText(paymentMethod, margin + 5 + 45, yPos, { fontSize: 10, fontStyle: 'bold', color: [0, 0, 0] });
      yPos += 6;
      addText(`Payment Status:`, margin + 5, yPos, { fontSize: 10, color: [60, 60, 60] });
      addText(paymentStatus.toUpperCase(), margin + 5 + 45, yPos, { fontSize: 10, fontStyle: 'bold', color: [0, 0, 0] });
      yPos += 10;

      // Notes section (if available) - improved readability
      if (booking.notes) {
        if (yPos > pageHeight - 50) {
          doc.addPage();
          yPos = margin;
        }
        yPos += 7;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 7;
        addText('Notes', margin + 5, yPos, { fontSize: 11, fontStyle: 'bold', color: [0, 0, 0] });
        yPos += 5;
        yPos += addText(booking.notes, margin + 5, yPos, { fontSize: 10, color: [0, 0, 0], maxWidth: pageWidth - (margin * 2) - 10 });
        yPos += 8;
      }

      // Footer section - Simple and minimal
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin;
      }
      
      // Footer separator
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 7;
      
      // Footer text - improved readability
      addText(`Invoice generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, yPos, { fontSize: 9, align: 'center', color: [100, 100, 100] });

      // Save PDF
      const fileName = `invoice-${bookingId}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      logger.debug('PDF invoice downloaded', { bookingId });
    } catch (error) {
      logger.error('Error generating PDF receipt', error instanceof Error ? error : new Error(String(error)), { bookingId: booking._id || booking.id });
      alert('Failed to generate PDF. Please ensure jspdf is installed: npm install jspdf');
    }
  }, [booking, params.id, appSettings, formatPrice, formatTime]);

  const handleViewService = useCallback(() => {
    if (!booking) return;
    
    const serviceId = booking.service?.id || booking.service?._id;
    if (serviceId) {
      router.push(`/marketplace/services/${serviceId}`);
    }
  }, [booking, router]);

  const handleMessage = useCallback(async () => {
    if (!booking || messaging) return;

    // Get provider from top-level booking.provider or booking.service.provider
    const provider = booking.provider || (typeof booking.service?.provider === 'object' ? booking.service.provider : null);
    
    if (!provider || typeof provider === 'string') {
      alert('Provider information is not available.');
      return;
    }

    const providerId = provider._id || provider.id;
    if (!providerId) {
      alert('Provider ID is not available.');
      return;
    }

    try {
      setMessaging(true);
      let conversationId: string | undefined;
      
      // Try to get existing conversation
      try {
        const response = await CommunicationAPI.getConversationWithUser(providerId);
        const conversation = response?.data?.conversation || response?.conversation || response?.data || response;
        conversationId = conversation?._id || conversation?.id;
      } catch (error) {
        // If conversation doesn't exist (404), create a new one
        if (error instanceof Error && error.message.includes('404')) {
          logger.debug('Conversation not found, creating new one', { providerId });
          
          // Create conversation with booking context
          const bookingId = booking._id || booking.id;
          const serviceName = booking.service?.name || booking.service?.title || 'Service';
          const conversationData: {
            participants: string[];
            type: string;
            subject: string;
            context?: { bookingId: string };
          } = {
            participants: [providerId],
            type: 'booking',
            subject: `Booking: ${serviceName}`
          };
          
          if (bookingId) {
            conversationData.context = { bookingId };
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
      logger.error('Error opening conversation', error instanceof Error ? error : new Error(String(error)), { providerId: provider._id || provider.id });
      alert('Failed to open conversation. Please try again.');
    } finally {
      setMessaging(false);
    }
  }, [booking, messaging, router]);

  const handleCall = useCallback(() => {
    if (!booking) return;

    // Get provider from top-level booking.provider or booking.service.provider
    const provider = booking.provider || (typeof booking.service?.provider === 'object' ? booking.service.provider : null);
    
    if (!provider || typeof provider === 'string') {
      alert('Provider phone number is not available.');
      return;
    }

    const phoneNumber = provider.phone || provider.phoneNumber;
    if (!phoneNumber || phoneNumber === 'N/A') {
      alert('Provider phone number is not available.');
      return;
    }

    // Format phone number for tel: protocol
    // Remove spaces, dashes, and parentheses, but keep + if present
    const formattedPhone = phoneNumber.replace(/[\s\-()]/g, '');
    
    // Open phone dialer
    window.location.href = `tel:${formattedPhone}`;
  }, [booking]);

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
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Payment Information</h2>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center py-0.5">
                <span className="text-gray-600 text-sm">Service Fee</span>
                <span className="font-semibold text-gray-900 text-sm">{formatPrice(booking.service?.price || booking.pricing?.basePrice || 0, booking.pricing?.currency || booking.service?.pricing?.currency)}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-gray-600 text-sm">Platform Fee</span>
                <span className="font-semibold text-gray-900 text-sm">{formatPrice((booking.totalPrice || booking.pricing?.totalAmount || 0) - (booking.service?.price || booking.pricing?.basePrice || 0), booking.pricing?.currency || booking.service?.pricing?.currency)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-700">Total</span>
                  <span className="text-base font-bold text-green-600">{formatPrice(booking.totalPrice || booking.pricing?.totalAmount || 0, booking.pricing?.currency || booking.service?.pricing?.currency)}</span>
                </div>
              </div>
              {(booking.paymentMethod || booking.payment?.method) && (
                <div className="pt-2 mt-1.5 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    Payment Method: <span className="font-medium text-gray-900">{booking.paymentMethod || booking.payment?.method}</span>
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
                  <button 
                    onClick={handleMessage}
                    disabled={messaging}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageCircle className="w-4 h-4" />
                    {messaging ? 'Opening...' : 'Message'}
                  </button>
                  <button 
                    onClick={handleCall}
                    disabled={!providerPhone || providerPhone === 'N/A'}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
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
                Download Invoice
              </button>

              {(booking.service?.id || booking.service?._id) && (
                <button
                  onClick={handleViewService}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  View Service
                </button>
              )}

              {/* Quick Navigation Links */}
              <div className="pt-3 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Quick Links</h4>
                
                {/* My Bookings - All authenticated users can access */}
                <Link
                  href="/marketplace/my-bookings"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors mb-2"
                >
                  <Calendar className="w-4 h-4" />
                  My Bookings
                </Link>

                {/* My Services - Only service providers and admins can access */}
                {(isServiceProvider || isAdmin) && (
                  <Link
                    href="/marketplace/my-services"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    My Services
                  </Link>
                )}
              </div>
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
