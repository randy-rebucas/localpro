import React from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'error' | 'success';
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, helperText, variant = 'default', ...props }, ref) => {
    const baseClasses = "w-4 h-4 rounded border text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-0";
    
    const variantClasses = {
      default: "border-gray-300",
      error: "border-red-300 focus:ring-red-500",
      success: "border-green-300 focus:ring-green-500"
    };

    const checkboxClasses = cn(
      baseClasses,
      variantClasses[variant],
      className
    );

    return (
      <div className="space-y-1">
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            className={checkboxClasses}
            ref={ref}
            {...props}
          />
          {label && <span>{label}</span>}
        </label>
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

Checkbox.displayName = "Checkbox";

export { Checkbox };
