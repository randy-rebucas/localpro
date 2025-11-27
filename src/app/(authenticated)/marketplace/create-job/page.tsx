"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft,
  Upload,
  X,
  Plus,
  DollarSign,
  Clock,
  Calendar,
  MapPin,
  Briefcase,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { useToast, ToastContainer } from "@/components/ui/toast";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency, getCurrencySymbol, CURRENCY_CONFIGS } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";

interface JobForm {
  title: string;
  description: string;
  category: "WEB_DEVELOPMENT" | "MOBILE_DEVELOPMENT" | "DESIGN" | "WRITING" | "MARKETING" | "CONSULTING" | "OTHER";
  budget: number;
  duration: number;
  deadline: string;
  experienceLevel: "BEGINNER" | "INTERMEDIATE" | "EXPERT";
  projectType: "ONE_TIME" | "ONGOING" | "HOURLY";
  skills: string[];
  requirements: string[];
  deliverables: string[];
  location: {
    city: string;
    state: string;
    address: string;
  };
  images: File[];
  timezone: string;
  isRemote: boolean;
}

export default function CreateJobPage() {
  const router = useRouter();
  const { toasts, success, error: showErrorToast, removeToast } = useToast();
  const { settings: appSettings } = useAppSettings();
  const [form, setForm] = useState<JobForm>({
    title: "",
    description: "",
    category: "WEB_DEVELOPMENT",
    budget: 0,
    duration: 30,
    deadline: "",
    experienceLevel: "INTERMEDIATE",
    projectType: "ONE_TIME",
    skills: [],
    requirements: [],
    deliverables: [],
    location: {
      city: "",
      state: "",
      address: ""
    },
    images: [],
    timezone: "UTC",
    isRemote: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [newRequirement, setNewRequirement] = useState("");
  const [newDeliverable, setNewDeliverable] = useState("");

  const categories = [
    { value: "WEB_DEVELOPMENT", label: "Web Development" },
    { value: "MOBILE_DEVELOPMENT", label: "Mobile Development" },
    { value: "DESIGN", label: "Design" },
    { value: "WRITING", label: "Writing" },
    { value: "MARKETING", label: "Marketing" },
    { value: "CONSULTING", label: "Consulting" },
    { value: "OTHER", label: "Other" }
  ];

  const experienceLevels = [
    { value: "BEGINNER", label: "Beginner" },
    { value: "INTERMEDIATE", label: "Intermediate" },
    { value: "EXPERT", label: "Expert" }
  ];

  const projectTypes = [
    { value: "ONE_TIME", label: "One-time Project" },
    { value: "ONGOING", label: "Ongoing Work" },
    { value: "HOURLY", label: "Hourly Work" }
  ];

  const timezones = [
    "UTC", "EST", "PST", "CST", "MST", "GMT", "CET", "JST", "AEST"
  ];

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setForm(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setForm(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    setForm(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const addDeliverable = () => {
    if (newDeliverable.trim()) {
      setForm(prev => ({
        ...prev,
        deliverables: [...prev.deliverables, newDeliverable.trim()]
      }));
      setNewDeliverable("");
    }
  };

  const removeDeliverable = (index: number) => {
    setForm(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setForm(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("budget", form.budget.toString());
      formData.append("duration", form.duration.toString());
      formData.append("deadline", form.deadline);
      formData.append("experienceLevel", form.experienceLevel);
      formData.append("projectType", form.projectType);
      formData.append("skills", JSON.stringify(form.skills));
      formData.append("requirements", JSON.stringify(form.requirements));
      formData.append("deliverables", JSON.stringify(form.deliverables));
      formData.append("location", JSON.stringify(form.location));
      formData.append("timezone", form.timezone);
      formData.append("isRemote", form.isRemote.toString());

      form.images.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });

      if (!getApiToken()) {
        throw new Error('Please log in to create a job');
      }
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.jobs}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        body: formData,
      }));

      if (!response.ok) {
        throw new Error("Failed to create job");
      }

      const job = await response.json();
      
      // Show success toast
      success("Job created successfully! Redirecting...", 3000);
      
      // Keep button disabled and navigate after a short delay to show the toast
      setTimeout(() => {
        router.push(`/jobs/${job.id}`);
      }, 500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Error creating job", error instanceof Error ? error : new Error(String(error)));
      setError(errorMessage || "Failed to create job. Please try again.");
      // Show error toast
      showErrorToast(errorMessage || "Failed to create job. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} position="top-right" />
      
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/jobs"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to jobs"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Post a New Job</h1>
            <p className="text-sm text-gray-600">Create a job posting to find the right talent</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">

          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">Job Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Job Title *"
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., React Developer for E-commerce Platform"
                  />
                </div>

                <div>
                  <Select
                    label="Category *"
                    value={form.category}
                    onValueChange={(value) => handleInputChange("category", value)}
                    options={categories}
                  />
                </div>

                <div>
                  <Select
                    label="Experience Level *"
                    value={form.experienceLevel}
                    onValueChange={(value) => handleInputChange("experienceLevel", value)}
                    options={experienceLevels}
                  />
                </div>

                <div>
                  <Select
                    label="Project Type *"
                    value={form.projectType}
                    onValueChange={(value) => handleInputChange("projectType", value)}
                    options={projectTypes}
                  />
                </div>

                <div>
                  <Input
                    label={`Budget (${getDefaultCurrency(appSettings)}) *`}
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.budget}
                    onChange={(e) => handleInputChange("budget", Number(e.target.value))}
                    placeholder="0.00"
                    leftIcon={<DollarSign />}
                  />
                </div>

                <div>
                  <Input
                    label="Duration (days) *"
                    type="number"
                    required
                    min="1"
                    value={form.duration}
                    onChange={(e) => handleInputChange("duration", Number(e.target.value))}
                    placeholder="30"
                    leftIcon={<Clock />}
                  />
                </div>

                <div>
                  <Input
                    label="Deadline *"
                    type="date"
                    required
                    value={form.deadline}
                    onChange={(e) => handleInputChange("deadline", e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    leftIcon={<Calendar />}
                  />
                </div>

                <div>
                  <Select
                    label="Timezone"
                    value={form.timezone}
                    onValueChange={(value) => handleInputChange("timezone", value)}
                    options={timezones.map(tz => ({ value: tz, label: tz }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isRemote}
                      onChange={(e) => handleInputChange("isRemote", e.target.checked)}
                      className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700">Remote work allowed</span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <Textarea
                    label="Job Description *"
                    required
                    rows={6}
                    value={form.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe the job requirements, responsibilities, and what you're looking for in a candidate..."
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Input
                    label="City *"
                    type="text"
                    required
                    value={form.location.city}
                    onChange={(e) => handleLocationChange("city", e.target.value)}
                    placeholder="New York"
                    leftIcon={<MapPin />}
                  />
                </div>
                <div>
                  <Input
                    label="State *"
                    type="text"
                    required
                    value={form.location.state}
                    onChange={(e) => handleLocationChange("state", e.target.value)}
                    placeholder="NY"
                  />
                </div>
                <div className="md:col-span-3">
                  <Input
                    label="Address (Optional)"
                    type="text"
                    value={form.location.address}
                    onChange={(e) => handleLocationChange("address", e.target.value)}
                    placeholder="123 Main St, New York, NY 10001"
                  />
                </div>
              </div>
            </div>

            {/* Skills Required */}
            <div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">Skills Required</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                      placeholder="Add a skill (e.g., React, Python, UI/UX Design)..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {form.skills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                      <span className="flex-1 text-sm">{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">Requirements</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addRequirement();
                        }
                      }}
                      placeholder="Add a requirement (e.g., 3+ years experience, portfolio required)..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {form.requirements.map((requirement, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                      <span className="flex-1 text-sm">{requirement}</span>
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Deliverables */}
            <div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">Expected Deliverables</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={newDeliverable}
                      onChange={(e) => setNewDeliverable(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addDeliverable();
                        }
                      }}
                      placeholder="Add a deliverable (e.g., Responsive website, Mobile app, Design mockups)..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addDeliverable}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {form.deliverables.map((deliverable, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                      <span className="flex-1 text-sm">{deliverable}</span>
                      <button
                        type="button"
                        onClick={() => removeDeliverable(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Images */}
            <div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">Project Images (Optional)</h2>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gradient-to-br from-gray-50/50 to-white hover:border-emerald-300 transition-all">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload images related to your project</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2 rounded-lg hover:from-emerald-700 hover:to-emerald-800 cursor-pointer transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105"
                  >
                    Choose Images
                  </label>
                </div>
                {form.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {form.images.map((image, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          width={96}
                          height={96}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Job Preview */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">Job Preview</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-700">{form.title || "Job Title"}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {form.isRemote ? "Remote" : `${form.location.city || "City"}, ${form.location.state || "State"}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {form.budget ? formatCurrency(form.budget, getDefaultCurrency(appSettings), { appSettings }) : "Budget"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {form.duration ? `${form.duration} days` : "Duration"}
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-600 text-sm">{form.description || "Job description will appear here..."}</p>
                </div>
                {form.skills.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Skills Required</h4>
                    <div className="flex flex-wrap gap-1">
                      {form.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full border border-blue-200 shadow-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-lg p-4 shadow-md">
                <p className="text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <div></div>
              <div className="flex gap-4">
                <Link
                  href="/jobs"
                  className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md hover:scale-105 font-medium"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 font-semibold disabled:hover:scale-100 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Briefcase className="w-5 h-5" />
                      Post Job
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
