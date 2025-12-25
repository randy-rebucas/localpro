"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

export function useMaxSalary(initialMaxSalary: number = 200000): number {
  const [maxSalary, setMaxSalary] = useState<number>(initialMaxSalary);

  useEffect(() => {
    const fetchMaxSalary = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.jobs}?limit=1&sortBy=salary&sortOrder=desc`,
          createAuthFetchOptions()
        );
        if (response.ok) {
          const data = await response.json();
          const jobs = Array.isArray(data) ? data : (data.data || data.jobs || []);
          if (jobs.length > 0) {
            const job = jobs[0];
            const salary = job.salary?.max || job.salary?.min || 0;
            if (salary > 0) {
              const calculatedMax = Math.ceil(salary / 10000) * 10000;
              setMaxSalary(calculatedMax);
            }
          }
        }
      } catch (error) {
        logger.error("Error fetching max salary", error instanceof Error ? error : new Error(String(error)));
      }
    };
    fetchMaxSalary();
  }, []);

  return maxSalary;
}

