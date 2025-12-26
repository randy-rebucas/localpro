"use client";

import { Suspense, useMemo } from "react";
import ErrorBoundary from "@/components/error-boundary";
import { AnnouncementCard } from "@/components/announcement-card";
import { useActiveRoleView } from "@/shared/hooks/useActiveRoleView";
import { getRoleDisplayName } from "@/shared/lib/role-utils";
import { 
  Sparkles, 
  TrendingUp, 
  Lightbulb, 
  ArrowRight,
  Shield,
  Briefcase,
  GraduationCap,
  Package,
  Building,
  Users
} from "lucide-react";
import Link from "next/link";

function DashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="h-5 bg-gray-200 rounded w-20 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <div className="h-5 bg-gray-200 rounded w-24 mb-4 animate-pulse"></div>
          <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Role-specific welcome messages and tips
const roleWelcomeMessages: Record<string, { title: string; description: string; icon: React.ReactNode; tips: string[]; quickLinks: { label: string; href: string; icon: React.ReactNode }[] }> = {
  client: {
    title: "Welcome back!",
    description: "Discover services, book appointments, and explore what LocalPro has to offer.",
    icon: <Sparkles className="w-5 h-5 text-emerald-600" />,
    tips: [
      "Browse the marketplace to find services you need",
      "Save your favorite providers for quick access",
      "Check your bookings to stay on top of appointments"
    ],
    quickLinks: [
      { label: "Explore Marketplace", href: "/marketplace", icon: <Briefcase className="w-4 h-4" /> },
      { label: "My Bookings", href: "/marketplace/bookings", icon: <TrendingUp className="w-4 h-4" /> },
      { label: "Favorites", href: "/favorites", icon: <Sparkles className="w-4 h-4" /> }
    ]
  },
  provider: {
    title: "Provider Dashboard",
    description: "Manage your services, track bookings, and grow your business on LocalPro.",
    icon: <Briefcase className="w-5 h-5 text-primary" />,
    tips: [
      "Complete your profile to attract more clients",
      "Create and manage your service listings",
      "Track your bookings and revenue in the finance section"
    ],
    quickLinks: [
      { label: "My Services", href: "/marketplace/my-services", icon: <Briefcase className="w-4 h-4" /> },
      { label: "Bookings", href: "/marketplace/my-bookings", icon: <TrendingUp className="w-4 h-4" /> },
      { label: "Finance", href: "/finance", icon: <TrendingUp className="w-4 h-4" /> }
    ]
  },
  supplier: {
    title: "Supplier Dashboard",
    description: "Manage your inventory, track orders, and connect with buyers.",
    icon: <Package className="w-5 h-5 text-amber-600" />,
    tips: [
      "Keep your product catalog up to date",
      "Monitor orders and fulfill them promptly",
      "Use analytics to understand buyer trends"
    ],
    quickLinks: [
      { label: "My Supplies", href: "/supplies", icon: <Package className="w-4 h-4" /> },
      { label: "Orders", href: "/supplies/orders", icon: <TrendingUp className="w-4 h-4" /> },
      { label: "Finance", href: "/finance", icon: <TrendingUp className="w-4 h-4" /> }
    ]
  },
  instructor: {
    title: "Instructor Dashboard",
    description: "Manage your courses, track enrollments, and help students learn.",
    icon: <GraduationCap className="w-5 h-5 text-accent" />,
    tips: [
      "Create engaging course content",
      "Track student progress and engagement",
      "Use analytics to improve your courses"
    ],
    quickLinks: [
      { label: "My Courses", href: "/academy/my-courses", icon: <GraduationCap className="w-4 h-4" /> },
      { label: "Enrollments", href: "/academy/enrollments", icon: <Users className="w-4 h-4" /> },
      { label: "Finance", href: "/finance", icon: <TrendingUp className="w-4 h-4" /> }
    ]
  },
  agency_owner: {
    title: "Agency Dashboard",
    description: "Manage your agency, providers, and grow your business network.",
    icon: <Building className="w-5 h-5 text-purple-600" />,
    tips: [
      "Manage your agency profile and settings",
      "Oversee providers and their performance",
      "Track agency-wide analytics and revenue"
    ],
    quickLinks: [
      { label: "Agency Management", href: "/agencies", icon: <Building className="w-4 h-4" /> },
      { label: "Providers", href: "/agencies/providers", icon: <Users className="w-4 h-4" /> },
      { label: "Analytics", href: "/analytics", icon: <TrendingUp className="w-4 h-4" /> }
    ]
  },
  agency_admin: {
    title: "Agency Admin Dashboard",
    description: "Help manage your agency's operations and support providers.",
    icon: <Users className="w-5 h-5 text-blue-600" />,
    tips: [
      "Assist with provider management",
      "Monitor agency activities",
      "Support day-to-day operations"
    ],
    quickLinks: [
      { label: "Agency Dashboard", href: "/agencies", icon: <Building className="w-4 h-4" /> },
      { label: "Providers", href: "/agencies/providers", icon: <Users className="w-4 h-4" /> },
      { label: "Bookings", href: "/marketplace/my-bookings", icon: <TrendingUp className="w-4 h-4" /> }
    ]
  },
  admin: {
    title: "Admin Dashboard",
    description: "Manage the platform, users, and system-wide settings.",
    icon: <Shield className="w-5 h-5 text-red-600" />,
    tips: [
      "Monitor platform health and performance",
      "Manage users and permissions",
      "Configure system settings and features"
    ],
    quickLinks: [
      { label: "User Management", href: "/admin/users", icon: <Users className="w-4 h-4" /> },
      { label: "Analytics", href: "/analytics", icon: <TrendingUp className="w-4 h-4" /> },
      { label: "Settings", href: "/admin/settings", icon: <Shield className="w-4 h-4" /> }
    ]
  }
};

function DashboardWelcomeCard() {
  const { roleView, userRoles } = useActiveRoleView();

  const roleInfo = useMemo(() => {
    const defaultInfo = roleWelcomeMessages.client;
    return roleWelcomeMessages[roleView] || defaultInfo;
  }, [roleView]);

  const activeRoleLabel = useMemo(() => {
    try {
      return getRoleDisplayName(roleView as never);
    } catch {
      return roleView || "Client";
    }
  }, [roleView]);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              {roleInfo.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold text-gray-900">{roleInfo.title}</h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-700">
                  <Shield className="w-3 h-3 text-gray-500" />
                  {activeRoleLabel}
                </span>
              </div>
              <p className="text-sm text-gray-600">{roleInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        {roleInfo.quickLinks.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {roleInfo.quickLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                {link.icon}
                {link.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        )}

        {/* Tips */}
        {roleInfo.tips.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-start gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5" />
              <h3 className="text-sm font-medium text-gray-900">Quick Tips</h3>
            </div>
            <ul className="space-y-1.5">
              {roleInfo.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-emerald-600 mt-1">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<DashboardLoading />}>
        <div className="space-y-6">
          {/* Role-aware welcome card */}
          <DashboardWelcomeCard />
          
          {/* Announcements */}
          <AnnouncementCard />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
