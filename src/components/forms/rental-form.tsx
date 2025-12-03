"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { rentalSchema, type RentalFormData } from "@/lib/validations/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface RentalFormProps {
  initialData?: Partial<RentalFormData>;
  onSubmit: (data: RentalFormData) => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
}

const categories = [
  { value: "tools", label: "Tools" },
  { value: "vehicles", label: "Vehicles" },
  { value: "equipment", label: "Equipment" },
  { value: "machinery", label: "Machinery" },
];

export function RentalForm({ initialData, onSubmit, onCancel, loading = false }: RentalFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RentalFormData>({
    resolver: zodResolver(rentalSchema),
    defaultValues: {
      name: initialData?.name || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      category: initialData?.category || "tools",
      subcategory: initialData?.subcategory || "",
      pricing: initialData?.pricing || {
        hourly: 0,
        currency: "PHP",
      },
      availability: initialData?.availability || {
        isAvailable: true,
      },
    },
  });

  const onSubmitForm = async (data: RentalFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Item Name *</label>
            <Input
              {...register("name")}
              placeholder="Enter item name"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <Input
              {...register("title")}
              placeholder="Enter item title"
            />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <Textarea
              {...register("description")}
              placeholder="Describe the rental item"
              rows={4}
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <Select
                {...register("category")}
                options={categories}
              />
              {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subcategory *</label>
              <Input
                {...register("subcategory")}
                placeholder="Enter subcategory"
              />
              {errors.subcategory && <p className="text-red-600 text-sm mt-1">{errors.subcategory.message}</p>}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pricing *</h3>
        <p className="text-sm text-gray-600 mb-4">At least one pricing option is required</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Hourly Rate</label>
            <Input
              type="number"
              {...register("pricing.hourly", { valueAsNumber: true })}
              placeholder="0.00"
              min={0}
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Daily Rate</label>
            <Input
              type="number"
              {...register("pricing.daily", { valueAsNumber: true })}
              placeholder="0.00"
              min={0}
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Weekly Rate</label>
            <Input
              type="number"
              {...register("pricing.weekly", { valueAsNumber: true })}
              placeholder="0.00"
              min={0}
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Monthly Rate</label>
            <Input
              type="number"
              {...register("pricing.monthly", { valueAsNumber: true })}
              placeholder="0.00"
              min={0}
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Currency</label>
            <Input
              {...register("pricing.currency")}
              placeholder="PHP"
            />
          </div>
        </div>
        {errors.pricing && <p className="text-red-600 text-sm mt-2">{errors.pricing.message}</p>}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Availability</h3>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("availability.isAvailable")}
                className="rounded"
              />
              <span className="text-sm">Item is currently available</span>
            </label>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : initialData ? "Update Rental" : "Create Rental"}
        </Button>
      </div>
    </form>
  );
}

