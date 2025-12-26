"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Star, Calendar, Heart, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RentalItem } from "@/types/rentals";

interface RentalCardProps {
  rental: RentalItem;
  viewMode?: "grid" | "list";
  onBook?: (rentalId: string) => void;
  onFavorite?: (rentalId: string) => void;
}

export function RentalCard({ rental, viewMode = "list", onBook, onFavorite }: RentalCardProps) {
  const router = useRouter();
  const isGrid = viewMode === "grid";

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow group relative ${isGrid ? "flex flex-col h-full" : "flex flex-row"}`}>
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <button
          onClick={() => onFavorite?.(rental._id || "")}
          className="bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className="w-4 h-4 text-pink-500" />
        </button>
        <button className="bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
          <Share2 className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className={isGrid ? "" : "flex gap-4 flex-1"}>
        {rental.images && rental.images.length > 0 && (
          <div className={isGrid ? "relative h-48 w-full" : "relative h-32 w-32 flex-shrink-0"}>
            <Image
              src={rental.images[0].url || "/placeholder.png"}
              alt={rental.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        {(!rental.images || rental.images.length === 0) && (
          <div className={`${isGrid ? "relative h-48 w-full" : "relative h-32 w-32 flex-shrink-0"} bg-gray-200 flex items-center justify-center`}>
            <Calendar className="w-12 h-12 text-gray-400" />
          </div>
        )}

        <div className="p-4 flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg mb-1">{rental.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{rental.description}</p>
            </div>
            {rental.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">{rental.rating.average?.toFixed(1) || 0}</span>
              </div>
            )}
          </div>

          {rental.category && (
            <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs rounded mb-2">
              {rental.category}
            </span>
          )}

          {rental.pricing && (
            <div className="mb-2">
              <div className="flex flex-wrap gap-2 text-sm">
                {rental.pricing.hourly && (
                  <span className="font-semibold">${rental.pricing.hourly}/hr</span>
                )}
                {rental.pricing.daily && (
                  <span className="font-semibold">${rental.pricing.daily}/day</span>
                )}
                {rental.pricing.weekly && (
                  <span className="font-semibold">${rental.pricing.weekly}/week</span>
                )}
                {rental.pricing.monthly && (
                  <span className="font-semibold">${rental.pricing.monthly}/month</span>
                )}
              </div>
            </div>
          )}

          {rental.availability && (
            <div className="text-sm mb-2">
              <span className={rental.availability.isAvailable ? "text-accent" : "text-red-600"}>
                {rental.availability.isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>
          )}

          {rental.location && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <MapPin className="w-4 h-4" />
              <span>
                {rental.location.address?.city}, {rental.location.address?.state}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/rentals/${rental._id}`)}
            >
              View Details
            </Button>
            {onBook && rental.availability?.isAvailable && (
              <Button
                size="sm"
                onClick={() => onBook(rental._id || "")}
              >
                Book Now
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

