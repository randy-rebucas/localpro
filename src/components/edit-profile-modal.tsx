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
  X,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { AvatarUpload } from "./avatar-upload";
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
}

export function EditProfileModal() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  // Detect if this is being rendered as a modal (intercepted route) or full page
  // Modal: when accessed via client-side navigation (intercepted route)
  // Full page: when accessed directly via URL or refresh
  const isModal = pathname === '/profile/edit';
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialValues, setInitialValues] = useState<ProfileForm | null>(null);

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

  // Track if form has been modified
  useEffect(() => {
    if (initialValues && watchedValues) {
      const hasChanges = JSON.stringify(watchedValues) !== JSON.stringify(initialValues);
      setHasUnsavedChanges(hasChanges);
    }
  }, [watchedValues, initialValues]);

  // Auto-save functionality - only when there are actual changes
  useEffect(() => {
    if (!session?.user?.id || !hasUnsavedChanges || autoSaveStatus === 'saving') return;

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
          setHasUnsavedChanges(false);
          setInitialValues({ ...watchedValues }); // Update initial values to current
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
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [watchedValues, session?.user?.id, hasUnsavedChanges, autoSaveStatus]);

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/users/${session.user.id}`, 
        createAuthFetchOptions()
      );
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        const formData = {
          name: data.name || "",
          phone: data.phone || "",
          bio: data.bio || "",
          location: data.location || "",
          website: data.website || "",
          skills: data.skills?.join(", ") || "",
          experience: data.experience || "",
        };
        reset(formData);
        setInitialValues(formData); // Set initial values for change detection
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
        setHasUnsavedChanges(false);
        setInitialValues({ ...data, skills: data.skills || "" }); // Update initial values
        toast.success("Profile updated successfully!");
        handleClose(); // Close modal or navigate back
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

  const handleClose = useCallback(() => {
    if (isModal) {
      router.back();
    } else {
      router.push('/profile');
    }
  }, [isModal, router]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModal) {
        handleClose();
      }
    };

    if (isModal) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isModal, handleClose]);

  if (!profile) {
    return (
      <div className={`${isModal ? 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50' : 'min-h-screen bg-gray-50 flex items-center justify-center'}`}>
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // If not a modal, render as full page
  if (!isModal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
                <p className="text-sm text-gray-600 mt-1">Update your personal information and preferences</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors group"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
              </button>
            </div>

            {/* Auto-save Status */}
            {(autoSaveStatus !== 'idle' || hasUnsavedChanges) && (
              <div className="px-6 py-2 bg-gray-50 border-b border-gray-200">
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
                  {autoSaveStatus === 'idle' && hasUnsavedChanges && (
                    <>
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-orange-600">Unsaved changes</span>
                    </>
                  )}
                  {autoSaveStatus === 'idle' && !hasUnsavedChanges && lastSaved && (
                    <>
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">
                        Last saved {lastSaved.toLocaleTimeString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-4 pb-6 border-b border-gray-200">
                  <AvatarUpload
                    currentAvatar={profile.avatar}
                    onUpload={handleAvatarUpload}
                    isLoading={isLoading}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{profile?.name || "User"}</h3>
                    <p className="text-gray-600 capitalize">{profile?.role || "User"}</p>
                    {profile?.isVerified && (
                      <div className="flex items-center mt-1">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                        <span className="text-xs text-green-600 font-medium">Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name
                    </label>
                    <input
                      {...register("name")}
                      type="text"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-400"
                    />
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
                    <input
                      {...register("phone")}
                      type="tel"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-400"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Location
                    </label>
                    <input
                      {...register("location")}
                      type="text"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-400"
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe className="w-4 h-4 inline mr-2" />
                      Website
                    </label>
                    <input
                      {...register("website")}
                      type="url"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-400"
                    />
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
                    <input
                      {...register("skills")}
                      type="text"
                      placeholder="Enter skills separated by commas"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-400"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      {...register("bio")}
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-400 resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience
                    </label>
                    <textarea
                      {...register("experience")}
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-400 resize-none"
                      placeholder="Describe your professional experience..."
                    />
                  </div>

                  {/* Portfolio Gallery */}
                  <PortfolioGallery
                    portfolio={profile.portfolio || []}
                    onUpload={handlePortfolioUpload}
                    onDelete={handlePortfolioDelete}
                    isLoading={isLoading}
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{isLoading ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modal version

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-transparent transition-opacity duration-300"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl transform transition-all duration-300 ease-out animate-in fade-in-0 zoom-in-95">
        <div className="flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
              <p className="text-sm text-gray-600 mt-1">Update your personal information and preferences</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors group"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
            </button>
          </div>

          {/* Auto-save Status */}
          {(autoSaveStatus !== 'idle' || hasUnsavedChanges) && (
            <div className="px-6 py-2 bg-gray-50 border-b border-gray-200">
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
                {autoSaveStatus === 'idle' && hasUnsavedChanges && (
                  <>
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-orange-600">Unsaved changes</span>
                  </>
                )}
                {autoSaveStatus === 'idle' && !hasUnsavedChanges && lastSaved && (
                  <>
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">
                      Last saved {lastSaved.toLocaleTimeString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4 pb-6 border-b border-gray-200">
                <AvatarUpload
                  currentAvatar={profile.avatar}
                  onUpload={handleAvatarUpload}
                  isLoading={isLoading}
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{profile?.name || "User"}</h3>
                  <p className="text-gray-600 capitalize">{profile?.role || "User"}</p>
                  {profile?.isVerified && (
                    <div className="flex items-center mt-1">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-xs text-green-600 font-medium">Verified</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    {...register("name")}
                    type="text"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-400"
                  />
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
                  <input
                    {...register("phone")}
                    type="tel"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-400"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Location
                  </label>
                  <input
                    {...register("location")}
                    type="text"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-400"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    Website
                  </label>
                  <input
                    {...register("website")}
                    type="url"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-400"
                  />
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
                  <input
                    {...register("skills")}
                    type="text"
                    placeholder="Enter skills separated by commas"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-400"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    {...register("bio")}
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-400 resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience
                  </label>
                  <textarea
                    {...register("experience")}
                    rows={3}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-gray-400 resize-none"
                    placeholder="Describe your professional experience..."
                  />
                </div>

                {/* Portfolio Gallery */}
                <PortfolioGallery
                  portfolio={profile.portfolio || []}
                  onUpload={handlePortfolioUpload}
                  onDelete={handlePortfolioDelete}
                  isLoading={isLoading}
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{isLoading ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
