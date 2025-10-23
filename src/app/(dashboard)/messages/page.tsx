"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Search, Send, Check, Edit, Trash2, MessageSquare, MoreVertical, Paperclip, Smile, Phone, Video } from "lucide-react";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { API_CONFIG } from "@/lib/env";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isFromUser: boolean;
  isRead: boolean;
  senderId: string;
  senderName?: string;
  messageType?: 'text' | 'image' | 'file' | 'system';
  attachments?: Array<{
    id: string;
    url: string;
    type: string;
    name: string;
    size: number;
  }>;
  editedAt?: string;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: Message[];
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
    lastSeen?: string;
  }>;
  isGroup?: boolean;
  isTyping?: boolean;
  typingUsers?: string[];
}

export default function MessagesPage() {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [notifications, setNotifications] = useState<{ id: string; [key: string]: unknown }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // API Functions
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsRetrying(false);
    
    try {
      await retryWithBackoff(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.apiTimeout);
        
        const response = await fetch('/api/communication/conversations', {
          ...createAuthFetchOptions(),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication required. Please log in again.');
          }
          if (response.status === 403) {
            throw new Error('Access denied. You do not have permission to view conversations.');
          }
          if (response.status >= 500) {
            throw new Error('Server error. Please try again later.');
          }
          throw new Error(`Failed to load conversations: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setConversations(data || []);
        setRetryCount(0); // Reset retry count on success
      });
    } catch (err) {
      console.error('Error fetching conversations:', err);
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
  }, [retryWithBackoff, retryCount]);

  const fetchConversation = useCallback(async (conversationId: string, page: number = 1) => {
    try {
      const response = await fetch(`/api/communication/conversations/${conversationId}?page=${page}&limit=20`, createAuthFetchOptions());
      if (!response.ok) {
        throw new Error(`Failed to fetch conversation: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching conversation:', err);
      throw err;
    }
  }, []);

  const loadMoreMessages = useCallback(async () => {
    if (!activeConversation || loadingMoreMessages || !hasMoreMessages) return;
    
    setLoadingMoreMessages(true);
    try {
      const nextPage = messagePage + 1;
      const data = await fetchConversation(activeConversation.id, nextPage);
      
      if (data.messages && data.messages.length > 0) {
        setActiveConversation(prev => 
          prev ? { 
            ...prev, 
            messages: [...data.messages, ...prev.messages] 
          } : null
        );
        setMessagePage(nextPage);
        setHasMoreMessages(data.messages.length === 20); // Assuming 20 is the page size
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setLoadingMoreMessages(false);
    }
  }, [activeConversation, loadingMoreMessages, hasMoreMessages, messagePage, fetchConversation]);

  // Notification functions
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/communication/unread-count', createAuthFetchOptions());
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
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
    try {
      setSendingMessage(true);
      const response = await fetch(`/api/communication/conversations/${conversationId}/messages`, createAuthFetchOptions({
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
      
      const newMessage = await response.json();
      
      // Update conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { 
                ...conv, 
                lastMessage: content, 
                timestamp: new Date().toLocaleDateString(),
                unreadCount: 0
              }
            : conv
        )
      );

      // Update active conversation
      if (activeConversation?.id === conversationId) {
        setActiveConversation(prev => 
          prev ? { ...prev, messages: [...prev.messages, newMessage] } : null
        );
      }
      
      return newMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    } finally {
      setSendingMessage(false);
    }
  }, [activeConversation]);

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/communication/conversations/${conversationId}/read`, createAuthFetchOptions({
        method: 'PUT',
      }));
      
      if (!response.ok) {
        console.warn('Failed to mark conversation as read:', response.status);
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, []);

  const updateMessage = useCallback(async (conversationId: string, messageId: string, content: string) => {
    try {
      const response = await fetch(`/api/communication/conversations/${conversationId}/messages/${messageId}`, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify({ content }),
      }));
      
      if (!response.ok) {
        throw new Error(`Failed to update message: ${response.status} ${response.statusText}`);
      }
      
      const updatedMessage = await response.json();
      
      // Update local state
      if (activeConversation?.id === conversationId) {
        setActiveConversation(prev => 
          prev ? {
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === messageId ? { ...msg, ...updatedMessage } : msg
            )
          } : null
        );
      }
    } catch (err) {
      console.error('Error updating message:', err);
      throw err;
    }
  }, [activeConversation]);

  const deleteMessage = useCallback(async (conversationId: string, messageId: string) => {
    try {
      const response = await fetch(`/api/communication/conversations/${conversationId}/messages/${messageId}`, createAuthFetchOptions({
        method: 'DELETE',
      }));
      
      if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.status} ${response.statusText}`);
      }
      
      // Update local state
      if (activeConversation?.id === conversationId) {
        setActiveConversation(prev => 
          prev ? {
            ...prev,
            messages: prev.messages.filter(msg => msg.id !== messageId)
          } : null
        );
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      throw err;
    }
  }, [activeConversation]);

  // Enhanced utility functions
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Real-time features
  const setupEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    try {
      const eventSource = new EventSource('/api/communication/events');
      eventSourceRef.current = eventSource;
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'new_message':
              if (data.conversationId === activeConversation?.id) {
                setActiveConversation(prev => 
                  prev ? { ...prev, messages: [...prev.messages, data.message] } : null
                );
              }
              // Update conversations list
              setConversations(prev => 
                prev.map(conv => 
                  conv.id === data.conversationId 
                    ? { 
                        ...conv, 
                        lastMessage: data.message.content, 
                        timestamp: new Date().toLocaleDateString(),
                        unreadCount: conv.id === activeConversation?.id ? 0 : conv.unreadCount + 1
                      }
                    : conv
                )
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
              if (data.conversationId === activeConversation?.id) {
                setActiveConversation(prev => 
                  prev ? {
                    ...prev,
                    messages: prev.messages.map(msg => 
                      msg.id === data.messageId ? { ...msg, isRead: true } : msg
                    )
                  } : null
                );
              }
              break;
              
            case 'notification':
              setNotifications(prev => [data.notification, ...prev]);
              setUnreadCount(prev => prev + 1);
              break;
              
            case 'unread_count_update':
              setUnreadCount(data.count);
              break;
          }
        } catch (err) {
          console.error('Error parsing event data:', err);
        }
      };
      
      eventSource.onerror = (err) => {
        console.error('EventSource error:', err);
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            setupEventSource();
          }
        }, 5000);
      };
    } catch (err) {
      console.error('Error setting up EventSource:', err);
    }
  }, [activeConversation]);

  const handleTyping = useCallback((conversationId: string) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing start event
    fetch('/api/communication/typing', createAuthFetchOptions({
      method: 'POST',
      body: JSON.stringify({ conversationId, type: 'start' })
    })).catch(err => console.error('Error sending typing event:', err));
    
    setIsTyping(true);
    
    const timeout = setTimeout(() => {
      setIsTyping(false);
      // Send typing stop event
      fetch('/api/communication/typing', createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify({ conversationId, type: 'stop' })
      })).catch(err => console.error('Error sending typing stop event:', err));
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
    
    try {
      await sendMessage(activeConversation.id, '', 'file', attachments);
    } catch (err) {
      console.error('Error uploading files:', err);
    }
  }, [activeConversation, sendMessage]);

  const searchMessages = useCallback(async (query: string) => {
    if (!activeConversation || !query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/communication/search?conversationId=${activeConversation.id}&query=${encodeURIComponent(query)}`, createAuthFetchOptions());
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      }
    } catch (err) {
      console.error('Error searching messages:', err);
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
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [fetchConversations, fetchUnreadCount, setupEventSource]);

  // Set initial active conversation when conversations are loaded
  useEffect(() => {
    if (conversations.length > 0 && !activeConversation) {
      setActiveConversation(conversations[0]);
    }
  }, [conversations, activeConversation]);

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
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [typingTimeout]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !activeConversation || sendingMessage) return;

    try {
      await sendMessage(activeConversation.id, newMessage);
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
      handleTyping(activeConversation.id);
    }
  }, [activeConversation, handleTyping]);

  const handleConversationSelect = useCallback(async (conversation: Conversation) => {
    setActiveConversation(conversation);
    setShowMobileConversations(false); // Close mobile menu on selection
    setMessagePage(1);
    setHasMoreMessages(true);
    await markAsRead(conversation.id);
    
    // Fetch full conversation details if not already loaded
    if (!conversation.messages || conversation.messages.length === 0) {
      try {
        const fullConversation = await fetchConversation(conversation.id, 1);
        if (fullConversation) {
          setActiveConversation(fullConversation);
          setHasMoreMessages(fullConversation.messages.length === 20);
        }
      } catch (err) {
        console.error('Error fetching conversation details:', err);
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
    
    try {
      await updateMessage(activeConversation.id, messageId, newContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update message');
    }
  }, [activeConversation, updateMessage]);

  const handleMessageDelete = useCallback(async (messageId: string) => {
    if (!activeConversation) return;
    
    try {
      await deleteMessage(activeConversation.id, messageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  }, [activeConversation, deleteMessage]);

  const filteredConversations = useMemo(() => {
    if (!Array.isArray(conversations)) {
      console.warn('conversations is not an array:', conversations);
      return [];
    }
    return conversations.filter(conv =>
      conv.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
    return (
      <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load conversations</h3>
          <p className="text-red-500 mb-4">{error}</p>
          
          {isRetrying && (
            <div className="mb-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                <span className="text-sm text-gray-500">Retrying... (Attempt {retryCount + 1}/3)</span>
              </div>
            </div>
          )}
          
          <div className="flex space-x-2">
            <button 
              onClick={fetchConversations}
              disabled={isRetrying}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </button>
            {retryCount > 0 && (
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
    <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col lg:flex-row relative">
      {/* Mobile overlay */}
      {showMobileConversations && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setShowMobileConversations(false)}
        />
      )}
      
      {/* Left Sidebar - Conversations */}
      <div className={`w-full lg:w-80 border-r border-gray-200 flex flex-col transition-transform duration-300 z-30 ${
        showMobileConversations ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowMessageSearch(!showMessageSearch)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Search messages"
              >
                <Search className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => {/* TODO: Add new conversation */}}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="New conversation"
              >
                <MessageSquare className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
            />
          </div>
          
          {/* Message Search */}
          {showMessageSearch && (
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={messageSearchQuery}
                  onChange={(e) => setMessageSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                />
              </div>
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
              className={`p-4 cursor-pointer transition-all duration-300 ease-in-out border-l-2 transform hover:scale-[1.02] ${
                activeConversation?.id === conversation.id
                  ? "bg-green-50 border-green-500 shadow-sm"
                  : "border-transparent hover:bg-gray-50 hover:shadow-sm"
              }`}
            >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-white">
                        {conversation.avatar}
                      </span>
                    </div>
                    {conversation.participants.some(p => p.isOnline) && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {conversation.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {conversation.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {conversation.lastMessage}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      {conversation.isTyping && (
                        <span className="text-xs text-green-500 italic">typing...</span>
                      )}
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-white bg-green-500 rounded-full">
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
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-white">
                      {activeConversation.avatar}
                    </span>
                  </div>
                  {activeConversation.participants.some(p => p.isOnline) && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {activeConversation.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {activeConversation.participants.some(p => p.isOnline) 
                      ? "Online" 
                      : `Last seen ${activeConversation.participants[0]?.lastSeen || 'recently'}`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {/* TODO: Add call functionality */}}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Voice call"
                >
                  <Phone className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => {/* TODO: Add video call functionality */}}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Video call"
                >
                  <Video className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setShowMessageActions(!showMessageActions)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="More options"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" onScroll={handleScroll}>
              {/* Search Results */}
              {showMessageSearch && searchResults.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Search Results ({searchResults.length})</h4>
                  <div className="space-y-2">
                    {searchResults.slice(0, 3).map((message) => (
                      <div key={message.id} className="text-sm text-blue-800 bg-white p-2 rounded border">
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
                      key={message.id} 
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
                        
                        <div className={`flex items-end space-x-2 ${message.isFromUser ? "flex-row-reverse space-x-reverse" : ""}`}>
                          {!message.isFromUser && showAvatar && (
                            <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium text-white">
                                {message.senderName?.charAt(0) || 'U'}
                              </span>
                            </div>
                          )}
                          
                          <div className="relative">
                            <div
                              className={`px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-md ${
                                message.isFromUser
                                  ? "bg-green-500 text-white hover:bg-green-600"
                                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                              }`}
                            >
                              {message.replyTo && (
                                <div className={`text-xs mb-1 p-2 rounded ${
                                  message.isFromUser ? "bg-green-400" : "bg-gray-200"
                                }`}>
                                  <p className="font-medium">{message.replyTo.senderName}</p>
                                  <p className="truncate">{message.replyTo.content}</p>
                                </div>
                              )}
                              
                              <p className="text-sm">{message.content}</p>
                              
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {message.attachments.map((attachment) => (
                                    <div key={attachment.id} className="text-xs">
                                      <a 
                                        href={attachment.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="underline hover:no-underline"
                                      >
                                        📎 {attachment.name}
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className={`flex items-center justify-end mt-1 space-x-1 ${
                                message.isFromUser ? "text-green-100" : "text-gray-500"
                              }`}>
                                <span className="text-xs">
                                  {new Date(message.createdAt).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                {message.editedAt && (
                                  <span className="text-xs italic">(edited)</span>
                                )}
                                {message.isFromUser && (
                                  <Check className="w-3 h-3" />
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
                                      if (newContent && newContent !== message.content) {
                                        handleMessageEdit(message.id, newContent);
                                      }
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    title="Edit message"
                                  >
                                    <Edit className="w-3 h-3 text-gray-600" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this message?')) {
                                        handleMessageDelete(message.id);
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
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">
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
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Add emoji"
                >
                  <Smile className="w-4 h-4 text-gray-500" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={sendingMessage}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
