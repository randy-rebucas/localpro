"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck,
  UserX,
  Phone,
  Calendar,
  MapPin,
  RefreshCw,
  Filter,
  Download,
  Plus,
  Eye,
  ChevronDown,
  ChevronUp,
  Award,
  CheckCircle2,
  Save,
  Sparkles
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { FileUpload } from "@/components/ui/file-upload";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { User, UserStatus, UserBadge, Verification, Profile, BadgeType } from "@/types/users";
import { generateBio } from "@/lib/ai-utils";
import { ProfessionalInfo, BusinessInfo, Preferences, Performance } from "@/types/providers";

// Type for API user response (raw data from backend)
interface ApiUserData {
    isActive?: boolean;
  _id?: string;
  phoneNumber?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string; // Legacy field from API (for backward compatibility)
  roles?: string[]; // Multi-role support
  status?: string;
  isVerified?: boolean;
  trustScore?: number;
  completionRate?: number;
  cancellationRate?: number;
  loginCount?: number;
  tags?: string[];
  profile?: Profile;
  verification?: {
    phoneVerified?: boolean;
    emailVerified?: boolean;
    identityVerified?: boolean;
    businessVerified?: boolean;
    addressVerified?: boolean;
    bankAccountVerified?: boolean;
    verifiedAt?: string | Date;
  };
  badges?: Array<{
    type?: string;
    description?: string;
    earnedAt?: string | Date;
  }>;
  notes?: Array<string | {
    note?: string;
    addedBy?: string;
    addedAt?: string | Date;
  }>;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  lastLogin?: string | Date;
  lastLoginAt?: string | Date;
}

// Helper function to transform API user data to frontend format
const transformUserData = (apiUser: ApiUserData): User => {
  // Convert role/roles to roles array
  const roles = apiUser.roles && apiUser.roles.length > 0
    ? apiUser.roles
    : (apiUser.role ? [apiUser.role] : ['client']);
  
  const user: User = {
    _id: apiUser._id,
    phoneNumber: apiUser.phoneNumber || '',
    email: apiUser.email,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    roles: roles,
    status: apiUser.status as UserStatus || 'pending_verification',
    isVerified: apiUser.isVerified || false,
    ...(typeof apiUser.isActive === 'boolean' ? { isActive: apiUser.isActive } : {}),
    trustScore: apiUser.trustScore,
    completionRate: apiUser.completionRate,
    cancellationRate: apiUser.cancellationRate,
    loginCount: apiUser.loginCount,
    tags: apiUser.tags,
    createdAt: apiUser.createdAt ? new Date(apiUser.createdAt) : new Date(),
    updatedAt: apiUser.updatedAt ? new Date(apiUser.updatedAt) : new Date(),
    lastLoginAt: (() => {
      const loginDate = apiUser.lastLogin || apiUser.lastLoginAt;
      return loginDate ? new Date(loginDate) : undefined;
    })(),
  };

  // Handle profile
  if (apiUser.profile) {
    user.profile = {
      ...apiUser.profile,
      // Ensure gender and birthdate are properly preserved
      gender: apiUser.profile.gender 
        ? (apiUser.profile.gender as "male" | "female" | "other" | "prefer_not_to_say")
        : undefined,
      birthdate: apiUser.profile.birthdate 
        ? (apiUser.profile.birthdate instanceof Date 
            ? apiUser.profile.birthdate 
            : typeof apiUser.profile.birthdate === 'string'
            ? apiUser.profile.birthdate
            : apiUser.profile.birthdate ? new Date(String(apiUser.profile.birthdate)) : undefined)
        : undefined
    } as Profile;
  }

  // Handle verification
  if (apiUser.verification) {
    user.verification = {
      phoneVerified: apiUser.verification.phoneVerified,
      emailVerified: apiUser.verification.emailVerified,
      identityVerified: apiUser.verification.identityVerified,
      businessVerified: apiUser.verification.businessVerified,
      addressVerified: apiUser.verification.addressVerified,
      bankAccountVerified: apiUser.verification.bankAccountVerified,
      verifiedAt: apiUser.verification.verifiedAt ? new Date(apiUser.verification.verifiedAt) : undefined,
    } as Verification;
  }

  // Handle badges
  if (apiUser.badges && Array.isArray(apiUser.badges)) {
    user.badges = apiUser.badges.map((badge): UserBadge => ({
      type: badge.type as BadgeType,
      description: badge.description,
      earnedAt: badge.earnedAt ? new Date(badge.earnedAt) : new Date(),
    }));
  }

  // Handle notes
  if (apiUser.notes && Array.isArray(apiUser.notes)) {
    user.notes = apiUser.notes.map((note) => ({
      note: typeof note === 'string' ? note : note.note,
      addedBy: typeof note === 'string' ? undefined : note.addedBy,
      addedAt: typeof note === 'string' ? new Date() : (note.addedAt ? new Date(note.addedAt) : new Date()),
    }));
  }

  return user;
};

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  newUsersToday: number;
  newUsersWeek: number;
  newUsersMonth: number;
  trends: {
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ week: string; count: number }>;
    monthly: Array<{ month: string; count: number }>;
  };
  topRoles: Array<{ role: string; count: number }>;
  statusStats: Array<{ status: string; count: number }>;
  performanceMetrics: {
    averageRegistrationTime: number;
    medianRegistrationTime: number;
    p95RegistrationTime: number;
  };
}

export default function UsersPage() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [slowRequest, setSlowRequest] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'status' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all"); // "all", "true", "false"
  const [isVerifiedFilter, setIsVerifiedFilter] = useState<string>("all"); // "all", "true", "false"

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [bulkUpdateModalOpen, setBulkUpdateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<User | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [createFormData, setCreateFormData] = useState({
    phoneNumber: "",
    email: "",
    firstName: "",
    lastName: "",
    roles: ["client"] as string[],
    profile: {
      avatar: {
        url: "",
        publicId: "",
        thumbnail: ""
      },
      bio: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
            coordinates: {
              lat: undefined as number | undefined,
              lng: undefined as number | undefined
            }
      },
      gender: "" as "" | "male" | "female" | "other" | "prefer_not_to_say",
      birthdate: "" as string | Date | undefined
    }
  });

  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    gender: "" as "" | "male" | "female" | "other" | "prefer_not_to_say",
    birthdate: "" as string | undefined,
    roles: ["client"] as string[],
    profile: {
      avatar: {
        url: "",
        publicId: "",
        thumbnail: ""
      },
      bio: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        coordinates: {
          lat: undefined as number | undefined,
          lng: undefined as number | undefined
        }
      }
    }
  });

  const [verificationFormData, setVerificationFormData] = useState({
    phoneVerified: false,
    emailVerified: false,
    identityVerified: false,
    businessVerified: false,
    addressVerified: false,
    bankAccountVerified: false
  });

  const [badgeFormData, setBadgeFormData] = useState({
    type: "",
    description: ""
  });

  const [bulkUpdateFormData, setBulkUpdateFormData] = useState<{
    isActive?: boolean;
    status?: UserStatus | '';
    addRoles?: string;
    removeRoles?: string;
  }>({
    isActive: true,
    status: "active" as UserStatus
  });

  // Provider form states
  const [providerData, setProviderData] = useState<{
    professionalInfo?: ProfessionalInfo;
    businessInfo?: BusinessInfo;
    preferences?: Preferences;
    performance?: Performance;
    providerType?: 'individual' | 'business' | 'agency';
    status?: 'pending' | 'active' | 'suspended' | 'inactive' | 'rejected';
  } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingProviderData, setLoadingProviderData] = useState(false);
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [professionalInfoForm, setProfessionalInfoForm] = useState<ProfessionalInfo>({
    specialties: [],
    languages: [],
    availability: {},
    emergencyServices: false,
    travelDistance: 0,
    minimumJobValue: 0,
    maximumJobValue: 0
  });

  const [businessInfoForm, setBusinessInfoForm] = useState<BusinessInfo>({
    businessName: "",
    businessType: "",
    businessRegistration: "",
    taxId: "",
    businessAddress: {},
    businessPhone: "",
    businessEmail: "",
    website: "",
    businessDescription: "",
    yearEstablished: undefined,
    numberOfEmployees: undefined
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [preferencesForm, setPreferencesForm] = useState<Preferences>({
    notificationSettings: {
      newJobAlerts: true,
      messageNotifications: true,
      paymentNotifications: true,
      reviewNotifications: true,
      marketingEmails: false
    },
    jobPreferences: {
      preferredJobTypes: [],
      avoidJobTypes: [],
      preferredTimeSlots: [],
      maxJobsPerDay: 5,
      advanceBookingDays: 30
    },
    communicationPreferences: {
      preferredContactMethod: 'app',
      responseTimeExpectation: '60',
      autoAcceptJobs: false
    }
  });

  // Avatar upload states
  const [createAvatarFile, setCreateAvatarFile] = useState<File | null>(null);
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Skills state - skills can be objects with {id, name, category, ...} or strings
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [availableSkills, setAvailableSkills] = useState<Array<{ id?: string; name: string; category?: string; displayOrder?: number; metadata?: Record<string, unknown> } | string>>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [skillsSearchInput, setSkillsSearchInput] = useState({ create: "", edit: "" });
  const [showSkillsSuggestions, setShowSkillsSuggestions] = useState({ create: false, edit: false });

  // Roles state
  const availableRoles = ['client', 'provider', 'supplier', 'instructor', 'agency_owner', 'agency_admin', 'admin'];
  const [rolesSearchInput, setRolesSearchInput] = useState({ create: "", edit: "" });
  const [showRolesSuggestions, setShowRolesSuggestions] = useState({ create: false, edit: false });

  // AI Bio generation state
  const [generatingBio, setGeneratingBio] = useState({ create: false, edit: false });

  // Debug: Track editFormData changes
  useEffect(() => {
    if (editModalOpen) {
      console.log('📋 Edit form data changed', {
        gender: editFormData.gender,
        birthdate: editFormData.birthdate,
        genderType: typeof editFormData.gender,
        birthdateType: typeof editFormData.birthdate
      });
    }
  }, [editFormData.gender, editFormData.birthdate, editModalOpen]);

  const fetchData = useCallback(async () => {
    let slowRequestTimer: NodeJS.Timeout | null = null;
    let usersUrl = '';
    
    try {
      setLoading(true);
      setError(null);
      setSlowRequest(false);

      // Set a timer to show slow request warning
      slowRequestTimer = setTimeout(() => {
        setSlowRequest(true);
      }, 10000); // Show warning after 10 seconds

      // Build query parameters for users data
      const queryParams = new URLSearchParams();
      queryParams.set('page', currentPage.toString());
      queryParams.set('limit', itemsPerPage.toString());
      if (debouncedSearchTerm) queryParams.set('search', debouncedSearchTerm);
      if (roleFilter !== 'all') queryParams.set('role', roleFilter);
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);
      if (isActiveFilter !== 'all') queryParams.set('isActive', isActiveFilter);
      if (isVerifiedFilter !== 'all') queryParams.set('isVerified', isVerifiedFilter);
      queryParams.set('sortBy', sortBy);
      queryParams.set('sortOrder', sortOrder);

      if (!getApiToken()) {
        logger.warn('No API token found, cannot fetch users');
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }
      
      const usersQuery = new URLSearchParams(Object.fromEntries(queryParams)).toString();
      usersUrl = `${API_BASE_URL}${API_ENDPOINTS.users}${usersQuery ? `?${usersQuery}` : ''}`;
      const statsUrl = `${API_BASE_URL}${API_ENDPOINTS.usersStats}?period=week`;
      
      logger.debug('Fetching users', { 
        usersUrl, 
        statsUrl, 
        queryParams: Object.fromEntries(queryParams),
        apiBaseUrl: API_BASE_URL,
        endpoint: API_ENDPOINTS.users
      });
      
      const [dataResponse, statsResponse] = await Promise.all([
        fetch(usersUrl, createAuthFetchOptions({ method: 'GET' })),
        fetch(statsUrl, createAuthFetchOptions({ method: 'GET' }))
      ]);

      if (!dataResponse.ok) {
        const errorText = await dataResponse.text().catch(() => '');
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${dataResponse.status}: ${dataResponse.statusText}` };
        }
        logger.error('Failed to fetch users', new Error(errorData.error || errorData.message || 'Failed to fetch users data'), {
          status: dataResponse.status,
          statusText: dataResponse.statusText,
          url: usersUrl,
          errorData
        });
        throw new Error(errorData.error || errorData.message || `HTTP ${dataResponse.status}: Failed to fetch users data`);
      }

      const dataResult = await dataResponse.json();

      // Handle stats response - only process if successful
      let statsData = null;
      if (statsResponse.ok) {
        try {
          const statsResult = await statsResponse.json();
          statsData = statsResult.data || statsResult;
        } catch (err) {
          logger.warn('Failed to parse stats response', { 
            error: err instanceof Error ? err.message : String(err)
          });
        }
      } else {
        logger.warn('Failed to fetch stats', { 
          status: statsResponse.status,
          statusText: statsResponse.statusText
        });
      }

      // Log the response for debugging
      logger.debug('Users API response', { 
        hasSuccess: !!dataResult.success,
        hasData: !!dataResult.data,
        dataType: Array.isArray(dataResult.data) ? 'array' : typeof dataResult.data,
        dataKeys: dataResult.data ? Object.keys(dataResult.data) : [],
        fullResponse: dataResult
      });

      // Transform the API response data to match frontend expectations
      let usersData: User[] = [];
      let totalCount = 0;

      // Handle different response structures
      if (dataResult.success && dataResult.data) {
        // Handle the new API response structure: { success: true, data: { users: [], pagination: {} } }
        if (dataResult.data.users && Array.isArray(dataResult.data.users)) {
          usersData = dataResult.data.users.map(transformUserData);
          totalCount = dataResult.data.pagination?.total || dataResult.data.users.length;
        } 
        // Handle: { success: true, data: [] }
        else if (Array.isArray(dataResult.data)) {
          usersData = dataResult.data.map(transformUserData);
          totalCount = dataResult.total || dataResult.data.length;
        }
      } 
      // Handle direct array response: []
      else if (Array.isArray(dataResult)) {
        usersData = dataResult.map(transformUserData);
        totalCount = dataResult.length;
      }
      // Handle: { data: [] } or { data: { users: [] } }
      else if (dataResult.data) {
        if (Array.isArray(dataResult.data)) {
          usersData = dataResult.data.map(transformUserData);
          totalCount = dataResult.total || dataResult.data.length;
        } else if (dataResult.data.users && Array.isArray(dataResult.data.users)) {
          usersData = dataResult.data.users.map(transformUserData);
          totalCount = dataResult.data.pagination?.total || dataResult.data.users.length;
        }
      }
      // Handle direct users array in root
      else if (Array.isArray(dataResult.users)) {
        usersData = dataResult.users.map(transformUserData);
        totalCount = dataResult.pagination?.total || dataResult.users.length;
      }

      // No fallback - just use empty array if no users found
      setUsers(usersData);
      setTotalCount(totalCount);
      
      // Handle stats response - only set if we have valid data
      if (statsData && !Array.isArray(statsData) && typeof statsData === 'object') {
        setStats(statsData);
      } else {
        // Set to null if no valid stats data
        setStats(null);
      }
      setLastUpdated(new Date());
    } catch (err) {
      logger.error('Error fetching users data', err instanceof Error ? err : new Error(String(err)), {
        url: usersUrl,
        error: err instanceof Error ? err.message : String(err)
      });
      let errorMessage = 'Failed to load users data';
      
      if (err instanceof Error) {
        if (err.message.includes('timed out')) {
          errorMessage = 'Request timed out. The server may be slow. Please try again.';
        } else if (err.message.includes('aborted')) {
          errorMessage = 'Request was cancelled. Please try again.';
        } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          errorMessage = 'Unauthorized. Please check your authentication.';
        } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
          errorMessage = 'Access forbidden. You may not have permission to view users.';
        } else if (err.message.includes('404')) {
          errorMessage = 'Users endpoint not found. Please check the API configuration.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setUsers([]);
      setTotalCount(0);
    } finally {
      if (slowRequestTimer) {
        clearTimeout(slowRequestTimer);
      }
      setLoading(false);
      setSlowRequest(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, roleFilter, statusFilter, isActiveFilter, isVerifiedFilter, sortBy, sortOrder]);

  // Debounce search term
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check for query parameter to auto-open create modal with provider role
  useEffect(() => {
    const createParam = searchParams.get('create');
    if (createParam === 'provider' && !createModalOpen) {
      // Pre-select provider role
      setCreateFormData(prev => ({
        ...prev,
        roles: ["client", "provider"]
      }));
      // Open create modal
      setCreateModalOpen(true);
      // Clean up URL by removing query parameter
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('create');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams, createModalOpen]);

  // Keyboard shortcut: Ctrl+K or Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Search users..."]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          // Show filters if hidden
          if (!showFilters) {
            setShowFilters(true);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFilters]);

  // Fetch available skills
  const fetchSkills = useCallback(async () => {
    try {
      setLoadingSkills(true);
      if (!getApiToken()) return;
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.providersSkills}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.warn('Failed to fetch skills', { 
          status: response.status, 
          error: errorData.error || errorData.message 
        });
        return;
      }

      const result = await response.json();
      // Handle different response structures
      const skills = result.data?.skills || result.data || result.skills || result || [];
      // Ensure we have an array and normalize to objects with name property
      type SkillType = { id?: string; name: string; category?: string; displayOrder?: number; metadata?: Record<string, unknown> } | string;
      const normalizedSkills: SkillType[] = Array.isArray(skills) 
        ? skills.map((skill: { id?: string; name?: string; category?: string; [key: string]: unknown } | string): SkillType => {
            // If it's already an object with a name, use it
            if (typeof skill === 'object' && skill !== null && skill.name && typeof skill.name === 'string') {
              return {
                id: typeof skill.id === 'string' ? skill.id : undefined,
                name: skill.name,
                category: typeof skill.category === 'string' ? skill.category : undefined,
                displayOrder: typeof skill.displayOrder === 'number' ? skill.displayOrder : undefined,
                metadata: typeof skill.metadata === 'object' && skill.metadata !== null ? skill.metadata as Record<string, unknown> : undefined
              };
            }
            // If it's a string, convert to object
            if (typeof skill === 'string') {
              return { name: skill };
            }
            // Otherwise, try to extract name or use the skill as-is
            const nameValue = (typeof skill === 'object' && skill !== null && skill.name) 
              ? String(skill.name) 
              : String(skill);
            return { name: nameValue };
          })
        : [];
      setAvailableSkills(normalizedSkills);
    } catch (err) {
      logger.error('Error fetching skills', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoadingSkills(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.skills-autosuggest-container') && !target.closest('.roles-autosuggest-container')) {
        setShowSkillsSuggestions({ create: false, edit: false });
        setShowRolesSuggestions({ create: false, edit: false });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle avatar upload
  const handleAvatarUpload = async (file: File, isCreate: boolean) => {
    if (!file) return null;

    try {
      setUploadingAvatar(true);
      if (!getApiToken()) {
        toast.error('Authentication required');
        return null;
      }

      const formData = new FormData();
      formData.append("avatar", file);

      const apiToken = getApiToken();
      const headers: HeadersInit = {
        ...(apiToken && { 'Authorization': `Bearer ${apiToken}` }),
      };

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.authUploadAvatar}`, {
        method: "POST",
        headers,
        body: formData,
        credentials: 'include',
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(text || 'Invalid response format');
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.message || data.error || "Failed to upload avatar";
        toast.error(errorMsg);
        return null;
      }

      const avatarData = data.data?.avatar || data.avatar;
      if (avatarData) {
        if (isCreate) {
          setCreateFormData(prev => ({
            ...prev,
            profile: {
              ...prev.profile,
              avatar: {
                url: avatarData.url || "",
                publicId: avatarData.publicId || "",
                thumbnail: avatarData.thumbnail || ""
              }
            }
          }));
        } else {
          setEditFormData(prev => ({
            ...prev,
            profile: {
              ...prev.profile,
              avatar: {
                url: avatarData.url || "",
                publicId: avatarData.publicId || "",
                thumbnail: avatarData.thumbnail || ""
              }
            }
          }));
        }
        toast.success('Avatar uploaded successfully');
        return avatarData;
      }
      return null;
    } catch (err) {
      logger.error('Error uploading avatar', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to upload avatar');
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (err) {
      logger.error('Error refreshing data', err instanceof Error ? err : new Error(String(err)));
      let errorMessage = 'Failed to refresh users data';
      
      if (err instanceof Error) {
        if (err.message.includes('timed out')) {
          errorMessage = 'Refresh timed out. The server may be slow. Please try again.';
        } else if (err.message.includes('aborted')) {
          errorMessage = 'Refresh was cancelled. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSort = (field: 'name' | 'role' | 'status' | 'createdAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewUser = async (userId: string) => {
    try {
      setLoadingUserDetails(true);
      if (!getApiToken()) return;
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.users}/${userId}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch user details');
      }

      const result = await response.json();
      const userData = result.data || result;
      setSelectedUserDetails(transformUserData(userData));
      setViewModalOpen(true);
    } catch (err) {
      logger.error('Error fetching user details', err instanceof Error ? err : new Error(String(err)), { userId });
      toast.error(err instanceof Error ? err.message : 'Failed to fetch user details');
    } finally {
      setLoadingUserDetails(false);
    }
  };

  // Fetch provider data for a user
  const fetchProviderData = useCallback(async (userId: string) => {
    try {
      setLoadingProviderData(true);
      if (!getApiToken()) return;

      // Try to fetch provider profile - this endpoint requires provider role
      // For admin, we might need to use a different endpoint or handle errors gracefully
      const url = `${API_BASE_URL}${API_ENDPOINTS.providersProfileMe}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (response.ok) {
        const result = await response.json();
        const provider = result.data || result;
        
        setProviderData({
          professionalInfo: provider.professionalInfo,
          businessInfo: provider.businessInfo,
          preferences: provider.preferences,
          performance: provider.performance,
          providerType: provider.providerType,
          status: provider.status
        });

        // Populate forms with existing data
        if (provider.professionalInfo) {
          setProfessionalInfoForm(provider.professionalInfo);
        }
        if (provider.businessInfo) {
          setBusinessInfoForm(provider.businessInfo);
        }
        if (provider.preferences) {
          setPreferencesForm(provider.preferences);
        }
      } else {
        // User might not have provider profile yet - that's okay
        logger.debug('No provider profile found for user', { userId });
        setProviderData(null);
      }
    } catch (err) {
      const errorMessage: string = err instanceof Error ? err.message : String(err);
      logger.warn('Error fetching provider data', { 
        error: errorMessage
      });
      // Don't show error - user might not be a provider
      setProviderData(null);
    } finally {
      setLoadingProviderData(false);
    }
  }, []);

  const handleEditUser = async (user: User) => {
    if (!user._id) {
      toast.error('User ID is required');
      return;
    }

    try {
      setLoadingUserDetails(true);
      if (!getApiToken()) {
        toast.error('Authentication required');
        return;
      }
      
      // Reset provider data and tabs
      setProviderData(null);
      
      // Fetch full user details to ensure we have all profile data
      const url = `${API_BASE_URL}${API_ENDPOINTS.users}/${user._id}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch user details');
      }

      const result = await response.json();
      const userData = result.data || result;
      
      // Extract provider data if it exists (server handles role checks)
      if (userData.provider) {
        const provider = userData.provider;
        setProviderData({
          professionalInfo: provider.professionalInfo,
          businessInfo: provider.businessInfo,
          preferences: provider.preferences,
          performance: provider.performance,
          providerType: provider.providerType,
          status: provider.status
        });
        
        // Populate forms with existing data
        if (provider.professionalInfo) {
          setProfessionalInfoForm(provider.professionalInfo);
        }
        if (provider.businessInfo) {
          setBusinessInfoForm(provider.businessInfo);
        }
        if (provider.preferences) {
          setPreferencesForm(provider.preferences);
        }
      } else {
        // If provider data is not in user object, try to fetch it
        // Note: /api/providers/profile/me returns current authenticated user's profile
        // For admin editing another user, this may not work unless backend supports it
        await fetchProviderData(user._id);
      }
      
      // Debug: Log raw API response
      console.log('🔍 Raw user data from API', {
        userData,
        profile: userData.profile,
        gender: userData.profile?.gender,
        birthdate: userData.profile?.birthdate,
        profileKeys: userData.profile ? Object.keys(userData.profile) : []
      });
      
      const fullUser = transformUserData(userData);
      
      // Debug: Log transformed user data
      console.log('🔄 Transformed user data', {
        fullUser,
        profile: fullUser.profile,
        gender: fullUser.profile?.gender,
        birthdate: fullUser.profile?.birthdate,
        profileKeys: fullUser.profile ? Object.keys(fullUser.profile) : []
      });
      
      setSelectedUser(fullUser);
      
      // Format birthdate for input field
      const formatBirthdate = (bd: Date | string | undefined): string => {
        if (!bd) return "";
        try {
          if (bd instanceof Date) {
            return bd.toISOString().split('T')[0];
          }
          if (typeof bd === 'string') {
            // Handle ISO string format: "2024-01-15T00:00:00.000Z" or "2024-01-15"
            const dateStr = bd.split('T')[0].split(' ')[0];
            // Validate it's a valid date format (YYYY-MM-DD)
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              return dateStr;
            }
            // Try to parse and reformat
            const parsed = new Date(bd);
            if (!isNaN(parsed.getTime())) {
              return parsed.toISOString().split('T')[0];
            }
          }
        } catch (e) {
          logger.warn('Error formatting birthdate', { birthdate: bd, error: e });
        }
        return "";
      };
      
      // Extract gender - check root level first, then profile (for backward compatibility)
      const rawGender = userData.gender || fullUser.profile?.gender || userData.profile?.gender;
      const userGender = (
        rawGender === "male" || rawGender === "female" || rawGender === "other" || rawGender === "prefer_not_to_say"
          ? rawGender
          : ""
      ) as "" | "male" | "female" | "other" | "prefer_not_to_say";
      
      // Extract birthdate - check root level first, then profile (for backward compatibility)
      const userBirthdate = userData.birthdate || fullUser.profile?.birthdate || userData.profile?.birthdate;
      
      console.log('📝 Extracted values for form', {
        rawGender,
        userGender,
        userBirthdate,
        formattedBirthdate: formatBirthdate(userBirthdate),
        genderType: typeof userGender,
        birthdateType: typeof userBirthdate
      });
      
      const formDataToSet: typeof editFormData = {
        firstName: fullUser.firstName || "",
        lastName: fullUser.lastName || "",
        email: fullUser.email || "",
        phoneNumber: fullUser.phoneNumber || "",
        gender: userGender,
        birthdate: formatBirthdate(userBirthdate),
        roles: fullUser.roles || ['client'],
        profile: {
          avatar: {
            url: fullUser.profile?.avatar?.url || "",
            publicId: fullUser.profile?.avatar?.publicId || "",
            thumbnail: fullUser.profile?.avatar?.thumbnail || ""
          },
          bio: fullUser.profile?.bio || "",
          address: {
            street: fullUser.profile?.address?.street || "",
            city: fullUser.profile?.address?.city || "",
            state: fullUser.profile?.address?.state || "",
            zipCode: fullUser.profile?.address?.zipCode || "",
            country: fullUser.profile?.address?.country || "",
            coordinates: {
              lat: fullUser.profile?.address?.coordinates?.lat as number | undefined,
              lng: fullUser.profile?.address?.coordinates?.lng as number | undefined
            }
          }
        }
      };
      
      // Debug: Log the final form data being set
      console.log('✅ Setting edit form data', {
        gender: formDataToSet.gender,
        birthdate: formDataToSet.birthdate,
        genderType: typeof formDataToSet.gender,
        birthdateType: typeof formDataToSet.birthdate,
        genderValue: formDataToSet.gender,
        birthdateValue: formDataToSet.birthdate,
        fullFormData: formDataToSet
      });
      
      setEditFormData(formDataToSet);
      
      // Verify the state was set correctly
      setTimeout(() => {
        console.log('🔎 Edit form data after setState', {
          gender: editFormData.gender,
          birthdate: editFormData.birthdate
        });
      }, 50);
      
      setEditModalOpen(true);
    } catch (err) {
      logger.error('Error fetching user details for edit', err instanceof Error ? err : new Error(String(err)), { userId: user._id });
      toast.error(err instanceof Error ? err.message : 'Failed to fetch user details');
    } finally {
      setLoadingUserDetails(false);
    }
  };
  
  // Check if user has provider data (server handles role checks)
  const isProviderUser = providerData !== null;

  const handleGenerateBio = async (isCreate: boolean) => {
    try {
      const formData = isCreate ? createFormData : editFormData;

      setGeneratingBio({ ...generatingBio, [isCreate ? 'create' : 'edit']: true });
      
      const bioParams: { firstName: string; lastName: string; roles: string[]; skills: string[] } = {
        firstName: formData.firstName || "",
        lastName: formData.lastName || "",
        roles: formData.roles || [],
        skills: []
      };

      const result = await generateBio(bioParams);
      
      if (result.bio) {
        if (isCreate) {
          setCreateFormData({
            ...createFormData,
            profile: {
              ...createFormData.profile,
              bio: result.bio
            }
          });
        } else {
          setEditFormData({
            ...editFormData,
            profile: {
              ...editFormData.profile,
              bio: result.bio
            }
          });
        }
        toast.success('Bio generated successfully!');
      } else {
        toast.error('Failed to generate bio');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate bio';
      logger.error('Error generating bio', error instanceof Error ? error : new Error(String(error)));
      
      // Provide more helpful error messages
      if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
        toast.error('Bio generation service is temporarily unavailable. Please try again later or write your bio manually.');
      } else if (errorMessage.includes('404') || errorMessage.includes('not available')) {
        toast.error('Bio generation feature is not available yet. Please write your bio manually.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setGeneratingBio({ ...generatingBio, [isCreate ? 'create' : 'edit']: false });
    }
  };

  const handleOpenVerificationModal = (user: User) => {
    setSelectedUser(user);
    console.log('🛂 Opening verification modal for user', { user: user });
    // Prefill: checked if already verified (true) or trustScore >= 80
    const trustPrefill = typeof user.trustScore === 'number' && user.trustScore >= 80;
    setVerificationFormData({
      phoneVerified: user.verification?.phoneVerified || trustPrefill || false,
      emailVerified: user.verification?.emailVerified || trustPrefill || false,
      identityVerified: user.verification?.identityVerified || trustPrefill || false,
      businessVerified: user.verification?.businessVerified || trustPrefill || false,
      addressVerified: user.verification?.addressVerified || trustPrefill || false,
      bankAccountVerified: user.verification?.bankAccountVerified || trustPrefill || false
    });
    setVerificationModalOpen(true);
  };

  const handleOpenBadgeModal = (user: User) => {
    setSelectedUser(user);
    setBadgeFormData({ type: "", description: "" });
    setBadgeModalOpen(true);
  };

  const handleCreateUser = async () => {
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      // Ensure client role is always included
      const rolesToSend = createFormData.roles.includes('client')
        ? createFormData.roles
        : ['client', ...createFormData.roles];

      // Prepare profile data, ensuring gender and birthdate are included
      const profileData: Profile = {
        ...createFormData.profile,
        gender: createFormData.profile.gender || undefined,
        birthdate: createFormData.profile.birthdate || undefined
      };

      const url = `${API_BASE_URL}${API_ENDPOINTS.usersCreate}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify({
          ...createFormData,
          roles: rolesToSend,
          profile: profileData
        })
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create user');
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const result = await response.json();

      toast.success('User created successfully');

      setCreateModalOpen(false);
      setCreateAvatarFile(null);
      setCreateFormData({
        phoneNumber: "",
        email: "",
        firstName: "",
        lastName: "",
        roles: ["client"],
        profile: {
          avatar: {
            url: "",
            publicId: "",
            thumbnail: ""
          },
          bio: "",
          address: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
            coordinates: {
              lat: undefined as number | undefined,
              lng: undefined as number | undefined
            }
          },
          gender: "" as "" | "male" | "female" | "other" | "prefer_not_to_say",
          birthdate: "" as string | Date | undefined
        }
      });
      await fetchData();
    } catch (err) {
      logger.error('Error creating user', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      // Ensure client role is always included
      const rolesToSend = editFormData.roles.includes('client')
        ? editFormData.roles
        : ['client', ...editFormData.roles];

      // Build payload matching the API structure from Untitled-1
      // Structure: phoneNumber, firstName, lastName, email, gender, birthdate at root
      // roles array at root
      // profile object with bio and address
      const payload: Record<string, unknown> = {};

      // Add root level fields (only if they have values)
      if (editFormData.phoneNumber) payload.phoneNumber = editFormData.phoneNumber;
      if (editFormData.firstName) payload.firstName = editFormData.firstName;
      if (editFormData.lastName) payload.lastName = editFormData.lastName;
      if (editFormData.email) payload.email = editFormData.email;
      if (editFormData.gender) payload.gender = editFormData.gender;
      if (editFormData.birthdate) payload.birthdate = editFormData.birthdate;
      
      // Always include roles
      payload.roles = rolesToSend;

      // Build profile object if bio or address has data
      const hasAddress = editFormData.profile.address.street || 
                        editFormData.profile.address.city || 
                        editFormData.profile.address.state ||
                        editFormData.profile.address.zipCode ||
                        editFormData.profile.address.country ||
                        editFormData.profile.address.coordinates?.lat ||
                        editFormData.profile.address.coordinates?.lng;

      if (editFormData.profile.bio || hasAddress) {
        payload.profile = {} as Record<string, unknown>;
        
        if (editFormData.profile.bio) {
          (payload.profile as Record<string, unknown>).bio = editFormData.profile.bio;
        }

        if (hasAddress) {
          const address: Record<string, unknown> = {};
          
          if (editFormData.profile.address.street) address.street = editFormData.profile.address.street;
          if (editFormData.profile.address.city) address.city = editFormData.profile.address.city;
          if (editFormData.profile.address.state) address.state = editFormData.profile.address.state;
          if (editFormData.profile.address.zipCode) address.zipCode = editFormData.profile.address.zipCode;
          if (editFormData.profile.address.country) address.country = editFormData.profile.address.country;
          
          if (editFormData.profile.address.coordinates?.lat || editFormData.profile.address.coordinates?.lng) {
            const coordinates: Record<string, unknown> = {};
            if (editFormData.profile.address.coordinates.lat !== undefined) {
              coordinates.lat = editFormData.profile.address.coordinates.lat;
            }
            if (editFormData.profile.address.coordinates.lng !== undefined) {
              coordinates.lng = editFormData.profile.address.coordinates.lng;
            }
            if (Object.keys(coordinates).length > 0) {
              address.coordinates = coordinates;
            }
          }
          
          if (Object.keys(address).length > 0) {
            (payload.profile as Record<string, unknown>).address = address;
          }
        }
      }

      // Update user basic info - using /api/users/:id endpoint
      const url = `${API_BASE_URL}${API_ENDPOINTS.usersUpdate}/${selectedUser._id}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify(payload)
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update user');
      }

      toast.success('User updated successfully');
      setEditModalOpen(false);
      setSelectedUser(null);
      await fetchData();
    } catch (err) {
      logger.error('Error updating user', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateVerification = async () => {
    if (!selectedUser) return;
    
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.usersVerification}/${selectedUser._id}/verification`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'PATCH',
        body: JSON.stringify({
          verification: verificationFormData
        })
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update verification');
      }

      toast.success('Verification updated successfully');
      setVerificationModalOpen(false);
      setSelectedUser(null);
      await fetchData();
    } catch (err) {
      logger.error('Error updating verification', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to update verification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBadge = async () => {
    if (!selectedUser) return;
    
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.usersBadges}/${selectedUser._id}/badges`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify(badgeFormData)
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add badge');
      }

      toast.success('Badge added successfully');
      setBadgeModalOpen(false);
      setSelectedUser(null);
      setBadgeFormData({ type: "", description: "" });
      await fetchData();
    } catch (err) {
      logger.error('Error adding badge', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to add badge');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.usersBulk}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'PATCH',
        body: JSON.stringify({
          userIds: selectedUserIds,
          updateData: bulkUpdateFormData
        })
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to bulk update users');
      }

      toast.success(`Successfully updated ${selectedUserIds.length} user(s)`);
      setBulkUpdateModalOpen(false);
      setSelectedUserIds([]);
      await fetchData();
    } catch (err) {
      logger.error('Error bulk updating users', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to bulk update users');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        if (!getApiToken()) return;
        
        const url = `${API_BASE_URL}${API_ENDPOINTS.usersDelete}/${userId}`;
        const response = await fetch(url, createAuthFetchOptions({ method: 'DELETE' }));

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete user');
        }

        toast.success('User deleted successfully');
        await fetchData();
      } catch (err) {
        logger.error('Error deleting user', err instanceof Error ? err : new Error(String(err)), { userId });
        toast.error(err instanceof Error ? err.message : 'Failed to delete user');
      }
    }
  };

  const handleUpdateStatus = async (userId: string, isActive: boolean, status: UserStatus) => {
    try {
      if (!getApiToken()) return;
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.usersStatus}/${userId}/status`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'PATCH',
        body: JSON.stringify({
          isActive,
          status,
          reason: isActive ? 'User account activated' : 'User account deactivated'
        })
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to ${isActive ? 'activate' : 'deactivate'} user`);
      }

      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
      await fetchData();
    } catch (err) {
      logger.error(`Error ${isActive ? 'activating' : 'deactivating'} user`, err instanceof Error ? err : new Error(String(err)), { userId });
      toast.error(err instanceof Error ? err.message : `Failed to ${isActive ? 'activate' : 'deactivate'} user`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'pending': 
      case 'pending_verification': 
        return 'text-yellow-600 bg-yellow-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      case 'banned': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'provider': return 'bg-blue-100 text-blue-800';
      case 'supplier': return 'bg-green-100 text-green-800';
      case 'instructor': return 'bg-orange-100 text-orange-800';
      case 'agency_owner': return 'bg-indigo-100 text-indigo-800';
      case 'agency_admin': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loading size="xl" text="Loading users data..." />
          {slowRequest && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Slow Response:</strong> The request is taking longer than usual. 
                This might be due to a large dataset or slow external API. Please wait...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            User Management
          </h1>
          <p className="text-gray-600 text-sm">Manage user accounts, roles, and permissions</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add User
          </button>
          {selectedUserIds.length > 0 && (
            <button
              onClick={() => setBulkUpdateModalOpen(true)}
              className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
            >
              <Save className="w-3 h-3 mr-1" />
              Bulk Update ({selectedUserIds.length})
            </button>
          )}
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {(stats || loading) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Users</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : (stats?.totalUsers || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {loading ? '...' : (stats?.newUsersToday || 0)} today
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0 ml-4">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Active Users</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : (stats?.activeUsers || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Currently active
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg flex-shrink-0 ml-4">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Pending Users</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : (stats?.pendingUsers || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Awaiting approval
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0 ml-4">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Suspended</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : (stats?.suspendedUsers || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  This period
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg flex-shrink-0 ml-4">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white rounded shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="w-3 h-3 mr-1" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Download className="w-3 h-3 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {searchTerm !== debouncedSearchTerm && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Searching..."></div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="client">Client</option>
                  <option value="provider">Provider</option>
                  <option value="supplier">Supplier</option>
                  <option value="instructor">Instructor</option>
                  <option value="agency_owner">Agency Owner</option>
                  <option value="agency_admin">Agency Admin</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="pending_verification">Pending Verification</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Active Status</label>
                <select
                  value={isActiveFilter}
                  onChange={(e) => setIsActiveFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Verification Status</label>
                <select
                  value={isVerifiedFilter}
                  onChange={(e) => setIsVerifiedFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="true">Verified</option>
                  <option value="false">Not Verified</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                  setIsActiveFilter('all');
                  setIsVerifiedFilter('all');
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="text-xs text-gray-500">
                {totalCount > 0 ? `${totalCount} users found` : `${users.length} users found`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Users</h3>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">Sort:</span>
              <button
                onClick={() => handleSort('name')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'name' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Name
                {sortBy === 'name' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('role')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'role' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Role
                {sortBy === 'role' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('status')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'status' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Status
                {sortBy === 'status' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('createdAt')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'createdAt' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Date
                {sortBy === 'createdAt' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.length === users.length && users.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUserIds(users.map(u => u._id).filter((id): id is string => !!id));
                      } else {
                        setSelectedUserIds([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {user._id && (
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user._id)}
                        onChange={() => toggleUserSelection(user._id!)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <Users className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-xs font-semibold text-gray-900">
                          {user.firstName || ''} {user.lastName || ''}
                        </div>
                        <div className="text-xs text-gray-600">{user.email || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.roles?.[0] || 'client')}`}>
                      {user.roles && user.roles.length > 0
                        ? user.roles.map(r => r.replace('_', ' ').toUpperCase()).join(', ')
                        : 'CLIENT'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status || 'pending_verification')}`}>
                      {(user.status || 'pending_verification').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                    <div className="space-y-1">
                      {user.phoneNumber && (
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1 text-gray-500" />
                          <span>{user.phoneNumber}</span>
                        </div>
                      )}
                      {user.profile?.address && (
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-gray-500" />
                          <span>
                            {user.profile.address.city}, {user.profile.address.state}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <div className="flex items-center space-x-2">
                      {user._id && (
                        <>
                          <button 
                            onClick={() => handleViewUser(user._id!)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View user details"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit user"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          {(user.status || 'pending_verification') === 'active' ? (
                            <button 
                              onClick={() => handleUpdateStatus(user._id!, false, 'suspended')}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Suspend user"
                            >
                              <UserX className="w-3 h-3" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleUpdateStatus(user._id!, true, 'active')}
                              className="text-green-600 hover:text-green-900"
                              title="Activate user"
                            >
                              <UserCheck className="w-3 h-3" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleOpenVerificationModal(user)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Update verification"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleOpenBadgeModal(user)}
                            className="text-amber-600 hover:text-amber-900"
                            title="Add badge"
                          >
                            <Award className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user._id!)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete user"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No users found</h3>
            <p className="text-xs text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>

      {/* View User Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedUserDetails(null);
        }}
        title="User Details"
        size="xl"
      >
        {loadingUserDetails ? (
          <div className="flex justify-center py-8">
            <Loading size="md" />
          </div>
        ) : selectedUserDetails ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Name</label>
                <p className="text-sm font-semibold">{selectedUserDetails.firstName || ''} {selectedUserDetails.lastName || ''}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Email</label>
                <p className="text-sm">{selectedUserDetails.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Phone</label>
                <p className="text-sm">{selectedUserDetails.phoneNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Roles</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedUserDetails.roles && selectedUserDetails.roles.length > 0
                    ? selectedUserDetails.roles.map((role, idx) => (
                        <span key={idx} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role)}`}>
                          {role.replace('_', ' ').toUpperCase()}
                        </span>
                      ))
                    : <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor('client')}`}>
                        CLIENT
                      </span>}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Status</label>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedUserDetails.status || 'pending_verification')}`}>
                  {(selectedUserDetails.status || 'pending_verification').toUpperCase()}
                </span>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Verified</label>
                <p className="text-sm">{selectedUserDetails.isVerified ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Created At</label>
                <p className="text-sm">{selectedUserDetails.createdAt ? new Date(selectedUserDetails.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Last Login</label>
                <p className="text-sm">{selectedUserDetails.lastLoginAt ? new Date(selectedUserDetails.lastLoginAt).toLocaleString() : 'Never'}</p>
              </div>
            </div>
            {selectedUserDetails.badges && selectedUserDetails.badges.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500">Badges</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {selectedUserDetails.badges.map((badge, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                      <Award className="w-3 h-3 mr-1" />
                      {badge.type || 'Unknown'}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Create User Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setCreateAvatarFile(null);
          setSkillsSearchInput({ ...skillsSearchInput, create: "" });
          setShowSkillsSuggestions({ ...showSkillsSuggestions, create: false });
          setRolesSearchInput({ ...rolesSearchInput, create: "" });
          setShowRolesSuggestions({ ...showRolesSuggestions, create: false });
          setCreateFormData({
            phoneNumber: "",
            email: "",
            firstName: "",
            lastName: "",
            roles: ["client"],
            profile: {
              avatar: {
                url: "",
                publicId: "",
                thumbnail: ""
              },
              bio: "",
              address: {
                street: "",
                city: "",
                state: "",
                zipCode: "",
                country: "",
                coordinates: {
                  lat: undefined,
                  lng: undefined
                }
              },
              gender: "" as "" | "male" | "female" | "other" | "prefer_not_to_say",
              birthdate: "" as string | Date | undefined
            }
          });
        }}
        title="Create New User"
        size="xl"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateUser}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">First Name *</label>
              <input
                type="text"
                value={createFormData.firstName}
                onChange={(e) => setCreateFormData({ ...createFormData, firstName: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Last Name *</label>
              <input
                type="text"
                value={createFormData.lastName}
                onChange={(e) => setCreateFormData({ ...createFormData, lastName: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Email *</label>
              <input
                type="email"
                value={createFormData.email}
                onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Phone Number *</label>
              <input
                type="tel"
                value={createFormData.phoneNumber}
                onChange={(e) => setCreateFormData({ ...createFormData, phoneNumber: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Roles *</label>
              <p className="text-xs text-gray-500 mb-1.5">Select all that apply. Client role is always included.</p>
              <div className="relative roles-autosuggest-container">
                {/* Selected Roles Tags */}
                {createFormData.roles.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {createFormData.roles.map((role) => (
                      <span
                        key={role}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(role)}`}
                      >
                        {role.replace('_', ' ')}
                        <button
                          type="button"
                          onClick={() => {
                            // Don't allow removing client if it's the only role
                            if (role === 'client' && createFormData.roles.length === 1) {
                              return;
                            }
                            setCreateFormData({
                              ...createFormData,
                              roles: createFormData.roles.filter(r => r !== role)
                            });
                          }}
                          disabled={role === 'client' && createFormData.roles.length === 1}
                          className="ml-1 hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Search Input */}
                    <input
                  type="text"
                  value={rolesSearchInput.create}
                      onChange={(e) => {
                    setRolesSearchInput({ ...rolesSearchInput, create: e.target.value });
                    setShowRolesSuggestions({ ...showRolesSuggestions, create: true });
                  }}
                  onFocus={() => setShowRolesSuggestions({ ...showRolesSuggestions, create: true })}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowRolesSuggestions({ ...showRolesSuggestions, create: false });
                    }
                  }}
                  placeholder="Type to search roles..."
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                
                {/* Suggestions Dropdown */}
                {showRolesSuggestions.create && availableRoles.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                    {availableRoles
                      .filter((role) => {
                        const searchTerm = rolesSearchInput.create.toLowerCase();
                        const roleDisplay = role.replace('_', ' ');
                        return (
                          roleDisplay.toLowerCase().includes(searchTerm) &&
                          !createFormData.roles.includes(role)
                        );
                      })
                      .map((role) => {
                        const roleDisplay = role.replace('_', ' ');
                        return (
                          <div
                            key={role}
                            onClick={() => {
                              if (!createFormData.roles.includes(role)) {
                          setCreateFormData({
                            ...createFormData,
                            roles: [...createFormData.roles, role]
                          });
                              }
                              setRolesSearchInput({ ...rolesSearchInput, create: "" });
                              setShowRolesSuggestions({ ...showRolesSuggestions, create: false });
                            }}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="text-sm text-gray-900 capitalize">{roleDisplay}</div>
                          </div>
                        );
                      })}
                    {availableRoles.filter((role) => {
                      const searchTerm = rolesSearchInput.create.toLowerCase();
                      const roleDisplay = role.replace('_', ' ');
                      return (
                        roleDisplay.toLowerCase().includes(searchTerm) &&
                        !createFormData.roles.includes(role)
                      );
                    }).length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">No matching roles</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Profile Section */}
          <div className="border-t border-gray-200 pt-3 mt-3">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Profile Information</h3>
            
            {/* Avatar Upload */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-2">Avatar</label>
              <FileUpload
                type="image"
                multiple={false}
                files={createAvatarFile ? [createAvatarFile] : []}
                onFilesSelected={(files) => {
                  if (files.length > 0) {
                    setCreateAvatarFile(files[0]);
                    handleAvatarUpload(files[0], true);
                        } else {
                    setCreateAvatarFile(null);
                  }
                }}
                onRemove={() => {
                  setCreateAvatarFile(null);
                  setCreateFormData(prev => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      avatar: {
                        url: "",
                        publicId: "",
                        thumbnail: ""
                      }
                    }
                  }));
                }}
                label="Upload Avatar"
                disabled={uploadingAvatar}
              />
              {createFormData.profile.avatar.url && (
                <div className="mt-2 relative w-20 h-20">
                  <Image 
                    src={createFormData.profile.avatar.url} 
                    alt="Avatar preview" 
                    width={80}
                    height={80}
                    className="rounded-full object-cover border border-gray-300"
                  />
                </div>
              )}
            </div>

            {/* Bio */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-0.5">
                <label className="block text-xs font-medium text-gray-700">Bio</label>
                <button
                  type="button"
                  onClick={() => handleGenerateBio(true)}
                  disabled={generatingBio.create}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  title="Generate bio with AI"
                >
                  <Sparkles className="w-3 h-3" />
                  {generatingBio.create ? 'Generating...' : 'AI Generate'}
                </button>
              </div>
              <textarea
                value={createFormData.profile.bio}
                onChange={(e) => setCreateFormData({
                  ...createFormData,
                  profile: {
                    ...createFormData.profile,
                    bio: e.target.value
                  }
                })}
                rows={3}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={generatingBio.create ? "Generating bio..." : "Enter bio or click AI Generate to create one based on skills"}
              />
            </div>

            {/* Gender and Birthdate */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Gender</label>
                <select
                  value={createFormData.profile.gender}
                  onChange={(e) => setCreateFormData({
                    ...createFormData,
                    profile: {
                      ...createFormData.profile,
                      gender: e.target.value as "" | "male" | "female" | "other" | "prefer_not_to_say"
                    }
                  })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Birthdate</label>
                <input
                  type="date"
                  value={typeof createFormData.profile.birthdate === 'string' ? createFormData.profile.birthdate : ""}
                  onChange={(e) => setCreateFormData({
                    ...createFormData,
                    profile: {
                      ...createFormData.profile,
                      birthdate: e.target.value || undefined
                    }
                  })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Address */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-2">Address</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">Street</label>
                  <input
                    type="text"
                    value={createFormData.profile.address.street}
                    onChange={(e) => setCreateFormData({
                      ...createFormData,
                      profile: {
                        ...createFormData.profile,
                        address: {
                          ...createFormData.profile.address,
                          street: e.target.value
                        }
                      }
                    })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">City</label>
                  <input
                    type="text"
                    value={createFormData.profile.address.city}
                    onChange={(e) => setCreateFormData({
                      ...createFormData,
                      profile: {
                        ...createFormData.profile,
                        address: {
                          ...createFormData.profile.address,
                          city: e.target.value
                        }
                      }
                    })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">State</label>
                  <input
                    type="text"
                    value={createFormData.profile.address.state}
                    onChange={(e) => setCreateFormData({
                      ...createFormData,
                      profile: {
                        ...createFormData.profile,
                        address: {
                          ...createFormData.profile.address,
                          state: e.target.value
                        }
                      }
                    })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">Zip Code</label>
                  <input
                    type="text"
                    value={createFormData.profile.address.zipCode}
                    onChange={(e) => setCreateFormData({
                      ...createFormData,
                      profile: {
                        ...createFormData.profile,
                        address: {
                          ...createFormData.profile.address,
                          zipCode: e.target.value
                        }
                      }
                    })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">Country</label>
                  <input
                    type="text"
                    value={createFormData.profile.address.country}
                    onChange={(e) => setCreateFormData({
                      ...createFormData,
                      profile: {
                        ...createFormData.profile,
                        address: {
                          ...createFormData.profile.address,
                          country: e.target.value
                        }
                      }
                    })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">Latitude (optional)</label>
                    <input
                      type="number"
                      step="any"
                      value={createFormData.profile.address.coordinates.lat || ""}
                      onChange={(e) => setCreateFormData({
                        ...createFormData,
                        profile: {
                          ...createFormData.profile,
                          address: {
                            ...createFormData.profile.address,
                            coordinates: {
                              ...createFormData.profile.address.coordinates,
                              lat: e.target.value ? parseFloat(e.target.value) : undefined
                            }
                          }
                        }
                      })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">Longitude (optional)</label>
                    <input
                      type="number"
                      step="any"
                      value={createFormData.profile.address.coordinates.lng || ""}
                      onChange={(e) => setCreateFormData({
                        ...createFormData,
                        profile: {
                          ...createFormData.profile,
                          address: {
                            ...createFormData.profile.address,
                            coordinates: {
                              ...createFormData.profile.address.coordinates,
                              lng: e.target.value ? parseFloat(e.target.value) : undefined
                            }
                          }
                        }
                      })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditAvatarFile(null);
          setSkillsSearchInput({ ...skillsSearchInput, edit: "" });
          setShowSkillsSuggestions({ ...showSkillsSuggestions, edit: false });
          setRolesSearchInput({ ...rolesSearchInput, edit: "" });
          setShowRolesSuggestions({ ...showRolesSuggestions, edit: false });
          setSelectedUser(null);
        }}
        title="Edit User"
        size="xl"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setEditModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateUser}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update User'}
            </button>
          </div>
        }
      >
        {/* Basic Information Form */}
        <div className="space-y-4 max-h-[70vh] overflow-y-auto overscroll-contain scroll-smooth modal-content-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">First Name</label>
              <input
                type="text"
                value={editFormData.firstName}
                onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Last Name</label>
              <input
                type="text"
                value={editFormData.lastName}
                onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Email</label>
              <input
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Phone Number</label>
              <input
                type="tel"
                value={editFormData.phoneNumber}
                onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Roles</label>
              <p className="text-xs text-gray-500 mb-1.5">Select all that apply. Client role is always included.</p>
              <div className="relative roles-autosuggest-container">
                {/* Selected Roles Tags */}
                {editFormData.roles.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {editFormData.roles.map((role) => (
                      <span
                        key={role}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(role)}`}
                      >
                        {role.replace('_', ' ')}
                        <button
                          type="button"
                          onClick={() => {
                            // Don't allow removing client if it's the only role
                            if (role === 'client' && editFormData.roles.length === 1) {
                              return;
                            }
                            setEditFormData({
                              ...editFormData,
                              roles: editFormData.roles.filter(r => r !== role)
                            });
                          }}
                          disabled={role === 'client' && editFormData.roles.length === 1}
                          className="ml-1 hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Search Input */}
                    <input
                  type="text"
                  value={rolesSearchInput.edit}
                      onChange={(e) => {
                    setRolesSearchInput({ ...rolesSearchInput, edit: e.target.value });
                    setShowRolesSuggestions({ ...showRolesSuggestions, edit: true });
                  }}
                  onFocus={() => setShowRolesSuggestions({ ...showRolesSuggestions, edit: true })}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowRolesSuggestions({ ...showRolesSuggestions, edit: false });
                    }
                  }}
                  placeholder="Type to search roles..."
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                
                {/* Suggestions Dropdown */}
                {showRolesSuggestions.edit && availableRoles.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto">
                    {availableRoles
                      .filter((role) => {
                        const searchTerm = rolesSearchInput.edit.toLowerCase();
                        const roleDisplay = role.replace('_', ' ');
                        return (
                          roleDisplay.toLowerCase().includes(searchTerm) &&
                          !editFormData.roles.includes(role)
                        );
                      })
                      .map((role) => {
                        const roleDisplay = role.replace('_', ' ');
                        return (
                          <div
                            key={role}
                            onClick={() => {
                              if (!editFormData.roles.includes(role)) {
                          setEditFormData({
                            ...editFormData,
                            roles: [...editFormData.roles, role]
                          });
                              }
                              setRolesSearchInput({ ...rolesSearchInput, edit: "" });
                              setShowRolesSuggestions({ ...showRolesSuggestions, edit: false });
                            }}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="text-sm text-gray-900 capitalize">{roleDisplay}</div>
                          </div>
                        );
                      })}
                    {availableRoles.filter((role) => {
                      const searchTerm = rolesSearchInput.edit.toLowerCase();
                      const roleDisplay = role.replace('_', ' ');
                      return (
                        roleDisplay.toLowerCase().includes(searchTerm) &&
                        !editFormData.roles.includes(role)
                      );
                    }).length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">No matching roles</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Profile Section */}
          <div className="border-t border-gray-200 pt-3 mt-3">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Profile Information</h3>
            
            {/* Avatar Upload */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-2">Avatar</label>
              <FileUpload
                type="image"
                multiple={false}
                files={editAvatarFile ? [editAvatarFile] : []}
                onFilesSelected={(files) => {
                  if (files.length > 0) {
                    setEditAvatarFile(files[0]);
                    handleAvatarUpload(files[0], false);
                        } else {
                    setEditAvatarFile(null);
                  }
                }}
                onRemove={() => {
                  setEditAvatarFile(null);
                  setEditFormData(prev => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      avatar: {
                        url: "",
                        publicId: "",
                        thumbnail: ""
                      }
                    }
                  }));
                }}
                label="Upload Avatar"
                disabled={uploadingAvatar}
              />
              {editFormData.profile.avatar.url && (
                <div className="mt-2 relative w-20 h-20">
                  <Image 
                    src={editFormData.profile.avatar.url} 
                    alt="Avatar preview" 
                    width={80}
                    height={80}
                    className="rounded-full object-cover border border-gray-300"
                  />
                </div>
              )}
            </div>

            {/* Bio */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-0.5">
                <label className="block text-xs font-medium text-gray-700">Bio</label>
                <button
                  type="button"
                  onClick={() => handleGenerateBio(false)}
                  disabled={generatingBio.edit}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  title="Generate bio with AI"
                >
                  <Sparkles className="w-3 h-3" />
                  {generatingBio.edit ? 'Generating...' : 'AI Generate'}
                </button>
              </div>
              <textarea
                value={editFormData.profile.bio}
                onChange={(e) => setEditFormData({
                  ...editFormData,
                  profile: {
                    ...editFormData.profile,
                    bio: e.target.value
                  }
                })}
                rows={3}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={generatingBio.edit ? "Generating bio..." : "Enter bio or click AI Generate to create one"}
              />
            </div>

            {/* Gender and Birthdate */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Gender</label>
                <select
                  value={editFormData.gender}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    gender: e.target.value as "" | "male" | "female" | "other" | "prefer_not_to_say"
                  })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Birthdate</label>
                <input
                  type="date"
                  value={typeof editFormData.birthdate === 'string' ? editFormData.birthdate : ""}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    birthdate: e.target.value || undefined
                  })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Address */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-2">Address</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">Street</label>
                  <input
                    type="text"
                    value={editFormData.profile.address.street}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      profile: {
                        ...editFormData.profile,
                        address: {
                          ...editFormData.profile.address,
                          street: e.target.value
                        }
                      }
                    })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">City</label>
                  <input
                    type="text"
                    value={editFormData.profile.address.city}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      profile: {
                        ...editFormData.profile,
                        address: {
                          ...editFormData.profile.address,
                          city: e.target.value
                        }
                      }
                    })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">State</label>
                  <input
                    type="text"
                    value={editFormData.profile.address.state}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      profile: {
                        ...editFormData.profile,
                        address: {
                          ...editFormData.profile.address,
                          state: e.target.value
                        }
                      }
                    })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">Zip Code</label>
                  <input
                    type="text"
                    value={editFormData.profile.address.zipCode}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      profile: {
                        ...editFormData.profile,
                        address: {
                          ...editFormData.profile.address,
                          zipCode: e.target.value
                        }
                      }
                    })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">Country</label>
                  <input
                    type="text"
                    value={editFormData.profile.address.country}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      profile: {
                        ...editFormData.profile,
                        address: {
                          ...editFormData.profile.address,
                          country: e.target.value
                        }
                      }
                    })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">Latitude (optional)</label>
                    <input
                      type="number"
                      step="any"
                      value={editFormData.profile.address.coordinates.lat || ""}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        profile: {
                          ...editFormData.profile,
                          address: {
                            ...editFormData.profile.address,
                            coordinates: {
                              ...editFormData.profile.address.coordinates,
                              lat: e.target.value ? parseFloat(e.target.value) : undefined
                            }
                          }
                        }
                      })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">Longitude (optional)</label>
                    <input
                      type="number"
                      step="any"
                      value={editFormData.profile.address.coordinates.lng || ""}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        profile: {
                          ...editFormData.profile,
                          address: {
                            ...editFormData.profile.address,
                            coordinates: {
                              ...editFormData.profile.address.coordinates,
                              lng: e.target.value ? parseFloat(e.target.value) : undefined
                            }
                          }
                        }
                      })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Information - Show directly if business/agency provider */}
        {isProviderUser && (providerData?.providerType === 'business' || providerData?.providerType === 'agency') && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Business Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Business Name</label>
                  <input
                    type="text"
                    value={businessInfoForm.businessName || ''}
                    onChange={(e) => setBusinessInfoForm({ ...businessInfoForm, businessName: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Business Type</label>
                  <input
                    type="text"
                    value={businessInfoForm.businessType || ''}
                    onChange={(e) => setBusinessInfoForm({ ...businessInfoForm, businessType: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Business Registration</label>
                  <input
                    type="text"
                    value={businessInfoForm.businessRegistration || ''}
                    onChange={(e) => setBusinessInfoForm({ ...businessInfoForm, businessRegistration: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Tax ID</label>
                  <input
                    type="text"
                    value={businessInfoForm.taxId || ''}
                    onChange={(e) => setBusinessInfoForm({ ...businessInfoForm, taxId: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Business Phone</label>
                  <input
                    type="tel"
                    value={businessInfoForm.businessPhone || ''}
                    onChange={(e) => setBusinessInfoForm({ ...businessInfoForm, businessPhone: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Business Email</label>
                  <input
                    type="email"
                    value={businessInfoForm.businessEmail || ''}
                    onChange={(e) => setBusinessInfoForm({ ...businessInfoForm, businessEmail: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Website</label>
                  <input
                    type="url"
                    value={businessInfoForm.website || ''}
                    onChange={(e) => setBusinessInfoForm({ ...businessInfoForm, website: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Year Established</label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={businessInfoForm.yearEstablished || ''}
                    onChange={(e) => setBusinessInfoForm({ ...businessInfoForm, yearEstablished: parseInt(e.target.value) || undefined })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Number of Employees</label>
                  <input
                    type="number"
                    min="0"
                    value={businessInfoForm.numberOfEmployees || ''}
                    onChange={(e) => setBusinessInfoForm({ ...businessInfoForm, numberOfEmployees: parseInt(e.target.value) || undefined })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Business Description</label>
                <textarea
                  value={businessInfoForm.businessDescription || ''}
                  onChange={(e) => setBusinessInfoForm({ ...businessInfoForm, businessDescription: e.target.value })}
                  rows={4}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Business Address</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">Street</label>
                    <input
                      type="text"
                      value={businessInfoForm.businessAddress?.street || ''}
                      onChange={(e) => setBusinessInfoForm({ ...businessInfoForm, businessAddress: { ...businessInfoForm.businessAddress, street: e.target.value } })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">City</label>
                    <input
                      type="text"
                      value={businessInfoForm.businessAddress?.city || ''}
                      onChange={(e) => setBusinessInfoForm({ ...businessInfoForm, businessAddress: { ...businessInfoForm.businessAddress, city: e.target.value } })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">State</label>
                    <input
                      type="text"
                      value={businessInfoForm.businessAddress?.state || ''}
                      onChange={(e) => setBusinessInfoForm({ ...businessInfoForm, businessAddress: { ...businessInfoForm.businessAddress, state: e.target.value } })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">Zip Code</label>
                    <input
                      type="text"
                      value={businessInfoForm.businessAddress?.zipCode || ''}
                      onChange={(e) => setBusinessInfoForm({ ...businessInfoForm, businessAddress: { ...businessInfoForm.businessAddress, zipCode: e.target.value } })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-0.5">Country</label>
                    <input
                      type="text"
                      value={businessInfoForm.businessAddress?.country || ''}
                      onChange={(e) => setBusinessInfoForm({ ...businessInfoForm, businessAddress: { ...businessInfoForm.businessAddress, country: e.target.value } })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </Modal>

      {/* Verification Modal */}
      <Modal
        isOpen={verificationModalOpen}
        onClose={() => {
          setVerificationModalOpen(false);
          setSelectedUser(null);
        }}
        title="Update Verification Status"
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setVerificationModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateVerification}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Verification'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          {Object.entries(verificationFormData).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setVerificationFormData({ ...verificationFormData, [key]: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
            </label>
          ))}
        </div>
      </Modal>

      {/* Badge Modal */}
      <Modal
        isOpen={badgeModalOpen}
        onClose={() => {
          setBadgeModalOpen(false);
          setSelectedUser(null);
        }}
        title="Add Badge"
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setBadgeModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddBadge}
              disabled={submitting || !badgeFormData.type}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Badge'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Badge Type *</label>
            <input
              type="text"
              value={badgeFormData.type}
              onChange={(e) => setBadgeFormData({ ...badgeFormData, type: e.target.value })}
              placeholder="e.g., top_rated, verified_provider"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={badgeFormData.description}
              onChange={(e) => setBadgeFormData({ ...badgeFormData, description: e.target.value })}
              placeholder="Badge description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>

      {/* Bulk Update Modal */}
      <Modal
        isOpen={bulkUpdateModalOpen}
        onClose={() => {
          setBulkUpdateModalOpen(false);
        }}
        title={`Bulk Update (${selectedUserIds.length} users)`}
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setBulkUpdateModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkUpdate}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
            <select
              value={bulkUpdateFormData.status || ''}
              onChange={(e) => setBulkUpdateFormData({ ...bulkUpdateFormData, status: (e.target.value || undefined) as UserStatus | '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No change</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending_verification">Pending Verification</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Roles</label>
            <input
              type="text"
              value={bulkUpdateFormData.addRoles || ''}
              onChange={(e) => setBulkUpdateFormData({ ...bulkUpdateFormData, addRoles: e.target.value })}
              placeholder="Comma-separated roles (e.g., provider, admin)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Remove Roles</label>
            <input
              type="text"
              value={bulkUpdateFormData.removeRoles || ''}
              onChange={(e) => setBulkUpdateFormData({ ...bulkUpdateFormData, removeRoles: e.target.value })}
              placeholder="Comma-separated roles (e.g., provider, admin)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
