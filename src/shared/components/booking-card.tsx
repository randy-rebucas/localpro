"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Booking } from "@/types/bookings";

interface BookingCardProps {
  booking: Booking;
  viewMode?: "grid" | "list";
  onStatusChange?: (bookingId: string, status: string) => void;
}

export function BookingCard({ booking, viewMode = "list", onStatusChange }: BookingCardProps) {
  const router = useRouter();
  const isGrid = viewMode === "grid";

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${isGrid ? "flex flex-col h-full" : "flex flex-row"}`}>
      <div className={isGrid ? "" : "flex gap-4 flex-1"}>
        <div className={isGrid ? "relative h-48 w-full" : "relative h-32 w-32 flex-shrink-0 bg-gray-200"}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="w-12 h-12 text-gray-400" />
          </div>
        </div>
        <div className="p-4 flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg mb-1">Booking #{booking._id?.slice(-8)}</h3>
              <p className="text-sm text-gray-600">
                {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : "Date not set"}
              </p>
            </div>
            {booking.status && (
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                {getStatusIcon(booking.status)}
                {booking.status.replace("_", " ")}
              </span>
            )}
          </div>

          {booking.address && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <MapPin className="w-4 h-4" />
              <span>
                {booking.address.city}, {booking.address.state}
              </span>
            </div>
          )}

          {booking.pricing && (
            <div className="mb-2">
              <span className="text-lg font-bold">
                ₱{booking.pricing.totalAmount || booking.pricing.basePrice}
              </span>
            </div>
          )}

          {booking.duration && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <Clock className="w-4 h-4" />
              <span>{booking.duration} hours</span>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/marketplace/bookings/${booking._id}`)}
            >
              View Details
            </Button>
            {onStatusChange && booking.status === "pending" && (
              <Button
                size="sm"
                onClick={() => onStatusChange(booking._id || "", "confirmed")}
              >
                Confirm
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

