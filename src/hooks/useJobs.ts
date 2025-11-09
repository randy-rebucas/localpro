"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<JobsResponse["pagination"] | null>(null);
  const mountedRef = useRef(true);

  const fetchJobs = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.category) queryParams.append("category", params.category);
      if (params.subcategory) queryParams.append("subcategory", params.subcategory);
      if (params.jobType) queryParams.append("jobType", params.jobType);
      if (params.experienceLevel) queryParams.append("experienceLevel", params.experienceLevel);
      if (params.location) queryParams.append("location", params.location);
      if (params.isRemote !== undefined) queryParams.append("isRemote", params.isRemote.toString());
      if (params.minSalary !== undefined) queryParams.append("minSalary", params.minSalary.toString());
      if (params.maxSalary !== undefined) queryParams.append("maxSalary", params.maxSalary.toString());
      if (params.status) queryParams.append("status", params.status);
      if (params.search) queryParams.append("search", params.search);
      
      const page = params.page || 1;
      const limit = params.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      const url = `${API_BASE_URL}${API_ENDPOINTS.jobs}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }

      const data: JobsResponse | Job[] = await response.json();
      let jobsData: Job[] = [];
      let paginationData = null;

      if (Array.isArray(data)) {
        jobsData = data;
      } else if (data && typeof data === "object") {
        jobsData = (data as JobsResponse).data || (data as JobsResponse).jobs || [];
        paginationData = (data as JobsResponse).pagination || null;
      }

      if (mountedRef.current) {
        setJobs(jobsData);
        setPagination(paginationData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching jobs", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setJobs([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchJobs();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    error,
    pagination,
    refetch: fetchJobs,
  };
}

export function useJob(id: string | null) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchJob = useCallback(async () => {
    if (!id || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.jobsById.replace("[id]", id)}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch job: ${response.status}`);
      }

      const data = await response.json();
      const jobData = data?.data || data?.job || data;

      if (mountedRef.current) {
        setJob(jobData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching job", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setJob(null);
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    fetchJob();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchJob]);

  return {
    job,
    loading,
    error,
    refetch: fetchJob,
  };
}

export function useMyApplications(params: { status?: string; page?: number; limit?: number } = {}) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{ current: number; pages: number; total: number; limit: number; count: number } | null>(null);
  const mountedRef = useRef(true);

  const fetchApplications = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append("status", params.status);
      const page = params.page || 1;
      const limit = params.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      const url = `${API_BASE_URL}${API_ENDPOINTS.jobsMyApplications}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch applications: ${response.status}`);
      }

      const data = await response.json();
      const applicationsData = data?.data || data?.applications || [];
      const paginationData = data?.pagination || null;

      if (mountedRef.current) {
        setApplications(applicationsData);
        setPagination(paginationData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching applications", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setApplications([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchApplications();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchApplications]);

  return {
    applications,
    loading,
    error,
    pagination,
    refetch: fetchApplications,
  };
}

