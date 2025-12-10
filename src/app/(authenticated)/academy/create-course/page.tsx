"use client";


import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Users,
  BookOpen,
  Target,
  CheckCircle2,
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";

const API_ENDPOINT = "/api/academy/courses";
const FALLBACK_CATEGORIES = ["cleaning", "plumbing", "electrical", "moving", "business", "safety", "certification"];

const FORM_STEPS = [
  { id: 1, title: "Basic Info", icon: FileText },
  { id: 2, title: "Details", icon: Users },
  { id: 3, title: "Curriculum", icon: BookOpen },
  { id: 4, title: "Requirements", icon: Target },
  { id: 5, title: "Review & Submit", icon: CheckCircle2 },
];

export default function CreateCoursePage() {
  const router = useRouter();
  const totalSteps = FORM_STEPS.length;
  const inputClass =
    "w-full rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm placeholder:text-gray-400";
  const secondaryText = "text-sm text-gray-600";
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    instructor: "",
    durationHours: "",
    durationMinutes: "",
    price: "",
    currency: "PHP",
    level: "beginner",
    language: "en",
    requirements: [""],
    learningOutcomes: [""],
    curriculum: [{ title: "", duration: "", order: 1 }],
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeUserId, setActiveUserId] = useState("");
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const progress = useMemo(() => (currentStep / totalSteps) * 100, [currentStep, totalSteps]);

  // Grab active user id once and pre-fill instructor if empty
  useEffect(() => {
    const storedId =
      (typeof window !== "undefined" && (localStorage.getItem("userId") || localStorage.getItem("user_id"))) || "";
    if (storedId) {
      setActiveUserId(storedId);
      setForm(prev => (prev.instructor ? prev : { ...prev, instructor: storedId }));
    }
  }, []);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);

        if (!getApiToken()) {
          setCategories(FALLBACK_CATEGORIES);
          return;
        }

        const res = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.academyCategories}`,
          createAuthFetchOptions({ method: "GET" })
        );

        if (!res.ok) {
          setCategories(FALLBACK_CATEGORIES);
          return;
        }

        const data = await res.json();
        let names: string[] = [];

        if (data && typeof data === "object" && !Array.isArray(data)) {
          if ("success" in data && data.success && "data" in data && data.data) {
            if (Array.isArray(data.data)) {
              names = data.data.map((cat: any) => (typeof cat === "string" ? cat : cat.name)).filter(Boolean);
            } else if (Array.isArray(data.data.categories)) {
              names = data.data.categories.map((cat: any) => (typeof cat === "string" ? cat : cat.name)).filter(Boolean);
            }
          } else if ("categories" in data && Array.isArray(data.categories)) {
            names = data.categories.map((cat: any) => (typeof cat === "string" ? cat : cat.name)).filter(Boolean);
          }
        } else if (Array.isArray(data)) {
          names = data.map((cat: any) => (typeof cat === "string" ? cat : cat.name)).filter(Boolean);
        }

        const normalized = names.map((n) => (typeof n === "string" ? n.toLowerCase() : n)).filter(Boolean);
        const unique = Array.from(new Set(normalized));
        const finalCategories = unique.length ? unique : FALLBACK_CATEGORIES;

        setCategories(finalCategories);
        setForm((prev) => (prev.category ? prev : { ...prev, category: finalCategories[0] || "" }));
      } catch {
        setCategories(FALLBACK_CATEGORIES);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  // ...existing code for array and curriculum handlers...
  const handleArrayChange = (field: "requirements" | "learningOutcomes", idx: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((item: string, i: number) => (i === idx ? value : item)),
    }));
  };
  const addArrayItem = (field: "requirements" | "learningOutcomes") => {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], ""] }));
  };
  const removeArrayItem = (field: "requirements" | "learningOutcomes", idx: number) => {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_: string, i: number) => i !== idx) }));
  };
  const handleCurriculumChange = (idx: number, key: "title" | "duration" | "order", value: string) => {
    setForm((prev) => ({
      ...prev,
      curriculum: prev.curriculum.map((item, i) =>
        i === idx ? { ...item, [key]: value } : item
      ),
    }));
  };
  const addCurriculumItem = () => {
    setForm((prev) => ({
      ...prev,
      curriculum: [
        ...prev.curriculum,
        { title: "", duration: "", order: prev.curriculum.length + 1 },
      ],
    }));
  };
  const removeCurriculumItem = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      curriculum: prev.curriculum.filter((_, i) => i !== idx),
    }));
  };
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const token = getApiToken();
      if (!token) {
        throw new Error("Please sign in to create a course.");
      }

      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        instructor: form.instructor || activeUserId,
        duration: {
          hours: form.durationHours ? Number(form.durationHours) : 0,
          minutes: form.durationMinutes ? Number(form.durationMinutes) : 0,
          weeks: 0,
        },
        pricing: {
          regularPrice: form.price ? Number(form.price) : 0,
          discountedPrice: form.price ? Number(form.price) : 0,
          currency: form.currency,
        },
        level: form.level,
        language: form.language,
        prerequisites: form.requirements.filter(Boolean),
        learningOutcomes: form.learningOutcomes.filter(Boolean),
        curriculum: [
          {
            module: "Course Curriculum",
            lessons: form.curriculum.map((item) => ({
              title: item.title,
              description: "",
              duration: item.duration ? Number(item.duration) : 0,
              type: "video",
              isFree: false,
              order: item.order,
            })),
          },
        ],
        certification: {
          isAvailable: false,
        },
        enrollment: {
          maxCapacity: null,
          isOpen: true,
        },
        schedule: {
          startDate: "",
          endDate: "",
          sessions: [],
        },
        tags: [],
      };

      const url = `${API_BASE_URL}${API_ENDPOINTS.academyCourseCreate || API_ENDPOINTS.academyCourses || API_ENDPOINT}`;
      const res = await fetch(
        url,
        createAuthFetchOptions({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create course");
      }
      setSuccess(true);
      setTimeout(() => router.push("/academy/courses"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  // Stepper UI with icons and progress bar, styled like create-job
  const renderStepper = () => {
    return (
      <>
        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {FORM_STEPS[currentStep - 1]?.title}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        {/* Step Indicators */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <div className="flex items-center justify-between">
            {FORM_STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                          : isActive
                          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 scale-110'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 text-center max-w-[80px] ${
                      isActive ? 'text-emerald-600 font-semibold' : isCompleted ? 'text-emerald-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < FORM_STEPS.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 transition-all ${
                        isCompleted ? 'bg-emerald-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  // Step content styled to mirror create-job wizard
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-gray-200">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Introduction to Web Development"
                  className={inputClass}
                />
                <p className={secondaryText}>Give your course a concise, compelling name.</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Briefly describe what learners will gain from this course."
                  className={`${inputClass} min-h-[140px] resize-none`}
                />
                <p className={secondaryText}>Highlight key outcomes and what makes this course unique.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Category *</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className={`${inputClass} bg-white`}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
                <p className={secondaryText}>
                  {loadingCategories ? "Loading categories..." : "Choose the most relevant category for this course."}
                </p>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-800 pb-2 border-b-2 border-gray-200">Course Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="hidden" name="instructor" value={form.instructor} readOnly />
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Language *</label>
                <input
                  type="text"
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  required
                  placeholder="e.g., English"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Duration (Hours) *</label>
                <input
                  type="number"
                  name="durationHours"
                  value={form.durationHours}
                  onChange={handleChange}
                  min="0"
                  required
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Duration (Minutes) *</label>
                <input
                  type="number"
                  name="durationMinutes"
                  value={form.durationMinutes}
                  onChange={handleChange}
                  min="0"
                  max="59"
                  required
                  className={inputClass}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Price *</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Currency</label>
                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  className={`${inputClass} bg-white`}
                >
                  <option value="PHP">PHP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Level</label>
                <select
                  name="level"
                  value={form.level}
                  onChange={handleChange}
                  className={`${inputClass} bg-white`}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 pb-2 border-b-2 border-gray-200 flex-1">Curriculum</h2>
              <button
                type="button"
                onClick={addCurriculumItem}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105 text-sm font-semibold"
              >
                + Add Section
              </button>
            </div>

            <div className="space-y-4">
              {form.curriculum.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm p-4 md:p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Lesson {idx + 1}</p>
                        <p className="text-xs text-gray-600">Set the title, duration, and order</p>
                      </div>
                    </div>
                    {form.curriculum.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCurriculumItem(idx)}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Title *</label>
                      <input
                        type="text"
                        placeholder="Lesson title"
                        value={item.title}
                        onChange={e => handleCurriculumChange(idx, "title", e.target.value)}
                        required
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Duration (min) *</label>
                      <input
                        type="number"
                        placeholder="45"
                        value={item.duration}
                        onChange={e => handleCurriculumChange(idx, "duration", e.target.value)}
                        min="1"
                        required
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Order *</label>
                      <input
                        type="number"
                        placeholder="1"
                        value={item.order}
                        onChange={e => handleCurriculumChange(idx, "order", e.target.value)}
                        min="1"
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 pb-2 border-b-2 border-gray-200 flex-1">Requirements</h2>
                <button
                  type="button"
                  onClick={() => addArrayItem("requirements")}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105 text-sm font-semibold"
                >
                  + Add Requirement
                </button>
              </div>
              <p className={secondaryText}>List the prerequisites learners should meet before taking this course.</p>
              <div className="space-y-3">
                {form.requirements.map((req, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-lg border border-gray-200 shadow-sm"
                  >
                    <input
                      type="text"
                      value={req}
                      onChange={e => handleArrayChange("requirements", idx, e.target.value)}
                      required
                      className={`${inputClass} bg-transparent shadow-none border-0 px-0`}
                      placeholder="Requirement"
                    />
                    {form.requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem("requirements", idx)}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 pb-2 border-b-2 border-gray-200 flex-1">Learning Outcomes</h2>
                <button
                  type="button"
                  onClick={() => addArrayItem("learningOutcomes")}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105 text-sm font-semibold"
                >
                  + Add Outcome
                </button>
              </div>
              <p className={secondaryText}>Define what learners will be able to do after completing the course.</p>
              <div className="space-y-3">
                {form.learningOutcomes.map((out, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-lg border border-gray-200 shadow-sm"
                  >
                    <input
                      type="text"
                      value={out}
                      onChange={e => handleArrayChange("learningOutcomes", idx, e.target.value)}
                      required
                      className={`${inputClass} bg-transparent shadow-none border-0 px-0`}
                      placeholder="Outcome"
                    />
                    {form.learningOutcomes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem("learningOutcomes", idx)}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 pb-2 border-b-2 border-gray-200">Review & Submit</h2>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 md:p-8 border-2 border-blue-200 space-y-5 shadow-sm">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">{form.title || "Course title"}</h3>
                <p className="text-gray-700">{form.category || "Category"}</p>
                <div className="flex flex-wrap items-center gap-4 text-base text-gray-700 mt-3">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {form.level ? form.level.charAt(0).toUpperCase() + form.level.slice(1) : "Level"}
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {form.instructor || "Instructor"}
                  </span>
                  <span className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    {form.language || "Language"}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-gray-600 font-semibold">₱</span>
                    {form.price ? `${form.price} ${form.currency}` : "Price not set"}
                  </span>
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {`${form.durationHours || 0}h ${form.durationMinutes || 0}m`}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3 text-lg">Description</h4>
                <p className="text-gray-700 leading-relaxed">{form.description || "Course description will appear here."}</p>
              </div>

              {form.learningOutcomes.filter(Boolean).length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 text-lg">Learning Outcomes</h4>
                  <div className="flex flex-wrap gap-2">
                    {form.learningOutcomes.filter(Boolean).map((out, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-3 py-1.5 text-sm font-medium bg-green-100 text-green-800 rounded-full border border-green-200"
                      >
                        {out}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {form.requirements.filter(Boolean).length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 text-lg">Requirements</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {form.requirements.filter(Boolean).map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {form.curriculum.filter(c => c.title || c.duration).length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 text-lg">Curriculum</h4>
                  <ol className="list-decimal ml-6 space-y-1 text-gray-700">
                    {form.curriculum
                      .filter(c => c.title || c.duration)
                      .map((c, i) => (
                        <li key={i}>
                          {c.title || "Untitled"} {c.duration && `(${c.duration} min)`}
                        </li>
                      ))}
                  </ol>
                </div>
              )}

            </div>
          </div>
        );
      default:
        return null;
    }
  };

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
        <div className="flex items-center gap-4">
          <Link
            href="/academy"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to academy"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create a New Course</h1>
            <p className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</p>
          </div>
        </div>
        {renderStepper()}
        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 md:p-8 backdrop-blur-sm">
          <form
            onSubmit={currentStep === totalSteps ? handleSubmit : e => { e.preventDefault(); setCurrentStep(s => Math.min(s + 1, totalSteps)); }}
            className="space-y-10"
            noValidate
          >
            {renderStep()}
            {error && (
              <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-lg p-5 shadow-md">
                <p className="text-red-700 font-semibold text-base">{error}</p>
              </div>
            )}
            {success && <div className="text-green-600 text-sm mt-2">Course created successfully! Redirecting...</div>}
            <div className="flex justify-between items-center pt-8 border-t-2 border-gray-300">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(s => Math.max(s - 1, 1))}
                    className="px-6 py-2.5 border-2 border-gray-300 text-gray-800 rounded-lg bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md hover:scale-105 font-semibold text-base flex items-center gap-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                  </button>
                )}
              </div>
              <div className="flex gap-4">
                <Link
                  href="/academy"
                  className="px-8 py-3 border-2 border-gray-300 text-gray-800 rounded-lg bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md hover:scale-105 font-semibold text-base"
                >
                  Cancel
                </Link>
                {currentStep < totalSteps ? (
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-lg transition-all shadow-lg font-bold text-base flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl hover:scale-105 shadow-emerald-500/30"
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 font-bold text-base disabled:hover:scale-100 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Create Course
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
