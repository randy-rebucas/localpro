"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useAuth";
import { 
  Shield, 
  User, 
  GraduationCap, 
  Package, 
  Car, 
  DollarSign,
  Activity,
  Clock,
  ArrowRight
} from "lucide-react";

export default function ActivityPage() {
  const [recentActivity, setRecentActivity] = useState<unknown[]>([]);
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        if (session?.user?.id) {
          const response = await fetch(`/api/logs/user/${session.user.id}/activity`);
          if (response.ok) {
            const activityData = await response.json();
            setRecentActivity(activityData);
          } else {
            console.warn("Failed to fetch recent activity:", response.status);
            // Set fallback activity data if API fails
            setRecentActivity([
              { id: 1, action: "Dashboard loaded", time: "Just now", icon: "dashboard" },
              { id: 2, action: "Profile viewed", time: "Recently", icon: "user" }
            ]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch recent activity:", error);
        // Set fallback activity data if API fails
        setRecentActivity([
          { id: 1, action: "Dashboard loaded", time: "Just now", icon: "dashboard" },
          { id: 2, action: "Profile viewed", time: "Recently", icon: "user" }
        ]);
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
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="lg:col-span-1">
      <h3 className="text-xl font-semibold text-gray-700 mb-6">Recent Activity</h3>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 5).map((activity, index) => {
              const activityObj = activity as Record<string, unknown>;
              return (
              <div key={(activityObj.id as string) || index} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {getActivityIcon((activityObj.type as string) || (activityObj.icon as string) || 'default')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700">
                    {(activityObj.action as string) || (activityObj.description as string) || (activityObj.title as string) || 'Activity'}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {(activityObj.time as string) || (activityObj.timestamp as string) || (activityObj.createdAt as string) || 'Recently'}
                  </p>
                </div>
              </div>
              );
            })
          ) : (
            <div className="text-center py-4">
              <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
        {recentActivity.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button className="w-full text-sm text-green-600 hover:text-green-700 font-medium flex items-center justify-center">
              View all activity
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
