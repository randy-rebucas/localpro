"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Phone, Mail, CheckCircle, ArrowLeft, User, Award, Clock, DollarSign, Shield, Briefcase, Calendar, TrendingUp, Users, FileText, Building2 } from "lucide-react";
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
      yearsOfExperience?: number;
      serviceAreas?: Array<{
        city?: string;
        state?: string;
        zipCode?: string;
        radius?: number;
      }>;
      skills?: Array<{
        _id?: string;
        name?: string;
        description?: string;
        category?: string;
        metadata?: {
          level?: string;
          certified?: boolean;
        };
      }>;
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
  };
  verification?: {
    identityVerified?: boolean;
    identityVerifiedAt?: string;
    businessVerified?: boolean;
    businessVerifiedAt?: string | null;
    backgroundCheck?: {
      status?: string;
      completedAt?: string;
      reportId?: string;
      expiresAt?: string;
    };
    insurance?: {
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
      type?: string;
      number?: string;
      state?: string;
      expiresAt?: string;
    }>;
    certifications?: Array<{
      name?: string;
      issuer?: string;
      issuedAt?: string;
      expiresAt?: string;
    }>;
  };
  performance?: {
    rating?: number;
    totalReviews?: number;
    totalJobs?: number;
    completedJobs?: number;
    cancelledJobs?: number;
    pendingJobs?: number;
    completionRate?: number;
    cancellationRate?: number;
    averageResponseTime?: number;
    totalEarnings?: number;
    averageJobValue?: number;
    responseTimeMinutes?: number;
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
  };
  preferences?: {
    communicationPreferences?: {
      preferredMethod?: string;
      responseTime?: string;
    };
    jobPreferences?: {
      acceptEmergencyJobs?: boolean;
      preferredDistance?: number;
    };
    availabilityPreferences?: {
      sameDayBooking?: boolean;
      weekendAvailability?: boolean;
      advanceBookingDays?: number;
    };
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
        // Merge trust data from userId.trust if available
        const trustData = userId?.trust || providerData.trust;
        
        return {
          ...providerData,
          _id: providerData._id || providerData.id,
          firstName: userId?.firstName || '',
          lastName: userId?.lastName || '',
          email: userId?.email || '',
          phoneNumber: userId?.phoneNumber || userId?.phone || '',
          userId: userId,
          status: providerData.status || (isStatusError ? 'pending' : undefined),
          trust: trustData || providerData.trust,
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Specialties & Services</h2>
          <div className="space-y-6">
            {provider.professionalInfo.specialties.map((specialty, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    {specialty.category && (
                      <h3 className="font-semibold text-lg text-gray-900 capitalize mb-1">
                        {specialty.category}
                      </h3>
                    )}
                    {specialty.yearsOfExperience && (
                      <p className="text-sm text-gray-600">
                        {specialty.yearsOfExperience} years of experience
                      </p>
                    )}
                  </div>
                  {specialty.pricing && (
                    <div className="text-right">
                      {specialty.pricing.hourlyRate && (
                        <div className="text-lg font-semibold text-gray-900">
                          ${specialty.pricing.hourlyRate}
                          <span className="text-sm font-normal text-gray-600">/hr</span>
                        </div>
                      )}
                      {specialty.pricing.minimumCharge && (
                        <div className="text-sm text-gray-600">
                          Min: ${specialty.pricing.minimumCharge}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {specialty.description && (
                  <p className="text-gray-700 mb-3">{specialty.description}</p>
                )}
                
                {/* Skills */}
                {specialty.skills && specialty.skills.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {specialty.skills.map((skill, skillIdx) => (
                        <span
                          key={skillIdx}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-1"
                        >
                          {skill.name}
                          {skill.metadata?.certified && (
                            <Award className="w-3 h-3" />
                          )}
                        </span>
                      ))}
                    </div>
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
                      <span className="text-gray-700">Workers' Compensation</span>
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
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
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
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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

      {/* Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
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
        {(provider.performance?.totalEarnings || provider.performance?.averageJobValue) && (
          <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 gap-4">
            {provider.performance.totalEarnings !== undefined && (
              <div>
                <div className="text-xl font-bold text-gray-900">
                  ${provider.performance.totalEarnings.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Earnings</div>
              </div>
            )}
            {provider.performance.averageJobValue !== undefined && (
              <div>
                <div className="text-xl font-bold text-gray-900">
                  ${provider.performance.averageJobValue.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Avg Job Value</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metadata */}
      {provider.metadata && (
        <div className="bg-white rounded-lg shadow-sm p-6">
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
  );
}
