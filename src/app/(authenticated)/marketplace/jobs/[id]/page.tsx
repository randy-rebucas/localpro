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
  Users
} from "lucide-react";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { Job as JobType, Language } from "@/types/jobs";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";

interface ApplicationForm {
  coverLetter: string;
  proposedBudget: number;
  proposedTimeline: number;
  relevantExperience: string;
  portfolioLinks: string[];
  availability: string;
  questions: string;
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
  const [job, setJob] = useState<JobType | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<RelatedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationForm, setApplicationForm] = useState<ApplicationForm>({
    coverLetter: "",
    proposedBudget: 0,
    proposedTimeline: 0,
    relevantExperience: "",
    portfolioLinks: [],
    availability: "",
    questions: ""
  });
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [newPortfolioLink, setNewPortfolioLink] = useState("");

  // Get default currency from app settings
  const defaultCurrency = getDefaultCurrency(appSettings);

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      // Jobs endpoint is PUBLIC
      const endpoint = API_ENDPOINTS.jobsById.includes('[id]')
        ? API_ENDPOINTS.jobsById.replace('[id]', String(params.id))
        : `${API_ENDPOINTS.jobs}/${params.id}`;
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

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    try {
      setApplicationLoading(true);
      if (!getApiToken()) {
        throw new Error('Please log in to apply for this job');
      }
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.jobsApplications}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify({
          jobId: job._id || String(params.id),
          ...applicationForm
        }),
      }));

      if (!response.ok) {
        throw new Error("Failed to submit application");
      }

      const application = await response.json();
      router.push(`/marketplace/my-applications/${application.id}`);
    } catch (error) {
      logger.error("Error submitting application", error instanceof Error ? error : new Error(String(error)), { jobId: params.id });
      alert("Failed to submit application. Please try again.");
    } finally {
      setApplicationLoading(false);
    }
  };

  const addPortfolioLink = () => {
    if (newPortfolioLink.trim()) {
      setApplicationForm(prev => ({
        ...prev,
        portfolioLinks: [...prev.portfolioLinks, newPortfolioLink.trim()]
      }));
      setNewPortfolioLink("");
    }
  };

  const removePortfolioLink = (index: number) => {
    setApplicationForm(prev => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.filter((_, i) => i !== index)
    }));
  };

  const formatPrice = (price: number, currency?: string) => {
    const currencyCode = currency || job?.salary?.currency || defaultCurrency;
    return formatCurrency(price, currencyCode, { appSettings });
  };

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
          href="/marketplace/jobs"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
        <Link href="/marketplace/jobs" className="hover:text-gray-700 transition-colors">
          Jobs
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{job.title}</span>
      </nav>

      {/* Job Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">{job.title}</h1>
              {job.company && (
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              )}
            </div>
            {job.company?.name && (
              <div className="mb-4">
                <p className="text-lg text-gray-700 font-medium">{job.company.name}</p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
              {job.company?.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {job.company.location.city || ''}, {job.company.location.state || ''}
                    {job.isRemote && " (Remote)"}
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
          <div className="flex items-center gap-2">
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Heart className="w-4 h-4" />
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
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
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
          {job.salary && (
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                {formatCurrency(job.salary.min || 0, job.salary.currency || defaultCurrency, { appSettings })}
                {job.salary.max && ` - ${formatCurrency(job.salary.max, job.salary.currency || defaultCurrency, { appSettings })}`}
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
          )}
          <button
            onClick={() => setShowApplicationForm(true)}
            className="bg-green-600 text-white px-8 py-3.5 rounded-lg hover:bg-green-700 active:bg-green-800 transition-all font-semibold text-base shadow-md hover:shadow-lg w-full sm:w-auto"
          >
            Apply Now
          </button>
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
                    href={`/marketplace/jobs/${relatedJob.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-700 mb-1">{relatedJob.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="text-green-600 font-medium">{formatPrice(relatedJob.budget)}</span>
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
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 text-sm font-medium">Category</span>
                <span className="font-semibold text-gray-900 capitalize text-sm">{job.category.toLowerCase().replace(/_/g, ' ')}</span>
              </div>
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
              {job.isRemote !== undefined && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm font-medium">Remote</span>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${job.isRemote ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                    {job.isRemote ? 'Yes' : 'No'}
                  </span>
                </div>
              )}
              {job.salary && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 text-sm font-medium">Salary</span>
                  <span className="font-semibold text-gray-900 text-sm">
                    {formatCurrency(job.salary.min || 0, job.salary.currency || defaultCurrency, { appSettings })}
                    {job.salary.max && ` - ${formatCurrency(job.salary.max, job.salary.currency || defaultCurrency, { appSettings })}`}
                    {job.salary.period && `/${job.salary.period}`}
                  </span>
                </div>
              )}
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
      {showApplicationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proposed Budget ({defaultCurrency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={applicationForm.proposedBudget}
                      onChange={(e) => setApplicationForm(prev => ({ ...prev, proposedBudget: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proposed Timeline (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={applicationForm.proposedTimeline}
                      onChange={(e) => setApplicationForm(prev => ({ ...prev, proposedTimeline: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relevant Experience *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={applicationForm.relevantExperience}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, relevantExperience: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Describe your relevant experience for this job..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portfolio Links
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newPortfolioLink}
                      onChange={(e) => setNewPortfolioLink(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addPortfolioLink();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Add portfolio link..."
                    />
                    <button
                      type="button"
                      onClick={addPortfolioLink}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                  {applicationForm.portfolioLinks.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {applicationForm.portfolioLinks.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                          <span className="flex-1 text-sm truncate">{link}</span>
                          <button
                            type="button"
                            onClick={() => removePortfolioLink(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Availability
                  </label>
                  <input
                    type="text"
                    value={applicationForm.availability}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, availability: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Available immediately, 20 hours/week"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Questions for Client
                  </label>
                  <textarea
                    rows={2}
                    value={applicationForm.questions}
                    onChange={(e) => setApplicationForm(prev => ({ ...prev, questions: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Any questions you have about the project..."
                  />
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
