"use client";

import { useState, useEffect, useCallback } from "react";
import type React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Shield,
  FileText,
  Image as ImageIcon,
  Settings,
  CheckCircle,
  Save,
  Plus,
  X,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  Globe,
  Phone,
  Mail,
  Award,
  Languages,
  Car,
  DollarSign as DollarIcon,
  Upload,
  X as XIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Service categories enum
const serviceCategoryEnum = z.enum([
  'cleaning',
  'plumbing',
  'electrical',
  'moving',
  'landscaping',
  'pest_control',
  'handyman',
  'painting',
  'carpentry',
  'other'
]);

// Provider type enum
const providerTypeEnum = z.enum(['individual', 'business', 'agency']);

// Business type enum
const businessTypeEnum = z.enum([
  'sole_proprietorship',
  'partnership',
  'llc',
  'corporation',
  'small_business',
  'medium_business',
  'large_business',
  'other'
]);

// Background check status enum
const backgroundCheckStatusEnum = z.enum(['pending', 'approved', 'rejected', 'not_required']);

// Day of week enum
const dayEnum = z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);

// Specialty schema
const specialtySchema = z.object({
  category: serviceCategoryEnum,
  subcategories: z.array(z.string()).optional(),
  experience: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  serviceAreas: z.array(z.object({
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().optional(),
    radius: z.number().min(0).optional(),
  })).min(1, "At least one service area is required"),
  certifications: z.array(z.object({
    name: z.string().optional(),
    issuer: z.string().optional(),
    issueDate: z.string().optional(),
    expiryDate: z.string().optional(),
    certificateNumber: z.string().optional(),
  })).optional(),
  skills: z.array(z.string()).optional(),
});

// Availability schema - can be array or object with day keys
const availabilitySchema = z.union([
  z.array(z.object({
    day: dayEnum,
    available: z.boolean(),
    start: z.string().optional(),
    end: z.string().optional(),
  })),
  z.record(dayEnum, z.object({
    available: z.boolean(),
    start: z.string().optional(),
    end: z.string().optional(),
  })),
]);

// Provider profile form schema
const providerProfileSchema = z.object({
  // Step 1: Profile Setup
  providerType: providerTypeEnum,
  
  // Step 2: Business Info (for business/agency)
  businessInfo: z.object({
    businessName: z.string().min(1, "Business name is required").optional(),
    businessType: businessTypeEnum.optional(),
    businessRegistration: z.string().optional(),
    taxId: z.string().optional(),
    businessAddress: z.object({
      street: z.string().optional(),
      city: z.string().min(1, "City is required").optional(),
      state: z.string().min(1, "State is required").optional(),
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
    yearEstablished: z.number().optional(),
    numberOfEmployees: z.number().optional(),
  }).optional(),
  
  // Step 3: Professional Info
  professionalInfo: z.object({
    specialties: z.array(specialtySchema).min(1, "At least one specialty is required"),
    languages: z.array(z.string()).min(1, "At least one language is required"),
    availability: availabilitySchema.optional(),
    emergencyServices: z.boolean().optional(),
    travelDistance: z.number().min(0).optional(),
    minimumJobValue: z.number().min(0).optional(),
    maximumJobValue: z.number().min(0).optional(),
  }),
  
  // Step 4: Verification
  verification: z.object({
    identityVerified: z.boolean().optional(),
    businessVerified: z.boolean().optional(),
    backgroundCheck: z.object({
      status: backgroundCheckStatusEnum.optional(),
      dateCompleted: z.string().optional(),
      reportId: z.string().optional(),
    }).optional(),
    insurance: z.object({
      hasInsurance: z.boolean(),
      insuranceProvider: z.string().optional(),
      policyNumber: z.string().optional(),
      coverageAmount: z.number().optional(),
      expiryDate: z.string().optional(),
      documents: z.array(z.string()).optional(),
    }).optional(),
    licenses: z.array(z.object({
      type: z.string().optional(),
      number: z.string().optional(),
      issuingAuthority: z.string().optional(),
      issueDate: z.string().optional(),
      expiryDate: z.string().optional(),
      documents: z.array(z.string()).optional(),
    })).optional(),
    references: z.array(z.object({
      name: z.string().optional(),
      relationship: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      company: z.string().optional(),
      verified: z.boolean().optional(),
    })).optional(),
  }).optional(),
  
  // Step 5: Documents (handled via upload API)
  // Step 6: Portfolio
  portfolio: z.object({
    images: z.array(z.string()).optional(),
    videos: z.array(z.string()).optional(),
    descriptions: z.array(z.string()).optional(),
    beforeAfter: z.array(z.object({
      before: z.string().optional(),
      after: z.string().optional(),
      description: z.string().optional(),
    })).optional(),
  }).optional(),
  
  // Step 7: Preferences
  preferences: z.object({
    notificationSettings: z.object({
      email: z.boolean().optional(),
      sms: z.boolean().optional(),
      push: z.boolean().optional(),
    }).optional(),
    jobPreferences: z.object({
      autoAccept: z.boolean().optional(),
      preferredJobTypes: z.array(z.string()).optional(),
      minimumJobValue: z.number().optional(),
      maximumJobValue: z.number().optional(),
    }).optional(),
    communicationPreferences: z.object({
      preferredMethod: z.string().optional(),
      responseTime: z.string().optional(),
    }).optional(),
  }).optional(),
});

type ProviderProfileForm = z.infer<typeof providerProfileSchema>;

interface ProviderProfileFormProps {
  initialData?: {
    providerType?: 'individual' | 'business' | 'agency';
    businessInfo?: any;
    professionalInfo?: any;
    verification?: any;
    portfolio?: any;
    preferences?: any;
    onboarding?: {
      currentStep?: string;
      progress?: number;
      completed?: boolean;
    };
  };
  onSave?: () => void;
}

export function ProviderProfileForm({ initialData, onSave }: ProviderProfileFormProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [providerProfile, setProviderProfile] = useState<any>(null);
  const [serviceCategories, setServiceCategories] = useState<Array<{ key: string; name: string }>>([]);
  
  // Document upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<'insurance' | 'license' | 'portfolio'>('insurance');
  const [category, setCategory] = useState<string>('professional');
  const [uploading, setUploading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<Array<{ id: string; name: string; type: string; url: string }>>([]);
  
  // Portfolio upload state
  const [selectedPortfolioFiles, setSelectedPortfolioFiles] = useState<File[]>([]);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [uploadedPortfolio, setUploadedPortfolio] = useState<Array<{ id: string; name: string; type: string; url: string }>>([]);

  // Fetch provider profile
  useEffect(() => {
    const fetchProviderProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.providersProfileMe}`,
          createAuthFetchOptions()
        );
        if (response.ok) {
          const data = await response.json();
          const profileData = data?.data || data;
          setProviderProfile(profileData);
          
          // Update form with fetched data
          if (profileData) {
            reset({
              providerType: profileData.providerType || 'individual',
              businessInfo: profileData.businessInfo || {},
              professionalInfo: {
                specialties: profileData.professionalInfo?.specialties || [],
                languages: profileData.professionalInfo?.languages || [],
                availability: profileData.professionalInfo?.availability || [],
                emergencyServices: profileData.professionalInfo?.emergencyServices || false,
                travelDistance: profileData.professionalInfo?.travelDistance || 0,
                minimumJobValue: profileData.professionalInfo?.minimumJobValue || 0,
                maximumJobValue: profileData.professionalInfo?.maximumJobValue || 0,
              },
              verification: profileData.verification || {},
              portfolio: profileData.portfolio || {},
              preferences: profileData.preferences || {},
            });
          }
          
          if (profileData?.onboarding?.currentStep) {
            // Determine active step based on current onboarding step
            const stepMap: Record<string, number> = {
              'profile_setup': 1,
              'business_info': 2,
              'professional_info': 3,
              'verification': 4,
              'documents': 5,
              'portfolio': 6,
              'preferences': 7,
            };
            setActiveStep(stepMap[profileData.onboarding.currentStep] || 1);
          }
        }
      } catch (error) {
        logger.error('Failed to fetch provider profile', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };
    fetchProviderProfile();
  }, []);

  // Fetch service categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.marketplaceServicesCategories}`);
        if (response.ok) {
          const data = await response.json();
          
          // Handle different response structures
          let categories: any[] = [];
          
          // Check if response is directly an array
          if (Array.isArray(data)) {
            categories = data;
          }
          // Check for { success: true, data: [...] }
          else if (data?.data && Array.isArray(data.data)) {
            categories = data.data;
          }
          // Check for { categories: [...] }
          else if (data?.categories && Array.isArray(data.categories)) {
            categories = data.categories;
          }
          // Try to find any array property
          else if (typeof data === 'object' && data !== null) {
            const arrayKey = Object.keys(data).find(key => 
              Array.isArray((data as Record<string, unknown>)[key])
            );
            if (arrayKey) {
              const arrayValue = (data as Record<string, unknown>)[arrayKey];
              if (Array.isArray(arrayValue)) {
                categories = arrayValue;
              }
            }
          }
          
          // Only map if we have a valid array
          if (Array.isArray(categories) && categories.length > 0) {
            setServiceCategories(categories.map((cat: any) => ({
              key: cat.key || cat._id || cat.name?.toLowerCase().replace(/\s+/g, '_'),
              name: cat.name || cat.key || cat._id,
            })));
          } else {
            // Set default categories if API doesn't return any
            setServiceCategories([
              { key: 'cleaning', name: 'Cleaning' },
              { key: 'plumbing', name: 'Plumbing' },
              { key: 'electrical', name: 'Electrical' },
              { key: 'moving', name: 'Moving' },
              { key: 'landscaping', name: 'Landscaping' },
              { key: 'pest_control', name: 'Pest Control' },
              { key: 'handyman', name: 'Handyman' },
              { key: 'painting', name: 'Painting' },
              { key: 'carpentry', name: 'Carpentry' },
              { key: 'other', name: 'Other' },
            ]);
          }
        }
      } catch (error) {
        logger.error('Failed to fetch service categories', error instanceof Error ? error : new Error(String(error)));
        // Set default categories on error
        setServiceCategories([
          { key: 'cleaning', name: 'Cleaning' },
          { key: 'plumbing', name: 'Plumbing' },
          { key: 'electrical', name: 'Electrical' },
          { key: 'moving', name: 'Moving' },
          { key: 'landscaping', name: 'Landscaping' },
          { key: 'pest_control', name: 'Pest Control' },
          { key: 'handyman', name: 'Handyman' },
          { key: 'painting', name: 'Painting' },
          { key: 'carpentry', name: 'Carpentry' },
          { key: 'other', name: 'Other' },
        ]);
      }
    };
    fetchCategories();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
    reset,
  } = useForm<ProviderProfileForm>({
    resolver: zodResolver(providerProfileSchema),
    defaultValues: {
      providerType: initialData?.providerType || 'individual',
      businessInfo: initialData?.businessInfo || {},
      professionalInfo: {
        specialties: initialData?.professionalInfo?.specialties || [],
        languages: initialData?.professionalInfo?.languages || [],
        availability: initialData?.professionalInfo?.availability || [],
        emergencyServices: initialData?.professionalInfo?.emergencyServices || false,
        travelDistance: initialData?.professionalInfo?.travelDistance || 0,
        minimumJobValue: initialData?.professionalInfo?.minimumJobValue || 0,
        maximumJobValue: initialData?.professionalInfo?.maximumJobValue || 0,
      },
      verification: initialData?.verification || {},
      portfolio: initialData?.portfolio || {},
      preferences: initialData?.preferences || {},
    },
  });

  const providerType = watch('providerType');
  
  // If providerType is 'individual' and user is on step 2, redirect to step 3
  useEffect(() => {
    if (providerType === 'individual' && activeStep === 2) {
      setActiveStep(3);
    }
  }, [providerType, activeStep]);
  
  // Auto-geocode business address when address fields change
  useEffect(() => {
    // Only geocode if provider type is business or agency and we're on step 2
    if (providerType === 'individual' || activeStep !== 2) return;

    const businessCity = watch('businessInfo.businessAddress.city');
    const businessState = watch('businessInfo.businessAddress.state');
    const businessStreet = watch('businessInfo.businessAddress.street');
    const businessZipCode = watch('businessInfo.businessAddress.zipCode');
    const businessCountry = watch('businessInfo.businessAddress.country');

    // Only geocode if we have at least city and state
    if (businessCity && businessState) {
      // Debounce geocoding to avoid too many API calls
      const timeoutId = setTimeout(async () => {
        try {
          // Build address string for geocoding
          const addressParts = [
            businessStreet,
            businessCity,
            businessState,
            businessZipCode,
            businessCountry,
          ].filter(Boolean);
          
          if (addressParts.length < 2) return; // Need at least city and state

          const addressString = addressParts.join(", ");

          const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.mapsGeocode}`, 
            createAuthFetchOptions({
              method: "POST",
              body: JSON.stringify({ address: addressString }),
            })
          );

          if (response.ok) {
            const geocodeData = await response.json();
            
            if (geocodeData.success && geocodeData.data) {
              const location = geocodeData.data.location;
              if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
                // Set coordinates
                setValue('businessInfo.businessAddress.coordinates', {
                  lat: location.lat,
                  lng: location.lng,
                });
              }
            }
          }
        } catch (error) {
          // Silently fail - coordinates are optional
          logger.debug('Business address geocoding failed', { error: error instanceof Error ? error.message : String(error) });
        }
      }, 1000); // 1 second debounce

      return () => clearTimeout(timeoutId);
    }
  }, [
    providerType,
    activeStep,
    watch('businessInfo.businessAddress.street'),
    watch('businessInfo.businessAddress.city'),
    watch('businessInfo.businessAddress.state'),
    watch('businessInfo.businessAddress.zipCode'),
    watch('businessInfo.businessAddress.country'),
    setValue,
  ]);

  const { fields: specialtyFields, append: addSpecialty, remove: removeSpecialty } = useFieldArray({
    control,
    name: 'professionalInfo.specialties',
  });
  const { fields: languageFields, append: addLanguage, remove: removeLanguage } = useFieldArray({
    control,
    name: 'professionalInfo.languages' as any,
  });
  const { fields: availabilityFields, append: addAvailability, remove: removeAvailability } = useFieldArray({
    control,
    name: 'professionalInfo.availability',
  });
  const { fields: licenseFields, append: addLicense, remove: removeLicense } = useFieldArray({
    control,
    name: 'verification.licenses',
  });
  const { fields: referenceFields, append: addReference, remove: removeReference } = useFieldArray({
    control,
    name: 'verification.references',
  });

  // Transform form data to API format based on active step
  const transformFormDataToAPI = (data: ProviderProfileForm, step: number): any => {
    const payload: any = {};

    switch (step) {
      case 1: // Profile Setup
        payload.providerType = data.providerType;
        break;

      case 2: // Business Info
        if (data.businessInfo) {
          payload.businessInfo = {
            businessName: data.businessInfo.businessName,
            businessType: data.businessInfo.businessType,
            registrationNumber: data.businessInfo.businessRegistration,
            taxId: data.businessInfo.taxId,
            contact: {
              email: data.businessInfo.businessEmail || undefined,
              phone: data.businessInfo.businessPhone || undefined,
              website: data.businessInfo.website || undefined,
              address: data.businessInfo.businessAddress ? {
                street: data.businessInfo.businessAddress.street || undefined,
                city: data.businessInfo.businessAddress.city || undefined,
                state: data.businessInfo.businessAddress.state || undefined,
                zipCode: data.businessInfo.businessAddress.zipCode || undefined,
                country: data.businessInfo.businessAddress.country || undefined,
                coordinates: data.businessInfo.businessAddress.coordinates || undefined,
              } : undefined,
            },
          };
          // Remove undefined fields
          if (payload.businessInfo.contact) {
            Object.keys(payload.businessInfo.contact).forEach(key => {
              if (payload.businessInfo.contact[key] === undefined) {
                delete payload.businessInfo.contact[key];
              }
            });
            if (payload.businessInfo.contact.address) {
              Object.keys(payload.businessInfo.contact.address).forEach(key => {
                if (payload.businessInfo.contact.address[key] === undefined) {
                  delete payload.businessInfo.contact.address[key];
                }
              });
              if (Object.keys(payload.businessInfo.contact.address).length === 0) {
                delete payload.businessInfo.contact.address;
              }
            }
            if (Object.keys(payload.businessInfo.contact).length === 0) {
              delete payload.businessInfo.contact;
            }
          }
        }
        break;

      case 3: // Professional Info
        if (data.professionalInfo) {
          payload.professionalInfo = {
            specialties: data.professionalInfo.specialties?.map(spec => ({
              category: spec.category,
              skills: spec.skills || [],
              serviceAreas: spec.serviceAreas?.map(area => ({
                city: area.city,
                state: area.state,
                zipCode: area.zipCode || undefined,
                radius: area.radius || undefined,
              })) || [],
              pricing: spec.hourlyRate ? {
                baseRate: spec.hourlyRate,
                currency: 'USD',
              } : undefined,
            })) || [],
            languages: data.professionalInfo.languages || [],
            availability: (() => {
              const avail = data.professionalInfo.availability;
              if (!avail) return {};
              
              // If it's already an object with day keys
              if (!Array.isArray(avail)) {
                const result: Record<string, { available: boolean; startTime: string; endTime: string }> = {};
                Object.keys(avail).forEach(day => {
                  const dayData = (avail as any)[day];
                  if (dayData?.available && dayData?.start && dayData?.end) {
                    result[day] = {
                      available: true,
                      startTime: dayData.start,
                      endTime: dayData.end,
                    };
                  }
                });
                return result;
              }
              
              // If it's an array, convert to object
              return avail.reduce((acc, item) => {
                if (item.day && item.start && item.end) {
                  acc[item.day] = {
                    available: true,
                    startTime: item.start,
                    endTime: item.end,
                  };
                }
                return acc;
              }, {} as Record<string, { available: boolean; startTime: string; endTime: string }>);
            })(),
            emergencyServices: data.professionalInfo.emergencyServices || false,
            travelDistance: data.professionalInfo.travelDistance || undefined,
            minimumJobValue: data.professionalInfo.minimumJobValue || undefined,
            maximumJobValue: data.professionalInfo.maximumJobValue || undefined,
          };
          // Remove undefined fields
          if (payload.professionalInfo.availability && Object.keys(payload.professionalInfo.availability).length === 0) {
            delete payload.professionalInfo.availability;
          }
        }
        break;

      case 4: // Verification
        // Verification data is typically handled separately, but we can update insurance info
        if (data.verification?.insurance) {
          payload.businessInfo = payload.businessInfo || {};
          payload.businessInfo.insurance = {
            provider: data.verification.insurance.insuranceProvider || undefined,
            policyNumber: data.verification.insurance.policyNumber || undefined,
            coverageAmount: data.verification.insurance.coverageAmount || undefined,
            expiryDate: data.verification.insurance.expiryDate || undefined,
          };
          // Remove undefined fields
          Object.keys(payload.businessInfo.insurance).forEach(key => {
            if (payload.businessInfo.insurance[key] === undefined) {
              delete payload.businessInfo.insurance[key];
            }
          });
        }
        break;

      case 7: // Preferences
        if (data.preferences) {
          const prefs: any = {};
          
          // Notification Settings
          if (data.preferences.notificationSettings) {
            prefs.notificationSettings = {};
            
            if (data.preferences.notificationSettings.email !== undefined) {
              const emailEnabled = data.preferences.notificationSettings.email;
              prefs.notificationSettings.email = {
                newBookings: emailEnabled,
                jobUpdates: emailEnabled,
                paymentUpdates: emailEnabled,
              };
            }
            
            if (data.preferences.notificationSettings.sms !== undefined) {
              const smsEnabled = data.preferences.notificationSettings.sms;
              prefs.notificationSettings.sms = {
                newBookings: smsEnabled,
                urgentUpdates: smsEnabled,
              };
            }
            
            if (data.preferences.notificationSettings.push !== undefined) {
              const pushEnabled = data.preferences.notificationSettings.push;
              prefs.notificationSettings.push = {
                enabled: pushEnabled,
                newBookings: pushEnabled,
                jobUpdates: pushEnabled,
              };
            }
            
            if (Object.keys(prefs.notificationSettings).length === 0) {
              delete prefs.notificationSettings;
            }
          }
          
          // Communication Preferences
          if (data.preferences.communicationPreferences) {
            prefs.communicationPreferences = {};
            if (data.preferences.communicationPreferences.preferredMethod) {
              prefs.communicationPreferences.preferredContactMethod = 
                data.preferences.communicationPreferences.preferredMethod;
            }
            if (data.preferences.communicationPreferences.responseTime) {
              prefs.communicationPreferences.responseTime = 
                data.preferences.communicationPreferences.responseTime;
            }
            if (Object.keys(prefs.communicationPreferences).length === 0) {
              delete prefs.communicationPreferences;
            }
          }
          
          // Work Preferences
          if (data.preferences.jobPreferences) {
            prefs.workPreferences = {
              preferredJobTypes: data.preferences.jobPreferences.preferredJobTypes || [],
              preferredJobSizes: [], // Not in form, but API expects it
              preferredPaymentMethods: [], // Not in form, but API expects it
            };
          }
          
          if (Object.keys(prefs).length > 0) {
            payload.preferences = prefs;
          }
        }
        break;
    }

    // Remove undefined nested objects
    const cleanPayload = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(cleanPayload);
      } else if (obj !== null && typeof obj === 'object') {
        const cleaned: any = {};
        for (const key in obj) {
          const value = cleanPayload(obj[key]);
          if (value !== undefined) {
            cleaned[key] = value;
          }
        }
        return Object.keys(cleaned).length > 0 ? cleaned : undefined;
      }
      return obj;
    };

    return cleanPayload(payload);
  };

  const onSubmit = async (data: ProviderProfileForm) => {
    try {
      setSaving(true);
      
      // Transform form data to API format based on current step
      const apiPayload = transformFormDataToAPI(data, activeStep);
      
      // Only send request if there's data to update
      if (Object.keys(apiPayload).length > 0) {
        // Update provider profile using PATCH
        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.providersProfile}`,
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

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to save provider profile');
        }

        const responseData = await response.json().catch(() => ({}));
        if (responseData.success !== false) {
          toast.success('Profile updated successfully!');
        }
      }

      // Update onboarding step
      const stepNames = [
        'profile_setup',
        'business_info',
        'professional_info',
        'verification',
        'documents',
        'portfolio',
        'preferences',
      ];
      
      if (activeStep <= stepNames.length) {
        const stepResponse = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.providersOnboardingStep}`,
          {
            ...createAuthFetchOptions({
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                step: stepNames[activeStep - 1],
                data: {},
              }),
            }),
          }
        );

        if (stepResponse.ok) {
          toast.success(`Step ${activeStep} completed successfully!`);
          if (activeStep < 7) {
            setActiveStep(activeStep + 1);
          }
        }
      }

      onSave?.();
    } catch (error) {
      logger.error('Failed to save provider profile', error instanceof Error ? error : new Error(String(error)));
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle step submission
  const handleStepSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    const formData = watch();
    await onSubmit(formData);
  };

  // Define all steps
  const allSteps = [
    { id: 1, name: 'Profile Setup', icon: Briefcase, required: true },
    { id: 2, name: 'Business Info', icon: Building2, required: true, showFor: ['business', 'agency'] },
    { id: 3, name: 'Professional Info', icon: Award, required: true },
    { id: 4, name: 'Verification', icon: Shield, required: true },
    { id: 5, name: 'Documents', icon: FileText, required: true },
    { id: 6, name: 'Portfolio', icon: ImageIcon, required: false },
    { id: 7, name: 'Preferences', icon: Settings, required: true },
  ];

  // Filter steps based on provider type
  const steps = allSteps.filter(step => {
    if (step.showFor) {
      return step.showFor.includes(providerType);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Provider Onboarding</h2>
          <div className="text-sm text-gray-600">
            Step {steps.findIndex(s => s.id === activeStep) + 1 || activeStep} of {steps.length}
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-4">
          {steps.map((step) => {
            const StepIcon = step.icon;
            const isActive = activeStep === step.id;
            const isCompleted = activeStep > step.id;
            const isRequired = step.required;

            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-100 text-purple-700 font-semibold'
                    : isCompleted
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <StepIcon className="w-4 h-4" />
                <span className="text-sm">{step.name}</span>
                {isRequired && !isCompleted && <span className="text-red-500">*</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Profile Setup */}
        {activeStep === 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <Briefcase className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Profile Setup</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('providerType')}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                  <option value="agency">Agency</option>
                </select>
                {errors.providerType && (
                  <p className="mt-1 text-sm text-red-600">{errors.providerType.message}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
              <div></div>
              <button
                type="button"
                onClick={handleStepSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save & Continue
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Business Info */}
        {activeStep === 2 && providerType !== 'individual' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Business Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('businessInfo.businessName')}
                  placeholder="Enter business name"
                />
                {errors.businessInfo?.businessName && (
                  <p className="mt-1 text-sm text-red-600">{errors.businessInfo.businessName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                <select
                  {...register('businessInfo.businessType')}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select business type</option>
                  <option value="sole_proprietorship">Sole Proprietorship</option>
                  <option value="partnership">Partnership</option>
                  <option value="llc">LLC</option>
                  <option value="corporation">Corporation</option>
                  <option value="small_business">Small Business</option>
                  <option value="medium_business">Medium Business</option>
                  <option value="large_business">Large Business</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                <Input
                  {...register('businessInfo.businessAddress.street')}
                  placeholder="Enter street address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('businessInfo.businessAddress.city')}
                  placeholder="Enter city"
                />
                {errors.businessInfo?.businessAddress?.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.businessInfo.businessAddress.city.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('businessInfo.businessAddress.state')}
                  placeholder="Enter state"
                />
                {errors.businessInfo?.businessAddress?.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.businessInfo.businessAddress.state.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                <Input
                  {...register('businessInfo.businessAddress.zipCode')}
                  placeholder="Enter ZIP code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <Input
                  {...register('businessInfo.businessAddress.country')}
                  placeholder="Enter country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Phone <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('businessInfo.businessPhone')}
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
                <Input
                  {...register('businessInfo.businessEmail')}
                  type="email"
                  placeholder="business@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <Input
                  {...register('businessInfo.website')}
                  type="url"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
                <Input
                  {...register('businessInfo.taxId')}
                  placeholder="Enter tax ID"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
                <Textarea
                  {...register('businessInfo.businessDescription')}
                  rows={3}
                  placeholder="Describe your business..."
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleStepSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save & Continue
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Professional Info */}
        {activeStep === 3 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Professional Information</h3>
            </div>
            <div className="space-y-6">
              {/* Specialties */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Specialties <span className="text-red-500">*</span>
                </label>
                {specialtyFields.map((field, index) => (
                  <div key={field.id} className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Specialty {index + 1}</h4>
                      {specialtyFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSpecialty(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register(`professionalInfo.specialties.${index}.category`)}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select category</option>
                          {serviceCategories.map((cat) => (
                            <option key={cat.key} value={cat.key}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate</label>
                        <Input
                          {...register(`professionalInfo.specialties.${index}.hourlyRate`, { valueAsNumber: true })}
                          type="number"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Experience (years)</label>
                        <Input
                          {...register(`professionalInfo.specialties.${index}.experience`, { valueAsNumber: true })}
                          type="number"
                          placeholder="0"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Areas <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                          {watch(`professionalInfo.specialties.${index}.serviceAreas`)?.map((area: any, areaIndex: number) => (
                            <div key={areaIndex} className="flex items-center gap-2">
                              <Input
                                placeholder="City"
                                defaultValue={area?.city}
                                onChange={(e) => {
                                  const currentAreas = watch(`professionalInfo.specialties.${index}.serviceAreas`) || [];
                                  const updatedAreas = [...currentAreas];
                                  updatedAreas[areaIndex] = { ...updatedAreas[areaIndex], city: e.target.value };
                                  setValue(`professionalInfo.specialties.${index}.serviceAreas`, updatedAreas);
                                }}
                              />
                              <Input
                                placeholder="State"
                                defaultValue={area?.state}
                                onChange={(e) => {
                                  const currentAreas = watch(`professionalInfo.specialties.${index}.serviceAreas`) || [];
                                  const updatedAreas = [...currentAreas];
                                  updatedAreas[areaIndex] = { ...updatedAreas[areaIndex], state: e.target.value };
                                  setValue(`professionalInfo.specialties.${index}.serviceAreas`, updatedAreas);
                                }}
                              />
                              <Input
                                type="number"
                                placeholder="Radius (miles)"
                                defaultValue={area?.radius}
                                onChange={(e) => {
                                  const currentAreas = watch(`professionalInfo.specialties.${index}.serviceAreas`) || [];
                                  const updatedAreas = [...currentAreas];
                                  updatedAreas[areaIndex] = { ...updatedAreas[areaIndex], radius: Number(e.target.value) };
                                  setValue(`professionalInfo.specialties.${index}.serviceAreas`, updatedAreas);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const currentAreas = watch(`professionalInfo.specialties.${index}.serviceAreas`) || [];
                                  const updatedAreas = currentAreas.filter((_: any, i: number) => i !== areaIndex);
                                  setValue(`professionalInfo.specialties.${index}.serviceAreas`, updatedAreas);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )) || (
                            <div className="text-sm text-gray-500">No service areas added</div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const currentAreas = watch(`professionalInfo.specialties.${index}.serviceAreas`) || [];
                              setValue(`professionalInfo.specialties.${index}.serviceAreas`, [
                                ...currentAreas,
                                { city: '', state: '', radius: 0 }
                              ]);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50"
                          >
                            <Plus className="w-3 h-3" />
                            Add Service Area
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addSpecialty({
                    category: 'other' as any,
                    serviceAreas: [{ city: '', state: '', radius: 0 }],
                  })}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Specialty
                </button>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Languages Spoken <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {languageFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Input
                        {...register(`professionalInfo.languages.${index}`)}
                        placeholder="Language"
                      />
                      {languageFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLanguage(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addLanguage('')}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Language
                </button>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Availability Schedule</label>
                <div className="space-y-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <div key={day} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        {...register(`professionalInfo.availability.${day}.available` as any)}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <label className="flex-1 capitalize">{day}</label>
                      <Input
                        type="time"
                        {...register(`professionalInfo.availability.${day}.start` as any)}
                        className="w-32"
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        {...register(`professionalInfo.availability.${day}.end` as any)}
                        className="w-32"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register('professionalInfo.emergencyServices')}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Emergency Services</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Travel Distance (miles)</label>
                  <Input
                    {...register('professionalInfo.travelDistance', { valueAsNumber: true })}
                    type="number"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Value Range</label>
                  <div className="flex items-center gap-2">
                    <Input
                      {...register('professionalInfo.minimumJobValue', { valueAsNumber: true })}
                      type="number"
                      placeholder="Min"
                    />
                    <span>to</span>
                    <Input
                      {...register('professionalInfo.maximumJobValue', { valueAsNumber: true })}
                      type="number"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setActiveStep(providerType !== 'individual' ? 2 : 1)}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleStepSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save & Continue
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Verification */}
        {activeStep === 4 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Verification</h3>
            </div>
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    {...register('verification.identityVerified')}
                    className="w-4 h-4 text-purple-600 rounded"
                    disabled
                  />
                  <span className="text-sm font-medium text-gray-700">Identity Verified (Admin-controlled)</span>
                </label>
                {providerType !== 'individual' && (
                  <label className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      {...register('verification.businessVerified')}
                      className="w-4 h-4 text-purple-600 rounded"
                      disabled
                    />
                    <span className="text-sm font-medium text-gray-700">Business Verified (Admin-controlled)</span>
                  </label>
                )}
              </div>

              {/* Insurance */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">Insurance Information</h4>
                <div className="space-y-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register('verification.insurance.hasInsurance')}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">I have insurance</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Provider</label>
                      <Input
                        {...register('verification.insurance.insuranceProvider')}
                        placeholder="Insurance company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Policy Number</label>
                      <Input
                        {...register('verification.insurance.policyNumber')}
                        placeholder="Policy number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Coverage Amount</label>
                      <Input
                        {...register('verification.insurance.coverageAmount', { valueAsNumber: true })}
                        type="number"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                      <Input
                        {...register('verification.insurance.expiryDate')}
                        type="date"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Check */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">Background Check</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    {...register('verification.backgroundCheck.status')}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="not_required">Not Required</option>
                  </select>
                </div>
              </div>

              {/* Licenses */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Professional Licenses</h4>
                {licenseFields.map((field, index) => (
                  <div key={field.id} className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">License {index + 1}</h5>
                      <button
                        type="button"
                        onClick={() => removeLicense(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">License Type</label>
                        <Input
                          {...register(`verification.licenses.${index}.type`)}
                          placeholder="License type"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                        <Input
                          {...register(`verification.licenses.${index}.number`)}
                          placeholder="License number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Issuing Authority</label>
                        <Input
                          {...register(`verification.licenses.${index}.issuingAuthority`)}
                          placeholder="Issuing authority"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Issue Date</label>
                        <Input
                          {...register(`verification.licenses.${index}.issueDate`)}
                          type="date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                        <Input
                          {...register(`verification.licenses.${index}.expiryDate`)}
                          type="date"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addLicense({})}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50"
                >
                  <Plus className="w-4 h-4" />
                  Add License
                </button>
              </div>

              {/* References */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Professional References</h4>
                {referenceFields.map((field, index) => (
                  <div key={field.id} className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">Reference {index + 1}</h5>
                      <button
                        type="button"
                        onClick={() => removeReference(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <Input
                          {...register(`verification.references.${index}.name`)}
                          placeholder="Reference name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                        <Input
                          {...register(`verification.references.${index}.relationship`)}
                          placeholder="Relationship"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <Input
                          {...register(`verification.references.${index}.phone`)}
                          placeholder="Phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <Input
                          {...register(`verification.references.${index}.email`)}
                          type="email"
                          placeholder="Email address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                        <Input
                          {...register(`verification.references.${index}.company`)}
                          placeholder="Company name"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addReference({})}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Reference
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleStepSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save & Continue
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Documents */}
        {activeStep === 5 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Documents</h3>
            </div>
            <div className="space-y-6">
              <p className="text-gray-600">
                Upload required documents to showcase your credentials and qualifications.
              </p>

              {/* Document Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={documentType}
                  onChange={(e) => {
                    setDocumentType(e.target.value as 'insurance' | 'license' | 'portfolio');
                    setSelectedFiles([]); // Clear selected files when type changes
                  }}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="insurance">Insurance</option>
                  <option value="license">License</option>
                  <option value="portfolio">Portfolio</option>
                </select>
              </div>

              {/* Category (for license type) */}
              {documentType === 'license' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category (Optional)
                  </label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., professional"
                  />
                </div>
              )}

              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  uploading
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-gray-300 hover:border-purple-400 hover:bg-purple-5'
                }`}
                onDragOver={(e) => {
                  if (!uploading) {
                    e.preventDefault();
                  }
                }}
                onDrop={(e) => {
                  if (uploading) return;
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files).filter(file =>
                    file.type.match(/\.(pdf|doc|docx|jpg|jpeg|png)$/i) ||
                    file.type.includes('pdf') ||
                    file.type.includes('document') ||
                    file.type.includes('image')
                  );
                  if (files.length + selectedFiles.length > 5) {
                    toast.error('Maximum 5 files allowed');
                    return;
                  }
                  setSelectedFiles([...selectedFiles, ...files]);
                }}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop documents here, or</p>
                <label className={`inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Choose Files
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length + selectedFiles.length > 5) {
                        toast.error('Maximum 5 files allowed');
                        return;
                      }
                      setSelectedFiles([...selectedFiles, ...files]);
                    }}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Supports PDF, DOC, DOCX, JPG, PNG up to 10MB each (Max 5 files)
                </p>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Selected Files ({selectedFiles.length}/5):</p>
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                        }}
                        className="text-red-600 hover:text-red-700 p-1"
                        disabled={uploading}
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {selectedFiles.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    if (selectedFiles.length === 0) {
                      toast.error('Please select at least one file');
                      return;
                    }

                    setUploading(true);
                    try {
                      const formData = new FormData();
                      
                      // Add files
                      selectedFiles.forEach((file) => {
                        formData.append('documents', file);
                      });
                      
                      // Add document type
                      formData.append('documentType', documentType);
                      
                      // Add category if license type
                      if (documentType === 'license' && category) {
                        formData.append('category', category);
                      }

                      // For FormData, we need to set headers manually without Content-Type
                      // The browser will set it automatically with the boundary
                      const apiToken = getApiToken();
                      const headers: HeadersInit = {
                        ...(apiToken && { 'Authorization': `Bearer ${apiToken}` }),
                      };

                      const response = await fetch(
                        `${API_BASE_URL}${API_ENDPOINTS.providersDocumentsUpload}`,
                        {
                          method: 'POST',
                          headers,
                          body: formData,
                          credentials: 'include',
                        }
                      );

                      if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || 'Failed to upload documents');
                      }

                      const result = await response.json();
                      const uploaded = result?.data || result;
                      
                      // Add to uploaded documents list
                      if (Array.isArray(uploaded)) {
                        setUploadedDocuments([...uploadedDocuments, ...uploaded]);
                      } else if (uploaded) {
                        setUploadedDocuments([...uploadedDocuments, uploaded]);
                      }

                      toast.success(`Successfully uploaded ${selectedFiles.length} file(s)`);
                      setSelectedFiles([]);
                    } catch (error) {
                      logger.error('Failed to upload documents', error instanceof Error ? error : new Error(String(error)));
                      toast.error(error instanceof Error ? error.message : 'Failed to upload documents');
                    } finally {
                      setUploading(false);
                    }
                  }}
                  disabled={uploading || selectedFiles.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              )}

              {/* Uploaded Documents List */}
              {uploadedDocuments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {uploadedDocuments.map((doc, index) => (
                      <div
                        key={doc.id || index}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 truncate font-medium">{doc.name || `Document ${index + 1}`}</p>
                            <p className="text-xs text-gray-500 capitalize">{doc.type || documentType}</p>
                          </div>
                        </div>
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-700 text-sm font-medium ml-2"
                          >
                            View
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleStepSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save & Continue
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Portfolio */}
        {activeStep === 6 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <ImageIcon className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Portfolio</h3>
            </div>
            <div className="space-y-6">
              <p className="text-gray-600">
                Upload portfolio images and videos to showcase your work.
              </p>

              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  uploadingPortfolio
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-gray-300 hover:border-purple-400 hover:bg-purple-5'
                }`}
                onDragOver={(e) => {
                  if (!uploadingPortfolio) {
                    e.preventDefault();
                  }
                }}
                onDrop={(e) => {
                  if (uploadingPortfolio) return;
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files).filter(file =>
                    file.type.startsWith('image/') || file.type.startsWith('video/')
                  );
                  if (files.length + selectedPortfolioFiles.length > 5) {
                    toast.error('Maximum 5 files allowed');
                    return;
                  }
                  setSelectedPortfolioFiles([...selectedPortfolioFiles, ...files]);
                }}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop images and videos here, or</p>
                <label className={`inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors ${uploadingPortfolio ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Choose Files
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length + selectedPortfolioFiles.length > 5) {
                        toast.error('Maximum 5 files allowed');
                        return;
                      }
                      setSelectedPortfolioFiles([...selectedPortfolioFiles, ...files]);
                    }}
                    className="hidden"
                    disabled={uploadingPortfolio}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Supports JPG, PNG, WebP, MP4, MOV up to 10MB each (Max 5 files)
                </p>
              </div>

              {/* Selected Files List */}
              {selectedPortfolioFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Selected Files ({selectedPortfolioFiles.length}/5):</p>
                  {selectedPortfolioFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <ImageIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPortfolioFiles(selectedPortfolioFiles.filter((_, i) => i !== index));
                        }}
                        className="text-red-600 hover:text-red-700 p-1"
                        disabled={uploadingPortfolio}
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {selectedPortfolioFiles.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    if (selectedPortfolioFiles.length === 0) {
                      toast.error('Please select at least one file');
                      return;
                    }

                    setUploadingPortfolio(true);
                    try {
                      const formData = new FormData();
                      
                      // Add files
                      selectedPortfolioFiles.forEach((file) => {
                        formData.append('documents', file);
                      });
                      
                      // Add document type as portfolio
                      formData.append('documentType', 'portfolio');

                      // For FormData, we need to set headers manually without Content-Type
                      // The browser will set it automatically with the boundary
                      const apiToken = getApiToken();
                      const headers: HeadersInit = {
                        ...(apiToken && { 'Authorization': `Bearer ${apiToken}` }),
                      };

                      const response = await fetch(
                        `${API_BASE_URL}${API_ENDPOINTS.providersDocumentsUpload}`,
                        {
                          method: 'POST',
                          headers,
                          body: formData,
                          credentials: 'include',
                        }
                      );

                      if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || 'Failed to upload portfolio files');
                      }

                      const result = await response.json();
                      const uploaded = result?.data || result;
                      
                      // Add to uploaded portfolio list
                      if (Array.isArray(uploaded)) {
                        setUploadedPortfolio([...uploadedPortfolio, ...uploaded]);
                      } else if (uploaded) {
                        setUploadedPortfolio([...uploadedPortfolio, uploaded]);
                      }

                      toast.success(`Successfully uploaded ${selectedPortfolioFiles.length} file(s)`);
                      setSelectedPortfolioFiles([]);
                    } catch (error) {
                      logger.error('Failed to upload portfolio files', error instanceof Error ? error : new Error(String(error)));
                      toast.error(error instanceof Error ? error.message : 'Failed to upload portfolio files');
                    } finally {
                      setUploadingPortfolio(false);
                    }
                  }}
                  disabled={uploadingPortfolio || selectedPortfolioFiles.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingPortfolio ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload {selectedPortfolioFiles.length} File{selectedPortfolioFiles.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              )}

              {/* Uploaded Portfolio List */}
              {uploadedPortfolio.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Portfolio</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {uploadedPortfolio.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 truncate font-medium">{item.name || `Portfolio ${index + 1}`}</p>
                            <p className="text-xs text-gray-500 capitalize">{item.type || 'portfolio'}</p>
                          </div>
                        </div>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-700 text-sm font-medium ml-2"
                          >
                            View
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setActiveStep(5)}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleStepSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save & Continue
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Preferences */}
        {activeStep === 7 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Preferences</h3>
            </div>
            <div className="space-y-6">
              {/* Notification Settings */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">Notification Settings</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register('preferences.notificationSettings.email')}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register('preferences.notificationSettings.sms')}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">SMS Notifications</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register('preferences.notificationSettings.push')}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Push Notifications</span>
                  </label>
                </div>
              </div>

              {/* Job Preferences */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-4">Job Preferences</h4>
                <div className="space-y-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register('preferences.jobPreferences.autoAccept')}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Auto-accept jobs</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Communication Method</label>
                    <select
                      {...register('preferences.communicationPreferences.preferredMethod')}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select method</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="sms">SMS</option>
                      <option value="in_app">In-App</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setActiveStep(6)}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleStepSubmit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save & Continue
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </form>
    </div>
  );
}
