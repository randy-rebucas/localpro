"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Search, Send, Check, Edit, Trash2, MessageSquare, MoreVertical, Paperclip, Smile, Phone, Video, Mic, MicOff, Minimize2 } from "lucide-react";
import { CLIENT_CONFIG } from "@/lib/env";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { CommunicationAPI } from "@/lib/communication-utils";
import { Broadcaster } from "@/components/broadcaster";

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
  senderAvatar?: string; // extracted from sender avatar
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

// Helper functions to normalize data from API
const normalizeMessage = (message: Record<string, unknown>, currentUserId?: string): Message => {
  const sender = message.sender;
  const senderId = typeof sender === 'string' 
    ? sender 
    : (sender && typeof sender === 'object' && '_id' in sender && typeof sender._id === 'string' 
        ? sender._id 
        : undefined) || (message.senderId as string | undefined);
  
  let senderName: string;
  let senderAvatar: string | undefined;
  if (sender && typeof sender === 'object' && 'firstName' in sender) {
    const senderObj = sender as Record<string, unknown>;
    const firstName = typeof senderObj.firstName === 'string' ? senderObj.firstName : '';
    const lastName = typeof senderObj.lastName === 'string' ? senderObj.lastName : '';
    const email = typeof senderObj.email === 'string' ? senderObj.email : '';
    senderName = `${firstName} ${lastName}`.trim() || email || 'Unknown';
    
    // Extract avatar from profile.avatar or direct avatar
    const profile = senderObj.profile && typeof senderObj.profile === 'object' ? senderObj.profile as Record<string, unknown> : null;
    const avatarFromProfile = profile?.avatar && typeof profile.avatar === 'object' ? profile.avatar as Record<string, unknown> : null;
    const avatarDirect = senderObj.avatar && typeof senderObj.avatar === 'object' ? senderObj.avatar as Record<string, unknown> : null;
    const avatarSource = avatarFromProfile || avatarDirect;
    if (avatarSource) {
      senderAvatar = typeof avatarSource.url === 'string' ? avatarSource.url : 
                    (typeof avatarSource.thumbnail === 'string' ? avatarSource.thumbnail : undefined);
    }
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
    
    // Check for avatar in profile.avatar (actual API structure) or direct avatar
    let avatarObj: { url?: string; thumbnail?: string } | undefined;
    const profile = senderObj.profile && typeof senderObj.profile === 'object' ? senderObj.profile as Record<string, unknown> : null;
    const avatarFromProfile = profile?.avatar && typeof profile.avatar === 'object' ? profile.avatar as Record<string, unknown> : null;
    const avatarDirect = senderObj.avatar && typeof senderObj.avatar === 'object' ? senderObj.avatar as Record<string, unknown> : null;
    
    const avatarSource = avatarFromProfile || avatarDirect;
    if (avatarSource) {
      avatarObj = {
        url: typeof avatarSource.url === 'string' ? avatarSource.url : undefined,
        thumbnail: typeof avatarSource.thumbnail === 'string' ? avatarSource.thumbnail : undefined
      };
    }
    
    normalizedSender = {
      _id: sender._id,
      firstName: typeof senderObj.firstName === 'string' ? senderObj.firstName : undefined,
      lastName: typeof senderObj.lastName === 'string' ? senderObj.lastName : undefined,
      email: typeof senderObj.email === 'string' ? senderObj.email : undefined,
      avatar: avatarObj,
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
    senderAvatar,
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
  // Check for avatar in user.profile.avatar (as per API response structure)
  let avatar: string | undefined;
  if (otherParticipants.length > 0 && typeof otherParticipants[0].user === 'object' && otherParticipants[0].user && '_id' in otherParticipants[0].user) {
    const userObj = otherParticipants[0].user as { 
      profile?: { 
        avatar?: { 
          url?: string; 
          thumbnail?: string;
        } 
      };
      avatar?: { 
        url?: string; 
        thumbnail?: string;
      };
    };
    // Try profile.avatar first (as per API response), then fallback to direct avatar
    avatar = userObj.profile?.avatar?.url || userObj.profile?.avatar?.thumbnail || userObj.avatar?.url || userObj.avatar?.thumbnail;
  }
  if (!avatar && typeof conversation.avatar === 'string') {
    avatar = conversation.avatar;
  }
  
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
  if (lastMessageObj && typeof lastMessageObj.content === 'string' && typeof lastMessageObj.timestamp === 'string') {
    // Handle sender as either string (ID) or full user object
    let senderId: string = '';
    if (typeof lastMessageObj.sender === 'string') {
      senderId = lastMessageObj.sender;
    } else if (lastMessageObj.sender && typeof lastMessageObj.sender === 'object' && '_id' in lastMessageObj.sender) {
      senderId = typeof (lastMessageObj.sender as { _id?: unknown })._id === 'string' 
        ? (lastMessageObj.sender as { _id: string })._id 
        : '';
    }
    
    lastMessage = {
      content: lastMessageObj.content,
      sender: senderId,
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
  const router = useRouter();
  const pathname = usePathname();
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
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [messagePage, setMessagePage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  
  // Call state
  const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'active' | 'ended'>('idle');
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  // const [isRemoteVideoEnabled, setIsRemoteVideoEnabled] = useState(true); // Reserved for future use
  // const [isRemoteAudioEnabled, setIsRemoteAudioEnabled] = useState(true); // Reserved for future use
  const [isMinimized, setIsMinimized] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
        // Handle API response structure: { success, count, total, page, pages, data: [...] }
        // The data field is an array of conversations directly
        const conversationsData = Array.isArray(responseData?.data) 
          ? responseData.data 
          : (responseData?.data?.conversations || responseData?.conversations || []);
        
        // Normalize conversations
        const normalizedConversations = conversationsData
          .map((conv: Record<string, unknown>) => normalizeConversation(conv, currentUserId))
          .sort((a: Conversation, b: Conversation) => {
            // Sort by most recent (updatedAt or timestamp)
            const dateA = new Date(a.updatedAt || a.timestamp || a.createdAt || 0).getTime();
            const dateB = new Date(b.updatedAt || b.timestamp || b.createdAt || 0).getTime();
            return dateB - dateA; // Most recent first
          });
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

  // Fetch conversation details (for header/red box)
  const fetchConversationDetails = useCallback(async (conversationId: string) => {
    if (!getApiToken()) throw new Error('Not authenticated');
    
    try {
      const endpoint = API_ENDPOINTS.communicationConversationsById.replace('[id]', conversationId);
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch conversation details: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      const conversationData = responseData?.data || responseData?.conversation || responseData;
      
      if (!conversationData) {
        throw new Error('No conversation data received from API');
      }
      
      const normalized = normalizeConversation(conversationData as Record<string, unknown>, currentUserId);
      return normalized;
    } catch (error) {
      logger.error('Error fetching conversation details', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, [currentUserId]);

  // Fetch messages for a conversation (for message area/green box)
  const fetchConversationMessages = useCallback(async (conversationId: string, page: number = 1, limit: number = 50) => {
    if (!getApiToken()) throw new Error('Not authenticated');
    
    try {
      const endpoint = API_ENDPOINTS.communicationConversationsMessages.replace('[id]', conversationId);
      const queryParams = new URLSearchParams({ 
        page: page.toString(), 
        limit: limit.toString(),
        includeDeleted: 'false'
      }).toString();
      const url = `${API_BASE_URL}${endpoint}?${queryParams}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      // Handle API response structure: data is directly the array of messages
      const messagesData = responseData?.data || responseData?.messages || [];
      const messagesArray = Array.isArray(messagesData) ? messagesData : [];
      
      // Normalize messages
      const normalizedMessages = messagesArray
        .map((msg: unknown) => normalizeMessage(msg as Record<string, unknown>, currentUserId))
        .sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateA - dateB; // Sort oldest to newest
        });
      
      logger.debug('Fetched messages', {
        conversationId,
        messageCount: normalizedMessages.length,
        page,
        limit
      });
      
      return normalizedMessages;
    } catch (error) {
      logger.error('Error fetching messages', error instanceof Error ? error : new Error(String(error)));
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
      
      // Fetch more messages using the messages endpoint
      const newMessages = await fetchConversationMessages(convId, nextPage, 50);
      
      if (newMessages && newMessages.length > 0) {
        setActiveConversation(prev => {
          if (!prev) return null;
          const existingMessages = prev.messages || [];
          // Merge and deduplicate messages (prepend older messages)
          const existingIds = new Set(existingMessages.map((msg: Message) => msg.id || msg._id));
          const uniqueNewMessages = newMessages.filter((msg: Message) => !existingIds.has(msg.id || msg._id));
          const merged = [...uniqueNewMessages, ...existingMessages].sort((a: Message, b: Message) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateA - dateB; // Sort oldest to newest
          });
          return { ...prev, messages: merged };
        });
        
        setMessagePage(nextPage);
        setHasMoreMessages(newMessages.length === 50);
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      logger.error('Error loading more messages', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoadingMoreMessages(false);
    }
  }, [activeConversation, loadingMoreMessages, hasMoreMessages, messagePage, fetchConversationMessages]);

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

  // Enhanced utility functions
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

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
      
      // Update conversations list and move to top
      setConversations(prev => {
        const updated = prev.map(conv => {
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
        });
        // Sort by most recent
        return updated.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.timestamp || a.createdAt || 0).getTime();
          const dateB = new Date(b.updatedAt || b.timestamp || b.createdAt || 0).getTime();
          return dateB - dateA; // Most recent first
        });
      });

      // Update active conversation
      const activeConvId = activeConversation?.id || activeConversation?._id;
      if (activeConvId === conversationId) {
        setActiveConversation(prev => {
          if (!prev) return null;
          const existingMessages = prev.messages || [];
          // Check if message already exists (avoid duplicates)
          const messageExists = existingMessages.some(
            msg => (msg.id || msg._id) === (normalizedNewMessage.id || normalizedNewMessage._id)
          );
          if (messageExists) {
            return prev;
          }
          return { 
            ...prev, 
            messages: [...existingMessages, normalizedNewMessage].sort((a, b) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return dateA - dateB; // Sort oldest to newest
            }),
            lastMessage: {
              content: normalizedNewMessage.content,
              sender: normalizedNewMessage.senderId || '',
              timestamp: normalizedNewMessage.createdAt
            },
            timestamp: normalizedNewMessage.createdAt,
            updatedAt: normalizedNewMessage.createdAt
          };
        });
        
        // Scroll to bottom after sending message
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
      
      return normalizedNewMessage;
    } catch (err) {
      logger.error('Error sending message', err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setSendingMessage(false);
    }
  }, [activeConversation, currentUserId, scrollToBottom]);

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!getApiToken()) return;
    
    try {
      const endpoint = API_ENDPOINTS.communicationConversationsRead.replace('[id]', conversationId);
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'PUT' }));
      
      if (!response.ok) {
        throw new Error(`Failed to mark conversation as read: ${response.status}`);
      }
      
      // Update local state - set unreadCount to 0
      setConversations(prev => 
        prev.map(conv => {
          const convId = conv.id || conv._id;
          if (convId === conversationId) {
            return { ...conv, unreadCount: 0 };
          }
          return conv;
        })
      );
      
      // Update active conversation
      setActiveConversation(prev => {
        if (!prev) return null;
        const convId = prev.id || prev._id;
        if (convId === conversationId) {
          return { ...prev, unreadCount: 0 };
        }
        return prev;
      });
      
      // Refresh unread count
      fetchUnreadCount();
    } catch {
      logger.warn('Failed to mark conversation as read', { conversationId });
    }
  }, [fetchUnreadCount]);

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
      const updatedMessageData = responseData?.data || responseData;
      const normalizedUpdatedMessage = normalizeMessage(updatedMessageData as Record<string, unknown>, currentUserId);
      
      // Update local state
      const activeConvId = activeConversation?.id || activeConversation?._id;
      if (activeConvId === conversationId) {
        setActiveConversation(prev => 
          prev ? {
            ...prev,
            messages: (prev.messages || []).map((msg: Message) => {
              const msgId = msg.id || msg._id;
              return msgId === messageId ? normalizedUpdatedMessage : msg;
            })
          } : null
        );
      }
      
      // Update conversations list last message if this was the last message
      setConversations(prev => 
        prev.map(conv => {
          const convIdCheck = conv.id || conv._id;
          if (convIdCheck === conversationId) {
            const lastMsg = conv.lastMessage;
            if (lastMsg && (lastMsg.sender === normalizedUpdatedMessage.senderId)) {
              // Check if this was the last message
              const messages = activeConversation?.messages;
              if (messages && messages.length > 0) {
                const lastMessageInList = messages[messages.length - 1];
                const msgId = lastMessageInList.id || lastMessageInList._id;
                if (msgId === messageId) {
                  return {
                    ...conv,
                    lastMessage: {
                      content: normalizedUpdatedMessage.content,
                      sender: normalizedUpdatedMessage.senderId || '',
                      timestamp: normalizedUpdatedMessage.updatedAt || normalizedUpdatedMessage.createdAt
                    }
                  };
                }
              }
            }
          }
          return conv;
        })
      );
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

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!getApiToken()) throw new Error('Not authenticated');
    
    try {
      const endpoint = API_ENDPOINTS.communicationConversationsById.replace('[id]', conversationId);
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'DELETE' }));
      
      if (!response.ok) {
        throw new Error(`Failed to delete conversation: ${response.status} ${response.statusText}`);
      }
        
      // Update local state
      setConversations(prev => prev.filter(conv => {
        const convId = conv.id || conv._id;
        return convId !== conversationId;
      }));
      
      // If deleted conversation was active, clear it
      const activeConvId = activeConversation?.id || activeConversation?._id;
      if (activeConvId === conversationId) {
        setActiveConversation(null);
      }
    } catch (err) {
      logger.error('Error deleting conversation', err instanceof Error ? err : new Error(String(err)), { conversationId });
      throw err;
    }
  }, [activeConversation]);

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
        logger.warn('API_BASE_URL is not configured. EventSource will not be initialized.');
        return;
      }
      const base = API_BASE_URL.replace(/\/$/, '');
      const path = (API_ENDPOINTS as Record<string, string>).communicationEvents || '/api/communication/events';
      const url = `${base}${path}${apiToken ? `?token=${encodeURIComponent(apiToken)}` : ''}`;

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;
      
      eventSource.onmessage = (event) => {
        // Scroll to bottom is handled in sendMessage
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'new_message':
              const normalizedMessage = normalizeMessage(data.message, currentUserId);
              const activeConvId = activeConversation?.id || activeConversation?._id;
              const isActiveConversation = data.conversationId === activeConvId;
              
              if (isActiveConversation) {
                setActiveConversation(prev => {
                  if (!prev) return null;
                  const existingMessages = prev.messages || [];
                  // Check for duplicates
                  const messageExists = existingMessages.some(
                    (msg: Message) => (msg.id || msg._id) === (normalizedMessage.id || normalizedMessage._id)
                  );
                  if (messageExists) return prev;
                  
                  return { 
                    ...prev, 
                    messages: [...existingMessages, normalizedMessage].sort((a: Message, b: Message) => {
                      const dateA = new Date(a.createdAt).getTime();
                      const dateB = new Date(b.createdAt).getTime();
                      return dateA - dateB;
                    })
                  };
                });
                // Scroll to bottom for new messages in active conversation
                setTimeout(() => scrollToBottom(), 100);
              }
              
              // Update conversations list and re-sort by most recent
              setConversations(prev => {
                const updated = prev.map(conv => {
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
                      unreadCount: isActiveConversation ? 0 : (conv.unreadCount || 0) + 1
                    };
                  }
                  return conv;
                });
                // Sort by most recent
                return updated.sort((a, b) => {
                  const dateA = new Date(a.updatedAt || a.timestamp || a.createdAt || 0).getTime();
                  const dateB = new Date(b.updatedAt || b.timestamp || b.createdAt || 0).getTime();
                  return dateB - dateA; // Most recent first
                });
              });
              
              // Update unread count if not active conversation
              if (!isActiveConversation) {
                setUnreadCount(prev => prev + 1);
              }
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
          // Downgrade to warning - app can function without real-time updates
          logger.warn('EventSource: Max reconnection attempts reached. Real-time updates are disabled. Messages will still work, but you may need to refresh to see new messages.');
          // Reset attempts after a longer delay (5 minutes) to allow retry
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current = 0;
            logger.debug('EventSource: Reconnection attempts reset. Will retry on next error.');
          }, 5 * 60 * 1000); // 5 minutes
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
  }, [activeConversation, currentUserId, scrollToBottom]);

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
    
    const convId = activeConversation.id || activeConversation._id;
    if (!convId) return;
    
    // For now, file uploads need to be handled differently
    // The API might need FormData instead of JSON
    try {
      setSendingMessage(true);
      const endpoint = API_ENDPOINTS.communicationConversationsMessages.replace('[id]', convId);
      const url = `${API_BASE_URL}${endpoint}`;
      
      // Create FormData for file upload - backend accepts FormData
      const formData = new FormData();
      // Append files - backend expects 'attachments' field
      Array.from(files).forEach((file) => {
        formData.append('attachments', file);
      });
      // Content can be empty for file-only messages, or include file names
      const fileNames = Array.from(files).map(f => f.name).join(', ');
      formData.append('content', fileNames || '');
      formData.append('type', 'file');
      
      // Get auth headers but remove Content-Type for FormData
      const authOptions = createAuthFetchOptions({ method: 'POST' });
      const authHeaders = authOptions.headers as Record<string, string> || {};
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headersWithoutContentType,
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        body: formData,
      });
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `Failed to upload file: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && typeof errorData === 'object') {
            if ('message' in errorData && typeof errorData.message === 'string') {
              errorMessage = errorData.message;
            } else if ('error' in errorData && typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            }
          }
          logger.error('File upload error', new Error(errorMessage), { 
            status: response.status, 
            errorData 
          });
        } catch {
          // If response is not JSON, use status text
          errorMessage = `Failed to upload file: ${response.status} ${response.statusText}`;
          logger.error('File upload error', new Error(errorMessage), { 
            status: response.status 
          });
        }
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      const messageData = responseData?.data || responseData;
      const normalizedNewMessage = normalizeMessage(messageData, currentUserId);
      
      // Update conversations list
      setConversations(prev => 
        prev.map(conv => {
          const convIdCheck = conv.id || conv._id;
          if (convIdCheck === convId) {
            return {
              ...conv,
              lastMessage: {
                content: normalizedNewMessage.content || 'File uploaded',
                sender: normalizedNewMessage.senderId || '',
                timestamp: normalizedNewMessage.createdAt
              },
              timestamp: normalizedNewMessage.createdAt,
              updatedAt: normalizedNewMessage.createdAt
            };
          }
          return conv;
        })
      );
      
      // Update active conversation
      setActiveConversation(prev => {
        if (!prev) return null;
        const existingMessages = prev.messages || [];
        // Check for duplicates
        const messageExists = existingMessages.some(
          (msg: Message) => (msg.id || msg._id) === (normalizedNewMessage.id || normalizedNewMessage._id)
        );
        if (messageExists) return prev;
        
        return { 
          ...prev, 
          messages: [...existingMessages, normalizedNewMessage].sort((a: Message, b: Message) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateA - dateB;
          })
        };
      });
      
      setTimeout(() => scrollToBottom(), 100);
    } catch (err) {
      logger.error('Error uploading files', err instanceof Error ? err : new Error(String(err)));
      setError('Failed to upload file. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  }, [activeConversation, currentUserId, scrollToBottom]);

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

  // WebRTC Call Functions
  const endCall = useCallback(() => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // Stop remote stream
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Clear video refs
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    // Clear timeout
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    
    // Reset state
    setCallState('idle');
    setCallType(null);
    setIsIncomingCall(false);
    setIsMuted(false);
    setIsVideoEnabled(true);
    // setIsRemoteVideoEnabled(true); // Reserved for future use
    // setIsRemoteAudioEnabled(true); // Reserved for future use
    setIsMinimized(false);
  }, [localStream, remoteStream]);

  const createPeerConnection = useCallback(() => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    
    const pc = new RTCPeerConnection(configuration);
    
    // Handle remote stream
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        // setIsRemoteVideoEnabled(true); // Reserved for future use
        // setIsRemoteAudioEnabled(true); // Reserved for future use
      }
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, send this to the other peer via signaling server
        logger.debug('ICE candidate', { candidate: event.candidate });
      }
    };
    
    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      logger.debug('Connection state', { state: pc.connectionState });
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };
    
    return pc;
  }, [endCall]);

  // Check and request permissions
  const checkAndRequestPermissions = useCallback(async (type: 'voice' | 'video'): Promise<boolean> => {
    // If Permissions API is not available, skip check and let getUserMedia handle it
    if (!navigator.permissions) {
      return true;
    }

    try {
      const permissionsToCheck: PermissionDescriptor[] = [];
      
      // Always check microphone
      permissionsToCheck.push({ name: 'microphone' as PermissionName });
      
      // Check camera for video calls
      if (type === 'video') {
        permissionsToCheck.push({ name: 'camera' as PermissionName });
      }

      const permissionResults = await Promise.all(
        permissionsToCheck.map(permission => navigator.permissions.query(permission))
      );

      // Check if all permissions are already granted
      const allGranted = permissionResults.every(result => result.state === 'granted');
      if (allGranted) {
        // Permissions already granted, proceed
        return true;
      }

      // Check if any permission is denied
      const isDenied = permissionResults.some(result => result.state === 'denied');
      if (isDenied) {
        setError(
          type === 'video'
            ? 'Camera and microphone access was denied. Please enable it in your browser settings (click the lock icon in the address bar).'
            : 'Microphone access was denied. Please enable it in your browser settings (click the lock icon in the address bar).'
        );
        return false;
      }

      // If we reach here, permission state is 'prompt' - let getUserMedia handle the prompt
      // Don't pre-request, just return true to proceed
      return true;
    } catch (error) {
      // Permissions API might not support these permission types or query failed
      // Fall back to getUserMedia which will prompt if needed
      logger.debug('Permissions API check failed, falling back to getUserMedia', {
        error: error instanceof Error ? error.message : String(error)
      });
      return true;
    }
  }, []);

  // Temporarily disabled - call buttons are hidden
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const startCall = useCallback(async (type: 'voice' | 'video') => {
    if (!activeConversation) return;
    
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Your browser does not support video/audio calls. Please use a modern browser like Chrome, Firefox, or Safari.');
      return;
    }
    
    setCallType(type);
    setCallState('calling');
    setIsIncomingCall(false);
    
    try {
      // Check and request permissions first
      const hasPermission = await checkAndRequestPermissions(type);
      if (!hasPermission) {
        endCall();
        return;
      }
      
      // Get user media with better error handling
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: type === 'video' ? {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user'
        } : false
      };
      
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (mediaError) {
        const errorName = mediaError instanceof Error ? mediaError.name : 'UnknownError';
        const errorMessage = mediaError instanceof Error ? mediaError.message : String(mediaError);
        
        // Handle specific permission errors
        if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
          setError(
            type === 'video' 
              ? 'Camera and microphone access was denied. Please click the lock icon in your browser\'s address bar and allow camera/microphone access, then try again.'
              : 'Microphone access was denied. Please click the lock icon in your browser\'s address bar and allow microphone access, then try again.'
          );
        } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
          setError(
            type === 'video'
              ? 'No camera or microphone found. Please connect a camera and microphone and try again.'
              : 'No microphone found. Please connect a microphone and try again.'
          );
        } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
          setError('Camera or microphone is already in use by another application. Please close other applications and try again.');
        } else if (errorName === 'OverconstrainedError' || errorName === 'ConstraintNotSatisfiedError') {
          setError('Your device does not support the required video/audio settings. Trying with lower quality...');
          // Retry with more lenient constraints
          try {
            const fallbackConstraints: MediaStreamConstraints = {
              audio: true,
              video: type === 'video' ? true : false
            };
            stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          } catch {
            // Fallback failed, throw original error
            throw mediaError;
          }
        } else {
          setError(`Failed to access ${type === 'video' ? 'camera and microphone' : 'microphone'}: ${errorMessage}`);
        }
        logger.error('Error accessing media devices', mediaError instanceof Error ? mediaError : new Error(String(mediaError)), {
          errorName,
          callType: type
        });
        endCall();
        return;
      }
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Create peer connection
      const pc = createPeerConnection();
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      peerConnectionRef.current = pc;
      
      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      // In a real implementation, send offer to signaling server
      // For now, we'll simulate the call being accepted after a delay
      setTimeout(() => {
        setCallState(prev => prev === 'calling' ? 'active' : prev);
      }, 2000);
      
      // Set timeout for call (30 seconds if not answered)
      callTimeoutRef.current = setTimeout(() => {
        setCallState(prev => {
          if (prev === 'calling' || prev === 'ringing') {
            endCall();
          }
          return prev;
        });
      }, 30000);
      
    } catch (error) {
      logger.error('Error starting call', error instanceof Error ? error : new Error(String(error)), {
        callType: type,
        conversationId: activeConversation.id || activeConversation._id
      });
      if (!error || (error instanceof Error && !error.message.includes('access'))) {
        setError('Failed to start call. Please check your microphone and camera permissions.');
      }
      endCall();
    }
  }, [activeConversation, createPeerConnection, endCall, checkAndRequestPermissions]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  }, [localStream, isMuted]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  }, [localStream, isVideoEnabled]);

  const handleAnswerCall = useCallback(() => {
    if (callState === 'ringing') {
      setCallState('active');
      setIsIncomingCall(false);
    }
  }, [callState]);

  const handleRejectCall = useCallback(() => {
    endCall();
  }, [endCall]);

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

  // Auto-open or create a conversation when ?userId is provided (e.g., from provider detail "Send Message")
  useEffect(() => {
    const userIdFromUrl = searchParams?.get('userId');
    if (!userIdFromUrl) return;
    if (loadingConversation) return;

    const openConversationWithUser = async () => {
      try {
        setLoadingConversation(true);
        setMessagePage(1);
        setHasMoreMessages(true);
        setSearchResults([]);
        setMessageSearchQuery('');

        let conversationId: string | undefined;

        // Try to find existing conversation with this user
        try {
          const existing = await CommunicationAPI.getConversationWithUser(userIdFromUrl);
          const conversation =
            (existing as { conversation?: unknown; data?: unknown })?.conversation ||
            (existing as { data?: unknown })?.data ||
            existing;
          conversationId =
            (existing as { conversationId?: string })?.conversationId ||
            (conversation as { _id?: string; id?: string })?._id ||
            (conversation as { _id?: string; id?: string })?.id;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          // If 404, proceed to create a new conversation; otherwise log and still try to create
          if (!message.includes('404')) {
            logger.warn('No existing conversation found, will create a new one', {
              userId: userIdFromUrl,
              error: message
            });
          }
        }

        const ensureActive = async (convId: string) => {
          // Mark as read and fetch details/messages
          markAsRead(convId).catch(err => {
            logger.warn('Error marking conversation as read', {
              conversationId: convId,
              error: err instanceof Error ? err.message : String(err)
            });
          });

          const [details, messages] = await Promise.all([
            fetchConversationDetails(convId),
            fetchConversationMessages(convId, 1, 50)
          ]);

          if (details) {
            setActiveConversation({
              ...details,
              messages
            });
            setHasMoreMessages(messages.length === 50);
            setTimeout(() => scrollToBottom(), 200);
          }

          // Update URL to use conversationId and drop userId
          const params = new URLSearchParams(searchParams.toString());
          params.set('conversationId', convId);
          params.delete('userId');
          router.replace(`${pathname}?${params.toString()}`);
        };

        if (conversationId) {
          await ensureActive(conversationId);
          return;
        }

        // No existing conversation; create one
        const created = await CommunicationAPI.createConversation([userIdFromUrl]);
        const createdConversation =
          (created as { conversation?: unknown; data?: unknown })?.conversation ||
          (created as { data?: unknown })?.data ||
          created;
        const createdConversationId =
          (created as { conversationId?: string })?.conversationId ||
          (createdConversation as { _id?: string; id?: string })?._id ||
          (createdConversation as { _id?: string; id?: string })?.id;

        if (createdConversationId) {
          await ensureActive(createdConversationId);
        }
      } catch (err) {
        logger.error(
          'Error opening conversation with user from URL',
          err instanceof Error ? err : undefined,
          { userId: userIdFromUrl }
        );
      } finally {
        setLoadingConversation(false);
      }
    };

    openConversationWithUser();
  }, [
    searchParams,
    fetchConversationDetails,
    fetchConversationMessages,
    markAsRead,
    scrollToBottom,
    router,
    pathname,
    loadingConversation
  ]);

  // Set initial active conversation when conversations are loaded or URL changes
  useEffect(() => {
    const conversationIdFromUrl = searchParams?.get('conversationId');
    
    // If there's a conversationId in URL, fetch it
    if (conversationIdFromUrl) {
      const currentConvId = activeConversation?.id || activeConversation?._id;
      // Only fetch if it's different from current active conversation
      if (currentConvId !== conversationIdFromUrl) {
        setLoadingConversation(true);
        setMessagePage(1);
        setHasMoreMessages(true);
        setSearchResults([]);
        setMessageSearchQuery('');
        
        // Try to find in existing conversations first
        const foundConversation = conversations.find(
          conv => (conv._id === conversationIdFromUrl || conv.id === conversationIdFromUrl)
        );
        
        if (foundConversation) {
          // Mark as read
          markAsRead(conversationIdFromUrl).catch(err => {
            logger.warn('Error marking conversation as read', { 
              conversationId: conversationIdFromUrl,
              error: err instanceof Error ? err.message : String(err)
            });
          });
          
          // Fetch full conversation details and messages
          Promise.all([
            fetchConversationDetails(conversationIdFromUrl),
            fetchConversationMessages(conversationIdFromUrl, 1, 50)
          ]).then(([details, messages]) => {
            if (details) {
              setActiveConversation({
                ...details,
                messages: messages
              });
              setHasMoreMessages(messages.length === 50);
              setTimeout(() => scrollToBottom(), 200);
            }
          }).catch(err => {
            logger.error('Error fetching conversation from URL', err instanceof Error ? err : new Error(String(err)));
            // On error, still try to use found conversation
            if (foundConversation) {
              setActiveConversation(foundConversation);
            }
          }).finally(() => {
            setLoadingConversation(false);
          });
        } else {
          // Conversation not in list yet, try to fetch it directly
          Promise.all([
            fetchConversationDetails(conversationIdFromUrl),
            fetchConversationMessages(conversationIdFromUrl, 1, 50)
          ]).then(([details, messages]) => {
            if (details) {
              setActiveConversation({
                ...details,
                messages: messages
              });
              setHasMoreMessages(messages.length === 50);
              setTimeout(() => scrollToBottom(), 200);
              
              // Mark as read
              markAsRead(conversationIdFromUrl).catch(err => {
                logger.warn('Error marking conversation as read', { 
                  conversationId: conversationIdFromUrl,
                  error: err instanceof Error ? err.message : String(err)
                });
              });
            }
          }).catch(err => {
            logger.error('Error fetching conversation from URL', err instanceof Error ? err : new Error(String(err)));
            // If conversation not found, clear URL param and show first conversation
            if (conversations.length > 0) {
              const params = new URLSearchParams(searchParams.toString());
              params.delete('conversationId');
              router.replace(`${pathname}?${params.toString()}`);
              setActiveConversation(conversations[0]);
            }
          }).finally(() => {
            setLoadingConversation(false);
          });
        }
      }
    } else if (conversations.length > 0 && !activeConversation) {
      // No conversationId in URL, set first conversation and update URL
      const firstConv = conversations[0];
      const firstConvId = firstConv.id || firstConv._id;
      if (firstConvId) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('conversationId', firstConvId);
        router.replace(`${pathname}?${params.toString()}`);
      }
    }
  }, [conversations, activeConversation, searchParams, fetchConversationDetails, fetchConversationMessages, markAsRead, scrollToBottom, router, pathname]);

  useEffect(() => {
    // Scroll to bottom when messages change, but only if we're near the bottom
    // This prevents scrolling when loading older messages
    if (activeConversation?.messages && activeConversation.messages.length > 0) {
      const messagesContainer = messagesEndRef.current?.parentElement;
      if (messagesContainer) {
        const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 200;
        if (isNearBottom) {
          setTimeout(() => scrollToBottom(), 100);
        }
      } else {
        // If container not found, scroll anyway (initial load)
        setTimeout(() => scrollToBottom(), 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.messages?.length, scrollToBottom]);

  // Cleanup timeouts and streams on unmount
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
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
      // Cleanup call resources
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [typingTimeout, localStream, remoteStream]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !activeConversation || sendingMessage) return;

    const convId = activeConversation.id || activeConversation._id;
    if (!convId) return;
    const messageContent = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX
    try {
      await sendMessage(convId, messageContent);
      // Scroll to bottom is handled in sendMessage
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Restore message on error
      setNewMessage(messageContent);
    }
  }, [newMessage, activeConversation, sendingMessage, sendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);


  const handleConversationSelect = useCallback(async (conversation: Conversation) => {
    const convId = conversation.id || conversation._id;
    if (!convId) return;
    
    // Update URL with conversationId
    const params = new URLSearchParams(searchParams.toString());
    params.set('conversationId', convId);
    router.replace(`${pathname}?${params.toString()}`);
    
    // Clear previous state
    setShowMobileConversations(false); // Close mobile menu on selection
    setMessagePage(1);
    setHasMoreMessages(true);
    setSearchResults([]); // Clear search results when switching conversations
    setMessageSearchQuery(''); // Clear search query
    
    // Set loading state and show conversation info (but not messages yet)
    setLoadingConversation(true);
    setActiveConversation({
      ...conversation,
      messages: [] // Clear messages while loading
    });
    
    // Mark as read
    try {
      await markAsRead(convId);
    } catch (err) {
      logger.warn('Error marking conversation as read', { 
        conversationId: convId,
        error: err instanceof Error ? err.message : String(err)
      });
    }
    
    // Fetch conversation details (for header/red box) and messages (for message area/green box) in parallel
    try {
      const [conversationDetails, messages] = await Promise.all([
        fetchConversationDetails(convId),
        fetchConversationMessages(convId, 1, 50)
      ]);
      
      if (conversationDetails) {
        logger.debug('Fetched conversation details and messages', { 
          convId, 
          messageCount: messages.length,
          hasMessages: messages.length > 0
        });
        
        // Update active conversation with details and messages
        setActiveConversation({
          ...conversationDetails,
          messages: messages
        });
        
        // Determine if there are more messages (if we got 50, there might be more)
        setHasMoreMessages(messages.length === 50);
        
        // Scroll to bottom after loading messages
        setTimeout(() => scrollToBottom(), 200);
      } else {
        // If fetch returns null/undefined, still show the conversation but with fetched messages
        logger.warn('fetchConversationDetails returned null/undefined', { convId });
        setActiveConversation({
          ...conversation,
          messages: messages
        });
        setHasMoreMessages(messages.length === 50);
      }
    } catch (err) {
      logger.error('Error fetching conversation details or messages', err instanceof Error ? err : new Error(String(err)), { convId });
      // On error, still show the conversation but log the error
      setActiveConversation({
        ...conversation,
        messages: conversation.messages || []
      });
      } finally {
        setLoadingConversation(false);
      }
  }, [markAsRead, fetchConversationDetails, fetchConversationMessages, scrollToBottom, router, pathname, searchParams]);

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

  const handleDeleteConversation = useCallback(async () => {
    if (!activeConversation) return;
    
    const convId = activeConversation.id || activeConversation._id;
    if (!convId) return;
    
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteConversation(convId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
    }
  }, [activeConversation, deleteConversation]);

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

  const memoizedMessages = useMemo(() => {
    const messages = activeConversation?.messages;
    if (!messages) return [];
    if (!Array.isArray(messages)) return [];
    return messages;
  }, [activeConversation?.messages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent/10/30 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="h-[calc(100vh-12rem)] bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
              <p className="text-gray-500">Loading conversations...</p>
            </div>
          </div>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent/10/30 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="h-[calc(100vh-12rem)] bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center justify-center">
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                    <span className="text-sm text-gray-500">Retrying... (Attempt {retryCount + 1}/3)</span>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                {!isAuthError && (
                  <button 
                    onClick={fetchConversations}
                    disabled={isRetrying}
                    className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isRetrying ? 'Retrying...' : 'Try Again'}
                  </button>
                )}
                {isAuthError && (
                  <button 
                    onClick={() => window.location.href = '/auth'}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
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
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Messages — Stay Connected
            </h1>
            <p className="text-gray-600">
              Communicate with providers, clients, and support team members.
            </p>
          </div>
        </div>

        {/* Main Messages Interface */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="h-[calc(100vh-12rem)] bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col lg:flex-row relative overflow-hidden">
            {/* Mobile overlay */}
      {showMobileConversations && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-20 transition-opacity"
          onClick={() => setShowMobileConversations(false)}
        />
      )}
      
      {/* Left Sidebar - Conversations */}
      <div className={`w-full lg:w-96 border-r border-gray-200 bg-gradient-to-b from-white to-gray-50/50 flex flex-col transition-transform duration-300 ease-in-out z-30 ${
        showMobileConversations ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent/90 text-white flex items-center justify-center shadow-lg shadow-accent/30 ring-2 ring-accent/20">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Messages</h1>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-full mt-1 shadow-sm">
                    {unreadCount} unread
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMessageSearch(!showMessageSearch)}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                title="Search messages"
              >
                <Search className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => {/* TODO: Add new conversation */}}
                className="p-2.5 hover:bg-accent/10 rounded-xl transition-all duration-200 text-accent hover:scale-105 active:scale-95 hover:shadow-sm"
                title="New conversation"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Search Bar - Toggle between conversation and message search */}
          {!showMessageSearch ? (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all text-sm bg-white shadow-sm hover:shadow-md focus:shadow-md"
              />
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search messages..."
                value={messageSearchQuery}
                onChange={(e) => setMessageSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent transition-all text-sm bg-white shadow-sm hover:shadow-md focus:shadow-md"
              />
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-accent border-t-transparent mx-auto mb-4"></div>
              <p className="text-sm font-medium">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">No conversations found</p>
              <p className="text-xs text-gray-400">Start a new conversation to begin messaging</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const isActive = activeConversation?.id === conversation.id;
              const hasUnread = (conversation.unreadCount || 0) > 0;
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation)}
                  className={`px-5 py-4 cursor-pointer transition-all duration-200 border-l-4 ${
                    isActive
                      ? "bg-gradient-to-r from-accent/10 to-white border-accent shadow-sm"
                      : "border-transparent hover:bg-white/70 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      {conversation.avatar ? (
                        <Image 
                          src={conversation.avatar} 
                          alt={conversation.name || 'User'}
                          width={56}
                          height={56}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white shadow-md"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-accent to-accent/90 rounded-2xl flex items-center justify-center shadow-md ring-2 ring-white">
                          <span className="text-base font-bold text-white">
                            {conversation.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      {hasUnread && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-rose-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">{conversation.unreadCount}</span>
                        </div>
                      )}
                      {isActive && (
                        <div className="absolute inset-0 rounded-2xl ring-2 ring-accent/50"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className={`text-sm font-bold truncate ${
                          isActive ? 'text-gray-900' : 'text-gray-800'
                        }`}>
                          {conversation.name}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2 font-medium">
                          {conversation.timestamp ? (() => {
                            const date = new Date(conversation.timestamp);
                            const now = new Date();
                            const diffMs = now.getTime() - date.getTime();
                            const diffMins = Math.floor(diffMs / 60000);
                            const diffHours = Math.floor(diffMs / 3600000);
                            const diffDays = Math.floor(diffMs / 86400000);
                            
                            if (diffMins < 1) return 'Just now';
                            if (diffMins < 60) return `${diffMins}m`;
                            if (diffHours < 24) return `${diffHours}h`;
                            if (diffDays < 7) return `${diffDays}d`;
                            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                          })() : ''}
                        </span>
                      </div>
                      <p className={`text-sm truncate mb-1.5 ${
                        hasUnread ? 'text-gray-900 font-medium' : 'text-gray-600'
                      }`}>
                        {typeof conversation.lastMessage === 'string' 
                          ? conversation.lastMessage 
                          : conversation.lastMessage?.content || 'No messages'}
                      </p>
                      <div className="flex items-center justify-between">
                        {conversation.isTyping && (
                          <span className="text-xs text-accent font-semibold italic animate-pulse">typing...</span>
                        )}
                        {!conversation.isTyping && hasUnread && (
                          <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-2 text-xs font-bold text-white bg-gradient-to-r from-accent to-accent/90 rounded-full shadow-sm">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>


      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col relative bg-gradient-to-br from-gray-50/50 to-white">
        {/* Mobile menu button */}
        <button
          onClick={() => setShowMobileConversations(!showMobileConversations)}
          className="lg:hidden absolute top-4 left-4 z-10 p-2.5 bg-white rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-5 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                {activeConversation.avatar ? (
                  <Image 
                    src={activeConversation.avatar} 
                    alt={activeConversation.name || 'User'}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-accent/20 shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent/90 rounded-2xl flex items-center justify-center shadow-md ring-2 ring-accent/20">
                    <span className="text-base font-bold text-white">
                      {activeConversation.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                    {activeConversation.name || activeConversation.subject}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    {activeConversation.participants.length} participant{activeConversation.participants.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Temporarily hidden - Voice and Video call buttons */}
                {/* <button
                  onClick={() => startCall('voice')}
                  disabled={callState !== 'idle'}
                  className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Voice call"
                >
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => startCall('video')}
                  disabled={callState !== 'idle'}
                  className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Video call"
                >
                  <Video className="w-5 h-5 text-gray-600" />
                </button> */}
                <button
                  onClick={() => setShowMessageActions(!showMessageActions)}
                  className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 relative"
                  title="More options"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              {showMessageActions && (
                <div className="absolute right-4 top-20 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 min-w-[200px] overflow-hidden">
                  <button
                    onClick={() => {
                      handleDeleteConversation();
                      setShowMessageActions(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Conversation
                  </button>
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white via-gray-50/30 to-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent" onScroll={handleScroll}>
              {/* Search Results */}
              {showMessageSearch && searchResults.length > 0 && (
                <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="text-sm font-medium text-primary mb-2">Search Results ({searchResults.length})</h4>
                  <div className="space-y-2">
                    {searchResults.slice(0, 3).map((message) => (
                      <div key={message.id || message._id} className="text-sm text-primary bg-white p-2 rounded border">
                        <span className="font-medium">{message.senderName}:</span> {message.content}
                      </div>
                    ))}
                    {searchResults.length > 3 && (
                      <p className="text-xs text-primary">...and {searchResults.length - 3} more results</p>
                    )}
                  </div>
                </div>
              )}
              
              {loadingConversation ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading messages...</p>
                  </div>
                </div>
              ) : memoizedMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center px-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-accent/20 to-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <MessageSquare className="w-10 h-10 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">No messages yet</h3>
                    <p className="text-gray-500 font-medium">Start the conversation by sending a message below.</p>
                  </div>
                </div>
              ) : (
                memoizedMessages.map((message, index) => {
                  const prevMessage = index > 0 ? memoizedMessages[index - 1] : null;
                  const nextMessage = index < memoizedMessages.length - 1 ? memoizedMessages[index + 1] : null;
                  
                  // Show avatar if it's the first message from this sender or if previous message is from different sender
                  const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;
                  
                  // Show timestamp if it's the first message or if time gap is more than 5 minutes
                  const showTimestamp = !prevMessage || 
                    new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 5 * 60 * 1000;
                  
                  // Check if this is the last message in a group (next message is from different sender or time gap > 1 minute)
                  const isLastInGroup = !nextMessage || 
                    nextMessage.senderId !== message.senderId ||
                    new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime() > 60 * 1000;
                  
                  // Check if messages are close together (same sender, within 1 minute)
                  const isGrouped = prevMessage && 
                    prevMessage.senderId === message.senderId &&
                    new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() <= 60 * 1000;
                  
                  return (
                    <div 
                      key={message.id || message._id} 
                      className={`flex ${message.isFromUser ? "justify-end" : "justify-start"} group mb-1`}
                    >
                      <div className={`relative max-w-[75%] sm:max-w-md lg:max-w-lg ${message.isFromUser ? "ml-auto" : ""}`}>
                        {showTimestamp && (
                          <div className="text-center mb-4 mt-2">
                            <span className="inline-block px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100/80 rounded-full backdrop-blur-sm">
                              {(() => {
                                const date = new Date(message.createdAt);
                                const now = new Date();
                                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                                const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
                                
                                if (diffDays === 0) {
                                  return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                } else if (diffDays === 1) {
                                  return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                } else if (diffDays < 7) {
                                  return date.toLocaleDateString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' });
                                } else {
                                  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined, hour: '2-digit', minute: '2-digit' });
                                }
                              })()}
                            </span>
                          </div>
                        )}
                        
                        <div className={`flex items-end gap-2.5 ${message.isFromUser ? "flex-row-reverse" : ""}`}>
                          {!message.isFromUser && (
                            <div className={`flex-shrink-0 transition-opacity ${showAvatar ? 'opacity-100' : 'opacity-0 w-10'}`}>
                              {showAvatar ? (
                                message.senderAvatar ? (
                                  <Image 
                                    src={message.senderAvatar} 
                                    alt={message.senderName || 'User'}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 rounded-2xl object-cover shadow-md ring-2 ring-white"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 rounded-2xl flex items-center justify-center shadow-md ring-2 ring-white">
                                    <span className="text-sm font-bold text-white">
                                      {message.senderName?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                  </div>
                                )
                              ) : null}
                            </div>
                          )}
                          
                          <div className={`relative group flex flex-col ${message.isFromUser ? "items-end" : "items-start"} ${isGrouped ? "mt-0.5" : ""}`}>
                            <div
                              className={`px-4 py-2.5 rounded-2xl transition-all duration-200 ${
                                message.isFromUser
                                  ? "bg-gradient-to-br from-accent to-accent/90 text-white shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/35"
                                  : "bg-white text-gray-900 border border-gray-200/80 shadow-md hover:shadow-lg"
                              } ${isGrouped && !isLastInGroup ? (message.isFromUser ? "rounded-br-md" : "rounded-bl-md") : ""} ${isGrouped && !showAvatar ? (message.isFromUser ? "rounded-tr-md" : "rounded-tl-md") : ""}`}
                            >
                              {message.metadata?.replyTo && (
                                <div className={`text-xs mb-2 p-2 rounded-lg border-l-2 ${
                                  message.isFromUser ? "bg-accent/30 border-accent/50" : "bg-gray-100 border-gray-300"
                                }`}>
                                  <p className="truncate font-medium">Replying to message</p>
                                </div>
                              )}
                              
                              <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                                message.isFromUser ? 'text-white' : 'text-gray-800'
                              }`}>{message.content}</p>
                              
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2.5 space-y-2">
                                  {message.attachments.map((attachment, idx) => (
                                    <a 
                                      key={idx}
                                      href={attachment.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        message.isFromUser 
                                          ? 'bg-accent/30 text-white hover:bg-accent/40 backdrop-blur-sm' 
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }`}
                                    >
                                      <Paperclip className="w-3 h-3" />
                                      <span className="truncate max-w-[200px]">{attachment.filename}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                              
                              <div className={`flex items-center gap-1.5 mt-1.5 ${message.isFromUser ? "justify-end" : "justify-start"} ${
                                message.isFromUser ? "text-white/90" : "text-gray-500"
                              }`}>
                                {!message.isFromUser && (
                                  <span className="text-[10px] font-semibold opacity-70">
                                    {message.senderName}
                                  </span>
                                )}
                                <span className="text-[10px] font-medium">
                                  {new Date(message.createdAt).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                {message.metadata?.isEdited && message.metadata.editedAt && (
                                  <span className="text-[10px] italic opacity-70">(edited)</span>
                                )}
                                {message.isFromUser && (
                                  <Check className={`w-3 h-3 ${message.isRead ? 'opacity-100' : 'opacity-60'}`} />
                                )}
                              </div>
                            </div>
                            
                            {/* Message Actions - Only show for user's own messages */}
                            {message.isFromUser && (
                              <div className={`absolute ${message.isFromUser ? 'right-0' : 'left-0'} top-0 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-10`}>
                                <div className="flex gap-1 bg-white rounded-xl shadow-xl border border-gray-200 p-1.5 backdrop-blur-sm">
                                  <button
                                    onClick={() => {
                                      const newContent = prompt('Edit message:', message.content);
                                      const msgId = message.id || message._id;
                                      if (newContent && newContent !== message.content && msgId) {
                                        handleMessageEdit(msgId, newContent);
                                      }
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                                    title="Edit message"
                                  >
                                    <Edit className="w-4 h-4 text-gray-600" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const msgId = message.id || message._id;
                                      if (msgId && confirm('Are you sure you want to delete this message?')) {
                                        handleMessageDelete(msgId);
                                      }
                                    }}
                                    className="p-2 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                                    title="Delete message"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
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
                  <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-2xl px-5 py-3 shadow-md">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                    <span className="text-xs text-gray-600 font-semibold">
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
            <div className="p-5 border-t border-gray-200/80 bg-white/95 backdrop-blur-sm shadow-lg">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="flex-shrink-0 p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
                  title="Add emoji"
                >
                  <Smile className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1 relative flex items-center">
                  <textarea
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      if (activeConversation) {
                        const convId = activeConversation.id || activeConversation._id;
                        if (convId) {
                          handleTyping(convId);
                        }
                      }
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={sendingMessage}
                    rows={1}
                    className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-accent focus:border-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base bg-white resize-none min-h-[52px] max-h-[120px] overflow-y-auto shadow-sm hover:shadow-md focus:shadow-md"
                    style={{ height: 'auto' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                    }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="flex-shrink-0 p-3 bg-gradient-to-r from-accent to-accent/90 text-white rounded-2xl hover:from-accent/90 hover:to-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 hover:scale-105 active:scale-95 flex items-center justify-center"
                >
                  {sendingMessage ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <Send className="w-5 h-5" />
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
                <div className="absolute bottom-20 left-4 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 z-50 backdrop-blur-sm">
                  <div className="grid grid-cols-8 gap-2">
                    {['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '💯', '👏', '🙌', '😊', '😢'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-125 active:scale-95 text-lg"
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
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-white">
            <div className="text-center px-6">
              <div className="w-20 h-20 bg-gradient-to-br from-accent/20 to-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MessageSquare className="w-10 h-10 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">No conversation selected</h3>
              <p className="text-gray-500 font-medium">Choose a conversation from the sidebar to start messaging.</p>
            </div>
          </div>
        )}
          </div>
        </div>
        </div>
      </div>

      {/* Call Interface */}
      {callState !== 'idle' && (
        <div className={`fixed inset-0 z-50 bg-black ${isMinimized ? 'pointer-events-none' : ''}`}>
          {isMinimized ? (
            <div className="absolute bottom-4 right-4 w-64 h-48 bg-gray-900 rounded-xl overflow-hidden shadow-2xl cursor-pointer" onClick={() => setIsMinimized(false)}>
              {callType === 'video' && localVideoRef.current && (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
              {callType === 'voice' && (
                <div className="w-full h-full bg-gradient-to-br from-accent to-accent/90 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                    <Phone className="w-10 h-10 text-white" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    endCall();
                  }}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <Phone className="w-4 h-4 rotate-[135deg]" />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col">
              {/* Remote Video (Main) */}
              {callType === 'video' && (
                <div className="flex-1 relative bg-gray-900">
                  {remoteStream && remoteVideoRef.current ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <div className="text-center">
                        {activeConversation?.avatar ? (
                          <Image 
                            src={activeConversation.avatar} 
                            alt={activeConversation.name || 'User'}
                            width={128}
                            height={128}
                            className="w-32 h-32 rounded-full mx-auto mb-4 ring-4 ring-accent/50"
                          />
                        ) : (
                          <div className="w-32 h-32 bg-gradient-to-br from-accent to-accent/90 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-accent/50">
                            <span className="text-4xl font-bold text-white">
                              {activeConversation?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                        <h3 className="text-2xl font-bold text-white mb-2">{activeConversation?.name}</h3>
                        <p className="text-gray-400">
                          {callState === 'calling' ? 'Calling...' : callState === 'ringing' ? 'Ringing...' : 'Connecting...'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Local Video (Picture-in-Picture) */}
                  {localStream && localVideoRef.current && (
                    <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      {!isVideoEnabled && (
                        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                          <Video className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Voice Call View */}
              {callType === 'voice' && (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                  <div className="text-center">
                    {activeConversation?.avatar ? (
                      <Image 
                        src={activeConversation.avatar} 
                        alt={activeConversation.name || 'User'}
                        width={160}
                        height={160}
                        className="w-40 h-40 rounded-full mx-auto mb-6 ring-4 ring-accent/50 shadow-2xl"
                      />
                    ) : (
                      <div className="w-40 h-40 bg-gradient-to-br from-accent to-accent/90 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-accent/50 shadow-2xl">
                        <span className="text-5xl font-bold text-white">
                          {activeConversation?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <h3 className="text-3xl font-bold text-white mb-2">{activeConversation?.name}</h3>
                    <p className="text-gray-400 text-lg">
                      {callState === 'calling' ? 'Calling...' : callState === 'ringing' ? 'Ringing...' : callState === 'active' ? 'Connected' : ''}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Call Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
                <div className="flex items-center justify-center gap-4 max-w-2xl mx-auto">
                  {/* Mute Toggle */}
                  <button
                    onClick={toggleMute}
                    className={`p-4 rounded-full transition-all duration-200 hover:scale-110 ${
                      isMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                  
                  {/* Video Toggle (only for video calls) */}
                  {callType === 'video' && (
                    <button
                      onClick={toggleVideo}
                      className={`p-4 rounded-full transition-all duration-200 hover:scale-110 ${
                        !isVideoEnabled ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                      title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                    >
                      <Video className="w-6 h-6" />
                    </button>
                  )}
                  
                  {/* Answer/Reject (for incoming calls) */}
                  {callState === 'ringing' && isIncomingCall && (
                    <>
                      <button
                        onClick={handleRejectCall}
                        className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 hover:scale-110"
                        title="Reject"
                      >
                        <Phone className="w-6 h-6 rotate-[135deg]" />
                      </button>
                      <button
                        onClick={handleAnswerCall}
                        className="p-4 bg-accent text-white rounded-full hover:bg-accent/90 transition-all duration-200 hover:scale-110"
                        title="Answer"
                      >
                        <Phone className="w-6 h-6" />
                      </button>
                    </>
                  )}
                  
                  {/* End Call */}
                  {(callState === 'active' || callState === 'calling' || (callState === 'ringing' && !isIncomingCall)) && (
                    <button
                      onClick={endCall}
                      className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 hover:scale-110"
                      title="End call"
                    >
                      <Phone className="w-6 h-6 rotate-[135deg]" />
                    </button>
                  )}
                  
                  {/* Minimize */}
                  {callState === 'active' && (
                    <button
                      onClick={() => setIsMinimized(true)}
                      className="p-4 bg-white/20 text-white rounded-full hover:bg-white/30 transition-all duration-200 hover:scale-110"
                      title="Minimize"
                    >
                      <Minimize2 className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
