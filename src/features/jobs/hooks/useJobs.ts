"use client";

import useSWR from "swr";
import { API_ENDPOINTS } from "@/lib/api";
import { createSWRKey, swrFetcher } from "@/lib/swr-config";
import { Job, Application } from "@/types/jobs";

export interface JobsParams {
  category?: string;
  subcategory?: string;
  jobType?: string;
  experienceLevel?: string;
  location?: string;
  isRemote?: boolean;
  minSalary?: number;
  maxSalary?: number;
  company?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
  search?: string;
}

interface JobsResponse {
  success?: boolean;
  data?: Job[];
  jobs?: Job[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
    count: number;
  };
}

export function useJobs(params: JobsParams = {}) {
  const swrKey = createSWRKey(API_ENDPOINTS.jobs, {
    category: params.category,
    subcategory: params.subcategory,
    jobType: params.jobType,
    experienceLevel: params.experienceLevel,
    location: params.location,
    isRemote: params.isRemote,
    minSalary: params.minSalary,
    maxSalary: params.maxSalary,
    company: params.company,
    featured: params.featured,
    status: params.status,
    search: params.search,
    page: params.page || 1,
    limit: params.limit || 10,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  const { data, error, isLoading, isValidating, mutate } = useSWR<JobsResponse | Job[]>(
    swrKey,
    swrFetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  // Normalize response data
  let jobs: Job[] = [];
  let pagination: JobsResponse["pagination"] | null = null;

  if (data) {
    if (Array.isArray(data)) {
      jobs = data;
    } else if (data && typeof data === "object") {
      jobs = (data as JobsResponse).data || (data as JobsResponse).jobs || [];
      pagination = (data as JobsResponse).pagination || null;
    }
  }

  return {
    jobs,
    loading: isLoading,
    isValidating,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    pagination,
    refetch: mutate,
  };
}

export function useJob(id: string | null) {
  const swrKey = id ? API_ENDPOINTS.jobsById.replace("[id]", id) : null;

  const { data, error, isLoading, mutate } = useSWR<{ data?: Job; job?: Job } | Job>(
    swrKey,
    swrFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const job = data ? ((data as { data?: Job; job?: Job }).data || 
                      (data as { data?: Job; job?: Job }).job || 
                      (data as Job)) : null;

  return {
    job,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch: mutate,
  };
}

export function useMyApplications(params: { status?: string; page?: number; limit?: number } = {}) {
  const swrKey = createSWRKey(API_ENDPOINTS.jobsMyApplications, {
    status: params.status,
    page: params.page || 1,
    limit: params.limit || 10,
  });

  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    data?: Application[];
    applications?: Application[];
    pagination?: { current: number; pages: number; total: number; limit: number; count: number };
  }>(
    swrKey,
    swrFetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  const applications = data?.data || data?.applications || [];
  const pagination = data?.pagination || null;

  return {
    applications,
    loading: isLoading,
    isValidating,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    pagination,
    refetch: mutate,
  };
}

