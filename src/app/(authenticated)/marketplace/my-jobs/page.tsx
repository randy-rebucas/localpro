"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Plus,
  Edit,
  Trash2,
  Eye,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  Star,
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Job, JobStatus } from "@/types/jobs";

interface JobStats {
  totalJobs: number;
  activeJobs: number;
  pausedJobs: number;
  closedJobs: number;
  totalApplications: number;
  totalViews: number;
}

interface ApiResponse {
  success?: boolean;
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
  data?: Job[];
}

export default function MyJobsPage() {
  const { settings: appSettings } = useAppSettings();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{
    current: number;
    pages: number;
    total: number;
    limit: number;
    count: number;
  } | null>(null);
  const [stats, setStats] = useState<JobStats | null>(null);

  const defaultCurrency = getDefaultCurrency(appSettings);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      params.append("page", currentPage.toString());
      params.append("limit", "10");

      const url = `${API_BASE_URL}${API_ENDPOINTS.jobsMyJobs}?${params.toString()}`;
      logger.debug("Fetching jobs from", { url });
      
      const response = await fetch(url, createAuthFetchOptions());
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error("API Error", undefined, {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      logger.debug("Jobs API response", { 
        hasData: !!data, 
        hasSuccess: 'success' in data,
        hasDataProperty: 'data' in data,
        count: data.count,
        total: data.total
      });
      
      // Handle response structure
      let jobsData: Job[] = [];
      let paginationData = null;
      
      if (data.success && data.data) {
        jobsData = Array.isArray(data.data) ? data.data : [];
        paginationData = {
          current: data.page || 1,
          pages: data.pages || 1,
          total: data.total || 0,
          limit: 10,
          count: data.count || 0
        };
      } else if (Array.isArray(data)) {
        jobsData = data;
      } else {
        logger.warn("Unexpected API response structure", { 
          hasData: !!data,
          properties: data ? Object.keys(data) : []
        });
        jobsData = [];
      }

      // Calculate stats from jobs
      const calculatedStats: JobStats = {
        totalJobs: paginationData?.total || jobsData.length,
        activeJobs: jobsData.filter(job => job.status === "active" || job.isActive).length,
        pausedJobs: jobsData.filter(job => job.status === "paused").length,
        closedJobs: jobsData.filter(job => job.status === "closed" || job.status === "filled").length,
        totalApplications: jobsData.reduce((sum, job) => sum + (job.applications?.length || 0), 0),
        totalViews: jobsData.reduce((sum, job) => sum + (job.views?.count || 0), 0)
      };
      
      setJobs(jobsData);
      setPagination(paginationData);
      setStats(calculatedStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch jobs";
      logger.error("Error fetching jobs", err instanceof Error ? err : new Error(String(err)));
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, currentPage]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Normalize currency to PHP only
  const normalizeCurrencyCode = (_currency: string | undefined | null): string => {
    void _currency;
    return 'PHP';
  };

  const formatPrice = (min?: number, max?: number, currency?: string, period?: string) => {
    if (!min && !max) {
      return "Not specified";
    }
    
    const currencyCode = normalizeCurrencyCode(currency || defaultCurrency);
    
    // formatCurrency already includes the symbol, so we don't need to add it again
    if (min === max) {
      return `${formatCurrency(min || 0, currencyCode, { appSettings })}${period ? `/${period}` : ""}`;
    }
    
    const minFormatted = formatCurrency(min || 0, currencyCode, { appSettings });
    const maxFormatted = formatCurrency(max || 0, currencyCode, { appSettings });
    return `${minFormatted} - ${maxFormatted}${period ? `/${period}` : ""}`;
  };

  const getStatusColor = (status?: JobStatus | string) => {
    switch (status) {
      case "active":
        return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-2 border-green-300 shadow-sm shadow-green-500/20";
      case "paused":
        return "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-2 border-yellow-300 shadow-sm shadow-yellow-500/20";
      case "closed":
      case "filled":
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-2 border-gray-300 shadow-sm";
      case "draft":
        return "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-2 border-blue-300 shadow-sm shadow-blue-500/20";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-2 border-gray-300 shadow-sm";
    }
  };

  const getStatusIcon = (status?: JobStatus | string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="w-4 h-4" />;
      case "paused":
        return <Clock className="w-4 h-4" />;
      case "closed":
      case "filled":
        return <XCircle className="w-4 h-4" />;
      case "draft":
        return <Edit className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatStatus = (status?: JobStatus | string) => {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
      return;
    }

    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.jobsById}/${jobId}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'DELETE'
      }));

      if (!response.ok) {
        throw new Error("Failed to delete job");
      }

      // Refresh the list
      fetchJobs();
    } catch (err) {
      logger.error("Error deleting job", err instanceof Error ? err : new Error(String(err)));
      alert("Failed to delete job. Please try again.");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6">
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-1">My Jobs</h1>
                <p className="text-gray-600">Manage your job postings</p>
              </div>
              <Link
                href="/marketplace/create-job"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Post New Job
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6">
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-1">My Jobs</h1>
                <p className="text-gray-600">Manage your job postings</p>
              </div>
              <Link
                href="/marketplace/create-job"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Post New Job
              </Link>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-red-50/30 rounded-xl border-2 border-red-200 shadow-lg p-8 backdrop-blur-sm">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-2">Error Loading Jobs</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => fetchJobs()}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 font-semibold"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-1">My Jobs</h1>
              <p className="text-gray-600">Manage your job postings and track applications</p>
            </div>
            <Link
              href="/marketplace/create-job"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Post New Job
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-all p-4 backdrop-blur-sm hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg shadow-md shadow-emerald-500/20">
                  <Briefcase className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-green-50/50 rounded-xl border-2 border-green-200 shadow-md hover:shadow-lg transition-all p-4 backdrop-blur-sm hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Active Jobs</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.activeJobs}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-200 rounded-lg shadow-md shadow-green-500/20">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-xl border-2 border-blue-200 shadow-md hover:shadow-lg transition-all p-4 backdrop-blur-sm hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Applications</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stats.totalApplications}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg shadow-md shadow-blue-500/20">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-purple-50/50 rounded-xl border-2 border-purple-200 shadow-md hover:shadow-lg transition-all p-4 backdrop-blur-sm hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Views</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{stats.totalViews}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-200 rounded-lg shadow-md shadow-purple-500/20">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-semibold text-gray-700">Filter by status:</span>
            <div className="flex flex-wrap gap-2">
              {["all", "active", "paused", "closed", "draft"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 ${
                    statusFilter === status
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl"
                      : "bg-white text-gray-700 border-2 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50 shadow-sm hover:shadow-md"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-12 backdrop-blur-sm">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                <Briefcase className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-2">
                No jobs found
              </h3>
              <p className="text-gray-600 mb-6">
                {statusFilter !== "all"
                  ? `You don't have any ${statusFilter} jobs yet.`
                  : "You haven't posted any jobs yet. Create your first job posting to get started!"}
              </p>
              <Link
                href="/marketplace/create-job"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Post Your First Job
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const jobId = job._id || (job as { id?: string }).id;
              const categoryName = typeof job.category === 'object' ? job.category?.name : job.category;
              const companyName = job.company?.name || "Unknown Company";
              const companyLogo = job.company?.logo?.url;
              const location = job.company?.location;
              const isRemote = location?.isRemote || job.isRemote;
              const salary = job.salary;
              const applicationsCount = job.applications?.length || 0;
              const viewsCount = job.views?.count || 0;
              const status = job.status || (job.isActive ? "active" : "paused");

              return (
                <div
                  key={jobId}
                  className="p-6 bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm hover:scale-[1.01]"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Company Logo */}
                    <div className="flex-shrink-0">
                      {companyLogo ? (
                        <Image
                          src={companyLogo}
                          alt={companyName}
                          width={80}
                          height={80}
                          className="rounded-lg object-cover border-2 border-gray-300 shadow-md hover:shadow-lg transition-all"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center border-2 border-emerald-300 shadow-md shadow-emerald-500/20">
                          <Building2 className="w-10 h-10 text-emerald-600" />
                        </div>
                      )}
                    </div>

                    {/* Job Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
                              {job.title}
                            </h3>
                            {job.featured?.isFeatured && (
                              <span className="px-2.5 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-semibold rounded-full flex items-center gap-1 shadow-md shadow-yellow-500/30 border border-yellow-300">
                                <Star className="w-3 h-3 fill-current" />
                                Featured
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              <span>{companyName}</span>
                            </div>
                            {categoryName && (
                              <div className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                <span>{categoryName}</span>
                              </div>
                            )}
                            {location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>
                                  {isRemote
                                    ? "Remote"
                                    : `${location.city || ""}${location.city && location.state ? ", " : ""}${location.state || ""}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(status)}`}>
                          {getStatusIcon(status)}
                          {formatStatus(status)}
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-6 text-sm mb-4">
                        {salary && (
                          <div className="flex items-center gap-1 text-gray-700">
                            <div className="p-1.5 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg">
                              <DollarSign className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="font-semibold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                              {formatPrice(salary.min, salary.max, salary.currency, salary.period)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-gray-700">
                          <Users className="w-4 h-4" />
                          <span>{applicationsCount} application{applicationsCount !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-700">
                          <Eye className="w-4 h-4" />
                          <span>{viewsCount} view{viewsCount !== 1 ? "s" : ""}</span>
                        </div>
                        {job.createdAt && (
                          <div className="flex items-center gap-1 text-gray-700">
                            <Calendar className="w-4 h-4" />
                            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {job.tags && job.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.tags.slice(0, 5).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2.5 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs font-medium rounded-full border-2 border-blue-300 shadow-sm hover:shadow-md hover:scale-105 transition-all"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-3 pt-4 border-t-2 border-gray-200">
                        <Link
                          href={`/jobs/${jobId}`}
                          className="px-4 py-2 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md hover:scale-105 flex items-center gap-2 font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                        <Link
                          href={`/jobs/${jobId}/edit`}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 flex items-center gap-2 font-semibold"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Link>
                        {applicationsCount > 0 && (
                          <Link
                            href={`/jobs/${jobId}#applications`}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105 flex items-center gap-2 font-semibold"
                          >
                            <Users className="w-4 h-4" />
                            Applications ({applicationsCount})
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            if (jobId) {
                              handleDelete(jobId);
                            }
                          }}
                          disabled={!jobId}
                          className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-500/30 hover:shadow-xl hover:scale-105 flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-600">
                Showing {((pagination.current - 1) * pagination.limit) + 1} to{" "}
                {Math.min(pagination.current * pagination.limit, pagination.total)} of{" "}
                {pagination.total} jobs
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.current - 1)}
                  disabled={pagination.current === 1}
                  className="px-4 py-2 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md hover:scale-105 font-medium"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === pagination.pages ||
                        (page >= pagination.current - 1 && page <= pagination.current + 1)
                    )
                    .map((page, index, array) => (
                      <div key={page} className="flex items-center gap-1">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-lg transition-all font-semibold hover:scale-105 ${
                            pagination.current === page
                              ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl"
                              : "bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 hover:from-gray-50 hover:to-gray-100 shadow-sm hover:shadow-md"
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    ))}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={pagination.current === pagination.pages}
                  className="px-4 py-2 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md hover:scale-105 font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

