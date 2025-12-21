/**
 * Live Chat API Service
 * Handles all API communication for the live chat feature
 * Based on LIVE_CHAT_API.md specification
 */

import { logger } from "@/lib/logger";
import { DEV_CONFIG } from "@/lib/env";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { realLiveChatService } from "@/lib/live-chat-api-service";
import { ChatMessage, ChatAttachment } from "./LiveChatContext";
import MockLiveChatService from "@/lib/live-chat-mock-service";

// Helper to build dynamic endpoints
const buildEndpoint = {
  // Public endpoints
  sessions: () => API_ENDPOINTS.liveChatSessions,
  sessionById: (id: string) => API_ENDPOINTS.liveChatSessionById.replace("[sessionId]", id),
  messages: (sessionId: string) => API_ENDPOINTS.liveChatMessages.replace("[sessionId]", sessionId),
  upload: () => API_ENDPOINTS.liveChatUpload,
  endSession: (sessionId: string) => API_ENDPOINTS.liveChatEndSession.replace("[sessionId]", sessionId),
  rateSession: (sessionId: string) => API_ENDPOINTS.liveChatRateSession.replace("[sessionId]", sessionId),
  typing: (sessionId: string) => API_ENDPOINTS.liveChatTyping.replace("[sessionId]", sessionId),
  
  // Admin endpoints
  adminSessions: () => API_ENDPOINTS.adminLiveChatSessions,
  adminSessionById: (id: string) => API_ENDPOINTS.adminLiveChatSessionById.replace("[sessionId]", id),
  adminReply: (sessionId: string) => API_ENDPOINTS.adminLiveChatReply.replace("[sessionId]", sessionId),
  adminAssign: (sessionId: string) => API_ENDPOINTS.adminLiveChatAssign.replace("[sessionId]", sessionId),
  adminStatus: (sessionId: string) => API_ENDPOINTS.adminLiveChatStatus.replace("[sessionId]", sessionId),
  adminNotes: (sessionId: string) => API_ENDPOINTS.adminLiveChatNotes.replace("[sessionId]", sessionId),
  adminTransfer: (sessionId: string) => API_ENDPOINTS.adminLiveChatTransfer.replace("[sessionId]", sessionId),
  adminAnalytics: () => API_ENDPOINTS.adminLiveChatAnalytics,
  adminCustomerHistory: (email: string) => API_ENDPOINTS.adminLiveChatCustomerHistory.replace("[email]", encodeURIComponent(email)),
  adminDeleteSession: (sessionId: string) => API_ENDPOINTS.adminLiveChatDeleteSession.replace("[sessionId]", sessionId),
};

// ============ TYPES ============

export interface CreateSessionRequest {
  sessionId: string;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  pageUrl?: string;
}

export interface CreateSessionResponse {
  success: boolean;
  message?: string;
  data?: {
    session: {
      sessionId: string;
      user: {
        name: string;
        email: string;
        metadata?: {
          userAgent?: string;
          ipAddress?: string;
          pageUrl?: string;
        };
      };
      status: "pending" | "active" | "closed" | "archived";
      priority: "low" | "medium" | "high" | "urgent";
      department: string;
      messageCount: number;
      unreadCount: number;
      startedAt: string;
    };
    welcomeMessage?: {
      sessionId: string;
      type: "system" | "agent" | "user";
      content: string;
      agentName?: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  success: boolean;
  message?: string;
  data?: {
    _id: string;
    sessionId: string;
    type: "user" | "agent" | "system";
    content: string;
    attachments: ChatAttachment[];
    isRead: boolean;
    createdAt: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface GetMessagesResponse {
  success: boolean;
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
  data?: Array<{
    _id: string;
    sessionId: string;
    type: "user" | "agent" | "system";
    content: string;
    agentName?: string;
    attachments?: ChatAttachment[];
    createdAt: string;
  }>;
  error?: {
    code: string;
    message: string;
  };
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  data?: {
    attachments: Array<{
      id: string;
      name: string;
      type: string;
      size: number;
      url: string;
      previewUrl?: string;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface RateSessionRequest {
  score: number; // 1-5
  feedback?: string;
}

export interface RateSessionResponse {
  success: boolean;
  message?: string;
  data?: {
    rating: {
      score: number;
      feedback?: string;
      ratedAt: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface EndSessionResponse {
  success: boolean;
  message?: string;
  data?: {
    sessionId: string;
    status: "closed";
    endedAt: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface SessionDetailsResponse {
  success: boolean;
  data?: {
    sessionId: string;
    user: {
      name: string;
      email: string;
    };
    status: "active" | "pending" | "closed" | "archived";
    assignedAgent?: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    messageCount: number;
    startedAt: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============ SESSION TOKEN MANAGEMENT ============

let sessionToken: string | null = null;

export function setSessionToken(token: string | null) {
  sessionToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('livechat_session_token', token);
    } else {
      localStorage.removeItem('livechat_session_token');
    }
  }
}

export function getSessionToken(): string | null {
  if (sessionToken) return sessionToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('livechat_session_token');
  }
  return null;
}

// ============ HTTP HELPERS ============

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getSessionToken();
  const headers: HeadersInit = {
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }
  
  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });
}

// ============ WEBSOCKET MANAGER ============

type WebSocketEventType = 
  | 'connection_established'
  | 'new_session'
  | 'user_message'
  | 'agent_message'
  | 'user_typing'
  | 'agent_typing'
  | 'agent_assigned'
  | 'session_status_changed'
  | 'read_receipt'
  | 'error';

interface WebSocketMessage {
  type: WebSocketEventType;
  sessionId?: string;
  message?: ChatMessage;
  isTyping?: boolean;
  status?: string;
  agent?: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp?: string;
  error?: string;
}

type WebSocketCallback = (data: WebSocketMessage) => void;

class LiveChatWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 2000;
  private callbacks: Map<WebSocketEventType | 'all', Set<WebSocketCallback>> = new Map();
  private sessionId: string | null = null;
  private isAdmin: boolean = false;
  private userId: string | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private enabled: boolean = true;
  private connectionFailed: boolean = false;

  /**
   * Enable or disable WebSocket connections
   * When disabled, all operations become no-ops
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.disconnect();
    }
  }

  connect(options: { sessionId?: string; admin?: boolean; userId?: string }): void {
    // Skip if disabled or already failed (will use HTTP polling fallback)
    if (!this.enabled || this.connectionFailed) {
      return;
    }

    // Skip if not in browser
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') {
      console.debug('[LiveChat WS] WebSocket not available in this environment');
      return;
    }

    this.sessionId = options.sessionId || null;
    this.isAdmin = options.admin || false;
    this.userId = options.userId || null;

    const wsUrl = this.buildWebSocketUrl();
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.debug('[LiveChat WS] Connected');
        this.reconnectAttempts = 0;
        this.connectionFailed = false;
        this.startPing();
        this.emit({ type: 'connection_established', timestamp: new Date().toISOString() });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          this.emit(data);
        } catch (err) {
          console.debug('[LiveChat WS] Failed to parse message:', err);
        }
      };

      this.ws.onclose = (event) => {
        console.debug('[LiveChat WS] Disconnected:', event.code);
        this.stopPing();
        // Only attempt reconnect if it was a normal close, not an error
        if (event.code !== 1006 && !this.connectionFailed) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = () => {
        // Silent fail - WebSocket is optional, HTTP polling is the fallback
        // This is expected when the WebSocket server is not available
        console.debug('[LiveChat WS] Connection failed - using HTTP polling fallback');
        this.connectionFailed = true;
        this.ws = null;
      };
    } catch {
      // Silent fail - WebSocket is optional
      console.debug('[LiveChat WS] Failed to initialize WebSocket');
      this.connectionFailed = true;
    }
  }

  private buildWebSocketUrl(): string {
    // Convert HTTP URL to WebSocket URL
    const baseUrl = (API_BASE_URL || '').replace(/^http/, 'ws');
    const params = new URLSearchParams();
    
    if (this.sessionId) {
      params.append('sessionId', this.sessionId);
    }
    if (this.isAdmin) {
      params.append('admin', 'true');
    }
    if (this.userId) {
      params.append('userId', this.userId);
    }
    
    return `${baseUrl}/ws/live-chat?${params.toString()}`;
  }

  private attemptReconnect(): void {
    // Don't reconnect if disabled or connection has permanently failed
    if (!this.enabled || this.connectionFailed) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.debug('[LiveChat WS] Max reconnection attempts reached - using HTTP polling');
      this.connectionFailed = true;
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.debug(`[LiveChat WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect({
        sessionId: this.sessionId || undefined,
        admin: this.isAdmin,
        userId: this.userId || undefined,
      });
    }, delay);
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  disconnect(): void {
    this.stopPing();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.callbacks.clear();
    this.reconnectAttempts = 0;
    // Reset connection failed flag so next connect() call can try again
    this.connectionFailed = false;
  }

  send(data: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendTyping(isTyping: boolean): void {
    this.send({ type: 'typing', isTyping, sessionId: this.sessionId });
  }

  sendReadReceipt(messageId: string): void {
    this.send({ type: 'read_receipt', messageId, sessionId: this.sessionId });
  }

  subscribeSession(sessionId: string): void {
    this.send({ type: 'subscribe_session', sessionId });
  }

  unsubscribeSession(sessionId: string): void {
    this.send({ type: 'unsubscribe_session', sessionId });
  }

  on(event: WebSocketEventType | 'all', callback: WebSocketCallback): () => void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set());
    }
    this.callbacks.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.get(event)?.delete(callback);
    };
  }

  private emit(data: WebSocketMessage): void {
    // Call specific event callbacks
    const eventCallbacks = this.callbacks.get(data.type);
    if (eventCallbacks) {
      eventCallbacks.forEach((cb) => cb(data));
    }
    
    // Call 'all' callbacks
    const allCallbacks = this.callbacks.get('all');
    if (allCallbacks) {
      allCallbacks.forEach((cb) => cb(data));
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const liveChatWS = new LiveChatWebSocket();

// ============ PUBLIC API FUNCTIONS ============

/**
 * Create a new chat session
 * POST /api/live-chat/sessions
 */
export async function createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
  try {
    // Try real API service first, falls back to mock automatically
    const result = await realLiveChatService.createSession(request);
    return result;
  } catch (error) {
    logger.error('[LiveChat API] Create session failed:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Get session details
 * GET /api/live-chat/sessions/:sessionId
 */
export async function getSessionDetails(sessionId: string): Promise<SessionDetailsResponse> {
  try {
    const response = await fetchWithAuth(buildEndpoint.sessionById(sessionId));
    return await response.json();
  } catch (error) {
    console.error('[LiveChat API] Get session error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to get session details',
      },
    };
  }
}

/**
 * Send a message
 * POST /api/live-chat/sessions/:sessionId/messages
 * Supports both JSON and multipart form data (for attachments)
 */
export async function sendMessage(
  sessionId: string,
  content: string,
  files?: File[]
): Promise<SendMessageResponse> {
  try {
    let response: Response;
    
    if (files && files.length > 0) {
      // Use multipart form data when sending with attachments
      const formData = new FormData();
      formData.append('content', content);
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      const token = getSessionToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      response = await fetch(`${API_BASE_URL}${buildEndpoint.messages(sessionId)}`, {
        method: 'POST',
        headers,
        body: formData,
      });
    } else {
      // Use JSON for text-only messages
      response = await fetchWithAuth(buildEndpoint.messages(sessionId), {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    }
    
    return await response.json();
  } catch (error) {
    console.debug('[LiveChat API] Send message failed, using mock service:', error);
    return await MockLiveChatService.sendMessage(sessionId, content);
  }
}

/**
 * Get messages for a session
 * GET /api/live-chat/sessions/:sessionId/messages
 */
export async function getMessages(
  sessionId: string,
  options?: { page?: number; limit?: number }
): Promise<GetMessagesResponse> {
  try {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    
    const queryString = params.toString();
    const url = `${buildEndpoint.messages(sessionId)}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetchWithAuth(url);
    return await response.json();
  } catch (error) {
    console.debug('[LiveChat API] Get messages failed, using mock service:', error);
    return await MockLiveChatService.getMessages(sessionId);
  }
}

/**
 * Upload file attachments
 * POST /api/live-chat/upload
 */
export async function uploadAttachments(
  sessionId: string,
  files: File[]
): Promise<UploadResponse> {
  try {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    const token = getSessionToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${buildEndpoint.upload()}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    return await response.json();
  } catch (error) {
    console.error('[LiveChat API] Upload error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to upload files',
      },
    };
  }
}

/**
 * End chat session
 * PATCH /api/live-chat/sessions/:sessionId/end
 */
export async function endSession(
  sessionId: string,
  options?: { rating?: number; feedback?: string }
): Promise<EndSessionResponse> {
  try {
    const response = await fetchWithAuth(buildEndpoint.endSession(sessionId), {
      method: 'PATCH',
      body: JSON.stringify({
        rating: options?.rating,
        feedback: options?.feedback,
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      setSessionToken(null);
      liveChatWS.disconnect();
    }
    
    return data;
  } catch (error) {
    console.debug('[LiveChat API] End session failed, using mock service:', error);
    return await MockLiveChatService.endSession(sessionId);
  }
}

/**
 * Rate chat session
 * POST /api/live-chat/sessions/:sessionId/rate
 */
export async function rateSession(
  sessionId: string,
  request: RateSessionRequest
): Promise<RateSessionResponse> {
  try {
    const response = await fetchWithAuth(buildEndpoint.rateSession(sessionId), {
      method: 'POST',
      body: JSON.stringify({
        score: request.score,
        feedback: request.feedback,
      }),
    });
    
    return await response.json();
  } catch (error) {
    console.debug('[LiveChat API] Rate session failed, using mock service:', error);
    return await MockLiveChatService.rateSession(sessionId, request);
  }
}

/**
 * Send typing indicator
 * POST /api/live-chat/sessions/:sessionId/typing
 */
export async function sendTypingIndicator(
  sessionId: string,
  isTyping: boolean
): Promise<void> {
  try {
    // Prefer WebSocket for real-time
    if (liveChatWS.isConnected()) {
      liveChatWS.sendTyping(isTyping);
    } else {
      // Fallback to HTTP
      await fetchWithAuth(buildEndpoint.typing(sessionId), {
        method: 'POST',
        body: JSON.stringify({ isTyping }),
      });
    }
  } catch (error) {
    // Silently fail for typing indicators
    console.debug('[LiveChat API] Typing indicator error:', error);
  }
}

// ============ ADMIN API FUNCTIONS ============

export interface AdminListSessionsOptions {
  page?: number;
  limit?: number;
  status?: 'pending' | 'active' | 'closed' | 'archived';
  department?: 'general' | 'sales' | 'support' | 'billing' | 'technical';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedAgent?: string;
  search?: string;
}

export interface AdminListSessionsResponse {
  success: boolean;
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
  statusCounts?: {
    pending: number;
    active: number;
    closed: number;
    archived: number;
  };
  data?: Array<{
    sessionId: string;
    user: {
      name: string;
      email: string;
    };
    status: string;
    priority: string;
    lastMessage?: {
      content: string;
      type: string;
      timestamp: string;
    };
    messageCount: number;
    unreadCount: number;
    createdAt: string;
  }>;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Admin: List all chat sessions
 * GET /api/admin/live-chat/sessions
 */
export async function adminListSessions(
  options?: AdminListSessionsOptions
): Promise<AdminListSessionsResponse> {
  try {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.status) params.append('status', options.status);
    if (options?.department) params.append('department', options.department);
    if (options?.priority) params.append('priority', options.priority);
    if (options?.assignedAgent) params.append('assignedAgent', options.assignedAgent);
    if (options?.search) params.append('search', options.search);
    
    const queryString = params.toString();
    const url = `${buildEndpoint.adminSessions()}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetchWithAuth(url);
    return await response.json();
  } catch (error) {
    console.debug('[LiveChat API] Admin list sessions failed, using mock service:', error);
    return await MockLiveChatService.adminListSessions();
  }
}

/**
 * Admin: Get session details with all messages
 * GET /api/admin/live-chat/sessions/:sessionId
 */
export async function adminGetSessionDetails(sessionId: string): Promise<{
  success: boolean;
  data?: {
    session: {
      sessionId: string;
      user: {
        name: string;
        email: string;
        metadata?: {
          userAgent?: string;
          ipAddress?: string;
          pageUrl?: string;
        };
      };
      status: string;
      priority: string;
      department: string;
      assignedAgent?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
      notes?: Array<{
        content: string;
        addedBy: { firstName: string; lastName: string };
        addedAt: string;
      }>;
      rating?: {
        score: number;
        feedback?: string;
        ratedAt: string;
      };
    };
    messages: Array<{
      _id: string;
      type: string;
      content: string;
      agentName?: string;
      attachments?: ChatAttachment[];
      createdAt: string;
    }>;
  };
  error?: { code: string; message: string };
}> {
  try {
    const response = await fetchWithAuth(buildEndpoint.adminSessionById(sessionId));
    return await response.json();
  } catch (error) {
    console.debug('[LiveChat API] Admin get session failed, using mock service:', error);
    return await MockLiveChatService.adminGetSessionDetails(sessionId);
  }
}

/**
 * Admin: Send reply to a session
 * POST /api/admin/live-chat/sessions/:sessionId/reply
 */
export async function adminSendReply(
  sessionId: string,
  content: string,
  files?: File[]
): Promise<SendMessageResponse> {
  try {
    let response: Response;
    
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append('content', content);
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      const token = getSessionToken();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      response = await fetch(`${API_BASE_URL}${buildEndpoint.adminReply(sessionId)}`, {
        method: 'POST',
        headers,
        body: formData,
      });
    } else {
      response = await fetchWithAuth(buildEndpoint.adminReply(sessionId), {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    }
    
    return await response.json();
  } catch (error) {
    console.debug('[LiveChat API] Admin send reply failed, using mock service:', error);
    return await MockLiveChatService.adminSendReply(sessionId, content);
  }
}

/**
 * Admin: Assign session to agent
 * PATCH /api/admin/live-chat/sessions/:sessionId/assign
 */
export async function adminAssignSession(
  sessionId: string,
  agentId: string,
  agentName: string
): Promise<{
  success: boolean;
  message?: string;
  data?: {
    sessionId: string;
    assignedAgent: string;
    agentName: string;
    status: string;
  };
  error?: { code: string; message: string };
}> {
  try {
    const response = await fetchWithAuth(buildEndpoint.adminAssign(sessionId), {
      method: 'PATCH',
      body: JSON.stringify({ agentId, agentName }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('[LiveChat API] Admin assign session error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to assign session',
      },
    };
  }
}

/**
 * Admin: Update session status
 * PATCH /api/admin/live-chat/sessions/:sessionId/status
 */
export async function adminUpdateStatus(
  sessionId: string,
  options: {
    status?: 'pending' | 'active' | 'closed' | 'archived';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    department?: 'general' | 'sales' | 'support' | 'billing' | 'technical';
    tags?: string[];
  }
): Promise<{
  success: boolean;
  message?: string;
  data?: {
    sessionId: string;
    status: string;
    priority: string;
    department: string;
    tags: string[];
  };
  error?: { code: string; message: string };
}> {
  try {
    const response = await fetchWithAuth(buildEndpoint.adminStatus(sessionId), {
      method: 'PATCH',
      body: JSON.stringify(options),
    });
    
    return await response.json();
  } catch (error) {
    console.error('[LiveChat API] Admin update status error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to update status',
      },
    };
  }
}

/**
 * Admin: Add internal note
 * POST /api/admin/live-chat/sessions/:sessionId/notes
 */
export async function adminAddNote(
  sessionId: string,
  content: string
): Promise<{
  success: boolean;
  message?: string;
  data?: {
    content: string;
    addedBy: string;
    addedAt: string;
  };
  error?: { code: string; message: string };
}> {
  try {
    const response = await fetchWithAuth(buildEndpoint.adminNotes(sessionId), {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('[LiveChat API] Admin add note error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to add note',
      },
    };
  }
}

/**
 * Admin: Transfer session to another agent
 * POST /api/admin/live-chat/sessions/:sessionId/transfer
 */
export async function adminTransferSession(
  sessionId: string,
  toAgentId: string,
  toAgentName: string,
  reason?: string
): Promise<{
  success: boolean;
  message?: string;
  data?: {
    sessionId: string;
    assignedAgent: string;
    agentName: string;
  };
  error?: { code: string; message: string };
}> {
  try {
    const response = await fetchWithAuth(buildEndpoint.adminTransfer(sessionId), {
      method: 'POST',
      body: JSON.stringify({ toAgentId, toAgentName, reason }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('[LiveChat API] Admin transfer session error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to transfer session',
      },
    };
  }
}

/**
 * Admin: Get analytics
 * GET /api/admin/live-chat/analytics
 */
export async function adminGetAnalytics(options?: {
  startDate?: string;
  endDate?: string;
}): Promise<{
  success: boolean;
  data?: {
    period: {
      start: string;
      end: string;
    };
    overview: {
      totalSessions: number;
      avgMessages: number;
      closedSessions: number;
      avgRating: number;
    };
    responseTime: {
      avgResponseTime: number;
      minResponseTime: number;
      maxResponseTime: number;
    };
    sessionsByDay: Array<{
      _id: string;
      count: number;
    }>;
    topAgents: Array<{
      _id: string;
      sessionsHandled: number;
      avgRating: number;
    }>;
  };
  error?: { code: string; message: string };
}> {
  try {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    
    const queryString = params.toString();
    const url = `${buildEndpoint.adminAnalytics()}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetchWithAuth(url);
    return await response.json();
  } catch (error) {
    console.debug('[LiveChat API] Admin get analytics failed, using mock service:', error);
    return await MockLiveChatService.adminGetAnalytics();
  }
}

/**
 * Admin: Get customer history
 * GET /api/admin/live-chat/customers/:email/history
 */
export async function adminGetCustomerHistory(
  email: string,
  options?: { page?: number; limit?: number }
): Promise<{
  success: boolean;
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
  data?: Array<{
    sessionId: string;
    status: string;
    messageCount: number;
    rating?: { score: number };
    createdAt: string;
    endedAt?: string;
  }>;
  error?: { code: string; message: string };
}> {
  try {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    
    const queryString = params.toString();
    const url = `${buildEndpoint.adminCustomerHistory(email)}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetchWithAuth(url);
    return await response.json();
  } catch (error) {
    console.error('[LiveChat API] Admin get customer history error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to get customer history',
      },
    };
  }
}

/**
 * Admin: Delete session
 * DELETE /api/admin/live-chat/sessions/:sessionId
 */
export async function adminDeleteSession(
  sessionId: string
): Promise<{
  success: boolean;
  message?: string;
  error?: { code: string; message: string };
}> {
  try {
    const response = await fetchWithAuth(buildEndpoint.adminDeleteSession(sessionId), {
      method: 'DELETE',
    });
    
    return await response.json();
  } catch (error) {
    console.error('[LiveChat API] Admin delete session error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to delete session',
      },
    };
  }
}
