"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Phone, 
  MapPin, 
  Globe, 
  Briefcase, 
  Save,
  Edit3,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { ProfileSteps } from "./profile-steps";
import { AvatarUpload } from "./avatar-upload";
import { ProfileCompleteness } from "./profile-completeness";
import { PortfolioGallery } from "./portfolio-gallery";
import { createAuthFetchOptions } from "@/lib/auth-utils";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  skills: z.string().optional(),
  experience: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  // Watch form values for auto-save
  const watchedValues = watch();

  // Auto-save functionality
  useEffect(() => {
    if (!isEditing || !session?.user?.id) return;

    const timeoutId = setTimeout(async () => {
      try {
        setAutoSaveStatus('saving');
        
        const response = await fetch(`/api/users/${session.user.id}`, 
          createAuthFetchOptions({
            method: "PUT",
            body: JSON.stringify({
              ...watchedValues,
              skills: watchedValues.skills ? watchedValues.skills.split(",").map(s => s.trim()) : [],
            }),
          })
        );

        if (response.ok) {
          setAutoSaveStatus('saved');
          setLastSaved(new Date());
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
        } else {
          setAutoSaveStatus('error');
          setTimeout(() => setAutoSaveStatus('idle'), 3000);
        }
      } catch (error) {
        console.error("Auto-save error:", error);
        setAutoSaveStatus('error');
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [watchedValues, isEditing, session?.user?.id]);

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/users/${session.user.id}`, 
        createAuthFetchOptions()
      );
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        reset({
          name: data.name || "",
          phone: data.phone || "",
          bio: data.bio || "",
          location: data.location || "",
          website: data.website || "",
          skills: data.skills?.join(", ") || "",
          experience: data.experience || "",
        });
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to fetch profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to fetch profile");
    }
  }, [session?.user?.id, reset]);

  // Fetch user profile
  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session, fetchProfile]);

  const onSubmit = async (data: ProfileForm) => {
    if (!session?.user?.id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${session.user.id}`, 
        createAuthFetchOptions({
          method: "PUT",
          body: JSON.stringify({
            ...data,
            skills: data.skills ? data.skills.split(",").map(s => s.trim()) : [],
          }),
        })
      );

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const response = await fetch("/api/auth/upload-avatar", 
        createAuthFetchOptions({
          method: "POST",
          headers: {}, // Override Content-Type for FormData
          body: formData,
        })
      );

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, avatar: data.avatar } : null);
        setAvatarFile(null);
        toast.success("Avatar uploaded successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to upload avatar");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortfolioUpload = async (files: File[]) => {
    if (!session?.user?.id || files.length === 0) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`portfolio_${index}`, file);
      });

      const response = await fetch("/api/auth/upload-portfolio", 
        createAuthFetchOptions({
          method: "POST",
          headers: {}, // Override Content-Type for FormData
          body: formData,
        })
      );

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, portfolio: data.portfolio } : null);
        toast.success("Portfolio uploaded successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to upload portfolio");
      }
    } catch (error) {
      console.error("Error uploading portfolio:", error);
      toast.error("Failed to upload portfolio");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortfolioDelete = async (index: number) => {
    if (!session?.user?.id || !profile?.portfolio) return;
    
    setIsLoading(true);
    try {
      const updatedPortfolio = profile.portfolio.filter((_, i) => i !== index);
      const response = await fetch(`/api/users/${session.user.id}`, 
        createAuthFetchOptions({
          method: "PUT",
          body: JSON.stringify({ portfolio: updatedPortfolio }),
        })
      );
      
      if (response.ok) {
        setProfile(prev => prev ? { ...prev, portfolio: updatedPortfolio } : null);
        toast.success("Portfolio image removed successfully!");
      } else {
        toast.error("Failed to remove portfolio image");
      }
    } catch (error) {
      console.error("Error removing portfolio image:", error);
      toast.error("Failed to remove portfolio image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (field: string) => {
    setIsEditing(true);
    // Focus on the specific field
    setTimeout(() => {
      const element = document.querySelector(`[name="${field}"]`) as HTMLElement;
      if (element) {
        element.focus();
      }
    }, 100);
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
      {/* Edit Profile Button and Auto-save Status */}
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        {/* Auto-save Status */}
        {isEditing && (
          <div className="flex items-center space-x-2 text-sm">
            {autoSaveStatus === 'saving' && (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span className="text-gray-600">Saving...</span>
              </>
            )}
            {autoSaveStatus === 'saved' && (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Saved</span>
              </>
            )}
            {autoSaveStatus === 'error' && (
              <>
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-red-600">Save failed</span>
              </>
            )}
            {autoSaveStatus === 'idle' && lastSaved && (
              <>
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">
                  Last saved {lastSaved.toLocaleTimeString()}
                </span>
              </>
            )}
          </div>
        )}
        
        {/* Edit Button */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 border border-green-600 rounded-lg hover:bg-green-50 transition-colors w-full sm:w-auto"
        >
          <Edit3 className="w-4 h-4" />
          <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
        </button>
      </div>
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Profile Settings
              </h2>
              <p className="text-gray-600 text-lg">
                Manage your personal information and preferences
              </p>
            </div>
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

        {/* Profile Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              {/* Profile Steps */}
              {isEditing && (
                <ProfileSteps 
                  currentStep={currentStep} 
                  onStepChange={setCurrentStep}
                  profileData={profile as unknown as Record<string, unknown>}
                />
              )}

              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8 pb-6 border-b border-gray-200">
                <AvatarUpload
                  currentAvatar={profile.avatar}
                  onUpload={handleAvatarUpload}
                  isLoading={isLoading}
                />
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

              {/* Profile Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        {...register("name")}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profile.name}</p>
                    )}
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone
                    </label>
                    {isEditing ? (
                      <input
                        {...register("phone")}
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profile.phone || "Not provided"}</p>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Location
                    </label>
                    {isEditing ? (
                      <input
                        {...register("location")}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">{profile.location || "Not provided"}</p>
                    )}
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe className="w-4 h-4 inline mr-2" />
                      Website
                    </label>
                    {isEditing ? (
                      <input
                        {...register("website")}
                        type="url"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <p className="text-gray-900 py-2">
                        {profile.website ? (
                          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                            {profile.website}
                          </a>
                        ) : (
                          "Not provided"
                        )}
                      </p>
                    )}
                    {errors.website && (
                      <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
                    )}
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Briefcase className="w-4 h-4 inline mr-2" />
                      Skills
                    </label>
                    {isEditing ? (
                      <input
                        {...register("skills")}
                        type="text"
                        placeholder="Enter skills separated by commas"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    ) : (
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
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      {...register("bio")}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profile.bio || "No bio provided"}</p>
                  )}
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience
                  </label>
                  {isEditing ? (
                    <textarea
                      {...register("experience")}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Describe your professional experience..."
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profile.experience || "No experience provided"}</p>
                  )}
                </div>

                {/* Portfolio Gallery */}
                <PortfolioGallery
                  portfolio={profile.portfolio || []}
                  onUpload={handlePortfolioUpload}
                  onDelete={handlePortfolioDelete}
                  isLoading={isLoading}
                />

                {/* Submit Button */}
                {isEditing && (
                  <div className="flex justify-end pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isLoading ? "Saving..." : "Save Changes"}</span>
                    </button>
                  </div>
                )}
              </form>
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
