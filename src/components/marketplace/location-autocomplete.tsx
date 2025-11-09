"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { MapPin, Loader2, X } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api";

interface LocationCoordinates {
  lat: number;
  lng: number;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (location: string) => void;
  onCoordinatesChange?: (coords: LocationCoordinates | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

interface PlacePrediction {
  placeId: string;
  description: string;
  structuredFormatting?: {
    mainText: string;
    secondaryText: string;
  };
}

interface PlaceDetails {
  placeId: string;
  formattedAddress?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  onCoordinatesChange,
  placeholder = "Search location...",
  className = "",
  disabled = false,
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const fetchPredictions = useCallback(async (input: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.mapsPlacesSearch}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: input,
            options: {
              types: 'address', // or 'establishment' for businesses
            }
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data?.predictions) {
        setPredictions(data.data.predictions);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } else {
        setPredictions([]);
        setShowSuggestions(false);
      }
    } catch (error: unknown) {
      // Ignore abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Error fetching predictions:', error);
      setPredictions([]);
      setShowSuggestions(false);
      // Only show error toast for non-abort errors
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error('Failed to fetch location suggestions. Please try again.', {
          duration: 3000,
          position: "top-right",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search with request cancellation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value.length > 2 && !disabled) {
        fetchPredictions(value);
      } else {
        setPredictions([]);
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [value, disabled, fetchPredictions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(async (prediction: PlacePrediction) => {
    setShowSuggestions(false);
    setPredictions([]);
    setSelectedIndex(-1);
    onChange(prediction.description);
    
    // Fetch full place details to get coordinates
    setIsLoadingDetails(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.mapsPlaceById}/${prediction.placeId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const placeDetails: PlaceDetails = data.data;
        const address = placeDetails.formattedAddress || prediction.description;
        
        onChange(address);
        
        // Extract coordinates if available
        if (placeDetails.geometry?.location) {
          const { lat, lng } = placeDetails.geometry.location;
          onCoordinatesChange?.({ lat, lng });
          
          toast.success("Location selected", {
            duration: 2000,
            position: "top-right",
          });
        } else {
          // If no coordinates, still update the address
          onCoordinatesChange?.(null);
          toast.success("Location selected", {
            duration: 2000,
            position: "top-right",
          });
        }
      } else {
        // Fallback: just use the prediction description
        onChange(prediction.description);
        onCoordinatesChange?.(null);
        toast.success("Location selected", {
          duration: 2000,
          position: "top-right",
        });
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      // Fallback: just use the prediction description
      onChange(prediction.description);
      onCoordinatesChange?.(null);
      toast.success("Location selected", {
        duration: 2000,
        position: "top-right",
      });
    } finally {
      setIsLoadingDetails(false);
    }
  }, [onChange, onCoordinatesChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Clear coordinates if input is cleared
    if (!newValue.trim()) {
      onCoordinatesChange?.(null);
      setPredictions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  }, [onChange, onCoordinatesChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || predictions.length === 0) {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, predictions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < predictions.length) {
          handleSelect(predictions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showSuggestions, predictions, selectedIndex, handleSelect]);

  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser. Please enter your location manually.");
      return;
    }

    setIsLoading(true);
    
    // Geolocation options with timeout
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds timeout
      maximumAge: 0, // Don't use cached position
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Try to reverse geocode using Google Maps API via backend
        try {
          const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.mapsReverseGeocode}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ 
                lat, 
                lng,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.formatted_address) {
              onChange(data.data.formatted_address);
              onCoordinatesChange?.({ lat, lng });
              toast.success("Location detected successfully", {
                duration: 2000,
                position: "top-right",
              });
            } else {
              // Fallback: just use coordinates
              onChange(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
              onCoordinatesChange?.({ lat, lng });
              toast.success("Location detected (coordinates only)", {
                duration: 2000,
                position: "top-right",
              });
            }
          } else {
            // Fallback: just use coordinates
            onChange(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            onCoordinatesChange?.({ lat, lng });
            toast.success("Location detected (coordinates only)", {
              duration: 2000,
              position: "top-right",
            });
          }
        } catch (error) {
          // Fallback: just use coordinates
          onChange(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          onCoordinatesChange?.({ lat, lng });
          toast.success("Location detected (coordinates only)", {
            duration: 2000,
            position: "top-right",
          });
          console.warn("Reverse geocoding failed, using coordinates:", error);
        } finally {
          setIsLoading(false);
        }
      },
      (error: GeolocationPositionError | Error | unknown) => {
        // Geolocation error codes (defined by the API)
        const PERMISSION_DENIED = 1;
        const POSITION_UNAVAILABLE = 2;
        const TIMEOUT = 3;
        
        // Safely extract error information using multiple methods
        let errorCode = 0;
        let errorMsg = "Unknown error";
        
        // Method 1: Direct property access (for GeolocationPositionError)
        try {
          if (error && typeof error === 'object') {
            // Try direct property access first
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const errorAny = error as any;
            if (typeof errorAny.code === 'number') {
              errorCode = errorAny.code;
            }
            if (typeof errorAny.message === 'string') {
              errorMsg = errorAny.message;
            }
          }
        } catch {
          // Ignore access errors
        }
        
        // Method 2: Try to infer from browser behavior
        // Many browsers don't provide detailed error objects for security reasons
        // Default to permission denied if we can't determine otherwise
        if (errorCode === 0) {
          // Check if error message contains clues
          const errorStr = String(error);
          const msgLower = errorMsg.toLowerCase();
          
          if (msgLower.includes('permission') || msgLower.includes('denied') || errorStr.includes('denied')) {
            errorCode = PERMISSION_DENIED;
          } else if (msgLower.includes('unavailable') || errorStr.includes('unavailable')) {
            errorCode = POSITION_UNAVAILABLE;
          } else if (msgLower.includes('timeout') || errorStr.includes('timeout')) {
            errorCode = TIMEOUT;
          } else {
            // Default assumption: likely permission denied (most common)
            // Browser may not expose error details for security
            errorCode = PERMISSION_DENIED;
          }
        }
        
        let errorMessage = "Unable to get your location. ";
        
        switch (errorCode) {
          case PERMISSION_DENIED:
            errorMessage += "Location access was denied. Please enable location permissions in your browser settings and try again.";
            break;
          case POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable. Please check your device settings and try again.";
            break;
          case TIMEOUT:
            errorMessage += "The request to get your location timed out. Please try again.";
            break;
          default:
            errorMessage += "Location access may be blocked. Please check your browser settings and try again.";
            break;
        }

        // Enhanced logging - try multiple serialization methods
        console.error("Geolocation error detected", {
          extractedCode: errorCode,
          extractedMessage: errorMsg,
          errorExists: error !== null && error !== undefined,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          hasCode: error && typeof error === 'object' && 'code' in error,
          hasMessage: error && typeof error === 'object' && 'message' in error,
          errorStringified: String(error),
          errorJSON: (() => {
            try {
              return JSON.stringify(error);
            } catch {
              return '[Could not stringify]';
            }
          })(),
        });

        toast.error(errorMessage, {
          duration: 5000,
          position: "top-right",
        });
        setIsLoading(false);
      },
      options
    );
  }, [onChange, onCoordinatesChange]);

  const handleClear = useCallback(() => {
    onChange("");
    onCoordinatesChange?.(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setPredictions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, [onChange, onCoordinatesChange]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          disabled={disabled || isLoading || isLoadingDetails}
          className={`w-full pl-11 pr-24 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-medium bg-white hover:border-gray-300 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed ${className}`}
          aria-label="Location search"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls="location-suggestions"
          role="combobox"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {(isLoading || isLoadingDetails) && (
            <div className="p-1">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          )}
          {value && !isLoading && !isLoadingDetails && (
            <button
              onClick={handleClear}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Clear location"
              type="button"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={handleDetectLocation}
            disabled={disabled || isLoading || isLoadingDetails}
            className="px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title="Detect current location"
            type="button"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              "📍 Detect"
            )}
          </button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && predictions.length > 0 && (
        <div
          ref={suggestionsRef}
          id="location-suggestions"
          className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {predictions.map((prediction, index) => (
            <div
              key={prediction.placeId}
              onClick={() => handleSelect(prediction)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                index === selectedIndex
                  ? 'bg-green-50 border-green-200'
                  : 'hover:bg-gray-50'
              }`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              {prediction.structuredFormatting ? (
                <div>
                  <div className="font-medium text-gray-900">
                    {prediction.structuredFormatting.mainText}
                  </div>
                  <div className="text-sm text-gray-500">
                    {prediction.structuredFormatting.secondaryText}
                  </div>
                </div>
              ) : (
                <div className="text-gray-900">{prediction.description}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
