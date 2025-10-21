"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Save,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Job {
  id: string;
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
  images?: string[];
  timezone: string;
  isRemote: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  existingImages: string[];
  timezone: string;
  isRemote: boolean;
}

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
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
    existingImages: [],
    timezone: "UTC",
    isRemote: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${params.id}`);
      
      if (!response.ok) {
        throw new Error("Job not found");
      }

      const data = await response.json();
      setJob(data);
      
      // Pre-populate form with existing job data
      setForm({
        title: data.title || "",
        description: data.description || "",
        category: data.category || "WEB_DEVELOPMENT",
        budget: data.budget || 0,
        duration: data.duration || 30,
        deadline: data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : "",
        experienceLevel: data.experienceLevel || "INTERMEDIATE",
        projectType: data.projectType || "ONE_TIME",
        skills: data.skills || [],
        requirements: data.requirements || [],
        deliverables: data.deliverables || [],
        location: {
          city: data.location?.city || "",
          state: data.location?.state || "",
          address: data.location?.address || ""
        },
        images: [],
        existingImages: data.images || [],
        timezone: data.timezone || "UTC",
        isRemote: data.isRemote || false
      });
    } catch (error) {
      console.error("Error fetching job:", error);
      setError("Failed to load job details");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchJob();
    }
  }, [params.id, fetchJob]);

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

  const removeExistingImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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
      formData.append("existingImages", JSON.stringify(form.existingImages));

      form.images.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });

      const response = await fetch(`/api/jobs/${params.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update job");
      }

      router.push(`/marketplace/jobs/${params.id}`);
    } catch (error) {
      console.error("Error updating job:", error);
      setError("Failed to update job. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Job Not Found</h2>
        <p className="text-gray-600 mb-6">{error}</p>
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/marketplace/jobs/${params.id}`}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Job
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-700 mb-6">Edit Job</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Job Details</h2>
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
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    options={categories}
                  />
                </div>

                <div>
                  <Select
                    label="Experience Level *"
                    value={form.experienceLevel}
                    onChange={(e) => handleInputChange("experienceLevel", e.target.value)}
                    options={experienceLevels}
                  />
                </div>

                <div>
                  <Select
                    label="Project Type *"
                    value={form.projectType}
                    onChange={(e) => handleInputChange("projectType", e.target.value)}
                    options={projectTypes}
                  />
                </div>

                <div>
                  <Input
                    label="Budget (USD) *"
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
                    onChange={(e) => handleInputChange("timezone", e.target.value)}
                    options={timezones.map(tz => ({ value: tz, label: tz }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.isRemote}
                      onChange={(e) => handleInputChange("isRemote", e.target.checked)}
                      className="rounded"
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
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Location</h2>
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
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Skills Required</h2>
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
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {form.skills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
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
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Requirements</h2>
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
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {form.requirements.map((requirement, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
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
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Expected Deliverables</h2>
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
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {form.deliverables.map((deliverable, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
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
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Project Images</h2>
              <div className="space-y-4">
                {/* Existing Images */}
                {form.existingImages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Current Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {form.existingImages.map((image, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={image}
                            alt={`Existing ${index + 1}`}
                            width={96}
                            height={96}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload New Images */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload new images</p>
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
                    className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 cursor-pointer transition-colors"
                  >
                    Choose Images
                  </label>
                </div>

                {/* New Images Preview */}
                {form.images.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">New Images</h3>
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
                  </div>
                )}
              </div>
            </div>

            {/* Job Preview */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Job Preview</h2>
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
                      {form.budget ? `$${form.budget.toLocaleString()}` : "Budget"}
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
                          className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
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
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Link
                href={`/marketplace/jobs/${params.id}`}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
