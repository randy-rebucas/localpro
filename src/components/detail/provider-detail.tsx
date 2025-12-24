"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  MapPin,
  Star,
  Briefcase,
  Award,
  CheckCircle2,
  Phone,
  Mail,
  Globe,
  Heart,
  Share2,
  MessageSquare,
  Building2,
  Calendar,
  Shield,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Provider } from "@/types/providers";
import { useSession } from "@/hooks/useAuth";

interface ProviderDetailProps {
  provider: Provider;
  onContact?: () => void;
  onFavorite?: () => void;
}

export function ProviderDetail({ provider, onContact, onFavorite }: ProviderDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isOwnProfile = session?.user?.id === provider.userId;

  const businessName = provider.businessInfo?.businessName ||
    `${provider.profile?.firstName || ""} ${provider.profile?.lastName || ""}`.trim() ||
    "Provider";

  const avatarUrl = provider.profile?.avatar?.url || provider.profile?.avatar?.thumbnail;
  const hasAvatar = avatarUrl && avatarUrl !== '/placeholder-avatar.png' && !avatarUrl.includes('placeholder');

  // Get initials for avatar fallback
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  const initials = getInitials(businessName);

  const rating = provider.rating?.average || provider.performance?.rating || 0;
  const reviewCount = provider.rating?.count || provider.performance?.totalReviews || 0;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-lg p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Avatar/Logo */}
          <div className="flex-shrink-0">
            <div className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-100 via-emerald-200 to-teal-100 flex items-center justify-center">
              {hasAvatar && avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={businessName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 128px, 160px"
                  unoptimized={avatarUrl.startsWith('http://localhost') || !avatarUrl.startsWith('http')}
                />
              ) : (
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-3xl lg:text-4xl font-bold shadow-lg">
                  {initials}
                </div>
              )}
            </div>
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {businessName}
                </h1>
                {provider.businessInfo?.businessType && (
                  <p className="text-lg text-gray-600 mb-3">{provider.businessInfo.businessType}</p>
                )}
                {provider.businessInfo?.businessDescription && (
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {provider.businessInfo.businessDescription}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {!isOwnProfile && onFavorite && (
                  <button
                    onClick={onFavorite}
                    className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Add to favorites"
                  >
                    <Heart className="w-5 h-5 text-pink-500" />
                  </button>
                )}
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: businessName,
                        url: window.location.href,
                      });
                    }
                  }}
                  className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Share provider"
                >
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {provider.status && (
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  provider.status === "active" ? "bg-emerald-100 text-emerald-800" :
                  provider.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                </span>
              )}
              {provider.verification?.identityVerified && (
                <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Verified
                </span>
              )}
              {provider.verification?.backgroundCheck?.status === "passed" && (
                <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  Background Checked
                </span>
              )}
              {provider.providerType && (
                <span className="px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  {provider.providerType === 'business' ? 'Business' : 
                   provider.providerType === 'agency' ? 'Agency' : 'Individual'}
                </span>
              )}
            </div>

            {/* Rating and Location */}
            <div className="flex flex-wrap items-center gap-6 mb-6">
              {rating > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-bold text-gray-900">{rating.toFixed(1)}</span>
                  {reviewCount > 0 && (
                    <span className="text-sm text-gray-600">
                      ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                    </span>
                  )}
                </div>
              )}
              {provider.businessInfo?.businessAddress && (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium">
                    {[
                      provider.businessInfo.businessAddress.city,
                      provider.businessInfo.businessAddress.state,
                      provider.businessInfo.businessAddress.country
                    ].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {onContact && !isOwnProfile && (
                <Button 
                  onClick={onContact} 
                  size="lg" 
                  className="flex-1 sm:flex-initial bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md hover:shadow-lg"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Provider
                </Button>
              )}
              {!isOwnProfile && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/marketplace/providers/${provider._id || provider.userId}/services`)}
                  size="lg"
                  className="flex-1 sm:flex-initial"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  View Services
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        {(provider.businessInfo?.businessEmail || provider.businessInfo?.businessPhone || provider.businessInfo?.website) && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600" />
              Contact Information
            </h2>
            <div className="space-y-4">
              {provider.businessInfo?.businessEmail && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Mail className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500">Email</p>
                    <a 
                      href={`mailto:${provider.businessInfo.businessEmail}`} 
                      className="text-emerald-600 hover:text-emerald-700 font-medium break-all"
                    >
                      {provider.businessInfo.businessEmail}
                    </a>
                  </div>
                </div>
              )}
              {provider.businessInfo?.businessPhone && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Phone className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500">Phone</p>
                    <a 
                      href={`tel:${provider.businessInfo.businessPhone}`} 
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      {provider.businessInfo.businessPhone}
                    </a>
                  </div>
                </div>
              )}
              {provider.businessInfo?.website && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Globe className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500">Website</p>
                    <a
                      href={provider.businessInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 font-medium break-all"
                    >
                      {provider.businessInfo.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Specialties */}
        {provider.professionalInfo?.specialties && provider.professionalInfo.specialties.length > 0 && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              Specialties
            </h2>
            <div className="space-y-4">
              {provider.professionalInfo.specialties.map((specialty, index) => (
                <div key={index} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-gray-900 capitalize">
                      {specialty.category?.replace(/_/g, " ") || "Specialty"}
                    </span>
                    {specialty.hourlyRate && (
                      <span className="text-emerald-600 font-bold">
                        ₱{specialty.hourlyRate.toLocaleString()}/hr
                      </span>
                    )}
                  </div>
                  {specialty.experience && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Clock className="w-4 h-4" />
                      <span>{specialty.experience} years of experience</span>
                    </div>
                  )}
                  {specialty.skills && specialty.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {specialty.skills.slice(0, 6).map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium border border-emerald-200"
                        >
                          {skill}
                        </span>
                      ))}
                      {specialty.skills.length > 6 && (
                        <span className="px-2.5 py-1 text-gray-500 text-xs">
                          +{specialty.skills.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {(() => {
          const allCertifications = provider.professionalInfo?.specialties?.flatMap(
            (specialty) => specialty.certifications || []
          ) || [];
          return allCertifications.length > 0 ? (
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                Certifications
              </h2>
              <div className="space-y-4">
                {allCertifications.map((cert, index) => (
                  <div key={index} className="border-l-4 border-emerald-500 pl-4 py-2">
                    <p className="font-semibold text-gray-900">{cert.name}</p>
                    {cert.issuer && (
                      <p className="text-sm text-gray-600 mt-1">Issued by: {cert.issuer}</p>
                    )}
                    {cert.dateIssued && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>Issued: {new Date(cert.dateIssued).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        })()}

        {/* Insurance */}
        {provider.verification?.insurance && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Insurance
            </h2>
            <div className="space-y-4">
              {provider.verification.insurance.insuranceProvider && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Provider</span>
                  <span className="font-semibold text-gray-900">
                    {provider.verification.insurance.insuranceProvider}
                  </span>
                </div>
              )}
              {provider.verification.insurance.coverageAmount && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Coverage</span>
                  <span className="font-semibold text-emerald-600">
                    ₱{provider.verification.insurance.coverageAmount.toLocaleString()}
                  </span>
                </div>
              )}
              {provider.verification.insurance.expiryDate && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Expires</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(provider.verification.insurance.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Stats */}
        {provider.performance && (
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-emerald-600" />
              Performance
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {provider.performance.totalJobs !== undefined && (
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">
                    {provider.performance.totalJobs}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Total Jobs</div>
                </div>
              )}
              {provider.performance.completionRate !== undefined && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {provider.performance.completionRate}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Completion Rate</div>
                </div>
              )}
              {provider.performance.responseTime !== undefined && (
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {provider.performance.responseTime}h
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Avg Response</div>
                </div>
              )}
              {reviewCount > 0 && (
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {reviewCount}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Reviews</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
