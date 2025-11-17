"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Phone, Mail, CheckCircle, ArrowLeft, User } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

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
    specialties?: Array<{
      category?: string;
      description?: string;
    }>;
    languages?: string[];
  };
  verification?: {
    identityVerified?: boolean;
    businessVerified?: boolean;
  };
  performance?: {
    rating?: number;
    totalReviews?: number;
    totalJobs?: number;
  };
  createdAt?: string;
}

export default function ProviderDetailPage() {
  const params = useParams();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusWarning, setStatusWarning] = useState<string | null>(null);

  const providerId = params?.id as string;

  useEffect(() => {
    const fetchProvider = async () => {
      if (!providerId) {
        setError("Provider ID is required");
        setLoading(false);
        return;
      }

      const normalizeProviderData = (providerData: any, isStatusError: boolean = false): Provider | null => {
        if (!providerData || (!providerData._id && !providerData.id && !providerData.userId)) {
          return null;
        }

        const userId = typeof providerData.userId === 'object' ? providerData.userId : null;
        return {
          ...providerData,
          _id: providerData._id || providerData.id,
          firstName: userId?.firstName || '',
          lastName: userId?.lastName || '',
          email: userId?.email || '',
          phoneNumber: userId?.phoneNumber || userId?.phone || '',
          userId: userId,
          status: providerData.status || (isStatusError ? 'pending' : undefined),
        };
      };

      let providerDataFetched = false; // Track if we successfully fetched provider data

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

        let data: any = null;
        let errorMessage: string | null = null;
        let isStatusError = false;

        // Try to parse response even if not ok
        try {
          data = await marketplaceResponse.json();
        } catch {
          // If response is not JSON, continue with error handling
        }

        if (!marketplaceResponse.ok) {
          errorMessage = `Failed to fetch provider: ${marketplaceResponse.status} ${marketplaceResponse.statusText}`;
          if (data) {
            if (data.message) {
              errorMessage = data.message;
            } else if (data.error) {
              errorMessage = data.error;
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
        if (data && (data.success || data.data || data.provider)) {
          const providerData = data.data || data.provider || data;
          normalizedProvider = normalizeProviderData(providerData, isStatusError);
        }

        // If we got provider data, use it (even if there was a status error)
        if (normalizedProvider) {
          setProvider(normalizedProvider);
          providerDataFetched = true;
          if (isStatusError) {
            // Don't log error for status issues when we have data to display
            return;
          }
        } else if (isStatusError) {
          // If marketplace endpoint failed with status error and no data, try regular providers endpoint
          try {
            const providersEndpoint = API_ENDPOINTS.providersById.replace("[id]", providerId);
            const providersResponse = await fetch(
              `${API_BASE_URL}${providersEndpoint}`,
              fetchOptions
            );

            if (providersResponse.ok) {
              const providersData = await providersResponse.json();
              const providerData = providersData.data || providersData.provider || providersData;
              normalizedProvider = normalizeProviderData(providerData, true);
              
              if (normalizedProvider) {
                setProvider(normalizedProvider);
                providerDataFetched = true;
                // Don't log error - we successfully got provider data from fallback endpoint
                return;
              }
            }
          } catch (fallbackErr) {
            // Fallback failed, continue with original error
          }
        }

        // Only throw error if we don't have provider data
        if (!normalizedProvider) {
          throw new Error(errorMessage || "Invalid response format");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load provider";
        // Only log error if we didn't successfully fetch provider data
        if (!providerDataFetched) {
          logger.error("Error fetching provider:", new Error(errorMessage));
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [providerId]);

  if (loading) {
    return <Loading />;
  }

  if (error && !provider) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || "Provider not found"}</p>
          <Link href="/marketplace/providers" className="text-blue-600 hover:underline mt-2 inline-block">
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
          <Link href="/marketplace/providers" className="text-blue-600 hover:underline mt-2 inline-block">
            ← Back to Providers
          </Link>
        </div>
      </div>
    );
  }

  const userId = typeof provider.userId === 'object' ? provider.userId : null;
  const avatarUrl = userId?.profile?.avatar?.url || userId?.profile?.avatar?.thumbnail || userId?.profileImage || '/placeholder-avatar.png';
  const fullName = `${provider.firstName || ''} ${provider.lastName || ''}`.trim() || 'Provider';
  const location = userId?.profile?.address 
    ? `${userId.profile.address.city || ''}, ${userId.profile.address.state || ''}`.trim()
    : 'Location not specified';
  const rating = provider.performance?.rating || 0;
  const reviewCount = provider.performance?.totalReviews || 0;
  const totalJobs = provider.performance?.totalJobs || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/marketplace/providers"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to providers"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{fullName}</h1>
          <p className="text-sm text-gray-600">
            {provider.businessInfo?.businessName || location}
            {rating > 0 && ` • ${rating.toFixed(1)} (${reviewCount} reviews)`}
          </p>
        </div>
      </div>

      {/* Status Warning Banner */}
      {statusWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            <strong>Note:</strong> {statusWarning}
          </p>
        </div>
      )}

      {/* Provider Info Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200">
            <Image
              src={avatarUrl}
              alt={fullName}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            {provider.businessInfo?.businessName && (
              <p className="text-lg text-gray-600 mb-2">{provider.businessInfo.businessName}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{location}</span>
              </div>
              {rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{rating.toFixed(1)} ({reviewCount} reviews)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
        <div className="space-y-3">
          {provider.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{provider.email}</span>
            </div>
          )}
          {provider.phoneNumber && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{provider.phoneNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* About */}
      {userId?.profile?.bio && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
          <p className="text-gray-700">{userId.profile.bio}</p>
        </div>
      )}

      {/* Business Description */}
      {provider.businessInfo?.businessDescription && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Description</h2>
          <p className="text-gray-700">{provider.businessInfo.businessDescription}</p>
        </div>
      )}

      {/* Specialties */}
      {provider.professionalInfo?.specialties && provider.professionalInfo.specialties.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Specialties</h2>
          <div className="space-y-3">
            {provider.professionalInfo.specialties.map((specialty, idx) => (
              <div key={idx}>
                {specialty.category && (
                  <h3 className="font-medium text-gray-900 mb-1">{specialty.category}</h3>
                )}
                {specialty.description && (
                  <p className="text-gray-600 text-sm">{specialty.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {provider.professionalInfo?.languages && provider.professionalInfo.languages.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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

      {/* Verification */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Verification</h2>
        <div className="space-y-2">
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
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistics</h2>
        <div className="grid grid-cols-3 gap-4">
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
        </div>
      </div>
    </div>
  );
}
