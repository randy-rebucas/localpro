"use client";

import React from "react";
import { 
  Shield, 
  Activity, 
  Megaphone, 
  Package, 
  ArrowRight, 
  RefreshCw,
  Plus,
  Search,
  Settings,
  HelpCircle
} from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline";
  };
  illustration?: "dashboard" | "services" | "activity" | "announcements" | "search" | "settings";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const getIllustration = (type: string) => {
  switch (type) {
    case "dashboard":
      return (
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl transform rotate-3"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl transform -rotate-3"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl transform rotate-1"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
        </div>
      );
    case "services":
      return (
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl transform rotate-3"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl transform -rotate-3"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-8 h-8 text-amber-600" />
          </div>
        </div>
      );
    case "activity":
      return (
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl transform rotate-3"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl transform -rotate-3"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      );
    case "announcements":
      return (
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl transform rotate-3"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl transform -rotate-3"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Megaphone className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      );
    case "search":
      return (
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl transform rotate-3"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl transform -rotate-3"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      );
    case "settings":
      return (
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl transform rotate-3"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl transform -rotate-3"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Settings className="w-8 h-8 text-slate-600" />
          </div>
        </div>
      );
    default:
      return (
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-gray-400" />
        </div>
      );
  }
};

const getSizeClasses = (size: string) => {
  switch (size) {
    case "sm":
      return "py-8";
    case "lg":
      return "py-16";
    default:
      return "py-12";
  }
};

const getButtonClasses = (variant: string) => {
  switch (variant) {
    case "primary":
      return "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500";
    case "outline":
      return "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500";
    default:
      return "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500";
  }
};

export default function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  illustration = "dashboard",
  size = "md",
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`text-center ${getSizeClasses(size)} ${className}`}>
      {/* Illustration */}
      {icon ? (
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          {icon}
        </div>
      ) : (
        getIllustration(illustration)
      )}

      {/* Content */}
      <div className="max-w-md mx-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-gray-600 mb-6 leading-relaxed">
          {description}
        </p>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {action && (
              <button
                onClick={action.onClick}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${getButtonClasses(action.variant || "primary")}`}
              >
                {action.label}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${getButtonClasses(secondaryAction.variant || "secondary")}`}
              >
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Specialized empty state components for common use cases
export function DashboardEmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      title="Welcome to LocalPro!"
      description="Your dashboard is ready to go. Start by exploring our services, checking your activity, or reading the latest announcements."
      illustration="dashboard"
      size="lg"
      action={{
        label: "Explore Services",
        onClick: () => window.location.href = "/marketplace",
        variant: "primary"
      }}
      secondaryAction={onRefresh ? {
        label: "Refresh Dashboard",
        onClick: onRefresh,
        variant: "outline"
      } : undefined}
    />
  );
}

export function ServicesEmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      title="No services available"
      description="We're working on bringing you amazing services. Check back soon or explore what's currently available."
      illustration="services"
      action={{
        label: "Browse Available Services",
        onClick: () => window.location.href = "/marketplace",
        variant: "primary"
      }}
      secondaryAction={onRefresh ? {
        label: "Refresh",
        onClick: onRefresh,
        variant: "outline"
      } : undefined}
    />
  );
}

export function ActivityEmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      title="No recent activity"
      description="Your activity feed will show your recent actions, updates, and important notifications here."
      illustration="activity"
      action={{
        label: "Start Exploring",
        onClick: () => window.location.href = "/marketplace",
        variant: "primary"
      }}
      secondaryAction={onRefresh ? {
        label: "Refresh Activity",
        onClick: onRefresh,
        variant: "outline"
      } : undefined}
    />
  );
}

export function AnnouncementsEmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      title="No announcements"
      description="When we have important updates, news, or new features to share, they'll appear here."
      illustration="announcements"
      action={{
        label: "Check Back Later",
        onClick: () => window.location.href = "/dashboard",
        variant: "primary"
      }}
      secondaryAction={onRefresh ? {
        label: "Refresh",
        onClick: onRefresh,
        variant: "outline"
      } : undefined}
    />
  );
}

export function SearchEmptyState({ 
  query, 
  onClearSearch 
}: { 
  query?: string; 
  onClearSearch?: () => void;
}) {
  return (
    <EmptyState
      title={query ? `No results for "${query}"` : "No search results"}
      description={query ? "Try adjusting your search terms or browse our available services." : "Start typing to search for services, jobs, or other content."}
      illustration="search"
      action={{
        label: "Browse All Services",
        onClick: () => window.location.href = "/marketplace",
        variant: "primary"
      }}
      secondaryAction={onClearSearch ? {
        label: "Clear Search",
        onClick: onClearSearch,
        variant: "outline"
      } : undefined}
    />
  );
}

export function SettingsEmptyState() {
  return (
    <EmptyState
      title="Settings & Preferences"
      description="Customize your LocalPro experience by adjusting your preferences, notifications, and account settings."
      illustration="settings"
      action={{
        label: "Go to Settings",
        onClick: () => window.location.href = "/settings",
        variant: "primary"
      }}
    />
  );
}