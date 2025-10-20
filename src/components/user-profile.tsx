"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  User, 
  Phone, 
  MapPin, 
  Globe, 
  Briefcase, 
  Edit3,
  CheckCircle,
  AlertCircle,
  Edit
} from "lucide-react";
import toast from "react-hot-toast";
import { ProfileCompleteness } from "./profile-completeness";
import { createAuthFetchOptions } from "@/lib/auth-utils";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  skills?: string[];
  experience?: string;
  avatar?: string;
  portfolio?: string[];
  role: string;
  createdAt: string;
  updatedAt: string;
  isVerified?: boolean;
  profileCompleteness?: {
    percentage: number;
    completedFields: number;
    totalFields: number;
    missingFields: string[];
    fields: Record<string, { completed: boolean; required: boolean }>;
  };
}

export function UserProfile() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/users/${session.user.id}`, 
        createAuthFetchOptions()
      );
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to fetch profile");
    }
  }, [session?.user?.id]);

  // Fetch user profile
  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session, fetchProfile]);

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleSuggestionClick = () => {
    handleEditProfile();
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-green-600 mx-auto mb-4"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-lg mx-auto absolute top-0 left-1/2 transform -translate-x-1/2">
              <span className="text-white font-bold text-xl">P</span>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Profile</h2>
          <p className="text-gray-500">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section with Edit Button */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Profile Settings
            </h2>
            <p className="text-gray-600 text-lg">
              Manage your personal information and preferences
            </p>
            <p className="text-sm text-gray-500 mt-2 flex items-center">
              <Edit className="w-4 h-4 mr-1" />
              Click the edit button to make changes to your profile
            </p>
          </div>
          
          {/* Edit Profile Button - Now prominently placed in header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={handleEditProfile}
              className="flex items-center justify-center space-x-2 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-white bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
            
            {/* Last updated info */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Profile Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Display */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8 pb-6 border-b border-gray-200">
                <div className="flex-shrink-0">
                  {profile.avatar ? (
                    <Image
                      src={profile.avatar}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-2xl">
                        {profile?.name?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-semibold text-gray-900">{profile?.name || "User"}</h3>
                  <p className="text-gray-600 capitalize">{profile?.role || "User"}</p>
                  {profile?.isVerified && (
                    <div className="flex items-center justify-center sm:justify-start mt-1">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-xs text-green-600 font-medium">Verified</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Information */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name
                    </label>
                    <p className="text-gray-900 py-2">{profile.name}</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone
                    </label>
                    <p className="text-gray-900 py-2">{profile.phone || "Not provided"}</p>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Location
                    </label>
                    <p className="text-gray-900 py-2">{profile.location || "Not provided"}</p>
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe className="w-4 h-4 inline mr-2" />
                      Website
                    </label>
                    <p className="text-gray-900 py-2">
                      {profile.website ? (
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                          {profile.website}
                        </a>
                      ) : (
                        "Not provided"
                      )}
                    </p>
                  </div>

                  {/* Skills */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Briefcase className="w-4 h-4 inline mr-2" />
                      Skills
                    </label>
                    <div className="flex flex-wrap gap-2 py-2">
                      {profile.skills?.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                        >
                          {skill}
                        </span>
                      )) || <p className="text-gray-500">No skills listed</p>}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <p className="text-gray-900 py-2">{profile.bio || "No bio provided"}</p>
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience
                  </label>
                  <p className="text-gray-900 py-2">{profile.experience || "No experience provided"}</p>
                </div>

                {/* Portfolio Gallery */}
                {profile.portfolio && profile.portfolio.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Portfolio
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {profile.portfolio.map((image, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={image}
                            alt={`Portfolio ${index + 1}`}
                            width={200}
                            height={128}
                            className="w-full h-32 object-cover rounded-lg shadow-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Stats Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Enhanced Profile Completeness */}
              <ProfileCompleteness
                profileData={profile as unknown as Record<string, unknown>}
                onSuggestionClick={handleSuggestionClick}
              />

              {/* Account Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Member since</span>
                    <span className="text-sm font-medium text-gray-900">
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Role</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {profile?.role || "User"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className="flex items-center text-sm font-medium text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Verification</span>
                    <span className={`flex items-center text-sm font-medium ${profile?.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                      {profile?.isVerified ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Verified
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Pending
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    View Public Profile
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    Download Resume
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    Privacy Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
