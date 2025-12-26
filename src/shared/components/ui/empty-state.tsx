import React from "react";
import Link from "next/link";
import { LucideIcon, BarChart3, Wrench, Activity, Megaphone, Search, Settings, RefreshCw } from "lucide-react";
import { logger } from "@/lib/logger";

interface EmptyStateAction {
  type: "link" | "button";
  href?: string;
  onClick?: () => void;
  label: string;
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
}

interface EmptyStateProps {
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  className?: string;
}

export function EmptyState({
  icon: Icon,
  iconColor = "text-muted-foreground",
  iconBgColor = "bg-muted",
  title,
  description,
  actions = [],
  className = ""
}: EmptyStateProps) {
  const getButtonStyles = (variant: "primary" | "secondary" | "outline" = "primary") => {
    const baseStyles = "px-6 py-2 rounded-lg transition-colors inline-flex items-center justify-center gap-2";
    
    switch (variant) {
      case "primary":
        return `${baseStyles} bg-primary text-primary-foreground hover:bg-primary/90`;
      case "secondary":
        return `${baseStyles} bg-secondary text-secondary-foreground hover:bg-secondary/80`;
      case "outline":
        return `${baseStyles} border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground`;
      default:
        return baseStyles;
    }
  };

  return (
    <div className={`p-8 text-center ${className}`}>
      <div className={`w-16 h-16 ${iconBgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
        <Icon className={`w-8 h-8 ${iconColor}`} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      
      {actions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {actions.map((action, index) => {
            const ActionIcon = action.icon;
            const content = (
              <>
                {ActionIcon && <ActionIcon className="w-4 h-4" />}
                {action.label}
              </>
            );

            if (action.type === "link" && action.href) {
              return (
                <Link
                  key={index}
                  href={action.href}
                  className={`${getButtonStyles(action.variant)} ${action.className || ""}`}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={index}
                onClick={action.onClick}
                className={`${getButtonStyles(action.variant)} ${action.className || ""}`}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Wrapper component for Card integration
interface EmptyStateCardProps extends EmptyStateProps {
  interactive?: boolean;
}

export function EmptyStateCard(props: EmptyStateCardProps) {
  const { ...emptyStateProps } = props;
  
  return (
    <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm" style={{ padding: 0 }}>
      <EmptyState {...emptyStateProps} />
    </div>
  );
}

// Specialized Empty State Components
interface SpecializedEmptyStateProps {
  onRefresh?: () => void;
  query?: string;
  onClearSearch?: () => void;
}

export function DashboardEmptyState({ onRefresh }: SpecializedEmptyStateProps) {
  return (
    <EmptyState
      icon={BarChart3}
      title="No Dashboard Data"
      description="Your dashboard is empty. Start by creating your first project or connecting your accounts."
      actions={[
        {
          type: "button" as const,
          label: "Get Started",
          onClick: () => logger.debug("Get started clicked"),
          variant: "primary" as const,
          icon: BarChart3
        },
        ...(onRefresh ? [{
          type: "button" as const,
          label: "Refresh",
          onClick: onRefresh,
          variant: "outline" as const,
          icon: RefreshCw
        }] : [])
      ]}
    />
  );
}

export function ServicesEmptyState({ onRefresh }: SpecializedEmptyStateProps) {
  return (
    <EmptyState
      icon={Wrench}
      title="No Services Available"
      description="There are no services available at the moment. Check back later or create your own service."
      actions={[
        {
          type: "link",
          href: "/marketplace/create-service",
          label: "Create Service",
          variant: "primary" as const,
          icon: Wrench
        },
        ...(onRefresh ? [{
          type: "button" as const,
          label: "Refresh",
          onClick: onRefresh,
          variant: "outline" as const,
          icon: RefreshCw
        }] : [])
      ]}
    />
  );
}

export function ActivityEmptyState({ onRefresh }: SpecializedEmptyStateProps) {
  return (
    <EmptyState
      icon={Activity}
      title="No Recent Activity"
      description="You haven't had any recent activity. Start using the platform to see your activity here."
      actions={[
        {
          type: "link",
          href: "/marketplace",
          label: "Go to Marketplace",
          variant: "primary" as const,
          icon: Activity
        },
        ...(onRefresh ? [{
          type: "button" as const,
          label: "Refresh",
          onClick: onRefresh,
          variant: "outline" as const,
          icon: RefreshCw
        }] : [])
      ]}
    />
  );
}

export function AnnouncementsEmptyState({ onRefresh }: SpecializedEmptyStateProps) {
  return (
    <EmptyState
      icon={Megaphone}
      title="No Announcements"
      description="There are no announcements at the moment. Check back later for updates."
      actions={[
        ...(onRefresh ? [{
          type: "button" as const,
          label: "Refresh",
          onClick: onRefresh,
          variant: "outline" as const,
          icon: RefreshCw
        }] : [])
      ]}
    />
  );
}

export function SearchEmptyState({ query, onClearSearch }: SpecializedEmptyStateProps) {
  return (
    <EmptyState
      icon={Search}
      title={query ? `No results for "${query}"` : "No Search Results"}
      description={query 
        ? "Try adjusting your search terms or filters to find what you're looking for."
        : "Enter a search term to find what you're looking for."
      }
      actions={[
        ...(onClearSearch ? [{
          type: "button" as const,
          label: "Clear Search",
          onClick: onClearSearch,
          variant: "outline" as const,
          icon: Search
        }] : [])
      ]}
    />
  );
}

export function SettingsEmptyState() {
  return (
    <EmptyState
      icon={Settings}
      title="Settings Coming Soon"
      description="Settings and preferences will be available in a future update."
      actions={[
        {
          type: "link",
          href: "/marketplace",
          label: "Back to Marketplace",
          variant: "primary" as const,
          icon: Settings
        }
      ]}
    />
  );
}

// Default export for backward compatibility
export default EmptyState;