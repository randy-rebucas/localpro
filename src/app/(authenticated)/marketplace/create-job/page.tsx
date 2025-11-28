"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft,
  X,
  Plus,
  Clock,
  Calendar,
  MapPin,
  Briefcase,
  Loader2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  FileText,
  Building2,
  DollarSign,
  Target,
  Users,
  GraduationCap,
  Award,
  Globe,
  Settings,
  Tag
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { useToast, ToastContainer } from "@/components/ui/toast";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";
import { useJobCategories } from "@/hooks/useJobCategories";

interface JobForm {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  jobType: "full_time" | "part_time" | "contract" | "freelance" | "internship" | "temporary";
  experienceLevel: "entry" | "junior" | "mid" | "senior" | "lead" | "executive";
  company: {
    name: string;
    website: string;
    size?: "startup" | "small" | "medium" | "large" | "enterprise";
    industry: string;
    location: {
      address: string;
      city: string;
      state: string;
      country: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
      isRemote: boolean;
      remoteType: "fully_remote" | "hybrid" | "on_site";
    };
  };
  salary: {
    min: number;
    max: number;
    currency: string;
    period: "hourly" | "daily" | "weekly" | "monthly" | "yearly";
    isNegotiable: boolean;
    isConfidential: boolean;
  };
  benefits: string[];
  requirements: {
    skills: string[];
    education: {
      level: "high_school" | "associate" | "bachelor" | "master" | "phd" | "none_required";
      field: string;
      isRequired: boolean;
    };
    experience: {
      years: number;
      description: string;
    };
    certifications: string[];
    languages: Array<{
      language: string;
      proficiency: "beginner" | "intermediate" | "advanced" | "native";
    }>;
    other: string[];
  };
  responsibilities: string[];
  qualifications: string[];
  applicationProcess: {
    deadline: string;
    startDate: string;
    applicationMethod: "email" | "website" | "platform" | "phone";
    contactEmail: string;
    contactPhone: string;
    applicationUrl: string;
    instructions: string;
  };
  status: "draft" | "active" | "paused" | "closed" | "filled";
  visibility: "public" | "private" | "featured";
  tags: string[];
}

const FORM_STEPS = [
  { id: 1, title: "Basic Information", icon: FileText, description: "Tell us about the job" },
  { id: 2, title: "Company Details", icon: Building2, description: "Company information" },
  { id: 3, title: "Salary & Benefits", icon: DollarSign, description: "Compensation and perks" },
  { id: 4, title: "Requirements", icon: Target, description: "Skills and qualifications" },
  { id: 5, title: "Responsibilities", icon: Briefcase, description: "Job duties and expectations" },
  { id: 6, title: "Application Process", icon: Users, description: "How to apply" },
  { id: 7, title: "Additional Settings", icon: Settings, description: "Status and visibility" },
  { id: 8, title: "Review & Submit", icon: CheckCircle2, description: "Review and finalize" },
];

export default function CreateJobPage() {
  const router = useRouter();
  const { toasts, success, error: showErrorToast, removeToast } = useToast();
  const { settings: appSettings } = useAppSettings();
  const { categories: jobCategories, loading: categoriesLoading, error: categoriesError } = useJobCategories();
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  
  const [form, setForm] = useState<JobForm>({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    jobType: "full_time",
    experienceLevel: "mid",
    company: {
      name: "",
      website: "",
      size: "medium",
      industry: "",
      location: {
        address: "",
        city: "",
        state: "",
        country: "Philippines",
        isRemote: false,
        remoteType: "on_site"
      }
    },
    salary: {
      min: 0,
      max: 0,
      currency: "PHP",
      period: "monthly",
      isNegotiable: false,
      isConfidential: false
    },
    benefits: [],
    requirements: {
      skills: [],
      education: {
        level: "none_required",
        field: "",
        isRequired: false
      },
      experience: {
        years: 0,
        description: ""
      },
      certifications: [],
      languages: [],
      other: []
    },
    responsibilities: [],
    qualifications: [],
    applicationProcess: {
      deadline: "",
      startDate: "",
      applicationMethod: "platform",
      contactEmail: "",
      contactPhone: "",
      applicationUrl: "",
      instructions: ""
    },
    status: "draft",
    visibility: "public",
    tags: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [newOtherReq, setNewOtherReq] = useState("");
  const [newResponsibility, setNewResponsibility] = useState("");
  const [newQualification, setNewQualification] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newLanguage, setNewLanguage] = useState({ language: "", proficiency: "intermediate" as const });

  // Get subcategories for the selected category
  const selectedCategory = jobCategories.find(cat => (cat.id || cat.key) === form.category);
  
  // Fetch subcategories when category is selected
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!form.category) {
        setSubcategories([]);
        // Reset subcategory when category is cleared
        if (form.subcategory) {
          setForm(prev => ({ ...prev, subcategory: "" }));
        }
        return;
      }

      // First check if subcategories are already in the category data
      const category = jobCategories.find(cat => (cat.id || cat.key) === form.category);
      if (category?.subcategories && category.subcategories.length > 0) {
        setSubcategories(category.subcategories);
        return;
      }

      // If not, try to fetch subcategories from API
      // Check if there's a specific endpoint for category subcategories
      try {
        setLoadingSubcategories(true);
        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.jobsCategories}/${form.category}`,
          createAuthFetchOptions()
        );

        if (response.ok) {
          const data = await response.json();
          const categoryData = data.data || data;
          if (categoryData?.subcategories && Array.isArray(categoryData.subcategories)) {
            setSubcategories(categoryData.subcategories);
          } else {
            setSubcategories([]);
          }
        } else {
          setSubcategories([]);
        }
      } catch (err) {
        // If endpoint doesn't exist or fails, subcategories will remain empty
        // and user can enter free-form text
        logger.debug("Could not fetch subcategories for category", { category: form.category, error: err });
        setSubcategories([]);
      } finally {
        setLoadingSubcategories(false);
      }
    };

    fetchSubcategories();
  }, [form.category, jobCategories]);

  const availableSubcategories = subcategories.length > 0 
    ? subcategories 
    : selectedCategory?.subcategories || [];

  const jobTypes = [
    { value: "full_time", label: "Full Time" },
    { value: "part_time", label: "Part Time" },
    { value: "contract", label: "Contract" },
    { value: "freelance", label: "Freelance" },
    { value: "internship", label: "Internship" },
    { value: "temporary", label: "Temporary" }
  ];

  const experienceLevels = [
    { value: "entry", label: "Entry Level" },
    { value: "junior", label: "Junior" },
    { value: "mid", label: "Mid Level" },
    { value: "senior", label: "Senior" },
    { value: "lead", label: "Lead" },
    { value: "executive", label: "Executive" }
  ];

  const companySizes = [
    { value: "startup", label: "Startup (1-10)" },
    { value: "small", label: "Small (11-50)" },
    { value: "medium", label: "Medium (51-200)" },
    { value: "large", label: "Large (201-1000)" },
    { value: "enterprise", label: "Enterprise (1000+)" }
  ];

  const remoteTypes = [
    { value: "fully_remote", label: "Fully Remote" },
    { value: "hybrid", label: "Hybrid" },
    { value: "on_site", label: "On Site" }
  ];

  const salaryPeriods = [
    { value: "hourly", label: "Per Hour" },
    { value: "daily", label: "Per Day" },
    { value: "weekly", label: "Per Week" },
    { value: "monthly", label: "Per Month" },
    { value: "yearly", label: "Per Year" }
  ];

  const educationLevels = [
    { value: "none_required", label: "None Required" },
    { value: "high_school", label: "High School" },
    { value: "associate", label: "Associate Degree" },
    { value: "bachelor", label: "Bachelor's Degree" },
    { value: "master", label: "Master's Degree" },
    { value: "phd", label: "PhD" }
  ];

  const languageProficiencies = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "native", label: "Native" }
  ];

  const applicationMethods = [
    { value: "platform", label: "Through Platform" },
    { value: "email", label: "Email" },
    { value: "website", label: "Company Website" },
    { value: "phone", label: "Phone" }
  ];

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "active", label: "Active" },
    { value: "paused", label: "Paused" },
    { value: "closed", label: "Closed" },
    { value: "filled", label: "Filled" }
  ];

  const visibilityOptions = [
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
    { value: "featured", label: "Featured" }
  ];

  const commonBenefits = [
    "health_insurance",
    "dental_insurance",
    "vision_insurance",
    "paid_time_off",
    "sick_leave",
    "maternity_leave",
    "paternity_leave",
    "retirement_plan",
    "professional_development",
    "remote_work",
    "flexible_hours",
    "gym_membership",
    "meal_allowance",
    "transportation_allowance"
  ];

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    // Clear general error when user makes changes
    if (error && error.includes("Please fix")) {
      setError(null);
    }
  };

  const handleCompanyChange = (field: string, value: string | undefined) => {
    setForm(prev => ({
      ...prev,
      company: {
        ...prev.company,
        [field]: value
      }
    }));
  };

  const handleCompanyLocationChange = (field: string, value: string | boolean) => {
    setForm(prev => ({
      ...prev,
      company: {
        ...prev.company,
        location: {
          ...prev.company.location,
          [field]: value
        }
      }
    }));
  };

  const handleSalaryChange = (field: string, value: string | number | boolean) => {
    setForm(prev => ({
      ...prev,
      salary: {
        ...prev.salary,
        [field]: value
      }
    }));
  };

  const handleRequirementsChange = (field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [field]: value
      }
    }));
  };

  const handleEducationChange = (field: string, value: string | boolean) => {
    setForm(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        education: {
          ...prev.requirements.education,
          [field]: value
        }
      }
    }));
  };

  const handleExperienceChange = (field: string, value: string | number) => {
    setForm(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        experience: {
          ...prev.requirements.experience,
          [field]: value
        }
      }
    }));
  };

  const handleApplicationProcessChange = (field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      applicationProcess: {
        ...prev.applicationProcess,
        [field]: value
      }
    }));
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setForm(prev => ({
        ...prev,
        requirements: {
          ...prev.requirements,
          skills: [...prev.requirements.skills, newSkill.trim()]
        }
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    setForm(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        skills: prev.requirements.skills.filter((_, i) => i !== index)
      }
    }));
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setForm(prev => ({
        ...prev,
        requirements: {
          ...prev.requirements,
          certifications: [...prev.requirements.certifications, newCertification.trim()]
        }
      }));
      setNewCertification("");
    }
  };

  const removeCertification = (index: number) => {
    setForm(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        certifications: prev.requirements.certifications.filter((_, i) => i !== index)
      }
    }));
  };

  const addOtherReq = () => {
    if (newOtherReq.trim()) {
      setForm(prev => ({
        ...prev,
        requirements: {
          ...prev.requirements,
          other: [...prev.requirements.other, newOtherReq.trim()]
        }
      }));
      setNewOtherReq("");
    }
  };

  const removeOtherReq = (index: number) => {
    setForm(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        other: prev.requirements.other.filter((_, i) => i !== index)
      }
    }));
  };

  const addLanguage = () => {
    if (newLanguage.language.trim()) {
      setForm(prev => ({
        ...prev,
        requirements: {
          ...prev.requirements,
          languages: [...prev.requirements.languages, { ...newLanguage }]
        }
      }));
      setNewLanguage({ language: "", proficiency: "intermediate" });
    }
  };

  const removeLanguage = (index: number) => {
    setForm(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        languages: prev.requirements.languages.filter((_, i) => i !== index)
      }
    }));
  };

  const addResponsibility = () => {
    if (newResponsibility.trim()) {
      setForm(prev => ({
        ...prev,
        responsibilities: [...prev.responsibilities, newResponsibility.trim()]
      }));
      setNewResponsibility("");
    }
  };

  const removeResponsibility = (index: number) => {
    setForm(prev => ({
      ...prev,
      responsibilities: prev.responsibilities.filter((_, i) => i !== index)
    }));
  };

  const addQualification = () => {
    if (newQualification.trim()) {
      setForm(prev => ({
        ...prev,
        qualifications: [...prev.qualifications, newQualification.trim()]
      }));
      setNewQualification("");
    }
  };

  const removeQualification = (index: number) => {
    setForm(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim()) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const toggleBenefit = (benefit: string) => {
    setForm(prev => ({
      ...prev,
      benefits: prev.benefits.includes(benefit)
        ? prev.benefits.filter(b => b !== benefit)
        : [...prev.benefits, benefit]
    }));
  };

  const totalSteps = FORM_STEPS.length;
  const progress = (currentStep / totalSteps) * 100;

  const validateCurrentStep = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    
    switch (currentStep) {
      case 1:
        if (!form.title.trim()) errors.title = "Job title is required";
        if (form.title.trim().length > 100) errors.title = "Job title must be 100 characters or less";
        if (!form.description.trim()) errors.description = "Description is required";
        if (form.description.trim().length < 50) errors.description = "Description must be at least 50 characters";
        if (form.description.trim().length > 2000) errors.description = "Description must be 2000 characters or less";
        if (!form.category) errors.category = "Category is required";
        if (!form.subcategory) errors.subcategory = "Subcategory is required";
        if (!form.jobType) errors.jobType = "Job type is required";
        if (!form.experienceLevel) errors.experienceLevel = "Experience level is required";
        break;
      case 2:
        if (!form.company.name.trim()) errors.companyName = "Company name is required";
        if (form.company.location.remoteType !== "fully_remote" && !form.company.location.city.trim()) {
          errors.city = "City is required for non-remote jobs";
        }
        if (form.company.location.remoteType !== "fully_remote" && !form.company.location.state.trim()) {
          errors.state = "State is required for non-remote jobs";
        }
        // Validate website URL if provided
        if (form.company.website && form.company.website.trim()) {
          try {
            new URL(form.company.website);
          } catch {
            errors.companyWebsite = "Please enter a valid URL (e.g., https://example.com)";
          }
        }
        break;
      case 3:
        if (form.salary.min === undefined || form.salary.min === null || form.salary.min <= 0 || isNaN(form.salary.min)) {
          errors.salaryMin = "Minimum salary must be greater than 0";
        }
        if (form.salary.max === undefined || form.salary.max === null || form.salary.max <= 0 || isNaN(form.salary.max)) {
          errors.salaryMax = "Maximum salary must be greater than 0";
        }
        if (!errors.salaryMin && !errors.salaryMax && form.salary.max < form.salary.min) {
          errors.salaryMax = "Maximum salary must be greater than or equal to minimum";
        }
        break;
      case 4:
        if (form.requirements.skills.length === 0) errors.skills = "At least one skill is required";
        break;
      case 5:
        // Responsibilities and qualifications are optional
        break;
      case 6:
        if (!form.applicationProcess.deadline) {
          errors.deadline = "Application deadline is required";
        } else {
          const deadlineDate = new Date(form.applicationProcess.deadline);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (deadlineDate < today) {
            errors.deadline = "Deadline must be in the future";
          }
        }
        if (!form.applicationProcess.startDate) {
          errors.startDate = "Start date is required";
        } else if (form.applicationProcess.deadline) {
          const startDate = new Date(form.applicationProcess.startDate);
          const deadlineDate = new Date(form.applicationProcess.deadline);
          if (startDate < deadlineDate) {
            errors.startDate = "Start date must be on or after the application deadline";
          }
        }
        // Validate email if provided
        if (form.applicationProcess.contactEmail && form.applicationProcess.contactEmail.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(form.applicationProcess.contactEmail)) {
            errors.contactEmail = "Please enter a valid email address";
          }
        }
        // Validate URL if provided
        if (form.applicationProcess.applicationUrl && form.applicationProcess.applicationUrl.trim()) {
          try {
            new URL(form.applicationProcess.applicationUrl);
          } catch {
            errors.applicationUrl = "Please enter a valid URL (e.g., https://example.com)";
          }
        }
        // Validate website URL if provided
        if (form.company.website && form.company.website.trim()) {
          try {
            new URL(form.company.website);
          } catch {
            errors.companyWebsite = "Please enter a valid URL (e.g., https://example.com)";
          }
        }
        break;
      case 7:
        // Status and visibility have defaults
        break;
      case 8:
        // Final validation - check all critical fields
        if (!form.title.trim()) errors.title = "Job title is required";
        if (!form.description.trim()) errors.description = "Description is required";
        if (!form.company.name.trim()) errors.companyName = "Company name is required";
        if (form.requirements.skills.length === 0) errors.skills = "At least one skill is required";
        break;
      default:
        break;
    }
    
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return (
          form.title.trim() !== "" && 
          form.description.trim() !== "" && 
          !!form.category &&
          !!form.subcategory &&
          !!form.jobType &&
          !!form.experienceLevel
        );
      case 2:
        return (
          form.company.name.trim() !== "" &&
          (form.company.location.remoteType === "fully_remote" || 
           (form.company.location.city.trim() !== "" && form.company.location.state.trim() !== ""))
        );
      case 3:
        return (
          form.salary.min > 0 && 
          !isNaN(form.salary.min) &&
          form.salary.max > 0 && 
          !isNaN(form.salary.max) &&
          form.salary.max >= form.salary.min
        );
      case 4:
        return form.requirements.skills.length > 0;
      case 5:
        // Responsibilities and qualifications are optional
        return true;
      case 6:
        return (
          form.applicationProcess.deadline !== "" &&
          form.applicationProcess.startDate !== ""
        );
      case 7:
        // Status and visibility have defaults
        return true;
      case 8:
        // Final step - check critical validations
        return (
          form.title.trim().length > 0 &&
          form.description.trim().length >= 50 &&
          form.company.name.trim().length > 0 &&
          form.category.length > 0 &&
          form.subcategory.length > 0 &&
          form.salary.min > 0 &&
          form.salary.max > 0 &&
          form.salary.max >= form.salary.min &&
          form.requirements.skills.length > 0 &&
          form.applicationProcess.deadline.length > 0 &&
          form.applicationProcess.startDate.length > 0
        );
      default:
        return true;
    }
  };

  const handleNext = () => {
    const validation = validateCurrentStep();
    
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      const errorMessages = Object.values(validation.errors);
      setError(`Please fix the following errors: ${errorMessages.join(", ")}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Clear errors when proceeding
    setFieldErrors({});
    setError(null);
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
      setFieldErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation before submit
    const validation = validateCurrentStep();
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      const errorMessages = Object.values(validation.errors);
      setError(`Please fix the following errors: ${errorMessages.join(", ")}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      // Build the payload matching the expected structure
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        subcategory: form.subcategory,
        jobType: form.jobType,
        experienceLevel: form.experienceLevel,
        company: {
          name: form.company.name,
          website: form.company.website || undefined,
          size: form.company.size,
          industry: form.company.industry || undefined,
          location: {
            address: form.company.location.address || undefined,
            city: form.company.location.city,
            state: form.company.location.state,
            country: form.company.location.country,
            coordinates: form.company.location.coordinates && form.company.location.coordinates.lat && form.company.location.coordinates.lng
              ? form.company.location.coordinates
              : undefined,
            isRemote: form.company.location.isRemote,
            remoteType: form.company.location.remoteType
          }
        },
        salary: {
          min: form.salary.min,
          max: form.salary.max,
          currency: form.salary.currency,
          period: form.salary.period,
          isNegotiable: form.salary.isNegotiable,
          isConfidential: form.salary.isConfidential
        },
        benefits: form.benefits,
        requirements: {
          skills: form.requirements.skills,
          education: form.requirements.education,
          experience: form.requirements.experience,
          certifications: form.requirements.certifications,
          languages: form.requirements.languages,
          other: form.requirements.other
        },
        responsibilities: form.responsibilities,
        qualifications: form.qualifications,
        applicationProcess: {
          deadline: form.applicationProcess.deadline,
          startDate: form.applicationProcess.startDate,
          applicationMethod: form.applicationProcess.applicationMethod,
          contactEmail: form.applicationProcess.contactEmail || undefined,
          contactPhone: form.applicationProcess.contactPhone || undefined,
          applicationUrl: form.applicationProcess.applicationUrl || undefined,
          instructions: form.applicationProcess.instructions || undefined
        },
        status: form.status,
        visibility: form.visibility,
        tags: form.tags
      };

      if (!getApiToken()) {
        throw new Error('Please log in to create a job');
      }
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.jobs}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create job");
      }

      const result = await response.json();
      const job = result.data || result;
      
      // Show success toast
      success("Job created successfully! Redirecting...", 3000);
      
      // Keep button disabled and navigate after a short delay to show the toast
      setTimeout(() => {
        router.push(`/jobs/${job.id || job._id}`);
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-gray-200">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Job Title *"
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g., Senior Plumber"
                  className={fieldErrors.title ? "border-red-300" : ""}
                />
                {fieldErrors.title && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.title}</p>
                )}
              </div>

              <div>
                <Select
                  label="Category *"
                  value={form.category}
                  onValueChange={(value) => {
                    handleInputChange("category", value);
                    // Reset subcategory when category changes
                    if (form.category !== value) {
                      handleInputChange("subcategory", "");
                    }
                  }}
                  options={jobCategories.map(cat => ({
                    value: cat.id || cat.key,
                    label: cat.name
                  }))}
                  placeholder={categoriesLoading ? "Loading categories..." : "Select a category..."}
                  disabled={categoriesLoading}
                  className={fieldErrors.category ? "border-red-300" : ""}
                />
                {fieldErrors.category && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.category}</p>
                )}
                {categoriesError && (
                  <p className="text-xs text-red-600 mt-1">Error loading categories: {categoriesError}</p>
                )}
                {categoriesLoading && (
                  <p className="text-xs text-gray-500 mt-1">Loading categories...</p>
                )}
              </div>

              <div>
                {availableSubcategories.length > 0 ? (
                  <>
                    <Select
                      label="Subcategory *"
                      value={form.subcategory}
                      onValueChange={(value) => handleInputChange("subcategory", value)}
                      options={availableSubcategories.map(sub => ({
                        value: sub,
                        label: sub
                      }))}
                      placeholder={!form.category ? "Select a category first..." : loadingSubcategories ? "Loading subcategories..." : "Select a subcategory..."}
                      disabled={!form.category || loadingSubcategories}
                      className={fieldErrors.subcategory ? "border-red-300" : ""}
                    />
                    {fieldErrors.subcategory && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.subcategory}</p>
                    )}
                    {!form.category && (
                      <p className="text-xs text-gray-500 mt-1">Please select a category first</p>
                    )}
                  </>
                ) : (
                  <>
                    <Input
                      label="Subcategory *"
                      type="text"
                      required
                      value={form.subcategory}
                      onChange={(e) => handleInputChange("subcategory", e.target.value)}
                      placeholder={!form.category ? "Select a category first..." : "e.g., Plumbing, Web Development, Graphic Design"}
                      disabled={!form.category}
                      className={fieldErrors.subcategory ? "border-red-300" : ""}
                    />
                    {fieldErrors.subcategory && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.subcategory}</p>
                    )}
                    {!form.category && (
                      <p className="text-xs text-gray-500 mt-1">Please select a category first</p>
                    )}
                    {form.category && (
                      <p className="text-xs text-gray-500 mt-1">Enter a specific subcategory for this job</p>
                    )}
                  </>
                )}
              </div>

              <div>
                <Select
                  label="Job Type *"
                  value={form.jobType}
                  onValueChange={(value) => handleInputChange("jobType", value)}
                  options={jobTypes}
                  className={fieldErrors.jobType ? "border-red-300" : ""}
                />
                {fieldErrors.jobType && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.jobType}</p>
                )}
              </div>

              <div>
                <Select
                  label="Experience Level *"
                  value={form.experienceLevel}
                  onValueChange={(value) => handleInputChange("experienceLevel", value)}
                  options={experienceLevels}
                  className={fieldErrors.experienceLevel ? "border-red-300" : ""}
                />
                {fieldErrors.experienceLevel && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.experienceLevel}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Textarea
                  label="Job Description *"
                  required
                  rows={6}
                  value={form.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe the job requirements, responsibilities, and what you're looking for in a candidate..."
                  className={fieldErrors.description ? "border-red-300" : ""}
                />
                {fieldErrors.description && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.description}</p>
                )}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-gray-200">Company Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Company Name *"
                  type="text"
                  required
                  value={form.company.name}
                  onChange={(e) => handleCompanyChange("name", e.target.value)}
                  placeholder="e.g., ABC Plumbing Services"
                  className={fieldErrors.companyName ? "border-red-300" : ""}
                />
                {fieldErrors.companyName && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.companyName}</p>
                )}
              </div>

              <div>
                <Input
                  label="Website"
                  type="url"
                  value={form.company.website}
                  onChange={(e) => handleCompanyChange("website", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <Select
                  label="Company Size"
                  value={form.company.size || "medium"}
                  onValueChange={(value) => handleCompanyChange("size", value)}
                  options={companySizes}
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Industry"
                  type="text"
                  value={form.company.industry}
                  onChange={(e) => handleCompanyChange("industry", e.target.value)}
                  placeholder="e.g., Construction, Technology, Healthcare"
                />
              </div>

              <div className="md:col-span-2">
                <Select
                  label="Remote Type *"
                  value={form.company.location.remoteType}
                  onValueChange={(value) => handleCompanyLocationChange("remoteType", value)}
                  options={remoteTypes}
                />
              </div>

              {form.company.location.remoteType !== "fully_remote" && (
                <>
                  <div>
                    <Input
                      label="City *"
                      type="text"
                      required
                      value={form.company.location.city}
                      onChange={(e) => handleCompanyLocationChange("city", e.target.value)}
                      placeholder="Manila"
                      leftIcon={<MapPin />}
                      className={fieldErrors.city ? "border-red-300" : ""}
                    />
                    {fieldErrors.city && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.city}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      label="State *"
                      type="text"
                      required
                      value={form.company.location.state}
                      onChange={(e) => handleCompanyLocationChange("state", e.target.value)}
                      placeholder="Metro Manila"
                      className={fieldErrors.state ? "border-red-300" : ""}
                    />
                    {fieldErrors.state && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.state}</p>
                    )}
                  </div>
                </>
              )}

              {form.company.location.remoteType === "fully_remote" && (
                <div className="md:col-span-2">
                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                    <p className="text-sm text-emerald-800 font-medium">
                      This is a fully remote position. Location information is not required.
                    </p>
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <Input
                  label="Address (Optional)"
                  type="text"
                  value={form.company.location.address}
                  onChange={(e) => handleCompanyLocationChange("address", e.target.value)}
                  placeholder="123 Main Street, Manila, Metro Manila 1000"
                />
              </div>

              <div>
                <Input
                  label="Country"
                  type="text"
                  value={form.company.location.country}
                  onChange={(e) => handleCompanyLocationChange("country", e.target.value)}
                  placeholder="Philippines"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-gray-200">Salary & Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Minimum Salary (PHP) *"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.salary.min === 0 ? "" : form.salary.min}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : Number(e.target.value);
                    handleSalaryChange("min", isNaN(value) ? 0 : value);
                  }}
                  placeholder="30000"
                  leftIcon={<span className="text-gray-500 font-semibold">₱</span>}
                  className={fieldErrors.salaryMin ? "border-red-300" : ""}
                />
                {fieldErrors.salaryMin && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.salaryMin}</p>
                )}
              </div>

              <div>
                <Input
                  label="Maximum Salary (PHP) *"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.salary.max === 0 ? "" : form.salary.max}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : Number(e.target.value);
                    handleSalaryChange("max", isNaN(value) ? 0 : value);
                  }}
                  placeholder="40000"
                  leftIcon={<span className="text-gray-500 font-semibold">₱</span>}
                  className={fieldErrors.salaryMax ? "border-red-300" : ""}
                />
                {fieldErrors.salaryMax && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.salaryMax}</p>
                )}
              </div>

              <div>
                <Select
                  label="Salary Period *"
                  value={form.salary.period}
                  onValueChange={(value) => handleSalaryChange("period", value)}
                  options={salaryPeriods}
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.salary.isNegotiable}
                    onChange={(e) => handleSalaryChange("isNegotiable", e.target.checked)}
                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                  />
                  <span className="text-base font-medium text-gray-800">Salary is negotiable</span>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.salary.isConfidential}
                    onChange={(e) => handleSalaryChange("isConfidential", e.target.checked)}
                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                  />
                  <span className="text-base font-medium text-gray-800">Keep salary confidential</span>
                </label>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Benefits</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {commonBenefits.map((benefit) => (
                    <label key={benefit} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={form.benefits.includes(benefit)}
                        onChange={() => toggleBenefit(benefit)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 capitalize">{benefit.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-gray-200">Skills Required *</h2>
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
                      placeholder="Add a skill (e.g., Pipe installation, React, Python)..."
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
                {fieldErrors.skills && (
                  <p className="text-xs text-red-600">{fieldErrors.skills}</p>
                )}
                <div className="space-y-2">
                  {form.requirements.skills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                      <span className="flex-1 text-base text-gray-800 font-medium">{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                        aria-label={`Remove ${skill}`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Education</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Select
                    label="Education Level"
                    value={form.requirements.education.level}
                    onValueChange={(value) => handleEducationChange("level", value)}
                    options={educationLevels}
                  />
                </div>
                <div>
                  <Input
                    label="Field of Study"
                    type="text"
                    value={form.requirements.education.field}
                    onChange={(e) => handleEducationChange("field", e.target.value)}
                    placeholder="e.g., Plumbing, Computer Science"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.requirements.education.isRequired}
                      onChange={(e) => handleEducationChange("isRequired", e.target.checked)}
                      className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                    />
                    <span className="text-base font-medium text-gray-800">Education is required</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Experience</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="Years of Experience"
                    type="number"
                    min="0"
                    value={form.requirements.experience.years}
                    onChange={(e) => handleExperienceChange("years", Number(e.target.value))}
                    placeholder="5"
                  />
                </div>
                <div className="md:col-span-2">
                  <Textarea
                    label="Experience Description"
                    rows={3}
                    value={form.requirements.experience.description}
                    onChange={(e) => handleExperienceChange("description", e.target.value)}
                    placeholder="e.g., Minimum 5 years of professional plumbing experience"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Certifications</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCertification();
                        }
                      }}
                      placeholder="Add a certification (e.g., Licensed Plumber, OSHA Certification)..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addCertification}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {form.requirements.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                      <span className="flex-1 text-base text-gray-800 font-medium">{cert}</span>
                      <button
                        type="button"
                        onClick={() => removeCertification(index)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Languages</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      type="text"
                      value={newLanguage.language}
                      onChange={(e) => setNewLanguage({ ...newLanguage, language: e.target.value })}
                      placeholder="Language (e.g., English, Tagalog)"
                    />
                  </div>
                  <div>
                    <Select
                      value={newLanguage.proficiency}
                      onValueChange={(value) => setNewLanguage({ ...newLanguage, proficiency: value as typeof newLanguage.proficiency })}
                      options={languageProficiencies}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addLanguage}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Add Language
                </button>
                <div className="space-y-2">
                  {form.requirements.languages.map((lang, index) => (
                    <div key={index} className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                      <span className="flex-1 text-base text-gray-800 font-medium">{lang.language} ({lang.proficiency})</span>
                      <button
                        type="button"
                        onClick={() => removeLanguage(index)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Other Requirements</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={newOtherReq}
                      onChange={(e) => setNewOtherReq(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addOtherReq();
                        }
                      }}
                      placeholder="Add other requirement (e.g., Valid driver's license, Own transportation)..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addOtherReq}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {form.requirements.other.map((req, index) => (
                    <div key={index} className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                      <span className="flex-1 text-base text-gray-800 font-medium">{req}</span>
                      <button
                        type="button"
                        onClick={() => removeOtherReq(index)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-gray-200">Responsibilities</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={newResponsibility}
                      onChange={(e) => setNewResponsibility(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addResponsibility();
                        }
                      }}
                      placeholder="Add a responsibility (e.g., Install and repair plumbing systems)..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addResponsibility}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {form.responsibilities.map((responsibility, index) => (
                    <div key={index} className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                      <span className="flex-1 text-base text-gray-800 font-medium">{responsibility}</span>
                      <button
                        type="button"
                        onClick={() => removeResponsibility(index)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-gray-200">Qualifications</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={newQualification}
                      onChange={(e) => setNewQualification(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addQualification();
                        }
                      }}
                      placeholder="Add a qualification (e.g., Strong problem-solving skills)..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addQualification}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {form.qualifications.map((qualification, index) => (
                    <div key={index} className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                      <span className="flex-1 text-base text-gray-800 font-medium">{qualification}</span>
                      <button
                        type="button"
                        onClick={() => removeQualification(index)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-gray-200">Application Process</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Application Deadline *"
                  type="date"
                  required
                  value={form.applicationProcess.deadline}
                  onChange={(e) => handleApplicationProcessChange("deadline", e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  leftIcon={<Calendar />}
                  className={fieldErrors.deadline ? "border-red-300" : ""}
                />
                {fieldErrors.deadline && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.deadline}</p>
                )}
              </div>

              <div>
                <Input
                  label="Start Date *"
                  type="date"
                  required
                  value={form.applicationProcess.startDate}
                  onChange={(e) => handleApplicationProcessChange("startDate", e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  leftIcon={<Calendar />}
                  className={fieldErrors.startDate ? "border-red-300" : ""}
                />
                {fieldErrors.startDate && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.startDate}</p>
                )}
              </div>

              <div>
                <Select
                  label="Application Method *"
                  value={form.applicationProcess.applicationMethod}
                  onValueChange={(value) => handleApplicationProcessChange("applicationMethod", value)}
                  options={applicationMethods}
                />
              </div>

              <div>
                <Input
                  label="Contact Email"
                  type="email"
                  value={form.applicationProcess.contactEmail}
                  onChange={(e) => handleApplicationProcessChange("contactEmail", e.target.value)}
                  placeholder="hr@example.com"
                  className={fieldErrors.contactEmail ? "border-red-300" : ""}
                />
                {fieldErrors.contactEmail && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.contactEmail}</p>
                )}
              </div>

              <div>
                <Input
                  label="Contact Phone"
                  type="tel"
                  value={form.applicationProcess.contactPhone}
                  onChange={(e) => handleApplicationProcessChange("contactPhone", e.target.value)}
                  placeholder="+639171234567"
                />
              </div>

              <div>
                <Input
                  label="Application URL"
                  type="url"
                  value={form.applicationProcess.applicationUrl}
                  onChange={(e) => handleApplicationProcessChange("applicationUrl", e.target.value)}
                  placeholder="https://example.com/careers"
                  className={fieldErrors.applicationUrl ? "border-red-300" : ""}
                />
                {fieldErrors.applicationUrl && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.applicationUrl}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Textarea
                  label="Application Instructions"
                  rows={4}
                  value={form.applicationProcess.instructions}
                  onChange={(e) => handleApplicationProcessChange("instructions", e.target.value)}
                  placeholder="Please submit your resume and cover letter through the platform."
                />
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-gray-200">Additional Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Select
                  label="Status"
                  value={form.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                  options={statusOptions}
                />
              </div>

              <div>
                <Select
                  label="Visibility"
                  value={form.visibility}
                  onValueChange={(value) => handleInputChange("visibility", value)}
                  options={visibilityOptions}
                />
              </div>

              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Tags</h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        placeholder="Add a tag (e.g., plumbing, full-time, manila)..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:scale-105"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full border border-blue-200 shadow-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 8:
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-gray-200">Review & Submit</h2>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 md:p-8 border-2 border-blue-200 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{form.title || "Job Title"}</h3>
                <p className="text-gray-600">{form.company.name}</p>
                <div className="flex flex-wrap items-center gap-4 text-base text-gray-700 mt-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {form.company.location.remoteType === "fully_remote" ? "Remote" : `${form.company.location.city || "City"}, ${form.company.location.state || "State"}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-gray-600 font-semibold">₱</span>
                    {form.salary.min > 0 && form.salary.max > 0 
                      ? `${formatCurrency(form.salary.min, "PHP", { appSettings })} - ${formatCurrency(form.salary.max, "PHP", { appSettings })} ${form.salary.period}`
                      : "Salary not set"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {jobTypes.find(jt => jt.value === form.jobType)?.label || form.jobType}
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 text-lg">Description</h4>
                <p className="text-gray-700 text-base leading-relaxed">{form.description || "Job description will appear here..."}</p>
              </div>

              {form.requirements.skills.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 text-lg">Skills Required</h4>
                  <div className="flex flex-wrap gap-2">
                    {form.requirements.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-block px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full border border-blue-200 shadow-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {form.responsibilities.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 text-lg">Responsibilities</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {form.responsibilities.map((resp, index) => (
                      <li key={index}>{resp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {form.benefits.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 text-lg">Benefits</h4>
                  <div className="flex flex-wrap gap-2">
                    {form.benefits.map((benefit, index) => (
                      <span
                        key={index}
                        className="inline-block px-3 py-1.5 text-sm font-medium bg-green-100 text-green-800 rounded-full border border-green-200"
                      >
                        {benefit.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
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
            <p className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {FORM_STEPS[currentStep - 1]?.title}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
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

        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 md:p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-10" noValidate>
            {/* Step Content */}
            {renderStepContent()}

            {/* Error Message */}
            {error && (
              <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-lg p-5 shadow-md">
                <p className="text-red-700 font-semibold text-base">{error}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-8 border-t-2 border-gray-300">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="px-6 py-2.5 border-2 border-gray-300 text-gray-800 rounded-lg bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md hover:scale-105 font-semibold text-base flex items-center gap-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                  </button>
                )}
              </div>
              <div className="flex gap-4">
                <Link
                  href="/jobs"
                  className="px-8 py-3 border-2 border-gray-300 text-gray-800 rounded-lg bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md hover:scale-105 font-semibold text-base"
                >
                  Cancel
                </Link>
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceedToNext()}
                    className={`px-8 py-3 rounded-lg transition-all shadow-lg font-bold text-base flex items-center gap-2 ${
                      canProceedToNext()
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl hover:scale-105 shadow-emerald-500/30"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
                    }`}
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || !canProceedToNext()}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 font-bold text-base disabled:hover:scale-100 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Post Job
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
