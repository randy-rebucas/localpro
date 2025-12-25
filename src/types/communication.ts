/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/communication/types' instead.
 */
export * from '@/features/communication/types';
import type { ConversationType } from '@/features/communication/types';
export type ConversationStatus = "active" | "resolved" | "closed" | "archived";
export type Priority = "low" | "medium" | "high" | "urgent";
export type ParticipantRole = "client" | "provider" | "admin" | "support";
export type MessageType = "text" | "image" | "file" | "system" | "booking_update" | "payment_update";
export type NotificationType =
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_completed"
  | "job_application"
  | "application_status_update"
  | "job_posted"
  | "message_received"
  | "payment_received"
  | "payment_failed"
  | "referral_reward"
  | "course_enrollment"
  | "order_confirmation"
  | "subscription_renewal"
  | "subscription_cancelled"
  | "system_announcement";

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
