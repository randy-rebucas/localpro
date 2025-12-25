"use client";

import React from "react";
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Booking } from "@/types/bookings";
import { useSession } from "@/hooks/useAuth";

interface BookingDetailProps {
  booking: Booking;
  onStatusChange?: (status: string) => void;
  onMessage?: () => void;
}

export function BookingDetail({ booking, onStatusChange, onMessage }: BookingDetailProps) {
  const { data: session } = useSession();

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5" />;
      case "cancelled":
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const canChangeStatus = onStatusChange && booking.status === "pending";
  const isProvider = session?.user?.id === booking.provider;
  const isClient = session?.user?.id === booking.client;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Booking #{booking._id?.slice(-8)}</h1>
          {booking.status && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(booking.status)}`}>
              {getStatusIcon(booking.status)}
              <span className="font-semibold capitalize">{booking.status.replace("_", " ")}</span>
            </div>
          )}
        </div>
        {onMessage && (
          <Button variant="outline" onClick={onMessage}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Message
          </Button>
        )}
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Booking Details
          </h2>
          <div className="space-y-3">
            {booking.bookingDate && (
              <div>
                <p className="text-sm text-gray-600">Date & Time</p>
                <p className="font-semibold">
                  {new Date(booking.bookingDate).toLocaleDateString()} at{" "}
                  {new Date(booking.bookingDate).toLocaleTimeString()}
                </p>
              </div>
            )}
            {booking.duration && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold">{booking.duration} hours</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {booking.pricing && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Base Price</p>
                <p className="font-semibold text-lg">
                  ₱{booking.pricing.basePrice?.toLocaleString()}
                </p>
              </div>
              {booking.pricing.additionalFees && booking.pricing.additionalFees.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Additional Fees</p>
                  {booking.pricing.additionalFees.map((fee, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{fee.description}</span>
                      <span>₱{fee.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              {booking.pricing.totalAmount && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <p className="font-semibold">Total</p>
                    <p className="font-bold text-lg">
                      ₱{booking.pricing.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Location */}
      {booking.address && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Service Location
          </h2>
          <div className="space-y-1">
            {booking.address.street && <p>{booking.address.street}</p>}
            <p>
              {booking.address.city}, {booking.address.state} {booking.address.zipCode}
            </p>
            {booking.address.country && <p>{booking.address.country}</p>}
          </div>
        </Card>
      )}

      {/* Special Instructions */}
      {booking.specialInstructions && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Special Instructions
          </h2>
          <p className="text-gray-700">{booking.specialInstructions}</p>
        </Card>
      )}

      {/* Payment Status */}
      {booking.payment && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className={`font-semibold ${
                booking.payment.status === "paid" ? "text-green-600" :
                booking.payment.status === "pending" ? "text-yellow-600" :
                "text-red-600"
              }`}>
                {booking.payment.status?.toUpperCase()}
              </span>
            </div>
            {booking.payment.method && (
              <div className="flex justify-between">
                <span className="text-gray-600">Method</span>
                <span className="font-semibold">
                  {booking.payment.method.replace("_", " ").toUpperCase()}
                </span>
              </div>
            )}
            {booking.payment.paidAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Paid At</span>
                <span className="font-semibold">
                  {new Date(booking.payment.paidAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Actions */}
      {canChangeStatus && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex gap-3">
            {isProvider && (
              <>
                <Button
                  onClick={() => onStatusChange?.("confirmed")}
                  className="flex-1"
                >
                  Accept Booking
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onStatusChange?.("cancelled")}
                  className="flex-1"
                >
                  Decline
                </Button>
              </>
            )}
            {isClient && booking.status === "pending" && (
              <Button
                variant="outline"
                onClick={() => onStatusChange?.("cancelled")}
                className="flex-1"
              >
                Cancel Booking
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Review */}
      {booking.review && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Review</h2>
          <div className="space-y-2">
            {booking.review.rating && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">{booking.review.rating}/5</span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < booking.review!.rating! ? "text-yellow-400" : "text-gray-300"}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
            )}
            {booking.review.comment && (
              <p className="text-gray-700">{booking.review.comment}</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

