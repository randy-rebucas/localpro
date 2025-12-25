"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { Conversation, Message, Notification } from "@/types/communication";

export interface ConversationsParams {
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface ConversationsResponse {
  success?: boolean;
  data?: Conversation[];
  conversations?: Conversation[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
    count: number;
  };
}

export function useConversations(params: ConversationsParams = {}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ConversationsResponse["pagination"] | null>(null);
  const mountedRef = useRef(true);

  const fetchConversations = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.type) queryParams.append("type", params.type);
      if (params.status) queryParams.append("status", params.status);
      
      const page = params.page || 1;
      const limit = params.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      const url = `${API_BASE_URL}${API_ENDPOINTS.communicationConversations}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.status}`);
      }

      const data: ConversationsResponse | Conversation[] = await response.json();
      let conversationsData: Conversation[] = [];
      let paginationData = null;

      if (Array.isArray(data)) {
        conversationsData = data;
      } else if (data && typeof data === "object") {
        conversationsData = (data as ConversationsResponse).data || (data as ConversationsResponse).conversations || [];
        paginationData = (data as ConversationsResponse).pagination || null;
      }

      if (mountedRef.current) {
        setConversations(conversationsData);
        setPagination(paginationData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching conversations", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setConversations([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchConversations();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    pagination,
    refetch: fetchConversations,
  };
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.communicationConversationsMessages.replace("[id]", conversationId)}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const data = await response.json();
      const messagesData = data?.data || data?.messages || [];

      if (mountedRef.current) {
        setMessages(messagesData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching messages", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setMessages([]);
        setLoading(false);
      }
    }
  }, [conversationId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchMessages();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchMessages]);

  return {
    messages,
    loading,
    error,
    refetch: fetchMessages,
  };
}

/**
 * Legacy notification hook - prefer useNotifications from @/hooks/useNotifications
 * This hook maintains backward compatibility with the communication notifications endpoint
 */
export function useNotifications(params: { isRead?: boolean; page?: number; limit?: number } = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const mountedRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.isRead !== undefined) queryParams.append("isRead", params.isRead.toString());
      
      const page = params.page || 1;
      const limit = params.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      // Try new endpoint first, fallback to legacy
      let url = `${API_BASE_URL}${API_ENDPOINTS.notifications}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      let response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        // Fallback to legacy endpoint
        url = `${API_BASE_URL}${API_ENDPOINTS.communicationNotifications}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        response = await fetch(url, createAuthFetchOptions());
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();
      const notificationsData = data?.data?.notifications || data?.data || data?.notifications || [];

      // Fetch unread count using new endpoint with fallback
      try {
        let countUrl = `${API_BASE_URL}${API_ENDPOINTS.notificationsUnreadCount}`;
        let countResponse = await fetch(countUrl, createAuthFetchOptions());
        
        if (!countResponse.ok) {
          countUrl = `${API_BASE_URL}${API_ENDPOINTS.communicationNotificationCount}`;
          countResponse = await fetch(countUrl, createAuthFetchOptions());
        }
        
        if (countResponse.ok) {
          const countData = await countResponse.json();
          setUnreadCount(countData?.data?.count || countData?.count || 0);
        }
      } catch {
        // Ignore count fetch errors
      }

      if (mountedRef.current) {
        setNotifications(notificationsData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching notifications", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setNotifications([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
  };
}

