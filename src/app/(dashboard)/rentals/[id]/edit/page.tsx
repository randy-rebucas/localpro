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

const categories = [
  "Construction Equipment",
  "Vehicles",
  "Tools",
  "Event Equipment",
  "Office Space",
  "Storage",
  "Other"
];

const types = [
  { value: "equipment", label: "Equipment", description: "Heavy machinery and construction equipment" },
  { value: "vehicle", label: "Vehicle", description: "Cars, trucks, and transportation vehicles" },
  { value: "space", label: "Space", description: "Office, storage, or event spaces" },
  { value: "tool", label: "Tool", description: "Hand tools and small equipment" }
];

const priceUnits = [
  { value: "hour", label: "Per Hour" },
  { value: "day", label: "Per Day" },
  { value: "week", label: "Per Week" },
  { value: "month", label: "Per Month" }
];

const conditions = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" }
];

const statuses = [
  { value: "available", label: "Available" },
  { value: "rented", label: "Rented" },
  { value: "maintenance", label: "Maintenance" },
  { value: "unavailable", label: "Unavailable" }
];

const features = [
  "Air Conditioning",
  "GPS Tracking",
  "Safety Equipment",
  "Fuel Efficient",
  "4WD",
  "Bluetooth",
  "Backup Camera",
  "WiFi",
  "Parking",
  "Kitchen",
  "Meeting Rooms",
  "Storage",
  "Security",
  "Maintenance Included"
];

export default function EditRentalPage() {
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
    status: "available" as "available" | "rented" | "maintenance" | "unavailable",
    price: "",
    priceUnit: "day",
    location: {
      address: "",
      city: "",
      state: "",
      zipCode: ""
    },
    specifications: {
      brand: "",
      model: "",
      year: "",
      condition: "good" as const,
      capacity: "",
      dimensions: "",
      weight: ""
    },
    features: [] as string[],
    availability: {
      startDate: "",
      endDate: ""
    },
    images: [] as string[]
  });
  const [newImage, setNewImage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchRental = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.rentalsById}/${params.id}`, createAuthFetchOptions());
        
        if (!response.ok) {
          throw new Error('Rental not found');
        }

        const data = await response.json();
        setFormData({
          name: data.name || "",
          description: data.description || "",
          category: data.category || "",
          type: data.type || "",
          status: data.status || "available",
          price: data.price?.toString() || "",
          priceUnit: data.priceUnit || "day",
          location: data.location || { address: "", city: "", state: "", zipCode: "" },
          specifications: data.specifications || { 
            brand: "", model: "", year: "", condition: "good", 
            capacity: "", dimensions: "", weight: "" 
          },
          features: data.features || [],
          availability: data.availability || { startDate: "", endDate: "" },
          images: data.images || []
        });
      } catch (error) {
        console.error('Error fetching rental:', error);
        // Fallback to mock data
        setFormData({
          name: "Professional Excavator - CAT 320",
          description: "Heavy-duty excavator perfect for construction projects. Well-maintained and ready for immediate use.",
          category: "Construction Equipment",
          type: "equipment",
          status: "available",
          price: "150",
          priceUnit: "day",
          location: { address: "123 Construction Way", city: "New York", state: "NY", zipCode: "10001" },
          specifications: { 
            brand: "Caterpillar", model: "320", year: "2020", condition: "good",
            capacity: "20 tons", dimensions: "25ft x 8ft x 10ft", weight: "20,000 lbs"
          },
          features: ["Air Conditioning", "GPS Tracking", "Safety Equipment", "Fuel Efficient"],
          availability: { 
            startDate: new Date().toISOString().split('T')[0], 
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
          },
          images: ["https://via.placeholder.com/400x300", "https://via.placeholder.com/400x300"]
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchRental();
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

  const handleAvailabilityChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
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
    if (!formData.location.address.trim()) {
      newErrors.address = "Address is required";
    }
    if (!formData.location.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.location.state.trim()) {
      newErrors.state = "State is required";
    }
    if (!formData.availability.startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (!formData.availability.endDate) {
      newErrors.endDate = "End date is required";
    }
    if (formData.availability.startDate && formData.availability.endDate && 
        new Date(formData.availability.startDate) >= new Date(formData.availability.endDate)) {
      newErrors.endDate = "End date must be after start date";
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
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.rentalsById}/${params.id}`, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          year: formData.specifications.year ? parseInt(formData.specifications.year) : undefined
        }),
      }));

      if (response.ok) {
        router.push(`/rentals/${params.id}`);
      } else {
        const errorData = await response.json();
        console.error('Error updating rental:', errorData);
      }
    } catch (error) {
      console.error('Error updating rental:', error);
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
          { label: 'Rentals', href: '/rentals' },
          { label: 'Edit Rental', href: `/rentals/${params.id}/edit` }
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Rental</h1>
            <p className="text-gray-600">Update your rental listing</p>
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
                  Rental Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter a descriptive name for your rental"
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
                  placeholder="Describe your rental item, its features, and what makes it special"
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

          {/* Pricing & Status */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Status</h2>
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
                    Price Unit
                  </label>
                  <Select
                    value={formData.priceUnit}
                    onValueChange={(value) => handleInputChange('priceUnit', value)}
                    options={priceUnits}
                  />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <Input
                    value={formData.specifications.year}
                    onChange={(e) => handleSpecificationChange('year', e.target.value)}
                    placeholder="Enter year"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <Select
                  value={formData.specifications.condition}
                  onValueChange={(value) => handleSpecificationChange('condition', value)}
                  options={conditions}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <Input
                    value={formData.specifications.capacity}
                    onChange={(e) => handleSpecificationChange('capacity', e.target.value)}
                    placeholder="e.g., 20 tons, 5 people"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dimensions
                  </label>
                  <Input
                    value={formData.specifications.dimensions}
                    onChange={(e) => handleSpecificationChange('dimensions', e.target.value)}
                    placeholder="e.g., 25ft x 8ft x 10ft"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight
                  </label>
                  <Input
                    value={formData.specifications.weight}
                    onChange={(e) => handleSpecificationChange('weight', e.target.value)}
                    placeholder="e.g., 20,000 lbs"
                  />
                </div>
              </div>
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

          {/* Availability */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Availability</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available From *
                </label>
                <Input
                  type="date"
                  value={formData.availability.startDate}
                  onChange={(e) => handleAvailabilityChange('startDate', e.target.value)}
                  className={errors.startDate ? 'border-red-500' : ''}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Until *
                </label>
                <Input
                  type="date"
                  value={formData.availability.endDate}
                  onChange={(e) => handleAvailabilityChange('endDate', e.target.value)}
                  className={errors.endDate ? 'border-red-500' : ''}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                )}
              </div>
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
                        alt={`Rental image ${index + 1}`}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rental Preview</h3>
            <div className="border rounded-lg p-4 bg-gray-50">
              {formData.images.length > 0 && (
                <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                  <Image
                    src={formData.images[0]}
                    alt="Rental preview"
                    width={400}
                    height={225}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h4 className="font-semibold text-gray-900 mb-2">
                {formData.name || "Your Rental Name"}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                {formData.description || "Your rental description will appear here..."}
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
                <p>Price: ${formData.price || "0"}/{formData.priceUnit}</p>
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
                <p>Use high-quality images to showcase your rental</p>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 text-green-500 mt-0.5" />
                <p>Set competitive pricing based on market rates</p>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                <p>Accurate location helps renters find you</p>
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
