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
    const baseClasses =
      "w-full px-4 py-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
    
    // Default classes (can be overridden by className)
    const defaultColorClasses = "shadow-sm";
    
    const variantClasses = {
      default: "border-input hover:border-border focus-visible:border-ring",
      error: "border-destructive focus-visible:ring-destructive",
      success: "border-input focus-visible:border-ring"
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
            {required && <span className="text-destructive ml-1">*</span>}
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
          <p className="text-sm text-destructive">{error}</p>
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
