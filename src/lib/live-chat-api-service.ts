/**
 * Real Live Chat API Service
 * Implements actual API calls to backend live chat services
 * Falls back to mock data when backend is unavailable or in development mode
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL, API_ENDPOINTS } from './api';
import { createAuthFetchOptions } from './auth-utils';
import { logger } from './logger';
import { DEV_CONFIG } from './env';

// Import mock service for fallback
import { MOCK_LIVE_CHAT_STATE } from './live-chat-mock-service';

// Import types
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  SendMessageRequest,
  SendMessageResponse,
  GetMessagesResponse,
  EndSessionResponse,
  RateSessionRequest,
  RateSessionResponse,
  AdminListSessionsResponse,
  AdminSessionResponse,
  AdminReplyRequest,
  AdminAssignRequest,
  AdminStatusRequest,
  AdminNotesRequest,
  AdminTransferRequest,
  ChatMessage,
  ChatAttachment,
  Analytics,
  ChatSession
} from '@/components/live-chat/live-chat-api';

// API Error class
export class LiveChatAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'LiveChatAPIError';
  }
}

// Generic API request wrapper with error handling
async function liveChatApiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 3
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, createAuthFetchOptions(options));
      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        let errorMessage = `Live Chat API request failed: ${response.status} ${response.statusText}`;
        let errorCode: string | undefined;

        // Try to parse error response
        if (contentType?.includes('application/json')) {
          try {
            const errorData = await response.json();
            if (errorData.message) errorMessage = errorData.message;
            if (errorData.error) errorMessage = errorData.error;
            if (errorData.code) errorCode = errorData.code;
          } catch (parseError) {
            logger.warn('Failed to parse live chat error response', { parseError });
          }
        } else {
          try {
            const text = await response.text();
            if (text) errorMessage = text.substring(0, 200);
          } catch (textError) {
            logger.warn('Failed to read live chat error response text', { textError });
          }
        }

        throw new LiveChatAPIError(errorMessage, response.status, errorCode);
      }

      // Parse successful response
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        throw new LiveChatAPIError('Expected JSON response', response.status);
      }

    } catch (error) {
      const isLastAttempt = attempt === retries;

      if (error instanceof LiveChatAPIError) {
        // Don't retry API errors (4xx, 5xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Retry 5xx errors and network errors
        if (!isLastAttempt) {
          logger.warn(`Live Chat API request failed (attempt ${attempt}/${retries}), retrying...`, {
            url,
            error: error.message,
            status: error.status
          });
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
      } else {
        // Network or other errors
        if (!isLastAttempt) {
          logger.warn(`Live Chat Network error (attempt ${attempt}/${retries}), retrying...`, {
            url,
            error: error.message
          });
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
      }

      throw error;
    }
  }

  throw new Error('Unexpected error in live chat API request');
}

// Real Live Chat API Service
export class RealLiveChatService {
  // Session Management
  async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    try {
      return await liveChatApiRequest<CreateSessionResponse>(
        API_ENDPOINTS.liveChatSessions,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        }
      );
    } catch (error) {
      logger.error('Real live chat create session failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock live chat service');
        return MOCK_LIVE_CHAT_STATE.createSession(request);
      }
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<ChatSession> {
    try {
      const response = await liveChatApiRequest<{ data: ChatSession }>(
        `${API_ENDPOINTS.liveChatSessionById}/${sessionId}`
      );
      return response.data;
    } catch (error) {
      logger.error('Real live chat get session failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock live chat service');
        return MOCK_LIVE_CHAT_STATE.getSession(sessionId);
      }
      throw error;
    }
  }

  async endSession(sessionId: string): Promise<EndSessionResponse> {
    try {
      return await liveChatApiRequest<EndSessionResponse>(
        `${API_ENDPOINTS.liveChatEndSession}/${sessionId}/end`,
        {
          method: 'POST',
        }
      );
    } catch (error) {
      logger.error('Real live chat end session failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock live chat service');
        return MOCK_LIVE_CHAT_STATE.endSession(sessionId);
      }
      throw error;
    }
  }

  async rateSession(request: RateSessionRequest): Promise<RateSessionResponse> {
    try {
      return await liveChatApiRequest<RateSessionResponse>(
        `${API_ENDPOINTS.liveChatRateSession}/${request.sessionId}/rate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        }
      );
    } catch (error) {
      logger.error('Real live chat rate session failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock live chat service');
        return MOCK_LIVE_CHAT_STATE.rateSession(request);
      }
      throw error;
    }
  }

  // Message Management
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      return await liveChatApiRequest<SendMessageResponse>(
        `${API_ENDPOINTS.liveChatMessages}/${request.sessionId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        }
      );
    } catch (error) {
      logger.error('Real live chat send message failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock live chat service');
        return MOCK_LIVE_CHAT_STATE.sendMessage(request);
      }
      throw error;
    }
  }

  async getMessages(sessionId: string): Promise<GetMessagesResponse> {
    try {
      const response = await liveChatApiRequest<{ data: GetMessagesResponse }>(
        `${API_ENDPOINTS.liveChatMessages}/${sessionId}/messages`
      );
      return response.data;
    } catch (error) {
      logger.error('Real live chat get messages failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock live chat service');
        return MOCK_LIVE_CHAT_STATE.getMessages(sessionId);
      }
      throw error;
    }
  }

  // Typing Indicators
  async sendTypingIndicator(sessionId: string, isTyping: boolean): Promise<void> {
    try {
      await liveChatApiRequest(
        `${API_ENDPOINTS.liveChatTyping}/${sessionId}/typing`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isTyping }),
        }
      );
    } catch (error) {
      logger.error('Real live chat typing indicator failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock live chat service');
        return MOCK_LIVE_CHAT_STATE.sendTypingIndicator(sessionId, isTyping);
      }
      throw error;
    }
  }

  // File Upload
  async uploadFile(sessionId: string, file: File): Promise<ChatAttachment> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await liveChatApiRequest<{ data: ChatAttachment }>(
        `${API_ENDPOINTS.liveChatUpload}/${sessionId}/upload`,
        {
          method: 'POST',
          body: formData,
          // Don't set Content-Type header - let browser set it with boundary for FormData
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real live chat file upload failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock live chat service');
        return MOCK_LIVE_CHAT_STATE.uploadFile(sessionId, file);
      }
      throw error;
    }
  }

  // Admin Functions
  async adminListSessions(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdminListSessionsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());

      const endpoint = `${API_ENDPOINTS.adminLiveChatSessions}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

      const response = await liveChatApiRequest<{ data: AdminListSessionsResponse }>(endpoint);
      return response.data;
    } catch (error) {
      logger.error('Real live chat admin list sessions failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock live chat service');
        return MOCK_LIVE_CHAT_STATE.adminListSessions(params);
      }
      throw error;
    }
  }

  async adminGetSession(sessionId: string): Promise<AdminSessionResponse> {
    try {
      const response = await liveChatApiRequest<{ data: AdminSessionResponse }>(
        `${API_ENDPOINTS.adminLiveChatSessionById}/${sessionId}`
      );
      return response.data;
    } catch (error) {
      logger.error('Real live chat admin get session failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock live chat service');
        return MOCK_LIVE_CHAT_STATE.adminGetSession(sessionId);
      }
      throw error;
    }
  }

  async adminReply(request: AdminReplyRequest): Promise<SendMessageResponse> {
    try {
      return await liveChatApiRequest<SendMessageResponse>(
        `${API_ENDPOINTS.adminLiveChatReply}/${request.sessionId}/reply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        }
      );
    } catch (error) {
      logger.error('Real live chat admin reply failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock live chat service');
        return MOCK_LIVE_CHAT_STATE.adminReply(request);
      }
      throw error;
    }
  }

  async adminAssign(request: AdminAssignRequest): Promise<void> {
    try {
      await liveChatApiRequest(
        `${API_ENDPOINTS.adminLiveChatAssign}/${request.sessionId}/assign`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        }
      );
    } catch (error) {
      logger.error('Real live chat admin assign failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock live chat service');
        return MOCK_LIVE_CHAT_STATE.adminAssign(request);
      }
      throw error;
    }
  }

  async adminUpdateStatus(request: AdminStatusRequest): Promise<void> {
    try {
      await liveChatApiRequest(
        `${API_ENDPOINTS.adminLiveChatStatus}/${request.sessionId}/status`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        }
      );
    } catch (error) {
      logger.error('Real live chat admin update status failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock live chat service');
        return MOCK_LIVE_CHAT_STATE.adminUpdateStatus(request);
      }
      throw error;
    }
  }

  async adminUpdateNotes(request: AdminNotesRequest): Promise<void> {
    try {
      await liveChatApiRequest(
        `${API_ENDPOINTS.adminLiveChatNotes}/${request.sessionId}/notes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        }
      );
    } catch (error) {
      logger.error('Real live chat admin update notes failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock live chat service');
        return MOCK_LIVE_CHAT_STATE.adminUpdateNotes(request);
      }
      throw error;
    }
  }

  async adminTransfer(request: AdminTransferRequest): Promise<void> {
    try {
      await liveChatApiRequest(
        `${API_ENDPOINTS.adminLiveChatTransfer}/${request.sessionId}/transfer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        }
      );
    } catch (error) {
      logger.error('Real live chat admin transfer failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock live chat service');
        return MOCK_LIVE_CHAT_STATE.adminTransfer(request);
      }
      throw error;
    }
  }

  async adminGetAnalytics(): Promise<Analytics> {
    try {
      const response = await liveChatApiRequest<{ data: Analytics }>(
        API_ENDPOINTS.adminLiveChatAnalytics
      );
      return response.data;
    } catch (error) {
      logger.error('Real live chat admin analytics failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock live chat service');
        return MOCK_LIVE_CHAT_STATE.adminGetAnalytics();
      }
      throw error;
    }
  }

  async adminGetCustomerHistory(email: string): Promise<ChatSession[]> {
    try {
      const response = await liveChatApiRequest<{ data: ChatSession[] }>(
        `${API_ENDPOINTS.adminLiveChatCustomerHistory}/${encodeURIComponent(email)}/history`
      );
      return response.data;
    } catch (error) {
      logger.error('Real live chat admin customer history failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock live chat service');
        return MOCK_LIVE_CHAT_STATE.adminGetCustomerHistory(email);
      }
      throw error;
    }
  }

  async adminDeleteSession(sessionId: string): Promise<void> {
    try {
      await liveChatApiRequest(
        `${API_ENDPOINTS.adminLiveChatDeleteSession}/${sessionId}`,
        {
          method: 'DELETE',
        }
      );
    } catch (error) {
      logger.error('Real live chat admin delete session failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock live chat service');
        return MOCK_LIVE_CHAT_STATE.adminDeleteSession(sessionId);
      }
      throw error;
    }
  }
}

// Singleton instance
export const realLiveChatService = new RealLiveChatService();



