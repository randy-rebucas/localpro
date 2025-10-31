"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { Skeleton, ListSkeleton } from "@/components/ui/loading";
import { 
  Bell, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Mail,
  MessageSquare,
  X
} from "lucide-react";
import { makeClientAuthenticatedRequestWithEndpointSafe, makeClientAuthenticatedRequestWithPathSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";

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
const normalizeNotification = (notification: any): NotificationItem => {
  const notificationId = notification._id || notification.id;
  
  // Compute href from data or type
  let href: string | null | undefined = notification.href || notification.data?.href;
  if (!href && notification.data) {
    // Try to construct href from data context
    if (notification.data.bookingId) {
      href = `/bookings/${notification.data.bookingId}`;
    } else if (notification.data.jobId) {
      href = `/jobs/${notification.data.jobId}`;
    } else if (notification.data.orderId) {
      href = `/orders/${notification.data.orderId}`;
    } else if (notification.type === 'message_received' && notification.data.conversationId) {
      href = `/messages?conversation=${notification.data.conversationId}`;
    }
  }
  
  return {
    ...notification,
    _id: notificationId,
    id: notificationId,
    type: notification.type || 'system_announcement',
    priority: notification.priority || 'medium',
    isRead: notification.isRead !== undefined ? notification.isRead : notification.read || false,
    channels: notification.channels || {
      inApp: true,
      email: false,
      sms: false,
      push: false
    },
    href
  };
};

// Format notification date for display
const formatNotificationDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Helper function to get notification icon based on type
const getNotificationIcon = (type: NotificationType) => {
  if (type.includes('payment') || type.includes('booking_completed') || type.includes('referral_reward')) {
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  }
  if (type.includes('failed') || type.includes('cancelled') || type.includes('rejected')) {
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  }
  if (type.includes('message')) {
    return <MessageSquare className="w-4 h-4 text-blue-600" />;
  }
  if (type.includes('application') || type.includes('job')) {
    return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
  }
  return <Bell className="w-4 h-4 text-gray-600" />;
};

// Helper function to get notification priority badge
const getPriorityBadge = (priority: NotificationPriority) => {
  switch (priority) {
    case 'urgent':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Urgent</span>;
    case 'high':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">High</span>;
    case 'medium':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Medium</span>;
    case 'low':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Low</span>;
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
  
  const handleClick = () => {
    if (notification.href && !isExpired) {
      window.location.href = notification.href;
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-4 border-l-4 ${
        notification.isRead 
          ? "opacity-60 border-gray-200" 
          : notification.priority === 'urgent'
          ? "border-red-500 shadow-md ring-2 ring-red-100"
          : notification.priority === 'high'
          ? "border-orange-500 shadow-md"
          : notification.priority === 'medium'
          ? "border-yellow-500"
          : "border-blue-200"
      } ${notification.href && !isExpired ? "cursor-pointer" : ""}`}
      onClick={notification.href && !isExpired ? handleClick : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`flex-shrink-0 mt-0.5 ${
            notification.isRead ? 'opacity-50' : ''
          }`}>
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`font-medium text-gray-900 ${!notification.isRead ? 'font-bold' : ''}`}>
                  {notification.title}
                </h3>
                {getPriorityBadge(notification.priority)}
                {isExpired && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                    Expired
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-600 mt-1 text-sm leading-relaxed">{notification.message}</p>
            
            {/* Type label */}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">
                {getTypeLabel(notification.type)}
              </span>
              {/* Channels indicator */}
              {(notification.channels.email || notification.channels.sms || notification.channels.push) && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {[
                    notification.channels.email && 'Email',
                    notification.channels.sms && 'SMS',
                    notification.channels.push && 'Push'
                  ].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-3">
              {!notification.isRead && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notificationId);
                  }} 
                  disabled={actionLoading.has(notificationId)}
                  className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading.has(notificationId) ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Mark as read
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
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading.has(notificationId) ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <X className="w-3 h-3" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="text-xs text-gray-500 whitespace-nowrap">
            {formatNotificationDate(notification.createdAt)}
          </div>
          {notification.sentAt && (
            <div className="text-xs text-gray-400">
              Sent {formatNotificationDate(notification.sentAt)}
            </div>
          )}
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
    setLoading(true);
    try {
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'communicationNotifications' as keyof typeof API_ENDPOINTS,
        { method: 'GET' }
      );
      console.log("Notifications API - Response:", response);
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
      
      const responseData = await response.json();
      // Handle API response structure: { success, data: { notifications: [...], pagination:{...} } }
      const notificationsData = responseData?.data?.notifications || responseData?.notifications || responseData?.data || [];
      
      // Normalize notifications and filter out expired ones
      const normalizedNotifications = notificationsData
        .map((notif: any) => normalizeNotification(notif))
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
      console.error("Error loading notifications:", err);
     
      // For network errors, show empty state but don't redirect
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.warn("Network error - showing empty state");
        setItems([]);
      } else {
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
      const response = await makeClientAuthenticatedRequestWithPathSafe(
        'communicationNotificationRead' as keyof typeof API_ENDPOINTS,
        [id],
        {},
        { method: 'PUT' }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status}`);
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
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
      const response = await makeClientAuthenticatedRequestWithPathSafe(
        'communicationNotificationDelete' as keyof typeof API_ENDPOINTS,
        [id],
        {},
        { method: 'DELETE' }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.status}`);
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
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
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'communicationNotificationsReadAll' as keyof typeof API_ENDPOINTS,
        { method: 'PUT' }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.status}`);
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
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
      <div className="space-y-6">
        {/* Breadcrumbs Skeleton */}
        <Breadcrumbs
          className="text-sm text-gray-500 mb-4"
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Notifications" },
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

        {/* Notifications List Skeleton */}
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
          { label: "Notifications" },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-700">Notifications</h1>
            <p className="text-sm text-gray-500">
              {stats.unreadCount} unread {stats.urgentCount > 0 && `• ${stats.urgentCount} urgent`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stats.unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markAllLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {markAllLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Marking all as read...
                </>
              ) : (
                "Mark all as read"
              )}
            </button>
          )}
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Read status filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'all')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
          <label className="text-sm font-medium text-gray-700">Priority:</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as NotificationPriority | 'all')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base font-medium text-gray-900 mb-2">
              {items.length === 0 ? "No notifications" : "No notifications match your filters"}
            </h3>
            <p className="text-gray-500 text-sm">
              {items.length === 0 
                ? "You're all caught up! No new notifications." 
                : "Try adjusting your filters to see more notifications."}
            </p>
            {items.length > 0 && filteredItems.length === 0 && (
              <button
                onClick={() => {
                  setFilter('all');
                  setTypeFilter('all');
                  setPriorityFilter('all');
                }}
                className="mt-4 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
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
  );
}
