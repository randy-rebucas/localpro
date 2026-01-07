"use client";

import { Activity, Calendar, Clock, TrendingUp } from "lucide-react";
import { UserProfileData } from "./user-profile";
import { useMemo } from "react";

interface ActivitySummaryProps {
  profile: UserProfileData | null;
}

export function ActivitySummary({ profile }: ActivitySummaryProps) {
  // Calculate activity data from available profile information
  const activityData = useMemo(() => {
    const data: {
      lastActive?: string;
      memberSince?: string;
      lastUpdated?: string;
      totalSessions?: number;
      loginCount?: number;
    } = {};

    // Use activity.lastActiveAt if available, otherwise use updatedAt or createdAt
    if (profile?.activity?.lastActiveAt) {
      data.lastActive = profile.activity.lastActiveAt;
    } else if (profile?.updatedAt) {
      data.lastActive = profile.updatedAt;
    } else if (profile?.lastLoginAt) {
      data.lastActive = profile.lastLoginAt;
    }

    // Member since date
    if (profile?.createdAt) {
      data.memberSince = profile.createdAt;
    }

    // Last updated
    if (profile?.updatedAt) {
      data.lastUpdated = profile.updatedAt;
    }

    // Total sessions from activity object
    if (profile?.activity?.totalSessions !== undefined) {
      data.totalSessions = profile.activity.totalSessions;
    }

    // Login count
    if (profile?.loginCount !== undefined) {
      data.loginCount = profile.loginCount;
    }

    return data;
  }, [profile]);

  const hasActivityData = activityData.lastActive || 
                         activityData.memberSince ||
                         activityData.totalSessions !== undefined ||
                         activityData.loginCount !== undefined;

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return null;
    }
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) return 'Today';
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 7) return `${diffInDays} days ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
      if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
      return `${Math.floor(diffInDays / 365)} years ago`;
    } catch {
      return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        Activity
      </h3>
      {hasActivityData ? (
        <div className="space-y-3">
          {activityData.lastActive && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Last Active</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-700 block">
                  {formatDate(activityData.lastActive)}
                </span>
                <span className="text-xs text-gray-500">
                  {getTimeAgo(activityData.lastActive)}
                </span>
              </div>
            </div>
          )}
          
          {activityData.memberSince && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Member Since</span>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {formatDate(activityData.memberSince)}
              </span>
            </div>
          )}
          
          {activityData.totalSessions !== undefined && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Total Sessions</span>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {activityData.totalSessions}
              </span>
            </div>
          )}
          
          {activityData.loginCount !== undefined && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Login Count</span>
              </div>
              <span className="text-sm font-medium text-gray-700">
                {activityData.loginCount}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No activity data available</p>
        </div>
      )}
    </div>
  );
}

