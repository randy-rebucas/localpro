"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/hooks/useAuth";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
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
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";

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

// Enums from User data entity
const roleEnum = z.enum(['client', 'provider', 'admin', 'supplier', 'instructor', 'agency_owner', 'agency_admin']);
const businessTypeEnum = z.enum(['individual', 'small_business', 'enterprise', 'franchise']);
const backgroundCheckStatusEnum = z.enum(['pending', 'approved', 'rejected', 'not_required']);
const agencyRoleEnum = z.enum(['owner', 'admin', 'manager', 'supervisor', 'provider']);
const agencyStatusEnum = z.enum(['active', 'inactive', 'suspended', 'pending']);
const dayEnum = z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);

const profileImageSchema = z.object({
  url: z.string().url().optional().or(z.literal("")),
  publicId: z.string().optional().or(z.literal("")),
  thumbnail: z.string().url().optional().or(z.literal("")),
});

const profileSchema = z.object({
  // Basic Information (from User entity)
  phoneNumber: z.string().min(1, "Phone number is required").optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  firstName: z.string().optional().or(z.literal("")),
  lastName: z.string().optional().or(z.literal("")),
  role: roleEnum.optional().or(z.literal("")),
  isVerified: z.boolean().optional(),

  // Legacy flat fields (kept for backward compatibility/rendering)
  name: z.string().min(2, "Name must be at least 2 characters").optional().or(z.literal("")),
  phone: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  skills: z.string().optional(), // comma-separated in form
  experience: z.union([z.string(), z.number()]).optional(),

  // Profile Information (from User entity)
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
      skills: z.string().optional().or(z.literal("")), // comma-separated in form, array in entity
      experience: z.union([z.number(), z.string()]).optional(),
      rating: z.number().min(0).max(5).optional(),
      totalReviews: z.number().optional(),
      businessName: z.string().optional().or(z.literal("")),
      businessType: businessTypeEnum.optional().or(z.literal("")),
      yearsInBusiness: z.union([z.number(), z.string()]).optional(),
      serviceAreas: z.string().optional().or(z.literal("")), // comma-separated in form, array in entity
      specialties: z.string().optional().or(z.literal("")), // comma-separated in form, array in entity
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
          status: backgroundCheckStatusEnum.optional().or(z.literal("")),
          completedAt: z.string().optional().or(z.literal("")),
          document: documentSchema.optional(),
        })
        .optional(),
      portfolio: z
        .array(
          z.object({
            title: z.string().optional().or(z.literal("")),
            description: z.string().optional().or(z.literal("")),
            images: z.array(profileImageSchema).optional(),
            category: z.string().optional().or(z.literal("")),
            completedAt: z.string().optional().or(z.literal("")),
          })
        )
        .optional(),
      availability: z
        .object({
          schedule: z
            .array(
              z.object({
                day: dayEnum.optional().or(z.literal("")),
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

  // User Preferences (from User entity)
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

  // Agency Relationship (from User entity)
  agency: z
    .object({
      agencyId: z.string().optional().or(z.literal("")),
      role: agencyRoleEnum.optional().or(z.literal("")),
      joinedAt: z.string().optional().or(z.literal("")),
      status: agencyStatusEnum.optional().or(z.literal("")),
      commissionRate: z.union([z.number(), z.string()]).optional(),
    })
    .optional(),

  // Tags and notes (from User entity)
  // For form input, we use comma-separated strings but convert to arrays on submit
  tags: z.string().optional().or(z.literal("")), // comma-separated in form, array in entity
  notes: z.array(z.object({ 
    note: z.string().optional().or(z.literal("")),
    addedBy: z.string().optional().or(z.literal("")),
    addedAt: z.string().optional().or(z.literal("")),
  })).optional(),
  
  // Portfolio (for form, keep as array)
  portfolio: z
    .array(
      z.object({
        title: z.string().optional().or(z.literal("")),
        description: z.string().optional().or(z.literal("")),
        images: z.array(profileImageSchema).optional(),
        category: z.string().optional().or(z.literal("")),
        completedAt: z.string().optional().or(z.literal("")),
      })
    )
    .optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface AvatarObject {
  url?: string;
  thumbnail?: string;
  publicId?: string;
}

export interface UserProfile {
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
  avatar?: string | AvatarObject; // Support both string (legacy) and object formats
  portfolio?: string[];
  role: string;
  createdAt: string;
  updatedAt: string;
  isVerified?: boolean;
  profile?: {
    avatar?: AvatarObject;
    [key: string]: unknown;
  };
}

interface EditProfileFormProps {
  initialProfile?: UserProfile | null;
}

export function EditProfileForm({ initialProfile }: EditProfileFormProps = {}) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile || null);
  
  // Get user role for conditional rendering
  const userRole = session?.user?.role;
  
  // Role-based visibility helpers
  const isClient = userRole === 'CLIENT' || userRole === 'client';
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
    setValue,
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
    // Check if user is a client - clients can only update specific fields
    const currentUserRole = session?.user?.role;
    const isClientUser = currentUserRole === 'CLIENT' || currentUserRole === 'client';
    
    // For clients, only include allowed fields
    if (isClientUser) {
      const payload: Record<string, unknown> = {};
      
      // Only include firstName if it has a value
      if (values.firstName && values.firstName.trim()) {
        payload.firstName = values.firstName.trim();
      }
      
      // Only include lastName if it has a value
      if (values.lastName && values.lastName.trim()) {
        payload.lastName = values.lastName.trim();
      }
      
      // Only include email if it has a value
      if (values.email && values.email.trim()) {
        payload.email = values.email.trim();
      }
      
      // Build profile object - only include bio and address for clients
      const profilePayload: Record<string, unknown> = {};
      
      const bioValue = values.profile?.bio || values.bio;
      if (bioValue && bioValue.trim()) {
        profilePayload.bio = bioValue.trim();
      }
      
      // Build address object - only include if it has meaningful data
      if (values.profile?.address) {
        const address: Record<string, unknown> = {};
        let hasAddressData = false;
        
        if (values.profile.address.street && values.profile.address.street.trim()) {
          address.street = values.profile.address.street.trim();
          hasAddressData = true;
        }
        if (values.profile.address.city && values.profile.address.city.trim()) {
          address.city = values.profile.address.city.trim();
          hasAddressData = true;
        }
        if (values.profile.address.state && values.profile.address.state.trim()) {
          address.state = values.profile.address.state.trim();
          hasAddressData = true;
        }
        if (values.profile.address.zipCode && values.profile.address.zipCode.trim()) {
          address.zipCode = values.profile.address.zipCode.trim();
          hasAddressData = true;
        }
        if (values.profile.address.country && values.profile.address.country.trim()) {
          address.country = values.profile.address.country.trim();
          hasAddressData = true;
        }
        
        // Include coordinates if they exist
        if (values.profile.address.coordinates) {
          const coords: Record<string, unknown> = {};
          if (typeof values.profile.address.coordinates.lat === 'number' && !isNaN(values.profile.address.coordinates.lat)) {
            coords.lat = values.profile.address.coordinates.lat;
            hasAddressData = true;
          }
          if (typeof values.profile.address.coordinates.lng === 'number' && !isNaN(values.profile.address.coordinates.lng)) {
            coords.lng = values.profile.address.coordinates.lng;
            hasAddressData = true;
          }
          if (Object.keys(coords).length > 0) {
            address.coordinates = coords;
          }
        }
        
        if (hasAddressData) {
          profilePayload.address = address;
        }
      }
      
      // Only include profile if it has any fields
      if (Object.keys(profilePayload).length > 0) {
        payload.profile = profilePayload;
      }
      
      return payload;
    }
    
    // For non-client roles, use the payload structure matching the interface
    // Only include fields from the payload interface: firstName, lastName, email, and profile fields
    
    // Convert comma-separated strings to arrays (from form to entity format)
    const skillsArray = values.profile?.skills 
      ? (typeof values.profile.skills === 'string' 
          ? values.profile.skills.split(",").map(s => s.trim()).filter(Boolean)
          : Array.isArray(values.profile.skills) ? values.profile.skills : [])
      : (values.skills ? values.skills.split(",").map(s => s.trim()).filter(Boolean) : []);
    
    const serviceAreasArray = values.profile?.serviceAreas && typeof values.profile.serviceAreas === 'string'
      ? values.profile.serviceAreas.split(",").map(s => s.trim()).filter(Boolean)
      : Array.isArray(values.profile?.serviceAreas) ? values.profile.serviceAreas : [];
    
    const specialtiesArray = values.profile?.specialties && typeof values.profile.specialties === 'string'
      ? values.profile.specialties.split(",").map(s => s.trim()).filter(Boolean)
      : Array.isArray(values.profile?.specialties) ? values.profile.specialties : [];

    const experienceNum = values.profile?.experience ?? (values.experience ? Number(values.experience) : undefined);
    const yearsInBusinessNum = values.profile?.yearsInBusiness ? Number(values.profile.yearsInBusiness) : undefined;
    const coverageAmountNum = values.profile?.insurance?.coverageAmount ? Number(values.profile.insurance.coverageAmount) : undefined;

    // Build base payload - only include fields from payload interface
    const payload: Record<string, unknown> = {};
    
    // Only include email if it has a value
    if (values.email && values.email.trim()) {
      payload.email = values.email.trim();
    }
    
    // Only include firstName if it has a value
    if (values.firstName && values.firstName.trim()) {
      payload.firstName = values.firstName.trim();
    }
    
    // Only include lastName if it has a value
    if (values.lastName && values.lastName.trim()) {
      payload.lastName = values.lastName.trim();
    }
    
    // Build profile object - only include fields with values
    const profilePayload: Record<string, unknown> = {};
    
    if (values.profile?.avatar) {
      profilePayload.avatar = values.profile.avatar;
    }
    
    const bioValue = values.profile?.bio || values.bio;
    if (bioValue && bioValue.trim()) {
      profilePayload.bio = bioValue.trim();
    }
    
    // Build address object - only include if it has meaningful data
    if (values.profile?.address) {
      const address: Record<string, unknown> = {};
      let hasAddressData = false;
      
      if (values.profile.address.street && values.profile.address.street.trim()) {
        address.street = values.profile.address.street.trim();
        hasAddressData = true;
      }
      if (values.profile.address.city && values.profile.address.city.trim()) {
        address.city = values.profile.address.city.trim();
        hasAddressData = true;
      }
      if (values.profile.address.state && values.profile.address.state.trim()) {
        address.state = values.profile.address.state.trim();
        hasAddressData = true;
      }
      if (values.profile.address.zipCode && values.profile.address.zipCode.trim()) {
        address.zipCode = values.profile.address.zipCode.trim();
        hasAddressData = true;
      }
      if (values.profile.address.country && values.profile.address.country.trim()) {
        address.country = values.profile.address.country.trim();
        hasAddressData = true;
      }
      
      // Include coordinates if they exist
      if (values.profile.address.coordinates) {
        const coords: Record<string, unknown> = {};
        if (typeof values.profile.address.coordinates.lat === 'number' && !isNaN(values.profile.address.coordinates.lat)) {
          coords.lat = values.profile.address.coordinates.lat;
          hasAddressData = true;
        }
        if (typeof values.profile.address.coordinates.lng === 'number' && !isNaN(values.profile.address.coordinates.lng)) {
          coords.lng = values.profile.address.coordinates.lng;
          hasAddressData = true;
        }
        if (Object.keys(coords).length > 0) {
          address.coordinates = coords;
        }
      }
      
      if (hasAddressData) {
        profilePayload.address = address;
      }
    }
    
    if (skillsArray.length > 0) {
      profilePayload.skills = skillsArray;
    }
    
    if (typeof experienceNum === 'number' && !isNaN(experienceNum)) {
      profilePayload.experience = experienceNum;
    }
    
    if (values.profile?.businessName && values.profile.businessName.trim()) {
      profilePayload.businessName = values.profile.businessName.trim();
    }
    
    if (values.profile?.businessType && values.profile.businessType.trim()) {
      profilePayload.businessType = values.profile.businessType.trim();
    }
    
    if (typeof yearsInBusinessNum === 'number' && !isNaN(yearsInBusinessNum)) {
      profilePayload.yearsInBusiness = yearsInBusinessNum;
    }
    
    if (serviceAreasArray.length > 0) {
      profilePayload.serviceAreas = serviceAreasArray;
    }
    
    if (specialtiesArray.length > 0) {
      profilePayload.specialties = specialtiesArray;
    }
    
    // Build certifications array - filter out empty entries and clean up structure
    if (values.profile?.certifications && Array.isArray(values.profile.certifications) && values.profile.certifications.length > 0) {
      const cleanCertifications = values.profile.certifications
        .map((cert: Record<string, unknown>) => {
          const cleaned: Record<string, unknown> = {};
          if (cert.name && cert.name.trim()) cleaned.name = cert.name.trim();
          if (cert.issuer && cert.issuer.trim()) cleaned.issuer = cert.issuer.trim();
          if (cert.issueDate && cert.issueDate.trim()) cleaned.issueDate = cert.issueDate.trim();
          if (cert.expiryDate && cert.expiryDate.trim()) cleaned.expiryDate = cert.expiryDate.trim();
          if (cert.document && (cert.document.url || cert.document.publicId)) {
            cleaned.document = {};
            if (cert.document.url && cert.document.url.trim()) cleaned.document.url = cert.document.url.trim();
            if (cert.document.publicId && cert.document.publicId.trim()) cleaned.document.publicId = cert.document.publicId.trim();
            if (cert.document.filename && cert.document.filename.trim()) cleaned.document.filename = cert.document.filename.trim();
          }
          // Only include if it has at least name or issuer
          return (cleaned.name || cleaned.issuer) ? cleaned : null;
        })
        .filter(Boolean);
      
      if (cleanCertifications.length > 0) {
        profilePayload.certifications = cleanCertifications;
      }
    }
    
    // Build insurance object - only include fields with values
    if (values.profile?.insurance) {
      const insurancePayload: Record<string, unknown> = {};
      let hasInsuranceData = false;
      
      if (typeof values.profile.insurance.hasInsurance === 'boolean') {
        insurancePayload.hasInsurance = values.profile.insurance.hasInsurance;
        hasInsuranceData = true;
      }
      if (values.profile.insurance.provider && values.profile.insurance.provider.trim()) {
        insurancePayload.provider = values.profile.insurance.provider.trim();
        hasInsuranceData = true;
      }
      if (values.profile.insurance.policyNumber && values.profile.insurance.policyNumber.trim()) {
        insurancePayload.policyNumber = values.profile.insurance.policyNumber.trim();
        hasInsuranceData = true;
      }
      if (typeof coverageAmountNum === 'number' && !isNaN(coverageAmountNum)) {
        insurancePayload.coverageAmount = coverageAmountNum;
        hasInsuranceData = true;
      }
      if (values.profile.insurance.expiryDate && values.profile.insurance.expiryDate.trim()) {
        insurancePayload.expiryDate = values.profile.insurance.expiryDate.trim();
        hasInsuranceData = true;
      }
      if (values.profile.insurance.document && (values.profile.insurance.document.url || values.profile.insurance.document.publicId)) {
        insurancePayload.document = {};
        if (values.profile.insurance.document.url && values.profile.insurance.document.url.trim()) {
          insurancePayload.document.url = values.profile.insurance.document.url.trim();
        }
        if (values.profile.insurance.document.publicId && values.profile.insurance.document.publicId.trim()) {
          insurancePayload.document.publicId = values.profile.insurance.document.publicId.trim();
        }
        if (values.profile.insurance.document.filename && values.profile.insurance.document.filename.trim()) {
          insurancePayload.document.filename = values.profile.insurance.document.filename.trim();
        }
        hasInsuranceData = true;
      }
      
      if (hasInsuranceData) {
        profilePayload.insurance = insurancePayload;
      }
    }
    
    // Build backgroundCheck object - only include fields with values
    if (values.profile?.backgroundCheck) {
      const bgCheckPayload: Record<string, unknown> = {};
      let hasBgCheckData = false;
      
      if (values.profile.backgroundCheck.status && values.profile.backgroundCheck.status.trim()) {
        bgCheckPayload.status = values.profile.backgroundCheck.status.trim();
        hasBgCheckData = true;
      }
      if (values.profile.backgroundCheck.completedAt && values.profile.backgroundCheck.completedAt.trim()) {
        bgCheckPayload.completedAt = values.profile.backgroundCheck.completedAt.trim();
        hasBgCheckData = true;
      }
      if (values.profile.backgroundCheck.document && (values.profile.backgroundCheck.document.url || values.profile.backgroundCheck.document.publicId)) {
        bgCheckPayload.document = {};
        if (values.profile.backgroundCheck.document.url && values.profile.backgroundCheck.document.url.trim()) {
          bgCheckPayload.document.url = values.profile.backgroundCheck.document.url.trim();
        }
        if (values.profile.backgroundCheck.document.publicId && values.profile.backgroundCheck.document.publicId.trim()) {
          bgCheckPayload.document.publicId = values.profile.backgroundCheck.document.publicId.trim();
        }
        if (values.profile.backgroundCheck.document.filename && values.profile.backgroundCheck.document.filename.trim()) {
          bgCheckPayload.document.filename = values.profile.backgroundCheck.document.filename.trim();
        }
        hasBgCheckData = true;
      }
      
      if (hasBgCheckData) {
        profilePayload.backgroundCheck = bgCheckPayload;
      }
    }
    
    // Build availability object - only include if it has meaningful data
    if (values.profile?.availability) {
      const availabilityPayload: Record<string, unknown> = {};
      let hasAvailabilityData = false;
      
      if (values.profile.availability.schedule && Array.isArray(values.profile.availability.schedule) && values.profile.availability.schedule.length > 0) {
        const cleanSchedule = values.profile.availability.schedule
          .map((sched: Record<string, unknown>) => {
            const cleaned: Record<string, unknown> = {};
            if (sched.day && sched.day.trim()) cleaned.day = sched.day.trim();
            if (sched.startTime && sched.startTime.trim()) cleaned.startTime = sched.startTime.trim();
            if (sched.endTime && sched.endTime.trim()) cleaned.endTime = sched.endTime.trim();
            if (typeof sched.isAvailable === 'boolean') cleaned.isAvailable = sched.isAvailable;
            // Only include if it has at least day
            return cleaned.day ? cleaned : null;
          })
          .filter(Boolean);
        
        if (cleanSchedule.length > 0) {
          availabilityPayload.schedule = cleanSchedule;
          hasAvailabilityData = true;
        }
      }
      
      if (values.profile.availability.timezone && values.profile.availability.timezone.trim()) {
        availabilityPayload.timezone = values.profile.availability.timezone.trim();
        hasAvailabilityData = true;
      }
      
      if (typeof values.profile.availability.emergencyService === 'boolean') {
        availabilityPayload.emergencyService = values.profile.availability.emergencyService;
        hasAvailabilityData = true;
      }
      
      if (hasAvailabilityData) {
        profilePayload.availability = availabilityPayload;
      }
    }
    
    // Build portfolio array - ensure it matches the expected structure
    if (values.portfolio && Array.isArray(values.portfolio) && values.portfolio.length > 0) {
      const cleanPortfolio = values.portfolio
        .map((item: Record<string, unknown>) => {
          // If it's already an object with the expected structure, use it
          if (typeof item === 'object' && item !== null) {
            const cleaned: Record<string, unknown> = {};
            if (typeof item.title === 'string' && item.title.trim()) cleaned.title = item.title.trim();
            if (typeof item.description === 'string' && item.description.trim()) cleaned.description = item.description.trim();
            if (typeof item.category === 'string' && item.category.trim()) cleaned.category = item.category.trim();
            if (typeof item.completedAt === 'string' && item.completedAt.trim()) cleaned.completedAt = item.completedAt.trim();
            if (item.images && Array.isArray(item.images) && item.images.length > 0) {
              cleaned.images = item.images
                .map((img: Record<string, unknown>) => {
                  const cleanedImg: Record<string, unknown> = {};
                  if (img.url && img.url.trim()) cleanedImg.url = img.url.trim();
                  if (img.publicId && img.publicId.trim()) cleanedImg.publicId = img.publicId.trim();
                  if (img.thumbnail && img.thumbnail.trim()) cleanedImg.thumbnail = img.thumbnail.trim();
                  return Object.keys(cleanedImg).length > 0 ? cleanedImg : null;
                })
                .filter(Boolean);
            }
            // Only include if it has at least title or images
            return (cleaned.title || (cleaned.images && cleaned.images.length > 0)) ? cleaned : null;
          } else if (typeof item === 'string' && item.trim()) {
            // Legacy: if it's a string URL, convert to portfolio object
            return {
              images: [{
                url: item.trim(),
                thumbnail: item.trim()
              }]
            };
          }
          return null;
        })
        .filter((item): item is Record<string, unknown> => item !== null);
      
      if (cleanPortfolio.length > 0) {
        profilePayload.portfolio = cleanPortfolio;
      }
    }
    
    // Only include profile if it has any fields
    if (Object.keys(profilePayload).length > 0) {
      payload.profile = profilePayload;
    }
    
    return payload;
  }, [session?.user?.role]);

  // Auto-save functionality - only when there are actual changes
  useEffect(() => {
    const userIdForAutoSave = session?.user?.id || session?.user?._id || (profile as UserProfile & { _id?: string; id?: string })?._id || (profile as UserProfile & { _id?: string; id?: string })?.id;
    if (!userIdForAutoSave || !hasUnsavedChanges || autoSaveStatus === 'saving') return;

    const timeoutId = setTimeout(async () => {
      try {
        setAutoSaveStatus('saving');
        
        const values = watchedValues as ProfileForm;
        const payload = buildNestedPayload(values);
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.authProfile}`, 
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
  }, [watchedValues, session?.user?.id, session?.user?._id, hasUnsavedChanges, autoSaveStatus, buildNestedPayload, profile]);

  // Use a ref to track if we're currently fetching to prevent multiple simultaneous requests
  const isFetchingRef = useRef(false);
  
  const fetchProfile = useCallback(async () => {
    // Skip if initialProfile is provided (it will be handled by useEffect)
    if (initialProfile) {
      console.log('⏭️ Skipping fetchProfile - initialProfile provided');
      return;
    }
    
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log('⏭️ Skipping fetchProfile - already fetching');
      return;
    }

    // First, initialize from session data if available and profile is not set
    if (session?.user && !profile) {
      // Create a minimal profile from session to prevent infinite loading
      const sessionUserId = session.user.id || session.user._id || '';
      if (!sessionUserId) return; // Skip if no user ID
      const sessionProfile: UserProfile = {
        id: sessionUserId,
        name: session.user.name || '',
        email: session.user.email || '',
        role: session.user.role || '',
        phone: session.user.phone || '',
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        bio: session.user.bio,
        location: session.user.location,
        website: session.user.website,
        skills: session.user.skills,
        experience: session.user.experience,
        avatar: typeof session.user.avatar === 'string' 
          ? session.user.avatar 
          : (session.user as UserProfileData).profile?.avatar 
          || session.user.avatar,
        portfolio: session.user.portfolio as string[],
        createdAt: session.user.createdAt || new Date().toISOString(),
        updatedAt: session.user.updatedAt || new Date().toISOString(),
        isVerified: session.user.isVerified,
      };
      setProfile(sessionProfile);
      
      // Initialize form with session data immediately
      const sessionFormData: ProfileForm = {
        name: session.user.name || "",
        firstName: session.user.firstName || "",
        lastName: session.user.lastName || "",
        role: (session.user.role || "") as "" | "client" | "provider" | "admin" | "supplier" | "instructor" | "agency_owner" | "agency_admin" | undefined,
        email: session.user.email || "",
        phoneNumber: session.user.phone || "",
        phone: session.user.phone || "",
        bio: session.user.bio || "",
        location: session.user.location || "",
        website: session.user.website || "",
        skills: Array.isArray(session.user.skills) ? session.user.skills.join(", ") : "",
        experience: session.user.experience || "",
        profile: {
          avatar: session.user.avatar ? { url: session.user.avatar } : undefined,
          bio: session.user.bio || "",
          address: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
          },
          skills: Array.isArray(session.user.skills) ? session.user.skills.join(", ") : "",
          experience: session.user.experience,
          businessName: "",
          businessType: "",
          yearsInBusiness: undefined,
          serviceAreas: "",
          specialties: "",
          certifications: [],
          insurance: undefined,
          backgroundCheck: undefined,
          availability: { schedule: [] },
        },
        portfolio: [],
        preferences: {
          notifications: { sms: false, email: true, push: true },
          language: "",
        },
        agency: {
          agencyId: "",
          role: "",
          status: "",
          commissionRate: undefined,
        },
        tags: "",
        notes: [],
      };
      reset(sessionFormData);
      setInitialValues(sessionFormData);
    }
    
    // Then try to fetch full profile from API
    const userIdForFetch = session?.user?.id || session?.user?._id;
    if (!userIdForFetch) {
      console.log('⏭️ Skipping fetchProfile - no user ID');
      return;
    }
    
    isFetchingRef.current = true;
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.authMe}`, 
        createAuthFetchOptions()
      );
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('API Response:', responseData);
        
        // Handle different response structures: { success: true, data: {...} } or direct user object
        const userData = responseData?.data || responseData?.user || responseData;
        
        if (!userData || (typeof userData === 'object' && Object.keys(userData).length === 0)) {
          console.error('User data is empty or invalid');
          toast.error("Failed to fetch profile data");
          return;
        }
        
        console.log('Extracted User Data:', userData);
        
        // Extract avatar from nested profile.avatar structure (preserve object structure)
        const avatarData = userData.profile?.avatar 
          || (typeof userData.avatar === 'string' ? { url: userData.avatar } : userData.avatar)
          || undefined;
        
        // Create normalized profile with avatar object
        const normalizedProfile: UserProfile = {
          ...userData,
          avatar: avatarData,
          profile: userData.profile,
        };
        
        setProfile(normalizedProfile);
        const formData: ProfileForm = {
          name: userData.name || "",
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          role: userData.role || "",
          email: userData.email || "",
          phoneNumber: userData.phoneNumber || userData.phone || "",
          phone: userData.phone || "",
          bio: userData.profile?.bio || userData.bio || "",
          location: userData.location || "",
          website: userData.website || "",
          skills: Array.isArray(userData.skills)
            ? userData.skills.join(", ")
            : Array.isArray(userData.profile?.skills)
            ? userData.profile.skills.join(", ")
            : "",
          experience:
            typeof userData.profile?.experience !== "undefined"
              ? String(userData.profile.experience)
              : userData.experience || "",
          profile: {
            avatar: userData.profile?.avatar,
            bio: userData.profile?.bio || "",
            address: userData.profile?.address || {
              street: "",
              city: "",
              state: "",
              zipCode: "",
              country: "",
            },
            experience: userData.profile?.experience,
            businessName: userData.profile?.businessName || "",
            businessType: userData.profile?.businessType || "",
            yearsInBusiness: userData.profile?.yearsInBusiness,
            serviceAreas: Array.isArray(userData.profile?.serviceAreas)
              ? userData.profile.serviceAreas.join(", ")
              : "",
            specialties: Array.isArray(userData.profile?.specialties)
              ? userData.profile.specialties.join(", ")
              : "",
            certifications: userData.profile?.certifications || [],
            insurance: userData.profile?.insurance,
            backgroundCheck: userData.profile?.backgroundCheck,
            availability: userData.profile?.availability || { schedule: [] },
          },
          portfolio: userData.profile?.portfolio || [],
          preferences: userData.preferences || {
            notifications: { sms: false, email: true, push: true },
            language: "",
          },
          agency: userData.agency || {
            agencyId: "",
            role: "",
            status: "",
            commissionRate: undefined,
          },
          tags: Array.isArray(userData.tags)
            ? userData.tags.join(", ")
            : "",
          notes: userData.notes || [],
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
  } finally {
    isFetchingRef.current = false;
  }
}, [session?.user, reset, profile, initialProfile]);

  // Initialize form from initialProfile if provided (priority over fetching)
  useEffect(() => {
    if (initialProfile) {
      console.log('🔄 Initializing form from initialProfile:', initialProfile);
      
      // Update profile state
      setProfile(initialProfile);
      
      // Extract name - prioritize name field, then construct from firstName + lastName
      const fullName = initialProfile.name?.trim() || 
        (initialProfile.firstName || initialProfile.lastName 
          ? `${initialProfile.firstName || ''} ${initialProfile.lastName || ''}`.trim()
          : '');
      
      // Extract phoneNumber - check both root level and nested
      const phoneNumber = (initialProfile as UserProfile & { phoneNumber?: string }).phoneNumber || initialProfile.phone || "";
      
      // Extract all nested profile data
      const profileData = (initialProfile as UserProfile & { profile?: Record<string, unknown> }).profile || {};
      
      // Build complete form data from initialProfile
      const formData: ProfileForm = {
        name: fullName,
        firstName: initialProfile.firstName || (profileData as { firstName?: string }).firstName || "",
        lastName: initialProfile.lastName || (profileData as { lastName?: string }).lastName || "",
        role: (initialProfile.role || "") as "" | "client" | "provider" | "admin" | "supplier" | "instructor" | "agency_owner" | "agency_admin" | undefined,
        email: initialProfile.email || "",
        phoneNumber: phoneNumber,
        phone: initialProfile.phone || phoneNumber || "",
        bio: profileData.bio || initialProfile.bio || "",
        location: initialProfile.location || profileData.location || "",
        website: initialProfile.website || profileData.website || "",
        skills: Array.isArray(initialProfile.skills)
          ? initialProfile.skills.join(", ")
          : Array.isArray(profileData.skills)
          ? profileData.skills.join(", ")
          : "",
        experience:
          typeof profileData.experience !== "undefined"
            ? String(profileData.experience)
            : (initialProfile.experience ? String(initialProfile.experience) : ""),
        profile: {
          avatar: typeof initialProfile.avatar === 'object' 
            ? initialProfile.avatar 
            : (initialProfile.avatar ? { url: initialProfile.avatar } : undefined)
            || profileData.avatar,
          bio: profileData.bio || initialProfile.bio || "",
          address: profileData.address || {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
          },
          experience: profileData.experience,
          businessName: profileData.businessName || "",
          businessType: profileData.businessType || "",
          yearsInBusiness: profileData.yearsInBusiness,
          serviceAreas: Array.isArray(profileData.serviceAreas)
            ? profileData.serviceAreas.join(", ")
            : "",
          specialties: Array.isArray(profileData.specialties)
            ? profileData.specialties.join(", ")
            : "",
          certifications: profileData.certifications || [],
          insurance: profileData.insurance,
          backgroundCheck: profileData.backgroundCheck,
          availability: profileData.availability || { schedule: [] },
        },
        portfolio: (profileData as { portfolio?: PortfolioItem[] }).portfolio || [],
        preferences: (initialProfile as UserProfile & { preferences?: ProfileForm['preferences'] }).preferences || {
          notifications: { sms: false, email: true, push: true },
          language: "",
        },
        agency: (initialProfile as UserProfile & { agency?: ProfileForm['agency'] }).agency || {
          agencyId: "",
          role: "",
          status: "",
          commissionRate: undefined,
        },
        tags: Array.isArray((initialProfile as UserProfile & { tags?: string[] }).tags)
          ? (initialProfile as UserProfile & { tags?: string[] }).tags?.join(", ") || ""
          : "",
        notes: (initialProfile as UserProfile & { notes?: unknown[] }).notes || [],
      };
      
      console.log('📝 Form data prepared:', formData);
      reset(formData);
      setInitialValues(formData);
      console.log('✅ Form initialized successfully');
    }
  }, [initialProfile, reset]);

  // Fetch user profile only if no initialProfile provided
  useEffect(() => {
    // If initialProfile is provided, don't fetch - use it instead
    if (initialProfile) {
      console.log('⏭️ Skipping fetchProfile - initialProfile provided in useEffect');
      return;
    }
    
    // Only fetch if we have a session user ID and we're not already fetching
    const userId = session?.user?.id || session?.user?._id;
    if (!userId) {
      console.log('⏭️ Skipping fetchProfile - no user ID');
      return;
    }
    
    if (isFetchingRef.current) {
      console.log('⏭️ Skipping fetchProfile - already fetching');
      return;
    }
    
    // Always try to fetch profile - it will use session data if available
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]); // Only depend on user ID, not fetchProfile to prevent loops


  const onSubmit = async (data: ProfileForm) => {
    console.log('🔄 Form submission started');
    console.log('📋 Form data:', data);
    console.log('🔐 Session:', session);
    
    // Note: /api/auth/profile endpoint uses the authenticated user's token,
    // so we don't need to pass user ID in the URL
    if (!session?.user) {
      console.error('❌ No session user available:', { session });
      toast.error("You must be logged in to save changes");
      return;
    }
    
    if (!session.user.id && !session.user._id) {
      console.warn('⚠️ Session exists but no user ID found:', { session });
      // Continue anyway - the API should handle auth from token
    }
    
    console.log('✅ Updating profile for authenticated user');
    
    // Validate API configuration
    if (!API_BASE_URL) {
      console.error('❌ API_BASE_URL is not configured');
      toast.error("Service configuration error. Please refresh the page and try again.");
      return;
    }
    
    setIsLoading(true);
    try {
      const payload = buildNestedPayload(data);
      console.log('📤 Submitting profile update payload:', JSON.stringify(payload, null, 2));
      console.log('🌐 API URL:', `${API_BASE_URL}${API_ENDPOINTS.authProfile}`);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Request timeout after 30 seconds');
        controller.abort();
      }, 30000); // 30 second timeout
      
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.authProfile}`, 
        {
          ...createAuthFetchOptions({
            method: "PUT",
            body: JSON.stringify(payload),
            signal: controller.signal,
          })
        }
      );
      
      clearTimeout(timeoutId);

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Check if response is ok before trying to parse JSON
      const contentType = response.headers.get("content-type");
      console.log('📥 Response content-type:', contentType);

      if (response.ok) {
        let responseData;
        try {
          const responseText = await response.text();
          console.log('📥 Response body (raw):', responseText);
          
          if (responseText) {
            responseData = JSON.parse(responseText);
          } else {
            responseData = {};
          }
        } catch (parseError) {
          console.error('❌ Failed to parse response:', parseError);
          toast.error("Profile updated but couldn't parse response");
          setIsLoading(false);
          return;
        }
        
        console.log('✅ Profile updated response:', responseData);
        
        // Handle response structure: { success: true, data: {...} } or direct user object
        const updatedProfile = responseData?.data || responseData?.user || responseData;
        
        if (updatedProfile && Object.keys(updatedProfile).length > 0) {
          console.log('✅ Setting updated profile:', updatedProfile);
          setProfile(updatedProfile as UserProfile);
          setHasUnsavedChanges(false);
          setInitialValues({ ...data, skills: data.skills || "" });
          
          // Refresh the form with updated data from API response
          const formData: ProfileForm = {
            name: updatedProfile.name || "",
            firstName: updatedProfile.firstName || "",
            lastName: updatedProfile.lastName || "",
            role: (updatedProfile.role || "") as "" | "client" | "provider" | "admin" | "supplier" | "instructor" | "agency_owner" | "agency_admin" | undefined,
            email: updatedProfile.email || "",
            phoneNumber: updatedProfile.phoneNumber || updatedProfile.phone || "",
            phone: updatedProfile.phone || "",
            bio: updatedProfile.profile?.bio || updatedProfile.bio || "",
            location: updatedProfile.location || "",
            website: updatedProfile.website || "",
            skills: Array.isArray(updatedProfile.skills)
              ? updatedProfile.skills.join(", ")
              : Array.isArray(updatedProfile.profile?.skills)
              ? updatedProfile.profile.skills.join(", ")
              : "",
            experience:
              typeof updatedProfile.profile?.experience !== "undefined"
                ? String(updatedProfile.profile.experience)
                : updatedProfile.experience || "",
            profile: {
              avatar: updatedProfile.profile?.avatar,
              bio: updatedProfile.profile?.bio || "",
              address: updatedProfile.profile?.address || {
                street: "",
                city: "",
                state: "",
                zipCode: "",
                country: "",
              },
              experience: updatedProfile.profile?.experience,
              businessName: updatedProfile.profile?.businessName || "",
              businessType: updatedProfile.profile?.businessType || "",
              yearsInBusiness: updatedProfile.profile?.yearsInBusiness,
              serviceAreas: Array.isArray(updatedProfile.profile?.serviceAreas)
                ? updatedProfile.profile.serviceAreas.join(", ")
                : "",
              specialties: Array.isArray(updatedProfile.profile?.specialties)
                ? updatedProfile.profile.specialties.join(", ")
                : "",
              certifications: updatedProfile.profile?.certifications || [],
              insurance: updatedProfile.profile?.insurance,
              backgroundCheck: updatedProfile.profile?.backgroundCheck,
              availability: updatedProfile.profile?.availability || { schedule: [] },
            },
            portfolio: updatedProfile.profile?.portfolio || [],
            preferences: updatedProfile.preferences || {
              notifications: { sms: false, email: true, push: true },
              language: "",
            },
            agency: updatedProfile.agency || {
              agencyId: "",
              role: "",
              status: "",
              commissionRate: undefined,
            },
            tags: Array.isArray(updatedProfile.tags)
              ? updatedProfile.tags.join(", ")
              : "",
            notes: updatedProfile.notes || [],
          } as ProfileForm;
          
          reset(formData);
          setInitialValues(formData);
          
          toast.success(responseData.message || "Profile updated successfully!");
        } else {
          console.warn('⚠️ Updated profile is empty or invalid');
          toast.success("Profile updated successfully!");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Update error - Full response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          payload: payload
        });
        
        // Extract detailed validation errors if available
        let errorMessage = errorData.error || errorData.message || `Failed to update profile (${response.status})`;
        
        // If there are validation details, append them
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const validationErrors = errorData.errors.map((e: Record<string, unknown>) => `${e.field || e.path}: ${e.message || e.msg}`).join(', ');
          errorMessage += ` - ${validationErrors}`;
        } else if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details.map((d: Record<string, unknown>) => d.message || d.msg).join(', ');
          errorMessage += ` - ${validationErrors}`;
        } else if (typeof errorData.validation === 'object') {
          const validationErrors = Object.entries(errorData.validation)
            .map(([field, errors]: [string, unknown]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : String(errors)}`)
            .join('; ');
          errorMessage += ` - ${validationErrors}`;
        }
        
        console.error('❌ Update error message:', errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      
      let errorMessage = "Failed to update profile";
      
      if (error instanceof Error) {
        // Handle network errors
        if (error.name === 'AbortError') {
          errorMessage = "Request timeout. Please check your connection and try again.";
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (error.message.includes('CORS')) {
          errorMessage = "CORS error. Please contact support.";
        } else {
          errorMessage = error.message || "Failed to update profile";
        }
      }
      
      console.error('❌ Full error details:', {
        error,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      const errorMsg = 'Only JPEG and PNG images are allowed';
      toast.error(errorMsg);
      return;
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      const errorMsg = 'File size must be less than 2MB';
      toast.error(errorMsg);
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      // Get auth token for manual header construction (avoid Content-Type for FormData)
      const apiToken = getApiToken();

      // Create headers without Content-Type for FormData (browser will set it with boundary)
      const headers: HeadersInit = {
        ...(apiToken && { 'Authorization': `Bearer ${apiToken}` }),
      };

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.authUploadAvatar}`, {
        method: "POST",
        headers,
        body: formData,
        credentials: 'include',
      });

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(text || 'Invalid response format');
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.message || data.error || "Failed to upload avatar";
        toast.error(errorMsg);
        return;
      }

      // Handle response structure: { success: true, message: string, data: { avatar: { url, publicId, thumbnail } } }
      const avatarData = data.data?.avatar || data.avatar;
      
      if (avatarData) {
        // Preserve full avatar object structure from response
        const avatarObject = typeof avatarData === 'string' 
          ? { url: avatarData } 
          : avatarData;
        
        // Update profile state with new avatar object
        setProfile(prev => prev ? { 
          ...prev, 
          avatar: avatarObject,
          profile: {
            ...prev.profile,
            avatar: avatarObject,
          }
        } : null);
        
        // Update form with new avatar data
        if (typeof avatarData === 'object' && avatarData.url) {
          setValue('profile.avatar', avatarData, { shouldDirty: false });
        }
        
        // Refresh profile data from server to ensure consistency
        await fetchProfile();
        
        toast.success(data.message || "Avatar uploaded successfully!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to upload avatar";
      toast.error(errorMsg);
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

      // Get auth token and create headers without Content-Type for FormData
      const apiToken = getApiToken();
      const headers: HeadersInit = {
        ...(apiToken && { 'Authorization': `Bearer ${apiToken}` }),
      };

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.authUploadPortfolio}`, {
        method: "POST",
        headers,
        body: formData,
        credentials: 'include',
      });

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(text || 'Invalid response format');
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.message || data.error || "Failed to upload portfolio";
        toast.error(errorMsg);
        return;
      }

      const portfolioData = data.data?.portfolio || data.portfolio;
      if (portfolioData) {
        setProfile(prev => prev ? { ...prev, portfolio: portfolioData } : null);
        toast.success(data.message || "Portfolio uploaded successfully!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error uploading portfolio:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to upload portfolio";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortfolioDelete = async (index: number) => {
    if (!profile?.portfolio) return;
    
    setIsLoading(true);
    try {
      const updatedPortfolio = profile.portfolio.filter((_, i) => i !== index);
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.authProfile}`, 
        createAuthFetchOptions({
          method: "PUT",
          body: JSON.stringify({ 
            profile: {
              portfolio: updatedPortfolio 
            }
          }),
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

  console.log(initialValues);
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
        <form onSubmit={handleSubmit(
          onSubmit,
          (errors) => {
            console.error('❌ Form validation errors:', errors);
            toast.error("Please fix form errors before saving");
          }
        )} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4 pb-6 border-b border-gray-100">
                <AvatarUpload
                  currentAvatar={(() => {
                    // Prioritize thumbnail for better performance, fallback to url
                    const avatar = profile.avatar || profile.profile?.avatar;
                    if (typeof avatar === 'string') return avatar;
                    return avatar?.thumbnail || avatar?.url;
                  })()}
                  onUpload={handleAvatarUpload}
                  isLoading={isLoading}
                  userName={profile.name}
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
                {/* Personal - Hidden for clients */}
                {!isClient && (
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
                  </div>
                )}

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
                </div>


                {/* Address */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 tracking-wide">Address</h3>
                  <div className="h-px bg-gray-200" />

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


                {/* Skills & Specialties - Hidden for clients */}
                {!isClient && (
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
                        {...register("profile.skills")}
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
                )}

                {/* Bio */}
                <div>
                  <Textarea
                    label="Bio"
                    {...register("profile.bio")}
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
                        <input {...register("profile.experience")} type="number" placeholder="Years of experience" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300" />
                        <input {...register("profile.yearsInBusiness")} type="number" placeholder="Years in business" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300" />
                        <input {...register("profile.businessName")} type="text" placeholder="Business name" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <select {...register("profile.businessType")} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-300">
                          <option value="">Select business type</option>
                          <option value="individual">Individual</option>
                          <option value="small_business">Small Business</option>
                          <option value="enterprise">Enterprise</option>
                          <option value="franchise">Franchise</option>
                        </select>
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
                        <select {...register("profile.backgroundCheck.status")} className="px-3 py-2 border border-gray-200 rounded">
                          <option value="">Select status</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="not_required">Not Required</option>
                        </select>
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

                {/* Preferences and Agency - Hidden for clients */}
                {!isClient && (
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
                )}

                {/* Tags & Notes - Hidden for clients */}
                {!isClient && (
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
                )}
              </div>
              </div>
              
              {/* Save Button */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{isLoading ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
    </div>
  );
}
