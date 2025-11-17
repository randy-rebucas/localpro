"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Phone, Mail, CheckCircle } from "lucide-react";
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

  const providerId = params?.id as string;

  useEffect(() => {
    const fetchProvider = async () => {
      if (!providerId) {
        setError("Provider ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchOptions = createAuthFetchOptions();

        const endpoint = API_ENDPOINTS.marketplaceProvidersById.replace("[id]", providerId);
        const response = await fetch(
          `${API_BASE_URL}${endpoint}`,
          fetchOptions
        );

        if (!response.ok) {
          let errorMessage = `Failed to fetch provider: ${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch {
            // If response is not JSON, use status text
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          // Normalize provider data
          const userId = typeof data.data.userId === 'object' ? data.data.userId : null;
          const normalizedProvider: Provider = {
            ...data.data,
            _id: data.data._id || data.data.id,
            firstName: userId?.firstName || '',
            lastName: userId?.lastName || '',
            email: userId?.email || '',
            phoneNumber: userId?.phoneNumber || userId?.phone || '',
            userId: userId,
          };
          setProvider(normalizedProvider);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load provider";
        logger.error("Error fetching provider:", new Error(errorMessage));
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [providerId]);

  if (loading) {
    return <Loading />;
  }

  if (error || !provider) {
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
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back Link */}
      <Link href="/marketplace/providers" className="text-blue-600 hover:underline mb-6 inline-block">
        ← Back to Providers
      </Link>

      {/* Header */}
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{fullName}</h1>
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
