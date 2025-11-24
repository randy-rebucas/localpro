"use client";

import { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { useSession } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  User as UserIcon, 
  Phone, 
  MapPin, 
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
  Building2,
  Mail,
  Wallet,
  Target,
  Zap
} from "lucide-react";
import { ProfileCompleteness } from "./profile-completeness";
import { AccountInfo } from "./account-info";
import { WalletInfo } from "./wallet-info";
import { AgencyInfo } from "./agency-info";
import { ActivitySummary } from "./activity-summary";
import { QuickActions } from "./quick-actions";
import { Loading } from "@/components/ui/loading";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { makeClientAuthenticatedRequestWithEndpointSafe } from "@/lib/client-api-utils";
import { logger } from "@/lib/logger";

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
  roles: string[]; // Multi-role support (array of roles)
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
const normalizeUser = (user: Record<string, unknown>): UserProfileData => {
  if (!user) {
    // Return minimal valid profile if user is null/undefined
    return {
      id: 'unknown',
      name: 'User',
      roles: ['client'], // Multi-role support
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
  
  const userId = (typeof user._id === 'string' ? user._id : undefined) || (typeof user.id === 'string' ? user.id : undefined) || 'unknown';
  
  // Safely extract and type-check user properties
  const userName = typeof user.name === 'string' ? user.name : undefined;
  const firstName = typeof user.firstName === 'string' ? user.firstName : undefined;
  const lastName = typeof user.lastName === 'string' ? user.lastName : undefined;
  const email = typeof user.email === 'string' ? user.email : undefined;
  
  // Compute name from firstName and lastName
  const name = userName || 
    (firstName && lastName ? `${firstName} ${lastName}` : null) ||
    firstName ||
    lastName ||
    (email ? email.split('@')[0] : null) ||
    'User';
  
  // Compute location from address
  const locationRoot = typeof user.location === 'string' ? user.location : undefined;
  const profileValue = user.profile && typeof user.profile === 'object' && !Array.isArray(user.profile)
    ? user.profile as Record<string, unknown>
    : null;
  const addressValue = profileValue?.address && typeof profileValue.address === 'object' && !Array.isArray(profileValue.address)
    ? profileValue.address as Record<string, unknown>
    : null;
  
  const location = locationRoot || 
    (addressValue 
      ? [
          typeof addressValue.street === 'string' ? addressValue.street : undefined,
          typeof addressValue.city === 'string' ? addressValue.city : undefined,
          typeof addressValue.state === 'string' ? addressValue.state : undefined,
          typeof addressValue.country === 'string' ? addressValue.country : undefined
        ].filter((item): item is string => typeof item === 'string').join(', ')
      : null);
  
  // Extract and type-check other fields
  const phone = typeof user.phone === 'string' ? user.phone : undefined;
  const phoneNumber = typeof user.phoneNumber === 'string' ? user.phoneNumber : undefined;
  // Extract roles array, default to ['client'] if not provided
  const roles = Array.isArray(user.roles) && user.roles.length > 0 
    ? user.roles as string[]
    : ['client'];
  const isVerified = typeof user.isVerified === 'boolean' ? user.isVerified : false;
  const trustScore = typeof user.trustScore === 'number' ? user.trustScore : 0;
  const completionRate = typeof user.completionRate === 'number' ? user.completionRate : 0;
  const cancellationRate = typeof user.cancellationRate === 'number' ? user.cancellationRate : 0;
  const isActive = user.isActive !== false;
  const status = (typeof user.status === 'string' ? user.status : 'pending_verification') as UserStatus;
  
  // Extract profile fields safely
  const profileAvatar = profileValue?.avatar;
  const rootAvatar = user.avatar;
  const avatar = (profileAvatar && typeof profileAvatar === 'object' && !Array.isArray(profileAvatar))
    ? profileAvatar as Avatar
    : (typeof rootAvatar === 'string' ? { url: rootAvatar } : undefined);
  
  const profileSkills = profileValue?.skills;
  const rootSkills = user.skills;
  const skills = (Array.isArray(profileSkills) ? profileSkills as string[] : undefined) || 
    (Array.isArray(rootSkills) ? rootSkills as string[] : []);
  
  const profilePortfolio = profileValue?.portfolio;
  const rootPortfolio = user.portfolio;
  const portfolio = (Array.isArray(profilePortfolio) ? profilePortfolio as PortfolioItem[] : undefined) ||
    (rootPortfolio ? 
      Array.isArray(rootPortfolio) && typeof rootPortfolio[0] === 'string' 
        ? rootPortfolio.map((url: string) => ({ images: [{ url }] })) as PortfolioItem[]
        : (Array.isArray(rootPortfolio) ? rootPortfolio as PortfolioItem[] : [])
      : []);
  
  // Extract nested objects safely
  const verification = (user.verification && typeof user.verification === 'object' && !Array.isArray(user.verification))
    ? user.verification as Verification
    : {};
  const badges = Array.isArray(user.badges) ? user.badges as Badge[] : [];
  const agency = (user.agency && typeof user.agency === 'object' && !Array.isArray(user.agency))
    ? user.agency as Agency
    : {};
  const referral = (user.referral && typeof user.referral === 'object' && !Array.isArray(user.referral))
    ? user.referral as Referral
    : {};
  const wallet = (user.wallet && typeof user.wallet === 'object' && !Array.isArray(user.wallet))
    ? user.wallet as Wallet
    : { balance: 0, currency: 'PHP' };
  const activity = (user.activity && typeof user.activity === 'object' && !Array.isArray(user.activity))
    ? user.activity as Activity
    : {};
  const responseTime = (user.responseTime && typeof user.responseTime === 'object' && !Array.isArray(user.responseTime))
    ? user.responseTime as ResponseTime
    : {};
  const createdAt = typeof user.createdAt === 'string' ? user.createdAt : new Date().toISOString();
  const updatedAt = typeof user.updatedAt === 'string' ? user.updatedAt : new Date().toISOString();
  
  return {
    ...(typeof user === 'object' && user !== null && !Array.isArray(user) ? user : {}),
    _id: userId,
    id: userId,
    name,
    phone: phone || phoneNumber || undefined,
    phoneNumber: phoneNumber || phone || undefined,
    location: location || undefined,
    roles, // Multi-role support
    isVerified,
    trustScore,
    completionRate,
    cancellationRate,
    isActive,
    status,
    profile: {
      ...(profileValue || {}),
      avatar,
      skills,
      portfolio,
    },
    verification,
    badges,
    agency,
    referral,
    wallet,
    activity,
    responseTime,
    createdAt,
    updatedAt
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
  
  // Get user roles for conditional rendering
  const userRoles = useMemo(() => session?.user?.roles || profile?.roles || ['client'], [session?.user?.roles, profile?.roles]);
  
  // Get current role view from localStorage
  const [roleView, setRoleView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('roleView');
      if (saved && userRoles.includes(saved)) {
        return saved;
      }
    }
    return userRoles.length > 0 ? userRoles[0] : 'client';
  });

  // Update roleView when userRoles change
  useEffect(() => {
    if (userRoles.length > 0) {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('roleView');
        if (saved && userRoles.includes(saved)) {
          setRoleView(saved);
        } else if (!userRoles.includes(roleView)) {
          setRoleView(userRoles[0]);
        }
      } else if (!userRoles.includes(roleView)) {
        setRoleView(userRoles[0]);
      }
    }
  }, [userRoles, roleView]);

  // Listen for roleView changes from localStorage and custom events (when switcher changes)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = () => {
      const saved = localStorage.getItem('roleView');
      if (saved && userRoles.includes(saved)) {
        setRoleView(saved);
      }
    };

    const handleRoleViewChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ roleView: string }>;
      if (customEvent.detail?.roleView && userRoles.includes(customEvent.detail.roleView)) {
        setRoleView(customEvent.detail.roleView);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('roleViewChanged', handleRoleViewChange);
    // Also check periodically in case of same-tab updates
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('roleViewChanged', handleRoleViewChange);
      clearInterval(interval);
    };
  }, [userRoles]);
  
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
        const normalized = normalizeUser(session.user as unknown as Record<string, unknown>);
        setProfile(normalized);
        setLoading(false);
        profileFetchedRef.current = true;
        
        // Then try to fetch full profile from API to enrich the data
        fetchInProgressRef.current = true;
        try {
          if (!getApiToken()) return;
          const url = `${API_BASE_URL}${API_ENDPOINTS.authMe}`;
          const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
          
          if (response.ok) {
            const responseData = await response.json();
            const userData = responseData?.data || responseData || responseData?.user;
            if (userData) {
              setProfile(normalizeUser(userData));
            }
          }
        } catch (error) {
          logger.error('Error fetching user profile', error instanceof Error ? error : new Error(String(error)));
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
            logger.warn('No user data received from API');
          }
        } else {
          logger.warn('Failed to fetch user profile', { status: response.status });
        }
      } catch (error) {
        logger.error('Error fetching user profile', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
        fetchInProgressRef.current = false;
      }
    };
    
    fetchProfile();
  }, [session?.user?.id, session?.user, initialProfile]);
  
  // Role-based visibility helpers - based on current role view, not just user roles
  const isClientView = roleView === 'client';
  const isProviderView = roleView === 'provider';
  const isSupplierView = roleView === 'supplier';
  const isInstructorView = roleView === 'instructor';
  const isAgencyOwnerView = roleView === 'agency_owner';
  const isAgencyAdminView = roleView === 'agency_admin';
  const isAdminView = roleView === 'admin';
  
  // Use role view for display purposes
  const primaryRole = roleView || userRoles[0] || 'client';
  
  // Business roles based on current view
  const isBusinessRole = isProviderView || isSupplierView || isInstructorView || isAgencyOwnerView || isAgencyAdminView || isAdminView;
  const isServiceProvider = isProviderView || isAgencyOwnerView || isAgencyAdminView || isAdminView;
  const isAdministrative = isAgencyOwnerView || isAgencyAdminView || isAdminView;
  

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

  // Quick Actions handlers
  const handleViewPublicProfile = useCallback(async () => {
    // Check if user has provider role
    if (!isServiceProvider && !isBusinessRole) {
      alert('You need to be a provider to view your public profile.');
      return;
    }

    const userId = profile?._id || profile?.id;
    if (!userId) {
      alert('Unable to find your profile ID.');
      return;
    }

    // Try to get provider ID from the profile data first
    const profileData = profile as unknown as Record<string, unknown>;
    let providerId: string | undefined;
    
    // Check if provider data exists in profile
    if (profileData?.provider && typeof profileData.provider === 'object') {
      const provider = profileData.provider as Record<string, unknown>;
      providerId = (provider._id || provider.id) as string | undefined;
    }
    
    // If no provider ID found, try to fetch it from API
    if (!providerId) {
      try {
        // Try marketplace providers endpoint with user ID filter
        const response = await fetch(
          `${API_BASE_URL}/api/marketplace/providers?userId=${userId}`,
          createAuthFetchOptions()
        );
        
        if (response.ok) {
          const data = await response.json();
          const providers = data?.data || data?.providers || (Array.isArray(data) ? data : []);
          if (Array.isArray(providers) && providers.length > 0) {
            providerId = providers[0]?._id || providers[0]?.id;
          }
        } else {
          // If marketplace endpoint fails, try regular providers endpoint
          const altResponse = await fetch(
            `${API_BASE_URL}/api/providers?userId=${userId}`,
            createAuthFetchOptions()
          );
          
          if (altResponse.ok) {
            const altData = await altResponse.json();
            const altProviders = altData?.data || altData?.providers || (Array.isArray(altData) ? altData : []);
            if (Array.isArray(altProviders) && altProviders.length > 0) {
              providerId = altProviders[0]?._id || altProviders[0]?.id;
            }
          }
        }
      } catch (error) {
        logger.error('Error fetching provider ID', error instanceof Error ? error : new Error(String(error)));
      }
    }
    
    // Use provider ID if found, otherwise fall back to user ID
    // The provider detail page should handle both cases
    const idToUse = providerId || userId;
    router.push(`/marketplace/providers/${idToUse}`);
  }, [router, profile, isServiceProvider, isBusinessRole]);

  const handleDownloadResume = useCallback(() => {
    // TODO: Implement resume download functionality
    console.log('Download resume');
  }, []);

  const handleServiceDashboard = useCallback(() => {
    router.push('/admin/services');
  }, [router]);

  const handleSupplyDashboard = useCallback(() => {
    router.push('/admin/supplies');
  }, [router]);

  const handleAcademyDashboard = useCallback(() => {
    router.push('/admin/academy');
  }, [router]);

  const handleAgencyDashboard = useCallback(() => {
    router.push('/admin/agencies');
  }, [router]);

  const handlePrivacySettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const formattedCreatedAt = useMemo(() => (
    profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"
  ), [profile?.createdAt]);

  const formattedUpdatedAt = useMemo(() => (
    profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : "N/A"
  ), [profile?.updatedAt]);


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
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-green-50/30 rounded-2xl p-6 lg:p-8 border border-gray-200/50 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-700 to-gray-900 bg-clip-text text-transparent mb-2">
                Profile Settings
              </h2>
              <p className="text-gray-700 text-lg font-medium">
                Manage your personal information and preferences
              </p>
              <p className="text-sm text-gray-600 mt-2 flex items-center">
                <Edit className="w-4 h-4 mr-1 text-blue-600" />
                Click the edit button to make changes to your profile
              </p>
            </div>
            
            {/* Edit Profile Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                onClick={handleEditProfile}
                className="flex items-center justify-center space-x-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
              
              {/* Last updated info */}
              <div className="hidden lg:flex items-center space-x-4" aria-label="Last updated">
                <div className="text-right">
                  <p className="text-sm text-gray-600 font-medium">Last updated</p>
                  <p className="text-sm font-bold text-gray-900">{formattedUpdatedAt}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-600 to-purple-700 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-300">
                  <UserIcon className="w-7 h-7 text-white" />
                </div>
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
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300">
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
                <p className="text-gray-600 capitalize mt-1">{primaryRole || "User"}</p>
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
              {!isClientView && isBusinessRole && profile?.profile?.businessName && (
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
              {!isClientView && profile?.profile?.skills && profile.profile.skills.length > 0 && (
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
              {!isClientView && isServiceProvider && profile?.profile?.specialties && profile.profile.specialties.length > 0 && (
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
              {!isClientView && isServiceProvider && profile?.profile?.serviceAreas && profile.profile.serviceAreas.length > 0 && (
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
              {!isClientView && isBusinessRole && profile?.profile?.experience !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isServiceProvider ? "Service Experience" : isInstructorView ? "Teaching Experience" : "Professional Experience"}
                  </label>
                  <p className="text-gray-700 py-2">{profile.profile.experience} years</p>
                </div>
              )}

              {/* Rating and Reviews - Only for non-client roles */}
              {!isClientView && (profile?.profile?.rating !== undefined || profile?.profile?.totalReviews !== undefined) && (
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
              {!isClientView && profile?.profile?.certifications && profile.profile.certifications.length > 0 && (
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
              {!isClientView && isBusinessRole && profile?.profile?.insurance && (
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
              {!isClientView && isBusinessRole && profile?.profile?.backgroundCheck && (
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
              {!isClientView && isBusinessRole && profile?.profile?.portfolio && profile.profile.portfolio.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    {isServiceProvider ? "Service Portfolio" : isInstructorView ? "Teaching Portfolio" : "Professional Portfolio"}
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
              {!isClientView && profile?.verification && Object.values(profile.verification).some(v => v === true) && (
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
              {!isClientView && profile?.badges && profile.badges.length > 0 && (
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
              {!isClientView && (profile?.responseTime?.average !== undefined || profile?.completionRate !== undefined || profile?.cancellationRate !== undefined) && (
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
            {!isClientView && isBusinessRole && <WalletInfo profile={profile} />}

            {/* Agency Information - Only for non-client roles */}
            {!isClientView && <AgencyInfo profile={profile} />}

            {/* Referral Information */}
            {/* <ReferralInfo profile={profile} /> */}

            {/* Activity Summary */}
            <ActivitySummary profile={profile} />

            {/* Quick Actions */}
            <QuickActions
              isBusinessRole={isBusinessRole}
              isServiceProvider={isServiceProvider}
              isSupplier={isSupplierView}
              isInstructor={isInstructorView}
              isAdministrative={isAdministrative}
              onViewPublicProfile={handleViewPublicProfile}
              onDownloadResume={handleDownloadResume}
              onServiceDashboard={handleServiceDashboard}
              onSupplyDashboard={handleSupplyDashboard}
              onAcademyDashboard={handleAcademyDashboard}
              onAgencyDashboard={handleAgencyDashboard}
              onPrivacySettings={handlePrivacySettings}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
