"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Megaphone,
  Search,
  X,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Filter,
  RefreshCw,
  Eye,
  MessageSquare,
  FileText,
  Calendar,
  User,
  Tag,
  Shield,
  Gift,
  Bell,
  Wrench,
  Star
} from "lucide-react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { Skeleton, ListSkeleton } from "@/components/ui/loading";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

// Announcement Data Entity (from features/announcements/data-entities.md)

export type AnnouncementType =
  | 'system' | 'maintenance' | 'feature' | 'security' | 'promotion'
  | 'policy' | 'event' | 'emergency' | 'update' | 'general';

export type AnnouncementPriority = 'low' | 'medium' | 'high' | 'urgent';

export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export type TargetAudience =
  | 'all' | 'providers' | 'clients' | 'agencies' | 'premium'
  | 'verified' | 'specific_roles';

export type TargetRole =
  | 'admin' | 'provider' | 'client' | 'agency_admin' | 'agency_owner'
  | 'instructor' | 'supplier' | 'advertiser';

export interface AnnouncementAttachment {
  filename: string;
  url: string;
  type: 'image' | 'document' | 'video' | 'audio';
  size: number;
}

export interface AnnouncementAcknowledgment {
  user: string; // ObjectId(User)
  acknowledgedAt: string; // Date ISO8601
}

export interface AnnouncementCommentReply {
  user: string; // ObjectId(User)
  userName: string;
  content: string; // <=500
  createdAt: string; // Date ISO8601
  isEdited?: boolean;
  editedAt?: string;
  likes?: string[]; // Array of UserIds
}

export interface AnnouncementComment {
  user: string; // ObjectId(User)
  userName: string;
  content: string; // <=1000
  createdAt: string; // Date ISO8601
  isEdited?: boolean;
  editedAt?: string;
  likes?: string[]; // Array of UserIds
  replies?: AnnouncementCommentReply[];
}

export interface AnnouncementAnalytics {
  totalViews?: number;
  uniqueViews?: number;
  totalAcknowledged?: number;
  totalComments?: number;
  engagementRate?: number;
}

export interface AnnouncementMetadata {
  lastModifiedBy?: string; // UserId
  lastModifiedAt?: string; // Date ISO8601
  version?: number;
  isDeleted?: boolean;
  deletedAt?: string | null; // Date ISO8601
  deletedBy?: string; // UserId
}

export interface Announcement {
  _id: string;
  id?: string; // Alias for _id
  title: string; // required, <=200
  content: string; // required, <=5000
  summary: string; // required, <=500
  type: AnnouncementType; // default 'general'
  priority: AnnouncementPriority; // default 'medium'
  status: AnnouncementStatus; // default 'draft'
  targetAudience: TargetAudience; // default 'all'
  targetRoles?: TargetRole[];
  targetLocations?: string[];
  targetCategories?: string[];
  scheduledAt?: string | null; // Date ISO8601
  publishedAt?: string | null; // Date ISO8601
  expiresAt?: string | null; // Date ISO8601
  isSticky: boolean; // default false
  allowComments: boolean; // default true
  requireAcknowledgment: boolean; // default false
  attachments?: AnnouncementAttachment[];
  tags?: string[]; // <=50 chars each
  author: string; // ObjectId(User, required)
  authorName: string; // required
  authorRole: string; // required
  views?: number;
  acknowledgments?: AnnouncementAcknowledgment[];
  comments?: AnnouncementComment[];
  analytics?: AnnouncementAnalytics;
  metadata?: AnnouncementMetadata;
  createdAt: string; // Date ISO8601
  updatedAt: string; // Date ISO8601
  // Computed/virtual fields
  isActive?: boolean; // virtual: status==='published' && !expired && !future
  isExpired?: boolean; // virtual: expiresAt <= now
  isScheduled?: boolean; // virtual: status==='scheduled' && scheduledAt>now
  isAcknowledged?: boolean; // computed from acknowledgments array for current user
  canComment?: boolean; // computed: allowComments && isActive
  canAcknowledge?: boolean; // computed: requireAcknowledgment && isActive && !isAcknowledged
}

// Helper function to normalize announcement from API
const normalizeAnnouncement = (announcement: Record<string, unknown>, currentUserId?: string): Announcement => {
  const announcementId = (announcement._id || announcement.id) as string;
  const now = new Date();
  const expiresAt = announcement.expiresAt ? new Date(announcement.expiresAt as string) : null;
  const scheduledAt = announcement.scheduledAt ? new Date(announcement.scheduledAt as string) : null;
  
  // Compute virtual fields
  const isExpired = expiresAt ? expiresAt <= now : false;
  const isScheduled = announcement.status === 'scheduled' && scheduledAt ? scheduledAt > now : false;
  const isActive = announcement.status === 'published' && !isExpired && !isScheduled;
  
  // Check if user has acknowledged
  const acknowledgments = Array.isArray(announcement.acknowledgments) 
    ? announcement.acknowledgments as AnnouncementAcknowledgment[] 
    : [];
  const isAcknowledged = currentUserId && acknowledgments.length > 0
    ? acknowledgments.some((ack: AnnouncementAcknowledgment) => ack.user === currentUserId || ack.user.toString() === currentUserId)
    : false;
  
  // Type-safe field extraction
  const type = (typeof announcement.type === 'string' ? announcement.type : 'general') as AnnouncementType;
  const priority = (typeof announcement.priority === 'string' ? announcement.priority : 'medium') as AnnouncementPriority;
  const status = (typeof announcement.status === 'string' ? announcement.status : 'draft') as AnnouncementStatus;
  const targetAudience = (typeof announcement.targetAudience === 'string' ? announcement.targetAudience : 'all') as TargetAudience;
  const isSticky = typeof announcement.isSticky === 'boolean' ? announcement.isSticky : false;
  const allowComments = typeof announcement.allowComments === 'boolean' ? announcement.allowComments : true;
  const requireAcknowledgment = typeof announcement.requireAcknowledgment === 'boolean' ? announcement.requireAcknowledgment : false;
  
  // Compute derived fields using validated values
  const canComment = allowComments && isActive;
  const canAcknowledge = requireAcknowledgment && isActive && !isAcknowledged;
  const views = typeof announcement.views === 'number' ? announcement.views : 0;
  const tags = Array.isArray(announcement.tags) ? announcement.tags as string[] : [];
  const attachments = Array.isArray(announcement.attachments) ? announcement.attachments as AnnouncementAttachment[] : [];
  const comments = Array.isArray(announcement.comments) ? announcement.comments as AnnouncementComment[] : [];
  const analytics = (announcement.analytics && typeof announcement.analytics === 'object' && !Array.isArray(announcement.analytics))
    ? announcement.analytics as AnnouncementAnalytics
    : {};
  
  // Required string fields
  const title = typeof announcement.title === 'string' ? announcement.title : '';
  const content = typeof announcement.content === 'string' ? announcement.content : '';
  const summary = typeof announcement.summary === 'string' ? announcement.summary : '';
  const author = typeof announcement.author === 'string' ? announcement.author : '';
  const authorName = typeof announcement.authorName === 'string' ? announcement.authorName : '';
  const authorRole = typeof announcement.authorRole === 'string' ? announcement.authorRole : '';
  const createdAt = typeof announcement.createdAt === 'string' ? announcement.createdAt : new Date().toISOString();
  const updatedAt = typeof announcement.updatedAt === 'string' ? announcement.updatedAt : createdAt;
  
  return {
    ...announcement,
    _id: announcementId,
    id: announcementId,
    title,
    content,
    summary,
    author,
    authorName,
    authorRole,
    createdAt,
    updatedAt,
    type,
    priority,
    status,
    targetAudience,
    isSticky,
    allowComments,
    requireAcknowledgment,
    views,
    tags,
    attachments,
    acknowledgments,
    comments,
    analytics,
    // Computed fields
    isActive,
    isExpired,
    isScheduled,
    isAcknowledged,
    canComment,
    canAcknowledge
  };
};

// Helper function to get announcement icon based on type
const getAnnouncementIcon = (type: AnnouncementType) => {
  switch (type) {
    case 'system':
      return <AlertCircle className="w-5 h-5 text-primary" />;
    case 'maintenance':
      return <Wrench className="w-5 h-5 text-orange-600" />;
    case 'feature':
      return <Star className="w-5 h-5 text-purple-600" />;
    case 'security':
      return <Shield className="w-5 h-5 text-red-600" />;
    case 'promotion':
      return <Gift className="w-5 h-5 text-yellow-600" />;
    case 'policy':
      return <FileText className="w-5 h-5 text-primary" />;
    case 'event':
      return <Calendar className="w-5 h-5 text-accent" />;
    case 'emergency':
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    case 'update':
      return <Bell className="w-5 h-5 text-primary" />;
    default:
      return <Megaphone className="w-5 h-5 text-gray-600" />;
  }
};

// Helper function to get announcement styles based on type and priority
const getAnnouncementStyles = (type: AnnouncementType, priority: AnnouncementPriority) => {
  const typeStyles: Record<AnnouncementType, string> = {
    system: "bg-primary/5 border-primary/20",
    maintenance: "bg-orange-50 border-orange-200",
    feature: "bg-purple-50 border-purple-200",
    security: "bg-red-50 border-red-200",
    promotion: "bg-yellow-50 border-yellow-200",
    policy: "bg-primary/5 border-primary/20",
    event: "bg-accent/5 border-accent/20",
    emergency: "bg-red-100 border-red-500 ring-2 ring-red-200",
    update: "bg-primary/5 border-primary/20",
    general: "bg-gray-50 border-gray-200"
  };
  
  const priorityBorder = {
    urgent: "border-l-4 border-red-500",
    high: "border-l-4 border-orange-500",
    medium: "border-l-4 border-yellow-500",
    low: "border-l-4 border-primary"
  };
  
  return `${typeStyles[type]} ${priorityBorder[priority]} rounded-lg`;
};

// Helper function to get priority badge
const getPriorityBadge = (priority: AnnouncementPriority) => {
  switch (priority) {
    case 'urgent':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Urgent</span>;
    case 'high':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">High</span>;
    case 'medium':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Medium</span>;
    case 'low':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">Low</span>;
  }
};

// Helper function to format date
const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};


export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<AnnouncementType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<AnnouncementPriority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      if (!getApiToken()) {
        setLoading(false);
        return;
      }
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.announcements}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }

      const responseData = await response.json();
      // Handle API response structure: { success, data: { announcements: [...], pagination:{...} } }
      const announcementsData = responseData?.data?.announcements || responseData?.announcements || responseData?.data || [];
      
            // Normalize announcements
            const normalizedAnnouncements = announcementsData
              .map((announcement: Record<string, unknown>) => normalizeAnnouncement(announcement))
        .filter((announcement: Announcement) => {
          // Only show active announcements by default (unless filtered)
          return statusFilter === 'all' || announcement.status === statusFilter;
        })
        .sort((a: Announcement, b: Announcement) => {
          // Sort by sticky first, then by priority, then by publishedAt
          if (a.isSticky && !b.isSticky) return -1;
          if (!a.isSticky && b.isSticky) return 1;
          
          const priorityOrder: Record<AnnouncementPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority] || 0;
          const bPriority = priorityOrder[b.priority] || 0;
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }
          
          const aDate = a.publishedAt || a.createdAt;
          const bDate = b.publishedAt || b.createdAt;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        });
      
      setAnnouncements(normalizedAnnouncements);
    } catch (error) {
      logger.error('Error fetching announcements', error instanceof Error ? error : new Error(String(error)));
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  }, []);

  const handleAcknowledge = useCallback(async (id: string) => {
    try {
      if (!getApiToken()) return;
      
      const endpoint = API_ENDPOINTS.announcementsAcknowledge.includes('[id]')
        ? API_ENDPOINTS.announcementsAcknowledge.replace('[id]', id)
        : `${API_ENDPOINTS.announcements}/${id}/acknowledge`;
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'POST' }));
      
      if (response.ok) {
        // Update local state
        setAnnouncements(prev => prev.map(announcement => {
          const announcementId = announcement.id || announcement._id;
          if (announcementId === id) {
            return {
              ...announcement,
              isAcknowledged: true,
              acknowledgments: [...(announcement.acknowledgments || []), {
                user: '', // Will be set by backend
                acknowledgedAt: new Date().toISOString()
              }]
            };
          }
          return announcement;
        }));
      }
    } catch (error) {
      logger.error('Error acknowledging announcement', error instanceof Error ? error : new Error(String(error)), { announcementId: id });
    }
  }, []);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(announcement => {
      const announcementId = announcement.id || announcement._id;
      
      // Search filter
      const matchesSearch = 
        !searchQuery ||
        announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type filter
      const matchesType = typeFilter === 'all' || announcement.type === typeFilter;
      
      // Priority filter
      const matchesPriority = priorityFilter === 'all' || announcement.priority === priorityFilter;
      
      // Dismissed filter
      const notDismissed = !dismissedIds.has(announcementId);
      
      // Show active by default, but respect status filter
      const matchesStatus = statusFilter === 'all' 
        ? (announcement.isActive && !announcement.isExpired)
        : announcement.status === statusFilter;
      
      return matchesSearch && matchesType && matchesPriority && notDismissed && matchesStatus;
    });
  }, [announcements, searchQuery, typeFilter, priorityFilter, statusFilter, dismissedIds]);

  // Get unique types and priorities for filter dropdowns
  const availableTypes = useMemo(() => {
    return Array.from(new Set(announcements.map(a => a.type))).sort();
  }, [announcements]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          className="text-sm text-gray-500 mb-4"
          items={[
            { label: "Marketplace", href: "/marketplace" },
            { label: "Announcements" },
          ]}
        />

        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>

        {/* Announcements List Skeleton */}
        <div className="space-y-4">
          <ListSkeleton count={5} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <Breadcrumbs
        className="text-sm text-gray-500 mb-4"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Announcements" },
        ]}
      />

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Megaphone className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-gray-800">Announcements</h1>
            <span className="text-sm text-gray-500">
              ({filteredAnnouncements.length} of {announcements.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button
              onClick={() => fetchAnnouncements()}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-0 shadow-sm rounded-lg focus:ring-2 focus:ring-ring focus:shadow-md transition-shadow"
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
              <button
                onClick={() => {
                  setTypeFilter('all');
                  setPriorityFilter('all');
                  setStatusFilter('all');
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Type Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as AnnouncementType | 'all')}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  {availableTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as AnnouncementPriority | 'all')}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as AnnouncementStatus | 'all')}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-8">
            <Megaphone className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800 mb-1">No Announcements</h3>
            <p className="text-gray-600">
              {searchQuery || typeFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all'
                ? "No announcements match your filters."
                : "No announcements available."}
            </p>
            {(searchQuery || typeFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                  setPriorityFilter('all');
                  setStatusFilter('all');
                }}
                className="mt-4 px-4 py-2 text-sm font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => {
            const announcementId = announcement.id || announcement._id;
            const isExpanded = expandedId === announcementId;
            const hasMoreContent = announcement.content.length > announcement.summary.length;
            
            return (
              <div
                key={announcementId}
                className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all ${getAnnouncementStyles(announcement.type, announcement.priority)}`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getAnnouncementIcon(announcement.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-base font-semibold text-gray-800">
                              {announcement.title}
                              {announcement.isSticky && (
                                <span className="ml-2 text-xs text-primary">📌 Pinned</span>
                              )}
                            </h3>
                            {getPriorityBadge(announcement.priority)}
                            {announcement.isExpired && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                Expired
                              </span>
                            )}
                            {announcement.isScheduled && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-600">
                                Scheduled
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-2">
                            {announcement.summary}
                          </p>
                          
                          {isExpanded && hasMoreContent && (
                            <div className="text-gray-700 text-sm mb-2 whitespace-pre-wrap">
                              {announcement.content}
                            </div>
                          )}
                          
                          {/* Metadata Row */}
                          <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 mb-2">
                            <span className="capitalize">{announcement.type}</span>
                            {announcement.publishedAt && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(announcement.publishedAt)}
                              </span>
                            )}
                            {announcement.authorName && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {announcement.authorName}
                              </span>
                            )}
                            {announcement.views !== undefined && (
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {announcement.views}
                              </span>
                            )}
                            {announcement.analytics?.totalAcknowledged !== undefined && announcement.analytics.totalAcknowledged > 0 && (
                              <span className="flex items-center gap-1 text-accent">
                                <CheckCircle className="w-3 h-3" />
                                {announcement.analytics.totalAcknowledged} acknowledged
                              </span>
                            )}
                            {announcement.comments && announcement.comments.length > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {announcement.comments.length} comments
                              </span>
                            )}
                          </div>

                          {/* Tags */}
                          {announcement.tags && announcement.tags.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <Tag className="w-3 h-3 text-gray-400" />
                              {announcement.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/5 text-primary"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Attachments */}
                          {announcement.attachments && announcement.attachments.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <FileText className="w-3 h-3 text-gray-400" />
                              {announcement.attachments.map((attachment, idx) => (
                                <a
                                  key={idx}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary"
                                >
                                  {attachment.filename}
                                  <ExternalLink className="w-2 h-2" />
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200">
                            {hasMoreContent && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : announcementId)}
                                className="text-xs text-primary hover:text-primary"
                              >
                                {isExpanded ? 'Show less' : 'Read more'}
                              </button>
                            )}
                            {announcement.canAcknowledge && (
                              <button
                                onClick={() => handleAcknowledge(announcementId)}
                                className="flex items-center gap-1 text-xs text-accent hover:text-accent"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Acknowledge
                              </button>
                            )}
                            {announcement.isAcknowledged && (
                              <span className="flex items-center gap-1 text-xs text-accent">
                                <CheckCircle className="w-3 h-3" />
                                Acknowledged
                              </span>
                            )}
                          </div>
                        </div>

                        {announcement.isActive && (
                          <button
                            onClick={() => handleDismiss(announcementId)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded flex-shrink-0"
                            title="Dismiss"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
