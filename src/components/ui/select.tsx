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
    const baseClasses = "w-full px-4 py-3 pr-10 bg-slate-800 border rounded-lg text-white focus:outline-none transition-all duration-200 appearance-none bg-no-repeat bg-right bg-[length:16px]";
    
    const variantClasses = {
      default: "border-slate-700 hover:border-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500",
      error: "border-red-500/50 focus:ring-2 focus:ring-red-500 focus:border-red-500",
      success: "border-emerald-500/50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
          <label className="block text-sm font-medium text-slate-300">
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
              <option value="" disabled className="bg-slate-800 text-slate-400">
                {placeholder}
              </option>
            )}
            {options ? (
              options.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                  className="bg-slate-800 text-white"
                >
                  {option.label}
                </option>
              ))
            ) : (
              children
            )}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </div>
        </div>
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

Select.displayName = "Select";

export { Select };
