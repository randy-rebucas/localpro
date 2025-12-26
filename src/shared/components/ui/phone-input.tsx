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
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isDetectingCountry ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          ) : leftIcon || <Phone className="w-5 h-5 text-muted-foreground" />}
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
            bg-background text-foreground placeholder:text-muted-foreground
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
            disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed
            transition-all duration-200
            ${error 
              ? 'border-destructive focus-visible:ring-destructive' 
              : 'border-input hover:border-border focus-visible:border-ring'
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
                className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-primary transition-colors"
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
        <div className="absolute z-10 mt-1 w-64 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg p-3">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-accent" />
            <div>
              <p className="text-sm font-medium text-foreground">{detectedCountry.name}</p>
              <p className="text-xs text-muted-foreground">
                Format: {detectedCountry.format}
              </p>
              <p className="text-xs text-muted-foreground">
                Example: {detectedCountry.example}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive flex items-center space-x-1">
          <span>⚠</span>
          <span>{error}</span>
        </p>
      )}
      
      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        {detectedCountry 
          ? `Enter your number without spaces - we'll format it for ${detectedCountry.name}`
          : "Enter your number without spaces - we'll automatically detect your country and format it"
        }
      </p>
    </div>
  );
};
