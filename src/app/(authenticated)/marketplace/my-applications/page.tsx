"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Briefcase, 
  Calendar, 
  Clock, 
  MapPin, 
  Building2,
  FileText,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  ArrowLeft
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useMyApplications } from "@/hooks/useJobs";
import { Application, ApplicationStatus } from "@/types/jobs";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";
import { useAppSettings } from "@/hooks/useAppSettings";

interface ApplicationWithJob extends Application {
  _id?: string;
  id?: string;
  job?: {
    _id?: string;
    id?: string;
    title?: string;
    company?: {
      name?: string;
      logo?: {
        url?: string;
      };
      location?: {
        city?: string;
        state?: string;
        isRemote?: boolean;
      };
    };
    salary?: {
      min?: number;
      max?: number;
      currency?: string;
      period?: string;
    };
  };
}

export default function MyApplicationsPage() {
  const router = useRouter();
  const { settings: appSettings } = useAppSettings();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  // Memoize params to prevent unnecessary re-renders
  const applicationParams = useMemo(() => ({
    ...(statusFilter && { status: statusFilter }),
    page: currentPage,
    limit: limit,
  }), [statusFilter, currentPage, limit]);

  const { applications, loading, error, pagination } = useMyApplications(applicationParams);

  const defaultCurrency = getDefaultCurrency(appSettings);

  const formatPrice = (price: number, currency?: string) => {
    const currencyCode = currency || defaultCurrency;
    return formatCurrency(price, currencyCode, { appSettings });
  };

  const getStatusColor = (status?: ApplicationStatus) => {
    switch (status) {
      case "hired":
        return "bg-accent/10 text-accent border-accent/20";
      case "shortlisted":
      case "interviewed":
        return "bg-primary/10 text-primary border-primary/20";
      case "reviewing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status?: ApplicationStatus) => {
    switch (status) {
      case "hired":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "shortlisted":
      case "interviewed":
      case "reviewing":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatStatus = (status?: ApplicationStatus) => {
    if (!status) return "Pending";
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return "N/A";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          {/* Header Section */}
          <div className="mb-8">
            {/* Back Button */}
            <div className="mb-4">
              <Link
                href="/marketplace/jobs"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back to jobs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Jobs</span>
              </Link>
            </div>
            
            {/* Title & Description */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Applications</h1>
                  <p className="text-sm text-gray-500 mt-0.5">View and manage your job applications</p>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} interactive={false}>
                <div className="p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Header Section */}
        <div className="mb-8">
          {/* Back Button */}
          <div className="mb-4">
            <Link
              href="/marketplace/jobs"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back to jobs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Jobs</span>
            </Link>
          </div>
          
          {/* Title & Description */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Applications</h1>
                <p className="text-sm text-gray-500 mt-0.5">View and manage your job applications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex gap-4 items-center">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interviewed">Interviewed</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Applications List */}
        {error ? (
        <Card interactive={false}>
          <EmptyState
            icon={AlertCircle}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
            title="Error Loading Applications"
            description={error}
            actions={[
              {
                type: "button",
                onClick: () => window.location.reload(),
                label: "Try Again",
                variant: "primary"
              }
            ]}
          />
        </Card>
      ) : !applications || applications.length === 0 ? (
        <Card interactive={false}>
          <EmptyState
            icon={Briefcase}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
            title="No Applications Found"
            description={
              statusFilter
                ? "You don't have any applications with this status. Try changing the filter."
                : "You haven't applied to any jobs yet. Start browsing jobs to apply!"
            }
            actions={[
              {
                type: "link",
                href: "/jobs",
                label: "Browse Jobs",
                variant: "primary"
              }
            ]}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application: ApplicationWithJob) => {
            const applicationId = application._id || application.id || "";
            const job = application.job;
            const jobId = job?._id || job?.id;
            const companyName = job?.company?.name || "Unknown Company";
            const companyLogo = job?.company?.logo?.url;
            const location = job?.company?.location;
            const isRemote = location?.isRemote || false;

            return (
              <Card key={applicationId} interactive={true}>
                <div className="p-6">
                  <div 
                    className="cursor-pointer hover:bg-gray-50 transition-colors -m-6 p-6 rounded-lg"
                    onClick={() => router.push(`/marketplace/my-applications/${applicationId}`)}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Company Logo */}
                        {companyLogo ? (
                          <Image
                            src={companyLogo}
                            alt={companyName}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200 flex-shrink-0">
                            <Building2 className="w-8 h-8 text-gray-400" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                                {job?.title || "Job Title Not Available"}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <Building2 className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{companyName}</span>
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 flex-shrink-0 ${getStatusColor(
                                application.status
                              )}`}
                            >
                              {getStatusIcon(application.status)}
                              {formatStatus(application.status)}
                            </span>
                          </div>

                          {/* Application Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 flex-shrink-0" />
                              <span>Applied: {formatDate(application.appliedAt)}</span>
                            </div>
                            {application.expectedSalary && (
                              <div className="flex items-center gap-2">
                                <span className="text-base font-semibold text-gray-700 flex-shrink-0">
                                  {getCurrencySymbol(job?.salary?.currency || defaultCurrency)}
                                </span>
                                <span>
                                  Expected: {formatPrice(application.expectedSalary, job?.salary?.currency)}
                                </span>
                              </div>
                            )}
                            {application.availability && (
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span>Available: {formatDate(application.availability)}</span>
                              </div>
                            )}
                            {location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span>
                                  {isRemote ? (
                                    <span className="text-emerald-600 font-medium">Remote</span>
                                  ) : (
                                    <span>
                                      {location.city || "Unknown"}
                                      {location.state ? `, ${location.state}` : ""}
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Cover Letter Preview */}
                          {application.coverLetter && (
                            <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                              {application.coverLetter}
                            </p>
                          )}

                          {/* Portfolio Link */}
                          {application.portfolio?.url && (
                            <div className="mt-3 flex items-center gap-2">
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                              <a
                                href={application.portfolio.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
                              >
                                View Portfolio
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Outside the clickable area */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100 mt-4">
                    <Link
                      href={jobId ? `/jobs/${jobId}` : "#"}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Job
                    </Link>
                    {application.resume?.url && (
                      <a
                        href={application.resume.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        View Resume
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-6">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, pagination.total)} of {pagination.total} applications
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                disabled={currentPage === pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

