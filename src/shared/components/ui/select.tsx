import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'error' | 'success';
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  onValueChange?: (value: string) => void;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, variant = 'default', options, placeholder, children, onValueChange, onChange, ...props }, ref) => {
    const baseClasses =
      "w-full px-4 py-3 pr-10 bg-background border border-input rounded-lg text-foreground shadow-sm transition-all duration-200 appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
    
    const variantClasses = {
      default: "hover:border-border focus-visible:border-ring",
      error: "border-destructive focus-visible:ring-destructive",
      success: "hover:border-border focus-visible:border-ring"
    };

    const selectClasses = cn(
      baseClasses,
      variantClasses[variant],
      className
    );

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      // Call onValueChange if provided
      if (onValueChange) {
        onValueChange(e.target.value);
      }
      // Call onChange from props (from react-hook-form register)
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={selectClasses}
            ref={ref}
            onChange={handleChange}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options ? (
              options.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))
            ) : (
              children
            )}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
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

Select.displayName = "Select";

export { Select };
