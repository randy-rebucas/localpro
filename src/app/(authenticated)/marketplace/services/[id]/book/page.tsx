"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  CheckCircle2,
  CreditCard,
  Wallet,
  Loader2,
  AlertCircle,
  CheckCircle,
  Store,
  Banknote,
  QrCode,
  Eye
} from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useUserSettings } from "@/hooks/useUserSettings";
import { isPaymentMethodEnabled, getDefaultCurrency, calculateTransactionFee } from "@/lib/settings-utils";
import { getPreferredPaymentMethod } from "@/lib/user-settings-utils";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency-utils";
import { logger } from "@/lib/logger";
import { LocationAutocomplete } from "@/components/marketplace/location-autocomplete";

interface Service {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  pricing: {
    type: 'hourly' | 'fixed' | 'per_sqft' | 'per_item';
    basePrice: number;
    currency?: string;
  };
  estimatedDuration?: {
    min?: number;
    max?: number;
  };
  serviceArea?: string[];
  images?: Array<{ url?: string; thumbnail?: string }> | string[];
  provider: {
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  } | string;
  isActive?: boolean;
}

interface BookingFormData {
  // Step 1
  bookingDate: string;
  bookingTime: string;
  location: string;
  duration: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  
  // Step 2
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  specialInstructions: string;
  
  // Step 3 & 4
  paymentMethod: 'paypal' | 'paymaya' | 'wallet' | 'gcash' | 'cash' | 'qr_ph' | '';
  totalAmount: number;
}

interface WalletData {
  balance: number;
  currency: string;
}

type Step = 1 | 2 | 3 | 4 | 5;

export default function BookServicePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceIdFromUrl = params.id as string;
  const { settings: appSettings } = useAppSettings();
  const { settings: userSettings } = useUserSettings();
  
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  
  // Get preferred payment method from user settings
  const preferredPaymentMethod = getPreferredPaymentMethod(userSettings);
  
  // Get current date and time for default values (1 hour from now to pass validation)
  const getCurrentDateTime = () => {
    const now = new Date();
    // Add 1 hour (60 minutes) to ensure it's well beyond the 30-minute minimum requirement
    const futureTime = new Date(now.getTime() + 60 * 60 * 1000);
    const date = futureTime.toISOString().split('T')[0]; // YYYY-MM-DD format
    const time = futureTime.toTimeString().slice(0, 5); // HH:MM format
    return { date, time };
  };
  
  const { date: currentDate, time: currentTime } = getCurrentDateTime();
  
  const [formData, setFormData] = useState<BookingFormData>({
    bookingDate: currentDate,
    bookingTime: currentTime,
    location: '',
    duration: 2,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Philippines'
    },
    specialInstructions: '',
    paymentMethod: preferredPaymentMethod as 'paypal' | 'paymaya' | 'wallet' | '' || '',
    totalAmount: 0
  });

  // Get default currency from app settings
  const defaultCurrency = getDefaultCurrency(appSettings);
  
  // Calculate transaction fee and total with fee
  const calculateTotalWithFee = useCallback((baseAmount: number) => {
    const transactionFee = calculateTransactionFee(baseAmount, appSettings);
    return {
      baseAmount,
      transactionFee,
      totalAmount: baseAmount + transactionFee
    };
  }, [appSettings]);

  // Fetch service details
  const fetchService = useCallback(async () => {
    if (!serviceIdFromUrl) {
      setError("Service ID is missing from URL");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceServiceById}/${serviceIdFromUrl}`;
      const response = await fetch(url, getApiToken() 
        ? createAuthFetchOptions({ method: 'GET' })
        : { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      
      if (!response.ok) {
        throw new Error("Service not found");
      }

      const data = await response.json();
      const serviceData = data.success && data.data ? data.data : data;
      
      // Validate service data
      if (!serviceData || (!serviceData._id && !serviceData.id)) {
        throw new Error("Service data is invalid");
      }
      
      // Check if service is active
      if (serviceData.isActive === false) {
        setError("This service is currently not available for booking.");
      }
      
      setService(serviceData);
      
      // Set default duration and calculate initial total (including transaction fee)
      const defaultDuration = serviceData.estimatedDuration?.min || 2;
      const baseAmount = serviceData.pricing?.type === 'hourly' && defaultDuration > 0
        ? (serviceData.pricing?.basePrice || 0) * defaultDuration
        : (serviceData.pricing?.basePrice || 0);
      
      // Calculate total with transaction fee
      const transactionFee = calculateTransactionFee(baseAmount, appSettings);
      const totalWithFee = baseAmount + transactionFee;
      
      setFormData(prev => ({
        ...prev,
        duration: defaultDuration,
        totalAmount: totalWithFee
      }));
    } catch (error) {
      logger.error("Error fetching service", error instanceof Error ? error : new Error(String(error)), { serviceId: serviceIdFromUrl });
      setError("Failed to load service details. Please check the service ID and try again.");
    } finally {
      setLoading(false);
    }
  }, [serviceIdFromUrl, appSettings]);

  // Fetch wallet balance
  const fetchWallet = useCallback(async () => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.financeOverview}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
      
      if (response.ok) {
        const data = await response.json();
        const walletData = data.success && data.data ? data.data.wallet : data.wallet;
        if (walletData) {
          setWallet({
            balance: walletData.balance || 0,
            currency: walletData.currency || defaultCurrency
          });
        }
      }
    } catch (error) {
      logger.error("Error fetching wallet", error instanceof Error ? error : new Error(String(error)));
    }
  }, [defaultCurrency]);

  useEffect(() => {
    if (serviceIdFromUrl) {
      fetchService();
      fetchWallet();
    }
  }, [serviceIdFromUrl, fetchService, fetchWallet]);

  // Update total when duration changes (including transaction fee)
  useEffect(() => {
    if (service && formData.duration > 0) {
      const baseAmount = service.pricing.type === 'hourly'
        ? service.pricing.basePrice * formData.duration
        : service.pricing.basePrice;
      const breakdown = calculateTotalWithFee(baseAmount);
      setFormData(prev => ({ ...prev, totalAmount: breakdown.totalAmount }));
    }
  }, [formData.duration, service, calculateTotalWithFee]);

  // Handle step navigation
  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  // Validate step
  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        return !!(formData.bookingDate && formData.bookingTime && formData.location && formData.duration > 0);
      case 2:
        return !!(formData.address.street && formData.address.city && formData.address.state && formData.address.zipCode);
      case 3:
        return true; // Summary step, no validation needed
      case 4:
        return !!formData.paymentMethod;
      default:
        return true;
    }
  };

  // Process payment and create booking
  const processBooking = async () => {
    if (!service || !formData.paymentMethod) {
      setError('Please complete all required fields');
      return;
    }

    try {
      setProcessingPayment(true);
      setError(null);

      // Validate service is loaded and has required data
      if (!service._id && !service.id) {
        throw new Error('Service information is incomplete. Please refresh the page and try again.');
      }

      // Validate service is active
      if (service.isActive === false) {
        throw new Error('This service is currently not available for booking.');
      }

      // Combine date and time in local timezone (not UTC)
      // Parse date components separately to avoid timezone issues
      const [year, month, day] = formData.bookingDate.split('-').map(Number);
      const [hours, minutes] = formData.bookingTime.split(':').map(Number);
      
      // Create date in local timezone
      const bookingDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
      
      if (isNaN(bookingDateTime.getTime())) {
        throw new Error('Invalid date or time selected. Please check your selection.');
      }
      
      // Validate booking date is in the future (compare with current local time)
      const now = new Date();
      // Add a 30-minute buffer to account for processing delays and preparation time
      const minimumBookingTime = new Date(now.getTime() + 30 * 60 * 1000);
      
      if (bookingDateTime <= minimumBookingTime) {
        // Format minimum time for better error message
        const minDate = new Date(minimumBookingTime);
        const minDateStr = minDate.toLocaleDateString();
        const minTimeStr = minDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Check if it's the same day
        const isToday = bookingDateTime.toDateString() === now.toDateString();
        const isPast = bookingDateTime <= now;
        
        // Calculate tomorrow's date for suggestion
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDateStr = tomorrow.toLocaleDateString();
        
        if (isPast) {
          // If time has passed today, suggest tomorrow
          throw new Error(`The selected time (${formData.bookingTime}) has already passed today (${formData.bookingDate}). Please select tomorrow (${tomorrowDateStr}) or a later date, or choose a later time today.`);
        } else if (isToday) {
          throw new Error(`Booking must be at least 30 minutes in advance. The earliest available time today is ${minTimeStr}.`);
        } else {
          throw new Error(`Booking must be at least 30 minutes in advance. Please select a time after ${minTimeStr} on ${minDateStr}.`);
        }
      }

      // Use service ID from the service object (from API) or fallback to URL param
      const serviceId = service._id || service.id || params.id as string;
      if (!serviceId) {
        throw new Error('Service ID is missing. Please refresh the page and try again.');
      }

      const providerId = typeof service.provider === 'string' 
        ? service.provider 
        : (service.provider?._id || service.provider?.id || '');
      
      if (!providerId) {
        throw new Error('Provider information is missing. Please contact support.');
      }

      if (!getApiToken()) {
        throw new Error('Please log in to create a booking');
      }

      // Check wallet balance if using wallet payment
      if (formData.paymentMethod === 'wallet') {
        if (!wallet || wallet.balance < formData.totalAmount) {
          throw new Error(`Insufficient wallet balance. You have ${formatPrice(wallet?.balance || 0, wallet?.currency)}, but need ${formatPrice(formData.totalAmount, service.pricing?.currency)}`);
        }
      }

      // Validate pricing data
      if (!service.pricing || !service.pricing.basePrice) {
        throw new Error('Service pricing information is missing. Please refresh the page and try again.');
      }

      // Map payment method for backend compatibility
      // qr_ph maps to mobile_money for backend compatibility
      const backendPaymentMethod = formData.paymentMethod === 'qr_ph' 
        ? 'mobile_money' 
        : formData.paymentMethod;

      // Create booking payload matching the expected API structure
      const bookingPayload: Record<string, unknown> = {
        serviceId: serviceId,
        providerId: providerId, // Use providerId instead of provider
        bookingDate: formData.bookingDate, // Send date as string (YYYY-MM-DD)
        bookingTime: formData.bookingTime, // Send time separately (HH:MM)
        duration: formData.duration,
        paymentMethod: backendPaymentMethod, // Payment method at top level
        address: {
          ...formData.address,
          // Include coordinates if available
          ...(formData.address.coordinates && {
            coordinates: formData.address.coordinates
          })
        },
        ...(formData.specialInstructions && {
          specialInstructions: formData.specialInstructions
        })
      };

      logger.debug("Creating booking", { serviceId, providerId, bookingPayload });

      // Create booking
      const bookingUrl = `${API_BASE_URL}${API_ENDPOINTS.marketplaceBookings}`;
      const bookingResponse = await fetch(bookingUrl, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify(bookingPayload)
      }));

      if (!bookingResponse.ok) {
        // Try to get detailed error information
        let errorData: unknown = {};
        let errorMessage = "Failed to create booking";
        
        try {
          const responseText = await bookingResponse.text();
          try {
            errorData = JSON.parse(responseText) as unknown;
          } catch {
            // If not JSON, use text as error message
            errorMessage = responseText || errorMessage;
            errorData = { rawResponse: responseText };
          }
        } catch {
          // If we can't read response, use default
        }
        
        // Extract error message from various possible formats
        if (typeof errorData === "string") {
          errorMessage = errorData || errorMessage;
        } else if (errorData && typeof errorData === "object") {
          const obj = errorData as Record<string, unknown>;
          const candidate =
            (typeof obj.message === "string" && obj.message) ||
            (typeof obj.error === "string" && obj.error) ||
            (typeof obj.details === "string" && obj.details) ||
            (typeof obj.msg === "string" && obj.msg) ||
            "";
          errorMessage = candidate || errorMessage;
        }
        
        // Log detailed error for debugging
        logger.debug("Booking creation failed", {
          status: bookingResponse.status,
          statusText: bookingResponse.statusText,
          errorData,
          bookingPayload
        });
        
        // Provide more specific error messages
        if (bookingResponse.status === 404) {
          throw new Error('Service not found. The service may have been removed or is no longer available.');
        } else if (bookingResponse.status === 400) {
          // Check if it's a payment method error
          if (errorMessage.toLowerCase().includes('not implemented') || 
              errorMessage.toLowerCase().includes('payment method')) {
            // For cash and QR PH, these are valid offline payment methods
            if (formData.paymentMethod === 'cash' || formData.paymentMethod === 'qr_ph') {
              // Retry with a fallback payment method or show helpful message
              throw new Error(`The ${formData.paymentMethod === 'cash' ? 'cash' : 'QR PH'} payment method is being set up. Please try again later or select a different payment method.`);
            }
          }
          throw new Error(errorMessage || 'Invalid booking data. Please check your information and try again.');
        } else if (bookingResponse.status === 409) {
          throw new Error('This time slot is already booked. Please select a different date or time.');
        } else if (bookingResponse.status === 401 || bookingResponse.status === 403) {
          throw new Error('You do not have permission to create this booking. Please log in and try again.');
        } else {
          throw new Error(errorMessage || `Booking creation failed with status ${bookingResponse.status}. Please try again.`);
        }
      }

      const bookingData = await bookingResponse.json();
      const createdBookingId = bookingData._id || bookingData.id || bookingData.data?._id || bookingData.data?.id;

      // Process payment based on method
      if (formData.paymentMethod === 'paypal') {
        // For PayPal, redirect to PayPal approval
        const paypalOrderUrl = `${API_BASE_URL}${API_ENDPOINTS.marketplacePayPalOrder}`;
        const paypalResponse = await fetch(paypalOrderUrl, createAuthFetchOptions({
          method: 'POST',
          body: JSON.stringify({
            bookingId: createdBookingId,
            amount: formData.totalAmount,
            currency: service.pricing.currency || defaultCurrency,
            transactionFee: pricingBreakdown?.transactionFee || 0
          })
        }));

        if (paypalResponse.ok) {
          const paypalData = await paypalResponse.json();
          const approvalUrl = paypalData.approvalUrl || paypalData.data?.approvalUrl;
          if (approvalUrl) {
            window.location.href = approvalUrl;
            return;
          }
        }
      } else if (formData.paymentMethod === 'paymaya') {
        // For PayMaya, create checkout
        const paymayaUrl = `${API_BASE_URL}${API_ENDPOINTS.paymayaCheckout}`;
        const paymayaResponse = await fetch(paymayaUrl, createAuthFetchOptions({
          method: 'POST',
          body: JSON.stringify({
            bookingId: createdBookingId,
            amount: formData.totalAmount,
            currency: service.pricing.currency || defaultCurrency,
            transactionFee: pricingBreakdown?.transactionFee || 0
          })
        }));

        if (paymayaResponse.ok) {
          const paymayaData = await paymayaResponse.json();
          const checkoutUrl = paymayaData.checkoutUrl || paymayaData.data?.checkoutUrl;
          if (checkoutUrl) {
            window.location.href = checkoutUrl;
            return;
          }
        }
      } else if (formData.paymentMethod === 'wallet') {
        // Wallet payment is processed automatically by backend
        // Just proceed to success
      } else if (formData.paymentMethod === 'cash' || formData.paymentMethod === 'qr_ph') {
        // Cash and QR PH payments don't require online processing
        // Payment will be collected on-site or via QR code
        // Just proceed to success
      }

      // If payment method doesn't require redirect, go to success
      setBookingId(createdBookingId);
      setCurrentStep(5);
    } catch (error) {
      // Extract error message more thoroughly
      let errorMessage = "Failed to process booking";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        const maybeMessage = (error as { message?: unknown }).message;
        if (typeof maybeMessage === "string") {
          errorMessage = maybeMessage || errorMessage;
        }
      }
      
      logger.error("Error processing booking", error instanceof Error ? error : new Error(String(error)), {
        serviceId: service?._id || service?.id,
        providerId: typeof service?.provider === 'string' ? service.provider : (service?.provider?._id || service?.provider?.id),
        formData: {
          bookingDate: formData.bookingDate,
          bookingTime: formData.bookingTime,
          duration: formData.duration,
          paymentMethod: formData.paymentMethod
        },
        errorMessage: errorMessage
      });
      setError(errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle PayPal/PayMaya callback
  useEffect(() => {
    const orderId = searchParams.get('token') || searchParams.get('orderId');
    const payerId = searchParams.get('PayerID');
    const paymayaRef = searchParams.get('ref') || searchParams.get('reference');
    
    if (orderId || paymayaRef) {
      // Handle payment return
      const approvePayment = async () => {
        try {
          setProcessingPayment(true);
          
          if (orderId) {
            // PayPal callback
            const approveUrl = `${API_BASE_URL}${API_ENDPOINTS.marketplacePayPalApprove}`;
            const response = await fetch(approveUrl, createAuthFetchOptions({
              method: 'POST',
              body: JSON.stringify({ orderId, payerId })
            }));

            if (response.ok) {
              const data = await response.json();
              const bookingId = data._id || data.id || data.data?._id || data.data?.id || data.bookingId || data.data?.bookingId;
              if (bookingId) {
              setBookingId(bookingId);
              setCurrentStep(5);
              // Clean URL
              router.replace(`/marketplace/services/${serviceIdFromUrl}/book`, { scroll: false });
              }
            } else {
              const errorData = await response.json().catch(() => ({}));
              setError(errorData.message || "Failed to approve PayPal payment");
            }
          } else if (paymayaRef) {
            // PayMaya callback - verify payment status
            // The backend should handle PayMaya webhook, but we can check status here
            setCurrentStep(5);
            router.replace(`/marketplace/services/${serviceIdFromUrl}/book`, { scroll: false });
          }
        } catch (err) {
          logger.error("Error processing payment callback", err instanceof Error ? err : new Error(String(err)));
          setError("Failed to process payment. Please contact support if payment was deducted.");
        } finally {
          setProcessingPayment(false);
        }
      };
      
      approvePayment();
    }
  }, [searchParams, serviceIdFromUrl, router]);

  // Calculate pricing breakdown (must be before any conditional returns)
  const pricingBreakdown = useMemo(() => {
    if (!service) return null;
    const baseAmount = service.pricing.type === 'hourly'
      ? service.pricing.basePrice * formData.duration
      : service.pricing.basePrice;
    return calculateTotalWithFee(baseAmount);
  }, [service, formData.duration, calculateTotalWithFee]);

  // Back button handler
  const handleBack = useCallback(() => {
    router.push(`/marketplace/services/${serviceIdFromUrl}`);
  }, [router, serviceIdFromUrl]);

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
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <div className="mb-8">
            <div className="mb-4">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back to service"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Service</span>
              </button>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Book Service</h1>
                <p className="text-sm text-gray-500 mt-0.5">Complete your booking</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-red-200 p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link
                href={`/marketplace/services/${serviceIdFromUrl}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper to get currency with app settings fallback
  const getCurrency = (currency?: string): string => {
    return currency || defaultCurrency;
  };

  const formatPrice = (price: number, currency?: string) => {
    const currencyCode = getCurrency(currency);
    return formatCurrencyUtil(price, currencyCode, {
      appSettings,
    });
  };

  if (!service || !pricingBreakdown) return null;

  const imageUrl = service.images && Array.isArray(service.images) && service.images.length > 0
    ? (typeof service.images[0] === 'string'
        ? service.images[0]
        : service.images[0].url || service.images[0].thumbnail)
    : undefined;

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
              aria-label="Go back to service"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Service</span>
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Book Service</h1>
                <p className="text-sm text-gray-500 mt-0.5">{service?.title || 'Loading...'}</p>
              </div>
            </div>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
            >
              <Store className="w-4 h-4" />
              Browse Marketplace
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto space-y-6">

          {/* Progress Steps */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                        currentStep >= step
                          ? 'bg-accent text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
                    </div>
                    <span className={`text-xs mt-2 ${currentStep >= step ? 'text-accent font-medium' : 'text-gray-500'}`}>
                      {step === 1 && 'Date & Time'}
                      {step === 2 && 'Address'}
                      {step === 3 && 'Summary'}
                      {step === 4 && 'Payment'}
                      {step === 5 && 'Success'}
                    </span>
                  </div>
                  {step < 5 && (
                    <div
                      className={`h-1 flex-1 mx-2 ${
                        currentStep > step ? 'bg-accent' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            {/* Step 1: Date, Time, and Location */}
            {currentStep === 1 && (
              <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Select Date, Time & Location
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.bookingDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, bookingDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.bookingTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, bookingTime: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location/Service Area <span className="text-red-500">*</span>
              </label>
              <LocationAutocomplete
                value={formData.location}
                onChange={(location) => setFormData(prev => ({ ...prev, location }))}
                onCoordinatesChange={(coords) => {
                  setFormData(prev => ({
                    ...prev,
                    coordinates: coords || undefined,
                    address: {
                      ...prev.address,
                      coordinates: coords || undefined
                    }
                  }));
                }}
                placeholder="Search for your location or click 'Detect' to use your current location"
                className=""
              />
              <p className="text-xs text-gray-500 mt-2">
                Start typing to see suggestions, or use the &quot;Detect&quot; button to automatically fill in your current location
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (hours) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              {service.estimatedDuration && (
                <p className="text-xs text-gray-500 mt-1">
                  Estimated: {service.estimatedDuration.min || 0}-{service.estimatedDuration.max || 0} hours
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link
                href={`/marketplace/services/${serviceIdFromUrl}`}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                onClick={nextStep}
                disabled={!validateStep(1)}
                className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
            )}

            {/* Step 2: Address and Special Instructions */}
            {currentStep === 2 && (
              <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Service Address & Instructions
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.address.street}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, street: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address.city}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, city: e.target.value }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address.state}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, state: e.target.value }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address.zipCode}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, zipCode: e.target.value }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address.country}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, country: e.target.value }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Special Instructions (Optional)
                </label>
                <textarea
                  rows={4}
                  value={formData.specialInstructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                  placeholder="Any special instructions or requirements..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={prevStep}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                disabled={!validateStep(2)}
                className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
              </div>
            )}

            {/* Step 3: Summary */}
            {currentStep === 3 && (
              <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Booking Summary
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Service Info */}
              <div className="md:col-span-2 space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Service Details</h3>
                  <div className="flex gap-4">
                    {imageUrl && (
                      <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={imageUrl}
                          alt={service.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                          unoptimized={imageUrl.startsWith('http://localhost') || !imageUrl.startsWith('http')}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{service.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{service.description.substring(0, 100)}...</p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Booking Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {new Date(formData.bookingDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{formData.bookingTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{formData.location}</span>
                    </div>
                    <div className="text-gray-700">
                      Duration: {formData.duration} hour{formData.duration !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Service Address</h3>
                  <p className="text-sm text-gray-700">
                    {formData.address.street}<br />
                    {formData.address.city}, {formData.address.state} {formData.address.zipCode}<br />
                    {formData.address.country}
                  </p>
                  {formData.specialInstructions && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-1">Special Instructions:</p>
                      <p className="text-sm text-gray-600">{formData.specialInstructions}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Summary */}
              <div className="border border-gray-200 rounded-lg p-4 h-fit">
                <h3 className="font-semibold text-gray-900 mb-4">Price Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Price</span>
                    <span className="text-gray-900">{formatPrice(service.pricing.basePrice, getCurrency(service.pricing.currency))}</span>
                  </div>
                  {service.pricing.type === 'hourly' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">× {formData.duration} hour{formData.duration !== 1 ? 's' : ''}</span>
                      <span className="text-gray-900">{formatPrice(service.pricing.basePrice * formData.duration, getCurrency(service.pricing.currency))}</span>
                    </div>
                  )}
                  {pricingBreakdown && pricingBreakdown.transactionFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Transaction Fee</span>
                      <span className="text-gray-900">{formatPrice(pricingBreakdown.transactionFee, getCurrency(service.pricing.currency))}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-accent text-lg">{formatPrice(formData.totalAmount, getCurrency(service.pricing.currency))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={prevStep}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                Continue to Payment
              </button>
              </div>
            </div>
            )}

            {/* Step 4: Payment */}
            {currentStep === 4 && (
              <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Method
            </h2>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Subtotal</h3>
                    <span className="text-lg text-gray-900">
                      {formatPrice(pricingBreakdown?.baseAmount || 0, getCurrency(service.pricing.currency))}
                    </span>
                  </div>
                  {pricingBreakdown && pricingBreakdown.transactionFee > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Transaction Fee</span>
                      <span className="text-gray-700">
                        {formatPrice(pricingBreakdown.transactionFee, getCurrency(service.pricing.currency))}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Total Amount</h3>
                      <span className="text-2xl font-bold text-accent">
                        {formatPrice(formData.totalAmount, getCurrency(service.pricing.currency))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {isPaymentMethodEnabled('paypal', appSettings) && (
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-accent transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={formData.paymentMethod === 'paypal'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'paypal' }))}
                      className="w-4 h-4 text-accent"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">PayPal</div>
                      <div className="text-sm text-gray-600">Pay securely with PayPal</div>
                    </div>
                  </label>
                )}

                {isPaymentMethodEnabled('paymaya', appSettings) && (
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-accent transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paymaya"
                      checked={formData.paymentMethod === 'paymaya'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'paymaya' }))}
                      className="w-4 h-4 text-accent"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">PayMaya</div>
                      <div className="text-sm text-gray-600">Pay with PayMaya wallet or card</div>
                    </div>
                  </label>
                )}

                {isPaymentMethodEnabled('gcash', appSettings) && (
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-accent transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="gcash"
                      checked={formData.paymentMethod === 'gcash'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'gcash' }))}
                      className="w-4 h-4 text-accent"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">GCash</div>
                      <div className="text-sm text-gray-600">Pay with GCash wallet</div>
                    </div>
                  </label>
                )}

                {wallet && (
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    wallet.balance >= formData.totalAmount
                      ? 'border-gray-200 hover:border-accent'
                      : 'border-gray-200 opacity-50 cursor-not-allowed'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wallet"
                      checked={formData.paymentMethod === 'wallet'}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'wallet' }))}
                      disabled={wallet.balance < formData.totalAmount}
                      className="w-4 h-4 text-accent"
                    />
                    <Wallet className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Wallet Balance</div>
                      <div className="text-sm text-gray-600">
                        {formatPrice(wallet.balance, wallet.currency)} available
                        {wallet.balance < formData.totalAmount && (
                          <span className="text-red-600 ml-2">(Insufficient balance)</span>
                        )}
                      </div>
                    </div>
                  </label>
                )}

                {/* Cash Payment */}
                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-accent transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={formData.paymentMethod === 'cash'}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'cash' }))}
                    className="w-4 h-4 text-accent"
                  />
                  <Banknote className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Cash</div>
                    <div className="text-sm text-gray-600">Pay with cash on-site</div>
                  </div>
                </label>

                {/* QR PH Payment */}
                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-accent transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="qr_ph"
                    checked={formData.paymentMethod === 'qr_ph'}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as 'qr_ph' }))}
                    className="w-4 h-4 text-accent"
                  />
                  <QrCode className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">QR PH</div>
                    <div className="text-sm text-gray-600">Pay via QR code (GCash, PayMaya, etc.)</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={prevStep}
                disabled={processingPayment}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={processBooking}
                disabled={!formData.paymentMethod || processingPayment || !service || loading}
                className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Confirm & Pay'
                )}
              </button>
              </div>
            </div>
            )}

            {/* Step 5: Success */}
            {currentStep === 5 && bookingId && (
              <div className="text-center space-y-8 py-12">
                {/* Success Icon */}
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-accent/10 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle className="w-16 h-16 text-emerald-600" />
                </div>
                
                {/* Success Message */}
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold text-gray-900">Booking Confirmed!</h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Your service booking has been successfully created{formData.paymentMethod === 'cash' || formData.paymentMethod === 'qr_ph' 
                      ? '. Payment will be collected on-site.' 
                      : ' and payment has been processed.'}
                  </p>
                </div>

                {/* Booking Details Card */}
                <div className="bg-gradient-to-br from-emerald-50 to-accent/10 border-2 border-emerald-200 rounded-xl p-6 max-w-md mx-auto shadow-md">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Booking ID</p>
                      <p className="text-2xl font-bold text-gray-900 font-mono">{bookingId}</p>
                    </div>
                    
                    {/* Service Summary */}
                    {service && (
                      <div className="pt-4 border-t border-emerald-200 space-y-2 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Service:</span>
                          <span className="text-sm font-semibold text-gray-900">{service.title}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Date:</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {new Date(formData.bookingDate).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Time:</span>
                          <span className="text-sm font-semibold text-gray-900">{formData.bookingTime}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Total:</span>
                          <span className="text-sm font-bold text-emerald-600">
                            {formatPrice(formData.totalAmount, getCurrency(service.pricing?.currency))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <Link
                    href={`/marketplace/my-bookings`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg font-semibold"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    View My Bookings
                  </Link>
                  <Link
                    href={`/marketplace/bookings/${bookingId}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow-md font-semibold"
                  >
                    <Eye className="w-5 h-5" />
                    View Booking Details
                  </Link>
                  <Link
                    href="/marketplace"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow-md font-semibold"
                  >
                    <Store className="w-5 h-5" />
                    Back to Marketplace
                  </Link>
                </div>

                {/* Additional Info */}
                <div className="pt-6 border-t border-gray-200 max-w-2xl mx-auto">
                  <p className="text-sm text-gray-500">
                    {formData.paymentMethod === 'cash' 
                      ? 'Please prepare the exact amount for payment when the service provider arrives.'
                      : formData.paymentMethod === 'qr_ph'
                      ? 'You will receive a QR code for payment. Please complete the payment when the service provider arrives.'
                      : 'You will receive a confirmation email shortly with all the booking details.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


