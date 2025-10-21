import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'error' | 'success';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, leftIcon, rightIcon, variant = 'default', ...props }, ref) => {
    const baseClasses = "w-full px-4 py-3 bg-white border rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none transition-all duration-200 shadow-sm";
    
    const variantClasses = {
      default: "border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500",
      error: "border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500",
      success: "border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
    };

    const inputClasses = cn(
      baseClasses,
      variantClasses[variant],
      leftIcon && "pl-10",
      rightIcon && "pr-10",
      className
    );

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-gray-400 w-4 h-4">
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
              <div className="text-gray-400 w-4 h-4">
                {rightIcon}
              </div>
            </div>
          )}
        </div>
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

Input.displayName = "Input";

export { Input };
