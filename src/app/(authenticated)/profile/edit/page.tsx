"use client";

import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import { EditProfileForm } from "@/components/edit-profile-form";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { UserProfile } from "@/components/edit-profile-form";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function EditProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

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
        logger.debug('Edit profile API response', { hasData: !!responseData });

        // Handle different response structures: { success: true, data: {...} } or direct user object
        const userData = responseData?.data || responseData?.user || responseData;

        if (!userData || (typeof userData === 'object' && Object.keys(userData).length === 0)) {
          logger.warn('User data is empty or invalid');
          throw new Error("Failed to fetch profile data - no data received");
        }

        logger.debug('Extracted user data', { userId: userData?.id || userData?._id });
        
        // Ensure the profile data matches UserProfile interface structure
        const normalizedProfile: UserProfile = {
          id: userData.id || userData._id || '',
          email: userData.email || '',
          name: userData.name || 
            ((userData.firstName || '') + ' ' + (userData.lastName || '')).trim() ||
            userData.email?.split('@')[0] ||
            'User',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || userData.phoneNumber || '',
          bio: userData.profile?.bio || userData.bio || '',
          location: userData.location || '',
          website: userData.website || '',
          skills: userData.skills || userData.profile?.skills || [],
          experience: userData.experience || userData.profile?.experience?.toString() || '',
          avatar: userData.profile?.avatar || userData.avatar || undefined,
          portfolio: userData.profile?.portfolio || userData.portfolio || [],
          role: userData.role || '',
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
          isVerified: userData.isVerified || false,
          profile: userData.profile || undefined,
        };
        
        logger.debug('Normalized profile', { userId: normalizedProfile.id, hasEmail: !!normalizedProfile.email });
        setProfile(normalizedProfile);
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
  }, [mounted]);

  if (!mounted || loading) {
    return (
      <div>
        <Breadcrumbs
          className="text-sm text-gray-500 mb-4"
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Profile", href: "/profile" },
            { label: "Edit" },
          ]}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs
        className="text-sm text-gray-500 mb-4"
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Profile", href: "/profile" },
          { label: "Edit" },
        ]}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!error && (
        <EditProfileForm initialProfile={profile} />
      )}
    </div>
  );
}


