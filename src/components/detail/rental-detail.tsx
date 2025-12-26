"use client";

import React from "react";
import Image from "next/image";
import {
  MapPin,
  Star,
  Calendar,
  Heart,
  Share2,
  Edit,
  CheckCircle2,
  XCircle,
  DollarSign,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RentalItem } from "@/types/rentals";
import { useSession } from "@/hooks/useAuth";

interface RentalDetailProps {
  rental: RentalItem;
  onBook?: () => void;
  onEdit?: () => void;
  onFavorite?: () => void;
}

export function RentalDetail({ rental, onBook, onEdit, onFavorite }: RentalDetailProps) {
  const { data: session } = useSession();
  const isOwner = session?.user?.id === rental.owner;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Images */}
        <div className="md:w-1/2">
          {rental.images && rental.images.length > 0 ? (
            <div className="relative h-96 w-full rounded-lg overflow-hidden">
              <Image
                src={rental.images[0].url || "/placeholder.png"}
                alt={rental.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-96 w-full bg-gray-200 rounded-lg flex items-center justify-center">
              <Calendar className="w-24 h-24 text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="md:w-1/2 space-y-4">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold">{rental.name}</h1>
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
            <p className="text-gray-600">{rental.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {rental.category && (
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {rental.category}
              </span>
            )}
            {rental.subcategory && (
              <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
                {rental.subcategory}
              </span>
            )}
            {rental.isActive && (
              <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </span>
            )}
          </div>

          {rental.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(rental.rating?.average || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold">{rental.rating.average?.toFixed(1) || 0}</span>
              {rental.rating.count && (
                <span className="text-gray-600">
                  ({rental.rating.count} reviews)
                </span>
              )}
            </div>
          )}

          {rental.pricing && (
            <div className="space-y-2">
              <p className="font-semibold">Pricing:</p>
              <div className="flex flex-wrap gap-4">
                {rental.pricing.hourly && (
                  <div>
                    <span className="text-2xl font-bold">₱{rental.pricing.hourly}</span>
                    <span className="text-gray-600">/hour</span>
                  </div>
                )}
                {rental.pricing.daily && (
                  <div>
                    <span className="text-2xl font-bold">₱{rental.pricing.daily}</span>
                    <span className="text-gray-600">/day</span>
                  </div>
                )}
                {rental.pricing.weekly && (
                  <div>
                    <span className="text-2xl font-bold">₱{rental.pricing.weekly}</span>
                    <span className="text-gray-600">/week</span>
                  </div>
                )}
                {rental.pricing.monthly && (
                  <div>
                    <span className="text-2xl font-bold">₱{rental.pricing.monthly}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {rental.availability && (
            <div className={`p-4 rounded-lg ${
              rental.availability.isAvailable
                ? "bg-accent/5 border border-accent/20"
                : "bg-red-50 border border-red-200"
            }`}>
              <div className="flex items-center gap-2">
                {rental.availability.isAvailable ? (
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <p className="font-semibold">
                  {rental.availability.isAvailable ? "Available for Rent" : "Currently Unavailable"}
                </p>
              </div>
            </div>
          )}

          {rental.location && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-5 h-5" />
              <span>
                {rental.location.address?.city}, {rental.location.address?.state}
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {onBook && !isOwner && rental.availability?.isAvailable && (
              <Button onClick={onBook} size="lg" className="flex-1">
                <Calendar className="w-4 h-4 mr-2" />
                Book Now
              </Button>
            )}
            {onEdit && isOwner && (
              <Button onClick={onEdit} variant="outline" size="lg" className="flex-1">
                <Edit className="w-4 h-4 mr-2" />
                Edit Rental
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rental.specifications && Object.keys(rental.specifications).length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Specifications</h2>
            <div className="space-y-2">
              {Object.entries(rental.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
                  <span className="font-semibold">{String(value)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {rental.requirements && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Requirements</h2>
            <div className="space-y-2">
              {rental.requirements.minAge && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Minimum Age</span>
                  <span className="font-semibold">{rental.requirements.minAge} years</span>
                </div>
              )}
              {rental.requirements.licenseRequired !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">License Required</span>
                  <span className="font-semibold">{rental.requirements.licenseRequired ? "Yes" : "No"}</span>
                </div>
              )}
              {rental.requirements.licenseType && (
                <div className="flex justify-between">
                  <span className="text-gray-600">License Type</span>
                  <span className="font-semibold">{rental.requirements.licenseType}</span>
                </div>
              )}
              {rental.requirements.deposit && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Deposit</span>
                  <span className="font-semibold">₱{rental.requirements.deposit}</span>
                </div>
              )}
              {rental.requirements.insuranceRequired !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Insurance Required</span>
                  <span className="font-semibold">{rental.requirements.insuranceRequired ? "Yes" : "No"}</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {rental.pricing && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing Details
            </h2>
            <div className="space-y-2">
              {rental.pricing.hourly && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Hourly Rate</span>
                  <span className="font-semibold">₱{rental.pricing.hourly}</span>
                </div>
              )}
              {rental.pricing.daily && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Rate</span>
                  <span className="font-semibold">₱{rental.pricing.daily}</span>
                </div>
              )}
              {rental.pricing.weekly && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Weekly Rate</span>
                  <span className="font-semibold">₱{rental.pricing.weekly}</span>
                </div>
              )}
              {rental.pricing.monthly && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Rate</span>
                  <span className="font-semibold">₱{rental.pricing.monthly}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-600">Currency</span>
                <span className="font-semibold">{rental.pricing.currency || "PHP"}</span>
              </div>
            </div>
          </Card>
        )}

        {rental.maintenance && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Maintenance</h2>
            <div className="space-y-2">
              {rental.maintenance.lastService && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Service</span>
                  <span className="font-semibold">
                    {new Date(rental.maintenance.lastService).toLocaleDateString()}
                  </span>
                </div>
              )}
              {rental.maintenance.nextService && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Service</span>
                  <span className="font-semibold">
                    {new Date(rental.maintenance.nextService).toLocaleDateString()}
                  </span>
                </div>
              )}
              {rental.specifications?.condition && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Condition</span>
                  <span className="font-semibold capitalize">{rental.specifications.condition}</span>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

