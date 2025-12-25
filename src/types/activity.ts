/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/activity/types' instead.
 */
export * from '@/features/activity/types';

export type ActivityType =
  | "user_login"
  | "user_logout"
  | "user_register"
  | "profile_update"
  | "avatar_upload"
  | "password_change"
  | "email_verification"
  | "phone_verification"
  | "service_created"
  | "service_updated"
  | "service_deleted"
  | "service_published"
  | "service_viewed"
  | "service_favorited"
  | "service_shared"
  | "booking_created"
  | "booking_accepted"
  | "booking_rejected"
  | "booking_completed"
  | "booking_cancelled"
  | "booking_rescheduled"
  | "review_created"
  | "review_updated"
  | "review_deleted"
  | "job_created"
  | "job_updated"
  | "job_deleted"
  | "job_published"
  | "job_closed"
  | "job_applied"
  | "job_application_withdrawn"
  | "job_application_approved"
  | "job_application_rejected"
  | "job_application_shortlisted"
  | "course_created"
  | "course_updated"
  | "course_deleted"
  | "course_published"
  | "course_enrolled"
  | "course_completed"
  | "course_progress_updated"
  | "course_review_created"
  | "certificate_earned"
  | "payment_made"
  | "payment_received"
  | "payment_failed"
  | "payment_refunded"
  | "withdrawal_requested"
  | "withdrawal_approved"
  | "withdrawal_rejected"
  | "invoice_created"
  | "invoice_paid"
  | "invoice_overdue"
  | "message_sent"
  | "message_received"
  | "conversation_started"
  | "notification_sent"
  | "notification_read"
  | "email_sent"
  | "agency_joined"
  | "agency_left"
  | "agency_created"
  | "agency_updated"
  | "provider_added"
  | "provider_removed"
  | "provider_status_updated"
  | "referral_sent"
  | "referral_accepted"
  | "referral_completed"
  | "referral_reward_earned"
  | "referral_invitation_sent"
  | "verification_requested"
  | "verification_approved"
  | "verification_rejected"
  | "document_uploaded"
  | "document_verified"
  | "badge_earned"
  | "supply_created"
  | "supply_ordered"
  | "supply_delivered"
  | "supply_reviewed"
  | "rental_created"
  | "rental_booked"
  | "rental_returned"
  | "rental_reviewed"
  | "ad_created"
  | "ad_updated"
  | "ad_published"
  | "ad_clicked"
  | "ad_promoted"
  | "settings_updated"
  | "preferences_changed"
  | "subscription_created"
  | "subscription_cancelled"
  | "subscription_renewed"
  | "connection_made"
  | "connection_removed"
  | "follow_started"
  | "follow_stopped"
  | "content_liked"
  | "content_shared"
  | "content_commented"
  | "search_performed"
  | "filter_applied"
  | "export_requested"
  | "report_generated";

export type ActivityCategory =
  | "authentication"
  | "profile"
  | "marketplace"
  | "job_board"
  | "academy"
  | "financial"
  | "communication"
  | "agency"
  | "referral"
  | "verification"
  | "supplies"
  | "rentals"
  | "advertising"
  | "system"
  | "social"
  | "other";

export type TargetEntityType =
  | "user"
  | "service"
  | "job"
  | "course"
  | "booking"
  | "application"
  | "review"
  | "payment"
  | "agency"
  | "referral"
  | "verification"
  | "supply"
  | "rental"
  | "ad"
  | "message"
  | "notification"
  | "document";

export type Visibility = "public" | "private" | "connections" | "followers";
export type Impact = "low" | "medium" | "high" | "critical";
export type DeviceType = "mobile" | "tablet" | "desktop" | "unknown";
export type InteractionType = "view" | "like" | "share" | "comment" | "bookmark";
export type LocationType = "Point";

export interface TargetEntity {
  type?: TargetEntityType;
  id?: string;
  name?: string;
  url?: string;
}

export interface RelatedEntity {
  type?: TargetEntityType;
  id?: string;
  name?: string;
  role?: string;
}

export interface Coordinates {
  lat?: number;
  lng?: number;
}

export interface ActivityLocation {
  type?: LocationType;
  coordinates?: number[];
  address?: string;
  city?: string;
  country?: string;
}

export interface ActivityMetadata {
  ipAddress?: string;
  userAgent?: string;
  device?: DeviceType;
  browser?: string;
  os?: string;
  appVersion?: string;
  sessionId?: string;
  requestId?: string;
}

export interface ActivityAnalytics {
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
}

export interface ActivityInteraction {
  user: string;
  type: InteractionType;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

export interface Activity {
  _id?: string;
  user: string;
  type: ActivityType;
  category: ActivityCategory;
  action: string;
  description: string;
  details?: Record<string, unknown>;
  targetEntity?: TargetEntity;
  relatedEntities?: RelatedEntity[];
  location?: ActivityLocation;
  metadata?: ActivityMetadata;
  visibility?: Visibility;
  isVisible?: boolean;
  isDeleted?: boolean;
  deletedAt?: Date;
  tags?: string[];
  impact?: Impact;
  points?: number;
  analytics?: ActivityAnalytics;
  interactions?: ActivityInteraction[];
  createdAt?: Date;
  updatedAt?: Date;
}
