"use client";

import { useState, useEffect, useCallback } from "react";
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
  Megaphone,
  CheckCircle,
  Clock,
  Pin,
  MessageSquare,
  Users
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  summary?: string;
  type?: 'general' | 'update' | 'maintenance' | 'promotion' | 'alert';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'draft' | 'published' | 'scheduled' | 'archived';
  targetAudience?: 'all' | 'clients' | 'providers' | 'agencies';
  targetRoles?: string[];
  scheduledAt?: string;
  expiresAt?: string;
  isSticky?: boolean;
  allowComments?: boolean;
  requireAcknowledgment?: boolean;
  tags?: string[];
  author?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  analytics?: {
    views?: number;
    acknowledged?: number;
    comments?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface AnnouncementStatistics {
  totalAnnouncements?: number;
  publishedAnnouncements?: number;
  draftAnnouncements?: number;
  scheduledAnnouncements?: number;
  totalViews?: number;
  totalAcknowledged?: number;
  totalComments?: number;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'createdAt' | 'priority'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statistics, setStatistics] = useState<AnnouncementStatistics | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    type: 'general' as 'general' | 'update' | 'maintenance' | 'promotion' | 'alert',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'draft' as 'draft' | 'published' | 'scheduled' | 'archived',
    targetAudience: 'all' as 'all' | 'clients' | 'providers' | 'agencies',
    scheduledAt: '',
    expiresAt: '',
    isSticky: false,
    allowComments: true,
    requireAcknowledgment: false,
    tags: ''
  });

  const resetFormData = () => {
    setFormData({
      title: '',
      content: '',
      summary: '',
      type: 'general',
      priority: 'medium',
      status: 'draft',
      targetAudience: 'all',
      scheduledAt: '',
      expiresAt: '',
      isSticky: false,
      allowComments: true,
      requireAcknowledgment: false,
      tags: ''
    });
  };

  const fetchStatistics = useCallback(async () => {
    try {
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.announcementsAdminStatistics}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        logger.warn('Failed to fetch announcement statistics');
        return;
      }

      const result = await response.json();
      if (result.success && result.data) {
        setStatistics(result.data.overview || result.data);
      }
    } catch (err) {
      logger.error('Error fetching announcement statistics', err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

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
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);
      if (typeFilter !== 'all') queryParams.set('type', typeFilter);
      if (priorityFilter !== 'all') queryParams.set('priority', priorityFilter);
      queryParams.set('sortBy', sortBy);
      queryParams.set('sortOrder', sortOrder);
      queryParams.set('limit', '100');

      const url = `${API_BASE_URL}${API_ENDPOINTS.announcements}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch announcements`);
      }

      const result = await response.json();
      
      let announcementsData: Announcement[] = [];
      if (result.success && result.data) {
        if (result.data.announcements) {
          announcementsData = result.data.announcements;
        } else if (Array.isArray(result.data)) {
          announcementsData = result.data;
        }
      } else if (Array.isArray(result)) {
        announcementsData = result;
      }

      setAnnouncements(announcementsData);
      setTotalCount(announcementsData.length);
      setLastUpdated(new Date());
    } catch (err) {
      logger.error('Error fetching announcements', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to load announcements');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortBy, sortOrder, statusFilter, typeFilter, priorityFilter]);

  useEffect(() => {
    fetchData();
    fetchStatistics();
  }, [fetchData, fetchStatistics]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchData();
      await fetchStatistics();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSort = (field: 'title' | 'createdAt' | 'priority') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      if (!formData.title || !formData.content) {
        toast.error('Please fill in title and content');
        return;
      }

      const payload = {
        title: formData.title,
        content: formData.content,
        summary: formData.summary || undefined,
        type: formData.type,
        priority: formData.priority,
        status: formData.status,
        targetAudience: formData.targetAudience,
        scheduledAt: formData.scheduledAt || undefined,
        expiresAt: formData.expiresAt || undefined,
        isSticky: formData.isSticky,
        allowComments: formData.allowComments,
        requireAcknowledgment: formData.requireAcknowledgment,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined
      };

      const url = `${API_BASE_URL}${API_ENDPOINTS.announcements}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify(payload)
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create announcement');
      }

      toast.success('Announcement created successfully');
      setCreateModalOpen(false);
      resetFormData();
      await fetchData();
      await fetchStatistics();
    } catch (err) {
      logger.error('Error creating announcement', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (!selectedAnnouncement?._id) return;
    
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      if (!formData.title || !formData.content) {
        toast.error('Please fill in title and content');
        return;
      }

      const payload = {
        title: formData.title,
        content: formData.content,
        summary: formData.summary || undefined,
        type: formData.type,
        priority: formData.priority,
        status: formData.status,
        targetAudience: formData.targetAudience,
        scheduledAt: formData.scheduledAt || undefined,
        expiresAt: formData.expiresAt || undefined,
        isSticky: formData.isSticky,
        allowComments: formData.allowComments,
        requireAcknowledgment: formData.requireAcknowledgment,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined
      };

      const url = `${API_BASE_URL}${API_ENDPOINTS.announcementsById}/${selectedAnnouncement._id}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify(payload)
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update announcement');
      }

      toast.success('Announcement updated successfully');
      setEditModalOpen(false);
      setSelectedAnnouncement(null);
      resetFormData();
      await fetchData();
      await fetchStatistics();
    } catch (err) {
      logger.error('Error updating announcement', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to update announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!selectedAnnouncement?._id) return;
    
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.announcementsById}/${selectedAnnouncement._id}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'DELETE' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete announcement');
      }

      toast.success('Announcement deleted successfully');
      setDeleteModalOpen(false);
      setSelectedAnnouncement(null);
      await fetchData();
      await fetchStatistics();
    } catch (err) {
      logger.error('Error deleting announcement', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to delete announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      summary: announcement.summary || '',
      type: announcement.type || 'general',
      priority: announcement.priority || 'medium',
      status: announcement.status || 'draft',
      targetAudience: announcement.targetAudience || 'all',
      scheduledAt: announcement.scheduledAt || '',
      expiresAt: announcement.expiresAt || '',
      isSticky: announcement.isSticky || false,
      allowComments: announcement.allowComments ?? true,
      requireAcknowledgment: announcement.requireAcknowledgment || false,
      tags: announcement.tags?.join(', ') || ''
    });
    setEditModalOpen(true);
  };

  const getTypeColor = (type?: string) => {
    const colors: Record<string, string> = {
      general: 'bg-blue-100 text-blue-800',
      update: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      promotion: 'bg-purple-100 text-purple-800',
      alert: 'bg-red-100 text-red-800'
    };
    return colors[type || 'general'] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority?: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority || 'medium'] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800',
      archived: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status || 'draft'] || 'bg-gray-100 text-gray-800';
  };

  if (loading && announcements.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading announcements..." />
      </div>
    );
  }

  if (error && announcements.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Announcements Management</h1>
          <p className="text-gray-600 text-sm">Create and manage platform announcements</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={() => {
              resetFormData();
              setCreateModalOpen(true);
            }}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-3 h-3 mr-1" />
            Create
          </button>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-900">{statistics.totalAnnouncements || 0}</p>
              </div>
              <Megaphone className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Published</p>
                <p className="text-xl font-bold text-green-600">{statistics.publishedAnnouncements || 0}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Drafts</p>
                <p className="text-xl font-bold text-gray-600">{statistics.draftAnnouncements || 0}</p>
              </div>
              <Edit className="w-6 h-6 text-gray-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Scheduled</p>
                <p className="text-xl font-bold text-blue-600">{statistics.scheduledAnnouncements || 0}</p>
              </div>
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Views</p>
                <p className="text-xl font-bold text-purple-600">{statistics.totalViews || 0}</p>
              </div>
              <Eye className="w-6 h-6 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Acknowledged</p>
                <p className="text-xl font-bold text-orange-600">{statistics.totalAcknowledged || 0}</p>
              </div>
              <Users className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Comments</p>
                <p className="text-xl font-bold text-cyan-600">{statistics.totalComments || 0}</p>
              </div>
              <MessageSquare className="w-6 h-6 text-cyan-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded shadow">
        <div className="px-4 py-3 border-b border-gray-200">
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
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="all">All Types</option>
                  <option value="general">General</option>
                  <option value="update">Update</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="promotion">Promotion</option>
                  <option value="alert">Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="all">All Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setPriorityFilter('all');
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="text-xs text-gray-500">
                {totalCount} announcements found
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Announcements</h3>
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
                onClick={() => handleSort('priority')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'priority' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Priority
                {sortBy === 'priority' && (
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Announcement</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audience</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {announcements.map((announcement) => (
                <tr key={announcement._id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {announcement.isSticky && (
                          <Pin className="w-3 h-3 text-red-500 mr-1" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-900">{announcement.title}</div>
                        <div className="text-xs text-gray-600 line-clamp-1 max-w-xs">
                          {announcement.summary || announcement.content.substring(0, 50)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(announcement.type)}`}>
                      {announcement.type || 'general'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority || 'medium'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(announcement.status)}`}>
                      {announcement.status || 'draft'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="text-xs text-gray-600">
                      {announcement.targetAudience || 'all'}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">{announcement.analytics?.views || 0}</span> views
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedAnnouncement(announcement);
                          setViewModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => openEditModal(announcement)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedAnnouncement(announcement);
                          setDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
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

        {announcements.length === 0 && (
          <div className="text-center py-8">
            <Megaphone className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No announcements found</h3>
            <p className="text-xs text-gray-500">Create your first announcement to get started.</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedAnnouncement(null);
        }}
        title="Announcement Details"
        size="lg"
      >
        {selectedAnnouncement && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{selectedAnnouncement.title}</h3>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(selectedAnnouncement.type)}`}>
                  {selectedAnnouncement.type || 'general'}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedAnnouncement.priority)}`}>
                  {selectedAnnouncement.priority || 'medium'}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedAnnouncement.status)}`}>
                  {selectedAnnouncement.status || 'draft'}
                </span>
                {selectedAnnouncement.isSticky && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <Pin className="w-3 h-3 mr-1" /> Pinned
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">Content</label>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{selectedAnnouncement.content}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Target Audience</label>
                <p className="text-sm">{selectedAnnouncement.targetAudience || 'All'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Author</label>
                <p className="text-sm">
                  {selectedAnnouncement.author?.firstName} {selectedAnnouncement.author?.lastName}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Created</label>
                <p className="text-sm">{new Date(selectedAnnouncement.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Expires</label>
                <p className="text-sm">
                  {selectedAnnouncement.expiresAt 
                    ? new Date(selectedAnnouncement.expiresAt).toLocaleString() 
                    : 'Never'}
                </p>
              </div>
            </div>

            {selectedAnnouncement.analytics && (
              <div>
                <label className="text-xs font-medium text-gray-500">Analytics</label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Views</p>
                    <p className="text-lg font-bold text-blue-600">{selectedAnnouncement.analytics.views || 0}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Acknowledged</p>
                    <p className="text-lg font-bold text-green-600">{selectedAnnouncement.analytics.acknowledged || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Comments</p>
                    <p className="text-lg font-bold text-purple-600">{selectedAnnouncement.analytics.comments || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={createModalOpen || editModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditModalOpen(false);
          setSelectedAnnouncement(null);
          resetFormData();
        }}
        title={createModalOpen ? 'Create Announcement' : 'Edit Announcement'}
        size="lg"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setCreateModalOpen(false);
                setEditModalOpen(false);
                setSelectedAnnouncement(null);
                resetFormData();
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={createModalOpen ? handleCreateAnnouncement : handleUpdateAnnouncement}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : (createModalOpen ? 'Create' : 'Update')}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
            <input
              type="text"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Brief summary for lists"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as typeof formData.type })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="general">General</option>
                <option value="update">Update</option>
                <option value="maintenance">Maintenance</option>
                <option value="promotion">Promotion</option>
                <option value="alert">Alert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as typeof formData.priority })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as typeof formData.targetAudience })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Users</option>
                <option value="clients">Clients Only</option>
                <option value="providers">Providers Only</option>
                <option value="agencies">Agencies Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled At</label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g. important, update, feature"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isSticky}
                onChange={(e) => setFormData({ ...formData, isSticky: e.target.checked })}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Pin to top</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.allowComments}
                onChange={(e) => setFormData({ ...formData, allowComments: e.target.checked })}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Allow comments</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.requireAcknowledgment}
                onChange={(e) => setFormData({ ...formData, requireAcknowledgment: e.target.checked })}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Require acknowledgment</span>
            </label>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedAnnouncement(null);
        }}
        title="Delete Announcement"
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedAnnouncement(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAnnouncement}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        }
      >
        {selectedAnnouncement && (
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <strong>{selectedAnnouncement.title}</strong>? 
            This action cannot be undone.
          </p>
        )}
      </Modal>
    </div>
  );
}

