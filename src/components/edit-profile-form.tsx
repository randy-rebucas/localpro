"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/hooks/useAuth";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Phone, 
  MapPin, 
  Globe, 
  Briefcase, 
  Save,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { AvatarUpload } from "./avatar-upload";
import { PortfolioGallery } from "./portfolio-gallery";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createAuthFetchOptions } from "@/lib/auth-utils";

const documentSchema = z.object({
  url: z.string().url().optional().or(z.literal("")),
  publicId: z.string().optional().or(z.literal("")),
  filename: z.string().optional().or(z.literal("")),
});

const avatarSchema = z.object({
  url: z.string().url().optional().or(z.literal("")),
  publicId: z.string().optional().or(z.literal("")),
  thumbnail: z.string().url().optional().or(z.literal("")),
});

const profileSchema = z.object({
  // Basic
  name: z.string().min(2, "Name must be at least 2 characters"),
  firstName: z.string().optional().or(z.literal("")),
  lastName: z.string().optional().or(z.literal("")),
  role: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phoneNumber: z.string().optional().or(z.literal("")),

  // Legacy flat fields (kept for backward compatibility/rendering)
  phone: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  skills: z.string().optional(), // comma-separated in form
  experience: z.union([z.string(), z.number()]).optional(),

  // Nested profile
  profile: z
    .object({
      avatar: avatarSchema.optional(),
      bio: z.string().optional().or(z.literal("")),
      address: z
        .object({
          street: z.string().optional().or(z.literal("")),
          city: z.string().optional().or(z.literal("")),
          state: z.string().optional().or(z.literal("")),
          zipCode: z.string().optional().or(z.literal("")),
          country: z.string().optional().or(z.literal("")),
          coordinates: z
            .object({
              lat: z.number().optional(),
              lng: z.number().optional(),
            })
            .optional(),
        })
        .optional(),
      experience: z.union([z.number(), z.string()]).optional(),
      businessName: z.string().optional().or(z.literal("")),
      businessType: z.string().optional().or(z.literal("")),
      yearsInBusiness: z.union([z.number(), z.string()]).optional(),
      serviceAreas: z.string().optional().or(z.literal("")), // comma-separated in form
      specialties: z.string().optional().or(z.literal("")), // comma-separated in form
      certifications: z
        .array(
          z.object({
            name: z.string().optional().or(z.literal("")),
            issuer: z.string().optional().or(z.literal("")),
            issueDate: z.string().optional().or(z.literal("")),
            expiryDate: z.string().optional().or(z.literal("")),
            document: documentSchema.optional(),
          })
        )
        .optional(),
      insurance: z
        .object({
          hasInsurance: z.boolean().optional(),
          provider: z.string().optional().or(z.literal("")),
          policyNumber: z.string().optional().or(z.literal("")),
          coverageAmount: z.union([z.number(), z.string()]).optional(),
          expiryDate: z.string().optional().or(z.literal("")),
          document: documentSchema.optional(),
        })
        .optional(),
      backgroundCheck: z
        .object({
          status: z.string().optional().or(z.literal("")),
          completedAt: z.string().optional().or(z.literal("")),
          document: documentSchema.optional(),
        })
        .optional(),
      availability: z
        .object({
          schedule: z
            .array(
              z.object({
                day: z.string().optional().or(z.literal("")),
                startTime: z.string().optional().or(z.literal("")),
                endTime: z.string().optional().or(z.literal("")),
                isAvailable: z.boolean().optional(),
              })
            )
            .optional(),
          timezone: z.string().optional().or(z.literal("")),
          emergencyService: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),

  // Preferences and agency
  preferences: z
    .object({
      notifications: z
        .object({
          sms: z.boolean().optional(),
          email: z.boolean().optional(),
          push: z.boolean().optional(),
        })
        .optional(),
      language: z.string().optional().or(z.literal("")),
    })
    .optional(),
  agency: z
    .object({
      agencyId: z.string().optional().or(z.literal("")),
      role: z.string().optional().or(z.literal("")),
      status: z.string().optional().or(z.literal("")),
      commissionRate: z.union([z.number(), z.string()]).optional(),
    })
    .optional(),

  // Tags and notes
  tags: z.string().optional().or(z.literal("")), // comma-separated in form
  notes: z.array(z.object({ note: z.string().optional().or(z.literal("")) })).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface UserProfile {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  skills?: string[];
  experience?: string;
  avatar?: string;
  portfolio?: string[];
  role: string;
  createdAt: string;
  updatedAt: string;
  isVerified?: boolean;
}

export function EditProfileForm() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Get user role for conditional rendering
  const userRole = session?.user?.role;
  
  // Role-based visibility helpers
  const isProvider = userRole === 'PROVIDER';
  const isSupplier = userRole === 'SUPPLIER';
  const isInstructor = userRole === 'INSTRUCTOR';
  const isAgencyOwner = userRole === 'AGENCY_OWNER';
  const isAgencyAdmin = userRole === 'AGENCY_ADMIN';
  const isAdmin = userRole === 'ADMIN';
  
  // Business roles (providers, suppliers, instructors, agency roles)
  const isBusinessRole = isProvider || isSupplier || isInstructor || isAgencyOwner || isAgencyAdmin || isAdmin;
  
  // Service provider roles (providers, agency roles)
  const isServiceProvider = isProvider || isAgencyOwner || isAgencyAdmin || isAdmin;
  
  // Administrative roles
  const isAdministrative = isAgencyOwner || isAgencyAdmin || isAdmin;
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialValues, setInitialValues] = useState<ProfileForm | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    control,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      role: "",
      email: "",
      phoneNumber: "",
      profile: {
        avatar: { url: "", publicId: "", thumbnail: "" },
        bio: "",
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
          coordinates: { lat: undefined as number | undefined, lng: undefined as number | undefined },
        },
        businessName: "",
        businessType: "",
        serviceAreas: "",
        specialties: "",
        certifications: [],
        insurance: {
          hasInsurance: undefined,
          provider: "",
          policyNumber: "",
          coverageAmount: undefined,
          expiryDate: "",
          document: { url: "", publicId: "", filename: "" },
        },
        backgroundCheck: {
          status: "",
          completedAt: "",
          document: { url: "", publicId: "", filename: "" },
        },
        availability: { schedule: [], timezone: "", emergencyService: undefined },
      },
      preferences: { notifications: { sms: false, email: true, push: true }, language: "" },
      agency: { agencyId: "", role: "", status: "", commissionRate: undefined },
      tags: "",
      notes: [],
    }
  });

  // Dynamic field arrays
  const { fields: certificationFields, append: addCertification, remove: removeCertification } = useFieldArray({
    control,
    name: "profile.certifications" as const,
  });
  const { fields: scheduleFields, append: addSchedule, remove: removeSchedule } = useFieldArray({
    control,
    name: "profile.availability.schedule" as const,
  });
  const { fields: noteFields, append: addNote, remove: removeNote } = useFieldArray({
    control,
    name: "notes" as const,
  });

  // Watch form values for auto-save
  const watchedValues = watch();

  // Track if form has been modified
  useEffect(() => {
    if (initialValues && watchedValues) {
      const hasChanges = JSON.stringify(watchedValues) !== JSON.stringify(initialValues);
      setHasUnsavedChanges(hasChanges);
    }
  }, [watchedValues, initialValues]);

  const buildNestedPayload = useCallback((values: ProfileForm) => {
    const skillsArray = values.skills ? values.skills.split(",").map(s => s.trim()).filter(Boolean) : [];
    const serviceAreasArray = values.profile?.serviceAreas ? values.profile.serviceAreas.split(",").map(s => s.trim()).filter(Boolean) : [];
    const specialtiesArray = values.profile?.specialties ? values.profile.specialties.split(",").map(s => s.trim()).filter(Boolean) : [];
    const tagsArray = values.tags ? values.tags.split(",").map(s => s.trim()).filter(Boolean) : [];

    const experienceNum = values.profile?.experience ?? (values.experience ? Number(values.experience) : undefined);
    const yearsInBusinessNum = values.profile?.yearsInBusiness ? Number(values.profile.yearsInBusiness) : undefined;
    const coverageAmountNum = values.profile?.insurance?.coverageAmount ? Number(values.profile.insurance.coverageAmount) : undefined;
    const commissionNum = values.agency?.commissionRate ? Number(values.agency.commissionRate) : undefined;

    return {
      name: values.name,
      phone: values.phone || values.phoneNumber || "",
      phoneNumber: values.phoneNumber || values.phone || "",
      email: values.email || "",
      firstName: values.firstName || "",
      lastName: values.lastName || "",
      role: values.role || "",
      profile: {
        avatar: values.profile?.avatar,
        bio: values.profile?.bio || values.bio || "",
        address: values.profile?.address,
        skills: skillsArray.length ? skillsArray : undefined,
        experience: typeof experienceNum === 'number' && !isNaN(experienceNum) ? experienceNum : undefined,
        businessName: values.profile?.businessName || undefined,
        businessType: values.profile?.businessType || undefined,
        yearsInBusiness: typeof yearsInBusinessNum === 'number' && !isNaN(yearsInBusinessNum) ? yearsInBusinessNum : undefined,
        serviceAreas: serviceAreasArray.length ? serviceAreasArray : undefined,
        specialties: specialtiesArray.length ? specialtiesArray : undefined,
        certifications: values.profile?.certifications,
        insurance: values.profile?.insurance ? {
          ...values.profile.insurance,
          coverageAmount: typeof coverageAmountNum === 'number' && !isNaN(coverageAmountNum) ? coverageAmountNum : undefined,
        } : undefined,
        backgroundCheck: values.profile?.backgroundCheck,
        availability: values.profile?.availability,
        portfolio: profile?.portfolio,
      },
      preferences: values.preferences,
      agency: values.agency ? {
        ...values.agency,
        commissionRate: typeof commissionNum === 'number' && !isNaN(commissionNum) ? commissionNum : undefined,
      } : undefined,
      tags: tagsArray,
      notes: values.notes,
    };
  }, [profile?.portfolio]);

  // Auto-save functionality - only when there are actual changes
  useEffect(() => {
    if (!session?.user?.id || !hasUnsavedChanges || autoSaveStatus === 'saving') return;

    const timeoutId = setTimeout(async () => {
      try {
        setAutoSaveStatus('saving');
        
        const values = watchedValues as ProfileForm;
        const payload = buildNestedPayload(values);
        const response = await fetch(`/api/users/${session.user.id}`, 
          createAuthFetchOptions({
            method: "PUT",
            body: JSON.stringify(payload),
          })
        );

        if (response.ok) {
          setAutoSaveStatus('saved');
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
          setInitialValues({ ...(watchedValues as ProfileForm) }); // Update initial values to current
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        } else {
          setAutoSaveStatus('error');
          setTimeout(() => setAutoSaveStatus('idle'), 3000);
        }
      } catch (error) {
        console.error("Auto-save error:", error);
        setAutoSaveStatus('error');
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [watchedValues, session?.user?.id, hasUnsavedChanges, autoSaveStatus, buildNestedPayload]);

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/users/${session.user.id}`, 
        createAuthFetchOptions()
      );
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        const formData: ProfileForm = {
          name: data.name || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          role: data.role || "",
          email: data.email || "",
          phoneNumber: (data as { phoneNumber?: string }).phoneNumber || data.phone || "",
          phone: data.phone || "",
          bio: (data as { profile?: { bio?: string } }).profile?.bio || data.bio || "",
          location: data.location || "",
          website: data.website || "",
          skills: Array.isArray(data.skills)
            ? data.skills.join(", ")
            : Array.isArray((data as { profile?: { skills?: string[] } }).profile?.skills)
            ? (data as { profile: { skills: string[] } }).profile.skills.join(", ")
            : "",
          experience:
            typeof (data as { profile?: { experience?: unknown } }).profile?.experience !== "undefined"
              ? String((data as { profile: { experience: unknown } }).profile.experience)
              : data.experience || "",
          profile: {
            avatar: (data as { profile?: { avatar?: unknown } }).profile?.avatar,
            bio: (data as { profile?: { bio?: string } }).profile?.bio || "",
            address: (data as { profile?: { address?: unknown } }).profile?.address || {
              street: "",
              city: "",
              state: "",
              zipCode: "",
              country: "",
            },
            experience: (data as { profile?: { experience?: unknown } }).profile?.experience,
            businessName: (data as { profile?: { businessName?: string } }).profile?.businessName || "",
            businessType: (data as { profile?: { businessType?: string } }).profile?.businessType || "",
            yearsInBusiness: (data as { profile?: { yearsInBusiness?: unknown } }).profile?.yearsInBusiness,
            serviceAreas: Array.isArray((data as { profile?: { serviceAreas?: string[] } }).profile?.serviceAreas)
              ? (data as { profile: { serviceAreas: string[] } }).profile.serviceAreas.join(", ")
              : "",
            specialties: Array.isArray((data as { profile?: { specialties?: string[] } }).profile?.specialties)
              ? (data as { profile: { specialties: string[] } }).profile.specialties.join(", ")
              : "",
            certifications: (data as { profile?: { certifications?: unknown[] } }).profile?.certifications || [],
            insurance: (data as { profile?: { insurance?: unknown } }).profile?.insurance,
            backgroundCheck: (data as { profile?: { backgroundCheck?: unknown } }).profile?.backgroundCheck,
            availability: (data as { profile?: { availability?: unknown } }).profile?.availability || { schedule: [] },
          },
          preferences: (data as { preferences?: unknown }).preferences || {
            notifications: { sms: false, email: true, push: true },
            language: "",
          },
          agency: (data as { agency?: unknown }).agency || {
            agencyId: "",
            role: "",
            status: "",
            commissionRate: undefined,
          },
          tags: Array.isArray((data as { tags?: string[] }).tags)
            ? (data as { tags: string[] }).tags.join(", ")
            : "",
          notes: (data as { notes?: unknown[] }).notes || [],
        } as ProfileForm;
        reset(formData);
        setInitialValues(formData); // Set initial values for change detection
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to fetch profile");
    }
  }, [session?.user?.id, reset]);

  // Fetch user profile
  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session, fetchProfile]);


  const onSubmit = async (data: ProfileForm) => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    try {
      const payload = buildNestedPayload(data);
      const response = await fetch(`/api/users/${session.user.id}`, 
        createAuthFetchOptions({
          method: "PUT",
          body: JSON.stringify(payload),
        })
      );

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setHasUnsavedChanges(false);
        setInitialValues({ ...data, skills: data.skills || "" });
        toast.success("Profile updated successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const response = await fetch("/api/auth/upload-avatar", 
        createAuthFetchOptions({
          method: "POST",
          headers: {}, // Override Content-Type for FormData
          body: formData,
        })
      );

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, avatar: data.avatar } : null);
        setAvatarFile(null);
        toast.success("Avatar uploaded successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to upload avatar");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortfolioUpload = async (files: File[]) => {
    if (!session?.user?.id || files.length === 0) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`portfolio_${index}`, file);
      });

      const response = await fetch("/api/auth/upload-portfolio", 
        createAuthFetchOptions({
          method: "POST",
          headers: {}, // Override Content-Type for FormData
          body: formData,
        })
      );

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, portfolio: data.portfolio } : null);
        toast.success("Portfolio uploaded successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to upload portfolio");
      }
    } catch (error) {
      console.error("Error uploading portfolio:", error);
      toast.error("Failed to upload portfolio");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortfolioDelete = async (index: number) => {
    if (!session?.user?.id || !profile?.portfolio) return;
    
    setIsLoading(true);
    try {
      const updatedPortfolio = profile.portfolio.filter((_, i) => i !== index);
      const response = await fetch(`/api/users/${session.user.id}`, 
        createAuthFetchOptions({
          method: "PUT",
          body: JSON.stringify({ portfolio: updatedPortfolio }),
        })
      );
      
      if (response.ok) {
        setProfile(prev => prev ? { ...prev, portfolio: updatedPortfolio } : null);
        toast.success("Portfolio image removed successfully!");
      } else {
        toast.error("Failed to remove portfolio image");
      }
    } catch (error) {
      console.error("Error removing portfolio image:", error);
      toast.error("Failed to remove portfolio image");
    } finally {
      setIsLoading(false);
    }
  };

  // Plain component, no close/cancel actions

  if (!profile) {
    return (
      <div className="min-h-[200px] bg-gray-50 flex items-center justify-center rounded-lg">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-700">Edit Profile</h2>
          <p className="text-sm text-gray-600 mt-1">Update your personal information and preferences</p>
        </div>
      </div>

          {/* Auto-save Status */}
          {(autoSaveStatus !== 'idle' || hasUnsavedChanges) && (
            <div className="px-6 py-2 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center space-x-2 text-sm">
                {autoSaveStatus === 'saving' && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    <span className="text-gray-600">Saving...</span>
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Saved</span>
                  </>
                )}
                {autoSaveStatus === 'error' && (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-600">Save failed</span>
                  </>
                )}
                {autoSaveStatus === 'idle' && hasUnsavedChanges && (
                  <>
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-orange-600">Unsaved changes</span>
                  </>
                )}
                {autoSaveStatus === 'idle' && !hasUnsavedChanges && lastSaved && (
                  <>
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">
                      Last saved {lastSaved.toLocaleTimeString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

      {/* Content */}
      <div className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4 pb-6 border-b border-gray-100">
                <AvatarUpload
                  currentAvatar={profile.avatar}
                  onUpload={handleAvatarUpload}
                  isLoading={isLoading}
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">{profile?.name || "User"}</h3>
                  <p className="text-gray-600 capitalize">{profile?.role || "User"}</p>
                  {profile?.isVerified && (
                    <div className="flex items-center mt-1">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-xs text-green-600 font-medium">Verified</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-8">
                {/* Personal */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 tracking-wide">Personal</h3>
                  <div className="h-px bg-gray-200" />
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    {...register("name")}
                    type="text"
                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Contact */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 tracking-wide">Contact</h3>
                  <div className="h-px bg-gray-200" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="First Name"
                      {...register("firstName")}
                      type="text"
                    />
                  </div>
                  <div>
                    <Input
                      label="Last Name"
                      {...register("lastName")}
                      type="text"
                    />
                  </div>
                  <div>
                    <Input
                      label="Email"
                      {...register("email")}
                      type="email"
                    />
                  </div>
                  <div>
                    <Input
                      label="Phone Number"
                      {...register("phoneNumber")}
                      type="tel"
                      placeholder="+63-900-000-0000"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone
                  </label>
                  <input
                    {...register("phone")}
                    type="tel"
                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300"
                  />
                </div>

                {/* Address */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 tracking-wide">Address</h3>
                  <div className="h-px bg-gray-200" />
                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Location
                  </label>
                  <input
                    {...register("location")}
                    type="text"
                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                    <input {...register("profile.address.street")} type="text" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input {...register("profile.address.city")} type="text" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input {...register("profile.address.state")} type="text" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                    <input {...register("profile.address.zipCode")} type="text" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input {...register("profile.address.country")} type="text" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300" />
                  </div>
                </div>
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    Website
                  </label>
                  <input
                    {...register("website")}
                    type="url"
                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300"
                  />
                  {errors.website && (
                    <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
                  )}
                </div>

                {/* Skills & Specialties */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 tracking-wide">
                    {isBusinessRole ? "Professional Skills & Specialties" : "Skills"}
                  </h3>
                  <div className="h-px bg-gray-200" />
                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    {isBusinessRole ? "Professional Skills" : "Skills"}
                  </label>
                  <input
                    {...register("skills")}
                    type="text"
                    placeholder="Enter skills separated by commas"
                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300"
                  />
                </div>

                {/* Service Areas and Specialties - Only for service providers */}
                {isServiceProvider && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Service Areas</label>
                      <input {...register("profile.serviceAreas")} type="text" placeholder="Comma-separated" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Specialties</label>
                      <input {...register("profile.specialties")} type="text" placeholder="Comma-separated" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300" />
                    </div>
                  </div>
                )}
                </div>

                {/* Bio */}
                <div>
                  <Textarea
                    label="Bio"
                    {...register("bio")}
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Professional & Business - Only for business roles */}
                {isBusinessRole && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 tracking-wide">
                      {isServiceProvider ? "Service & Business" : isInstructor ? "Teaching & Business" : "Professional & Business"}
                    </h3>
                    <div className="h-px bg-gray-200" />
                    {/* Experience */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {isServiceProvider ? "Service Experience" : isInstructor ? "Teaching Experience" : "Professional Experience"}
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input {...register("experience")} type="number" placeholder="Years of experience" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300" />
                        <input {...register("profile.yearsInBusiness")} type="number" placeholder="Years in business" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300" />
                        <input {...register("profile.businessName")} type="text" placeholder="Business name" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <input {...register("profile.businessType")} type="text" placeholder="Business type" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Media - Only for business roles */}
                {isBusinessRole && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 tracking-wide">
                      {isServiceProvider ? "Service Portfolio" : isInstructor ? "Teaching Portfolio" : "Professional Portfolio"}
                    </h3>
                    <div className="h-px bg-gray-200" />
                    {/* Portfolio Gallery */}
                    <PortfolioGallery
                      portfolio={profile.portfolio || []}
                      onUpload={handlePortfolioUpload}
                      onDelete={handlePortfolioDelete}
                      isLoading={isLoading}
                    />
                  </div>
                )}

                {/* Certifications - Only for business roles */}
                {isBusinessRole && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 tracking-wide">
                      {isServiceProvider ? "Professional Certifications" : isInstructor ? "Teaching Certifications" : "Professional Certifications"}
                    </h3>
                    <div className="h-px bg-gray-200" />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <button type="button" onClick={() => addCertification({ name: "", issuer: "", issueDate: "", expiryDate: "", document: { url: "", publicId: "", filename: "" } })} className="text-green-600 text-sm">Add</button>
                      </div>
                      {certificationFields.map((field, idx) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg">
                          <input {...register(`profile.certifications.${idx}.name` as const)} placeholder="Name" className="px-3 py-2 border border-gray-200 rounded" />
                          <input {...register(`profile.certifications.${idx}.issuer` as const)} placeholder="Issuer" className="px-3 py-2 border border-gray-200 rounded" />
                          <input {...register(`profile.certifications.${idx}.issueDate` as const)} type="date" className="px-3 py-2 border border-gray-200 rounded" />
                          <input {...register(`profile.certifications.${idx}.expiryDate` as const)} type="date" className="px-3 py-2 border border-gray-200 rounded" />
                          <div className="flex items-center gap-2">
                            <input {...register(`profile.certifications.${idx}.document.url` as const)} placeholder="Doc URL" className="flex-1 px-3 py-2 border border-gray-200 rounded" />
                            <button type="button" onClick={() => removeCertification(idx)} className="text-red-600 text-sm">Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Insurance - Only for business roles */}
                {isBusinessRole && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 tracking-wide">
                      {isServiceProvider ? "Professional Insurance" : isInstructor ? "Teaching Insurance" : "Business Insurance"}
                    </h3>
                    <div className="h-px bg-gray-200" />
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                          <input type="checkbox" {...register("profile.insurance.hasInsurance")} className="rounded" /> Has insurance
                        </label>
                        <input {...register("profile.insurance.provider")} placeholder="Provider" className="px-3 py-2 border border-gray-200 rounded" />
                        <input {...register("profile.insurance.policyNumber")} placeholder="Policy number" className="px-3 py-2 border border-gray-200 rounded" />
                        <input {...register("profile.insurance.coverageAmount")} type="number" placeholder="Coverage amount" className="px-3 py-2 border border-gray-200 rounded" />
                        <input {...register("profile.insurance.expiryDate")} type="date" className="px-3 py-2 border border-gray-200 rounded" />
                        <input {...register("profile.insurance.document.url")} placeholder="Document URL" className="px-3 py-2 border border-gray-200 rounded" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Background Check - Only for business roles */}
                {isBusinessRole && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 tracking-wide">
                      {isServiceProvider ? "Professional Background Check" : isInstructor ? "Teaching Background Check" : "Business Background Check"}
                    </h3>
                    <div className="h-px bg-gray-200" />
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input {...register("profile.backgroundCheck.status")} placeholder="Status" className="px-3 py-2 border border-gray-200 rounded" />
                        <input {...register("profile.backgroundCheck.completedAt")} type="date" className="px-3 py-2 border border-gray-200 rounded" />
                        <input {...register("profile.backgroundCheck.document.url")} placeholder="Document URL" className="px-3 py-2 border border-gray-200 rounded" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Availability - Only for service providers */}
                {isServiceProvider && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 tracking-wide">Service Availability</h3>
                    <div className="h-px bg-gray-200" />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <button type="button" onClick={() => addSchedule({ day: "monday", startTime: "08:00", endTime: "17:00", isAvailable: true })} className="text-green-600 text-sm">Add day</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input {...register("profile.availability.timezone")} placeholder="Timezone (e.g. Asia/Manila)" className="px-3 py-2 border border-gray-200 rounded" />
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                          <input type="checkbox" {...register("profile.availability.emergencyService")} className="rounded" /> Emergency service
                        </label>
                      </div>
                      {scheduleFields.map((field, idx) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg">
                          <select {...register(`profile.availability.schedule.${idx}.day` as const)} className="px-3 py-2 border border-gray-200 rounded">
                            {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d => (<option key={d} value={d}>{d}</option>))}
                          </select>
                          <input {...register(`profile.availability.schedule.${idx}.startTime` as const)} type="time" className="px-3 py-2 border border-gray-200 rounded" />
                          <input {...register(`profile.availability.schedule.${idx}.endTime` as const)} type="time" className="px-3 py-2 border border-gray-200 rounded" />
                          <label className="inline-flex items-center gap-2">
                            <input type="checkbox" {...register(`profile.availability.schedule.${idx}.isAvailable` as const)} className="rounded" />
                            <span className="text-sm text-gray-700">Available</span>
                          </label>
                          <button type="button" onClick={() => removeSchedule(idx)} className="text-red-600 text-sm">Remove</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preferences and Agency */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 tracking-wide">
                    {isAdministrative ? "Preferences & Agency" : "Preferences"}
                  </h3>
                  <div className="h-px bg-gray-200" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" {...register("preferences.notifications.sms")} className="rounded" /> SMS</label>
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" {...register("preferences.notifications.email")} className="rounded" /> Email</label>
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" {...register("preferences.notifications.push")} className="rounded" /> Push</label>
                    </div>
                    <input {...register("preferences.language")} placeholder="Language code (e.g. en)" className="px-3 py-2 border border-gray-200 rounded w-full" />
                  </div>
                  {/* Agency information - Only for administrative roles */}
                  {isAdministrative && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input {...register("agency.agencyId")} placeholder="Agency ID" className="px-3 py-2 border border-gray-200 rounded" />
                        <input {...register("agency.role")} placeholder="Role" className="px-3 py-2 border border-gray-200 rounded" />
                        <input {...register("agency.status")} placeholder="Status" className="px-3 py-2 border border-gray-200 rounded" />
                        <input {...register("agency.commissionRate")} type="number" placeholder="Commission %" className="px-3 py-2 border border-gray-200 rounded" />
                      </div>
                    </div>
                  )}
                </div>
                </div>
              </div>
                </div>

                {/* Tags & Notes */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 tracking-wide">Tags & Notes</h3>
                  <div className="h-px bg-gray-200" />
                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input {...register("tags")} type="text" placeholder="Comma-separated (e.g. top_rated, fast_response)" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300" />
                </div>

                {/* Notes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <button type="button" onClick={() => addNote({ note: "" })} className="text-green-600 text-sm">Add note</button>
                  </div>
                  {noteFields.map((field, idx) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <input {...register(`notes.${idx}.note` as const)} placeholder="Note" className="flex-1 px-3 py-2 border border-gray-200 rounded" />
                      <button type="button" onClick={() => removeNote(idx)} className="text-red-600 text-sm">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
              </div>
            </form>
          </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
            className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
