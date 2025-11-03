export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "suspended" | "pending";
export type PaymentMethod = "paypal" | "paymaya" | "stripe" | "bank_transfer";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded" | "cancelled";
export type SubscriptionAction =
  | "subscribed"
  | "upgraded"
  | "downgraded"
  | "cancelled"
  | "renewed"
  | "suspended"
  | "reactivated";
export type FeatureUnit = "per_month" | "per_booking" | "per_user" | "per_gb" | "per_call" | "unlimited";
export type FeatureType =
  | "service_creation"
  | "booking_management"
  | "analytics_view"
  | "api_call"
  | "file_upload"
  | "email_notification"
  | "sms_notification"
  | "custom_branding"
  | "priority_support"
  | "advanced_search";

export interface FeatureLimit {
  name: string;
  description?: string;
  included?: boolean;
  limit?: number | null;
  unit?: FeatureUnit;
}

export interface Limits {
  maxServices?: number;
  maxBookings?: number;
  maxProviders?: number;
  maxStorage?: number;
  maxApiCalls?: number;
}

export interface SubscriptionPlan {
  _id?: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
    currency?: string;
  };
  features?: FeatureLimit[];
  limits?: Limits;
  benefits?: string[];
  isActive?: boolean;
  isPopular?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentDetails {
  paypalSubscriptionId?: string;
  paymayaSubscriptionId?: string;
  stripeSubscriptionId?: string;
  lastPaymentId?: string;
  lastPaymentDate?: Date;
  nextPaymentAmount?: number;
}

export interface UsageServices {
  current?: number;
  limit?: number;
}

export interface UsageBookings {
  current?: number;
  limit?: number;
}

export interface UsageStorage {
  current?: number;
  limit?: number;
}

export interface UsageApiCalls {
  current?: number;
  limit?: number;
}

export interface Usage {
  services?: UsageServices;
  bookings?: UsageBookings;
  storage?: UsageStorage;
  apiCalls?: UsageApiCalls;
}

export interface Features {
  prioritySupport?: boolean;
  advancedAnalytics?: boolean;
  customBranding?: boolean;
  apiAccess?: boolean;
  whiteLabel?: boolean;
}

export interface Trial {
  isTrial?: boolean;
  trialEndDate?: Date;
  trialUsed?: boolean;
}

export interface HistoryEntry {
  action?: SubscriptionAction;
  fromPlan?: string;
  toPlan?: string;
  timestamp?: Date;
  reason?: string;
  amount?: number;
}

export interface UserSubscription {
  _id?: string;
  user: string;
  plan: string;
  status?: SubscriptionStatus;
  billingCycle?: BillingCycle;
  startDate?: Date;
  endDate?: Date;
  nextBillingDate?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  paymentMethod?: PaymentMethod;
  paymentDetails?: PaymentDetails;
  usage?: Usage;
  features?: Features;
  trial?: Trial;
  history?: HistoryEntry[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BillingPeriod {
  startDate?: Date;
  endDate?: Date;
}

export interface PaymentDetailsFull {
  paypalOrderId?: string;
  paypalTransactionId?: string;
  paymayaReferenceNumber?: string;
  paymayaCheckoutId?: string;
  paymayaPaymentId?: string;
  paymayaInvoiceId?: string;
  paymayaTransactionId?: string;
  stripeChargeId?: string;
  stripePaymentIntentId?: string;
}

export interface RefundDetails {
  refundAmount?: number;
  refundReason?: string;
}

export interface Payment {
  _id?: string;
  user: string;
  subscription?: string;
  amount?: number;
  currency?: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentDetails?: PaymentDetailsFull;
  billingPeriod?: BillingPeriod;
  description?: string;
  metadata?: Record<string, unknown>;
  processedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  refundedAt?: Date;
  refund?: RefundDetails;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FeatureUsageData {
  count?: number;
  amount?: number;
  metadata?: Record<string, unknown>;
}

export interface FeatureUsage {
  _id?: string;
  user: string;
  subscription?: string;
  feature: FeatureType;
  usage?: FeatureUsageData;
  timestamp?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
