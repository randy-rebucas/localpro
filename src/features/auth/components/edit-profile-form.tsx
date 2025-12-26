"use client";

import { useState, useEffect, useCallback, useRef, useContext, useMemo } from "react";
import { useSession } from "@/hooks/useAuth";
import { SessionContext } from "@/contexts/session-context";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User as UserIcon, 
  Briefcase, 
  Save,
  CheckCircle,
  AlertCircle,
  MapPin,
  Loader2
} from "lucide-react";
import type {
  BusinessType,
  BackgroundCheckStatus,
  DayOfWeek,
  AgencyRole,
  AgencyStatus,
  Avatar
} from "@/types/users";
import toast from "react-hot-toast";
import { AvatarUpload } from "./avatar-upload";
import { PortfolioGallery } from "./portfolio-gallery";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { logger } from "@/lib/logger";
import { useRoleView } from "@/shared/hooks/useRoleView";

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

// Enums from User data entity - using types from @/types/users
const businessTypeEnum = z.enum(['individual', 'small_business', 'enterprise', 'franchise'] satisfies [BusinessType, ...BusinessType[]]);
const backgroundCheckStatusEnum = z.enum(['pending', 'approved', 'rejected', 'not_required'] satisfies [BackgroundCheckStatus, ...BackgroundCheckStatus[]]);
const agencyRoleEnum = z.enum(['owner', 'admin', 'manager', 'supervisor', 'provider'] satisfies [AgencyRole, ...AgencyRole[]]);
const agencyStatusEnum = z.enum(['active', 'inactive', 'suspended', 'pending'] satisfies [AgencyStatus, ...AgencyStatus[]]);
const dayEnum = z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] satisfies [DayOfWeek, ...DayOfWeek[]]);

const profileImageSchema = z.object({
  url: z.string().url().optional().or(z.literal("")),
  publicId: z.string().optional().or(z.literal("")),
  thumbnail: z.string().url().optional().or(z.literal("")),
});

const profileSchema = z.object({
  // Basic Information (from User entity)
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  isVerified: z.boolean().optional(),

  // Legacy flat fields (kept for backward compatibility/rendering)
  name: z.string().min(2, "Name must be at least 2 characters").optional().or(z.literal("")),
  phone: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  // GeoJSON location field
  locationPoint: z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([z.number(), z.number()]),
  }).optional(),
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
        }),
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

// Using Avatar type from @/types/users instead of AvatarObject
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
  avatar?: string | Avatar; // Support both string (legacy) and object formats
  portfolio?: string[];
  roles: string[]; // Multi-role support (array of roles)
  createdAt: string;
  updatedAt: string;
  isVerified?: boolean;
  profile?: {
    avatar?: Avatar;
    [key: string]: unknown;
  };
}

// Export a stable type name for consumers without colliding with the `UserProfile` component export.
export type EditProfileUserProfile = UserProfile;

interface EditProfileFormProps {
  initialProfile?: UserProfile | null;
}

export function EditProfileForm({ initialProfile }: EditProfileFormProps = {}) {
  const { data: session } = useSession();
  // Get session context for refreshing session data (may be undefined if not in provider)
  const sessionContext = useContext(SessionContext);
  const sessionContextRefetch = sessionContext?.refetch;
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile || null);
  
  // Get user roles for conditional rendering
  const userRoles = useMemo(() => session?.user?.roles || ["client"], [session?.user?.roles]);

  // Canonical role view (syncs with global role switcher)
  const { roleView, isClientView, isProviderView } = useRoleView({ userRoles });
  const isInstructorView = roleView === 'instructor';
  
  // Check if user has these roles
  const hasProviderRole = userRoles.includes('provider') || userRoles.includes('PROVIDER');
  const hasSupplierRole = userRoles.includes('supplier') || userRoles.includes('SUPPLIER');
  const hasInstructorRole = userRoles.includes('instructor') || userRoles.includes('INSTRUCTOR');
  const hasAgencyOwnerRole = userRoles.includes('agency_owner') || userRoles.includes('AGENCY_OWNER');
  const hasAgencyAdminRole = userRoles.includes('agency_admin') || userRoles.includes('AGENCY_ADMIN');
  const hasAdminRole = userRoles.includes('admin') || userRoles.includes('ADMIN');
  
  // Business roles visibility - only show if in business role view
  const isBusinessRole = !isClientView && (hasProviderRole || hasSupplierRole || hasInstructorRole || hasAgencyOwnerRole || hasAgencyAdminRole || hasAdminRole);
  
  // Service provider visibility - only show if in provider view and has provider role
  const isServiceProvider = isProviderView && (hasProviderRole || hasAgencyOwnerRole || hasAgencyAdminRole || hasAdminRole);
  
  // Administrative roles
  const isAdministrative = hasAgencyOwnerRole || hasAgencyAdminRole || hasAdminRole;
  
  // For backward compatibility with existing checks
  const isClient = isClientView;
  const isInstructor = isInstructorView && hasInstructorRole;
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialValues, setInitialValues] = useState<ProfileForm | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

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
      email: "",
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

  // Function to get current location and reverse geocode
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    
    try {
      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });

      const { longitude, latitude } = position.coords;
      
      // Set location in GeoJSON Point format: [longitude, latitude]
      setValue("locationPoint", {
        type: "Point",
        coordinates: [longitude, latitude],
      });
      
      // Also update address coordinates for backward compatibility
      setValue("profile.address.coordinates", {
        lat: latitude,
        lng: longitude,
      });

      // Call reverse geocode API with lat/lng format
      try {
        const reverseGeocodePayload = {
          lat: latitude,
          lng: longitude,
        };

        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.mapsReverseGeocode}`, 
          createAuthFetchOptions({
            method: "POST",
            body: JSON.stringify(reverseGeocodePayload),
          })
        );

        if (!response.ok) {
          throw new Error(`Reverse geocode failed: ${response.status}`);
        }

        const geocodeData = await response.json();
        
        // Parse response and autofill address fields
        if (geocodeData.success && geocodeData.data) {
          const addressData = geocodeData.data;
          const addressComponents = addressData.addressComponents || {};
          
          // Autofill address fields from reverse geocode response
          // Combine street number and route if available
          const streetParts = [];
          if (addressComponents.streetNumber) {
            streetParts.push(addressComponents.streetNumber);
          }
          if (addressComponents.street || addressComponents.route) {
            streetParts.push(addressComponents.street || addressComponents.route);
          }
          if (streetParts.length > 0) {
            setValue("profile.address.street", streetParts.join(" "));
          }
          
          if (addressComponents.city) {
            setValue("profile.address.city", addressComponents.city);
          }
          
          if (addressComponents.state) {
            setValue("profile.address.state", addressComponents.state);
          }
          
          if (addressComponents.postalCode) {
            setValue("profile.address.zipCode", addressComponents.postalCode);
          }
          
          if (addressComponents.country) {
            setValue("profile.address.country", addressComponents.country);
          }
          
          toast.success(`Location and address set successfully!`);
        } else {
          // If reverse geocode fails, still set coordinates
          toast.success(`Location set: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
      } catch (geocodeError) {
        logger.warn('Reverse geocode failed', {
          error: geocodeError instanceof Error ? geocodeError.message : String(geocodeError),
        });
        // Still set coordinates even if reverse geocode fails
        toast.success(`Location set: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (Address lookup failed)`);
      }
    } catch (error) {
      let errorMessage = "Failed to get your location";
      // Handle GeolocationPositionError
      if (error && typeof error === 'object' && 'code' in error) {
        const geoError = error as { code: number; message?: string };
        switch (geoError.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = "Location access denied. Please enable location permissions.";
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = "Location information unavailable.";
            break;
          case 3: // TIMEOUT
            errorMessage = "Location request timed out.";
            break;
          default:
            errorMessage = geoError.message || "Failed to get your location";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsGettingLocation(false);
    }
  }, [setValue]);

  const buildNestedPayload = useCallback((values: ProfileForm) => {
    // Check if user is a client - clients can only update specific fields
    const currentUserRoles = session?.user?.roles || [];
    const isClientUser = currentUserRoles.includes('client') || currentUserRoles.includes('CLIENT');
    
    // For clients, only include allowed fields
    if (isClientUser) {
      const payload: Record<string, unknown> = {};
      
      // firstName is required
      if (values.firstName && values.firstName.trim()) {
        payload.firstName = values.firstName.trim();
      }
      
      // lastName is required
      if (values.lastName && values.lastName.trim()) {
        payload.lastName = values.lastName.trim();
      }
      
      // Only include email if it has a value
      if (values.email && values.email.trim()) {
        payload.email = values.email.trim();
      }
      
      // Include location in GeoJSON Point format if available
      if (values.locationPoint && values.locationPoint.coordinates && values.locationPoint.coordinates.length === 2) {
        payload.location = {
          type: "Point",
          coordinates: values.locationPoint.coordinates,
        };
      }
      
      // Build profile object - address is required
      // Always include these fields as empty objects to prevent undefined values
      const profilePayload: Record<string, unknown> = {
        avatar: {},
        insurance: {},
        backgroundCheck: {},
        availability: {},
      };
      
      const bioValue = values.profile?.bio || values.bio;
      if (bioValue && bioValue.trim()) {
        profilePayload.bio = bioValue.trim();
      }
      
      // Build address object - address is required, include even if partially filled
      if (values.profile?.address) {
        const address: Record<string, unknown> = {};
        
        if (values.profile.address.street && values.profile.address.street.trim()) {
          address.street = values.profile.address.street.trim();
        }
        if (values.profile.address.city && values.profile.address.city.trim()) {
          address.city = values.profile.address.city.trim();
        }
        if (values.profile.address.state && values.profile.address.state.trim()) {
          address.state = values.profile.address.state.trim();
        }
        if (values.profile.address.zipCode && values.profile.address.zipCode.trim()) {
          address.zipCode = values.profile.address.zipCode.trim();
        }
        if (values.profile.address.country && values.profile.address.country.trim()) {
          address.country = values.profile.address.country.trim();
        }
        
        // Include coordinates if they exist
        if (values.profile.address.coordinates) {
          const coords: Record<string, unknown> = {};
          if (typeof values.profile.address.coordinates.lat === 'number' && !isNaN(values.profile.address.coordinates.lat)) {
            coords.lat = values.profile.address.coordinates.lat;
          }
          if (typeof values.profile.address.coordinates.lng === 'number' && !isNaN(values.profile.address.coordinates.lng)) {
            coords.lng = values.profile.address.coordinates.lng;
          }
          if (Object.keys(coords).length > 0) {
            address.coordinates = coords;
          }
        }
        
        // Address is required - always include it
        profilePayload.address = address;
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
    
    // firstName is required
    if (values.firstName && values.firstName.trim()) {
      payload.firstName = values.firstName.trim();
    }
    
    // lastName is required
    if (values.lastName && values.lastName.trim()) {
      payload.lastName = values.lastName.trim();
    }
    
    // Only include email if it has a value
    if (values.email && values.email.trim()) {
      payload.email = values.email.trim();
    }
    
    // Include location in GeoJSON Point format if available
    if (values.locationPoint && values.locationPoint.coordinates && values.locationPoint.coordinates.length === 2) {
      payload.location = {
        type: "Point",
        coordinates: values.locationPoint.coordinates,
      };
    }
    
    // Build profile object - only include fields with values
    // Note: Avatar, insurance, backgroundCheck, and availability are set as empty objects
    // to prevent backend from receiving undefined values
    const profilePayload: Record<string, unknown> = {};
    
    // Always include these fields as empty objects to prevent undefined values
    profilePayload.avatar = {};
    profilePayload.insurance = {};
    profilePayload.backgroundCheck = {};
    profilePayload.availability = {};
    
    const bioValue = values.profile?.bio || values.bio;
    if (bioValue && bioValue.trim()) {
      profilePayload.bio = bioValue.trim();
    }
    
    // Build address object - address is required, always include it
    if (values.profile?.address) {
      const address: Record<string, unknown> = {};
      
      if (values.profile.address.street && values.profile.address.street.trim()) {
        address.street = values.profile.address.street.trim();
      }
      if (values.profile.address.city && values.profile.address.city.trim()) {
        address.city = values.profile.address.city.trim();
      }
      if (values.profile.address.state && values.profile.address.state.trim()) {
        address.state = values.profile.address.state.trim();
      }
      if (values.profile.address.zipCode && values.profile.address.zipCode.trim()) {
        address.zipCode = values.profile.address.zipCode.trim();
      }
      if (values.profile.address.country && values.profile.address.country.trim()) {
        address.country = values.profile.address.country.trim();
      }
      
      // Include coordinates if they exist
      if (values.profile.address.coordinates) {
        const coords: Record<string, unknown> = {};
        if (typeof values.profile.address.coordinates.lat === 'number' && !isNaN(values.profile.address.coordinates.lat)) {
          coords.lat = values.profile.address.coordinates.lat;
        }
        if (typeof values.profile.address.coordinates.lng === 'number' && !isNaN(values.profile.address.coordinates.lng)) {
          coords.lng = values.profile.address.coordinates.lng;
        }
        if (Object.keys(coords).length > 0) {
          address.coordinates = coords;
        }
      }
      
      // Address is required - always include it
      profilePayload.address = address;
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
          const certName = typeof cert.name === 'string' ? cert.name : '';
          const certIssuer = typeof cert.issuer === 'string' ? cert.issuer : '';
          const certIssueDate = typeof cert.issueDate === 'string' ? cert.issueDate : '';
          const certExpiryDate = typeof cert.expiryDate === 'string' ? cert.expiryDate : '';
          
          if (certName.trim()) cleaned.name = certName.trim();
          if (certIssuer.trim()) cleaned.issuer = certIssuer.trim();
          if (certIssueDate.trim()) cleaned.issueDate = certIssueDate.trim();
          if (certExpiryDate.trim()) cleaned.expiryDate = certExpiryDate.trim();
          
          const certDoc = cert.document && typeof cert.document === 'object' && !Array.isArray(cert.document)
            ? cert.document as Record<string, unknown>
            : null;
          if (certDoc && (certDoc.url || certDoc.publicId)) {
            cleaned.document = {};
            const docUrl = typeof certDoc.url === 'string' ? certDoc.url : '';
            const docPublicId = typeof certDoc.publicId === 'string' ? certDoc.publicId : '';
            const docFilename = typeof certDoc.filename === 'string' ? certDoc.filename : '';
            
            if (docUrl.trim()) (cleaned.document as Record<string, unknown>).url = docUrl.trim();
            if (docPublicId.trim()) (cleaned.document as Record<string, unknown>).publicId = docPublicId.trim();
            if (docFilename.trim()) (cleaned.document as Record<string, unknown>).filename = docFilename.trim();
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
      const insuranceDoc = values.profile.insurance.document && typeof values.profile.insurance.document === 'object' && !Array.isArray(values.profile.insurance.document)
        ? values.profile.insurance.document as Record<string, unknown>
        : null;
      if (insuranceDoc && (insuranceDoc.url || insuranceDoc.publicId)) {
        const docPayload: Record<string, unknown> = {};
        const docUrl = typeof insuranceDoc.url === 'string' ? insuranceDoc.url : '';
        const docPublicId = typeof insuranceDoc.publicId === 'string' ? insuranceDoc.publicId : '';
        const docFilename = typeof insuranceDoc.filename === 'string' ? insuranceDoc.filename : '';
        
        if (docUrl.trim()) {
          docPayload.url = docUrl.trim();
        }
        if (docPublicId.trim()) {
          docPayload.publicId = docPublicId.trim();
        }
        if (docFilename.trim()) {
          docPayload.filename = docFilename.trim();
        }
        if (Object.keys(docPayload).length > 0) {
          insurancePayload.document = docPayload;
          hasInsuranceData = true;
        }
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
      const bgCheckDoc = values.profile.backgroundCheck.document && typeof values.profile.backgroundCheck.document === 'object' && !Array.isArray(values.profile.backgroundCheck.document)
        ? values.profile.backgroundCheck.document as Record<string, unknown>
        : null;
      if (bgCheckDoc && (bgCheckDoc.url || bgCheckDoc.publicId)) {
        const docPayload: Record<string, unknown> = {};
        const docUrl = typeof bgCheckDoc.url === 'string' ? bgCheckDoc.url : '';
        const docPublicId = typeof bgCheckDoc.publicId === 'string' ? bgCheckDoc.publicId : '';
        const docFilename = typeof bgCheckDoc.filename === 'string' ? bgCheckDoc.filename : '';
        
        if (docUrl.trim()) {
          docPayload.url = docUrl.trim();
        }
        if (docPublicId.trim()) {
          docPayload.publicId = docPublicId.trim();
        }
        if (docFilename.trim()) {
          docPayload.filename = docFilename.trim();
        }
        if (Object.keys(docPayload).length > 0) {
          bgCheckPayload.document = docPayload;
          hasBgCheckData = true;
        }
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
            const schedDay = typeof sched.day === 'string' ? sched.day : '';
            const schedStartTime = typeof sched.startTime === 'string' ? sched.startTime : '';
            const schedEndTime = typeof sched.endTime === 'string' ? sched.endTime : '';
            
            if (schedDay.trim()) cleaned.day = schedDay.trim();
            if (schedStartTime.trim()) cleaned.startTime = schedStartTime.trim();
            if (schedEndTime.trim()) cleaned.endTime = schedEndTime.trim();
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
        .map((item: unknown) => {
          // If it's already an object with the expected structure, use it
          if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            const itemObj = item as Record<string, unknown>;
            const cleaned: Record<string, unknown> = {};
            const itemTitle = typeof itemObj.title === 'string' ? itemObj.title : '';
            const itemDesc = typeof itemObj.description === 'string' ? itemObj.description : '';
            const itemCategory = typeof itemObj.category === 'string' ? itemObj.category : '';
            const itemCompletedAt = typeof itemObj.completedAt === 'string' ? itemObj.completedAt : '';
            
            if (itemTitle.trim()) cleaned.title = itemTitle.trim();
            if (itemDesc.trim()) cleaned.description = itemDesc.trim();
            if (itemCategory.trim()) cleaned.category = itemCategory.trim();
            if (itemCompletedAt.trim()) cleaned.completedAt = itemCompletedAt.trim();
            if (itemObj.images && Array.isArray(itemObj.images) && itemObj.images.length > 0) {
              cleaned.images = itemObj.images
                .map((img: unknown) => {
                  const imgObj = typeof img === 'object' && img !== null && !Array.isArray(img) ? img as Record<string, unknown> : {};
                  const cleanedImg: Record<string, unknown> = {};
                  const imgUrl = typeof imgObj.url === 'string' ? imgObj.url : '';
                  const imgPublicId = typeof imgObj.publicId === 'string' ? imgObj.publicId : '';
                  const imgThumbnail = typeof imgObj.thumbnail === 'string' ? imgObj.thumbnail : '';
                  
                  if (imgUrl.trim()) cleanedImg.url = imgUrl.trim();
                  if (imgPublicId.trim()) cleanedImg.publicId = imgPublicId.trim();
                  if (imgThumbnail.trim()) cleanedImg.thumbnail = imgThumbnail.trim();
                  return Object.keys(cleanedImg).length > 0 ? cleanedImg : null;
                })
                .filter(Boolean);
            }
            // Only include if it has at least title or images
            const cleanedImages = cleaned.images as unknown[];
            return (cleaned.title || (cleanedImages && Array.isArray(cleanedImages) && cleanedImages.length > 0)) ? cleaned : null;
          }
          
          // Handle string items (legacy format)
          if (typeof item === 'string') {
            const trimmed: string = item;
            const trimmedValue = trimmed.trim();
            if (trimmedValue.length > 0) {
              // Legacy: if it's a string URL, convert to portfolio object
              return {
                images: [{
                  url: trimmedValue,
                  thumbnail: trimmedValue
                }]
              };
            }
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
  }, [session?.user?.roles]);

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
          // Refresh session data to reflect updated user information
          if (sessionContextRefetch) {
            sessionContextRefetch().catch((error) => {
              logger.warn('Failed to refresh session after auto-save', { error: error instanceof Error ? error : new Error(String(error)) });
            });
          }
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        } else {
          setAutoSaveStatus('error');
          setTimeout(() => setAutoSaveStatus('idle'), 3000);
        }
      } catch (error) {
        logger.error("Auto-save error", error instanceof Error ? error : new Error(String(error)));
        setAutoSaveStatus('error');
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [watchedValues, session?.user?.id, session?.user?._id, hasUnsavedChanges, autoSaveStatus, buildNestedPayload, profile, sessionContextRefetch]);

  // Use a ref to track if we're currently fetching to prevent multiple simultaneous requests
  const isFetchingRef = useRef(false);
  
  const fetchProfile = useCallback(async () => {
    // Skip if initialProfile is provided (it will be handled by useEffect)
    if (initialProfile) {
      logger.debug('Skipping fetchProfile - initialProfile provided');
      return;
    }
    
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      logger.debug('Skipping fetchProfile - already fetching');
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
        roles: session.user.roles || ['client'],
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
          : (session.user as UserProfile).profile?.avatar 
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
        email: session.user.email || "",
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
      logger.debug('Skipping fetchProfile - no user ID');
      return;
    }
    
    isFetchingRef.current = true;
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.authMe}`, 
        createAuthFetchOptions()
      );
      
      if (response.ok) {
        const responseData = await response.json();
        logger.debug('Edit profile API response', { hasData: !!responseData });
        
        // Handle different response structures: { success: true, data: {...} } or direct user object
        const userData = responseData?.data || responseData?.user || responseData;
        
        if (!userData || (typeof userData === 'object' && Object.keys(userData).length === 0)) {
          logger.warn('User data is empty or invalid');
          toast.error("Failed to fetch profile data");
          return;
        }
        
        logger.debug('Extracted user data', { userId: userData?.id || userData?._id, hasEmail: !!userData?.email });
        
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
        
        // Parse location from API response (could be GeoJSON Point or string)
        let locationPoint: { type: "Point"; coordinates: [number, number] } | undefined;
        if (userData.location) {
          if (typeof userData.location === 'object' && userData.location.type === 'Point' && Array.isArray(userData.location.coordinates)) {
            // Already in GeoJSON format
            locationPoint = {
              type: "Point",
              coordinates: userData.location.coordinates as [number, number],
            };
          }
        }
        
        // Extract address coordinates from locationPoint or address.coordinates
        let addressCoordinates: { lat?: number; lng?: number } | undefined;
        if (locationPoint && locationPoint.coordinates && locationPoint.coordinates.length === 2) {
          // Extract from locationPoint (GeoJSON format: [lng, lat])
          addressCoordinates = {
            lng: locationPoint.coordinates[0],
            lat: locationPoint.coordinates[1],
          };
        } else if (userData.profile?.address?.coordinates) {
          // Use existing address coordinates if available
          const coords = userData.profile.address.coordinates;
          if (typeof coords === 'object' && coords !== null && !Array.isArray(coords)) {
            addressCoordinates = {
              lat: typeof (coords as { lat?: number }).lat === 'number' ? (coords as { lat?: number }).lat : undefined,
              lng: typeof (coords as { lng?: number }).lng === 'number' ? (coords as { lng?: number }).lng : undefined,
            };
          }
        }
        
        // Build address object with coordinates
        const addressData = userData.profile?.address || {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        };
        const addressWithCoords = {
          ...addressData,
          ...(addressCoordinates && { coordinates: addressCoordinates }),
        };
        
        const formData: ProfileForm = {
          name: userData.name || "",
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          phoneNumber: userData.phoneNumber || userData.phone || "",
          phone: userData.phone || "",
          bio: userData.profile?.bio || userData.bio || "",
          location: typeof userData.location === 'string' ? userData.location : "",
          locationPoint: locationPoint,
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
            address: addressWithCoords,
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
      // Handle error response
      let errorText = '';
      let errorData: Record<string, unknown> = {};
      
      try {
        errorText = await response.text();
        if (errorText) {
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }
        }
      } catch (parseError) {
        logger.warn('Failed to parse error response', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
        });
      }
      
      const errorMessage = typeof errorData.error === 'string' 
        ? errorData.error 
        : typeof errorData.message === 'string'
        ? errorData.message
        : `Failed to fetch profile (${response.status})`;
      
      logger.error('Failed to fetch profile', new Error(errorMessage), {
        status: response.status,
        statusText: response.statusText,
        url: `${API_BASE_URL}${API_ENDPOINTS.authMe}`,
        errorData: errorData,
        errorText: errorText || undefined,
      });
      
      toast.error(errorMessage);
    }
  } catch (error) {
    // Enhanced error logging for fetch profile
    const errorContext = {
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      apiUrl: `${API_BASE_URL}${API_ENDPOINTS.authMe}`,
      userId: session?.user?.id || session?.user?._id,
    };
    
    logger.error("Error fetching profile", error instanceof Error ? error : new Error(String(error)), errorContext);
    
    let errorMessage = "Failed to fetch profile";
    let errorDetails = "";
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = "Request timeout";
        errorDetails = "The request took too long. Please check your connection and try again.";
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = "Network error";
        errorDetails = "Unable to connect to the server. Please check your internet connection and try again.";
      } else if (error.message.includes('JSON')) {
        errorMessage = "Data format error";
        errorDetails = "The server response could not be parsed. Please try again or contact support.";
      } else {
        errorMessage = error.message || "An unexpected error occurred";
        errorDetails = `Error type: ${error.name || 'Unknown'}`;
      }
    } else {
      errorMessage = "An unexpected error occurred";
      errorDetails = `Error: ${String(error)}`;
    }
    
    const fullErrorMessage = errorDetails ? `${errorMessage}. ${errorDetails}` : errorMessage;
    toast.error(fullErrorMessage, {
      duration: 5000,
    });
  } finally {
    isFetchingRef.current = false;
  }
}, [session?.user, reset, profile, initialProfile]);

  // Initialize form from initialProfile if provided (priority over fetching)
  useEffect(() => {
    if (initialProfile) {
      logger.debug('Initializing form from initialProfile', { userId: initialProfile?.id || (initialProfile as UserProfile & { _id?: string })?._id });
      
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
      const profileDataTyped = profileData as Record<string, unknown>;
      
      // Parse location from initialProfile (could be GeoJSON Point or string)
      let locationPoint: { type: "Point"; coordinates: [number, number] } | undefined;
      const locationData = (initialProfile as UserProfile & { location?: unknown }).location || profileDataTyped.location;
      if (locationData) {
        if (typeof locationData === 'object' && locationData !== null && 'type' in locationData && locationData.type === 'Point' && 'coordinates' in locationData && Array.isArray(locationData.coordinates)) {
          // Already in GeoJSON format
          locationPoint = {
            type: "Point",
            coordinates: locationData.coordinates as [number, number],
          };
        }
      }
      
      // Extract address coordinates from locationPoint or address.coordinates
      let addressCoordinates: { lat?: number; lng?: number } | undefined;
      if (locationPoint && locationPoint.coordinates && locationPoint.coordinates.length === 2) {
        // Extract from locationPoint (GeoJSON format: [lng, lat])
        addressCoordinates = {
          lng: locationPoint.coordinates[0],
          lat: locationPoint.coordinates[1],
        };
      } else if (profileDataTyped.address && typeof profileDataTyped.address === 'object' && !Array.isArray(profileDataTyped.address)) {
        const addressObj = profileDataTyped.address as Record<string, unknown>;
        if (addressObj.coordinates && typeof addressObj.coordinates === 'object' && addressObj.coordinates !== null && !Array.isArray(addressObj.coordinates)) {
          const coords = addressObj.coordinates as Record<string, unknown>;
          addressCoordinates = {
            lat: typeof coords.lat === 'number' ? coords.lat : undefined,
            lng: typeof coords.lng === 'number' ? coords.lng : undefined,
          };
        }
      }
      
      // Build address object with coordinates
      const addressData = (typeof profileDataTyped.address === 'object' && profileDataTyped.address && !Array.isArray(profileDataTyped.address)
        ? profileDataTyped.address
        : {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
          }) || {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
          };
      const addressWithCoords = {
        ...(addressData as Record<string, unknown>),
        ...(addressCoordinates && { coordinates: addressCoordinates }),
      };
      
      // Build complete form data from initialProfile
      const formData: ProfileForm = {
        name: fullName,
        firstName: initialProfile.firstName || (typeof profileDataTyped.firstName === 'string' ? profileDataTyped.firstName : "") || "",
        lastName: initialProfile.lastName || (typeof profileDataTyped.lastName === 'string' ? profileDataTyped.lastName : "") || "",
        email: initialProfile.email || "",
        phone: initialProfile.phone || phoneNumber || "",
        bio: (typeof profileDataTyped.bio === 'string' ? profileDataTyped.bio : "") || (initialProfile.bio || ""),
        location: typeof locationData === 'string' ? locationData : (initialProfile.location || "") || (typeof profileDataTyped.location === 'string' ? profileDataTyped.location : ""),
        locationPoint: locationPoint,
        website: (initialProfile.website || "") || (typeof profileDataTyped.website === 'string' ? profileDataTyped.website : ""),
        skills: Array.isArray(initialProfile.skills)
          ? initialProfile.skills.join(", ")
          : Array.isArray(profileDataTyped.skills)
          ? (profileDataTyped.skills as string[]).join(", ")
          : "",
        experience:
          typeof profileData.experience !== "undefined"
            ? String(profileData.experience)
            : (initialProfile.experience ? String(initialProfile.experience) : ""),
        profile: {
          avatar: ((typeof initialProfile.avatar === 'object' && initialProfile.avatar !== null
            ? initialProfile.avatar 
            : (initialProfile.avatar ? { url: String(initialProfile.avatar) } : undefined))
            || (typeof profileDataTyped.avatar === 'object' && profileDataTyped.avatar && !Array.isArray(profileDataTyped.avatar) && profileDataTyped.avatar !== null
              ? profileDataTyped.avatar 
              : undefined)) as unknown as { url?: string; publicId?: string; thumbnail?: string } | undefined,
          bio: (typeof profileDataTyped.bio === 'string' ? profileDataTyped.bio : "") || initialProfile.bio || "",
          address: addressWithCoords as { street?: string; city?: string; state?: string; zipCode?: string; country?: string; coordinates?: { lat?: number; lng?: number } },
          experience: (typeof profileDataTyped.experience !== 'undefined' 
            ? (typeof profileDataTyped.experience === 'number' 
              ? profileDataTyped.experience 
              : typeof profileDataTyped.experience === 'string'
              ? profileDataTyped.experience
              : undefined)
            : undefined) as string | number | undefined,
          businessName: (typeof profileDataTyped.businessName === 'string' ? profileDataTyped.businessName : "") || "",
          businessType: (typeof profileDataTyped.businessType === 'string' 
            ? profileDataTyped.businessType 
            : "") as "" | "individual" | "small_business" | "enterprise" | "franchise" | undefined,
          yearsInBusiness: (typeof profileDataTyped.yearsInBusiness === 'number' 
            ? profileDataTyped.yearsInBusiness 
            : typeof profileDataTyped.yearsInBusiness === 'string'
            ? profileDataTyped.yearsInBusiness
            : undefined) as string | number | undefined,
          serviceAreas: Array.isArray(profileDataTyped.serviceAreas)
            ? (profileDataTyped.serviceAreas as string[]).join(", ")
            : "",
          specialties: Array.isArray(profileDataTyped.specialties)
            ? (profileDataTyped.specialties as string[]).join(", ")
            : "",
          certifications: (Array.isArray(profileDataTyped.certifications) 
            ? (profileDataTyped.certifications as Array<{ name?: string; issuer?: string; issueDate?: string; expiryDate?: string; document?: { url?: string; publicId?: string; filename?: string } }>)
            : undefined) as Array<{ name?: string; issuer?: string; issueDate?: string; expiryDate?: string; document?: { url?: string; publicId?: string; filename?: string } }> | undefined,
          insurance: (profileDataTyped.insurance && typeof profileDataTyped.insurance === 'object' && !Array.isArray(profileDataTyped.insurance)
            ? profileDataTyped.insurance
            : undefined) as { hasInsurance?: boolean; provider?: string; policyNumber?: string; coverageAmount?: string | number; expiryDate?: string; document?: { url?: string; publicId?: string; filename?: string } } | undefined,
          backgroundCheck: (profileDataTyped.backgroundCheck && typeof profileDataTyped.backgroundCheck === 'object' && !Array.isArray(profileDataTyped.backgroundCheck)
            ? profileDataTyped.backgroundCheck
            : undefined) as { status?: "" | "pending" | "approved" | "rejected" | "not_required"; completedAt?: string; document?: { url?: string; publicId?: string; filename?: string } } | undefined,
          availability: ((profileDataTyped.availability && typeof profileDataTyped.availability === 'object')
            ? (profileDataTyped.availability as { schedule?: Array<{ day?: "" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"; startTime?: string; endTime?: string; isAvailable?: boolean }>; timezone?: string; emergencyService?: boolean })
            : ({ schedule: [] as Array<{ day?: "" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"; startTime?: string; endTime?: string; isAvailable?: boolean }> })) as { schedule?: Array<{ day?: "" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"; startTime?: string; endTime?: string; isAvailable?: boolean }>; timezone?: string; emergencyService?: boolean } | undefined,
        },
        portfolio: (Array.isArray(profileDataTyped.portfolio) 
          ? (profileDataTyped.portfolio as ProfileForm['portfolio'])
          : []) as ProfileForm['portfolio'],
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
        notes: (Array.isArray((initialProfile as UserProfile & { notes?: unknown[] }).notes) 
          ? ((initialProfile as UserProfile & { notes?: Array<{ note?: string; addedBy?: string; addedAt?: string }> }).notes || []).map(note => 
              (typeof note === 'object' && note !== null && !Array.isArray(note)
                ? note as { note?: string; addedBy?: string; addedAt?: string }
                : { note: typeof note === 'string' ? note : undefined })
            ) as ProfileForm['notes']
          : []) as ProfileForm['notes'],
      };
      
      logger.debug('Form data prepared', { hasData: !!formData, userId: initialProfile?.id || (initialProfile as UserProfile & { _id?: string; id?: string })?._id });
      reset(formData);
      setInitialValues(formData);
      logger.debug('Form initialized successfully');
    }
  }, [initialProfile, reset]);

  // Fetch user profile only if no initialProfile provided
  useEffect(() => {
    // If initialProfile is provided, don't fetch - use it instead
    if (initialProfile) {
      logger.debug('Skipping fetchProfile - initialProfile provided in useEffect');
      return;
    }
    
    // Only fetch if we have a session user ID and we're not already fetching
    const userId = session?.user?.id || session?.user?._id;
    if (!userId) {
      logger.debug('Skipping fetchProfile - no user ID');
      return;
    }
    
    if (isFetchingRef.current) {
      logger.debug('Skipping fetchProfile - already fetching');
      return;
    }
    
    // Always try to fetch profile - it will use session data if available
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]); // Only depend on user ID, not fetchProfile to prevent loops


  const onSubmit = async (data: ProfileForm) => {
    logger.debug('Form submission started', { hasSession: !!session, userId: session?.user?.id });
    
    // Note: /api/auth/profile endpoint uses the authenticated user's token,
    // so we don't need to pass user ID in the URL
    if (!session?.user) {
      logger.error('No session user available', new Error('No session user'), { hasSession: !!session });
      toast.error("You must be logged in to save changes");
      return;
    }
    
    if (!session.user.id && !session.user._id) {
      logger.warn('Session exists but no user ID found', { hasSession: !!session });
      // Continue anyway - the API should handle auth from token
    }
    
    logger.debug('Updating profile for authenticated user', { userId: session.user.id || session.user._id });
    
    // Validate API configuration
    if (!API_BASE_URL) {
      logger.error('API_BASE_URL is not configured');
      toast.error("Service configuration error. Please refresh the page and try again.");
      return;
    }
    
    setIsLoading(true);
    let payloadString: string | undefined;
    try {
      const payload = buildNestedPayload(data);
      
      // Clean payload - remove undefined values recursively and set empty objects for excluded fields
      const cleanPayload = (obj: Record<string, unknown>): Record<string, unknown> => {
        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
          // Skip undefined and null values
          if (value === undefined || value === null) {
            continue;
          }
          
          // Explicitly exclude phoneNumber - it should not be updated via this endpoint
          if (key === 'phoneNumber') {
            continue;
          }
          
          // Handle profile object - set empty objects for excluded fields instead of undefined
          if (key === 'profile' && typeof value === 'object' && value !== null) {
            const profileObj = value as Record<string, unknown>;
            const cleanedProfile: Record<string, unknown> = {};
            
            // Fields that should ALWAYS be sent as empty objects instead of undefined
            const requiredEmptyFields = ['avatar', 'insurance', 'backgroundCheck', 'availability'];
            
            // First, always set these fields as empty objects
            for (const field of requiredEmptyFields) {
              cleanedProfile[field] = {};
            }
            
            // Then process all other fields
            for (const [profileKey, profileValue] of Object.entries(profileObj)) {
              // Skip the required empty fields - we've already set them
              if (requiredEmptyFields.includes(profileKey)) {
                // If the field has actual data, use it instead of empty object
                if (profileValue !== undefined && profileValue !== null && typeof profileValue === 'object' && !Array.isArray(profileValue)) {
                  const cleanedField = cleanPayload(profileValue as Record<string, unknown>);
                  // Only replace empty object if there's actual data
                  if (Object.keys(cleanedField).length > 0) {
                    cleanedProfile[profileKey] = cleanedField;
                  }
                }
                continue;
              }
              
              if (profileValue === undefined || profileValue === null) {
                continue;
              }
              
              if (Array.isArray(profileValue)) {
                const filtered = profileValue.filter(item => item !== undefined && item !== null);
                if (filtered.length > 0) {
                  cleanedProfile[profileKey] = filtered;
                }
              } else if (typeof profileValue === 'object' && profileValue !== null) {
                const cleanedNested = cleanPayload(profileValue as Record<string, unknown>);
                if (Object.keys(cleanedNested).length > 0) {
                  cleanedProfile[profileKey] = cleanedNested;
                }
              } else {
                cleanedProfile[profileKey] = profileValue;
              }
            }
            
            // Always include profile - it will always have at least the required empty fields
            cleaned[key] = cleanedProfile;
          } else if (Array.isArray(value)) {
            const filtered = value.filter(item => item !== undefined && item !== null);
            if (filtered.length > 0) {
              cleaned[key] = filtered;
            }
          } else if (typeof value === 'object' && value !== null) {
            const cleanedObj = cleanPayload(value as Record<string, unknown>);
            // Only include if the object has at least one property
            if (Object.keys(cleanedObj).length > 0) {
              cleaned[key] = cleanedObj;
            }
          } else {
            cleaned[key] = value;
          }
        }
        return cleaned;
      };
      
      const cleanedPayload = cleanPayload(payload);
      
      // Ensure profile object always has the required empty fields
      if (cleanedPayload.profile && typeof cleanedPayload.profile === 'object' && cleanedPayload.profile !== null) {
        const profile = cleanedPayload.profile as Record<string, unknown>;
        const requiredEmptyFields = ['avatar', 'insurance', 'backgroundCheck', 'availability'];
        for (const field of requiredEmptyFields) {
          if (!(field in profile) || profile[field] === undefined || profile[field] === null) {
            profile[field] = {};
          }
        }
      } else if (cleanedPayload.profile === undefined && payload.profile) {
        // If profile was removed during cleaning but existed in original, recreate it with empty fields
        cleanedPayload.profile = {
          avatar: {},
          insurance: {},
          backgroundCheck: {},
          availability: {},
        };
      }
      
      const cleanedPayloadKeys = Object.keys(cleanedPayload);
      
      // Validate payload before sending (after cleaning)
      if (cleanedPayloadKeys.length === 0) {
        logger.warn('Empty payload - no changes to save');
        toast.error("No changes to save");
        setIsLoading(false);
        return;
      }
      
      // Validate email format if email is being updated
      if (cleanedPayload.email && typeof cleanedPayload.email === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanedPayload.email)) {
          logger.error('Invalid email format', new Error('Invalid email'), { email: cleanedPayload.email });
          toast.error("Please enter a valid email address");
          setIsLoading(false);
          return;
        }
      }
      
      // Log the cleaned payload structure for debugging
      logger.debug('Cleaned payload structure', {
        hasProfile: !!cleanedPayload.profile,
        profileKeys: cleanedPayload.profile && typeof cleanedPayload.profile === 'object' 
          ? Object.keys(cleanedPayload.profile as Record<string, unknown>)
          : [],
        hasAvatar: cleanedPayload.profile && typeof cleanedPayload.profile === 'object'
          ? 'avatar' in (cleanedPayload.profile as Record<string, unknown>)
          : false,
        avatarValue: cleanedPayload.profile && typeof cleanedPayload.profile === 'object'
          ? (cleanedPayload.profile as Record<string, unknown>).avatar
          : undefined,
      });
      
      // Validate payload structure - ensure it's serializable
      try {
        payloadString = JSON.stringify(cleanedPayload);
      } catch (serializeError) {
        logger.error('Failed to serialize payload', serializeError instanceof Error ? serializeError : new Error(String(serializeError)), { payload: cleanedPayload });
        toast.error("Invalid data format. Please check your input and try again.");
        setIsLoading(false);
        return;
      }
      
      if (!payloadString) {
        logger.error('Payload string is undefined after serialization');
        toast.error("Failed to prepare data for submission. Please try again.");
        setIsLoading(false);
        return;
      }
      
      logger.debug('Submitting profile update', { 
        apiUrl: `${API_BASE_URL}${API_ENDPOINTS.authProfile}`,
        payloadSize: payloadString.length,
        payloadKeys: cleanedPayloadKeys
      });
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        logger.warn('Request timeout after 30 seconds');
        controller.abort();
      }, 30000); // 30 second timeout
      
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.authProfile}`, 
        {
          ...createAuthFetchOptions({
            method: "PUT",
            body: payloadString,
            signal: controller.signal,
          })
        }
      );
      
      clearTimeout(timeoutId);

      logger.debug('Profile update response', { 
        status: response.status,
        contentType: response.headers.get("content-type")
      });
      
      // Check if response is ok before trying to parse JSON
      // Removed unused: const contentType = response.headers.get("content-type");

      if (response.ok) {
        let responseData;
        try {
          const responseText = await response.text();
          logger.debug('Profile update response body', { hasText: !!responseText, length: responseText.length });
          
          if (responseText) {
            responseData = JSON.parse(responseText);
          } else {
            responseData = {};
          }
        } catch (parseError) {
          logger.error('Failed to parse response', parseError instanceof Error ? parseError : new Error(String(parseError)));
          toast.error("Profile updated but couldn't parse response");
          setIsLoading(false);
          return;
        }
        
        logger.debug('Profile updated response', { hasData: !!responseData });
        
        // Handle response structure: { success: true, data: {...} } or direct user object
        const updatedProfile = responseData?.data || responseData?.user || responseData;
        
        if (updatedProfile && Object.keys(updatedProfile).length > 0) {
          logger.debug('Setting updated profile', { userId: updatedProfile?.id || updatedProfile?._id });
          setProfile(updatedProfile as UserProfile);
          setHasUnsavedChanges(false);
          setInitialValues({ ...data, skills: data.skills || "" });
          
          // Parse location from updated profile (could be GeoJSON Point or string)
          let locationPoint: { type: "Point"; coordinates: [number, number] } | undefined;
          if (updatedProfile.location) {
            if (typeof updatedProfile.location === 'object' && updatedProfile.location !== null && 'type' in updatedProfile.location && updatedProfile.location.type === 'Point' && 'coordinates' in updatedProfile.location && Array.isArray(updatedProfile.location.coordinates)) {
              // Already in GeoJSON format
              locationPoint = {
                type: "Point",
                coordinates: updatedProfile.location.coordinates as [number, number],
              };
            }
          }
          
          // Extract address coordinates from locationPoint or address.coordinates
          let addressCoordinates: { lat?: number; lng?: number } | undefined;
          if (locationPoint && locationPoint.coordinates && locationPoint.coordinates.length === 2) {
            // Extract from locationPoint (GeoJSON format: [lng, lat])
            addressCoordinates = {
              lng: locationPoint.coordinates[0],
              lat: locationPoint.coordinates[1],
            };
          } else if (updatedProfile.profile?.address?.coordinates) {
            // Use existing address coordinates if available
            const coords = updatedProfile.profile.address.coordinates;
            if (typeof coords === 'object' && coords !== null && !Array.isArray(coords)) {
              addressCoordinates = {
                lat: typeof (coords as { lat?: number }).lat === 'number' ? (coords as { lat?: number }).lat : undefined,
                lng: typeof (coords as { lng?: number }).lng === 'number' ? (coords as { lng?: number }).lng : undefined,
              };
            }
          }
          
          // Build address object with coordinates
          const addressData = updatedProfile.profile?.address || {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
          };
          const addressWithCoords = {
            ...addressData,
            ...(addressCoordinates && { coordinates: addressCoordinates }),
          };
          
          // Refresh the form with updated data from API response
          const formData: ProfileForm = {
            name: updatedProfile.name || "",
            firstName: updatedProfile.firstName || "",
            lastName: updatedProfile.lastName || "",
            email: updatedProfile.email || "",
            phoneNumber: updatedProfile.phoneNumber || updatedProfile.phone || "",
            phone: updatedProfile.phone || "",
            bio: updatedProfile.profile?.bio || updatedProfile.bio || "",
            location: typeof updatedProfile.location === 'string' ? updatedProfile.location : "",
            locationPoint: locationPoint,
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
              address: addressWithCoords,
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
          
          // Refresh session data to reflect updated user information
          if (sessionContextRefetch) {
            sessionContextRefetch().catch((error) => {
              logger.warn('Failed to refresh session after profile update', { error: error instanceof Error ? error : new Error(String(error)) });
            });
          }
          
          toast.success(responseData.message || "Profile updated successfully!");
        } else {
          logger.warn('Updated profile is empty or invalid');
          // Still refresh session even if response data is empty
          if (sessionContextRefetch) {
            sessionContextRefetch().catch((error) => {
              logger.warn('Failed to refresh session after profile update', { error: error instanceof Error ? error : new Error(String(error)) });
            });
          }
          toast.success("Profile updated successfully!");
        }
      } else {
        // Try to get error response text first
        let errorText = '';
        let errorData: Record<string, unknown> = {};
        
        try {
          errorText = await response.text();
          if (errorText) {
            try {
              errorData = JSON.parse(errorText);
            } catch {
              // If not JSON, use the text as the error message
              errorData = { message: errorText };
            }
          }
        } catch (parseError) {
          logger.warn('Failed to parse error response', {
            error: parseError instanceof Error ? parseError.message : String(parseError),
          });
        }
        
        // Create an Error object from the response
        const errorMessage = typeof errorData.error === 'string' 
          ? errorData.error 
          : typeof errorData.message === 'string'
          ? errorData.message
          : `Failed to update profile (${response.status})`;
        
        const apiError = new Error(errorMessage);
        
        // Log the error with full context
        logger.error('Update error', apiError, {
          status: response.status,
          statusText: response.statusText,
          url: `${API_BASE_URL}${API_ENDPOINTS.authProfile}`,
          errorData: errorData,
          errorText: errorText || undefined,
          payload: payloadString ? payloadString.substring(0, 500) : 'N/A' // Log first 500 chars of payload for debugging
        });
        
        // Extract detailed validation errors if available
        let userFacingMessage = errorMessage;
        
      // Check if error might be related to location field
      const hasLocation = payloadString?.includes('"location"');
      const isLocationError = hasLocation && response.status === 500;
      
      // If there are validation details, append them
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const validationErrors = errorData.errors.map((e: Record<string, unknown>) => `${e.field || e.path}: ${e.message || e.msg}`).join(', ');
          userFacingMessage += ` - ${validationErrors}`;
        } else if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details.map((d: Record<string, unknown>) => d.message || d.msg).join(', ');
          userFacingMessage += ` - ${validationErrors}`;
        } else if (typeof errorData.validation === 'object' && errorData.validation !== null) {
          const validationErrors = Object.entries(errorData.validation)
            .map(([field, errors]: [string, unknown]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : String(errors)}`)
            .join('; ');
          userFacingMessage += ` - ${validationErrors}`;
        }
        
        // Add helpful message if location might be the issue
        if (isLocationError) {
          userFacingMessage += " The server may not support location data in GeoJSON format.";
          
          // Store cleaned payload for retry
          const currentPayload = cleanedPayload;
          
          // Show error with option to retry without location
          toast.error((t) => (
            <div className="flex flex-col gap-2">
              <span>{userFacingMessage}</span>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={async () => {
                    toast.dismiss(t.id);
                    setIsLoading(true);
                    // Retry without location
                    const payloadWithoutLocation = { ...currentPayload };
                    delete payloadWithoutLocation.location;
                    const retryPayloadString = JSON.stringify(payloadWithoutLocation);
                    
                    try {
                      const retryResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.authProfile}`, 
                        {
                          ...createAuthFetchOptions({
                            method: "PUT",
                            body: retryPayloadString,
                          })
                        }
                      );
                      
                      if (retryResponse.ok) {
                        const retryResponseText = await retryResponse.text();
                        const retryResponseData = retryResponseText ? JSON.parse(retryResponseText) : {};
                        toast.success("Profile updated successfully (without location)");
                        // Refresh the form data
                        if (retryResponseData?.data || retryResponseData?.user) {
                          const updatedProfile = retryResponseData.data || retryResponseData.user;
                          setProfile(updatedProfile as UserProfile);
                          // Clear location from form
                          setValue("locationPoint", undefined);
                          setHasUnsavedChanges(false);
                        }
                        // Refresh session data to reflect updated user information
                        if (sessionContextRefetch) {
                          sessionContextRefetch().catch((error) => {
                            logger.warn('Failed to refresh session after retry update', { error: error instanceof Error ? error : new Error(String(error)) });
                          });
                        }
                        setIsLoading(false);
                      } else {
                        const retryErrorText = await retryResponse.text();
                        const retryErrorData = retryErrorText ? JSON.parse(retryErrorText) : {};
                        toast.error(retryErrorData.message || "Failed to update profile");
                        setIsLoading(false);
                      }
                    } catch (retryError) {
                      logger.error("Retry error", retryError instanceof Error ? retryError : new Error(String(retryError)));
                      toast.error("Failed to retry update");
                      setIsLoading(false);
                    }
                  }}
                  className="px-3 py-1 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
                >
                  Save Without Location
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ), {
            duration: 10000, // Longer duration for interactive toast
          });
        } else {
          toast.error(userFacingMessage, {
            duration: 7000, // Longer duration for complex errors
          });
        }
      }
    } catch (error) {
      // Enhanced error logging with full context
      const errorContext = {
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        apiUrl: `${API_BASE_URL}${API_ENDPOINTS.authProfile}`,
        userId: session?.user?.id || session?.user?._id,
        hasPayload: !!payloadString,
        payloadSize: payloadString?.length || 0,
      };
      
      logger.error("Error updating profile", error instanceof Error ? error : new Error(String(error)), errorContext);
      
      let errorMessage = "Failed to update profile";
      let errorDetails = "";
      
      if (error instanceof Error) {
        // Handle network errors
        if (error.name === 'AbortError') {
          errorMessage = "Request timeout";
          errorDetails = "The request took too long. Please check your connection and try again.";
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = "Network error";
          errorDetails = "Unable to connect to the server. Please check your internet connection and try again.";
        } else if (error.message.includes('JSON')) {
          errorMessage = "Data format error";
          errorDetails = "The server response could not be parsed. Please try again or contact support.";
        } else if (error.message.includes('CORS')) {
          errorMessage = "CORS error";
          errorDetails = "Cross-origin request blocked. Please contact support.";
        } else {
          errorMessage = error.message || "An unexpected error occurred";
          errorDetails = `Error type: ${error.name || 'Unknown'}`;
        }
      } else {
        errorMessage = "An unexpected error occurred";
        errorDetails = `Error: ${String(error)}`;
      }
      
      // Show detailed error to user
      const fullErrorMessage = errorDetails ? `${errorMessage}. ${errorDetails}` : errorMessage;
      toast.error(fullErrorMessage, {
        duration: 5000,
      });
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

      // Upload avatar using dedicated endpoint: /api/auth/upload-avatar
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
        
        // Refresh session data to reflect updated user information
        if (sessionContextRefetch) {
          sessionContextRefetch().catch((error) => {
            logger.warn('Failed to refresh session after avatar upload', { error: error instanceof Error ? error : new Error(String(error)) });
          });
        }
        
        toast.success(data.message || "Avatar uploaded successfully!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      logger.error("Error uploading avatar", error instanceof Error ? error : new Error(String(error)));
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
        // Refresh session data to reflect updated user information
        if (sessionContextRefetch) {
          sessionContextRefetch().catch((error) => {
            logger.warn('Failed to refresh session after portfolio upload', { error: error instanceof Error ? error : new Error(String(error)) });
          });
        }
        toast.success(data.message || "Portfolio uploaded successfully!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      logger.error("Error uploading portfolio", error instanceof Error ? error : new Error(String(error)));
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
        // Refresh session data to reflect updated user information
        if (sessionContextRefetch) {
          sessionContextRefetch().catch((error) => {
            logger.warn('Failed to refresh session after portfolio delete', { error: error instanceof Error ? error : new Error(String(error)) });
          });
        }
        toast.success("Portfolio image removed successfully!");
      } else {
        toast.error("Failed to remove portfolio image");
      }
    } catch (error) {
      logger.error("Error removing portfolio image", error instanceof Error ? error : new Error(String(error)));
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  logger.debug('Initial values', { hasInitialValues: !!initialValues });
  return (
    <div className="bg-white rounded-xl shadow-sm animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          {/* Auto-save Status */}
          {(autoSaveStatus !== 'idle' || hasUnsavedChanges) && (
            <div className="px-6 py-2 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center space-x-2 text-sm">
                {autoSaveStatus === 'saving' && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                    <span className="text-gray-600">Saving...</span>
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span className="text-accent">Saved</span>
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
            logger.error('Form validation errors', undefined, { errorCount: Object.keys(errors).length });
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
                  <p className="text-gray-600 capitalize">{(profile?.roles && profile.roles.length > 0) ? profile.roles[0] : "User"}</p>
                  {profile?.isVerified && (
                    <div className="flex items-center mt-1">
                      <CheckCircle className="w-4 h-4 text-accent mr-1" />
                      <span className="text-xs text-accent font-medium">Verified</span>
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
                        <UserIcon className="w-4 h-4 inline mr-2" />
                        Full Name
                      </label>
                      <input
                        {...register("name")}
                        type="text"
                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent transition-all shadow-sm hover:border-gray-300"
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
                      required
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      label="Last Name"
                      {...register("lastName")}
                      type="text"
                      required
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
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
                  <h3 className="text-sm font-semibold text-gray-700 tracking-wide">
                    Address
                    <span className="text-red-500 ml-1">*</span>
                  </h3>
                  <div className="h-px bg-gray-200" />
                  {errors.profile?.address && (
                    <p className="text-sm text-red-600">Address is required</p>
                  )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                    <input {...register("profile.address.street")} type="text" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent transition-all shadow-sm hover:border-gray-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input {...register("profile.address.city")} type="text" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent transition-all shadow-sm hover:border-gray-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
                    <input {...register("profile.address.state")} type="text" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent transition-all shadow-sm hover:border-gray-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                    <input {...register("profile.address.zipCode")} type="text" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent transition-all shadow-sm hover:border-gray-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input {...register("profile.address.country")} type="text" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent transition-all shadow-sm hover:border-gray-300" />
                  </div>
                </div>

                {/* Location Coordinates */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Location Coordinates
                    </label>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={isGettingLocation}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGettingLocation ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Getting Location...
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          Use My Current Location
                        </>
                      )}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={watch("locationPoint")?.coordinates?.[0]?.toFixed(6) || ""}
                        readOnly
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm"
                        placeholder="Not set"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={watch("locationPoint")?.coordinates?.[1]?.toFixed(6) || ""}
                        readOnly
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm"
                        placeholder="Not set"
                      />
                    </div>
                  </div>
                  {watch("locationPoint")?.coordinates && (
                    <p className="text-xs text-gray-500">
                      Location format: GeoJSON Point [longitude, latitude]
                    </p>
                  )}
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
                        className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent transition-all shadow-sm hover:border-gray-300"
                      />
                    </div>

                    {/* Service Areas and Specialties - Only for service providers */}
                    {isServiceProvider && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Service Areas</label>
                          <input {...register("profile.serviceAreas")} type="text" placeholder="Comma-separated" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent transition-all shadow-sm hover:border-gray-300" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Specialties</label>
                          <input {...register("profile.specialties")} type="text" placeholder="Comma-separated" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent transition-all shadow-sm hover:border-gray-300" />
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
                        <input {...register("profile.experience")} type="number" placeholder="Years of experience" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent transition-all shadow-sm hover:border-gray-300" />
                        <input {...register("profile.yearsInBusiness")} type="number" placeholder="Years in business" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent transition-all shadow-sm hover:border-gray-300" />
                        <input {...register("profile.businessName")} type="text" placeholder="Business name" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent transition-all shadow-sm hover:border-gray-300" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <select {...register("profile.businessType")} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent transition-all shadow-sm hover:border-gray-300">
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
                        <button type="button" onClick={() => addCertification({ name: "", issuer: "", issueDate: "", expiryDate: "", document: { url: "", publicId: "", filename: "" } })} className="text-accent text-sm">Add</button>
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
                        <button type="button" onClick={() => addSchedule({ day: "monday", startTime: "08:00", endTime: "17:00", isAvailable: true })} className="text-accent text-sm">Add day</button>
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
                      <input {...register("tags")} type="text" placeholder="Comma-separated (e.g. top_rated, fast_response)" className="w-full px-4 py-3 bg-white border border-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent transition-all shadow-sm hover:border-gray-300" />
                    </div>

                    {/* Notes */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <button type="button" onClick={() => addNote({ note: "" })} className="text-accent text-sm">Add note</button>
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
                  className="flex items-center space-x-2 px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
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
