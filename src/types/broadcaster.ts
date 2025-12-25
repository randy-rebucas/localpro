/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/admin/types-broadcaster' instead.
 */
export * from '@/features/admin/types-broadcaster';
export type BroadcasterTypeFrontend = 'info' | 'success' | 'warning' | 'error' | 'promotion';
export type BroadcasterTypeBackend = 'announcement' | 'promotion' | 'news' | 'update' | 'event' | 'general';
export type BroadcasterCategory = 'system' | 'marketing' | 'feature' | 'maintenance' | 'security' | 'other';
export type BroadcasterStatus = 'draft' | 'active' | 'inactive' | 'archived' | 'published' | 'scheduled';
export type BroadcasterPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TargetAudience = 'all' | 'providers' | 'clients' | 'agencies' | 'premium' | 'verified' | 'specific_roles';
export type TargetRole = 'admin' | 'provider' | 'client' | 'agency_admin' | 'agency_owner' | 'instructor' | 'supplier' | 'advertiser';

export interface BroadcastImage {
  url: string;
  publicId?: string;
  thumbnail?: string;
  alt?: string;
}

export interface BroadcastVideo {
  url?: string;
  publicId?: string;
  thumbnail?: string;
}

export interface BroadcastLocation {
  city?: string;
  state?: string;
  country?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface BroadcastLink {
  url: string;
  text?: string;
  openInNewTab?: boolean;
}

export interface BroadcastSchedule {
  startDate?: string;
  endDate?: string;
  timeSlots?: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
}

// Backend response structure
export interface Broadcaster {
  _id: string;
  title: string;
  message?: string;
  description?: string;
  content?: string;
  type: BroadcasterTypeBackend;
  category?: BroadcasterCategory;
  priority: BroadcasterPriority;
  status: BroadcasterStatus;
  startDate?: string;
  endDate?: string;
  schedule?: BroadcastSchedule;
  targetAudience: TargetAudience;
  targetRoles?: TargetRole[];
  actionUrl?: string;
  actionText?: string;
  link?: BroadcastLink;
  images?: BroadcastImage[];
  imageUrl?: string; // Legacy support
  video?: BroadcastVideo;
  location?: BroadcastLocation;
  isSticky: boolean;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  views?: number;
  clicks?: number;
}

export interface BroadcasterStats {
  totalBroadcasts: number;
  activeBroadcasts: number;
  totalViews: number;
  totalClicks: number;
  broadcastsByType: Array<{ type: string; count: number }>;
  broadcastsByPriority: Array<{ priority: string; count: number }>;
}

