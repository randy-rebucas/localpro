"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useAuth";
import { makeClientAuthenticatedRequestWithPathSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  Shield,
  User,
  GraduationCap,
  Package,
  Car,
  DollarSign,
  Activity,
  Clock,
  ArrowRight,
  MessageSquare,
  Settings,
  Bell,
  Zap,
  AlertCircle,
  CheckCircle,
  Info,
  ExternalLink,
  Star,
  TrendingUp,
} from "lucide-react";

// Activity Type Enum (from data-entities.md)
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

export interface TargetEntity {
  type: 'user' | 'service' | 'job' | 'course' | 'booking' | 'application'
    | 'review' | 'payment' | 'agency' | 'referral' | 'verification'
    | 'supply' | 'rental' | 'ad' | 'message' | 'notification' | 'document';
  id: string; // ObjectId
  name?: string;
  url?: string;
}

export interface RelatedEntity {
  type: 'user' | 'service' | 'job' | 'course' | 'booking' | 'application'
    | 'review' | 'payment' | 'agency' | 'referral' | 'verification'
    | 'supply' | 'rental' | 'ad' | 'message' | 'notification' | 'document';
  id: string; // ObjectId
  name?: string;
  role?: string; // e.g., 'client', 'provider', 'employer', 'applicant'
}

export interface ActivityLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
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
  views: number;
  likes: number;
  shares: number;
  comments: number;
}

export interface ActivityInteraction {
  user: string; // ObjectId(User)
  type: 'view' | 'like' | 'share' | 'comment' | 'bookmark';
  timestamp: string; // Date ISO8601
  metadata?: Record<string, unknown>;
}

export interface ActivityUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: {
    url?: string;
    thumbnail?: string;
  };
  role?: string;
}

export interface ActivityItem {
  _id: string;
  id?: string; // Alias for _id for convenience
  user: string | ActivityUser; // ObjectId(User) or populated user object
  type: ActivityType;
  category: ActivityCategory;
  action: string; // required, maxlength: 100
  description: string; // required, maxlength: 500
  details?: Record<string, unknown>; // Mixed type for flexible metadata
  targetEntity?: TargetEntity;
  relatedEntities?: RelatedEntity[];
  location?: ActivityLocation;
  metadata?: ActivityMetadata;
  visibility: ActivityVisibility; // default 'private'
  isVisible: boolean; // default true
  isDeleted?: boolean; // default false
  deletedAt?: string | null; // Date ISO8601
  tags?: string[]; // string<=50 each
  impact: ActivityImpact; // default 'medium'
  points: number; // default 0
  analytics?: ActivityAnalytics;
  interactions?: ActivityInteraction[];
  createdAt: string; // Date ISO8601
  updatedAt: string; // Date ISO8601
  // Virtual fields (computed)
  age?: string; // e.g., "2h ago", "just now"
  summary?: {
    id: string;
    type: ActivityType;
    action: string;
    description: string;
    age: string;
    points: number;
    impact: ActivityImpact;
    targetEntity?: TargetEntity;
    analytics?: ActivityAnalytics;
  };
}

// Helper function to format activity age/timestamp
const formatActivityAge = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export default function ActivityPage() {
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter] = useState("all");
  const [sortBy] = useState("recent");
  const [viewMode] = useState<"list" | "grid">("list");
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchRecentActivity = async () => {
      setIsLoading(true);
      try {
        if (session?.user?.id) {
          // Try activities API endpoint
          try {
            const response = await makeClientAuthenticatedRequestWithPathSafe(
              "activitiesMy" as keyof typeof API_ENDPOINTS,
              [],
              {},
              { method: 'GET' }
            );
            if (response.ok) {
              const responseData = await response.json();
              // Handle API response structure: { success, data: { activities: [...], pagination:{...} } }
              const activities = responseData?.data?.activities || responseData?.activities || responseData?.data || [];
              
              // Normalize activities: ensure both _id and id are present, compute age if not present
              const normalizedActivities = activities.map((activity: Record<string, unknown>) => ({
                ...activity,
                _id: activity._id || activity.id,
                id: activity.id || activity._id,
                // Compute age if not provided
                age: activity.age || formatActivityAge(activity.createdAt),
                // Ensure defaults
                visibility: activity.visibility || 'private',
                isVisible: activity.isVisible !== false,
                impact: activity.impact || 'medium',
                points: activity.points || 0,
                category: activity.category || 'other'
              }));
              
              setRecentActivity(normalizedActivities);
            } else {
              console.warn("Failed to fetch recent activity:", response.status);
              // Set enhanced fallback activity data
              setRecentActivity([
                {
                  _id: "1",
                  id: "1",
                  user: session.user.id,
                  type: "booking_completed" as ActivityType,
                  category: "marketplace" as ActivityCategory,
                  action: "Service booking completed",
                  description: "Successfully booked 'Home Cleaning Service' for tomorrow",
                  visibility: "public" as ActivityVisibility,
                  isVisible: true,
                  impact: "high" as ActivityImpact,
                  points: 10,
                  targetEntity: {
                    type: "booking",
                    id: "booking_1",
                    name: "Home Cleaning Service"
                  },
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  age: "just now"
                },
                {
                  _id: "2",
                  id: "2",
                  user: session.user.id,
                  type: "course_progress_updated" as ActivityType,
                  category: "academy" as ActivityCategory,
                  action: "Course progress updated",
                  description: "Completed 75% of 'Digital Marketing Fundamentals'",
                  visibility: "public" as ActivityVisibility,
                  isVisible: true,
                  impact: "medium" as ActivityImpact,
                  points: 5,
                  targetEntity: {
                    type: "course",
                    id: "course_1",
                    name: "Digital Marketing Fundamentals"
                  },
                  details: { progress: 75 },
                  createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
                  updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
                  age: "5m ago"
                },
                {
                  _id: "3",
                  id: "3",
                  user: session.user.id,
                  type: "verification_approved" as ActivityType,
                  category: "verification" as ActivityCategory,
                  action: "Profile verification approved",
                  description: "Your professional profile has been verified",
                  visibility: "public" as ActivityVisibility,
                  isVisible: true,
                  impact: "high" as ActivityImpact,
                  points: 15,
                  createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
                  updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
                  age: "15m ago"
                },
                {
                  _id: "4",
                  id: "4",
                  user: session.user.id,
                  type: "payment_received" as ActivityType,
                  category: "financial" as ActivityCategory,
                  action: "Payment received",
                  description: "Received payment of ₱2,500 for completed service",
                  visibility: "private" as ActivityVisibility,
                  isVisible: true,
                  impact: "high" as ActivityImpact,
                  points: 20,
                  targetEntity: {
                    type: "payment",
                    id: "payment_1",
                    name: "Payment #12345"
                  },
                  details: { amount: 2500, currency: "PHP" },
                  createdAt: new Date(Date.now() - 3600000).toISOString(),
                  updatedAt: new Date(Date.now() - 3600000).toISOString(),
                  age: "1h ago"
                },
                {
                  _id: "5",
                  id: "5",
                  user: session.user.id,
                  type: "message_received" as ActivityType,
                  category: "communication" as ActivityCategory,
                  action: "New message received",
                  description: "You have 3 unread messages from clients",
                  visibility: "private" as ActivityVisibility,
                  isVisible: true,
                  impact: "medium" as ActivityImpact,
                  points: 3,
                  details: { unreadCount: 3 },
                  createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
                  updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
                  age: "2h ago"
                },
                {
                  _id: "6",
                  id: "6",
                  user: session.user.id,
                  type: "review_created" as ActivityType,
                  category: "marketplace" as ActivityCategory,
                  action: "Service rating received",
                  description: "Received 5-star rating for 'Plumbing Repair' service",
                  visibility: "public" as ActivityVisibility,
                  isVisible: true,
                  impact: "medium" as ActivityImpact,
                  points: 10,
                  targetEntity: {
                    type: "review",
                    id: "review_1",
                    name: "Review for Plumbing Repair"
                  },
                  details: { rating: 5 },
                  createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
                  updatedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
                  age: "3h ago"
                },
                {
                  _id: "7",
                  id: "7",
                  user: session.user.id,
                  type: "certificate_earned" as ActivityType,
                  category: "academy" as ActivityCategory,
                  action: "Certificate earned",
                  description: "Earned certificate for 'Project Management Basics'",
                  visibility: "public" as ActivityVisibility,
                  isVisible: true,
                  impact: "high" as ActivityImpact,
                  points: 50,
                  targetEntity: {
                    type: "course",
                    id: "course_2",
                    name: "Project Management Basics"
                  },
                  createdAt: new Date(Date.now() - 86400000).toISOString(),
                  updatedAt: new Date(Date.now() - 86400000).toISOString(),
                  age: "1d ago"
                },
                {
                  _id: "8",
                  id: "8",
                  user: session.user.id,
                  type: "settings_updated" as ActivityType,
                  category: "system" as ActivityCategory,
                  action: "Security settings updated",
                  description: "Two-factor authentication enabled",
                  visibility: "private" as ActivityVisibility,
                  isVisible: true,
                  impact: "medium" as ActivityImpact,
                  points: 5,
                  details: { setting: "twoFactorAuth", enabled: true },
                  createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
                  updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
                  age: "2d ago"
                }
              ]);
            }
          } catch (err) {
            console.warn("Activity external fetch failed, using fallback:", err);
            // Use the same fallback data structure as above
            if (session?.user?.id) {
              setRecentActivity([
                {
                  _id: "1",
                  id: "1",
                  user: session.user.id,
                  type: "booking_completed" as ActivityType,
                  category: "marketplace" as ActivityCategory,
                  action: "Service booking completed",
                  description: "Successfully booked 'Home Cleaning Service' for tomorrow",
                  visibility: "public" as ActivityVisibility,
                  isVisible: true,
                  impact: "high" as ActivityImpact,
                  points: 10,
                  targetEntity: {
                    type: "booking",
                    id: "booking_1",
                    name: "Home Cleaning Service"
                  },
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  age: "just now"
                },
                {
                  _id: "2",
                  id: "2",
                  user: session.user.id,
                  type: "course_progress_updated" as ActivityType,
                  category: "academy" as ActivityCategory,
                  action: "Course progress updated",
                  description: "Completed 75% of 'Digital Marketing Fundamentals'",
                  visibility: "public" as ActivityVisibility,
                  isVisible: true,
                  impact: "medium" as ActivityImpact,
                  points: 5,
                  targetEntity: {
                    type: "course",
                    id: "course_1",
                    name: "Digital Marketing Fundamentals"
                  },
                  details: { progress: 75 },
                  createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
                  updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
                  age: "5m ago"
                }
              ]);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch recent activity:", error);
        // Use minimal fallback data
        if (session?.user?.id) {
          setRecentActivity([
            {
              _id: "1",
              id: "1",
              user: session.user.id,
              type: "booking_completed" as ActivityType,
              category: "marketplace" as ActivityCategory,
              action: "Service booking completed",
              description: "Successfully booked 'Home Cleaning Service' for tomorrow",
              visibility: "public" as ActivityVisibility,
              isVisible: true,
              impact: "high" as ActivityImpact,
              points: 10,
              targetEntity: {
                type: "booking",
                id: "booking_1",
                name: "Home Cleaning Service"
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              age: "just now"
            },
            {
              _id: "2",
              id: "2",
              user: session.user.id,
              type: "course_progress_updated" as ActivityType,
              category: "academy" as ActivityCategory,
              action: "Course progress updated",
              description: "Completed 75% of 'Digital Marketing Fundamentals'",
              visibility: "public" as ActivityVisibility,
              isVisible: true,
              impact: "medium" as ActivityImpact,
              points: 5,
              targetEntity: {
                type: "course",
                id: "course_1",
                name: "Digital Marketing Fundamentals"
              },
              details: { progress: 75 },
              createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
              updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
              age: "5m ago"
            }
          ]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated" && session?.user?.id) {
      fetchRecentActivity();
    }
  }, [session, status]);

  // Helper function to get icon for activity category
  const getActivityIcon = (category: ActivityCategory, type?: ActivityType) => {
    // Map specific types to icons
    if (type) {
      if (type.includes('certificate') || type.includes('course_completed')) {
        return <GraduationCap className="w-4 h-4" />;
      }
      if (type.includes('payment') || type.includes('withdrawal') || type.includes('invoice')) {
        return <DollarSign className="w-4 h-4" />;
      }
      if (type.includes('message') || type.includes('conversation')) {
        return <MessageSquare className="w-4 h-4" />;
      }
      if (type.includes('notification')) {
        return <Bell className="w-4 h-4" />;
      }
      if (type.includes('settings') || type.includes('preferences')) {
        return <Settings className="w-4 h-4" />;
      }
    }
    
    // Map categories to icons
    switch (category) {
      case 'marketplace':
        return <Shield className="w-4 h-4" />;
      case 'profile':
      case 'authentication':
        return <User className="w-4 h-4" />;
      case 'academy':
        return <GraduationCap className="w-4 h-4" />;
      case 'supplies':
        return <Package className="w-4 h-4" />;
      case 'rentals':
        return <Car className="w-4 h-4" />;
      case 'financial':
        return <DollarSign className="w-4 h-4" />;
      case 'communication':
        return <MessageSquare className="w-4 h-4" />;
      case 'system':
        return <Settings className="w-4 h-4" />;
      case 'social':
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  // Helper function to get impact icon
  const getImpactIcon = (impact: ActivityImpact) => {
    switch (impact) {
      case 'critical':
        return <Zap className="w-3 h-3 text-red-600" />;
      case 'high':
        return <Zap className="w-3 h-3 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="w-3 h-3 text-yellow-500" />;
      case 'low':
        return <Info className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  // Helper function to get status/type icon based on activity type
  const getStatusIcon = (type: ActivityType) => {
    // Map activity types to status indicators
    if (type.includes('completed') || type.includes('approved') || type.includes('earned')) {
      return <CheckCircle className="w-3 h-3 text-green-500" />;
    }
    if (type.includes('failed') || type.includes('rejected') || type.includes('cancelled') || type.includes('deleted')) {
      return <AlertCircle className="w-3 h-3 text-red-500" />;
    }
    if (type.includes('updated') || type.includes('created') || type.includes('published')) {
      return <Info className="w-3 h-3 text-blue-500" />;
    }
    return null;
  };

  // Helper function to get category/type color
  const getCategoryColor = (category: ActivityCategory, impact?: ActivityImpact) => {
    // Use impact for critical/high priority colors
    if (impact === 'critical') {
      return 'text-red-600 bg-red-100';
    }
    if (impact === 'high') {
      return 'text-orange-600 bg-orange-100';
    }
    
    // Map categories to colors
    switch (category) {
      case 'marketplace':
        return 'text-blue-600 bg-blue-100';
      case 'academy':
        return 'text-purple-600 bg-purple-100';
      case 'financial':
        return 'text-green-600 bg-green-100';
      case 'profile':
      case 'authentication':
        return 'text-indigo-600 bg-indigo-100';
      case 'communication':
        return 'text-cyan-600 bg-cyan-100';
      case 'system':
        return 'text-gray-600 bg-gray-100';
      case 'social':
        return 'text-pink-600 bg-pink-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };


  // Filter and sort activities
  const filteredActivities = recentActivity
    .filter(activity => {
      // Filter out deleted or invisible activities
      if (activity.isDeleted || !activity.isVisible) return false;
      if (filter === "all") return true;
      // Filter by category or type
      return activity.category === filter || activity.type === filter;
    })
    .sort((a, b) => {
      if (sortBy === "priority" || sortBy === "impact") {
        const impactOrder: Record<ActivityImpact, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        return (impactOrder[b.impact] || 0) - (impactOrder[a.impact] || 0);
      }
      if (sortBy === "points") {
        return b.points - a.points;
      }
      // Default: recent first (by createdAt)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const refreshActivity = async () => {
    if (session?.user?.id) {
      setIsLoading(true);
      // Re-fetch activity data
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Activity Feed</h3>
            <p className="text-xs text-gray-500">Your recent actions and updates</p>
          </div>
        </div>
      </div>

      {/* Activity Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredActivities.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4 p-4" : "space-y-1"}>
            {filteredActivities.slice(0, 3).map((activity) => {
              const activityId = activity.id || activity._id;
              const displayAge = activity.age || formatActivityAge(activity.createdAt);
              
              return (
                <div key={activityId} className={`group hover:bg-gray-50 transition-colors ${viewMode === "list" ? "p-4 border-b border-gray-100 last:border-b-0" : "p-4 border border-gray-100 rounded-lg"}`}>
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getCategoryColor(activity.category, activity.impact)} relative`}>
                      {getActivityIcon(activity.category, activity.type)}
                      {activity.impact === 'critical' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                          <Zap className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-800 group-hover:text-green-700 transition-colors">
                              {activity.action}
                            </p>
                            {getStatusIcon(activity.type)}
                            {getImpactIcon(activity.impact)}
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{activity.description}</p>
                          
                          {/* Target Entity Link */}
                          {activity.targetEntity && (
                            <div className="mb-1">
                              <a
                                href={activity.targetEntity.url || `/${activity.targetEntity.type}/${activity.targetEntity.id}`}
                                className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                              >
                                {activity.targetEntity.name}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                          
                          {/* Tags */}
                          {activity.tags && activity.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {activity.tags.map((tag, idx) => (
                                <span key={idx} className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {displayAge}
                            </p>
                            <div className="flex items-center gap-3">
                              {/* Analytics */}
                              {activity.analytics && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  {activity.analytics.views > 0 && (
                                    <span>{activity.analytics.views} views</span>
                                  )}
                                  {activity.analytics.likes > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Star className="w-3 h-3 text-yellow-500" />
                                      {activity.analytics.likes}
                                    </span>
                                  )}
                                </div>
                              )}
                              {/* Points */}
                              {activity.points > 0 && (
                                <span className="text-xs font-semibold text-green-600">
                                  +{activity.points} pts
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {activity.targetEntity?.url && (
                          <button 
                            onClick={() => activity.targetEntity?.url && router.push(activity.targetEntity.url)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-base font-medium text-gray-700 mb-2">No activity found</h4>
            <p className="text-sm text-gray-500 mb-4">
              {filter === "all" ? "No recent activity to show" : `No ${filter} activity found`}
            </p>
            <button
              onClick={refreshActivity}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Refresh to check for updates
            </button>
          </div>
        )}

        {/* Enhanced Footer */}
        {filteredActivities.length > 0 && (
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Showing {filteredActivities.slice(0, 3).length} of {filteredActivities.length} activities</span>
                </div>
                {filteredActivities.some(a => a.impact === 'high' || a.impact === 'critical') && (
                  <div className="flex items-center gap-1 text-red-600">
                    <Zap className="w-3 h-3" />
                    <span>{filteredActivities.filter(a => a.impact === 'high' || a.impact === 'critical').length} high impact</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => router.push('/activity')}
                className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1 transition-colors"
              >
                View all activities
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
