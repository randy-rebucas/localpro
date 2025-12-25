export type ProviderStatus = "pending" | "active" | "suspended" | "inactive" | "rejected";
export type ProviderType = "individual" | "business" | "agency";
export type ServiceCategory =
  | "cleaning"
  | "plumbing"
  | "electrical"
  | "moving"
  | "landscaping"
  | "pest_control"
  | "handyman"
  | "painting"
  | "carpentry"
  | "other";
export type BackgroundCheckStatus = "pending" | "passed" | "failed" | "not_required";
export type AccountType = "checking" | "savings";
export type PaymentMethodType = "bank_transfer" | "paypal" | "paymaya" | "check";
export type SubscriptionPlan = "basic" | "professional" | "premium" | "enterprise";
export type BillingCycle = "monthly" | "yearly";
export type ProfileVisibility = "public" | "private" | "verified_only";
export type PreferredContactMethod = "phone" | "email" | "sms" | "app";

export interface BusinessAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
}

export interface BusinessInfo {
  businessName?: string;
  businessType?: string;
  businessRegistration?: string;
  taxId?: string;
  businessAddress?: BusinessAddress;
  businessPhone?: string;
  businessEmail?: string;
  website?: string;
  businessDescription?: string;
  yearEstablished?: number;
  numberOfEmployees?: number;
}

export interface Certification {
  name?: string;
  issuer?: string;
  dateIssued?: Date;
  expiryDate?: Date;
  certificateNumber?: string;
}

export interface ServiceArea {
  city?: string;
  state?: string;
  radius?: number;
}

export interface Specialty {
  category?: ServiceCategory;
  subcategories?: string[];
  experience?: number;
  certifications?: Certification[];
  skills?: string[];
  hourlyRate?: number;
  serviceAreas?: ServiceArea[];
}

export interface AvailabilityDay {
  start?: string;
  end?: string;
  available?: boolean;
}

export interface ProfessionalInfo {
  specialties?: Specialty[];
  languages?: string[];
  availability?: Record<string, AvailabilityDay>;
  emergencyServices?: boolean;
  travelDistance?: number;
  minimumJobValue?: number;
  maximumJobValue?: number;
}

export interface BackgroundCheck {
  status?: BackgroundCheckStatus;
  dateCompleted?: Date;
  reportId?: string;
}

export interface InsuranceDocument {
  url?: string;
  publicId?: string;
  filename?: string;
}

export interface Insurance {
  hasInsurance?: boolean;
  insuranceProvider?: string;
  policyNumber?: string;
  coverageAmount?: number;
  expiryDate?: Date;
  documents?: InsuranceDocument[];
}

export interface License {
  type?: string;
  number?: string;
  issuingAuthority?: string;
  issueDate?: Date;
  expiryDate?: Date;
  documents?: InsuranceDocument[];
}

export interface Reference {
  name?: string;
  relationship?: string;
  phone?: string;
  email?: string;
  company?: string;
  verified?: boolean;
}

export interface PortfolioImage {
  url?: string;
  publicId?: string;
  thumbnail?: string;
}

export interface BeforeAfter {
  before?: string;
  after?: string;
  description?: string;
}

export interface Portfolio {
  images?: PortfolioImage[];
  videos?: string[];
  descriptions?: string[];
  beforeAfter?: BeforeAfter[];
}

export interface Verification {
  isVerified?: boolean;
  identityVerified?: boolean;
  businessVerified?: boolean;
  backgroundCheck?: BackgroundCheck;
  insurance?: Insurance;
  licenses?: License[];
  references?: Reference[];
  portfolio?: Portfolio;
}

export interface BankAccount {
  accountHolder?: string;
  accountNumber?: string;
  routingNumber?: string;
  bankName?: string;
  accountType?: AccountType;
}

export interface TaxInfo {
  ssn?: string;
  ein?: string;
  taxClassification?: string;
  w9Submitted?: boolean;
}

export interface PaymentMethod {
  type?: PaymentMethodType;
  details?: Record<string, unknown>;
  isDefault?: boolean;
}

export interface FinancialInfo {
  bankAccount?: BankAccount;
  taxInfo?: TaxInfo;
  paymentMethods?: PaymentMethod[];
  commissionRate?: number;
  minimumPayout?: number;
}

export interface Earnings {
  total?: number;
  thisMonth?: number;
  lastMonth?: number;
  pending?: number;
}

export interface Badge {
  name?: string;
  description?: string;
  earnedDate?: Date;
  category?: string;
}

export interface Performance {
  rating?: number;
  totalReviews?: number;
  totalJobs?: number;
  completedJobs?: number;
  cancelledJobs?: number;
  responseTime?: number;
  completionRate?: number;
  repeatCustomerRate?: number;
  earnings?: Earnings;
  badges?: Badge[];
}

export interface NotificationSettings {
  newJobAlerts?: boolean;
  messageNotifications?: boolean;
  paymentNotifications?: boolean;
  reviewNotifications?: boolean;
  marketingEmails?: boolean;
}

export interface JobPreferences {
  preferredJobTypes?: string[];
  avoidJobTypes?: string[];
  preferredTimeSlots?: string[];
  maxJobsPerDay?: number;
  advanceBookingDays?: number;
}

export interface CommunicationPreferences {
  preferredContactMethod?: PreferredContactMethod;
  responseTimeExpectation?: string;
  autoAcceptJobs?: boolean;
}

export interface Preferences {
  notificationSettings?: NotificationSettings;
  jobPreferences?: JobPreferences;
  communicationPreferences?: CommunicationPreferences;
}

export interface Limits {
  maxServices?: number;
  maxBookingsPerMonth?: number;
  prioritySupport?: boolean;
  advancedAnalytics?: boolean;
}

export interface Subscription {
  plan?: SubscriptionPlan;
  features?: string[];
  limits?: Limits;
  billingCycle?: BillingCycle;
  nextBillingDate?: Date;
  autoRenew?: boolean;
}

export interface OnboardingStep {
  step?: string;
  completed?: boolean;
  completedAt?: Date;
  data?: Record<string, unknown>;
}

export interface Onboarding {
  completed?: boolean;
  steps?: OnboardingStep[];
  currentStep?: string;
  progress?: number;
}

export interface Settings {
  profileVisibility?: ProfileVisibility;
  showContactInfo?: boolean;
  showPricing?: boolean;
  showReviews?: boolean;
  allowDirectBooking?: boolean;
  requireApproval?: boolean;
}

export interface Metadata {
  lastActive?: Date;
  profileViews?: number;
  searchRanking?: number;
  featured?: boolean;
  promoted?: boolean;
  tags?: string[];
  notes?: string;
}

export interface ProviderProfile {
  firstName?: string;
  lastName?: string;
  name?: string;
  avatar?: {
    url?: string;
    thumbnail?: string;
    publicId?: string;
  };
}

export interface ProviderRating {
  average?: number;
  count?: number;
}

export interface Provider {
  _id?: string;
  userId: string;
  status?: ProviderStatus;
  providerType: ProviderType;
  profile?: ProviderProfile;
  rating?: ProviderRating;
  businessInfo?: BusinessInfo;
  professionalInfo?: ProfessionalInfo;
  verification?: Verification;
  financialInfo?: FinancialInfo;
  performance?: Performance;
  preferences?: Preferences;
  subscription?: Subscription;
  onboarding?: Onboarding;
  settings?: Settings;
  metadata?: Metadata;
  createdAt?: Date;
  updatedAt?: Date;
}
