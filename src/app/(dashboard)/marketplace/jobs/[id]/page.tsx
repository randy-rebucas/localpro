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
  Send
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  duration: number;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    rating: number;
    reviewCount: number;
    avatar?: string;
    bio?: string;
    joinedDate: string;
    verified: boolean;
    completedJobs: number;
    totalSpent: number;
  };
  location: {
    city: string;
    state: string;
    address?: string;
  };
  images?: string[];
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  createdAt: string;
  deadline: string;
  skills: string[];
  requirements?: string[];
  deliverables?: string[];
  experienceLevel: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
  projectType: "ONE_TIME" | "ONGOING" | "HOURLY";
  timezone: string;
  applicationsCount: number;
  viewsCount: number;
}

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
  const [job, setJob] = useState<Job | null>(null);
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [newPortfolioLink, setNewPortfolioLink] = useState("");

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${params.id}`);
      
      if (!response.ok) {
        throw new Error("Job not found");
      }

      const data = await response.json();
      setJob(data);
    } catch (error) {
      console.error("Error fetching job:", error);
      setError("Failed to load job details");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchRelatedJobs = useCallback(async () => {
    try {
      const response = await fetch(`/api/jobs/related/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setRelatedJobs(Array.isArray(data) ? data : data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching related jobs:", error);
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
      const response = await fetch('/api/jobs/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: job.id,
          clientId: job.client.id,
          ...applicationForm
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit application");
      }

      const application = await response.json();
      router.push(`/marketplace/my-applications/${application.id}`);
    } catch (error) {
      console.error("Error submitting application:", error);
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDuration = (days: number) => {
    if (days < 7) return `${days} days`;
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    return remainingDays > 0 ? `${weeks}w ${remainingDays}d` : `${weeks}w`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const getExperienceLevelColor = (level: string) => {
    switch (level) {
      case "BEGINNER":
        return "bg-green-100 text-green-800";
      case "INTERMEDIATE":
        return "bg-yellow-100 text-yellow-800";
      case "EXPERT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProjectTypeColor = (type: string) => {
    switch (type) {
      case "ONE_TIME":
        return "bg-blue-100 text-blue-800";
      case "ONGOING":
        return "bg-purple-100 text-purple-800";
      case "HOURLY":
        return "bg-orange-100 text-orange-800";
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
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href="/marketplace/jobs" className="hover:text-gray-700">
          Jobs
        </Link>
        <span>/</span>
        <span className="text-gray-700">{job.title}</span>
      </nav>

      {/* Job Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-700">{job.title}</h1>
              {job.client.verified && (
                <CheckCircle className="w-6 h-6 text-green-500" />
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{job.location.city}, {job.location.state}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(job.duration)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Due {new Date(job.deadline).toLocaleDateString()}</span>
              </div>
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

        {/* Job Images */}
        {job.images && job.images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2">
              <div className="relative group overflow-hidden rounded-lg">
                <Image
                  src={job.images[selectedImageIndex]}
                  alt={job.title}
                  width={400}
                  height={256}
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {job.images.slice(0, 4).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`h-20 rounded-lg overflow-hidden transition-all duration-200 ${
                    selectedImageIndex === index 
                      ? 'ring-2 ring-green-500 shadow-lg scale-105' 
                      : 'hover:shadow-md hover:scale-102'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${job.title} ${index + 1}`}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Budget and Application */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-green-600">
              {formatPrice(job.budget)}
            </div>
            <div className="text-sm text-gray-500">Budget</div>
          </div>
          <button
            onClick={() => setShowApplicationForm(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Apply Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Job Description</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          {/* Skills Required */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Skills Required</h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-gray-600">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Deliverables */}
          {job.deliverables && job.deliverables.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Deliverables</h2>
              <ul className="space-y-2">
                {job.deliverables.map((deliverable, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">{deliverable}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Jobs */}
          {relatedJobs.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Similar Jobs</h2>
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
        <div className="space-y-6">
          {/* Client Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Client</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                {job.client.avatar ? (
                  <Image
                    src={job.client.avatar}
                    alt={job.client.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-medium text-gray-600">
                    {job.client.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-700">{job.client.name}</h4>
                  {job.client.verified && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {renderStars(job.client.rating)}
                  <span className="text-sm text-gray-500">
                    ({job.client.reviewCount} reviews)
                  </span>
                </div>
              </div>
            </div>
            {job.client.bio && (
              <p className="text-sm text-gray-600 mb-4">{job.client.bio}</p>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{job.client.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{job.client.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(job.client.joinedDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Job Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Budget</span>
                <span className="font-medium">{formatPrice(job.budget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">{formatDuration(job.duration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category</span>
                <span className="font-medium capitalize">{job.category.toLowerCase().replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Experience Level</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getExperienceLevelColor(job.experienceLevel)}`}>
                  {job.experienceLevel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Project Type</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getProjectTypeColor(job.projectType)}`}>
                  {job.projectType.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Applications</span>
                <span className="font-medium">{job.applicationsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Views</span>
                <span className="font-medium">{job.viewsCount}</span>
              </div>
            </div>
          </div>

          {/* Safety Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Safety & Trust</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Secure payments</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Client verified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Quality guarantee</span>
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
                      Proposed Budget (USD)
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
