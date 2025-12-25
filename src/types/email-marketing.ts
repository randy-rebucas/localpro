/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/admin/types-email-marketing' instead.
 */
export * from '@/features/admin/types-email-marketing';

export type CampaignStatus =
  | "draft" 
  | "scheduled" 
  | "sending" 
  | "paused" 
  | "sent" 
  | "cancelled";

export type CampaignType = 
  | "newsletter" 
  | "promotional" 
  | "transactional" 
  | "announcement" 
  | "welcome" 
  | "retention" 
  | "reengagement";

export type SubscriberStatus = 
  | "pending" 
  | "confirmed" 
  | "unsubscribed" 
  | "bounced" 
  | "complained";

export type TargetAudience = 
  | "all" 
  | "providers" 
  | "clients" 
  | "agencies" 
  | "premium" 
  | "verified" 
  | "inactive"
  | "custom";

export interface EmailCampaign {
  _id?: string;
  id?: string;
  name: string;
  subject: string;
  preheader?: string;
  content: string;
  htmlContent?: string;
  type: CampaignType;
  status: CampaignStatus;
  targetAudience: TargetAudience;
  targetSegments?: string[];
  customQuery?: Record<string, unknown>;
  scheduledAt?: Date | string;
  sentAt?: Date | string;
  completedAt?: Date | string;
  pausedAt?: Date | string;
  cancelledAt?: Date | string;
  replyTo?: string;
  fromName?: string;
  fromEmail?: string;
  tags?: string[];
  metadata?: {
    templateId?: string;
    abTestId?: string;
    version?: number;
  };
  analytics?: CampaignAnalytics;
  author?: string | {
    _id: string;
    name?: string;
    email?: string;
  };
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CampaignAnalytics {
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  uniqueOpens: number;
  clicked: number;
  uniqueClicks: number;
  bounced: number;
  complained: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  deliveryRate: number;
}

export interface Subscriber {
  _id?: string;
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  status: SubscriberStatus;
  source?: string;
  tags?: string[];
  preferences?: SubscriberPreferences;
  customFields?: Record<string, unknown>;
  user?: string | {
    _id: string;
    name?: string;
    email?: string;
  };
  confirmedAt?: Date | string;
  unsubscribedAt?: Date | string;
  lastEmailSentAt?: Date | string;
  lastEmailOpenedAt?: Date | string;
  lastEmailClickedAt?: Date | string;
  emailsReceived?: number;
  emailsOpened?: number;
  emailsClicked?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface SubscriberPreferences {
  newsletter?: boolean;
  promotional?: boolean;
  transactional?: boolean;
  announcements?: boolean;
  frequency?: "daily" | "weekly" | "monthly" | "immediate";
}

export interface SubscriberStats {
  total: number;
  confirmed: number;
  pending: number;
  unsubscribed: number;
  bounced: number;
  complained: number;
  growthRate: number;
  activeRate: number;
}

export interface EmailAnalytics {
  totalCampaigns: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalUnsubscribed: number;
  averageOpenRate: number;
  averageClickRate: number;
  averageBounceRate: number;
  averageUnsubscribeRate: number;
}

export interface TopCampaign {
  _id: string;
  name: string;
  subject: string;
  type: CampaignType;
  sentAt: Date | string;
  openRate: number;
  clickRate: number;
  totalRecipients: number;
}

export interface DailyStats {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
}

export interface AudienceEstimate {
  count: number;
  breakdown?: {
    providers?: number;
    clients?: number;
    agencies?: number;
    premium?: number;
    verified?: number;
  };
}

// Payload Types
export interface CreateCampaignPayload {
  name: string;
  subject: string;
  preheader?: string;
  content: string;
  htmlContent?: string;
  type: CampaignType;
  targetAudience: TargetAudience;
  targetSegments?: string[];
  customQuery?: Record<string, unknown>;
  scheduledAt?: Date | string;
  replyTo?: string;
  fromName?: string;
  fromEmail?: string;
  tags?: string[];
}

export interface UpdateCampaignPayload {
  name?: string;
  subject?: string;
  preheader?: string;
  content?: string;
  htmlContent?: string;
  type?: CampaignType;
  targetAudience?: TargetAudience;
  targetSegments?: string[];
  customQuery?: Record<string, unknown>;
  scheduledAt?: Date | string;
  replyTo?: string;
  fromName?: string;
  fromEmail?: string;
  tags?: string[];
}

export interface SubscribePayload {
  email: string;
  firstName?: string;
  lastName?: string;
  source?: string;
  tags?: string[];
  preferences?: SubscriberPreferences;
}

export interface UpdateSubscriberPayload {
  firstName?: string;
  lastName?: string;
  status?: SubscriberStatus;
  tags?: string[];
  preferences?: SubscriberPreferences;
  customFields?: Record<string, unknown>;
}

export interface ImportSubscribersPayload {
  subscribers: {
    email: string;
    firstName?: string;
    lastName?: string;
    tags?: string[];
  }[];
  source?: string;
  skipDuplicates?: boolean;
}

export interface TestEmailPayload {
  emails: string[];
}

// Filter/Query Types
export interface CampaignFilters {
  status?: CampaignStatus;
  type?: CampaignType;
  targetAudience?: TargetAudience;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SubscriberFilters {
  status?: SubscriberStatus;
  source?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Response Types
export interface CampaignsResponse {
  success?: boolean;
  data?: {
    campaigns?: EmailCampaign[];
    pagination?: PaginationInfo;
  };
  campaigns?: EmailCampaign[];
  pagination?: PaginationInfo;
}

export interface SubscribersResponse {
  success?: boolean;
  data?: {
    subscribers?: Subscriber[];
    pagination?: PaginationInfo;
  };
  subscribers?: Subscriber[];
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  // Legacy field names
  current?: number;
  pages?: number;
  total?: number;
  limit?: number;
  count?: number;
}

