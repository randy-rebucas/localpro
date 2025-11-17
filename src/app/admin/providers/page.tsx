"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Users2, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck,
  UserX,
  Phone,
  MapPin,
  RefreshCw,
  Filter,
  Download,
  Plus,
  Eye,
  ChevronDown,
  ChevronUp,
  Star,
  TrendingUp,
  Clock,
  Briefcase,
  Settings,
  BarChart3,
  Award
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { Modal } from "@/components/ui/modal";
import { makeClientAuthenticatedRequestWithEndpointSafe, makeClientAuthenticatedRequestWithPathSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { Provider, ProfessionalInfo, BusinessInfo, Preferences, Performance, ServiceCategory } from "@/types/providers";

// Extended Provider interface for admin page (includes user fields populated)
interface ProviderWithUser extends Omit<Provider, 'createdAt' | 'updatedAt' | 'profile' | 'subscription'> {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  isActive?: boolean;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  profileCompleteness?: number;
  verificationStatus?: 'verified' | 'pending' | 'rejected';
  profile?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    businessName?: string;
    businessType?: string;
    serviceAreas?: string[];
    specialties?: string[];
    rating?: number;
    totalReviews?: number;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    bio?: string;
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
  tags?: string[];
  notes?: string[];
  professionalInfo?: ProfessionalInfo;
  businessInfo?: BusinessInfo;
  preferences?: Preferences;
  performance?: Performance;
  roles?: string[];
}

// Helper function to transform API provider data to frontend format
const transformProviderData = (apiProvider: {
  _id: string;
  userId?: string | {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    phoneNumber?: string;
    profileImage?: string;
    profile?: {
      bio?: string;
      address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
      };
    };
    roles?: string[];
    isActive?: boolean;
    isVerified?: boolean;
    createdAt?: string;
  };
  providerType?: 'individual' | 'business' | 'agency';
  status?: 'active' | 'inactive' | 'suspended' | 'pending' | 'rejected';
  professionalInfo?: ProfessionalInfo;
  businessInfo?: BusinessInfo;
  verification?: {
    phoneVerified?: boolean;
    emailVerified?: boolean;
    identityVerified?: boolean;
    businessVerified?: boolean;
    addressVerified?: boolean;
    bankAccountVerified?: boolean;
    verifiedAt?: string;
  };
  preferences?: Preferences;
  performance?: Performance;
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
  tags?: string[];
  notes?: string[];
  createdAt?: string;
  updatedAt?: string;
}): ProviderWithUser => {
  // Extract user data from populated userId object or use provider-level fields
  const userIdObj = typeof apiProvider.userId === 'object' ? apiProvider.userId : null;
  const userId = userIdObj?._id || (typeof apiProvider.userId === 'string' ? apiProvider.userId : apiProvider._id);
  
  // Get user fields from populated userId object or fallback to provider-level
  const firstName = userIdObj?.firstName;
  const lastName = userIdObj?.lastName;
  const email = userIdObj?.email;
  const phoneNumber = userIdObj?.phoneNumber || userIdObj?.phone;
  const isActive = userIdObj?.isActive;
  const isVerified = userIdObj?.isVerified;
  const userProfile = userIdObj?.profile;
  const userRoles = userIdObj?.roles;
  const userCreatedAt = userIdObj?.createdAt;
  const profileImage = userIdObj?.profileImage;

  // Determine verification status
  const verificationStatus: 'verified' | 'pending' | 'rejected' = 
    apiProvider.verification?.phoneVerified && apiProvider.verification?.emailVerified 
      ? 'verified' 
      : 'pending';

  return {
    _id: apiProvider._id,
    userId: userId,
    providerType: apiProvider.providerType || 'individual',
    status: apiProvider.status || 'pending',
    firstName: firstName,
    lastName: lastName,
    email: email,
    phoneNumber: phoneNumber,
    isActive: isActive,
    isVerified: isVerified,
    createdAt: userCreatedAt || apiProvider.createdAt,
    updatedAt: apiProvider.updatedAt,
    lastLogin: undefined, // Not in the response structure
    profileCompleteness: undefined, // Calculate if needed
    verificationStatus: verificationStatus,
    profile: userProfile ? {
      bio: userProfile.bio,
      address: userProfile.address
    } : undefined,
    professionalInfo: apiProvider.professionalInfo,
    businessInfo: apiProvider.businessInfo,
    verification: apiProvider.verification,
    preferences: apiProvider.preferences,
    performance: apiProvider.performance,
    subscription: apiProvider.subscription,
    trustScore: apiProvider.trustScore,
    badges: apiProvider.badges,
    tags: apiProvider.tags,
    notes: apiProvider.notes,
    roles: userRoles
  };
};

interface ProviderStats {
  totalProviders: number;
  activeProviders: number;
  pendingProviders: number;
  suspendedProviders: number;
  newProvidersToday: number;
  newProvidersWeek: number;
  newProvidersMonth: number;
  averageRating: number;
  totalEarnings: number;
  trends: {
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ week: string; count: number }>;
    monthly: Array<{ month: string; count: number }>;
  };
  topCategories: Array<{ category: string; count: number }>;
  statusStats: Array<{ status: string; count: number }>;
  performanceMetrics: {
    averageCompletionRate: number;
    averageResponseTime: number;
    averageRating: number;
  };
}

export default function ProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderWithUser[]>([]);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [slowRequest, setSlowRequest] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'rating' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Provider create modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    providerType: 'individual' as 'individual' | 'business' | 'agency',
    status: 'pending' as 'pending' | 'active' | 'suspended' | 'inactive' | 'rejected',
    businessInfo: {
      businessName: "",
      businessType: "",
      businessRegistration: "",
      taxId: "",
      businessPhone: "",
      businessEmail: "",
      website: "",
      businessDescription: "",
      yearEstablished: undefined as number | undefined,
      numberOfEmployees: undefined as number | undefined,
      businessAddress: {
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
    },
    professionalInfo: {
      specialties: [] as Array<{ name?: string; experience?: number; hourlyRate?: number }>,
      languages: [] as string[],
      availability: {} as Record<string, unknown>,
      emergencyServices: false,
      travelDistance: 0,
      minimumJobValue: 0,
      maximumJobValue: 0
    }
  });

  // Provider edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderWithUser | null>(null);
  const [activeTab, setActiveTab] = useState<'professional' | 'preferences' | 'performance'>('professional');
  const [loadingProviderData, setLoadingProviderData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [providerData, setProviderData] = useState<{
    professionalInfo?: ProfessionalInfo;
    preferences?: Preferences;
    performance?: Performance;
    providerType?: 'individual' | 'business' | 'agency';
    status?: 'pending' | 'active' | 'suspended' | 'inactive' | 'rejected';
  } | null>(null);
  
  const [professionalInfoForm, setProfessionalInfoForm] = useState<ProfessionalInfo>({
    specialties: [],
    languages: [],
    availability: {},
    emergencyServices: false,
    travelDistance: 0,
    minimumJobValue: 0,
    maximumJobValue: 0
  });

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

      // Build query parameters for providers data
      const queryParams = new URLSearchParams();
      queryParams.set('page', currentPage.toString());
      queryParams.set('limit', itemsPerPage.toString());
      queryParams.set('includeDeleted', 'true'); // Include deleted providers in the query
      if (searchTerm) queryParams.set('search', searchTerm);
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);
      if (categoryFilter !== 'all') queryParams.set('category', categoryFilter);
      queryParams.set('sortBy', sortBy);
      queryParams.set('sortOrder', sortOrder);

      const dataResponse = await makeClientAuthenticatedRequestWithEndpointSafe(
        'providers' as keyof typeof API_ENDPOINTS,
        { method: 'GET', query: Object.fromEntries(queryParams) }
      );

      if (!dataResponse.ok) {
        const errorData = await dataResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch providers data');
      }

      const dataResult = await dataResponse.json();

      // Transform the API response data to match frontend expectations
      let providersData: ProviderWithUser[] = [];

      if (dataResult.success && dataResult.data) {
        // Handle the new API response structure
        if (dataResult.data.providers && Array.isArray(dataResult.data.providers)) {
          providersData = dataResult.data.providers.map(transformProviderData);
        } else if (Array.isArray(dataResult.data)) {
          // Fallback for old structure
          providersData = dataResult.data.map(transformProviderData);
        }
      } else if (Array.isArray(dataResult.data)) {
        // Fallback for direct array response
        providersData = dataResult.data.map(transformProviderData);
      }

      setProviders(providersData);
      setStats(null);
      setLastUpdated(new Date());
    } catch (err) {
      logger.error('Error fetching providers data', err instanceof Error ? err : new Error(String(err)));
      let errorMessage = 'Failed to load providers data';
      
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
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, categoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (err) {
      logger.error('Error refreshing data', err instanceof Error ? err : new Error(String(err)));
      let errorMessage = 'Failed to refresh providers data';
      
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

  const handleSort = (field: 'name' | 'status' | 'rating' | 'createdAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewProvider = (providerId: string) => {
    // TODO: Implement provider view modal or navigation
    logger.debug('View provider', { providerId });
  };

  // Fetch provider data for editing
  const fetchProviderData = useCallback(async (providerId: string) => {
    try {
      setLoadingProviderData(true);
      if (!getApiToken()) return;

      // Try to fetch provider profile by ID
      // Note: For admin, we might need to use a different endpoint or the provider profile endpoint
      // Since we're editing a provider, we'll try to get it from the user's provider data
      // For now, we'll use the providers endpoint with the provider ID
      const url = `${API_BASE_URL}${API_ENDPOINTS.providersById}/${providerId}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (response.ok) {
        const result = await response.json();
        const provider = result.data || result;
        
        setProviderData({
          professionalInfo: provider.professionalInfo,
          preferences: provider.preferences,
          performance: provider.performance,
          providerType: provider.providerType,
          status: provider.status
        });

        // Populate forms with existing data
        if (provider.professionalInfo) {
          setProfessionalInfoForm(provider.professionalInfo);
        }
        if (provider.preferences) {
          setPreferencesForm(provider.preferences);
        }
      } else {
        logger.debug('No provider profile found', { providerId });
        setProviderData(null);
      }
    } catch (err) {
      const errorMessage: string = err instanceof Error ? err.message : String(err);
      logger.warn('Error fetching provider data', { 
        error: errorMessage
      });
      setProviderData(null);
    } finally {
      setLoadingProviderData(false);
    }
  }, []);

  const handleEditProvider = async (providerId: string) => {
    try {
      const provider = providers.find(p => p._id === providerId);
      if (!provider) {
        toast.error('Provider not found');
        return;
      }

      setSelectedProvider(provider);
      setEditModalOpen(true);
      setActiveTab('professional');
      setProviderData(null);
      
      // Fetch provider data using provider document ID
      // The providerId here is the provider document _id
      await fetchProviderData(providerId);
    } catch (err) {
      logger.error('Error opening edit modal', err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to load provider data');
    }
  };

  const handleCreateProvider = async () => {
    try {
      setSubmitting(true);
      if (!getApiToken()) {
        toast.error('Authentication required');
        return;
      }

      // Validate required fields
      if (!createFormData.firstName || !createFormData.lastName || !createFormData.email || !createFormData.phoneNumber) {
        toast.error('Please fill in all required fields (First Name, Last Name, Email, Phone Number)');
        setSubmitting(false);
        return;
      }

      // Validate business info for business/agency types
      if ((createFormData.providerType === 'business' || createFormData.providerType === 'agency') && !createFormData.businessInfo.businessName) {
        toast.error('Business Name is required for business/agency providers');
        setSubmitting(false);
        return;
      }

      // Step 1: Create user with provider role
      const userPayload = {
        firstName: createFormData.firstName,
        lastName: createFormData.lastName,
        email: createFormData.email,
        phoneNumber: createFormData.phoneNumber,
        roles: ['client', 'provider']
      };

      const userUrl = `${API_BASE_URL}${API_ENDPOINTS.usersCreate}`;
      const userResponse = await fetch(userUrl, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify(userPayload)
      }));

      if (!userResponse.ok) {
        const errorData = await userResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create user');
      }

      const userResult = await userResponse.json();
      const createdUser = userResult.data || userResult;
      const userId = createdUser._id || createdUser.id;

      if (!userId) {
        throw new Error('User created but no user ID returned');
      }

      // Step 2: Create provider profile
      const providerPayload: Record<string, unknown> = {
        providerType: createFormData.providerType,
        status: createFormData.status
      };

      // Add business info if business/agency
      if (createFormData.providerType === 'business' || createFormData.providerType === 'agency') {
        const businessInfo: Record<string, unknown> = {};
        if (createFormData.businessInfo.businessName) businessInfo.businessName = createFormData.businessInfo.businessName;
        if (createFormData.businessInfo.businessType) businessInfo.businessType = createFormData.businessInfo.businessType;
        if (createFormData.businessInfo.businessRegistration) businessInfo.businessRegistration = createFormData.businessInfo.businessRegistration;
        if (createFormData.businessInfo.taxId) businessInfo.taxId = createFormData.businessInfo.taxId;
        if (createFormData.businessInfo.businessPhone) businessInfo.businessPhone = createFormData.businessInfo.businessPhone;
        if (createFormData.businessInfo.businessEmail) businessInfo.businessEmail = createFormData.businessInfo.businessEmail;
        if (createFormData.businessInfo.website) businessInfo.website = createFormData.businessInfo.website;
        if (createFormData.businessInfo.businessDescription) businessInfo.businessDescription = createFormData.businessInfo.businessDescription;
        if (createFormData.businessInfo.yearEstablished) businessInfo.yearEstablished = createFormData.businessInfo.yearEstablished;
        if (createFormData.businessInfo.numberOfEmployees) businessInfo.numberOfEmployees = createFormData.businessInfo.numberOfEmployees;
        
        // Add business address if any field is filled
        const hasAddress = createFormData.businessInfo.businessAddress.street || 
                          createFormData.businessInfo.businessAddress.city ||
                          createFormData.businessInfo.businessAddress.state ||
                          createFormData.businessInfo.businessAddress.zipCode ||
                          createFormData.businessInfo.businessAddress.country;
        if (hasAddress) {
          businessInfo.businessAddress = createFormData.businessInfo.businessAddress;
        }

        if (Object.keys(businessInfo).length > 0) {
          providerPayload.businessInfo = businessInfo;
        }
      }

      // Add professional info if provided
      const hasProfessionalInfo = createFormData.professionalInfo.specialties.length > 0 ||
                                  createFormData.professionalInfo.languages.length > 0 ||
                                  Object.keys(createFormData.professionalInfo.availability).length > 0 ||
                                  createFormData.professionalInfo.emergencyServices ||
                                  createFormData.professionalInfo.travelDistance > 0 ||
                                  createFormData.professionalInfo.minimumJobValue > 0 ||
                                  createFormData.professionalInfo.maximumJobValue > 0;

      if (hasProfessionalInfo) {
        providerPayload.professionalInfo = createFormData.professionalInfo;
      }

      const providerUrl = `${API_BASE_URL}${API_ENDPOINTS.providersProfile}`;
      const providerResponse = await fetch(providerUrl, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify(providerPayload)
      }));

      if (!providerResponse.ok) {
        const errorData = await providerResponse.json().catch(() => ({}));
        // If provider creation fails, we still have the user created
        logger.warn('Failed to create provider profile', {
          error: errorData.error || errorData.message,
          userId
        });
        toast.error(`User created but provider profile creation failed: ${errorData.error || errorData.message}`, {
          duration: 5000
        });
      } else {
        toast.success('Provider created successfully');
        setCreateModalOpen(false);
        // Reset form
        setCreateFormData({
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          providerType: 'individual',
          status: 'pending',
          businessInfo: {
            businessName: "",
            businessType: "",
            businessRegistration: "",
            taxId: "",
            businessPhone: "",
            businessEmail: "",
            website: "",
            businessDescription: "",
            yearEstablished: undefined,
            numberOfEmployees: undefined,
            businessAddress: {
              street: "",
              city: "",
              state: "",
              zipCode: "",
              country: "",
              coordinates: {
                lat: undefined,
                lng: undefined
              }
            }
          },
          professionalInfo: {
            specialties: [],
            languages: [],
            availability: {},
            emergencyServices: false,
            travelDistance: 0,
            minimumJobValue: 0,
            maximumJobValue: 0
          }
        });
        // Refresh data
        await fetchData();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Error creating provider', err instanceof Error ? err : new Error(errorMessage));
      toast.error(`Failed to create provider: ${errorMessage}`, {
        duration: 5000
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProvider = async () => {
    if (!selectedProvider?._id) return;
    
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      const providerPayload: Record<string, unknown> = {};
      
      // Include professionalInfo if we have data
      const hasProfessionalInfo = (professionalInfoForm.specialties && professionalInfoForm.specialties.length > 0) ||
                                 (professionalInfoForm.languages && professionalInfoForm.languages.length > 0) ||
                                 (professionalInfoForm.availability && Object.keys(professionalInfoForm.availability).length > 0) ||
                                 professionalInfoForm.emergencyServices !== undefined ||
                                 (professionalInfoForm.travelDistance !== undefined && (professionalInfoForm.travelDistance ?? 0) > 0) ||
                                 (professionalInfoForm.minimumJobValue !== undefined && (professionalInfoForm.minimumJobValue ?? 0) > 0) ||
                                 (professionalInfoForm.maximumJobValue !== undefined && (professionalInfoForm.maximumJobValue ?? 0) > 0);

      if (hasProfessionalInfo) {
        providerPayload.professionalInfo = professionalInfoForm;
      }
      
      // Include preferences if we have data
      const hasPreferences = preferencesForm.notificationSettings ||
                            preferencesForm.jobPreferences ||
                            preferencesForm.communicationPreferences;

      if (hasPreferences) {
        providerPayload.preferences = preferencesForm;
      }

      const providerUrl = `${API_BASE_URL}${API_ENDPOINTS.providersProfile}`;
      const providerResponse = await fetch(providerUrl, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify(providerPayload)
      }));

      if (!providerResponse.ok) {
        const errorData = await providerResponse.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || 'Unknown error';
        throw new Error(errorMessage);
      }

      toast.success('Provider updated successfully');
      setEditModalOpen(false);
      setSelectedProvider(null);
      setActiveTab('professional');
      await fetchData();
    } catch (err) {
      logger.error('Error updating provider', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to update provider');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (window.confirm('Are you sure you want to delete this provider?')) {
      try {
        const response = await makeClientAuthenticatedRequestWithPathSafe(
          'providersById' as keyof typeof API_ENDPOINTS,
          [providerId],
          {},
          { method: 'DELETE', headers: { 'Content-Type': 'application/json' } }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete provider');
        }

        await fetchData(); // Refresh the data
      } catch (err) {
        logger.error('Error deleting provider', err instanceof Error ? err : new Error(String(err)), { providerId });
        setError(err instanceof Error ? err.message : 'Failed to delete provider');
      }
    }
  };

  const handleUpdateProviderStatus = async (providerId: string, status: string, reason?: string) => {
    try {
      const response = await makeClientAuthenticatedRequestWithPathSafe(
        'providersAdminStatus' as keyof typeof API_ENDPOINTS,
        [providerId, 'status'],
        {},
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, reason }) }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update provider status');
      }

      await fetchData(); // Refresh the data
    } catch (err) {
      logger.error('Error updating provider status', err instanceof Error ? err : new Error(String(err)), { providerId, status });
      setError(err instanceof Error ? err.message : 'Failed to update provider status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getVerificationColor = (verified: boolean) => {
    return verified ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loading size="xl" text="Loading providers data..." />
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
      <AdminErrorState 
        error={error}
        onRetry={fetchData}
        retryText="Try Again"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Provider Management
          </h1>
          <p className="text-gray-600 text-sm">Manage service providers, verification, and performance</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={() => router.push('/admin/users?create=provider')}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Provider
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
                <p className="text-xs font-medium text-gray-500">Total Providers</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : (stats?.totalProviders || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {loading ? '...' : (stats?.newProvidersToday || 0)} today
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0 ml-4">
                <Users2 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Active Providers</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : (stats?.activeProviders || 0).toLocaleString()}
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
                <p className="text-xs font-medium text-gray-500">Pending Approval</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : (stats?.pendingProviders || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Awaiting verification
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0 ml-4">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Average Rating</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : (stats?.averageRating || 0).toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">
                  {loading ? '...' : (stats?.totalEarnings || 0).toLocaleString()} earned
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0 ml-4">
                <Star className="w-5 h-5 text-purple-600" />
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
                    placeholder="Search providers..."
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
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="repair">Repair</option>
                  <option value="installation">Installation</option>
                  <option value="consultation">Consultation</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="text-xs text-gray-500">
                {providers.length} providers found
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Providers</h3>
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
                onClick={() => handleSort('rating')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'rating' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Rating
                {sortBy === 'rating' && (
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {providers.map((provider) => (
                <tr key={provider._id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <Users2 className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-xs font-semibold text-gray-900">
                          {provider.firstName} {provider.lastName}
                        </div>
                        <div className="text-xs text-gray-600">{provider.email}</div>
                        {provider.profile?.businessName && (
                          <div className="text-xs text-gray-500">{provider.profile.businessName}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(provider.status || 'pending')}`}>
                      {(provider.status || 'pending').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getVerificationColor(provider.isVerified || false)}`}>
                        {provider.isVerified ? 'VERIFIED' : 'PENDING'}
                      </span>
                      {provider.trustScore && (
                        <span className="text-xs text-gray-500">
                          Score: {provider.trustScore}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                    <div className="space-y-1">
                      {provider.profile?.rating && (
                        <div className="flex items-center">
                          <Star className="w-3 h-3 mr-1 text-yellow-500" />
                          <span>{provider.profile.rating.toFixed(1)} ({provider.profile.totalReviews || 0} reviews)</span>
                        </div>
                      )}
                      {provider.performance?.completionRate && (
                        <div className="flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                          <span>{provider.performance.completionRate}% completion</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                    <div className="space-y-1">
                      {provider.phoneNumber && (
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1 text-gray-500" />
                          <span>{provider.phoneNumber}</span>
                        </div>
                      )}
                      {provider.profile?.address && (
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-gray-500" />
                          <span>
                            {provider.profile.address.city}, {provider.profile.address.state}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => provider._id && handleViewProvider(provider._id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View provider details"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => provider._id && handleEditProvider(provider._id)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit provider"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      {provider.status === 'active' ? (
                        <button 
                          onClick={() => provider._id && handleUpdateProviderStatus(provider._id, 'suspended', 'Admin action')}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Suspend provider"
                        >
                          <UserX className="w-3 h-3" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => provider._id && handleUpdateProviderStatus(provider._id, 'active')}
                          className="text-green-600 hover:text-green-900"
                          title="Activate provider"
                        >
                          <UserCheck className="w-3 h-3" />
                        </button>
                      )}
                      <button 
                        onClick={() => provider._id && handleDeleteProvider(provider._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete provider"
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

        {providers.length === 0 && (
          <div className="text-center py-8">
            <Users2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No providers found</h3>
            <p className="text-xs text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>

      {/* Edit Provider Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedProvider(null);
          setActiveTab('professional');
        }}
        title={`Edit Provider: ${selectedProvider?.firstName || ''} ${selectedProvider?.lastName || ''}`}
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
              onClick={handleUpdateProvider}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Provider'}
            </button>
          </div>
        }
      >
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex space-x-1 -mb-px">
            <button
              onClick={() => setActiveTab('professional')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'professional'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Briefcase className="w-3 h-3 inline mr-1" />
              Professional
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'preferences'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-3 h-3 inline mr-1" />
              Preferences
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'performance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-3 h-3 inline mr-1" />
              Performance
            </button>
          </nav>
        </div>

        {/* Professional Tab */}
        {activeTab === 'professional' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {loadingProviderData ? (
              <div className="text-center py-8">
                <Loading />
                <p className="text-sm text-gray-500 mt-2">Loading provider data...</p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Specialties</h3>
                  <div className="space-y-3">
                    {professionalInfoForm.specialties?.map((specialty, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-3 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">Category</label>
                            <select
                              value={specialty.category || ''}
                              onChange={(e) => {
                                const newSpecialties = [...(professionalInfoForm.specialties || [])];
                                newSpecialties[index] = { ...specialty, category: e.target.value as ServiceCategory | undefined };
                                setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                              }}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Select category</option>
                              <option value="cleaning">Cleaning</option>
                              <option value="plumbing">Plumbing</option>
                              <option value="electrical">Electrical</option>
                              <option value="moving">Moving</option>
                              <option value="landscaping">Landscaping</option>
                              <option value="pest_control">Pest Control</option>
                              <option value="handyman">Handyman</option>
                              <option value="painting">Painting</option>
                              <option value="carpentry">Carpentry</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">Experience (years)</label>
                            <input
                              type="number"
                              min="0"
                              value={specialty.experience || 0}
                              onChange={(e) => {
                                const newSpecialties = [...(professionalInfoForm.specialties || [])];
                                newSpecialties[index] = { ...specialty, experience: parseInt(e.target.value) || 0 };
                                setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                              }}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">Hourly Rate</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={specialty.hourlyRate || 0}
                              onChange={(e) => {
                                const newSpecialties = [...(professionalInfoForm.specialties || [])];
                                newSpecialties[index] = { ...specialty, hourlyRate: parseFloat(e.target.value) || 0 };
                                setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                              }}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        
                        {/* Subcategories */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Subcategories</label>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {specialty.subcategories?.map((sub, subIdx) => (
                              <span key={subIdx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                                {sub}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSpecialties = [...(professionalInfoForm.specialties || [])];
                                    newSpecialties[index] = {
                                      ...specialty,
                                      subcategories: specialty.subcategories?.filter((_, i) => i !== subIdx) || []
                                    };
                                    setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                                  }}
                                  className="ml-1 text-gray-600 hover:text-gray-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          <input
                            type="text"
                            placeholder="Add subcategory (press Enter)"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                e.preventDefault();
                                const newSpecialties = [...(professionalInfoForm.specialties || [])];
                                newSpecialties[index] = {
                                  ...specialty,
                                  subcategories: [...(specialty.subcategories || []), e.currentTarget.value.trim()]
                                };
                                setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                                e.currentTarget.value = '';
                              }
                            }}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Skills */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Skills (IDs)</label>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {specialty.skills?.map((skill, skillIdx) => (
                              <span key={skillIdx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                                {skill}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSpecialties = [...(professionalInfoForm.specialties || [])];
                                    newSpecialties[index] = {
                                      ...specialty,
                                      skills: specialty.skills?.filter((_, i) => i !== skillIdx) || []
                                    };
                                    setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                                  }}
                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          <input
                            type="text"
                            placeholder="Add skill ID (press Enter)"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                e.preventDefault();
                                const newSpecialties = [...(professionalInfoForm.specialties || [])];
                                newSpecialties[index] = {
                                  ...specialty,
                                  skills: [...(specialty.skills || []), e.currentTarget.value.trim()]
                                };
                                setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                                e.currentTarget.value = '';
                              }
                            }}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Service Areas */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Service Areas</label>
                          <div className="space-y-2 mb-2">
                            {specialty.serviceAreas?.map((area, areaIdx) => (
                              <div key={areaIdx} className="flex gap-2 items-end border border-gray-200 rounded p-2">
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-600 mb-0.5">City</label>
                                  <input
                                    type="text"
                                    value={area.city || ''}
                                    onChange={(e) => {
                                      const newSpecialties = [...(professionalInfoForm.specialties || [])];
                                      newSpecialties[index] = {
                                        ...specialty,
                                        serviceAreas: specialty.serviceAreas?.map((a, i) => 
                                          i === areaIdx ? { ...a, city: e.target.value } : a
                                        ) || []
                                      };
                                      setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                                    }}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-600 mb-0.5">State</label>
                                  <input
                                    type="text"
                                    value={area.state || ''}
                                    onChange={(e) => {
                                      const newSpecialties = [...(professionalInfoForm.specialties || [])];
                                      newSpecialties[index] = {
                                        ...specialty,
                                        serviceAreas: specialty.serviceAreas?.map((a, i) => 
                                          i === areaIdx ? { ...a, state: e.target.value } : a
                                        ) || []
                                      };
                                      setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                                    }}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                                  />
                                </div>
                                <div className="w-20">
                                  <label className="block text-xs text-gray-600 mb-0.5">Radius</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={area.radius || 0}
                                    onChange={(e) => {
                                      const newSpecialties = [...(professionalInfoForm.specialties || [])];
                                      newSpecialties[index] = {
                                        ...specialty,
                                        serviceAreas: specialty.serviceAreas?.map((a, i) => 
                                          i === areaIdx ? { ...a, radius: parseInt(e.target.value) || 0 } : a
                                        ) || []
                                      };
                                      setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                                    }}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSpecialties = [...(professionalInfoForm.specialties || [])];
                                    newSpecialties[index] = {
                                      ...specialty,
                                      serviceAreas: specialty.serviceAreas?.filter((_, i) => i !== areaIdx) || []
                                    };
                                    setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                                  }}
                                  className="text-xs text-red-600 hover:text-red-700 px-2"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newSpecialties = [...(professionalInfoForm.specialties || [])];
                              newSpecialties[index] = {
                                ...specialty,
                                serviceAreas: [...(specialty.serviceAreas || []), { city: '', state: '', radius: 0 }]
                              };
                              setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            + Add Service Area
                          </button>
                        </div>

                        {/* Certifications */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Certifications</label>
                          <div className="space-y-2 mb-2">
                            {specialty.certifications?.map((cert, certIdx) => (
                              <div key={certIdx} className="border border-gray-200 rounded p-2 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Certification name"
                                    value={cert.name || ''}
                                    onChange={(e) => {
                                      const newSpecialties = [...(professionalInfoForm.specialties || [])];
                                      newSpecialties[index] = {
                                        ...specialty,
                                        certifications: specialty.certifications?.map((c, i) => 
                                          i === certIdx ? { ...c, name: e.target.value } : c
                                        ) || []
                                      };
                                      setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                                    }}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded-md"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Issuer"
                                    value={cert.issuer || ''}
                                    onChange={(e) => {
                                      const newSpecialties = [...(professionalInfoForm.specialties || [])];
                                      newSpecialties[index] = {
                                        ...specialty,
                                        certifications: specialty.certifications?.map((c, i) => 
                                          i === certIdx ? { ...c, issuer: e.target.value } : c
                                        ) || []
                                      };
                                      setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                                    }}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded-md"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Certificate number"
                                    value={cert.certificateNumber || ''}
                                    onChange={(e) => {
                                      const newSpecialties = [...(professionalInfoForm.specialties || [])];
                                      newSpecialties[index] = {
                                        ...specialty,
                                        certifications: specialty.certifications?.map((c, i) => 
                                          i === certIdx ? { ...c, certificateNumber: e.target.value } : c
                                        ) || []
                                      };
                                      setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                                    }}
                                    className="px-2 py-1 text-xs border border-gray-300 rounded-md"
                                  />
                                  <div className="flex gap-1">
                                    <input
                                      type="date"
                                      placeholder="Date issued"
                                      value={cert.dateIssued ? new Date(cert.dateIssued).toISOString().split('T')[0] : ''}
                                      onChange={(e) => {
                                        const newSpecialties = [...(professionalInfoForm.specialties || [])];
                                        newSpecialties[index] = {
                                          ...specialty,
                                          certifications: specialty.certifications?.map((c, i) => 
                                            i === certIdx ? { ...c, dateIssued: e.target.value ? new Date(e.target.value) : undefined } : c
                                          ) || []
                                        };
                                        setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                                      }}
                                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md"
                                    />
                                    <input
                                      type="date"
                                      placeholder="Expiry date"
                                      value={cert.expiryDate ? new Date(cert.expiryDate).toISOString().split('T')[0] : ''}
                                      onChange={(e) => {
                                        const newSpecialties = [...(professionalInfoForm.specialties || [])];
                                        newSpecialties[index] = {
                                          ...specialty,
                                          certifications: specialty.certifications?.map((c, i) => 
                                            i === certIdx ? { ...c, expiryDate: e.target.value ? new Date(e.target.value) : undefined } : c
                                          ) || []
                                        };
                                        setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                                      }}
                                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md"
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSpecialties = [...(professionalInfoForm.specialties || [])];
                                    newSpecialties[index] = {
                                      ...specialty,
                                      certifications: specialty.certifications?.filter((_, i) => i !== certIdx) || []
                                    };
                                    setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                                  }}
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  Remove Certification
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newSpecialties = [...(professionalInfoForm.specialties || [])];
                              newSpecialties[index] = {
                                ...specialty,
                                certifications: [...(specialty.certifications || []), {}]
                              };
                              setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            + Add Certification
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newSpecialties = professionalInfoForm.specialties?.filter((_, i) => i !== index) || [];
                            setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                          }}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove Specialty
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newSpecialties = [...(professionalInfoForm.specialties || []), { 
                          experience: 0, 
                          hourlyRate: 0,
                          subcategories: [],
                          skills: [],
                          serviceAreas: [],
                          certifications: []
                        }];
                        setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      + Add Specialty
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Languages</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {professionalInfoForm.languages?.map((lang, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                        {lang}
                        <button
                          type="button"
                          onClick={() => {
                            const newLangs = professionalInfoForm.languages?.filter((_, i) => i !== idx) || [];
                            setProfessionalInfoForm({ ...professionalInfoForm, languages: newLangs });
                          }}
                          className="ml-1 text-gray-600 hover:text-gray-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add language (e.g., en, fil)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        e.preventDefault();
                        const newLangs = [...(professionalInfoForm.languages || []), e.currentTarget.value.trim()];
                        setProfessionalInfoForm({ ...professionalInfoForm, languages: newLangs });
                        e.currentTarget.value = '';
                      }
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Availability</label>
                  <div className="space-y-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <div key={day} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={professionalInfoForm.availability?.[day]?.available || false}
                          onChange={(e) => {
                            setProfessionalInfoForm({
                              ...professionalInfoForm,
                              availability: {
                                ...professionalInfoForm.availability,
                                [day]: {
                                  ...professionalInfoForm.availability?.[day],
                                  available: e.target.checked,
                                  start: professionalInfoForm.availability?.[day]?.start || '08:00',
                                  end: professionalInfoForm.availability?.[day]?.end || '17:00'
                                }
                              }
                            });
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-xs text-gray-700 capitalize w-20">{day}</span>
                        {professionalInfoForm.availability?.[day]?.available && (
                          <>
                            <input
                              type="time"
                              value={professionalInfoForm.availability[day]?.start || '08:00'}
                              onChange={(e) => {
                                setProfessionalInfoForm({
                                  ...professionalInfoForm,
                                  availability: {
                                    ...professionalInfoForm.availability,
                                    [day]: {
                                      ...professionalInfoForm.availability?.[day],
                                      start: e.target.value,
                                      available: true
                                    }
                                  }
                                });
                              }}
                              className="px-2 py-1 text-xs border border-gray-300 rounded-md"
                            />
                            <span className="text-xs text-gray-500">to</span>
                            <input
                              type="time"
                              value={professionalInfoForm.availability[day]?.end || '17:00'}
                              onChange={(e) => {
                                setProfessionalInfoForm({
                                  ...professionalInfoForm,
                                  availability: {
                                    ...professionalInfoForm.availability,
                                    [day]: {
                                      ...professionalInfoForm.availability?.[day],
                                      end: e.target.value,
                                      available: true
                                    }
                                  }
                                });
                              }}
                              className="px-2 py-1 text-xs border border-gray-300 rounded-md"
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Emergency Services</label>
                    <input
                      type="checkbox"
                      checked={professionalInfoForm.emergencyServices || false}
                      onChange={(e) => setProfessionalInfoForm({ ...professionalInfoForm, emergencyServices: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Travel Distance (km)</label>
                    <input
                      type="number"
                      min="0"
                      value={professionalInfoForm.travelDistance || 0}
                      onChange={(e) => setProfessionalInfoForm({ ...professionalInfoForm, travelDistance: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Minimum Job Value</label>
                    <input
                      type="number"
                      min="0"
                      value={professionalInfoForm.minimumJobValue || 0}
                      onChange={(e) => setProfessionalInfoForm({ ...professionalInfoForm, minimumJobValue: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Maximum Job Value</label>
                    <input
                      type="number"
                      min="0"
                      value={professionalInfoForm.maximumJobValue || 0}
                      onChange={(e) => setProfessionalInfoForm({ ...professionalInfoForm, maximumJobValue: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Notification Settings</h3>
              <div className="space-y-2">
                {Object.entries(preferencesForm.notificationSettings || {}).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={value as boolean}
                      onChange={(e) => setPreferencesForm({
                        ...preferencesForm,
                        notificationSettings: {
                          ...preferencesForm.notificationSettings,
                          [key]: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-xs text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Job Preferences</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Job Types</label>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {preferencesForm.jobPreferences?.preferredJobTypes?.map((type, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                        {type}
                        <button
                          type="button"
                          onClick={() => {
                            setPreferencesForm({
                              ...preferencesForm,
                              jobPreferences: {
                                ...preferencesForm.jobPreferences,
                                preferredJobTypes: preferencesForm.jobPreferences?.preferredJobTypes?.filter((_, i) => i !== idx) || []
                              }
                            });
                          }}
                          className="ml-1 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add preferred job type (press Enter)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        e.preventDefault();
                        setPreferencesForm({
                          ...preferencesForm,
                          jobPreferences: {
                            ...preferencesForm.jobPreferences,
                            preferredJobTypes: [...(preferencesForm.jobPreferences?.preferredJobTypes || []), e.currentTarget.value.trim()]
                          }
                        });
                        e.currentTarget.value = '';
                      }
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Avoid Job Types</label>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {preferencesForm.jobPreferences?.avoidJobTypes?.map((type, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                        {type}
                        <button
                          type="button"
                          onClick={() => {
                            setPreferencesForm({
                              ...preferencesForm,
                              jobPreferences: {
                                ...preferencesForm.jobPreferences,
                                avoidJobTypes: preferencesForm.jobPreferences?.avoidJobTypes?.filter((_, i) => i !== idx) || []
                              }
                            });
                          }}
                          className="ml-1 text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add job type to avoid (press Enter)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        e.preventDefault();
                        setPreferencesForm({
                          ...preferencesForm,
                          jobPreferences: {
                            ...preferencesForm.jobPreferences,
                            avoidJobTypes: [...(preferencesForm.jobPreferences?.avoidJobTypes || []), e.currentTarget.value.trim()]
                          }
                        });
                        e.currentTarget.value = '';
                      }
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Time Slots</label>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {preferencesForm.jobPreferences?.preferredTimeSlots?.map((slot, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                        {slot}
                        <button
                          type="button"
                          onClick={() => {
                            setPreferencesForm({
                              ...preferencesForm,
                              jobPreferences: {
                                ...preferencesForm.jobPreferences,
                                preferredTimeSlots: preferencesForm.jobPreferences?.preferredTimeSlots?.filter((_, i) => i !== idx) || []
                              }
                            });
                          }}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add time slot (e.g., morning, afternoon, evening) (press Enter)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        e.preventDefault();
                        setPreferencesForm({
                          ...preferencesForm,
                          jobPreferences: {
                            ...preferencesForm.jobPreferences,
                            preferredTimeSlots: [...(preferencesForm.jobPreferences?.preferredTimeSlots || []), e.currentTarget.value.trim()]
                          }
                        });
                        e.currentTarget.value = '';
                      }
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Max Jobs Per Day</label>
                    <input
                      type="number"
                      min="1"
                      value={preferencesForm.jobPreferences?.maxJobsPerDay || 5}
                      onChange={(e) => setPreferencesForm({
                        ...preferencesForm,
                        jobPreferences: {
                          ...preferencesForm.jobPreferences,
                          maxJobsPerDay: parseInt(e.target.value) || 5
                        }
                      })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Advance Booking Days</label>
                    <input
                      type="number"
                      min="1"
                      value={preferencesForm.jobPreferences?.advanceBookingDays || 30}
                      onChange={(e) => setPreferencesForm({
                        ...preferencesForm,
                        jobPreferences: {
                          ...preferencesForm.jobPreferences,
                          advanceBookingDays: parseInt(e.target.value) || 30
                        }
                      })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Communication Preferences</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Preferred Contact Method</label>
                  <select
                    value={preferencesForm.communicationPreferences?.preferredContactMethod || 'app'}
                    onChange={(e) => setPreferencesForm({
                      ...preferencesForm,
                      communicationPreferences: {
                        ...preferencesForm.communicationPreferences,
                        preferredContactMethod: e.target.value as 'phone' | 'email' | 'sms' | 'app'
                      }
                    })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="app">App</option>
                    <option value="phone">Phone</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Response Time (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={preferencesForm.communicationPreferences?.responseTimeExpectation || '60'}
                    onChange={(e) => setPreferencesForm({
                      ...preferencesForm,
                      communicationPreferences: {
                        ...preferencesForm.communicationPreferences,
                        responseTimeExpectation: e.target.value || '60'
                      }
                    })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={preferencesForm.communicationPreferences?.autoAcceptJobs || false}
                      onChange={(e) => setPreferencesForm({
                        ...preferencesForm,
                        communicationPreferences: {
                          ...preferencesForm.communicationPreferences,
                          autoAcceptJobs: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-xs text-gray-700">Auto Accept Jobs</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab (Read-only) */}
        {activeTab === 'performance' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {loadingProviderData ? (
              <div className="text-center py-8">
                <Loading />
                <p className="text-sm text-gray-500 mt-2">Loading performance data...</p>
              </div>
            ) : providerData?.performance ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-md p-3">
                    <div className="text-xs text-gray-500 mb-1">Rating</div>
                    <div className="text-2xl font-bold text-gray-900">{providerData.performance.rating?.toFixed(1) || 'N/A'}</div>
                    <div className="text-xs text-gray-500 mt-1">{providerData.performance.totalReviews || 0} reviews</div>
                  </div>
                  <div className="border border-gray-200 rounded-md p-3">
                    <div className="text-xs text-gray-500 mb-1">Total Jobs</div>
                    <div className="text-2xl font-bold text-gray-900">{providerData.performance.totalJobs || 0}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {providerData.performance.completedJobs || 0} completed
                      {providerData.performance.cancelledJobs !== undefined && providerData.performance.cancelledJobs > 0 && (
                        <span className="text-red-600"> • {providerData.performance.cancelledJobs} cancelled</span>
                      )}
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-md p-3">
                    <div className="text-xs text-gray-500 mb-1">Completion Rate</div>
                    <div className="text-2xl font-bold text-gray-900">{providerData.performance.completionRate?.toFixed(1) || '0'}%</div>
                  </div>
                  <div className="border border-gray-200 rounded-md p-3">
                    <div className="text-xs text-gray-500 mb-1">Response Time</div>
                    <div className="text-2xl font-bold text-gray-900">{providerData.performance.responseTime || 0} min</div>
                  </div>
                  {providerData.performance.repeatCustomerRate !== undefined && (
                    <div className="border border-gray-200 rounded-md p-3">
                      <div className="text-xs text-gray-500 mb-1">Repeat Customer Rate</div>
                      <div className="text-2xl font-bold text-gray-900">{providerData.performance.repeatCustomerRate?.toFixed(1) || '0'}%</div>
                    </div>
                  )}
                </div>
                {providerData.performance.earnings && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Earnings</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-500">Total</div>
                        <div className="text-lg font-semibold">₱{providerData.performance.earnings.total?.toLocaleString() || '0'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">This Month</div>
                        <div className="text-lg font-semibold">₱{providerData.performance.earnings.thisMonth?.toLocaleString() || '0'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Last Month</div>
                        <div className="text-lg font-semibold">₱{providerData.performance.earnings.lastMonth?.toLocaleString() || '0'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Pending</div>
                        <div className="text-lg font-semibold">₱{providerData.performance.earnings.pending?.toLocaleString() || '0'}</div>
                      </div>
                    </div>
                  </div>
                )}
                {providerData.performance.badges && providerData.performance.badges.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Badges</h4>
                    <div className="flex flex-wrap gap-2">
                      {providerData.performance.badges.map((badge, idx) => (
                        <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                          <Award className="w-3 h-3 mr-1" />
                          {badge.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-sm text-gray-500">
                No performance data available
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Provider Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          // Reset form on close
          setCreateFormData({
            firstName: "",
            lastName: "",
            email: "",
            phoneNumber: "",
            providerType: 'individual',
            status: 'pending',
            businessInfo: {
              businessName: "",
              businessType: "",
              businessRegistration: "",
              taxId: "",
              businessPhone: "",
              businessEmail: "",
              website: "",
              businessDescription: "",
              yearEstablished: undefined,
              numberOfEmployees: undefined,
              businessAddress: {
                street: "",
                city: "",
                state: "",
                zipCode: "",
                country: "",
                coordinates: {
                  lat: undefined,
                  lng: undefined
                }
              }
            },
            professionalInfo: {
              specialties: [],
              languages: [],
              availability: {},
              emergencyServices: false,
              travelDistance: 0,
              minimumJobValue: 0,
              maximumJobValue: 0
            }
          });
        }}
        title="Create New Provider"
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
              onClick={handleCreateProvider}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Provider'}
            </button>
          </div>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto modal-content-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h3>
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
            </div>
          </div>

          {/* Provider Type and Status */}
          <div className="border-t border-gray-200 pt-3">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Provider Configuration</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Provider Type *</label>
                <select
                  value={createFormData.providerType}
                  onChange={(e) => setCreateFormData({ ...createFormData, providerType: e.target.value as 'individual' | 'business' | 'agency' })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                  <option value="agency">Agency</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Status</label>
                <select
                  value={createFormData.status}
                  onChange={(e) => setCreateFormData({ ...createFormData, status: e.target.value as 'pending' | 'active' | 'suspended' | 'inactive' | 'rejected' })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Business Information - Show if business or agency */}
          {(createFormData.providerType === 'business' || createFormData.providerType === 'agency') && (
            <div className="border-t border-gray-200 pt-3">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Business Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Business Name *</label>
                  <input
                    type="text"
                    value={createFormData.businessInfo.businessName}
                    onChange={(e) => setCreateFormData({
                      ...createFormData,
                      businessInfo: { ...createFormData.businessInfo, businessName: e.target.value }
                    })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Business Type</label>
                    <input
                      type="text"
                      value={createFormData.businessInfo.businessType}
                      onChange={(e) => setCreateFormData({
                        ...createFormData,
                        businessInfo: { ...createFormData.businessInfo, businessType: e.target.value }
                      })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Business Phone</label>
                    <input
                      type="tel"
                      value={createFormData.businessInfo.businessPhone}
                      onChange={(e) => setCreateFormData({
                        ...createFormData,
                        businessInfo: { ...createFormData.businessInfo, businessPhone: e.target.value }
                      })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Business Email</label>
                    <input
                      type="email"
                      value={createFormData.businessInfo.businessEmail}
                      onChange={(e) => setCreateFormData({
                        ...createFormData,
                        businessInfo: { ...createFormData.businessInfo, businessEmail: e.target.value }
                      })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Website</label>
                    <input
                      type="url"
                      value={createFormData.businessInfo.website}
                      onChange={(e) => setCreateFormData({
                        ...createFormData,
                        businessInfo: { ...createFormData.businessInfo, website: e.target.value }
                      })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Business Description</label>
                  <textarea
                    value={createFormData.businessInfo.businessDescription}
                    onChange={(e) => setCreateFormData({
                      ...createFormData,
                      businessInfo: { ...createFormData.businessInfo, businessDescription: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Professional Information - Optional */}
          <div className="border-t border-gray-200 pt-3">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Professional Information (Optional)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Travel Distance (miles)</label>
                <input
                  type="number"
                  min="0"
                  value={createFormData.professionalInfo.travelDistance || ''}
                  onChange={(e) => setCreateFormData({
                    ...createFormData,
                    professionalInfo: { ...createFormData.professionalInfo, travelDistance: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Emergency Services</label>
                <div className="mt-1.5">
                  <input
                    type="checkbox"
                    checked={createFormData.professionalInfo.emergencyServices}
                    onChange={(e) => setCreateFormData({
                      ...createFormData,
                      professionalInfo: { ...createFormData.professionalInfo, emergencyServices: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-xs text-gray-600">Available for emergency services</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
