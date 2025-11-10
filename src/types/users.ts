export type UserRole = "client" | "provider" | "admin" | "supplier" | "instructor" | "agency_owner" | "agency_admin";
export type BusinessType = "individual" | "small_business" | "enterprise" | "franchise";
export type BackgroundCheckStatus = "pending" | "approved" | "rejected" | "not_required";
export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export type AgencyRole = "owner" | "admin" | "manager" | "supervisor" | "provider";
export type AgencyStatus = "active" | "inactive" | "suspended" | "pending";
export type ReferralSource = "email" | "sms" | "social_media" | "direct_link" | "qr_code" | "app_share";
export type ReferralTier = "bronze" | "silver" | "gold" | "platinum";
export type UserStatus = "active" | "inactive" | "suspended" | "pending_verification" | "banned";
export type BadgeType = "verified_provider" | "top_rated" | "fast_response" | "reliable" | "expert" | "newcomer";

export interface Avatar {
  url?: string;
  publicId?: string;
  thumbnail?: string;
}

export interface AddressCoordinates {
  lat?: number;
  lng?: number;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  coordinates?: AddressCoordinates;
}

export interface CertificationDocument {
  url?: string;
  publicId?: string;
  filename?: string;
}

export interface Certification {
  name?: string;
  issuer?: string;
  issueDate?: Date;
  expiryDate?: Date;
  document?: CertificationDocument;
}

export interface InsuranceDocument {
  url?: string;
  publicId?: string;
  filename?: string;
}

export interface Insurance {
  hasInsurance?: boolean;
  provider?: string;
  policyNumber?: string;
  coverageAmount?: number;
  expiryDate?: Date;
  document?: InsuranceDocument;
}

export interface BackgroundCheckDocument {
  url?: string;
  publicId?: string;
  filename?: string;
}

export interface BackgroundCheck {
  status?: BackgroundCheckStatus;
  completedAt?: Date;
  document?: BackgroundCheckDocument;
}

export interface PortfolioImage {
  url?: string;
  publicId?: string;
  thumbnail?: string;
}

export interface PortfolioItem {
  title?: string;
  description?: string;
  images?: PortfolioImage[];
  category?: string;
  completedAt?: Date;
}

export interface ScheduleDay {
  day?: DayOfWeek;
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
}

export interface Availability {
  schedule?: ScheduleDay[];
  timezone?: string;
  emergencyService?: boolean;
}

export interface Profile {
  avatar?: Avatar;
  bio?: string;
  address?: Address;
  skills?: string[];
  experience?: number;
  rating?: number;
  totalReviews?: number;
  businessName?: string;
  businessType?: BusinessType;
  yearsInBusiness?: number;
  serviceAreas?: string[];
  specialties?: string[];
  certifications?: Certification[];
  insurance?: Insurance;
  backgroundCheck?: BackgroundCheck;
  portfolio?: PortfolioItem[];
  availability?: Availability;
}

export interface Notifications {
  sms?: boolean;
  email?: boolean;
  push?: boolean;
}

export interface Preferences {
  notifications?: Notifications;
  language?: string;
}

export interface Wallet {
  balance?: number;
  currency?: string;
}

export interface Agency {
  agencyId?: string;
  role?: AgencyRole;
  joinedAt?: Date;
  status?: AgencyStatus;
  commissionRate?: number;
}

export interface ReferralStats {
  totalReferrals?: number;
  successfulReferrals?: number;
  totalRewardsEarned?: number;
  totalRewardsPaid?: number;
  lastReferralAt?: Date;
  referralTier?: ReferralTier;
}

export interface ReferralPreferences {
  autoShare?: boolean;
  shareOnSocial?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
}

export interface Referral {
  referralCode?: string;
  referredBy?: string;
  referralSource?: ReferralSource;
  referralStats?: ReferralStats;
  referralPreferences?: ReferralPreferences;
}

export interface ResponseTime {
  average?: number;
  totalResponses?: number;
}

export interface Note {
  note?: string;
  addedBy?: string;
  addedAt?: Date;
}

export interface DeviceInfo {
  deviceType?: string;
  userAgent?: string;
  lastUsed?: Date;
}

export interface Activity {
  lastActiveAt?: Date;
  totalSessions?: number;
  averageSessionDuration?: number;
  preferredLoginTime?: string;
  deviceInfo?: DeviceInfo[];
}

export interface Verification {
  phoneVerified?: boolean;
  emailVerified?: boolean;
  identityVerified?: boolean;
  businessVerified?: boolean;
  addressVerified?: boolean;
  bankAccountVerified?: boolean;
  verifiedAt?: Date;
}

export interface UserBadge {
  type?: BadgeType;
  earnedAt?: Date;
  description?: string;
}

export interface User {
  _id?: string;
  phoneNumber: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles: string[]; // Multi-role support (array of roles)
  isVerified?: boolean;
  verificationCode?: string;
  lastVerificationSent?: Date;
  profile?: Profile;
  preferences?: Preferences;
  localProPlusSubscription?: string;
  wallet?: Wallet;
  agency?: Agency;
  trustScore?: number;
  verification?: Verification;
  badges?: UserBadge[];
  responseTime?: ResponseTime;
  completionRate?: number;
  cancellationRate?: number;
  referral?: Referral;
  settings?: string;
  lastLoginAt?: Date;
  lastLoginIP?: string;
  loginCount?: number;
  status?: UserStatus;
  statusReason?: string;
  statusUpdatedAt?: Date;
  statusUpdatedBy?: string;
  deletedAt?: Date;
  deletedBy?: string;
  notes?: Note[];
  tags?: string[];
  activity?: Activity;
  createdAt?: Date;
  updatedAt?: Date;
}
