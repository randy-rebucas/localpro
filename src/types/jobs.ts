export type CompanySize = "startup" | "small" | "medium" | "large" | "enterprise";
export type RemoteType = "fully_remote" | "hybrid" | "on_site";
export type JobType = "full_time" | "part_time" | "contract" | "freelance" | "internship" | "temporary";
export type ExperienceLevel = "entry" | "junior" | "mid" | "senior" | "lead" | "executive";
export type EducationLevel = "high_school" | "associate" | "bachelor" | "master" | "phd" | "none_required";
export type LanguageProficiency = "beginner" | "intermediate" | "advanced" | "native";
export type SalaryPeriod = "hourly" | "daily" | "weekly" | "monthly" | "yearly";
export type ApplicationMethod = "email" | "website" | "platform" | "phone";
export type JobStatus = "draft" | "active" | "paused" | "closed" | "filled";
export type Visibility = "public" | "private" | "featured";
export type ApplicationStatus = "pending" | "reviewing" | "shortlisted" | "interviewed" | "rejected" | "hired";
export type InterviewType = "phone" | "video" | "in_person";
export type InterviewStatus = "scheduled" | "completed" | "cancelled" | "rescheduled";
export type Recommendation = "strong_hire" | "hire" | "no_hire" | "strong_no_hire";
export type PromotionType = "standard" | "premium" | "urgent";

export interface JobCategoryMetadata {
  icon?: string;
  color?: string;
  tags?: string[];
}

export interface JobCategory {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  isActive?: boolean;
  displayOrder?: number;
  metadata?: JobCategoryMetadata;
}

export interface CompanyLogo {
  url?: string;
  publicId?: string;
}

export interface Coordinates {
  lat?: number;
  lng?: number;
}

export interface CompanyLocation {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  coordinates?: Coordinates;
  isRemote?: boolean;
  remoteType?: RemoteType;
}

export interface Company {
  name: string;
  logo?: CompanyLogo;
  website?: string;
  size?: CompanySize;
  industry?: string;
  location?: CompanyLocation;
}

export interface Salary {
  min?: number;
  max?: number;
  currency?: string;
  period?: SalaryPeriod;
  isNegotiable?: boolean;
  isConfidential?: boolean;
}

export interface Education {
  level?: EducationLevel;
  field?: string;
  isRequired?: boolean;
}

export interface Experience {
  years?: number;
  description?: string;
}

export interface Language {
  language?: string;
  proficiency?: LanguageProficiency;
}

export interface Requirements {
  skills?: string[];
  education?: Education;
  experience?: Experience;
  certifications?: string[];
  languages?: Language[];
  other?: string[];
}

export interface ApplicationProcess {
  deadline?: Date;
  startDate?: Date;
  applicationMethod?: ApplicationMethod;
  contactEmail?: string;
  contactPhone?: string;
  applicationUrl?: string;
  instructions?: string;
}

export interface Resume {
  url?: string;
  publicId?: string;
  filename?: string;
}

export interface Portfolio {
  url?: string;
  description?: string;
}

export interface InterviewSchedule {
  date?: Date;
  time?: string;
  type?: InterviewType;
  location?: string;
  interviewer?: string;
  status?: InterviewStatus;
  feedback?: string;
}

export interface Feedback {
  rating?: number;
  comments?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendation?: Recommendation;
}

export interface Application {
  applicant?: string;
  appliedAt?: Date;
  status?: ApplicationStatus;
  coverLetter?: string;
  resume?: Resume;
  portfolio?: Portfolio;
  expectedSalary?: number;
  availability?: string;
  notes?: string;
  interviewSchedule?: InterviewSchedule[];
  feedback?: Feedback;
}

export interface Views {
  count?: number;
  unique?: number;
}

export interface Analytics {
  applicationsCount?: number;
  viewsCount?: number;
  sharesCount?: number;
  savesCount?: number;
}

export interface Featured {
  isFeatured?: boolean;
  featuredUntil?: Date;
  featuredAt?: Date;
}

export interface Promoted {
  isPromoted?: boolean;
  promotedUntil?: Date;
  promotedAt?: Date;
  promotionType?: PromotionType;
}

export interface Job {
  _id?: string;
  title: string;
  description: string;
  company: Company;
  employer: string;
  category: string;
  subcategory: string;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  salary?: Salary;
  benefits?: string[];
  requirements?: Requirements;
  responsibilities?: string[];
  qualifications?: string[];
  applicationProcess?: ApplicationProcess;
  status?: JobStatus;
  visibility?: Visibility;
  applications?: Application[];
  views?: Views;
  analytics?: Analytics;
  tags?: string[];
  isActive?: boolean;
  isRemote?: boolean;
  featured?: Featured;
  promoted?: Promoted;
  createdAt?: Date;
  updatedAt?: Date;
}
