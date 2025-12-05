"use client";

import { useState, useEffect } from "react";
import { UserProfile } from "@/components/user-profile";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { UserProfileData } from "@/components/user-profile";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { User, RefreshCw, AlertCircle } from "lucide-react";

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>
      
      <div className="relative z-0 max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/30 hover:scale-105 transition-transform duration-300">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-blue-300 to-white bg-clip-text text-transparent mb-1">Profile</h1>
            <p className="text-sm sm:text-base text-slate-400 font-medium">Manage your account information and settings</p>
          </div>
        </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4"></div>
            <p className="text-white font-medium">Loading profile...</p>
            <p className="text-sm text-slate-400 mt-1">Please wait while we fetch your information</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-slate-900/80 border border-red-500/30 rounded-2xl shadow-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">Unable to Load Profile</h3>
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg hover:shadow-xl hover:scale-105"
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
        <div className="bg-slate-900/80 border border-yellow-500/30 rounded-2xl shadow-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">No Profile Data Available</h3>
              <p className="text-yellow-400 mb-4">We couldn&apos;t find any profile information. Please try refreshing the page.</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:scale-105"
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
  );
}


