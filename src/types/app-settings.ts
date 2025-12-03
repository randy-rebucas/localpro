export type Environment = "development" | "staging" | "production";
export type EmailProvider = "nodemailer" | "sendgrid" | "mailgun" | "ses";
export type SmsProvider = "twilio" | "vonage" | "aws_sns";
export type PushProvider = "firebase" | "onesignal" | "pusher";
export type Currency = "PHP";
export type Frequency = "daily" | "weekly" | "monthly";
export type SocialProvider = "google" | "facebook";

export interface MaintenanceMode {
  enabled?: boolean;
  message?: string;
  estimatedEndTime?: Date;
}

export interface ForceUpdate {
  enabled?: boolean;
  minVersion?: string;
  message?: string;
}

export interface General {
  appName?: string;
  appVersion?: string;
  environment?: Environment;
  maintenanceMode?: MaintenanceMode;
  forceUpdate?: ForceUpdate;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface ScheduleDay {
  day?: string;
  startTime?: string;
  endTime?: string;
  isOpen?: boolean;
}

export interface BusinessHours {
  timezone?: string;
  schedule?: ScheduleDay[];
}

export interface SupportChannel {
  enabled?: boolean;
  address?: string;
  number?: string;
  hours?: {
    start?: string;
    end?: string;
  };
}

export interface SupportChannels {
  email?: SupportChannel;
  phone?: SupportChannel;
  chat?: SupportChannel;
}

export interface Business {
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: Address;
  businessHours?: BusinessHours;
  supportChannels?: SupportChannels;
}

export interface Marketplace {
  enabled?: boolean;
  allowNewProviders?: boolean;
  requireVerification?: boolean;
}

export interface Academy {
  enabled?: boolean;
  allowNewCourses?: boolean;
  requireInstructorVerification?: boolean;
}

export interface JobBoard {
  enabled?: boolean;
  allowNewJobs?: boolean;
  requireCompanyVerification?: boolean;
}

export interface Referrals {
  enabled?: boolean;
  rewardAmount?: number;
  maxReferralsPerUser?: number;
}

export interface Payments {
  paypal?: {
    enabled?: boolean;
  };
  paymaya?: {
    enabled?: boolean;
  };
  gcash?: {
    enabled?: boolean;
  };
  bankTransfer?: {
    enabled?: boolean;
  };
}

export interface Analytics {
  enabled?: boolean;
  trackUserBehavior?: boolean;
  trackPerformance?: boolean;
}

export interface Features {
  marketplace?: Marketplace;
  academy?: Academy;
  jobBoard?: JobBoard;
  referrals?: Referrals;
  payments?: Payments;
  analytics?: Analytics;
}

export interface PasswordPolicy {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  maxLoginAttempts?: number;
  lockoutDuration?: number;
}

export interface SessionSettings {
  maxSessionDuration?: number;
  allowMultipleSessions?: boolean;
  maxConcurrentSessions?: number;
}

export interface DataProtection {
  encryptSensitiveData?: boolean;
  dataRetentionPeriod?: number;
  allowDataExport?: boolean;
  allowDataDeletion?: boolean;
}

export interface Security {
  passwordPolicy?: PasswordPolicy;
  sessionSettings?: SessionSettings;
  dataProtection?: DataProtection;
}

export interface ImageCompression {
  enabled?: boolean;
  quality?: number;
}

export interface Uploads {
  maxFileSize?: number;
  allowedImageTypes?: string[];
  allowedDocumentTypes?: string[];
  maxImagesPerUpload?: number;
  imageCompression?: ImageCompression;
}

export interface EmailSettings {
  enabled?: boolean;
  provider?: EmailProvider;
  fromEmail?: string;
  fromName?: string;
}

export interface SmsSettings {
  enabled?: boolean;
  provider?: SmsProvider;
  fromNumber?: string;
}

export interface PushSettings {
  enabled?: boolean;
  provider?: PushProvider;
}

export interface Notifications {
  email?: EmailSettings;
  sms?: SmsSettings;
  push?: PushSettings;
}

export interface TransactionFees {
  percentage?: number;
  fixed?: number;
}

export interface PayoutSchedule {
  frequency?: Frequency;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

export interface PaymentsSettings {
  defaultCurrency?: Currency;
  supportedCurrencies?: Currency[];
  transactionFees?: TransactionFees;
  minimumPayout?: number;
  payoutSchedule?: PayoutSchedule;
}

export interface GoogleAnalytics {
  enabled?: boolean;
  trackingId?: string;
}

export interface Mixpanel {
  enabled?: boolean;
  projectToken?: string;
}

export interface CustomAnalytics {
  enabled?: boolean;
  retentionPeriod?: number;
}

export interface AnalyticsSettings {
  googleAnalytics?: GoogleAnalytics;
  mixpanel?: Mixpanel;
  customAnalytics?: CustomAnalytics;
}

export interface GoogleMaps {
  enabled?: boolean;
  apiKey?: string;
  defaultZoom?: number;
}

export interface Cloudinary {
  enabled?: boolean;
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
}

export interface SocialLoginProvider {
  enabled?: boolean;
  clientId?: string;
  appId?: string;
}

export interface SocialLogin {
  google?: SocialLoginProvider;
  facebook?: SocialLoginProvider;
}

export interface Integrations {
  googleMaps?: GoogleMaps;
  cloudinary?: Cloudinary;
  socialLogin?: SocialLogin;
}

export interface AppSettings {
  _id?: string;
  general?: General;
  business?: Business;
  features?: Features;
  security?: Security;
  uploads?: Uploads;
  notifications?: Notifications;
  payments?: PaymentsSettings;
  analytics?: AnalyticsSettings;
  integrations?: Integrations;
  createdAt?: Date;
  updatedAt?: Date;
}
