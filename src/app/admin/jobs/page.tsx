"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Briefcase, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  RefreshCw,
  Filter,
  Download,
  Plus,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Building
} from "lucide-react";
import { Loading } from "@/components/ui/loading";

// Define types locally
interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  type: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship';
  category: string;
  status: 'active' | 'paused' | 'closed' | 'draft';
  isRemote: boolean;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  skills: string[];
  requirements: string[];
  benefits: string[];
  createdAt: string;
  updatedAt: string;
  postedBy: {
    _id: string;
    name: string;
    email: string;
    company: string;
    avatar?: string;
  };
  applicationsCount: number;
  viewsCount: number;
  featured: boolean;
  urgent: boolean;
  tags: string[];
  deadline?: string;
  startDate?: string;
  workingHours?: string;
  department?: string;
  reportingTo?: string;
  travelRequired?: boolean;
  visaSponsorship?: boolean;
  equityOffered?: boolean;
  remoteWorkPolicy?: string;
  applicationDeadline?: string;
  interviewProcess?: string[];
  perks: string[];
  companySize?: string;
  industry?: string;
  website?: string;
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

interface JobStats {
  totalJobs: number;
  activeJobs: number;
  pausedJobs: number;
  closedJobs: number;
  draftJobs: number;
  newJobsToday: number;
  newJobsWeek: number;
  newJobsMonth: number;
  totalApplications: number;
  averageApplicationsPerJob: number;
  topCategories: Array<{ category: string; count: number }>;
  topCompanies: Array<{ company: string; count: number }>;
  topLocations: Array<{ location: string; count: number }>;
  salaryRanges: Array<{ range: string; count: number }>;
  jobTypes: Array<{ type: string; count: number }>;
  experienceLevels: Array<{ level: string; count: number }>;
  trends: {
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ week: string; count: number }>;
    monthly: Array<{ month: string; count: number }>;
  };
  performanceMetrics: {
    averageTimeToFill: number;
    averageViewsPerJob: number;
    conversionRate: number;
    topPerformingJobs: Array<{ jobId: string; title: string; applications: number }>;
  };
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [slowRequest, setSlowRequest] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'company' | 'status' | 'createdAt' | 'applicationsCount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("");

  // Helper function to add timeout to fetch requests
  const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number = 10000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  };

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

      // Build query parameters for jobs data
      const queryParams = new URLSearchParams();
      queryParams.set('page', currentPage.toString());
      queryParams.set('limit', itemsPerPage.toString());
      if (searchTerm) queryParams.set('search', searchTerm);
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);
      if (categoryFilter !== 'all') queryParams.set('category', categoryFilter);
      if (typeFilter !== 'all') queryParams.set('type', typeFilter);
      if (companyFilter) queryParams.set('company', companyFilter);
      queryParams.set('sortBy', sortBy);
      queryParams.set('sortOrder', sortOrder);

      const [dataResponse, statsResponse] = await Promise.all([
        fetchWithTimeout(`/api/admin/jobs?${queryParams}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }, 20000), // 20 second timeout for jobs data
        fetchWithTimeout('/api/admin/jobs/stats?period=week', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }, 10000).catch(err => { // 10 second timeout for stats
          console.warn('Failed to fetch stats, using fallback:', err);
          return {
            ok: true,
            json: () => Promise.resolve({
              totalJobs: 0,
              activeJobs: 0,
              pausedJobs: 0,
              closedJobs: 0,
              draftJobs: 0,
              newJobsToday: 0,
              newJobsWeek: 0,
              newJobsMonth: 0,
              totalApplications: 0,
              averageApplicationsPerJob: 0,
              topCategories: [],
              topCompanies: [],
              topLocations: [],
              salaryRanges: [],
              jobTypes: [],
              experienceLevels: [],
              trends: { daily: [], weekly: [], monthly: [] },
              performanceMetrics: {
                averageTimeToFill: 0,
                averageViewsPerJob: 0,
                conversionRate: 0,
                topPerformingJobs: []
              }
            })
          };
        })
      ]);

      if (!dataResponse.ok) {
        const errorData = await dataResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch jobs data');
      }

      if (!statsResponse.ok) {
        const errorData = await statsResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch jobs statistics');
      }

      const dataResult = await dataResponse.json();
      const statsResult = await statsResponse.json();

      // Transform the API response data to match frontend expectations
      let jobsData: Job[] = [];

      if (dataResult.success && dataResult.data) {
        // Handle the new API response structure
        if (dataResult.data.jobs && Array.isArray(dataResult.data.jobs)) {
          jobsData = dataResult.data.jobs;
        } else if (Array.isArray(dataResult.data)) {
          // Fallback for old structure
          jobsData = dataResult.data;
        }
      } else if (Array.isArray(dataResult.data)) {
        // Fallback for direct array response
        jobsData = dataResult.data;
      }

      setJobs(jobsData);
      
      // Handle stats response - it should be an object, not an array
      const statsData = statsResult.data || statsResult;
      if (Array.isArray(statsData)) {
        // If it's an array, create a default stats object
        setStats({
          totalJobs: 0,
          activeJobs: 0,
          pausedJobs: 0,
          closedJobs: 0,
          draftJobs: 0,
          newJobsToday: 0,
          newJobsWeek: 0,
          newJobsMonth: 0,
          totalApplications: 0,
          averageApplicationsPerJob: 0,
          topCategories: [],
          topCompanies: [],
          topLocations: [],
          salaryRanges: [],
          jobTypes: [],
          experienceLevels: [],
          trends: { daily: [], weekly: [], monthly: [] },
          performanceMetrics: {
            averageTimeToFill: 0,
            averageViewsPerJob: 0,
            conversionRate: 0,
            topPerformingJobs: []
          }
        });
      } else {
        setStats(statsData);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching jobs data:', err);
      let errorMessage = 'Failed to load jobs data';
      
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
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, categoryFilter, typeFilter, companyFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (err) {
      console.error('Error refreshing data:', err);
      let errorMessage = 'Failed to refresh jobs data';
      
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

  const handleSort = (field: 'title' | 'company' | 'status' | 'createdAt' | 'applicationsCount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewJob = (jobId: string) => {
    // TODO: Implement job view modal or navigation
    console.log('View job:', jobId);
  };

  const handleEditJob = (jobId: string) => {
    // TODO: Implement job edit modal or navigation
    console.log('Edit job:', jobId);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        const response = await fetch(`/api/admin/jobs/${jobId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete job');
        }

        await fetchData(); // Refresh the data
      } catch (err) {
        console.error('Error deleting job:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete job');
      }
    }
  };

  const handleToggleStatus = async (jobId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const response = await fetch(`/api/admin/jobs/${jobId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update job status');
      }

      await fetchData(); // Refresh the data
    } catch (err) {
      console.error('Error updating job status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update job status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'closed': return 'text-red-600 bg-red-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return 'bg-blue-100 text-blue-800';
      case 'part-time': return 'bg-green-100 text-green-800';
      case 'contract': return 'bg-orange-100 text-orange-800';
      case 'freelance': return 'bg-purple-100 text-purple-800';
      case 'internship': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'entry': return 'bg-green-100 text-green-800';
      case 'mid': return 'bg-blue-100 text-blue-800';
      case 'senior': return 'bg-orange-100 text-orange-800';
      case 'executive': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loading size="xl" text="Loading jobs data..." />
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
            Job Management
          </h1>
          <p className="text-gray-600 text-sm">Manage job postings, applications, and recruitment</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={() => console.log('Create new job')}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Job
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
                <p className="text-xs font-medium text-gray-500">Total Jobs</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : (stats?.totalJobs || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {loading ? '...' : (stats?.newJobsToday || 0)} today
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0 ml-4">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Active Jobs</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : (stats?.activeJobs || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Currently live
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg flex-shrink-0 ml-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Applications</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : (stats?.totalApplications || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {loading ? '...' : (stats?.averageApplicationsPerJob || 0).toFixed(1)} avg per job
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0 ml-4">
                <Users className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Closed Jobs</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : (stats?.closedJobs || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  This period
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg flex-shrink-0 ml-4">
                <XCircle className="w-5 h-5 text-red-600" />
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
                    placeholder="Search jobs..."
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
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  placeholder="Filter by company..."
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setTypeFilter('all');
                  setCompanyFilter('');
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="text-xs text-gray-500">
                {jobs.length} jobs found
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Jobs</h3>
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
                onClick={() => handleSort('company')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'company' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Company
                {sortBy === 'company' && (
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
                onClick={() => handleSort('applicationsCount')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'applicationsCount' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Applications
                {sortBy === 'applicationsCount' && (
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applications</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posted</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job._id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-xs font-semibold text-gray-900">
                          {job.title}
                        </div>
                        <div className="text-xs text-gray-600 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {job.location}
                          {job.isRemote && (
                            <span className="ml-1 text-blue-600">(Remote)</span>
                          )}
                        </div>
                        {job.salary && (
                          <div className="text-xs text-gray-500 flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {job.salary.currency} {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-6 w-6">
                        <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                          <Building className="w-3 h-3 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-2">
                        <div className="text-xs font-medium text-gray-900">{job.company}</div>
                        <div className="text-xs text-gray-500">{job.postedBy.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(job.type)}`}>
                        {job.type.replace('-', ' ').toUpperCase()}
                      </span>
                      <div className="text-xs text-gray-500">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getExperienceColor(job.experienceLevel)}`}>
                          {job.experienceLevel.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status.toUpperCase()}
                    </span>
                    {job.featured && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          FEATURED
                        </span>
                      </div>
                    )}
                    {job.urgent && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          URGENT
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1 text-gray-500" />
                        <span>{job.applicationsCount} applications</span>
                      </div>
                      <div className="flex items-center">
                        <Eye className="w-3 h-3 mr-1 text-gray-500" />
                        <span>{job.viewsCount} views</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                      {job.deadline && (
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>Due: {new Date(job.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewJob(job._id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View job details"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleEditJob(job._id)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit job"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(job._id, job.status)}
                        className={job.status === 'active' ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                        title={job.status === 'active' ? 'Pause job' : 'Activate job'}
                      >
                        {job.status === 'active' ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      </button>
                      <button 
                        onClick={() => handleDeleteJob(job._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete job"
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

        {jobs.length === 0 && (
          <div className="text-center py-8">
            <Briefcase className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No jobs found</h3>
            <p className="text-xs text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
