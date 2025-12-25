/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/referrals/types' instead.
 */
export * from '@/features/referrals/types';
import type { ReferralStatus } from '@/features/referrals/types';
export type ReferralType =
  | "signup"
  | "service_booking"
  | "supplies_purchase"
  | "course_enrollment"
  | "loan_application"
  | "rental_booking"
  | "subscription_upgrade";
export type TriggerActionType = "booking" | "purchase" | "enrollment" | "loan" | "rental" | "subscription";
export type RewardType = "credit" | "discount" | "cash" | "points" | "subscription_days";
export type RewardStatus = "pending" | "processed" | "paid" | "failed";
export type DiscountType = "percentage" | "fixed_amount";
export type TrackingSource = "email" | "sms" | "social_media" | "direct_link" | "qr_code" | "app_share";
export type VerificationMethod = "automatic" | "manual" | "admin";

export interface TriggerAction {
  type: TriggerActionType;
  referenceId: string;
  referenceType: string;
  amount?: number;
  currency?: string;
  completedAt?: Date;
}

export interface Reward {
  type: RewardType;
  amount: number;
  currency?: string;
  description?: string;
  isPercentage?: boolean;
  maxAmount?: number;
  subscriptionDays?: number;
  discountCode?: string;
  discountType?: DiscountType;
}

export interface Tracking {
  source?: TrackingSource;
  campaign?: string;
  medium?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  ipAddress?: string;
  userAgent?: string;
  referrerUrl?: string;
}

export interface Timeline {
  referredAt?: Date;
  signupAt?: Date;
  firstActionAt?: Date;
  completedAt?: Date;
  rewardedAt?: Date;
  expiresAt?: Date;
}

export interface RewardDistribution {
  amount?: number;
  currency?: string;
  type?: RewardType;
  status?: RewardStatus;
  processedAt?: Date;
  paymentMethod?: string;
  transactionId?: string;
}

export interface RewardDistributionDetails {
  referrerReward?: RewardDistribution;
  refereeReward?: RewardDistribution;
}

export interface Verification {
  isVerified?: boolean;
  verifiedAt?: Date;
  verificationMethod?: VerificationMethod;
  verifiedBy?: string;
}

export interface Analytics {
  clickCount?: number;
  conversionRate?: number;
  totalValue?: number;
  lifetimeValue?: number;
}

export interface Referral {
  _id?: string;
  referrer: string;
  referee: string;
  referralCode: string;
  status?: ReferralStatus;
  referralType: ReferralType;
  triggerAction?: TriggerAction;
  reward?: Reward;
  tracking?: Tracking;
  timeline?: Timeline;
  rewardDistribution?: RewardDistributionDetails;
  metadata?: {
    notes?: string;
    tags?: string[];
    customFields?: Record<string, unknown>;
  };
  verification?: Verification;
  analytics?: Analytics;
  createdAt?: Date;
  updatedAt?: Date;
}
