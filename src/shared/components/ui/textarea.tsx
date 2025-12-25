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
    const baseClasses = "w-full px-4 py-3 bg-white border rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none transition-all duration-200 shadow-sm resize-none";
    
    const variantClasses = {
      default: "border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500",
      error: "border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500",
      success: "border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
    };

    const textareaClasses = cn(
      baseClasses,
      variantClasses[variant],
      className
    );

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <textarea
          className={textareaClasses}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
