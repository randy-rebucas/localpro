"use client";

import { Activity } from "lucide-react";
import { UserProfileData } from "./user-profile";

interface ActivitySummaryProps {
  profile: UserProfileData | null;
}

export function ActivitySummary({ profile }: ActivitySummaryProps) {
  if (!profile?.activity) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Activity
      </h3>
      <div className="space-y-2">
        {profile.activity.lastActiveAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Last Active</span>
            <span className="text-sm font-medium text-gray-700">
              {new Date(profile.activity.lastActiveAt).toLocaleDateString()}
            </span>
          </div>
        )}
        
        {profile.activity.totalSessions !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Sessions</span>
            <span className="text-sm font-medium text-gray-700">
              {profile.activity.totalSessions}
            </span>
          </div>
        )}
        
        {profile.lastLoginAt && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Last Login</span>
            <span className="text-sm font-medium text-gray-700">
              {new Date(profile.lastLoginAt).toLocaleDateString()}
            </span>
          </div>
        )}
        
        {profile.loginCount !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Login Count</span>
            <span className="text-sm font-medium text-gray-700">
              {profile.loginCount}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

