"use client";

import { useState, useEffect, useCallback } from 'react';
import { User, MessageSquare, Phone, Video } from 'lucide-react';
import Image from 'next/image';
import { CommunicationAPI, MessageUtils } from '@/lib/communication-utils';
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

interface User {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: number;
}

interface ConversationWithUserProps {
  userId: string;
  onConversationFound: (conversation: Conversation) => void;
  onCreateConversation: (userId: string) => void;
}

export default function ConversationWithUser({ 
  userId, 
  onConversationFound, 
  onCreateConversation 
}: ConversationWithUserProps) {
  const [user, setUser] = useState<User | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInfo = useCallback(async () => {
    try {
      // This would typically fetch user info from a users API
      // For now, we'll use a mock response
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.usersById}/${userId}`, createAuthFetchOptions());
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (err) {
      logger.error('Error fetching user info', err instanceof Error ? err : new Error(String(err)));
    }
  }, [userId]);

  const checkExistingConversation = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await CommunicationAPI.getConversationWithUser(userId);
      if (data.conversation) {
        setConversation(data.conversation);
        onConversationFound(data.conversation);
      }
    } catch (err) {
      logger.error('Error checking existing conversation', err instanceof Error ? err : new Error(String(err)));
      setError('Failed to check for existing conversation');
    } finally {
      setLoading(false);
    }
  }, [userId, onConversationFound]);

  const startConversation = useCallback(async () => {
    try {
      setLoading(true);
      const newConversation = await CommunicationAPI.createConversation([userId]);
      setConversation(newConversation);
      onConversationFound(newConversation);
      onCreateConversation(userId);
    } catch (err) {
      logger.error('Error creating conversation', err instanceof Error ? err : new Error(String(err)));
      setError('Failed to start conversation');
    } finally {
      setLoading(false);
    }
  }, [userId, onConversationFound, onCreateConversation]);

  useEffect(() => {
    fetchUserInfo();
    checkExistingConversation();
  }, [fetchUserInfo, checkExistingConversation]);

  if (!user) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading user information...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            {user.avatar ? (
              <Image src={user.avatar} alt={user.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <User className="h-6 w-6 text-gray-500" />
            )}
          </div>
          {user.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{user.name}</h3>
          <p className="text-sm text-gray-500">
            {user.isOnline ? 'Online' : user.lastSeen ? `Last seen ${user.lastSeen}` : 'Offline'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {conversation ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">Existing Conversation</span>
            </div>
            <span className="text-xs text-blue-600">
              {conversation.lastMessage ? MessageUtils.getMessagePreview(conversation.lastMessage.content) : 'No messages yet'}
            </span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => onConversationFound(conversation)}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm font-medium"
            >
              Open Conversation
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg">
              <Phone className="h-4 w-4" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg">
              <Video className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-center text-gray-600 text-sm">
            No existing conversation with {user.name}
          </div>
          
          <button
            onClick={startConversation}
            disabled={loading}
            className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? 'Starting conversation...' : 'Start Conversation'}
          </button>
        </div>
      )}
    </div>
  );
}
