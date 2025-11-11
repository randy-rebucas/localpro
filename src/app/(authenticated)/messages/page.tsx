"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Send, Check, Edit, Trash2, MessageSquare, MoreVertical, Paperclip, Smile, Phone, Video } from "lucide-react";
import { CLIENT_CONFIG } from "@/lib/env";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

// Communication Data Entities (from features/communication/data-entities.md)

export type MessageType = 'text' | 'image' | 'file' | 'system' | 'booking_update' | 'payment_update';

export type ConversationType = 'booking' | 'job_application' | 'support' | 'general' | 'agency';

export type ConversationStatus = 'active' | 'resolved' | 'closed' | 'archived';

export type ConversationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface MessageAttachment {
  filename: string;
  url: string;
  publicId?: string;
  mimeType: string;
  size: number;
}

export interface MessageMetadata {
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  replyTo?: string; // MessageId
}

export interface MessageReadBy {
  user: string; // UserId
  readAt: string; // Date ISO8601
}

export interface MessageReaction {
  user: string; // UserId
  emoji: string;
  timestamp: string; // Date ISO8601
}

export interface Message {
  _id: string;
  id?: string; // Alias for _id for convenience
  conversation: string; // ObjectId(Conversation)
  sender: string | {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: {
      url?: string;
      thumbnail?: string;
    };
    role?: string;
  }; // ObjectId(User) or populated user object
  content: string; // required
  type: MessageType; // default 'text'
  attachments?: MessageAttachment[];
  metadata?: MessageMetadata;
  readBy?: MessageReadBy[];
  reactions?: MessageReaction[];
  createdAt: string; // Date ISO8601
  updatedAt: string; // Date ISO8601
  // Computed/helper fields
  isFromUser?: boolean; // computed from sender vs current user
  isRead?: boolean; // computed from readBy array
  senderId?: string; // extracted from sender
  senderName?: string; // extracted from populated sender
}

export interface ConversationParticipant {
  user: string | {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: {
      url?: string;
      thumbnail?: string;
    };
    role?: string;
  }; // ObjectId(User) or populated user object
  role: 'client' | 'provider' | 'admin' | 'support';
  joinedAt: string; // Date ISO8601
  lastReadAt?: string; // Date ISO8601
}

export interface ConversationContext {
  bookingId?: string;
  jobId?: string;
  agencyId?: string;
  orderId?: string;
}

export interface LastMessage {
  content: string;
  sender: string; // UserId
  timestamp: string; // Date ISO8601
}

export interface Conversation {
  _id: string;
  id?: string; // Alias for _id for convenience
  participants: ConversationParticipant[];
  type: ConversationType; // default 'general'
  subject: string; // required
  context?: ConversationContext;
  status: ConversationStatus; // default 'active'
  priority: ConversationPriority; // default 'medium'
  tags?: string[];
  lastMessage?: LastMessage;
  isActive: boolean; // default true
  createdAt: string; // Date ISO8601
  updatedAt: string; // Date ISO8601
  // Computed/helper fields
  name?: string; // computed from participants
  avatar?: string; // computed from participants
  timestamp?: string; // computed from lastMessage or updatedAt
  unreadCount?: number; // computed
  messages?: Message[]; // loaded messages
  isGroup?: boolean; // computed from participants.length > 2
  isTyping?: boolean; // real-time state
  typingUsers?: string[]; // real-time state
}

// Notification Entity
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

export interface Notification {
  _id: string;
  id?: string; // Alias for _id for convenience
  user: string; // ObjectId(User)
  type: NotificationType;
  title: string; // required
  message: string; // required
  data?: Record<string, unknown>; // Mixed (context payload)
  isRead: boolean; // default false
  readAt?: string; // Date ISO8601
  priority: NotificationPriority; // default 'medium'
  channels: NotificationChannels;
  scheduledFor?: string | null; // Date ISO8601
  sentAt?: string | null; // Date ISO8601
  expiresAt?: string | null; // Date ISO8601
  createdAt: string; // Date ISO8601
  updatedAt: string; // Date ISO8601
}

// Helper functions to normalize data from API
const normalizeMessage = (message: Record<string, unknown>, currentUserId?: string): Message => {
  const sender = message.sender;
  const senderId = typeof sender === 'string' 
    ? sender 
    : (sender && typeof sender === 'object' && '_id' in sender && typeof sender._id === 'string' 
        ? sender._id 
        : undefined) || (message.senderId as string | undefined);
  
  let senderName: string;
  if (sender && typeof sender === 'object' && 'firstName' in sender) {
    const senderObj = sender as Record<string, unknown>;
    const firstName = typeof senderObj.firstName === 'string' ? senderObj.firstName : '';
    const lastName = typeof senderObj.lastName === 'string' ? senderObj.lastName : '';
    const email = typeof senderObj.email === 'string' ? senderObj.email : '';
    senderName = `${firstName} ${lastName}`.trim() || email || 'Unknown';
  } else {
    senderName = (typeof message.senderName === 'string' ? message.senderName : 'Unknown');
  }
  
  const messageId = typeof message._id === 'string' ? message._id : (typeof message.id === 'string' ? message.id : '');
  const messageIdAlias = typeof message.id === 'string' ? message.id : messageId;
  
  // Ensure sender is properly typed - use senderId as fallback string if sender is invalid
  let normalizedSender: string | { _id: string; firstName?: string; lastName?: string; email?: string; avatar?: { url?: string; thumbnail?: string }; role?: string };
  if (typeof sender === 'string') {
    normalizedSender = sender;
  } else if (sender && typeof sender === 'object' && '_id' in sender && typeof sender._id === 'string') {
    const senderObj = sender as Record<string, unknown>;
    normalizedSender = {
      _id: sender._id,
      firstName: typeof senderObj.firstName === 'string' ? senderObj.firstName : undefined,
      lastName: typeof senderObj.lastName === 'string' ? senderObj.lastName : undefined,
      email: typeof senderObj.email === 'string' ? senderObj.email : undefined,
      avatar: senderObj.avatar && typeof senderObj.avatar === 'object' ? {
        url: typeof (senderObj.avatar as Record<string, unknown>).url === 'string' ? (senderObj.avatar as Record<string, unknown>).url as string : undefined,
        thumbnail: typeof (senderObj.avatar as Record<string, unknown>).thumbnail === 'string' ? (senderObj.avatar as Record<string, unknown>).thumbnail as string : undefined
      } : undefined,
      role: typeof senderObj.role === 'string' ? senderObj.role : undefined
    };
  } else {
    normalizedSender = senderId || '';
  }
  
  // Safely extract typed values
  const readBy = Array.isArray(message.readBy) 
    ? message.readBy as MessageReadBy[]
    : [];
  const attachments = Array.isArray(message.attachments)
    ? message.attachments as MessageAttachment[]
    : [];
  const reactions = Array.isArray(message.reactions)
    ? message.reactions as MessageReaction[]
    : [];
  const messageType = (typeof message.type === 'string' && ['text', 'image', 'file', 'system', 'booking_update', 'payment_update'].includes(message.type))
    ? message.type as MessageType
    : 'text';
  const metadata = message.metadata && typeof message.metadata === 'object' && !Array.isArray(message.metadata)
    ? message.metadata as MessageMetadata
    : {};

  // Extract required fields
  const conversationId = typeof message.conversation === 'string' ? message.conversation : '';
  const content = typeof message.content === 'string' ? message.content : '';
  const createdAt = typeof message.createdAt === 'string' ? message.createdAt : new Date().toISOString();
  const updatedAt = typeof message.updatedAt === 'string' ? message.updatedAt : createdAt;

  return {
    _id: messageId,
    id: messageIdAlias,
    conversation: conversationId,
    sender: normalizedSender,
    content,
    type: messageType,
    attachments,
    metadata,
    readBy,
    reactions,
    createdAt,
    updatedAt,
    // Computed fields
    senderId,
    senderName,
    isFromUser: currentUserId ? senderId === currentUserId : (typeof message.isFromUser === 'boolean' ? message.isFromUser : false),
    isRead: readBy.some((r: MessageReadBy) => r.user === currentUserId) || (typeof message.isRead === 'boolean' ? message.isRead : false)
  };
};

const normalizeConversation = (conversation: Record<string, unknown>, currentUserId?: string): Conversation => {
  const convId = typeof conversation._id === 'string' ? conversation._id : (typeof conversation.id === 'string' ? conversation.id : '');
  const participants = Array.isArray(conversation.participants)
    ? conversation.participants as ConversationParticipant[]
    : [];
  
  // Compute name from participants (exclude current user)
  const otherParticipants = participants.filter((p: ConversationParticipant) => {
    const userId = typeof p.user === 'string' ? p.user : (typeof p.user === 'object' && p.user && '_id' in p.user && typeof p.user._id === 'string' ? p.user._id : undefined);
    return userId !== currentUserId;
  });
  
  let name = typeof conversation.subject === 'string' ? conversation.subject : (typeof conversation.name === 'string' ? conversation.name : 'Unknown');
  if (otherParticipants.length > 0) {
    const firstOther = otherParticipants[0];
    const otherName = typeof firstOther.user === 'object' && firstOther.user && '_id' in firstOther.user
      ? `${(firstOther.user as { firstName?: string }).firstName || ''} ${(firstOther.user as { lastName?: string }).lastName || ''}`.trim() || (firstOther.user as { email?: string }).email || 'Unknown'
      : 'Unknown';
    name = otherParticipants.length === 1 ? otherName : `${otherName} and ${otherParticipants.length - 1} others`;
  }
  
  // Compute avatar from first other participant
  const avatar = otherParticipants.length > 0 && typeof otherParticipants[0].user === 'object' && otherParticipants[0].user && '_id' in otherParticipants[0].user
    ? ((otherParticipants[0].user as { avatar?: { url?: string; thumbnail?: string } }).avatar?.url || (otherParticipants[0].user as { avatar?: { url?: string; thumbnail?: string } }).avatar?.thumbnail)
    : (typeof conversation.avatar === 'string' ? conversation.avatar : undefined);
  
  // Compute timestamp from lastMessage
  const lastMessageObj = conversation.lastMessage && typeof conversation.lastMessage === 'object' && !Array.isArray(conversation.lastMessage)
    ? conversation.lastMessage as Record<string, unknown>
    : null;
  const timestamp = (lastMessageObj && typeof lastMessageObj.timestamp === 'string' ? lastMessageObj.timestamp : null)
    || (typeof conversation.timestamp === 'string' ? conversation.timestamp : null)
    || (typeof conversation.updatedAt === 'string' ? conversation.updatedAt : null)
    || (typeof conversation.createdAt === 'string' ? conversation.createdAt : '');
  
  // Normalize messages if present
  const messages = Array.isArray(conversation.messages)
    ? conversation.messages.map((msg: unknown) => normalizeMessage(msg as Record<string, unknown>, currentUserId))
    : [];
  
  // Safely extract conversation type, status, priority
  const conversationType = (typeof conversation.type === 'string' && ['booking', 'job_application', 'support', 'general', 'agency'].includes(conversation.type))
    ? conversation.type as ConversationType
    : 'general';
  const conversationStatus = (typeof conversation.status === 'string' && ['active', 'resolved', 'closed', 'archived'].includes(conversation.status))
    ? conversation.status as ConversationStatus
    : 'active';
  const conversationPriority = (typeof conversation.priority === 'string' && ['low', 'medium', 'high', 'urgent'].includes(conversation.priority))
    ? conversation.priority as ConversationPriority
    : 'medium';
  const subject = typeof conversation.subject === 'string' ? conversation.subject : name;
  const unreadCountNum = typeof conversation.unreadCount === 'number' ? conversation.unreadCount : 0;
  
  // Build lastMessage
  let lastMessage: LastMessage | undefined;
  if (lastMessageObj && typeof lastMessageObj.content === 'string' && typeof lastMessageObj.sender === 'string' && typeof lastMessageObj.timestamp === 'string') {
    lastMessage = {
      content: lastMessageObj.content,
      sender: lastMessageObj.sender,
      timestamp: lastMessageObj.timestamp
    };
  } else if (messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    lastMessage = {
      content: lastMsg.content,
      sender: lastMsg.senderId || '',
      timestamp: lastMsg.createdAt
    };
  }
  
  // Extract required fields
  const createdAt = typeof conversation.createdAt === 'string' ? conversation.createdAt : new Date().toISOString();
  const updatedAt = typeof conversation.updatedAt === 'string' ? conversation.updatedAt : createdAt;

  return {
    _id: convId,
    id: convId,
    participants,
    type: conversationType,
    subject,
    status: conversationStatus,
    priority: conversationPriority,
    isActive: conversation.isActive !== false,
    createdAt,
    updatedAt,
    // Computed fields
    name,
    avatar,
    timestamp,
    unreadCount: unreadCountNum,
    messages,
    isGroup: participants.length > 2,
    lastMessage
  };
};

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showMobileConversations, setShowMobileConversations] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [messagePage, setMessagePage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  // Enhanced retry logic
  const retryWithBackoff = useCallback(async (fn: () => Promise<unknown>, maxRetries: number = 3) => {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await fn();
      } catch (err) {
        attempt++;
        if (attempt >= maxRetries) {
          throw err;
        }
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, []);

  // Check if user is authenticated before making API calls
  const checkAuthentication = useCallback(async () => {
      if (!getApiToken()) return false;
      
      try {
        const url = `${API_BASE_URL}${API_ENDPOINTS.authMe}`;
        const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
        
        if (!response.ok) {
          throw new Error(`Authentication failed: ${response.status}`);
        }
        
        const userData = await response.json();
        const user = userData?.data || userData;
        if (user?._id || user?.id) {
          setCurrentUserId(user._id || user.id);
        }
        
        return true;
      } catch (error) {
        logger.error('Check authentication error', error instanceof Error ? error : new Error(String(error)));
        return false;
      }
    }, []);

  // API Functions
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsRetrying(false);
    
    // Check authentication first
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
      setError('No session found. Please log in again.');
      setLoading(false);
      return;
    }
    
    try {
      await retryWithBackoff(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CLIENT_CONFIG.apiTimeout);
        
        const url = `${API_BASE_URL}${API_ENDPOINTS.communicationConversations}`;
        const response = await fetch(url, {
          ...createAuthFetchOptions({ method: 'GET' }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 401) {
            // Check if we have a session token
            const sessionToken = document.cookie
              .split(';')
              .find(c => c.trim().startsWith('session='))
              ?.split('=')[1];
            
            if (!sessionToken) {
              throw new Error('No session found. Please log in again.');
            } else {
              throw new Error('Session expired. Please log in again.');
            }
          }
          if (response.status === 403) {
            throw new Error('Access denied. You do not have permission to view conversations.');
          }
          if (response.status >= 500) {
            throw new Error('Server error. Please try again later.');
          }
          throw new Error(`Failed to load conversations: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        // Handle API response structure: { success, data: { conversations: [...], pagination:{...} } }
        const conversationsData = responseData?.data?.conversations || responseData?.conversations || responseData?.data || [];
        
        // Normalize conversations
        const normalizedConversations = conversationsData.map((conv: Record<string, unknown>) => normalizeConversation(conv, currentUserId));
        setConversations(normalizedConversations);
        setRetryCount(0); // Reset retry count on success
      });
    } catch (err) {
      logger.error('Error fetching conversations', err instanceof Error ? err : new Error(String(err)));
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(errorMessage);
      setConversations([]);
      
      // Auto-retry for network errors
      if (retryCount < 3 && (errorMessage.includes('network') || errorMessage.includes('timeout'))) {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
        
        retryTimeoutRef.current = setTimeout(() => {
          fetchConversations();
        }, Math.pow(2, retryCount) * 1000); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  }, [retryWithBackoff, retryCount, checkAuthentication, currentUserId]);

  const fetchConversation = useCallback(async (conversationId: string, page: number = 1) => {
    if (!getApiToken()) throw new Error('Not authenticated');
    
    try {
      const endpoint = API_ENDPOINTS.communicationConversationsById.replace('[id]', conversationId);
      const queryParams = new URLSearchParams({ page: page.toString(), limit: '20' }).toString();
      const url = `${API_BASE_URL}${endpoint}?${queryParams}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch conversation: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      // Handle API response structure and normalize
      const conversationData = responseData?.data || responseData;
    if (conversationData) {
      const normalized = normalizeConversation(conversationData as Record<string, unknown>, currentUserId);
      // Normalize messages if present
      if (normalized.messages) {
        normalized.messages = normalized.messages.map((msg: Message) => {
          // Messages are already normalized, but ensure they're in the correct format
          return msg;
        });
      }
      return normalized;
    }
    
    return conversationData;
    } catch (error) {
      logger.error('Error fetching conversation', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [currentUserId]);

  const loadMoreMessages = useCallback(async () => {
    if (!activeConversation || loadingMoreMessages || !hasMoreMessages) return;
    
    setLoadingMoreMessages(true);
    try {
      const nextPage = messagePage + 1;
      const convId = activeConversation.id || activeConversation._id;
      if (!convId) return;
      const data = await fetchConversation(convId, nextPage);
      
      if (data.messages && data.messages.length > 0) {
        // Normalize new messages
        const normalizedMessages = data.messages.map((msg: Record<string, unknown>) => normalizeMessage(msg, currentUserId));
        setActiveConversation(prev => 
          prev ? { 
            ...prev, 
            messages: [...normalizedMessages, ...(prev.messages || [])] 
          } : null
        );
        setMessagePage(nextPage);
        setHasMoreMessages(data.messages.length === 20); // Assuming 20 is the page size
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      logger.error('Error loading more messages', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoadingMoreMessages(false);
    }
  }, [activeConversation, loadingMoreMessages, hasMoreMessages, messagePage, fetchConversation, currentUserId]);

  // Notification functions
  const fetchUnreadCount = useCallback(async () => {
    if (!getApiToken()) return;
    
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.communicationUnreadCount}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch unread count: ${response.status}`);
      }
      
      const data = await response.json();
      setUnreadCount(data?.count || data?.data?.count || 0);
    } catch (err) {
      logger.error('Error fetching unread count', err instanceof Error ? err : new Error(String(err)));
    }
  }, []);


  // const markNotificationAsRead = useCallback(async (notificationId: string) => {
  //   try {
  //     await fetch(`/api/communication/notifications/${notificationId}/read`, createAuthFetchOptions({
  //       method: 'PUT'
  //     }));
  //     // Note: setNotifications and setUnreadCount are not available in scope
  //     // This function is defined but not used
  //   } catch (err) {
  //     console.error('Error marking notification as read:', err);
  //   }
  // }, []);

  const sendMessage = useCallback(async (conversationId: string, content: string, messageType: string = 'text', attachments: { name: string; type: string; size: number; file: File }[] = []) => {
    if (!getApiToken()) throw new Error('Not authenticated');
    
    try {
      setSendingMessage(true);
      const endpoint = API_ENDPOINTS.communicationConversationsMessages.replace('[id]', conversationId);
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify({ 
          content, 
          messageType,
          attachments 
        }),
      }));
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      const messageData = responseData?.data || responseData;
      const normalizedNewMessage = normalizeMessage(messageData, currentUserId);
      
      // Update conversations list
      setConversations(prev => 
        prev.map(conv => {
          const convId = conv.id || conv._id;
          if (convId === conversationId) {
            return {
              ...conv,
              lastMessage: {
                content: normalizedNewMessage.content,
                sender: normalizedNewMessage.senderId || '',
                timestamp: normalizedNewMessage.createdAt
              },
              timestamp: normalizedNewMessage.createdAt,
              updatedAt: normalizedNewMessage.createdAt,
              unreadCount: 0
            };
          }
          return conv;
        })
      );

      // Update active conversation
      const activeConvId = activeConversation?.id || activeConversation?._id;
      if (activeConvId === conversationId) {
        setActiveConversation(prev => 
          prev ? { 
            ...prev, 
            messages: [...(prev.messages || []), normalizedNewMessage],
            lastMessage: {
              content: normalizedNewMessage.content,
              sender: normalizedNewMessage.senderId || '',
              timestamp: normalizedNewMessage.createdAt
            },
            timestamp: normalizedNewMessage.createdAt,
            updatedAt: normalizedNewMessage.createdAt
          } : null
        );
      }
      
      return normalizedNewMessage;
    } catch (err) {
      logger.error('Error sending message', err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setSendingMessage(false);
    }
  }, [activeConversation, currentUserId]);

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!getApiToken()) return;
    
    try {
      const endpoint = API_ENDPOINTS.communicationConversationsRead.replace('[id]', conversationId);
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'PUT' }));
      
      if (!response.ok) {
        throw new Error(`Failed to mark conversation as read: ${response.status}`);
      }
    } catch {
      logger.warn('Failed to mark conversation as read', { conversationId });
    }
  }, []);

  const updateMessage = useCallback(async (conversationId: string, messageId: string, content: string) => {
    if (!getApiToken()) throw new Error('Not authenticated');
    
    try {
      const endpoint = API_ENDPOINTS.communicationConversationsMessagesById
        .replace('[id]', conversationId)
        .replace('[messageId]', messageId);
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify({ content }),
      }));
      
      if (!response.ok) {
        throw new Error(`Failed to update message: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      const updatedMessage = responseData?.data || responseData;
      
      // Update local state
      const activeConvId = activeConversation?.id || activeConversation?._id;
      if (activeConvId === conversationId) {
        setActiveConversation(prev => 
          prev ? {
            ...prev,
            messages: (prev.messages || []).map(msg => {
              const msgId = msg.id || msg._id;
              return msgId === messageId ? normalizeMessage({ ...msg, ...updatedMessage }, currentUserId) : msg;
            })
          } : null
        );
      }
    } catch (err) {
      logger.error('Error updating message', err instanceof Error ? err : new Error(String(err)), { messageId });
      throw err;
    }
  }, [activeConversation, currentUserId]);

  const deleteMessage = useCallback(async (conversationId: string, messageId: string) => {
    if (!getApiToken()) throw new Error('Not authenticated');
    
    try {
      const endpoint = API_ENDPOINTS.communicationConversationsMessagesById
        .replace('[id]', conversationId)
        .replace('[messageId]', messageId);
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'DELETE' }));
      
      if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.status} ${response.statusText}`);
      }
        
      // Update local state
      const activeConvId = activeConversation?.id || activeConversation?._id;
      if (activeConvId === conversationId) {
        setActiveConversation(prev => 
          prev ? {
            ...prev,
            messages: (prev.messages || []).filter(msg => {
              const msgId = msg.id || msg._id;
              return msgId !== messageId;
            })
          } : null
        );
      }
    } catch (err) {
      logger.error('Error deleting message', err instanceof Error ? err : new Error(String(err)), { messageId });
      throw err;
    }
  }, [activeConversation]);

  // Enhanced utility functions
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Real-time features
  const setupEventSource = useCallback(() => {
    // Clear any pending reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    try {
      const getCookie = (name: string) => {
        const match = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith(name + '='));
        return match ? decodeURIComponent(match.split('=')[1]) : '';
      };
      const apiToken = getCookie('api-token');
      if (!API_BASE_URL) {
        logger.error('API_BASE_URL is not configured');
        return;
      }
      const base = API_BASE_URL.replace(/\/$/, '');
      const path = (API_ENDPOINTS as Record<string, string>).communicationEvents || '/communication/events';
      const url = `${base}${path}${apiToken ? `?token=${encodeURIComponent(apiToken)}` : ''}`;

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'new_message':
              const normalizedMessage = normalizeMessage(data.message, currentUserId);
              const activeConvId = activeConversation?.id || activeConversation?._id;
              if (data.conversationId === activeConvId) {
                setActiveConversation(prev => 
                  prev ? { ...prev, messages: [...(prev.messages || []), normalizedMessage] } : null
                );
              }
              // Update conversations list
              setConversations(prev => 
                prev.map(conv => {
                  const convId = conv.id || conv._id;
                  if (data.conversationId === convId) {
                    return {
                      ...conv,
                      lastMessage: {
                        content: normalizedMessage.content,
                        sender: normalizedMessage.senderId || '',
                        timestamp: normalizedMessage.createdAt
                      },
                      timestamp: normalizedMessage.createdAt,
                      updatedAt: normalizedMessage.createdAt,
                      unreadCount: convId === activeConvId ? 0 : (conv.unreadCount || 0) + 1
                    };
                  }
                  return conv;
                })
              );
              break;
              
            case 'typing_start':
              if (data.conversationId === activeConversation?.id && data.userId !== 'current_user') {
                setConversations(prev => 
                  prev.map(conv => 
                    conv.id === data.conversationId 
                      ? { ...conv, isTyping: true, typingUsers: [...(conv.typingUsers || []), data.userId] }
                      : conv
                  )
                );
              }
              break;
              
            case 'typing_stop':
              if (data.conversationId === activeConversation?.id) {
                setConversations(prev => 
                  prev.map(conv => 
                    conv.id === data.conversationId 
                      ? { 
                          ...conv, 
                          isTyping: false, 
                          typingUsers: (conv.typingUsers || []).filter(id => id !== data.userId)
                        }
                      : conv
                  )
                );
              }
              break;
              
            case 'message_read':
              const activeReadConvId = activeConversation?.id || activeConversation?._id;
              if (data.conversationId === activeReadConvId) {
                setActiveConversation(prev => 
                  prev ? {
                    ...prev,
                    messages: (prev.messages || []).map(msg => {
                      const msgId = msg.id || msg._id;
                      return msgId === data.messageId ? { ...msg, isRead: true } : msg;
                    })
                  } : null
                );
              }
              break;
              
              case 'notification':
              setUnreadCount(prev => prev + 1);
              break;
              
            case 'unread_count_update':
              setUnreadCount(data.count);
              break;
          }
        } catch (err) {
          logger.error('Error parsing event data', err instanceof Error ? err : new Error(String(err)));
        }
      };
      
      eventSource.onerror = () => {
        const readyState = eventSource.readyState;
        const stateMessage = 
          readyState === EventSource.CONNECTING ? 'CONNECTING' :
          readyState === EventSource.OPEN ? 'OPEN' :
          readyState === EventSource.CLOSED ? 'CLOSED' : 'UNKNOWN';
        
        // Log more informative error details
        logger.warn('EventSource error', {
          readyState,
          stateMessage,
          url: eventSource.url,
          timestamp: new Date().toISOString()
        });
        
        // Clear any existing reconnect timeout to prevent multiple reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        // Only attempt reconnection if the connection is closed and we haven't exceeded max attempts
        if (readyState === EventSource.CLOSED && reconnectAttemptsRef.current < 5) {
          const delay = Math.min(5000 * Math.pow(2, reconnectAttemptsRef.current), 30000); // Exponential backoff, max 30s
          reconnectAttemptsRef.current += 1;
          
          logger.debug(`Attempting to reconnect EventSource (attempt ${reconnectAttemptsRef.current}/5) in ${delay}ms`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
              setupEventSource();
            }
          }, delay);
        } else if (reconnectAttemptsRef.current >= 5) {
          logger.error('EventSource: Max reconnection attempts reached. Manual refresh may be required.');
        }
      };
      
      // Reset reconnection attempts on successful connection
      eventSource.onopen = () => {
        reconnectAttemptsRef.current = 0;
        logger.debug('EventSource connected successfully');
      };
    } catch (err) {
      logger.error('Error setting up EventSource', err instanceof Error ? err : new Error(String(err)));
    }
  }, [activeConversation, currentUserId]);

  const handleTyping = useCallback((conversationId: string) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing start event
    if (getApiToken()) {
      const url = `${API_BASE_URL}${API_ENDPOINTS.communicationTyping}`;
      fetch(url, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify({ conversationId, type: 'start' })
      })).catch(err => logger.error('Error sending typing event', err instanceof Error ? err : new Error(String(err))));
    }
    
    setIsTyping(true);
    
    const timeout = setTimeout(() => {
      setIsTyping(false);
      // Send typing stop event
      if (getApiToken()) {
        const url = `${API_BASE_URL}${API_ENDPOINTS.communicationTyping}`;
        fetch(url, createAuthFetchOptions({
          method: 'POST',
          body: JSON.stringify({ conversationId, type: 'stop' })
        })).catch(err => logger.error('Error sending typing stop event', err instanceof Error ? err : new Error(String(err))));
      }
    }, 2000);
    
    typingTimeoutRef.current = timeout;
  }, []);

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!activeConversation) return;
    
    const attachments = Array.from(files).map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
      file: file
    }));
    
    const convId = activeConversation.id || activeConversation._id;
    if (!convId) return;
    try {
      await sendMessage(convId, '', 'file', attachments);
    } catch (err) {
      logger.error('Error uploading files', err instanceof Error ? err : new Error(String(err)));
    }
  }, [activeConversation, sendMessage]);

  const searchMessages = useCallback(async (query: string) => {
    if (!activeConversation || !query.trim() || !getApiToken()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const conversationId = activeConversation.id || activeConversation._id || '';
      const queryParams = new URLSearchParams({ conversationId, query }).toString();
      const url = `${API_BASE_URL}${API_ENDPOINTS.communicationSearch}?${queryParams}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
      
      if (!response.ok) {
        throw new Error(`Failed to search messages: ${response.status}`);
      }
      
      const data = await response.json();
      setSearchResults(data?.data || data || []);
    } catch (error) {
      logger.error('Error searching messages', error instanceof Error ? error : new Error(String(error)), { query });
      setSearchResults([]);
    }
  }, [activeConversation]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  }, []);

  // Search messages when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (messageSearchQuery.trim()) {
        searchMessages(messageSearchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [messageSearchQuery, searchMessages]);

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
    setupEventSource();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [fetchConversations, fetchUnreadCount, setupEventSource]);

  // Set initial active conversation when conversations are loaded
  useEffect(() => {
    if (conversations.length > 0 && !activeConversation) {
      // Check if there's a conversationId in the URL query params
      const conversationIdFromUrl = searchParams?.get('conversationId');
      if (conversationIdFromUrl) {
        // Find the conversation by ID
        const foundConversation = conversations.find(
          conv => (conv._id === conversationIdFromUrl || conv.id === conversationIdFromUrl)
        );
        if (foundConversation) {
          setActiveConversation(foundConversation);
          // Fetch full conversation details
          fetchConversation(conversationIdFromUrl).then(data => {
            if (data) {
              setActiveConversation(data);
            }
          }).catch(err => {
            logger.error('Error fetching conversation from URL', err instanceof Error ? err : new Error(String(err)));
          });
        } else {
          // Conversation not in list yet, try to fetch it directly
          fetchConversation(conversationIdFromUrl).then(data => {
            if (data) {
              setActiveConversation(data);
            }
          }).catch(err => {
            logger.error('Error fetching conversation from URL', err instanceof Error ? err : new Error(String(err)));
            // Fallback to first conversation
            setActiveConversation(conversations[0]);
          });
        }
      } else {
        setActiveConversation(conversations[0]);
      }
    }
  }, [conversations, activeConversation, searchParams, fetchConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages, scrollToBottom]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [typingTimeout]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !activeConversation || sendingMessage) return;

    const convId = activeConversation.id || activeConversation._id;
    if (!convId) return;
    try {
      await sendMessage(convId, newMessage);
      setNewMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  }, [newMessage, activeConversation, sendingMessage, sendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (activeConversation) {
      const convId = activeConversation.id || activeConversation._id;
      if (convId) {
        handleTyping(convId);
      }
    }
  }, [activeConversation, handleTyping]);

  const handleConversationSelect = useCallback(async (conversation: Conversation) => {
    const convId = conversation.id || conversation._id;
    setActiveConversation(conversation);
    setShowMobileConversations(false); // Close mobile menu on selection
    setMessagePage(1);
    setHasMoreMessages(true);
    if (convId) {
      await markAsRead(convId);
    }
    
    // Fetch full conversation details if not already loaded
    if (!conversation.messages || conversation.messages.length === 0) {
      try {
        if (convId) {
          const fullConversation = await fetchConversation(convId, 1);
          if (fullConversation) {
            setActiveConversation(fullConversation);
            setHasMoreMessages((fullConversation.messages?.length || 0) === 20);
          }
        }
      } catch (err) {
        logger.error('Error fetching conversation details', err instanceof Error ? err : new Error(String(err)));
      }
    }
  }, [markAsRead, fetchConversation]);

  // Scroll detection for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasMoreMessages && !loadingMoreMessages) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, loadingMoreMessages, loadMoreMessages]);

  const handleMessageEdit = useCallback(async (messageId: string, newContent: string) => {
    if (!activeConversation) return;
    
    const convId = activeConversation.id || activeConversation._id;
    if (!convId) return;
    
    try {
      await updateMessage(convId, messageId, newContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update message');
    }
  }, [activeConversation, updateMessage]);

  const handleMessageDelete = useCallback(async (messageId: string) => {
    if (!activeConversation) return;
    
    const convId = activeConversation.id || activeConversation._id;
    if (!convId) return;
    
    try {
      await deleteMessage(convId, messageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  }, [activeConversation, deleteMessage]);

  const filteredConversations = useMemo(() => {
    if (!Array.isArray(conversations)) {
      logger.warn('conversations is not an array', { type: typeof conversations });
      return [];
    }
    return conversations.filter(conv => {
      const convName = conv.name || conv.subject || 'Unknown';
      return convName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [conversations, searchQuery]);

  const memoizedMessages = useMemo(() => 
    activeConversation?.messages || [], 
    [activeConversation?.messages]
  );

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Check if it's an authentication error
    const isAuthError = error.includes('session') || error.includes('Authentication') || error.includes('log in');
    
    if (isAuthError) {
      // Redirect to auth page after a short delay
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
    }
    
    return (
      <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load conversations</h3>
          <p className="text-red-500 mb-4">{error}</p>
          
          {isAuthError && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Redirecting to login page...
              </p>
            </div>
          )}
          
          {isRetrying && !isAuthError && (
            <div className="mb-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                <span className="text-sm text-gray-500">Retrying... (Attempt {retryCount + 1}/3)</span>
              </div>
            </div>
          )}
          
          <div className="flex space-x-2">
            {!isAuthError && (
              <button 
                onClick={fetchConversations}
                disabled={isRetrying}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </button>
            )}
            {isAuthError && (
              <button 
                onClick={() => window.location.href = '/auth'}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Go to Login
              </button>
            )}
            {retryCount > 0 && !isAuthError && (
              <button 
                onClick={() => {
                  setRetryCount(0);
                  setError(null);
                  setIsRetrying(false);
                  if (retryTimeoutRef.current) {
                    clearTimeout(retryTimeoutRef.current);
                  }
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col lg:flex-row relative overflow-hidden">
      {/* Mobile overlay */}
      {showMobileConversations && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setShowMobileConversations(false)}
        />
      )}
      
      {/* Left Sidebar - Conversations */}
      <div className={`w-full lg:w-80 border-r border-gray-200 bg-gray-50 flex flex-col transition-transform duration-300 z-30 ${
        showMobileConversations ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Header */}
        <div className="p-5 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Messages</h1>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-white bg-red-500 rounded-full mt-0.5">
                    {unreadCount} unread
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMessageSearch(!showMessageSearch)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Search messages"
              >
                <Search className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => {/* TODO: Add new conversation */}}
                className="p-2 hover:bg-emerald-50 rounded-lg transition-colors text-emerald-600"
                title="New conversation"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Search Bar - Toggle between conversation and message search */}
          {!showMessageSearch ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm bg-white"
              />
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search messages..."
                value={messageSearchQuery}
                onChange={(e) => setMessageSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm bg-white"
              />
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto mb-3"></div>
              <p className="text-sm">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">No conversations found</p>
              <p className="text-xs text-gray-400 mt-1">Start a new conversation to begin messaging</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleConversationSelect(conversation)}
              className={`p-4 cursor-pointer transition-all duration-200 border-l-4 ${
                activeConversation?.id === conversation.id
                  ? "bg-white border-emerald-500 shadow-sm"
                  : "border-transparent hover:bg-white hover:shadow-sm"
              }`}
            >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                      <span className="text-sm font-semibold text-white">
                        {conversation.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    {(conversation.unreadCount || 0) > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-sm font-semibold truncate ${
                        activeConversation?.id === conversation.id ? 'text-gray-900' : 'text-gray-800'
                      }`}>
                        {conversation.name}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {conversation.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mb-1">
                      {typeof conversation.lastMessage === 'string' 
                        ? conversation.lastMessage 
                        : conversation.lastMessage?.content || 'No messages'}
                    </p>
                    <div className="flex items-center justify-between">
                      {conversation.isTyping && (
                        <span className="text-xs text-emerald-600 font-medium italic">typing...</span>
                      )}
                      {(conversation.unreadCount || 0) > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-2 text-xs font-semibold text-white bg-emerald-500 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Mobile menu button */}
        <button
          onClick={() => setShowMobileConversations(!showMobileConversations)}
          className="lg:hidden absolute top-4 left-4 z-10 p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-sm font-semibold text-white">
                      {activeConversation.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {activeConversation.name || activeConversation.subject}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {activeConversation.participants.length} participant{activeConversation.participants.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {/* TODO: Add call functionality */}}
                  className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Voice call"
                >
                  <Phone className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => {/* TODO: Add video call functionality */}}
                  className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Video call"
                >
                  <Video className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setShowMessageActions(!showMessageActions)}
                  className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title="More options"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white" onScroll={handleScroll}>
              {/* Search Results */}
              {showMessageSearch && searchResults.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Search Results ({searchResults.length})</h4>
                  <div className="space-y-2">
                    {searchResults.slice(0, 3).map((message) => (
                      <div key={message.id || message._id} className="text-sm text-blue-800 bg-white p-2 rounded border">
                        <span className="font-medium">{message.senderName}:</span> {message.content}
                      </div>
                    ))}
                    {searchResults.length > 3 && (
                      <p className="text-xs text-blue-600">...and {searchResults.length - 3} more results</p>
                    )}
                  </div>
                </div>
              )}
              
              {memoizedMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                    <p className="text-gray-500">Start the conversation by sending a message below.</p>
                  </div>
                </div>
              ) : (
                memoizedMessages.map((message, index) => {
                  const prevMessage = index > 0 ? memoizedMessages[index - 1] : null;
                  const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;
                  const showTimestamp = !prevMessage || 
                    new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 5 * 60 * 1000; // 5 minutes
                  
                  return (
                    <div 
                      key={message.id || message._id} 
                      className={`flex ${message.isFromUser ? "justify-end" : "justify-start"} group animate-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div className="relative max-w-xs sm:max-w-sm lg:max-w-md">
                        {showTimestamp && (
                          <div className="text-center text-xs text-gray-400 mb-2">
                            {new Date(message.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}
                        
                        <div className={`flex items-end gap-2 ${message.isFromUser ? "flex-row-reverse" : ""}`}>
                          {!message.isFromUser && showAvatar && (
                            <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                              <span className="text-xs font-semibold text-white">
                                {message.senderName?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                          )}
                          
                          <div className="relative group">
                            <div
                              className={`px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm ${
                                message.isFromUser
                                  ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:shadow-md"
                                  : "bg-white text-gray-900 border border-gray-200 hover:shadow-md"
                              }`}
                            >
                              {message.metadata?.replyTo && (
                                <div className={`text-xs mb-2 p-2 rounded-lg border-l-2 ${
                                  message.isFromUser ? "bg-emerald-400/30 border-emerald-300" : "bg-gray-100 border-gray-300"
                                }`}>
                                  <p className="truncate font-medium">Replying to message</p>
                                </div>
                              )}
                              
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                              
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {message.attachments.map((attachment, idx) => (
                                    <div key={idx} className="text-xs">
                                      <a 
                                        href={attachment.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="underline hover:no-underline"
                                      >
                                        📎 {attachment.filename}
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className={`flex items-center justify-end gap-1.5 mt-1.5 ${
                                message.isFromUser ? "text-emerald-50" : "text-gray-500"
                              }`}>
                                <span className="text-xs">
                                  {new Date(message.createdAt).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                {message.metadata?.isEdited && message.metadata.editedAt && (
                                  <span className="text-xs italic opacity-75">(edited)</span>
                                )}
                                {message.isFromUser && (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </div>
                            </div>
                            
                            {/* Message Actions - Only show for user's own messages */}
                            {message.isFromUser && (
                              <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex space-x-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1">
                                  <button
                                    onClick={() => {
                                      const newContent = prompt('Edit message:', message.content);
                                      const msgId = message.id || message._id;
                                      if (newContent && newContent !== message.content && msgId) {
                                        handleMessageEdit(msgId, newContent);
                                      }
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    title="Edit message"
                                  >
                                    <Edit className="w-3 h-3 text-gray-600" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const msgId = message.id || message._id;
                                      if (msgId && confirm('Are you sure you want to delete this message?')) {
                                        handleMessageDelete(msgId);
                                      }
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    title="Delete message"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-600" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {/* Typing indicator */}
              {activeConversation.isTyping && activeConversation.typingUsers && activeConversation.typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-600 font-medium">
                      {activeConversation.typingUsers.length === 1 
                        ? `${activeConversation.typingUsers[0]} is typing...`
                        : `${activeConversation.typingUsers.length} people are typing...`
                      }
                    </span>
                  </div>
                </div>
              )}
              
              {/* Load More Messages */}
              {hasMoreMessages && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={loadMoreMessages}
                    disabled={loadingMoreMessages}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    {loadingMoreMessages ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                        <span>Loading more messages...</span>
                      </div>
                    ) : (
                      'Load more messages'
                    )}
                  </button>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white shadow-lg">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Add emoji"
                >
                  <Smile className="w-4 h-4 text-gray-600" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={sendingMessage}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base bg-white"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-500/20"
                >
                  {sendingMessage ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.txt"
              />
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="mt-2 text-xs text-gray-500 italic">
                  You are typing...
                </div>
              )}
              
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-16 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
                  <div className="grid grid-cols-8 gap-2">
                    {['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '💯', '👏', '🙌', '😊', '😢'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
              <p className="text-gray-500">Choose a conversation from the sidebar to start messaging.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
