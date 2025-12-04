/**
 * Demo Bridge for Live Chat
 * 
 * This module provides localStorage-based communication between
 * the admin panel and customer chat widget for demo/testing purposes
 * when a real backend API is not available.
 * 
 * In production, this should be replaced by actual API calls and WebSocket.
 */

const STORAGE_KEYS = {
  MESSAGES: 'livechat_demo_messages',
  SESSIONS: 'livechat_demo_sessions',
  AGENT_REPLIES: 'livechat_demo_agent_replies',
};

export interface DemoMessage {
  _id: string;
  sessionId: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  agentName?: string;
  createdAt: string;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
}

export interface DemoSession {
  sessionId: string;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  status: 'pending' | 'active' | 'closed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  messages: DemoMessage[];
}

// Check if we're in browser
const isBrowser = typeof window !== 'undefined';

/**
 * Get all sessions from localStorage
 */
export function getSessions(): DemoSession[] {
  if (!isBrowser) return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save sessions to localStorage
 */
export function saveSessions(sessions: DemoSession[]): void {
  if (!isBrowser) return;
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  // Dispatch storage event for cross-tab communication
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.SESSIONS,
    newValue: JSON.stringify(sessions),
  }));
}

/**
 * Get a session by ID
 */
export function getSession(sessionId: string): DemoSession | null {
  const sessions = getSessions();
  return sessions.find(s => s.sessionId === sessionId) || null;
}

/**
 * Create or update a session
 */
export function upsertSession(session: DemoSession): void {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.sessionId === session.sessionId);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }
  saveSessions(sessions);
}

/**
 * Get messages for a session
 */
export function getMessages(sessionId: string): DemoMessage[] {
  const session = getSession(sessionId);
  return session?.messages || [];
}

/**
 * Add a message to a session (from customer)
 */
export function addCustomerMessage(sessionId: string, content: string, attachments?: DemoMessage['attachments']): DemoMessage {
  const sessions = getSessions();
  const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);
  
  const message: DemoMessage = {
    _id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    type: 'user',
    content,
    createdAt: new Date().toISOString(),
    attachments,
  };
  
  if (sessionIndex >= 0) {
    sessions[sessionIndex].messages.push(message);
    sessions[sessionIndex].status = 'pending'; // Mark as pending when customer sends
    saveSessions(sessions);
  }
  
  return message;
}

/**
 * Add an agent reply to a session (from admin)
 */
export function addAgentReply(sessionId: string, content: string, agentName: string = 'Support Agent'): DemoMessage {
  const sessions = getSessions();
  const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);
  
  const message: DemoMessage = {
    _id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    type: 'agent',
    content,
    agentName,
    createdAt: new Date().toISOString(),
  };
  
  if (sessionIndex >= 0) {
    sessions[sessionIndex].messages.push(message);
    sessions[sessionIndex].status = 'active'; // Mark as active when agent replies
    saveSessions(sessions);
  }
  
  // Also store in agent replies for notification
  notifyNewAgentMessage(message);
  
  return message;
}

/**
 * Notify about new agent message (for cross-tab communication)
 */
function notifyNewAgentMessage(message: DemoMessage): void {
  if (!isBrowser) return;
  
  // Store the latest agent reply for polling
  const replies = getAgentReplies();
  replies.push(message);
  // Keep only last 100 replies
  if (replies.length > 100) {
    replies.shift();
  }
  localStorage.setItem(STORAGE_KEYS.AGENT_REPLIES, JSON.stringify(replies));
  
  // Dispatch custom event for same-tab communication
  window.dispatchEvent(new CustomEvent('livechat_agent_reply', {
    detail: message
  }));
  
  // Also dispatch storage event for cross-tab communication
  window.dispatchEvent(new StorageEvent('storage', {
    key: STORAGE_KEYS.AGENT_REPLIES,
    newValue: JSON.stringify(replies),
  }));
}

/**
 * Get recent agent replies (for polling)
 */
export function getAgentReplies(): DemoMessage[] {
  if (!isBrowser) return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AGENT_REPLIES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Subscribe to new agent messages
 */
export function subscribeToAgentMessages(
  sessionId: string,
  callback: (message: DemoMessage) => void
): () => void {
  if (!isBrowser) return () => {};

  // Handler for same-tab custom events
  const customEventHandler = (e: Event) => {
    const message = (e as CustomEvent<DemoMessage>).detail;
    if (message.sessionId === sessionId) {
      callback(message);
    }
  };

  // Handler for cross-tab storage events
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.AGENT_REPLIES && e.newValue) {
      try {
        const replies: DemoMessage[] = JSON.parse(e.newValue);
        const latestReply = replies[replies.length - 1];
        if (latestReply && latestReply.sessionId === sessionId) {
          callback(latestReply);
        }
      } catch {
        // Ignore parse errors
      }
    }
  };

  window.addEventListener('livechat_agent_reply', customEventHandler);
  window.addEventListener('storage', storageHandler);

  return () => {
    window.removeEventListener('livechat_agent_reply', customEventHandler);
    window.removeEventListener('storage', storageHandler);
  };
}

/**
 * Create a new session (from customer)
 */
export function createSession(user: DemoSession['user'], sessionId: string): DemoSession {
  const session: DemoSession = {
    sessionId,
    user,
    status: 'pending',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    messages: [{
      _id: `msg-welcome-${sessionId}`,
      sessionId,
      type: 'system',
      content: `Chat session started with ${user.name}`,
      createdAt: new Date().toISOString(),
    }],
  };
  
  upsertSession(session);
  return session;
}

/**
 * Update session status
 */
export function updateSessionStatus(sessionId: string, status: DemoSession['status']): void {
  const session = getSession(sessionId);
  if (session) {
    session.status = status;
    upsertSession(session);
  }
}

/**
 * Clear all demo data
 */
export function clearDemoData(): void {
  if (!isBrowser) return;
  localStorage.removeItem(STORAGE_KEYS.MESSAGES);
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.AGENT_REPLIES);
}

// Export storage keys for debugging
export { STORAGE_KEYS };

