"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adCampaignSchema, type AdCampaignFormData } from "@/lib/validations/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AdCampaignFormProps {
  initialData?: Partial<AdCampaignFormData>;
  onSubmit: (data: AdCampaignFormData) => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
}

const adTypes = [
  { value: "banner", label: "Banner Ad" },
  { value: "sponsored_listing", label: "Sponsored Listing" },
  { value: "video", label: "Video Ad" },
  { value: "text", label: "Text Ad" },
  { value: "interactive", label: "Interactive Ad" },
];

const categories = [
  { value: "hardware_stores", label: "Hardware Stores" },
  { value: "suppliers", label: "Suppliers" },
  { value: "training_schools", label: "Training Schools" },
  { value: "services", label: "Services" },
  { value: "products", label: "Products" },
];

export function AdCampaignForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: AdCampaignFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdCampaignFormData>({
    resolver: zodResolver(adCampaignSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      type: initialData?.type || "banner",
      category: initialData?.category || "services",
      budget: initialData?.budget || {
        total: 0,
        currency: "PHP",
      },
      schedule: initialData?.schedule || {
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    },
  });

  const onSubmitForm = async (data: AdCampaignFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Campaign Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Campaign Title *</label>
            <Input
              {...register("title")}
              placeholder="Enter campaign title"
            />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <Textarea
              {...register("description")}
              placeholder="Describe your ad campaign"
              rows={4}
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ad Type *</label>
              <Select
                {...register("type")}
                options={adTypes}
              />
              {errors.type && <p className="text-red-600 text-sm mt-1">{errors.type.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <Select
                {...register("category")}
                options={categories}
              />
              {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Budget</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Total Budget *</label>
            <Input
              type="number"
              {...register("budget.total", { valueAsNumber: true })}
              placeholder="0.00"
              min={1}
              step="0.01"
            />
            {errors.budget?.total && <p className="text-red-600 text-sm mt-1">{errors.budget.total.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Daily Budget (optional)</label>
            <Input
              type="number"
              {...register("budget.daily", { valueAsNumber: true })}
              placeholder="0.00"
              min={0}
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Currency</label>
            <Input
              {...register("budget.currency")}
              placeholder="PHP"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date *</label>
            <Input
              type="datetime-local"
              {...register("schedule.startDate", { valueAsDate: true })}
            />
            {errors.schedule?.startDate && <p className="text-red-600 text-sm mt-1">{errors.schedule.startDate.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Date *</label>
            <Input
              type="datetime-local"
              {...register("schedule.endDate", { valueAsDate: true })}
            />
            {errors.schedule?.endDate && <p className="text-red-600 text-sm mt-1">{errors.schedule.endDate.message}</p>}
            {errors.schedule && typeof errors.schedule === "object" && "root" in errors.schedule && (
              <p className="text-red-600 text-sm mt-1">{errors.schedule.root?.message}</p>
            )}
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
          {loading ? "Saving..." : initialData ? "Update Campaign" : "Create Campaign"}
        </Button>
      </div>
    </form>
  );
}

