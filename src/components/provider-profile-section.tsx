"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Settings,
  TrendingUp,
  Star,
  MapPin,
  DollarSign,
  ExternalLink,
  ArrowRight,
  XCircle,
  LayoutGrid,
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { Provider } from "@/types/providers";

interface ProviderProfileSectionProps {
  userId?: string;
}

const ONBOARDING_STEPS = [
  { key: "profile_setup", label: "Profile Setup", progress: 10 },
  { key: "business_info", label: "Business Info", progress: 25 },
  { key: "professional_info", label: "Professional Info", progress: 40 },
  { key: "verification", label: "Verification", progress: 55 },
  { key: "documents", label: "Documents", progress: 70 },
  { key: "portfolio", label: "Portfolio", progress: 85 },
  { key: "preferences", label: "Preferences", progress: 95 },
  { key: "review", label: "Review", progress: 100 },
];

export function ProviderProfileSection({ userId }: ProviderProfileSectionProps) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviderProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.providersProfileMe}`,
          createAuthFetchOptions({ method: "GET" })
        );

        if (!response.ok) {
          if (response.status === 404) {
            // User doesn't have a provider profile yet
            setProvider(null);
            return;
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || `Failed to fetch provider profile: ${response.status}`);
        }

        const responseData = await response.json();
        const providerData = responseData?.data || responseData;
        
        if (providerData) {
          setProvider(providerData as Provider);
        }
      } catch (err) {
        logger.error("Error fetching provider profile", err instanceof Error ? err : new Error(String(err)));
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch provider profile";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProviderProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <span className="ml-3 text-gray-600">Loading provider information...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 shadow-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Error Loading Provider Profile</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return null; // Don't show anything if user doesn't have provider profile
  }

  const onboarding = provider.onboarding;
  const businessInfo = provider.businessInfo;
  const professionalInfo = provider.professionalInfo;
  const verification = provider.verification;
  const performance = provider.performance;
  const providerType = provider.providerType;
  const status = provider.status;

  const getStatusBadge = (status?: string) => {
    const statusColors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      suspended: "bg-red-100 text-red-800",
      inactive: "bg-gray-100 text-gray-800",
      rejected: "bg-red-100 text-red-800",
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status || "pending"] || statusColors.pending}`}>
        {status || "pending"}
      </span>
    );
  };

  const getStepStatus = (stepKey: string) => {
    if (!onboarding?.steps) return "pending";
    const step = onboarding.steps.find((s) => s.step === stepKey);
    return step?.completed ? "completed" : "pending";
  };

  return (
    <div className="space-y-6">
      {/* Provider Header Card */}
      <div className="bg-gradient-to-br from-white via-accent/5 to-accent/10 rounded-2xl border border-gray-200 shadow-xl p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Provider Profile</h2>
              <p className="text-sm text-gray-600 capitalize">{providerType} Provider</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(status)}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent/90 rounded-lg hover:from-accent/90 hover:to-accent transition-all shadow-md hover:shadow-lg"
            >
              Dashboard
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Onboarding Progress */}
        {onboarding && (
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Onboarding Progress</h3>
                <p className="text-xs text-gray-500">Complete your profile to start accepting jobs</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-accent">{onboarding.progress || 0}%</span>
                <p className="text-xs text-gray-500">Complete</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-accent to-accent/80 h-3 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${onboarding.progress || 0}%` }}
              ></div>
            </div>
            {!onboarding.completed && (
              <Link
                href="/profile/edit"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent/90 rounded-lg hover:from-accent/90 hover:to-accent transition-all shadow-md hover:shadow-lg"
              >
                Complete onboarding
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Onboarding Steps */}
      {onboarding && !onboarding.completed && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Onboarding Steps</h3>
              <p className="text-sm text-gray-500 mt-1">Track your progress through each step</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ONBOARDING_STEPS.map((step) => {
              const stepStatus = getStepStatus(step.key);
              const isCompleted = stepStatus === "completed";
              const isCurrent = onboarding.currentStep === step.key;

              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    isCurrent
                      ? "border-accent bg-accent/10 shadow-md"
                      : isCompleted
                      ? "border-green-300 bg-green-50/50"
                      : "border-gray-200 bg-gray-50/50"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-accent" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-semibold truncate ${isCurrent ? "text-accent" : isCompleted ? "text-gray-900" : "text-gray-600"}`}>
                        {step.label}
                      </span>
                      {isCompleted && (
                        <span className="flex-shrink-0 text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{step.progress}% progress</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Business Info - Only for business/agency types */}
      {providerType !== "individual" && businessInfo && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
              <p className="text-sm text-gray-500">Your business details and contact information</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {businessInfo.businessName && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Business Name</p>
                <p className="text-sm text-gray-900">{businessInfo.businessName}</p>
              </div>
            )}
            {businessInfo.businessType && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Business Type</p>
                <p className="text-sm text-gray-900 capitalize">{businessInfo.businessType.replace("_", " ")}</p>
              </div>
            )}
            {businessInfo.businessAddress && (
              <div className="md:col-span-2">
                <p className="text-xs font-medium text-gray-500 mb-1">Address</p>
                <p className="text-sm text-gray-900">
                  {[
                    businessInfo.businessAddress.street,
                    businessInfo.businessAddress.city,
                    businessInfo.businessAddress.state,
                    businessInfo.businessAddress.zipCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            )}
            {businessInfo.businessPhone && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Phone</p>
                <p className="text-sm text-gray-900">{businessInfo.businessPhone}</p>
              </div>
            )}
            {businessInfo.website && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Website</p>
                <a
                  href={businessInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  {businessInfo.website}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Professional Info */}
      {professionalInfo && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>
              <p className="text-sm text-gray-500">Your specialties, service areas, and expertise</p>
            </div>
          </div>
          {professionalInfo.specialties && professionalInfo.specialties.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Specialties</p>
              <div className="space-y-2">
                {professionalInfo.specialties.map((specialty, index) => (
                  <div key={index} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:border-accent/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-900 capitalize">{specialty.category}</span>
                      {specialty.hourlyRate && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-semibold">
                          <DollarSign className="w-3 h-3" />
                          {specialty.hourlyRate}/hr
                        </span>
                      )}
                    </div>
                    {specialty.serviceAreas && specialty.serviceAreas.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {specialty.serviceAreas.map((area, areaIndex) => (
                          <span
                            key={areaIndex}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-accent/50 transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5 text-accent" />
                            {area.city}, {area.state}
                            {area.radius && <span className="text-gray-500">({area.radius}mi)</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {professionalInfo.languages && professionalInfo.languages.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-3">Languages Spoken</p>
              <div className="flex flex-wrap gap-2">
                {professionalInfo.languages.map((lang, index) => (
                  <span key={index} className="px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-sm font-medium border border-accent/20">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verification Status */}
      {verification && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Verification Status</h3>
              <p className="text-sm text-gray-500">Your verification and compliance status</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
              verification.identityVerified 
                ? "border-green-200 bg-green-50/50" 
                : "border-gray-200 bg-gray-50/50"
            }`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                verification.identityVerified ? "bg-green-100" : "bg-gray-200"
              }`}>
                {verification.identityVerified ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900 block">Identity Verified</span>
                <span className="text-xs text-gray-500">
                  {verification.identityVerified ? "Verified" : "Pending"}
                </span>
              </div>
            </div>
            {providerType !== "individual" && (
              <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
                verification.businessVerified 
                  ? "border-green-200 bg-green-50/50" 
                  : "border-gray-200 bg-gray-50/50"
              }`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  verification.businessVerified ? "bg-green-100" : "bg-gray-200"
                }`}>
                  {verification.businessVerified ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">Business Verified</span>
                  <span className="text-xs text-gray-500">
                    {verification.businessVerified ? "Verified" : "Pending"}
                  </span>
                </div>
              </div>
            )}
            {verification.insurance?.hasInsurance && (
              <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-green-200 bg-green-50/50">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">Insurance</span>
                  <span className="text-xs text-gray-500">Active coverage</span>
                </div>
              </div>
            )}
            {verification.backgroundCheck && (
              <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
                verification.backgroundCheck.status === "passed"
                  ? "border-green-200 bg-green-50/50"
                  : verification.backgroundCheck.status === "pending"
                  ? "border-yellow-200 bg-yellow-50/50"
                  : "border-gray-200 bg-gray-50/50"
              }`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  verification.backgroundCheck.status === "passed"
                    ? "bg-green-100"
                    : verification.backgroundCheck.status === "pending"
                    ? "bg-yellow-100"
                    : "bg-gray-200"
                }`}>
                  {verification.backgroundCheck.status === "passed" ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : verification.backgroundCheck.status === "pending" ? (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">Background Check</span>
                  <span className="text-xs text-gray-500 capitalize">
                    {verification.backgroundCheck.status || "Not started"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {performance && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
              <p className="text-sm text-gray-500">Your business performance and statistics</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {performance.rating !== undefined && (
              <div className="text-center p-5 bg-gradient-to-br from-yellow-50 to-white rounded-xl border-2 border-yellow-200 hover:border-yellow-300 transition-colors">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-2xl font-bold text-gray-900">{performance.rating.toFixed(1)}</span>
                </div>
                <p className="text-xs font-medium text-gray-600">
                  {performance.totalReviews || 0} {performance.totalReviews === 1 ? "review" : "reviews"}
                </p>
              </div>
            )}
            {performance.totalJobs !== undefined && (
              <div className="text-center p-5 bg-gradient-to-br from-blue-50 to-white rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-colors">
                <p className="text-2xl font-bold text-gray-900 mb-2">{performance.totalJobs}</p>
                <p className="text-xs font-medium text-gray-600">Total Jobs</p>
              </div>
            )}
            {performance.completionRate !== undefined && (
              <div className="text-center p-5 bg-gradient-to-br from-green-50 to-white rounded-xl border-2 border-green-200 hover:border-green-300 transition-colors">
                <p className="text-2xl font-bold text-gray-900 mb-2">{performance.completionRate.toFixed(0)}%</p>
                <p className="text-xs font-medium text-gray-600">Completion Rate</p>
              </div>
            )}
            {performance.responseTime !== undefined && (
              <div className="text-center p-5 bg-gradient-to-br from-purple-50 to-white rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-colors">
                <p className="text-2xl font-bold text-gray-900 mb-2">{performance.responseTime.toFixed(1)}h</p>
                <p className="text-xs font-medium text-gray-600">Avg Response</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <p className="text-sm text-gray-500">Access your provider tools and settings</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-accent hover:bg-accent/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-accent/10 group-hover:bg-accent/20 flex items-center justify-center transition-colors">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900 block">View Dashboard</span>
              <span className="text-xs text-gray-500">Analytics and insights</span>
            </div>
          </Link>
          {!onboarding?.completed && (
            <Link
              href="/profile/edit"
              className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-accent hover:bg-accent/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-accent/10 group-hover:bg-accent/20 flex items-center justify-center transition-colors">
                <Settings className="w-6 h-6 text-accent" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-900 block">Complete Onboarding</span>
                <span className="text-xs text-gray-500">Finish your profile setup</span>
              </div>
            </Link>
          )}
          <Link
            href="/profile/edit"
            className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-accent hover:bg-accent/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-accent/10 group-hover:bg-accent/20 flex items-center justify-center transition-colors">
              <FileText className="w-6 h-6 text-accent" />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900 block">Edit Profile</span>
              <span className="text-xs text-gray-500">Update your information</span>
            </div>
          </Link>
          <Link
            href="/marketplace/my-services"
            className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-accent hover:bg-accent/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-accent/10 group-hover:bg-accent/20 flex items-center justify-center transition-colors">
              <Briefcase className="w-6 h-6 text-accent" />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900 block">Manage Services</span>
              <span className="text-xs text-gray-500">Your service listings</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

