/**
 * Mock Live Chat Service
 * Provides fallback real-time messaging functionality while backend services are being developed
 * Simulates WebSocket connections and real-time messaging using timers and local state
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CreateSessionRequest,
  CreateSessionResponse,
  SendMessageRequest,
  SendMessageResponse,
  GetMessagesResponse,
  EndSessionResponse,
  RateSessionRequest,
  RateSessionResponse,
  AdminListSessionsResponse,
  ChatMessage,
  ChatAttachment
} from '@/components/live-chat/live-chat-api';

// Mock data and state management
class MockLiveChatState {
  private sessions: Map<string, any> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();
  private sessionCounter = 1;
  private messageCounter = 1;
  private callbacks: Map<string, Set<(data: any) => void>> = new Map();

  // Generate mock session
  createSession(request: CreateSessionRequest): CreateSessionResponse {
    const sessionId = `mock_session_${this.sessionCounter++}`;
    const session = {
      sessionId,
      user: request.user,
      status: 'active' as const,
      priority: 'medium' as const,
      department: 'general',
      messageCount: 1,
      unreadCount: 0,
      startedAt: new Date().toISOString(),
      userAgent: request.user.name,
      ipAddress: '127.0.0.1',
      pageUrl: request.pageUrl || window.location.href
    };

    this.sessions.set(sessionId, session);
    this.messages.set(sessionId, []);

    // Add welcome message
    const welcomeMessage: ChatMessage = {
      _id: `mock_msg_${this.messageCounter++}`,
      id: `mock_msg_${this.messageCounter - 1}`,
      sessionId,
      type: 'agent',
      content: `Hello ${request.user.name}! How can I help you today?`,
      agentName: 'Support Agent',
      createdAt: new Date().toISOString(),
      isRead: false,
      attachments: []
    };

    this.messages.get(sessionId)!.push(welcomeMessage);

    return {
      success: true,
      message: 'Session created successfully',
      data: {
        session,
        welcomeMessage: {
          sessionId,
          type: 'system',
          content: 'Welcome to our live chat support!',
          agentName: 'Support Agent'
        }
      }
    };
  }

  // Send message
  sendMessage(sessionId: string, content: string): SendMessageResponse {
    if (!this.sessions.has(sessionId)) {
      return {
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' }
      };
    }

    const message: ChatMessage = {
      _id: `mock_msg_${this.messageCounter++}`,
      id: `mock_msg_${this.messageCounter - 1}`,
      sessionId,
      type: 'user',
      content,
      createdAt: new Date().toISOString(),
      isRead: false,
      attachments: []
    };

    this.messages.get(sessionId)!.push(message);

    // Simulate agent response after delay
    setTimeout(() => {
      this.simulateAgentResponse(sessionId);
    }, 2000 + Math.random() * 3000);

    // Update session stats
    const session = this.sessions.get(sessionId)!;
    session.messageCount++;
    session.lastMessage = {
      content: content.length > 50 ? content.substring(0, 50) + '...' : content,
      type: 'user',
      timestamp: message.createdAt
    };

    return {
      success: true,
      data: {
        _id: message._id,
        sessionId,
        type: 'user',
        content,
        attachments: [],
        isRead: false,
        createdAt: message.createdAt
      }
    };
  }

  // Simulate agent response
  private simulateAgentResponse(sessionId: string): void {
    if (!this.sessions.has(sessionId)) return;

    const responses = [
      "Thank you for your question. Let me help you with that.",
      "I understand your concern. Here's what I can do to assist you.",
      "That's a great question! Let me provide you with more information.",
      "I appreciate you reaching out. I'm here to help resolve this for you.",
      "Let me check that for you. One moment please.",
      "I can definitely help you with this. Here's what you need to know:",
      "Thank you for your patience. I'm working on your request now.",
      "I see what you're asking about. Let me explain this clearly.",
      "That's an excellent point. Let me provide some additional context.",
      "I appreciate your feedback. Here's how we can address this:"
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    const agentMessage: ChatMessage = {
      _id: `mock_msg_${this.messageCounter++}`,
      id: `mock_msg_${this.messageCounter - 1}`,
      sessionId,
      type: 'agent',
      content: randomResponse,
      agentName: 'Support Agent',
      createdAt: new Date().toISOString(),
      isRead: false,
      attachments: []
    };

    this.messages.get(sessionId)!.push(agentMessage);

    // Update session stats
    const session = this.sessions.get(sessionId)!;
    session.messageCount++;
    session.lastMessage = {
      content: randomResponse.length > 50 ? randomResponse.substring(0, 50) + '...' : randomResponse,
      type: 'agent',
      timestamp: agentMessage.createdAt
    };

    // Emit WebSocket-like event
    this.emitEvent(sessionId, 'new_message', { message: agentMessage });
  }

  // Get messages
  getMessages(sessionId: string): GetMessagesResponse {
    if (!this.sessions.has(sessionId)) {
      return {
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' }
      };
    }

    const messages = this.messages.get(sessionId) || [];

    return {
      success: true,
      count: messages.length,
      total: messages.length,
      page: 1,
      pages: 1,
      data: messages.map(msg => ({
        _id: msg._id,
        sessionId: msg.sessionId,
        type: msg.type,
        content: msg.content,
        agentName: msg.agentName,
        attachments: msg.attachments,
        createdAt: msg.createdAt
      }))
    };
  }

  // End session
  endSession(sessionId: string): EndSessionResponse {
    if (!this.sessions.has(sessionId)) {
      return {
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' }
      };
    }

    const session = this.sessions.get(sessionId)!;
    session.status = 'closed';
    session.endedAt = new Date().toISOString();

    return {
      success: true,
      data: {
        sessionId,
        status: 'closed',
        endedAt: session.endedAt
      }
    };
  }

  // Rate session
  rateSession(sessionId: string, request: RateSessionRequest): RateSessionResponse {
    if (!this.sessions.has(sessionId)) {
      return {
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' }
      };
    }

    const session = this.sessions.get(sessionId)!;
    session.rating = {
      score: request.score,
      feedback: request.feedback,
      ratedAt: new Date().toISOString()
    };

    return {
      success: true,
      data: {
        rating: session.rating
      }
    };
  }

  // Admin functions
  adminListSessions(): AdminListSessionsResponse {
    const sessions = Array.from(this.sessions.values()).map(session => ({
      sessionId: session.sessionId,
      user: {
        name: session.user.name,
        email: session.user.email
      },
      status: session.status,
      priority: session.priority,
      lastMessage: session.lastMessage,
      messageCount: session.messageCount,
      unreadCount: session.unreadCount,
      createdAt: session.startedAt
    }));

    return {
      success: true,
      count: sessions.length,
      total: sessions.length,
      page: 1,
      pages: 1,
      statusCounts: {
        pending: sessions.filter(s => s.status === 'pending').length,
        active: sessions.filter(s => s.status === 'active').length,
        closed: sessions.filter(s => s.status === 'closed').length,
        archived: sessions.filter(s => s.status === 'archived').length
      },
      data: sessions
    };
  }

  adminSendReply(sessionId: string, content: string): SendMessageResponse {
    if (!this.sessions.has(sessionId)) {
      return {
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' }
      };
    }

    const message: ChatMessage = {
      _id: `mock_msg_${this.messageCounter++}`,
      id: `mock_msg_${this.messageCounter - 1}`,
      sessionId,
      type: 'agent',
      content,
      agentName: 'Admin Agent',
      createdAt: new Date().toISOString(),
      isRead: false,
      attachments: []
    };

    this.messages.get(sessionId)!.push(message);

    // Update session stats
    const session = this.sessions.get(sessionId)!;
    session.messageCount++;
    session.lastMessage = {
      content: content.length > 50 ? content.substring(0, 50) + '...' : content,
      type: 'agent',
      timestamp: message.createdAt
    };

    // Emit WebSocket-like event
    this.emitEvent(sessionId, 'new_message', { message });

    return {
      success: true,
      data: {
        _id: message._id,
        sessionId,
        type: 'agent',
        content,
        attachments: [],
        isRead: false,
        createdAt: message.createdAt
      }
    };
  }

  // Event system to simulate WebSocket
  on(event: string, callback: (data: any) => void): () => void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set());
    }
    this.callbacks.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks.get(event)?.delete(callback);
    };
  }

  private emitEvent(sessionId: string, event: string, data: any): void {
    const eventCallbacks = this.callbacks.get(event);
    if (eventCallbacks) {
      eventCallbacks.forEach(callback => callback({
        type: event,
        sessionId,
        ...data,
        timestamp: new Date().toISOString()
      }));
    }

    // Also emit to 'all' event
    const allCallbacks = this.callbacks.get('all');
    if (allCallbacks) {
      allCallbacks.forEach(callback => callback({
        type: event,
        sessionId,
        ...data,
        timestamp: new Date().toISOString()
      }));
    }
  }

  // Simulate typing indicators
  simulateTyping(sessionId: string, isTyping: boolean): void {
    this.emitEvent(sessionId, 'typing', { isTyping, agentName: 'Support Agent' });
  }

  // Get session details
  getSessionDetails(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' }
      };
    }

    return {
      success: true,
      data: {
        sessionId: session.sessionId,
        user: session.user,
        status: session.status,
        assignedAgent: session.assignedAgent || { _id: 'admin_1', firstName: 'Admin', lastName: 'Agent' },
        messageCount: session.messageCount,
        startedAt: session.startedAt
      }
    };
  }
}

// Export singleton instance
const mockLiveChatState = new MockLiveChatState();

// Mock Live Chat Service
export class MockLiveChatService {
  private static state = mockLiveChatState;

  // Public API methods
  static async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    return this.state.createSession(request);
  }

  static async sendMessage(sessionId: string, content: string): Promise<SendMessageResponse> {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    return this.state.sendMessage(sessionId, content);
  }

  static async getMessages(sessionId: string): Promise<GetMessagesResponse> {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
    return this.state.getMessages(sessionId);
  }

  static async endSession(sessionId: string): Promise<EndSessionResponse> {
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 600));
    return this.state.endSession(sessionId);
  }

  static async rateSession(sessionId: string, request: RateSessionRequest): Promise<RateSessionResponse> {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
    return this.state.rateSession(sessionId, request);
  }

  // Admin methods
  static async adminListSessions(): Promise<AdminListSessionsResponse> {
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 700));
    return this.state.adminListSessions();
  }

  static async adminSendReply(sessionId: string, content: string): Promise<SendMessageResponse> {
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));
    return this.state.adminSendReply(sessionId, content);
  }

  static async adminGetSessionDetails(sessionId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 600));
    return this.state.getSessionDetails(sessionId);
  }

  // Event subscription (simulates WebSocket)
  static on(event: string, callback: (data: any) => void): () => void {
    return this.state.on(event, callback);
  }

  // Simulate typing
  static simulateTyping(sessionId: string, isTyping: boolean): void {
    this.state.simulateTyping(sessionId, isTyping);
  }

  // Analytics mock
  static async adminGetAnalytics(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const sessions = Array.from(this.state['sessions'].values());
    const totalSessions = sessions.length;
    const closedSessions = sessions.filter(s => s.status === 'closed').length;
    const avgRating = 4.2;

    return {
      success: true,
      data: {
        period: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        },
        overview: {
          totalSessions,
          avgMessages: Math.round(totalSessions * 8.5),
          closedSessions,
          avgRating
        },
        responseTime: {
          avgResponseTime: 180, // seconds
          minResponseTime: 30,
          maxResponseTime: 600
        },
        sessionsByDay: Array.from({ length: 7 }, (_, i) => ({
          _id: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 10) + 1
        })),
        topAgents: [
          { _id: 'admin_1', sessionsHandled: 15, avgRating: 4.5 },
          { _id: 'admin_2', sessionsHandled: 12, avgRating: 4.1 },
          { _id: 'admin_3', sessionsHandled: 8, avgRating: 4.3 }
        ]
      }
    };
  }
}

// Export the mock service as the default live chat service for now
export default MockLiveChatService;
