import React from 'react';
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
    
    const variants = {
      default: 'bg-gray-100 text-gray-800',
      secondary: 'bg-gray-100 text-gray-900',
      destructive: 'bg-red-100 text-red-800',
      outline: 'border border-gray-300 bg-transparent text-gray-900',
    };

    return (
      <div
        className={cn(baseClasses, variants[variant], className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };

