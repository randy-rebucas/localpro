"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceSchema, type ServiceFormData } from "@/lib/validations/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

interface ServiceFormProps {
  initialData?: Partial<ServiceFormData>;
  onSubmit: (data: ServiceFormData) => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
}

const categories = [
  { value: "cleaning", label: "Cleaning Services" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "moving", label: "Moving" },
  { value: "landscaping", label: "Landscaping" },
  { value: "painting", label: "Painting" },
  { value: "carpentry", label: "Carpentry" },
  { value: "flooring", label: "Flooring" },
  { value: "roofing", label: "Roofing" },
  { value: "hvac", label: "HVAC" },
  { value: "appliance_repair", label: "Appliance Repair" },
  { value: "locksmith", label: "Locksmith" },
  { value: "handyman", label: "Handyman" },
  { value: "home_security", label: "Home Security" },
  { value: "pool_maintenance", label: "Pool Maintenance" },
  { value: "pest_control", label: "Pest Control" },
  { value: "carpet_cleaning", label: "Carpet Cleaning" },
  { value: "window_cleaning", label: "Window Cleaning" },
  { value: "gutter_cleaning", label: "Gutter Cleaning" },
  { value: "power_washing", label: "Power Washing" },
  { value: "snow_removal", label: "Snow Removal" },
  { value: "other", label: "Other" },
];

const pricingTypes = [
  { value: "hourly", label: "Hourly" },
  { value: "fixed", label: "Fixed Price" },
  { value: "per_sqft", label: "Per Square Foot" },
  { value: "per_item", label: "Per Item" },
];

const serviceTypes = [
  { value: "one_time", label: "One Time" },
  { value: "recurring", label: "Recurring" },
  { value: "emergency", label: "Emergency" },
  { value: "maintenance", label: "Maintenance" },
  { value: "installation", label: "Installation" },
];

export function ServiceForm({ initialData, onSubmit, onCancel, loading = false }: ServiceFormProps) {
  const [features, setFeatures] = useState<string[]>(initialData?.features || []);
  const [requirements, setRequirements] = useState<string[]>(initialData?.requirements || []);
  const [serviceAreas, setServiceAreas] = useState<string[]>(initialData?.serviceArea || []);
  const [newFeature, setNewFeature] = useState("");
  const [newRequirement, setNewRequirement] = useState("");
  const [newServiceArea, setNewServiceArea] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      category: initialData?.category || "cleaning",
      subcategory: initialData?.subcategory || "",
      pricing: initialData?.pricing || {
        type: "hourly",
        basePrice: 0,
        currency: "PHP",
      },
      serviceArea: initialData?.serviceArea || [],
      features: initialData?.features || [],
      requirements: initialData?.requirements || [],
      serviceType: initialData?.serviceType || "one_time",
      estimatedDuration: initialData?.estimatedDuration || { min: 1, max: 8 },
      teamSize: initialData?.teamSize || 1,
      equipmentProvided: initialData?.equipmentProvided || false,
      materialsIncluded: initialData?.materialsIncluded || false,
    },
  });

  const addFeature = () => {
    if (newFeature.trim()) {
      const updated = [...features, newFeature.trim()];
      setFeatures(updated);
      setValue("features", updated);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    const updated = features.filter((_, i) => i !== index);
    setFeatures(updated);
    setValue("features", updated);
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      const updated = [...requirements, newRequirement.trim()];
      setRequirements(updated);
      setValue("requirements", updated);
      setNewRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    const updated = requirements.filter((_, i) => i !== index);
    setRequirements(updated);
    setValue("requirements", updated);
  };

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

  const onSubmitForm = async (data: ServiceFormData) => {
    await onSubmit({
      ...data,
      features,
      requirements,
      serviceArea: serviceAreas,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <Input
              {...register("title")}
              placeholder="Enter service title"
            />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <Textarea
              {...register("description")}
              placeholder="Describe your service"
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

          <div>
            <label className="block text-sm font-medium mb-2">Service Type</label>
            <Select
              {...register("serviceType")}
              options={serviceTypes}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Pricing Type *</label>
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
        <h3 className="text-lg font-semibold mb-4">Service Area *</h3>
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
          {errors.serviceArea && <p className="text-red-600 text-sm mt-1">{errors.serviceArea.message}</p>}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Features</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Enter a feature"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addFeature();
                }
              }}
            />
            <Button type="button" onClick={addFeature}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {features.map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {feature}
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="hover:text-green-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Requirements</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              placeholder="Enter a requirement"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRequirement();
                }
              }}
            />
            <Button type="button" onClick={addRequirement}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {requirements.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {requirements.map((requirement, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                >
                  {requirement}
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="hover:text-orange-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Min Duration (hours)</label>
            <Input
              type="number"
              {...register("estimatedDuration.min", { valueAsNumber: true })}
              min={0}
              step="0.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Max Duration (hours)</label>
            <Input
              type="number"
              {...register("estimatedDuration.max", { valueAsNumber: true })}
              min={0}
              step="0.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Team Size</label>
            <Input
              type="number"
              {...register("teamSize", { valueAsNumber: true })}
              min={1}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("equipmentProvided")}
                className="rounded"
              />
              <span className="text-sm">Equipment Provided</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("materialsIncluded")}
                className="rounded"
              />
              <span className="text-sm">Materials Included</span>
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
          {loading ? "Saving..." : initialData ? "Update Service" : "Create Service"}
        </Button>
      </div>
    </form>
  );
}

