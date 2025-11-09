"use client";

import { useState, useEffect, useCallback } from "react";
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
  Save
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { User, UserRole, UserStatus, UserBadge, Verification, Profile, BadgeType } from "@/types/users";

// Type for API user response (raw data from backend)
interface ApiUserData {
  _id?: string;
  phoneNumber?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
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
  const user: User = {
    _id: apiUser._id,
    phoneNumber: apiUser.phoneNumber || '',
    email: apiUser.email,
    firstName: apiUser.firstName,
    lastName: apiUser.lastName,
    role: apiUser.role as UserRole || 'client',
    status: apiUser.status as UserStatus || 'pending_verification',
    isVerified: apiUser.isVerified || false,
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
    user.profile = apiUser.profile as Profile;
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
    role: "client" as UserRole,
    agencyId: "",
    agencyRole: ""
  });

  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "client" as UserRole
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

  const [bulkUpdateFormData, setBulkUpdateFormData] = useState({
    isActive: true,
    status: "active" as UserStatus
  });

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
      if (searchTerm) queryParams.set('search', searchTerm);
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
  }, [currentPage, itemsPerPage, searchTerm, roleFilter, statusFilter, isActiveFilter, isVerifiedFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      role: user.role || 'client'
    });
    setEditModalOpen(true);
  };

  const handleOpenVerificationModal = (user: User) => {
    setSelectedUser(user);
    setVerificationFormData({
      phoneVerified: user.verification?.phoneVerified || false,
      emailVerified: user.verification?.emailVerified || false,
      identityVerified: user.verification?.identityVerified || false,
      businessVerified: user.verification?.businessVerified || false,
      addressVerified: user.verification?.addressVerified || false,
      bankAccountVerified: user.verification?.bankAccountVerified || false
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

      const url = `${API_BASE_URL}${API_ENDPOINTS.usersCreate}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify(createFormData)
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create user');
      }

      toast.success('User created successfully');
      setCreateModalOpen(false);
      setCreateFormData({
        phoneNumber: "",
        email: "",
        firstName: "",
        lastName: "",
        role: "client",
        agencyId: "",
        agencyRole: ""
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

      const url = `${API_BASE_URL}${API_ENDPOINTS.usersUpdate}/${selectedUser._id}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify(editFormData)
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
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
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role || 'client')}`}>
                      {(user.role || 'client').replace('_', ' ').toUpperCase()}
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
                <label className="text-xs font-medium text-gray-500">Role</label>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(selectedUserDetails.role || 'client')}`}>
                  {(selectedUserDetails.role || 'client').replace('_', ' ').toUpperCase()}
                </span>
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
          setCreateFormData({
            phoneNumber: "",
            email: "",
            firstName: "",
            lastName: "",
            role: "client",
            agencyId: "",
            agencyRole: ""
          });
        }}
        title="Create New User"
        size="lg"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateUser}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={createFormData.firstName}
                onChange={(e) => setCreateFormData({ ...createFormData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={createFormData.lastName}
                onChange={(e) => setCreateFormData({ ...createFormData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={createFormData.email}
                onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={createFormData.phoneNumber}
                onChange={(e) => setCreateFormData({ ...createFormData, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select
                value={createFormData.role}
                onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="client">Client</option>
                <option value="provider">Provider</option>
                <option value="supplier">Supplier</option>
                <option value="instructor">Instructor</option>
                <option value="agency_owner">Agency Owner</option>
                <option value="agency_admin">Agency Admin</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedUser(null);
        }}
        title="Edit User"
        size="lg"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateUser}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update User'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={editFormData.firstName}
                onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={editFormData.lastName}
                onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={editFormData.phoneNumber}
                onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={editFormData.role}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="client">Client</option>
                <option value="provider">Provider</option>
                <option value="supplier">Supplier</option>
                <option value="instructor">Instructor</option>
                <option value="agency_owner">Agency Owner</option>
                <option value="agency_admin">Agency Admin</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
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
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateVerification}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
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
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddBadge}
              disabled={submitting || !badgeFormData.type}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
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
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkUpdate}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Users'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={bulkUpdateFormData.status}
              onChange={(e) => setBulkUpdateFormData({ ...bulkUpdateFormData, status: e.target.value as UserStatus })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="banned">Banned</option>
            </select>
          </div>
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={bulkUpdateFormData.isActive}
                onChange={(e) => setBulkUpdateFormData({ ...bulkUpdateFormData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Is Active</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
