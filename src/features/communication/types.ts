export type ConversationType = "booking" | "job_application" | "support" | "general" | "agency";
export type ConversationStatus = "active" | "resolved" | "closed" | "archived";
export type Priority = "low" | "medium" | "high" | "urgent";
export type ParticipantRole = "client" | "provider" | "admin" | "support";
export type MessageType = "text" | "image" | "file" | "system" | "booking_update" | "payment_update";
export type NotificationType =
  // Bookings
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_completed"
  | "booking_in_progress"
  | "booking_confirmation_needed"
  | "booking_pending_soon"
  | "booking_overdue_completion"
  | "booking_overdue_admin_alert"
  // Jobs
  | "job_application"
  | "application_status_update"
  | "job_posted"
  | "job_digest"
  | "job_application_followup"
  // Messages
  | "message_received"
  | "message_moderation_flag"
  | "message_policy_warning"
  // Payments
  | "payment_received"
  | "payment_failed"
  // Subscriptions
  | "subscription_renewal"
  | "subscription_cancelled"
  | "subscription_dunning_reminder"
  | "subscription_expiring_soon"
  // Referrals
  | "referral_reward"
  | "referral_tier_upgraded"
  | "referral_nudge"
  // Academy
  | "course_enrollment"
  | "academy_not_started"
  | "academy_progress_stalled"
  | "academy_certificate_pending"
  // Orders
  | "order_confirmation"
  | "order_payment_pending"
  | "order_sla_alert"
  | "order_delivery_confirmation"
  | "order_delivery_late_alert"
  | "order_auto_delivered"
  | "supplies_reorder_reminder"
  // Rentals
  | "rental_due_soon"
  | "rental_overdue"
  // Finance
  | "loan_repayment_due"
  | "loan_repayment_overdue"
  | "salary_advance_due"
  | "salary_advance_overdue"
  // Escrow
  | "escrow_dispute_unresolved"
  | "escrow_dispute_evidence_needed"
  // Support
  | "livechat_sla_alert"
  // System
  | "system_announcement"
  // Security
  | "security_alert"
  | "login_alert"
  // Marketing
  | "marketing_reengagement"
  | "marketing_weekly_digest"
  // Onboarding
  | "welcome_followup_day2"
  | "welcome_followup_day7"
  | "provider_activation_nudge";

export interface Participant {
  user?: string;
  role?: ParticipantRole;
  joinedAt?: Date;
  lastReadAt?: Date;
}

export interface Context {
  bookingId?: string;
  jobId?: string;
  agencyId?: string;
  orderId?: string;
}

export interface LastMessage {
  content?: string;
  sender?: string;
  timestamp?: Date;
}

export interface Conversation {
  _id?: string;
  participants?: Participant[];
  type?: ConversationType;
  subject: string;
  context?: Context;
  status?: ConversationStatus;
  priority?: Priority;
  tags?: string[];
  lastMessage?: LastMessage;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Attachment {
  filename?: string;
  url?: string;
  publicId?: string;
  mimeType?: string;
  size?: number;
}

export interface MessageMetadata {
  isEdited?: boolean;
  editedAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
  replyTo?: string;
}

export interface ReadBy {
  user?: string;
  readAt?: Date;
}

export interface Reaction {
  user?: string;
  emoji?: string;
  timestamp?: Date;
}

export interface Message {
  _id?: string;
  conversation: string;
  sender: string;
  content: string;
  type?: MessageType;
  attachments?: Attachment[];
  metadata?: MessageMetadata;
  readBy?: ReadBy[];
  reactions?: Reaction[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationChannels {
  inApp?: boolean;
  email?: boolean;
  sms?: boolean;
  push?: boolean;
}

export interface Notification {
  _id?: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead?: boolean;
  readAt?: Date;
  priority?: Priority;
  channels?: NotificationChannels;
  scheduledFor?: Date;
  sentAt?: Date;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
