"use client";

import { useState, useEffect } from "react";
import { UserProfile } from "@/components/user-profile";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { UserProfileData } from "@/components/user-profile";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { RefreshCw, AlertCircle, Edit3, Headphones, Settings, Shield } from "lucide-react";
import Link from "next/link";
import { Broadcaster } from "@/components/broadcaster";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.authMe}`,
          createAuthFetchOptions()
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || `Failed to fetch profile: ${response.status}`);
        }

        const responseData = await response.json();
        logger.debug('Profile page API response', { hasData: !!responseData });

        // Handle different response structures: { success: true, data: {...} } or direct user object
        const userData = responseData?.data || responseData?.user || responseData;

        if (!userData || (typeof userData === 'object' && Object.keys(userData).length === 0)) {
          logger.warn('User data is empty or invalid');
          throw new Error("Failed to fetch profile data - no data received");
        }

        logger.debug('Extracted user data', { userId: userData?.id || userData?._id, hasEmail: !!userData?.email });
        setProfile(userData as UserProfileData);
      } catch (err) {
        logger.error('Error fetching user profile', err instanceof Error ? err : new Error(String(err)));
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch profile";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent/10/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>
      
      <div className="relative z-0">
        {/* Broadcaster - Only shown for clients */}
        <Broadcaster />

        {/* Header Section - Following Reference Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Profile — Manage Your Account Information
              </h1>
              <p className="text-gray-600">
                View and update your personal information, preferences, and account settings.
              </p>
            </div>
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent/90 rounded-lg hover:from-accent/90 hover:to-accent transition-all shadow-lg shadow-accent/30 hover:shadow-xl hover:scale-105 flex-shrink-0"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Quick Links Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-b border-gray-200 pb-4">
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <Edit3 className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Edit Profile</span>
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <Settings className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
            <Link
              href="/security"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <Shield className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Security</span>
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <Headphones className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Support</span>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-4"></div>
                <p className="text-gray-600 font-medium">Loading profile...</p>
                <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your information</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-white rounded-2xl border-2 border-red-200 shadow-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Unable to Load Profile</h3>
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent/90 rounded-lg hover:from-accent/90 hover:to-accent transition-all shadow-lg shadow-accent/30 hover:shadow-xl hover:scale-105"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Content */}
          {!loading && !error && profile && (
            <UserProfile initialProfile={profile} />
          )}

          {/* Empty State */}
          {!loading && !error && !profile && (
            <div className="bg-white rounded-2xl border-2 border-yellow-200 shadow-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No Profile Data Available</h3>
                  <p className="text-yellow-600 mb-4">We couldn&apos;t find any profile information. Please try refreshing the page.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent/90 rounded-lg hover:from-accent/90 hover:to-accent transition-all shadow-lg shadow-accent/30 hover:shadow-xl hover:scale-105"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


