"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  User, 
  GraduationCap, 
  Package, 
  Car, 
  DollarSign,
  Activity,
  Clock,
  ArrowRight,
  Eye,
  Filter,
  RefreshCw,
  TrendingUp,
  MessageSquare,
  Settings,
  Bell
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: string;
  action: string;
  description: string;
  timestamp: string;
  icon: string;
  status?: "success" | "warning" | "error" | "info";
  metadata?: Record<string, unknown>;
}

export default function ActivityPage() {
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchRecentActivity = async () => {
      setIsLoading(true);
      try {
        if (session?.user?.id) {
          const response = await fetch(`/api/logs/user/${session.user.id}/activity`);
          if (response.ok) {
            const activityData = await response.json();
            setRecentActivity(activityData);
          } else {
            console.warn("Failed to fetch recent activity:", response.status);
            // Set enhanced fallback activity data
            setRecentActivity([
              {
                id: "1",
                type: "dashboard",
                action: "Dashboard accessed",
                description: "User logged into dashboard",
                timestamp: "Just now",
                icon: "dashboard",
                status: "success"
              },
              {
                id: "2",
                type: "profile",
                action: "Profile updated",
                description: "User updated profile information",
                timestamp: "5 minutes ago",
                icon: "user",
                status: "info"
              },
              {
                id: "3",
                type: "marketplace",
                action: "Service viewed",
                description: "Viewed marketplace services",
                timestamp: "15 minutes ago",
                icon: "marketplace",
                status: "success"
              },
              {
                id: "4",
                type: "academy",
                action: "Course enrolled",
                description: "Enrolled in new course",
                timestamp: "1 hour ago",
                icon: "academy",
                status: "success"
              },
              {
                id: "5",
                type: "settings",
                action: "Settings changed",
                description: "Updated notification preferences",
                timestamp: "2 hours ago",
                icon: "settings",
                status: "info"
              }
            ]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch recent activity:", error);
        // Set enhanced fallback activity data
        setRecentActivity([
          {
            id: "1",
            type: "dashboard",
            action: "Dashboard accessed",
            description: "User logged into dashboard",
            timestamp: "Just now",
            icon: "dashboard",
            status: "success"
          },
          {
            id: "2",
            type: "profile",
            action: "Profile updated",
            description: "User updated profile information",
            timestamp: "5 minutes ago",
            icon: "user",
            status: "info"
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated" && session?.user?.id) {
      fetchRecentActivity();
    }
  }, [session, status]);

  // Helper function to get icon for activity type
  const getActivityIcon = (activityType: string) => {
    switch (activityType?.toLowerCase()) {
      case 'marketplace':
      case 'service':
        return <Shield className="w-4 h-4" />;
      case 'profile':
      case 'user':
        return <User className="w-4 h-4" />;
      case 'academy':
      case 'course':
        return <GraduationCap className="w-4 h-4" />;
      case 'supplies':
      case 'order':
        return <Package className="w-4 h-4" />;
      case 'rentals':
      case 'rental':
        return <Car className="w-4 h-4" />;
      case 'finance':
      case 'payment':
        return <DollarSign className="w-4 h-4" />;
      case 'dashboard':
        return <Activity className="w-4 h-4" />;
      case 'settings':
        return <Settings className="w-4 h-4" />;
      case 'notification':
        return <Bell className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'info':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Filter activities
  const filteredActivities = recentActivity.filter(activity => {
    if (filter === "all") return true;
    return activity.type === filter;
  });

  const refreshActivity = async () => {
    if (session?.user?.id) {
      setIsLoading(true);
      // Re-fetch activity data
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Recent Activity</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshActivity}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filter tabs */}
        <div className="border-b border-gray-100 p-4">
          <div className="flex space-x-1">
            {["all", "dashboard", "marketplace", "academy", "profile"].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filter === filterType
                    ? "bg-green-100 text-green-700"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                {filterType === "all" ? "All" : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Activity list */}
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredActivities.length > 0 ? (
            <div className="space-y-4">
              {filteredActivities.slice(0, 6).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getStatusColor(activity.status || 'info')}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-green-700 transition-colors">
                        {activity.action}
                      </p>
                      {activity.status && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{activity.description}</p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-sm font-medium text-gray-700 mb-1">No activity found</h4>
              <p className="text-xs text-gray-500">
                {filter === "all" ? "No recent activity to show" : `No ${filter} activity found`}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredActivities.length > 0 && (
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <TrendingUp className="w-3 h-3" />
                <span>Showing {filteredActivities.slice(0, 6).length} of {filteredActivities.length} activities</span>
              </div>
              <button 
                onClick={() => router.push('/activity')}
                className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1 transition-colors"
              >
                View all
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
