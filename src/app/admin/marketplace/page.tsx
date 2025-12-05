"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { 
  Search, 
  Edit, 
  Trash2, 
  RefreshCw,
  Filter,
  Download,
  Plus,
  Eye,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  X,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { 
  Service, 
  ServiceCategory, 
  ServicePricing, 
  ServiceImage,
  PricingType,
  ServiceType,
  DayOfWeek,
  ScheduleDay
} from "@/types/services";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";

// Type for API service response (raw data from backend)
interface ApiServiceData {
  _id?: string;
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  provider?: string | { 
    _id?: string; 
    id?: string;
    firstName?: string;
    lastName?: string;
  };
  pricing?: ServicePricing;
  serviceArea?: string[];
  images?: ServiceImage[];
  features?: string[];
  requirements?: string[];
  serviceType?: ServiceType;
  estimatedDuration?: { min?: number; max?: number };
  teamSize?: number;
  equipmentProvided?: boolean;
  materialsIncluded?: boolean;
  warranty?: { hasWarranty?: boolean; duration?: number; description?: string };
  insurance?: { covered?: boolean; coverageAmount?: number };
  emergencyService?: { available?: boolean; surcharge?: number; responseTime?: string };
  servicePackages?: Array<{ name?: string; description?: string; price?: number; features?: string[]; duration?: number }>;
  addOns?: Array<{ name?: string; description?: string; price?: number; category?: string }>;
  isActive?: boolean;
  rating?: { average?: number; count?: number };
  availability?: { 
    schedule?: Array<{ 
      _id?: string;
      day?: string; 
      startTime?: string; 
      endTime?: string; 
      isAvailable?: boolean;
    }>; 
    timezone?: string;
  };
  createdAt?: string | Date;
  updatedAt?: string | Date;
  __v?: number;
}

// Helper function to transform API service data to frontend format
const transformServiceData = (apiService: ApiServiceData): Service => {
  const service: Service = {
    _id: apiService._id,
    title: apiService.title || '',
    description: apiService.description || '',
    category: apiService.category as ServiceCategory || 'other',
    subcategory: apiService.subcategory || '',
    provider: typeof apiService.provider === 'string' 
      ? apiService.provider 
      : apiService.provider?._id || apiService.provider?.id || '',
    pricing: apiService.pricing || {
      type: 'fixed' as PricingType,
      basePrice: 0,
      currency: 'PHP'
    },
    serviceArea: apiService.serviceArea || [],
    images: apiService.images || [],
    features: apiService.features || [],
    requirements: apiService.requirements || [],
    serviceType: apiService.serviceType,
    estimatedDuration: apiService.estimatedDuration,
    teamSize: apiService.teamSize,
    equipmentProvided: apiService.equipmentProvided,
    materialsIncluded: apiService.materialsIncluded,
    warranty: apiService.warranty,
    insurance: apiService.insurance,
    emergencyService: apiService.emergencyService,
    servicePackages: apiService.servicePackages,
    addOns: apiService.addOns,
    isActive: apiService.isActive !== undefined ? apiService.isActive : true,
    rating: apiService.rating,
    createdAt: apiService.createdAt ? new Date(apiService.createdAt) : new Date(),
    updatedAt: apiService.updatedAt ? new Date(apiService.updatedAt) : new Date(),
  };

  if (apiService.availability) {
    const validDayOfWeek = (day: string | undefined): DayOfWeek | undefined => {
      if (!day) return undefined;
      const validDays: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      return validDays.includes(day.toLowerCase() as DayOfWeek) ? (day.toLowerCase() as DayOfWeek) : undefined;
    };

    const transformedSchedule: ScheduleDay[] | undefined = apiService.availability.schedule?.map((scheduleItem) => ({
      day: validDayOfWeek(scheduleItem.day),
      startTime: scheduleItem.startTime,
      endTime: scheduleItem.endTime,
      isAvailable: scheduleItem.isAvailable,
    }));

    service.availability = {
      schedule: transformedSchedule,
      timezone: apiService.availability.timezone,
    };
  }

  return service;
};

export default function MarketplacePage() {
  // App settings for currency formatting and other settings
  const { settings: appSettings } = useAppSettings();
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [slowRequest, setSlowRequest] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'category' | 'createdAt' | 'price'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // "all", "active", "inactive"

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imageUploadModalOpen, setImageUploadModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedServiceDetails, setSelectedServiceDetails] = useState<Service | null>(null);
  const [loadingServiceDetails, setLoadingServiceDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Form data states
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    category: 'other' as ServiceCategory,
    subcategory: '',
    pricingType: 'fixed' as PricingType,
    basePrice: '',
    currency: getDefaultCurrency(appSettings),
    serviceArea: '',
    serviceType: 'one_time' as ServiceType,
    isActive: true
  });

  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    category: 'other' as ServiceCategory,
    subcategory: '',
    pricingType: 'fixed' as PricingType,
    basePrice: '',
    currency: getDefaultCurrency(appSettings),
    serviceArea: '',
    serviceType: 'one_time' as ServiceType,
    isActive: true
  });

  const fetchData = useCallback(async () => {
    let slowRequestTimer: NodeJS.Timeout | null = null;
    let servicesUrl = '';
    
    try {
      setLoading(true);
      setError(null);
      setSlowRequest(false);

      // Set a timer to show slow request warning
      slowRequestTimer = setTimeout(() => {
        setSlowRequest(true);
      }, 10000);

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.set('page', currentPage.toString());
      queryParams.set('limit', itemsPerPage.toString());
      if (searchTerm) queryParams.set('search', searchTerm);
      if (categoryFilter !== 'all') queryParams.set('category', categoryFilter);
      if (statusFilter !== 'all') queryParams.set('isActive', statusFilter === 'active' ? 'true' : 'false');
      queryParams.set('sortBy', sortBy);
      queryParams.set('sortOrder', sortOrder);

      if (!getApiToken()) {
        logger.warn('No API token found, cannot fetch services');
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }
      
      const servicesQuery = new URLSearchParams(Object.fromEntries(queryParams)).toString();
      servicesUrl = `${API_BASE_URL}${API_ENDPOINTS.marketplaceServices}${servicesQuery ? `?${servicesQuery}` : ''}`;
      
      logger.debug('Fetching services', { 
        servicesUrl, 
        queryParams: Object.fromEntries(queryParams),
        apiBaseUrl: API_BASE_URL,
        endpoint: API_ENDPOINTS.marketplaceServices
      });
      
      const dataResponse = await fetch(servicesUrl, createAuthFetchOptions({ method: 'GET' }));

      if (!dataResponse.ok) {
        const errorText = await dataResponse.text().catch(() => '');
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${dataResponse.status}: ${dataResponse.statusText}` };
        }
        logger.error('Failed to fetch services', new Error(errorData.error || errorData.message || 'Failed to fetch services data'), {
          status: dataResponse.status,
          statusText: dataResponse.statusText,
          url: servicesUrl,
          errorData
        });
        throw new Error(errorData.error || errorData.message || `HTTP ${dataResponse.status}: Failed to fetch services data`);
      }

      const dataResult = await dataResponse.json();

      // Log the response for debugging
      logger.debug('Services API response', { 
        hasSuccess: !!dataResult.success,
        hasData: !!dataResult.data,
        dataType: Array.isArray(dataResult.data) ? 'array' : typeof dataResult.data,
        dataKeys: dataResult.data ? Object.keys(dataResult.data) : []
      });

      // Transform the API response data
      let servicesData: Service[] = [];
      let totalCount = 0;

      // Handle different response structures
      if (dataResult.success && dataResult.data) {
        if (dataResult.data.services && Array.isArray(dataResult.data.services)) {
          servicesData = dataResult.data.services.map(transformServiceData);
          totalCount = dataResult.data.pagination?.total || dataResult.data.services.length;
        } else if (Array.isArray(dataResult.data)) {
          servicesData = dataResult.data.map(transformServiceData);
          totalCount = dataResult.total || dataResult.data.length;
        }
      } else if (Array.isArray(dataResult)) {
        servicesData = dataResult.map(transformServiceData);
        totalCount = dataResult.length;
      } else if (dataResult.data) {
        if (Array.isArray(dataResult.data)) {
          servicesData = dataResult.data.map(transformServiceData);
          totalCount = dataResult.total || dataResult.data.length;
        } else if (dataResult.data.services && Array.isArray(dataResult.data.services)) {
          servicesData = dataResult.data.services.map(transformServiceData);
          totalCount = dataResult.data.pagination?.total || dataResult.data.services.length;
        }
      } else if (Array.isArray(dataResult.services)) {
        servicesData = dataResult.services.map(transformServiceData);
        totalCount = dataResult.pagination?.total || dataResult.services.length;
      }

      setServices(servicesData);
      setTotalCount(totalCount);
      setLastUpdated(new Date());
    } catch (err) {
      logger.error('Error fetching services data', err instanceof Error ? err : new Error(String(err)), {
        url: servicesUrl,
        error: err instanceof Error ? err.message : String(err)
      });
      let errorMessage = 'Failed to load services data';
      
      if (err instanceof Error) {
        if (err.message.includes('timed out')) {
          errorMessage = 'Request timed out. The server may be slow. Please try again.';
        } else if (err.message.includes('aborted')) {
          errorMessage = 'Request was cancelled. Please try again.';
        } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          errorMessage = 'Unauthorized. Please check your authentication.';
        } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
          errorMessage = 'Access forbidden. You may not have permission to view services.';
        } else if (err.message.includes('404')) {
          errorMessage = 'Services endpoint not found. Please check the API configuration.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setServices([]);
      setTotalCount(0);
    } finally {
      if (slowRequestTimer) {
        clearTimeout(slowRequestTimer);
      }
      setLoading(false);
      setSlowRequest(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, categoryFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (err) {
      logger.error('Error refreshing data', err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to refresh services data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSort = (field: 'title' | 'category' | 'createdAt' | 'price') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewService = async (serviceId: string) => {
    try {
      setLoadingServiceDetails(true);
      if (!getApiToken()) return;
      
      // Validate serviceId format
      if (!serviceId || typeof serviceId !== 'string') {
        throw new Error('Invalid service ID');
      }
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceServiceById}/${serviceId}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Failed to fetch service details: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Safely parse JSON response
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error('Invalid JSON response from server');
      }
      
      // Safely extract service data from response structure
      // Response format: { success: true, data: { ...service data... } }
      let serviceData;
      try {
        // Handle nested structure: data contains the service
        if (result.data) {
          serviceData = result.data;
          // Map 'id' to '_id' if present (API might use 'id' instead of '_id')
          if (serviceData.id && !serviceData._id) {
            serviceData._id = serviceData.id;
          }
        } else {
          // Fallback: use result directly
          serviceData = result;
          if (serviceData.id && !serviceData._id) {
            serviceData._id = serviceData.id;
          }
        }
      } catch {
        throw new Error('Invalid service data structure');
      }
      
      // Ensure serviceData is a plain object before transformation
      if (!serviceData || typeof serviceData !== 'object' || Array.isArray(serviceData)) {
        throw new Error('Invalid service data received');
      }
      
      // Safely transform the service data with error handling
      let transformedService;
      try {
        transformedService = transformServiceData(serviceData);
      } catch {
        // If transformation fails (e.g., due to ObjectId in data), throw a safe error
        throw new Error('Failed to process service data');
      }
      
      setSelectedServiceDetails(transformedService);
      setViewModalOpen(true);
    } catch {
      // Completely avoid accessing error object to prevent ObjectId serialization issues
      // Don't try to extract message, don't convert to string, just use a safe default
      const errorMessage = 'Failed to fetch service details';
      
      // Create a completely clean error object with only the safe message
      // Never pass the original error to logger as it might contain ObjectId instances
      const cleanError = new Error(errorMessage);
      logger.error('Error fetching service details', cleanError);
      toast.error(errorMessage);
    } finally {
      setLoadingServiceDetails(false);
    }
  };

  const handleCreateService = async () => {
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      if (!createFormData.title || !createFormData.description) {
        toast.error('Please fill in all required fields');
        return;
      }

      const formData = {
        title: createFormData.title,
        description: createFormData.description,
        category: createFormData.category,
        subcategory: createFormData.subcategory,
        pricing: {
          type: createFormData.pricingType,
          basePrice: parseFloat(createFormData.basePrice) || 0,
          currency: createFormData.currency
        },
        serviceArea: createFormData.serviceArea ? createFormData.serviceArea.split(',').map(s => s.trim()).filter(s => s) : [],
        serviceType: createFormData.serviceType,
        isActive: createFormData.isActive
      };

      const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceServices}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify(formData)
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create service');
      }

      toast.success('Service created successfully');
      setCreateModalOpen(false);
      setCreateFormData({
        title: '',
        description: '',
        category: 'other',
        subcategory: '',
        pricingType: 'fixed',
        basePrice: '',
        currency: getDefaultCurrency(appSettings),
        serviceArea: '',
        serviceType: 'one_time',
        isActive: true
      });
      await fetchData();
    } catch (err) {
      logger.error('Error creating service', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to create service');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateService = async () => {
    if (!selectedService?._id) return;
    
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      if (!editFormData.title || !editFormData.description) {
        toast.error('Please fill in all required fields');
        return;
      }

      const formData = {
        title: editFormData.title,
        description: editFormData.description,
        category: editFormData.category,
        subcategory: editFormData.subcategory,
        pricing: {
          type: editFormData.pricingType,
          basePrice: parseFloat(editFormData.basePrice) || 0,
          currency: editFormData.currency
        },
        serviceArea: editFormData.serviceArea ? editFormData.serviceArea.split(',').map(s => s.trim()).filter(s => s) : [],
        serviceType: editFormData.serviceType,
        isActive: editFormData.isActive
      };

      const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceServiceById}/${selectedService._id}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify(formData)
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update service');
      }

      toast.success('Service updated successfully');
      setEditModalOpen(false);
      setSelectedService(null);
      await fetchData();
    } catch (err) {
      logger.error('Error updating service', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to update service');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async () => {
    if (!selectedService?._id) return;
    
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceServiceById}/${selectedService._id}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'DELETE' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete service');
      }

      toast.success('Service deleted successfully');
      setDeleteModalOpen(false);
      setSelectedService(null);
      await fetchData();
    } catch (err) {
      logger.error('Error deleting service', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to delete service');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveService = async () => {
    if (!selectedService?._id) return;

    try {
      setSubmitting(true);
      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.marketplaceServiceApprove.replace('[id]', selectedService._id)}/approve`,
        createAuthFetchOptions({ method: 'PUT' })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to approve service');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Service approved successfully');
        setApproveModalOpen(false);
        setSelectedService(null);
        await fetchData();
      } else {
        throw new Error(result.error || 'Failed to approve service');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error approving service', error);
      toast.error(`Failed to approve service: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectService = async () => {
    if (!selectedService?._id) return;

    try {
      setSubmitting(true);
      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.marketplaceServiceReject.replace('[id]', selectedService._id)}/reject`,
        createAuthFetchOptions({
          method: 'PUT',
          body: JSON.stringify({
            rejectionReason: rejectionReason || 'Service rejected by administrator'
          })
        })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reject service');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Service rejected successfully');
        setRejectModalOpen(false);
        setSelectedService(null);
        setRejectionReason('');
        await fetchData();
      } else {
        throw new Error(result.error || 'Failed to reject service');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error rejecting service', error);
      toast.error(`Failed to reject service: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadImages = async () => {
    if (!selectedService?._id || !selectedFiles || selectedFiles.length === 0) return;
    
    try {
      setSubmitting(true);
      const token = getApiToken();
      if (!token) {
        const error = new Error('No authentication token found');
        logger.error('Error uploading images', error, { serviceId: selectedService._id });
        toast.error('Authentication required. Please log in again.');
        return;
      }

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      // Endpoint: POST /api/marketplace/services/:id/images
      const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceServiceById}/${selectedService._id}/images`;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };
      // Don't set Content-Type for FormData - browser will set it with boundary
      
      logger.debug('Uploading images', { 
        url, 
        serviceId: selectedService._id, 
        fileCount: selectedFiles.length,
        fileNames: selectedFiles.map(f => f.name),
        fileSizes: selectedFiles.map(f => f.size)
      });

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData
        });
      } catch (networkError) {
        // Handle network errors (fetch failed)
        const error = networkError instanceof Error ? networkError : new Error(String(networkError));
        logger.error('Network error uploading images', error, {
          url,
          serviceId: selectedService._id,
          fileCount: selectedFiles.length
        });
        toast.error('Network error: Failed to connect to server. Please check your connection and try again.');
        return;
      }

      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = 'Failed to upload images';
        let errorData: { error?: string; message?: string } = {};
        
        try {
          const responseText = await response.text();
          if (responseText) {
            try {
              errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch {
              // If not JSON, use the text as error message
              errorMessage = responseText || errorMessage;
            }
          }
        } catch (parseError) {
          logger.warn('Failed to parse error response', { parseError });
        }

        const error = new Error(errorMessage);
        logger.error('Error uploading images', error, {
          url,
          serviceId: selectedService._id,
          status: response.status,
          statusText: response.statusText,
          errorData,
          fileCount: selectedFiles.length
        });

        // Provide user-friendly error messages based on status code
        if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          // Extract the specific error message from the backend if available
          const backendMessage = errorData.message || errorMessage;
          toast.error(backendMessage || 'You do not have permission to upload images for this service. Admin access may not be properly configured on the backend.');
          logger.warn('403 Forbidden when uploading images - possible backend authorization issue', {
            serviceId: selectedService._id,
            backendMessage,
            note: 'Admin users should have permission to upload images for any service according to API documentation'
          });
        } else if (response.status === 404) {
          toast.error('Service not found. Please refresh and try again.');
        } else if (response.status === 413) {
          toast.error('Image files are too large. Please select smaller images.');
        } else if (response.status === 415) {
          toast.error('Invalid file type. Please select image files only.');
        } else if (response.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error(errorMessage || 'Failed to upload images');
        }
        return;
      }

      // Success
      const result = await response.json().catch(() => ({}));
      logger.debug('Images uploaded successfully', { 
        serviceId: selectedService._id, 
        fileCount: selectedFiles.length,
        result
      });

      toast.success(`Successfully uploaded ${selectedFiles.length} image(s)`);
      setImageUploadModalOpen(false);
      setSelectedService(null);
      setSelectedFiles([]);
      await fetchData();
    } catch (err) {
      // Catch any unexpected errors
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Unexpected error uploading images', error, {
        serviceId: selectedService?._id,
        fileCount: selectedFiles?.length
      });
      toast.error(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      cleaning: 'bg-blue-100 text-blue-800',
      plumbing: 'bg-green-100 text-green-800',
      electrical: 'bg-yellow-100 text-yellow-800',
      moving: 'bg-purple-100 text-purple-800',
      landscaping: 'bg-emerald-100 text-emerald-800',
      painting: 'bg-pink-100 text-pink-800',
      carpentry: 'bg-orange-100 text-orange-800',
      flooring: 'bg-amber-100 text-amber-800',
      roofing: 'bg-red-100 text-red-800',
      hvac: 'bg-cyan-100 text-cyan-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (isActive: boolean | undefined) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loading size="xl" text="Loading services data..." />
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
    <div className="space-y-3">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Marketplace Services
          </h1>
          <p className="text-gray-600 text-sm">Manage marketplace services and listings</p>
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
            Add Service
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
                    placeholder="Search services..."
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
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
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="moving">Moving</option>
                  <option value="landscaping">Landscaping</option>
                  <option value="painting">Painting</option>
                  <option value="carpentry">Carpentry</option>
                  <option value="flooring">Flooring</option>
                  <option value="roofing">Roofing</option>
                  <option value="hvac">HVAC</option>
                  <option value="appliance_repair">Appliance Repair</option>
                  <option value="locksmith">Locksmith</option>
                  <option value="handyman">Handyman</option>
                  <option value="home_security">Home Security</option>
                  <option value="pool_maintenance">Pool Maintenance</option>
                  <option value="pest_control">Pest Control</option>
                  <option value="carpet_cleaning">Carpet Cleaning</option>
                  <option value="window_cleaning">Window Cleaning</option>
                  <option value="gutter_cleaning">Gutter Cleaning</option>
                  <option value="power_washing">Power Washing</option>
                  <option value="snow_removal">Snow Removal</option>
                  <option value="other">Other</option>
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
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="text-xs text-gray-500">
                {totalCount > 0 ? `${totalCount} services found` : `${services.length} services found`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Services</h3>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">Sort:</span>
              <button
                onClick={() => handleSort('title')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'title' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Title
                {sortBy === 'title' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('category')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'category' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Category
                {sortBy === 'category' && (
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.map((service) => (
                <tr key={service._id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        {service.images && service.images.length > 0 ? (
                          <Image 
                            src={service.images[0].url || service.images[0].thumbnail || ''} 
                            alt={service.title}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-gray-300 flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-xs font-semibold text-gray-900">
                          {service.title || 'Untitled Service'}
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-1">
                          {service.description || 'No description'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(service.category)}`}>
                      {service.category.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                    <span>
                      {formatCurrency(
                        service.pricing?.basePrice || 0,
                        service.pricing?.currency || getDefaultCurrency(appSettings),
                        { appSettings }
                      )}
                      {service.pricing?.type && ` / ${service.pricing.type}`}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.isActive)}`}>
                      {service.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    {service.createdAt ? new Date(service.createdAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <div className="flex items-center space-x-2">
                      {service._id && (
                        <>
                          <button 
                            onClick={() => handleViewService(service._id!)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View service details"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedService(service);
                              setApproveModalOpen(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Approve service"
                          >
                            <CheckCircle className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedService(service);
                              setRejectionReason('');
                              setRejectModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Reject service"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                          <button 
                          onClick={() => {
                            setSelectedService(service);
                            setEditFormData({
                              title: service.title || '',
                              description: service.description || '',
                              category: service.category || 'other',
                              subcategory: service.subcategory || '',
                              pricingType: service.pricing?.type || 'fixed',
                              basePrice: service.pricing?.basePrice?.toString() || '',
                              currency: service.pricing?.currency || getDefaultCurrency(appSettings),
                              serviceArea: service.serviceArea?.join(', ') || '',
                              serviceType: service.serviceType || 'one_time',
                              isActive: service.isActive !== undefined ? service.isActive : true
                            });
                            setEditModalOpen(true);
                          }}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit service"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedService(service);
                              setImageUploadModalOpen(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Upload images"
                          >
                            <ImageIcon className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedService(service);
                              setDeleteModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete service"
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

        {services.length === 0 && (
          <div className="text-center py-8">
            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No services found</h3>
            <p className="text-xs text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>

      {/* View Service Modal - Will be implemented in next chunk */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedServiceDetails(null);
        }}
        title="Service Details"
        size="xl"
      >
        {loadingServiceDetails ? (
          <div className="flex justify-center py-8">
            <Loading size="md" />
          </div>
        ) : selectedServiceDetails ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Title</label>
                <p className="text-sm font-semibold">{selectedServiceDetails.title || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Category</label>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedServiceDetails.category)}`}>
                  {selectedServiceDetails.category.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500">Description</label>
                <p className="text-sm">{selectedServiceDetails.description || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Price</label>
                <p className="text-sm">
                  {formatCurrency(
                    selectedServiceDetails.pricing?.basePrice || 0,
                    selectedServiceDetails.pricing?.currency || getDefaultCurrency(appSettings),
                    { appSettings }
                  )}
                  {selectedServiceDetails.pricing?.type && ` / ${selectedServiceDetails.pricing.type}`}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Status</label>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedServiceDetails.isActive)}`}>
                  {selectedServiceDetails.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Create Service Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Service"
        size="lg"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateService}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Service'}
            </button>
          </div>
        }
      >
        <CreateServiceForm 
          formData={createFormData}
          setFormData={setCreateFormData}
        />
      </Modal>

      {/* Edit Service Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedService(null);
        }}
        title="Edit Service"
        size="lg"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setEditModalOpen(false);
                setSelectedService(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateService}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Service'}
            </button>
          </div>
        }
      >
        {selectedService && (
          <EditServiceForm 
            formData={editFormData}
            setFormData={setEditFormData}
          />
        )}
      </Modal>

      {/* Delete Service Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedService(null);
        }}
        title="Delete Service"
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedService(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteService}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Deleting...' : 'Delete Service'}
            </button>
          </div>
        }
      >
        {selectedService && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete the service <strong>{selectedService.title}</strong>? 
              This action cannot be undone.
            </p>
          </div>
        )}
      </Modal>

      {/* Image Upload Modal */}
      <Modal
        isOpen={imageUploadModalOpen}
        onClose={() => {
          setImageUploadModalOpen(false);
          setSelectedService(null);
          setSelectedFiles([]);
        }}
        title="Upload Service Images"
        size="lg"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setImageUploadModalOpen(false);
                setSelectedService(null);
                setSelectedFiles([]);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadImages}
              disabled={submitting || !selectedFiles || selectedFiles.length === 0}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Uploading...' : 'Upload Images'}
            </button>
          </div>
        }
      >
        {selectedService && (
          <ImageUploadForm 
            service={selectedService}
            onFilesChange={setSelectedFiles}
            selectedFiles={selectedFiles || []}
          />
        )}
      </Modal>
    </div>
  );
}

// Create Service Form Component
function CreateServiceForm({ 
  formData, 
  setFormData
}: {
  formData: {
    title: string;
    description: string;
    category: ServiceCategory;
    subcategory: string;
    pricingType: PricingType;
    basePrice: string;
    currency: string;
    serviceArea: string;
    serviceType: ServiceType;
    isActive: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    title: string;
    description: string;
    category: ServiceCategory;
    subcategory: string;
    pricingType: PricingType;
    basePrice: string;
    currency: string;
    serviceArea: string;
    serviceType: ServiceType;
    isActive: boolean;
  }>>;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as ServiceCategory })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="cleaning">Cleaning</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="moving">Moving</option>
            <option value="landscaping">Landscaping</option>
            <option value="painting">Painting</option>
            <option value="carpentry">Carpentry</option>
            <option value="flooring">Flooring</option>
            <option value="roofing">Roofing</option>
            <option value="hvac">HVAC</option>
            <option value="appliance_repair">Appliance Repair</option>
            <option value="locksmith">Locksmith</option>
            <option value="handyman">Handyman</option>
            <option value="home_security">Home Security</option>
            <option value="pool_maintenance">Pool Maintenance</option>
            <option value="pest_control">Pest Control</option>
            <option value="carpet_cleaning">Carpet Cleaning</option>
            <option value="window_cleaning">Window Cleaning</option>
            <option value="gutter_cleaning">Gutter Cleaning</option>
            <option value="power_washing">Power Washing</option>
            <option value="snow_removal">Snow Removal</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Subcategory</label>
          <input
            type="text"
            value={formData.subcategory}
            onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Pricing Type *</label>
          <select
            value={formData.pricingType}
            onChange={(e) => setFormData({ ...formData, pricingType: e.target.value as PricingType })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="fixed">Fixed</option>
            <option value="hourly">Hourly</option>
            <option value="per_sqft">Per Square Foot</option>
            <option value="per_item">Per Item</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Base Price *</label>
          <input
            type="number"
            step="0.01"
            value={formData.basePrice}
            onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Currency</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="PHP">PHP</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
        <select
          value={formData.serviceType}
          onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as ServiceType })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="one_time">One Time</option>
          <option value="recurring">Recurring</option>
          <option value="emergency">Emergency</option>
          <option value="maintenance">Maintenance</option>
          <option value="installation">Installation</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Service Area (comma-separated)</label>
        <input
          type="text"
          value={formData.serviceArea}
          onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
          placeholder="e.g., New York, Los Angeles"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

// Edit Service Form Component
function EditServiceForm({ 
  formData, 
  setFormData
}: {
  formData: {
    title: string;
    description: string;
    category: ServiceCategory;
    subcategory: string;
    pricingType: PricingType;
    basePrice: string;
    currency: string;
    serviceArea: string;
    serviceType: ServiceType;
    isActive: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    title: string;
    description: string;
    category: ServiceCategory;
    subcategory: string;
    pricingType: PricingType;
    basePrice: string;
    currency: string;
    serviceArea: string;
    serviceType: ServiceType;
    isActive: boolean;
  }>>;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as ServiceCategory })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="cleaning">Cleaning</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="moving">Moving</option>
            <option value="landscaping">Landscaping</option>
            <option value="painting">Painting</option>
            <option value="carpentry">Carpentry</option>
            <option value="flooring">Flooring</option>
            <option value="roofing">Roofing</option>
            <option value="hvac">HVAC</option>
            <option value="appliance_repair">Appliance Repair</option>
            <option value="locksmith">Locksmith</option>
            <option value="handyman">Handyman</option>
            <option value="home_security">Home Security</option>
            <option value="pool_maintenance">Pool Maintenance</option>
            <option value="pest_control">Pest Control</option>
            <option value="carpet_cleaning">Carpet Cleaning</option>
            <option value="window_cleaning">Window Cleaning</option>
            <option value="gutter_cleaning">Gutter Cleaning</option>
            <option value="power_washing">Power Washing</option>
            <option value="snow_removal">Snow Removal</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Subcategory</label>
          <input
            type="text"
            value={formData.subcategory}
            onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Pricing Type *</label>
          <select
            value={formData.pricingType}
            onChange={(e) => setFormData({ ...formData, pricingType: e.target.value as PricingType })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="fixed">Fixed</option>
            <option value="hourly">Hourly</option>
            <option value="per_sqft">Per Square Foot</option>
            <option value="per_item">Per Item</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Base Price *</label>
          <input
            type="number"
            step="0.01"
            value={formData.basePrice}
            onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Currency</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="PHP">PHP</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
        <select
          value={formData.serviceType}
          onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as ServiceType })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="one_time">One Time</option>
          <option value="recurring">Recurring</option>
          <option value="emergency">Emergency</option>
          <option value="maintenance">Maintenance</option>
          <option value="installation">Installation</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Service Area (comma-separated)</label>
        <input
          type="text"
          value={formData.serviceArea}
          onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
          placeholder="e.g., New York, Los Angeles"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Active</span>
        </label>
      </div>
    </div>
  );
}

// Image Upload Form Component
function ImageUploadForm({ 
  onFilesChange, 
  selectedFiles 
}: { 
  service: Service; 
  onFilesChange: (files: File[]) => void;
  selectedFiles: File[];
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      onFilesChange([...selectedFiles, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(selectedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Images</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">You can select multiple images</p>
      </div>
      {selectedFiles.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">Selected Images ({selectedFiles.length})</label>
          <div className="grid grid-cols-3 gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative">
                <Image
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  width={200}
                  height={96}
                  className="w-full h-24 object-cover rounded border border-gray-300"
                  unoptimized
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="text-xs text-gray-600 truncate mt-1">{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approve Service Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => {
          setApproveModalOpen(false);
          setSelectedService(null);
        }}
        title="Approve Service"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setApproveModalOpen(false);
                setSelectedService(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApproveService}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Approving...' : 'Approve Service'}
            </button>
          </div>
        }
      >
        {selectedService && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Are you sure you want to approve <strong>{selectedService.title}</strong>?
            </p>
            <p className="text-xs text-gray-500">
              This service will be made available to users.
            </p>
          </div>
        )}
      </Modal>

      {/* Reject Service Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedService(null);
          setRejectionReason('');
        }}
        title="Reject Service"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setRejectModalOpen(false);
                setSelectedService(null);
                setRejectionReason('');
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectService}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Rejecting...' : 'Reject Service'}
            </button>
          </div>
        }
      >
        {selectedService && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Are you sure you want to reject <strong>{selectedService.title}</strong>?
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rejection Reason</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                placeholder="Provide a reason for rejection..."
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

