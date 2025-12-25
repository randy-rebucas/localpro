/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/rentals/types' instead.
 */
export * from '@/features/rentals/types';
import type { RentalCategory } from '@/features/rentals/types';
export type Condition = "excellent" | "good" | "fair" | "poor";
export type DocumentType = "manual" | "warranty" | "insurance" | "license" | "other";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type RentalStatus = "pending" | "confirmed" | "active" | "completed" | "cancelled" | "disputed";
export type PaymentStatus = "pending" | "paid" | "refunded" | "partial";
export type ReturnCondition = "excellent" | "good" | "fair" | "poor" | "damaged";
export type RentalPeriodType = "hourly" | "daily" | "weekly" | "monthly";

export interface Pricing {
  hourly?: number;
  daily?: number;
  weekly?: number;
  monthly?: number;
  currency?: string;
}

export interface AvailabilitySchedule {
  startDate?: Date;
  endDate?: Date;
  reason?: string;
}

export interface Availability {
  isAvailable?: boolean;
  schedule?: AvailabilitySchedule[];
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface Coordinates {
  lat?: number;
  lng?: number;
}

export interface Location {
  address?: Address;
  coordinates?: Coordinates;
  pickupRequired?: boolean;
  deliveryAvailable?: boolean;
  deliveryFee?: number;
}

export interface Dimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
}

export interface Weight {
  value?: number;
  unit?: string;
}

export interface Specifications {
  brand?: string;
  model?: string;
  year?: number;
  condition?: Condition;
  features?: string[];
  dimensions?: Dimensions;
  weight?: Weight;
}

export interface Requirements {
  minAge?: number;
  licenseRequired?: boolean;
  licenseType?: string;
  deposit?: number;
  insuranceRequired?: boolean;
}

export interface Image {
  url?: string;
  publicId?: string;
  thumbnail?: string;
  alt?: string;
}

export interface Document {
  type?: DocumentType;
  url?: string;
  publicId?: string;
  name?: string;
}

export interface ServiceHistory {
  date?: Date;
  type?: string;
  description?: string;
  cost?: number;
}

export interface Maintenance {
  lastService?: Date;
  nextService?: Date;
  serviceHistory?: ServiceHistory[];
}

export interface Rating {
  average?: number;
  count?: number;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
}

export interface Booking {
  user: string;
  startDate: Date;
  endDate: Date;
  quantity?: number;
  totalCost: number;
  specialRequests?: string;
  contactInfo?: ContactInfo;
  status?: BookingStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Review {
  user: string;
  rating: number;
  comment?: string;
  createdAt?: Date;
}

export interface RentalItem {
  _id?: string;
  name: string;
  title: string;
  description: string;
  category: RentalCategory;
  subcategory: string;
  owner: string;
  pricing?: Pricing;
  availability?: Availability;
  location?: Location;
  specifications?: Specifications;
  requirements?: Requirements;
  images?: Image[];
  documents?: Document[];
  maintenance?: Maintenance;
  rating?: Rating;
  isActive?: boolean;
  isFeatured?: boolean;
  views?: number;
  tags?: string[];
  bookings?: Booking[];
  reviews?: Review[];
  averageRating?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RentalPeriod {
  startDate: Date;
  endDate: Date;
  duration: number;
}

export interface RentalPricing {
  rate: number;
  period: RentalPeriod;
  subtotal?: number;
  deliveryFee?: number;
  deposit?: number;
  insuranceFee?: number;
  totalAmount?: number;
  currency?: string;
}

export interface PickupLocation {
  address?: string;
  coordinates?: Coordinates;
}

export interface Pickup {
  location?: PickupLocation;
  scheduledTime?: Date;
  actualTime?: Date;
  contactPerson?: string;
  contactPhone?: string;
}

export interface Return {
  scheduledTime?: Date;
  actualTime?: Date;
  condition?: ReturnCondition;
  notes?: string;
  images?: Image[];
}

export interface Payment {
  status?: PaymentStatus;
  method?: string;
  transactionId?: string;
  paidAt?: Date;
  refundedAt?: Date;
}

export interface Insurance {
  isRequired?: boolean;
  provider?: string;
  policyNumber?: string;
  coverage?: number;
}

export interface Communication {
  sender?: string;
  message?: string;
  timestamp?: Date;
}

export interface RentalReview {
  rating?: number;
  comment?: string;
  createdAt?: Date;
}

export interface Rental {
  _id?: string;
  item: string;
  renter: string;
  owner: string;
  rentalPeriod: RentalPeriod;
  pricing: RentalPricing;
  pickup?: Pickup;
  return?: Return;
  status?: RentalStatus;
  payment?: Payment;
  insurance?: Insurance;
  communication?: Communication[];
  review?: RentalReview;
  createdAt?: Date;
  updatedAt?: Date;
}
