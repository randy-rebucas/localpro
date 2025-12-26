"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Activity,
  Search,
  Clock,
  RefreshCw,
  MessageSquare,
  Settings,
  User,
  CheckCircle,
  ShoppingCart,
  Briefcase,
  BookOpen,
  DollarSign,
  Users,
  Gift,
  Shield,
  Truck,
  Home,
  Bell,
  Heart,
  Share2,
  Eye,
  MapPin,
  Filter,
  Star
} from "lucide-react";
import { useSession } from "@/hooks/useAuth";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { Skeleton } from "@/components/ui/loading";
import { ListSkeleton } from "@/components/ui/loading";

// Activity Data Entity (from features/activity/data-entities.md)

export type ActivityType =
  // Authentication & Profile
  | 'user_login' | 'user_logout' | 'user_register' | 'profile_update' | 'avatar_upload'
  | 'password_change' | 'email_verification' | 'phone_verification'
  // Marketplace Activities
  | 'service_created' | 'service_updated' | 'service_deleted' | 'service_published'
  | 'service_viewed' | 'service_favorited' | 'service_shared'
  | 'booking_created' | 'booking_accepted' | 'booking_rejected' | 'booking_completed'
  | 'booking_cancelled' | 'booking_rescheduled'
  | 'review_created' | 'review_updated' | 'review_deleted'
  // Job Board Activities
  | 'job_created' | 'job_updated' | 'job_deleted' | 'job_published' | 'job_closed'
  | 'job_applied' | 'job_application_withdrawn' | 'job_application_approved'
  | 'job_application_rejected' | 'job_application_shortlisted'
  // Academy Activities
  | 'course_created' | 'course_updated' | 'course_deleted' | 'course_published'
  | 'course_enrolled' | 'course_completed' | 'course_progress_updated'
  | 'course_review_created' | 'certificate_earned'
  // Financial Activities
  | 'payment_made' | 'payment_received' | 'payment_failed' | 'payment_refunded'
  | 'withdrawal_requested' | 'withdrawal_approved' | 'withdrawal_rejected'
  | 'invoice_created' | 'invoice_paid' | 'invoice_overdue'
  // Communication Activities
  | 'message_sent' | 'message_received' | 'conversation_started'
  | 'notification_sent' | 'notification_read' | 'email_sent'
  // Agency Activities
  | 'agency_joined' | 'agency_left' | 'agency_created' | 'agency_updated'
  | 'provider_added' | 'provider_removed' | 'provider_status_updated'
  // Referral Activities
  | 'referral_sent' | 'referral_accepted' | 'referral_completed'
  | 'referral_reward_earned' | 'referral_invitation_sent'
  // Trust & Verification
  | 'verification_requested' | 'verification_approved' | 'verification_rejected'
  | 'document_uploaded' | 'document_verified' | 'badge_earned'
  // Supply & Rental Activities
  | 'supply_created' | 'supply_ordered' | 'supply_delivered' | 'supply_reviewed'
  | 'rental_created' | 'rental_booked' | 'rental_returned' | 'rental_reviewed'
  // Advertisement Activities
  | 'ad_created' | 'ad_updated' | 'ad_published' | 'ad_clicked' | 'ad_promoted'
  // System Activities
  | 'settings_updated' | 'preferences_changed' | 'subscription_created'
  | 'subscription_cancelled' | 'subscription_renewed'
  // Social Activities
  | 'connection_made' | 'connection_removed' | 'follow_started' | 'follow_stopped'
  | 'content_liked' | 'content_shared' | 'content_commented'
  // Other
  | 'search_performed' | 'filter_applied' | 'export_requested' | 'report_generated';

export type ActivityCategory =
  | 'authentication' | 'profile' | 'marketplace' | 'job_board' | 'academy'
  | 'financial' | 'communication' | 'agency' | 'referral' | 'verification'
  | 'supplies' | 'rentals' | 'advertising' | 'system' | 'social' | 'other';

export type ActivityImpact = 'low' | 'medium' | 'high' | 'critical';

export type ActivityVisibility = 'public' | 'private' | 'connections' | 'followers';

export type TargetEntityType =
  | 'user' | 'service' | 'job' | 'course' | 'booking' | 'application'
  | 'review' | 'payment' | 'agency' | 'referral' | 'verification'
  | 'supply' | 'rental' | 'ad' | 'message' | 'notification' | 'document';

export interface TargetEntity {
  type: TargetEntityType;
  id: string;
  name?: string;
  url?: string;
}

export interface RelatedEntity {
  type: TargetEntityType;
  id: string;
  name?: string;
  role?: string; // e.g., 'client', 'provider', 'employer', 'applicant'
}

export interface Location {
  type?: 'Point';
  coordinates?: [number, number]; // [longitude, latitude]
  address?: string;
  city?: string;
  country?: string;
}

export interface ActivityMetadata {
  ipAddress?: string;
  userAgent?: string;
  device?: 'mobile' | 'tablet' | 'desktop' | 'unknown';
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
  user: string; // ObjectId(User)
  type: 'view' | 'like' | 'share' | 'comment' | 'bookmark';
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityItem {
  _id: string;
  id?: string; // Alias for _id
  user: string; // ObjectId(User)
  type: ActivityType;
  category: ActivityCategory;
  action: string; // required, maxlength: 100
  description: string; // required, maxlength: 500
  details?: Record<string, unknown>; // Mixed
  targetEntity?: TargetEntity;
  relatedEntities?: RelatedEntity[];
  location?: Location;
  metadata?: ActivityMetadata;
  visibility: ActivityVisibility; // default 'private'
  isVisible: boolean; // default true
  isDeleted: boolean; // default false
  deletedAt?: string | null; // Date ISO8601
  tags?: string[];
  impact: ActivityImpact; // default 'medium'
  points: number; // default 0
  analytics?: ActivityAnalytics;
  interactions?: ActivityInteraction[];
  createdAt: string; // Date ISO8601
  updatedAt: string; // Date ISO8601
  // Computed fields
  age?: string; // computed from createdAt
}

// Helper function to normalize activity from API
const normalizeActivity = (activity: Record<string, unknown>): ActivityItem => {
  const activityId = String(activity._id || activity.id || '');
  
  const activityType = (typeof activity.type === 'string' ? activity.type : 'search_performed') as ActivityType;
  const category = ((typeof activity.category === 'string' ? activity.category : getCategoryFromType(activityType)) || 'other') as ActivityCategory;
  const visibility = (typeof activity.visibility === 'string' ? activity.visibility : 'private') as ActivityVisibility;
  const impact = (typeof activity.impact === 'string' ? activity.impact : 'medium') as ActivityImpact;
  const isVisible = typeof activity.isVisible === 'boolean' ? activity.isVisible : activity.isVisible !== false;
  const isDeleted = typeof activity.isDeleted === 'boolean' ? activity.isDeleted : Boolean(activity.isDeleted);
  const points = typeof activity.points === 'number' ? activity.points : 0;
  const analytics = (activity.analytics && typeof activity.analytics === 'object' && !Array.isArray(activity.analytics)) 
    ? activity.analytics as ActivityAnalytics 
    : { views: 0, likes: 0, shares: 0, comments: 0 };
  const tags = Array.isArray(activity.tags) ? activity.tags as string[] : [];
  const relatedEntities = Array.isArray(activity.relatedEntities) ? activity.relatedEntities as RelatedEntity[] : [];
  const createdAt = typeof activity.createdAt === 'string' ? activity.createdAt : '';
  const age = typeof activity.age === 'string' ? activity.age : formatActivityAge(createdAt);
  const user = typeof activity.user === 'string' ? activity.user : '';
  const action = typeof activity.action === 'string' ? activity.action : '';
  const description = typeof activity.description === 'string' ? activity.description : '';
  
  return {
    ...activity,
    _id: activityId,
    id: activityId,
    user,
    type: activityType,
    category,
    action,
    description,
    visibility,
    isVisible,
    isDeleted,
    impact,
    points,
    analytics,
    tags,
    relatedEntities,
    createdAt,
    updatedAt: typeof activity.updatedAt === 'string' ? activity.updatedAt : createdAt,
    // Compute age
    age
  } as ActivityItem;
};

// Helper function to get category from type
const getCategoryFromType = (type?: ActivityType): ActivityCategory => {
  if (!type) return 'other';
  
  const categoryMap: Record<string, ActivityCategory> = {
    'user_login': 'authentication',
    'user_logout': 'authentication',
    'user_register': 'authentication',
    'password_change': 'authentication',
    'email_verification': 'authentication',
    'phone_verification': 'authentication',
    'profile_update': 'profile',
    'avatar_upload': 'profile',
    'service_created': 'marketplace',
    'service_updated': 'marketplace',
    'service_deleted': 'marketplace',
    'service_published': 'marketplace',
    'service_viewed': 'marketplace',
    'service_favorited': 'marketplace',
    'service_shared': 'marketplace',
    'booking_created': 'marketplace',
    'booking_accepted': 'marketplace',
    'booking_rejected': 'marketplace',
    'booking_completed': 'marketplace',
    'booking_cancelled': 'marketplace',
    'booking_rescheduled': 'marketplace',
    'review_created': 'marketplace',
    'review_updated': 'marketplace',
    'review_deleted': 'marketplace',
    'job_created': 'job_board',
    'job_updated': 'job_board',
    'job_deleted': 'job_board',
    'job_published': 'job_board',
    'job_closed': 'job_board',
    'job_applied': 'job_board',
    'job_application_withdrawn': 'job_board',
    'job_application_approved': 'job_board',
    'job_application_rejected': 'job_board',
    'job_application_shortlisted': 'job_board',
    'course_created': 'academy',
    'course_updated': 'academy',
    'course_deleted': 'academy',
    'course_published': 'academy',
    'course_enrolled': 'academy',
    'course_completed': 'academy',
    'course_progress_updated': 'academy',
    'course_review_created': 'academy',
    'certificate_earned': 'academy',
    'payment_made': 'financial',
    'payment_received': 'financial',
    'payment_failed': 'financial',
    'payment_refunded': 'financial',
    'withdrawal_requested': 'financial',
    'withdrawal_approved': 'financial',
    'withdrawal_rejected': 'financial',
    'invoice_created': 'financial',
    'invoice_paid': 'financial',
    'invoice_overdue': 'financial',
    'message_sent': 'communication',
    'message_received': 'communication',
    'conversation_started': 'communication',
    'notification_sent': 'communication',
    'notification_read': 'communication',
    'email_sent': 'communication',
    'agency_joined': 'agency',
    'agency_left': 'agency',
    'agency_created': 'agency',
    'agency_updated': 'agency',
    'provider_added': 'agency',
    'provider_removed': 'agency',
    'provider_status_updated': 'agency',
    'referral_sent': 'referral',
    'referral_accepted': 'referral',
    'referral_completed': 'referral',
    'referral_reward_earned': 'referral',
    'referral_invitation_sent': 'referral',
    'verification_requested': 'verification',
    'verification_approved': 'verification',
    'verification_rejected': 'verification',
    'document_uploaded': 'verification',
    'document_verified': 'verification',
    'badge_earned': 'verification',
    'supply_created': 'supplies',
    'supply_ordered': 'supplies',
    'supply_delivered': 'supplies',
    'supply_reviewed': 'supplies',
    'rental_created': 'rentals',
    'rental_booked': 'rentals',
    'rental_returned': 'rentals',
    'rental_reviewed': 'rentals',
    'ad_created': 'advertising',
    'ad_updated': 'advertising',
    'ad_published': 'advertising',
    'ad_clicked': 'advertising',
    'ad_promoted': 'advertising',
    'settings_updated': 'system',
    'preferences_changed': 'system',
    'subscription_created': 'system',
    'subscription_cancelled': 'system',
    'subscription_renewed': 'system',
    'connection_made': 'social',
    'connection_removed': 'social',
    'follow_started': 'social',
    'follow_stopped': 'social',
    'content_liked': 'social',
    'content_shared': 'social',
    'content_commented': 'social'
  };
  
  return categoryMap[type] || 'other';
};

// Format activity age for display
const formatActivityAge = (dateString?: string): string => {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

// Helper function to get activity icon based on category and type
const getActivityIcon = (category: ActivityCategory) => {
  // Category-based icons
  switch (category) {
    case 'authentication':
      return <CheckCircle className="w-4 h-4 text-accent" />;
    case 'profile':
      return <User className="w-4 h-4 text-primary" />;
    case 'marketplace':
      return <ShoppingCart className="w-4 h-4 text-primary" />;
    case 'job_board':
      return <Briefcase className="w-4 h-4 text-purple-600" />;
    case 'academy':
      return <BookOpen className="w-4 h-4 text-yellow-600" />;
    case 'financial':
      return <DollarSign className="w-4 h-4 text-accent" />;
    case 'communication':
      return <MessageSquare className="w-4 h-4 text-orange-600" />;
    case 'agency':
      return <Users className="w-4 h-4 text-pink-600" />;
    case 'referral':
      return <Gift className="w-4 h-4 text-red-600" />;
    case 'verification':
      return <Shield className="w-4 h-4 text-teal-600" />;
    case 'supplies':
      return <Truck className="w-4 h-4 text-gray-600" />;
    case 'rentals':
      return <Home className="w-4 h-4 text-primary" />;
    case 'advertising':
      return <Bell className="w-4 h-4 text-yellow-600" />;
    case 'system':
      return <Settings className="w-4 h-4 text-gray-600" />;
    case 'social':
      return <Heart className="w-4 h-4 text-red-600" />;
    default:
      return <Activity className="w-4 h-4 text-primary" />;
  }
};

// Helper function to get impact badge
const getImpactBadge = (impact: ActivityImpact) => {
  switch (impact) {
    case 'critical':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Critical</span>;
    case 'high':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">High</span>;
    case 'medium':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Medium</span>;
    case 'low':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">Low</span>;
  }
};

// Helper function to format type for display
const formatActivityType = (type: ActivityType): string => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ActivityCategory | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all');
  const [impactFilter, setImpactFilter] = useState<ActivityImpact | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const { data: session, status } = useSession();
  
  logger.debug('Activity page', { hasSession: !!session, status, userId: session?.user?.id });
  
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      if (session?.user?.id) {
        try {
          if (!getApiToken()) return;
          
          const endpoint = API_ENDPOINTS.logsUserActivity.includes('[id]')
            ? API_ENDPOINTS.logsUserActivity.replace('[id]', session.user.id)
            : `${API_ENDPOINTS.logsUserActivity}/${session.user.id}`;
          const url = `${API_BASE_URL}${endpoint}`;
          const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
          if (response.ok) {
            const responseData = await response.json();
            // Handle API response structure: { success, data: { activities: [...], pagination:{...} } }
            const activitiesData = responseData?.data?.activities || responseData?.activities || responseData?.data || [];
            
            // Normalize activities
            const normalizedActivities = activitiesData
              .map((activity: Record<string, unknown>) => normalizeActivity(activity))
              .filter((activity: ActivityItem) => !activity.isDeleted && activity.isVisible)
              .sort((a: ActivityItem, b: ActivityItem) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
            
            setActivities(normalizedActivities);
          } else {
            logger.error('Failed to fetch activities: Response not OK', undefined, { status: response.status });
            setActivities([]);
          }
        } catch (error) {
          logger.error('Error fetching activities', error instanceof Error ? error : new Error(String(error)));
          setActivities([]);
        }
      } else {
        // No session or user ID available
        logger.warn('No session or user ID available');
        setActivities([]);
      }
    } catch (error) {
      logger.error('Error in fetchActivities', error instanceof Error ? error : new Error(String(error)));
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchActivities();
    } else if (status === "unauthenticated") {
      // If user is not authenticated, stop loading
      setLoading(false);
      setActivities([]);
    }
    // If status is "loading", keep showing loading state
  }, [session, status, fetchActivities]);

  const refreshActivity = useCallback(async () => {
    await fetchActivities();
  }, [fetchActivities]);

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      // Search filter
      const matchesSearch = 
        !searchQuery ||
        activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.type.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || activity.category === categoryFilter;
      
      // Type filter
      const matchesType = typeFilter === 'all' || activity.type === typeFilter;
      
      // Impact filter
      const matchesImpact = impactFilter === 'all' || activity.impact === impactFilter;
      
      return matchesSearch && matchesCategory && matchesType && matchesImpact;
    });
  }, [activities, searchQuery, categoryFilter, typeFilter, impactFilter]);

  // Get unique categories and types for filter dropdowns
  const availableCategories = useMemo(() => {
    const categories = Array.from(new Set(activities.map(a => a.category))).sort();
    return categories;
  }, [activities]);

  const availableTypes = useMemo(() => {
    const types = Array.from(new Set(activities.map(a => a.type))).sort();
    return types;
  }, [activities]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          className="text-sm text-gray-500 mb-4"
          items={[
            { label: "Marketplace", href: "/marketplace" },
            { label: "Activity" },
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

        {/* Activity List Skeleton */}
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
          { label: "Activity" },
        ]}
      />
      
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-accent" />
            <h1 className="text-xl font-bold text-gray-800">Activity Log</h1>
            <span className="text-sm text-gray-500">
              ({filteredActivities.length} of {activities.length})
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
              onClick={refreshActivity}
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
            placeholder="Search activities..."
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
                  setCategoryFilter('all');
                  setTypeFilter('all');
                  setImpactFilter('all');
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Category Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as ActivityCategory | 'all')}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as ActivityType | 'all')}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  {availableTypes.map(type => (
                    <option key={type} value={type}>{formatActivityType(type)}</option>
                  ))}
                </select>
              </div>

              {/* Impact Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Impact</label>
                <select
                  value={impactFilter}
                  onChange={(e) => setImpactFilter(e.target.value as ActivityImpact | 'all')}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="all">All Impact Levels</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800 mb-1">No Activities</h3>
            <p className="text-gray-600">
              {searchQuery || categoryFilter !== 'all' || typeFilter !== 'all' || impactFilter !== 'all'
                ? "No activities match your filters."
                : "No activity data available."}
            </p>
            {(searchQuery || categoryFilter !== 'all' || typeFilter !== 'all' || impactFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setTypeFilter('all');
                  setImpactFilter('all');
                }}
                className="mt-4 px-4 py-2 text-sm font-medium text-accent bg-accent/5 rounded-lg hover:bg-accent/10 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredActivities.map((activity) => {
            const activityId = activity.id || activity._id;
            return (
              <div
                key={activityId}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-4 border-l-4 border-accent"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-800 mb-1">{activity.action}</h3>
                        <p className="text-gray-600 text-sm mb-2">{activity.description}</p>
                        
                        {/* Metadata Row */}
                        <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 mb-2">
                          <span className="capitalize px-2 py-0.5 bg-gray-100 rounded">
                            {activity.category}
                          </span>
                          <span className="capitalize">
                            {formatActivityType(activity.type)}
                          </span>
                          {getImpactBadge(activity.impact)}
                          {activity.points > 0 && (
                            <span className="flex items-center gap-1 text-yellow-600">
                              <Star className="w-3 h-3" />
                              {activity.points} pts
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {activity.age || formatActivityAge(activity.createdAt)}
                          </span>
                        </div>

                        {/* Target Entity */}
                        {activity.targetEntity && (
                          <div className="text-xs text-gray-600 mb-2">
                            <span className="font-medium">Target: </span>
                            {activity.targetEntity.name || activity.targetEntity.type}
                            {activity.targetEntity.url && (
                              <a
                                href={activity.targetEntity.url}
                                className="ml-1 text-primary hover:underline"
                              >
                                View →
                              </a>
                            )}
                          </div>
                        )}

                        {/* Location */}
                        {activity.location && (activity.location.address || activity.location.city) && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <MapPin className="w-3 h-3" />
                            {activity.location.address || activity.location.city || activity.location.country}
                          </div>
                        )}

                        {/* Analytics */}
                        {activity.analytics && (
                          ((activity.analytics.views || 0) + (activity.analytics.likes || 0) + (activity.analytics.shares || 0) + (activity.analytics.comments || 0)) > 0 && (
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                              {(activity.analytics.views || 0) > 0 && (
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {activity.analytics.views}
                                </span>
                              )}
                              {(activity.analytics.likes || 0) > 0 && (
                                <span className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  {activity.analytics.likes}
                                </span>
                              )}
                              {(activity.analytics.shares || 0) > 0 && (
                                <span className="flex items-center gap-1">
                                  <Share2 className="w-3 h-3" />
                                  {activity.analytics.shares}
                                </span>
                              )}
                              {(activity.analytics.comments || 0) > 0 && (
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {activity.analytics.comments}
                                </span>
                              )}
                            </div>
                          )
                        )}

                        {/* Tags */}
                        {activity.tags && activity.tags.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            {activity.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/5 text-primary"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
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
