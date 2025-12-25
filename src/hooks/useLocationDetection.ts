/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/shared/hooks/useLocationDetection' instead.
 */
export * from '@/shared/hooks/useLocationDetection';
import { useState, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api";
import { logger } from "@/lib/logger";

interface LocationCoordinates {
  lat: number;
  lng: number;
}

interface UseLocationDetectionReturn {
  location: string;
  locationCoordinates: LocationCoordinates | null;
  radius: number;
  detectingLocation: boolean;
  setLocation: (location: string) => void;
  setLocationCoordinates: (coordinates: LocationCoordinates | null) => void;
  setRadius: (radius: number) => void;
  handleDetectLocation: () => void;
  clearLocation: () => void;
}

export function useLocationDetection(): UseLocationDetectionReturn {
  const [location, setLocation] = useState<string>("");
  const [locationCoordinates, setLocationCoordinates] = useState<LocationCoordinates | null>(null);
  const [radius, setRadius] = useState<number>(5000);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      logger.warn("Geolocation is not supported by this browser");
      return;
    }

    setDetectingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setLocationCoordinates({ lat, lng });
        setLocation("");
        
        try {
          const { API_ENDPOINTS } = await import("@/lib/api");
          const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.mapsReverseGeocode}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ lat, lng }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.address) {
              setLocation(data.address);
            }
          }
        } catch (error) {
          logger.error("Error reverse geocoding", error instanceof Error ? error : new Error(String(error)));
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        logger.error("Error getting location", error instanceof Error ? error : new Error(String(error)));
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setLocationCoordinates(null);
    setLocation("");
  }, []);

  return {
    location,
    locationCoordinates,
    radius,
    detectingLocation,
    setLocation,
    setLocationCoordinates,
    setRadius,
    handleDetectLocation,
    clearLocation,
  };
}

