"use client";

import React from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { Card } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar/Logo */}
        <div className="md:w-1/3">
          {provider.businessInfo?.businessName ? (
            <div className="relative h-64 w-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              <Briefcase className="w-24 h-24 text-gray-400" />
            </div>
          ) : (
            <div className="relative h-64 w-full rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center text-white text-4xl font-bold">
                {provider.profile?.firstName?.[0] || "P"}
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="md:w-2/3 space-y-4">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold">
                  {provider.businessInfo?.businessName ||
                    `${provider.profile?.firstName || ""} ${provider.profile?.lastName || ""}`.trim() ||
                    "Provider"}
                </h1>
                {provider.businessInfo?.businessType && (
                  <p className="text-lg text-gray-600 mt-1">{provider.businessInfo.businessType}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onFavorite}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Heart className="w-5 h-5 text-pink-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            {provider.businessInfo?.businessDescription && (
              <p className="text-gray-600">{provider.businessInfo.businessDescription}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {provider.status && (
              <span className={`px-3 py-1 rounded-full text-sm ${
                provider.status === "active" ? "bg-green-100 text-green-800" :
                provider.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {provider.status}
              </span>
            )}
            {provider.verification?.isVerified && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            )}
            {provider.verification?.backgroundCheck?.status === "passed" && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-1">
                <Award className="w-3 h-3" />
                Background Checked
              </span>
            )}
          </div>

          {provider.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(provider.rating?.average || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold">{provider.rating.average?.toFixed(1) || 0}</span>
              <span className="text-gray-600">
                ({provider.rating.count || 0} reviews)
              </span>
            </div>
          )}

          {provider.businessInfo?.businessAddress && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-5 h-5" />
              <span>
                {provider.businessInfo.businessAddress.city}, {provider.businessInfo.businessAddress.state}
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {onContact && !isOwnProfile && (
              <Button onClick={onContact} size="lg" className="flex-1">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Provider
              </Button>
            )}
            {!isOwnProfile && (
              <Button
                variant="outline"
                onClick={() => router.push(`/providers/${provider.userId}/services`)}
                size="lg"
              >
                View Services
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(provider.businessInfo?.businessEmail || provider.businessInfo?.businessPhone || provider.businessInfo?.website) && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="space-y-3">
              {provider.businessInfo?.businessEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${provider.businessInfo.businessEmail}`} className="text-blue-600 hover:underline">
                    {provider.businessInfo.businessEmail}
                  </a>
                </div>
              )}
              {provider.businessInfo?.businessPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${provider.businessInfo.businessPhone}`} className="text-blue-600 hover:underline">
                    {provider.businessInfo.businessPhone}
                  </a>
                </div>
              )}
              {provider.businessInfo?.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <a
                    href={provider.businessInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {provider.businessInfo.website}
                  </a>
                </div>
              )}
            </div>
          </Card>
        )}

        {provider.professionalInfo?.specialties && provider.professionalInfo.specialties.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Specialties</h2>
            <div className="space-y-3">
              {provider.professionalInfo.specialties.map((specialty, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold capitalize">{specialty.category?.replace("_", " ")}</span>
                    {specialty.hourlyRate && (
                      <span className="text-gray-600">${specialty.hourlyRate}/hr</span>
                    )}
                  </div>
                  {specialty.experience && (
                    <p className="text-sm text-gray-600">{specialty.experience} years experience</p>
                  )}
                  {specialty.skills && specialty.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {specialty.skills.slice(0, 5).map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {(() => {
          const allCertifications = provider.professionalInfo?.specialties?.flatMap(
            (specialty) => specialty.certifications || []
          ) || [];
          return allCertifications.length > 0 ? (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Certifications
              </h2>
              <div className="space-y-2">
                {allCertifications.map((cert, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-3">
                    <p className="font-semibold">{cert.name}</p>
                    {cert.issuer && <p className="text-sm text-gray-600">Issued by: {cert.issuer}</p>}
                    {cert.dateIssued && (
                      <p className="text-sm text-gray-600">
                        Issued: {new Date(cert.dateIssued).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ) : null;
        })()}

        {provider.verification?.insurance && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Insurance</h2>
            <div className="space-y-2">
              {provider.verification.insurance.insuranceProvider && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider</span>
                  <span className="font-semibold">{provider.verification.insurance.insuranceProvider}</span>
                </div>
              )}
              {provider.verification.insurance.coverageAmount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Coverage</span>
                  <span className="font-semibold">
                    ${provider.verification.insurance.coverageAmount.toLocaleString()}
                  </span>
                </div>
              )}
              {provider.verification.insurance.expiryDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Expires</span>
                  <span className="font-semibold">
                    {new Date(provider.verification.insurance.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

