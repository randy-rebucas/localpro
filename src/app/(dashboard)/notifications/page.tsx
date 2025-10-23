"use client";

import { useEffect, useState, useCallback } from "react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { Skeleton, ListSkeleton } from "@/components/ui/loading";
import { 
  Bell, 
  RefreshCw
} from "lucide-react";
// import { useSession } from "@/hooks/useAuth";
// import { useAuthErrorHandler } from "@/lib/auth-error-handler";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  href?: string | null;
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

// Simple notification item component
const NotificationItem = ({ 
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
  const handleClick = () => {
    if (notification.href) {
      window.location.href = notification.href;
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 ${notification.read ? "opacity-60" : "shadow-md"} ${notification.href ? "cursor-pointer" : ""}`}
      onClick={notification.href ? handleClick : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className={`font-medium text-gray-900 ${!notification.read ? 'font-bold' : ''}`}>
            {notification.title}
          </h3>
          <p className="text-gray-600 mt-1 text-sm">{notification.message}</p>
          <div className="flex items-center gap-3 mt-2">
            {!notification.read && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }} 
                disabled={actionLoading.has(notification.id)}
                className="text-sm text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading.has(notification.id) ? "Loading..." : "Mark as read"}
              </button>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }} 
              disabled={actionLoading.has(notification.id)}
              className="text-sm text-gray-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading.has(notification.id) ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500 ml-4">
          {formatNotificationDate(notification.createdAt)}
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
  
  // const { data: session } = useSession();
  // const { handleAuthError } = useAuthErrorHandler();


  // Load notifications
  const load = useCallback(async () => {

    setLoading(true);
    try {
      const url = `/api/communication/notifications`;
      console.log("Fetching notifications from:", url);

      const response = await fetch(url);
      console.log("Notifications API - Response:", response);
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
      
      const data = await response.json();
      const notifications = data.notifications || [];
      // Sort notifications by date (newest first)
      const sortedNotifications = notifications.sort((a: NotificationItem, b: NotificationItem) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setItems(sortedNotifications);
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
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, read: true } : item
    ));
    
    try {
      const url = `/api/communication/notifications/${id}/read`;
      console.log("Marking notification as read:", url);
      
      const response = await fetch(url, {
        method: "PUT"
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status}`);
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
      // Revert optimistic update on error
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, read: false } : item
      ));
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
    const itemToDelete = items.find(item => item.id === id);
    
    // Optimistically update the UI first
    setItems(prev => prev.filter(item => item.id !== id));
    
    try {
      const url = `/api/communication/notifications/${id}`;
      console.log("Deleting notification:", url);
      
      const response = await fetch(url, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.status}`);
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
      // Revert optimistic update on error
      if (itemToDelete) {
        setItems(prev => [...prev, itemToDelete].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
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
    const unreadItems = items.filter(item => !item.read);
    if (unreadItems.length === 0) return;
    
    setMarkAllLoading(true);
    
    // Optimistically update the UI first
    setItems(prev => prev.map(item => ({ ...item, read: true })));
    
    try {
      const url = `/api/communication/notifications/read-all`;
      console.log("Marking all notifications as read:", url);
      
      const response = await fetch(url, {
        method: "PUT"
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.status}`);
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      // Revert optimistic update on error
      setItems(prev => prev.map(item => 
        unreadItems.some(unread => unread.id === item.id) 
          ? { ...item, read: false } 
          : item
      ));
    } finally {
      setMarkAllLoading(false);
    }
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
              {items.filter(item => !item.read).length} unread notifications
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {items.filter(item => !item.read).length > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markAllLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {markAllLoading ? "Marking all as read..." : "Mark all as read"}
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

      {/* Notifications List */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-medium text-gray-900 mb-1">No notifications</h3>
            <p className="text-gray-500">You&apos;re all caught up! No new notifications.</p>
          </div>
        ) : (
          items.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
              actionLoading={actionLoading}
            />
          ))
        )}
      </div>
    </div>
  );
}