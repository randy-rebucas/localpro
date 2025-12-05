"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft,
  Upload,
  X,
  Plus,
  Clock,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  FileText,
  Package,
  Shield,
  Calendar,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { type PrefilledFormData, generateDescriptionFromTitle } from "@/lib/ai-utils";
import { Sparkles } from "lucide-react";
import { useToast, ToastContainer } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";

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

const FORM_STEPS = [
  { id: 1, title: "Basic Information", icon: FileText, description: "Tell us about your service" },
  { id: 2, title: "Pricing & Duration", icon: Clock, description: "Set your rates and time estimates" },
  { id: 3, title: "Service Details", icon: Package, description: "Features, areas, and requirements" },
  { id: 4, title: "Warranty & Insurance", icon: Shield, description: "Protection and guarantees" },
  { id: 5, title: "Packages & Add-ons", icon: Package, description: "Service bundles and extras" },
  { id: 6, title: "Availability", icon: Calendar, description: "When are you available?" },
  { id: 7, title: "Images & Review", icon: ImageIcon, description: "Add photos and finalize" },
];

export default function CreateServicePage() {
  const router = useRouter();
  const { settings: appSettings } = useAppSettings();
  const { toasts, success, error: showErrorToast, removeToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<ServiceForm>({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    pricing: {
      type: "hourly",
      basePrice: 0,
      currency: "PHP"
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
  const [aiGenerating, setAiGenerating] = useState(false);
  const isSubmittingRef = useRef(false);
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
      { value: "residential_cleaning", label: "Residential Cleaning" },
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
    ],
    landscaping: [
      { value: "lawn_care", label: "Lawn Care" },
      { value: "garden_design", label: "Garden Design" },
      { value: "tree_services", label: "Tree Services" },
      { value: "irrigation", label: "Irrigation" }
    ],
    maintenance: [
      { value: "preventive", label: "Preventive Maintenance" },
      { value: "routine", label: "Routine Maintenance" },
      { value: "inspection", label: "Inspection" }
    ],
    repair: [
      { value: "appliance", label: "Appliance Repair" },
      { value: "furniture", label: "Furniture Repair" },
      { value: "general", label: "General Repair" }
    ],
    consultation: [
      { value: "design", label: "Design Consultation" },
      { value: "technical", label: "Technical Consultation" },
      { value: "general", label: "General Consultation" }
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
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    // Clear general error when user makes changes
    if (error && error.includes("Please fix")) {
      setError(null);
    }
  };

  const handlePricingChange = (field: string, value: string | number) => {
    setForm(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [field]: value
      }
    }));
    // Clear related field errors
    if (fieldErrors.basePrice || fieldErrors.pricingType) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.basePrice;
        delete newErrors.pricingType;
        return newErrors;
      });
    }
    if (error && error.includes("Please fix")) {
      setError(null);
    }
  };

  const handleDurationChange = (field: string, value: number) => {
    setForm(prev => ({
      ...prev,
      estimatedDuration: {
        ...prev.estimatedDuration,
        [field]: value
      }
    }));
    // Clear related field errors
    if (fieldErrors.minDuration || fieldErrors.maxDuration) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.minDuration;
        delete newErrors.maxDuration;
        return newErrors;
      });
    }
    if (error && error.includes("Please fix")) {
      setError(null);
    }
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

  const handleGenerateDescription = async () => {
    if (!form.title.trim()) {
      setError("Please enter a service title first");
      return;
    }

    setAiGenerating(true);
    setError(null);

    try {
      // Build params - title is required, category and serviceType are optional
      const params: {
        title: string;
        category?: string;
        serviceType?: string;
      } = {
        title: form.title.trim(),
      };

      // Add optional parameters if they have values
      if (form.category && form.category !== "") {
        params.category = form.category;
      }

      if (form.serviceType && form.serviceType !== "") {
        params.serviceType = form.serviceType;
      }

      const response = await generateDescriptionFromTitle(params);

      // Extract only the description from response
      // The response should have the structure: { success, message, data: { description, ... } }
      let description: string | null = null;
      
      if (response && response.data) {
        // Check if response.data is an object with description property
        if (typeof response.data === 'object' && 'description' in response.data) {
          description = response.data.description;
        }
      }

      if (description && typeof description === 'string' && description.trim() !== '') {
        handleInputChange("description", description);
      } else {
        setError("No description was generated. Please try again.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate description";
      
      // Provide more specific error messages
      if (errorMessage.includes("400")) {
        setError("Invalid request. Please check your service title.");
      } else if (errorMessage.includes("404")) {
        setError("AI description feature is not available yet.");
      } else {
        setError(errorMessage);
      }
      
      logger.error("AI description generation error", err instanceof Error ? err : new Error(String(err)));
    } finally {
      setAiGenerating(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleAIPrefill = (prefilledData: PrefilledFormData) => {
    setForm(prev => ({
      ...prev,
      title: prefilledData.title || prev.title,
      description: prefilledData.description || prev.description,
      category: prefilledData.category || prev.category,
      subcategory: prefilledData.subcategory || prev.subcategory,
      serviceType: prefilledData.serviceType || prev.serviceType,
      teamSize: prefilledData.teamSize || prev.teamSize,
      pricing: {
        type: prefilledData.pricing?.type || prev.pricing.type,
        basePrice: prefilledData.pricing?.basePrice || prev.pricing.basePrice,
        currency: prefilledData.pricing?.currency || prev.pricing.currency,
      },
      estimatedDuration: {
        min: prefilledData.estimatedDuration?.min || prev.estimatedDuration.min,
        max: prefilledData.estimatedDuration?.max || prev.estimatedDuration.max,
      },
      serviceArea: prefilledData.serviceArea || prev.serviceArea,
      features: prefilledData.features || prev.features,
      requirements: prefilledData.requirements || prev.requirements,
      equipmentProvided: prefilledData.equipmentProvided ?? prev.equipmentProvided,
      materialsIncluded: prefilledData.materialsIncluded ?? prev.materialsIncluded,
      warranty: {
        hasWarranty: prefilledData.warranty?.hasWarranty ?? prev.warranty.hasWarranty,
        duration: prefilledData.warranty?.duration || prev.warranty.duration,
        description: prefilledData.warranty?.description || prev.warranty.description,
      },
      insurance: {
        covered: prefilledData.insurance?.covered ?? prev.insurance.covered,
        coverageAmount: prefilledData.insurance?.coverageAmount || prev.insurance.coverageAmount,
      },
      emergencyService: {
        available: prefilledData.emergencyService?.available ?? prev.emergencyService.available,
        surcharge: prefilledData.emergencyService?.surcharge || prev.emergencyService.surcharge,
        responseTime: prefilledData.emergencyService?.responseTime || prev.emergencyService.responseTime,
      },
      servicePackages: prefilledData.servicePackages || prev.servicePackages,
      addOns: prefilledData.addOns || prev.addOns,
      availability: {
        timezone: prefilledData.availability?.timezone || prev.availability.timezone,
        schedule: prefilledData.availability?.schedule || prev.availability.schedule,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission - check both loading state and ref
    if (loading || isSubmittingRef.current) {
      return;
    }
    
    // Validate all required steps before submission
    // Save current step
    const savedStep = currentStep;
    
    // Validate Step 1
    setCurrentStep(1);
    const step1Validation = validateCurrentStep();
    if (!step1Validation.isValid) {
      setFieldErrors(step1Validation.errors);
      setError("Please complete Step 1 (Basic Information) before submitting.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Validate Step 2
    setCurrentStep(2);
    const step2Validation = validateCurrentStep();
    if (!step2Validation.isValid) {
      setFieldErrors(step2Validation.errors);
      setError("Please complete Step 2 (Pricing & Duration) before submitting.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Return to last step if validation passes
    setCurrentStep(savedStep);
    
    // Set loading and ref immediately to prevent double submission
    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      if (!getApiToken()) {
        throw new Error('Please log in to create a service');
      }

      // Convert images to base64 strings for JSON payload
      const imagePromises = form.images.map((image) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(image);
        });
      });

      const imageBase64Strings = await Promise.all(imagePromises);

      // Build JSON payload matching the API structure
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        ...(form.subcategory && { subcategory: form.subcategory }),
        pricing: form.pricing,
        serviceArea: form.serviceArea,
        features: form.features,
        requirements: form.requirements,
        serviceType: form.serviceType,
        estimatedDuration: form.estimatedDuration,
        teamSize: form.teamSize,
        equipmentProvided: form.equipmentProvided,
        materialsIncluded: form.materialsIncluded,
        warranty: form.warranty,
        insurance: form.insurance,
        emergencyService: form.emergencyService,
        servicePackages: form.servicePackages,
        addOns: form.addOns,
        availability: form.availability,
        isActive: form.isActive ?? true,
        ...(imageBase64Strings.length > 0 && { images: imageBase64Strings }),
      };
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceServices}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify(payload),
      }));

      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = `Failed to create service (Status: ${response.status} ${response.statusText})`;
        // Always try to get text first to avoid JSON parsing errors
        try {
          const textError = await response.text();
          
          // Filter out multipart boundaries and other non-meaningful content
          if (textError && !textError.startsWith('------') && textError.trim().length > 0) {
            // Try to parse as JSON if it looks like JSON
            if (textError.trim().startsWith('{') || textError.trim().startsWith('[')) {
              try {
                const parsed = JSON.parse(textError);
                if (parsed.message) {
                  errorMessage = parsed.message;
                } else if (parsed.error) {
                  errorMessage = parsed.error;
                } else if (parsed.errors && Array.isArray(parsed.errors)) {
                  errorMessage = parsed.errors.map((e: unknown) => {
                    const err = e as { message?: string; msg?: string };
                    return err.message || err.msg || String(e);
                  }).join(', ');
                } else if (parsed.details && Array.isArray(parsed.details)) {
                  errorMessage = parsed.details.map((d: unknown) => {
                    const det = d as { message?: string; msg?: string };
                    return det.message || det.msg || String(d);
                  }).join(', ');
                } else {
                  errorMessage = textError.substring(0, 200);
                }
              } catch {
                // Not valid JSON, use text as-is (limited length)
                errorMessage = textError.substring(0, 200);
              }
            } else {
              // Not JSON format, use text as error message (limited length)
              errorMessage = textError.substring(0, 200);
            }
          }
        } catch (textError) {
          // Could not read response body, use status-based message (already set)
          logger.error("Could not read error response body", textError instanceof Error ? textError : new Error(String(textError)));
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      
      // Handle nested response structure: { success: true, data: { _id: ... } }
      const serviceId = responseData.data?._id || responseData._id || responseData.id;
      
      if (!serviceId) {
        throw new Error("Service ID not found in response");
      }
      
      // Show success toast
      success("Service created successfully! Redirecting...", 3000);
      
      // Keep button disabled and navigate after a short delay to show the toast
      setTimeout(() => {
        router.push(`/marketplace/services/${serviceId}`);
      }, 500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Error creating service", error instanceof Error ? error : new Error(String(error)));
      setError(errorMessage || "Failed to create service. Please try again.");
      // Show error toast
      showErrorToast(errorMessage || "Failed to create service. Please try again.");
      // Reset submission flag on error so user can retry
      isSubmittingRef.current = false;
      setLoading(false);
    }
    // Note: We don't reset loading/isSubmittingRef on success because we're navigating away
  };

  const totalSteps = FORM_STEPS.length;
  const progress = (currentStep / totalSteps) * 100;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keyboard shortcuts when user is typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Ctrl/Cmd + Enter to proceed (if valid)
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (currentStep < totalSteps && canProceedToNext()) {
          handleNext();
        } else if (currentStep === totalSteps && canProceedToNext()) {
          const formElement = document.querySelector('form');
          if (formElement) {
            formElement.requestSubmit();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, totalSteps]);

  const validateCurrentStep = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    
    switch (currentStep) {
      case 1:
        if (!form.title.trim()) errors.title = "Service title is required";
        if (!form.description.trim()) errors.description = "Description is required";
        if (!form.category) errors.category = "Category is required";
        // Subcategory is only required if subcategories exist for the selected category
        const hasSubcategories = form.category && subcategories[form.category as keyof typeof subcategories]?.length > 0;
        if (hasSubcategories && !form.subcategory) {
          errors.subcategory = "Subcategory is required";
        }
        if (!form.serviceType) errors.serviceType = "Service type is required";
        if (form.teamSize <= 0) errors.teamSize = "Team size must be at least 1";
        break;
      case 2:
        if (form.pricing.basePrice <= 0) errors.basePrice = "Base price must be greater than 0";
        if (!form.pricing.type) errors.pricingType = "Pricing type is required";
        if (form.estimatedDuration.min <= 0) errors.minDuration = "Minimum duration must be greater than 0";
        if (form.estimatedDuration.max <= 0) errors.maxDuration = "Maximum duration must be greater than 0";
        if (form.estimatedDuration.max < form.estimatedDuration.min) {
          errors.maxDuration = "Maximum duration must be greater than or equal to minimum duration";
        }
        break;
      default:
        // Steps 3-7 are optional
        break;
    }
    
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleNext = () => {
    const validation = validateCurrentStep();
    
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      const errorMessages = Object.values(validation.errors);
      setError(`Please fix the following errors: ${errorMessages.join(", ")}`);
      // Scroll to first error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Clear errors when proceeding
    setFieldErrors({});
    setError(null);
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null); // Clear errors when going back
      setFieldErrors({}); // Clear field errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        // Step 1: Basic Information - all required fields
        // Subcategory is only required if subcategories exist for the selected category
        const hasSubcategories = form.category && subcategories[form.category as keyof typeof subcategories]?.length > 0;
        const subcategoryValid = !hasSubcategories || form.subcategory !== "";
        
        return (
          form.title.trim() !== "" && 
          form.description.trim() !== "" && 
          form.category !== "" && 
          subcategoryValid &&
          form.serviceType !== "" &&
          form.teamSize > 0
        );
      case 2:
        // Step 2: Pricing & Duration - all required fields
        return (
          form.pricing.basePrice > 0 && 
          form.pricing.type !== "" &&
          form.estimatedDuration.min > 0 && 
          form.estimatedDuration.max > 0 &&
          form.estimatedDuration.max >= form.estimatedDuration.min
        );
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // Steps 3-7 are optional, can always proceed
        return true;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            {/* AI Form Prefiller - Only show on first step */}
            {/* <AIFormPrefiller onPrefill={handleAIPrefill} /> */}
            
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
                  {!form.title.trim() && (
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a clear, descriptive title for your service (e.g., &quot;Professional House Cleaning&quot; or &quot;24/7 Emergency Plumbing&quot;)
                    </p>
                  )}
                  {form.title.trim() && (
                    <p className="text-xs text-gray-500 mt-1">
                      Enter your service title and click &quot;Generate with AI&quot; to auto-fill the form
                    </p>
                  )}
                </div>

                <div>
                  <Select
                    label="Category *"
                    value={form.category}
                    onValueChange={(value) => {
                      handleInputChange("category", value);
                      // Reset subcategory when category changes
                      if (form.category !== value) {
                        handleInputChange("subcategory", "");
                      }
                    }}
                    options={categories}
                    placeholder="Select a category..."
                    className={fieldErrors.category ? "border-red-300" : ""}
                  />
                  {fieldErrors.category && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.category}</p>
                  )}
                </div>

                <div>
                  <Select
                    label={subcategories[form.category as keyof typeof subcategories]?.length > 0 ? "Subcategory *" : "Subcategory"}
                    value={form.subcategory}
                    onValueChange={(value) => handleInputChange("subcategory", value)}
                    options={subcategories[form.category as keyof typeof subcategories] || []}
                    placeholder={form.category ? "Select a subcategory..." : "Select a category first"}
                    disabled={!form.category}
                    className={fieldErrors.subcategory ? "border-red-300" : ""}
                  />
                  {fieldErrors.subcategory && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.subcategory}</p>
                  )}
                  {!form.category && (
                    <p className="text-xs text-gray-500 mt-1">Please select a category first</p>
                  )}
                  {form.category && (!subcategories[form.category as keyof typeof subcategories] || subcategories[form.category as keyof typeof subcategories].length === 0) && (
                    <p className="text-xs text-gray-500 mt-1">No subcategories available for this category (optional)</p>
                  )}
                </div>

                <div>
                  <Select
                    label="Service Type *"
                    value={form.serviceType}
                    onValueChange={(value) => handleInputChange("serviceType", value)}
                    options={serviceTypes}
                    className={fieldErrors.serviceType ? "border-red-300" : ""}
                  />
                  {fieldErrors.serviceType && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.serviceType}</p>
                  )}
                </div>

                <div>
                  <Input
                    label="Team Size *"
                    type="number"
                    required
                    min="1"
                    value={form.teamSize}
                    onChange={(e) => handleInputChange("teamSize", Number(e.target.value) || 0)}
                    placeholder="1"
                    className={fieldErrors.teamSize ? "border-red-300 focus:ring-red-500" : ""}
                  />
                  {fieldErrors.teamSize && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.teamSize}</p>
                  )}
                  {!fieldErrors.teamSize && (
                    <p className="text-xs text-gray-500 mt-1">
                      Number of people who will provide this service
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Description *
                    </label>
                    {form.title.trim() && (
                      <button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={aiGenerating}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-purple-500/30 hover:shadow-lg hover:scale-105 text-xs font-medium"
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
                  <Textarea
                    required
                    rows={4}
                    value={form.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe your service in detail..."
                    className={fieldErrors.description ? "border-red-300 focus:ring-red-500" : ""}
                  />
                  {fieldErrors.description && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.description}</p>
                  )}
                  {!form.description.trim() && !fieldErrors.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {form.title.trim() 
                        ? 'Click "Generate with AI" to create a description, or write a detailed description of what your service includes, your experience, and what makes you stand out'
                        : 'Provide a detailed description of your service, including what it includes, your experience, and what makes you stand out'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      case 2:
        return (
          <div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">Pricing & Duration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Select
                  label="Pricing Type *"
                  value={form.pricing.type}
                  onValueChange={(value) => handlePricingChange("type", value)}
                  options={pricingTypes}
                  className={fieldErrors.pricingType ? "border-red-300" : ""}
                />
                {fieldErrors.pricingType && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.pricingType}</p>
                )}
              </div>

              <div>
                <Input
                  label="Base Price (PHP) *"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.pricing.basePrice}
                  onChange={(e) => handlePricingChange("basePrice", Number(e.target.value) || 0)}
                  placeholder="0.00"
                  leftIcon={<span className="text-gray-500 font-semibold">₱</span>}
                  className={fieldErrors.basePrice ? "border-red-300 focus:ring-red-500" : ""}
                />
                {fieldErrors.basePrice && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.basePrice}</p>
                )}
                {!fieldErrors.basePrice && (
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the base price in your selected currency. This will be shown as {form.pricing.type === "hourly" ? "per hour" : form.pricing.type === "fixed" ? "fixed price" : form.pricing.type === "per_sqft" ? "per square foot" : "per room"}
                  </p>
                )}
              </div>

              <div>
                <Input
                  label="Currency"
                  type="text"
                  value={form.pricing.currency}
                  onChange={(e) => handlePricingChange("currency", e.target.value)}
                  placeholder="PHP"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported currency: PHP
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Estimated Duration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Minimum Duration (hours) *"
                    type="number"
                    required
                    min="0.5"
                    step="0.5"
                    value={form.estimatedDuration.min}
                    onChange={(e) => handleDurationChange("min", Number(e.target.value) || 0)}
                    placeholder="1"
                    leftIcon={<Clock />}
                    className={fieldErrors.minDuration ? "border-red-300 focus:ring-red-500" : ""}
                  />
                  {fieldErrors.minDuration && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.minDuration}</p>
                  )}
                  {!fieldErrors.minDuration && (
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum time required to complete the service (e.g., 1, 2.5, 4 hours)
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    label="Maximum Duration (hours) *"
                    type="number"
                    required
                    min="0.5"
                    step="0.5"
                    value={form.estimatedDuration.max}
                    onChange={(e) => handleDurationChange("max", Number(e.target.value) || 0)}
                    placeholder="8"
                    leftIcon={<Clock />}
                    className={fieldErrors.maxDuration ? "border-red-300 focus:ring-red-500" : ""}
                  />
                  {fieldErrors.maxDuration && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.maxDuration}</p>
                  )}
                  {!fieldErrors.maxDuration && (
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum time it might take to complete the service. Must be greater than or equal to minimum duration.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">Service Details</h2>
            
            {/* Service Areas */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Service Areas</h3>
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
                    <p className="text-xs text-gray-500 mt-1">
                      Enter postal codes, zip codes, city names, or area names where you provide service. Press Enter or click + to add.
                    </p>
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
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Equipment & Materials</h3>
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
              <h3 className="text-lg font-semibold text-gray-700 mb-4">What&apos;s Included</h3>
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
                    <p className="text-xs text-gray-500 mt-1">
                      List what&apos;s included in your service (e.g., &quot;All cleaning supplies provided&quot;, &quot;Free consultation&quot;). Press Enter or click + to add.
                    </p>
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
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Requirements</h3>
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
                    <p className="text-xs text-gray-500 mt-1">
                      List any requirements clients need to meet (e.g., &quot;Access to water source&quot;, &quot;Parking space required&quot;). Press Enter or click + to add.
                    </p>
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
          </div>
        );
      case 4:
        return (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">Warranty & Insurance</h2>
            
            {/* Warranty */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Warranty</h3>
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
                      <p className="text-xs text-gray-500 mt-1">
                        Number of days the warranty is valid (e.g., 30, 60, 90 days)
                      </p>
                    </div>
                    <div>
                      <Input
                        label="Warranty Description"
                        type="text"
                        value={form.warranty.description}
                        onChange={(e) => handleWarrantyChange("description", e.target.value)}
                        placeholder="e.g., 30-day satisfaction guarantee"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Describe what the warranty covers (e.g., &quot;30-day satisfaction guarantee&quot;, &quot;Workmanship warranty&quot;)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Insurance */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Insurance</h3>
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
                      label="Coverage Amount (PHP)"
                      type="number"
                      min="0"
                      value={form.insurance.coverageAmount}
                      onChange={(e) => handleInsuranceChange("coverageAmount", Number(e.target.value))}
                      placeholder="1000000"
                      leftIcon={<span className="text-gray-500 font-semibold">₱</span>}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Total insurance coverage amount in PHP (e.g., 1000000 for ₱1,000,000)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Service */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Emergency Service</h3>
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
                      <p className="text-xs text-gray-500 mt-1">
                        How quickly you can respond to emergency calls (e.g., &quot;within 2 hours&quot;, &quot;within 30 minutes&quot;)
                      </p>
                    </div>
                    <div>
                      <Input
                        label="Emergency Surcharge (PHP)"
                        type="number"
                        min="0"
                        value={form.emergencyService.surcharge}
                        onChange={(e) => handleEmergencyServiceChange("surcharge", Number(e.target.value))}
                        placeholder="50"
                        leftIcon={<span className="text-gray-500 font-semibold">₱</span>}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Additional fee for emergency service in PHP (e.g., 500 for ₱500)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">Packages & Add-ons</h2>
            
            {/* Service Packages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Service Packages</h3>
              <div className="space-y-6">
                {/* Add New Package */}
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gradient-to-br from-white to-gray-50/50 shadow-sm">
                  <h4 className="text-md font-medium text-gray-700 mb-4">Add New Package</h4>
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
                        label="Price (PHP)"
                        type="number"
                        min="0"
                        value={newPackage.price}
                        onChange={(e) => setNewPackage(prev => ({ ...prev, price: Number(e.target.value) }))}
                        placeholder="75"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Package price in your selected currency
                      </p>
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
                      <p className="text-xs text-gray-500 mt-1">
                        Estimated duration to complete this package in hours (e.g., 3, 4.5, 8)
                      </p>
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
                    <h4 className="text-md font-medium text-gray-700">Added Packages</h4>
                    {form.servicePackages.map((pkg, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-medium text-gray-700">{pkg.name}</h5>
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
                          <span>{formatCurrency(pkg.price, 'PHP', { appSettings })} • {pkg.duration}h</span>
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
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Add-ons</h3>
              <div className="space-y-6">
                {/* Add New Add-on */}
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-gradient-to-br from-white to-gray-50/50 shadow-sm">
                  <h4 className="text-md font-medium text-gray-700 mb-4">Add New Add-on</h4>
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
                        label="Price (PHP)"
                        type="number"
                        min="0"
                        value={newAddon.price}
                        onChange={(e) => setNewAddon(prev => ({ ...prev, price: Number(e.target.value) }))}
                        placeholder="25"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Add-on price in your selected currency
                      </p>
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
                    <h4 className="text-md font-medium text-gray-700">Added Add-ons</h4>
                    {form.addOns.map((addon, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-medium text-gray-700">{addon.name}</h5>
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
                          <span>{formatCurrency(addon.price, 'PHP', { appSettings })}</span>
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
          </div>
        );
      case 6:
        return (
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
                  <p className="text-xs text-gray-500 mt-1">
                    Your timezone in IANA format (e.g., &quot;Asia/Manila&quot;, &quot;America/New_York&quot;, &quot;Europe/London&quot;)
                  </p>
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
        );
      case 7:
        return (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">Images & Final Review</h2>
            
            {/* Validation Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Form Validation Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className={`flex items-center gap-2 ${form.title.trim() && form.description.trim() && form.category && form.subcategory && form.serviceType && form.teamSize > 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {form.title.trim() && form.description.trim() && form.category && form.subcategory && form.serviceType && form.teamSize > 0 ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  <span>Step 1: Basic Information</span>
                </div>
                <div className={`flex items-center gap-2 ${form.pricing.basePrice > 0 && form.pricing.type && form.estimatedDuration.min > 0 && form.estimatedDuration.max > 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {form.pricing.basePrice > 0 && form.pricing.type && form.estimatedDuration.min > 0 && form.estimatedDuration.max > 0 ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  <span>Step 2: Pricing & Duration</span>
                </div>
              </div>
            </div>
            
            {/* Quick Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Service Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Service Title:</span>
                  <p className="font-medium text-gray-900">{form.title || "Not set"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Category:</span>
                  <p className="font-medium text-gray-900">{form.category ? categories.find(c => c.value === form.category)?.label || form.category : "Not set"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Service Type:</span>
                  <p className="font-medium text-gray-900">{form.serviceType ? serviceTypes.find(s => s.value === form.serviceType)?.label || form.serviceType : "Not set"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Pricing:</span>
                  <p className="font-medium text-gray-900">
                    {form.pricing.basePrice > 0 
                      ? `${formatCurrency(form.pricing.basePrice, 'PHP', { appSettings })} ${form.pricing.type ? `(${pricingTypes.find(p => p.value === form.pricing.type)?.label || form.pricing.type})` : ''}`
                      : "Not set"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <p className="font-medium text-gray-900">
                    {form.estimatedDuration.min > 0 && form.estimatedDuration.max > 0
                      ? `${form.estimatedDuration.min}-${form.estimatedDuration.max} hours`
                      : "Not set"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Team Size:</span>
                  <p className="font-medium text-gray-900">{form.teamSize > 0 ? `${form.teamSize} ${form.teamSize === 1 ? 'person' : 'people'}` : "Not set"}</p>
                </div>
              </div>
            </div>
            
            {/* Images */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Service Images</h3>
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

            {/* Service Status */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Service Status</h3>
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

            {/* Review Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Review Summary</h3>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Service Title:</span>
                    <p className="text-gray-600">{form.title || "Not set"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <p className="text-gray-600">{categories.find(c => c.value === form.category)?.label || "Not set"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Pricing:</span>
                    <p className="text-gray-600">{formatCurrency(form.pricing.basePrice, 'PHP', { appSettings })} ({form.pricing.type})</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Duration:</span>
                    <p className="text-gray-600">{form.estimatedDuration.min}-{form.estimatedDuration.max} hours</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Service Areas:</span>
                    <p className="text-gray-600">{form.serviceArea.length} area(s)</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Features:</span>
                    <p className="text-gray-600">{form.features.length} feature(s)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} position="top-right" />
      
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/marketplace"
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            title="Back to marketplace"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Create New Service</h1>
            <p className="text-sm text-slate-400">Step {currentStep} of {totalSteps}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-900/80 rounded-xl shadow-sm p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">
              {FORM_STEPS[currentStep - 1]?.title}
            </span>
            <span className="text-sm text-slate-500">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="bg-slate-900/80 rounded-xl shadow-sm p-6 border border-slate-800">
          <div className="flex items-center justify-between">
            {FORM_STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                          : isActive
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-110'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 text-center max-w-[80px] ${
                      isActive ? 'text-emerald-600 font-semibold' : isCompleted ? 'text-emerald-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < FORM_STEPS.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 transition-all ${
                        isCompleted ? 'bg-emerald-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              {/* Step Content */}
              {renderStepContent()}

              {/* Error Message */}
              {error && (
                <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-lg p-4 shadow-md">
                  <p className="text-red-600 font-medium">{error}</p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md hover:scale-105 font-medium flex items-center gap-2"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Previous
                    </button>
                  )}
                </div>
                <div className="flex gap-4">
                  <Link
                    href="/marketplace"
                    className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md hover:scale-105 font-medium"
                  >
                    Cancel
                  </Link>
                  {currentStep < totalSteps ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!canProceedToNext()}
                      className={`px-6 py-2.5 rounded-lg transition-all shadow-lg font-semibold flex items-center gap-2 ${
                        canProceedToNext()
                          ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl hover:scale-105 shadow-emerald-500/30"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
                      }`}
                    >
                      Next
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading || isSubmittingRef.current || !canProceedToNext()}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 font-semibold disabled:hover:scale-100 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Create Service
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
