/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/academy/types-courses' instead.
 */
export * from '@/features/academy/types-courses';
import type { CourseCategory } from '@/features/academy/types-courses';
export type CourseLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type LessonType = "video" | "text" | "quiz" | "practical";
export type SessionType = "live" | "recorded" | "practical";
export type EnrollmentStatus = "enrolled" | "in_progress" | "completed" | "dropped";
export type PaymentStatus = "pending" | "paid" | "refunded";
export type RequirementType = "course_completion" | "exam" | "practical" | "experience";

export interface CoursePartner {
  name?: string;
  logo?: string;
  website?: string;
}

export interface CourseDuration {
  hours: number;
  weeks?: number;
}

export interface CoursePricing {
  regularPrice: number;
  discountedPrice?: number;
  currency?: string;
}

export interface LessonContent {
  url?: string;
  publicId?: string;
  type?: string;
}

export interface CourseLesson {
  title?: string;
  description?: string;
  duration?: number;
  type?: LessonType;
  content?: LessonContent;
  isFree?: boolean;
}

export interface CourseModule {
  module: string;
  lessons?: CourseLesson[];
}

export interface CourseCertification {
  isAvailable?: boolean;
  name?: string;
  issuer?: string;
  validity?: number;
  requirements?: string[];
}

export interface CourseEnrollment {
  current?: number;
  maxCapacity?: number;
  isOpen?: boolean;
}

export interface CourseSession {
  date?: Date;
  startTime?: string;
  endTime?: string;
  type?: SessionType;
}

export interface CourseSchedule {
  startDate?: Date;
  endDate?: Date;
  sessions?: CourseSession[];
}

export interface CourseRating {
  average?: number;
  count?: number;
}

export interface CourseThumbnail {
  url?: string;
  publicId?: string;
  thumbnail?: string;
}

export interface Course {
  _id?: string;
  title: string;
  description: string;
  category: CourseCategory;
  instructor: string;
  partner?: CoursePartner;
  level: CourseLevel;
  duration: CourseDuration;
  pricing: CoursePricing;
  curriculum?: CourseModule[];
  prerequisites?: string[];
  learningOutcomes?: string[];
  certification?: CourseCertification;
  enrollment?: CourseEnrollment;
  schedule?: CourseSchedule;
  rating?: CourseRating;
  isActive?: boolean;
  thumbnail?: CourseThumbnail;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CompletedLesson {
  lessonId?: string;
  completedAt?: Date;
}

export interface EnrollmentProgress {
  completedLessons?: CompletedLesson[];
  overallProgress?: number;
}

export interface EnrollmentPayment {
  amount?: number;
  currency?: string;
  status?: PaymentStatus;
  transactionId?: string;
  paidAt?: Date;
}

export interface EnrollmentCertificate {
  issued?: boolean;
  issuedAt?: Date;
  certificateId?: string;
  downloadUrl?: string;
  publicId?: string;
}

export interface Enrollment {
  _id?: string;
  student: string;
  course: string;
  enrollmentDate?: Date;
  status?: EnrollmentStatus;
  progress?: EnrollmentProgress;
  payment?: EnrollmentPayment;
  certificate?: EnrollmentCertificate;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CertificationRequirement {
  type: RequirementType;
  description?: string;
  value?: string;
}

export interface CertificationValidity {
  duration?: number;
  renewable?: boolean;
}

export interface ExamQuestion {
  question?: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
}

export interface CertificationExam {
  isRequired?: boolean;
  duration?: number;
  passingScore?: number;
  questions?: ExamQuestion[];
}

export interface Certification {
  _id?: string;
  name: string;
  description: string;
  issuer: string;
  category: string;
  requirements?: CertificationRequirement[];
  validity?: CertificationValidity;
  exam?: CertificationExam;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
