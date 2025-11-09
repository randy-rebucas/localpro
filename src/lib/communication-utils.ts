import { createAuthFetchOptions } from './auth-utils';
import { API_BASE_URL, API_ENDPOINTS } from './api';
import { logger } from './logger';

// Communication API utility functions
export class CommunicationAPI {
  private static baseUrl = `${API_BASE_URL}${API_ENDPOINTS.communicationConversations.replace('/conversations', '')}`;

  // Conversation Management
  static async getConversations(params?: { page?: number; limit?: number; search?: string }) {
    const queryString = new URLSearchParams();
    if (params?.page) queryString.append('page', params.page.toString());
    if (params?.limit) queryString.append('limit', params.limit.toString());
    if (params?.search) queryString.append('search', params.search);

    const response = await fetch(`${this.baseUrl}/conversations?${queryString}`, createAuthFetchOptions());
    if (!response.ok) throw new Error(`Failed to fetch conversations: ${response.status}`);
    return response.json();
  }

  static async getConversation(conversationId: string, params?: { page?: number; limit?: number }) {
    const queryString = new URLSearchParams();
    if (params?.page) queryString.append('page', params.page.toString());
    if (params?.limit) queryString.append('limit', params.limit.toString());

    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}?${queryString}`, createAuthFetchOptions());
    if (!response.ok) throw new Error(`Failed to fetch conversation: ${response.status}`);
    return response.json();
  }

  static async getConversationWithUser(userId: string, params?: { page?: number; limit?: number }) {
    const queryString = new URLSearchParams();
    if (params?.page) queryString.append('page', params.page.toString());
    if (params?.limit) queryString.append('limit', params.limit.toString());

    const response = await fetch(`${this.baseUrl}/conversation-with/${userId}?${queryString}`, createAuthFetchOptions());
    if (!response.ok) throw new Error(`Failed to fetch conversation with user: ${response.status}`);
    return response.json();
  }

  static async createConversation(participants: string[], title?: string, isGroup: boolean = false) {
    const response = await fetch(`${this.baseUrl}/conversations`, createAuthFetchOptions({
      method: 'POST',
      body: JSON.stringify({ participants, title, isGroup })
    }));
    if (!response.ok) throw new Error(`Failed to create conversation: ${response.status}`);
    return response.json();
  }

  static async deleteConversation(conversationId: string) {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, createAuthFetchOptions({
      method: 'DELETE'
    }));
    if (!response.ok) throw new Error(`Failed to delete conversation: ${response.status}`);
    return response.json();
  }

  // Message Management
  static async sendMessage(conversationId: string, content: string, messageType: string = 'text', attachments: { name: string; type: string; size: number; file: File }[] = []) {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages`, createAuthFetchOptions({
      method: 'POST',
      body: JSON.stringify({ content, messageType, attachments })
    }));
    if (!response.ok) throw new Error(`Failed to send message: ${response.status}`);
    return response.json();
  }

  static async updateMessage(conversationId: string, messageId: string, content: string) {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages/${messageId}`, createAuthFetchOptions({
      method: 'PUT',
      body: JSON.stringify({ content })
    }));
    if (!response.ok) throw new Error(`Failed to update message: ${response.status}`);
    return response.json();
  }

  static async deleteMessage(conversationId: string, messageId: string) {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages/${messageId}`, createAuthFetchOptions({
      method: 'DELETE'
    }));
    if (!response.ok) throw new Error(`Failed to delete message: ${response.status}`);
    return response.json();
  }

  // Read Status Management
  static async markConversationAsRead(conversationId: string, messageId?: string) {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/read`, createAuthFetchOptions({
      method: 'PUT',
      body: JSON.stringify({ messageId })
    }));
    if (!response.ok) throw new Error(`Failed to mark conversation as read: ${response.status}`);
    return response.json();
  }

  static async getUnreadCount() {
    const response = await fetch(`${this.baseUrl}/unread-count`, createAuthFetchOptions());
    if (!response.ok) throw new Error(`Failed to fetch unread count: ${response.status}`);
    return response.json();
  }

  // Notification System
  static async getNotifications(params?: { page?: number; limit?: number; type?: string; read?: boolean }) {
    const queryString = new URLSearchParams();
    if (params?.page) queryString.append('page', params.page.toString());
    if (params?.limit) queryString.append('limit', params.limit.toString());
    if (params?.type) queryString.append('type', params.type);
    if (params?.read !== undefined) queryString.append('read', params.read.toString());

    const response = await fetch(`${this.baseUrl}/notifications?${queryString}`, createAuthFetchOptions());
    if (!response.ok) throw new Error(`Failed to fetch notifications: ${response.status}`);
    return response.json();
  }

  static async getNotificationCount() {
    const response = await fetch(`${this.baseUrl}/notifications/count`, createAuthFetchOptions());
    if (!response.ok) throw new Error(`Failed to fetch notification count: ${response.status}`);
    return response.json();
  }

  static async markNotificationAsRead(notificationId: string) {
    const response = await fetch(`${this.baseUrl}/notifications/${notificationId}/read`, createAuthFetchOptions({
      method: 'PUT'
    }));
    if (!response.ok) throw new Error(`Failed to mark notification as read: ${response.status}`);
    return response.json();
  }

  static async markAllNotificationsAsRead() {
    const response = await fetch(`${this.baseUrl}/notifications/read-all`, createAuthFetchOptions({
      method: 'PUT'
    }));
    if (!response.ok) throw new Error(`Failed to mark all notifications as read: ${response.status}`);
    return response.json();
  }

  static async deleteNotification(notificationId: string) {
    const response = await fetch(`${this.baseUrl}/notifications/${notificationId}`, createAuthFetchOptions({
      method: 'DELETE'
    }));
    if (!response.ok) throw new Error(`Failed to delete notification: ${response.status}`);
    return response.json();
  }

  // Communication Channels
  static async sendEmailNotification(recipient: string, subject: string, content: string, template?: string) {
    const response = await fetch(`${this.baseUrl}/notifications/email`, createAuthFetchOptions({
      method: 'POST',
      body: JSON.stringify({ recipient, subject, content, template })
    }));
    if (!response.ok) throw new Error(`Failed to send email notification: ${response.status}`);
    return response.json();
  }

  static async sendSmsNotification(phoneNumber: string, message: string, template?: string) {
    const response = await fetch(`${this.baseUrl}/notifications/sms`, createAuthFetchOptions({
      method: 'POST',
      body: JSON.stringify({ phoneNumber, message, template })
    }));
    if (!response.ok) throw new Error(`Failed to send SMS notification: ${response.status}`);
    return response.json();
  }

  // Search
  static async searchConversations(query: string, params?: { page?: number; limit?: number }) {
    const queryString = new URLSearchParams();
    queryString.append('q', query);
    if (params?.page) queryString.append('page', params.page.toString());
    if (params?.limit) queryString.append('limit', params.limit.toString());

    const response = await fetch(`${this.baseUrl}/search?${queryString}`, createAuthFetchOptions());
    if (!response.ok) throw new Error(`Failed to search conversations: ${response.status}`);
    return response.json();
  }

  // Real-time Events
  static async connectToEvents(): Promise<EventSource> {
    return new EventSource(`${this.baseUrl}/events`);
  }

  static async sendTypingEvent(conversationId: string, type: 'start' | 'stop') {
    const response = await fetch(`${this.baseUrl}/typing`, createAuthFetchOptions({
      method: 'POST',
      body: JSON.stringify({ conversationId, type })
    }));
    if (!response.ok) throw new Error(`Failed to send typing event: ${response.status}`);
    return response.json();
  }
}

// Real-time communication utilities
export class RealtimeCommunication {
  private static eventSource: EventSource | null = null;
  private static callbacks: Map<string, ((data: unknown) => void)[]> = new Map();

  static connect() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(`${API_BASE_URL}${API_ENDPOINTS.communicationEvents}`);
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(data.type, data);
      } catch (err) {
        logger.error('Error parsing event data', err instanceof Error ? err : new Error(String(err)));
      }
    };

    this.eventSource.onerror = (err) => {
      logger.error('EventSource error', err instanceof Error ? err : new Error(String(err)));
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this.connect();
        }
      }, 5000);
    };
  }

  static disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  static on(event: string, callback: (data: unknown) => void) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  static off(event: string, callback: (data: unknown) => void) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private static emit(event: string, data: unknown) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Typing indicators
  static async sendTyping(conversationId: string, type: 'start' | 'stop') {
    try {
      await CommunicationAPI.sendTypingEvent(conversationId, type);
    } catch (err) {
      logger.error('Error sending typing event', err instanceof Error ? err : new Error(String(err)), { conversationId, type });
    }
  }
}

// Message formatting utilities
export const MessageUtils = {
  formatTimestamp: (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  },

  formatFileSize: (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  },

  getMessagePreview: (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  },

  isImageFile: (filename: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  },

  isVideoFile: (filename: string) => {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }
};

// Notification utilities
export const NotificationUtils = {
  createNotification: (title: string, body: string, icon?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon });
    }
  },

  requestPermission: async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  },

  formatNotificationTime: (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }
};
