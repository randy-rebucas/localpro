"use client";

import { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { useSession } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  User as UserIcon, 
  Phone, 
  MapPin, 
  Globe, 
  Briefcase, 
  Edit3,
  CheckCircle,
  AlertCircle,
  Edit,
  Shield,
  Award,
  Star,
  Clock,
  TrendingUp,
  Users,
  Building2,
  FileText,
  Calendar,
  Mail,
  Wallet,
  Activity,
  Target,
  Zap
} from "lucide-react";
import { ProfileCompleteness } from "./profile-completeness";
import { AccountInfo } from "./account-info";
import { WalletInfo } from "./wallet-info";
import { AgencyInfo } from "./agency-info";
import { ReferralInfo } from "./referral-info";
import { ActivitySummary } from "./activity-summary";
import { QuickActions } from "./quick-actions";
import { Loading } from "@/components/ui/loading";
import { makeClientAuthenticatedRequestWithEndpointSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { CLIENT_CONFIG } from "@/lib/env";

// User Data Entity (from features/users/data-entities.md)

export type UserRole = 'client' | 'provider' | 'admin' | 'supplier' | 'instructor' | 'agency_owner' | 'agency_admin';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification' | 'banned';

export type BusinessType = 'individual' | 'small_business' | 'enterprise' | 'franchise';

export type BackgroundCheckStatus = 'pending' | 'approved' | 'rejected' | 'not_required';

export type AgencyRole = 'owner' | 'admin' | 'manager' | 'supervisor' | 'provider';

export type AgencyStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export type ReferralSource = 'email' | 'sms' | 'social_media' | 'direct_link' | 'qr_code' | 'app_share';

export type ReferralTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type BadgeType = 'verified_provider' | 'top_rated' | 'fast_response' | 'reliable' | 'expert' | 'newcomer';

export interface Avatar {
  url?: string;
  publicId?: string;
  thumbnail?: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  document?: {
    url?: string;
    publicId?: string;
    filename?: string;
  };
}

export interface Insurance {
  hasInsurance?: boolean;
  provider?: string;
  policyNumber?: string;
  coverageAmount?: number;
  expiryDate?: string;
  document?: {
    url?: string;
    publicId?: string;
    filename?: string;
  };
}

export interface BackgroundCheck {
  status?: BackgroundCheckStatus;
  completedAt?: string;
  document?: {
    url?: string;
    publicId?: string;
    filename?: string;
  };
}

export interface PortfolioItem {
  title?: string;
  description?: string;
  images?: Array<{
    url?: string;
    publicId?: string;
    thumbnail?: string;
  }>;
  category?: string;
  completedAt?: string;
}

export interface AvailabilitySchedule {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
}

export interface Availability {
  schedule?: AvailabilitySchedule[];
  timezone?: string;
  emergencyService?: boolean;
}

export interface Verification {
  phoneVerified?: boolean;
  emailVerified?: boolean;
  identityVerified?: boolean;
  businessVerified?: boolean;
  addressVerified?: boolean;
  bankAccountVerified?: boolean;
  verifiedAt?: string;
}

export interface Badge {
  type?: BadgeType;
  earnedAt?: string;
  description?: string;
}

export interface ResponseTime {
  average?: number;
  totalResponses?: number;
}

export interface Agency {
  agencyId?: string;
  role?: AgencyRole;
  joinedAt?: string;
  status?: AgencyStatus;
  commissionRate?: number;
}

export interface ReferralStats {
  totalReferrals?: number;
  successfulReferrals?: number;
  totalRewardsEarned?: number;
  totalRewardsPaid?: number;
  lastReferralAt?: string;
  referralTier?: ReferralTier;
}

export interface ReferralPreferences {
  autoShare?: boolean;
  shareOnSocial?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
}

export interface Referral {
  referralCode?: string;
  referredBy?: string;
  referralSource?: ReferralSource;
  referralStats?: ReferralStats;
  referralPreferences?: ReferralPreferences;
}

export interface Wallet {
  balance?: number;
  currency?: string;
}

export interface DeviceInfo {
  deviceType?: string;
  userAgent?: string;
  lastUsed?: string;
}

export interface Activity {
  lastActiveAt?: string;
  totalSessions?: number;
  averageSessionDuration?: number;
  preferredLoginTime?: string;
  deviceInfo?: DeviceInfo[];
}

export interface UserProfileData {
  _id?: string;
  id?: string;
  phoneNumber?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isVerified?: boolean;
  profile?: {
    avatar?: Avatar;
    bio?: string;
    address?: Address;
    skills?: string[];
    experience?: number;
    rating?: number;
    totalReviews?: number;
    businessName?: string;
    businessType?: BusinessType;
    yearsInBusiness?: number;
    serviceAreas?: string[];
    specialties?: string[];
    certifications?: Certification[];
    insurance?: Insurance;
    backgroundCheck?: BackgroundCheck;
    portfolio?: PortfolioItem[];
    availability?: Availability;
  };
  trustScore?: number;
  verification?: Verification;
  badges?: Badge[];
  responseTime?: ResponseTime;
  completionRate?: number;
  cancellationRate?: number;
  agency?: Agency;
  referral?: Referral;
  wallet?: Wallet;
  activity?: Activity;
  isActive?: boolean;
  status?: UserStatus;
  lastLoginAt?: string;
  loginCount?: number;
  createdAt?: string;
  updatedAt?: string;
  // Computed/helper fields
  name?: string; // computed from firstName + lastName
  phone?: string; // alias for phoneNumber
  location?: string; // computed from address
  website?: string; // from profile if available
  profileCompleteness?: {
    percentage: number;
    completedFields: number;
    totalFields: number;
    missingFields: string[];
    fields: Record<string, { completed: boolean; required: boolean }>;
  };
}

// Helper function to normalize user from API
const normalizeUser = (user: any): UserProfileData => {
  if (!user) {
    // Return minimal valid profile if user is null/undefined
    return {
      id: 'unknown',
      name: 'User',
      role: 'client',
      email: '',
      isVerified: false,
      trustScore: 0,
      completionRate: 0,
      cancellationRate: 0,
      isActive: true,
      status: 'pending_verification',
      profile: {},
      verification: {},
      badges: [],
      agency: {},
      referral: {},
      wallet: { balance: 0, currency: 'PHP' },
      activity: {},
      responseTime: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  const userId = user._id || user.id || 'unknown';
  
  // Compute name from firstName and lastName
  const name = user.name || 
    (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null) ||
    user.firstName ||
    user.lastName ||
    user.email?.split('@')[0] ||
    'User';
  
  // Compute location from address
  const location = user.location || 
    (user.profile?.address 
      ? [
          user.profile.address.street,
          user.profile.address.city,
          user.profile.address.state,
          user.profile.address.country
        ].filter(Boolean).join(', ')
      : null);
  
  return {
    ...user,
    _id: userId,
    id: userId,
    name,
    phone: user.phone || user.phoneNumber,
    phoneNumber: user.phoneNumber || user.phone,
    location,
    role: user.role || 'client',
    isVerified: user.isVerified || false,
    trustScore: user.trustScore || 0,
    completionRate: user.completionRate || 0,
    cancellationRate: user.cancellationRate || 0,
    isActive: user.isActive !== false,
    status: user.status || 'pending_verification',
    profile: {
      ...user.profile,
      avatar: user.profile?.avatar || (user.avatar ? { url: typeof user.avatar === 'string' ? user.avatar : undefined } : undefined),
      skills: user.profile?.skills || user.skills || [],
      portfolio: user.profile?.portfolio || (user.portfolio ? 
        Array.isArray(user.portfolio) && typeof user.portfolio[0] === 'string' 
          ? user.portfolio.map((url: string) => ({ images: [{ url }] }))
          : user.portfolio
        : []),
    },
    verification: user.verification || {},
    badges: user.badges || [],
    agency: user.agency || {},
    referral: user.referral || {},
    wallet: user.wallet || { balance: 0, currency: 'PHP' },
    activity: user.activity || {},
    responseTime: user.responseTime || {},
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt || new Date().toISOString()
  };
};

// Helper function to get verification badge
const getVerificationBadge = (verification?: Verification) => {
  if (!verification) return null;
  
  const verifiedCount = [
    verification.phoneVerified,
    verification.emailVerified,
    verification.identityVerified,
    verification.businessVerified,
    verification.addressVerified,
    verification.bankAccountVerified
  ].filter(Boolean).length;
  
  if (verifiedCount === 0) return null;
  
  return (
    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
      <Shield className="w-3 h-3 mr-1" />
      {verifiedCount}/6 Verified
    </span>
  );
};

// Helper function to get badge icon
const getBadgeIcon = (badgeType?: BadgeType) => {
  switch (badgeType) {
    case 'verified_provider':
      return <Shield className="w-4 h-4 text-blue-600" />;
    case 'top_rated':
      return <Star className="w-4 h-4 text-yellow-600" />;
    case 'fast_response':
      return <Zap className="w-4 h-4 text-green-600" />;
    case 'reliable':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'expert':
      return <Award className="w-4 h-4 text-purple-600" />;
    case 'newcomer':
      return <Target className="w-4 h-4 text-orange-600" />;
    default:
      return <Award className="w-4 h-4 text-gray-600" />;
  }
};

export function UserProfile({ initialProfile }: { initialProfile?: UserProfileData }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileData | null>(initialProfile || null);
  const [loading, setLoading] = useState(!initialProfile);
  const profileFetchedRef = useRef(false);
  const fetchInProgressRef = useRef(false);
  
  // Fetch full user profile
  useEffect(() => {
    // Skip if already fetched or fetch in progress
    if (profileFetchedRef.current || fetchInProgressRef.current) {
      return;
    }
    
    const fetchProfile = async () => {
      if (initialProfile) {
        setProfile(initialProfile);
        setLoading(false);
        profileFetchedRef.current = true;
        return;
      }
      
      // First, try to use session data immediately if available
      if (session?.user) {
        const normalized = normalizeUser(session.user);
        setProfile(normalized);
        setLoading(false);
        profileFetchedRef.current = true;
        
        // Then try to fetch full profile from API to enrich the data
        fetchInProgressRef.current = true;
        try {
          const response = await makeClientAuthenticatedRequestWithEndpointSafe(
            'authMe' as keyof typeof API_ENDPOINTS,
            { method: 'GET' }
          );
          
          if (response.ok) {
            const responseData = await response.json();
            const userData = responseData?.data || responseData || responseData?.user;
            if (userData) {
              setProfile(normalizeUser(userData));
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Keep session-based profile if API fails
        } finally {
          fetchInProgressRef.current = false;
        }
        return;
      }
      
      // If no session yet, try to fetch from API
      fetchInProgressRef.current = true;
      try {
        setLoading(true);
        const response = await makeClientAuthenticatedRequestWithEndpointSafe(
          'authMe' as keyof typeof API_ENDPOINTS,
          { method: 'GET' }
        );
        
        if (response.ok) {
          const responseData = await response.json();
          const userData = responseData?.data || responseData || responseData?.user;
          if (userData) {
            setProfile(normalizeUser(userData));
            profileFetchedRef.current = true;
          } else {
            // If API returns no data, show empty state
            console.warn('No user data received from API');
          }
        } else {
          console.warn('Failed to fetch user profile:', response.status);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    };
    
    fetchProfile();
  }, [session?.user?.id, initialProfile]);
  
  // Get user role for conditional rendering
  const userRole = session?.user?.role || profile?.role;
  
  // Role-based visibility helpers (normalize role format)
  const normalizedRole = userRole?.toUpperCase();
  const isClient = normalizedRole === 'CLIENT' || profile?.role === 'client';
  const isProvider = normalizedRole === 'PROVIDER' || profile?.role === 'provider';
  const isSupplier = normalizedRole === 'SUPPLIER' || profile?.role === 'supplier';
  const isInstructor = normalizedRole === 'INSTRUCTOR' || profile?.role === 'instructor';
  const isAgencyOwner = normalizedRole === 'AGENCY_OWNER' || profile?.role === 'agency_owner';
  const isAgencyAdmin = normalizedRole === 'AGENCY_ADMIN' || profile?.role === 'agency_admin';
  const isAdmin = normalizedRole === 'ADMIN' || profile?.role === 'admin';
  
  // Business roles
  const isBusinessRole = isProvider || isSupplier || isInstructor || isAgencyOwner || isAgencyAdmin || isAdmin;
  const isServiceProvider = isProvider || isAgencyOwner || isAgencyAdmin || isAdmin;
  const isAdministrative = isAgencyOwner || isAgencyAdmin || isAdmin;

  // Prefetch edit route
  useEffect(() => {
    router.prefetch('/profile/edit');
  }, [router]);

  const handleEditProfile = useCallback(() => {
    router.push('/profile/edit');
  }, [router]);

  const handleSuggestionClick = useCallback(() => {
    handleEditProfile();
  }, [handleEditProfile]);

  const formattedCreatedAt = useMemo(() => (
    profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"
  ), [profile?.createdAt]);

  const formattedUpdatedAt = useMemo(() => (
    profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : "N/A"
  ), [profile?.updatedAt]);

  const normalizedWebsite = useMemo(() => {
    if (!profile?.website) return null;
    try {
      const hasProtocol = /^(https?:)?\/\//i.test(profile.website);
      return hasProtocol ? profile.website : `https://${profile.website}`;
    } catch {
      return profile.website;
    }
  }, [profile?.website]);

  const avatarUrl = useMemo(() => {
    return profile?.profile?.avatar?.url || profile?.profile?.avatar?.thumbnail || null;
  }, [profile]);

  if (loading) {
    return (
      <Loading 
        variant="dashboard" 
        text="Loading Profile" 
        subtitle="Setting up your profile..."
        fullScreen 
      />
    );
  }

  // If no profile data at all, show empty state
  if (!profile) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Profile Data</h3>
        <p className="text-gray-500 mb-4">Unable to load profile information.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section with Edit Button */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-700 mb-2">
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
          
          {/* Edit Profile Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={handleEditProfile}
              className="flex items-center justify-center space-x-2 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-white bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
            
            {/* Last updated info */}
            <div className="hidden lg:flex items-center space-x-4" aria-label="Last updated">
              <div className="text-right">
                <p className="text-sm text-gray-500">Last updated</p>
                <p className="text-sm font-medium text-gray-700">{formattedUpdatedAt}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile Display */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8 pb-6 border-b border-gray-200">
              <div className="flex-shrink-0">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-2xl">
                      {profile?.name?.charAt(0) || profile?.firstName?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                  <h3 className="text-xl font-semibold text-gray-700">{profile?.name || "User"}</h3>
                  {getVerificationBadge(profile?.verification)}
                </div>
                <p className="text-gray-600 capitalize mt-1">{profile?.role || "User"}</p>
                {profile?.isVerified && (
                  <div className="flex items-center justify-center sm:justify-start mt-1">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-xs text-green-600 font-medium">Verified Account</span>
                  </div>
                )}
                {profile?.trustScore !== undefined && profile.trustScore > 0 && (
                  <div className="flex items-center justify-center sm:justify-start mt-1">
                    <Shield className="w-3 h-3 text-blue-600 mr-1" />
                    <span className="text-xs text-blue-600 font-medium">Trust Score: {profile.trustScore}/100</span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Information */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <UserIcon className="w-4 h-4 inline mr-2" />
                    First Name
                  </label>
                  <p className="text-gray-700 py-2">{profile?.firstName || "Not provided"}</p>
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <UserIcon className="w-4 h-4 inline mr-2" />
                    Last Name
                  </label>
                  <p className="text-gray-700 py-2">{profile?.lastName || "Not provided"}</p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <p className="text-gray-700 py-2">{profile?.email || "Not provided"}</p>
                </div>
              </div>

              {/* Address Section */}
              {profile?.profile?.address && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profile.profile.address.street && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                        <p className="text-gray-700 py-2">{profile.profile.address.street}</p>
                      </div>
                    )}
                    {profile.profile.address.city && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <p className="text-gray-700 py-2">{profile.profile.address.city}</p>
                      </div>
                    )}
                    {profile.profile.address.state && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        <p className="text-gray-700 py-2">{profile.profile.address.state}</p>
                      </div>
                    )}
                    {profile.profile.address.zipCode && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                        <p className="text-gray-700 py-2">{profile.profile.address.zipCode}</p>
                      </div>
                    )}
                    {profile.profile.address.country && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                        <p className="text-gray-700 py-2">{profile.profile.address.country}</p>
                      </div>
                    )}
                    {(profile.profile.address.coordinates?.lat || profile.profile.address.coordinates?.lng) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Coordinates</label>
                        <p className="text-gray-700 py-2">
                          {profile.profile.address.coordinates.lat?.toFixed(6)}, {profile.profile.address.coordinates.lng?.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bio */}
              {profile?.profile?.bio && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <p className="text-gray-700 py-2">{profile.profile.bio}</p>
                </div>
              )}

              {/* Business Information - Only for non-client roles */}
              {!isClient && isBusinessRole && profile?.profile?.businessName && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Business Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                      <p className="text-gray-700 py-2">{profile.profile.businessName}</p>
                    </div>
                    {profile.profile.businessType && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                        <p className="text-gray-700 py-2 capitalize">{profile.profile.businessType.replace('_', ' ')}</p>
                      </div>
                    )}
                    {profile.profile.yearsInBusiness !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Years in Business</label>
                        <p className="text-gray-700 py-2">{profile.profile.yearsInBusiness} years</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Skills - Only for non-client roles */}
              {!isClient && profile?.profile?.skills && profile.profile.skills.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    {isBusinessRole ? "Professional Skills" : "Skills"}
                  </label>
                  <div className="flex flex-wrap gap-2 py-2">
                    {profile.profile.skills.map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Specialties - Only for non-client roles */}
              {!isClient && isServiceProvider && profile?.profile?.specialties && profile.profile.specialties.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="w-4 h-4 inline mr-2" />
                    Specialties
                  </label>
                  <div className="flex flex-wrap gap-2 py-2">
                    {profile.profile.specialties.map((specialty, index) => (
                      <span
                        key={`${specialty}-${index}`}
                        className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Areas - Only for non-client roles */}
              {!isClient && isServiceProvider && profile?.profile?.serviceAreas && profile.profile.serviceAreas.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Service Areas
                  </label>
                  <div className="flex flex-wrap gap-2 py-2">
                    {profile.profile.serviceAreas.map((area, index) => (
                      <span
                        key={`${area}-${index}`}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience - Only for non-client roles */}
              {!isClient && isBusinessRole && profile?.profile?.experience !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isServiceProvider ? "Service Experience" : isInstructor ? "Teaching Experience" : "Professional Experience"}
                  </label>
                  <p className="text-gray-700 py-2">{profile.profile.experience} years</p>
                </div>
              )}

              {/* Rating and Reviews - Only for non-client roles */}
              {!isClient && (profile?.profile?.rating !== undefined || profile?.profile?.totalReviews !== undefined) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  {profile.profile.rating !== undefined && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Average Rating</label>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-lg font-semibold text-gray-700">{profile.profile.rating.toFixed(1)}</span>
                        <span className="text-sm text-gray-500">/ 5</span>
                      </div>
                    </div>
                  )}
                  {profile.profile.totalReviews !== undefined && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Total Reviews</label>
                      <p className="text-lg font-semibold text-gray-700">{profile.profile.totalReviews}</p>
                    </div>
                  )}
                  {profile?.completionRate !== undefined && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Completion Rate</label>
                      <p className="text-lg font-semibold text-gray-700">{profile.completionRate}%</p>
                    </div>
                  )}
                </div>
              )}

              {/* Certifications - Only for non-client roles */}
              {!isClient && profile?.profile?.certifications && profile.profile.certifications.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Certifications
                  </h4>
                  <div className="space-y-3">
                    {profile.profile.certifications.map((cert, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-700">{cert.name}</p>
                            <p className="text-sm text-gray-600">Issued by {cert.issuer}</p>
                            {cert.issueDate && (
                              <p className="text-xs text-gray-500 mt-1">
                                Issued: {new Date(cert.issueDate).toLocaleDateString()}
                                {cert.expiryDate && (
                                  <> • Expires: {new Date(cert.expiryDate).toLocaleDateString()}</>
                                )}
                              </p>
                            )}
                          </div>
                          {cert.expiryDate && new Date(cert.expiryDate) < new Date() && (
                            <span className="text-xs text-red-600 font-medium">Expired</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Insurance - Only for non-client roles */}
              {!isClient && isBusinessRole && profile?.profile?.insurance && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Insurance
                  </h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    {profile.profile.insurance.hasInsurance ? (
                      <div className="space-y-2">
                        {profile.profile.insurance.provider && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Provider:</span> {profile.profile.insurance.provider}
                          </p>
                        )}
                        {profile.profile.insurance.policyNumber && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Policy Number:</span> {profile.profile.insurance.policyNumber}
                          </p>
                        )}
                        {profile.profile.insurance.coverageAmount && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Coverage:</span> {profile.profile.insurance.coverageAmount.toLocaleString()}
                          </p>
                        )}
                        {profile.profile.insurance.expiryDate && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Expires:</span> {new Date(profile.profile.insurance.expiryDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No insurance information provided</p>
                    )}
                  </div>
                </div>
              )}

              {/* Background Check - Only for non-client roles */}
              {!isClient && isBusinessRole && profile?.profile?.backgroundCheck && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Background Check
                  </h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        Status: {profile.profile.backgroundCheck.status || 'pending'}
                      </span>
                      {profile.profile.backgroundCheck.status === 'approved' && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {profile.profile.backgroundCheck.status === 'rejected' && (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      {profile.profile.backgroundCheck.status === 'pending' && (
                        <Clock className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                    {profile.profile.backgroundCheck.completedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Completed: {new Date(profile.profile.backgroundCheck.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Portfolio Gallery - Only for non-client roles */}
              {!isClient && isBusinessRole && profile?.profile?.portfolio && profile.profile.portfolio.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    {isServiceProvider ? "Service Portfolio" : isInstructor ? "Teaching Portfolio" : "Professional Portfolio"}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {profile.profile.portfolio.map((item, index) => {
                      const images = item.images || (typeof item === 'string' ? [{ url: item }] : []);
                      return images.map((img, imgIndex) => (
                        <div key={`${index}-${imgIndex}`} className="relative group">
                          {img.thumbnail || img.url ? (
                            <Image
                              src={img.thumbnail || img.url || ''}
                              alt={item.title || `Portfolio image ${index + 1}`}
                              width={200}
                              height={128}
                              className="w-full h-32 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow"
                            />
                          ) : null}
                        </div>
                      ));
                    }).flat()}
                  </div>
                </div>
              )}

              {/* Verification Levels - Only for non-client roles */}
              {!isClient && profile?.verification && Object.values(profile.verification).some(v => v === true) && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Verification Status
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { key: 'phoneVerified', label: 'Phone', icon: Phone },
                      { key: 'emailVerified', label: 'Email', icon: Mail },
                      { key: 'identityVerified', label: 'Identity', icon: UserIcon },
                      { key: 'businessVerified', label: 'Business', icon: Building2 },
                      { key: 'addressVerified', label: 'Address', icon: MapPin },
                      { key: 'bankAccountVerified', label: 'Bank Account', icon: Wallet },
                    ].map(({ key, label, icon: Icon }) => {
                      const verified = profile.verification?.[key as keyof Verification];
                      return (
                        <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <Icon className={`w-4 h-4 ${verified ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className={`text-sm ${verified ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                            {label}
                          </span>
                          {verified ? (
                            <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-gray-400 ml-auto" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Badges - Only for non-client roles */}
              {!isClient && profile?.badges && profile.badges.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Badges & Achievements
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {profile.badges.map((badge, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                        {getBadgeIcon(badge.type)}
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {badge.type?.replace('_', ' ')}
                        </span>
                        {badge.earnedAt && (
                          <span className="text-xs text-gray-500">
                            ({new Date(badge.earnedAt).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Metrics - Only for non-client roles */}
              {!isClient && (profile?.responseTime?.average !== undefined || profile?.completionRate !== undefined || profile?.cancellationRate !== undefined) && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Performance Metrics
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {profile.responseTime?.average !== undefined && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Response Time</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-700">
                          {profile.responseTime.average} min
                        </p>
                        {profile.responseTime.totalResponses !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            Based on {profile.responseTime.totalResponses} responses
                          </p>
                        )}
                      </div>
                    )}
                    {profile?.completionRate !== undefined && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-700">{profile.completionRate}%</p>
                      </div>
                    )}
                    {profile?.cancellationRate !== undefined && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium text-gray-700">Cancellation Rate</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-700">{profile.cancellationRate}%</p>
                      </div>
                    )}
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
            <AccountInfo 
              profile={profile} 
              formattedCreatedAt={formattedCreatedAt} 
            />

            {/* Wallet - Only for non-client roles */}
            {!isClient && isBusinessRole && <WalletInfo profile={profile} />}

            {/* Agency Information - Only for non-client roles */}
            {!isClient && <AgencyInfo profile={profile} />}

            {/* Referral Information */}
            {/* <ReferralInfo profile={profile} /> */}

            {/* Activity Summary */}
            <ActivitySummary profile={profile} />

            {/* Quick Actions */}
            <QuickActions
              isBusinessRole={isBusinessRole}
              isServiceProvider={isServiceProvider}
              isSupplier={isSupplier}
              isInstructor={isInstructor}
              isAdministrative={isAdministrative}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
