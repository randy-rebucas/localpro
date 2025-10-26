"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  MessageSquare, 
  Bell, 
  Mail, 
  Users, 
  Search, 
  RefreshCw, 
  Send,
  MoreVertical,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  CreditCard
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";

interface CommunicationStats {
  totalConversations: number;
  totalMessages: number;
  totalNotifications: number;
  unreadMessages: number;
  unreadNotifications: number;
  activeUsers: number;
  responseTime: number;
  satisfactionRate: number;
  messageGrowth: number;
  notificationGrowth: number;
}

interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    isOnline: boolean;
  }>;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
    senderName: string;
  };
  unreadCount: number;
  status: 'active' | 'archived' | 'blocked';
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'message' | 'email' | 'system' | 'booking' | 'payment' | 'alert';
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipientId: string;
  recipientName: string;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

interface CommunicationOverview {
  stats: CommunicationStats;
  recentConversations: Conversation[];
  recentNotifications: Notification[];
  topUsers: Array<{
    id: string;
    name: string;
    messageCount: number;
    lastActive: string;
  }>;
}

export default function AdminCommunication() {
  const [overview, setOverview] = useState<CommunicationOverview | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'conversations' | 'notifications'>('overview');
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCommunicationData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        type: activeTab === 'overview' ? 'overview' : activeTab,
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(filterType !== 'all' && { type: filterType }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`/api/admin/communication?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch communication data`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load communication data');
      }

      // Debug logging for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Communication data received:', result.data);
      }

      if (activeTab === 'overview') {
        setOverview(result.data || {});
      } else if (activeTab === 'conversations') {
        const conversationsData = result.data || [];
        setConversations(Array.isArray(conversationsData) ? conversationsData : []);
      } else if (activeTab === 'notifications') {
        const notificationsData = result.data || [];
        setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching communication data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load communication data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, filterType, filterStatus, searchQuery, itemsPerPage]);

  useEffect(() => {
    fetchCommunicationData();
  }, [fetchCommunicationData]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchCommunicationData();
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'archived': return 'text-gray-600 bg-gray-100';
      case 'blocked': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'system': return <Bell className="w-4 h-4" />;
      case 'booking': return <Calendar className="w-4 h-4" />;
      case 'payment': return <CreditCard className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading communication data..." />
      </div>
    );
  }

  if (error) {
    return (
      <AdminErrorState 
        error={error}
        onRetry={refreshData}
        retryText="Try Again"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Communication Management
          </h1>
          <p className="text-gray-600 text-sm">Manage conversations, notifications, and messaging</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500">Total Conversations</p>
                <p className="text-lg font-bold text-gray-900">
                  {overview.stats.totalConversations.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {overview.stats.unreadMessages} unread
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              {overview.stats.messageGrowth > 0 ? (
                <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
              )}
              <span className={`font-medium ${overview.stats.messageGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {overview.stats.messageGrowth > 0 ? '+' : ''}{overview.stats.messageGrowth}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500">Total Messages</p>
                <p className="text-lg font-bold text-gray-900">
                  {overview.stats.totalMessages.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {overview.stats.responseTime}s avg response
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Send className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500">Notifications</p>
                <p className="text-lg font-bold text-gray-900">
                  {overview.stats.totalNotifications.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {overview.stats.unreadNotifications} unread
                </p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Bell className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              {overview.stats.notificationGrowth > 0 ? (
                <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
              )}
              <span className={`font-medium ${overview.stats.notificationGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {overview.stats.notificationGrowth > 0 ? '+' : ''}{overview.stats.notificationGrowth}%
              </span>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500">Active Users</p>
                <p className="text-lg font-bold text-gray-900">
                  {overview.stats.activeUsers.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {overview.stats.satisfactionRate}% satisfaction
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-4">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'conversations', name: 'Conversations', icon: MessageSquare },
              { id: 'notifications', name: 'Notifications', icon: Bell }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'conversations' | 'notifications')}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* Search and Filters */}
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations, users, or messages..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="message">Messages</option>
                <option value="email">Email</option>
                <option value="system">System</option>
                <option value="booking">Bookings</option>
                <option value="payment">Payments</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'overview' && overview && overview.stats && (
            <div className="space-y-4">
              {/* Recent Conversations */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Conversations</h3>
                <div className="space-y-2">
                  {overview.recentConversations.slice(0, 5).map((conversation) => (
                    <div key={conversation.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {conversation.participants.map(p => p.name).join(', ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {conversation.messageCount} messages
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(conversation.status)}`}>
                          {conversation.status}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Notifications */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Notifications</h3>
                <div className="space-y-2">
                  {overview.recentNotifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-3">
                        <div className="text-blue-500">
                          {getNotificationTypeIcon(notification.type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-xs text-gray-500">{notification.recipientName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'conversations' && (
            <div className="space-y-3">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No conversations found</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div key={conversation.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {conversation.participants.map(p => p.name).join(', ')}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {conversation.participants.map(p => p.email).join(', ')}
                          </p>
                          {conversation.lastMessage && (
                            <p className="text-xs text-gray-600 mt-1">
                              Last message: {conversation.lastMessage.content.substring(0, 50)}...
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(conversation.status)}`}>
                          {conversation.status}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>{conversation.messageCount} messages</span>
                      <span>{formatTimeAgo(conversation.updatedAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No notifications found</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div key={notification.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-blue-500">
                          {getNotificationTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                          <p className="text-xs text-gray-500">{notification.recipientName}</p>
                          <p className="text-sm text-gray-600 mt-1">{notification.content}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>{notification.type}</span>
                      <span>{formatTimeAgo(notification.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
