"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Send, Check, Edit, Trash2, MessageSquare } from "lucide-react";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { API_CONFIG, DEV_CONFIG } from "@/lib/env";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isFromUser: boolean;
  isRead: boolean;
  senderId: string;
  senderName?: string;
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
  }>;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data for when API is not available
  const mockConversations: Conversation[] = [
    {
      id: "1",
      name: "Provider One",
      avatar: "PO",
      lastMessage: "day available jk sa monday",
      timestamp: "9/17/25",
      unreadCount: 0,
      messages: [
        {
          id: "1",
          content: "hello",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          isFromUser: false,
          isRead: true,
          senderId: "provider1",
          senderName: "Provider One"
        },
        {
          id: "2",
          content: "Hi",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isFromUser: true,
          isRead: true,
          senderId: "user",
          senderName: "You"
        },
        {
          id: "3",
          content: "Tisting 123",
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
          isFromUser: true,
          isRead: true,
          senderId: "user",
          senderName: "You"
        },
        {
          id: "4",
          content: "asa naka day. mao ni ako nalab",
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          isFromUser: true,
          isRead: true,
          senderId: "user",
          senderName: "You"
        },
        {
          id: "5",
          content: "day available jk sa monday",
          createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
          isFromUser: true,
          isRead: true,
          senderId: "user",
          senderName: "You"
        },
        {
          id: "6",
          content: "dia naku",
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
          isFromUser: false,
          isRead: true,
          senderId: "provider1",
          senderName: "Provider One"
        }
      ],
      participants: [
        { id: "user", name: "You" },
        { id: "provider1", name: "Provider One" }
      ]
    }
  ];

  // API Functions
  const fetchConversations = async () => {
    setLoading(true);
    
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.apiTimeout);
      
      const response = await fetch('/api/communication/conversations', {
        ...createAuthFetchOptions(),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log('API response not ok:', response.status, response.statusText);
        // For 401 errors, treat as API unavailable and use mock data
        if (response.status === 401) {
          console.log('Authentication failed, using mock data');
          // Use mock data instead of throwing error
          setConversations(mockConversations);
          setUsingMockData(true);
          setError(null);
          return;
        }
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API data received:', data);
      setConversations(data);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching conversations:', err);
      // Fallback to mock data when API fails or when mock data is enabled
      if (DEV_CONFIG.enableMockData) {
        console.log('Mock data enabled, using mock data');
        setConversations(mockConversations);
        setUsingMockData(true);
        setError(null); // Clear error since we have mock data
      } else {
        console.log('API unavailable, using mock data as fallback');
        setConversations(mockConversations);
        setUsingMockData(true);
        setError(null); // Clear error since we have mock data
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/communication/conversations/${conversationId}`, createAuthFetchOptions());
      if (!response.ok) throw new Error('Failed to fetch conversation');
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching conversation:', err);
      // Return mock conversation if API fails
      return mockConversations.find(conv => conv.id === conversationId) || null;
    }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    try {
      setSendingMessage(true);
      const response = await fetch(`/api/communication/conversations/${conversationId}/messages`, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify({ content }),
      }));
      
      if (!response.ok) throw new Error('Failed to send message');
      const newMessage = await response.json();
      
      // Update conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, lastMessage: content, timestamp: new Date().toLocaleDateString() }
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
      // Create mock message for local state when API fails
      const mockMessage: Message = {
        id: Date.now().toString(),
        content,
        createdAt: new Date().toISOString(),
        isFromUser: true,
        isRead: false,
        senderId: "user",
        senderName: "You"
      };

      // Update conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, lastMessage: content, timestamp: new Date().toLocaleDateString() }
            : conv
        )
      );

      // Update active conversation
      if (activeConversation?.id === conversationId) {
        setActiveConversation(prev => 
          prev ? { ...prev, messages: [...prev.messages, mockMessage] } : null
        );
      }
      
      return mockMessage;
    } finally {
      setSendingMessage(false);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/communication/conversations/${conversationId}/read`, createAuthFetchOptions({
        method: 'PUT',
      }));
    } catch (err) {
      console.error('Error marking as read:', err);
      // Silently fail - this is not critical functionality
    }
  };

  const updateMessage = async (conversationId: string, messageId: string, content: string) => {
    try {
      const response = await fetch(`/api/communication/conversations/${conversationId}/messages/${messageId}`, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify({ content }),
      }));
      
      if (!response.ok) throw new Error('Failed to update message');
      
      // Update local state
      if (activeConversation?.id === conversationId) {
        setActiveConversation(prev => 
          prev ? {
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === messageId ? { ...msg, content } : msg
            )
          } : null
        );
      }
    } catch (err) {
      console.error('Error updating message:', err);
      // Update local state even if API fails
      if (activeConversation?.id === conversationId) {
        setActiveConversation(prev => 
          prev ? {
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === messageId ? { ...msg, content } : msg
            )
          } : null
        );
      }
    }
  };

  const deleteMessage = async (conversationId: string, messageId: string) => {
    try {
      const response = await fetch(`/api/communication/conversations/${conversationId}/messages/${messageId}`, createAuthFetchOptions({
        method: 'DELETE',
      }));
      
      if (!response.ok) throw new Error('Failed to delete message');
      
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
      // Update local state even if API fails
      if (activeConversation?.id === conversationId) {
        setActiveConversation(prev => 
          prev ? {
            ...prev,
            messages: prev.messages.filter(msg => msg.id !== messageId)
          } : null
        );
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchConversations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Set initial active conversation when conversations are loaded
  useEffect(() => {
    if (conversations.length > 0 && !activeConversation) {
      setActiveConversation(conversations[0]);
    }
  }, [conversations, activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || sendingMessage) return;

    try {
      await sendMessage(activeConversation.id, newMessage);
      setNewMessage("");
    } catch {
      setError('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleConversationSelect = async (conversation: Conversation) => {
    setActiveConversation(conversation);
    await markAsRead(conversation.id);
    
    // Fetch full conversation details if not already loaded
    if (!conversation.messages || conversation.messages.length === 0) {
      const fullConversation = await fetchConversation(conversation.id);
      if (fullConversation) {
        setActiveConversation(fullConversation);
      }
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
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
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchConversations}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 flex">
      {/* Left Sidebar - Conversations */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            {usingMockData && (
              <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span>Offline Mode</span>
                <button
                  onClick={() => {
                    setUsingMockData(false);
                    fetchConversations();
                  }}
                  className="text-amber-700 hover:text-amber-800 underline"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationSelect(conversation)}
                className={`p-4 cursor-pointer transition-colors ${
                  activeConversation?.id === conversation.id
                    ? "bg-gray-100"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-gray-600">
                      {conversation.avatar}
                    </span>
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
                    {conversation.unreadCount > 0 && (
                      <div className="flex justify-end mt-1">
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-white bg-green-500 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-gray-600">
                  {activeConversation.avatar}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {activeConversation.name}
              </h2>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeConversation.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                activeConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isFromUser ? "justify-end" : "justify-start"} group`}
                  >
                    <div className="relative">
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isFromUser
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center justify-end mt-1 space-x-1 ${
                          message.isFromUser ? "text-green-100" : "text-gray-500"
                        }`}>
                          <span className="text-xs">
                            {new Date(message.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
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
                                  updateMessage(activeConversation.id, message.id, newContent);
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
                                  deleteMessage(activeConversation.id, message.id);
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
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={sendingMessage}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
