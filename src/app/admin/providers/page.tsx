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
  const [activeTab, setActiveTab] = useState<'basic' | 'business' | 'professional' | 'verification' | 'financial' | 'preferences' | 'onboarding' | 'metadata' | 'performance'>('basic');
  const [loadingProviderData, setLoadingProviderData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Provider view modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProviderForView, setSelectedProviderForView] = useState<ProviderWithUser | null>(null);
  const [loadingViewData, setLoadingViewData] = useState(false);
  // Note: providerData state is kept for potential future use but currently not read
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [providerData, setProviderData] = useState<{
    professionalInfo?: ProfessionalInfo;
    businessInfo?: BusinessInfo;
    preferences?: Preferences;
    performance?: Performance;
    verification?: {
      identityVerified?: boolean;
      businessVerified?: boolean;
      backgroundCheck?: {
        status?: 'pending' | 'passed' | 'failed' | 'not_required';
        dateCompleted?: string;
        reportId?: string;
      };
      insurance?: {
        hasInsurance?: boolean;
        insuranceProvider?: string;
        policyNumber?: string;
        coverageAmount?: number;
        expiryDate?: string;
        documents?: string[];
      };
      licenses?: Array<unknown>;
      references?: Array<unknown>;
      portfolio?: Record<string, unknown>;
    };
    financialInfo?: {
      bankAccount?: {
        accountHolder?: string;
        accountNumber?: string;
        routingNumber?: string;
        bankName?: string;
        accountType?: 'checking' | 'savings';
      };
      taxInfo?: {
        ssn?: string;
        ein?: string;
        taxClassification?: string;
        w9Submitted?: boolean;
      };
      paymentMethods?: Array<unknown>;
      commissionRate?: number;
      minimumPayout?: number;
    };
    providerType?: 'individual' | 'business' | 'agency';
    status?: 'pending' | 'active' | 'suspended' | 'inactive' | 'rejected';
    settings?: {
      profileVisibility?: 'public' | 'private' | 'verified_only';
      showContactInfo?: boolean;
      showPricing?: boolean;
      showReviews?: boolean;
      allowDirectBooking?: boolean;
      requireApproval?: boolean;
    };
    onboarding?: {
      completed?: boolean;
      currentStep?: string;
      progress?: number;
      steps?: Array<{
        step?: string;
        completed?: boolean;
        completedAt?: string;
        data?: Record<string, unknown>;
      }>;
    };
    metadata?: {
      lastActive?: string;
      profileViews?: number;
      searchRanking?: number;
      featured?: boolean;
      promoted?: boolean;
      tags?: string[];
      notes?: string;
    };
  } | null>(null);
  
  // Basic Info Form
  const [basicInfoForm, setBasicInfoForm] = useState<{
    status: 'pending' | 'active' | 'suspended' | 'inactive' | 'rejected';
    providerType: 'individual' | 'business' | 'agency';
    settings: {
      profileVisibility: 'public' | 'private' | 'verified_only';
      showContactInfo: boolean;
      showPricing: boolean;
      showReviews: boolean;
      allowDirectBooking: boolean;
      requireApproval: boolean;
    };
  }>({
    status: 'pending',
    providerType: 'individual',
    settings: {
      profileVisibility: 'public',
      showContactInfo: true,
      showPricing: true,
      showReviews: true,
      allowDirectBooking: true,
      requireApproval: false
    }
  });

  // Business Info Form
  const [businessInfoForm, setBusinessInfoForm] = useState<BusinessInfo>({
    businessName: '',
    businessType: '',
    businessRegistration: '',
    taxId: '',
    businessAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      coordinates: {
        lat: undefined,
        lng: undefined
      }
    },
    businessPhone: '',
    businessEmail: '',
    website: '',
    businessDescription: '',
    yearEstablished: undefined,
    numberOfEmployees: undefined
  });
  
  const [professionalInfoForm, setProfessionalInfoForm] = useState<ProfessionalInfo>({
    specialties: [],
    languages: [],
    availability: {},
    emergencyServices: false,
    travelDistance: 0,
    minimumJobValue: 0,
    maximumJobValue: 0
  });

  // Onboarding Form
  const [onboardingForm, setOnboardingForm] = useState<{
    completed: boolean;
    currentStep: string;
    progress: number;
    steps: Array<{
      step: string;
      completed: boolean;
      completedAt: string;
      data: Record<string, unknown>;
    }>;
  }>({
    completed: false,
    currentStep: '',
    progress: 0,
    steps: []
  });

  // Metadata Form
  const [metadataForm, setMetadataForm] = useState<{
    lastActive: string;
    profileViews: number;
    searchRanking: number;
    featured: boolean;
    promoted: boolean;
    tags: string[];
    notes: string;
  }>({
    lastActive: '',
    profileViews: 0,
    searchRanking: 0,
    featured: false,
    promoted: false,
    tags: [],
    notes: ''
  });

  // Verification Form
  const [verificationForm, setVerificationForm] = useState<{
    identityVerified: boolean;
    businessVerified: boolean;
    backgroundCheck: {
      status: 'pending' | 'passed' | 'failed' | 'not_required';
      dateCompleted?: string;
      reportId?: string;
    };
    insurance: {
      hasInsurance: boolean;
      insuranceProvider?: string;
      policyNumber?: string;
      coverageAmount?: number;
      expiryDate?: string;
      documents?: string[];
    };
    licenses: Array<{
      type?: string;
      number?: string;
      issuingAuthority?: string;
      issueDate?: string;
      expiryDate?: string;
      documents?: string[];
    }>;
    references: Array<{
      name?: string;
      relationship?: string;
      phone?: string;
      email?: string;
      company?: string;
      verified?: boolean;
    }>;
    portfolio: {
      images?: string[];
      videos?: string[];
      descriptions?: string[];
      beforeAfter?: Array<{
        before?: string;
        after?: string;
        description?: string;
      }>;
    };
  }>({
    identityVerified: false,
    businessVerified: false,
    backgroundCheck: {
      status: 'pending'
    },
    insurance: {
      hasInsurance: false
    },
    licenses: [],
    references: [],
    portfolio: {}
  });

  // Financial Info Form
  const [financialInfoForm, setFinancialInfoForm] = useState<{
    bankAccount: {
      accountHolder?: string;
      accountNumber?: string;
      routingNumber?: string;
      bankName?: string;
      accountType?: 'checking' | 'savings';
    };
    taxInfo: {
      ssn?: string;
      ein?: string;
      taxClassification?: string;
      w9Submitted?: boolean;
    };
    paymentMethods: Array<{
      type: 'bank_transfer' | 'paypal' | 'paymaya' | 'check';
      details?: unknown;
      isDefault?: boolean;
    }>;
    commissionRate?: number;
    minimumPayout?: number;
  }>({
    bankAccount: {},
    taxInfo: {},
    paymentMethods: [],
    commissionRate: 0.1,
    minimumPayout: 50
  });

  // Preferences Form (for admin - can update)
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

  // Performance Form (editable by admin)
  const [performanceForm, setPerformanceForm] = useState<{
    rating?: number;
    totalReviews?: number;
    totalJobs?: number;
    completedJobs?: number;
    cancelledJobs?: number;
    responseTime?: number;
    completionRate?: number;
    repeatCustomerRate?: number;
    earnings?: {
      total?: number;
      thisMonth?: number;
      lastMonth?: number;
      pending?: number;
    };
    badges?: Array<{
      name?: string;
      description?: string;
      earnedDate?: string;
      category?: string;
    }>;
  }>({});

  // Skills data
  const [availableSkills, setAvailableSkills] = useState<Record<string, Array<{ _id: string; id?: string; name: string }>>>({});
  const [loadingSkills, setLoadingSkills] = useState<Record<string, boolean>>({});

  // Service Categories data
  const [serviceCategories, setServiceCategories] = useState<Array<{ key: string; name: string; displayOrder?: number }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Fetch service categories
  const fetchServiceCategories = useCallback(async () => {
    if (serviceCategories.length > 0) return; // Already loaded
    
    try {
      setLoadingCategories(true);
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceServicesCategories}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (response.ok) {
        const result = await response.json();
        const categories = result.data || result.categories || result || [];
        
        // Normalize categories to have key and name
        const normalizedCategories = Array.isArray(categories) ? categories.map((cat: unknown) => {
          const category = cat as { key?: string; name?: string; displayOrder?: number; id?: string };
          return {
            key: category.key || category.id || '',
            name: category.name || category.key || category.id || '',
            displayOrder: category.displayOrder || 0
          };
        }).filter(cat => cat.key && cat.name) : [];

        // Sort by displayOrder if available
        normalizedCategories.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        
        setServiceCategories(normalizedCategories);
      }
    } catch (err) {
      logger.warn('Failed to fetch service categories', { error: err });
    } finally {
      setLoadingCategories(false);
    }
  }, [serviceCategories.length]);

  // Fetch skills for a category
  const fetchSkillsForCategory = useCallback(async (category: string) => {
    if (!category || availableSkills[category]) return; // Already loaded or no category
    
    try {
      setLoadingSkills(prev => ({ ...prev, [category]: true }));
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.providersSkillsByCategory}?category=${category}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (response.ok) {
        const result = await response.json();
        const skills = result.data?.skills || result.data || result.skills || result || [];
        
        // Normalize skills to have _id, id, and name
        const normalizedSkills = Array.isArray(skills) ? skills.map((skill: unknown) => {
          if (typeof skill === 'string') {
            return { _id: skill, id: skill, name: skill };
          }
          const skillObj = skill as { _id?: string; id?: string; name?: string; value?: string };
          return {
            _id: skillObj._id || skillObj.id || skillObj.value || '',
            id: skillObj.id || skillObj._id || skillObj.value || '',
            name: skillObj.name || skillObj.value || skillObj._id || skillObj.id || ''
          };
        }) : [];

        setAvailableSkills(prev => ({ ...prev, [category]: normalizedSkills }));
      }
    } catch (err) {
      logger.warn('Failed to fetch skills', { category, error: err });
    } finally {
      setLoadingSkills(prev => ({ ...prev, [category]: false }));
    }
  }, [availableSkills]);

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

  // Fetch service categories on mount
  useEffect(() => {
    fetchServiceCategories();
  }, [fetchServiceCategories]);

  // Re-normalize categories when serviceCategories are loaded and we have provider data
  useEffect(() => {
    if (serviceCategories.length > 0 && professionalInfoForm.specialties && professionalInfoForm.specialties.length > 0) {
      type ServiceCategoryWithId = {
        key?: string;
        name?: string;
        _id?: string;
        [key: string]: unknown;
      };

      // Check if any specialty has a category that needs normalization
      const needsNormalization = professionalInfoForm.specialties.some((spec) => {
        const category = (spec as { category?: string | unknown }).category;
        if (!category || typeof category !== 'string') return false;
        // Check if category is an ObjectId or doesn't match serviceCategories keys
        return /^[0-9a-fA-F]{24}$/.test(category) || 
               !serviceCategories.some(cat => cat.key === category);
      });

      if (needsNormalization) {
        // Re-normalize categories now that serviceCategories are available
        const renormalizedSpecialties = professionalInfoForm.specialties.map((spec) => {
          const specWithCategory = spec as { category?: string | unknown; [key: string]: unknown };
          const category = specWithCategory.category;
          if (!category || typeof category !== 'string') return spec;
          
          // If category is ObjectId, try to find matching category
          if (/^[0-9a-fA-F]{24}$/.test(category)) {
            const matchedCat = serviceCategories.find((cat: ServiceCategoryWithId) => cat._id === category);
            if (matchedCat) {
              return { ...spec, category: matchedCat.key || matchedCat.name } as typeof spec;
            }
          }
          
          // If category doesn't match any serviceCategory key, try to find it
          if (!serviceCategories.some(cat => cat.key === category)) {
            // Try to find by name (case-insensitive)
            const matchedCat = serviceCategories.find((cat: ServiceCategoryWithId) => 
              cat.name?.toLowerCase() === category?.toLowerCase() ||
              cat.key?.toLowerCase() === category?.toLowerCase()
            );
            if (matchedCat) {
              return { ...spec, category: matchedCat.key } as typeof spec;
            }
          }
          
          return spec;
        });

        setProfessionalInfoForm(prev => ({
          ...prev,
          specialties: renormalizedSpecialties as typeof prev.specialties
        }));

        // Fetch skills for newly normalized categories
        renormalizedSpecialties.forEach((spec) => {
          const category = (spec as { category?: string | unknown }).category;
          if (category && typeof category === 'string' && serviceCategories.some(cat => cat.key === category)) {
            fetchSkillsForCategory(category);
          }
        });
      }
    }
  }, [serviceCategories, professionalInfoForm.specialties, fetchSkillsForCategory]);


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

  const handleViewProvider = async (providerId: string) => {
    try {
      setLoadingViewData(true);
      setShowViewModal(true);
      
      // Find provider in current list first
      const existingProvider = providers.find(p => p._id === providerId);
      if (existingProvider) {
        setSelectedProviderForView(existingProvider);
        setLoadingViewData(false);
        return;
      }
      
      // If not found, fetch from API
      const endpoint = `/api/providers/admin/${providerId}`;
      const url = `${API_BASE_URL}${endpoint}`;
      
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Failed to fetch provider: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        const transformedProvider = transformProviderData(result.data);
        setSelectedProviderForView(transformedProvider);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      logger.error('Error fetching provider for view', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to load provider details');
      setShowViewModal(false);
    } finally {
      setLoadingViewData(false);
    }
  };

  // Fetch provider data for editing
  const fetchProviderData = useCallback(async (providerId: string) => {
    try {
      setLoadingProviderData(true);
      if (!getApiToken()) return;

      // Fetch provider data by ID
      const endpoint = API_ENDPOINTS.providersById.replace("[id]", providerId);
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (response.ok) {
        const result = await response.json();
        // Handle different response structures
        const provider = result.data || result.provider || result;
        
        if (!provider) {
          logger.warn('Provider data is empty', { providerId, result });
          setProviderData(null);
          return;
        }
        
        // Debug logging in development
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Fetched provider data for edit', {
            providerId,
            hasProfessionalInfo: !!provider.professionalInfo,
            hasBusinessInfo: !!provider.businessInfo,
            hasPreferences: !!provider.preferences,
            hasVerification: !!provider.verification,
            providerKeys: Object.keys(provider),
            specialtiesCount: provider.professionalInfo?.specialties?.length || 0,
          });
        }
        
        setProviderData({
          professionalInfo: provider.professionalInfo,
          businessInfo: provider.businessInfo,
          preferences: provider.preferences,
          performance: provider.performance,
          verification: provider.verification,
          financialInfo: provider.financialInfo,
          providerType: provider.providerType,
          status: provider.status,
          settings: provider.settings,
          onboarding: provider.onboarding,
          metadata: provider.metadata
        });

        // Populate forms with existing data - always set basic info if available
        setBasicInfoForm({
          status: provider.status || 'pending',
          providerType: provider.providerType || 'individual',
          settings: {
            profileVisibility: provider.settings?.profileVisibility || 'public',
            showContactInfo: provider.settings?.showContactInfo ?? true,
            showPricing: provider.settings?.showPricing ?? true,
            showReviews: provider.settings?.showReviews ?? true,
            allowDirectBooking: provider.settings?.allowDirectBooking ?? true,
            requireApproval: provider.settings?.requireApproval ?? false
          }
        });
        
        if (provider.businessInfo) {
          setBusinessInfoForm({
            businessName: provider.businessInfo.businessName || '',
            businessDescription: provider.businessInfo.businessDescription || '',
            ...provider.businessInfo
          });
        } else {
          // Reset business info form if not available
          setBusinessInfoForm({
            businessName: '',
            businessDescription: ''
          });
        }
        if (provider.professionalInfo) {
          // Normalize skills to string IDs for form compatibility
          // Also normalize category to string key format for the dropdown
          const normalizedProfessionalInfo = {
            ...provider.professionalInfo,
            specialties: provider.professionalInfo.specialties?.map((spec: {
              category?: string | { _id?: string; key?: string; name?: string };
              skills?: Array<string | { _id?: string; id?: string; category?: string | { key?: string; name?: string; _id?: string } }>;
              [key: string]: unknown;
            }) => {
              // Normalize category - extract key from various formats
              let categoryKey: string | undefined = undefined;
              
              if (spec.category) {
                if (typeof spec.category === 'string') {
                  // If it's already a string, check if it's a key or ObjectId
                  if (/^[0-9a-fA-F]{24}$/.test(spec.category)) {
                    // It's an ObjectId - try to find matching category in serviceCategories by _id
                    // Note: serviceCategories might not have _id, so we'll need to handle this differently
                    // For now, we'll try to extract from skills or use the ObjectId as fallback
                    categoryKey = undefined; // Will try to get from skills below
                  } else {
                    // It's a key string like "plumbing", "cleaning"
                    categoryKey = spec.category;
                  }
                } else if (typeof spec.category === 'object' && spec.category !== null) {
                  // Category is an object with _id, name, key
                  categoryKey = spec.category.key || spec.category.name;
                  // If still no key and we have _id, try to match with serviceCategories
                  if (!categoryKey && typeof spec.category === 'object' && spec.category !== null && '_id' in spec.category && spec.category._id && serviceCategories.length > 0) {
                    // Try to find category by _id in serviceCategories (if they have _id field)
                    const categoryId = spec.category._id;
                    const matchedCat = serviceCategories.find((cat: { _id?: string; key?: string; name?: string }) => cat._id === categoryId);
                    if (matchedCat) {
                      categoryKey = matchedCat.key || matchedCat.name;
                    }
                  }
                }
              }
              
              // If we don't have a category key from specialty, try to get it from skills
              if (!categoryKey && spec.skills && Array.isArray(spec.skills) && spec.skills.length > 0) {
                // Try each skill to find a category
                for (const skill of spec.skills) {
                  if (skill && typeof skill === 'object') {
                    let skillCategory: string | undefined = undefined;
                    if (typeof skill.category === 'object' && skill.category !== null) {
                      skillCategory = skill.category.key || skill.category.name;
                    } else if (typeof skill.category === 'string') {
                      if (!/^[0-9a-fA-F]{24}$/.test(skill.category)) {
                        skillCategory = skill.category;
                      }
                    }
                    if (skillCategory) {
                      categoryKey = skillCategory;
                      break; // Use first valid category found
                    }
                  }
                }
              }
              
              // Ensure categoryKey matches a valid serviceCategory key
              let finalCategoryKey = categoryKey;
              if (categoryKey && serviceCategories.length > 0) {
                // Verify the category key exists in serviceCategories
                const categoryExists = serviceCategories.some(cat => cat.key === categoryKey);
                if (!categoryExists) {
                  // Try to find by name or key (case-insensitive)
                  const matchedCat = serviceCategories.find(cat => 
                    cat.key?.toLowerCase() === categoryKey?.toLowerCase() ||
                    cat.name?.toLowerCase() === categoryKey?.toLowerCase()
                  );
                  if (matchedCat) {
                    finalCategoryKey = matchedCat.key;
                  } else {
                    // Category doesn't match any available category
                    finalCategoryKey = undefined;
                  }
                }
              }
              
              return {
                ...spec,
                category: finalCategoryKey, // Set the category key for the dropdown (must match option value exactly)
                skills: spec.skills?.map((skill: string | { _id?: string; id?: string; name?: string; [key: string]: unknown }) => {
                  if (typeof skill === 'string') return skill;
                  if (skill && typeof skill === 'object') {
                    return skill._id || skill.id || String(skill);
                  }
                  return String(skill);
                }).filter((s: string | undefined) => s) || [] // Filter out empty strings
              };
            }) || []
          };
          
          setProfessionalInfoForm(normalizedProfessionalInfo);
          
          // Fetch skills for all categories in specialties - do this immediately
          if (normalizedProfessionalInfo.specialties && normalizedProfessionalInfo.specialties.length > 0) {
            const categories = new Set<string>();
            normalizedProfessionalInfo.specialties.forEach((spec: {
              category?: string;
              skills?: Array<string | { category?: string | { key?: string; name?: string } }>;
            }) => {
              if (spec.category) {
                // Only add if it's not an ObjectId (24 hex chars) and matches a valid category key
                if (!/^[0-9a-fA-F]{24}$/.test(spec.category)) {
                  // Verify the category exists in serviceCategories
                  const categoryExists = serviceCategories.some(cat => cat.key === spec.category);
                  if (categoryExists) {
                    categories.add(spec.category);
                  } else if (process.env.NODE_ENV === 'development') {
                    logger.warn('Category key not found in serviceCategories', { 
                      category: spec.category,
                      availableCategories: serviceCategories.map(c => c.key)
                    });
                  }
                } else {
                  // If it's an ObjectId, try to find matching category in serviceCategories
                  // This is a fallback - ideally the API should return the key
                  logger.warn('Category is ObjectId format, cannot fetch skills by key', { category: spec.category });
                }
              }
              // Also check skills for category info
              if (spec.skills && Array.isArray(spec.skills)) {
                spec.skills.forEach((skill: string | { category?: string | { key?: string; name?: string } }) => {
                  if (skill && typeof skill === 'object') {
                    const skillCategory = typeof skill.category === 'object' 
                      ? skill.category?.key || skill.category?.name
                      : skill.category;
                    if (skillCategory && typeof skillCategory === 'string' && !/^[0-9a-fA-F]{24}$/.test(skillCategory)) {
                      const categoryExists = serviceCategories.some(cat => cat.key === skillCategory);
                      if (categoryExists) {
                        categories.add(skillCategory);
                      }
                    }
                  }
                });
              }
            });
            
            // Fetch skills for all detected categories
            categories.forEach(cat => {
              if (cat) {
                fetchSkillsForCategory(cat);
              }
            });
          }
        } else {
          // Reset professional info form if not available
          setProfessionalInfoForm({
            specialties: [],
            languages: [],
            availability: {},
            emergencyServices: false,
            travelDistance: 0,
            minimumJobValue: 0,
            maximumJobValue: 0
          });
        }
        if (provider.verification) {
          setVerificationForm({
            identityVerified: provider.verification.identityVerified ?? false,
            businessVerified: provider.verification.businessVerified ?? false,
            backgroundCheck: provider.verification.backgroundCheck || { status: 'pending' },
            insurance: provider.verification.insurance || { hasInsurance: false },
            licenses: Array.isArray(provider.verification.licenses) ? provider.verification.licenses : [],
            references: Array.isArray(provider.verification.references) ? provider.verification.references : [],
            portfolio: provider.verification.portfolio || {}
          });
        } else {
          // Reset verification form if not available
          setVerificationForm({
            identityVerified: false,
            businessVerified: false,
            backgroundCheck: { status: 'pending' },
            insurance: { hasInsurance: false },
            licenses: [],
            references: [],
            portfolio: {}
          });
        }
        // Always set financial info form
        setFinancialInfoForm({
          bankAccount: provider.financialInfo?.bankAccount || {},
          taxInfo: provider.financialInfo?.taxInfo || {},
          paymentMethods: Array.isArray(provider.financialInfo?.paymentMethods) ? provider.financialInfo.paymentMethods : [],
          commissionRate: provider.financialInfo?.commissionRate ?? 0.1,
          minimumPayout: provider.financialInfo?.minimumPayout ?? 50
        });
        // Always set preferences form
        setPreferencesForm({
          notificationSettings: provider.preferences?.notificationSettings || {
            newJobAlerts: true,
            messageNotifications: true,
            paymentNotifications: true,
            reviewNotifications: true,
            marketingEmails: false
          },
          jobPreferences: provider.preferences?.jobPreferences || {
            preferredJobTypes: [],
            avoidJobTypes: [],
            preferredTimeSlots: [],
            maxJobsPerDay: 5,
            advanceBookingDays: 30
          },
          communicationPreferences: provider.preferences?.communicationPreferences || {
            preferredContactMethod: 'app',
            responseTimeExpectation: 60,
            autoAcceptJobs: false
          },
          ...provider.preferences
        });
        
        // Always set performance form
        setPerformanceForm({
          rating: provider.performance?.rating || 0,
          totalReviews: provider.performance?.totalReviews || 0,
          totalJobs: provider.performance?.totalJobs || 0,
          completedJobs: provider.performance?.completedJobs || 0,
          cancelledJobs: provider.performance?.cancelledJobs || 0,
          responseTime: provider.performance?.responseTime || 0,
          completionRate: provider.performance?.completionRate || 0,
          repeatCustomerRate: provider.performance?.repeatCustomerRate || 0,
          earnings: provider.performance?.earnings || {},
          badges: provider.performance?.badges || []
        });
        
        // Always set onboarding form
        setOnboardingForm({
          completed: provider.onboarding?.completed || false,
          currentStep: provider.onboarding?.currentStep || '',
          progress: provider.onboarding?.progress || 0,
          steps: provider.onboarding?.steps || []
        });
        
        // Always set metadata form
        setMetadataForm({
          lastActive: provider.metadata?.lastActive || '',
          profileViews: provider.metadata?.profileViews || 0,
          searchRanking: provider.metadata?.searchRanking || 0,
          featured: provider.metadata?.featured || false,
          promoted: provider.metadata?.promoted || false,
          tags: Array.isArray(provider.metadata?.tags) ? provider.metadata.tags : [],
          notes: provider.metadata?.notes || ''
        });
      } else {
        // Handle non-OK response
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Failed to fetch provider: ${response.status} ${response.statusText}`;
        logger.warn('Failed to fetch provider data', { 
          providerId, 
          status: response.status,
          statusText: response.statusText,
          error: errorMessage
        });
        toast.error(errorMessage);
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
  }, [fetchSkillsForCategory, serviceCategories]);

  const handleEditProvider = async (providerId: string) => {
    try {
      const provider = providers.find(p => p._id === providerId);
      if (!provider) {
        toast.error('Provider not found');
        return;
      }

      setSelectedProvider(provider);
      setEditModalOpen(true);
      setActiveTab('basic');
      setProviderData(null);
      
      // Ensure categories are loaded
      if (serviceCategories.length === 0) {
        await fetchServiceCategories();
      }
      
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
      
      // Basic Info (status, providerType, settings)
      providerPayload.status = basicInfoForm.status;
      providerPayload.providerType = basicInfoForm.providerType;
      providerPayload.settings = basicInfoForm.settings;
      
      // Business Info (if business/agency)
      if (basicInfoForm.providerType === 'business' || basicInfoForm.providerType === 'agency') {
        const hasBusinessInfo = businessInfoForm.businessName ||
                               businessInfoForm.businessType ||
                               businessInfoForm.businessPhone ||
                               businessInfoForm.businessEmail ||
                               businessInfoForm.website ||
                               businessInfoForm.businessDescription;
        if (hasBusinessInfo) {
          providerPayload.businessInfo = businessInfoForm;
        }
      }
      
      // Professional Info
      const hasProfessionalInfo = (professionalInfoForm.specialties && professionalInfoForm.specialties.length > 0) ||
                                 (professionalInfoForm.languages && professionalInfoForm.languages.length > 0) ||
                                 (professionalInfoForm.availability && Object.keys(professionalInfoForm.availability).length > 0) ||
                                 professionalInfoForm.emergencyServices !== undefined ||
                                 (professionalInfoForm.travelDistance !== undefined && (professionalInfoForm.travelDistance ?? 0) > 0) ||
                                 (professionalInfoForm.minimumJobValue !== undefined && (professionalInfoForm.minimumJobValue ?? 0) > 0) ||
                                 (professionalInfoForm.maximumJobValue !== undefined && (professionalInfoForm.maximumJobValue ?? 0) > 0);

      if (hasProfessionalInfo) {
        // Transform professionalInfo to handle category field - remove category if it's just a string key
        // The backend expects category as ObjectId, not a string key
        const transformedProfessionalInfo = {
          ...professionalInfoForm,
          specialties: professionalInfoForm.specialties?.map((specialty) => {
            const { category, ...restSpecialty } = specialty;
            // Only include category if it looks like an ObjectId (24 hex characters), otherwise remove it
            // The backend should handle category assignment based on other fields or we need to fetch the actual category _id
            const transformedSpecialty: Record<string, unknown> = { ...restSpecialty };
            // If category is a valid ObjectId format, keep it; otherwise remove it
            if (category && typeof category === 'string' && /^[0-9a-fA-F]{24}$/.test(category)) {
              transformedSpecialty.category = category;
            }
            // If category is a string key (like "cleaning"), we remove it to avoid validation error
            // The backend should handle category assignment separately if needed
            return transformedSpecialty;
          }) || []
        };
        providerPayload.professionalInfo = transformedProfessionalInfo;
      }
      
      // Onboarding
      const hasOnboarding = onboardingForm.currentStep ||
                           onboardingForm.completed !== undefined ||
                           onboardingForm.progress > 0 ||
                           onboardingForm.steps.length > 0;
      if (hasOnboarding) {
        providerPayload.onboarding = onboardingForm;
      }
      
      // Verification
      const hasVerification = verificationForm.identityVerified !== undefined ||
                              verificationForm.businessVerified !== undefined ||
                              verificationForm.backgroundCheck?.status ||
                              verificationForm.insurance?.hasInsurance !== undefined ||
                              verificationForm.licenses.length > 0 ||
                              verificationForm.references.length > 0 ||
                              Object.keys(verificationForm.portfolio).length > 0;
      if (hasVerification) {
        providerPayload.verification = verificationForm;
      }

      // Financial Info
      const hasFinancialInfo = financialInfoForm.bankAccount?.accountHolder ||
                               financialInfoForm.bankAccount?.accountNumber ||
                               financialInfoForm.bankAccount?.routingNumber ||
                               financialInfoForm.taxInfo?.ssn ||
                               financialInfoForm.taxInfo?.ein ||
                               financialInfoForm.paymentMethods.length > 0 ||
                               financialInfoForm.commissionRate !== undefined ||
                               financialInfoForm.minimumPayout !== undefined;
      if (hasFinancialInfo) {
        providerPayload.financialInfo = financialInfoForm;
      }

      // Preferences
      const hasPreferences = preferencesForm.notificationSettings ||
                            preferencesForm.jobPreferences ||
                            preferencesForm.communicationPreferences;
      if (hasPreferences) {
        providerPayload.preferences = preferencesForm;
      }

      // Performance (editable by admin)
      const hasPerformance = performanceForm.rating !== undefined ||
                            performanceForm.totalReviews !== undefined ||
                            performanceForm.totalJobs !== undefined ||
                            performanceForm.completedJobs !== undefined ||
                            performanceForm.cancelledJobs !== undefined ||
                            performanceForm.responseTime !== undefined ||
                            performanceForm.completionRate !== undefined ||
                            performanceForm.repeatCustomerRate !== undefined ||
                            performanceForm.earnings ||
                            (performanceForm.badges && performanceForm.badges.length > 0);
      if (hasPerformance) {
        providerPayload.performance = performanceForm;
      }

      // Metadata
      const hasMetadata = metadataForm.profileViews > 0 ||
                         metadataForm.searchRanking > 0 ||
                         metadataForm.featured !== undefined ||
                         metadataForm.promoted !== undefined ||
                         metadataForm.tags.length > 0 ||
                         metadataForm.notes;
      if (hasMetadata) {
        providerPayload.metadata = metadataForm;
      }

      // Use admin endpoint with provider ID for admin updates
      // Try admin endpoint first, fallback to direct provider ID endpoint
      const providerUrl = `${API_BASE_URL}/api/providers/admin/${selectedProvider._id}`;
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
      setActiveTab('basic');
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
      // Use the endpoint: /api/providers/admin/[id]/status (as specified)
      const endpoint = `/api/providers/admin/${providerId}/status`;
      const url = `${API_BASE_URL}${endpoint}`;
      
      logger.debug('Updating provider status', { url, providerId, status, reason });
      
      const response = await fetch(url, createAuthFetchOptions({
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reason }),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Failed to update provider status: ${response.status} ${response.statusText}`;
        
        // If 404, the endpoint might not be implemented yet - try fallback
        if (response.status === 404) {
          logger.debug('Status endpoint returned 404, trying fallback to PUT /api/providers/admin/[id]');
          const fallbackEndpoint = `/api/providers/admin/${providerId}`;
          const fallbackUrl = `${API_BASE_URL}${fallbackEndpoint}`;
          
          const fallbackResponse = await fetch(fallbackUrl, createAuthFetchOptions({
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status, reason }),
          }));
          
          if (!fallbackResponse.ok) {
            const fallbackErrorData = await fallbackResponse.json().catch(() => ({}));
            throw new Error(fallbackErrorData.error || fallbackErrorData.message || `Failed to update provider status: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
          }
          
          const fallbackResult = await fallbackResponse.json();
          toast.success(fallbackResult.message || `Provider status updated to ${status}`);
          await fetchData();
          return;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success(result.message || `Provider status updated to ${status}`);
      await fetchData(); // Refresh the data
    } catch (err) {
      logger.error('Error updating provider status', err instanceof Error ? err : new Error(String(err)), { providerId, status });
      const errorMessage = err instanceof Error ? err.message : 'Failed to update provider status';
      toast.error(errorMessage);
      setError(errorMessage);
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
          setActiveTab('basic');
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
          <nav className="flex space-x-1 -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-3 h-3 inline mr-1" />
              Basic Info
            </button>
            {(basicInfoForm.providerType === 'business' || basicInfoForm.providerType === 'agency') && (
              <button
                onClick={() => setActiveTab('business')}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'business'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Briefcase className="w-3 h-3 inline mr-1" />
                Business Info
              </button>
            )}
            <button
              onClick={() => setActiveTab('professional')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'professional'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Briefcase className="w-3 h-3 inline mr-1" />
              Professional
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'verification'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserCheck className="w-3 h-3 inline mr-1" />
              Verification
            </button>
            <button
              onClick={() => setActiveTab('financial')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'financial'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-3 h-3 inline mr-1" />
              Financial
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'preferences'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-3 h-3 inline mr-1" />
              Preferences
            </button>
            <button
              onClick={() => setActiveTab('onboarding')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'onboarding'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserCheck className="w-3 h-3 inline mr-1" />
              Onboarding
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'metadata'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-3 h-3 inline mr-1" />
              Metadata
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
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

        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {loadingProviderData ? (
              <div className="text-center py-8">
                <Loading />
                <p className="text-sm text-gray-500 mt-2">Loading provider data...</p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Provider Status & Type</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Status</label>
                      <select
                        value={basicInfoForm.status}
                        onChange={(e) => setBasicInfoForm({ ...basicInfoForm, status: e.target.value as typeof basicInfoForm.status })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="inactive">Inactive</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Provider Type</label>
                      <select
                        value={basicInfoForm.providerType}
                        onChange={(e) => setBasicInfoForm({ ...basicInfoForm, providerType: e.target.value as typeof basicInfoForm.providerType })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="individual">Individual</option>
                        <option value="business">Business</option>
                        <option value="agency">Agency</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Profile Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Profile Visibility</label>
                      <select
                        value={basicInfoForm.settings.profileVisibility}
                        onChange={(e) => setBasicInfoForm({
                          ...basicInfoForm,
                          settings: { ...basicInfoForm.settings, profileVisibility: e.target.value as typeof basicInfoForm.settings.profileVisibility }
                        })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="verified_only">Verified Only</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={basicInfoForm.settings.showContactInfo}
                          onChange={(e) => setBasicInfoForm({
                            ...basicInfoForm,
                            settings: { ...basicInfoForm.settings, showContactInfo: e.target.checked }
                          })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-xs text-gray-700">Show Contact Info</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={basicInfoForm.settings.showPricing}
                          onChange={(e) => setBasicInfoForm({
                            ...basicInfoForm,
                            settings: { ...basicInfoForm.settings, showPricing: e.target.checked }
                          })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-xs text-gray-700">Show Pricing</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={basicInfoForm.settings.showReviews}
                          onChange={(e) => setBasicInfoForm({
                            ...basicInfoForm,
                            settings: { ...basicInfoForm.settings, showReviews: e.target.checked }
                          })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-xs text-gray-700">Show Reviews</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={basicInfoForm.settings.allowDirectBooking}
                          onChange={(e) => setBasicInfoForm({
                            ...basicInfoForm,
                            settings: { ...basicInfoForm.settings, allowDirectBooking: e.target.checked }
                          })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-xs text-gray-700">Allow Direct Booking</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={basicInfoForm.settings.requireApproval}
                          onChange={(e) => setBasicInfoForm({
                            ...basicInfoForm,
                            settings: { ...basicInfoForm.settings, requireApproval: e.target.checked }
                          })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-xs text-gray-700">Require Approval</span>
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Business Info Tab */}
        {activeTab === 'business' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {loadingProviderData ? (
              <div className="text-center py-8">
                <Loading />
                <p className="text-sm text-gray-500 mt-2">Loading business data...</p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Business Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Business Name *</label>
                      <input
                        type="text"
                        value={businessInfoForm.businessName || ''}
                        onChange={(e) => setBusinessInfoForm({ ...businessInfoForm, businessName: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
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
                          value={businessInfoForm.yearEstablished || ''}
                          onChange={(e) => setBusinessInfoForm({ ...businessInfoForm, yearEstablished: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Number of Employees</label>
                        <input
                          type="number"
                          value={businessInfoForm.numberOfEmployees || ''}
                          onChange={(e) => setBusinessInfoForm({ ...businessInfoForm, numberOfEmployees: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Business Description</label>
                      <textarea
                        value={businessInfoForm.businessDescription || ''}
                        onChange={(e) => setBusinessInfoForm({ ...businessInfoForm, businessDescription: e.target.value })}
                        rows={3}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Business Address</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Street</label>
                      <input
                        type="text"
                        value={businessInfoForm.businessAddress?.street || ''}
                        onChange={(e) => setBusinessInfoForm({
                          ...businessInfoForm,
                          businessAddress: { ...(businessInfoForm.businessAddress || {}), street: e.target.value }
                        })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">City</label>
                        <input
                          type="text"
                          value={businessInfoForm.businessAddress?.city || ''}
                          onChange={(e) => setBusinessInfoForm({
                            ...businessInfoForm,
                            businessAddress: { ...(businessInfoForm.businessAddress || {}), city: e.target.value }
                          })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">State</label>
                        <input
                          type="text"
                          value={businessInfoForm.businessAddress?.state || ''}
                          onChange={(e) => setBusinessInfoForm({
                            ...businessInfoForm,
                            businessAddress: { ...(businessInfoForm.businessAddress || {}), state: e.target.value }
                          })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Zip Code</label>
                        <input
                          type="text"
                          value={businessInfoForm.businessAddress?.zipCode || ''}
                          onChange={(e) => setBusinessInfoForm({
                            ...businessInfoForm,
                            businessAddress: { ...(businessInfoForm.businessAddress || {}), zipCode: e.target.value }
                          })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Country</label>
                        <input
                          type="text"
                          value={businessInfoForm.businessAddress?.country || ''}
                          onChange={(e) => setBusinessInfoForm({
                            ...businessInfoForm,
                            businessAddress: { ...(businessInfoForm.businessAddress || {}), country: e.target.value }
                          })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Latitude</label>
                        <input
                          type="number"
                          step="any"
                        value={businessInfoForm.businessAddress?.coordinates?.lat || ''}
                        onChange={(e) => setBusinessInfoForm({
                          ...businessInfoForm,
                          businessAddress: {
                            ...(businessInfoForm.businessAddress || {}),
                            coordinates: {
                              ...(businessInfoForm.businessAddress?.coordinates || {}),
                              lat: e.target.value ? parseFloat(e.target.value) : undefined
                            }
                          }
                        })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Longitude</label>
                        <input
                          type="number"
                          step="any"
                        value={businessInfoForm.businessAddress?.coordinates?.lng || ''}
                        onChange={(e) => setBusinessInfoForm({
                          ...businessInfoForm,
                          businessAddress: {
                            ...(businessInfoForm.businessAddress || {}),
                            coordinates: {
                              ...(businessInfoForm.businessAddress?.coordinates || {}),
                              lng: e.target.value ? parseFloat(e.target.value) : undefined
                            }
                          }
                        })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

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
                                const newCategory = e.target.value as ServiceCategory | undefined;
                                const newSpecialties = [...(professionalInfoForm.specialties || [])];
                                // Only clear skills if category is actually changing (not initial load)
                                const isCategoryChange = specialty.category && specialty.category !== newCategory;
                                newSpecialties[index] = { 
                                  ...specialty, 
                                  category: newCategory || undefined, 
                                  skills: isCategoryChange ? [] : specialty.skills // Preserve skills if not changing category
                                };
                                setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                                // Fetch skills for the new category
                                if (newCategory) {
                                  fetchSkillsForCategory(newCategory);
                                }
                              }}
                              disabled={loadingCategories}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                            >
                              <option value="">
                                {loadingCategories ? 'Loading categories...' : 'Select category'}
                              </option>
                              {serviceCategories.map((cat) => (
                                <option key={cat.key} value={cat.key}>
                                  {cat.name}
                                </option>
                              ))}
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

                        {/* Skills */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Skills</label>
                          {specialty.category ? (
                            <>
                              {/* Always show skills if they exist, even if not loaded yet */}
                              {specialty.skills && specialty.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {specialty.skills.map((skillIdOrObj: string | { _id?: string; id?: string; name?: string }, skillIdx) => {
                                    // Handle both string IDs and object IDs
                                    const skillId = typeof skillIdOrObj === 'string' ? skillIdOrObj : (skillIdOrObj?._id || skillIdOrObj?.id || String(skillIdOrObj));
                                    // Find skill name from available skills or use ID as fallback
                                    const skill = availableSkills[specialty.category!]?.find(s => s._id === skillId || s.id === skillId);
                                    const skillObjName = (typeof skillIdOrObj === 'object' && skillIdOrObj !== null) ? (skillIdOrObj as { name?: string; _id?: string; id?: string })?.name : undefined;
                                    const skillName = skill?.name || skillObjName || skillId;
                                    return (
                                      <span key={skillIdx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                                        {skillName}
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
                                    );
                                  })}
                                </div>
                              )}
                              <select
                                key={`skill-select-${index}-${specialty.skills?.length || 0}`}
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    const skillId = e.target.value;
                                    // Normalize skill IDs for comparison
                                    const normalizedSkills = specialty.skills?.map(s => {
                                      if (typeof s === 'string') return s;
                                      return (s as { _id?: string; id?: string })?._id || (s as { _id?: string; id?: string })?.id || String(s);
                                    }) || [];
                                    // Check if skill already added
                                    if (!normalizedSkills.includes(skillId)) {
                                      const newSpecialties = [...(professionalInfoForm.specialties || [])];
                                      newSpecialties[index] = {
                                        ...specialty,
                                        skills: [...(specialty.skills || []), skillId]
                                      };
                                      setProfessionalInfoForm({ ...professionalInfoForm, specialties: newSpecialties });
                                    }
                                  }
                                }}
                                disabled={loadingSkills[specialty.category!]}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                              >
                                <option value="">
                                  {loadingSkills[specialty.category!] ? 'Loading skills...' : 'Select a skill to add'}
                                </option>
                                {availableSkills[specialty.category!]?.map((skill) => {
                                  // Normalize skill IDs for comparison
                                  const normalizedSkills = specialty.skills?.map(s => {
                                    if (typeof s === 'string') return s;
                                    return (s as { _id?: string; id?: string })?._id || (s as { _id?: string; id?: string })?.id || String(s);
                                  }) || [];
                                  const skillId = skill._id || skill.id || '';
                                  // Don't show already selected skills
                                  if (normalizedSkills.includes(skillId)) {
                                    return null;
                                  }
                                  return (
                                    <option key={skillId} value={skillId}>
                                      {skill.name}
                                    </option>
                                  );
                                })}
                              </select>
                            </>
                          ) : (
                            <p className="text-xs text-gray-500">Select a category first to load skills</p>
                          )}
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

        {/* Onboarding Tab */}
        {activeTab === 'onboarding' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {loadingProviderData ? (
              <div className="text-center py-8">
                <Loading />
                <p className="text-sm text-gray-500 mt-2">Loading onboarding data...</p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Onboarding Status</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={onboardingForm.completed}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, completed: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-xs text-gray-700">Completed</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Current Step</label>
                      <input
                        type="text"
                        value={onboardingForm.currentStep}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, currentStep: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Progress (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={onboardingForm.progress}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, progress: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Onboarding Steps</h3>
                  <div className="space-y-2">
                    {onboardingForm.steps.map((step, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-0.5">Step Name</label>
                            <input
                              type="text"
                              value={step.step || ''}
                              onChange={(e) => {
                                const newSteps = [...onboardingForm.steps];
                                newSteps[index] = { ...step, step: e.target.value };
                                setOnboardingForm({ ...onboardingForm, steps: newSteps });
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="flex items-center space-x-2 mt-5">
                              <input
                                type="checkbox"
                                checked={step.completed || false}
                                onChange={(e) => {
                                  const newSteps = [...onboardingForm.steps];
                                  newSteps[index] = { ...step, completed: e.target.checked };
                                  setOnboardingForm({ ...onboardingForm, steps: newSteps });
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="text-xs text-gray-700">Completed</span>
                            </label>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-0.5">Completed At</label>
                            <input
                              type="datetime-local"
                              value={step.completedAt ? new Date(step.completedAt).toISOString().slice(0, 16) : ''}
                              onChange={(e) => {
                                const newSteps = [...onboardingForm.steps];
                                newSteps[index] = { ...step, completedAt: e.target.value ? new Date(e.target.value).toISOString() : '' };
                                setOnboardingForm({ ...onboardingForm, steps: newSteps });
                              }}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newSteps = onboardingForm.steps.filter((_, i) => i !== index);
                            setOnboardingForm({ ...onboardingForm, steps: newSteps });
                          }}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove Step
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setOnboardingForm({
                          ...onboardingForm,
                          steps: [...onboardingForm.steps, { step: '', completed: false, completedAt: '', data: {} }]
                        });
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      + Add Step
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Metadata Tab */}
        {activeTab === 'metadata' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {loadingProviderData ? (
              <div className="text-center py-8">
                <Loading />
                <p className="text-sm text-gray-500 mt-2">Loading metadata...</p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Profile Metadata</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Last Active</label>
                      <input
                        type="datetime-local"
                        value={metadataForm.lastActive ? new Date(metadataForm.lastActive).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setMetadataForm({ ...metadataForm, lastActive: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Profile Views</label>
                      <input
                        type="number"
                        min="0"
                        value={metadataForm.profileViews}
                        onChange={(e) => setMetadataForm({ ...metadataForm, profileViews: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Search Ranking</label>
                      <input
                        type="number"
                        min="0"
                        value={metadataForm.searchRanking}
                        onChange={(e) => setMetadataForm({ ...metadataForm, searchRanking: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={metadataForm.featured}
                          onChange={(e) => setMetadataForm({ ...metadataForm, featured: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-xs text-gray-700">Featured</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={metadataForm.promoted}
                          onChange={(e) => setMetadataForm({ ...metadataForm, promoted: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-xs text-gray-700">Promoted</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {metadataForm.tags.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            const newTags = metadataForm.tags.filter((_, i) => i !== idx);
                            setMetadataForm({ ...metadataForm, tags: newTags });
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
                    placeholder="Add tag (press Enter)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        e.preventDefault();
                        setMetadataForm({
                          ...metadataForm,
                          tags: [...metadataForm.tags, e.currentTarget.value.trim()]
                        });
                        e.currentTarget.value = '';
                      }
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Admin Notes</h3>
                  <textarea
                    value={metadataForm.notes}
                    onChange={(e) => setMetadataForm({ ...metadataForm, notes: e.target.value })}
                    rows={4}
                    placeholder="Admin notes about this provider..."
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {loadingProviderData ? (
              <div className="text-center py-8">
                <Loading />
                <p className="text-sm text-gray-500 mt-2">Loading verification data...</p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Verification Status</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={verificationForm.identityVerified}
                        onChange={(e) => setVerificationForm({ ...verificationForm, identityVerified: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-xs text-gray-700">Identity Verified</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={verificationForm.businessVerified}
                        onChange={(e) => setVerificationForm({ ...verificationForm, businessVerified: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-xs text-gray-700">Business Verified</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Background Check</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Status</label>
                      <select
                        value={verificationForm.backgroundCheck.status}
                        onChange={(e) => setVerificationForm({
                          ...verificationForm,
                          backgroundCheck: { ...verificationForm.backgroundCheck, status: e.target.value as typeof verificationForm.backgroundCheck.status }
                        })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="passed">Passed</option>
                        <option value="failed">Failed</option>
                        <option value="not_required">Not Required</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Date Completed</label>
                      <input
                        type="date"
                        value={verificationForm.backgroundCheck.dateCompleted ? new Date(verificationForm.backgroundCheck.dateCompleted).toISOString().split('T')[0] : ''}
                        onChange={(e) => setVerificationForm({
                          ...verificationForm,
                          backgroundCheck: { ...verificationForm.backgroundCheck, dateCompleted: e.target.value ? new Date(e.target.value).toISOString() : undefined }
                        })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Report ID</label>
                      <input
                        type="text"
                        value={verificationForm.backgroundCheck.reportId || ''}
                        onChange={(e) => setVerificationForm({
                          ...verificationForm,
                          backgroundCheck: { ...verificationForm.backgroundCheck, reportId: e.target.value }
                        })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Insurance</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={verificationForm.insurance.hasInsurance}
                        onChange={(e) => setVerificationForm({
                          ...verificationForm,
                          insurance: { ...verificationForm.insurance, hasInsurance: e.target.checked }
                        })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-xs text-gray-700">Has Insurance</span>
                    </label>
                    {verificationForm.insurance.hasInsurance && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">Insurance Provider</label>
                          <input
                            type="text"
                            value={verificationForm.insurance.insuranceProvider || ''}
                            onChange={(e) => setVerificationForm({
                              ...verificationForm,
                              insurance: { ...verificationForm.insurance, insuranceProvider: e.target.value }
                            })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">Policy Number</label>
                          <input
                            type="text"
                            value={verificationForm.insurance.policyNumber || ''}
                            onChange={(e) => setVerificationForm({
                              ...verificationForm,
                              insurance: { ...verificationForm.insurance, policyNumber: e.target.value }
                            })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">Coverage Amount</label>
                          <input
                            type="number"
                            min="0"
                            value={verificationForm.insurance.coverageAmount || ''}
                            onChange={(e) => setVerificationForm({
                              ...verificationForm,
                              insurance: { ...verificationForm.insurance, coverageAmount: e.target.value ? parseFloat(e.target.value) : undefined }
                            })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">Expiry Date</label>
                          <input
                            type="date"
                            value={verificationForm.insurance.expiryDate ? new Date(verificationForm.insurance.expiryDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => setVerificationForm({
                              ...verificationForm,
                              insurance: { ...verificationForm.insurance, expiryDate: e.target.value ? new Date(e.target.value).toISOString() : undefined }
                            })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Financial Info Tab */}
        {activeTab === 'financial' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {loadingProviderData ? (
              <div className="text-center py-8">
                <Loading />
                <p className="text-sm text-gray-500 mt-2">Loading financial data...</p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Bank Account</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Account Holder</label>
                      <input
                        type="text"
                        value={financialInfoForm.bankAccount?.accountHolder || ''}
                        onChange={(e) => setFinancialInfoForm({
                          ...financialInfoForm,
                          bankAccount: { ...financialInfoForm.bankAccount, accountHolder: e.target.value }
                        })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Account Number</label>
                      <input
                        type="text"
                        value={financialInfoForm.bankAccount?.accountNumber || ''}
                        onChange={(e) => setFinancialInfoForm({
                          ...financialInfoForm,
                          bankAccount: { ...financialInfoForm.bankAccount, accountNumber: e.target.value }
                        })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Routing Number</label>
                      <input
                        type="text"
                        value={financialInfoForm.bankAccount?.routingNumber || ''}
                        onChange={(e) => setFinancialInfoForm({
                          ...financialInfoForm,
                          bankAccount: { ...financialInfoForm.bankAccount, routingNumber: e.target.value }
                        })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Bank Name</label>
                      <input
                        type="text"
                        value={financialInfoForm.bankAccount?.bankName || ''}
                        onChange={(e) => setFinancialInfoForm({
                          ...financialInfoForm,
                          bankAccount: { ...financialInfoForm.bankAccount, bankName: e.target.value }
                        })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Account Type</label>
                      <select
                        value={financialInfoForm.bankAccount?.accountType || ''}
                        onChange={(e) => setFinancialInfoForm({
                          ...financialInfoForm,
                          bankAccount: { ...financialInfoForm.bankAccount, accountType: e.target.value as 'checking' | 'savings' | undefined }
                        })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select type</option>
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Tax Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">SSN</label>
                      <input
                        type="text"
                        value={financialInfoForm.taxInfo?.ssn || ''}
                        onChange={(e) => setFinancialInfoForm({
                          ...financialInfoForm,
                          taxInfo: { ...financialInfoForm.taxInfo, ssn: e.target.value }
                        })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">EIN</label>
                      <input
                        type="text"
                        value={financialInfoForm.taxInfo?.ein || ''}
                        onChange={(e) => setFinancialInfoForm({
                          ...financialInfoForm,
                          taxInfo: { ...financialInfoForm.taxInfo, ein: e.target.value }
                        })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Tax Classification</label>
                      <input
                        type="text"
                        value={financialInfoForm.taxInfo?.taxClassification || ''}
                        onChange={(e) => setFinancialInfoForm({
                          ...financialInfoForm,
                          taxInfo: { ...financialInfoForm.taxInfo, taxClassification: e.target.value }
                        })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="flex items-center space-x-2 mt-5">
                        <input
                          type="checkbox"
                          checked={financialInfoForm.taxInfo?.w9Submitted || false}
                          onChange={(e) => setFinancialInfoForm({
                            ...financialInfoForm,
                            taxInfo: { ...financialInfoForm.taxInfo, w9Submitted: e.target.checked }
                          })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-xs text-gray-700">W9 Submitted</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Settings</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Commission Rate (0-1)</label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={financialInfoForm.commissionRate || 0.1}
                        onChange={(e) => setFinancialInfoForm({ ...financialInfoForm, commissionRate: parseFloat(e.target.value) || 0.1 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Minimum Payout</label>
                      <input
                        type="number"
                        min="0"
                        value={financialInfoForm.minimumPayout || 50}
                        onChange={(e) => setFinancialInfoForm({ ...financialInfoForm, minimumPayout: parseInt(e.target.value) || 50 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {loadingProviderData ? (
              <div className="text-center py-8">
                <Loading />
                <p className="text-sm text-gray-500 mt-2">Loading preferences...</p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}

        {/* Performance Tab (Editable by Admin) */}
        {activeTab === 'performance' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {loadingProviderData ? (
              <div className="text-center py-8">
                <Loading />
                <p className="text-sm text-gray-500 mt-2">Loading performance data...</p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Performance Metrics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Rating (0-5)</label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={performanceForm.rating || ''}
                        onChange={(e) => setPerformanceForm({ ...performanceForm, rating: e.target.value ? parseFloat(e.target.value) : undefined })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Total Reviews</label>
                      <input
                        type="number"
                        min="0"
                        value={performanceForm.totalReviews || ''}
                        onChange={(e) => setPerformanceForm({ ...performanceForm, totalReviews: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Total Jobs</label>
                      <input
                        type="number"
                        min="0"
                        value={performanceForm.totalJobs || ''}
                        onChange={(e) => setPerformanceForm({ ...performanceForm, totalJobs: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Completed Jobs</label>
                      <input
                        type="number"
                        min="0"
                        value={performanceForm.completedJobs || ''}
                        onChange={(e) => setPerformanceForm({ ...performanceForm, completedJobs: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Cancelled Jobs</label>
                      <input
                        type="number"
                        min="0"
                        value={performanceForm.cancelledJobs || ''}
                        onChange={(e) => setPerformanceForm({ ...performanceForm, cancelledJobs: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Response Time (minutes)</label>
                      <input
                        type="number"
                        min="0"
                        value={performanceForm.responseTime || ''}
                        onChange={(e) => setPerformanceForm({ ...performanceForm, responseTime: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Completion Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={performanceForm.completionRate || ''}
                        onChange={(e) => setPerformanceForm({ ...performanceForm, completionRate: e.target.value ? parseFloat(e.target.value) : undefined })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Repeat Customer Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={performanceForm.repeatCustomerRate || ''}
                        onChange={(e) => setPerformanceForm({ ...performanceForm, repeatCustomerRate: e.target.value ? parseFloat(e.target.value) : undefined })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Earnings</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Total Earnings</label>
                      <input
                        type="number"
                        min="0"
                        value={performanceForm.earnings?.total || ''}
                        onChange={(e) => setPerformanceForm({
                          ...performanceForm,
                          earnings: { ...performanceForm.earnings, total: e.target.value ? parseFloat(e.target.value) : undefined }
                        })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">This Month</label>
                      <input
                        type="number"
                        min="0"
                        value={performanceForm.earnings?.thisMonth || ''}
                        onChange={(e) => setPerformanceForm({
                          ...performanceForm,
                          earnings: { ...performanceForm.earnings, thisMonth: e.target.value ? parseFloat(e.target.value) : undefined }
                        })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Last Month</label>
                      <input
                        type="number"
                        min="0"
                        value={performanceForm.earnings?.lastMonth || ''}
                        onChange={(e) => setPerformanceForm({
                          ...performanceForm,
                          earnings: { ...performanceForm.earnings, lastMonth: e.target.value ? parseFloat(e.target.value) : undefined }
                        })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Pending</label>
                      <input
                        type="number"
                        min="0"
                        value={performanceForm.earnings?.pending || ''}
                        onChange={(e) => setPerformanceForm({
                          ...performanceForm,
                          earnings: { ...performanceForm.earnings, pending: e.target.value ? parseFloat(e.target.value) : undefined }
                        })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </>
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

      {/* View Provider Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedProviderForView(null);
        }}
        title={`Provider Details: ${selectedProviderForView?.firstName || ''} ${selectedProviderForView?.lastName || ''}`}
        size="xl"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowViewModal(false);
                setSelectedProviderForView(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            {selectedProviderForView?._id && (
              <button
                onClick={() => {
                  setShowViewModal(false);
                  if (selectedProviderForView._id) {
                    handleEditProvider(selectedProviderForView._id);
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Edit Provider
              </button>
            )}
          </div>
        }
      >
        {loadingViewData ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : selectedProviderForView ? (
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
            {/* Basic Information */}
            <div className="border-b border-gray-200 pb-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600 mb-0.5">Name</p>
                  <p className="text-xs font-medium text-gray-900">
                    {selectedProviderForView.firstName} {selectedProviderForView.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-0.5">Email</p>
                  <p className="text-xs font-medium text-gray-900">{selectedProviderForView.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-0.5">Phone</p>
                  <p className="text-xs font-medium text-gray-900">{selectedProviderForView.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-0.5">Provider Type</p>
                  <p className="text-xs font-medium text-gray-900 capitalize">
                    {selectedProviderForView.providerType || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-0.5">Status</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    selectedProviderForView.status === 'active' ? 'bg-green-100 text-green-800' :
                    selectedProviderForView.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedProviderForView.status === 'suspended' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedProviderForView.status || 'N/A'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-0.5">Verification Status</p>
                  <p className="text-xs font-medium text-gray-900 capitalize">
                    {selectedProviderForView.verificationStatus || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Business Information */}
            {selectedProviderForView.businessInfo && (
              <div className="border-b border-gray-200 pb-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Business Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Business Name</p>
                    <p className="text-xs font-medium text-gray-900">
                      {selectedProviderForView.businessInfo.businessName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Business Type</p>
                    <p className="text-xs font-medium text-gray-900">
                      {selectedProviderForView.businessInfo.businessType || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Business Email</p>
                    <p className="text-xs font-medium text-gray-900">
                      {selectedProviderForView.businessInfo.businessEmail || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Business Phone</p>
                    <p className="text-xs font-medium text-gray-900">
                      {selectedProviderForView.businessInfo.businessPhone || 'N/A'}
                    </p>
                  </div>
                  {selectedProviderForView.businessInfo.businessAddress && (
                    <>
                      <div>
                        <p className="text-xs text-gray-600 mb-0.5">Address</p>
                        <p className="text-xs font-medium text-gray-900">
                          {selectedProviderForView.businessInfo.businessAddress.street || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-0.5">City, State</p>
                        <p className="text-xs font-medium text-gray-900">
                          {selectedProviderForView.businessInfo.businessAddress.city || ''}{' '}
                          {selectedProviderForView.businessInfo.businessAddress.state || ''}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Professional Information */}
            {selectedProviderForView.professionalInfo && (
              <div className="border-b border-gray-200 pb-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Professional Information</h3>
                <div className="space-y-2">
                  {selectedProviderForView.professionalInfo.specialties && selectedProviderForView.professionalInfo.specialties.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Specialties</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedProviderForView.professionalInfo.specialties.map((spec, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                            {typeof spec === 'string' ? spec : 
                             (spec as { name?: string; category?: { name?: string } }).name || 
                             (spec as { category?: { name?: string } }).category?.name || 
                             'N/A'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedProviderForView.professionalInfo.languages && selectedProviderForView.professionalInfo.languages.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Languages</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedProviderForView.professionalInfo.languages.map((lang, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            {selectedProviderForView.performance && (
              <div className="border-b border-gray-200 pb-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedProviderForView.profile?.rating && (
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Rating</p>
                      <p className="text-xs font-medium text-gray-900">
                        {selectedProviderForView.profile.rating.toFixed(1)} ⭐
                      </p>
                    </div>
                  )}
                  {selectedProviderForView.profile?.totalReviews !== undefined && (
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Total Reviews</p>
                      <p className="text-xs font-medium text-gray-900">
                        {selectedProviderForView.profile.totalReviews}
                      </p>
                    </div>
                  )}
                  {selectedProviderForView.performance.completionRate !== undefined && (
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Completion Rate</p>
                      <p className="text-xs font-medium text-gray-900">
                        {selectedProviderForView.performance.completionRate}%
                      </p>
                    </div>
                  )}
                  {selectedProviderForView.metadata?.profileViews !== undefined && (
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Profile Views</p>
                      <p className="text-xs font-medium text-gray-900">
                        {selectedProviderForView.metadata.profileViews}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600 mb-0.5">Trust Score</p>
                  <p className="text-xs font-medium text-gray-900">
                    {selectedProviderForView.trustScore || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-0.5">Created At</p>
                  <p className="text-xs font-medium text-gray-900">
                    {selectedProviderForView.createdAt ? new Date(selectedProviderForView.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                {selectedProviderForView.subscription && (
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Subscription</p>
                    <p className="text-xs font-medium text-gray-900">
                      {selectedProviderForView.subscription.type || 'N/A'} - {
                        selectedProviderForView.subscription.isActive ? 'Active' : 'Inactive'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            No provider data available
          </div>
        )}
      </Modal>
    </div>
  );
}
