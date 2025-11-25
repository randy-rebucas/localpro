"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Phone, Mail, CheckCircle, ArrowLeft, User, Clock, Shield, Calendar, TrendingUp, Users, Building2, Wrench, Award } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency, CURRENCY_CONFIGS } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";

// UserId Interface
interface UserIdData {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  phone?: string;
  profileImage?: string;
  profile?: {
    avatar?: {
      url?: string;
      thumbnail?: string;
    };
    bio?: string;
    address?: {
      city?: string;
      state?: string;
      zipCode?: string;
    };
  };
  trust?: {
    trustScore?: number;
    verification?: {
      phoneVerified?: boolean;
      emailVerified?: boolean;
      identityVerified?: boolean;
    };
  };
}

// Provider Interface
interface Provider {
  _id?: string;
  userId?: UserIdData | string;
  user?: UserIdData; // Duplicate of userId in API response
  userProfile?: UserIdData; // Another duplicate in API response
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  status?: string;
  providerType?: string;
  businessInfo?: {
    businessName?: string;
    businessDescription?: string;
  } | null;
  professionalInfo?: {
    _id?: string;
    provider?: string;
    specialties?: Array<{
      _id?: string;
      experience?: number;
      yearsOfExperience?: number; // Legacy support
      hourlyRate?: number;
      certifications?: Array<{
        _id?: string;
        name?: string;
        issuer?: string;
        dateIssued?: string;
        expiryDate?: string;
        certificateNumber?: string;
      }>;
      skills?: Array<{
        _id?: string;
        name?: string;
        description?: string;
        category?: {
          _id?: string;
          name?: string;
          key?: string;
        } | string;
        metadata?: {
          level?: string;
          yearsExperience?: number;
          certified?: boolean;
        };
      }>;
      serviceAreas?: Array<{
        _id?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        radius?: number;
      }>;
      // Optional fields not in API response but may be used in UI
      category?: string; // Not in API response - may be derived from skills
      description?: string; // Not in API response - may be used for display
      pricing?: {
        hourlyRate?: number;
        minimumCharge?: number;
        currency?: string;
      };
    }>;
    languages?: string[];
    availability?: {
      [key: string]: {
        available?: boolean;
        start?: string | null;
        end?: string | null;
      };
    };
    emergencyServices?: boolean;
    travelDistance?: number;
    minimumJobValue?: number;
    maximumJobValue?: number;
    createdAt?: string;
    updatedAt?: string;
  };
  verification?: {
    _id?: string;
    provider?: string;
    identityVerified?: boolean;
    identityVerifiedAt?: string;
    businessVerified?: boolean;
    businessVerifiedAt?: string | null;
    backgroundCheck?: {
      status?: string;
      dateCompleted?: string;
      completedAt?: string; // Legacy support
      reportId?: string;
      expiresAt?: string;
    };
    insurance?: {
      hasInsurance?: boolean;
      insuranceProvider?: string;
      policyNumber?: string;
      coverageAmount?: number;
      expiryDate?: string;
      // Legacy structure support
      liability?: {
        active?: boolean;
        amount?: number;
        expiresAt?: string;
      };
      workersComp?: {
        active?: boolean;
        amount?: number;
        expiresAt?: string;
      };
    };
    licenses?: Array<{
      _id?: string;
      type?: string;
      number?: string;
      state?: string;
      issuingAuthority?: string;
      issueDate?: string;
      expiryDate?: string;
      expiresAt?: string; // Legacy support
    }>;
    certifications?: Array<{
      name?: string;
      issuer?: string;
      issuedAt?: string;
      expiresAt?: string;
    }>;
    references?: Array<{
      name?: string;
      contact?: string;
      relationship?: string;
      [key: string]: unknown;
    }>;
    portfolio?: {
      images?: string[];
      videos?: string[];
      descriptions?: string[];
      beforeAfter?: Array<{
        before?: string;
        after?: string;
        description?: string;
        [key: string]: unknown;
      }>;
    };
    createdAt?: string;
    updatedAt?: string;
  };
  performance?: {
    _id?: string;
    provider?: string;
    rating?: number;
    totalReviews?: number;
    totalJobs?: number;
    completedJobs?: number;
    cancelledJobs?: number;
    pendingJobs?: number; // Legacy support
    responseTime?: number; // In minutes
    averageResponseTime?: number; // Legacy support
    responseTimeMinutes?: number; // Legacy support
    completionRate?: number;
    cancellationRate?: number;
    repeatCustomerRate?: number;
    earnings?: {
      total?: number;
      thisMonth?: number;
      lastMonth?: number;
      pending?: number;
    };
    totalEarnings?: number; // Legacy support
    averageJobValue?: number;
    badges?: Array<{
      _id?: string;
      name?: string;
      description?: string;
      earnedDate?: string;
      category?: string;
    }>;
    createdAt?: string;
    updatedAt?: string;
  };
  trust?: {
    trustScore?: number;
    badges?: Array<{
      type?: string;
      description?: string;
      earnedAt?: string;
    }>;
  };
  agency?: {
    agencyId?: {
      name?: string;
    };
    role?: string;
    commissionRate?: number;
  };
  metadata?: {
    profileViews?: number;
    featured?: boolean;
    promoted?: boolean;
    tags?: string[];
    lastActive?: string;
    searchRanking?: number;
    notes?: string | null;
  };
  preferences?: {
    _id?: string;
    provider?: string;
    notificationSettings?: {
      newJobAlerts?: boolean;
      messageNotifications?: boolean;
      paymentNotifications?: boolean;
      reviewNotifications?: boolean;
      marketingEmails?: boolean;
    };
    jobPreferences?: {
      preferredJobTypes?: string[];
      avoidJobTypes?: string[];
      preferredTimeSlots?: string[];
      maxJobsPerDay?: number;
      advanceBookingDays?: number;
      acceptEmergencyJobs?: boolean; // Legacy support
      preferredDistance?: number; // Legacy support
    };
    communicationPreferences?: {
      preferredContactMethod?: string;
      responseTimeExpectation?: number;
      autoAcceptJobs?: boolean;
      preferredMethod?: string; // Legacy support
      responseTime?: string; // Legacy support
    };
    availabilityPreferences?: {
      sameDayBooking?: boolean;
      weekendAvailability?: boolean;
      advanceBookingDays?: number;
    };
    createdAt?: string;
    updatedAt?: string;
  };
  settings?: {
    profileVisibility?: string;
    showContactInfo?: boolean;
    showPricing?: boolean;
    showReviews?: boolean;
    allowDirectBooking?: boolean;
    requireApproval?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface MarketplaceService {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  basePrice?: number;
  price?: number;
  currency?: string;
  rating?: number | { average?: number; count?: number };
  reviewCount?: number;
  images?: Array<{ url?: string; thumbnail?: string }>;
  pricing?: {
    type?: string;
    basePrice?: number;
    currency?: string;
  };
  serviceType?: string;
  isActive?: boolean;
}

export default function ProviderDetailPage() {
  const params = useParams();
  const { settings: appSettings } = useAppSettings();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusWarning, setStatusWarning] = useState<string | null>(null);
  const [servicesPopulatedFromResponse, setServicesPopulatedFromResponse] = useState(false);

  const providerId = params?.id as string;
  
  // Currency normalization function - converts symbols to codes
  const normalizeCurrencyCode = useCallback((currency: string | undefined | null): string => {
    const defaultCurrencyCode = getDefaultCurrency(appSettings);
    if (!currency) return defaultCurrencyCode;
    
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
    
    // Default to app settings currency if not found
    return defaultCurrencyCode;
  }, [appSettings]);
  
  // Format price with currency
  const formatPrice = useCallback((price: number, currency?: string | null): string => {
    const currencyCode = normalizeCurrencyCode(currency);
    return formatCurrency(price, currencyCode, { appSettings });
  }, [normalizeCurrencyCode, appSettings]);

  useEffect(() => {
    const fetchProvider = async () => {
      if (!providerId) {
        setError("Provider ID is required");
        setLoading(false);
        return;
      }
      
      // Reset services state when provider changes
      setServices([]);
      setServicesPopulatedFromResponse(false);

      const normalizeProviderData = (providerData: unknown, isStatusError: boolean = false): Provider | null => {
        if (!providerData || typeof providerData !== 'object') {
          return null;
        }

        // Type guard: ensure providerData is a record with string keys
        const data = providerData as Record<string, unknown>;

        // Check if we have at least some identifier or user data
        const hasId = !!(data._id || data.id);
        const hasUserId = !!data.userId;
        const hasUserData = !!(data.firstName || data.lastName || data.email);
        
        // If we have no identifying information at all, return null
        if (!hasId && !hasUserId && !hasUserData) {
          if (process.env.NODE_ENV === 'development') {
            logger.debug('Cannot normalize provider data - missing identifiers', {
              hasId,
              hasUserId,
              hasUserData,
              dataKeys: Object.keys(data),
            });
          }
          return null;
        }
        // Debug logging removed - use logger.debug if needed
        const userId = typeof data.userId === 'object' ? data.userId : null;
        // Merge trust data from userId.trust if available
        const trustData = (userId as { trust?: unknown } | null)?.trust || data.trust;
        
        // If we don't have an _id but have other data, try to use what we have
        const providerId = data._id || data.id || ((userId as { _id?: string; id?: string } | null)?._id || (userId as { _id?: string; id?: string } | null)?.id) || undefined;
        
        // Explicitly extract verification to ensure it's preserved
        const verification = data.verification || undefined;
        
        // Debug logging for verification in development
        if (process.env.NODE_ENV === 'development' && verification) {
          logger.debug('Verification data found in provider response', {
            hasVerification: !!verification,
            identityVerified: (verification as { identityVerified?: boolean })?.identityVerified,
            businessVerified: (verification as { businessVerified?: boolean })?.businessVerified,
            hasBackgroundCheck: !!(verification as { backgroundCheck?: unknown })?.backgroundCheck,
            hasInsurance: !!(verification as { insurance?: unknown })?.insurance,
            hasLicenses: !!(verification as { licenses?: unknown[] })?.licenses,
            verificationKeys: verification && typeof verification === 'object' ? Object.keys(verification) : [],
          });
        }
        
        return {
          ...data,
          _id: providerId,
          firstName: (userId as { firstName?: string } | null)?.firstName || data.firstName || '',
          lastName: (userId as { lastName?: string } | null)?.lastName || data.lastName || '',
          email: (userId as { email?: string } | null)?.email || data.email || '',
          phoneNumber: (userId as { phoneNumber?: string; phone?: string } | null)?.phoneNumber || (userId as { phoneNumber?: string; phone?: string } | null)?.phone || data.phoneNumber || data.phone || '',
          userId: userId,
          status: data.status || (isStatusError ? 'pending' : undefined),
          trust: trustData || data.trust,
          verification: verification as Provider['verification'],
        } as Provider;
      };

      let providerDataFetched = false; // Track if we successfully fetched provider data
      let httpStatus: number | null = null;
      let apiErrorDetails: { error?: string; message?: string; [key: string]: unknown } | null = null;

      try {
        setLoading(true);
        setError(null);
        setStatusWarning(null);
        const fetchOptions = createAuthFetchOptions();

        // Try marketplace endpoint first
        const marketplaceEndpoint = API_ENDPOINTS.marketplaceProvidersById.replace("[id]", providerId);
        const marketplaceResponse = await fetch(
          `${API_BASE_URL}${marketplaceEndpoint}`,
          fetchOptions
        );

        let data: { data?: unknown; provider?: unknown; result?: unknown; error?: string; message?: string; [key: string]: unknown } | null = null;
        let errorMessage: string | null = null;
        let isStatusError = false;
        httpStatus = marketplaceResponse.status;

        // Try to parse response even if not ok
        try {
          data = await marketplaceResponse.json();
        } catch {
          // If response is not JSON, continue with error handling
        }

        if (!marketplaceResponse.ok) {
          errorMessage = `Failed to fetch provider: ${marketplaceResponse.status} ${marketplaceResponse.statusText}`;
          apiErrorDetails = data;
          if (data) {
            if (data.message && typeof data.message === 'string') {
              errorMessage = data.message;
            } else if (data.error) {
              if (typeof data.error === 'string') {
                errorMessage = data.error;
              } else if (typeof data.error === 'object' && data.error !== null && 'message' in data.error) {
                errorMessage = (data.error as { message?: string }).message || String(data.error);
              } else {
                errorMessage = String(data.error);
              }
            }
          }
          
          // Check if this is a status-related error (not active, pending, etc.)
          const statusErrorPattern = /not active|pending|inactive|suspended/i;
          if (errorMessage && statusErrorPattern.test(errorMessage)) {
            isStatusError = true;
            setStatusWarning(errorMessage);
          }
        }

        // If we have data from marketplace endpoint (even with an error), try to use it
        let normalizedProvider: Provider | null = null;
        let servicesFromResponse: MarketplaceService[] = [];
        if (data) {
          // Extract services from response if available
          // Response structure: { success: true, data: { provider: {...}, services: [...] } }
          const responseData = typeof data === 'object' && data !== null && 'data' in data 
            ? (data.data as Record<string, unknown>)
            : null;
          
          // Extract services from the response data
          if (responseData && 'services' in responseData && Array.isArray(responseData.services)) {
            servicesFromResponse = responseData.services as MarketplaceService[];
          } else if (data && typeof data === 'object' && 'services' in data && Array.isArray(data.services)) {
            servicesFromResponse = data.services as MarketplaceService[];
          }
          
          // Try multiple possible data structures for provider
          // If responseData exists and has a provider field, use that; otherwise try other structures
          let providerData: unknown;
          if (responseData && 'provider' in responseData) {
            providerData = responseData.provider;
          } else if (responseData && !('provider' in responseData)) {
            // If responseData exists but doesn't have provider, it might be the provider itself
            providerData = responseData;
          } else {
            // Fallback to other structures
            providerData = data.data || data.provider || data.result || data;
          }
          
          // Log the structure we received for debugging
          if (process.env.NODE_ENV === 'development') {
            const providerDataObj = providerData && typeof providerData === 'object' ? providerData as Record<string, unknown> : null;
            logger.debug('Provider data structure', {
              hasData: !!data,
              hasSuccess: !!data.success,
              hasDataField: !!data.data,
              hasProviderField: !!data.provider,
              hasResultField: !!data.result,
              hasResponseData: !!responseData,
              hasServices: servicesFromResponse.length > 0,
              servicesCount: servicesFromResponse.length,
              hasVerification: !!(providerDataObj?.verification),
              verificationType: providerDataObj?.verification ? typeof providerDataObj.verification : 'none',
              dataKeys: data ? Object.keys(data) : [],
              responseDataKeys: responseData ? Object.keys(responseData) : [],
              providerDataKeys: providerDataObj ? Object.keys(providerDataObj) : [],
            });
          }
          
          normalizedProvider = normalizeProviderData(providerData, isStatusError);
        }

        // If we got provider data, use it (even if there was a status error)
        if (normalizedProvider) {
          setProvider(normalizedProvider);
          // Set services if they were included in the response
          if (servicesFromResponse.length > 0) {
            setServices(servicesFromResponse);
            setServicesPopulatedFromResponse(true);
          }
          providerDataFetched = true;
          if (isStatusError) {
            // Don't log error for status issues when we have data to display
            return;
          }
        } else {
          // If we couldn't normalize data from marketplace endpoint, try fallback
          // This handles cases where marketplace endpoint returns unexpected structure
          try {
            const providersEndpoint = API_ENDPOINTS.providersById.replace("[id]", providerId);
            const providersResponse = await fetch(
              `${API_BASE_URL}${providersEndpoint}`,
              fetchOptions
            );

            if (providersResponse.ok) {
              const providersData = await providersResponse.json();
              const providerData = providersData.data || providersData.provider || providersData.result || providersData;
              normalizedProvider = normalizeProviderData(providerData, isStatusError || !marketplaceResponse.ok);
              
              if (normalizedProvider) {
                setProvider(normalizedProvider);
                providerDataFetched = true;
                // Successfully got provider data from fallback endpoint
                logger.info('Successfully fetched provider from fallback endpoint', { providerId });
                return;
              }
            } else {
              httpStatus = providersResponse.status;
              // Try to get error message from fallback response
              try {
                const fallbackErrorData = await providersResponse.json();
                if (fallbackErrorData.error || fallbackErrorData.message) {
                  errorMessage = fallbackErrorData.error || fallbackErrorData.message;
                }
              } catch {
                // Ignore JSON parse errors
              }
            }
          } catch (fallbackErr) {
            // Fallback failed, continue with original error
            logger.warn('Fallback endpoint also failed', { 
              error: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
              providerId 
            });
          }
        }

        // Only throw error if we don't have provider data
        if (!normalizedProvider) {
          // Provide more descriptive error message
          let descriptiveError = errorMessage;
          if (!descriptiveError) {
            if (marketplaceResponse.ok && data) {
              descriptiveError = "Invalid response format: Provider data structure is not recognized";
            } else if (!marketplaceResponse.ok) {
              descriptiveError = `Failed to fetch provider: ${marketplaceResponse.status} ${marketplaceResponse.statusText}`;
            } else {
              descriptiveError = "Invalid response format: No provider data received";
            }
          }
          
          const finalError = new Error(descriptiveError) as Error & { status?: number; apiResponse?: unknown };
          finalError.status = httpStatus || undefined;
          finalError.apiResponse = apiErrorDetails || data || undefined;
          throw finalError;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load provider";
        // Only log error if we didn't successfully fetch provider data
        if (!providerDataFetched) {
          const errorToLog = err instanceof Error ? err : new Error(errorMessage);
          const errorWithStatus = err as Error & { status?: number; apiResponse?: unknown };
          logger.error("Error fetching provider", errorToLog, {
            providerId,
            httpStatus: httpStatus || errorWithStatus?.status,
            endpoint: API_ENDPOINTS.marketplaceProvidersById.replace("[id]", providerId),
            apiError: apiErrorDetails || errorWithStatus?.apiResponse,
          });
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [providerId]);

  // Fetch provider services (only if not already populated from provider response)
  useEffect(() => {
    const fetchServices = async () => {
      if (!providerId) return;
      
      // Skip if services are already populated from provider response
      if (servicesPopulatedFromResponse) {
        return;
      }

      try {
        setServicesLoading(true);
        const endpoint = API_ENDPOINTS.marketplaceProvidersServices.replace("[id]", providerId);
        const response = await fetch(
          `${API_BASE_URL}${endpoint}`,
          createAuthFetchOptions()
        );

        if (response.ok) {
          const data = await response.json();
          const servicesData = data?.data || data?.services || (Array.isArray(data) ? data : []);
          setServices(Array.isArray(servicesData) ? servicesData : []);
        }
      } catch (err) {
        logger.warn("Error fetching provider services", { error: err instanceof Error ? err.message : String(err) });
      } finally {
        setServicesLoading(false);
      }
    };

    if (providerId && provider && !servicesPopulatedFromResponse) {
      fetchServices();
    }
  }, [providerId, provider, servicesPopulatedFromResponse]);

  if (loading) {
    return <Loading />;
  }

  if (error && !provider) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || "Provider not found"}</p>
          <Link href="/marketplace" className="text-blue-600 hover:underline mt-2 inline-block">
            ← Back to Providers
          </Link>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Provider not found</p>
          <Link href="/marketplace" className="text-blue-600 hover:underline mt-2 inline-block">
            ← Back to Providers
          </Link>
        </div>
      </div>
    );
  }

  const userId = typeof provider.userId === 'object' ? provider.userId : null;
  const avatarUrl = userId?.profile?.avatar?.url || userId?.profile?.avatar?.thumbnail || userId?.profileImage;
  const hasAvatar = avatarUrl && avatarUrl !== '/placeholder-avatar.png' && !avatarUrl.includes('placeholder');
  const fullName = `${provider.firstName || ''} ${provider.lastName || ''}`.trim() || 'Provider';
  
  // Get initials from name
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  const initials = getInitials(fullName);
  const location = userId?.profile?.address 
    ? `${userId.profile.address.city || ''}, ${userId.profile.address.state || ''}`.trim()
    : 'Location not specified';
  const rating = provider.performance?.rating || 0;
  const reviewCount = provider.performance?.totalReviews || 0;
  const totalJobs = provider.performance?.totalJobs || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-200/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
      </div>
      
      <div className="relative z-0 max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/marketplace"
              className="p-2.5 hover:bg-gradient-to-br hover:from-green-50 hover:to-blue-50 rounded-xl transition-all hover:scale-105 hover:shadow-md"
              title="Back to providers"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 hover:text-green-700" />
            </Link>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white flex items-center justify-center shadow-xl shadow-purple-500/30 hover:scale-105 transition-transform duration-300">
              <User className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-700 to-gray-900 bg-clip-text text-transparent mb-1">{fullName}</h1>
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                {provider.businessInfo?.businessName || location}
                {rating > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900">{rating.toFixed(1)}</span>
                    <span className="text-gray-600">({reviewCount} reviews)</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Status Warning Banner */}
          {statusWarning && (
            <div className="bg-gradient-to-r from-yellow-50 via-yellow-100/50 to-yellow-50 border-2 border-yellow-300 rounded-xl p-4 shadow-lg">
              <p className="text-yellow-900 font-medium">
                <strong className="text-yellow-950">Note:</strong> {statusWarning}
              </p>
            </div>
          )}
        </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Provider Avatar & Quick Info */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 mb-4 flex items-center justify-center">
            {hasAvatar && avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={fullName}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-4xl font-semibold text-white">
                {initials}
              </span>
            )}
          </div>
            {provider.businessInfo?.businessName && (
                <p className="text-lg font-semibold text-gray-900 mb-1">{provider.businessInfo.businessName}</p>
            )}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4" />
                <span>{location}</span>
              </div>
              {rating > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{rating.toFixed(1)}</span>
                  <span className="text-gray-600">({reviewCount} reviews)</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Jobs</span>
                <span className="font-semibold text-gray-900">{totalJobs}</span>
              </div>
              {provider.performance?.completedJobs !== undefined && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="font-semibold text-gray-900">{provider.performance.completedJobs}</span>
                </div>
              )}
              {provider.performance?.completionRate !== undefined && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="font-semibold text-green-600">{provider.performance.completionRate.toFixed(1)}%</span>
                </div>
              )}
              {provider.performance?.averageResponseTime !== undefined && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Response</span>
                  <span className="font-semibold text-gray-900">{provider.performance.averageResponseTime.toFixed(1)}h</span>
                </div>
              )}
        </div>
      </div>

      {/* Contact Info */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
            <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
        <div className="space-y-3">
          {provider.email && (
            <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{provider.email}</span>
            </div>
          )}
          {provider.phoneNumber && (
            <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{provider.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Verification Summary */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Verification
            </h3>
            <div className="space-y-2">
              {(provider.verification?.identityVerified || userId?.trust?.verification?.identityVerified) && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Identity</span>
                </div>
              )}
              {provider.verification?.businessVerified && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Business</span>
                </div>
              )}
              {userId?.trust?.verification?.phoneVerified && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Phone</span>
                </div>
              )}
              {userId?.trust?.verification?.emailVerified && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Email</span>
                </div>
              )}
              {provider.verification?.backgroundCheck?.status === 'passed' && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Background Check</span>
                </div>
              )}
              {/* Show message if no verification data is available */}
              {!provider.verification && 
               !userId?.trust?.verification && (
                <p className="text-sm text-gray-500">No verification information available</p>
              )}
            </div>
          </div>

          {/* Trust Score */}
          {provider.trust?.trustScore && (
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
              <h3 className="font-semibold text-gray-900 mb-3">Trust Score</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold text-gray-900">{provider.trust.trustScore}</span>
                <span className="text-sm text-gray-500">/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 h-3 rounded-full shadow-lg transition-all duration-500"
                  style={{ width: `${provider.trust.trustScore}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Services */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Services
            </h2>
            {servicesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => {
                  const serviceId = service._id || service.id;
                  const serviceRating = typeof service.rating === 'object' ? service.rating?.average : service.rating;
                  const servicePrice = service.price || service.basePrice || service.pricing?.basePrice;
                  const serviceImage = service.images?.[0]?.thumbnail || service.images?.[0]?.url;
                  
                  return (
                    <Link
                      key={serviceId}
                      href={`/marketplace/services/${serviceId}`}
                      className="border-2 border-gray-200 rounded-xl p-4 hover:border-green-300 hover:shadow-xl hover:bg-gradient-to-br hover:from-green-50/50 hover:to-blue-50/50 transition-all duration-300 transform hover:-translate-y-1"
                    >
                      {serviceImage && (
                        <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-200 mb-3">
                          <Image
                            src={serviceImage}
                            alt={service.title || 'Service'}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-900 mb-1">{service.title || 'Service'}</h3>
                      {service.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{service.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        {servicePrice && (
                          <div className="text-lg font-bold text-gray-900">
                            {formatPrice(servicePrice, service.currency || service.pricing?.currency)}
                          </div>
                        )}
                        {serviceRating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-gray-600">{serviceRating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      {service.category && (
                        <div className="mt-2">
                          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                            {service.category}
                          </span>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No services available</p>
            )}
      </div>

      {/* About */}
      {userId?.profile?.bio && (
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
          <p className="text-gray-700">{userId.profile.bio}</p>
        </div>
      )}

      {/* Business Description */}
      {provider.businessInfo?.businessDescription && (
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Description</h2>
          <p className="text-gray-700">{provider.businessInfo.businessDescription}</p>
        </div>
      )}

      {/* Specialties */}
      {provider.professionalInfo?.specialties && provider.professionalInfo.specialties.length > 0 && (
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Specialties & Services</h2>
              <div className="space-y-6">
            {provider.professionalInfo.specialties.map((specialty, idx) => {
              const specialtyId = specialty._id || idx;
              const experience = specialty.experience || specialty.yearsOfExperience;
              const hourlyRate = specialty.hourlyRate || specialty.pricing?.hourlyRate;
              
              return (
              <div key={specialtyId} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                {specialty.category && (
                      <h3 className="font-semibold text-lg text-gray-900 capitalize mb-1">
                        {specialty.category}
                      </h3>
                    )}
                    {experience && (
                      <p className="text-sm text-gray-600">
                        {experience} years of experience
                      </p>
                    )}
                  </div>
                  {(hourlyRate || specialty.pricing?.minimumCharge) && (
                    <div className="text-right">
                      {hourlyRate && (
                        <div className="text-lg font-semibold text-gray-900">
                          {formatPrice(hourlyRate, specialty.pricing?.currency)}
                          <span className="text-sm font-normal text-gray-600">/hr</span>
                        </div>
                      )}
                      {specialty.pricing?.minimumCharge && (
                        <div className="text-sm text-gray-600">
                          Min: {formatPrice(specialty.pricing.minimumCharge, specialty.pricing?.currency)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {specialty.description && (
                  <p className="text-gray-700 mb-3">{specialty.description}</p>
                )}
                
                {/* Certifications */}
                {specialty.certifications && specialty.certifications.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Certifications:</h4>
                    <div className="space-y-2">
                      {specialty.certifications.map((cert, certIdx) => {
                        const certId = cert._id || certIdx;
                        return (
                          <div key={certId} className="flex items-start gap-2">
                            <Award className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700">{cert.name}</span>
                              {cert.issuer && (
                                <p className="text-xs text-gray-600">Issued by: {cert.issuer}</p>
                              )}
                              {cert.expiryDate && (
                                <p className="text-xs text-gray-500">
                                  Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Skills */}
                {specialty.skills && Array.isArray(specialty.skills) && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Skills:</h4>
                    {(() => {
                      // Filter out undefined/null items first
                      const validSkills = specialty.skills.filter(skill => skill != null && typeof skill === 'object');
                      
                      // Debug logging in development
                      if (process.env.NODE_ENV === 'development') {
                        logger.debug('Skills data', {
                          originalLength: specialty.skills.length,
                          validSkillsLength: validSkills.length,
                          skillsCount: validSkills.length,
                        });
                      }
                      
                      if (validSkills.length === 0) {
                        return <p className="text-sm text-gray-500">No skills listed</p>;
                      }
                      
                      return (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {validSkills.map((skill, skillIdx) => {
                              const skillId = skill?._id || `skill-${skillIdx}`;
                              const skillName = skill?.name || skill?.description || `Skill ${skillIdx + 1}`;
                              const categoryName = skill?.category && typeof skill.category === 'object' 
                                ? (skill.category?.name || '')
                                : (typeof skill?.category === 'string' ? skill.category : '');
                              const skillLevel = skill?.metadata?.level;
                              const yearsExp = skill?.metadata?.yearsExperience;
                              const isCertified = skill?.metadata?.certified;
                              
                              // Build comprehensive tooltip
                              const tooltipParts = [skillName];
                              if (skillLevel) tooltipParts.push(`Level: ${skillLevel}`);
                              if (yearsExp) tooltipParts.push(`${yearsExp} years experience`);
                              if (categoryName) tooltipParts.push(`Category: ${categoryName}`);
                              if (skill?.description) tooltipParts.push(skill.description);
                              const tooltip = tooltipParts.join(' • ');
                              
                              return (
                                <div
                                  key={skillId}
                                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-1 hover:bg-blue-100 transition-colors"
                                  title={tooltip}
                                >
                                  {skillName}
                                  {isCertified && (
                                    <Award className="w-3 h-3" />
                                  )}
                                  {skillLevel && !isCertified && (
                                    <span className="text-xs opacity-75" title={`${skillLevel} level`}>
                                      ({skillLevel})
                                    </span>
                                  )}
                                  {yearsExp && !skillLevel && !isCertified && (
                                    <span className="text-xs opacity-75" title={`${yearsExp} years experience`}>
                                      ({yearsExp}y)
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {/* Show skill details if available */}
                          {validSkills.some(skill => skill && (skill.description || (skill.metadata && (skill.metadata.level || skill.metadata.yearsExperience)))) && (
                            <div className="mt-3 space-y-2 border-t border-gray-100 pt-2">
                              {validSkills
                                .filter(skill => skill && (skill.description || (skill.metadata && (skill.metadata.level || skill.metadata.yearsExperience))))
                                .map((skill, skillIdx) => {
                                  const skillId = skill?._id || `skill-${skillIdx}`;
                                  const skillName = skill?.name || skill?.description || `Skill ${skillIdx + 1}`;
                                  const categoryName: string = skill?.category && typeof skill.category === 'object' 
                                    ? (skill.category?.name || '')
                                    : (typeof skill?.category === 'string' ? skill.category : '');
                                  const skillLevel = skill?.metadata?.level;
                                  const yearsExp = skill?.metadata?.yearsExperience;
                                
                                  return (
                                    <div key={skillId} className="text-xs text-gray-600">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-gray-700">{skillName}</span>
                                        {categoryName && (
                                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                            {categoryName}
                                          </span>
                                        )}
                                        {skillLevel && (
                                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                            {skillLevel}
                                          </span>
                                        )}
                                        {yearsExp && (
                                          <span className="text-gray-500">
                                            {yearsExp} {yearsExp === 1 ? 'year' : 'years'} exp.
                                          </span>
                                        )}
                                      </div>
                                      {skill?.description && (
                                        <p className="text-gray-600 mt-1 ml-0">{skill.description}</p>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Service Areas */}
                {specialty.serviceAreas && specialty.serviceAreas.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Service Areas:</h4>
                    <div className="flex flex-wrap gap-2">
                      {specialty.serviceAreas.map((area, areaIdx) => (
                        <span
                          key={areaIdx}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {area.city}, {area.state} {area.zipCode}
                          {area.radius && ` (${area.radius}mi radius)`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Languages */}
      {provider.professionalInfo?.languages && provider.professionalInfo.languages.length > 0 && (
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Languages</h2>
          <div className="flex flex-wrap gap-2">
            {provider.professionalInfo.languages.map((lang, idx) => (
              <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

          {/* Verification Details */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Verification & Credentials
            </h2>
            <div className="space-y-4">
          {/* Basic Verifications */}
          <div className="grid grid-cols-2 gap-3">
          {(provider.verification?.identityVerified || userId?.trust?.verification?.identityVerified) && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">Identity Verified</span>
            </div>
          )}
          {provider.verification?.businessVerified && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">Business Verified</span>
            </div>
          )}
          {userId?.trust?.verification?.phoneVerified && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">Phone Verified</span>
            </div>
          )}
          {userId?.trust?.verification?.emailVerified && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">Email Verified</span>
              </div>
            )}
          </div>

          {/* Background Check */}
          {provider.verification?.backgroundCheck && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Background Check</h3>
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-5 h-5 ${provider.verification.backgroundCheck.status === 'passed' ? 'text-green-500' : 'text-yellow-500'}`} />
                <span className="text-gray-700 capitalize">{provider.verification.backgroundCheck.status}</span>
                {provider.verification.backgroundCheck.reportId && (
                  <span className="text-sm text-gray-500">({provider.verification.backgroundCheck.reportId})</span>
                )}
              </div>
            </div>
          )}

          {/* Insurance */}
          {provider.verification?.insurance && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Insurance</h3>
              <div className="space-y-2">
                {provider.verification.insurance.liability?.active && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span className="text-gray-700">Liability Insurance</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      ${(provider.verification.insurance.liability.amount || 0).toLocaleString()}
                    </div>
                  </div>
                )}
                {provider.verification.insurance.workersComp?.active && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span className="text-gray-700">Workers&apos; Compensation</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      ${(provider.verification.insurance.workersComp.amount || 0).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Licenses */}
          {provider.verification?.licenses && provider.verification.licenses.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Licenses</h3>
              <div className="space-y-2">
                {provider.verification.licenses.map((license, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-700 font-medium capitalize">{license.type?.replace('_', ' ')}</span>
                      {license.number && (
                        <span className="text-sm text-gray-600 ml-2">#{license.number}</span>
                      )}
                      {license.state && (
                        <span className="text-sm text-gray-600 ml-2">({license.state})</span>
                      )}
                    </div>
                    {license.expiresAt && (
                      <span className="text-sm text-gray-500">
                        Expires: {new Date(license.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {provider.verification?.certifications && provider.verification.certifications.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Certifications</h3>
              <div className="space-y-2">
                {provider.verification.certifications.map((cert, idx) => (
                  <div key={idx}>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-700 font-medium">{cert.name}</span>
                    </div>
                    {cert.issuer && (
                      <p className="text-sm text-gray-600 ml-6">Issued by: {cert.issuer}</p>
                    )}
                    {cert.expiresAt && (
                      <p className="text-sm text-gray-500 ml-6">
                        Expires: {new Date(cert.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

          {/* Trust & Badges */}
          {(provider.trust?.trustScore || provider.trust?.badges) && (
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Trust & Badges
          </h2>
          <div className="space-y-4">
            {provider.trust.trustScore && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">Trust Score</span>
                  <span className="text-2xl font-bold text-gray-900">{provider.trust.trustScore}</span>
                  <span className="text-sm text-gray-500">/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 h-3 rounded-full shadow-lg transition-all duration-500"
                    style={{ width: `${provider.trust.trustScore}%` }}
                  />
                </div>
              </div>
            )}
            {provider.trust.badges && provider.trust.badges.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Badges</h3>
                <div className="flex flex-wrap gap-2">
                  {provider.trust.badges.map((badge, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg flex items-center gap-2"
                    >
                      <Award className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">{badge.description || badge.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

          {/* Availability */}
          {provider.professionalInfo?.availability && (
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Availability
          </h2>
          <div className="space-y-2">
            {Object.entries(provider.professionalInfo.availability).map(([day, schedule]) => (
              schedule.available ? (
                <div key={day} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="font-medium text-gray-700 capitalize">{day}</span>
                  <span className="text-sm text-gray-600">
                    {schedule.start} - {schedule.end}
                  </span>
                </div>
              ) : null
            ))}
            {provider.professionalInfo.emergencyServices && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-green-600">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Emergency Services Available</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

          {/* Agency Info */}
          {provider.agency && (
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Agency Information
          </h2>
          <div className="space-y-2">
            {provider.agency.agencyId?.name && (
              <div>
                <span className="text-sm text-gray-600">Agency:</span>
                <span className="ml-2 font-medium text-gray-900">{provider.agency.agencyId.name}</span>
              </div>
            )}
            {provider.agency.role && (
              <div>
                <span className="text-sm text-gray-600">Role:</span>
                <span className="ml-2 font-medium text-gray-900 capitalize">{provider.agency.role}</span>
              </div>
            )}
            {provider.agency.commissionRate && (
              <div>
                <span className="text-sm text-gray-600">Commission Rate:</span>
                <span className="ml-2 font-medium text-gray-900">{provider.agency.commissionRate}%</span>
              </div>
            )}
          </div>
        </div>
      )}

          {/* Performance Statistics */}
      <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Performance Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">{rating > 0 ? rating.toFixed(1) : 'N/A'}</div>
            <div className="text-sm text-gray-600">Rating</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{reviewCount}</div>
            <div className="text-sm text-gray-600">Reviews</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalJobs}</div>
            <div className="text-sm text-gray-600">Total Jobs</div>
          </div>
          {provider.performance?.completedJobs !== undefined && (
            <div>
              <div className="text-2xl font-bold text-gray-900">{provider.performance.completedJobs}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          )}
        </div>
        {(provider.performance?.completionRate || provider.performance?.cancellationRate || provider.performance?.averageResponseTime) && (
          <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 md:grid-cols-3 gap-4">
            {provider.performance.completionRate !== undefined && (
              <div>
                <div className="text-xl font-bold text-green-600">{provider.performance.completionRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
            )}
            {provider.performance.cancellationRate !== undefined && (
              <div>
                <div className="text-xl font-bold text-gray-900">{provider.performance.cancellationRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Cancellation Rate</div>
              </div>
            )}
            {provider.performance.averageResponseTime !== undefined && (
              <div>
                <div className="text-xl font-bold text-gray-900">{provider.performance.averageResponseTime.toFixed(1)}h</div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </div>
            )}
          </div>
        )}
        {(provider.performance?.totalEarnings !== undefined || provider.performance?.averageJobValue !== undefined) && (
          <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 gap-4">
            {provider.performance.totalEarnings !== undefined && (
              <div>
                <div className="text-xl font-bold text-gray-900">
                  {formatPrice(provider.performance.totalEarnings)}
                </div>
                <div className="text-sm text-gray-600">Total Earnings</div>
              </div>
            )}
            {provider.performance.averageJobValue !== undefined && (
              <div>
                <div className="text-xl font-bold text-gray-900">
                  {formatPrice(provider.performance.averageJobValue)}
                </div>
                <div className="text-sm text-gray-600">Avg Job Value</div>
              </div>
            )}
          </div>
        )}
      </div>

          {/* Metadata */}
          {provider.metadata && (
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
          <div className="space-y-3">
            {provider.metadata.profileViews && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {provider.metadata.profileViews.toLocaleString()} profile views
                </span>
              </div>
            )}
            {(provider.metadata.featured || provider.metadata.promoted) && (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-600">
                  {provider.metadata.featured && 'Featured'}
                  {provider.metadata.featured && provider.metadata.promoted && ' • '}
                  {provider.metadata.promoted && 'Promoted'}
                </span>
              </div>
            )}
            {provider.metadata.tags && provider.metadata.tags.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-700 mb-2 block">Tags:</span>
                <div className="flex flex-wrap gap-2">
                  {provider.metadata.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </div>
        </div>
      </div>
    </div>
  );
}
