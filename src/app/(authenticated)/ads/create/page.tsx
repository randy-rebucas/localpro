"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Save,
  Eye,
  X,
  Plus,
  DollarSign,
  CheckCircle
} from "lucide-react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

// Categories matching AdCampaign entity specification
const categories = [
  { value: "hardware_stores", label: "Hardware Stores" },
  { value: "suppliers", label: "Suppliers" },
  { value: "training_schools", label: "Training Schools" },
  { value: "services", label: "Services" },
  { value: "products", label: "Products" }
];

// Ad types matching AdCampaign entity specification
const adTypes = [
  { value: "banner", label: "Banner Ad", description: "Display banner ads on platform pages" },
  { value: "sponsored_listing", label: "Sponsored Listing", description: "Featured placement in search results" },
  { value: "video", label: "Video Ad", description: "Video advertising content" },
  { value: "text", label: "Text Ad", description: "Text-based advertisement" },
  { value: "interactive", label: "Interactive Ad", description: "Interactive engagement ads" }
];

// Bidding strategies
const biddingStrategies = [
  { value: "cpc", label: "Cost Per Click (CPC)" },
  { value: "cpm", label: "Cost Per Mille (CPM)" },
  { value: "cpa", label: "Cost Per Action (CPA)" },
  { value: "fixed", label: "Fixed Price" }
];

// Promotion types
const promotionTypes = [
  { value: "featured", label: "Featured" },
  { value: "sponsored", label: "Sponsored" },
  { value: "boosted", label: "Boosted" }
];

// User types for behavioral targeting
const userTypes = [
  { value: "providers", label: "Providers" },
  { value: "clients", label: "Clients" },
  { value: "both", label: "Both" }
];

// Activity levels for behavioral targeting
const activityLevels = [
  { value: "active", label: "Active Users" },
  { value: "moderate", label: "Moderate Users" },
  { value: "new", label: "New Users" }
];

export default function CreateAdPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    type: "",
    // Budget structure
    budget: {
      total: "",
      daily: "",
      currency: "PHP"
    },
    // Bidding structure
    bidding: {
      strategy: "cpc",
      bidAmount: "",
      maxBid: ""
    },
    // Schedule structure
    schedule: {
      startDate: "",
      endDate: "",
      timeSlots: [] as Array<{ day: string; startTime: string; endTime: string }>
    },
    // Target audience structure
    targetAudience: {
      demographics: {
        ageRange: [] as number[],
        gender: [] as string[],
        location: [] as string[],
        interests: [] as string[]
      },
      behavior: {
        userTypes: [] as string[],
        activityLevel: ""
      }
    },
    // Location structure
    location: {
      city: "",
      state: "",
      country: "USA",
      coordinates: {
        latitude: "",
        longitude: ""
      }
    },
    // Content structure
    content: {
      headline: "",
      body: "",
      images: [] as string[],
      video: "",
      callToAction: {
        text: "",
        url: ""
      },
      logo: ""
    },
    // Promotion structure (optional)
    promotion: {
      type: "",
      duration: "",
      budget: "",
      startDate: "",
      endDate: "",
      status: "active" as "active" | "expired" | "cancelled"
    },
    // Legacy fields for backward compatibility
    images: [] as string[],
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState("");
  const [newImage, setNewImage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleNestedChange = (path: string[], value: string | number | boolean) => {
    setFormData(prev => {
      const newData = { ...prev };
      let current: Record<string, unknown> = newData as Record<string, unknown>;
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...(current[path[i]] as Record<string, unknown>) };
        current = current[path[i]] as Record<string, unknown>;
      }
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  const handleArrayToggle = (path: string[], value: string) => {
    setFormData(prev => {
      const newData = { ...prev };
      let current: Record<string, unknown> = newData as Record<string, unknown>;
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...(current[path[i]] as Record<string, unknown>) };
        current = current[path[i]] as Record<string, unknown>;
      }
      const array = current[path[path.length - 1]] as string[];
      current[path[path.length - 1]] = array.includes(value)
        ? array.filter(item => item !== value)
        : [...array, value];
      return newData;
    });
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

  const handleAddImage = () => {
    if (newImage.trim() && !formData.content.images.includes(newImage.trim())) {
      setFormData(prev => ({
        ...prev,
        content: {
          ...prev.content,
          images: [...prev.content.images, newImage.trim()]
        },
        images: [...prev.images, newImage.trim()] // Legacy support
      }));
      setNewImage("");
    }
  };

  const handleRemoveImage = (imageToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        images: prev.content.images.filter(image => image !== imageToRemove)
      },
      images: prev.images.filter(image => image !== imageToRemove) // Legacy support
    }));
  };

  const handleAddTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        timeSlots: [...prev.schedule.timeSlots, { day: "", startTime: "", endTime: "" }]
      }
    }));
  };

  const handleRemoveTimeSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        timeSlots: prev.schedule.timeSlots.filter((_, i) => i !== index)
      }
    }));
  };

  const handleTimeSlotChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        timeSlots: prev.schedule.timeSlots.map((slot, i) =>
          i === index ? { ...slot, [field]: value } : slot
        )
      }
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (!formData.type) {
      newErrors.type = "Ad type is required";
    }
    if (!formData.budget.total || parseFloat(formData.budget.total) <= 0) {
      newErrors.budget = "Valid total budget is required";
    }
    if (!formData.schedule.startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (!formData.schedule.endDate) {
      newErrors.endDate = "End date is required";
    }
    if (formData.schedule.startDate && formData.schedule.endDate && 
        new Date(formData.schedule.startDate) >= new Date(formData.schedule.endDate)) {
      newErrors.endDate = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (status: 'draft' | 'pending') => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Build payload matching AdCampaign entity structure
      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        budget: {
          total: parseFloat(formData.budget.total),
          daily: formData.budget.daily ? parseFloat(formData.budget.daily) : undefined,
          currency: formData.budget.currency || 'PHP'
        },
        bidding: {
          strategy: formData.bidding.strategy,
          bidAmount: formData.bidding.bidAmount ? parseFloat(formData.bidding.bidAmount) : undefined,
          maxBid: formData.bidding.maxBid ? parseFloat(formData.bidding.maxBid) : undefined
        },
        schedule: {
          startDate: new Date(formData.schedule.startDate).toISOString(),
          endDate: new Date(formData.schedule.endDate).toISOString(),
          timeSlots: formData.schedule.timeSlots.length > 0 ? formData.schedule.timeSlots : undefined
        },
        targetAudience: {
          demographics: {
            ageRange: formData.targetAudience.demographics.ageRange.length > 0 
              ? formData.targetAudience.demographics.ageRange 
              : undefined,
            gender: formData.targetAudience.demographics.gender.length > 0 
              ? formData.targetAudience.demographics.gender 
              : undefined,
            location: formData.targetAudience.demographics.location.length > 0 
              ? formData.targetAudience.demographics.location 
              : undefined,
            interests: formData.targetAudience.demographics.interests.length > 0 
              ? formData.targetAudience.demographics.interests 
              : undefined
          },
          behavior: {
            userTypes: formData.targetAudience.behavior.userTypes.length > 0 
              ? formData.targetAudience.behavior.userTypes 
              : undefined,
            activityLevel: formData.targetAudience.behavior.activityLevel || undefined
          }
        },
        location: {
          city: formData.location.city || undefined,
          state: formData.location.state || undefined,
          country: formData.location.country || undefined,
          coordinates: (formData.location.coordinates.latitude && formData.location.coordinates.longitude) ? {
            latitude: parseFloat(formData.location.coordinates.latitude),
            longitude: parseFloat(formData.location.coordinates.longitude)
          } : undefined
        },
        content: {
          headline: formData.content.headline || undefined,
          body: formData.content.body || undefined,
          images: formData.content.images.length > 0 ? formData.content.images.map(url => ({ url })) : undefined,
          video: formData.content.video ? { url: formData.content.video } : undefined,
          callToAction: (formData.content.callToAction.text || formData.content.callToAction.url) ? {
            text: formData.content.callToAction.text || undefined,
            url: formData.content.callToAction.url || undefined
          } : undefined,
          logo: formData.content.logo ? { url: formData.content.logo } : undefined
        },
        images: formData.images.length > 0 ? formData.images.map(url => ({ url })) : undefined, // Legacy support
        promotion: formData.promotion.type ? {
          type: formData.promotion.type,
          duration: formData.promotion.duration ? parseInt(formData.promotion.duration) : undefined,
          budget: formData.promotion.budget ? parseFloat(formData.promotion.budget) : undefined,
          startDate: formData.promotion.startDate ? new Date(formData.promotion.startDate).toISOString() : undefined,
          endDate: formData.promotion.endDate ? new Date(formData.promotion.endDate).toISOString() : undefined,
          status: formData.promotion.status
        } : undefined,
        status,
        isActive: true
      };

      if (!getApiToken()) {
        throw new Error('Please log in to create an ad');
      }
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.adsCreate}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify(payload),
      }));

      if (response.ok) {
        const data = await response.json();
        router.push(`/ads/${data.data?._id || data.data?.id || data.id}`);
      } else {
        const errorData = await response.json();
        logger.error('Error creating ad', undefined, { errorData });
        setErrors({ submit: errorData.message || 'Failed to create ad' });
      }
    } catch (error) {
      logger.error('Error creating ad', error instanceof Error ? error : new Error(String(error)));
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create ad' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Marketplace', href: '/marketplace' },
          { label: 'Ads', href: '/ads' },
          { label: 'Create Ad', href: '/ads/create' }
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
            <h1 className="text-2xl font-bold text-gray-900">Create New Ad</h1>
            <p className="text-gray-600">Set up your advertising campaign</p>
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
            onClick={() => handleSave('draft')}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave('pending')}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Submit for Review
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
                  Ad Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter a compelling title for your ad"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your business, services, or what you're promoting"
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
                    options={categories}
                    placeholder="Select category"
                  />
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad Type *
                  </label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange('type', value)}
                    options={adTypes.map(type => ({ 
                      value: type.value, 
                      label: type.label,
                      description: type.description 
                    }))}
                    placeholder="Select ad type"
                  />
                  {errors.type && (
                    <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Budget and Bidding */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget & Bidding</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Budget *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="number"
                      value={formData.budget.total}
                      onChange={(e) => handleNestedChange(['budget', 'total'], e.target.value)}
                      placeholder="0.00"
                      className={`pl-10 ${errors.budget ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.budget && (
                    <p className="text-red-500 text-sm mt-1">{errors.budget}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Budget (Optional)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="number"
                      value={formData.budget.daily}
                      onChange={(e) => handleNestedChange(['budget', 'daily'], e.target.value)}
                      placeholder="0.00"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <Select
                    value={formData.budget.currency}
                    onValueChange={(value) => handleNestedChange(['budget', 'currency'], value)}
                    options={[
                      { value: "PHP", label: "PHP" }
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bidding Strategy
                  </label>
                  <Select
                    value={formData.bidding.strategy}
                    onValueChange={(value) => handleNestedChange(['bidding', 'strategy'], value)}
                    options={biddingStrategies}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bid Amount (Optional)
                  </label>
                  <Input
                    type="number"
                    value={formData.bidding.bidAmount}
                    onChange={(e) => handleNestedChange(['bidding', 'bidAmount'], e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Bid (Optional)
                  </label>
                  <Input
                    type="number"
                    value={formData.bidding.maxBid}
                    onChange={(e) => handleNestedChange(['bidding', 'maxBid'], e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Schedule */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.schedule.startDate}
                    onChange={(e) => handleNestedChange(['schedule', 'startDate'], e.target.value)}
                    className={errors.startDate ? 'border-red-500' : ''}
                  />
                  {errors.startDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.schedule.endDate}
                    onChange={(e) => handleNestedChange(['schedule', 'endDate'], e.target.value)}
                    className={errors.endDate ? 'border-red-500' : ''}
                  />
                  {errors.endDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Time Slots (Optional)
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTimeSlot}
                    className="flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Time Slot
                  </Button>
                </div>
                {formData.schedule.timeSlots.map((slot, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Select
                      value={slot.day}
                      onValueChange={(value) => handleTimeSlotChange(index, 'day', value)}
                      options={[
                        { value: 'monday', label: 'Monday' },
                        { value: 'tuesday', label: 'Tuesday' },
                        { value: 'wednesday', label: 'Wednesday' },
                        { value: 'thursday', label: 'Thursday' },
                        { value: 'friday', label: 'Friday' },
                        { value: 'saturday', label: 'Saturday' },
                        { value: 'sunday', label: 'Sunday' }
                      ]}
                      placeholder="Day"
                      className="flex-1"
                    />
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleTimeSlotChange(index, 'startTime', e.target.value)}
                      placeholder="Start"
                      className="flex-1"
                    />
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => handleTimeSlotChange(index, 'endTime', e.target.value)}
                      placeholder="End"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTimeSlot(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Target Audience */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Target Audience</h2>
            <div className="space-y-6">
              {/* Behavioral Targeting */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Behavioral Targeting</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User Types
                    </label>
                    <div className="space-y-2">
                      {userTypes.map((type) => (
                        <label key={type.value} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.targetAudience.behavior.userTypes.includes(type.value)}
                            onChange={() => handleArrayToggle(['targetAudience', 'behavior', 'userTypes'], type.value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Activity Level
                    </label>
                    <Select
                      value={formData.targetAudience.behavior.activityLevel}
                      onValueChange={(value) => handleNestedChange(['targetAudience', 'behavior', 'activityLevel'], value)}
                      options={activityLevels}
                      placeholder="Select activity level"
                    />
                  </div>
                </div>
              </div>

              {/* Demographic Targeting */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Demographic Targeting (Optional)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interests (comma-separated)
                    </label>
                    <Input
                      placeholder="e.g., home improvement, business, education"
                      onChange={(e) => {
                        const interests = e.target.value.split(',').map(i => i.trim()).filter(Boolean);
                        setFormData(prev => ({
                          ...prev,
                          targetAudience: {
                            ...prev.targetAudience,
                            demographics: {
                              ...prev.targetAudience.demographics,
                              interests
                            }
                          }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Locations (comma-separated)
                    </label>
                    <Input
                      placeholder="e.g., California, New York, Texas"
                      onChange={(e) => {
                        const locations = e.target.value.split(',').map(l => l.trim()).filter(Boolean);
                        setFormData(prev => ({
                          ...prev,
                          targetAudience: {
                            ...prev.targetAudience,
                            demographics: {
                              ...prev.targetAudience.demographics,
                              location: locations
                            }
                          }
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Content */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ad Content</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Headline
                </label>
                <Input
                  value={formData.content.headline}
                  onChange={(e) => handleNestedChange(['content', 'headline'], e.target.value)}
                  placeholder="Enter ad headline"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body Text
                </label>
                <Textarea
                  value={formData.content.body}
                  onChange={(e) => handleNestedChange(['content', 'body'], e.target.value)}
                  placeholder="Enter ad body text"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Call to Action Text
                  </label>
                  <Input
                    value={formData.content.callToAction.text}
                    onChange={(e) => handleNestedChange(['content', 'callToAction', 'text'], e.target.value)}
                    placeholder="e.g., Learn More, Shop Now"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Call to Action URL
                  </label>
                  <Input
                    value={formData.content.callToAction.url}
                    onChange={(e) => handleNestedChange(['content', 'callToAction', 'url'], e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video URL (Optional)
                  </label>
                  <Input
                    value={formData.content.video}
                    onChange={(e) => handleNestedChange(['content', 'video'], e.target.value)}
                    placeholder="Enter video URL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo URL (Optional)
                  </label>
                  <Input
                    value={formData.content.logo}
                    onChange={(e) => handleNestedChange(['content', 'logo'], e.target.value)}
                    placeholder="Enter logo URL"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Location */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <Input
                    value={formData.location.city}
                    onChange={(e) => handleLocationChange('city', e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <Input
                    value={formData.location.state}
                    onChange={(e) => handleLocationChange('state', e.target.value)}
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <Input
                    value={formData.location.country}
                    onChange={(e) => handleLocationChange('country', e.target.value)}
                    placeholder="Enter country"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude (Optional)
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.location.coordinates.latitude}
                    onChange={(e) => handleNestedChange(['location', 'coordinates', 'latitude'], e.target.value)}
                    placeholder="37.7749"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude (Optional)
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.location.coordinates.longitude}
                    onChange={(e) => handleNestedChange(['location', 'coordinates', 'longitude'], e.target.value)}
                    placeholder="-122.4194"
                  />
                </div>
              </div>
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
                  placeholder="Add a tag"
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
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-blue-600"
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
                  onKeyPress={(e) => e.key === 'Enter' && handleAddImage()}
                />
                <Button onClick={handleAddImage} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {(formData.content.images.length > 0 || formData.images.length > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(formData.content.images.length > 0 ? formData.content.images : formData.images).map((image, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={image}
                        alt={`Ad image ${index + 1}`}
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

          {/* Promotion (Optional) */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Promotion (Optional)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Promotion Type
                </label>
                <Select
                  value={formData.promotion.type}
                  onValueChange={(value) => handleNestedChange(['promotion', 'type'], value)}
                  options={promotionTypes}
                  placeholder="Select promotion type"
                />
              </div>
              {formData.promotion.type && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (days)
                      </label>
                      <Input
                        type="number"
                        value={formData.promotion.duration}
                        onChange={(e) => handleNestedChange(['promotion', 'duration'], e.target.value)}
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Promotion Budget
                      </label>
                      <Input
                        type="number"
                        value={formData.promotion.budget}
                        onChange={(e) => handleNestedChange(['promotion', 'budget'], e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <Input
                        type="date"
                        value={formData.promotion.startDate}
                        onChange={(e) => handleNestedChange(['promotion', 'startDate'], e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <Input
                        type="date"
                        value={formData.promotion.endDate}
                        onChange={(e) => handleNestedChange(['promotion', 'endDate'], e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Preview Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ad Preview</h3>
            <div className="border rounded-lg p-4 bg-gray-50">
              {(formData.content.images.length > 0 || formData.images.length > 0) && (
                <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                  <Image
                    src={(formData.content.images.length > 0 ? formData.content.images : formData.images)[0]}
                    alt="Ad preview"
                    width={400}
                    height={225}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h4 className="font-semibold text-gray-900 mb-2">
                {formData.title || "Your Ad Title"}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                {formData.description || "Your ad description will appear here..."}
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-500">
                <p>Category: {categories.find(c => c.value === formData.category)?.label || formData.category || "Not selected"}</p>
                <p>Type: {adTypes.find(t => t.value === formData.type)?.label || formData.type || "Not selected"}</p>
                <p>Budget: {formData.budget.currency || 'PHP'} {formData.budget.total || "0"}</p>
                {formData.content.headline && (
                  <p className="mt-2 font-medium text-gray-700">{formData.content.headline}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Bidding Strategy:</span>
                <span className="font-medium text-gray-900">
                  {biddingStrategies.find(s => s.value === formData.bidding.strategy)?.label || formData.bidding.strategy}
                </span>
              </div>
              {formData.bidding.bidAmount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Bid Amount:</span>
                  <span className="font-medium text-gray-900">{formData.budget.currency} {formData.bidding.bidAmount}</span>
                </div>
              )}
              {formData.schedule.timeSlots.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Slots:</span>
                  <span className="font-medium text-gray-900">{formData.schedule.timeSlots.length}</span>
                </div>
              )}
              {formData.targetAudience.behavior.userTypes.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Target Users:</span>
                  <span className="font-medium text-gray-900">
                    {formData.targetAudience.behavior.userTypes.join(', ')}
                  </span>
                </div>
              )}
              {errors.submit && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {errors.submit}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
