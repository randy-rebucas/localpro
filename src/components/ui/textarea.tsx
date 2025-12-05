import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'error' | 'success';
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, variant = 'default', ...props }, ref) => {
    const baseClasses = "w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none transition-all duration-200 resize-none";
    
    const variantClasses = {
      default: "border-slate-700 hover:border-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
      error: "border-red-500/50 focus:ring-2 focus:ring-red-500 focus:border-red-500",
      success: "border-emerald-500/50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
    };

    const textareaClasses = cn(
      baseClasses,
      variantClasses[variant],
      className
    );

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <textarea
          className={textareaClasses}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
