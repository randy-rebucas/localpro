"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Search,
  Clock,
  RefreshCw,
  MessageSquare,
  Settings,
  User,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { useSession } from "@/hooks/useAuth";
import { makeClientAuthenticatedRequestWithPathSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { Skeleton } from "@/components/ui/loading";
import { ListSkeleton } from "@/components/ui/loading";

export interface ActivityItem {
  id: string;
  type: string;
  action: string;
  description: string;
  timestamp: string;
  icon: string;
  status?: "success" | "warning" | "error" | "info";
  metadata?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

const getActivityIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'dashboard':
      return <Activity className="w-4 h-4 text-blue-600" />;
    case 'marketplace':
      return <Activity className="w-4 h-4 text-green-600" />;
    case 'profile':
      return <User className="w-4 h-4 text-indigo-600" />;
    case 'messages':
      return <MessageSquare className="w-4 h-4 text-orange-600" />;
    case 'settings':
      return <Settings className="w-4 h-4 text-gray-600" />;
    case 'login':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'logout':
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    default:
      return <Info className="w-4 h-4 text-blue-600" />;
  }
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'success':
      return 'text-green-600';
    case 'warning':
      return 'text-yellow-600';
    case 'error':
      return 'text-red-600';
    case 'info':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session, status } = useSession();
  console.log("Activity Page - Session:", session);
  console.log("Activity Page - Status:", status);
  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        if (session?.user?.id) {
          try {
            const response = await makeClientAuthenticatedRequestWithPathSafe(
              "logsUserActivity" as keyof typeof API_ENDPOINTS,
              [session.user.id]
            );
            if (response.ok) {
              const activityData = await response.json();
              setActivities(activityData);
              return;
            }
            throw new Error('Failed to fetch activities');
          } catch {}
        }
      } catch {
        // Fallback to mock data
        setActivities([
          {
            id: '1',
            type: 'dashboard',
            action: 'Dashboard accessed',
            description: 'User accessed the main dashboard',
            timestamp: new Date().toISOString(),
            icon: 'dashboard',
            status: 'success',
            userId: session?.user?.id || 'user-1'
          },
          {
            id: '2',
            type: 'marketplace',
            action: 'Service viewed',
            description: 'Viewed cleaning service details',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            icon: 'marketplace',
            status: 'info',
            userId: session?.user?.id || 'user-1'
          },
          {
            id: '3',
            type: 'profile',
            action: 'Profile updated',
            description: 'Updated personal information',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            icon: 'profile',
            status: 'success',
            userId: session?.user?.id || 'user-1'
          },
          {
            id: '4',
            type: 'messages',
            action: 'Message sent',
            description: 'Sent message to service provider',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            icon: 'messages',
            status: 'success',
            userId: session?.user?.id || 'user-1'
          },
          {
            id: '5',
            type: 'login',
            action: 'User login',
            description: 'Successfully logged into the platform',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            icon: 'login',
            status: 'success',
            userId: session?.user?.id || 'user-1'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated" && session?.user?.id) {
      fetchActivities();
    }
  }, [session, status]);

  const refreshActivity = async () => {
    setLoading(true);
    try {
      if (session?.user?.id) {
        try {
          const response = await makeClientAuthenticatedRequestWithPathSafe(
            "logsUserActivity" as keyof typeof API_ENDPOINTS,
            [session.user.id]
          );
          if (response.ok) {
            const activityData = await response.json();
            setActivities(activityData);
          }
        } catch {
          // ignore, keep existing list
        }
      }
    } catch (error) {
      console.error('Error refreshing activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          className="text-sm text-gray-500 mb-4"
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Activity" },
          ]}
        />

        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>

        {/* Activity List Skeleton */}
        <div className="space-y-4">
          <ListSkeleton count={5} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumbs */}
      <Breadcrumbs
        className="text-sm text-gray-500 mb-4"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Activity" },
        ]}
      />
      {/* Simple Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-green-600" />
            <h1 className="text-xl font-bold text-gray-800">Activity Log</h1>
          </div>
          <button
            onClick={refreshActivity}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Simple Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-0 shadow-sm rounded-lg focus:ring-2 focus:ring-green-500 focus:shadow-md transition-shadow"
          />
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-800 mb-1">No Activities</h3>
            <p className="text-gray-600">
              {searchQuery ? "No activities match your search." : "No activity data available."}
            </p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3 p-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-800 mb-1">{activity.action}</h3>
                      <p className="text-gray-600 text-sm mb-1">{activity.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="capitalize">{activity.type}</span>
                        <span className={`capitalize ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
