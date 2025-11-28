"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  Star, 
  MapPin, 
  Clock, 
  Calendar,
  Phone,
  Mail,
  Share2,
  Heart,
  Shield,
  CheckCircle,
  AlertCircle,
  Send,
  GraduationCap,
  Award,
  Languages,
  Building2,
  Tag,
  Sparkles,
  TrendingUp,
  Eye,
  Users,
  ArrowLeft,
  Briefcase
} from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { Job as JobType, Language } from "@/types/jobs";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency, CURRENCY_CONFIGS, getCurrencySymbol } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";
import { useToast, ToastContainer } from "@/components/ui/toast";
import { useSession } from "@/hooks/useAuth";
import { checkFavorite, toggleFavorite } from "@/lib/favorites-utils";

interface ApplicationForm {
  coverLetter: string;
  expectedSalary: number;
  availability: string;
  portfolio: string;
}

interface RelatedJob {
  id: string;
  title: string;
  budget: number;
  category: string;
  deadline: string;
  skills: string[];
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { settings: appSettings } = useAppSettings();
  const { data: session } = useSession();
  const [job, setJob] = useState<JobType | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<RelatedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationForm, setApplicationForm] = useState<ApplicationForm>({
    coverLetter: "",
    expectedSalary: 0,
    availability: "",
    portfolio: ""
  });
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const { toasts, success: showSuccessToast, error: showErrorToast, removeToast } = useToast();

  // Get default currency from app settings
  const defaultCurrency = getDefaultCurrency(appSettings);

  // Check for reserved/special route IDs and redirect
  useEffect(() => {
    const jobId = String(params.id);
    const reservedIds = ['create-job', 'create', 'new'];
    
    if (reservedIds.includes(jobId.toLowerCase())) {
      router.replace('/marketplace/create-job');
      return;
    }
  }, [params.id, router]);

  const fetchJob = useCallback(async () => {
    try {
      const jobId = String(params.id);
      const reservedIds = ['create-job', 'create', 'new'];
      
      // Don't fetch if this is a reserved ID (redirect will handle it)
      if (reservedIds.includes(jobId.toLowerCase())) {
        return;
      }

      setLoading(true);
      // Jobs endpoint is PUBLIC
      const endpoint = API_ENDPOINTS.jobsById.includes('[id]')
        ? API_ENDPOINTS.jobsById.replace('[id]', jobId)
        : `${API_ENDPOINTS.jobs}/${jobId}`;
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, getApiToken()
        ? createAuthFetchOptions({ method: 'GET' })
        : { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      
      if (!response.ok) {
        throw new Error("Job not found");
      }

      const data = await response.json();
      // Handle different response structures
      const jobData = data?.data || data?.job || data;
      setJob(jobData);
      
      // Load favorite status from API
      const fetchedJobId = jobData._id || jobData.id;
      if (fetchedJobId && getApiToken()) {
        try {
          const favorited = await checkFavorite('job', fetchedJobId);
          setIsFavorited(favorited);
        } catch (error) {
          logger.error('Error loading favorite status', error instanceof Error ? error : new Error(String(error)), { jobId: fetchedJobId });
          // Default to false if check fails
          setIsFavorited(false);
        }
      } else {
        setIsFavorited(false);
      }
    } catch (error) {
      logger.error("Error fetching job", error instanceof Error ? error : new Error(String(error)), { jobId: params.id });
      setError("Failed to load job details");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchRelatedJobs = useCallback(async () => {
    try {
      // Related jobs endpoint
      const url = `${API_BASE_URL}${API_ENDPOINTS.jobs}/related/${params.id}`;
      const response = await fetch(url, getApiToken()
        ? createAuthFetchOptions({ method: 'GET' })
        : { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      if (response.ok) {
        const data = await response.json();
        setRelatedJobs(Array.isArray(data) ? data : data.jobs || []);
      }
    } catch (error) {
      logger.error("Error fetching related jobs", error instanceof Error ? error : new Error(String(error)), { jobId: params.id });
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchJob();
      fetchRelatedJobs();
    }
  }, [params.id, fetchJob, fetchRelatedJobs]);

  const handleToggleFavorite = useCallback(async () => {
    if (!job || isTogglingFavorite) return;
    
    const jobId = job._id || (job as Partial<JobType> & { id?: string }).id;
    if (!jobId) return;
    
    // Check if user is authenticated
    if (!getApiToken()) {
      showErrorToast('Please log in to add favorites');
      return;
    }
    
    setIsTogglingFavorite(true);
    try {
      const newFavorited = await toggleFavorite('job', jobId);
      setIsFavorited(newFavorited);
      
      if (newFavorited) {
        showSuccessToast('Added to favorites');
      } else {
        showSuccessToast('Removed from favorites');
      }
    } catch (error) {
      logger.error('Error toggling favorite', error instanceof Error ? error : new Error(String(error)), { jobId: params.id });
      showErrorToast('Failed to update favorite. Please try again.');
    } finally {
      setIsTogglingFavorite(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job, isTogglingFavorite]);

  const handleShare = useCallback(async () => {
    if (!job) return;
    
    const shareData = {
      title: job.title,
      text: job.description || '',
      url: typeof window !== 'undefined' ? window.location.href : ''
    };
    
    try {
      // Try Web Share API first (mobile and modern browsers)
      if (navigator.share && typeof navigator.share === 'function') {
        await navigator.share(shareData);
        setShareFeedback('Shared successfully!');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareData.url);
        setShareFeedback('Link copied to clipboard!');
      }
      
      // Clear feedback after 2 seconds
      setTimeout(() => setShareFeedback(null), 2000);
    } catch (error) {
      // User cancelled share or error occurred
      if (error instanceof Error && error.name !== 'AbortError') {
        logger.error('Error sharing', error, { jobId: params.id });
        // Try clipboard as fallback
        try {
          await navigator.clipboard.writeText(shareData.url);
          setShareFeedback('Link copied to clipboard!');
          setTimeout(() => setShareFeedback(null), 2000);
        } catch (clipboardError) {
          logger.error('Error copying to clipboard', clipboardError instanceof Error ? clipboardError : new Error(String(clipboardError)), { jobId: params.id });
          setShareFeedback('Failed to share. Please try again.');
          setTimeout(() => setShareFeedback(null), 2000);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    // Early validation: Prevent applying to own job before any processing
    if (isJobOwner()) {
      showErrorToast('You cannot apply to your own job posting');
      setApplicationLoading(false);
      setShowApplicationForm(false);
      return;
    }

    try {
      setApplicationLoading(true);
      if (!getApiToken()) {
        throw new Error('Please log in to apply for this job');
      }

      // Double-check: Prevent applying to own job (defense in depth)
      if (isJobOwner()) {
        throw new Error('You cannot apply to your own job posting');
      }
      
      const jobId = job._id || String(params.id);
      // Use the correct endpoint: POST /api/jobs/:id/apply
      const url = `${API_BASE_URL}${API_ENDPOINTS.jobs}/${jobId}/apply`;
      
      // Use FormData for multipart/form-data (required for resume upload)
      const formData = new FormData();
      
      // Required: Resume file
      if (resumeFile) {
        formData.append('resume', resumeFile);
      } else {
        throw new Error('Please upload your resume');
      }
      
      // Required: Cover letter
      if (!applicationForm.coverLetter.trim()) {
        throw new Error('Please provide a cover letter');
      }
      formData.append('coverLetter', applicationForm.coverLetter);
      
      // Required: Expected salary
      if (applicationForm.expectedSalary > 0) {
        formData.append('expectedSalary', applicationForm.expectedSalary.toString());
      } else {
        throw new Error('Please enter your expected salary');
      }
      
      // Required: Availability (date string in YYYY-MM-DD format)
      if (applicationForm.availability) {
        formData.append('availability', applicationForm.availability);
      } else {
        throw new Error('Please select your availability date');
      }
      
      // Optional: Portfolio
      if (applicationForm.portfolio.trim()) {
        formData.append('portfolio', applicationForm.portfolio.trim());
      }
      
      // Create fetch options without Content-Type for FormData
      // The browser will automatically set Content-Type with boundary for multipart/form-data
      const apiToken = getApiToken();
      const fetchOptions: RequestInit = {
        method: 'POST',
        body: formData,
        headers: {
          ...(apiToken && { 'Authorization': `Bearer ${apiToken}` }),
        },
        credentials: 'include',
      };
      
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: Failed to submit application`;
        logger.error("Failed to submit application", undefined, { 
          status: response.status, 
          errorData, 
          jobId 
        });
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const application = result.data || result;
      const applicationId = application._id || application.id || application.applicationId;
      
      if (applicationId) {
        router.push(`/marketplace/my-applications/${applicationId}`);
      } else {
        router.push('/marketplace/my-applications');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit application. Please try again.";
      logger.error("Error submitting application", error instanceof Error ? error : new Error(String(error)), { jobId: params.id });
      alert(errorMessage);
    } finally {
      setApplicationLoading(false);
    }
  };


  // Normalize currency to PHP only
  const normalizeCurrencyCode = useCallback((currency: string | undefined | null): string => {
    // Always return PHP as the only supported currency
    return 'PHP';
  }, []);

  const formatPrice = useCallback((price: number, currency?: string) => {
    // Normalize currency to code for conversion base
    const currencyCode = normalizeCurrencyCode(currency || job?.salary?.currency);
    return formatCurrency(price, currencyCode, { appSettings });
  }, [normalizeCurrencyCode, job?.salary?.currency, appSettings]);

  const getExperienceLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "entry":
        return "bg-green-100 text-green-800";
      case "junior":
        return "bg-blue-100 text-blue-800";
      case "mid":
        return "bg-yellow-100 text-yellow-800";
      case "senior":
        return "bg-orange-100 text-orange-800";
      case "lead":
        return "bg-purple-100 text-purple-800";
      case "executive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get category name (handles both string and object formats)
  const getCategoryName = (category: string | { name?: string; _id?: string } | undefined): string | null => {
    if (!category) return null;
    if (typeof category === 'string') return category;
    return category.name || null;
  };

  // Helper function to get isRemote status (checks both job level and company.location)
  const getIsRemote = (): boolean | undefined => {
    if (job?.isRemote !== undefined) return job.isRemote;
    return job?.company?.location?.isRemote;
  };

  // Check if current user is the job owner/employer
  const isJobOwner = useCallback(() => {
    if (!job || !session?.user) return false;
    
    // Get current user ID (handle different ID field formats)
    const currentUserId = session.user.id || session.user._id || session.user.userId;
    if (!currentUserId) return false;
    
    // Get job employer ID (handle both string and object formats)
    let jobEmployerId: string | undefined;
    if (typeof job.employer === 'string') {
      jobEmployerId = job.employer;
    } else if (job.employer && typeof job.employer === 'object') {
      // Handle populated employer object
      jobEmployerId = (job.employer as { _id?: string; id?: string; userId?: string })._id 
        || (job.employer as { _id?: string; id?: string; userId?: string }).id
        || (job.employer as { _id?: string; id?: string; userId?: string }).userId;
    }
    
    if (!jobEmployerId) return false;
    
    // Compare IDs as strings (normalize to string for comparison)
    return String(currentUserId) === String(jobEmployerId);
  }, [job, session]);

  // Update isOwner state when job or session changes
  useEffect(() => {
    setIsOwner(isJobOwner());
  }, [isJobOwner]);

  // Prevent application form from opening if user is job owner
  useEffect(() => {
    if (showApplicationForm && (isJobOwner() || isOwner)) {
      setShowApplicationForm(false);
      showErrorToast('You cannot apply to your own job posting');
    }
  }, [showApplicationForm, isJobOwner, isOwner, showErrorToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Job Not Found</h2>
        <p className="text-gray-600 mb-6">{error || "The job you're looking for doesn't exist."}</p>
        <Link
          href="/jobs"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} position="top-right" />
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/jobs"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to marketplace"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center shadow-lg shadow-green-500/20">
          <Briefcase className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{job.title}</h1>
          <p className="text-sm text-gray-600">{job.description ? job.description.substring(0, 80) + (job.description.length > 80 ? '...' : '') : 'Job opportunity'}</p>
        </div>
      </div>

      {/* Job Details */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              {job.company?.name && (
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  <span>{job.company.name}</span>
                </div>
              )}
              {job.company?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {job.company.location.city || ''}, {job.company.location.state || ''}
                    {getIsRemote() && " (Remote)"}
                  </span>
                </div>
              )}
              {job.applicationProcess?.startDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Start {new Date(job.applicationProcess.startDate).toLocaleDateString()}</span>
                </div>
              )}
              {job.applicationProcess?.deadline && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Due {new Date(job.applicationProcess.deadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleShare}
              className="relative p-3 rounded-full bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 transition-all hover:scale-110 group"
              title="Share job"
            >
              <Share2 className="w-5 h-5" />
              {shareFeedback && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md whitespace-nowrap shadow-lg z-50">
                  {shareFeedback}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </button>
            <button 
              onClick={handleToggleFavorite}
              disabled={isTogglingFavorite}
              className={`p-3 rounded-full transition-all hover:scale-110 ${
                isFavorited 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-pink-100 hover:text-pink-600'
              } ${isTogglingFavorite ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''} ${isTogglingFavorite ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </div>

        {/* Job Images - Note: Jobs may not have images, using company logo if available */}
        {job.company?.logo?.url && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2">
              <div className="relative group overflow-hidden rounded-lg">
                <Image
                  src={job.company.logo.url}
                  alt={job.company.name || job.title}
                  width={400}
                  height={256}
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
              </div>
            </div>
            {/* Company logo is shown as main image, no thumbnail gallery for jobs */}
          </div>
        )}

        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {job.status && (
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              job.status === 'active' ? 'bg-green-100 text-green-800' :
              job.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
              job.status === 'closed' ? 'bg-gray-100 text-gray-800' :
              job.status === 'filled' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
          )}
          {job.featured?.isFeatured && (
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
          )}
          {job.promoted?.isPromoted && (
            <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
              job.promoted.promotionType === 'premium' ? 'bg-yellow-100 text-yellow-800' :
              job.promoted.promotionType === 'urgent' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              <TrendingUp className="w-3 h-3" />
              {job.promoted.promotionType ? job.promoted.promotionType.charAt(0).toUpperCase() + job.promoted.promotionType.slice(1) : 'Promoted'}
            </span>
          )}
        </div>

        {/* Salary and Application */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-gray-200">
          {job.salary && (() => {
            const salaryCurrency = normalizeCurrencyCode(job.salary.currency);
            return (
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {formatCurrency(job.salary.min || 0, salaryCurrency, { appSettings })}
                  {job.salary.max && ` - ${formatCurrency(job.salary.max, salaryCurrency, { appSettings })}`}
                  {job.salary.period && (
                    <span className="text-2xl text-gray-500 font-normal">/{job.salary.period}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <span>Salary Range</span>
                  {job.salary.isNegotiable && (
                    <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium border border-green-200">Negotiable</span>
                  )}
                  {job.salary.isConfidential && (
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200">Confidential</span>
                  )}
                </div>
              </div>
            );
          })()}
          {!isOwner && (
            <button
              onClick={() => {
                // Double-check: prevent opening form if user is job owner
                if (isJobOwner()) {
                  showErrorToast('You cannot apply to your own job posting');
                  return;
                }
                setShowApplicationForm(true);
              }}
              className="bg-green-600 text-white px-8 py-3.5 rounded-lg hover:bg-green-700 active:bg-green-800 transition-all font-semibold text-base shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              Apply Now
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Job Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">Job Description</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-7 text-base whitespace-pre-line">{job.description}</p>
            </div>
          </div>

          {/* Skills Required */}
          {job.requirements?.skills && job.requirements.skills.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">Skills Required</h2>
              <div className="flex flex-wrap gap-3">
                {job.requirements.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-block px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg border border-blue-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">Requirements</h2>
              
              <div className="space-y-6">
                {/* Education */}
                {job.requirements.education && (
                  <div className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-3">
                      <GraduationCap className="w-6 h-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                    </div>
                    <div className="space-y-2 ml-9">
                      {job.requirements.education.level && (
                        <p className="text-gray-700 text-base">
                          <span className="font-semibold">Level: </span>
                          {job.requirements.education.level.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          {job.requirements.education.isRequired && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 rounded border border-red-200">Required</span>
                          )}
                        </p>
                      )}
                      {job.requirements.education.field && (
                        <p className="text-gray-700 text-base">
                          <span className="font-semibold">Field: </span>
                          {job.requirements.education.field}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {job.requirements.experience && (
                  <div className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="w-6 h-6 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
                    </div>
                    <p className="text-gray-700 text-base ml-9">
                      {job.requirements.experience.description || 
                       (job.requirements.experience.years ? `${job.requirements.experience.years} years` : 'Not specified')}
                    </p>
                  </div>
                )}

                {/* Certifications */}
                {job.requirements.certifications && job.requirements.certifications.length > 0 && (
                  <div className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-3">
                      <Award className="w-6 h-6 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Certifications</h3>
                    </div>
                    <ul className="space-y-2.5 ml-9">
                      {job.requirements.certifications.map((cert: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-base leading-relaxed">{cert}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Languages */}
                {job.requirements.languages && job.requirements.languages.length > 0 && (
                  <div className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-3">
                      <Languages className="w-6 h-6 text-orange-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Languages</h3>
                    </div>
                    <div className="flex flex-wrap gap-2.5 ml-9">
                      {job.requirements.languages.map((lang: Language, index: number) => (
                        <span key={index} className="px-3.5 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium border border-orange-200">
                          {lang.language || 'Unknown'}
                          {lang.proficiency && (
                            <span className="ml-1.5 text-xs opacity-80">
                              ({lang.proficiency.charAt(0).toUpperCase() + lang.proficiency.slice(1)})
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Requirements */}
                {job.requirements.other && job.requirements.other.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Requirements</h3>
                    <ul className="space-y-2.5">
                      {job.requirements.other.map((requirement: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-base leading-relaxed">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">Responsibilities</h2>
              <ul className="space-y-3">
                {job.responsibilities.map((responsibility: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-base leading-relaxed">{responsibility}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Qualifications */}
          {job.qualifications && job.qualifications.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">Qualifications</h2>
              <ul className="space-y-3">
                {job.qualifications.map((qualification: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5 fill-current" />
                    <span className="text-gray-700 text-base leading-relaxed">{qualification}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">Benefits</h2>
              <div className="flex flex-wrap gap-3">
                {job.benefits.map((benefit: string, index: number) => (
                  <span
                    key={index}
                    className="inline-block px-4 py-2 text-sm font-medium bg-green-50 text-green-700 rounded-lg border border-green-200"
                  >
                    {benefit.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Application Process */}
          {job.applicationProcess && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">Application Process</h2>
              <div className="space-y-4">
                {job.applicationProcess.applicationMethod && (
                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold text-gray-700 min-w-[80px]">Method:</span>
                    <span className="text-base text-gray-700 capitalize px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                      {job.applicationProcess.applicationMethod.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
                {job.applicationProcess.contactEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <a href={`mailto:${job.applicationProcess.contactEmail}`} className="text-base text-green-600 hover:text-green-700 hover:underline font-medium">
                      {job.applicationProcess.contactEmail}
                    </a>
                  </div>
                )}
                {job.applicationProcess.contactPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <a href={`tel:${job.applicationProcess.contactPhone}`} className="text-base text-green-600 hover:text-green-700 hover:underline font-medium">
                      {job.applicationProcess.contactPhone}
                    </a>
                  </div>
                )}
                {job.applicationProcess.applicationUrl && (
                  <div className="flex items-center gap-3">
                    <Link href={job.applicationProcess.applicationUrl} target="_blank" rel="noopener noreferrer" className="text-base text-green-600 hover:text-green-700 hover:underline font-medium">
                      Apply via Website →
                    </Link>
                  </div>
                )}
                {job.applicationProcess.instructions && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-base text-gray-700 leading-7 whitespace-pre-line">{job.applicationProcess.instructions}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200 flex items-center gap-2">
                <Tag className="w-6 h-6" />
                Tags
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {job.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="inline-block px-3.5 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-lg border border-gray-200 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Jobs */}
          {relatedJobs.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">Similar Jobs</h2>
              <div className="space-y-4">
                {relatedJobs.slice(0, 3).map((relatedJob) => (
                  <Link
                    key={relatedJob.id}
                    href={`/jobs/${relatedJob.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-700 mb-1">{relatedJob.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="text-green-600 font-medium">{formatPrice(relatedJob.budget, defaultCurrency)}</span>
                          <span>Due {new Date(relatedJob.deadline).toLocaleDateString()}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {relatedJob.skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Company Info */}
          {job.company && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">Company</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  {job.company.logo?.url ? (
                    <Image
                      src={job.company.logo.url}
                      alt={job.company.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-medium text-gray-600">
                      {job.company.name?.charAt(0) || 'C'}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-700">{job.company.name}</h4>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  {job.company.industry && (
                    <div className="text-sm text-gray-500">
                      {job.company.industry}
                    </div>
                  )}
                </div>
              </div>
              {job.company.size && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Building2 className="w-4 h-4" />
                  <span className="capitalize">{job.company.size.replace(/_/g, ' ')}</span>
                </div>
              )}
              {job.company.website && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <a href={job.company.website} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                      {job.company.website}
                    </a>
                  </div>
                  {job.company.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {job.company.location.city || ''}, {job.company.location.state || ''}
                        {job.company.location.country && `, ${job.company.location.country}`}
                        {job.company.location.remoteType && (
                          <span className="ml-1 text-xs text-gray-500">
                            ({job.company.location.remoteType.replace(/_/g, ' ')})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Job Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">Job Details</h3>
            <div className="space-y-4">
              {(() => {
                const categoryName = getCategoryName((job.category as unknown) as string | { name?: string; _id?: string } | undefined);
                if (!categoryName) return null;
                return (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 text-sm font-medium">Category</span>
                    <span className="font-semibold text-gray-900 capitalize text-sm">
                      {categoryName.toLowerCase().replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              })()}
              {job.subcategory && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm font-medium">Subcategory</span>
                  <span className="font-semibold text-gray-900 capitalize text-sm">{job.subcategory.toLowerCase().replace(/_/g, ' ')}</span>
                </div>
              )}
              {job.jobType && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm font-medium">Job Type</span>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-100 text-blue-800 border border-blue-200`}>
                    {job.jobType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              )}
              {job.experienceLevel && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm font-medium">Experience</span>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${getExperienceLevelColor(job.experienceLevel)} border`}>
                    {job.experienceLevel.replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              )}
              {getIsRemote() !== undefined && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm font-medium">Remote</span>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${getIsRemote() ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                    {getIsRemote() ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
              {job.salary && (() => {
                const salaryCurrency = normalizeCurrencyCode(job.salary.currency);
                return (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 text-sm font-medium">Salary</span>
                    <span className="font-semibold text-gray-900 text-sm">
                      {formatCurrency(job.salary.min || 0, salaryCurrency, { appSettings })}
                      {job.salary.max && ` - ${formatCurrency(job.salary.max, salaryCurrency, { appSettings })}`}
                      {job.salary.period && `/${job.salary.period}`}
                    </span>
                  </div>
                );
              })()}
              {job.status && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm font-medium">Status</span>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                    job.status === 'active' ? 'bg-green-100 text-green-800 border border-green-200' :
                    job.status === 'paused' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                    job.status === 'closed' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                    job.status === 'filled' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                    'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </div>
              )}
              {job.visibility && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm font-medium">Visibility</span>
                  <span className="font-semibold text-gray-900 capitalize text-sm">{job.visibility}</span>
                </div>
              )}
              {job.analytics?.applicationsCount !== undefined && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm font-medium flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    Applications
                  </span>
                  <span className="font-semibold text-gray-900 text-sm">{job.analytics.applicationsCount}</span>
                </div>
              )}
              {job.views?.count !== undefined && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm font-medium flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    Views
                  </span>
                  <span className="font-semibold text-gray-900 text-sm">{job.views.count}</span>
                </div>
              )}
              {job.analytics?.sharesCount !== undefined && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm font-medium">Shares</span>
                  <span className="font-semibold text-gray-900 text-sm">{job.analytics.sharesCount}</span>
                </div>
              )}
              {job.analytics?.savesCount !== undefined && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm font-medium">Saves</span>
                  <span className="font-semibold text-gray-900 text-sm">{job.analytics.savesCount}</span>
                </div>
              )}
              {job.createdAt && (
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200">
                  <span className="text-gray-600 text-sm font-medium">Posted</span>
                  <span className="font-semibold text-gray-900 text-sm">{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
              )}
              {job.updatedAt && job.updatedAt !== job.createdAt && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm font-medium">Updated</span>
                  <span className="font-semibold text-gray-900 text-sm">{new Date(job.updatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Safety Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">Safety & Trust</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-base text-gray-700 font-medium">Secure payments</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-base text-gray-700 font-medium">Company verified</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-base text-gray-700 font-medium">Quality guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationForm && !isOwner && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
          onClick={() => setShowApplicationForm(false)}
        >
          <div 
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Apply for Job</h2>
                <button
                  onClick={() => setShowApplicationForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleApplicationSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Letter *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={applicationForm.coverLetter}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, coverLetter: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Tell the client why you're the right fit for this job..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Salary * ({defaultCurrency})
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium z-10">
                      {getCurrencySymbol(defaultCurrency)}
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={applicationForm.expectedSalary || ""}
                      onChange={(e) => setApplicationForm(prev => ({ ...prev, expectedSalary: Number(e.target.value) || 0 }))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Your expected salary for this position
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resume * (PDF, DOC, DOCX)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    required
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setResumeFile(file);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  {resumeFile && (
                    <p className="mt-1 text-sm text-gray-600">
                      Selected: {resumeFile.name} ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portfolio URL
                  </label>
                  <input
                    type="url"
                    value={applicationForm.portfolio}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, portfolio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="https://yourportfolio.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Link to your portfolio or work samples (optional)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Availability Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={applicationForm.availability}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, availability: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    When can you start working on this job?
                  </p>
                </div>


                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowApplicationForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applicationLoading}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {applicationLoading ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
