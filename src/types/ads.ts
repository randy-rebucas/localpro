/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/ads/types' instead.
 */
export * from '@/features/ads/types';
import type { BusinessType } from '@/features/ads/types';
export type SubscriptionPlan = "basic" | "premium" | "enterprise";
export type DocumentType = "business_license" | "tax_certificate" | "insurance" | "other";
export type AdType = "banner" | "sponsored_listing" | "video" | "text" | "interactive";
export type AdCategory = "hardware_stores" | "suppliers" | "training_schools" | "services" | "products";
export type BiddingStrategy = "cpc" | "cpm" | "cpa" | "fixed";
export type CampaignStatus = "draft" | "pending" | "approved" | "active" | "paused" | "completed" | "rejected";
export type PromotionType = "featured" | "sponsored" | "boosted";
export type PromotionStatus = "active" | "expired" | "cancelled";
export type ImpressionType = "impression" | "click" | "conversion";
export type DeviceType = "mobile" | "tablet" | "desktop";

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface VerificationDocument {
  type?: DocumentType;
  url?: string;
  publicId?: string;
  uploadedAt?: Date;
}

export interface AdvertiserVerification {
  isVerified?: boolean;
  documents?: VerificationDocument[];
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface AdvertiserSubscription {
  plan?: SubscriptionPlan;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}

export interface Advertiser {
  _id?: string;
  user: string;
  businessName: string;
  businessType: BusinessType;
  description: string;
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
    address?: Address;
  };
  verification?: AdvertiserVerification;
  subscription?: AdvertiserSubscription;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Demographics {
  ageRange?: number[];
  gender?: string[];
  location?: string[];
  interests?: string[];
}

export interface Behavior {
  userTypes?: string[];
  activityLevel?: string;
}

export interface TargetAudience {
  demographics?: Demographics;
  behavior?: Behavior;
}

export interface LocationCoordinates {
  latitude?: number;
  longitude?: number;
}

export interface AdLocation {
  city?: string;
  state?: string;
  country?: string;
  coordinates?: LocationCoordinates;
}

export interface Image {
  url?: string;
  publicId?: string;
  thumbnail?: string;
}

export interface CallToAction {
  text?: string;
  url?: string;
}

export interface AdContent {
  headline?: string;
  body?: string;
  images?: Image[];
  video?: {
    url?: string;
    publicId?: string;
    thumbnail?: string;
  };
  callToAction?: CallToAction;
  logo?: Image;
}

export interface Budget {
  total: number;
  daily?: number;
  currency?: string;
}

export interface Bidding {
  strategy?: BiddingStrategy;
  bidAmount?: number;
  maxBid?: number;
}

export interface TimeSlot {
  day?: string;
  startTime?: string;
  endTime?: string;
}

export interface Schedule {
  startDate: Date;
  endDate: Date;
  timeSlots?: TimeSlot[];
}

export interface Performance {
  impressions?: number;
  clicks?: number;
  conversions?: number;
  spend?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
}

export interface Approval {
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
  rejectionReason?: string;
}

export interface Promotion {
  type?: PromotionType;
  duration?: number;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  status?: PromotionStatus;
}

export interface AdCampaign {
  _id?: string;
  advertiser: string;
  title: string;
  description: string;
  type: AdType;
  category: AdCategory;
  targetAudience?: TargetAudience;
  location?: AdLocation;
  images?: Image[];
  content?: AdContent;
  budget: Budget;
  bidding?: Bidding;
  schedule: Schedule;
  performance?: Performance;
  status?: CampaignStatus;
  approval?: Approval;
  isActive?: boolean;
  isFeatured?: boolean;
  views?: number;
  clicks?: number;
  impressions?: number;
  promotion?: Promotion;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ImpressionContext {
  page?: string;
  section?: string;
  position?: string;
}

export interface ImpressionLocation {
  ip?: string;
  country?: string;
  city?: string;
}

export interface AdImpression {
  _id?: string;
  campaign: string;
  user?: string;
  type: ImpressionType;
  context?: ImpressionContext;
  device?: DeviceType;
  location?: ImpressionLocation;
  timestamp?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
