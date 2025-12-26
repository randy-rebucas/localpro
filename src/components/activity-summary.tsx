/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/activity/components/activity-summary' instead.
 */
export * from '@/features/activity/components/activity-summary';

import { Activity } from "lucide-react";
import { UserProfileData } from "./user-profile";

interface ActivitySummaryProps {
  profile: UserProfileData | null;
}

export function ActivitySummary({ profile }: ActivitySummaryProps) {
  const hasActivityData = profile?.activity?.lastActiveAt || 
                         profile?.activity?.totalSessions !== undefined ||
                         profile?.lastLoginAt || 
                         profile?.loginCount !== undefined;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        Activity
      </h3>
      {hasActivityData ? (
        <div className="space-y-2">
          {profile?.activity?.lastActiveAt && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Active</span>
              <span className="text-sm font-medium text-gray-700">
                {new Date(profile.activity.lastActiveAt).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {profile?.activity?.totalSessions !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Sessions</span>
              <span className="text-sm font-medium text-gray-700">
                {profile.activity.totalSessions}
              </span>
            </div>
          )}
          
          {profile?.lastLoginAt && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Login</span>
              <span className="text-sm font-medium text-gray-700">
                {new Date(profile.lastLoginAt).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {profile?.loginCount !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Login Count</span>
              <span className="text-sm font-medium text-gray-700">
                {profile.loginCount}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No activity data available</p>
        </div>
      )}
    </div>
  );
}

