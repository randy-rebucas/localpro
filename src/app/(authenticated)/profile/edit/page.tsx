"use client";

import { useEffect, useState, useMemo } from "react";
import { EditProfileForm, type EditProfileUserProfile } from "@/components/edit-profile-form";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { Edit3, RefreshCw, AlertCircle, ArrowLeft, User, Briefcase, Package, GraduationCap, Building2, Info } from "lucide-react";
import Link from "next/link";
import { ProviderProfileForm } from "@/components/profile/provider-profile-form";
import { SupplierProfileForm } from "@/components/profile/supplier-profile-form";
import { InstructorProfileForm } from "@/components/profile/instructor-profile-form";
import { AgencyProfileForm } from "@/components/profile/agency-profile-form";

// Disable static generation for this page
export const dynamic = 'force-dynamic';

type EditTabType = "overview" | "provider" | "supplier" | "instructor" | "agency_owner" | "agency_admin";

export default function EditProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<EditProfileUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditTabType>("overview");

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
        const normalizedProfile: EditProfileUserProfile = {
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

  // Check user roles
  const hasProviderRole = useMemo(() => {
    return profile?.roles && (profile.roles.includes('provider') || profile.roles.includes('PROVIDER'));
  }, [profile?.roles]);

  const hasSupplierRole = useMemo(() => {
    return profile?.roles && (profile.roles.includes('supplier') || profile.roles.includes('SUPPLIER'));
  }, [profile?.roles]);

  const hasInstructorRole = useMemo(() => {
    return profile?.roles && (profile.roles.includes('instructor') || profile.roles.includes('INSTRUCTOR'));
  }, [profile?.roles]);

  const hasAgencyOwnerRole = useMemo(() => {
    return profile?.roles && (profile.roles.includes('agency_owner') || profile.roles.includes('AGENCY_OWNER'));
  }, [profile?.roles]);

  const hasAgencyAdminRole = useMemo(() => {
    return profile?.roles && (profile.roles.includes('agency_admin') || profile.roles.includes('AGENCY_ADMIN'));
  }, [profile?.roles]);

  // Get additional roles (excluding client)
  const additionalRoles = useMemo(() => {
    if (!profile?.roles) return [];
    return profile.roles.filter(
      (role) =>
        role.toLowerCase() !== 'client' &&
        (role.toLowerCase() === 'provider' ||
          role.toLowerCase() === 'supplier' ||
          role.toLowerCase() === 'instructor' ||
          role.toLowerCase() === 'agency_owner' ||
          role.toLowerCase() === 'agency_admin' ||
          role.toLowerCase() === 'admin')
    );
  }, [profile?.roles]);

  // Role-specific tab configuration
  const getRoleConfig = (role: string) => {
    const roleLower = role.toLowerCase();
    switch (roleLower) {
      case 'provider':
        return {
          title: "Since you are also a Provider, you are required to complete this form.",
          description: "Complete your provider profile to start accepting jobs and growing your business.",
          icon: Briefcase,
          color: "accent",
          tabId: "provider" as EditTabType,
          label: "Provider Profile",
        };
      case 'supplier':
        return {
          title: "Since you are also a Supplier, you are required to complete this form.",
          description: "Complete your supplier profile to start listing products and managing inventory.",
          icon: Package,
          color: "amber",
          tabId: "supplier" as EditTabType,
          label: "Supplier Profile",
        };
      case 'instructor':
        return {
          title: "Since you are also an Instructor, you are required to complete this form.",
          description: "Complete your instructor profile to start creating courses and teaching students.",
          icon: GraduationCap,
          color: "purple",
          tabId: "instructor" as EditTabType,
          label: "Instructor Profile",
        };
      case 'agency_owner':
        return {
          title: "Since you are also an Agency Owner, you are required to complete this form.",
          description: "Complete your agency profile to manage your team and grow your agency.",
          icon: Building2,
          color: "blue",
          tabId: "agency_owner" as EditTabType,
          label: "Agency Owner Profile",
        };
      case 'agency_admin':
        return {
          title: "Since you are also an Agency Admin, you are required to complete this form.",
          description: "Complete your agency admin profile to help manage your agency operations.",
          icon: Building2,
          color: "blue",
          tabId: "agency_admin" as EditTabType,
          label: "Agency Admin Profile",
        };
      default:
        return null;
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-100/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
        </div>

        <div className="relative z-0 max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/profile"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to profile"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 text-white flex items-center justify-center shadow-xl shadow-purple-500/30 hover:scale-105 transition-transform duration-300">
            <Edit3 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-700 to-gray-900 bg-clip-text text-transparent mb-1">Edit Profile</h1>
            <p className="text-sm sm:text-base text-gray-700 font-medium">Update your account information and settings</p>
          </div>
        </div>

        {/* Loading State */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border border-gray-200/50 shadow-xl p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-gray-600 font-medium">Loading profile...</p>
              <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your information</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-100/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-0 max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/profile"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to profile"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 text-white flex items-center justify-center shadow-xl shadow-purple-500/30 hover:scale-105 transition-transform duration-300">
            <Edit3 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-700 to-gray-900 bg-clip-text text-transparent mb-1">Edit Profile</h1>
            <p className="text-sm sm:text-base text-gray-700 font-medium">Update your account information and settings</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        {!loading && !error && profile && (
          <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto">
            {/* Overview Tab - Always visible */}
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === "overview"
                  ? "text-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Basic Information</span>
              </div>
              {activeTab === "overview" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-t-full" />
              )}
            </button>

            {/* Role-specific Tabs */}
            {additionalRoles.map((role) => {
              const roleConfig = getRoleConfig(role);
              if (!roleConfig) return null;
              const Icon = roleConfig.icon;
              const isActive = activeTab === roleConfig.tabId;

              return (
                <button
                  key={role}
                  onClick={() => setActiveTab(roleConfig.tabId)}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                    isActive
                      ? "text-purple-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{roleConfig.label}</span>
                  </div>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-gradient-to-br from-white to-red-50/30 rounded-2xl border-2 border-red-300 shadow-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Unable to Load Profile</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {!error && profile && (
          <div className="space-y-6">
            {/* Role-specific requirement messages */}
            {activeTab !== "overview" && additionalRoles.length > 0 && (
              (() => {
                const role = additionalRoles.find(r => {
                  const config = getRoleConfig(r);
                  return config?.tabId === activeTab;
                });
                if (!role) return null;
                const roleConfig = getRoleConfig(role);
                if (!roleConfig) return null;
                const colorConfig = {
                  accent: {
                    gradient: "from-accent/10 via-accent/5",
                    border: "border-accent/30",
                    text: "text-accent",
                    bg: "bg-accent/20",
                  },
                  amber: {
                    gradient: "from-amber-50 via-amber-50/50",
                    border: "border-amber-300",
                    text: "text-amber-700",
                    bg: "bg-amber-100",
                  },
                  purple: {
                    gradient: "from-purple-50 via-purple-50/50",
                    border: "border-purple-300",
                    text: "text-purple-700",
                    bg: "bg-purple-100",
                  },
                  blue: {
                    gradient: "from-blue-50 via-blue-50/50",
                    border: "border-blue-300",
                    text: "text-blue-700",
                    bg: "bg-blue-100",
                  },
                };
                const colors = colorConfig[roleConfig.color as keyof typeof colorConfig] || colorConfig.accent;

                return (
                  <div className={`bg-gradient-to-r ${colors.gradient} to-white rounded-2xl border-2 ${colors.border} shadow-lg p-6`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                        <Info className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{roleConfig.title}</h3>
                        <p className="text-gray-600">{roleConfig.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Overview Tab - Basic Profile Form */}
            {activeTab === "overview" && (
              <EditProfileForm initialProfile={profile} />
            )}

            {/* Provider Tab */}
            {activeTab === "provider" && hasProviderRole && (
              <ProviderProfileForm
                onSave={() => {
                  // Refresh profile data if needed
                }}
              />
            )}

            {/* Supplier Tab */}
            {activeTab === "supplier" && hasSupplierRole && (
              <SupplierProfileForm
                onSave={() => {
                  // Refresh profile data if needed
                }}
              />
            )}

            {/* Instructor Tab */}
            {activeTab === "instructor" && hasInstructorRole && (
              <InstructorProfileForm
                onSave={() => {
                  // Refresh profile data if needed
                }}
              />
            )}

            {/* Agency Owner Tab */}
            {activeTab === "agency_owner" && hasAgencyOwnerRole && (
              <AgencyProfileForm
                onSave={() => {
                  // Refresh profile data if needed
                }}
              />
            )}

            {/* Agency Admin Tab */}
            {activeTab === "agency_admin" && hasAgencyAdminRole && (
              <AgencyProfileForm
                onSave={() => {
                  // Refresh profile data if needed
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}


