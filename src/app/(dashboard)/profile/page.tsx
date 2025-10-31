"use client";

import { useState, useEffect } from "react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { UserProfile } from "@/components/user-profile";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { UserProfileData } from "@/components/user-profile";
import toast from "react-hot-toast";

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
        console.log('API Response:', responseData);

        // Handle different response structures: { success: true, data: {...} } or direct user object
        const userData = responseData?.data || responseData?.user || responseData;

        if (!userData || (typeof userData === 'object' && Object.keys(userData).length === 0)) {
          console.error('User data is empty or invalid');
          throw new Error("Failed to fetch profile data - no data received");
        }

        console.log('Extracted User Data:', userData);
        setProfile(userData as UserProfileData);
      } catch (err) {
        console.error('Error fetching user profile:', err);
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
    <div>
      <Breadcrumbs
        className="text-sm text-gray-500 mb-4"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Profile" },
        ]}
      />

      {loading && (
        <div className="min-h-[400px] bg-gray-50 flex items-center justify-center rounded-lg">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading profile...</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && profile && (
        <UserProfile initialProfile={profile} />
      )}

      {!loading && !error && !profile && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-600">No profile data available</p>
        </div>
      )}
    </div>
  );
}


