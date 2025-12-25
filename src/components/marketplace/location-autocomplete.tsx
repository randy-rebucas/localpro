"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { MapPin, Loader2, X } from "lucide-react";
import { CLIENT_CONFIG } from "@/lib/env";

// Google Maps types
declare global {
  interface Window {
    google?: unknown;
    initGoogleMaps?: () => void;
  }
}

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

type GooglePlacesPredictionRaw = {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
};

type GooglePlacesDetailsRaw = {
  formatted_address?: string;
  geometry?: {
    location?: {
      lat: () => number;
      lng: () => number;
    };
  };
  name?: string;
};

type GoogleGeocodeResultRaw = {
  formatted_address: string;
};

type AutocompleteServiceInstance = {
  getPlacePredictions: (
    request: { input: string; types?: string[] },
    callback: (predictions: GooglePlacesPredictionRaw[] | null, status: string) => void
  ) => void;
};

type PlacesServiceInstance = {
  getDetails: (
    request: { placeId: string; fields?: string[] },
    callback: (place: GooglePlacesDetailsRaw | null, status: string) => void
  ) => void;
};

type GeocoderInstance = {
  geocode: (
    request: { location: { lat: number; lng: number } },
    callback: (results: GoogleGeocodeResultRaw[] | null, status: string) => void
  ) => void;
};

type GoogleMapsLike = {
  maps: {
    places: {
      AutocompleteService: new () => AutocompleteServiceInstance;
      PlacesService: new (el: HTMLElement) => PlacesServiceInstance;
      PlacesServiceStatus: { OK: string };
    };
    Geocoder: new () => GeocoderInstance;
    GeocoderStatus: { OK: string };
  };
};

function getGoogleMaps(): GoogleMapsLike | null {
  if (typeof window === "undefined") return null;
  const g = window.google;
  if (!g || typeof g !== "object") return null;
  const maps = (g as { maps?: unknown }).maps;
  if (!maps || typeof maps !== "object") return null;
  const places = (maps as { places?: unknown }).places;
  if (!places || typeof places !== "object") return null;
  return g as GoogleMapsLike;
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
  const placesServiceRef = useRef<AutocompleteServiceInstance | null>(null);
  const geocoderRef = useRef<GeocoderInstance | null>(null);
  
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    if (typeof window === 'undefined' || getGoogleMaps()?.maps?.places) {
      setIsGoogleMapsLoaded(true);
      return;
    }

    const apiKey = CLIENT_CONFIG.googleMapsApiKey;
    if (!apiKey) {
      console.warn('Google Maps API key not found. Autocomplete will not work.');
      return;
    }

    // Check if script is already loading
    if (document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (getGoogleMaps()?.maps?.places) {
          setIsGoogleMapsLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    window.initGoogleMaps = () => {
      setIsGoogleMapsLoaded(true);
    };

    script.onerror = () => {
      console.error('Failed to load Google Maps script');
      toast.error('Failed to load location services. Please refresh the page.', {
        duration: 5000,
        position: "top-right",
      });
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (window.initGoogleMaps) delete window.initGoogleMaps;
    };
  }, []);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const google = getGoogleMaps();
    if (!isGoogleMapsLoaded || !inputRef.current || disabled || !google?.maps?.places) {
      return;
    }

    try {
      // Initialize AutocompleteService for suggestions
      if (!placesServiceRef.current) {
        placesServiceRef.current = new google.maps.places.AutocompleteService();
      }

      // Initialize Geocoder for getting coordinates
      if (!geocoderRef.current) {
        geocoderRef.current = new google.maps.Geocoder();
      }
    } catch (error) {
      console.error('Error initializing Google Maps services:', error);
    }
  }, [isGoogleMapsLoaded, disabled]);

  const fetchPredictions = useCallback(async (input: string) => {
    if (!isGoogleMapsLoaded || !placesServiceRef.current || !input.trim()) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    try {
      placesServiceRef.current.getPlacePredictions(
        {
          input: input,
          types: ['address'], // Restrict to addresses
        },
        (rawPredictions: GooglePlacesPredictionRaw[] | null, status: string) => {
          setIsLoading(false);
          
          const google = getGoogleMaps();
          if (google && status === google.maps.places.PlacesServiceStatus.OK && rawPredictions) {
            const formattedPredictions: PlacePrediction[] = rawPredictions.map((pred) => ({
              placeId: pred.place_id,
              description: pred.description,
              structuredFormatting: pred.structured_formatting ? {
                mainText: pred.structured_formatting.main_text,
                secondaryText: pred.structured_formatting.secondary_text,
              } : undefined,
            }));
            
            setPredictions(formattedPredictions);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          } else {
            setPredictions([]);
            setShowSuggestions(false);
          }
        }
      );
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setIsLoading(false);
      setPredictions([]);
      setShowSuggestions(false);
    }
  }, [isGoogleMapsLoaded]);

  // Debounced search with request cancellation - improved autosuggest
  useEffect(() => {
    const timer = setTimeout(() => {
      // Trigger autosuggest after 2 characters (reduced from 3 for better UX)
      if (value.trim().length >= 2 && !disabled) {
        fetchPredictions(value.trim());
      } else {
        setPredictions([]);
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, 250); // Reduced debounce time for more responsive autosuggest

    return () => {
      clearTimeout(timer);
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
    
    // Fetch full place details to get coordinates using Google Places API
    setIsLoadingDetails(true);
    try {
      const google = getGoogleMaps();
      if (!isGoogleMapsLoaded || !google?.maps?.places) {
        onCoordinatesChange?.(null);
        setIsLoadingDetails(false);
        return;
      }

      const placesService = new google.maps.places.PlacesService(
        document.createElement('div')
      );

      placesService.getDetails(
        {
          placeId: prediction.placeId,
          fields: ['formatted_address', 'geometry', 'name'],
        },
        (place: GooglePlacesDetailsRaw | null, status: string) => {
          setIsLoadingDetails(false);
          
          const googleNow = getGoogleMaps();
          if (googleNow && status === googleNow.maps.places.PlacesServiceStatus.OK && place) {
            const address = place.formatted_address || prediction.description;
            onChange(address);
            
            // Extract coordinates if available
            if (place.geometry?.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
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
        }
      );
    } catch (error) {
      console.error('Error fetching place details:', error);
      setIsLoadingDetails(false);
      // Fallback: just use the prediction description
      onChange(prediction.description);
      onCoordinatesChange?.(null);
      toast.success("Location selected", {
        duration: 2000,
        position: "top-right",
      });
    }
  }, [onChange, onCoordinatesChange, isGoogleMapsLoaded]);

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
    
    // Show a helpful message while waiting
    toast.loading("Detecting your location... This may take a few seconds.", {
      id: 'location-detection',
      duration: 15000,
      position: "top-right",
    });
    
    // Geolocation options optimized for faster response
    const options: PositionOptions = {
      enableHighAccuracy: false, // Use less accurate but faster GPS/WiFi positioning
      timeout: 20000, // 20 seconds timeout (increased for slower devices)
      maximumAge: 300000, // Accept cached position up to 5 minutes old (faster)
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Try to reverse geocode using Google Maps Geocoder directly
        try {
          const google = getGoogleMaps();
          if (isGoogleMapsLoaded && geocoderRef.current && google) {
            geocoderRef.current.geocode(
              { location: { lat, lng } },
              (results: GoogleGeocodeResultRaw[] | null, status: string) => {
                setIsLoading(false);
                
                if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                  onChange(results[0].formatted_address);
                  onCoordinatesChange?.({ lat, lng });
                  toast.dismiss('location-detection');
                  toast.success("Location detected successfully", {
                    duration: 2000,
                    position: "top-right",
                  });
                } else {
                  // Fallback: just use coordinates
                  onChange(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                  onCoordinatesChange?.({ lat, lng });
                  toast.dismiss('location-detection');
                  toast.success("Location detected (coordinates only)", {
                    duration: 2000,
                    position: "top-right",
                  });
                }
              }
            );
          } else {
            // Fallback: just use coordinates
            setIsLoading(false);
            onChange(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            onCoordinatesChange?.({ lat, lng });
            toast.dismiss('location-detection');
            toast.success("Location detected (coordinates only)", {
              duration: 2000,
              position: "top-right",
            });
          }
        } catch (error) {
          // Fallback: just use coordinates
          setIsLoading(false);
          onChange(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          onCoordinatesChange?.({ lat, lng });
          toast.dismiss('location-detection');
          toast.success("Location detected (coordinates only)", {
            duration: 2000,
            position: "top-right",
          });
          console.warn("Reverse geocoding failed, using coordinates:", error);
        }
      },
      (error: GeolocationPositionError | Error | unknown) => {
        setIsLoading(false);
        
        // Geolocation error codes (defined by the API)
        const PERMISSION_DENIED = 1;
        const POSITION_UNAVAILABLE = 2;
        const TIMEOUT = 3;
        
        // Safely extract error code
        let errorCode = 0;
        
        try {
          // Try to get error code from GeolocationPositionError
          if (error && typeof error === 'object' && 'code' in error) {
            const code = (error as { code?: unknown }).code;
            if (typeof code === 'number') {
              errorCode = code;
            }
          }
        } catch {
          // Ignore access errors
        }
        
        // Determine error message based on code
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
            // Default to permission denied (most common case)
            errorMessage += "Location access may be blocked. Please enable location permissions in your browser settings and try again.";
            break;
        }

        // Log error only in development or if it's not a permission error
        if (process.env.NODE_ENV === 'development' && errorCode !== PERMISSION_DENIED) {
          console.warn("Geolocation error:", {
            code: errorCode,
            error: error instanceof Error ? error.message : String(error),
          });
        }

        toast.dismiss('location-detection');
        toast.error(errorMessage, {
          duration: 5000,
          position: "top-right",
        });
      },
      options
    );
  }, [onChange, onCoordinatesChange, isGoogleMapsLoaded]);

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
            // Show suggestions when input is focused if we have predictions or if user has typed something
            if (predictions.length > 0 || (value.trim().length >= 2 && !isLoading)) {
              setShowSuggestions(true);
              // If we have value but no predictions yet, trigger search
              if (value.trim().length >= 2 && predictions.length === 0 && !isLoading) {
                fetchPredictions(value.trim());
              }
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
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          id="location-suggestions"
          className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {isLoading && predictions.length === 0 ? (
            <div className="px-4 py-3 text-center text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
              Searching locations...
            </div>
          ) : predictions.length > 0 ? (
            predictions.map((prediction: PlacePrediction, index: number) => (
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
            ))
          ) : value.trim().length >= 2 ? (
            <div className="px-4 py-3 text-center text-sm text-gray-500">
              No locations found. Try a different search term.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
