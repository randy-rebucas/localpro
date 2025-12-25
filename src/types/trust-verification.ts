/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/trust-verification/types' instead.
 */
export * from '@/features/trust-verification/types';

export type VerificationType =
  | "identity"
  | "identity_verification"
  | "business"
  | "address"
  | "bank_account"
  | "insurance"
  | "certification";
export type VerificationStatus = "pending" | "under_review" | "approved" | "rejected" | "expired";
export type DocumentType =
  | "government_id"
  | "passport"
  | "driver_license"
  | "drivers_license"
  | "business_license"
  | "tax_certificate"
  | "insurance_certificate"
  | "bank_statement"
  | "utility_bill"
  | "certification_document"
  | "other";
export type DisputeType = "service_dispute" | "payment_dispute" | "verification_dispute" | "other";
export type DisputeStatus = "open" | "under_review" | "resolved" | "closed";
export type Priority = "low" | "medium" | "high" | "urgent";
export type EvidenceType = "document" | "image" | "video" | "audio" | "other";
export type Outcome =
  | "resolved_in_favor_of_user"
  | "resolved_in_favor_of_other_party"
  | "no_fault"
  | "dismissed";
export type CompensationType = "refund" | "credit" | "service_credit" | "none";
export type BadgeType =
  | "verified_identity"
  | "verified_business"
  | "verified_address"
  | "verified_bank"
  | "top_rated"
  | "reliable"
  | "fast_response"
  | "excellent_service"
  | "trusted_provider";

export interface VerificationDocument {
  type?: DocumentType;
  url: string;
  publicId?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: Date;
  isVerified?: boolean;
}

export interface PersonalInfo {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  ssn?: string;
  phoneNumber?: string;
  email?: string;
}

export interface BusinessAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface BusinessInfo {
  businessName?: string;
  businessType?: string;
  registrationNumber?: string;
  taxId?: string;
  address?: BusinessAddress;
}

export interface AddressCoordinates {
  lat?: number;
  lng?: number;
}

export interface AddressInfo {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  coordinates?: AddressCoordinates;
}

export interface BankInfo {
  accountNumber?: string;
  routingNumber?: string;
  bankName?: string;
  accountType?: string;
}

export interface Review {
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
  rejectionReason?: string;
  score?: number;
}

export interface VerificationRequest {
  _id?: string;
  user: string;
  type: VerificationType;
  status?: VerificationStatus;
  documents?: VerificationDocument[];
  personalInfo?: PersonalInfo;
  businessInfo?: BusinessInfo;
  addressInfo?: AddressInfo;
  bankInfo?: BankInfo;
  review?: Review;
  submittedAt?: Date;
  expiresAt?: Date;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Context {
  bookingId?: string;
  jobId?: string;
  orderId?: string;
  verificationId?: string;
}

export interface Evidence {
  type?: EvidenceType;
  url?: string;
  publicId?: string;
  filename?: string;
  description?: string;
  uploadedAt?: Date;
}

export interface Compensation {
  amount?: number;
  currency?: string;
  type?: CompensationType;
}

export interface Resolution {
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  outcome?: Outcome;
  compensation?: Compensation;
}

export interface Communication {
  sender?: string;
  message?: string;
  timestamp?: Date;
  isInternal?: boolean;
}

export interface Dispute {
  _id?: string;
  user: string;
  type: DisputeType;
  title: string;
  description: string;
  context?: Context;
  status?: DisputeStatus;
  priority?: Priority;
  evidence?: Evidence[];
  resolution?: Resolution;
  communication?: Communication[];
  assignedTo?: string;
  tags?: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ComponentScore {
  score?: number;
  weight?: number;
  lastUpdated?: Date;
}

export interface VerificationStatusDetails {
  identityVerified?: boolean;
  businessVerified?: boolean;
  addressVerified?: boolean;
  bankVerified?: boolean;
}

export interface ActivityMetrics {
  totalBookings?: number;
  completedBookings?: number;
  cancelledBookings?: number;
  averageRating?: number;
  totalReviews?: number;
}

export interface FinancialMetrics {
  totalTransactions?: number;
  totalAmount?: number;
  paymentSuccessRate?: number;
  chargebackRate?: number;
}

export interface ComplianceMetrics {
  disputesFiled?: number;
  disputesResolved?: number;
  policyViolations?: number;
  accountAge?: number;
}

export interface Factors {
  verificationStatus?: VerificationStatusDetails;
  activityMetrics?: ActivityMetrics;
  financialMetrics?: FinancialMetrics;
  complianceMetrics?: ComplianceMetrics;
}

export interface Badge {
  type?: BadgeType;
  earnedAt?: Date;
  description?: string;
}

export interface ScoreHistory {
  score?: number;
  reason?: string;
  timestamp?: Date;
}

export interface TrustScore {
  _id?: string;
  user: string;
  overallScore?: number;
  components?: {
    identity?: ComponentScore;
    business?: ComponentScore;
    address?: ComponentScore;
    bank?: ComponentScore;
    behavior?: ComponentScore;
  };
  factors?: Factors;
  badges?: Badge[];
  lastCalculated?: Date;
  history?: ScoreHistory[];
  createdAt?: Date;
  updatedAt?: Date;
}
