export type AdminRole = "admin" | "manager" | "supervisor";
export type ProviderStatus = "active" | "inactive" | "suspended" | "pending";
export type AgencyStatus = "active" | "inactive" | "suspended" | "pending";
export type BusinessType = "sole_proprietorship" | "partnership" | "corporation" | "llc" | "nonprofit";
export type ServiceCategory =
  | "cleaning"
  | "plumbing"
  | "electrical"
  | "moving"
  | "landscaping"
  | "painting"
  | "carpentry"
  | "flooring"
  | "roofing"
  | "hvac"
  | "appliance_repair"
  | "locksmith"
  | "handyman"
  | "home_security"
  | "pool_maintenance"
  | "pest_control"
  | "carpet_cleaning"
  | "window_cleaning"
  | "gutter_cleaning"
  | "power_washing"
  | "snow_removal"
  | "other";
export type SubscriptionPlan = "basic" | "professional" | "enterprise";
export type DocumentType = "business_license" | "insurance_certificate" | "tax_certificate" | "other";

export interface Admin {
  user: string;
  role?: AdminRole;
  addedAt?: Date;
  permissions?: string[];
}

export interface ProviderPerformance {
  rating?: number;
  totalJobs?: number;
  completedJobs?: number;
  cancellationRate?: number;
}

export interface Provider {
  user: string;
  status?: ProviderStatus;
  commissionRate?: number;
  joinedAt?: Date;
  performance?: ProviderPerformance;
}

export interface Contact {
  email: string;
  phone: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    coordinates?: {
      lat?: number;
      lng?: number;
    };
  };
}

export interface Insurance {
  provider?: string;
  policyNumber?: string;
  coverageAmount?: number;
  expiryDate?: Date;
}

export interface Business {
  type?: BusinessType;
  registrationNumber?: string;
  taxId?: string;
  licenseNumber?: string;
  insurance?: Insurance;
}

export interface ServiceArea {
  name?: string;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
  radius?: number;
  zipCodes?: string[];
}

export interface ServicePricing {
  baseRate?: number;
  currency?: string;
}

export interface Service {
  category: ServiceCategory;
  subcategories?: string[];
  pricing?: ServicePricing;
}

export interface Subscription {
  plan?: SubscriptionPlan;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  features?: string[];
}

export interface VerificationDocument {
  type?: DocumentType;
  url?: string;
  publicId?: string;
  filename?: string;
  uploadedAt?: Date;
}

export interface Verification {
  isVerified?: boolean;
  verifiedAt?: Date;
  documents?: VerificationDocument[];
}

export interface MonthlyStats {
  month?: string;
  year?: number;
  bookings?: number;
  revenue?: number;
  newProviders?: number;
}

export interface Analytics {
  totalBookings?: number;
  totalRevenue?: number;
  averageRating?: number;
  totalReviews?: number;
  monthlyStats?: MonthlyStats[];
}

export interface NotificationPreferences {
  email?: {
    newBookings?: boolean;
    providerUpdates?: boolean;
    paymentUpdates?: boolean;
  };
  sms?: {
    newBookings?: boolean;
    urgentUpdates?: boolean;
  };
}

export interface Settings {
  autoApproveProviders?: boolean;
  requireProviderVerification?: boolean;
  defaultCommissionRate?: number;
  notificationPreferences?: NotificationPreferences;
}

export interface AgencyLogo {
  url?: string;
  publicId?: string;
  thumbnail?: string;
}

export interface AgencyRating {
  average?: number;
  count?: number;
}

export interface Agency {
  _id?: string;
  name: string;
  description: string;
  owner: string;
  logo?: AgencyLogo;
  status?: AgencyStatus;
  rating?: AgencyRating;
  admins?: Admin[];
  providers?: Provider[];
  contact: Contact;
  business?: Business;
  serviceAreas?: ServiceArea[];
  services?: Service[];
  subscription?: Subscription;
  verification?: Verification;
  analytics?: Analytics;
  settings?: Settings;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
