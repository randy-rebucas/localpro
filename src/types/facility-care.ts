/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/facility-care/types' instead.
 */
export * from '@/features/facility-care/types';
import type { FacilityCareCategory } from '@/features/facility-care/types';
export type PricingType = "hourly" | "monthly" | "per_sqft" | "per_visit" | "contract";
export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export type FacilityType =
  | "office"
  | "retail"
  | "warehouse"
  | "residential"
  | "industrial"
  | "healthcare"
  | "educational";
export type ContractStatus = "draft" | "pending" | "active" | "suspended" | "completed" | "terminated";
export type Frequency = "daily" | "weekly" | "bi-weekly" | "monthly" | "quarterly" | "as_needed";
export type PaymentTerms = "net_15" | "net_30" | "net_60" | "due_on_receipt";
export type ServiceLevel = "standard" | "premium" | "custom";
export type SubscriptionType = "janitorial" | "landscaping" | "pest_control" | "maintenance" | "comprehensive";
export type SubscriptionStatus = "active" | "paused" | "cancelled" | "expired";
export type SubscriptionFrequency = "weekly" | "bi-weekly" | "monthly" | "quarterly";
export type PaymentStatus = "pending" | "paid" | "failed";

export interface ScheduleDay {
  day?: DayOfWeek;
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
}

export interface Availability {
  schedule?: ScheduleDay[];
  timezone?: string;
}

export interface ServicePricing {
  type?: PricingType;
  basePrice?: number;
  currency?: string;
}

export interface FacilityCareService {
  _id?: string;
  name: string;
  description: string;
  category?: FacilityCareCategory;
  provider?: string;
  pricing?: ServicePricing;
  serviceArea?: string[];
  availability?: Availability;
  features?: string[];
  requirements?: string[];
  images?: string[];
  isActive?: boolean;
  rating?: {
    average?: number;
    count?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FacilityAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface FacilitySize {
  area?: number;
  unit?: string;
}

export interface Facility {
  name?: string;
  address?: FacilityAddress;
  size?: FacilitySize;
  type?: FacilityType;
}

export interface ContractDetails {
  startDate?: Date;
  endDate?: Date;
  duration?: number;
  frequency?: Frequency;
  scope?: string[];
  specialRequirements?: string[];
}

export interface AdditionalFee {
  description?: string;
  amount?: number;
  frequency?: Frequency;
}

export interface ContractPricing {
  basePrice?: number;
  frequency?: Frequency;
  additionalFees?: AdditionalFee[];
  totalAmount?: number;
  currency?: string;
}

export interface Payment {
  terms?: PaymentTerms;
  method?: string;
  autoPay?: boolean;
}

export interface KPI {
  metric?: string;
  target?: number;
  actual?: number;
  unit?: string;
}

export interface Performance {
  serviceLevel?: ServiceLevel;
  kpis?: KPI[];
}

export interface ContractDocument {
  type?: string;
  name?: string;
  url?: string;
  uploadedAt?: Date;
}

export interface ContractReview {
  date?: Date;
  rating?: number;
  comment?: string;
  reviewer?: string;
}

export interface Contract {
  _id?: string;
  client?: string;
  provider?: string;
  service?: string;
  facility?: Facility;
  contractDetails?: ContractDetails;
  pricing?: ContractPricing;
  payment?: Payment;
  status?: ContractStatus;
  performance?: Performance;
  documents?: ContractDocument[];
  reviews?: ContractReview[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubscriptionPlan {
  name?: string;
  features?: string[];
  frequency?: SubscriptionFrequency;
  price?: number;
  currency?: string;
}

export interface ServiceHistory {
  scheduledDate?: Date;
  actualDate?: Date;
  status?: string;
  notes?: string;
  provider?: string;
}

export interface SubscriptionSchedule {
  startDate?: Date;
  nextService?: Date;
  lastService?: Date;
  serviceHistory?: ServiceHistory[];
}

export interface PaymentHistory {
  date?: Date;
  amount?: number;
  status?: PaymentStatus;
  transactionId?: string;
}

export interface SubscriptionPayment {
  method?: string;
  autoPay?: boolean;
  lastPayment?: Date;
  nextPayment?: Date;
  paymentHistory?: PaymentHistory[];
}

export interface Preferences {
  preferredTime?: string;
  contactMethod?: string;
  specialInstructions?: string;
}

export interface Subscription {
  _id?: string;
  client?: string;
  service?: string;
  contract?: string;
  subscriptionType?: SubscriptionType;
  plan?: SubscriptionPlan;
  schedule?: SubscriptionSchedule;
  status?: SubscriptionStatus;
  payment?: SubscriptionPayment;
  preferences?: Preferences;
  createdAt?: Date;
  updatedAt?: Date;
}
