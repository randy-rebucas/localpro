"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Star,
  Building2,
  Users,
  CheckCircle2,
  Phone,
  Mail,
  Globe,
  Heart,
  Share2,
  Briefcase
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Agency } from "@/types/agencies";
import { useSession } from "@/hooks/useAuth";

interface AgencyDetailProps {
  agency: Agency;
  onJoin?: () => void;
  onContact?: () => void;
  onFavorite?: () => void;
  isMember?: boolean;
}

export function AgencyDetail({
  agency,
  onJoin,
  onContact,
  onFavorite,
  isMember = false,
}: AgencyDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isOwner = session?.user?.id === agency.owner;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Logo */}
        <div className="md:w-1/3">
          {agency.logo ? (
            <div className="relative h-64 w-full rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={agency.logo.url || "/placeholder.png"}
                alt={agency.name}
                fill
                className="object-contain p-4"
              />
            </div>
          ) : (
            <div className="h-64 w-full bg-gray-200 rounded-lg flex items-center justify-center">
              <Building2 className="w-24 h-24 text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="md:w-2/3 space-y-4">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold">{agency.name}</h1>
                {agency.businessType && (
                  <p className="text-lg text-gray-600 mt-1 capitalize">
                    {agency.businessType.replace("_", " ")}
                  </p>
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
            {agency.description && <p className="text-gray-600">{agency.description}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            {agency.status && (
              <span className={`px-3 py-1 rounded-full text-sm ${
                agency.status === "active" ? "bg-green-100 text-green-800" :
                agency.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {agency.status}
              </span>
            )}
            {agency.verification?.isVerified && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            )}
            {agency.subscription?.plan && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {agency.subscription.plan} Plan
              </span>
            )}
          </div>

          {agency.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(agency.rating?.average || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold">{agency.rating.average?.toFixed(1) || 0}</span>
              <span className="text-gray-600">
                ({agency.rating.count || 0} reviews)
              </span>
            </div>
          )}

          {agency.contact?.address && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-5 h-5" />
              <span>
                {agency.contact.address.city}, {agency.contact.address.state}
              </span>
            </div>
          )}

          {agency.providers && (
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-5 h-5" />
              <span>{agency.providers.length} {agency.providers.length === 1 ? "Provider" : "Providers"}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {onJoin && !isMember && !isOwner && agency.status === "active" && (
              <Button onClick={onJoin} size="lg" className="flex-1">
                <Briefcase className="w-4 h-4 mr-2" />
                Join Agency
              </Button>
            )}
            {onContact && (
              <Button onClick={onContact} variant="outline" size="lg">
                Contact
              </Button>
            )}
            {isMember && (
              <Button
                onClick={() => router.push(`/agencies/${agency._id}/dashboard`)}
                size="lg"
                className="flex-1"
              >
                View Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agency.contact && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <div className="space-y-3">
              {agency.contact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${agency.contact.email}`} className="text-blue-600 hover:underline">
                    {agency.contact.email}
                  </a>
                </div>
              )}
              {agency.contact.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${agency.contact.phone}`} className="text-blue-600 hover:underline">
                    {agency.contact.phone}
                  </a>
                </div>
              )}
              {agency.contact.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <a
                    href={agency.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {agency.contact.website}
                  </a>
                </div>
              )}
              {agency.contact.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    {agency.contact.address.street && <p>{agency.contact.address.street}</p>}
                    <p>
                      {agency.contact.address.city}, {agency.contact.address.state} {agency.contact.address.zipCode}
                    </p>
                    {agency.contact.address.country && <p>{agency.contact.address.country}</p>}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {agency.services && agency.services.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Services Offered</h2>
            <div className="flex flex-wrap gap-2">
              {agency.services.map((service, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {service.category?.replace("_", " ")}
                </span>
              ))}
            </div>
          </Card>
        )}

        {agency.providers && agency.providers.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Providers ({agency.providers.length})
            </h2>
            <div className="space-y-2">
              {agency.providers.slice(0, 5).map((provider, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700">
                    {provider.user || `Provider ${index + 1}`}
                  </span>
                  {provider.status && (
                    <span className={`text-xs px-2 py-1 rounded ${
                      provider.status === "active" ? "bg-green-100 text-green-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {provider.status}
                    </span>
                  )}
                </div>
              ))}
              {agency.providers.length > 5 && (
                <p className="text-sm text-gray-600 mt-2">
                  +{agency.providers.length - 5} more providers
                </p>
              )}
            </div>
          </Card>
        )}

        {agency.business && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Business Information</h2>
            <div className="space-y-2">
              {agency.business.type && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Business Type</span>
                  <span className="font-semibold capitalize">{agency.business.type.replace("_", " ")}</span>
                </div>
              )}
              {agency.business.registrationNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Registration #</span>
                  <span className="font-semibold">{agency.business.registrationNumber}</span>
                </div>
              )}
              {agency.business.taxId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ID</span>
                  <span className="font-semibold">{agency.business.taxId}</span>
                </div>
              )}
              {agency.business.licenseNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">License #</span>
                  <span className="font-semibold">{agency.business.licenseNumber}</span>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

