"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import * as LiveChatAPI from "./live-chat-api";
import { liveChatWS } from "./live-chat-api";
import * as DemoBridge from "./demo-bridge";

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  type: "user" | "agent" | "system";
  content: string;
  timestamp: Date;
  agentName?: string;
  agentAvatar?: string;
  attachments?: ChatAttachment[];
  isRead?: boolean;
}

export interface ChatUser {
  name: string;
  email: string;
  phone?: string;
}

export interface AssignedAgent {
  id: string;
  name: string;
  avatar?: string;
}

export interface ChatSession {
  id: string;
  user: ChatUser;
  messages: ChatMessage[];
  startedAt: Date;
  status: "active" | "closed" | "pending" | "archived";
  assignedAgent?: AssignedAgent;
  priority?: "low" | "medium" | "high" | "urgent";
  department?: string;
}

export interface ChatRating {
  score: number;
  feedback?: string;
  submitted: boolean;
}

interface LiveChatContextType {
  // State
  isOpen: boolean;
  isMinimized: boolean;
  messages: ChatMessage[];
  user: ChatUser | null;
  isTyping: boolean;
  isAgentTyping: boolean;
  unreadCount: number;
  sessionId: string | null;
  sessionStatus: "active" | "closed" | "pending" | "archived" | null;
  assignedAgent: AssignedAgent | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  rating: ChatRating | null;
  
  // Actions
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  minimizeChat: () => void;
  sendMessage: (content: string, files?: File[]) => Promise<void>;
  uploadFiles: (files: File[]) => Promise<ChatAttachment[]>;
  setUser: (user: ChatUser) => Promise<void>;
  clearUnread: () => void;
  endChat: (rating?: number, feedback?: string) => Promise<void>;
  rateChat: (score: number, feedback?: string) => Promise<void>;
  sendTypingIndicator: (isTyping: boolean) => void;
}

const LiveChatContext = createContext<LiveChatContextType | undefined>(undefined);

// Welcome message shown before API connection
const welcomeMessage: ChatMessage = {
  id: "welcome",
  type: "agent",
  content: "Hi! 👋 Welcome to LocalPro support. I'm here to help you with any questions about our services. How can I assist you today?",
  timestamp: new Date(),
  agentName: "Ria",
  agentAvatar: "R",
};

// Generate unique session ID
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Polling interval for new messages (fallback when WebSocket is not connected)
const MESSAGE_POLL_INTERVAL = 5000;

export function LiveChatProvider({ children }: { children: React.ReactNode }) {
  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [user, setUserState] = useState<ChatUser | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"active" | "closed" | "pending" | "archived" | null>(null);
  const [assignedAgent, setAssignedAgent] = useState<AssignedAgent | null>(null);
  
  // Typing State
  const [isTyping, setIsTyping] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  
  // Connection State
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Unread & Rating
  const [unreadCount, setUnreadCount] = useState(0);
  const [rating, setRating] = useState<ChatRating | null>(null);
  
  // Refs
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show notification bubble after delay if user hasn't interacted
  useEffect(() => {
    if (!hasInteracted) {
      const timer = setTimeout(() => {
        setUnreadCount(1);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [hasInteracted]);

  // Set up WebSocket event handlers
  useEffect(() => {
    if (!sessionId) return;

    // Connection established
    const unsubConnect = liveChatWS.on('connection_established', () => {
      setIsConnected(true);
      console.log('[LiveChat] WebSocket connected');
    });

    // Agent message received
    const unsubAgentMessage = liveChatWS.on('agent_message', (data) => {
      if (data.message && data.sessionId === sessionId) {
        const newMessage: ChatMessage = {
          id: data.message.id || `msg-${Date.now()}`,
          type: "agent",
          content: data.message.content,
          timestamp: new Date(data.message.timestamp || new Date()),
          agentName: data.message.agentName,
          agentAvatar: data.message.agentAvatar,
          attachments: data.message.attachments,
        };
        
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.find((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
        
        // Increment unread if minimized or closed
        if (isMinimized || !isOpen) {
          setUnreadCount((prev) => prev + 1);
        }
        
        setIsAgentTyping(false);
      }
    });

    // Agent typing indicator
    const unsubAgentTyping = liveChatWS.on('agent_typing', (data) => {
      if (data.sessionId === sessionId) {
        setIsAgentTyping(data.isTyping || false);
      }
    });

    // Agent assigned
    const unsubAgentAssigned = liveChatWS.on('agent_assigned', (data) => {
      if (data.sessionId === sessionId && data.agent) {
        setAssignedAgent({
          id: data.agent.id,
          name: data.agent.name,
          avatar: data.agent.avatar,
        });
        setSessionStatus('active');
        
        // Add system message
        const systemMessage: ChatMessage = {
          id: `system-agent-${Date.now()}`,
          type: "system",
          content: `${data.agent.name} has joined the chat`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, systemMessage]);
      }
    });

    // Session status changed
    const unsubStatusChanged = liveChatWS.on('session_status_changed', (data) => {
      if (data.sessionId === sessionId && data.status) {
        setSessionStatus(data.status as "active" | "closed" | "pending" | "archived");
        
        if (data.status === 'closed') {
          const systemMessage: ChatMessage = {
            id: `system-closed-${Date.now()}`,
            type: "system",
            content: "This chat session has ended",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, systemMessage]);
        }
      }
    });

    // Error handling
    const unsubError = liveChatWS.on('error', (data) => {
      console.error('[LiveChat] WebSocket error:', data.error);
      setIsConnected(false);
    });

    return () => {
      unsubConnect();
      unsubAgentMessage();
      unsubAgentTyping();
      unsubAgentAssigned();
      unsubStatusChanged();
      unsubError();
    };
  }, [sessionId, isOpen, isMinimized]);

  // Fallback: Poll for new messages when WebSocket is not connected
  useEffect(() => {
    if (sessionId && user && isOpen && !isConnected) {
      const pollMessages = async () => {
        try {
          const response = await LiveChatAPI.getMessages(sessionId, { limit: 50 });

          if (response.success && response.data) {
            const apiMessages = response.data;
            
            // Convert API messages to our format
            const newMessages = apiMessages
              .map((msg) => ({
                id: msg._id,
                type: msg.type,
                content: msg.content,
                timestamp: new Date(msg.createdAt),
                agentName: msg.agentName,
                attachments: msg.attachments,
              }))
              .filter((msg) => !messages.find((m) => m.id === msg.id));

            if (newMessages.length > 0) {
              setMessages((prev) => {
                const combined = [...prev];
                newMessages.forEach((newMsg) => {
                  if (!combined.find((m) => m.id === newMsg.id)) {
                    combined.push(newMsg);
                  }
                });
                return combined.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
              });
              
              // Increment unread for agent messages
              const agentMessages = newMessages.filter((m) => m.type === 'agent');
              if (agentMessages.length > 0 && (isMinimized || !isOpen)) {
                setUnreadCount((prev) => prev + agentMessages.length);
              }
            }
          }
        } catch (err) {
          console.error('[LiveChat] Polling error:', err);
        }
      };

      // Initial poll
      pollMessages();

      // Set up polling interval
      pollingRef.current = setInterval(pollMessages, MESSAGE_POLL_INTERVAL);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      };
    }
  }, [sessionId, user, isOpen, isConnected, isMinimized, messages]);

  // Subscribe to demo bridge agent messages (for demo mode without backend)
  useEffect(() => {
    if (sessionId && isOpen) {
      const unsubscribe = DemoBridge.subscribeToAgentMessages(sessionId, (demoMessage) => {
        // Check if message already exists
        setMessages((prev) => {
          const exists = prev.some(m => m.id === demoMessage._id);
          if (exists) return prev;
          
          const newMessage: ChatMessage = {
            id: demoMessage._id,
            type: 'agent',
            content: demoMessage.content,
            timestamp: new Date(demoMessage.createdAt),
            agentName: demoMessage.agentName || 'Support Agent',
          };
          
          // Show notification if minimized or not open
          if (isMinimized || !isOpen) {
            setUnreadCount((count) => count + 1);
          }
          
          return [...prev, newMessage];
        });
      });
      
      return unsubscribe;
    }
  }, [sessionId, isOpen, isMinimized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      liveChatWS.disconnect();
    };
  }, []);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    setHasInteracted(true);
    setUnreadCount(0);
    setError(null);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const toggleChat = useCallback(() => {
    if (isOpen && !isMinimized) {
      closeChat();
    } else {
      openChat();
    }
  }, [isOpen, isMinimized, openChat, closeChat]);

  const minimizeChat = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const sendMessage = useCallback(async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;
    if (!sessionId) {
      setError('No active session');
      return;
    }

    // Optimistically add message to UI
    const tempId = `temp-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: tempId,
      type: "user",
      content: content.trim(),
      timestamp: new Date(),
      attachments: files?.map((f, i) => ({
        id: `temp-attach-${i}`,
        name: f.name,
        type: f.type,
        size: f.size,
        url: URL.createObjectURL(f),
        previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
      })),
    };

    setMessages((prev) => [...prev, userMessage]);
    setHasInteracted(true);
    setIsTyping(false);

    // Also save to demo bridge for admin visibility
    DemoBridge.addCustomerMessage(sessionId, content.trim());

    try {
      // Send to API with files
      const response = await LiveChatAPI.sendMessage(sessionId, content.trim(), files);

      if (response.success && response.data) {
        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? {
                  id: response.data!._id,
                  type: response.data!.type,
                  content: response.data!.content,
                  timestamp: new Date(response.data!.createdAt),
                  attachments: response.data!.attachments,
                }
              : msg
          )
        );
      } else {
        // API failed but message saved to demo bridge - keep the message
        console.debug('[LiveChat] API unavailable, message saved to demo bridge');
        // Update temp message with a permanent ID
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? { ...msg, id: `demo-${Date.now()}` }
              : msg
          )
        );
      }
    } catch (err) {
      console.debug('[LiveChat] API error, message saved to demo bridge:', err);
      // Message saved to demo bridge - keep it
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? { ...msg, id: `demo-${Date.now()}` }
            : msg
        )
      );
    }
  }, [sessionId]);

  const uploadFiles = useCallback(async (files: File[]): Promise<ChatAttachment[]> => {
    if (!sessionId) {
      setError('No active session');
      return [];
    }

    try {
      const response = await LiveChatAPI.uploadAttachments(sessionId, files);
      
      if (response.success && response.data?.attachments) {
        return response.data.attachments;
      } else {
        setError(response.error?.message || 'Failed to upload files');
        return [];
      }
    } catch (err) {
      console.error('[LiveChat] Upload error:', err);
      setError('Failed to upload files');
      return [];
    }
  }, [sessionId]);

  const setUser = useCallback(async (newUser: ChatUser) => {
    setIsConnecting(true);
    setError(null);
    
    const newSessionId = generateSessionId();
    
    try {
      // Create session via API
      const response = await LiveChatAPI.createSession({
        sessionId: newSessionId,
        user: newUser,
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      });

      if (response.success && response.data) {
        setUserState(newUser);
        setSessionId(response.data.session.sessionId);
        setSessionStatus(response.data.session.status);
        
        // Connect WebSocket
        liveChatWS.connect({ sessionId: response.data.session.sessionId });
        
        // Add system message
        const systemMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          type: "system",
          content: `${newUser.name} joined the chat`,
          timestamp: new Date(),
        };
        
        // Add welcome message from API if provided
        if (response.data.welcomeMessage) {
          const welcomeMsg: ChatMessage = {
            id: `welcome-api-${Date.now()}`,
            type: response.data.welcomeMessage.type,
            content: response.data.welcomeMessage.content,
            timestamp: new Date(),
            agentName: response.data.welcomeMessage.agentName || "System",
          };
          setMessages((prev) => [...prev, systemMessage, welcomeMsg]);
        } else {
          setMessages((prev) => [...prev, systemMessage]);
        }
        
        // Also create in demo bridge for admin visibility
        DemoBridge.createSession(newUser, response.data.session.sessionId);
        
        console.log('[LiveChat] Session created:', response.data.session.sessionId);
      } else {
        // API failed - use demo bridge mode
        console.debug('[LiveChat] API unavailable, using demo mode');
        setUserState(newUser);
        setSessionId(newSessionId);
        setSessionStatus('active');
        
        // Create session in demo bridge
        DemoBridge.createSession(newUser, newSessionId);
        
        // Add welcome message
        const systemMessage: ChatMessage = {
          id: `system-${Date.now()}`,
          type: "system",
          content: `${newUser.name} joined the chat`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, systemMessage]);
        
        console.log('[LiveChat] Demo session created:', newSessionId);
      }
    } catch (err) {
      console.debug('[LiveChat] API error, using demo mode:', err);
      // Fallback to demo bridge mode
      setUserState(newUser);
      setSessionId(newSessionId);
      setSessionStatus('active');
      
      // Create session in demo bridge
      DemoBridge.createSession(newUser, newSessionId);
      
      // Add welcome message
      const systemMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        type: "system",
        content: `${newUser.name} joined the chat`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, systemMessage]);
      
      console.log('[LiveChat] Demo session created:', newSessionId);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const endChat = useCallback(async (ratingScore?: number, feedback?: string) => {
    if (sessionId) {
      try {
        await LiveChatAPI.endSession(sessionId, { rating: ratingScore, feedback });
        
        // Add system message
        const systemMessage: ChatMessage = {
          id: `system-end-${Date.now()}`,
          type: "system",
          content: "Chat session ended. Thank you for contacting us!",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, systemMessage]);
        setSessionStatus('closed');
        
        if (ratingScore) {
          setRating({ score: ratingScore, feedback, submitted: true });
        }
      } catch (err) {
        console.error('[LiveChat] End session error:', err);
      }
    }

    // Stop polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    
    // Disconnect WebSocket
    liveChatWS.disconnect();
    setIsConnected(false);
  }, [sessionId]);

  const rateChat = useCallback(async (score: number, feedback?: string) => {
    if (!sessionId) return;

    try {
      const response = await LiveChatAPI.rateSession(sessionId, { score, feedback });
      
      if (response.success) {
        setRating({ score, feedback, submitted: true });
        
        // Add thank you message
        const thankYouMessage: ChatMessage = {
          id: `system-thanks-${Date.now()}`,
          type: "system",
          content: "Thank you for your feedback! 🙏",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, thankYouMessage]);
      } else {
        setError(response.error?.message || 'Failed to submit rating');
      }
    } catch (err) {
      console.error('[LiveChat] Rate session error:', err);
      setError('Failed to submit rating');
    }
  }, [sessionId]);

  const sendTypingIndicator = useCallback((typing: boolean) => {
    setIsTyping(typing);
    
    if (!sessionId) return;

    // Debounce typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      LiveChatAPI.sendTypingIndicator(sessionId, typing);
    }, 300);
  }, [sessionId]);

  return (
    <LiveChatContext.Provider
      value={{
        isOpen,
        isMinimized,
        messages,
        user,
        isTyping,
        isAgentTyping,
        unreadCount,
        sessionId,
        sessionStatus,
        assignedAgent,
        isConnecting,
        isConnected,
        error,
        rating,
        openChat,
        closeChat,
        toggleChat,
        minimizeChat,
        sendMessage,
        uploadFiles,
        setUser,
        clearUnread,
        endChat,
        rateChat,
        sendTypingIndicator,
      }}
    >
      {children}
    </LiveChatContext.Provider>
  );
}

export function useLiveChat() {
  const context = useContext(LiveChatContext);
  if (context === undefined) {
    throw new Error("useLiveChat must be used within a LiveChatProvider");
  }
  return context;
}
