import { z } from "zod";

// Service Validation Schemas
export const serviceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000, "Description must be less than 5000 characters"),
  category: z.enum([
    "cleaning", "plumbing", "electrical", "moving", "landscaping",
    "painting", "carpentry", "flooring", "roofing", "hvac",
    "appliance_repair", "locksmith", "handyman", "home_security",
    "pool_maintenance", "pest_control", "carpet_cleaning", "window_cleaning",
    "gutter_cleaning", "power_washing", "snow_removal", "other"
  ]),
  subcategory: z.string().min(1, "Subcategory is required"),
  pricing: z.object({
    type: z.enum(["hourly", "fixed", "per_sqft", "per_item"]),
    basePrice: z.number().min(0, "Price must be positive"),
    currency: z.string().default("USD"),
  }),
  serviceArea: z.array(z.string()).min(1, "At least one service area is required"),
  features: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  serviceType: z.enum(["one_time", "recurring", "emergency", "maintenance", "installation"]).optional(),
  estimatedDuration: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).optional(),
  teamSize: z.number().min(1).optional(),
  equipmentProvided: z.boolean().optional(),
  materialsIncluded: z.boolean().optional(),
});

// Booking Validation Schemas
export const bookingSchema = z.object({
  service: z.string().min(1, "Service is required"),
  bookingDate: z.date(),
  duration: z.number().min(0.5, "Duration must be at least 0.5 hours"),
  address: z.object({
    street: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    coordinates: z.object({
      lat: z.number().optional(),
      lng: z.number().optional(),
    }).optional(),
  }).optional(),
  specialInstructions: z.string().max(1000, "Instructions must be less than 1000 characters").optional(),
});

// Supply/Product Validation Schemas
export const supplySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must be less than 100 characters"),
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000, "Description must be less than 5000 characters"),
  category: z.enum(["cleaning_supplies", "tools", "materials", "equipment"]),
  subcategory: z.string().min(1, "Subcategory is required"),
  brand: z.string().min(1, "Brand is required"),
  sku: z.string().min(1, "SKU is required"),
  pricing: z.object({
    retailPrice: z.number().min(0, "Price must be positive"),
    wholesalePrice: z.number().min(0).optional(),
    currency: z.string().default("USD"),
  }),
  inventory: z.object({
    quantity: z.number().min(0, "Quantity cannot be negative"),
    minStock: z.number().min(0).optional(),
    maxStock: z.number().min(0).optional(),
    location: z.string().optional(),
  }),
});

// Rental Validation Schemas
export const rentalSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must be less than 100 characters"),
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000, "Description must be less than 5000 characters"),
  category: z.enum(["tools", "vehicles", "equipment", "machinery"]),
  subcategory: z.string().min(1, "Subcategory is required"),
  pricing: z.object({
    hourly: z.number().min(0).optional(),
    daily: z.number().min(0).optional(),
    weekly: z.number().min(0).optional(),
    monthly: z.number().min(0).optional(),
    currency: z.string().default("USD"),
  }).refine(
    (data) => data.hourly || data.daily || data.weekly || data.monthly,
    "At least one pricing option is required"
  ),
  availability: z.object({
    isAvailable: z.boolean(),
    schedule: z.array(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      reason: z.string().optional(),
    })).optional(),
  }).optional(),
});

// Course Validation Schemas
export const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000, "Description must be less than 5000 characters"),
  category: z.enum(["cleaning", "plumbing", "electrical", "moving", "business", "safety", "certification"]),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  duration: z.object({
    hours: z.number().min(1, "Duration must be at least 1 hour"),
    weeks: z.number().min(0).optional(),
  }),
  pricing: z.object({
    regularPrice: z.number().min(0, "Price must be positive"),
    discountedPrice: z.number().min(0).optional(),
    currency: z.string().default("USD"),
  }),
  learningOutcomes: z.array(z.string()).min(1, "At least one learning outcome is required").optional(),
});

// Job Validation Schemas
export const jobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000, "Description must be less than 5000 characters"),
  company: z.object({
    name: z.string().min(1, "Company name is required"),
    website: z.string().url().optional().or(z.literal("")),
    size: z.enum(["startup", "small", "medium", "large", "enterprise"]).optional(),
    industry: z.string().optional(),
  }),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().min(1, "Subcategory is required"),
  jobType: z.enum(["full_time", "part_time", "contract", "freelance", "internship", "temporary"]),
  experienceLevel: z.enum(["entry", "junior", "mid", "senior", "lead", "executive"]),
  salary: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
    currency: z.string().optional(),
    period: z.enum(["hourly", "daily", "weekly", "monthly", "yearly"]).optional(),
  }).optional(),
  isRemote: z.boolean().optional(),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  requirements: z.array(z.string()).optional(),
});

// Facility Care Validation Schemas
export const facilityCareSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000, "Description must be less than 5000 characters"),
  category: z.enum(["janitorial", "landscaping", "pest_control", "maintenance", "security"]).optional(),
  pricing: z.object({
    type: z.enum(["hourly", "monthly", "per_sqft", "per_visit", "contract"]).optional(),
    basePrice: z.number().min(0, "Price must be positive"),
    currency: z.string().default("USD"),
  }).optional(),
  serviceArea: z.array(z.string()).min(1, "At least one service area is required").optional(),
});

// Ad Campaign Validation Schemas
export const adCampaignSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000, "Description must be less than 5000 characters"),
  type: z.enum(["banner", "sponsored_listing", "video", "text", "interactive"]),
  category: z.enum(["hardware_stores", "suppliers", "training_schools", "services", "products"]),
  budget: z.object({
    total: z.number().min(1, "Budget must be at least 1"),
    daily: z.number().min(0).optional(),
    currency: z.string().default("USD"),
  }),
  schedule: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }).refine(
    (data) => data.endDate > data.startDate,
    "End date must be after start date"
  ),
});

// User Settings Validation Schemas
export const userSettingsSchema = z.object({
  privacy: z.object({
    profileVisibility: z.enum(["public", "contacts_only", "private"]),
    showPhoneNumber: z.boolean(),
    showEmail: z.boolean(),
    showLocation: z.boolean(),
    showRating: z.boolean(),
    showPortfolio: z.boolean(),
    allowDirectMessages: z.boolean(),
    allowJobInvitations: z.boolean(),
    allowReferralRequests: z.boolean(),
  }),
  notifications: z.object({
    push: z.object({
      enabled: z.boolean(),
      newMessages: z.boolean(),
      jobMatches: z.boolean(),
      bookingUpdates: z.boolean(),
      paymentUpdates: z.boolean(),
      referralUpdates: z.boolean(),
      systemUpdates: z.boolean(),
      marketing: z.boolean(),
    }),
    email: z.object({
      enabled: z.boolean(),
      newMessages: z.boolean(),
      jobMatches: z.boolean(),
      bookingUpdates: z.boolean(),
      paymentUpdates: z.boolean(),
      referralUpdates: z.boolean(),
      systemUpdates: z.boolean(),
      marketing: z.boolean(),
      weeklyDigest: z.boolean(),
      monthlyReport: z.boolean(),
    }),
    sms: z.object({
      enabled: z.boolean(),
      urgentMessages: z.boolean(),
      bookingReminders: z.boolean(),
      paymentAlerts: z.boolean(),
      securityAlerts: z.boolean(),
    }),
  }),
  communication: z.object({
    preferredLanguage: z.enum(["en", "fil", "es", "zh", "ja", "ko"]),
    timezone: z.string(),
    dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]),
    timeFormat: z.enum(["12h", "24h"]),
    currency: z.enum(["PHP", "USD", "EUR", "GBP", "JPY", "KRW", "CNY"]),
  }),
});

// Export all schemas
export type ServiceFormData = z.infer<typeof serviceSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
export type SupplyFormData = z.infer<typeof supplySchema>;
export type RentalFormData = z.infer<typeof rentalSchema>;
export type CourseFormData = z.infer<typeof courseSchema>;
export type JobFormData = z.infer<typeof jobSchema>;
export type FacilityCareFormData = z.infer<typeof facilityCareSchema>;
export type AdCampaignFormData = z.infer<typeof adCampaignSchema>;
export type UserSettingsFormData = z.infer<typeof userSettingsSchema>;

