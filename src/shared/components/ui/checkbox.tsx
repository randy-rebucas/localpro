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
    const baseClasses =
      "w-4 h-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
    
    const variantClasses = {
      default: "",
      error: "border-destructive",
      success: ""
    };

    const checkboxClasses = cn(
      baseClasses,
      variantClasses[variant],
      className
    );

    return (
      <div className="space-y-1">
        <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input
            type="checkbox"
            className={checkboxClasses}
            ref={ref}
            {...props}
          />
          {label && <span>{label}</span>}
        </label>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
