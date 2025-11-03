"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import toast from "react-hot-toast";
import { MapPin, Loader2, X } from "lucide-react";
import { CLIENT_CONFIG } from "@/lib/env";
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

// Google Maps event listener type
type GoogleMapsEventListener = unknown;

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete?: new (input: HTMLInputElement, options?: {
            types?: string[];
            fields?: string[];
          }) => {
            getPlace: () => google.maps.places.PlaceResult;
            addListener: (event: string, callback: () => void) => GoogleMapsEventListener;
          };
          PlacesServiceStatus?: {
            OK: string;
          };
        };
        event?: {
          removeListener?: (listener: GoogleMapsEventListener) => void;
        };
      };
    };
  }
  
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace google {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace maps {
      // eslint-disable-next-line @typescript-eslint/no-namespace
      namespace places {
        interface PlaceResult {
          geometry?: {
            location?: {
              lat: () => number;
              lng: () => number;
            };
          };
          formatted_address?: string;
          name?: string;
          place_id?: string;
        }
      }
    }
  }
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
  // Google Maps Autocomplete instance - using any due to complex Google Maps types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const autocompleteRef = useRef<any>(null);
  // Store listener for cleanup
  const placeChangedListenerRef = useRef<GoogleMapsEventListener | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const apiKey = CLIENT_CONFIG.googleMapsApiKey;
  const scriptUrl = apiKey 
    ? `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`
    : null;

  // Handle script load
  const handleScriptLoad = useCallback(() => {
    // Double-check that the API is actually available
    if (window.google && window.google.maps && window.google.maps.places && window.google.maps.places.Autocomplete) {
      setIsScriptLoaded(true);
      setIsLoading(false);
    } else {
      console.warn("Google Maps script loaded but API not available");
      setIsLoading(false);
    }
  }, []);

  const handleScriptError = useCallback(() => {
    console.error("Failed to load Google Maps script", {
      apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'missing',
      url: scriptUrl,
    });
    
    // Provide helpful error message
    const errorMessage = apiKey 
      ? "Unable to load Google Maps. Please check your internet connection and API key configuration. Ensure your API key has the Maps JavaScript API and Places API enabled."
      : "Google Maps API key is missing. Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.";
    
    toast.error(errorMessage, {
      duration: 6000,
      position: "top-right",
    });
    setIsLoading(false);
  }, [apiKey, scriptUrl]);

  // Check if script is already loaded on mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.google && window.google.maps && window.google.maps.places && window.google.maps.places.Autocomplete) {
      setIsScriptLoaded(true);
    }
    
    // Warn if API key is missing
    if (!apiKey) {
      console.warn("Google Maps API key not found. Location autocomplete will be limited. Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.");
    }
  }, [apiKey]);

  // Initialize autocomplete
  useEffect(() => {
    if (!isScriptLoaded || !inputRef.current || disabled) {
      return;
    }

    if (!window.google || !window.google.maps || !window.google.maps.places || !window.google.maps.places.Autocomplete) {
      return;
    }

    // Cleanup previous autocomplete instance if it exists
    if (autocompleteRef.current && placeChangedListenerRef.current && window.google?.maps?.event?.removeListener) {
      window.google.maps.event.removeListener(placeChangedListenerRef.current);
    }

    try {
      const AutocompleteClass = window.google.maps.places.Autocomplete;
      const autocomplete = new AutocompleteClass(inputRef.current, {
        types: ["geocode"], // Use geocode for addresses, or use ["(regions)"] for regions only - they cannot be mixed
        fields: ["geometry", "formatted_address", "place_id", "name"],
      });

      const placeChangedListener = autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const address = place.formatted_address || place.name || value;
          
          onChange(address);
          onCoordinatesChange?.({ lat, lng });
          
          // Show success toast
          toast.success("Location selected", {
            duration: 2000,
            position: "top-right",
          });
        } else if (place.name) {
          // If we have a name but no geometry, just update the address
          onChange(place.name);
        }
      });

      autocompleteRef.current = autocomplete;
      placeChangedListenerRef.current = placeChangedListener;

      // Cleanup function
      return () => {
        if (placeChangedListenerRef.current && window.google?.maps?.event?.removeListener) {
          window.google.maps.event.removeListener(placeChangedListenerRef.current);
          placeChangedListenerRef.current = null;
        }
      };
    } catch (error) {
      console.error("Error initializing autocomplete:", error);
      toast.error("Failed to initialize location autocomplete", {
        duration: 4000,
        position: "top-right",
      });
    }
  }, [isScriptLoaded, disabled, onChange, onCoordinatesChange, value]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Clear coordinates if input is cleared
    if (!newValue.trim()) {
      onCoordinatesChange?.(null);
    }
  }, [onChange, onCoordinatesChange]);

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
        // According to API docs, this endpoint expects POST
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
                // Optional: include additional parameters for better results
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
  }, [onChange, onCoordinatesChange]);

  return (
    <div className={`relative ${className}`}>
      {/* Load Google Maps script using Next.js Script component */}
      {scriptUrl && (
        <Script
          src={scriptUrl}
          strategy="lazyOnload"
          onLoad={handleScriptLoad}
          onError={handleScriptError}
        />
      )}
      
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          disabled={disabled || isLoading}
          className={`w-full pl-11 pr-24 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-medium bg-white hover:border-gray-300 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed ${className}`}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              onClick={handleClear}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Clear location"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={handleDetectLocation}
            disabled={disabled || isLoading}
            className="px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title="Detect current location"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              "📍 Detect"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

