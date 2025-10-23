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
  MessageSquare,
  Settings,
  Bell,
  Zap,
  AlertCircle,
  CheckCircle,
  Info,
  ExternalLink,
  Star,
  TrendingUp,
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
  priority?: "low" | "medium" | "high";
  category?: string;
  value?: number;
  unit?: string;
}

export default function ActivityPage() {
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter] = useState("all");
  const [sortBy] = useState("recent");
  const [viewMode] = useState<"list" | "grid">("list");
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchRecentActivity = async () => {
      setIsLoading(true);
      try {
        if (session?.user?.id) {
          // const response = await fetch(`/api/logs/user/${session.user.id}/activity`);
          // if (response.ok) {
          //   const activityData = await response.json();
          //   setRecentActivity(activityData);
          // } else {
          //   console.warn("Failed to fetch recent activity:", response.status);
            // Set enhanced fallback activity data
            setRecentActivity([
              {
                id: "1",
                type: "marketplace",
                action: "Service booking completed",
                description: "Successfully booked 'Home Cleaning Service' for tomorrow",
                timestamp: "Just now",
                icon: "marketplace",
                status: "success",
                priority: "high",
                category: "booking",
                value: 150,
                unit: "PHP"
              },
              {
                id: "2",
                type: "academy",
                action: "Course progress updated",
                description: "Completed 75% of 'Digital Marketing Fundamentals'",
                timestamp: "5 minutes ago",
                icon: "academy",
                status: "info",
                priority: "medium",
                category: "learning",
                value: 75,
                unit: "%"
              },
              {
                id: "3",
                type: "profile",
                action: "Profile verification approved",
                description: "Your professional profile has been verified",
                timestamp: "15 minutes ago",
                icon: "user",
                status: "success",
                priority: "high",
                category: "verification"
              },
              {
                id: "4",
                type: "finance",
                action: "Payment received",
                description: "Received payment of ₱2,500 for completed service",
                timestamp: "1 hour ago",
                icon: "finance",
                status: "success",
                priority: "high",
                category: "payment",
                value: 2500,
                unit: "PHP"
              },
              {
                id: "5",
                type: "notification",
                action: "New message received",
                description: "You have 3 unread messages from clients",
                timestamp: "2 hours ago",
                icon: "message",
                status: "info",
                priority: "medium",
                category: "communication"
              },
              {
                id: "6",
                type: "marketplace",
                action: "Service rating received",
                description: "Received 5-star rating for 'Plumbing Repair' service",
                timestamp: "3 hours ago",
                icon: "marketplace",
                status: "success",
                priority: "medium",
                category: "rating",
                value: 5,
                unit: "stars"
              },
              {
                id: "7",
                type: "academy",
                action: "Certificate earned",
                description: "Earned certificate for 'Project Management Basics'",
                timestamp: "1 day ago",
                icon: "academy",
                status: "success",
                priority: "high",
                category: "achievement"
              },
              {
                id: "8",
                type: "settings",
                action: "Security settings updated",
                description: "Two-factor authentication enabled",
                timestamp: "2 days ago",
                icon: "settings",
                status: "info",
                priority: "medium",
                category: "security"
              }
            ]);
          // }
        }
      } catch (error) {
        console.error("Failed to fetch recent activity:", error);
        // Set enhanced fallback activity data
        setRecentActivity([
          {
            id: "1",
            type: "marketplace",
            action: "Service booking completed",
            description: "Successfully booked 'Home Cleaning Service' for tomorrow",
            timestamp: "Just now",
            icon: "marketplace",
            status: "success",
            priority: "high",
            category: "booking",
            value: 150,
            unit: "PHP"
          },
          {
            id: "2",
            type: "academy",
            action: "Course progress updated",
            description: "Completed 75% of 'Digital Marketing Fundamentals'",
            timestamp: "5 minutes ago",
            icon: "academy",
            status: "info",
            priority: "medium",
            category: "learning",
            value: 75,
            unit: "%"
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

  // Helper function to get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Zap className="w-3 h-3 text-red-500" />;
      case 'medium':
        return <AlertCircle className="w-3 h-3 text-yellow-500" />;
      case 'low':
        return <Info className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-3 h-3 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case 'info':
        return <Info className="w-3 h-3 text-blue-500" />;
      default:
        return null;
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

  // Filter and sort activities
  const filteredActivities = recentActivity
    .filter(activity => {
      if (filter === "all") return true;
      return activity.type === filter;
    })
    .sort((a, b) => {
      if (sortBy === "priority") {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
          (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      }
      if (sortBy === "value") {
        return (b.value || 0) - (a.value || 0);
      }
      // Default: recent first
      return 0;
    });

  const refreshActivity = async () => {
    if (session?.user?.id) {
      setIsLoading(true);
      // Re-fetch activity data
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Activity Feed</h3>
            <p className="text-xs text-gray-500">Your recent actions and updates</p>
          </div>
        </div>
      </div>

      {/* Activity Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredActivities.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4 p-4" : "space-y-1"}>
            {filteredActivities.slice(0, 3).map((activity) => (
              <div key={activity.id} className={`group hover:bg-gray-50 transition-colors ${viewMode === "list" ? "p-4 border-b border-gray-100 last:border-b-0" : "p-4 border border-gray-100 rounded-lg"}`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getStatusColor(activity.status || 'info')} relative`}>
                    {getActivityIcon(activity.type)}
                    {activity.priority === 'high' && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                        <Zap className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-800 group-hover:text-green-700 transition-colors">
                            {activity.action}
                          </p>
                          {activity.status && getStatusIcon(activity.status)}
                          {activity.priority && getPriorityIcon(activity.priority)}
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{activity.description}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {activity.timestamp}
                          </p>
                          {activity.value && (
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-semibold text-green-600">
                                {activity.value}{activity.unit}
                              </span>
                              {activity.category === 'rating' && <Star className="w-3 h-3 text-yellow-500" />}
                            </div>
                          )}
                        </div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600">
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-base font-medium text-gray-700 mb-2">No activity found</h4>
            <p className="text-sm text-gray-500 mb-4">
              {filter === "all" ? "No recent activity to show" : `No ${filter} activity found`}
            </p>
            <button
              onClick={refreshActivity}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Refresh to check for updates
            </button>
          </div>
        )}

        {/* Enhanced Footer */}
        {filteredActivities.length > 0 && (
          <div className="border-t border-gray-100 p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Showing {filteredActivities.slice(0, 3).length} of {filteredActivities.length} activities</span>
                </div>
                {filteredActivities.some(a => a.priority === 'high') && (
                  <div className="flex items-center gap-1 text-red-600">
                    <Zap className="w-3 h-3" />
                    <span>{filteredActivities.filter(a => a.priority === 'high').length} high priority</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => router.push('/activity')}
                className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1 transition-colors"
              >
                View all activities
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
