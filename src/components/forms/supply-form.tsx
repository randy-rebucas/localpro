"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supplySchema, type SupplyFormData } from "@/lib/validations/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SupplyFormProps {
  initialData?: Partial<SupplyFormData>;
  onSubmit: (data: SupplyFormData) => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
}

const categories = [
  { value: "cleaning_supplies", label: "Cleaning Supplies" },
  { value: "tools", label: "Tools" },
  { value: "materials", label: "Materials" },
  { value: "equipment", label: "Equipment" },
];

export function SupplyForm({ initialData, onSubmit, onCancel, loading = false }: SupplyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplyFormData>({
    resolver: zodResolver(supplySchema),
    defaultValues: {
      name: initialData?.name || "",
      title: initialData?.title || "",
      description: initialData?.description || "",
      category: initialData?.category || "cleaning_supplies",
      subcategory: initialData?.subcategory || "",
      brand: initialData?.brand || "",
      sku: initialData?.sku || "",
      pricing: initialData?.pricing || {
        retailPrice: 0,
        currency: "USD",
      },
      inventory: initialData?.inventory || {
        quantity: 0,
      },
    },
  });

  const onSubmitForm = async (data: SupplyFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Product Name *</label>
            <Input
              {...register("name")}
              placeholder="Enter product name"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <Input
              {...register("title")}
              placeholder="Enter product title"
            />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <Textarea
              {...register("description")}
              placeholder="Describe the product"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Brand *</label>
              <Input
                {...register("brand")}
                placeholder="Enter brand name"
              />
              {errors.brand && <p className="text-red-600 text-sm mt-1">{errors.brand.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">SKU *</label>
              <Input
                {...register("sku")}
                placeholder="Enter SKU"
              />
              {errors.sku && <p className="text-red-600 text-sm mt-1">{errors.sku.message}</p>}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Retail Price *</label>
            <Input
              type="number"
              {...register("pricing.retailPrice", { valueAsNumber: true })}
              placeholder="0.00"
              min={0}
              step="0.01"
            />
            {errors.pricing?.retailPrice && <p className="text-red-600 text-sm mt-1">{errors.pricing.retailPrice.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Wholesale Price</label>
            <Input
              type="number"
              {...register("pricing.wholesalePrice", { valueAsNumber: true })}
              placeholder="0.00"
              min={0}
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Currency</label>
            <Input
              {...register("pricing.currency")}
              placeholder="USD"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Inventory</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Quantity *</label>
            <Input
              type="number"
              {...register("inventory.quantity", { valueAsNumber: true })}
              placeholder="0"
              min={0}
            />
            {errors.inventory?.quantity && <p className="text-red-600 text-sm mt-1">{errors.inventory.quantity.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Min Stock</label>
            <Input
              type="number"
              {...register("inventory.minStock", { valueAsNumber: true })}
              placeholder="0"
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Max Stock</label>
            <Input
              type="number"
              {...register("inventory.maxStock", { valueAsNumber: true })}
              placeholder="0"
              min={0}
            />
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
          {loading ? "Saving..." : initialData ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}

