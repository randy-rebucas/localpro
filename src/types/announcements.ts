/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/announcements/types' instead.
 */
export * from '@/features/announcements/types';

export type AnnouncementType =
  | "system"
  | "maintenance"
  | "feature"
  | "security"
  | "promotion"
  | "policy"
  | "event"
  | "emergency"
  | "update"
  | "general";

export type Priority = "low" | "medium" | "high" | "urgent";
export type AnnouncementStatus = "draft" | "scheduled" | "published" | "archived";
export type TargetAudience = "all" | "providers" | "clients" | "agencies" | "premium" | "verified" | "specific_roles";
export type TargetRole =
  | "admin"
  | "provider"
  | "client"
  | "agency_admin"
  | "agency_owner"
  | "instructor"
  | "supplier"
  | "advertiser";
export type AttachmentType = "image" | "document" | "video" | "audio";

export interface Attachment {
  filename?: string;
  url?: string;
  type?: AttachmentType;
  size?: number;
}

export interface Acknowledgment {
  user?: string;
  // Date from API will be a string (ISO8601), Date when used internally
  acknowledgedAt?: Date | string;
}

export interface CommentLike {
  user?: string;
}

export interface CommentReply {
  user?: string;
  userName?: string;
  content?: string;
  // Dates from API will be strings (ISO8601), Date when used internally
  createdAt?: Date | string;
  isEdited?: boolean;
  editedAt?: Date | string;
  likes?: CommentLike[];
}

export interface Comment {
  user?: string;
  userName?: string;
  content?: string;
  // Dates from API will be strings (ISO8601), Date when used internally
  createdAt?: Date | string;
  isEdited?: boolean;
  editedAt?: Date | string;
  likes?: CommentLike[];
  replies?: CommentReply[];
}

export interface Analytics {
  totalViews?: number;
  uniqueViews?: number;
  totalAcknowledged?: number;
  totalComments?: number;
  engagementRate?: number;
}

export interface Metadata {
  lastModifiedBy?: string;
  // Dates from API will be strings (ISO8601), Date when used internally
  lastModifiedAt?: Date | string;
  version?: number;
  isDeleted?: boolean;
  deletedAt?: Date | string;
  deletedBy?: string;
}

export interface Announcement {
  _id?: string;
  title: string;
  content: string;
  summary: string;
  type?: AnnouncementType;
  priority?: Priority;
  status?: AnnouncementStatus;
  targetAudience?: TargetAudience;
  targetRoles?: TargetRole[];
  targetLocations?: string[];
  targetCategories?: string[];
  // Dates from API will be strings (ISO8601), Date when used internally
  scheduledAt?: Date | string;
  publishedAt?: Date | string;
  expiresAt?: Date | string;
  isSticky?: boolean;
  allowComments?: boolean;
  requireAcknowledgment?: boolean;
  attachments?: Attachment[];
  tags?: string[];
  author: string;
  authorName: string;
  authorRole: string;
  views?: number;
  acknowledgments?: Acknowledgment[];
  comments?: Comment[];
  analytics?: Analytics;
  metadata?: Metadata;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
