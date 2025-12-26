"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Eye,
  X,
  Plus,
  MapPin,
  Coins,
  CheckCircle,
  Star,
  Settings,
  Package,
  Truck,
  ImageIcon,
  Tag,
  Info,
  RefreshCw,
  Upload,
  Loader2,
  Sparkles
} from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";

const categories = [
  { value: "cleaning_supplies", label: "Cleaning Supplies" },
  { value: "tools", label: "Tools & Equipment" },
  { value: "materials", label: "Building Materials" },
  { value: "safety_gear", label: "Safety Equipment" },
  { value: "chemicals", label: "Chemicals" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other" }
];

const subcategories: Record<string, { value: string; label: string }[]> = {
  cleaning_supplies: [
    { value: "cloths", label: "Cloths & Towels" },
    { value: "solutions", label: "Cleaning Solutions" },
    { value: "kits", label: "Cleaning Kits" },
    { value: "mops", label: "Mops & Brooms" },
    { value: "other", label: "Other" }
  ],
  tools: [
    { value: "hand_tools", label: "Hand Tools" },
    { value: "power_tools", label: "Power Tools" },
    { value: "measuring", label: "Measuring Tools" },
    { value: "other", label: "Other" }
  ],
  materials: [
    { value: "construction", label: "Construction" },
    { value: "finishing", label: "Finishing" },
    { value: "plumbing", label: "Plumbing" },
    { value: "electrical", label: "Electrical" },
    { value: "other", label: "Other" }
  ],
  safety_gear: [
    { value: "ppe", label: "PPE" },
    { value: "first_aid", label: "First Aid" },
    { value: "protective", label: "Protective Gear" },
    { value: "other", label: "Other" }
  ],
  chemicals: [
    { value: "disinfectants", label: "Disinfectants" },
    { value: "degreasers", label: "Degreasers" },
    { value: "solvents", label: "Solvents" },
    { value: "other", label: "Other" }
  ],
  equipment: [
    { value: "vacuums", label: "Vacuums" },
    { value: "pressure_washers", label: "Pressure Washers" },
    { value: "floor_machines", label: "Floor Machines" },
    { value: "other", label: "Other" }
  ],
  other: [
    { value: "other", label: "Other" }
  ]
};

const types = [
  { value: "cleaning", label: "Cleaning", description: "Cleaning supplies and products" },
  { value: "tools", label: "Tools", description: "Hand tools and equipment" },
  { value: "materials", label: "Materials", description: "Building and construction materials" },
  { value: "equipment", label: "Equipment", description: "Heavy machinery and equipment" },
  { value: "subscription", label: "Subscription", description: "Recurring supply services" }
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

export default function CreateSupplyPage() {
  const router = useRouter();
  const { settings: appSettings } = useAppSettings();
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    type: "",
    status: "available" as "available" | "out-of-stock" | "discontinued" | "pre-order",
    price: "",
    originalPrice: "",
    currency: "PHP",
    unit: "piece",
    stock: "",
    minOrder: "1",
    maxOrder: "",
    sku: "",
    isSubscriptionEligible: false,
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
  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

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

  // AI Description Generator
  const generateDescription = async () => {
    if (!formData.name.trim()) {
      setErrors(prev => ({ ...prev, name: "Please enter a supply name first" }));
      return;
    }

    setIsGeneratingDescription(true);
    try {
      // Use the supplies-specific AI description generator endpoint
      const response = await fetch(`${API_BASE_URL}/api/supplies/generate-description`, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          category: formData.category || undefined,
          subcategory: formData.subcategory || undefined,
          brand: formData.specifications.brand || undefined,
          type: formData.type || undefined
        })
      }));

      if (response.ok) {
        const data = await response.json();
        const generatedDescription = data.description || data.data?.description;
        if (generatedDescription) {
          handleInputChange('description', generatedDescription);
          return;
        }
      }

      // Fallback: Generate a smart description locally based on name, category, and type
      const name = formData.name.trim();
      const category = categories.find(c => c.value === formData.category)?.label || 'supply';
      const subcategoryLabel = formData.subcategory 
        ? subcategories[formData.category]?.find(s => s.value === formData.subcategory)?.label 
        : '';
      
      // Smart description templates based on category
      const descriptions: Record<string, string[]> = {
        cleaning_supplies: [
          `${name} - Premium quality cleaning product designed for professional and commercial use. This ${subcategoryLabel || 'cleaning supply'} delivers exceptional performance with streak-free, residue-free results. Ideal for maintaining cleanliness in offices, homes, and industrial facilities. Safe, effective, and eco-friendly formula that gets the job done right.`,
          `Professional-grade ${name} for superior cleaning results. Our ${subcategoryLabel || 'cleaning product'} is trusted by cleaning professionals nationwide. Features fast-acting formula, pleasant scent, and long-lasting effectiveness. Perfect for daily maintenance or deep cleaning tasks.`
        ],
        tools: [
          `${name} - Durable and reliable tool built for professionals. This ${subcategoryLabel || 'tool'} features ergonomic design for comfortable extended use, premium materials for long-lasting durability, and precision engineering for optimal performance. Essential equipment for any serious professional.`,
          `High-quality ${name} designed for demanding applications. Features robust construction, easy maintenance, and superior performance. This ${subcategoryLabel || 'professional tool'} is backed by our quality guarantee.`
        ],
        materials: [
          `${name} - Top-quality ${subcategoryLabel || 'construction material'} for professional applications. Meets industry standards for durability, safety, and performance. Ideal for both commercial and residential projects. Reliable, consistent, and competitively priced.`,
          `Premium ${name} suitable for a wide range of applications. This ${subcategoryLabel || 'material'} offers excellent value, consistent quality, and reliable performance. Sourced from trusted manufacturers.`
        ],
        equipment: [
          `${name} - Professional-grade ${subcategoryLabel || 'equipment'} engineered for maximum efficiency and reliability. Features heavy-duty construction, user-friendly operation, and low maintenance requirements. Perfect for commercial and industrial applications.`,
          `Industrial-strength ${name} built to handle the toughest jobs. This ${subcategoryLabel || 'equipment'} delivers consistent performance, energy efficiency, and long service life. Includes warranty and technical support.`
        ],
        safety_gear: [
          `${name} - Certified ${subcategoryLabel || 'safety equipment'} that meets or exceeds industry safety standards. Provides reliable protection, comfortable fit, and durable construction. Essential for workplace safety compliance.`,
          `Professional ${name} designed for maximum protection and comfort. This ${subcategoryLabel || 'safety gear'} features high-quality materials, adjustable fit, and proven reliability in demanding environments.`
        ],
        chemicals: [
          `${name} - Industrial-grade ${subcategoryLabel || 'chemical product'} formulated for professional applications. Effective, reliable, and manufactured to strict quality standards. Includes safety data sheet and handling instructions.`,
          `Professional-strength ${name} for commercial and industrial use. This ${subcategoryLabel || 'chemical'} delivers consistent results while meeting all safety and environmental regulations.`
        ],
        default: [
          `${name} - High-quality ${category.toLowerCase()} product designed for professional use. Offers excellent value, reliable performance, and durable construction. Suitable for commercial and residential applications. Backed by our satisfaction guarantee.`,
          `Premium ${name} from a trusted supplier. This ${category.toLowerCase()} product features quality materials, competitive pricing, and consistent availability. Contact us for bulk orders and special pricing.`
        ]
      };

      const categoryDescriptions = descriptions[formData.category] || descriptions.default;
      const randomDescription = categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
      
      handleInputChange('description', randomDescription);
    } catch (error) {
      logger.error('Error generating description', error instanceof Error ? error : new Error(String(error)));
      // Use fallback description
      handleInputChange('description', `${formData.name} - Professional quality supply for commercial and residential use. Reliable, durable, and competitively priced. Contact us for more details and bulk pricing options.`);
    } finally {
      setIsGeneratingDescription(false);
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

  // Handle file selection for image upload
  const handleImageUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    
    // Filter valid image files
    const validFiles = fileArray.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max
      return isImage && isValidSize;
    });
    
    // Limit to 10 images total
    const remainingSlots = 10 - imageFiles.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);
    
    if (filesToAdd.length === 0) return;
    
    // Create preview URLs
    const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
    
    setImageFiles(prev => [...prev, ...filesToAdd]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleImageUpload(e.target.files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleImageUpload(e.dataTransfer.files);
    }
  };

  // Remove an uploaded image
  const handleRemoveImage = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
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

  const handleSave = async (mode: 'draft' | 'publish' = 'publish') => {
    // For draft, only validate name
    if (mode === 'publish' && !validateForm()) {
      alert('Please fill in all required fields before publishing.');
      return;
    }
    
    if (mode === 'draft' && !formData.name.trim()) {
      setErrors(prev => ({ ...prev, name: 'Name is required to save draft' }));
      alert('Please enter a supply name to save draft.');
      return;
    }

    setLoading(true);
    setIsUploadingImages(imageFiles.length > 0);
    
    try {
      if (!getApiToken()) {
        alert('Please log in to create a supply');
        throw new Error('Please log in to create a supply');
      }
      
      // Convert uploaded images to base64 strings
      let imageBase64Strings: string[] = [];
      if (imageFiles.length > 0) {
        const imageBase64Promises = imageFiles.map((file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        });
        
        imageBase64Strings = await Promise.all(imageBase64Promises);
      }
      
      setIsUploadingImages(false);
      
      // Build payload matching API response structure
      const payload = {
        name: formData.name,
        title: formData.name,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        brand: formData.specifications.brand || undefined,
        sku: formData.sku || undefined,
        status: mode === 'draft' ? 'draft' : 'active',
        pricing: {
          retailPrice: parseFloat(formData.price) || 0,
          wholesalePrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
          currency: formData.currency
        },
        inventory: {
          quantity: parseInt(formData.stock) || 0,
          minStock: parseInt(formData.minOrder) || 1,
          maxStock: formData.maxOrder ? parseInt(formData.maxOrder) : undefined,
          location: formData.location.address
        },
        specifications: {
          weight: formData.specifications.weight || undefined,
          dimensions: formData.specifications.dimensions || undefined,
          material: formData.specifications.material || undefined,
          color: formData.specifications.color || undefined,
          warranty: formData.specifications.warranty || undefined
        },
        images: imageBase64Strings.length > 0 ? imageBase64Strings : formData.images,
        tags: formData.tags,
        isFeatured: false,
        isSubscriptionEligible: formData.isSubscriptionEligible,
        features: formData.features,
        delivery: formData.delivery.available ? {
          available: true,
          estimatedDays: parseInt(formData.delivery.estimatedDays) || 3,
          cost: parseFloat(formData.delivery.cost) || 0,
          freeShippingThreshold: formData.delivery.freeShippingThreshold ? parseFloat(formData.delivery.freeShippingThreshold) : undefined
        } : { available: false }
      };
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.supplies}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify(payload),
      }));

      if (response.ok) {
        const data = await response.json();
        const supplyId = data.data?.supply?.id || data.id || data.data?.id;
        
        if (mode === 'draft') {
          alert('Draft saved successfully!');
          if (supplyId) {
            router.push(`/supplies/${supplyId}/edit`);
          }
        } else {
          alert('Supply published successfully!');
          router.push(`/supplies/${supplyId}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || 'Failed to save supply';
        alert(`Error: ${errorMessage}`);
        logger.error('Error creating supply', new Error('Supply creation failed'), { errorData, status: response.status });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      if (!errorMessage.includes('log in')) {
        alert(`Error: ${errorMessage}`);
      }
      logger.error('Error creating supply', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
      setIsUploadingImages(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/supplies"
            className="p-2.5 hover:bg-white rounded-lg transition-all border-2 border-transparent hover:border-gray-200 hover:shadow-sm"
            title="Back to supplies"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Package className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create New Supply</h1>
            <p className="text-sm text-gray-600">List your supplies and materials for sale</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 text-gray-700 font-medium transition-all"
            >
              <Eye className="w-4 h-4" />
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleSave('publish')}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-semibold shadow-lg shadow-emerald-500/30 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Publish
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-600" />
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Supply Name *
                  </label>
                  <input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter a descriptive name for your supply"
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Description *
                    </label>
                    <button
                      type="button"
                      onClick={generateDescription}
                      disabled={isGeneratingDescription || !formData.name.trim()}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                        isGeneratingDescription
                          ? 'bg-purple-100 text-purple-400 cursor-wait'
                          : formData.name.trim()
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-md hover:shadow-lg'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      title={formData.name.trim() ? 'Generate AI description' : 'Enter a supply name first'}
                    >
                      {isGeneratingDescription ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          AI Generate
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your supply item, its features, and what makes it special — or click 'AI Generate' to create one automatically"
                      rows={4}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white resize-none ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {isGeneratingDescription && (
                      <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                        <div className="flex items-center gap-2 text-purple-600">
                          <Sparkles className="w-5 h-5 animate-pulse" />
                          <span className="font-medium">Creating description...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Tip: Enter a supply name first, then click &quot;AI Generate&quot; for a professional description
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        handleInputChange('category', e.target.value);
                        handleInputChange('subcategory', '');
                      }}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subcategory
                    </label>
                    <select
                      value={formData.subcategory}
                      onChange={(e) => handleInputChange('subcategory', e.target.value)}
                      disabled={!formData.category}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select subcategory</option>
                      {formData.category && subcategories[formData.category]?.map(sub => (
                        <option key={sub.value} value={sub.value}>{sub.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white ${errors.type ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">Select type</option>
                      {types.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    {errors.type && (
                      <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      SKU / Product Code
                    </label>
                    <input
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      placeholder="e.g., MC-MFC-001"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                    />
                  </div>
                </div>

                {/* Subscription Eligible Toggle */}
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <input
                    type="checkbox"
                    id="subscriptionEligible"
                    checked={formData.isSubscriptionEligible}
                    onChange={(e) => handleInputChange('isSubscriptionEligible', e.target.checked)}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="subscriptionEligible" className="flex items-center gap-2 cursor-pointer">
                    <RefreshCw className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-gray-700">Subscription Eligible</span>
                    <span className="text-sm text-gray-500">- Allow customers to subscribe for regular deliveries</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-600" />
                Pricing & Inventory
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Retail Price *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold text-sm">₱</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="0.00"
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                      />
                    </div>
                    {errors.price && (
                      <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Wholesale Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold text-sm">₱</span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.originalPrice}
                        onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Unit
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => handleInputChange('unit', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                    >
                      {units.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', e.target.value)}
                      placeholder="0"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white ${errors.stock ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.stock && (
                      <p className="text-red-500 text-sm mt-1">{errors.stock}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Min Stock Alert
                    </label>
                    <input
                      type="number"
                      value={formData.minOrder}
                      onChange={(e) => handleInputChange('minOrder', e.target.value)}
                      placeholder="50"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Max Stock
                    </label>
                    <input
                      type="number"
                      value={formData.maxOrder}
                      onChange={(e) => handleInputChange('maxOrder', e.target.value)}
                      placeholder="500"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                    >
                      {statuses.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Location / Warehouse */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                Warehouse Location
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Warehouse / Storage Location *
                  </label>
                  <input
                    value={formData.location.address}
                    onChange={(e) => handleLocationChange('address', e.target.value)}
                    placeholder="e.g., Warehouse A, Storage Unit 5"
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      value={formData.location.city}
                      onChange={(e) => handleLocationChange('city', e.target.value)}
                      placeholder="Enter city"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      value={formData.location.state}
                      onChange={(e) => handleLocationChange('state', e.target.value)}
                      placeholder="Enter state"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      value={formData.location.zipCode}
                      onChange={(e) => handleLocationChange('zipCode', e.target.value)}
                      placeholder="Enter ZIP code"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                Specifications
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Brand
                    </label>
                    <input
                      value={formData.specifications.brand}
                      onChange={(e) => handleSpecificationChange('brand', e.target.value)}
                      placeholder="e.g., MicroClean"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Model
                    </label>
                    <input
                      value={formData.specifications.model}
                      onChange={(e) => handleSpecificationChange('model', e.target.value)}
                      placeholder="Enter model"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Weight
                    </label>
                    <input
                      value={formData.specifications.weight}
                      onChange={(e) => handleSpecificationChange('weight', e.target.value)}
                      placeholder="e.g., 0.5 lbs"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Dimensions
                    </label>
                    <input
                      value={formData.specifications.dimensions}
                      onChange={(e) => handleSpecificationChange('dimensions', e.target.value)}
                      placeholder="e.g., 16x16 inches"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Material
                    </label>
                    <input
                      value={formData.specifications.material}
                      onChange={(e) => handleSpecificationChange('material', e.target.value)}
                      placeholder="e.g., Microfiber"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Color
                    </label>
                    <input
                      value={formData.specifications.color}
                      onChange={(e) => handleSpecificationChange('color', e.target.value)}
                      placeholder="e.g., Blue"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Warranty
                    </label>
                    <input
                      value={formData.specifications.warranty}
                      onChange={(e) => handleSpecificationChange('warranty', e.target.value)}
                      placeholder="e.g., 6 months"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                Delivery Options
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <input
                    type="checkbox"
                    id="deliveryAvailable"
                    checked={formData.delivery.available}
                    onChange={(e) => handleDeliveryChange('available', e.target.checked)}
                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="deliveryAvailable" className="flex items-center gap-2 cursor-pointer">
                    <span className="font-medium text-gray-700">Delivery Available</span>
                    <span className="text-sm text-gray-500">- Enable shipping for this product</span>
                  </label>
                </div>

                {formData.delivery.available && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Estimated Days *
                      </label>
                      <input
                        type="number"
                        value={formData.delivery.estimatedDays}
                        onChange={(e) => handleDeliveryChange('estimatedDays', e.target.value)}
                        placeholder="3"
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white ${errors.estimatedDays ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      {errors.estimatedDays && (
                        <p className="text-red-500 text-sm mt-1">{errors.estimatedDays}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Delivery Cost
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold text-sm">₱</span>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.delivery.cost}
                          onChange={(e) => handleDeliveryChange('cost', e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Free Shipping Threshold
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold text-sm">₱</span>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.delivery.freeShippingThreshold}
                          onChange={(e) => handleDeliveryChange('freeShippingThreshold', e.target.value)}
                          placeholder="50.00"
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Features
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {features.map((feature) => (
                  <label
                    key={feature}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.features.includes(feature)
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.features.includes(feature)}
                      onChange={() => handleFeatureToggle(feature)}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className={`text-sm font-medium ${formData.features.includes(feature) ? 'text-emerald-700' : 'text-gray-700'}`}>
                      {feature}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                Tags
              </h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag (e.g., microfiber, reusable)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                      >
                        #{tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">Press Enter to add a tag. Tags help buyers find your product.</p>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                Product Images
              </h2>
              <div className="space-y-4">
                {/* Drag & Drop Upload Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50'
                  } ${imageFiles.length >= 10 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={imageFiles.length >= 10}
                  />
                  <div className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                      isDragging ? 'bg-emerald-200' : 'bg-emerald-100'
                    }`}>
                      <Upload className={`w-8 h-8 ${isDragging ? 'text-emerald-700' : 'text-emerald-600'}`} />
                    </div>
                    <p className="text-gray-700 font-medium mb-1">
                      {isDragging ? 'Drop images here' : 'Click or drag images to upload'}
                    </p>
                    <p className="text-gray-500 text-sm">PNG, JPG, WEBP up to 5MB each</p>
                    <p className="text-gray-400 text-xs mt-2">
                      {imageFiles.length}/10 images • First image will be the primary
                    </p>
                  </div>
                </div>
                
                {/* Upload Status */}
                {isUploadingImages && (
                  <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                    <span className="text-sm text-emerald-700 font-medium">Uploading images...</span>
                  </div>
                )}

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group rounded-xl overflow-hidden border-2 border-gray-200 hover:border-emerald-300 transition-colors">
                        <Image
                          src={preview}
                          alt={`Supply image ${index + 1}`}
                          width={400}
                          height={128}
                          className="w-full h-32 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 px-2 py-1 bg-emerald-600 text-white text-xs font-bold rounded shadow">
                            Primary
                          </span>
                        )}
                        <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                          {(imageFiles[index]?.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Empty State */}
                {imagePreviews.length === 0 && (
                  <div className="text-center py-2">
                    <p className="text-gray-400 text-sm">No images uploaded yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Sidebar */}
          <div className="space-y-6">
            {/* Live Preview Card */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-600" />
                Live Preview
              </h3>
              <div className="border-2 border-gray-100 rounded-xl overflow-hidden bg-gray-50">
                {/* Preview Image */}
                {imagePreviews.length > 0 ? (
                  <div className="aspect-[4/3] bg-gray-200 overflow-hidden">
                    <Image
                      src={imagePreviews[0]}
                      alt="Supply preview"
                      width={400}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                
                <div className="p-4">
                  <h4 className="font-bold text-gray-900 mb-2 line-clamp-2">
                    {formData.name || "Your Supply Name"}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {formData.description || "Your supply description will appear here..."}
                  </p>
                  
                  {/* Price Display */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl font-bold text-emerald-600">
                      {formatCurrency(parseFloat(formData.price) || 0, formData.currency || 'PHP', { appSettings })}
                    </span>
                    <span className="text-sm text-gray-500">/ {formData.unit}</span>
                  </div>
                  
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.category && (
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                        {categories.find(c => c.value === formData.category)?.label || formData.category}
                      </span>
                    )}
                    {formData.isSubscriptionEligible && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        <RefreshCw className="w-3 h-3" />
                        Subscribe
                      </span>
                    )}
                  </div>
                  
                  {/* Features */}
                  {formData.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {formData.features.slice(0, 3).map((feature) => (
                        <span
                          key={feature}
                          className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                      {formData.features.length > 3 && (
                        <span className="text-xs text-gray-500 px-1">
                          +{formData.features.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Quick Info */}
                  <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-200">
                    {formData.sku && <p>SKU: {formData.sku}</p>}
                    <p>Stock: {formData.stock || "0"} {formData.unit}s</p>
                    {formData.location.address && <p>Location: {formData.location.address}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips Card */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Tips</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Star className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">Use high-quality images to showcase your supply</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-accent/5 rounded-lg border border-accent/20">
                  <Coins className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">Set competitive pricing based on market rates</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">Accurate location helps buyers find you</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <Settings className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">Detailed specifications build trust</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
