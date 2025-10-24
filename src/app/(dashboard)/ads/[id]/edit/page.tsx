"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Eye,
  Upload,
  X,
  Plus,
  Target,
  DollarSign,
  Calendar,
  MapPin,
  Tag,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/loading";

const categories = [
  "Hardware Stores",
  "Suppliers", 
  "Training Schools",
  "Equipment Rental",
  "Cleaning Services",
  "Plumbing",
  "Electrical",
  "Moving Services",
  "Other"
];

const adTypes = [
  { value: "banner", label: "Banner Ad", description: "Display banner on relevant pages" },
  { value: "sponsored", label: "Sponsored Content", description: "Promoted in search results" },
  { value: "featured", label: "Featured Listing", description: "Featured placement in listings" },
  { value: "promoted", label: "Promoted Post", description: "Boosted visibility in feeds" }
];

const targetAudiences = [
  "Contractors",
  "Homeowners", 
  "Businesses",
  "Students",
  "Professionals",
  "General Public"
];

const priorities = [
  { value: "low", label: "Low Priority" },
  { value: "medium", label: "Medium Priority" },
  { value: "high", label: "High Priority" }
];

const statuses = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending Review" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "expired", label: "Expired" }
];

export default function EditAdPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    type: "",
    status: "draft" as "draft" | "pending" | "active" | "paused" | "expired" | "rejected",
    budget: "",
    targetAudience: [] as string[],
    startDate: "",
    endDate: "",
    location: {
      city: "",
      state: "",
      country: "USA"
    },
    tags: [] as string[],
    priority: "medium",
    images: [] as string[]
  });
  const [newTag, setNewTag] = useState("");
  const [newImage, setNewImage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchAd = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/ads/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Ad not found');
        }

        const data = await response.json();
        setFormData({
          title: data.title || "",
          description: data.description || "",
          category: data.category || "",
          type: data.type || "",
          status: data.status || "draft",
          budget: data.budget?.toString() || "",
          targetAudience: data.targetAudience || [],
          startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : "",
          endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : "",
          location: data.location || { city: "", state: "", country: "USA" },
          tags: data.tags || [],
          priority: data.priority || "medium",
          images: data.images || []
        });
      } catch (error) {
        console.error('Error fetching ad:', error);
        // Fallback to mock data
        setFormData({
          title: "Premium Hardware Store - Downtown",
          description: "Your one-stop shop for all hardware needs. Quality tools, materials, and expert advice.",
          category: "Hardware Stores",
          type: "featured",
          status: "active",
          budget: "5000",
          targetAudience: ["contractors", "homeowners", "professionals"],
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          location: { city: "New York", state: "NY", country: "USA" },
          tags: ["hardware", "tools", "materials"],
          priority: "high",
          images: ["/api/placeholder/400/300", "/api/placeholder/400/300"]
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAd();
    }
  }, [params.id]);

  const handleInputChange = (field: string, value: any) => {
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

  const handleAudienceToggle = (audience: string) => {
    setFormData(prev => ({
      ...prev,
      targetAudience: prev.targetAudience.includes(audience)
        ? prev.targetAudience.filter(a => a !== audience)
        : [...prev.targetAudience, audience]
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
    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      newErrors.budget = "Valid budget is required";
    }
    if (formData.targetAudience.length === 0) {
      newErrors.targetAudience = "At least one target audience is required";
    }
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
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
      const response = await fetch(`/api/ads/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          budget: parseFloat(formData.budget)
        }),
      });

      if (response.ok) {
        router.push(`/ads/${params.id}`);
      } else {
        const errorData = await response.json();
        console.error('Error updating ad:', errorData);
      }
    } catch (error) {
      console.error('Error updating ad:', error);
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
          { label: 'Ads', href: '/ads' },
          { label: 'Edit Ad', href: `/ads/${params.id}/edit` }
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Ad</h1>
            <p className="text-gray-600">Update your advertising campaign</p>
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
                    options={categories.map(cat => ({ value: cat, label: cat }))}
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

          {/* Budget and Duration */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget & Duration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget (USD) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    placeholder="Enter your budget"
                    className={`pl-10 ${errors.budget ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.budget && (
                  <p className="text-red-500 text-sm mt-1">{errors.budget}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
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
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className={errors.endDate ? 'border-red-500' : ''}
                  />
                  {errors.endDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Target Audience */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Target Audience</h2>
            <div className="space-y-3">
              {targetAudiences.map((audience) => (
                <label key={audience} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.targetAudience.includes(audience)}
                    onChange={() => handleAudienceToggle(audience)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{audience}</span>
                </label>
              ))}
              {errors.targetAudience && (
                <p className="text-red-500 text-sm mt-1">{errors.targetAudience}</p>
              )}
            </div>
          </Card>

          {/* Location */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
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
                />
                <Button onClick={handleAddImage} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Ad image ${index + 1}`}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ad Preview</h3>
            <div className="border rounded-lg p-4 bg-gray-50">
              {formData.images.length > 0 && (
                <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden">
                  <img
                    src={formData.images[0]}
                    alt="Ad preview"
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
                <p>Category: {formData.category || "Not selected"}</p>
                <p>Type: {formData.type || "Not selected"}</p>
                <p>Budget: ${formData.budget || "0"}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Settings</h3>
            <div className="space-y-3">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange('priority', value)}
                  options={priorities}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
