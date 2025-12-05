"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  Trash2, 
  RefreshCw,
  Filter,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  CheckCircle,
  Shield,
  MapPin,
  BarChart3,
  Edit,
  Plus,
  X,
  Upload,
  UserPlus,
  UserMinus
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { FileUpload } from "@/components/ui/file-upload";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";

interface Agency {
  _id: string;
  name: string;
  description?: string;
  owner: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    profile?: {
      avatar?: { url?: string; thumbnail?: string };
    };
  };
  providers?: Array<{
    user: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    status: string;
    commissionRate: number;
    joinedAt: string;
  }>;
  admins?: Array<{
    user: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    role: string;
  }>;
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  business?: {
    type?: string;
    registrationNumber?: string;
    licenseNumber?: string;
  };
  verification?: {
    isVerified: boolean;
    verifiedAt?: string;
  };
  analytics?: {
    totalBookings?: number;
    totalRevenue?: number;
    averageRating?: number;
    totalReviews?: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AgencyStatistics {
  totalAgencies?: number;
  activeAgencies?: number;
  verifiedAgencies?: number;
  totalProviders?: number;
  totalRevenue?: number;
}

export default function AdminAgenciesPage() {
  const { settings: appSettings } = useAppSettings();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'providers'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  const [statistics, setStatistics] = useState<AgencyStatistics | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [logoUploadModalOpen, setLogoUploadModalOpen] = useState(false);
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [loadingAgencyDetails, setLoadingAgencyDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [agencyAnalytics, setAgencyAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  
  // Form states
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    contact: {
      email: '',
      phone: '',
      website: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    },
    business: {
      type: '',
      registrationNumber: '',
      licenseNumber: ''
    }
  });
  
  // Provider/Admin management states
  const [providerSearchTerm, setProviderSearchTerm] = useState('');
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [providerSuggestions, setProviderSuggestions] = useState<Array<{_id: string; firstName: string; lastName: string; email?: string}>>([]);
  const [adminSuggestions, setAdminSuggestions] = useState<Array<{_id: string; firstName: string; lastName: string; email?: string}>>([]);
  const [selectedProvider, setSelectedProvider] = useState<{_id: string; firstName: string; lastName: string} | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<{_id: string; firstName: string; lastName: string} | null>(null);
  const [providerCommissionRate, setProviderCommissionRate] = useState(10);

  const fetchStatistics = useCallback(async () => {
    try {
      if (!getApiToken()) return;

      // Calculate statistics from agencies data
      const activeCount = agencies.filter(a => a.isActive).length;
      const verifiedCount = agencies.filter(a => a.verification?.isVerified).length;
      const totalProviders = agencies.reduce((sum, a) => sum + (a.providers?.length || 0), 0);

      setStatistics({
        totalAgencies: agencies.length,
        activeAgencies: activeCount,
        verifiedAgencies: verifiedCount,
        totalProviders: totalProviders,
        totalRevenue: agencies.reduce((sum, a) => sum + (a.analytics?.totalRevenue || 0), 0)
      });
    } catch (err) {
      logger.error('Error calculating agency statistics', err instanceof Error ? err : new Error(String(err)));
    }
  }, [agencies]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!getApiToken()) {
        logger.warn('No API token found');
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.set('search', searchTerm);
      queryParams.set('sortBy', sortBy);
      queryParams.set('sortOrder', sortOrder);
      queryParams.set('limit', '100');

      const url = `${API_BASE_URL}${API_ENDPOINTS.agencies}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch agencies`);
      }

      const result = await response.json();
      
      let agenciesData: Agency[] = [];
      if (result.success && result.data) {
        agenciesData = Array.isArray(result.data) ? result.data : [];
      } else if (Array.isArray(result)) {
        agenciesData = result;
      }

      // Apply client-side filters
      let filteredAgencies = agenciesData;
      
      if (statusFilter !== 'all') {
        filteredAgencies = filteredAgencies.filter(a => 
          statusFilter === 'active' ? a.isActive : !a.isActive
        );
      }
      
      if (verificationFilter !== 'all') {
        filteredAgencies = filteredAgencies.filter(a => 
          verificationFilter === 'verified' ? a.verification?.isVerified : !a.verification?.isVerified
        );
      }

      setAgencies(filteredAgencies);
      setTotalCount(filteredAgencies.length);
      setLastUpdated(new Date());
    } catch (err) {
      logger.error('Error fetching agencies', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to load agencies');
      setAgencies([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortBy, sortOrder, statusFilter, verificationFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (agencies.length > 0) {
      fetchStatistics();
    }
  }, [agencies, fetchStatistics]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSort = (field: 'name' | 'createdAt' | 'providers') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewAgency = async (agency: Agency) => {
    try {
      setLoadingAgencyDetails(true);
      if (!getApiToken()) return;
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.agenciesById}/${agency._id}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        throw new Error('Failed to fetch agency details');
      }

      const result = await response.json();
      setSelectedAgency(result.data || result);
      setViewModalOpen(true);
    } catch (err) {
      logger.error('Error fetching agency details', err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to fetch agency details');
    } finally {
      setLoadingAgencyDetails(false);
    }
  };

  const handleVerifyAgency = async (verified: boolean) => {
    if (!selectedAgency?._id) return;
    
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      // Update agency verification status
      const url = `${API_BASE_URL}${API_ENDPOINTS.agenciesById}/${selectedAgency._id}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify({
          verification: {
            isVerified: verified,
            verifiedAt: verified ? new Date().toISOString() : null
          }
        })
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update verification status');
      }

      toast.success(verified ? 'Agency verified successfully' : 'Agency verification revoked');
      setVerifyModalOpen(false);
      setSelectedAgency(null);
      await fetchData();
    } catch (err) {
      logger.error('Error updating agency verification', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to update verification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAgency = async () => {
    if (!selectedAgency?._id) return;
    
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.agenciesById}/${selectedAgency._id}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'DELETE' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete agency');
      }

      toast.success('Agency deleted successfully');
      setDeleteModalOpen(false);
      setSelectedAgency(null);
      await fetchData();
    } catch (err) {
      logger.error('Error deleting agency', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to delete agency');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (agency: Agency) => {
    try {
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.agenciesById}/${agency._id}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify({ isActive: !agency.isActive })
      }));

      if (!response.ok) {
        throw new Error('Failed to update agency status');
      }

      toast.success(`Agency ${agency.isActive ? 'deactivated' : 'activated'} successfully`);
      await fetchData();
    } catch (err) {
      logger.error('Error toggling agency status', err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to update agency status');
    }
  };

  const handleEditAgency = async () => {
    if (!selectedAgency?._id) return;
    
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.agenciesById}/${selectedAgency._id}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify(editFormData)
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update agency');
      }

      toast.success('Agency updated successfully');
      setEditModalOpen(false);
      setSelectedAgency(null);
      await fetchData();
    } catch (err) {
      logger.error('Error updating agency', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to update agency');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadLogo = async () => {
    if (!selectedAgency?._id || !logoFile) return;
    
    try {
      setSubmitting(true);
      const token = getApiToken();
      if (!token) {
        toast.error('Authentication required. Please log in again.');
        return;
      }

      const formData = new FormData();
      formData.append('logo', logoFile);

      const url = `${API_BASE_URL}${API_ENDPOINTS.agenciesById}/${selectedAgency._id}/logo`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload logo');
      }

      toast.success('Logo uploaded successfully');
      setLogoUploadModalOpen(false);
      setLogoFile(null);
      setLogoPreview(null);
      setSelectedAgency(null);
      await fetchData();
    } catch (err) {
      logger.error('Error uploading logo', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchUsersForProvider = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setProviderSuggestions([]);
      return;
    }

    try {
      if (!getApiToken()) return;

      const queryParams = new URLSearchParams();
      queryParams.append('search', searchTerm);
      queryParams.append('limit', '10');
      queryParams.append('roles', 'provider');

      const url = `${API_BASE_URL}${API_ENDPOINTS.users}?${queryParams.toString()}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (response.ok) {
        const result = await response.json();
        let users = [];
        if (result.data) {
          users = Array.isArray(result.data) ? result.data : (result.data.users || []);
        } else if (Array.isArray(result)) {
          users = result;
        }
        
        setProviderSuggestions(users.slice(0, 10).map((user: any) => ({
          _id: user._id || user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email
        })));
      }
    } catch (err) {
      logger.error('Error fetching users for provider', err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const fetchUsersForAdmin = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setAdminSuggestions([]);
      return;
    }

    try {
      if (!getApiToken()) return;

      const queryParams = new URLSearchParams();
      queryParams.append('search', searchTerm);
      queryParams.append('limit', '10');

      const url = `${API_BASE_URL}${API_ENDPOINTS.users}?${queryParams.toString()}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (response.ok) {
        const result = await response.json();
        let users = [];
        if (result.data) {
          users = Array.isArray(result.data) ? result.data : (result.data.users || []);
        } else if (Array.isArray(result)) {
          users = result;
        }
        
        setAdminSuggestions(users.slice(0, 10).map((user: any) => ({
          _id: user._id || user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email
        })));
      }
    } catch (err) {
      logger.error('Error fetching users for admin', err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const handleAddProvider = async () => {
    if (!selectedAgency?._id || !selectedProvider) return;
    
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.agenciesById}/${selectedAgency._id}/providers`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify({
          providerId: selectedProvider._id,
          commissionRate: providerCommissionRate
        })
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add provider');
      }

      toast.success('Provider added successfully');
      setProviderModalOpen(false);
      setSelectedProvider(null);
      setProviderCommissionRate(10);
      setProviderSearchTerm('');
      await fetchData();
    } catch (err) {
      logger.error('Error adding provider', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to add provider');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveProvider = async (providerId: string) => {
    if (!selectedAgency?._id) return;
    
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.agenciesById}/${selectedAgency._id}/providers/${providerId}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'DELETE' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove provider');
      }

      toast.success('Provider removed successfully');
      await fetchData();
      if (selectedAgency) {
        const updatedAgency = await fetch(`${API_BASE_URL}${API_ENDPOINTS.agenciesById}/${selectedAgency._id}`, createAuthFetchOptions({ method: 'GET' }))
          .then(r => r.json())
          .then(r => r.data || r);
        setSelectedAgency(updatedAgency);
      }
    } catch (err) {
      logger.error('Error removing provider', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to remove provider');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!selectedAgency?._id || !selectedAdmin) return;
    
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.agenciesById}/${selectedAgency._id}/admins`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify({
          adminId: selectedAdmin._id,
          role: 'admin'
        })
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add admin');
      }

      toast.success('Admin added successfully');
      setAdminModalOpen(false);
      setSelectedAdmin(null);
      setAdminSearchTerm('');
      await fetchData();
    } catch (err) {
      logger.error('Error adding admin', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to add admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!selectedAgency?._id) return;
    
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.agenciesById}/${selectedAgency._id}/admins/${adminId}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'DELETE' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove admin');
      }

      toast.success('Admin removed successfully');
      await fetchData();
      if (selectedAgency) {
        const updatedAgency = await fetch(`${API_BASE_URL}${API_ENDPOINTS.agenciesById}/${selectedAgency._id}`, createAuthFetchOptions({ method: 'GET' }))
          .then(r => r.json())
          .then(r => r.data || r);
        setSelectedAgency(updatedAgency);
      }
    } catch (err) {
      logger.error('Error removing admin', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to remove admin');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchAgencyAnalytics = async (agencyId: string) => {
    try {
      setLoadingAnalytics(true);
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.agenciesById}/${agencyId}/analytics`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      setAgencyAnalytics(result.data || result);
      setAnalyticsModalOpen(true);
    } catch (err) {
      logger.error('Error fetching agency analytics', err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to fetch analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (providerSearchTerm) {
      const timeoutId = setTimeout(() => {
        fetchUsersForProvider(providerSearchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setProviderSuggestions([]);
    }
  }, [providerSearchTerm, fetchUsersForProvider]);

  useEffect(() => {
    if (adminSearchTerm) {
      const timeoutId = setTimeout(() => {
        fetchUsersForAdmin(adminSearchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setAdminSuggestions([]);
    }
  }, [adminSearchTerm, fetchUsersForAdmin]);

  if (loading && agencies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading agencies data..." />
      </div>
    );
  }

  if (error && agencies.length === 0) {
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
    <div className="space-y-3">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Agencies Management</h1>
          <p className="text-gray-500 text-xs mt-0.5">Manage agencies, verify, and oversee providers</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
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

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Agencies</p>
                <p className="text-lg font-bold text-gray-900">{statistics.totalAgencies || 0}</p>
              </div>
              <Building2 className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Active Agencies</p>
                <p className="text-lg font-bold text-green-600">{statistics.activeAgencies || 0}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Verified</p>
                <p className="text-lg font-bold text-purple-600">{statistics.verifiedAgencies || 0}</p>
              </div>
              <Shield className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Providers</p>
                <p className="text-lg font-bold text-orange-600">{statistics.totalProviders || 0}</p>
              </div>
              <Users className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Revenue</p>
                <p className="text-lg font-bold text-yellow-600">{formatCurrency(statistics.totalRevenue || 0, getDefaultCurrency(appSettings), { appSettings })}</p>
              </div>
              <BarChart3 className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="w-3 h-3 mr-1" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                <Download className="w-3 h-3 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-3 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search agencies..."
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
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
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Verification</label>
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setVerificationFilter('all');
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="text-xs text-gray-500">
                {totalCount} agencies found
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Agencies</h3>
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
                onClick={() => handleSort('providers')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'providers' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Providers
                {sortBy === 'providers' && (
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
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agency</th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Providers</th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agencies.map((agency) => (
                <tr key={agency._id} className="hover:bg-gray-50">
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-xs font-semibold text-gray-900">{agency.name}</div>
                        <div className="text-xs text-gray-600 line-clamp-1">
                          {agency.description || 'No description'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <div className="text-xs text-gray-900">
                      {agency.owner?.firstName} {agency.owner?.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{agency.owner?.email}</div>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <div className="flex items-center text-xs text-gray-600">
                      <MapPin className="w-3 h-3 mr-1" />
                      {agency.contact?.address?.city || 'N/A'}, {agency.contact?.address?.country || ''}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Users className="w-3 h-3 mr-0.5" />
                      {agency.providers?.length || 0}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(agency)}
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        agency.isActive 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {agency.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    {agency.verification?.isVerified ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <Shield className="w-3 h-3 mr-0.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-500">
                    {new Date(agency.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewAgency(agency)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View details"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedAgency(agency);
                          setEditFormData({
                            name: agency.name,
                            description: agency.description || '',
                            contact: {
                              email: agency.contact?.email || '',
                              phone: agency.contact?.phone || '',
                              website: agency.contact?.website || '',
                              address: {
                                street: agency.contact?.address?.street || '',
                                city: agency.contact?.address?.city || '',
                                state: agency.contact?.address?.state || '',
                                zipCode: agency.contact?.address?.zipCode || '',
                                country: agency.contact?.address?.country || ''
                              }
                            },
                            business: {
                              type: agency.business?.type || '',
                              registrationNumber: agency.business?.registrationNumber || '',
                              licenseNumber: agency.business?.licenseNumber || ''
                            }
                          });
                          setEditModalOpen(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Edit agency"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedAgency(agency);
                          setVerifyModalOpen(true);
                        }}
                        className="text-purple-600 hover:text-purple-900"
                        title="Verify agency"
                      >
                        <Shield className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedAgency(agency);
                          setDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete agency"
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

        {agencies.length === 0 && (
          <div className="text-center py-8">
            <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No agencies found</h3>
            <p className="text-xs text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>

      {/* View Agency Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedAgency(null);
        }}
        title="Agency Details"
        size="xl"
        footer={
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  fetchAgencyAnalytics(selectedAgency?._id || '');
                }}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
              >
                <BarChart3 className="w-3 h-3 mr-1" />
                View Analytics
              </button>
              <button
                onClick={() => {
                  setViewModalOpen(false);
                  setLogoUploadModalOpen(true);
                }}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100"
              >
                <Upload className="w-3 h-3 mr-1" />
                Upload Logo
              </button>
            </div>
            <button
              onClick={() => {
                setViewModalOpen(false);
                setSelectedAgency(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        }
      >
        {loadingAgencyDetails ? (
          <div className="flex justify-center py-8">
            <Loading size="md" />
          </div>
        ) : selectedAgency ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Name</label>
                  <p className="text-sm font-semibold">{selectedAgency.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    selectedAgency.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedAgency.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500">Description</label>
                  <p className="text-sm text-gray-700">{selectedAgency.description || 'No description'}</p>
                </div>
              </div>
            </div>

            {/* Owner Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Owner</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Name</label>
                  <p className="text-sm">{selectedAgency.owner?.firstName} {selectedAgency.owner?.lastName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Email</label>
                  <p className="text-sm">{selectedAgency.owner?.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {selectedAgency.contact && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Email</label>
                    <p className="text-sm">{selectedAgency.contact.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Phone</label>
                    <p className="text-sm">{selectedAgency.contact.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Website</label>
                    <p className="text-sm">{selectedAgency.contact.website || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Address</label>
                    <p className="text-sm">
                      {selectedAgency.contact.address 
                        ? `${selectedAgency.contact.address.city || ''}, ${selectedAgency.contact.address.country || ''}`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Providers */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Providers ({selectedAgency.providers?.length || 0})</h4>
                <button
                  onClick={() => {
                    setProviderModalOpen(true);
                    setProviderSearchTerm('');
                    setSelectedProvider(null);
                  }}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Provider
                </button>
              </div>
              {selectedAgency.providers && selectedAgency.providers.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedAgency.providers.map((provider, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div>
                        <p className="text-sm font-medium">{provider.user?.firstName} {provider.user?.lastName}</p>
                        <p className="text-xs text-gray-500">Commission: {provider.commissionRate}%</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          provider.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {provider.status}
                        </span>
                        <button
                          onClick={() => handleRemoveProvider(provider.user?._id || '')}
                          className="text-red-600 hover:text-red-900"
                          title="Remove provider"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No providers added yet</p>
              )}
            </div>

            {/* Admins */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Admins ({selectedAgency.admins?.length || 0})</h4>
                <button
                  onClick={() => {
                    setAdminModalOpen(true);
                    setAdminSearchTerm('');
                    setSelectedAdmin(null);
                  }}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Admin
                </button>
              </div>
              {selectedAgency.admins && selectedAgency.admins.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedAgency.admins.map((admin, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div>
                        <p className="text-sm font-medium">{admin.user?.firstName} {admin.user?.lastName}</p>
                        <p className="text-xs text-gray-500">Role: {admin.role}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveAdmin(admin.user?._id || '')}
                        className="text-red-600 hover:text-red-900"
                        title="Remove admin"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No admins added yet</p>
              )}
            </div>

            {/* Analytics */}
            {selectedAgency.analytics && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Analytics</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Total Bookings</p>
                    <p className="text-lg font-bold text-blue-600">{selectedAgency.analytics.totalBookings || 0}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Total Revenue</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(selectedAgency.analytics.totalRevenue || 0, getDefaultCurrency(appSettings), { appSettings })}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Avg Rating</p>
                    <p className="text-lg font-bold text-yellow-600">{selectedAgency.analytics.averageRating?.toFixed(1) || 'N/A'}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Total Reviews</p>
                    <p className="text-lg font-bold text-purple-600">{selectedAgency.analytics.totalReviews || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Verify Agency Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => {
          setVerifyModalOpen(false);
          setSelectedAgency(null);
        }}
        title="Verify Agency"
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setVerifyModalOpen(false);
                setSelectedAgency(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            {selectedAgency?.verification?.isVerified ? (
              <button
                onClick={() => handleVerifyAgency(false)}
                disabled={submitting}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Revoking...' : 'Revoke Verification'}
              </button>
            ) : (
              <button
                onClick={() => handleVerifyAgency(true)}
                disabled={submitting}
                className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Verifying...' : 'Verify Agency'}
              </button>
            )}
          </div>
        }
      >
        {selectedAgency && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              {selectedAgency.verification?.isVerified 
                ? `Are you sure you want to revoke verification for "${selectedAgency.name}"?`
                : `Are you sure you want to verify "${selectedAgency.name}"?`}
            </p>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500">Current Status</p>
              <p className="text-sm font-medium">
                {selectedAgency.verification?.isVerified ? 'Verified' : 'Not Verified'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Agency Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedAgency(null);
        }}
        title="Delete Agency"
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedAgency(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAgency}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Deleting...' : 'Delete Agency'}
            </button>
          </div>
        }
      >
        {selectedAgency && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete the agency <strong>{selectedAgency.name}</strong>? 
              This action cannot be undone and will affect all associated providers.
            </p>
          </div>
        )}
      </Modal>

      {/* Edit Agency Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedAgency(null);
        }}
        title="Edit Agency"
        size="lg"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setEditModalOpen(false);
                setSelectedAgency(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleEditAgency}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name</label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={editFormData.contact.email}
                onChange={(e) => setEditFormData({
                  ...editFormData,
                  contact: { ...editFormData.contact, email: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={editFormData.contact.phone}
                onChange={(e) => setEditFormData({
                  ...editFormData,
                  contact: { ...editFormData.contact, phone: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={editFormData.contact.website}
                onChange={(e) => setEditFormData({
                  ...editFormData,
                  contact: { ...editFormData.contact, website: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={editFormData.contact.address.city}
                onChange={(e) => setEditFormData({
                  ...editFormData,
                  contact: {
                    ...editFormData.contact,
                    address: { ...editFormData.contact.address, city: e.target.value }
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={editFormData.contact.address.state}
                onChange={(e) => setEditFormData({
                  ...editFormData,
                  contact: {
                    ...editFormData.contact,
                    address: { ...editFormData.contact.address, state: e.target.value }
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={editFormData.contact.address.country}
                onChange={(e) => setEditFormData({
                  ...editFormData,
                  contact: {
                    ...editFormData.contact,
                    address: { ...editFormData.contact.address, country: e.target.value }
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Logo Upload Modal */}
      <Modal
        isOpen={logoUploadModalOpen}
        onClose={() => {
          setLogoUploadModalOpen(false);
          setLogoFile(null);
          setLogoPreview(null);
          setSelectedAgency(null);
        }}
        title="Upload Agency Logo"
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setLogoUploadModalOpen(false);
                setLogoFile(null);
                setLogoPreview(null);
                setSelectedAgency(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadLogo}
              disabled={submitting || !logoFile}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Uploading...' : 'Upload Logo'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <FileUpload
            accept="image/*"
            type="image"
            onFilesSelected={(files) => {
              if (files.length > 0) {
                const file = files[0];
                setLogoFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                  setLogoPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
              }
            }}
            files={logoFile ? [logoFile] : []}
            onRemove={() => {
              setLogoFile(null);
              setLogoPreview(null);
            }}
            label="Select Logo Image"
          />
          {logoPreview && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoPreview} alt="Logo preview" className="max-w-xs rounded-lg border border-gray-300" />
            </div>
          )}
        </div>
      </Modal>

      {/* Add Provider Modal */}
      <Modal
        isOpen={providerModalOpen}
        onClose={() => {
          setProviderModalOpen(false);
          setProviderSearchTerm('');
          setSelectedProvider(null);
          setProviderCommissionRate(10);
        }}
        title="Add Provider to Agency"
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setProviderModalOpen(false);
                setProviderSearchTerm('');
                setSelectedProvider(null);
                setProviderCommissionRate(10);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddProvider}
              disabled={submitting || !selectedProvider}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Provider'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Provider</label>
            <div className="relative">
              <input
                type="text"
                value={providerSearchTerm}
                onChange={(e) => setProviderSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {providerSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {providerSuggestions.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => {
                        setSelectedProvider(user);
                        setProviderSearchTerm(`${user.firstName} ${user.lastName}`);
                        setProviderSuggestions([]);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      {user.firstName} {user.lastName} {user.email && `(${user.email})`}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedProvider && (
              <div className="mt-2 p-2 bg-blue-50 rounded">
                <p className="text-sm font-medium">Selected: {selectedProvider.firstName} {selectedProvider.lastName}</p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={providerCommissionRate}
              onChange={(e) => setProviderCommissionRate(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>

      {/* Add Admin Modal */}
      <Modal
        isOpen={adminModalOpen}
        onClose={() => {
          setAdminModalOpen(false);
          setAdminSearchTerm('');
          setSelectedAdmin(null);
        }}
        title="Add Admin to Agency"
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setAdminModalOpen(false);
                setAdminSearchTerm('');
                setSelectedAdmin(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddAdmin}
              disabled={submitting || !selectedAdmin}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Admin'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search User</label>
            <div className="relative">
              <input
                type="text"
                value={adminSearchTerm}
                onChange={(e) => setAdminSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {adminSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {adminSuggestions.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => {
                        setSelectedAdmin(user);
                        setAdminSearchTerm(`${user.firstName} ${user.lastName}`);
                        setAdminSuggestions([]);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                    >
                      {user.firstName} {user.lastName} {user.email && `(${user.email})`}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedAdmin && (
              <div className="mt-2 p-2 bg-blue-50 rounded">
                <p className="text-sm font-medium">Selected: {selectedAdmin.firstName} {selectedAdmin.lastName}</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Analytics Modal */}
      <Modal
        isOpen={analyticsModalOpen}
        onClose={() => {
          setAnalyticsModalOpen(false);
          setAgencyAnalytics(null);
        }}
        title="Agency Analytics"
        size="lg"
      >
        {loadingAnalytics ? (
          <div className="flex justify-center py-8">
            <Loading size="md" />
          </div>
        ) : agencyAnalytics ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-xs text-gray-500">Total Bookings</p>
                <p className="text-2xl font-bold text-blue-600">{agencyAnalytics.totalBookings || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-xs text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(agencyAnalytics.totalRevenue || 0, getDefaultCurrency(appSettings), { appSettings })}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded">
                <p className="text-xs text-gray-500">Avg Rating</p>
                <p className="text-2xl font-bold text-yellow-600">{agencyAnalytics.averageRating?.toFixed(1) || 'N/A'}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-xs text-gray-500">Total Reviews</p>
                <p className="text-2xl font-bold text-purple-600">{agencyAnalytics.totalReviews || 0}</p>
              </div>
            </div>
            {agencyAnalytics.providers && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Provider Statistics</h4>
                <p className="text-sm text-gray-600">Active Providers: {agencyAnalytics.providers.active || 0}</p>
                <p className="text-sm text-gray-600">Total Providers: {agencyAnalytics.providers.total || 0}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No analytics data available</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

