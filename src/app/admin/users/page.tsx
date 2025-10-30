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
  ChevronUp
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { makeClientAuthenticatedRequestWithEndpointSafe, makeClientAuthenticatedRequestWithPathSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
// Define types locally
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: 'client' | 'provider' | 'admin' | 'supplier' | 'instructor' | 'agency_owner' | 'agency_admin';
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification' | 'banned';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  profileCompleteness?: number;
  verificationStatus?: 'verified' | 'pending' | 'rejected';
  // Additional fields from API response
  profile?: {
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    bio?: string;
    businessName?: string;
    businessType?: string;
    serviceAreas?: string[];
    specialties?: string[];
    rating?: number;
    totalReviews?: number;
  };
  verification?: {
    phoneVerified?: boolean;
    emailVerified?: boolean;
    identityVerified?: boolean;
    businessVerified?: boolean;
    addressVerified?: boolean;
    bankAccountVerified?: boolean;
    verifiedAt?: string;
  };
  subscription?: {
    type?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
  };
  trustScore?: number;
  badges?: Array<{
    type: string;
    description: string;
    earnedAt: string;
  }>;
  completionRate?: number;
  cancellationRate?: number;
  loginCount?: number;
  tags?: string[];
  notes?: string[];
}

// Helper function to transform API user data to frontend format
const transformUserData = (apiUser: {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  status?: string;
  isActive?: boolean;
  isVerified?: boolean;
  profilePicture?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  preferences?: {
    notifications?: boolean;
    marketing?: boolean;
    language?: string;
    timezone?: string;
  };
  joinedAt?: string;
  lastActive?: string;
  totalSpent?: number;
  orderCount?: number;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  profileCompleteness?: number;
  verification?: {
    phoneVerified?: boolean;
    emailVerified?: boolean;
  };
  profile?: Record<string, unknown>;
  subscription?: Record<string, unknown>;
  trustScore?: number;
  badges?: Array<{
    type: string;
    description: string;
    earnedAt: string;
  }>;
  completionRate?: number;
  cancellationRate?: number;
  loginCount?: number;
  tags?: string[];
  notes?: string[];
}): User => {
  return {
    _id: apiUser._id,
    firstName: apiUser.firstName || '',
    lastName: apiUser.lastName || '',
    email: apiUser.email || '',
    phoneNumber: apiUser.phoneNumber,
    role: (apiUser.role as 'client' | 'admin' | 'provider' | 'agency_owner' | 'agency_admin' | 'supplier' | 'instructor') || 'client',
    status: (apiUser.status as 'active' | 'suspended' | 'inactive' | 'pending_verification' | 'banned') || 'pending_verification',
    isActive: apiUser.isActive || false,
    isVerified: apiUser.isVerified || false,
    createdAt: apiUser.createdAt || new Date().toISOString(),
    updatedAt: apiUser.updatedAt || new Date().toISOString(),
    lastLogin: apiUser.lastLogin,
    profileCompleteness: apiUser.profileCompleteness || 0,
    verificationStatus: apiUser.verification?.phoneVerified && 
                       apiUser.verification?.emailVerified ? 'verified' : 'pending',
    profile: apiUser.profile,
    verification: apiUser.verification,
    subscription: apiUser.subscription,
    trustScore: apiUser.trustScore,
    badges: apiUser.badges ? apiUser.badges.map(badge => ({
      type: typeof badge === 'string' ? badge : badge.type || 'unknown',
      description: typeof badge === 'string' ? `${badge} badge` : badge.description || 'No description',
      earnedAt: typeof badge === 'string' ? new Date().toISOString() : badge.earnedAt || new Date().toISOString()
    })) : undefined,
    completionRate: apiUser.completionRate,
    cancellationRate: apiUser.cancellationRate,
    loginCount: apiUser.loginCount,
    tags: apiUser.tags,
    notes: apiUser.notes
  };
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

  //

  const fetchData = useCallback(async () => {
    let slowRequestTimer: NodeJS.Timeout | null = null;
    
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
      queryParams.set('sortBy', sortBy);
      queryParams.set('sortOrder', sortOrder);

      const [dataResponse, statsResponse] = await Promise.all([
        makeClientAuthenticatedRequestWithEndpointSafe(
          'usersAdmin' as keyof typeof API_ENDPOINTS,
          { method: 'GET', query: Object.fromEntries(queryParams) }
        ),
        makeClientAuthenticatedRequestWithEndpointSafe(
          'usersAdminStats' as keyof typeof API_ENDPOINTS,
          { method: 'GET', query: { period: 'week' } }
        ).catch(err => { // fallback
          console.warn('Failed to fetch stats, using fallback:', err);
          return {
            ok: true,
            json: () => Promise.resolve({
              totalUsers: 0,
              activeUsers: 0,
              pendingUsers: 0,
              suspendedUsers: 0,
              newUsersToday: 0,
              newUsersWeek: 0,
              newUsersMonth: 0,
              trends: { daily: [], weekly: [], monthly: [] },
              topRoles: [],
              statusStats: [],
              performanceMetrics: {
                averageRegistrationTime: 0,
                medianRegistrationTime: 0,
                p95RegistrationTime: 0
              }
            })
          };
        })
      ]);

      if (!dataResponse.ok) {
        const errorData = await dataResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch users data');
      }

      if (!statsResponse.ok) {
        const errorData = await statsResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch users statistics');
      }

      const dataResult = await dataResponse.json();
      const statsResult = await statsResponse.json();

      // Transform the API response data to match frontend expectations
      let usersData: User[] = [];
      let totalCount = 0;

      if (dataResult.success && dataResult.data) {
        // Handle the new API response structure
        if (dataResult.data.users && Array.isArray(dataResult.data.users)) {
          usersData = dataResult.data.users.map(transformUserData);
          totalCount = dataResult.data.pagination?.total || dataResult.data.users.length;
        } else if (Array.isArray(dataResult.data)) {
          // Fallback for old structure
          usersData = dataResult.data.map(transformUserData);
          totalCount = dataResult.total || dataResult.data.length;
        }
      } else if (Array.isArray(dataResult.data)) {
        // Fallback for direct array response
        usersData = dataResult.data.map(transformUserData);
        totalCount = dataResult.total || dataResult.data.length;
      }

      setUsers(usersData);
      setTotalCount(totalCount);
      
      // Handle stats response - it should be an object, not an array
      const statsData = statsResult.data || statsResult;
      if (Array.isArray(statsData)) {
        // If it's an array, create a default stats object
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          pendingUsers: 0,
          suspendedUsers: 0,
          newUsersToday: 0,
          newUsersWeek: 0,
          newUsersMonth: 0,
          trends: { daily: [], weekly: [], monthly: [] },
          topRoles: [],
          statusStats: [],
          performanceMetrics: {
            averageRegistrationTime: 0,
            medianRegistrationTime: 0,
            p95RegistrationTime: 0
          }
        });
      } else {
        setStats(statsData);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching users data:', err);
      let errorMessage = 'Failed to load users data';
      
      if (err instanceof Error) {
        if (err.message.includes('timed out')) {
          errorMessage = 'Request timed out. The server may be slow. Please try again.';
        } else if (err.message.includes('aborted')) {
          errorMessage = 'Request was cancelled. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      if (slowRequestTimer) {
        clearTimeout(slowRequestTimer);
      }
      setLoading(false);
      setSlowRequest(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (err) {
      console.error('Error refreshing data:', err);
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

  const handleViewUser = (userId: string) => {
    // TODO: Implement user view modal or navigation
    console.log('View user:', userId);
  };

  const handleEditUser = (userId: string) => {
    // TODO: Implement user edit modal or navigation
    console.log('Edit user:', userId);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await makeClientAuthenticatedRequestWithPathSafe(
          'usersAdminDelete' as keyof typeof API_ENDPOINTS,
          [userId],
          {},
          { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete user');
        }

        await fetchData(); // Refresh the data
      } catch (err) {
        console.error('Error deleting user:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete user');
      }
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const response = await makeClientAuthenticatedRequestWithPathSafe(
        'usersAdminSuspend' as keyof typeof API_ENDPOINTS,
        [userId, 'suspend'],
        {},
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to suspend user');
      }

      await fetchData(); // Refresh the data
    } catch (err) {
      console.error('Error suspending user:', err);
      setError(err instanceof Error ? err.message : 'Failed to suspend user');
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      const response = await makeClientAuthenticatedRequestWithPathSafe(
        'usersAdminActivate' as keyof typeof API_ENDPOINTS,
        [userId, 'activate'],
        {},
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to activate user');
      }

      await fetchData(); // Refresh the data
    } catch (err) {
      console.error('Error activating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to activate user');
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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
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
            onClick={() => console.log('Create new user')}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add User
          </button>
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
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
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
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <Users className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-xs font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-gray-600">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status.toUpperCase()}
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
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewUser(user._id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View user details"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleEditUser(user._id)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit user"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      {user.status === 'active' ? (
                        <button 
                          onClick={() => handleSuspendUser(user._id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Suspend user"
                        >
                          <UserX className="w-3 h-3" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleActivateUser(user._id)}
                          className="text-green-600 hover:text-green-900"
                          title="Activate user"
                        >
                          <UserCheck className="w-3 h-3" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete user"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
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
    </div>
  );
}
