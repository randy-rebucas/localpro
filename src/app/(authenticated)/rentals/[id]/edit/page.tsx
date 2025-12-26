"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Eye,
  DollarSign,
  CheckCircle,
  Star,
  MapPin,
  Settings,
  Package,
  Sparkles,
  Loader2
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/loading";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { generateRentalDescription } from "@/lib/ai-utils";

const categories = [
  { value: "tools", label: "Tools" },
  { value: "vehicles", label: "Vehicles" },
  { value: "equipment", label: "Equipment" },
  { value: "machinery", label: "Machinery" }
];

// Subcategories based on category
const getSubcategories = (category: string) => {
  switch (category) {
    case "tools":
      return ["Hand Tools", "Power Tools", "Garden Tools", "Construction Tools", "Other"];
    case "vehicles":
      return ["Cars", "Trucks", "Vans", "Motorcycles", "Buses", "Other"];
    case "equipment":
      return ["Construction", "Agricultural", "Industrial", "Medical", "Other"];
    case "machinery":
      return ["Heavy Machinery", "Manufacturing", "Processing", "Other"];
    default:
      return [];
  }
};

const conditions = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" }
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
  const { settings: appSettings } = useAppSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    description: "",
    category: "",
    subcategory: "",
    pricing: {
      hourly: "",
      daily: "",
      weekly: "",
      monthly: "",
      currency: "PHP"
    },
    location: {
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "Philippines"
      },
      coordinates: {
        lat: "",
        lng: ""
      },
      pickupRequired: true,
      deliveryAvailable: false,
      deliveryFee: ""
    },
    specifications: {
      brand: "",
      model: "",
      year: "",
      condition: "good" as const,
      features: [] as string[],
      dimensions: {
        length: "",
        width: "",
        height: "",
        unit: "inches"
      },
      weight: {
        value: "",
        unit: "lbs"
      }
    },
    availability: {
      isAvailable: true,
      schedule: [] as Array<{
        startDate: string;
        endDate: string;
        reason: "rented" | "maintenance" | "unavailable";
      }>
    },
    requirements: {
      minAge: "",
      licenseRequired: false,
      licenseType: "",
      deposit: "",
      insuranceRequired: false
    },
    tags: [] as string[]
  });
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
        const rental = data.data || data;
        
        // Map old API format to new form structure
        const pricing = rental.pricing || {};
        const location = rental.location || {};
        const address = location.address || {};
        const specs = rental.specifications || {};
        const dims = specs.dimensions || {};
        const weight = specs.weight || {};
        
        setFormData({
          name: rental.name || "",
          title: rental.title || rental.name || "",
          description: rental.description || "",
          category: rental.category || "",
          subcategory: rental.subcategory || "",
          pricing: {
            hourly: pricing.hourly?.toString() || "",
            daily: pricing.daily?.toString() || "",
            weekly: pricing.weekly?.toString() || "",
            monthly: pricing.monthly?.toString() || "",
            currency: pricing.currency || "PHP"
          },
          location: {
            address: {
              street: address.street || location.address || "",
              city: address.city || location.city || "",
              state: address.state || location.state || "",
              zipCode: address.zipCode || location.zipCode || "",
              country: address.country || "Philippines"
            },
            coordinates: {
              lat: location.coordinates?.lat?.toString() || "",
              lng: location.coordinates?.lng?.toString() || ""
            },
            pickupRequired: location.pickupRequired !== undefined ? location.pickupRequired : true,
            deliveryAvailable: location.deliveryAvailable || false,
            deliveryFee: location.deliveryFee?.toString() || ""
          },
          specifications: {
            brand: specs.brand || "",
            model: specs.model || "",
            year: specs.year?.toString() || "",
            condition: specs.condition || "good",
            features: specs.features || [],
            dimensions: {
              length: dims.length?.toString() || "",
              width: dims.width?.toString() || "",
              height: dims.height?.toString() || "",
              unit: dims.unit || "inches"
            },
            weight: {
              value: weight.value?.toString() || "",
              unit: weight.unit || "lbs"
            }
          },
          availability: {
            isAvailable: rental.availability?.isAvailable !== undefined ? rental.availability.isAvailable : (rental.isActive !== undefined ? rental.isActive : true),
            schedule: rental.availability?.schedule || []
          },
          requirements: {
            minAge: rental.requirements?.minAge?.toString() || "",
            licenseRequired: rental.requirements?.licenseRequired || false,
            licenseType: rental.requirements?.licenseType || "",
            deposit: rental.requirements?.deposit?.toString() || "",
            insuranceRequired: rental.requirements?.insuranceRequired || false
          },
          tags: rental.tags || []
        });
      } catch (error) {
        logger.error('Error fetching rental', error instanceof Error ? error : new Error(String(error)), { rentalId: params.id });
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

  const handleLocationAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        address: {
          ...prev.location.address,
          [field]: value
        }
      }
    }));
  };

  const handleLocationChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  const handleCoordinatesChange = (field: 'lat' | 'lng', value: string) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates: {
          ...prev.location.coordinates,
          [field]: value
        }
      }
    }));
  };

  const handlePricingChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
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

  const handleDimensionsChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        dimensions: {
          ...prev.specifications.dimensions,
          [field]: value
        }
      }
    }));
  };

  const handleWeightChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        weight: {
          ...prev.specifications.weight,
          [field]: value
        }
      }
    }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        features: prev.specifications.features.includes(feature)
          ? prev.specifications.features.filter(f => f !== feature)
          : [...prev.specifications.features, feature]
      }
    }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.name.trim()) {
      setErrors(prev => ({
        ...prev,
        name: "Please enter a rental name first"
      }));
      return;
    }

    setAiGenerating(true);
    setErrors(prev => ({
      ...prev,
      description: ""
    }));

    try {
      const params = {
        title: formData.name.trim(),
        name: formData.name.trim(),
        category: formData.category || undefined,
        subcategory: formData.subcategory || undefined,
      };

      const response = await generateRentalDescription(params);

      let description: string | null = null;
      
      if (response && response.data) {
        if (typeof response.data === 'object' && 'description' in response.data) {
          description = response.data.description;
        }
      }

      if (description && typeof description === 'string' && description.trim() !== '') {
        handleInputChange('description', description);
      } else {
        setErrors(prev => ({
          ...prev,
          description: "No description was generated. Please try again."
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate description";
      
      if (errorMessage.includes("400")) {
        setErrors(prev => ({
          ...prev,
          description: "Invalid request. Please check your rental name."
        }));
      } else if (errorMessage.includes("404")) {
        setErrors(prev => ({
          ...prev,
          description: "AI description feature is not available yet."
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          description: errorMessage
        }));
      }
      
      logger.error("AI description generation error", err instanceof Error ? err : new Error(String(err)));
    } finally {
      setAiGenerating(false);
    }
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
    if (!formData.subcategory) {
      newErrors.subcategory = "Subcategory is required";
    }
    // At least one pricing option should be provided
    if (!formData.pricing.hourly && !formData.pricing.daily && !formData.pricing.weekly && !formData.pricing.monthly) {
      newErrors.pricing = "At least one pricing option is required";
    }
    if (!formData.location.address.street.trim()) {
      newErrors.street = "Street address is required";
    }
    if (!formData.location.address.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.location.address.state.trim()) {
      newErrors.state = "State is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (status: 'draft' | 'active') => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      if (!getApiToken()) {
        throw new Error('Please log in to update a rental');
      }
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.rentalsById}/${params.id}`;
      
      // Build payload according to API structure
      interface RentalPayload {
        name: string;
        title: string;
        description: string;
        category: string;
        subcategory: string;
        pricing?: {
          hourly?: number;
          daily?: number;
          weekly?: number;
          monthly?: number;
          currency: string;
        };
        location: {
          address: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
          };
          pickupRequired: boolean;
          deliveryAvailable: boolean;
          coordinates?: {
            lat: number;
            lng: number;
          };
          deliveryFee?: number;
        };
        specifications?: {
          brand?: string;
          model?: string;
          year?: number;
          condition: string;
          features?: string[];
          dimensions?: {
            length?: number;
            width?: number;
            height?: number;
            unit: string;
          };
          weight?: {
            value: number;
            unit: string;
          };
        };
        availability: {
          isAvailable: boolean;
          schedule: Array<{
            startDate: string;
            endDate: string;
            reason: "rented" | "maintenance" | "unavailable";
          }>;
        };
        requirements?: {
          minAge?: number;
          licenseRequired: boolean;
          licenseType?: string;
          deposit?: number;
          insuranceRequired?: boolean;
        };
        tags?: string[];
        isActive?: boolean;
      }

      const payload: RentalPayload = {
        name: formData.name.trim(),
        title: formData.title.trim() || formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        subcategory: formData.subcategory,
        location: {
          address: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: ""
          },
          pickupRequired: false,
          deliveryAvailable: false
        },
        availability: {
          isAvailable: true,
          schedule: []
        }
      };

      // Add pricing if at least one option is provided
      const pricing: {
        hourly?: number;
        daily?: number;
        weekly?: number;
        monthly?: number;
        currency: string;
      } = {
        currency: formData.pricing.currency
      };
      if (formData.pricing.hourly) pricing.hourly = parseFloat(formData.pricing.hourly);
      if (formData.pricing.daily) pricing.daily = parseFloat(formData.pricing.daily);
      if (formData.pricing.weekly) pricing.weekly = parseFloat(formData.pricing.weekly);
      if (formData.pricing.monthly) pricing.monthly = parseFloat(formData.pricing.monthly);
      pricing.currency = formData.pricing.currency;
      if (Object.keys(pricing).length > 1) payload.pricing = pricing;

      // Add location
      const location: {
        address: {
          street: string;
          city: string;
          state: string;
          zipCode: string;
          country: string;
        };
        pickupRequired: boolean;
        deliveryAvailable: boolean;
        coordinates?: {
          lat: number;
          lng: number;
        };
        deliveryFee?: number;
      } = {
        address: {
          street: formData.location.address.street.trim(),
          city: formData.location.address.city.trim(),
          state: formData.location.address.state.trim(),
          zipCode: formData.location.address.zipCode.trim(),
          country: formData.location.address.country
        },
        pickupRequired: formData.location.pickupRequired,
        deliveryAvailable: formData.location.deliveryAvailable
      };
      if (formData.location.coordinates.lat && formData.location.coordinates.lng) {
        location.coordinates = {
          lat: parseFloat(formData.location.coordinates.lat),
          lng: parseFloat(formData.location.coordinates.lng)
        };
      }
      if (formData.location.deliveryAvailable && formData.location.deliveryFee) {
        location.deliveryFee = parseFloat(formData.location.deliveryFee);
      }
      // Update location with actual values
      payload.location.address = location.address;
      payload.location.pickupRequired = location.pickupRequired;
      payload.location.deliveryAvailable = location.deliveryAvailable;
      if (location.coordinates) {
        payload.location.coordinates = location.coordinates;
      }
      if (location.deliveryFee !== undefined) {
        payload.location.deliveryFee = location.deliveryFee;
      }

      // Add specifications
      const specifications: {
        brand?: string;
        model?: string;
        year?: number;
        condition: string;
        features?: string[];
        dimensions?: {
          length?: number;
          width?: number;
          height?: number;
          unit: string;
        };
        weight?: {
          value: number;
          unit: string;
        };
      } = {
        condition: formData.specifications.condition
      };
      if (formData.specifications.brand) specifications.brand = formData.specifications.brand;
      if (formData.specifications.model) specifications.model = formData.specifications.model;
      if (formData.specifications.year) specifications.year = parseInt(formData.specifications.year);
      if (formData.specifications.features.length > 0) {
        specifications.features = formData.specifications.features;
      }
      if (formData.specifications.dimensions.length || formData.specifications.dimensions.width || formData.specifications.dimensions.height) {
        specifications.dimensions = {
          length: formData.specifications.dimensions.length ? parseFloat(formData.specifications.dimensions.length) : undefined,
          width: formData.specifications.dimensions.width ? parseFloat(formData.specifications.dimensions.width) : undefined,
          height: formData.specifications.dimensions.height ? parseFloat(formData.specifications.dimensions.height) : undefined,
          unit: formData.specifications.dimensions.unit
        };
      }
      if (formData.specifications.weight.value) {
        specifications.weight = {
          value: parseFloat(formData.specifications.weight.value),
          unit: formData.specifications.weight.unit
        };
      }
      if (Object.keys(specifications).length > 0) payload.specifications = specifications;

      // Add availability
      payload.availability = {
        isAvailable: formData.availability.isAvailable,
        schedule: formData.availability.schedule
      };

      // Add requirements if any are provided
      const requirements: {
        minAge?: number;
        licenseRequired: boolean;
        licenseType?: string;
        deposit?: number;
        insuranceRequired?: boolean;
      } = {
        licenseRequired: formData.requirements.licenseRequired
      };
      if (formData.requirements.minAge) requirements.minAge = parseInt(formData.requirements.minAge);
      if (formData.requirements.licenseType) requirements.licenseType = formData.requirements.licenseType;
      if (formData.requirements.deposit) requirements.deposit = parseFloat(formData.requirements.deposit);
      requirements.insuranceRequired = formData.requirements.insuranceRequired;
      if (Object.keys(requirements).length > 0 && (requirements.minAge || requirements.licenseRequired || requirements.deposit || requirements.insuranceRequired)) {
        payload.requirements = requirements;
      }

      // Add tags if any
      if (formData.tags.length > 0) {
        payload.tags = formData.tags;
      }

      // Add status
      payload.isActive = status === 'active';

      const response = await fetch(url, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify(payload),
      }));

      if (response.ok) {
        router.push(`/rentals/${params.id}`);
      } else {
        const errorData = await response.json();
        logger.error('Error updating rental', new Error('Rental update failed'), { errorData, status: response.status, rentalId: params.id });
      }
    } catch (error) {
      logger.error('Error updating rental', error instanceof Error ? error : new Error(String(error)), { rentalId: params.id });
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href={`/rentals/${params.id}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to rental"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Package className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Rental</h1>
            <p className="text-sm text-gray-600">Update your rental listing</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md font-medium"
            >
              <Eye className="w-4 h-4" />
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            <button
              onClick={() => handleSave('active')}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              {saving ? 'Saving...' : 'Update'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rental Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter a descriptive name for your rental"
                  className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Description *
                  </label>
                  {formData.name.trim() && (
                    <button
                      type="button"
                      onClick={handleGenerateDescription}
                      disabled={aiGenerating}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-primary text-white rounded-lg hover:from-purple-700 hover:to-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-purple-500/30 hover:shadow-lg hover:scale-105 text-xs font-medium"
                    >
                      {aiGenerating ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>Generate with AI</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder={formData.name.trim() 
                    ? 'Click "Generate with AI" to create a description, or describe your rental item, its features, and what makes it special'
                    : 'Describe your rental item, its features, and what makes it special'}
                  rows={4}
                  className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white resize-none ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
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
                    onValueChange={(value) => {
                      handleInputChange('category', value);
                      handleInputChange('subcategory', ''); // Reset subcategory when category changes
                    }}
                    options={categories}
                    placeholder="Select category"
                  />
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subcategory *
                  </label>
                  <Select
                    value={formData.subcategory}
                    onValueChange={(value) => handleInputChange('subcategory', value)}
                    options={getSubcategories(formData.category).map(sub => ({ value: sub, label: sub }))}
                    placeholder="Select subcategory"
                    disabled={!formData.category}
                  />
                  {errors.subcategory && (
                    <p className="text-red-500 text-sm mt-1">{errors.subcategory}</p>
                  )}
                </div>
              </div>
            </div>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Pricing</h2>
              <p className="text-sm text-gray-600 mb-4">Enter at least one pricing option (all prices in PHP)</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricing.hourly}
                    onChange={(e) => handlePricingChange('hourly', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricing.daily}
                    onChange={(e) => handlePricingChange('daily', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weekly Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricing.weekly}
                    onChange={(e) => handlePricingChange('weekly', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricing.monthly}
                    onChange={(e) => handlePricingChange('monthly', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>
              </div>
              {errors.pricing && (
                <p className="text-red-500 text-sm mt-1">{errors.pricing}</p>
              )}
            </div>
            </div>

            {/* Location */}
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Location</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={formData.location.address.street}
                  onChange={(e) => handleLocationAddressChange('street', e.target.value)}
                  placeholder="Enter street address"
                  className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white ${
                    errors.street ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.street && (
                  <p className="text-red-500 text-sm mt-1">{errors.street}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.location.address.city}
                    onChange={(e) => handleLocationAddressChange('city', e.target.value)}
                    placeholder="Enter city"
                    className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.location.address.state}
                    onChange={(e) => handleLocationAddressChange('state', e.target.value)}
                    placeholder="Enter state"
                    className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white ${
                      errors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.state && (
                    <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.location.address.zipCode}
                    onChange={(e) => handleLocationAddressChange('zipCode', e.target.value)}
                    placeholder="Enter ZIP code"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude (optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.location.coordinates.lat}
                    onChange={(e) => handleCoordinatesChange('lat', e.target.value)}
                    placeholder="0.0000"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude (optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.location.coordinates.lng}
                    onChange={(e) => handleCoordinatesChange('lng', e.target.value)}
                    placeholder="0.0000"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.location.pickupRequired}
                    onChange={(e) => handleLocationChange('pickupRequired', e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Pickup Required</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.location.deliveryAvailable}
                    onChange={(e) => handleLocationChange('deliveryAvailable', e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Delivery Available</span>
                </label>
              </div>

              {formData.location.deliveryAvailable && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Fee (PHP)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.location.deliveryFee}
                    onChange={(e) => handleLocationChange('deliveryFee', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>
              )}
            </div>
            </div>

            {/* Specifications */}
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Specifications</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={formData.specifications.brand}
                    onChange={(e) => handleSpecificationChange('brand', e.target.value)}
                    placeholder="Enter brand"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={formData.specifications.model}
                    onChange={(e) => handleSpecificationChange('model', e.target.value)}
                    placeholder="Enter model"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <input
                    type="text"
                    value={formData.specifications.year}
                    onChange={(e) => handleSpecificationChange('year', e.target.value)}
                    placeholder="Enter year"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dimensions
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Length</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.specifications.dimensions.length}
                        onChange={(e) => handleDimensionsChange('length', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Width</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.specifications.dimensions.width}
                        onChange={(e) => handleDimensionsChange('width', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Height</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.specifications.dimensions.height}
                        onChange={(e) => handleDimensionsChange('height', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Unit</label>
                      <Select
                        value={formData.specifications.dimensions.unit}
                        onValueChange={(value) => handleDimensionsChange('unit', value)}
                        options={[
                          { value: "inches", label: "Inches" },
                          { value: "feet", label: "Feet" },
                          { value: "meters", label: "Meters" },
                          { value: "cm", label: "Centimeters" }
                        ]}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Value</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.specifications.weight.value}
                        onChange={(e) => handleWeightChange('value', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Unit</label>
                      <Select
                        value={formData.specifications.weight.unit}
                        onValueChange={(value) => handleWeightChange('unit', value)}
                        options={[
                          { value: "lbs", label: "Pounds" },
                          { value: "kg", label: "Kilograms" },
                          { value: "tons", label: "Tons" }
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {features.map((feature) => (
                  <label key={feature} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.specifications.features.includes(feature)}
                      onChange={() => handleFeatureToggle(feature)}
                      className="w-5 h-5 rounded border-2 border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Availability</h2>
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.availability.isAvailable}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        availability: {
                          ...prev.availability,
                          isAvailable: e.target.checked
                        }
                      }));
                    }}
                    className="w-5 h-5 rounded border-2 border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Currently Available</span>
                </label>
                <p className="text-xs text-gray-500">You can add specific availability schedules after updating the rental.</p>
              </div>
            </div>

          </div>
        </div>

          {/* Preview Sidebar */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Rental Preview</h3>
              <div className="border-2 border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white">
                <h4 className="font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                  {formData.name || "Your Rental Name"}
                </h4>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                  {formData.description || "Your rental description will appear here..."}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {formData.specifications.features.slice(0, 3).map((feature) => (
                    <span
                      key={feature}
                      className="text-xs font-medium bg-gradient-to-r from-primary/10 to-primary/10 text-primary px-2.5 py-1 rounded-full border-2 border-primary/30 shadow-sm"
                    >
                      {feature}
                    </span>
                  ))}
                  {formData.specifications.features.length > 3 && (
                    <span className="text-xs font-medium text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 px-2.5 py-1 rounded-full border-2 border-gray-300">
                      +{formData.specifications.features.length - 3} more
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600 space-y-1.5">
                  <p className="font-medium"><span className="text-gray-500">Category:</span> {categories.find(c => c.value === formData.category)?.label || formData.category || "Not selected"}</p>
                  <p className="font-medium"><span className="text-gray-500">Subcategory:</span> {formData.subcategory || "Not selected"}</p>
                  <p className="font-medium"><span className="text-gray-500">Pricing:</span> 
                    {formData.pricing.hourly ? <span className="font-bold text-emerald-600 ml-1">{formatCurrency(parseFloat(formData.pricing.hourly) || 0, 'PHP', { appSettings })}/hr</span> : null}
                    {formData.pricing.daily ? <span className="font-bold text-emerald-600 ml-1">{formatCurrency(parseFloat(formData.pricing.daily) || 0, 'PHP', { appSettings })}/day</span> : null}
                    {formData.pricing.weekly ? <span className="font-bold text-emerald-600 ml-1">{formatCurrency(parseFloat(formData.pricing.weekly) || 0, 'PHP', { appSettings })}/week</span> : null}
                    {formData.pricing.monthly ? <span className="font-bold text-emerald-600 ml-1">{formatCurrency(parseFloat(formData.pricing.monthly) || 0, 'PHP', { appSettings })}/month</span> : null}
                    {!formData.pricing.hourly && !formData.pricing.daily && !formData.pricing.weekly && !formData.pricing.monthly && <span className="text-gray-400 ml-1">Not set</span>}
                  </p>
                  <p className="font-medium"><span className="text-gray-500">Location:</span> {formData.location.address.city || "Not specified"}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">Quick Tips</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-lg border border-yellow-200">
                  <div className="p-1.5 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg">
                    <Star className="w-4 h-4 text-yellow-600" />
                  </div>
                  <p className="font-medium">Use high-quality images to showcase your rental</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-accent/10 to-accent/10/50 rounded-lg border border-accent/20">
                  <div className="p-1.5 bg-gradient-to-br from-accent/10 to-green-200 rounded-lg">
                    <DollarSign className="w-4 h-4 text-accent" />
                  </div>
                  <p className="font-medium">Set competitive pricing based on market rates</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-primary/10 to-primary/10/50 rounded-lg border border-primary/20">
                  <div className="p-1.5 bg-gradient-to-br from-primary/10 to-blue-200 rounded-lg">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <p className="font-medium">Accurate location helps renters find you</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-200">
                  <div className="p-1.5 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg">
                    <Settings className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="font-medium">Detailed specifications build trust</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
