"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingSchema, type BookingFormData } from "@/lib/validations/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, Clock } from "lucide-react";

interface BookingFormProps {
  initialData?: Partial<BookingFormData>;
  onSubmit: (data: BookingFormData) => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
  serviceId?: string;
  serviceTitle?: string;
}

export function BookingForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  serviceId,
  serviceTitle,
}: BookingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      service: initialData?.service || serviceId || "",
      bookingDate: initialData?.bookingDate || new Date(),
      duration: initialData?.duration || 1,
      address: initialData?.address || {
        city: "",
        state: "",
      },
      specialInstructions: initialData?.specialInstructions || "",
    },
  });

  const onSubmitForm = async (data: BookingFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {serviceTitle && (
        <Card className="p-4 bg-primary/5">
          <p className="text-sm text-gray-600">Booking for:</p>
          <p className="font-semibold">{serviceTitle}</p>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Booking Details
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Booking Date & Time *</label>
            <Input
              type="datetime-local"
              {...register("bookingDate", { valueAsDate: true })}
            />
            {errors.bookingDate && <p className="text-red-600 text-sm mt-1">{errors.bookingDate.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Duration (hours) *
            </label>
            <Input
              type="number"
              {...register("duration", { valueAsNumber: true })}
              placeholder="1"
              min={0.5}
              step="0.5"
            />
            {errors.duration && <p className="text-red-600 text-sm mt-1">{errors.duration.message}</p>}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Service Location
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Street Address</label>
            <Input
              {...register("address.street")}
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">City *</label>
              <Input
                {...register("address.city")}
                placeholder="City"
              />
              {errors.address?.city && <p className="text-red-600 text-sm mt-1">{errors.address.city.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">State *</label>
              <Input
                {...register("address.state")}
                placeholder="State"
              />
              {errors.address?.state && <p className="text-red-600 text-sm mt-1">{errors.address.state.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">ZIP Code</label>
              <Input
                {...register("address.zipCode")}
                placeholder="12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Country</label>
              <Input
                {...register("address.country")}
                placeholder="Country"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Special Instructions</h3>
        <div>
          <Textarea
            {...register("specialInstructions")}
            placeholder="Any special instructions or requirements..."
            rows={4}
          />
          {errors.specialInstructions && (
            <p className="text-red-600 text-sm mt-1">{errors.specialInstructions.message}</p>
          )}
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Confirm Booking"}
        </Button>
      </div>
    </form>
  );
}

