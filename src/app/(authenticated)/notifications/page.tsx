"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Skeleton, ListSkeleton } from "@/components/ui/loading";
import { 
  Bell, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Mail,
  MessageSquare,
  X,
  Filter,
  Clock,
  CheckCircle2,
  Trash2
} from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

// Notification Data Entity (from features/communication/data-entities.md)

export type NotificationType =
  | 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'booking_completed'
  | 'job_application' | 'application_status_update' | 'job_posted'
  | 'message_received' | 'payment_received' | 'payment_failed'
  | 'referral_reward' | 'course_enrollment' | 'order_confirmation'
  | 'subscription_renewal' | 'subscription_cancelled' | 'system_announcement';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationChannels {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface NotificationItem {
  _id: string;
  id?: string; // Alias for _id for convenience
  user: string; // ObjectId(User)
  type: NotificationType;
  title: string; // required
  message: string; // required
  data?: Record<string, unknown>; // Mixed (context payload)
  isRead: boolean; // default false
  readAt?: string | null; // Date ISO8601
  priority: NotificationPriority; // default 'medium'
  channels: NotificationChannels;
  scheduledFor?: string | null; // Date ISO8601
  sentAt?: string | null; // Date ISO8601
  expiresAt?: string | null; // Date ISO8601
  createdAt: string; // Date ISO8601
  updatedAt: string; // Date ISO8601
  // Computed/helper fields
  href?: string | null; // computed from data or type
}

// Helper function to normalize notification from API
const normalizeNotification = (notification: Record<string, unknown>): NotificationItem => {
  const notificationId = (notification._id || notification.id) as string;
  
  // Safely access data property with proper typing
  const data = notification.data as Record<string, unknown> | undefined;
  
  // Compute href from data or type
  let href: string | null | undefined = (notification.href || data?.href) as string | null | undefined;
  if (!href && data) {
    // Try to construct href from data context
    if (typeof data.bookingId === 'string') {
      href = `/bookings/${data.bookingId}`;
    } else if (typeof data.jobId === 'string') {
      href = `/jobs/${data.jobId}`;
    } else if (typeof data.orderId === 'string') {
      href = `/orders/${data.orderId}`;
    } else if (notification.type === 'message_received' && typeof data.conversationId === 'string') {
      href = `/messages?conversation=${data.conversationId}`;
    }
  }
  
  return {
    _id: notificationId,
    id: notificationId,
    user: notification.user as string,
    type: (notification.type || 'system_announcement') as NotificationType,
    title: notification.title as string,
    message: notification.message as string,
    data: data,
    isRead: notification.isRead !== undefined 
      ? Boolean(notification.isRead) 
      : Boolean(notification.read) || false,
    readAt: notification.readAt as string | null | undefined,
    priority: (notification.priority || 'medium') as NotificationPriority,
    channels: (notification.channels as NotificationChannels | undefined) || {
      inApp: true,
      email: false,
      sms: false,
      push: false
    },
    scheduledFor: notification.scheduledFor as string | null | undefined,
    sentAt: notification.sentAt as string | null | undefined,
    expiresAt: notification.expiresAt as string | null | undefined,
    createdAt: notification.createdAt as string,
    updatedAt: notification.updatedAt as string,
    href
  };
};

// Format notification date for display
const formatNotificationDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  // Just now (less than 30 seconds)
  if (diffInSeconds < 30) {
    return "Just now";
  }
  
  // Seconds ago (30 seconds to 1 minute)
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }
  
  // Minutes ago (1-59 minutes)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  // Hours ago (1-23 hours)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  // Days ago (1-6 days)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  
  // Weeks ago (1-3 weeks)
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }
  
  // Months ago (1-11 months)
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }
  
  // Years ago
  if (diffInYears < 2) {
    return "1y ago";
  }
  
  // For very old notifications, show formatted date
  const isThisYear = date.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Helper function to get notification icon and color based on type
const getNotificationIcon = (type: NotificationType) => {
  if (type.includes('payment') || type.includes('booking_completed') || type.includes('referral_reward')) {
    return { icon: <CheckCircle className="w-5 h-5" />, bgColor: "bg-emerald-100", iconColor: "text-emerald-600" };
  }
  if (type.includes('failed') || type.includes('cancelled') || type.includes('rejected')) {
    return { icon: <AlertCircle className="w-5 h-5" />, bgColor: "bg-red-100", iconColor: "text-red-600" };
  }
  if (type.includes('message')) {
    return { icon: <MessageSquare className="w-5 h-5" />, bgColor: "bg-blue-100", iconColor: "text-blue-600" };
  }
  if (type.includes('application') || type.includes('job')) {
    return { icon: <AlertTriangle className="w-5 h-5" />, bgColor: "bg-amber-100", iconColor: "text-amber-600" };
  }
  return { icon: <Bell className="w-5 h-5" />, bgColor: "bg-gray-100", iconColor: "text-gray-600" };
};

// Helper function to get notification priority badge
const getPriorityBadge = (priority: NotificationPriority) => {
  switch (priority) {
    case 'urgent':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm">Urgent</span>;
    case 'high':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm">High</span>;
    case 'medium':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Medium</span>;
    case 'low':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Low</span>;
  }
};

// Helper function to get notification type label
const getTypeLabel = (type: NotificationType): string => {
  const labels: Record<NotificationType, string> = {
    'booking_created': 'Booking Created',
    'booking_confirmed': 'Booking Confirmed',
    'booking_cancelled': 'Booking Cancelled',
    'booking_completed': 'Booking Completed',
    'job_application': 'Job Application',
    'application_status_update': 'Application Update',
    'job_posted': 'Job Posted',
    'message_received': 'New Message',
    'payment_received': 'Payment Received',
    'payment_failed': 'Payment Failed',
    'referral_reward': 'Referral Reward',
    'course_enrollment': 'Course Enrollment',
    'order_confirmation': 'Order Confirmation',
    'subscription_renewal': 'Subscription Renewal',
    'subscription_cancelled': 'Subscription Cancelled',
    'system_announcement': 'System Announcement'
  };
  return labels[type] || type;
};

// Notification item component
const NotificationItemComponent = ({ 
  notification, 
  onMarkAsRead, 
  onDelete,
  actionLoading
}: {
  notification: NotificationItem;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  actionLoading: Set<string>;
}) => {
  const notificationId = notification.id || notification._id;
  const isExpired = notification.expiresAt ? new Date(notification.expiresAt) < new Date() : false;
  const iconData = getNotificationIcon(notification.type);
  
  const handleClick = () => {
    if (notification.href && !isExpired) {
      window.location.href = notification.href;
    }
  };

  const getBorderColor = () => {
    if (notification.isRead) return "border-gray-200";
    switch (notification.priority) {
      case 'urgent': return "border-red-500";
      case 'high': return "border-orange-500";
      case 'medium': return "border-amber-500";
      default: return "border-blue-300";
    }
  };

  return (
    <div 
      className={`group relative bg-gradient-to-br from-white to-gray-50/50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-5 border-l-4 backdrop-blur-sm ${
        notification.isRead 
          ? "opacity-70 border-gray-200" 
          : `${getBorderColor()} ${notification.priority === 'urgent' ? 'ring-2 ring-red-50 shadow-lg' : ''}`
      } ${notification.href && !isExpired ? "cursor-pointer hover:scale-[1.02]" : ""}`}
      onClick={notification.href && !isExpired ? handleClick : undefined}
    >
      {/* Unread indicator dot */}
      {!notification.isRead && (
        <div className="absolute top-5 right-5 w-3 h-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full animate-pulse shadow-md shadow-blue-500/50" />
      )}
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Icon */}
          <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${iconData.bgColor} flex items-center justify-center shadow-md transform group-hover:scale-110 transition-transform ${notification.isRead ? 'opacity-60' : ''}`}>
            <div className={iconData.iconColor}>
              {iconData.icon}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-start gap-2 flex-wrap flex-1">
                <h3 className={`text-base font-semibold text-gray-900 ${!notification.isRead ? '' : 'font-normal'}`}>
                  {notification.title}
                </h3>
                {getPriorityBadge(notification.priority)}
                {isExpired && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 border border-gray-300 shadow-sm">
                    Expired
                  </span>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">{notification.message}</p>
            
            {/* Metadata */}
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gradient-to-r from-gray-50 to-gray-100 px-2.5 py-1 rounded-md border border-gray-200 shadow-sm">
                {getTypeLabel(notification.type)}
              </span>
              {(notification.channels.email || notification.channels.sms || notification.channels.push) && (
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 px-2 py-1 rounded-md border border-blue-100">
                  <Mail className="w-3.5 h-3.5" />
                  {[
                    notification.channels.email && 'Email',
                    notification.channels.sms && 'SMS',
                    notification.channels.push && 'Push'
                  ].filter(Boolean).join(', ')}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50/50 px-2 py-1 rounded-md">
                <Clock className="w-3.5 h-3.5" />
                {formatNotificationDate(notification.createdAt)}
              </span>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {!notification.isRead && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notificationId);
                  }} 
                  disabled={actionLoading.has(notificationId)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 rounded-lg transition-all border border-emerald-200 hover:border-emerald-300 shadow-sm hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {actionLoading.has(notificationId) ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark as read</span>
                    </>
                  )}
                </button>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notificationId);
                }} 
                disabled={actionLoading.has(notificationId)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-red-50 hover:to-pink-50 hover:text-red-600 rounded-lg transition-all border border-gray-200 hover:border-red-200 shadow-sm hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {actionLoading.has(notificationId) ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | 'all'>('all');

  // Load notifications
  const load = useCallback(async () => {
    if (!getApiToken()) return;
    
    setLoading(true);
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.communicationNotifications}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
      logger.debug("Notifications API response", { status: response.status, ok: response.ok });
      if (!response.ok) {
        const errorText = await response.text();
        logger.error("Notifications API error", undefined, { status: response.status, errorText });
        throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      // Handle API response structure: { success, data: { notifications: [...], pagination:{...} } }
      const notificationsData = responseData?.data?.notifications || responseData?.notifications || responseData?.data || [];
      
      // Normalize notifications and filter out expired ones
      const normalizedNotifications = notificationsData
        .map((notif: Record<string, unknown>) => normalizeNotification(notif))
        .filter((notif: NotificationItem) => {
          // Filter out expired notifications
          if (notif.expiresAt) {
            return new Date(notif.expiresAt) >= new Date();
          }
          return true;
        })
        .sort((a: NotificationItem, b: NotificationItem) => {
          // Sort by priority first, then by date
          const priorityOrder: Record<NotificationPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority] || 0;
          const bPriority = priorityOrder[b.priority] || 0;
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }
          
          // Then by date (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      
      setItems(normalizedNotifications);
    } catch (err) {
      logger.error("Error loading notifications", err instanceof Error ? err : new Error(String(err)));
     
      // For network errors, show user-friendly message but keep empty state
      if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('Failed to fetch'))) {
        logger.warn("Network error - unable to connect to API server");
        // Show empty state - the error details are logged for debugging
        setItems([]);
      } else if (err instanceof Error && err.message.includes('API base URL')) {
        logger.error("Configuration error - API_BASE_URL not set");
        setItems([]);
      } else {
        // Other errors - still show empty state
        logger.error("Unexpected error loading notifications", err instanceof Error ? err : new Error(String(err)));
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load notifications on mount and when session changes
  useEffect(() => {
      load();
  }, [load]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    setActionLoading(prev => new Set(prev).add(id));
    
    // Optimistically update the UI first
    setItems(prev => prev.map(item => {
      const itemId = item.id || item._id;
      if (itemId === id) {
        return { ...item, isRead: true, readAt: new Date().toISOString() };
      }
      return item;
    }));
    
    try {
      const endpoint = API_ENDPOINTS.communicationNotificationsRead.replace('[id]', id);
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'PUT' }));
      
      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status}`);
      }
    } catch (err) {
      logger.error("Error marking notification as read", err instanceof Error ? err : new Error(String(err)), { notificationId: id });
      // Revert optimistic update on error
      setItems(prev => prev.map(item => {
        const itemId = item.id || item._id;
        if (itemId === id) {
          return { ...item, isRead: false, readAt: undefined };
        }
        return item;
      }));
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    setActionLoading(prev => new Set(prev).add(id));
    
    // Store the item to restore if deletion fails
    const itemToDelete = items.find(item => {
      const itemId = item.id || item._id;
      return itemId === id;
    });
    
    // Optimistically update the UI first
    setItems(prev => prev.filter(item => {
      const itemId = item.id || item._id;
      return itemId !== id;
    }));
    
    try {
      const endpoint = API_ENDPOINTS.communicationNotificationsById.replace('[id]', id);
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'DELETE' }));
      
      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.status}`);
      }
    } catch (err) {
      logger.error("Error deleting notification", err instanceof Error ? err : new Error(String(err)), { notificationId: id });
      // Revert optimistic update on error
      if (itemToDelete) {
        setItems(prev => {
          const restored = [...prev, itemToDelete];
          // Re-sort by priority and date
          return restored.sort((a, b) => {
            const priorityOrder: Record<NotificationPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority] || 0;
            const bPriority = priorityOrder[b.priority] || 0;
            
            if (aPriority !== bPriority) {
              return bPriority - aPriority;
            }
            
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        });
      }
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [items]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const unreadItems = items.filter(item => !item.isRead);
    if (unreadItems.length === 0) return;
    
    setMarkAllLoading(true);
    
    // Optimistically update the UI first
    const readAt = new Date().toISOString();
    setItems(prev => prev.map(item => ({ ...item, isRead: true, readAt })));
    
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.communicationNotificationsReadAll}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'PUT' }));
      
      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.status}`);
      }
    } catch (err) {
      logger.error("Error marking all notifications as read", err instanceof Error ? err : new Error(String(err)), { unreadCount: unreadItems.length });
      // Revert optimistic update on error
      setItems(prev => prev.map(item => {
        const itemId = item.id || item._id;
        const shouldRevert = unreadItems.some(unread => {
          const unreadId = unread.id || unread._id;
          return unreadId === itemId;
        });
        return shouldRevert ? { ...item, isRead: false, readAt: undefined } : item;
      }));
    } finally {
      setMarkAllLoading(false);
    }
  }, [items]);

  // Filter notifications based on current filters
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Filter by read status
      if (filter === 'unread' && item.isRead) return false;
      if (filter === 'read' && !item.isRead) return false;
      
      // Filter by type
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      
      // Filter by priority
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
      
      return true;
    });
  }, [items, filter, typeFilter, priorityFilter]);

  // Statistics
  const stats = useMemo(() => {
    const unreadCount = items.filter(item => !item.isRead).length;
    const urgentCount = items.filter(item => item.priority === 'urgent' && !item.isRead).length;
    const typeBreakdown = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { unreadCount, urgentCount, typeBreakdown };
  }, [items]);

  // Show loading state while notifications are loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div>
                <Skeleton className="h-7 w-40 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
          </div>

          {/* Filters Skeleton */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 p-4 shadow-lg">
            <Skeleton className="h-5 w-20 mb-3" />
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-48 rounded-lg" />
              <Skeleton className="h-10 w-36 rounded-lg" />
            </div>
          </div>

          {/* Notifications List Skeleton */}
          <div className="space-y-4">
            <ListSkeleton count={5} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transform hover:scale-105 transition-transform">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-1">Notifications</h1>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="font-medium">
                    {stats.unreadCount > 0 ? (
                      <span className="text-emerald-600 font-semibold">{stats.unreadCount} unread</span>
                    ) : (
                      <span>All caught up!</span>
                    )}
                  </span>
                  {stats.urgentCount > 0 && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200 shadow-sm">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {stats.urgentCount} urgent
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {stats.unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={markAllLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {markAllLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark all as read</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={load}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-lg hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 transition-all shadow-md hover:shadow-lg hover:scale-105"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {/* Read status filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Status:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
                  className="px-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-gray-400"
                >
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>

              {/* Type filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Type:</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'all')}
                  className="px-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer min-w-[180px] shadow-sm hover:shadow-md hover:border-gray-400"
                >
                  <option value="all">All Types</option>
                  <option value="booking_created">Booking Created</option>
                  <option value="booking_confirmed">Booking Confirmed</option>
                  <option value="booking_cancelled">Booking Cancelled</option>
                  <option value="booking_completed">Booking Completed</option>
                  <option value="job_application">Job Application</option>
                  <option value="application_status_update">Application Update</option>
                  <option value="job_posted">Job Posted</option>
                  <option value="message_received">New Message</option>
                  <option value="payment_received">Payment Received</option>
                  <option value="payment_failed">Payment Failed</option>
                  <option value="referral_reward">Referral Reward</option>
                  <option value="course_enrollment">Course Enrollment</option>
                  <option value="order_confirmation">Order Confirmation</option>
                  <option value="subscription_renewal">Subscription Renewal</option>
                  <option value="subscription_cancelled">Subscription Cancelled</option>
                  <option value="system_announcement">System Announcement</option>
                </select>
              </div>

              {/* Priority filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Priority:</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as NotificationPriority | 'all')}
                  className="px-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-gray-400"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg backdrop-blur-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-md">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {items.length === 0 ? "No notifications" : "No notifications match your filters"}
              </h3>
              <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                {items.length === 0 
                  ? "You're all caught up! No new notifications at this time." 
                  : "Try adjusting your filters to see more notifications."}
              </p>
              {items.length > 0 && filteredItems.length === 0 && (
                <button
                  onClick={() => {
                    setFilter('all');
                    setTypeFilter('all');
                    setPriorityFilter('all');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 rounded-lg transition-all border-2 border-emerald-200 hover:border-emerald-300 shadow-md hover:shadow-lg hover:scale-105"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            filteredItems.map((notification) => {
              const notificationId = notification.id || notification._id;
              return (
                <NotificationItemComponent
                  key={notificationId}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  actionLoading={actionLoading}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
