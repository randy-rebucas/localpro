"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Save,
  Eye,
  X,
  Plus,
  DollarSign,
  Calendar,
  Package,
  Truck,
  Shield,
  Zap,
  Star,
  MapPin,
  Settings
} from "lucide-react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/loading";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

const categories = [
  "Cleaning Supplies",
  "Tools & Equipment",
  "Building Materials",
  "Safety Equipment",
  "Office Supplies",
  "Maintenance Kits",
  "Other"
];

const types = [
  { value: "cleaning", label: "Cleaning", description: "Cleaning supplies and products", icon: <Shield className="w-4 h-4" /> },
  { value: "tools", label: "Tools", description: "Hand tools and equipment", icon: <Zap className="w-4 h-4" /> },
  { value: "materials", label: "Materials", description: "Building and construction materials", icon: <Package className="w-4 h-4" /> },
  { value: "equipment", label: "Equipment", description: "Heavy machinery and equipment", icon: <Truck className="w-4 h-4" /> },
  { value: "subscription", label: "Subscription", description: "Recurring supply services", icon: <Calendar className="w-4 h-4" /> }
];

const units = [
  { value: "piece", label: "Piece" },
  { value: "pack", label: "Pack" },
  { value: "box", label: "Box" },
  { value: "kg", label: "Kilogram" },
  { value: "liter", label: "Liter" },
  { value: "set", label: "Set" }
];

const statuses = [
  { value: "available", label: "Available" },
  { value: "out-of-stock", label: "Out of Stock" },
  { value: "discontinued", label: "Discontinued" },
  { value: "pre-order", label: "Pre-order" }
];

const features = [
  "Professional Grade",
  "Eco-Friendly",
  "Long Lasting",
  "Easy to Use",
  "Heavy Duty",
  "Versatile",
  "Durable",
  "Lightweight",
  "Compact",
  "Multi-Purpose",
  "High Quality",
  "Cost Effective",
  "Fast Delivery",
  "Bulk Available"
];

export default function EditSupplyPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    type: "",
    status: "available" as "available" | "out-of-stock" | "discontinued" | "pre-order",
    price: "",
    originalPrice: "",
    unit: "piece",
    stock: "",
    minOrder: "1",
    maxOrder: "",
    location: {
      address: "",
      city: "",
      state: "",
      zipCode: ""
    },
    specifications: {
      brand: "",
      model: "",
      weight: "",
      dimensions: "",
      material: "",
      color: "",
      warranty: ""
    },
    features: [] as string[],
    delivery: {
      available: true,
      estimatedDays: "",
      cost: "",
      freeShippingThreshold: ""
    },
    images: [] as string[],
    tags: [] as string[]
  });
  const [newImage, setNewImage] = useState("");
  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSupply = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.suppliesById}/${params.id}`, createAuthFetchOptions());
        
        if (!response.ok) {
          throw new Error('Supply not found');
        }

        const data = await response.json();
        setFormData({
          name: data.name || "",
          description: data.description || "",
          category: data.category || "",
          type: data.type || "",
          status: data.status || "available",
          price: data.price?.toString() || "",
          originalPrice: data.originalPrice?.toString() || "",
          unit: data.unit || "piece",
          stock: data.stock?.toString() || "",
          minOrder: data.minOrder?.toString() || "1",
          maxOrder: data.maxOrder?.toString() || "",
          location: data.location || { address: "", city: "", state: "", zipCode: "" },
          specifications: data.specifications || { 
            brand: "", model: "", weight: "", dimensions: "", 
            material: "", color: "", warranty: "" 
          },
          features: data.features || [],
          delivery: data.delivery || { 
            available: true, estimatedDays: "", cost: "", freeShippingThreshold: "" 
          },
          images: data.images || [],
          tags: data.tags || []
        });
      } catch (error) {
        logger.error('Error fetching supply', error instanceof Error ? error : new Error(String(error)), { supplyId: params.id });
        // Fallback to mock data
        setFormData({
          name: "Professional Cleaning Kit - Complete Set",
          description: "Complete cleaning kit with all essential tools and supplies for professional cleaning services. Includes premium quality products.",
          category: "Cleaning Supplies",
          type: "cleaning",
          status: "available",
          price: "89.99",
          originalPrice: "119.99",
          unit: "set",
          stock: "45",
          minOrder: "1",
          maxOrder: "10",
          location: { address: "123 Supply Street", city: "New York", state: "NY", zipCode: "10001" },
          specifications: { 
            brand: "CleanPro", model: "CP-2024", weight: "5.2 kg", dimensions: "40cm x 30cm x 15cm",
            material: "Premium Plastic", color: "Blue", warranty: "1 year"
          },
          features: ["Professional Grade", "Eco-Friendly", "Long Lasting", "Easy to Use"],
          delivery: { 
            available: true, estimatedDays: "2", cost: "9.99", freeShippingThreshold: "100"
          },
          images: ["https://via.placeholder.com/400x300", "https://via.placeholder.com/400x300"],
          tags: ["cleaning", "professional", "kit", "eco-friendly"]
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSupply();
    }
  }, [params.id]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const handleLocationChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  const handleSpecificationChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [field]: value
      }
    }));
  };

  const handleDeliveryChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      delivery: {
        ...prev.delivery,
        [field]: value
      }
    }));
  };

  const handleAddImage = () => {
    if (newImage.trim() && !formData.images.includes(newImage.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImage.trim()]
      }));
      setNewImage("");
    }
  };

  const handleRemoveImage = (imageToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(image => image !== imageToRemove)
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (!formData.type) {
      newErrors.type = "Type is required";
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Valid price is required";
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = "Valid stock quantity is required";
    }
    if (!formData.location.address.trim()) {
      newErrors.address = "Address is required";
    }
    if (!formData.location.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.location.state.trim()) {
      newErrors.state = "State is required";
    }
    if (formData.delivery.available && (!formData.delivery.estimatedDays || parseInt(formData.delivery.estimatedDays) <= 0)) {
      newErrors.estimatedDays = "Valid estimated days is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.suppliesById}/${params.id}`, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
          stock: parseInt(formData.stock),
          minOrder: parseInt(formData.minOrder),
          maxOrder: formData.maxOrder ? parseInt(formData.maxOrder) : undefined,
          delivery: {
            ...formData.delivery,
            estimatedDays: parseInt(formData.delivery.estimatedDays),
            cost: parseFloat(formData.delivery.cost),
            freeShippingThreshold: formData.delivery.freeShippingThreshold ? parseFloat(formData.delivery.freeShippingThreshold) : undefined
          }
        }),
      }));

      if (response.ok) {
        router.push(`/supplies/${params.id}`);
      } else {
        const errorData = await response.json();
        logger.error('Error updating supply', new Error('Supply update failed'), { errorData, status: response.status, supplyId: params.id });
      }
    } catch (error) {
      logger.error('Error updating supply', error instanceof Error ? error : new Error(String(error)), { supplyId: params.id });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Supplies & Materials', href: '/supplies' },
          { label: 'Edit Supply', href: `/supplies/${params.id}/edit` }
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Supply</h1>
            <p className="text-gray-600">Update your supply listing</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supply Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter a descriptive name for your supply"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your supply item, its features, and what makes it special"
                  rows={4}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                    options={categories.map(cat => ({ value: cat, label: cat }))}
                    placeholder="Select category"
                  />
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange('type', value)}
                    options={types.map(type => ({ 
                      value: type.value, 
                      label: type.label,
                      description: type.description 
                    }))}
                    placeholder="Select type"
                  />
                  {errors.type && (
                    <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Pricing & Inventory */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Inventory</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="Enter your price"
                      className={`pl-10 ${errors.price ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.price && (
                    <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Original Price
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                      placeholder="Original price (optional)"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => handleInputChange('unit', value)}
                    options={units}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity *
                  </label>
                  <Input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleInputChange('stock', e.target.value)}
                    placeholder="Enter stock quantity"
                    className={errors.stock ? 'border-red-500' : ''}
                  />
                  {errors.stock && (
                    <p className="text-red-500 text-sm mt-1">{errors.stock}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Order
                  </label>
                  <Input
                    type="number"
                    value={formData.minOrder}
                    onChange={(e) => handleInputChange('minOrder', e.target.value)}
                    placeholder="Minimum order"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Order
                  </label>
                  <Input
                    type="number"
                    value={formData.maxOrder}
                    onChange={(e) => handleInputChange('maxOrder', e.target.value)}
                    placeholder="Maximum order"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                  options={statuses}
                />
              </div>
            </div>
          </Card>

          {/* Location */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <Input
                  value={formData.location.address}
                  onChange={(e) => handleLocationChange('address', e.target.value)}
                  placeholder="Enter full address"
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <Input
                    value={formData.location.city}
                    onChange={(e) => handleLocationChange('city', e.target.value)}
                    placeholder="Enter city"
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <Input
                    value={formData.location.state}
                    onChange={(e) => handleLocationChange('state', e.target.value)}
                    placeholder="Enter state"
                    className={errors.state ? 'border-red-500' : ''}
                  />
                  {errors.state && (
                    <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <Input
                    value={formData.location.zipCode}
                    onChange={(e) => handleLocationChange('zipCode', e.target.value)}
                    placeholder="Enter ZIP code"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Specifications */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <Input
                    value={formData.specifications.brand}
                    onChange={(e) => handleSpecificationChange('brand', e.target.value)}
                    placeholder="Enter brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <Input
                    value={formData.specifications.model}
                    onChange={(e) => handleSpecificationChange('model', e.target.value)}
                    placeholder="Enter model"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight
                  </label>
                  <Input
                    value={formData.specifications.weight}
                    onChange={(e) => handleSpecificationChange('weight', e.target.value)}
                    placeholder="e.g., 2.5 kg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dimensions
                  </label>
                  <Input
                    value={formData.specifications.dimensions}
                    onChange={(e) => handleSpecificationChange('dimensions', e.target.value)}
                    placeholder="e.g., 30cm x 20cm x 10cm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material
                  </label>
                  <Input
                    value={formData.specifications.material}
                    onChange={(e) => handleSpecificationChange('material', e.target.value)}
                    placeholder="e.g., Steel, Plastic"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <Input
                    value={formData.specifications.color}
                    onChange={(e) => handleSpecificationChange('color', e.target.value)}
                    placeholder="e.g., Blue, Red"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warranty
                  </label>
                  <Input
                    value={formData.specifications.warranty}
                    onChange={(e) => handleSpecificationChange('warranty', e.target.value)}
                    placeholder="e.g., 1 year, 2 years"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Delivery */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Options</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.delivery.available}
                  onChange={(e) => handleDeliveryChange('available', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Delivery Available
                </label>
              </div>

              {formData.delivery.available && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Days *
                    </label>
                    <Input
                      type="number"
                      value={formData.delivery.estimatedDays}
                      onChange={(e) => handleDeliveryChange('estimatedDays', e.target.value)}
                      placeholder="Days to deliver"
                      className={errors.estimatedDays ? 'border-red-500' : ''}
                    />
                    {errors.estimatedDays && (
                      <p className="text-red-500 text-sm mt-1">{errors.estimatedDays}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Cost
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="number"
                        value={formData.delivery.cost}
                        onChange={(e) => handleDeliveryChange('cost', e.target.value)}
                        placeholder="Delivery cost"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Free Shipping Threshold
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="number"
                        value={formData.delivery.freeShippingThreshold}
                        onChange={(e) => handleDeliveryChange('freeShippingThreshold', e.target.value)}
                        placeholder="Free shipping threshold"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Features */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {features.map((feature) => (
                <label key={feature} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{feature}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Tags */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button onClick={handleAddTag} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Images */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  placeholder="Add image URL"
                />
                <Button onClick={handleAddImage} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={image}
                        alt={`Supply image ${index + 1}`}
                        width={400}
                        height={128}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleRemoveImage(image)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Preview Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Supply Preview</h3>
            <div className="border rounded-lg p-4 bg-gray-50">
              {formData.images.length > 0 && (
                <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                  <Image
                    src={formData.images[0]}
                    alt="Supply preview"
                    width={400}
                    height={225}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h4 className="font-semibold text-gray-900 mb-2">
                {formData.name || "Your Supply Name"}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                {formData.description || "Your supply description will appear here..."}
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {formData.features.slice(0, 3).map((feature) => (
                  <span
                    key={feature}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                  >
                    {feature}
                  </span>
                ))}
                {formData.features.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{formData.features.length - 3} more
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                <p>Category: {formData.category || "Not selected"}</p>
                <p>Type: {formData.type || "Not selected"}</p>
                <p>Price: ${formData.price || "0"}/{formData.unit}</p>
                <p>Stock: {formData.stock || "0"}</p>
                <p>Status: {formData.status}</p>
                <p>Location: {formData.location.city || "Not specified"}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Tips</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                <p>Use high-quality images to showcase your supply</p>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 text-green-500 mt-0.5" />
                <p>Set competitive pricing based on market rates</p>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                <p>Accurate location helps buyers find you</p>
              </div>
              <div className="flex items-start gap-2">
                <Settings className="w-4 h-4 text-purple-500 mt-0.5" />
                <p>Detailed specifications build trust</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
