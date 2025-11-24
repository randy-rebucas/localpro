"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft,
  Upload,
  X,
  Plus,
  DollarSign,
  Clock,
  // MapPin,
  // FileText
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

interface ScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean; // Changed from 'available' to match API payload
}

interface ServiceForm {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  pricing: {
    type: string;
    basePrice: number;
    currency: string;
  };
  serviceArea: string[];
  features: string[];
  requirements: string[];
  serviceType: string;
  estimatedDuration: {
    min: number;
    max: number;
  };
  teamSize: number;
  equipmentProvided: boolean;
  materialsIncluded: boolean;
  warranty: {
    hasWarranty: boolean;
    duration: number;
    description: string;
  };
  insurance: {
    covered: boolean;
    coverageAmount: number;
  };
  emergencyService: {
    available: boolean;
    surcharge: number;
    responseTime: string;
  };
  servicePackages: Array<{
    name: string;
    description: string;
    price: number;
    features: string[];
    duration: number;
  }>;
  addOns: Array<{
    name: string;
    description: string;
    price: number;
    category: string;
  }>;
  availability: {
    timezone: string;
    schedule: ScheduleItem[];
  };
  images: File[];
  isActive?: boolean; // Optional: default true
}

export default function CreateServicePage() {
  const router = useRouter();
  const [form, setForm] = useState<ServiceForm>({
    title: "",
    description: "",
    category: "cleaning",
    subcategory: "",
    pricing: {
      type: "hourly",
      basePrice: 0,
      currency: "USD"
    },
    serviceArea: [],
    features: [],
    requirements: [],
    serviceType: "one_time",
    estimatedDuration: {
      min: 1,
      max: 8
    },
    teamSize: 1,
    equipmentProvided: false,
    materialsIncluded: false,
    warranty: {
      hasWarranty: false,
      duration: 0,
      description: ""
    },
    insurance: {
      covered: false,
      coverageAmount: 0
    },
    emergencyService: {
      available: false,
      surcharge: 0,
      responseTime: ""
    },
    servicePackages: [],
    addOns: [],
    availability: {
      timezone: "UTC",
      schedule: []
    },
    images: [],
    isActive: true // Default to true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFeature, setNewFeature] = useState("");
  const [newRequirement, setNewRequirement] = useState("");
  const [newServiceArea, setNewServiceArea] = useState("");
  const [newPackageFeature, setNewPackageFeature] = useState("");
  const [newAddon, setNewAddon] = useState({
    name: "",
    description: "",
    price: 0,
    category: ""
  });
  const [newPackage, setNewPackage] = useState({
    name: "",
    description: "",
    price: 0,
    features: [] as string[],
    duration: 0
  });

  const daysOfWeek = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" }
  ];

  const categories = [
    { value: "cleaning", label: "Cleaning Services" },
    { value: "plumbing", label: "Plumbing Services" },
    { value: "electrical", label: "Electrical Services" },
    { value: "moving", label: "Moving Services" },
    { value: "landscaping", label: "Landscaping Services" },
    { value: "maintenance", label: "Maintenance Services" },
    { value: "repair", label: "Repair Services" },
    { value: "consultation", label: "Consultation Services" }
  ];

  const subcategories = {
    cleaning: [
      { value: "house_cleaning", label: "House Cleaning" },
      { value: "office_cleaning", label: "Office Cleaning" },
      { value: "deep_cleaning", label: "Deep Cleaning" },
      { value: "window_cleaning", label: "Window Cleaning" },
      { value: "carpet_cleaning", label: "Carpet Cleaning" }
    ],
    plumbing: [
      { value: "repair", label: "Plumbing Repair" },
      { value: "installation", label: "Installation" },
      { value: "maintenance", label: "Maintenance" },
      { value: "emergency", label: "Emergency Service" }
    ],
    electrical: [
      { value: "repair", label: "Electrical Repair" },
      { value: "installation", label: "Installation" },
      { value: "maintenance", label: "Maintenance" },
      { value: "inspection", label: "Inspection" }
    ],
    moving: [
      { value: "local", label: "Local Moving" },
      { value: "long_distance", label: "Long Distance" },
      { value: "packing", label: "Packing Service" },
      { value: "storage", label: "Storage" }
    ]
  };

  const serviceTypes = [
    { value: "one_time", label: "One Time" },
    { value: "recurring", label: "Recurring" },
    { value: "subscription", label: "Subscription" },
    { value: "project", label: "Project Based" }
  ];

  const pricingTypes = [
    { value: "hourly", label: "Per Hour" },
    { value: "fixed", label: "Fixed Price" },
    { value: "per_sqft", label: "Per Square Foot" },
    { value: "per_room", label: "Per Room" }
  ];

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePricingChange = (field: string, value: string | number) => {
    setForm(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [field]: value
      }
    }));
  };

  const handleDurationChange = (field: string, value: number) => {
    setForm(prev => ({
      ...prev,
      estimatedDuration: {
        ...prev.estimatedDuration,
        [field]: value
      }
    }));
  };

  const handleWarrantyChange = (field: string, value: string | number | boolean) => {
    setForm(prev => ({
      ...prev,
      warranty: {
        ...prev.warranty,
        [field]: value
      }
    }));
  };

  const handleInsuranceChange = (field: string, value: string | number | boolean) => {
    setForm(prev => ({
      ...prev,
      insurance: {
        ...prev.insurance,
        [field]: value
      }
    }));
  };

  const handleEmergencyServiceChange = (field: string, value: string | number | boolean) => {
    setForm(prev => ({
      ...prev,
      emergencyService: {
        ...prev.emergencyService,
        [field]: value
      }
    }));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setForm(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setForm(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    setForm(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const addServiceArea = () => {
    if (newServiceArea.trim()) {
      setForm(prev => ({
        ...prev,
        serviceArea: [...prev.serviceArea, newServiceArea.trim()]
      }));
      setNewServiceArea("");
    }
  };

  const removeServiceArea = (index: number) => {
    setForm(prev => ({
      ...prev,
      serviceArea: prev.serviceArea.filter((_, i) => i !== index)
    }));
  };

  const addPackageFeature = () => {
    if (newPackageFeature.trim()) {
      setNewPackage(prev => ({
        ...prev,
        features: [...prev.features, newPackageFeature.trim()]
      }));
      setNewPackageFeature("");
    }
  };

  const removePackageFeature = (index: number) => {
    setNewPackage(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const addPackage = () => {
    if (newPackage.name.trim() && newPackage.description.trim()) {
      setForm(prev => ({
        ...prev,
        servicePackages: [...prev.servicePackages, { ...newPackage }]
      }));
      setNewPackage({
        name: "",
        description: "",
        price: 0,
        features: [],
        duration: 0
      });
    }
  };

  const removePackage = (index: number) => {
    setForm(prev => ({
      ...prev,
      servicePackages: prev.servicePackages.filter((_, i) => i !== index)
    }));
  };

  const addAddon = () => {
    if (newAddon.name.trim() && newAddon.description.trim()) {
      setForm(prev => ({
        ...prev,
        addOns: [...prev.addOns, { ...newAddon }]
      }));
      setNewAddon({
        name: "",
        description: "",
        price: 0,
        category: ""
      });
    }
  };

  const removeAddon = (index: number) => {
    setForm(prev => ({
      ...prev,
      addOns: prev.addOns.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setForm(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addScheduleItem = (day: string) => {
    const existingSchedule = form.availability.schedule;
    const dayExists = existingSchedule.some(item => item.day === day);
    
    if (!dayExists) {
      setForm(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          schedule: [
            ...prev.availability.schedule,
            {
              day,
              startTime: "09:00",
              endTime: "17:00",
              isAvailable: true
            }
          ]
        }
      }));
    }
  };

  const removeScheduleItem = (day: string) => {
    setForm(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        schedule: prev.availability.schedule.filter(item => item.day !== day)
      }
    }));
  };

  const updateScheduleItem = (day: string, field: string, value: string | boolean) => {
    setForm(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        schedule: prev.availability.schedule.map(item =>
          item.day === day ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  const getScheduleForDay = (day: string) => {
    return form.availability.schedule.find(item => item.day === day);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("subcategory", form.subcategory);
      formData.append("pricing", JSON.stringify(form.pricing));
      formData.append("serviceArea", JSON.stringify(form.serviceArea));
      formData.append("features", JSON.stringify(form.features));
      formData.append("requirements", JSON.stringify(form.requirements));
      formData.append("serviceType", form.serviceType);
      formData.append("estimatedDuration", JSON.stringify(form.estimatedDuration));
      formData.append("teamSize", form.teamSize.toString());
      formData.append("equipmentProvided", form.equipmentProvided.toString());
      formData.append("materialsIncluded", form.materialsIncluded.toString());
      formData.append("warranty", JSON.stringify(form.warranty));
      formData.append("insurance", JSON.stringify(form.insurance));
      formData.append("emergencyService", JSON.stringify(form.emergencyService));
      formData.append("servicePackages", JSON.stringify(form.servicePackages));
      formData.append("addOns", JSON.stringify(form.addOns));
      formData.append("availability", JSON.stringify(form.availability));
      formData.append("isActive", (form.isActive ?? true).toString());

      form.images.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });

      if (!getApiToken()) {
        throw new Error('Please log in to create a service');
      }
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceServices}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        body: formData,
      }));

      if (!response.ok) {
        throw new Error("Failed to create service");
      }

      const service = await response.json();
      router.push(`/marketplace/services/${service._id}`);
    } catch (error) {
      logger.error("Error creating service", error instanceof Error ? error : new Error(String(error)));
      setError("Failed to create service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/marketplace"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to marketplace"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create New Service</h1>
            <p className="text-sm text-gray-600">Add a new service listing to your marketplace</p>
          </div>
        </div>

        <div>
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Service Title *"
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Professional House Cleaning"
                  />
                </div>

                <div>
                  <Select
                    label="Category *"
                    value={form.category}
                    onValueChange={(value) => handleInputChange("category", value)}
                    options={categories}
                  />
                </div>

                <div>
                  <Select
                    label="Subcategory *"
                    value={form.subcategory}
                    onValueChange={(value) => handleInputChange("subcategory", value)}
                    options={subcategories[form.category as keyof typeof subcategories] || []}
                  />
                </div>

                <div>
                  <Select
                    label="Service Type *"
                    value={form.serviceType}
                    onValueChange={(value) => handleInputChange("serviceType", value)}
                    options={serviceTypes}
                  />
                </div>

                <div>
                  <Input
                    label="Team Size *"
                    type="number"
                    required
                    min="1"
                    value={form.teamSize}
                    onChange={(e) => handleInputChange("teamSize", Number(e.target.value))}
                    placeholder="1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Textarea
                    label="Description *"
                    required
                    rows={4}
                    value={form.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe your service in detail..."
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Select
                    label="Pricing Type *"
                    value={form.pricing.type}
                    onValueChange={(value) => handlePricingChange("type", value)}
                    options={pricingTypes}
                  />
                </div>

                <div>
                  <Input
                    label="Base Price (USD) *"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.pricing.basePrice}
                    onChange={(e) => handlePricingChange("basePrice", Number(e.target.value))}
                    placeholder="0.00"
                    leftIcon={<DollarSign />}
                  />
                </div>

                <div>
                  <Input
                    label="Currency"
                    type="text"
                    value={form.pricing.currency}
                    onChange={(e) => handlePricingChange("currency", e.target.value)}
                    placeholder="USD"
                  />
                </div>
              </div>
            </div>

            {/* Duration */}
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Estimated Duration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Minimum Duration (hours) *"
                    type="number"
                    required
                    min="0.5"
                    step="0.5"
                    value={form.estimatedDuration.min}
                    onChange={(e) => handleDurationChange("min", Number(e.target.value))}
                    placeholder="1"
                    leftIcon={<Clock />}
                  />
                </div>

                <div>
                  <Input
                    label="Maximum Duration (hours) *"
                    type="number"
                    required
                    min="0.5"
                    step="0.5"
                    value={form.estimatedDuration.max}
                    onChange={(e) => handleDurationChange("max", Number(e.target.value))}
                    placeholder="8"
                    leftIcon={<Clock />}
                  />
                </div>
              </div>
            </div>

            {/* Service Areas */}
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Service Areas</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={newServiceArea}
                      onChange={(e) => setNewServiceArea(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addServiceArea();
                        }
                      }}
                      placeholder="Enter postal code or area (e.g., 10001)"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addServiceArea}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.serviceArea.map((area, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1 rounded-full text-sm border border-blue-200 shadow-sm">
                      <span>{area}</span>
                      <button
                        type="button"
                        onClick={() => removeServiceArea(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Equipment & Materials */}
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Equipment & Materials</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="equipmentProvided"
                    checked={form.equipmentProvided}
                    onChange={(e) => handleInputChange("equipmentProvided", e.target.checked)}
                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="equipmentProvided" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Equipment provided
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="materialsIncluded"
                    checked={form.materialsIncluded}
                    onChange={(e) => handleInputChange("materialsIncluded", e.target.checked)}
                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="materialsIncluded" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Materials included
                  </label>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">What&apos;s Included</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addFeature();
                        }
                      }}
                      placeholder="Add a feature..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {form.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                      <span className="flex-1 text-sm">{feature}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Requirements</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addRequirement();
                        }
                      }}
                      placeholder="Add a requirement..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {form.requirements.map((requirement, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                      <span className="flex-1 text-sm">{requirement}</span>
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Warranty */}
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Warranty</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="hasWarranty"
                    checked={form.warranty.hasWarranty}
                    onChange={(e) => handleWarrantyChange("hasWarranty", e.target.checked)}
                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="hasWarranty" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Offer warranty
                  </label>
                </div>
                {form.warranty.hasWarranty && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        label="Warranty Duration (days)"
                        type="number"
                        min="0"
                        value={form.warranty.duration}
                        onChange={(e) => handleWarrantyChange("duration", Number(e.target.value))}
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <Input
                        label="Warranty Description"
                        type="text"
                        value={form.warranty.description}
                        onChange={(e) => handleWarrantyChange("description", e.target.value)}
                        placeholder="e.g., 30-day satisfaction guarantee"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Insurance */}
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Insurance</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="insuranceCovered"
                    checked={form.insurance.covered}
                    onChange={(e) => handleInsuranceChange("covered", e.target.checked)}
                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="insuranceCovered" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Service is insured
                  </label>
                </div>
                {form.insurance.covered && (
                  <div>
                    <Input
                      label="Coverage Amount (USD)"
                      type="number"
                      min="0"
                      value={form.insurance.coverageAmount}
                      onChange={(e) => handleInsuranceChange("coverageAmount", Number(e.target.value))}
                      placeholder="1000000"
                      leftIcon={<DollarSign />}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Service */}
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Emergency Service</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="emergencyAvailable"
                    checked={form.emergencyService.available}
                    onChange={(e) => handleEmergencyServiceChange("available", e.target.checked)}
                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="emergencyAvailable" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Emergency service available
                  </label>
                </div>
                {form.emergencyService.available && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        label="Response Time"
                        type="text"
                        value={form.emergencyService.responseTime}
                        onChange={(e) => handleEmergencyServiceChange("responseTime", e.target.value)}
                        placeholder="e.g., within 2 hours"
                      />
                    </div>
                    <div>
                      <Input
                        label="Emergency Surcharge (USD)"
                        type="number"
                        min="0"
                        value={form.emergencyService.surcharge}
                        onChange={(e) => handleEmergencyServiceChange("surcharge", Number(e.target.value))}
                        placeholder="50"
                        leftIcon={<DollarSign />}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Service Packages */}
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Service Packages</h2>
              <div className="space-y-6">
                {/* Add New Package */}
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gradient-to-br from-white to-gray-50/50 shadow-sm">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Add New Package</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Package Name"
                        type="text"
                        value={newPackage.name}
                        onChange={(e) => setNewPackage(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Basic Cleaning"
                      />
                    </div>
                    <div>
                      <Input
                        label="Price (USD)"
                        type="number"
                        min="0"
                        value={newPackage.price}
                        onChange={(e) => setNewPackage(prev => ({ ...prev, price: Number(e.target.value) }))}
                        placeholder="75"
                      />
                    </div>
                    <div>
                      <Input
                        label="Duration (hours)"
                        type="number"
                        min="0"
                        value={newPackage.duration}
                        onChange={(e) => setNewPackage(prev => ({ ...prev, duration: Number(e.target.value) }))}
                        placeholder="3"
                      />
                    </div>
                    <div>
                      <Textarea
                        label="Description"
                        rows={2}
                        value={newPackage.description}
                        onChange={(e) => setNewPackage(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Package description..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Package Features</label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              type="text"
                              value={newPackageFeature}
                              onChange={(e) => setNewPackageFeature(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addPackageFeature();
                                }
                              }}
                              placeholder="Add a feature..."
                            />
                          </div>
                          <button
                            type="button"
                            onClick={addPackageFeature}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {newPackage.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-2 py-1 rounded text-sm border border-purple-200 shadow-sm">
                              <span>{feature}</span>
                              <button
                                type="button"
                                onClick={() => removePackageFeature(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={addPackage}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Add Package
                      </button>
                    </div>
                  </div>
                </div>

                {/* Existing Packages */}
                {form.servicePackages.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-700">Added Packages</h3>
                    {form.servicePackages.map((pkg, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-700">{pkg.name}</h4>
                            <p className="text-sm text-gray-600">{pkg.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removePackage(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <span>${pkg.price} • {pkg.duration}h</span>
                          <span>{pkg.features.length} features</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Add-ons */}
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Add-ons</h2>
              <div className="space-y-6">
                {/* Add New Add-on */}
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gradient-to-br from-white to-gray-50/50 shadow-sm">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Add New Add-on</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Add-on Name"
                        type="text"
                        value={newAddon.name}
                        onChange={(e) => setNewAddon(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Window Cleaning"
                      />
                    </div>
                    <div>
                      <Input
                        label="Price (USD)"
                        type="number"
                        min="0"
                        value={newAddon.price}
                        onChange={(e) => setNewAddon(prev => ({ ...prev, price: Number(e.target.value) }))}
                        placeholder="25"
                      />
                    </div>
                    <div>
                      <Input
                        label="Category"
                        type="text"
                        value={newAddon.category}
                        onChange={(e) => setNewAddon(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="e.g., cleaning"
                      />
                    </div>
                    <div>
                      <Textarea
                        label="Description"
                        rows={2}
                        value={newAddon.description}
                        onChange={(e) => setNewAddon(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Add-on description..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={addAddon}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Add Add-on
                      </button>
                    </div>
                  </div>
                </div>

                {/* Existing Add-ons */}
                {form.addOns.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-700">Added Add-ons</h3>
                    {form.addOns.map((addon, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-700">{addon.name}</h4>
                            <p className="text-sm text-gray-600">{addon.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAddon(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <span>${addon.price}</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {addon.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Images */}
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Service Images</h2>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gradient-to-br from-gray-50/50 to-white hover:border-emerald-300 transition-all">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload images of your work</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2 rounded-lg hover:from-emerald-700 hover:to-emerald-800 cursor-pointer transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105"
                  >
                    Choose Images
                  </label>
                </div>
                {form.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {form.images.map((image, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          width={96}
                          height={96}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Availability */}
            <div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">Availability</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Input
                      label="Timezone"
                      type="text"
                      value={form.availability.timezone}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        availability: {
                          ...prev.availability,
                          timezone: e.target.value
                        }
                      }))}
                      placeholder="Asia/Manila"
                    />
                  </div>
                </div>

                {/* Weekly Schedule */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Weekly Schedule
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday"];
                          weekdays.forEach(day => {
                            if (!getScheduleForDay(day)) {
                              addScheduleItem(day);
                            }
                          });
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-lg transition-all border border-gray-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        Set Weekdays
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          form.availability.schedule.forEach(item => removeScheduleItem(item.day));
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-red-700 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 rounded-lg transition-all border border-red-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {daysOfWeek.map((day) => {
                      const scheduleItem = getScheduleForDay(day.value);
                      return (
                        <div
                          key={day.value}
                          className="bg-gradient-to-br from-white to-gray-50/50 border-2 border-gray-200 rounded-lg p-4 shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={!!scheduleItem}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    addScheduleItem(day.value);
                                  } else {
                                    removeScheduleItem(day.value);
                                  }
                                }}
                                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                              />
                              <label className="text-sm font-semibold text-gray-700 cursor-pointer">
                                {day.label}
                              </label>
                            </div>
                            {scheduleItem && (
                              <button
                                type="button"
                                onClick={() => removeScheduleItem(day.value)}
                                className="text-red-600 hover:text-red-700 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                          {scheduleItem && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Start Time
                                </label>
                                <input
                                  type="time"
                                  value={scheduleItem.startTime}
                                  onChange={(e) => updateScheduleItem(day.value, "startTime", e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md hover:border-gray-400 bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  End Time
                                </label>
                                <input
                                  type="time"
                                  value={scheduleItem.endTime}
                                  onChange={(e) => updateScheduleItem(day.value, "endTime", e.target.value)}
                                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md hover:border-gray-400 bg-white"
                                />
                              </div>
                              <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={scheduleItem.isAvailable}
                                    onChange={(e) => updateScheduleItem(day.value, "isAvailable", e.target.checked)}
                                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                                  />
                                  <span className="text-xs font-medium text-gray-600">
                                    Available
                                  </span>
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {form.availability.schedule.length === 0 && (
                    <p className="text-sm text-gray-500 mt-3 italic">
                      No schedule set. Service will be available 24/7 or as per your default settings.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Service Status */}
            <div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">Service Status</h2>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-gray-200">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive ?? true}
                  onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Activate service immediately after creation
                </label>
                <span className="text-xs text-gray-500 ml-auto">
                  {form.isActive ? "Service will be visible to clients" : "Service will be hidden until activated"}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-lg p-4 shadow-md">
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Link
                href="/marketplace"
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md hover:scale-105 font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 font-semibold disabled:hover:scale-100"
              >
                {loading ? "Creating..." : "Create Service"}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
