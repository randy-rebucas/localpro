/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/marketplace/types-bookings' instead.
 */
export * from '@/features/marketplace/types-bookings';

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
export type PricingType = "hourly" | "fixed" | "per_sqft" | "per_item";
export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export type ServiceType = "one_time" | "recurring" | "emergency" | "maintenance" | "installation";
export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";
export type PaymentMethod = "cash" | "card" | "bank_transfer" | "paypal" | "paymaya";
export type MessageType = "text" | "image" | "file";

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
  type: PricingType;
  basePrice: number;
  currency?: string;
}

export interface ServiceImage {
  url?: string;
  publicId?: string;
  thumbnail?: string;
  alt?: string;
}

export interface EstimatedDuration {
  min?: number;
  max?: number;
}

export interface Warranty {
  hasWarranty?: boolean;
  duration?: number;
  description?: string;
}

export interface Insurance {
  covered?: boolean;
  coverageAmount?: number;
}

export interface EmergencyService {
  available?: boolean;
  surcharge?: number;
  responseTime?: string;
}

export interface ServicePackage {
  name?: string;
  description?: string;
  price?: number;
  features?: string[];
  duration?: number;
}

export interface AddOn {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
}

export interface ServiceRating {
  average?: number;
  count?: number;
}

export interface Service {
  _id?: string;
  title: string;
  description: string;
  category: ServiceCategory;
  subcategory: string;
  provider: string;
  pricing: ServicePricing;
  availability?: Availability;
  serviceArea: string[];
  images?: ServiceImage[];
  features?: string[];
  requirements?: string[];
  serviceType?: ServiceType;
  estimatedDuration?: EstimatedDuration;
  teamSize?: number;
  equipmentProvided?: boolean;
  materialsIncluded?: boolean;
  warranty?: Warranty;
  insurance?: Insurance;
  emergencyService?: EmergencyService;
  servicePackages?: ServicePackage[];
  addOns?: AddOn[];
  isActive?: boolean;
  rating?: ServiceRating;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AddressCoordinates {
  lat?: number;
  lng?: number;
}

export interface BookingAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  coordinates?: AddressCoordinates;
}

export interface AdditionalFee {
  description?: string;
  amount?: number;
}

export interface BookingPricing {
  basePrice?: number;
  additionalFees?: AdditionalFee[];
  totalAmount?: number;
  currency?: string;
}

export interface Payment {
  status?: PaymentStatus;
  method?: PaymentMethod;
  transactionId?: string;
  paypalOrderId?: string;
  paypalTransactionId?: string;
  paymayaReferenceNumber?: string;
  paymayaCheckoutId?: string;
  paymayaPaymentId?: string;
  paymayaInvoiceId?: string;
  paymayaTransactionId?: string;
  paidAt?: Date;
}

export interface ReviewCategories {
  quality?: number;
  timeliness?: number;
  communication?: number;
  value?: number;
}

export interface ReviewPhoto {
  url?: string;
  publicId?: string;
  thumbnail?: string;
}

export interface Review {
  rating?: number;
  comment?: string;
  createdAt?: Date;
  categories?: ReviewCategories;
  wouldRecommend?: boolean;
  photos?: ReviewPhoto[];
}

export interface Message {
  sender?: string;
  message?: string;
  timestamp?: Date;
  type?: MessageType;
}

export interface Communication {
  messages?: Message[];
  lastMessageAt?: Date;
}

export interface TimelineEntry {
  status?: string;
  timestamp?: Date;
  note?: string;
  updatedBy?: string;
}

export interface Document {
  name?: string;
  url?: string;
  publicId?: string;
  type?: string;
  uploadedBy?: string;
  uploadedAt?: Date;
}

export interface Photo {
  url?: string;
  publicId?: string;
  thumbnail?: string;
}

export interface ClientSatisfaction {
  rating?: number;
  feedback?: string;
  submittedAt?: Date;
}

export interface Booking {
  _id?: string;
  service: string;
  client: string;
  provider: string;
  bookingDate: Date;
  duration: number;
  address?: BookingAddress;
  specialInstructions?: string;
  status?: BookingStatus;
  pricing?: BookingPricing;
  payment?: Payment;
  review?: Review;
  communication?: Communication;
  timeline?: TimelineEntry[];
  documents?: Document[];
  beforePhotos?: Photo[];
  afterPhotos?: Photo[];
  completionNotes?: string;
  clientSatisfaction?: ClientSatisfaction;
  createdAt?: Date;
  updatedAt?: Date;
}
