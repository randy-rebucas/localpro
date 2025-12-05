"use client";

import React from "react";
import Image from "next/image";
import {
  MapPin,
  Star,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Heart,
  Share2,
  Edit,
  Building2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FacilityCareService } from "@/types/facility-care";
import { useSession } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/currency-utils";

interface FacilityCareDetailProps {
  service: FacilityCareService;
  onBook?: () => void;
  onEdit?: () => void;
  onFavorite?: () => void;
}

export function FacilityCareDetail({
  service,
  onBook,
  onEdit,
  onFavorite,
}: FacilityCareDetailProps) {
  const { data: session } = useSession();
  const isOwner = session?.user?.id === service.provider;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Images */}
        <div className="md:w-1/2">
          {service.images && service.images.length > 0 ? (
            <div className="relative h-96 w-full rounded-lg overflow-hidden">
              <Image
                src={service.images[0] || "/placeholder.png"}
                alt={service.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-96 w-full bg-gray-200 rounded-lg flex items-center justify-center">
              <Building2 className="w-24 h-24 text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="md:w-1/2 space-y-4">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold">{service.name}</h1>
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
            <p className="text-gray-600">{service.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {service.category && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {service.category.replace("_", " ")}
              </span>
            )}
            {service.isActive && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </span>
            )}
          </div>

          {service.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(service.rating?.average || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold">{service.rating.average?.toFixed(1) || 0}</span>
              <span className="text-gray-600">
                ({service.rating.count || 0} reviews)
              </span>
            </div>
          )}

          {service.pricing && (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {formatCurrency(service.pricing.basePrice || 0, 'PHP')}
              </span>
              <span className="text-gray-600">
                /{service.pricing.type === "hourly" ? "hr" : service.pricing.type === "monthly" ? "month" : service.pricing.type}
              </span>
            </div>
          )}

          {service.serviceArea && service.serviceArea.length > 0 && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-5 h-5" />
              <span>Service Areas: {service.serviceArea.join(", ")}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {onBook && !isOwner && (
              <Button onClick={onBook} size="lg" className="flex-1">
                <Calendar className="w-4 h-4 mr-2" />
                Book Service
              </Button>
            )}
            {onEdit && isOwner && (
              <Button onClick={onEdit} variant="outline" size="lg" className="flex-1">
                <Edit className="w-4 h-4 mr-2" />
                Edit Service
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {service.features && service.features.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Features</h2>
            <ul className="space-y-2">
              {service.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {service.requirements && service.requirements.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Requirements</h2>
            <ul className="space-y-2">
              {service.requirements.map((requirement, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {service.pricing && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Type</span>
                <span className="font-semibold capitalize">{service.pricing.type?.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Base Price</span>
                <span className="font-semibold">{formatCurrency(service.pricing.basePrice || 0, 'PHP')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Currency</span>
                <span className="font-semibold">{service.pricing.currency || "PHP"}</span>
              </div>
            </div>
          </Card>
        )}

        {service.availability && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Availability
            </h2>
            {service.availability.schedule && service.availability.schedule.length > 0 ? (
              <div className="space-y-2">
                {service.availability.schedule.map((day, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600 capitalize">{day.day}</span>
                    <span className="font-semibold">
                      {day.isAvailable
                        ? `${day.startTime} - ${day.endTime}`
                        : "Unavailable"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">Available on request</p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

