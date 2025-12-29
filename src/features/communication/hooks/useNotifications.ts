"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

// ============================================================================
// Types & Interfaces
// ============================================================================

export type NotificationType =
  // Bookings
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_completed"
  | "booking_in_progress"
  | "booking_confirmation_needed"
  | "booking_pending_soon"
  | "booking_overdue_completion"
  | "booking_overdue_admin_alert"
  // Jobs
  | "job_application"
  | "application_status_update"
  | "job_posted"
  | "job_digest"
  | "job_application_followup"
  // Messages
  | "message_received"
  | "message_moderation_flag"
  | "message_policy_warning"
  // Payments
  | "payment_received"
  | "payment_failed"
  // Subscriptions
  | "subscription_renewal"
  | "subscription_cancelled"
  | "subscription_dunning_reminder"
  | "subscription_expiring_soon"
  // Referrals
  | "referral_reward"
  | "referral_tier_upgraded"
  | "referral_nudge"
  // Academy
  | "course_enrollment"
  | "academy_not_started"
  | "academy_progress_stalled"
  | "academy_certificate_pending"
  // Orders
  | "order_confirmation"
  | "order_payment_pending"
  | "order_sla_alert"
  | "order_delivery_confirmation"
  | "order_delivery_late_alert"
  | "order_auto_delivered"
  | "supplies_reorder_reminder"
  // Rentals
  | "rental_due_soon"
  | "rental_overdue"
  // Finance
  | "loan_repayment_due"
  | "loan_repayment_overdue"
  | "salary_advance_due"
  | "salary_advance_overdue"
  // Escrow
  | "escrow_dispute_unresolved"
  | "escrow_dispute_evidence_needed"
  // Support
  | "livechat_sla_alert"
  // System
  | "system_announcement"
  // Security
  | "security_alert"
  | "login_alert"
  // Marketing
  | "marketing_reengagement"
  | "marketing_weekly_digest"
  // Onboarding
  | "welcome_followup_day2"
  | "welcome_followup_day7"
  | "provider_activation_nudge";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface NotificationChannels {
  inApp?: boolean;
  email?: boolean;
  sms?: boolean;
  push?: boolean;
}

export interface Notification {
  _id?: string;
  id?: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead?: boolean;
  readAt?: Date | string;
  priority?: NotificationPriority;
  channels?: NotificationChannels;
  scheduledFor?: Date | string;
  sentAt?: Date | string;
  expiresAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  href?: string;
}

export interface FCMDevice {
  _id?: string;
  id?: string;
  token: string;
  deviceName?: string;
  deviceType?: "web" | "android" | "ios";
  browser?: string;
  os?: string;
  lastUsed?: Date | string;
  createdAt?: Date | string;
  isActive?: boolean;
}

export interface NotificationSettings {
  push?: {
    enabled?: boolean;
    newMessages?: boolean;
    jobMatches?: boolean;
    bookingUpdates?: boolean;
    paymentUpdates?: boolean;
    referralUpdates?: boolean;
    systemUpdates?: boolean;
    marketing?: boolean;
  };
  email?: {
    enabled?: boolean;
    newMessages?: boolean;
    jobMatches?: boolean;
    bookingUpdates?: boolean;
    paymentUpdates?: boolean;
    referralUpdates?: boolean;
    systemUpdates?: boolean;
    marketing?: boolean;
    weeklyDigest?: boolean;
    monthlyReport?: boolean;
  };
  sms?: {
    enabled?: boolean;
    urgentMessages?: boolean;
    bookingReminders?: boolean;
    paymentAlerts?: boolean;
    securityAlerts?: boolean;
  };
  quietHours?: {
    enabled?: boolean;
    start?: string;
    end?: string;
    timezone?: string;
  };
}

export interface NotificationParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
}

export interface PaginationInfo {
  current: number;
  pages: number;
  total: number;
  limit: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildUrl(endpoint: string, pathParams?: Record<string, string>, queryParams?: Record<string, string>): string {
  let url = `${API_BASE_URL}${endpoint}`;
  
  // Replace path parameters
  if (pathParams) {
    Object.entries(pathParams).forEach(([key, value]) => {
      url = url.replace(`[${key}]`, encodeURIComponent(value));
    });
  }
  
  // Add query parameters
  if (queryParams && Object.keys(queryParams).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  return url;
}

// ============================================================================
// Main Hook: useNotifications
// ============================================================================

export function useNotifications(params: NotificationParams = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const mountedRef = useRef(true);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string> = {};
      if (params.page) queryParams.page = params.page.toString();
      if (params.limit) queryParams.limit = params.limit.toString();
      if (params.isRead !== undefined) queryParams.isRead = params.isRead.toString();
      if (params.type) queryParams.type = params.type;
      if (params.priority) queryParams.priority = params.priority;

      const url = buildUrl(API_ENDPOINTS.notifications, undefined, queryParams);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();
      const notificationsData = data?.data?.notifications || data?.notifications || data?.data || [];
      const paginationData = data?.data?.pagination || data?.pagination || null;

      if (mountedRef.current) {
        setNotifications(notificationsData);
        setPagination(paginationData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching notifications", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setNotifications([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [params.page, params.limit, params.isRead, params.type, params.priority]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!getApiToken()) return 0;

    try {
      const url = buildUrl(API_ENDPOINTS.notificationsUnreadCount);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (response.ok) {
        const data = await response.json();
        const count = data?.data?.count ?? data?.count ?? 0;
        if (mountedRef.current) {
          setUnreadCount(count);
        }
        return count;
      }
    } catch (err) {
      logger.error("Error fetching unread count", err instanceof Error ? err : new Error(String(err)));
    }
    return 0;
  }, []);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      const url = buildUrl(API_ENDPOINTS.notificationsMarkRead, { id: notificationId });
      const response = await fetch(url, createAuthFetchOptions({ method: "PUT" }));

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            (n._id === notificationId || n.id === notificationId)
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        return true;
      }
    } catch (err) {
      logger.error("Error marking notification as read", err instanceof Error ? err : new Error(String(err)));
    }
    return false;
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      const url = buildUrl(API_ENDPOINTS.notificationsMarkAllRead);
      const response = await fetch(url, createAuthFetchOptions({ method: "PUT" }));

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
        return true;
      }
    } catch (err) {
      logger.error("Error marking all notifications as read", err instanceof Error ? err : new Error(String(err)));
    }
    return false;
  }, []);

  // Delete single notification
  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      const url = buildUrl(API_ENDPOINTS.notificationsById, { id: notificationId });
      const response = await fetch(url, createAuthFetchOptions({ method: "DELETE" }));

      if (response.ok) {
        setNotifications((prev) => {
          const notification = prev.find((n) => n._id === notificationId || n.id === notificationId);
          if (notification && !notification.isRead) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
          return prev.filter((n) => n._id !== notificationId && n.id !== notificationId);
        });
        return true;
      }
    } catch (err) {
      logger.error("Error deleting notification", err instanceof Error ? err : new Error(String(err)));
    }
    return false;
  }, []);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async (): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      const url = buildUrl(API_ENDPOINTS.notifications);
      const response = await fetch(url, createAuthFetchOptions({ method: "DELETE" }));

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
        return true;
      }
    } catch (err) {
      logger.error("Error deleting all notifications", err instanceof Error ? err : new Error(String(err)));
    }
    return false;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();
    fetchUnreadCount();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    loading,
    error,
    pagination,
    unreadCount,
    refetch: fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  };
}

// ============================================================================
// Hook: useFCMDevices - Manage FCM Token Registration
// ============================================================================

export function useFCMDevices() {
  const [devices, setDevices] = useState<FCMDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Fetch registered devices
  const fetchDevices = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.notificationsFcmTokens);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch devices: ${response.status}`);
      }

      const data = await response.json();
      const devicesData = data?.data?.devices || data?.devices || data?.data || [];

      if (mountedRef.current) {
        setDevices(devicesData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching FCM devices", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setDevices([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Register new FCM token
  const registerToken = useCallback(async (
    token: string,
    deviceInfo?: { deviceName?: string; deviceType?: "web" | "android" | "ios"; browser?: string; os?: string }
  ): Promise<FCMDevice | null> => {
    if (!getApiToken()) return null;

    try {
      const url = buildUrl(API_ENDPOINTS.notificationsFcmToken);
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify({ token, ...deviceInfo }),
      }));

      if (response.ok) {
        const data = await response.json();
        const device = data?.data || data;
        if (mountedRef.current) {
          setDevices((prev) => {
            // Check if device already exists
            const exists = prev.some((d) => d.token === token);
            if (exists) {
              return prev.map((d) => (d.token === token ? device : d));
            }
            return [...prev, device];
          });
        }
        return device;
      }
    } catch (err) {
      logger.error("Error registering FCM token", err instanceof Error ? err : new Error(String(err)));
    }
    return null;
  }, []);

  // Remove FCM token
  const removeToken = useCallback(async (tokenId: string): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      const url = buildUrl(API_ENDPOINTS.notificationsFcmTokenById, { id: tokenId });
      const response = await fetch(url, createAuthFetchOptions({ method: "DELETE" }));

      if (response.ok) {
        if (mountedRef.current) {
          setDevices((prev) => prev.filter((d) => d._id !== tokenId && d.id !== tokenId));
        }
        return true;
      }
    } catch (err) {
      logger.error("Error removing FCM token", err instanceof Error ? err : new Error(String(err)));
    }
    return false;
  }, []);

  // Get device info from browser
  const getDeviceInfo = useCallback((): { deviceName: string; deviceType: "web" | "android" | "ios"; browser: string; os: string } => {
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
    
    // Detect browser
    let browser = "Unknown";
    if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari")) browser = "Safari";
    else if (userAgent.includes("Edge")) browser = "Edge";
    else if (userAgent.includes("Opera")) browser = "Opera";

    // Detect OS
    let os = "Unknown";
    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("Mac")) os = "macOS";
    else if (userAgent.includes("Linux")) os = "Linux";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iOS") || userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";

    // Detect device type
    let deviceType: "web" | "android" | "ios" = "web";
    if (userAgent.includes("Android")) deviceType = "android";
    else if (userAgent.includes("iOS") || userAgent.includes("iPhone") || userAgent.includes("iPad")) deviceType = "ios";

    return {
      deviceName: `${browser} on ${os}`,
      deviceType,
      browser,
      os,
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchDevices();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchDevices]);

  return {
    devices,
    loading,
    error,
    refetch: fetchDevices,
    registerToken,
    removeToken,
    getDeviceInfo,
  };
}

// ============================================================================
// Hook: useNotificationSettings - Manage Notification Preferences
// ============================================================================

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Fetch notification settings
  const fetchSettings = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.notificationsSettings);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch notification settings: ${response.status}`);
      }

      const data = await response.json();
      const settingsData = data?.data?.settings || data?.settings || data?.data || null;

      if (mountedRef.current) {
        setSettings(settingsData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching notification settings", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Check if a specific notification type is enabled
  const checkNotificationType = useCallback(async (type: NotificationType): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      const url = buildUrl(API_ENDPOINTS.notificationsCheckType, { type });
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (response.ok) {
        const data = await response.json();
        return data?.data?.enabled ?? data?.enabled ?? false;
      }
    } catch (err) {
      logger.error("Error checking notification type", err instanceof Error ? err : new Error(String(err)));
    }
    return false;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchSettings();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    checkNotificationType,
  };
}

// ============================================================================
// Hook: useNotificationAdmin - Admin Functions for Sending Notifications
// ============================================================================

export function useNotificationAdmin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Send notification to a specific user (admin only)
  const sendNotification = useCallback(async (payload: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    priority?: NotificationPriority;
    channels?: NotificationChannels;
    scheduledFor?: string;
  }): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.notificationsSend);
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(payload),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Failed to send notification: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error sending notification", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Send bulk notifications (admin only)
  const sendBulkNotifications = useCallback(async (payload: {
    userIds: string[];
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    priority?: NotificationPriority;
    channels?: NotificationChannels;
  }): Promise<{ success: number; failed: number } | null> => {
    if (!getApiToken()) return null;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.notificationsSendBulk);
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(payload),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Failed to send bulk notifications: ${response.status}`);
      }

      const data = await response.json();
      return data?.data || { success: 0, failed: 0 };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error sending bulk notifications", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Send system announcement (admin only)
  const sendAnnouncement = useCallback(async (payload: {
    title: string;
    message: string;
    priority?: NotificationPriority;
    targetRoles?: string[];
    expiresAt?: string;
  }): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.notificationsAnnouncement);
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(payload),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Failed to send announcement: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error sending announcement", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Send test notification to self
  const sendTestNotification = useCallback(async (payload?: {
    type?: NotificationType;
    title?: string;
    message?: string;
  }): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.notificationsTest);
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(payload || {}),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Failed to send test notification: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error sending test notification", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    sendNotification,
    sendBulkNotifications,
    sendAnnouncement,
    sendTestNotification,
  };
}

// ============================================================================
// Utility: Notification API Functions (for direct use without hooks)
// ============================================================================

export const NotificationAPI = {
  // Get notifications
  async getNotifications(params?: NotificationParams) {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.isRead !== undefined) queryParams.isRead = params.isRead.toString();
    if (params?.type) queryParams.type = params.type;
    if (params?.priority) queryParams.priority = params.priority;

    const url = buildUrl(API_ENDPOINTS.notifications, undefined, queryParams);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.status}`);
    }
    
    return response.json();
  },

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const url = buildUrl(API_ENDPOINTS.notificationsUnreadCount);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch unread count: ${response.status}`);
    }
    
    const data = await response.json();
    return data?.data?.count ?? data?.count ?? 0;
  },

  // Mark notification as read
  async markAsRead(notificationId: string) {
    const url = buildUrl(API_ENDPOINTS.notificationsMarkRead, { id: notificationId });
    const response = await fetch(url, createAuthFetchOptions({ method: "PUT" }));
    
    if (!response.ok) {
      throw new Error(`Failed to mark notification as read: ${response.status}`);
    }
    
    return response.json();
  },

  // Mark all as read
  async markAllAsRead() {
    const url = buildUrl(API_ENDPOINTS.notificationsMarkAllRead);
    const response = await fetch(url, createAuthFetchOptions({ method: "PUT" }));
    
    if (!response.ok) {
      throw new Error(`Failed to mark all notifications as read: ${response.status}`);
    }
    
    return response.json();
  },

  // Delete notification
  async deleteNotification(notificationId: string) {
    const url = buildUrl(API_ENDPOINTS.notificationsById, { id: notificationId });
    const response = await fetch(url, createAuthFetchOptions({ method: "DELETE" }));
    
    if (!response.ok) {
      throw new Error(`Failed to delete notification: ${response.status}`);
    }
    
    return response.json();
  },

  // Delete all notifications
  async deleteAllNotifications() {
    const url = buildUrl(API_ENDPOINTS.notifications);
    const response = await fetch(url, createAuthFetchOptions({ method: "DELETE" }));
    
    if (!response.ok) {
      throw new Error(`Failed to delete all notifications: ${response.status}`);
    }
    
    return response.json();
  },

  // Get FCM devices
  async getFCMDevices() {
    const url = buildUrl(API_ENDPOINTS.notificationsFcmTokens);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch FCM devices: ${response.status}`);
    }
    
    return response.json();
  },

  // Register FCM token
  async registerFCMToken(token: string, deviceInfo?: { deviceName?: string; deviceType?: string; browser?: string; os?: string }) {
    const url = buildUrl(API_ENDPOINTS.notificationsFcmToken);
    const response = await fetch(url, createAuthFetchOptions({
      method: "POST",
      body: JSON.stringify({ token, ...deviceInfo }),
    }));
    
    if (!response.ok) {
      throw new Error(`Failed to register FCM token: ${response.status}`);
    }
    
    return response.json();
  },

  // Remove FCM token
  async removeFCMToken(tokenId: string) {
    const url = buildUrl(API_ENDPOINTS.notificationsFcmTokenById, { id: tokenId });
    const response = await fetch(url, createAuthFetchOptions({ method: "DELETE" }));
    
    if (!response.ok) {
      throw new Error(`Failed to remove FCM token: ${response.status}`);
    }
    
    return response.json();
  },

  // Get notification settings
  async getSettings() {
    const url = buildUrl(API_ENDPOINTS.notificationsSettings);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch notification settings: ${response.status}`);
    }
    
    return response.json();
  },

  // Check notification type
  async checkType(type: NotificationType): Promise<boolean> {
    const url = buildUrl(API_ENDPOINTS.notificationsCheckType, { type });
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data?.data?.enabled ?? data?.enabled ?? false;
  },

  // Send test notification
  async sendTestNotification(payload?: { type?: NotificationType; title?: string; message?: string }) {
    const url = buildUrl(API_ENDPOINTS.notificationsTest);
    const response = await fetch(url, createAuthFetchOptions({
      method: "POST",
      body: JSON.stringify(payload || {}),
    }));
    
    if (!response.ok) {
      throw new Error(`Failed to send test notification: ${response.status}`);
    }
    
    return response.json();
  },
};

export default useNotifications;

