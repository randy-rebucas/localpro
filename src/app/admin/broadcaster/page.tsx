"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Radio,
  Search, 
  Edit, 
  Trash2, 
  Plus,
  RefreshCw,
  Eye,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Gift,
  BarChart3
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { FileUpload } from "@/components/ui/file-upload";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { Broadcaster, BroadcasterStats } from "@/types/broadcaster";
import { AdminOnly } from "@/components/role-guard";

interface BroadcasterFormData {
  title: string;
  message: string;
  description?: string;
  content?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'promotion';
  category?: 'system' | 'marketing' | 'feature' | 'maintenance' | 'security' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'active' | 'inactive' | 'archived' | 'published' | 'scheduled';
  startDate: string;
  endDate: string;
  targetAudience: 'all' | 'providers' | 'clients' | 'agencies' | 'premium' | 'verified' | 'specific_roles';
  targetRoles: string[];
  isSticky: boolean;
  isFeatured: boolean;
  actionUrl: string;
  actionText: string;
  locationCity?: string;
  locationState?: string;
  locationCountry?: string;
}

export default function BroadcasterPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcaster[]>([]);
  const [stats, setStats] = useState<BroadcasterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcaster | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState<BroadcasterFormData>({
    title: "",
    message: "",
    description: "",
    content: "",
    type: "info",
    category: "marketing",
    priority: "medium",
    status: "draft",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    targetAudience: "clients",
    targetRoles: [],
    isSticky: false,
    isFeatured: false,
    actionUrl: "",
    actionText: "",
    locationCity: "",
    locationState: "",
    locationCountry: ""
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const [broadcastsResponse, statsResponse] = await Promise.all([
        fetch(
          `${API_BASE_URL}${API_ENDPOINTS.broadcaster}`,
          createAuthFetchOptions({ method: 'GET' })
        ),
        fetch(
          `${API_BASE_URL}${API_ENDPOINTS.broadcasterStats}`,
          createAuthFetchOptions({ method: 'GET' })
        )
      ]);

      if (!broadcastsResponse.ok) {
        throw new Error('Failed to fetch broadcasts');
      }

      const broadcastsResult = await broadcastsResponse.json();
      const broadcastsData = broadcastsResult.data || broadcastsResult || [];
      setBroadcasts(Array.isArray(broadcastsData) ? broadcastsData : []);

      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        const statsData = statsResult.data || statsResult || {};
        setStats({
          totalBroadcasts: statsData.totalBroadcasts || 0,
          activeBroadcasts: statsData.activeBroadcasts || 0,
          totalViews: statsData.totalViews || 0,
          totalClicks: statsData.totalClicks || 0,
          broadcastsByType: statsData.broadcastsByType || [],
          broadcastsByPriority: statsData.broadcastsByPriority || []
        });
      } else {
        // Set default stats if API fails
        setStats({
          totalBroadcasts: 0,
          activeBroadcasts: 0,
          totalViews: 0,
          totalClicks: 0,
          broadcastsByType: [],
          broadcastsByPriority: []
        });
      }

      setLastUpdated(new Date());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error fetching broadcaster data', error);
      setError(error.message);
      toast.error(`Failed to load broadcasts: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  // Map frontend type to backend type
  const mapTypeToBackend = (frontendType: string): string => {
    const typeMap: Record<string, string> = {
      'info': 'announcement',
      'success': 'promotion',
      'warning': 'update',
      'error': 'announcement',
      'promotion': 'promotion'
    };
    return typeMap[frontendType] || 'general';
  };

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      description: "",
      content: "",
      type: "info",
      category: "marketing",
      priority: "medium",
      status: "draft",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      targetAudience: "clients",
      targetRoles: [],
      isSticky: false,
      isFeatured: false,
      actionUrl: "",
      actionText: "",
      locationCity: "",
      locationState: "",
      locationCountry: ""
    });
    setImageFile(null);
    setImagePreview(null);
    setSelectedBroadcast(null);
  };

  // Map backend type to frontend type
  const mapTypeToFrontend = (backendType: string): string => {
    const typeMap: Record<string, string> = {
      'announcement': 'info',
      'promotion': 'success',
      'update': 'warning',
      'news': 'info',
      'event': 'info',
      'general': 'info'
    };
    return typeMap[backendType] || 'info';
  };

  const handleView = (broadcast: Broadcaster) => {
    setSelectedBroadcast(broadcast);
    setViewModalOpen(true);
  };

  const handleEdit = (broadcast: Broadcaster) => {
    setSelectedBroadcast(broadcast);
    
    // Get first image URL if images array exists
    const imageUrl = broadcast.images && broadcast.images.length > 0 
      ? broadcast.images[0].url 
      : broadcast.imageUrl;
    
    setFormData({
      title: broadcast.title,
      message: broadcast.message || broadcast.description || broadcast.content || "",
      description: broadcast.description || "",
      content: broadcast.content || "",
      type: mapTypeToFrontend(broadcast.type) as 'info' | 'success' | 'warning' | 'error' | 'promotion',
      category: broadcast.category || "marketing",
      priority: broadcast.priority,
      status: broadcast.status,
      startDate: broadcast.startDate ? new Date(broadcast.startDate).toISOString().split('T')[0] : "",
      endDate: broadcast.endDate ? new Date(broadcast.endDate).toISOString().split('T')[0] : "",
      targetAudience: broadcast.targetAudience || "clients",
      targetRoles: broadcast.targetRoles || [],
      isSticky: broadcast.isSticky,
      isFeatured: broadcast.isFeatured || false,
      actionUrl: broadcast.actionUrl || broadcast.link?.url || "",
      actionText: broadcast.actionText || broadcast.link?.text || "",
      locationCity: broadcast.location?.city || "",
      locationState: broadcast.location?.state || "",
      locationCountry: broadcast.location?.country || ""
    });
    setImagePreview(imageUrl || null);
    setEditModalOpen(true);
  };

  const handleCreate = async () => {
    try {
      setSubmitting(true);

      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      // Build payload according to backend structure
      const broadcastData: Record<string, unknown> = {
        // Required fields
        title: formData.title,
        
        // Message/Content - send message if provided, otherwise description/content
        // According to payload spec: message OR description/content
        ...(formData.message 
          ? { message: formData.message }
          : {
              ...(formData.description ? { description: formData.description } : {}),
              ...(formData.content ? { content: formData.content } : {})
            }
        ),
        
        // Type & Category - map frontend type to backend type
        type: mapTypeToBackend(formData.type),
        ...(formData.category ? { category: formData.category } : {}),
        
        // Status & Priority
        status: formData.status,
        priority: formData.priority,
        
        // Targeting
        targetAudience: formData.targetAudience,
        ...(formData.targetRoles && formData.targetRoles.length > 0 ? { targetRoles: formData.targetRoles } : {}),
        
        // Schedule - send dates as ISO strings (backend will handle conversion)
        // Format: "YYYY-MM-DD" or full ISO string
        ...(formData.startDate ? { 
          startDate: formData.startDate.includes('T') 
            ? formData.startDate 
            : `${formData.startDate}T00:00:00Z`
        } : {}),
        ...(formData.endDate ? { 
          endDate: formData.endDate.includes('T')
            ? formData.endDate
            : `${formData.endDate}T23:59:59Z`
        } : {}),
        
        // Display options
        isSticky: formData.isSticky,
        ...(formData.isFeatured ? { isFeatured: formData.isFeatured } : {}),
        
        // Link/Action - support both simple format (actionUrl/actionText) and link object
        // Backend accepts both, so we'll send the simple format for now
        ...(formData.actionUrl ? {
          actionUrl: formData.actionUrl,
          ...(formData.actionText ? { actionText: formData.actionText } : {})
        } : {}),
        
        // Location - send as object if any location field is provided
        ...(formData.locationCity || formData.locationState || formData.locationCountry ? {
          location: {
            ...(formData.locationCity ? { city: formData.locationCity } : {}),
            ...(formData.locationState ? { state: formData.locationState } : {}),
            ...(formData.locationCountry ? { country: formData.locationCountry } : {})
          }
        } : {})
      };

      // Handle image upload if present
      if (imageFile) {
        try {
          const imageFormData = new FormData();
          imageFormData.append('image', imageFile);
          
          const token = getApiToken();
          const imageResponse = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.broadcaster}/upload-image`,
            {
              method: 'POST',
              headers: {
                ...(token && { 'Authorization': `Bearer ${token}` })
                // Don't set Content-Type for FormData - browser will set it with boundary
              },
              credentials: 'include',
              body: imageFormData
            }
          );

          if (imageResponse.ok) {
            const imageResult = await imageResponse.json();
            const imageUrl = imageResult.data?.url || imageResult.url;
            
            // Use images array format (backend preferred)
            if (imageUrl) {
              broadcastData.images = [{
                url: imageUrl,
                ...(imageResult.data?.publicId ? { publicId: imageResult.data.publicId } : {}),
                ...(imageResult.data?.thumbnail ? { thumbnail: imageResult.data.thumbnail } : {})
              }];
            }
          } else {
            // Log image upload error but don't fail the whole operation
            logger.warn('Image upload failed, continuing without image', {
              status: imageResponse.status,
              statusText: imageResponse.statusText
            });
          }
        } catch (imageError) {
          // Log image upload error but don't fail the whole operation
          const imgError = imageError instanceof Error ? imageError : new Error(String(imageError));
          logger.warn('Image upload error, continuing without image', { 
            error: imgError.message,
            errorName: imgError.name
          });
        }
      }

      let response: Response;
      try {
        response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.broadcaster}`,
          createAuthFetchOptions({
            method: 'POST',
            body: JSON.stringify(broadcastData)
          })
        );
      } catch (networkError) {
        // Handle network errors (CORS, connection refused, etc.)
        const error = networkError instanceof Error ? networkError : new Error(String(networkError));
        logger.error('Network error creating broadcast', error, {
          url: `${API_BASE_URL}${API_ENDPOINTS.broadcaster}`,
          errorType: 'network',
          message: error.message
        });
        throw new Error('Network error: Unable to connect to the server. Please check your connection and try again.');
      }

      if (!response.ok) {
        let errorMessage = 'Failed to create broadcast';
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

        // Provide user-friendly error messages based on status code
        if (response.status === 400) {
          errorMessage = errorData.message || errorData.error || 'Invalid request. Please check your input.';
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (response.status === 403) {
          errorMessage = errorData.message || errorData.error || 'You do not have permission to create broadcasts.';
        } else if (response.status === 404) {
          errorMessage = 'Broadcast endpoint not found. The API may not be configured yet.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }

        logger.error('Failed to create broadcast', new Error(errorMessage), {
          status: response.status,
          statusText: response.statusText,
          errorData,
          broadcastData
        });

        throw new Error(errorMessage);
      }

      let result: Record<string, unknown> = {};
      try {
        result = await response.json();
      } catch (parseError) {
        logger.warn('Failed to parse response as JSON', { parseError, status: response.status });
        // If response is not JSON, check if it's empty (204 No Content) or has text
        const responseText = await response.text().catch(() => '');
        if (responseText) {
          throw new Error(`Server returned: ${responseText}`);
        }
        // If empty response but status is OK, consider it success
        if (response.ok) {
          toast.success('Broadcast created successfully');
          setCreateModalOpen(false);
          resetForm();
          await refreshData();
          return;
        }
        throw new Error(`Server returned status ${response.status} with no message`);
      }
      
      // Check for success in various formats
      if (result.success === true || (result.success !== false && (result._id || result.id || result.data))) {
        toast.success('Broadcast created successfully');
        setCreateModalOpen(false);
        resetForm();
        await refreshData();
      } else {
        const error = typeof result.error === 'string' ? result.error : null;
        const message = typeof result.message === 'string' ? result.message : null;
        const errorMsg = error || message || 'Failed to create broadcast';
        logger.error('Broadcast creation returned unsuccessful result', new Error(errorMsg), { 
          result,
          status: response.status,
          statusText: response.statusText
        });
        throw new Error(errorMsg);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      
      // Provide more descriptive error messages
      let errorMessage = error.message || 'Failed to create broadcast';
      
      if (error.message.includes('Network error')) {
        errorMessage = error.message;
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMessage = 'You do not have permission to create broadcasts.';
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        errorMessage = 'Broadcast endpoint not found. The API may not be configured yet.';
      } else if (error.message.includes('500') || error.message.includes('Server error')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!error.message || error.message === 'Failed to create broadcast') {
        errorMessage = 'An unexpected error occurred. Please check the console for details.';
      }
      
      logger.error('Error creating broadcast', error, {
        errorMessage,
        originalMessage: error.message
      });
      toast.error(`Failed to create broadcast: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedBroadcast?._id) return;

    try {
      setSubmitting(true);

      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      // Build payload according to backend structure (same as create)
      const broadcastData: Record<string, unknown> = {
        // Required fields
        title: formData.title,
        
        // Message/Content - send message if provided, otherwise description/content
        // According to payload spec: message OR description/content
        ...(formData.message 
          ? { message: formData.message }
          : {
              ...(formData.description ? { description: formData.description } : {}),
              ...(formData.content ? { content: formData.content } : {})
            }
        ),
        
        // Type & Category - map frontend type to backend type
        type: mapTypeToBackend(formData.type),
        ...(formData.category ? { category: formData.category } : {}),
        
        // Status & Priority
        status: formData.status,
        priority: formData.priority,
        
        // Targeting
        targetAudience: formData.targetAudience,
        ...(formData.targetRoles && formData.targetRoles.length > 0 ? { targetRoles: formData.targetRoles } : {}),
        
        // Schedule - send dates as ISO strings (backend will handle conversion)
        // Format: "YYYY-MM-DD" or full ISO string
        ...(formData.startDate ? { 
          startDate: formData.startDate.includes('T') 
            ? formData.startDate 
            : `${formData.startDate}T00:00:00Z`
        } : {}),
        ...(formData.endDate ? { 
          endDate: formData.endDate.includes('T')
            ? formData.endDate
            : `${formData.endDate}T23:59:59Z`
        } : {}),
        
        // Display options
        isSticky: formData.isSticky,
        ...(formData.isFeatured ? { isFeatured: formData.isFeatured } : {}),
        
        // Link/Action - support both simple format (actionUrl/actionText) and link object
        // Backend accepts both, so we'll send the simple format for now
        ...(formData.actionUrl ? {
          actionUrl: formData.actionUrl,
          ...(formData.actionText ? { actionText: formData.actionText } : {})
        } : {}),
        
        // Location - send as object if any location field is provided
        ...(formData.locationCity || formData.locationState || formData.locationCountry ? {
          location: {
            ...(formData.locationCity ? { city: formData.locationCity } : {}),
            ...(formData.locationState ? { state: formData.locationState } : {}),
            ...(formData.locationCountry ? { country: formData.locationCountry } : {})
          }
        } : {})
      };

      // Handle image upload if new image is present
      if (imageFile) {
        try {
          const imageFormData = new FormData();
          imageFormData.append('image', imageFile);
          
          const token = getApiToken();
          const imageResponse = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.broadcaster}/${selectedBroadcast._id}/upload-image`,
            {
              method: 'POST',
              headers: {
                ...(token && { 'Authorization': `Bearer ${token}` })
                // Don't set Content-Type for FormData - browser will set it with boundary
              },
              credentials: 'include',
              body: imageFormData
            }
          );

          if (imageResponse.ok) {
            const imageResult = await imageResponse.json();
            const imageUrl = imageResult.data?.url || imageResult.url;
            
            // Use images array format (backend preferred)
            if (imageUrl) {
              broadcastData.images = [{
                url: imageUrl,
                ...(imageResult.data?.publicId ? { publicId: imageResult.data.publicId } : {}),
                ...(imageResult.data?.thumbnail ? { thumbnail: imageResult.data.thumbnail } : {})
              }];
            }
          } else {
            // Log image upload error but don't fail the whole operation
            logger.warn('Image upload failed, continuing without image', {
              status: imageResponse.status,
              statusText: imageResponse.statusText
            });
          }
        } catch (imageError) {
          // Log image upload error but don't fail the whole operation
          const imgError = imageError instanceof Error ? imageError : new Error(String(imageError));
          logger.warn('Image upload error, continuing without image', { 
            error: imgError.message,
            errorName: imgError.name
          });
        }
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.broadcasterById}/${selectedBroadcast._id}`,
        createAuthFetchOptions({
          method: 'PUT',
          body: JSON.stringify(broadcastData)
        })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update broadcast');
      }

      const result = await response.json();
      
      if (result.success !== false) {
        toast.success('Broadcast updated successfully');
        setEditModalOpen(false);
        resetForm();
        await refreshData();
      } else {
        throw new Error(result.error || 'Failed to update broadcast');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error updating broadcast', error);
      toast.error(`Failed to update broadcast: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (broadcastId: string) => {
    if (!confirm('Are you sure you want to delete this broadcast?')) return;

    try {
      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.broadcasterById}/${broadcastId}`,
        createAuthFetchOptions({
          method: 'DELETE'
        })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete broadcast');
      }

      const result = await response.json();
      
      if (result.success !== false) {
        toast.success('Broadcast deleted successfully');
        await refreshData();
      } else {
        throw new Error(result.error || 'Failed to delete broadcast');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error deleting broadcast', error);
      toast.error(`Failed to delete broadcast: ${error.message}`);
    }
  };

  const getTypeIcon = (type: Broadcaster['type']) => {
    switch (type) {
      case 'promotion':
        return Gift;
      case 'update':
        return AlertTriangle;
      case 'announcement':
      case 'news':
      case 'event':
      case 'general':
      default:
        return Info;
    }
  };

  const getTypeColor = (type: Broadcaster['type']) => {
    switch (type) {
      case 'promotion':
        return 'text-purple-600 bg-purple-100';
      case 'update':
        return 'text-yellow-600 bg-yellow-100';
      case 'announcement':
      case 'news':
      case 'event':
      case 'general':
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getPriorityColor = (priority: Broadcaster['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: Broadcaster['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'draft':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const filteredBroadcasts = broadcasts.filter(broadcast =>
    broadcast.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (broadcast.message || broadcast.description || broadcast.content || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !refreshing) {
    return <Loading />;
  }

  return (
    <AdminOnly>
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Broadcaster Management</h1>
            <p className="text-gray-600 text-sm">Manage broadcasts displayed to clients</p>
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
            <button
              onClick={() => {
                resetForm();
                setCreateModalOpen(true);
              }}
              className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <Plus className="w-3 h-3 mr-1" />
              Create Broadcast
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Total Broadcasts</p>
                  <p className="text-lg font-bold text-gray-900">{stats.totalBroadcasts || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0 ml-4">
                  <Radio className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Active</p>
                  <p className="text-lg font-bold text-gray-900">{stats.activeBroadcasts || 0}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg flex-shrink-0 ml-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded shadow p-3 border-l-4 border-indigo-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Total Views</p>
                  <p className="text-lg font-bold text-gray-900">{(stats.totalViews || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-lg flex-shrink-0 ml-4">
                  <Eye className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Total Clicks</p>
                  <p className="text-lg font-bold text-gray-900">{(stats.totalClicks || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0 ml-4">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
              <input
                type="text"
                placeholder="Search broadcasts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Broadcasts Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBroadcasts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-12 text-center">
                      <Radio className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        {searchTerm ? 'No broadcasts found' : 'No broadcasts yet'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {searchTerm ? 'Try adjusting your search terms.' : 'Create your first broadcast to get started.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredBroadcasts.map((broadcast) => {
                    const TypeIcon = getTypeIcon(broadcast.type);
                    return (
                      <tr key={broadcast._id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {broadcast.isSticky && <Radio className="w-3 h-3 text-blue-500" />}
                            <div>
                              <div className="text-xs font-semibold text-gray-900">{broadcast.title}</div>
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {broadcast.message ? `${broadcast.message.substring(0, 50)}...` : 'No message'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(broadcast.type)}`}>
                            <TypeIcon className="w-3 h-3" />
                            {broadcast.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(broadcast.priority)}`}>
                            {broadcast.priority}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(broadcast.status)}`}>
                            {broadcast.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {broadcast.startDate ? (
                            <>
                              <div>{new Date(broadcast.startDate).toLocaleDateString()}</div>
                              {broadcast.endDate && (
                                <div className="text-xs">to {new Date(broadcast.endDate).toLocaleDateString()}</div>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400">Not scheduled</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {broadcast.views || 0}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleView(broadcast)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="View details"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleEdit(broadcast)}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              title="Edit broadcast"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(broadcast._id)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete broadcast"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Modal */}
        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          title={selectedBroadcast?.title || 'Broadcast Details'}
          size="lg"
        >
          {selectedBroadcast && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {selectedBroadcast.message || selectedBroadcast.description || selectedBroadcast.content || 'No message provided'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedBroadcast.type)}`}>
                    {selectedBroadcast.type}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedBroadcast.priority)}`}>
                    {selectedBroadcast.priority}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBroadcast.status)}`}>
                    {selectedBroadcast.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sticky</label>
                  <span className="text-sm text-gray-900">{selectedBroadcast.isSticky ? 'Yes' : 'No'}</span>
                </div>
              </div>
              {(selectedBroadcast.images && selectedBroadcast.images.length > 0) || selectedBroadcast.imageUrl ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={selectedBroadcast.images && selectedBroadcast.images.length > 0 
                      ? selectedBroadcast.images[0].url 
                      : selectedBroadcast.imageUrl} 
                    alt={selectedBroadcast.images && selectedBroadcast.images.length > 0 
                      ? selectedBroadcast.images[0].alt || selectedBroadcast.title 
                      : selectedBroadcast.title} 
                    className="rounded-lg max-w-full" 
                  />
                </div>
              ) : null}
              {(selectedBroadcast.actionUrl || selectedBroadcast.link?.url) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                  <a 
                    href={selectedBroadcast.actionUrl || selectedBroadcast.link?.url} 
                    target={selectedBroadcast.link?.openInNewTab !== false ? "_blank" : undefined}
                    rel={selectedBroadcast.link?.openInNewTab !== false ? "noopener noreferrer" : undefined}
                    className="text-blue-600 hover:underline"
                  >
                    {selectedBroadcast.actionText || selectedBroadcast.link?.text || selectedBroadcast.actionUrl || selectedBroadcast.link?.url}
                  </a>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Create Modal */}
        <Modal
          isOpen={createModalOpen}
          onClose={() => {
            setCreateModalOpen(false);
            resetForm();
          }}
          title="Create Broadcast"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter broadcast title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter broadcast message"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'info' | 'success' | 'warning' | 'error' | 'promotion' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="promotion">Promotion</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'active' | 'inactive' | 'archived' | 'published' | 'scheduled' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sticky</label>
                <div className="mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isSticky}
                      onChange={(e) => setFormData({ ...formData, isSticky: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Pin to top</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action URL</label>
              <input
                type="url"
                value={formData.actionUrl}
                onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Text</label>
              <input
                type="text"
                value={formData.actionText}
                onChange={(e) => setFormData({ ...formData, actionText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Learn More"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
              <FileUpload
                accept="image/*"
                type="image"
                onFilesSelected={(files) => {
                  if (files.length > 0) {
                    const file = files[0];
                    setImageFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {imagePreview && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="rounded-lg max-w-xs" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !formData.title || !formData.message}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Broadcast'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            resetForm();
          }}
          title="Edit Broadcast"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'info' | 'success' | 'warning' | 'error' | 'promotion' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="promotion">Promotion</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'active' | 'inactive' | 'archived' | 'published' | 'scheduled' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sticky</label>
                <div className="mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isSticky}
                      onChange={(e) => setFormData({ ...formData, isSticky: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Pin to top</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action URL</label>
              <input
                type="url"
                value={formData.actionUrl}
                onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Text</label>
              <input
                type="text"
                value={formData.actionText}
                onChange={(e) => setFormData({ ...formData, actionText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
              <FileUpload
                accept="image/*"
                type="image"
                onFilesSelected={(files) => {
                  if (files.length > 0) {
                    const file = files[0];
                    setImageFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              {imagePreview && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="rounded-lg max-w-xs" />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={submitting || !formData.title || !formData.message}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Updating...' : 'Update Broadcast'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminOnly>
  );
}

