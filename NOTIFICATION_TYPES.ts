import type { NotificationType } from "./src/hooks/useNotifications";

export interface NotificationTypeConfig {
  type: NotificationType;
  description: string;
  category?: string;
}

export const NOTIFICATION_TYPES: NotificationTypeConfig[] = [
  // Bookings
  {
    type: "booking_created",
    description: "Booking Created",
    category: "Bookings",
  },
  {
    type: "booking_confirmed",
    description: "Booking Confirmed",
    category: "Bookings",
  },
  {
    type: "booking_cancelled",
    description: "Booking Cancelled",
    category: "Bookings",
  },
  {
    type: "booking_completed",
    description: "Booking Completed",
    category: "Bookings",
  },
  {
    type: "booking_in_progress",
    description: "Booking In Progress",
    category: "Bookings",
  },
  {
    type: "booking_confirmation_needed",
    description: "Booking Confirmation Needed",
    category: "Bookings",
  },
  {
    type: "booking_pending_soon",
    description: "Booking Pending Soon",
    category: "Bookings",
  },
  {
    type: "booking_overdue_completion",
    description: "Booking Overdue Completion",
    category: "Bookings",
  },
  {
    type: "booking_overdue_admin_alert",
    description: "Booking Overdue Admin Alert",
    category: "Bookings",
  },
  // Jobs
  {
    type: "job_application",
    description: "Job Application",
    category: "Jobs",
  },
  {
    type: "application_status_update",
    description: "Application Status Update",
    category: "Jobs",
  },
  {
    type: "job_posted",
    description: "Job Posted",
    category: "Jobs",
  },
  {
    type: "job_digest",
    description: "Job Digest",
    category: "Jobs",
  },
  {
    type: "job_application_followup",
    description: "Job Application Follow-up",
    category: "Jobs",
  },
  // Messages
  {
    type: "message_received",
    description: "Message Received",
    category: "Messages",
  },
  {
    type: "message_moderation_flag",
    description: "Message Moderation Flag",
    category: "Messages",
  },
  {
    type: "message_policy_warning",
    description: "Message Policy Warning",
    category: "Messages",
  },
  // Payments
  {
    type: "payment_received",
    description: "Payment Received",
    category: "Payments",
  },
  {
    type: "payment_failed",
    description: "Payment Failed",
    category: "Payments",
  },
  // Subscriptions
  {
    type: "subscription_renewal",
    description: "Subscription Renewal",
    category: "Subscriptions",
  },
  {
    type: "subscription_cancelled",
    description: "Subscription Cancelled",
    category: "Subscriptions",
  },
  {
    type: "subscription_dunning_reminder",
    description: "Subscription Dunning Reminder",
    category: "Subscriptions",
  },
  {
    type: "subscription_expiring_soon",
    description: "Subscription Expiring Soon",
    category: "Subscriptions",
  },
  // Referrals
  {
    type: "referral_reward",
    description: "Referral Reward",
    category: "Referrals",
  },
  {
    type: "referral_tier_upgraded",
    description: "Referral Tier Upgraded",
    category: "Referrals",
  },
  {
    type: "referral_nudge",
    description: "Referral Nudge",
    category: "Referrals",
  },
  // Academy
  {
    type: "course_enrollment",
    description: "Course Enrollment",
    category: "Academy",
  },
  {
    type: "academy_not_started",
    description: "Academy Not Started",
    category: "Academy",
  },
  {
    type: "academy_progress_stalled",
    description: "Academy Progress Stalled",
    category: "Academy",
  },
  {
    type: "academy_certificate_pending",
    description: "Academy Certificate Pending",
    category: "Academy",
  },
  // Orders
  {
    type: "order_confirmation",
    description: "Order Confirmation",
    category: "Orders",
  },
  {
    type: "order_payment_pending",
    description: "Order Payment Pending",
    category: "Orders",
  },
  {
    type: "order_sla_alert",
    description: "Order SLA Alert",
    category: "Orders",
  },
  {
    type: "order_delivery_confirmation",
    description: "Order Delivery Confirmation",
    category: "Orders",
  },
  {
    type: "order_delivery_late_alert",
    description: "Order Delivery Late Alert",
    category: "Orders",
  },
  {
    type: "order_auto_delivered",
    description: "Order Auto Delivered",
    category: "Orders",
  },
  {
    type: "supplies_reorder_reminder",
    description: "Supplies Reorder Reminder",
    category: "Orders",
  },
  // Rentals
  {
    type: "rental_due_soon",
    description: "Rental Due Soon",
    category: "Rentals",
  },
  {
    type: "rental_overdue",
    description: "Rental Overdue",
    category: "Rentals",
  },
  // Finance
  {
    type: "loan_repayment_due",
    description: "Loan Repayment Due",
    category: "Finance",
  },
  {
    type: "loan_repayment_overdue",
    description: "Loan Repayment Overdue",
    category: "Finance",
  },
  {
    type: "salary_advance_due",
    description: "Salary Advance Due",
    category: "Finance",
  },
  {
    type: "salary_advance_overdue",
    description: "Salary Advance Overdue",
    category: "Finance",
  },
  // Escrow
  {
    type: "escrow_dispute_unresolved",
    description: "Escrow Dispute Unresolved",
    category: "Escrow",
  },
  {
    type: "escrow_dispute_evidence_needed",
    description: "Escrow Dispute Evidence Needed",
    category: "Escrow",
  },
  // Support
  {
    type: "livechat_sla_alert",
    description: "Live Chat SLA Alert",
    category: "Support",
  },
  // System
  {
    type: "system_announcement",
    description: "System Announcement",
    category: "System",
  },
  // Security
  {
    type: "security_alert",
    description: "Security Alert",
    category: "Security",
  },
  {
    type: "login_alert",
    description: "Login Alert",
    category: "Security",
  },
  // Marketing
  {
    type: "marketing_reengagement",
    description: "Marketing Re-engagement",
    category: "Marketing",
  },
  {
    type: "marketing_weekly_digest",
    description: "Marketing Weekly Digest",
    category: "Marketing",
  },
  // Onboarding
  {
    type: "welcome_followup_day2",
    description: "Welcome Follow-up Day 2",
    category: "Onboarding",
  },
  {
    type: "welcome_followup_day7",
    description: "Welcome Follow-up Day 7",
    category: "Onboarding",
  },
  {
    type: "provider_activation_nudge",
    description: "Provider Activation Nudge",
    category: "Onboarding",
  },
];

/**
 * Get notification type configuration by type
 * @param type - The notification type
 * @returns The notification type configuration or undefined if not found
 */
export function getNotificationTypeConfig(
  type: NotificationType
): NotificationTypeConfig | undefined {
  return NOTIFICATION_TYPES.find((config) => config.type === type);
}

