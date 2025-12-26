"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Briefcase,
  Search,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Plus,
  BarChart3,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Building,
  MapPin,
  Coins,
  Image as ImageIcon,
  Filter,
  Tag,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { useToast, ToastContainer } from "@/components/ui/toast";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/shared/pagination";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import {
  Job,
  JobStatus,
  JobType,
  ExperienceLevel,
  ApplicationStatus,
  Company,
  Application,
} from "@/types/jobs";

type JobsTab = "jobs" | "categories";

interface JobCategory {
  _id?: string;
  id?: string;
  key: string;
  name: string;
  description?: string;
  icon?: string;
  slug?: string;
  displayOrder?: number;
  isActive?: boolean;
  isDeleted?: boolean;
  subcategories?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface JobStats {
  totalJobs?: number;
  activeJobs?: number;
  pausedJobs?: number;
  closedJobs?: number;
  draftJobs?: number;
  totalApplications?: number;
  averageApplicationsPerJob?: number;
  viewsCount?: number;
  applicationsCount?: number;
}

const sanitizeCategoryKey = (value: string): string => {
  if (!value) return "";
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
};

const getCategoryLabel = (key?: string): string => {
  if (!key) return "—";
  const sanitized = sanitizeCategoryKey(key);
  return sanitized
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ""))
    .join(" ");
};

const normalizeJobCategory = (raw: unknown): JobCategory | null => {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;
  const key =
    sanitizeCategoryKey(
      (candidate.key ||
        candidate.slug ||
        candidate.name ||
        candidate.id ||
        candidate._id ||
        "") as string
    ) || "";
  const name =
    (candidate.name ||
      candidate.label ||
      candidate.title ||
      candidate.key ||
      candidate.slug ||
      key) as string;

  if (!key || !name) return null;

  const displayOrderValue = candidate.displayOrder;
  const displayOrder =
    typeof displayOrderValue === "number"
      ? displayOrderValue
      : typeof displayOrderValue === "string" && displayOrderValue.trim() !== ""
        ? Number(displayOrderValue)
        : undefined;

  return {
    _id: (candidate._id as string) || undefined,
    id: (candidate.id as string) || undefined,
    key,
    name,
    description: (candidate.description as string) || undefined,
    icon: (candidate.icon as string) || undefined,
    slug: (candidate.slug as string) || key,
    displayOrder,
    isActive:
      candidate.isActive !== undefined
        ? Boolean(candidate.isActive)
        : candidate.status
          ? String(candidate.status).toLowerCase() === "active"
          : true,
    isDeleted:
      candidate.isDeleted !== undefined
        ? Boolean(candidate.isDeleted)
        : candidate.status
          ? String(candidate.status).toLowerCase() === "deleted"
          : false,
    subcategories: Array.isArray(candidate.subcategories)
      ? (candidate.subcategories as string[])
      : undefined,
    createdAt: (candidate.createdAt as string) || undefined,
    updatedAt: (candidate.updatedAt as string) || undefined,
  };
};

interface JobsResponse {
  success: boolean;
  data?: Job[];
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
  message?: string;
}

export default function AdminJobsPage() {
  const [activeTab, setActiveTab] = useState<JobsTab>("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    count: 0,
  });
  const { toasts, success, error: showError, removeToast } = useToast();

  // Categories state
  const [categoriesData, setCategoriesData] = useState<JobCategory[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categoryForm, setCategoryForm] = useState<{
    key: string;
    name: string;
    description: string;
    icon: string;
    displayOrder: string;
    isActive: boolean;
  }>({
    key: "",
    name: "",
    description: "",
    icon: "",
    displayOrder: "",
    isActive: true,
  });
  const [editingCategory, setEditingCategory] = useState<JobCategory | null>(null);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: "",
    category: "",
    jobType: "",
    search: "",
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedJobStats, setSelectedJobStats] = useState<JobStats | null>(null);
  const [selectedJobApplications, setSelectedJobApplications] = useState<(Application & { _id?: string })[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    company: {
      name: "",
      website: "",
      size: "medium" as Company["size"],
      industry: "",
      location: {
        address: "",
        city: "",
        state: "",
        country: "",
        isRemote: false,
        remoteType: "fully_remote" as "fully_remote" | "hybrid" | "on_site",
      },
    },
    category: "",
    subcategory: "",
    jobType: "full_time" as JobType,
    experienceLevel: "mid" as ExperienceLevel,
    salary: {
      min: "",
      max: "",
      currency: "PHP",
      period: "yearly" as "hourly" | "daily" | "weekly" | "monthly" | "yearly",
      isNegotiable: false,
      isConfidential: false,
    },
    benefits: [] as string[],
    requirements: {
      skills: [] as string[],
      education: {
        level: "bachelor" as "high_school" | "associate" | "bachelor" | "master" | "phd" | "none_required",
        field: "",
        isRequired: false,
      },
      experience: {
        years: 0,
        description: "",
      },
    },
    responsibilities: [] as string[],
    qualifications: [] as string[],
    status: "draft" as JobStatus,
    visibility: "public" as "public" | "private" | "featured",
    tags: [] as string[],
  });

  const [editForm, setEditForm] = useState(createForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!getApiToken()) {
        throw new Error("Authentication required");
      }

      const queryParams = new URLSearchParams();
      queryParams.append("page", filters.page.toString());
      queryParams.append("limit", filters.limit.toString());
      if (filters.status) queryParams.append("status", filters.status);
      // Only include category if it's a valid ObjectId (24 hex characters)
      // This prevents errors when category names are passed instead of IDs
      if (filters.category && /^[0-9a-fA-F]{24}$/.test(filters.category)) {
        queryParams.append("category", filters.category);
      }
      if (filters.jobType) queryParams.append("jobType", filters.jobType);
      if (filters.search) queryParams.append("search", filters.search);

      // For admin, use the main jobs endpoint to get all jobs
      // The my-jobs endpoint is for providers to see their own jobs
      const url = `${API_BASE_URL}${API_ENDPOINTS.jobs}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `Failed to fetch jobs: ${response.status}`;
        logger.error("API Error Response", undefined, { 
          status: response.status, 
          errorData,
          url 
        });
        throw new Error(errorMessage);
      }

      const data: JobsResponse = await response.json();

      if (data.success && data.data) {
        setJobs(data.data);
        setPagination({
          page: data.page || 1,
          pages: data.pages || 1,
          total: data.total || 0,
          count: data.count || 0,
        });
      } else {
        setJobs([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching jobs", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleCreate = async () => {
    try {
      if (!createForm.title || !createForm.description || !createForm.company.name) {
        showError("Title, description, and company name are required");
        return;
      }

      if (!getApiToken()) {
        showError("Authentication required");
        return;
      }

      const payload = {
        ...createForm,
        salary: {
          ...createForm.salary,
          min: createForm.salary.min ? Number(createForm.salary.min) : undefined,
          max: createForm.salary.max ? Number(createForm.salary.max) : undefined,
        },
      };

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.jobs}`, {
        ...createAuthFetchOptions(),
        method: "POST",
        headers: {
          ...createAuthFetchOptions().headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create job: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        success("Job created successfully");
        setShowCreateModal(false);
        resetCreateForm();
        fetchJobs();
      } else {
        throw new Error(result.message || "Failed to create job");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      showError(errorMessage);
      logger.error("Error creating job", err instanceof Error ? err : new Error(errorMessage));
    }
  };

  const handleUpdate = async () => {
    try {
      if (!selectedJob?._id) {
        showError("No job selected");
        return;
      }

      if (!getApiToken()) {
        showError("Authentication required");
        return;
      }

      const payload = {
        ...editForm,
        salary: {
          ...editForm.salary,
          min: editForm.salary.min ? Number(editForm.salary.min) : undefined,
          max: editForm.salary.max ? Number(editForm.salary.max) : undefined,
        },
      };

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.jobsById}/${selectedJob._id}`, {
        ...createAuthFetchOptions(),
        method: "PUT",
        headers: {
          ...createAuthFetchOptions().headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update job: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        success("Job updated successfully");
        setShowEditModal(false);
        fetchJobs();
      } else {
        throw new Error(result.message || "Failed to update job");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      showError(errorMessage);
      logger.error("Error updating job", err instanceof Error ? err : new Error(errorMessage));
    }
  };

  const handleDelete = async () => {
    try {
      if (!selectedJob?._id) {
        showError("No job selected");
        return;
      }

      if (!getApiToken()) {
        showError("Authentication required");
        return;
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.jobsById}/${selectedJob._id}`, {
        ...createAuthFetchOptions(),
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete job: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        success("Job deleted successfully");
        setShowDeleteModal(false);
        setSelectedJob(null);
        fetchJobs();
      } else {
        throw new Error(result.message || "Failed to delete job");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      showError(errorMessage);
      logger.error("Error deleting job", err instanceof Error ? err : new Error(errorMessage));
    }
  };

  const handleUploadLogo = async () => {
    try {
      if (!selectedJob?._id || !logoFile) {
        showError("Please select a job and logo file");
        return;
      }

      // Validate file before uploading
      if (!(logoFile instanceof File) || logoFile.size === 0) {
        showError("Invalid file. Please select a valid image file.");
        return;
      }

      // Validate file type
      if (!logoFile.type.startsWith('image/')) {
        showError("Please select an image file (PNG, JPG, GIF, etc.)");
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (logoFile.size > maxSize) {
        showError("File size must be less than 5MB");
        return;
      }

      const apiToken = getApiToken();
      if (!apiToken) {
        showError("Authentication required");
        return;
      }

      setLoading(true);

      const formData = new FormData();
      // Use "logo" as the field name - backend expects this field name
      formData.append("logo", logoFile, logoFile.name || "logo.jpg");

      // Log upload details for debugging
      logger.debug('Uploading logo', {
        url: `${API_BASE_URL}${API_ENDPOINTS.jobsById}/${selectedJob._id}/logo`,
        jobId: selectedJob._id,
        fileName: logoFile.name,
        fileSize: logoFile.size,
        fileType: logoFile.type,
        fieldName: 'logo'
      });

      // Create headers manually without Content-Type for FormData
      // The browser will automatically set Content-Type with boundary
      const headers: HeadersInit = {
        'Authorization': `Bearer ${apiToken}`,
      };

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.jobsById}/${selectedJob._id}/logo`, {
        method: "POST",
        headers,
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        // Check if response is actually JSON before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          throw new Error(text || `Failed to upload logo: ${response.status}`);
        }
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `Failed to upload logo: ${response.status}`);
      }

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(text || 'Invalid response format');
      }

      const result = await response.json();
      if (result.success) {
        success("Logo uploaded successfully");
        setShowLogoModal(false);
        setLogoFile(null);
        fetchJobs();
      } else {
        throw new Error(result.message || result.error || "Failed to upload logo");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      showError(errorMessage);
      logger.error("Error uploading logo", err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleViewStats = async (job: Job) => {
    try {
      if (!job._id) {
        showError("Job ID is required");
        return;
      }

      if (!getApiToken()) {
        showError("Authentication required");
        return;
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.jobsById}/${job._id}/stats`, {
        ...createAuthFetchOptions({ method: "GET" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch stats: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setSelectedJobStats(result.data);
        setSelectedJob(job);
        setShowStatsModal(true);
      } else {
        throw new Error(result.message || "Failed to fetch stats");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      showError(errorMessage);
      logger.error("Error fetching stats", err instanceof Error ? err : new Error(errorMessage));
    }
  };

  const handleViewApplications = async (job: Job) => {
    try {
      if (!job._id) {
        showError("Job ID is required");
        return;
      }

      if (!getApiToken()) {
        showError("Authentication required");
        return;
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.jobsById}/${job._id}/applications`, {
        ...createAuthFetchOptions({ method: "GET" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch applications: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        const applications = Array.isArray(result.data) ? result.data : [];
        setSelectedJobApplications(applications);
        setSelectedJob(job);
        setShowApplicationsModal(true);
      } else {
        throw new Error(result.message || "Failed to fetch applications");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      showError(errorMessage);
      logger.error("Error fetching applications", err instanceof Error ? err : new Error(errorMessage));
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: ApplicationStatus) => {
    try {
      if (!selectedJob?._id) {
        showError("No job selected");
        return;
      }

      if (!getApiToken()) {
        showError("Authentication required");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.jobsById}/${selectedJob._id}/applications/${applicationId}/status`,
        {
          ...createAuthFetchOptions(),
          method: "PUT",
          headers: {
            ...createAuthFetchOptions().headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update application status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        success("Application status updated successfully");
        handleViewApplications(selectedJob);
      } else {
        throw new Error(result.message || "Failed to update application status");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      showError(errorMessage);
      logger.error("Error updating application status", err instanceof Error ? err : new Error(errorMessage));
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      title: "",
      description: "",
      company: {
        name: "",
        website: "",
        size: "medium",
        industry: "",
        location: {
          address: "",
          city: "",
          state: "",
          country: "",
          isRemote: false,
          remoteType: "fully_remote",
        },
      },
      category: "",
      subcategory: "",
      jobType: "full_time",
      experienceLevel: "mid",
      salary: {
        min: "",
        max: "",
        currency: "PHP",
        period: "yearly",
        isNegotiable: false,
        isConfidential: false,
      },
      benefits: [],
      requirements: {
        skills: [],
        education: {
          level: "bachelor",
          field: "",
          isRequired: false,
        },
        experience: {
          years: 0,
          description: "",
        },
      },
      responsibilities: [],
      qualifications: [],
      status: "draft",
      visibility: "public",
      tags: [],
    });
  };

  const openEditModal = (job: Job) => {
    setSelectedJob(job);
    const company = job.company || { name: "" };
    const salary = job.salary;
    const requirements = job.requirements;
    
    // Determine category value - try to match with available categories
    let categoryValue = "";
    if (typeof job.category === 'string') {
      // If it's a string, try to find matching category by ID, key, or name
      const matchedCategory = categoriesData.find(
        cat => cat._id === job.category || 
               cat.id === job.category || 
               (cat.key && cat.key === job.category) ||
               (cat.name && cat.name === job.category)
      );
      categoryValue = matchedCategory ? (matchedCategory._id || matchedCategory.id || (matchedCategory.key || "")) : job.category;
    } else if (job.category && typeof job.category === 'object') {
      // If it's an object (JobCategory type), use its ID
      const catObj = job.category as { _id?: string; id?: string; name?: string };
      categoryValue = catObj._id || catObj.id || "";
      // If not found in object, try to match by name
      if (!categoryValue && catObj.name) {
        const matchedCategory = categoriesData.find(cat => cat.name === catObj.name);
        categoryValue = matchedCategory ? (matchedCategory._id || matchedCategory.id || (matchedCategory.key || "")) : "";
      }
    }
    
    setEditForm({
      title: job.title || "",
      description: job.description || "",
      company: {
        name: company.name || "",
        website: company.website || "",
        size: company.size || "medium",
        industry: company.industry || "",
        location: {
          address: company.location?.address || "",
          city: company.location?.city || "",
          state: company.location?.state || "",
          country: company.location?.country || "",
          isRemote: company.location?.isRemote || false,
          remoteType: (company.location?.remoteType || "fully_remote") as "fully_remote" | "hybrid" | "on_site",
        } as { address: string; city: string; state: string; country: string; isRemote: boolean; remoteType: "fully_remote" | "hybrid" | "on_site" },
      },
      category: categoryValue,
      subcategory: job.subcategory || "",
      jobType: job.jobType || "full_time",
      experienceLevel: job.experienceLevel || "mid",
      salary: {
        min: salary?.min?.toString() || "",
        max: salary?.max?.toString() || "",
        currency: salary?.currency || "PHP",
        period: (salary?.period || "yearly") as "hourly" | "daily" | "weekly" | "monthly" | "yearly",
        isNegotiable: salary?.isNegotiable || false,
        isConfidential: salary?.isConfidential || false,
      },
      benefits: job.benefits || [],
      requirements: {
        skills: requirements?.skills || [],
        education: {
          level: (requirements?.education?.level || "bachelor") as "high_school" | "associate" | "bachelor" | "master" | "phd" | "none_required",
          field: requirements?.education?.field || "",
          isRequired: requirements?.education?.isRequired || false,
        },
        experience: {
          years: requirements?.experience?.years || 0,
          description: requirements?.experience?.description || "",
        },
      },
      responsibilities: job.responsibilities || [],
      qualifications: job.qualifications || [],
      status: job.status || "draft",
      visibility: (job.visibility || "public") as "public" | "private" | "featured",
      tags: job.tags || [],
    });
    setShowEditModal(true);
  };

  const openViewModal = (job: Job) => {
    setSelectedJob(job);
    setShowViewModal(true);
  };

  const openDeleteModal = (job: Job) => {
    setSelectedJob(job);
    setShowDeleteModal(true);
  };

  const openLogoModal = (job: Job) => {
    setSelectedJob(job);
    setShowLogoModal(true);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-accent/10 text-accent";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "closed":
        return "bg-red-100 text-red-800";
      case "filled":
        return "bg-primary/10 text-primary";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="w-3 h-3" />;
      case "paused":
        return <Clock className="w-3 h-3" />;
      case "closed":
        return <XCircle className="w-3 h-3" />;
      case "filled":
        return <CheckCircle2 className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getApplicationStatusColor = (status?: string) => {
    switch (status) {
      case "hired":
        return "bg-accent/10 text-accent";
      case "shortlisted":
        return "bg-primary/10 text-primary";
      case "interviewed":
        return "bg-purple-100 text-purple-800";
      case "reviewing":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const fetchCategories = useCallback(async () => {
    const parseCategories = (data: unknown): JobCategory[] => {
      let rawCategories: unknown = [];
      if (Array.isArray(data)) {
        rawCategories = data;
      } else if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        const dataField = obj.data as unknown;

        if (Array.isArray(dataField)) {
          rawCategories = dataField;
        } else if (
          dataField &&
          typeof dataField === "object" &&
          Array.isArray((dataField as { categories?: unknown[] }).categories)
        ) {
          rawCategories = (dataField as { categories?: unknown[] }).categories;
        } else if (
          dataField &&
          typeof dataField === "object" &&
          Array.isArray((dataField as { items?: unknown[] }).items)
        ) {
          rawCategories = (dataField as { items?: unknown[] }).items;
        } else if (Array.isArray(obj.categories as unknown[])) {
          rawCategories = obj.categories;
        } else {
          const firstArrayKey = Object.keys(obj).find((key) => Array.isArray(obj[key] as unknown[]));
          rawCategories = firstArrayKey ? obj[firstArrayKey] : [];
        }
      }

      const normalizedCategories = Array.isArray(rawCategories)
        ? (rawCategories
            .map((item) => normalizeJobCategory(item))
            .filter(Boolean) as JobCategory[])
        : [];

      normalizedCategories.sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
      );

      return normalizedCategories;
    };

    const fetchFromEndpoint = async (url: string) => {
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
      if (!response.ok) {
        let errorMessage = `Failed to load categories (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, try to get text
          try {
            const text = await response.text();
            if (text) errorMessage = text;
          } catch {
            // Use default error message
          }
        }
        throw new Error(errorMessage);
      }
      const data = await response.json().catch(() => ({}));
      return parseCategories(data);
    };

    try {
      setCategoryLoading(true);
      setCategoryError(null);

      if (!getApiToken()) {
        setCategoryError("Authentication required. Please log in again.");
        setCategoriesData([]);
        return;
      }

      // Try without query parameters first (similar to useJobCategories hook)
      const url = `${API_BASE_URL}${API_ENDPOINTS.jobsCategories}`;
      const categories = await fetchFromEndpoint(url);
      setCategoriesData(categories);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("Error fetching job categories", error);
      setCategoryError(error.message);
      setCategoriesData([]);
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  // Fetch categories on component mount and when categories tab is active
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (activeTab === "categories") {
      fetchCategories();
    }
  }, [activeTab, fetchCategories]);

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({
      key: "",
      name: "",
      description: "",
      icon: "",
      displayOrder: "",
      isActive: true,
    });
  };

  const handleCategorySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const sanitizedKey = sanitizeCategoryKey(categoryForm.key || categoryForm.name);
    const name = categoryForm.name.trim() || categoryForm.key;

    if (!sanitizedKey || !name) {
      showError("Category key and name are required");
      return;
    }

    try {
      setCategorySubmitting(true);
      setCategoryError(null);

      if (!getApiToken()) {
        throw new Error("Authentication required");
      }

      const payload = {
        key: sanitizedKey,
        name: name.trim(),
        description: categoryForm.description.trim() || undefined,
        icon: categoryForm.icon.trim() || undefined,
        displayOrder:
          categoryForm.displayOrder && categoryForm.displayOrder.trim() !== ""
            ? Number(categoryForm.displayOrder)
            : 0,
        isActive: categoryForm.isActive,
      };

      const updateIdentifier = editingCategory?._id || editingCategory?.id || editingCategory?.key;
      const url = editingCategory
        ? `${API_BASE_URL}${API_ENDPOINTS.jobsCategories}${updateIdentifier ? `/${encodeURIComponent(updateIdentifier)}` : ""}`
        : `${API_BASE_URL}${API_ENDPOINTS.jobsCategories}`;

      if (editingCategory && !updateIdentifier) {
        throw new Error("Cannot update category: missing category id");
      }

      const response = await fetch(
        url,
        createAuthFetchOptions({
          method: editingCategory ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Failed to ${editingCategory ? "update" : "create"} category`
        );
      }

      const result = await response.json().catch(() => ({}));
      if (
        result &&
        typeof result === "object" &&
        "success" in result &&
        result.success === false
      ) {
        throw new Error(
          result.error || `Failed to ${editingCategory ? "update" : "create"} category`
        );
      }

      success(editingCategory ? "Category updated" : "Category created");
      resetCategoryForm();
      await fetchCategories();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("Error saving category", error);
      setCategoryError(error.message);
      showError(error.message);
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleEditCategory = (category: JobCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      key: category.key || "",
      name: category.name || "",
      description: category.description || "",
      icon: category.icon || "",
      displayOrder:
        category.displayOrder !== undefined && category.displayOrder !== null
          ? String(category.displayOrder)
          : "",
      isActive: category.isActive ?? true,
    });
  };

  const handleDeleteCategory = async (category?: JobCategory) => {
    const identifier =
      category?._id ||
      category?.id ||
      category?.key ||
      sanitizeCategoryKey(category?.name || "");
    if (!identifier) return;
    if (!confirm("Delete this category? This cannot be undone.")) return;

    try {
      setCategorySubmitting(true);
      if (!getApiToken()) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.jobsCategories}/${encodeURIComponent(
          identifier
        )}`,
        createAuthFetchOptions({ method: "DELETE" })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete category");
      }

      const result = await response.json().catch(() => ({}));
      if (result && typeof result === "object" && "success" in result && result.success === false) {
        throw new Error(result.error || "Failed to delete category");
      }

      success("Category deleted");
      await fetchCategories();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error("Error deleting category", error);
      setCategoryError(error.message);
      showError(error.message);
    } finally {
      setCategorySubmitting(false);
    }
  };

  const renderCategoryState = (category: JobCategory) => {
    if (category.isDeleted) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Deleted
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
          category.isActive ? "bg-accent/10 text-accent" : "bg-gray-100 text-gray-800"
        }`}
      >
        {category.isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      job.title?.toLowerCase().includes(searchLower) ||
      job.company?.name?.toLowerCase().includes(searchLower) ||
      job.description?.toLowerCase().includes(searchLower) ||
      (typeof job.category === 'string' ? job.category.toLowerCase().includes(searchLower) : job.category?.name?.toLowerCase().includes(searchLower) || false)
    );
  });

  if (loading && jobs.length === 0) {
    return <Loading />;
  }

  if (error && jobs.length === 0) {
    return <AdminErrorState error={error} onRetry={() => fetchJobs()} />;
  }

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Jobs Management</h1>
          <p className="text-gray-600 text-xs">Manage job postings, applications, and recruitment</p>
        </div>
        <div className="mt-2 sm:mt-0">
          {activeTab === "jobs" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all duration-200"
            >
              <Plus className="w-3 h-3 mr-1" />
              Create Job
            </button>
          )}
          {activeTab === "categories" && (
            <button
              onClick={fetchCategories}
              disabled={categoryLoading}
              className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 transition-all duration-200"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${categoryLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'jobs'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Briefcase className="w-3 h-3 inline mr-1" />
              Jobs
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'categories'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Tag className="w-3 h-3 inline mr-1" />
              Categories
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'jobs' && (
        <>

      {/* Filters and Controls */}
      <div className="bg-white rounded shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
              >
                <Filter className="w-3 h-3 mr-1" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <div className="text-xs text-gray-500">
                {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, company, description..."
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                  <option value="filled">Filled</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Job Type</label>
                <select
                  value={filters.jobType}
                  onChange={(e) => setFilters({ ...filters, jobType: e.target.value, page: 1 })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">All Types</option>
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="internship">Internship</option>
                  <option value="temporary">Temporary</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">&nbsp;</label>
                <button
                  onClick={() => fetchJobs()}
                  className="w-full inline-flex items-center justify-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilters({ ...filters, status: "", jobType: "", category: "", search: "", page: 1 });
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-200">
          <h3 className="text-xs font-medium text-gray-900">Jobs</h3>
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-gray-500 text-xs">
                    No jobs found
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr key={job._id} className="hover:bg-gray-50">
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-6 w-6">
                          <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                            <Briefcase className="w-3 h-3 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-2">
                          <div className="text-xs font-semibold text-gray-900">{job.title}</div>
                          <div className="text-[10px] text-gray-600">
                            {job.company?.location?.city && job.company.location.state && (
                              <>
                                <MapPin className="w-2.5 h-2.5 inline mr-0.5" />
                                {job.company.location.city}, {job.company.location.state}
                              </>
                            )}
                            {job.company?.location?.isRemote && (
                              <span className="ml-1 text-primary">(Remote)</span>
                            )}
                          </div>
                          {job.salary && (
                            <div className="text-[10px] text-gray-500">
                              <Coins className="w-2.5 h-2.5 inline mr-0.5" />
                              {job.salary.currency} {job.salary.min?.toLocaleString()}
                              {job.salary.max && ` - ${job.salary.max.toLocaleString()}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-5 w-5">
                          {job.company?.logo?.url ? (
                            <Image
                              src={job.company.logo.url}
                              alt={job.company.name}
                              width={20}
                              height={20}
                              className="h-5 w-5 rounded-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-gray-300 flex items-center justify-center">
                              <Building className="w-2.5 h-2.5 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-1.5">
                          <div className="text-xs font-medium text-gray-900">{job.company?.name || "N/A"}</div>
                          <div className="text-[10px] text-gray-500">{job.company?.industry || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                          {job.jobType?.replace("_", " ").toUpperCase()}
                        </span>
                        <div>
                          <span className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800">
                            {job.experienceLevel?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-xs font-medium ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {getStatusIcon(job.status)}
                        {job.status?.toUpperCase() || "DRAFT"}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap text-xs text-gray-700">
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1 text-gray-500" />
                        <span className="text-[10px]">{job.applications?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openViewModal(job)}
                          className="text-primary hover:text-primary"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleViewStats(job)}
                          className="text-purple-600 hover:text-purple-900"
                          title="View Stats"
                        >
                          <BarChart3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleViewApplications(job)}
                          className="text-accent hover:text-accent"
                          title="View Applications"
                        >
                          <Users className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openLogoModal(job)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Upload Logo"
                        >
                          <ImageIcon className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openEditModal(job)}
                          className="text-accent hover:text-accent"
                          title="Edit"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(job)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) => setFilters({ ...filters, page })}
            />
          </div>
        )}
      </div>
        </>
      )}

      {activeTab === 'categories' && (
        <div className="bg-white rounded shadow p-3 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Job Categories</h3>
              <p className="text-xs text-gray-600">
                Create, update, and order job categories.
              </p>
              {categoryError && (
                <p className="text-xs text-red-600 mt-1">{categoryError}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <form className="space-y-2.5 md:col-span-1" onSubmit={handleCategorySubmit}>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Key *</label>
                <input
                  type="text"
                  value={categoryForm.key}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, key: sanitizeCategoryKey(e.target.value) })
                  }
                  placeholder="e.g., software_engineering"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-ring focus:border-primary text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lowercase, unique identifier (letters, numbers, underscores).
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Software Engineering"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-ring focus:border-primary text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-ring focus:border-primary text-sm"
                  placeholder="Optional short description"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Icon (optional)</label>
                <input
                  type="text"
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  placeholder="e.g., code"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-ring focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={categoryForm.displayOrder}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, displayOrder: e.target.value })
                  }
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-ring focus:border-primary text-sm"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-ring border-gray-300 rounded"
                />
                <label className="ml-2 block text-xs text-gray-700">Active</label>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="px-2.5 py-1.5 border border-gray-300 rounded-md text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={categorySubmitting}
                  className="px-2.5 py-1.5 bg-primary text-white rounded-md text-xs hover:bg-primary/90 disabled:opacity-50"
                >
                  {categorySubmitting
                    ? editingCategory
                      ? 'Updating...'
                      : 'Creating...'
                    : editingCategory
                      ? 'Update Category'
                      : 'Create Category'}
                </button>
              </div>
            </form>

            <div className="md:col-span-2">
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2.5 py-1.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Key</th>
                      <th className="px-2.5 py-1.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                      <th className="px-2.5 py-1.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-2.5 py-1.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                      <th className="px-2.5 py-1.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categoriesData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-2.5 py-1.5 text-center text-xs text-gray-500">
                          {categoryLoading ? "Loading categories..." : "No categories found"}
                        </td>
                      </tr>
                    ) : (
                      categoriesData.map((category) => {
                        const identifier =
                          category._id ||
                          category.id ||
                          category.key ||
                          sanitizeCategoryKey(category.name);
                        return (
                          <tr key={identifier || category.name}>
                            <td className="px-2.5 py-1.5 text-xs font-semibold text-gray-900">
                              {sanitizeCategoryKey(category.key)}
                            </td>
                            <td className="px-2.5 py-1.5 text-xs text-gray-900">
                              {category.name || getCategoryLabel(category.key)}
                              {category.description && (
                                <div className="text-[11px] text-gray-500 line-clamp-1">
                                  {category.description}
                                </div>
                              )}
                            </td>
                            <td className="px-2.5 py-1.5">
                              {renderCategoryState(category)}
                            </td>
                            <td className="px-2.5 py-1.5 text-xs text-gray-600">
                              {category.displayOrder ?? 0}
                            </td>
                            <td className="px-2.5 py-1.5 text-xs font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditCategory(category)}
                                  className="text-primary hover:text-primary"
                                  title="Edit category"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete category"
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
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetCreateForm();
        }}
        title="Create New Job"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "Create Job"}
            </Button>
          </div>
        }
      >
        <div className="space-y-2 max-h-[80vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-xs font-medium mb-0.5">Title *</label>
            <Input
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              placeholder="Job title"
              className="text-xs px-2 py-1.5 h-8"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-0.5">Description *</label>
            <Textarea
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Job description"
              rows={3}
              className="text-xs px-2 py-1.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-0.5">Company Name *</label>
              <Input
                value={createForm.company.name}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    company: { ...createForm.company, name: e.target.value },
                  })
                }
                placeholder="Company name"
                className="text-xs px-2 py-1.5 h-8"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-0.5">Category *</label>
              <Select
                value={createForm.category}
                onValueChange={(value) => setCreateForm({ ...createForm, category: value })}
                options={categoriesData
                  .filter(cat => cat.isActive !== false && cat.isDeleted !== true)
                  .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                  .map(cat => ({
                    value: cat._id || cat.id || cat.key || "",
                    label: cat.name || getCategoryLabel(cat.key)
                  }))}
                placeholder="Select a category"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-0.5">Job Type *</label>
              <Select
                value={createForm.jobType}
                onValueChange={(value) => setCreateForm({ ...createForm, jobType: value as JobType })}
                options={[
                  { value: "full_time", label: "Full Time" },
                  { value: "part_time", label: "Part Time" },
                  { value: "contract", label: "Contract" },
                  { value: "freelance", label: "Freelance" },
                  { value: "internship", label: "Internship" },
                  { value: "temporary", label: "Temporary" },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-0.5">Experience Level *</label>
              <Select
                value={createForm.experienceLevel}
                onValueChange={(value) => setCreateForm({ ...createForm, experienceLevel: value as ExperienceLevel })}
                options={[
                  { value: "entry", label: "Entry" },
                  { value: "junior", label: "Junior" },
                  { value: "mid", label: "Mid" },
                  { value: "senior", label: "Senior" },
                  { value: "lead", label: "Lead" },
                  { value: "executive", label: "Executive" },
                ]}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-0.5">Status</label>
              <Select
                value={createForm.status}
                onValueChange={(value) => setCreateForm({ ...createForm, status: value as JobStatus })}
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "active", label: "Active" },
                  { value: "paused", label: "Paused" },
                  { value: "closed", label: "Closed" },
                  { value: "filled", label: "Filled" },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-0.5">Visibility</label>
              <Select
                value={createForm.visibility}
                onValueChange={(value) => setCreateForm({ ...createForm, visibility: value as "public" | "private" | "featured" })}
                options={[
                  { value: "public", label: "Public" },
                  { value: "private", label: "Private" },
                  { value: "featured", label: "Featured" },
                ]}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium mb-0.5">Salary Min</label>
              <Input
                type="number"
                value={createForm.salary.min}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    salary: { ...createForm.salary, min: e.target.value },
                  })
                }
                placeholder="Min salary"
                className="text-xs px-2 py-1.5 h-8"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-0.5">Salary Max</label>
              <Input
                type="number"
                value={createForm.salary.max}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    salary: { ...createForm.salary, max: e.target.value },
                  })
                }
                placeholder="Max salary"
                className="text-xs px-2 py-1.5 h-8"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-0.5">Currency</label>
              <Input
                value={createForm.salary.currency}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    salary: { ...createForm.salary, currency: e.target.value },
                  })
                }
                placeholder="PHP"
                className="text-xs px-2 py-1.5 h-8"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Modal - Similar structure to Create but with editForm */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Job"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? "Updating..." : "Update Job"}
            </Button>
          </div>
        }
      >
        <div className="space-y-2 max-h-[80vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-xs font-medium mb-0.5">Title *</label>
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              placeholder="Job title"
              className="text-xs px-2 py-1.5 h-8"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-0.5">Description *</label>
            <Textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Job description"
              rows={3}
              className="text-xs px-2 py-1.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-0.5">Company Name *</label>
              <Input
                value={editForm.company.name}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    company: { ...editForm.company, name: e.target.value },
                  })
                }
                placeholder="Company name"
                className="text-xs px-2 py-1.5 h-8"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-0.5">Category *</label>
              <Select
                value={editForm.category}
                onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                options={categoriesData
                  .filter(cat => cat.isActive !== false && cat.isDeleted !== true)
                  .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                  .map(cat => ({
                    value: cat._id || cat.id || cat.key || "",
                    label: cat.name || getCategoryLabel(cat.key)
                  }))}
                placeholder="Select a category"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-0.5">Job Type *</label>
              <Select
                value={editForm.jobType}
                onValueChange={(value) => setEditForm({ ...editForm, jobType: value as JobType })}
                options={[
                  { value: "full_time", label: "Full Time" },
                  { value: "part_time", label: "Part Time" },
                  { value: "contract", label: "Contract" },
                  { value: "freelance", label: "Freelance" },
                  { value: "internship", label: "Internship" },
                  { value: "temporary", label: "Temporary" },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-0.5">Experience Level *</label>
              <Select
                value={editForm.experienceLevel}
                onValueChange={(value) => setEditForm({ ...editForm, experienceLevel: value as ExperienceLevel })}
                options={[
                  { value: "entry", label: "Entry" },
                  { value: "junior", label: "Junior" },
                  { value: "mid", label: "Mid" },
                  { value: "senior", label: "Senior" },
                  { value: "lead", label: "Lead" },
                  { value: "executive", label: "Executive" },
                ]}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium mb-0.5">Status</label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value as JobStatus })}
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "active", label: "Active" },
                  { value: "paused", label: "Paused" },
                  { value: "closed", label: "Closed" },
                  { value: "filled", label: "Filled" },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-0.5">Visibility</label>
              <Select
                value={editForm.visibility}
                onValueChange={(value) => setEditForm({ ...editForm, visibility: value as "public" | "private" | "featured" })}
                options={[
                  { value: "public", label: "Public" },
                  { value: "private", label: "Private" },
                  { value: "featured", label: "Featured" },
                ]}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium mb-0.5">Salary Min</label>
              <Input
                type="number"
                value={editForm.salary.min}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    salary: { ...editForm.salary, min: e.target.value },
                  })
                }
                placeholder="Min salary"
                className="text-xs px-2 py-1.5 h-8"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-0.5">Salary Max</label>
              <Input
                type="number"
                value={editForm.salary.max}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    salary: { ...editForm.salary, max: e.target.value },
                  })
                }
                placeholder="Max salary"
                className="text-xs px-2 py-1.5 h-8"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-0.5">Currency</label>
              <Input
                value={editForm.salary.currency}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    salary: { ...editForm.salary, currency: e.target.value },
                  })
                }
                placeholder="PHP"
                className="text-xs px-2 py-1.5 h-8"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Job Details"
        size="lg"
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedJob && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">Title</p>
                <p className="font-semibold">{selectedJob.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Company</p>
                <p className="font-semibold">{selectedJob.company?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    selectedJob.status
                  )}`}
                >
                  {getStatusIcon(selectedJob.status)}
                  {selectedJob.status?.toUpperCase() || "DRAFT"}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Job Type</p>
                <p className="font-semibold">{selectedJob.jobType?.replace("_", " ").toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Experience Level</p>
                <p className="font-semibold">{selectedJob.experienceLevel?.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Applications</p>
                <p className="font-semibold">{selectedJob.applications?.length || 0}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Description</p>
              <p className="font-semibold whitespace-pre-wrap">{selectedJob.description}</p>
            </div>
            {selectedJob.salary && (
              <div>
                <p className="text-sm text-gray-600">Salary</p>
                <p className="font-semibold">
                  {selectedJob.salary.currency} {selectedJob.salary.min?.toLocaleString()}
                  {selectedJob.salary.max && ` - ${selectedJob.salary.max.toLocaleString()}`}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Job"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700">
              {loading ? "Deleting..." : "Confirm Delete"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-gray-600">
            Are you sure you want to delete the job <strong>{selectedJob?.title}</strong>? This action cannot be undone.
          </p>
        </div>
      </Modal>

      {/* Logo Upload Modal */}
      <Modal
        isOpen={showLogoModal}
        onClose={() => {
          setShowLogoModal(false);
          setLogoFile(null);
        }}
        title="Upload Company Logo"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowLogoModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadLogo} disabled={loading || !logoFile}>
              {loading ? "Uploading..." : "Upload Logo"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Select Logo Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          {logoFile && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <div className="relative">
                <Image
                  src={URL.createObjectURL(logoFile)}
                  alt="Logo preview"
                  width={128}
                  height={128}
                  className="w-32 h-32 object-cover rounded border border-gray-200"
                  unoptimized
                />
                <p className="text-xs text-gray-500 mt-1">
                  {logoFile.name} ({(logoFile.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Stats Modal */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title={`Job Stats - ${selectedJob?.title}`}
        size="md"
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowStatsModal(false)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedJobStats && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-600">Views</p>
                <p className="text-lg font-semibold">{selectedJobStats.viewsCount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Applications</p>
                <p className="text-lg font-semibold">{selectedJobStats.applicationsCount || 0}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Applications Modal */}
      <Modal
        isOpen={showApplicationsModal}
        onClose={() => setShowApplicationsModal(false)}
        title={`Applications - ${selectedJob?.title}`}
        size="lg"
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowApplicationsModal(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {selectedJobApplications.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8">No applications found</p>
          ) : (
            <div className="space-y-3">
              {selectedJobApplications.map((application, index) => {
                const appId = (application as Application & { _id?: string })._id || `app-${index}`;
                return (
                  <div key={appId} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold">Application #{index + 1}</p>
                        <p className="text-xs text-gray-500">
                          Applied: {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : "N/A"}
                        </p>
                        {application.applicant && (
                          <p className="text-xs text-gray-500">Applicant ID: {application.applicant}</p>
                        )}
                      </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getApplicationStatusColor(
                        application.status
                      )}`}
                    >
                      {application.status?.toUpperCase() || "PENDING"}
                    </span>
                  </div>
                  {application.coverLetter && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-600 mb-1">Cover Letter:</p>
                      <p className="text-xs text-gray-800">{application.coverLetter}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Select
                      value={application.status || "pending"}
                      onValueChange={(value) => {
                        const appId = (application as Application & { _id?: string })._id || application.applicant || "";
                        if (appId) {
                          handleUpdateApplicationStatus(appId, value as ApplicationStatus);
                        }
                      }}
                      options={[
                        { value: "pending", label: "Pending" },
                        { value: "reviewing", label: "Reviewing" },
                        { value: "shortlisted", label: "Shortlisted" },
                        { value: "interviewed", label: "Interviewed" },
                        { value: "rejected", label: "Rejected" },
                        { value: "hired", label: "Hired" },
                      ]}
                    />
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
