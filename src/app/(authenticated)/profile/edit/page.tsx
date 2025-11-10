"use client";

import { useEffect, useState } from "react";
import { EditProfileForm } from "@/components/edit-profile-form";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { UserProfile } from "@/components/edit-profile-form";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { Edit3, RefreshCw, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
          let errorText = '';
          let errorData: Record<string, unknown> = {};
          
          try {
            errorText = await response.text();
            if (errorText) {
              try {
                errorData = JSON.parse(errorText);
              } catch {
                errorData = { message: errorText };
              }
            }
          } catch (parseError) {
            logger.warn('Failed to parse error response', {
              error: parseError instanceof Error ? parseError.message : String(parseError),
            });
          }
          
          const errorMessage = typeof errorData.error === 'string' 
            ? errorData.error 
            : typeof errorData.message === 'string'
            ? errorData.message
            : `Failed to fetch profile: ${response.status} ${response.statusText}`;
          
          logger.error('Failed to fetch user profile', new Error(errorMessage), {
            status: response.status,
            statusText: response.statusText,
            url: `${API_BASE_URL}${API_ENDPOINTS.authMe}`,
            errorData: errorData,
            errorText: errorText || undefined,
          });
          
          throw new Error(errorMessage);
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
          roles: userData.roles || ['client'],
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
          isVerified: userData.isVerified || false,
          profile: userData.profile || undefined,
        };
        
        logger.debug('Normalized profile', { userId: normalizedProfile.id, hasEmail: !!normalizedProfile.email });
        setProfile(normalizedProfile);
      } catch (err) {
        // Enhanced error logging
        const errorContext = {
          errorName: err instanceof Error ? err.name : 'Unknown',
          errorMessage: err instanceof Error ? err.message : String(err),
          errorStack: err instanceof Error ? err.stack : undefined,
          apiUrl: `${API_BASE_URL}${API_ENDPOINTS.authMe}`,
        };
        
        logger.error('Error fetching user profile', err instanceof Error ? err : new Error(String(err)), errorContext);
        
        let errorMessage = "Failed to fetch profile";
        let errorDetails = "";
        
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            errorMessage = "Request timeout";
            errorDetails = "The request took too long. Please check your connection and try again.";
          } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
            errorMessage = "Network error";
            errorDetails = "Unable to connect to the server. Please check your internet connection and try again.";
          } else if (err.message.includes('JSON')) {
            errorMessage = "Data format error";
            errorDetails = "The server response could not be parsed. Please try again or contact support.";
          } else {
            errorMessage = err.message || "An unexpected error occurred";
            errorDetails = `Error type: ${err.name || 'Unknown'}`;
          }
        } else {
          errorMessage = "An unexpected error occurred";
          errorDetails = `Error: ${String(err)}`;
        }
        
        const fullErrorMessage = errorDetails ? `${errorMessage}. ${errorDetails}` : errorMessage;
        setError(fullErrorMessage);
        toast.error(fullErrorMessage, {
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [mounted]);

  if (!mounted || loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/profile"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to profile"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Edit3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Profile</h1>
            <p className="text-sm text-gray-600">Update your account information</p>
          </div>
        </div>

        {/* Loading State */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading profile...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your information</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/profile"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to profile"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Edit3 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Profile</h1>
          <p className="text-sm text-gray-600">Update your account information and settings</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Unable to Load Profile</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {!error && (
        <EditProfileForm initialProfile={profile} />
      )}
    </div>
  );
}


