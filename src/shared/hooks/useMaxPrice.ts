"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

export function useMaxPrice(initialMaxPrice: number = 10000): number {
  const [maxPrice, setMaxPrice] = useState<number>(initialMaxPrice);

  useEffect(() => {
    const fetchMaxPrice = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/marketplace/services?limit=1&sortBy=basePrice&sortOrder=desc`,
          createAuthFetchOptions()
        );
        if (response.ok) {
          const data = await response.json();
          const services = Array.isArray(data) ? data : (data.data || []);
          if (services.length > 0) {
            const service = services[0];
            const price = service.pricing?.basePrice || service.basePrice || service.price || 0;
            if (price > 0) {
              const calculatedMax = Math.ceil(price / 1000) * 1000;
              setMaxPrice(calculatedMax);
            }
          }
        }
      } catch (error) {
        logger.error("Error fetching max price", error instanceof Error ? error : new Error(String(error)));
      }
    };
    fetchMaxPrice();
  }, []);

  return maxPrice;
}

