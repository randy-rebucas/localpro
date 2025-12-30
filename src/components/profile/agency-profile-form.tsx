"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Save, Loader2, Plus, X, MapPin, Shield, Settings, Users, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const businessTypeEnum = z.enum(['sole_proprietorship', 'partnership', 'corporation', 'llc', 'nonprofit']);
const subscriptionPlanEnum = z.enum(['basic', 'professional', 'enterprise']);
const documentTypeEnum = z.enum(['business_license', 'insurance_certificate', 'tax_certificate', 'other']);
const serviceCategoryEnum = z.enum([
  'cleaning', 'plumbing', 'electrical', 'moving', 'landscaping', 'painting', 'carpentry', 
  'flooring', 'roofing', 'hvac', 'appliance_repair', 'locksmith', 'handyman', 'home_security',
  'pool_maintenance', 'pest_control', 'carpet_cleaning', 'window_cleaning', 'gutter_cleaning',
  'power_washing', 'snow_removal', 'other'
]);

const agencyProfileSchema = z.object({
  // Basic Information
  name: z.string().min(2, "Agency name must be at least 2 characters").max(100, "Agency name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  
  // Contact Information
  contact: z.object({
    email: z.string().email("Invalid email").min(1, "Email is required"),
    phone: z.string().min(10, "Phone must be at least 10 characters").max(15, "Phone must be less than 15 characters"),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
      coordinates: z.object({
        lat: z.number().optional(),
        lng: z.number().optional(),
      }).optional(),
    }).optional(),
  }),
  
  // Business Information
  business: z.object({
    type: businessTypeEnum.optional(),
    registrationNumber: z.string().optional(),
    taxId: z.string().optional(),
    licenseNumber: z.string().optional(),
    insurance: z.object({
      provider: z.string().optional(),
      policyNumber: z.string().optional(),
      coverageAmount: z.number().optional(),
      expiryDate: z.string().optional(),
    }).optional(),
  }).optional(),
  
  // Service Areas
  serviceAreas: z.array(z.object({
    name: z.string().optional(),
    coordinates: z.object({
      lat: z.number().optional(),
      lng: z.number().optional(),
    }).optional(),
    radius: z.number().optional(),
    zipCodes: z.array(z.string()).optional(),
  })).optional(),
  
  // Services
  services: z.array(z.object({
    category: serviceCategoryEnum.optional(),
    subcategories: z.array(z.string()).optional(),
    pricing: z.object({
      baseRate: z.number().optional(),
      currency: z.string().optional(),
    }).optional(),
  })).optional(),
  
  // Subscription
  subscription: z.object({
    plan: subscriptionPlanEnum.optional(),
    features: z.array(z.string()).optional(),
  }).optional(),
  
  // Verification
  verification: z.object({
    documents: z.array(z.object({
      type: documentTypeEnum.optional(),
      url: z.string().optional(),
      publicId: z.string().optional(),
      filename: z.string().optional(),
    })).optional(),
  }).optional(),
  
  // Settings
  settings: z.object({
    autoApproveProviders: z.boolean().optional(),
    requireProviderVerification: z.boolean().optional(),
    defaultCommissionRate: z.number().min(0).max(100).optional(),
    notificationPreferences: z.object({
      email: z.object({
        newBookings: z.boolean().optional(),
        providerUpdates: z.boolean().optional(),
        paymentUpdates: z.boolean().optional(),
      }).optional(),
      sms: z.object({
        newBookings: z.boolean().optional(),
        urgentUpdates: z.boolean().optional(),
      }).optional(),
    }).optional(),
  }).optional(),
});

type AgencyProfileForm = z.infer<typeof agencyProfileSchema>;

interface AgencyProfileFormProps {
  initialData?: any;
  onSave?: () => void;
}

export function AgencyProfileForm({ initialData, onSave }: AgencyProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agencyId, setAgencyId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<AgencyProfileForm>({
    resolver: zodResolver(agencyProfileSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      contact: {
        email: "",
        phone: "",
        website: "",
        address: {},
      },
      business: {
        type: 'sole_proprietorship',
        registrationNumber: "",
        taxId: "",
        licenseNumber: "",
        insurance: {},
      },
      serviceAreas: [],
      services: [],
      subscription: {
        plan: 'basic',
        features: [],
      },
      verification: {
        documents: [],
      },
      settings: {
        autoApproveProviders: false,
        requireProviderVerification: true,
        defaultCommissionRate: 10,
        notificationPreferences: {
          email: {
            newBookings: true,
            providerUpdates: true,
            paymentUpdates: true,
          },
          sms: {
            newBookings: false,
            urgentUpdates: true,
          },
        },
      },
    },
  });

  const { fields: serviceAreaFields, append: addServiceArea, remove: removeServiceArea } = useFieldArray({
    control,
    name: 'serviceAreas',
  });

  const { fields: serviceFields, append: addService, remove: removeService } = useFieldArray({
    control,
    name: 'services',
  });

  const { fields: documentFields, append: addDocument, remove: removeDocument } = useFieldArray({
    control,
    name: 'verification.documents',
  });

  // Fetch agency profile if exists
  useEffect(() => {
    const fetchAgencyProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.agenciesMyAgencies}`,
          createAuthFetchOptions()
        );
        if (response.ok) {
          const data = await response.json();
          const agencies = data?.data || data || [];
          if (agencies.length > 0) {
            // Use the first agency if multiple exist
            const agency = agencies[0];
            setAgencyId(agency._id || agency.id);
            // TODO: Allow user to select which agency to edit
            // reset(agency);
          }
        }
      } catch (error) {
        logger.error('Failed to fetch agency profile', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };
    fetchAgencyProfile();
  }, []);

  // Transform form data to API format
  const transformFormDataToAPI = (data: AgencyProfileForm): any => {
    const payload: any = {};
    
    if (data.name) payload.name = data.name;
    if (data.description) payload.description = data.description;
    
    if (data.contact) {
      payload.contact = {
        email: data.contact.email || undefined,
        phone: data.contact.phone || undefined,
        website: data.contact.website || undefined,
        address: data.contact.address ? {
          street: data.contact.address.street || undefined,
          city: data.contact.address.city || undefined,
          state: data.contact.address.state || undefined,
          zipCode: data.contact.address.zipCode || undefined,
          country: data.contact.address.country || undefined,
          coordinates: data.contact.address.coordinates || undefined,
        } : undefined,
      };
      // Remove undefined nested fields
      if (payload.contact.address) {
        Object.keys(payload.contact.address).forEach(key => {
          if (payload.contact.address[key] === undefined) {
            delete payload.contact.address[key];
          }
        });
        if (Object.keys(payload.contact.address).length === 0) {
          delete payload.contact.address;
        }
      }
      Object.keys(payload.contact).forEach(key => {
        if (payload.contact[key] === undefined) {
          delete payload.contact[key];
        }
      });
      if (Object.keys(payload.contact).length === 0) {
        delete payload.contact;
      }
    }
    
    if (data.business) {
      payload.business = {
        type: data.business.type || undefined,
        registrationNumber: data.business.registrationNumber || undefined,
        taxId: data.business.taxId || undefined,
        licenseNumber: data.business.licenseNumber || undefined,
        insurance: data.business.insurance ? {
          provider: data.business.insurance.provider || undefined,
          policyNumber: data.business.insurance.policyNumber || undefined,
          coverageAmount: data.business.insurance.coverageAmount || undefined,
          expiryDate: data.business.insurance.expiryDate || undefined,
        } : undefined,
      };
      // Remove undefined fields
      if (payload.business.insurance) {
        Object.keys(payload.business.insurance).forEach(key => {
          if (payload.business.insurance[key] === undefined) {
            delete payload.business.insurance[key];
          }
        });
        if (Object.keys(payload.business.insurance).length === 0) {
          delete payload.business.insurance;
        }
      }
      Object.keys(payload.business).forEach(key => {
        if (payload.business[key] === undefined) {
          delete payload.business[key];
        }
      });
      if (Object.keys(payload.business).length === 0) {
        delete payload.business;
      }
    }
    
    if (data.serviceAreas && data.serviceAreas.length > 0) {
      payload.serviceAreas = data.serviceAreas;
    }
    
    if (data.services && data.services.length > 0) {
      payload.services = data.services;
    }
    
    if (data.settings) {
      payload.settings = {
        autoApproveProviders: data.settings.autoApproveProviders,
        requireProviderVerification: data.settings.requireProviderVerification,
        defaultCommissionRate: data.settings.defaultCommissionRate,
        notificationPreferences: data.settings.notificationPreferences,
      };
    }
    
    // Remove undefined top-level fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });
    
    return payload;
  };

  const onSubmit = async (data: AgencyProfileForm) => {
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
      
      if (agencyId) {
        // Update existing agency using PATCH
        response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.agenciesById}/${agencyId}`,
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
        // Create new agency using POST
        response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.agencies}`,
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
        
        // Store the new agency ID
        if (response.ok) {
          const responseData = await response.json().catch(() => ({}));
          const newAgency = responseData?.data?.agency || responseData?.agency || responseData?.data;
          if (newAgency?._id || newAgency?.id) {
            setAgencyId(newAgency._id || newAgency.id);
          }
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save agency profile');
      }

      toast.success('Agency profile saved successfully!');
      onSave?.();
    } catch (error) {
      logger.error('Failed to save agency profile', error instanceof Error ? error : new Error(String(error)));
      toast.error(error instanceof Error ? error.message : 'Failed to save agency profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-bold text-gray-900">Agency Profile Information</h3>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Basic Information
          </h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agency Name <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('name')}
              placeholder="Enter agency name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <Textarea
              {...register('description')}
              rows={4}
              placeholder="Describe your agency..."
              maxLength={500}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Contact Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('contact.email')}
                type="email"
                placeholder="agency@example.com"
              />
              {errors.contact?.email && (
                <p className="mt-1 text-sm text-red-600">{errors.contact.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('contact.phone')}
                placeholder="+1234567890"
              />
              {errors.contact?.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.contact.phone.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <Input
                {...register('contact.website')}
                type="url"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <Input
                {...register('contact.address.city')}
                placeholder="Enter city"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <Input
                {...register('contact.address.state')}
                placeholder="Enter state"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
              <Input
                {...register('contact.address.zipCode')}
                placeholder="Enter ZIP code"
              />
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Business Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
              <select
                {...register('business.type')}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sole_proprietorship">Sole Proprietorship</option>
                <option value="partnership">Partnership</option>
                <option value="corporation">Corporation</option>
                <option value="llc">LLC</option>
                <option value="nonprofit">Nonprofit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
              <Input
                {...register('business.registrationNumber')}
                placeholder="Enter registration number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
              <Input
                {...register('business.taxId')}
                placeholder="Enter tax ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
              <Input
                {...register('business.licenseNumber')}
                placeholder="Enter license number"
              />
            </div>
          </div>
          
          {/* Insurance */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-4">Insurance Information</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Provider</label>
                <Input
                  {...register('business.insurance.provider')}
                  placeholder="Insurance company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Policy Number</label>
                <Input
                  {...register('business.insurance.policyNumber')}
                  placeholder="Policy number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Coverage Amount</label>
                <Input
                  {...register('business.insurance.coverageAmount', { valueAsNumber: true })}
                  type="number"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                <Input
                  {...register('business.insurance.expiryDate')}
                  type="date"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Services
          </h4>
          {serviceFields.map((field, index) => (
            <div key={field.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-gray-900">Service {index + 1}</h5>
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    {...register(`services.${index}.category`)}
                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="moving">Moving</option>
                    <option value="landscaping">Landscaping</option>
                    <option value="painting">Painting</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Base Rate</label>
                  <Input
                    {...register(`services.${index}.pricing.baseRate`, { valueAsNumber: true })}
                    type="number"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addService({ category: 'other', subcategories: [], pricing: { baseRate: 0, currency: 'USD' } })}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Agency Settings
          </h4>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('settings.autoApproveProviders')}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Auto-approve Providers</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('settings.requireProviderVerification')}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Require Provider Verification</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Commission Rate (%)</label>
              <Input
                {...register('settings.defaultCommissionRate', { valueAsNumber: true })}
                type="number"
                min="0"
                max="100"
                placeholder="10"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
