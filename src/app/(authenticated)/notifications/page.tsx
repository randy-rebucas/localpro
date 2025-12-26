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
  Trash2,
  Headphones,
  Search,
  Grid3x3,
  List,
  ArrowUp,
  ArrowDown,
  Tag,
  Award
} from "lucide-react";
import Link from "next/link";
import { Broadcaster } from "@/components/broadcaster";
import { 
  useNotifications, 
  type NotificationType, 
  type NotificationPriority,
  type NotificationChannels
} from "@/hooks/useNotifications";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { useSession } from "@/hooks/useAuth";

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

export { type NotificationType, type NotificationPriority, type NotificationChannels };

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
      href = `/marketplace/bookings/${data.bookingId}`;
    } else if (typeof data.jobId === 'string') {
      href = `/marketplace/jobs/${data.jobId}`;
    } else if (typeof data.orderId === 'string') {
      href = `/marketplace/orders/${data.orderId}`;
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
    return { icon: <CheckCircle className="w-5 h-5" />, bgColor: "bg-accent/20", iconColor: "text-accent" };
  }
  if (type.includes('failed') || type.includes('cancelled') || type.includes('rejected')) {
    return { icon: <AlertCircle className="w-5 h-5" />, bgColor: "bg-red-100", iconColor: "text-red-600" };
  }
  if (type.includes('message')) {
    return { icon: <MessageSquare className="w-5 h-5" />, bgColor: "bg-primary/10", iconColor: "text-primary" };
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
      return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-red-100 text-red-700 border border-red-200">Urgent</span>;
    case 'high':
      return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">High</span>;
    case 'medium':
      return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">Medium</span>;
    case 'low':
      return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20">Low</span>;
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

  const getCardStyles = () => {
    if (notification.isRead) {
      return "bg-white border-gray-200 opacity-75";
    }
    switch (notification.priority) {
      case 'urgent':
        return "bg-white border-l-4 border-red-500 shadow-lg ring-1 ring-red-100";
      case 'high':
        return "bg-white border-l-4 border-orange-500 shadow-md ring-1 ring-orange-50";
      case 'medium':
        return "bg-white border-l-4 border-amber-500 shadow-sm";
      default:
        return "bg-white border-l-4 border-accent/30 shadow-sm";
    }
  };

  return (
    <div 
      className={`group relative rounded-xl transition-all duration-300 p-6 border ${getCardStyles()} ${
        notification.href && !isExpired ? "cursor-pointer hover:shadow-xl hover:-translate-y-0.5" : ""
      }`}
      onClick={notification.href && !isExpired ? handleClick : undefined}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-accent rounded-full animate-pulse shadow-sm shadow-accent/50" />
      )}
      
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${iconData.bgColor} flex items-center justify-center shadow-sm transform group-hover:scale-105 transition-transform ${notification.isRead ? 'opacity-50' : ''}`}>
          <div className={iconData.iconColor}>
            {iconData.icon}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className={`text-lg font-semibold text-gray-900 ${notification.isRead ? 'font-normal' : ''} line-clamp-2`}>
                  {notification.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {getPriorityBadge(notification.priority)}
                {isExpired && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    Expired
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Message */}
          <p className="text-sm text-gray-700 mb-4 leading-relaxed line-clamp-3">
            {notification.message}
          </p>
          
          {/* Metadata Row */}
          <div className="flex items-center gap-2 flex-wrap mb-4 pb-4 border-b border-gray-100">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200">
              {getTypeLabel(notification.type)}
            </span>
            {(notification.channels.email || notification.channels.sms || notification.channels.push) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-gray-600 bg-primary/5 border border-primary/20">
                <Mail className="w-3 h-3" />
                {[
                  notification.channels.email && 'Email',
                  notification.channels.sms && 'SMS',
                  notification.channels.push && 'Push'
                ].filter(Boolean).join(', ')}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-gray-500 bg-gray-50">
              <Clock className="w-3 h-3" />
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
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded-lg transition-all border border-accent/20 hover:border-accent/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading.has(notificationId) ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
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
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all border border-gray-200 hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading.has(notificationId) ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NotificationsPage() {
  useSession();
  
  // Use the new notifications hook
  const {
    notifications,
    loading,
    refetch: load,
    markAsRead: hookMarkAsRead,
    markAllAsRead: hookMarkAllAsRead,
    deleteNotification: hookDeleteNotification,
    deleteAllNotifications,
  } = useNotifications({ limit: 100 });

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "priority" | "type">("newest");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Sync notifications from hook to local state with normalization
  useEffect(() => {
    if (notifications) {
      const normalizedNotifications = notifications
        .map((notif) => normalizeNotification(notif as unknown as Record<string, unknown>))
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
    }
  }, [notifications]);

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
      const success = await hookMarkAsRead(id);
      if (!success) {
        throw new Error("Failed to mark notification as read");
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
      toast.error("Failed to mark notification as read");
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [hookMarkAsRead]);

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
      const success = await hookDeleteNotification(id);
      if (!success) {
        throw new Error("Failed to delete notification");
      }
      toast.success("Notification deleted");
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
      toast.error("Failed to delete notification");
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [items, hookDeleteNotification]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const unreadItems = items.filter(item => !item.isRead);
    if (unreadItems.length === 0) return;
    
    setMarkAllLoading(true);
    
    // Optimistically update the UI first
    const readAt = new Date().toISOString();
    setItems(prev => prev.map(item => ({ ...item, isRead: true, readAt })));
    
    try {
      const success = await hookMarkAllAsRead();
      if (!success) {
        throw new Error("Failed to mark all notifications as read");
      }
      toast.success("All notifications marked as read");
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
      toast.error("Failed to mark all notifications as read");
    } finally {
      setMarkAllLoading(false);
    }
  }, [items, hookMarkAllAsRead]);

  // Delete all notifications
  const handleDeleteAll = useCallback(async () => {
    if (!confirm("Are you sure you want to delete all notifications? This cannot be undone.")) {
      return;
    }
    
    try {
      const success = await deleteAllNotifications();
      if (success) {
        setItems([]);
        toast.success("All notifications deleted");
      } else {
        toast.error("Failed to delete all notifications");
      }
    } catch (err) {
      logger.error("Error deleting all notifications", err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to delete all notifications");
    }
  }, [deleteAllNotifications]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Filter and sort notifications based on current filters
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => {
      // Filter by read status
      if (filter === 'unread' && item.isRead) return false;
      if (filter === 'read' && !item.isRead) return false;
      
      // Filter by type
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      
      // Filter by priority
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
      
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesMessage = item.message.toLowerCase().includes(query);
        const matchesType = getTypeLabel(item.type).toLowerCase().includes(query);
        if (!matchesTitle && !matchesMessage && !matchesType) return false;
      }
      
      return true;
    });

    // Sort notifications
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'newest':
        case 'oldest':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'priority':
          const priorityOrder: Record<NotificationPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
          comparison = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [items, filter, typeFilter, priorityFilter, searchQuery, sortBy, sortOrder]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filter !== 'all') count++;
    if (typeFilter !== 'all') count++;
    if (priorityFilter !== 'all') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [filter, typeFilter, priorityFilter, searchQuery]);

  const clearFilters = useCallback(() => {
    setFilter('all');
    setTypeFilter('all');
    setPriorityFilter('all');
    setSearchInput('');
    setSearchQuery('');
  }, []);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent/10/30 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent/10/30 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-0">
        {/* Broadcaster - Only shown for clients */}
        <Broadcaster />

        {/* Header Section - Following Reference Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Notifications — Stay Updated
              </h1>
              <p className="text-gray-600">
                {stats.unreadCount > 0 ? (
                  <span className="font-medium text-accent">{stats.unreadCount} unread notification{stats.unreadCount !== 1 ? 's' : ''}</span>
                ) : (
                  <span>All caught up! No new notifications.</span>
                )}
                {stats.urgentCount > 0 && (
                  <>
                    <span className="text-gray-400 mx-2">•</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {stats.urgentCount} urgent
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
              {stats.unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={markAllLoading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent/90 rounded-lg hover:from-accent/90 hover:to-accent transition-all shadow-lg shadow-accent/30 hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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

              {items.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-700 bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-lg hover:from-red-100 hover:to-red-200 hover:border-red-300 transition-all shadow-lg shadow-red-200/30 hover:shadow-xl hover:scale-105"
                  title="Delete all notifications"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
              )}

              <button
                onClick={load}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-lg hover:from-gray-50 hover:to-gray-100 hover:border-gray-300 transition-all shadow-lg shadow-gray-200/30 hover:shadow-xl hover:scale-105"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Links Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-b border-gray-200 pb-4">
            <Link
              href="/messages"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <MessageSquare className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Messages</span>
            </Link>
            <Link
              href="/favorites"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <Bell className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Favorites</span>
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <Headphones className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Support</span>
            </Link>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Filter Sidebar */}
            <aside className={`lg:w-[280px] flex-shrink-0 ${filterDrawerOpen ? "block" : "hidden lg:block"}`}>
              {/* Mobile Overlay */}
              {filterDrawerOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  onClick={() => setFilterDrawerOpen(false)}
                />
              )}

              <div
                className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24 ${
                  filterDrawerOpen
                    ? "fixed right-0 top-0 h-full w-80 z-50 overflow-y-auto lg:relative lg:w-auto lg:h-auto lg:z-auto"
                    : ""
                }`}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-accent/10 to-emerald-50 px-6 py-4 border-b border-accent/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-md">
                        <Filter className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                        <p className="text-xs text-gray-600">Refine your search</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFilterDrawerOpen(false)}
                      className="lg:hidden p-2 rounded-lg hover:bg-white/50 transition-colors"
                      aria-label="Close filters"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Filter Content */}
                <div className="p-6 space-y-8">
                  {/* Read Status Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                      <label className="text-sm font-semibold text-gray-900">Status</label>
                    </div>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
                      className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-gray-700"
                    >
                      <option value="all">All Status</option>
                      <option value="unread">Unread</option>
                      <option value="read">Read</option>
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-accent" />
                      <label className="text-sm font-semibold text-gray-900">Type</label>
                    </div>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'all')}
                      className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-gray-700"
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

                  {/* Priority Filter */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-accent" />
                      <label className="text-sm font-semibold text-gray-900">Priority</label>
                    </div>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value as NotificationPriority | 'all')}
                      className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-gray-700"
                    >
                      <option value="all">All Priorities</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  {/* Clear Filters Button */}
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all border-2 border-transparent hover:border-gray-300 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {/* Mobile Filter Button */}
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setFilterDrawerOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                  aria-label="Open filters"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-accent text-white rounded-full text-xs font-semibold">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Controls Bar */}
              <div className="mb-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Search */}
                    <div className="relative w-full sm:w-[70%]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search notifications..."
                        className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all text-gray-700"
                        aria-label="Search notifications"
                      />
                      {searchInput.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchInput("");
                            setSearchQuery("");
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                          aria-label="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Sort Controls */}
                    <div className="flex items-center gap-2 w-full sm:w-[20%]">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "priority" | "type")}
                          className="flex-1 min-w-0 px-2.5 py-2 text-xs font-medium border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all text-gray-700 cursor-pointer"
                          aria-label="Sort notifications by"
                        >
                          <option value="newest">Date</option>
                          <option value="priority">Priority</option>
                          <option value="type">Type</option>
                        </select>
                        <button
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          className="p-2 border border-gray-300 rounded-lg bg-white hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all text-gray-700 cursor-pointer flex-shrink-0"
                          aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                          title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                        >
                          {sortOrder === 'asc' ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Display Mode Toggle */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-full sm:w-[10%] justify-center sm:justify-start">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all duration-200 ${
                          viewMode === 'grid'
                            ? 'bg-white text-emerald-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="Grid View"
                        aria-label="Switch to grid view"
                      >
                        <Grid3x3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all duration-200 ${
                          viewMode === 'list'
                            ? 'bg-white text-emerald-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="List View"
                        aria-label="Switch to list view"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              {filteredItems.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border-2 border-gray-200 shadow-sm">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border-2 border-gray-200">
                <Bell className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {items.length === 0 ? "All caught up!" : "No matching notifications"}
              </h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                {items.length === 0 
                  ? "You're all set! No new notifications at this time." 
                  : "Try adjusting your filters to see more notifications."}
              </p>
              {items.length > 0 && filteredItems.length === 0 && (
                <button
                  onClick={() => {
                    setFilter('all');
                    setTypeFilter('all');
                    setPriorityFilter('all');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded-lg transition-all border border-accent/30 hover:border-accent/50"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Results count */}
              <div className="mb-2 px-1">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-semibold text-gray-700">{filteredItems.length}</span> notification{filteredItems.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              {/* Notifications grid */}
              <div className="space-y-3">
                {filteredItems.map((notification) => {
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
                })}
              </div>
            </>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
