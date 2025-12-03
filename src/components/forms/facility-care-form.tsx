"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { facilityCareSchema, type FacilityCareFormData } from "@/lib/validations/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

interface FacilityCareFormProps {
  initialData?: Partial<FacilityCareFormData>;
  onSubmit: (data: FacilityCareFormData) => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
}

const categories = [
  { value: "janitorial", label: "Janitorial Services" },
  { value: "landscaping", label: "Landscaping" },
  { value: "pest_control", label: "Pest Control" },
  { value: "maintenance", label: "Maintenance" },
  { value: "security", label: "Security" },
];

const pricingTypes = [
  { value: "hourly", label: "Hourly" },
  { value: "monthly", label: "Monthly" },
  { value: "per_sqft", label: "Per Square Foot" },
  { value: "per_visit", label: "Per Visit" },
  { value: "contract", label: "Contract" },
];

export function FacilityCareForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: FacilityCareFormProps) {
  const [serviceAreas, setServiceAreas] = useState<string[]>(initialData?.serviceArea || []);
  const [newServiceArea, setNewServiceArea] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FacilityCareFormData>({
    resolver: zodResolver(facilityCareSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      category: initialData?.category || "janitorial",
      pricing: initialData?.pricing || {
        type: "hourly",
        basePrice: 0,
        currency: "PHP",
      },
      serviceArea: initialData?.serviceArea || [],
    },
  });

  const addServiceArea = () => {
    if (newServiceArea.trim()) {
      const updated = [...serviceAreas, newServiceArea.trim()];
      setServiceAreas(updated);
      setValue("serviceArea", updated);
      setNewServiceArea("");
    }
  };

  const removeServiceArea = (index: number) => {
    const updated = serviceAreas.filter((_, i) => i !== index);
    setServiceAreas(updated);
    setValue("serviceArea", updated);
  };

  const onSubmitForm = async (data: FacilityCareFormData) => {
    await onSubmit({
      ...data,
      serviceArea: serviceAreas,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Service Name *</label>
            <Input
              {...register("name")}
              placeholder="Enter service name"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <Textarea
              {...register("description")}
              placeholder="Describe the facility care service"
              rows={4}
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <Select
              {...register("category")}
              options={categories}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Pricing Type</label>
            <Select
              {...register("pricing.type")}
              options={pricingTypes}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Base Price *</label>
            <Input
              type="number"
              {...register("pricing.basePrice", { valueAsNumber: true })}
              placeholder="0.00"
              min={0}
              step="0.01"
            />
            {errors.pricing?.basePrice && <p className="text-red-600 text-sm mt-1">{errors.pricing.basePrice.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Currency</label>
            <Input
              {...register("pricing.currency")}
              placeholder="PHP"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Service Area</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newServiceArea}
              onChange={(e) => setNewServiceArea(e.target.value)}
              placeholder="Enter service area (city, zip code, etc.)"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addServiceArea();
                }
              }}
            />
            <Button type="button" onClick={addServiceArea}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {serviceAreas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {serviceAreas.map((area, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {area}
                  <button
                    type="button"
                    onClick={() => removeServiceArea(index)}
                    className="hover:text-blue-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
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
          {loading ? "Saving..." : initialData ? "Update Service" : "Create Service"}
        </Button>
      </div>
    </form>
  );
}

