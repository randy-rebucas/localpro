"use client";

import React from "react";
import Image from "next/image";
import {
  MapPin,
  Star,
  Clock,
  CheckCircle2,
  Shield,
  Package,
  Heart,
  Share2,
  Edit,
  MessageSquare,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Service } from "@/types/services";
import { useSession } from "@/hooks/useAuth";

interface ServiceDetailProps {
  service: Service;
  onBook?: () => void;
  onEdit?: () => void;
  onFavorite?: () => void;
}

export function ServiceDetail({ service, onBook, onEdit, onFavorite }: ServiceDetailProps) {
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
                src={service.images[0].url || "/placeholder.png"}
                alt={service.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-96 w-full bg-gray-200 rounded-lg flex items-center justify-center">
              <Package className="w-24 h-24 text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="md:w-1/2 space-y-4">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold">{service.title}</h1>
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
              <span className="font-semibold">{service.rating.average?.toFixed(1)}</span>
              <span className="text-gray-600">
                ({service.rating.count || 0} reviews)
              </span>
            </div>
          )}

          {service.pricing && (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                ₱{service.pricing.basePrice}
              </span>
              <span className="text-gray-600">
                /{service.pricing.type === "hourly" ? "hr" : service.pricing.type === "fixed" ? "service" : service.pricing.type}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {service.category && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {service.category}
              </span>
            )}
            {service.serviceType && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                {service.serviceType.replace("_", " ")}
              </span>
            )}
            {service.isActive && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </span>
            )}
          </div>

          {service.serviceArea && service.serviceArea.length > 0 && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-5 h-5" />
              <span>Service Areas: {service.serviceArea.join(", ")}</span>
            </div>
          )}

          {service.estimatedDuration && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span>
                {service.estimatedDuration.min} - {service.estimatedDuration.max} hours
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {onBook && !isOwner && (
              <Button onClick={onBook} size="lg" className="flex-1">
                Book Now
              </Button>
            )}
            {onEdit && isOwner && (
              <Button onClick={onEdit} variant="outline" size="lg" className="flex-1">
                <Edit className="w-4 h-4 mr-2" />
                Edit Service
              </Button>
            )}
            {!isOwner && (
              <Button variant="outline" size="lg">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message Provider
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
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {service.warranty && service.warranty.hasWarranty && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Warranty</h2>
            <p className="text-gray-600">
              {service.warranty.duration} {service.warranty.duration === 1 ? "month" : "months"} warranty
            </p>
            {service.warranty.description && (
              <p className="text-sm text-gray-500 mt-2">{service.warranty.description}</p>
            )}
          </Card>
        )}

        {service.insurance && service.insurance.covered && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Insurance</h2>
            <p className="text-gray-600">
              Covered up to ₱{service.insurance.coverageAmount?.toLocaleString()}
            </p>
          </Card>
        )}
      </div>

      {/* Additional Info */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {service.teamSize && (
            <div>
              <p className="text-sm text-gray-600">Team Size</p>
              <p className="font-semibold">{service.teamSize} {service.teamSize === 1 ? "person" : "people"}</p>
            </div>
          )}
          {service.equipmentProvided !== undefined && (
            <div>
              <p className="text-sm text-gray-600">Equipment</p>
              <p className="font-semibold">{service.equipmentProvided ? "Provided" : "Not Provided"}</p>
            </div>
          )}
          {service.materialsIncluded !== undefined && (
            <div>
              <p className="text-sm text-gray-600">Materials</p>
              <p className="font-semibold">{service.materialsIncluded ? "Included" : "Not Included"}</p>
            </div>
          )}
          {service.emergencyService && service.emergencyService.available && (
            <div>
              <p className="text-sm text-gray-600">Emergency Service</p>
              <p className="font-semibold">Available</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

