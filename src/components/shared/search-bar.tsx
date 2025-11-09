"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  debounceMs?: number;
  showClearButton?: boolean;
  className?: string;
}

export function SearchBar({
  placeholder = "Search...",
  value: controlledValue,
  onChange,
  onSearch,
  debounceMs = 300,
  showClearButton = true,
  className = "",
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(controlledValue || "");
  const [debouncedValue, setDebouncedValue] = useState(controlledValue || "");

  // Update local value when controlled value changes
  useEffect(() => {
    if (controlledValue !== undefined) {
      setLocalValue(controlledValue);
      setDebouncedValue(controlledValue);
    }
  }, [controlledValue]);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs]);

  // Call onChange when debounced value changes
  useEffect(() => {
    if (onChange && debouncedValue !== controlledValue) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, controlledValue]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
  }, []);

  const handleClear = useCallback(() => {
    setLocalValue("");
    setDebouncedValue("");
    onChange?.("");
  }, [onChange]);

  const handleSearch = useCallback(() => {
    onSearch?.(localValue);
  }, [onSearch, localValue]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder={placeholder}
          value={localValue}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-10"
        />
        {showClearButton && localValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      {onSearch && (
        <Button
          onClick={handleSearch}
          className="mt-2 w-full md:w-auto md:mt-0 md:ml-2"
        >
          Search
        </Button>
      )}
    </div>
  );
}

