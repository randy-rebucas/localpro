export type AnalyticsEventType =
  | "page_view"
  | "service_view"
  | "booking_created"
  | "booking_completed"
  | "job_view"
  | "job_application"
  | "course_enrollment"
  | "product_purchase"
  | "referral_click"
  | "referral_completed"
  | "subscription_upgrade"
  | "payment_completed"
  | "search_performed"
  | "filter_applied"
  | "user_registration"
  | "user_login"
  | "profile_update";

export type DeviceType = "desktop" | "mobile" | "tablet";

export interface LocationCoordinates {
  lat?: number;
  lng?: number;
}

export interface EventLocation {
  country?: string;
  region?: string;
  city?: string;
  coordinates?: LocationCoordinates;
}

export interface EventMetadata {
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  sessionId?: string;
  deviceType?: DeviceType;
  browser?: string;
  os?: string;
  location?: EventLocation;
}

export interface AnalyticsEvent {
  _id?: string;
  userId: string;
  eventType: AnalyticsEventType;
  eventData?: Record<string, unknown>;
  metadata?: EventMetadata;
  timestamp?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserProfile {
  totalViews?: number;
  totalBookings?: number;
  totalJobsApplied?: number;
  totalCoursesEnrolled?: number;
  totalPurchases?: number;
  totalReferrals?: number;
  lastActiveAt?: Date;
}

export interface UserEngagement {
  averageSessionDuration?: number;
  totalSessions?: number;
  bounceRate?: number;
  conversionRate?: number;
}

export interface UserRevenue {
  totalEarned?: number;
  totalSpent?: number;
  averageOrderValue?: number;
}

export interface MonthlyStats {
  month?: string;
  year?: number;
  views?: number;
  bookings?: number;
  revenue?: number;
  sessions?: number;
}

export interface UserAnalytics {
  _id?: string;
  userId: string;
  profile?: UserProfile;
  engagement?: UserEngagement;
  revenue?: UserRevenue;
  monthlyStats?: MonthlyStats[];
  lastUpdated?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DailyViews {
  date?: string;
  count?: number;
}

export interface ServiceViews {
  total?: number;
  unique?: number;
  daily?: DailyViews[];
}

export interface ServiceBookings {
  total?: number;
  completed?: number;
  cancelled?: number;
  conversionRate?: number;
}

export interface MonthlyRevenue {
  month?: string;
  year?: number;
  amount?: number;
}

export interface ServiceRevenue {
  total?: number;
  average?: number;
  monthly?: MonthlyRevenue[];
}

export interface RatingDistribution {
  five?: number;
  four?: number;
  three?: number;
  two?: number;
  one?: number;
}

export interface ServiceRatings {
  average?: number;
  count?: number;
  distribution?: RatingDistribution;
}

export interface ServiceAnalytics {
  _id?: string;
  serviceId: string;
  views?: ServiceViews;
  bookings?: ServiceBookings;
  revenue?: ServiceRevenue;
  ratings?: ServiceRatings;
  lastUpdated?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PlatformUsers {
  total?: number;
  new?: number;
  active?: number;
}

export interface PlatformServices {
  total?: number;
  new?: number;
  active?: number;
}

export interface PlatformBookings {
  total?: number;
  completed?: number;
  revenue?: number;
}

export interface PlatformJobs {
  total?: number;
  applications?: number;
}

export interface PlatformCourses {
  total?: number;
  enrollments?: number;
}

export interface PlatformReferrals {
  total?: number;
  completed?: number;
}

export interface PlatformAnalytics {
  _id?: string;
  date: Date;
  users?: PlatformUsers;
  services?: PlatformServices;
  bookings?: PlatformBookings;
  jobs?: PlatformJobs;
  courses?: PlatformCourses;
  referrals?: PlatformReferrals;
  createdAt?: Date;
  updatedAt?: Date;
}

// Dashboard Analytics Types
export type Timeframe = "1h" | "24h" | "7d" | "30d" | "90d" | "1y";
export type MetricType = "users" | "bookings" | "revenue" | "services" | "jobs" | "referrals";
export type Granularity = "hourly" | "daily" | "weekly" | "monthly";
export type ExportType = "overview" | "users" | "revenue" | "bookings";
export type ExportFormat = "json" | "csv";