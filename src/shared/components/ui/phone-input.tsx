"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Phone, Globe, Loader2 } from 'lucide-react';
import { phoneFormatter, CountryInfo } from '@/lib/phone-formatter';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  autoComplete?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  disabled = false,
  className = '',
  label = 'Phone Number',
  leftIcon,
  autoComplete = 'tel',
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isDetectingCountry, setIsDetectingCountry] = useState(true);
  const [detectedCountry, setDetectedCountry] = useState<CountryInfo | null>(null);
  const [showCountryInfo, setShowCountryInfo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize country detection and display value
  useEffect(() => {
    const initializeFormatter = async () => {
      setIsDetectingCountry(true);
      
      // Wait a bit for the formatter to detect country
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const country = phoneFormatter.getUserCountry();
      setDetectedCountry(country);
      setIsDetectingCountry(false);
      
      // Set initial display value
      if (value) {
        const formatted = phoneFormatter.getFormattedDisplay(value);
        setDisplayValue(formatted);
      } else {
        setDisplayValue('');
      }
    };

    initializeFormatter();
  }, [value]);

  // Update display value when value prop changes
  useEffect(() => {
    if (value) {
      const formatted = phoneFormatter.getFormattedDisplay(value);
      setDisplayValue(formatted);
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Remove spaces and invalid characters in real-time
    const sanitizedValue = inputValue.replace(/[\s\-\(\)]/g, '');
    
    // Allow user to type freely but sanitize the display
    setDisplayValue(sanitizedValue);
    
    // Format the phone number (this will ensure no spaces in stored value)
    const formatted = phoneFormatter.formatPhoneNumber(sanitizedValue);
    onChange(formatted);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow backspace, delete, arrow keys, etc.
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
      return;
    }
    
    // Prevent spaces from being entered
    if (e.key === ' ') {
      e.preventDefault();
      return;
    }
    
    // Allow digits, +, -, (, ) but not spaces
    if (!/[\d\+\-\(\)]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

  const handleFocus = () => {
    // If input is empty, show placeholder with country code (no space)
    if (!displayValue && detectedCountry) {
      setDisplayValue(detectedCountry.dialCode);
    }
  };

  const handleBlur = () => {
    // Format the final value
    if (displayValue) {
      const formatted = phoneFormatter.formatPhoneNumber(displayValue);
      const displayFormatted = phoneFormatter.getFormattedDisplay(formatted);
      setDisplayValue(displayFormatted);
      onChange(formatted);
    }
    
    if (onBlur) {
      onBlur();
    }
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    if (detectedCountry) return detectedCountry.example;
    return '+1 (555) 123-4567';
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isDetectingCountry ? (
            <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
          ) : leftIcon || <Phone className="w-5 h-5 text-slate-500" />}
        </div>
        
        <input
          ref={inputRef}
          type="tel"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={getPlaceholder()}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`
            block w-full pl-10 pr-10 py-3 border rounded-xl text-lg
            bg-slate-800 !text-white placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
            disabled:bg-slate-900 disabled:text-slate-500 disabled:cursor-not-allowed
            transition-all duration-200
            ${error 
              ? 'border-red-500/50 focus:ring-red-500' 
              : 'border-slate-700 focus:border-emerald-500'
            }
            ${className}
          `}
        />
        
        {/* Country detection indicator */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {detectedCountry && (
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setShowCountryInfo(!showCountryInfo)}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
                title={`Detected: ${detectedCountry.name}`}
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{detectedCountry.code}</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Country info tooltip */}
      {showCountryInfo && detectedCountry && (
        <div className="absolute z-10 mt-1 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-3">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-white">{detectedCountry.name}</p>
              <p className="text-xs text-slate-400">
                Format: {detectedCountry.format}
              </p>
              <p className="text-xs text-slate-400">
                Example: {detectedCountry.example}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <p className="text-sm text-red-400 flex items-center space-x-1">
          <span>⚠</span>
          <span>{error}</span>
        </p>
      )}
      
      {/* Helper text */}
      <p className="text-xs text-slate-500">
        {detectedCountry 
          ? `Enter your number without spaces - we'll format it for ${detectedCountry.name}`
          : "Enter your number without spaces - we'll automatically detect your country and format it"
        }
      </p>
    </div>
  );
};
