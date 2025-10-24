import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  titleSize?: "sm" | "md" | "lg";
  actions?: {
    type: "link" | "button";
    href?: string;
    onClick?: () => void;
    label: string;
    icon?: LucideIcon;
    variant?: "primary" | "secondary" | "outline";
    className?: string;
  }[];
  className?: string;
}

export function PageHeader({ 
  title, 
  subtitle, 
  titleSize = "md",
  actions = [],
  className = ""
}: PageHeaderProps) {
  const titleSizes = {
    sm: "text-xl",
    md: "text-2xl", 
    lg: "text-3xl"
  };

  const getButtonStyles = (variant: "primary" | "secondary" | "outline" = "primary") => {
    const baseStyles = "px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2";
    
    switch (variant) {
      case "primary":
        return `${baseStyles} bg-green-600 text-white hover:bg-green-700`;
      case "secondary":
        return `${baseStyles} bg-gray-100 text-gray-700 hover:bg-gray-200`;
      case "outline":
        return `${baseStyles} border border-gray-300 text-gray-700 hover:bg-gray-50`;
      default:
        return baseStyles;
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div>
        <h1 className={`${titleSizes[titleSize]} font-bold text-gray-700`}>
          {title}
        </h1>
        <p className="text-gray-600 mt-1">{subtitle}</p>
      </div>
      
      {actions.length > 0 && (
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            const content = (
              <>
                {Icon && <Icon className="w-4 h-4" />}
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
