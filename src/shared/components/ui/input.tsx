import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'error' | 'success';
  required?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, leftIcon, rightIcon, variant = 'default', required = false, ...props }, ref) => {
    // Base classes without bg/text colors to allow override via className
    const baseClasses = "w-full px-4 py-3 border rounded-lg focus:outline-none transition-all duration-200";
    
    // Default light theme classes (can be overridden by className)
    const defaultColorClasses = "bg-white placeholder-gray-500 shadow-sm";
    
    const variantClasses = {
      default: "border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500",
      error: "border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500",
      success: "border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
    };

    const inputClasses = cn(
      baseClasses,
      defaultColorClasses,
      variantClasses[variant],
      leftIcon && "pl-10",
      rightIcon && "pr-10",
      className
    );

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-inherit">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-current opacity-50 w-4 h-4">
                {leftIcon}
              </div>
            </div>
          )}
          <input
            type={type}
            className={inputClasses}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="text-current opacity-50 w-4 h-4">
                {rightIcon}
              </div>
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm opacity-60">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
