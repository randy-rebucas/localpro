"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Briefcase, 
  Camera, 
  Upload,
  Save,
  Edit3
} from "lucide-react";
import toast from "react-hot-toast";

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
}

export function UserProfile() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  // Fetch user profile
  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/auth/me");
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
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to fetch profile");
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          skills: data.skills ? data.skills.split(",").map(s => s.trim()) : [],
        }),
      });

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

      const response = await fetch("/api/auth/upload-avatar", {
        method: "POST",
        body: formData,
      });

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

  const handlePortfolioUpload = async () => {
    if (portfolioFiles.length === 0) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      portfolioFiles.forEach((file, index) => {
        formData.append(`portfolio_${index}`, file);
      });

      const response = await fetch("/api/auth/upload-portfolio", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, portfolio: data.portfolio } : null);
        setPortfolioFiles([]);
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

  if (!profile) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 border border-green-600 rounded-md hover:bg-green-50"
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
          </button>
        </div>

        {/* Avatar Section */}
        <div className="flex items-center space-x-6 mb-8">
          <div className="relative">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            )}
            {isEditing && (
              <div className="absolute -bottom-2 -right-2">
                <label className="bg-green-600 text-white p-2 rounded-full cursor-pointer hover:bg-green-700">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
            <p className="text-gray-600 capitalize">{profile.role}</p>
            {isEditing && avatarFile && (
              <button
                onClick={handleAvatarUpload}
                disabled={isLoading}
                className="mt-2 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Upload Avatar
              </button>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <p className="text-gray-900">{profile.name}</p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              ) : (
                <p className="text-gray-900">{profile.phone || "Not provided"}</p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <p className="text-gray-900">{profile.location || "Not provided"}</p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <p className="text-gray-900">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-900">{profile.bio || "No bio provided"}</p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Describe your professional experience..."
              />
            ) : (
              <p className="text-gray-900">{profile.experience || "No experience provided"}</p>
            )}
          </div>

          {/* Portfolio Upload */}
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Portfolio Images
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setPortfolioFiles(Array.from(e.target.files || []))}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {portfolioFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={handlePortfolioUpload}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Portfolio</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Portfolio Display */}
          {profile.portfolio && profile.portfolio.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Portfolio
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {profile.portfolio.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Portfolio ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          {isEditing && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isLoading ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
