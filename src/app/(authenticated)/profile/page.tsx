"use client";

import { useState, useEffect, useMemo } from "react";
import { UserProfile } from "@/components/user-profile";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { UserProfileData } from "@/components/user-profile";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { RefreshCw, AlertCircle, Edit3, Headphones, Settings, Shield, User, Briefcase, Package, GraduationCap, Building2, Info } from "lucide-react";
import Link from "next/link";
import { Broadcaster } from "@/components/broadcaster";
import { ProviderProfileSection } from "@/components/provider-profile-section";
import { ProfileCompletionGuide } from "@/components/profile-completion-guide";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  type TabType = "overview" | "provider" | "supplier" | "instructor" | "agency_owner" | "agency_admin";
  const [activeTab, setActiveTab] = useState<TabType>("overview");

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

  // Role-specific messages and tab configuration
  const getRoleConfig = (role: string) => {
    const roleLower = role.toLowerCase();
    switch (roleLower) {
      case 'provider':
        return {
          title: "Since you are also a Provider, you are required to complete this form.",
          description: "Complete your provider profile to start accepting jobs and growing your business.",
          icon: Briefcase,
          color: "accent",
          tabId: "provider" as TabType,
          label: "Provider Profile",
        };
      case 'supplier':
        return {
          title: "Since you are also a Supplier, you are required to complete this form.",
          description: "Complete your supplier profile to start listing products and managing inventory.",
          icon: Package,
          color: "amber",
          tabId: "supplier" as TabType,
          label: "Supplier Profile",
        };
      case 'instructor':
        return {
          title: "Since you are also an Instructor, you are required to complete this form.",
          description: "Complete your instructor profile to start creating courses and teaching students.",
          icon: GraduationCap,
          color: "purple",
          tabId: "instructor" as TabType,
          label: "Instructor Profile",
        };
      case 'agency_owner':
        return {
          title: "Since you are also an Agency Owner, you are required to complete this form.",
          description: "Complete your agency profile to manage your team and grow your agency.",
          icon: Building2,
          color: "blue",
          tabId: "agency_owner" as TabType,
          label: "Agency Owner Profile",
        };
      case 'agency_admin':
        return {
          title: "Since you are also an Agency Admin, you are required to complete this form.",
          description: "Complete your agency admin profile to help manage your agency operations.",
          icon: Building2,
          color: "blue",
          tabId: "agency_admin" as TabType,
          label: "Agency Admin Profile",
        };
      default:
        return null;
    }
  };

  // Set default tab based on role
  useEffect(() => {
    if (hasProviderRole && activeTab === "overview") {
      // Keep overview as default, but allow switching
    }
  }, [hasProviderRole, activeTab]);

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

        {/* Header Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Profile
              </h1>
              <p className="text-gray-600">
                Manage your account information, preferences, and professional profile.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/profile/edit"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent/90 rounded-lg hover:from-accent/90 hover:to-accent transition-all shadow-lg shadow-accent/30 hover:shadow-xl hover:scale-105"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </Link>
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
                    ? "text-accent"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Overview</span>
                </div>
                {activeTab === "overview" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
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
                        ? "text-accent"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{roleConfig.label}</span>
                    </div>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-accent transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
            <Link
              href="/security"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-accent transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-accent transition-colors"
            >
              <Headphones className="w-4 h-4" />
              <span>Support</span>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
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
            <div className="mt-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  
                  {/* Profile Completion Guide */}
                  <ProfileCompletionGuide profile={profile} hasProviderRole={hasProviderRole} />
                  
                  {/* User Profile */}
                  <UserProfile initialProfile={profile} />
                </div>
              )}

              {/* Provider Tab */}
              {activeTab === "provider" && hasProviderRole && (
                <div className="space-y-6">
                  {/* Role-specific requirement message */}
                  <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-white rounded-2xl border-2 border-accent/30 shadow-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <Info className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Since you are also a Provider, you are required to complete this form.
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Complete your provider profile to start accepting jobs and growing your business. 
                          This information helps clients find and trust you.
                        </p>
                        <div className="flex items-center gap-2">
                          <Link
                            href="/profile/edit"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent/90 rounded-lg hover:from-accent/90 hover:to-accent transition-all shadow-md hover:shadow-lg"
                          >
                            <Edit3 className="w-4 h-4" />
                            Complete Provider Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <ProviderProfileSection userId={profile.id || profile._id} />
                </div>
              )}

              {/* Supplier Tab */}
              {activeTab === "supplier" && hasSupplierRole && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-amber-50 via-amber-50/50 to-white rounded-2xl border-2 border-amber-300 shadow-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Info className="w-6 h-6 text-amber-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Since you are also a Supplier, you are required to complete this form.
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Complete your supplier profile to start listing products and managing inventory. 
                          This information helps buyers find and trust you.
                        </p>
                        <div className="flex items-center gap-2">
                          <Link
                            href="/profile/edit"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all shadow-md hover:shadow-lg"
                          >
                            <Edit3 className="w-4 h-4" />
                            Complete Supplier Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Supplier Profile Content - Placeholder for now */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Supplier Profile</h3>
                      <p className="text-gray-600 mb-6">
                        Supplier profile management coming soon. Complete your profile information in the edit section.
                      </p>
                      <Link
                        href="/profile/edit"
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all shadow-md hover:shadow-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Supplier Profile
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Instructor Tab */}
              {activeTab === "instructor" && hasInstructorRole && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 via-purple-50/50 to-white rounded-2xl border-2 border-purple-300 shadow-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Info className="w-6 h-6 text-purple-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Since you are also an Instructor, you are required to complete this form.
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Complete your instructor profile to start creating courses and teaching students. 
                          This information helps students find and trust you.
                        </p>
                        <div className="flex items-center gap-2">
                          <Link
                            href="/profile/edit"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg"
                          >
                            <Edit3 className="w-4 h-4" />
                            Complete Instructor Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Instructor Profile Content - Placeholder for now */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
                    <div className="text-center py-12">
                      <GraduationCap className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Instructor Profile</h3>
                      <p className="text-gray-600 mb-6">
                        Instructor profile management coming soon. Complete your profile information in the edit section.
                      </p>
                      <Link
                        href="/profile/edit"
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Instructor Profile
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Agency Owner Tab */}
              {activeTab === "agency_owner" && hasAgencyOwnerRole && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 via-blue-50/50 to-white rounded-2xl border-2 border-blue-300 shadow-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Info className="w-6 h-6 text-blue-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Since you are also an Agency Owner, you are required to complete this form.
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Complete your agency profile to manage your team and grow your agency. 
                          This information helps you build trust with clients and team members.
                        </p>
                        <div className="flex items-center gap-2">
                          <Link
                            href="/profile/edit"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                          >
                            <Edit3 className="w-4 h-4" />
                            Complete Agency Owner Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Agency Owner Profile Content - Placeholder for now */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
                    <div className="text-center py-12">
                      <Building2 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Agency Owner Profile</h3>
                      <p className="text-gray-600 mb-6">
                        Agency owner profile management coming soon. Complete your profile information in the edit section.
                      </p>
                      <Link
                        href="/profile/edit"
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Agency Owner Profile
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Agency Admin Tab */}
              {activeTab === "agency_admin" && hasAgencyAdminRole && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 via-blue-50/50 to-white rounded-2xl border-2 border-blue-300 shadow-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Info className="w-6 h-6 text-blue-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          Since you are also an Agency Admin, you are required to complete this form.
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Complete your agency admin profile to help manage your agency operations. 
                          This information helps you support your agency effectively.
                        </p>
                        <div className="flex items-center gap-2">
                          <Link
                            href="/profile/edit"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                          >
                            <Edit3 className="w-4 h-4" />
                            Complete Agency Admin Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Agency Admin Profile Content - Placeholder for now */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
                    <div className="text-center py-12">
                      <Building2 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Agency Admin Profile</h3>
                      <p className="text-gray-600 mb-6">
                        Agency admin profile management coming soon. Complete your profile information in the edit section.
                      </p>
                      <Link
                        href="/profile/edit"
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Agency Admin Profile
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
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


