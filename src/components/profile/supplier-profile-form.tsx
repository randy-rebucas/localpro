"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Package, Save, Loader2, Plus, X, MapPin, DollarSign, Box, Tag } from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const supplierProfileSchema = z.object({
  // Business Information
  businessName: z.string().min(1, "Business name is required"),
  businessType: z.string().optional(),
  businessAddress: z.object({
    street: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    coordinates: z.object({
      lat: z.number().optional(),
      lng: z.number().optional(),
    }).optional(),
  }).optional(),
  businessPhone: z.string().optional(),
  businessEmail: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  businessDescription: z.string().optional(),
  
  // Product Categories
  productCategories: z.array(z.string()).optional(),
  
  // Inventory Management Settings
  inventoryManagement: z.object({
    trackInventory: z.boolean().optional(),
    lowStockAlert: z.boolean().optional(),
    autoReorder: z.boolean().optional(),
    defaultMinStock: z.number().min(0).optional(),
    defaultMaxStock: z.number().min(0).optional(),
  }).optional(),
  
  // Shipping Information
  shippingInfo: z.object({
    shippingMethods: z.array(z.string()).optional(),
    shippingRates: z.string().optional(),
    returnPolicy: z.string().optional(),
    deliveryAreas: z.array(z.object({
      city: z.string().optional(),
      state: z.string().optional(),
      zipCodes: z.array(z.string()).optional(),
      radius: z.number().optional(),
    })).optional(),
  }).optional(),
  
  // Payment & Billing
  paymentInfo: z.object({
    acceptedMethods: z.array(z.string()).optional(),
    paymentTerms: z.string().optional(),
    taxId: z.string().optional(),
  }).optional(),
});

type SupplierProfileForm = z.infer<typeof supplierProfileSchema>;

interface SupplierProfileFormProps {
  initialData?: Partial<SupplierProfileForm>;
  onSave?: () => void;
}

export function SupplierProfileForm({ initialData, onSave }: SupplierProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supplyId, setSupplyId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<SupplierProfileForm>({
    resolver: zodResolver(supplierProfileSchema),
    defaultValues: initialData || {
      businessName: "",
      businessType: "",
      businessAddress: {},
      businessPhone: "",
      businessEmail: "",
      website: "",
      businessDescription: "",
      productCategories: [],
      inventoryManagement: {
        trackInventory: true,
        lowStockAlert: true,
        autoReorder: false,
        defaultMinStock: 10,
        defaultMaxStock: 1000,
      },
      shippingInfo: {
        shippingMethods: [],
        shippingRates: "",
        returnPolicy: "",
        deliveryAreas: [],
      },
      paymentInfo: {
        acceptedMethods: [],
        paymentTerms: "",
        taxId: "",
      },
    },
  });

  const { fields: categoryFields, append: addCategory, remove: removeCategory } = useFieldArray({
    control,
    name: 'productCategories' as never,
  });

  const { fields: shippingMethodFields, append: addShippingMethod, remove: removeShippingMethod } = useFieldArray({
    control,
    name: 'shippingInfo.shippingMethods' as never,
  });

  const { fields: paymentMethodFields, append: addPaymentMethod, remove: removePaymentMethod } = useFieldArray({
    control,
    name: 'paymentInfo.acceptedMethods' as never,
  });

  // Fetch supplier profile if exists
  useEffect(() => {
    const fetchSupplierProfile = async () => {
      try {
        setLoading(true);
        // TODO: Implement API endpoint to fetch supplier profile
        // const response = await fetch(`${API_BASE_URL}/api/suppliers/profile/me`, createAuthFetchOptions());
        // if (response.ok) {
        //   const data = await response.json();
        //   // Set form values
        // }
      } catch (error) {
        logger.error('Failed to fetch supplier profile', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };
    fetchSupplierProfile();
  }, []);

  // Transform form data to API format (for product/supply item)
  const transformFormDataToAPI = (data: SupplierProfileForm): Record<string, unknown> => {
    const payload: Record<string, unknown> = {};
    
    // Map business info to product fields
    if (data.businessName) payload.name = data.businessName;
    if (data.businessDescription) payload.description = data.businessDescription;
    
    if (data.productCategories && data.productCategories.length > 0) {
      payload.category = data.productCategories[0]; // Use first category
      if (data.productCategories.length > 1) {
        payload.tags = data.productCategories;
      }
    }
    
    if (data.businessAddress) {
      payload.location = {
        street: data.businessAddress.street || undefined,
        city: data.businessAddress.city || undefined,
        state: data.businessAddress.state || undefined,
        zipCode: data.businessAddress.zipCode || undefined,
        country: data.businessAddress.country || undefined,
        coordinates: data.businessAddress.coordinates || undefined,
      };
      // Remove undefined fields
      const location = payload.location as Record<string, unknown>;
      if (location && typeof location === 'object') {
        Object.keys(location).forEach(key => {
          if (location[key] === undefined) {
            delete location[key];
          }
        });
        if (Object.keys(location).length === 0) {
          delete payload.location;
        }
      }
    }
    
    if (data.inventoryManagement) {
      payload.inventory = {
        minStock: data.inventoryManagement.defaultMinStock || undefined,
        maxStock: data.inventoryManagement.defaultMaxStock || undefined,
      };
      // Remove undefined fields
      const inventory = payload.inventory as Record<string, unknown>;
      if (inventory && typeof inventory === 'object') {
        Object.keys(inventory).forEach(key => {
          if (inventory[key] === undefined) {
            delete inventory[key];
          }
        });
        if (Object.keys(inventory).length === 0) {
          delete payload.inventory;
        }
      }
    }
    
    // Remove undefined top-level fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });
    
    return payload;
  };

  const onSubmit = async (data: SupplierProfileForm) => {
    try {
      setSaving(true);
      
      // Transform form data to API format
      const apiPayload = transformFormDataToAPI(data);
      
      // If no data to update, skip
      if (Object.keys(apiPayload).length === 0) {
        toast.error('No changes to save');
        return;
      }
      
      let response;
      
      if (supplyId) {
        // Update existing supply/product using PATCH
        response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.suppliesById.replace('[id]', supplyId)}`,
          {
            ...createAuthFetchOptions({
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(apiPayload),
            }),
          }
        );
      } else {
        // Create new supply/product using POST
        response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.supplies}`,
          {
            ...createAuthFetchOptions({
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(apiPayload),
            }),
          }
        );
        
        // Store the new supply ID
        if (response.ok) {
          const responseData = await response.json().catch(() => ({}));
          const newSupply = responseData?.data?.supply || responseData?.supply || responseData?.data;
          if (newSupply?._id || newSupply?.id) {
            setSupplyId(newSupply._id || newSupply.id);
          }
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save supplier profile');
      }

      toast.success('Supplier profile saved successfully!');
      onSave?.();
    } catch (error) {
      logger.error('Failed to save supplier profile', error instanceof Error ? error : new Error(String(error)));
      toast.error(error instanceof Error ? error.message : 'Failed to save supplier profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-6 h-6 text-amber-600" />
        <h3 className="text-xl font-bold text-gray-900">Supplier Profile Information</h3>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Business Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Box className="w-5 h-5" />
            Business Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('businessName')}
                placeholder="Enter business name"
              />
              {errors.businessName && (
                <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
              <Input
                {...register('businessType')}
                placeholder="e.g., Wholesale, Retail, Manufacturer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('businessAddress.city')}
                placeholder="Enter city"
              />
              {errors.businessAddress?.city && (
                <p className="mt-1 text-sm text-red-600">{errors.businessAddress.city.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('businessAddress.state')}
                placeholder="Enter state"
              />
              {errors.businessAddress?.state && (
                <p className="mt-1 text-sm text-red-600">{errors.businessAddress.state.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
              <Input
                {...register('businessAddress.street')}
                placeholder="Enter street address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
              <Input
                {...register('businessAddress.zipCode')}
                placeholder="Enter ZIP code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Phone</label>
              <Input
                {...register('businessPhone')}
                placeholder="+1234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
              <Input
                {...register('businessEmail')}
                type="email"
                placeholder="business@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <Input
                {...register('website')}
                type="url"
                placeholder="https://example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
            <Textarea
              {...register('businessDescription')}
              rows={4}
              placeholder="Describe your business and products..."
            />
          </div>
        </div>

        {/* Product Categories */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Product Categories
          </h4>
          <div className="space-y-2">
            {categoryFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <select
                  {...register(`productCategories.${index}`)}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Select category</option>
                  <option value="cleaning_supplies">Cleaning Supplies</option>
                  <option value="tools">Tools</option>
                  <option value="materials">Materials</option>
                  <option value="equipment">Equipment</option>
                </select>
                {categoryFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCategory(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addCategory('')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>
        </div>

        {/* Inventory Management */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Box className="w-5 h-5" />
            Inventory Management
          </h4>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('inventoryManagement.trackInventory')}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Track Inventory</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('inventoryManagement.lowStockAlert')}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Low Stock Alerts</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('inventoryManagement.autoReorder')}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Auto Reorder</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Minimum Stock</label>
                <Input
                  {...register('inventoryManagement.defaultMinStock', { valueAsNumber: true })}
                  type="number"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Maximum Stock</label>
                <Input
                  {...register('inventoryManagement.defaultMaxStock', { valueAsNumber: true })}
                  type="number"
                  placeholder="1000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Shipping Information
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Methods</label>
              <div className="space-y-2">
                {shippingMethodFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Input
                      {...register(`shippingInfo.shippingMethods.${index}`)}
                      placeholder="e.g., Standard, Express, Overnight"
                    />
                    {shippingMethodFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeShippingMethod(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addShippingMethod('')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Shipping Method
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Rates</label>
              <Textarea
                {...register('shippingInfo.shippingRates')}
                rows={3}
                placeholder="Describe your shipping rates and policies..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Return Policy</label>
              <Textarea
                {...register('shippingInfo.returnPolicy')}
                rows={3}
                placeholder="Describe your return policy..."
              />
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payment Information
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accepted Payment Methods</label>
              <div className="space-y-2">
                {paymentMethodFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Input
                      {...register(`paymentInfo.acceptedMethods.${index}`)}
                      placeholder="e.g., Credit Card, PayPal, Bank Transfer"
                    />
                    {paymentMethodFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePaymentMethod(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addPaymentMethod('')}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Payment Method
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
              <Input
                {...register('paymentInfo.paymentTerms')}
                placeholder="e.g., Net 30, Due on Receipt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
              <Input
                {...register('paymentInfo.taxId')}
                placeholder="Enter tax ID"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
