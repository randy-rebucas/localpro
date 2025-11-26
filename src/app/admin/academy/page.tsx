"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { 
  BookOpen, 
  Search, 
  Edit, 
  Trash2, 
  Plus,
  RefreshCw,
  Image as ImageIcon,
  Video,
  BarChart3,
  Users,
  TrendingUp,
  Eye,
  X,
  Filter
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { FileUpload } from "@/components/ui/file-upload";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { Course, CourseCategory, CourseLevel } from "@/types/academy";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";

interface CourseStatistics {
  totalCourses: number;
  activeCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  averageRating: number;
  coursesByCategory: Array<{ category: string; count: number }>;
  coursesByLevel: Array<{ level: string; count: number }>;
  recentCourses: number;
}

export default function AcademyPage() {
  // App settings for currency formatting and other settings
  const { settings: appSettings } = useAppSettings();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<CourseStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage] = useState(1);
  const itemsPerPage = 20;

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [courseFormData, setCourseFormData] = useState({
    title: "",
    description: "",
    category: "cleaning" as CourseCategory,
    level: "beginner" as CourseLevel,
    instructor: "",
    regularPrice: 0,
    discountedPrice: 0,
    currency: getDefaultCurrency(appSettings),
    hours: 0,
    weeks: 0,
    maxCapacity: 0,
    isActive: true,
    tags: [] as string[],
    prerequisites: [] as string[],
    learningOutcomes: [] as string[]
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);

  // Instructor autosuggest state
  const [instructorSearchTerm, setInstructorSearchTerm] = useState("");
  const [instructorSuggestions, setInstructorSuggestions] = useState<Array<{ _id: string; firstName: string; lastName: string; email: string }>>([]);
  const [showInstructorSuggestions, setShowInstructorSuggestions] = useState(false);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<{ _id: string; firstName: string; lastName: string; email: string } | null>(null);
  const instructorAutosuggestRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!getApiToken()) {
        logger.warn('No API token found, cannot fetch courses');
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.set('page', currentPage.toString());
      queryParams.set('limit', itemsPerPage.toString());
      if (searchTerm) queryParams.set('search', searchTerm);
      if (categoryFilter !== 'all') queryParams.set('category', categoryFilter);
      if (levelFilter !== 'all') queryParams.set('level', levelFilter);

      const coursesUrl = `${API_BASE_URL}${API_ENDPOINTS.academyCourses}?${queryParams.toString()}`;
      const statsUrl = `${API_BASE_URL}${API_ENDPOINTS.academyStatistics}`;

      const [coursesResponse, statsResponse] = await Promise.all([
        fetch(coursesUrl, createAuthFetchOptions({ method: 'GET' })),
        fetch(statsUrl, createAuthFetchOptions({ method: 'GET' }))
      ]);

      if (!coursesResponse.ok) {
        const errorData = await coursesResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${coursesResponse.status}: Failed to fetch courses`);
      }

      const coursesResult = await coursesResponse.json();
      
      // Handle stats response
      let statsData = null;
      if (statsResponse.ok) {
        try {
          const statsResult = await statsResponse.json();
          statsData = statsResult.data || statsResult;
        } catch (err) {
          logger.warn('Failed to parse stats response', { 
            error: err instanceof Error ? err.message : String(err)
          });
        }
      }

      // Transform courses data
      let coursesData: Course[] = [];
      if (coursesResult.success && coursesResult.data) {
        if (Array.isArray(coursesResult.data)) {
          coursesData = coursesResult.data;
        } else if (coursesResult.data.courses && Array.isArray(coursesResult.data.courses)) {
          coursesData = coursesResult.data.courses;
        }
      } else if (Array.isArray(coursesResult)) {
        coursesData = coursesResult;
      }

      setCourses(coursesData);
      setStats(statsData);
      setLastUpdated(new Date());
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error fetching academy data', error);
      setError(error.message);
      toast.error(`Failed to load courses: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, categoryFilter, levelFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const resetForm = () => {
    // Reset instructor autosuggest state
    setSelectedInstructor(null);
    setInstructorSearchTerm('');
    setInstructorSuggestions([]);
    setShowInstructorSuggestions(false);
    setCourseFormData({
      title: "",
      description: "",
      category: "cleaning",
      level: "beginner",
      instructor: "",
      regularPrice: 0,
      discountedPrice: 0,
      currency: getDefaultCurrency(appSettings),
      hours: 0,
      weeks: 0,
      maxCapacity: 0,
      isActive: true,
      tags: [],
      prerequisites: [],
      learningOutcomes: []
    });
    setSelectedCourse(null);
  };

  const handleCreateCourse = async () => {
    try {
      setSubmitting(true);

      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const courseData = {
        title: courseFormData.title,
        description: courseFormData.description,
        category: courseFormData.category,
        level: courseFormData.level,
        instructor: courseFormData.instructor || undefined,
        pricing: {
          regularPrice: courseFormData.regularPrice,
          discountedPrice: courseFormData.discountedPrice || undefined,
          currency: courseFormData.currency
        },
        duration: {
          hours: courseFormData.hours,
          weeks: courseFormData.weeks || undefined
        },
        enrollment: {
          maxCapacity: courseFormData.maxCapacity || undefined,
          isOpen: true
        },
        isActive: courseFormData.isActive,
        tags: courseFormData.tags,
        prerequisites: courseFormData.prerequisites,
        learningOutcomes: courseFormData.learningOutcomes
      };

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.academyCourseCreate}`,
        createAuthFetchOptions({
          method: 'POST',
          body: JSON.stringify(courseData)
        })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create course');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Course created successfully');
        setCreateModalOpen(false);
        resetForm();
        await refreshData();
      } else {
        throw new Error(result.error || 'Failed to create course');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error creating course', error);
      toast.error(`Failed to create course: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCourse = async () => {
    if (!selectedCourse?._id) return;

    try {
      setSubmitting(true);

      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const courseData = {
        title: courseFormData.title,
        description: courseFormData.description,
        category: courseFormData.category,
        level: courseFormData.level,
        instructor: courseFormData.instructor || undefined,
        pricing: {
          regularPrice: courseFormData.regularPrice,
          discountedPrice: courseFormData.discountedPrice || undefined,
          currency: courseFormData.currency
        },
        duration: {
          hours: courseFormData.hours,
          weeks: courseFormData.weeks || undefined
        },
        enrollment: {
          maxCapacity: courseFormData.maxCapacity || undefined,
          isOpen: true
        },
        isActive: courseFormData.isActive,
        tags: courseFormData.tags,
        prerequisites: courseFormData.prerequisites,
        learningOutcomes: courseFormData.learningOutcomes
      };

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.academyCourseUpdate}/${selectedCourse._id}`,
        createAuthFetchOptions({
          method: 'PUT',
          body: JSON.stringify(courseData)
        })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update course');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Course updated successfully');
        setEditModalOpen(false);
        resetForm();
        await refreshData();
      } else {
        throw new Error(result.error || 'Failed to update course');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error updating course', error);
      toast.error(`Failed to update course: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.academyCourseDelete}/${courseId}`,
        createAuthFetchOptions({
          method: 'DELETE'
        })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete course');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Course deleted successfully');
        await refreshData();
      } else {
        throw new Error(result.error || 'Failed to delete course');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error deleting course', error);
      toast.error(`Failed to delete course: ${error.message}`);
    }
  };

  // Fetch instructors for autosuggest
  const fetchInstructors = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setInstructorSuggestions([]);
      setShowInstructorSuggestions(false);
      return;
    }

    try {
      setLoadingInstructors(true);
      setShowInstructorSuggestions(true); // Show dropdown while loading
      if (!getApiToken()) {
        setLoadingInstructors(false);
        return;
      }

      const queryParams = new URLSearchParams();
      queryParams.append('search', searchTerm);
      queryParams.append('limit', '10');
      // Optionally filter by role if you want only instructors
      // queryParams.append('role', 'instructor');

      const url = `${API_BASE_URL}${API_ENDPOINTS.users}?${queryParams.toString()}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (response.ok) {
        const result = await response.json();
        // Handle different response structures
        let users = [];
        if (result.data) {
          if (Array.isArray(result.data)) {
            users = result.data;
          } else if (result.data.users && Array.isArray(result.data.users)) {
            users = result.data.users;
          }
        } else if (result.users && Array.isArray(result.users)) {
          users = result.users;
        } else if (Array.isArray(result)) {
          users = result;
        }
        
        // Transform users to instructor suggestions format
        interface UserSuggestion {
          _id?: string;
          id?: string;
          firstName?: string;
          lastName?: string;
          email?: string;
        }
        const suggestions = (users as UserSuggestion[])
          .filter((user) => (user._id || user.id) && (user.firstName || user.lastName || user.email))
          .map((user) => ({
            _id: user._id || user.id || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || ''
          }))
          .filter((suggestion) => suggestion._id !== '');
        
        setInstructorSuggestions(suggestions);
        setShowInstructorSuggestions(suggestions.length > 0 || searchTerm.length >= 2);
      } else {
        setInstructorSuggestions([]);
        setShowInstructorSuggestions(false);
      }
    } catch {
      // Silently fail - don't show error for autosuggest
      setInstructorSuggestions([]);
      setShowInstructorSuggestions(false);
    } finally {
      setLoadingInstructors(false);
    }
  }, []);

  // Debounced instructor search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (instructorSearchTerm && instructorSearchTerm.length >= 2) {
        fetchInstructors(instructorSearchTerm);
      } else {
        setInstructorSuggestions([]);
        setShowInstructorSuggestions(false);
        setLoadingInstructors(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [instructorSearchTerm, fetchInstructors]);

  // Handle instructor selection
  const handleInstructorSelect = (instructor: { _id: string; firstName: string; lastName: string; email: string }) => {
    setSelectedInstructor(instructor);
    setCourseFormData({ ...courseFormData, instructor: instructor._id });
    setInstructorSearchTerm(`${instructor.firstName} ${instructor.lastName}`.trim() || instructor.email);
    setShowInstructorSuggestions(false);
  };

  // Clear instructor selection
  const handleInstructorClear = () => {
    setSelectedInstructor(null);
    setCourseFormData({ ...courseFormData, instructor: '' });
    setInstructorSearchTerm('');
    setShowInstructorSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (instructorAutosuggestRef.current && !instructorAutosuggestRef.current.contains(event.target as Node)) {
        setShowInstructorSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleUploadThumbnail = async () => {
    if (!selectedCourse?._id || !thumbnailFile) return;

    try {
      setSubmitting(true);
      const token = getApiToken();
      if (!token) {
        const error = new Error('No authentication token found');
        logger.error('Error uploading thumbnail', error, { courseId: selectedCourse._id });
        toast.error('Authentication required. Please log in again.');
        return;
      }

      // Validate file before creating FormData
      if (!(thumbnailFile instanceof File) || thumbnailFile.size === 0) {
        toast.error('Invalid file selected. Please select a valid image file.');
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('thumbnail', thumbnailFile, thumbnailFile.name || 'thumbnail.jpg');

      // Endpoint: POST /api/academy/courses/:id/thumbnail
      const url = `${API_BASE_URL}${API_ENDPOINTS.academyCoursesThumbnail.replace('[id]', selectedCourse._id)}`;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };
      // Don't set Content-Type for FormData - browser will set it with boundary
      
      logger.debug('Uploading thumbnail', { 
        url, 
        courseId: selectedCourse._id, 
        fileName: thumbnailFile.name,
        fileSize: thumbnailFile.size,
        fileType: thumbnailFile.type
      });

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData
        });
      } catch (networkError) {
        // Handle network errors (fetch failed)
        const error = networkError instanceof Error ? networkError : new Error(String(networkError));
        logger.error('Network error uploading thumbnail', error, {
          url,
          courseId: selectedCourse._id
        });
        toast.error('Network error: Failed to connect to server. Please check your connection and try again.');
        return;
      }

      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = 'Failed to upload thumbnail';
        let errorData: { error?: string; message?: string } = {};
        
        try {
          const responseText = await response.text();
          if (responseText) {
            try {
              errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch {
              // If not JSON, use the text as error message
              errorMessage = responseText || errorMessage;
            }
          }
        } catch (parseError) {
          logger.warn('Failed to parse error response', { parseError });
        }

        const error = new Error(errorMessage);
        logger.error('Error uploading thumbnail', error, {
          url,
          courseId: selectedCourse._id,
          status: response.status,
          statusText: response.statusText,
          errorData,
          fieldName: 'thumbnail'
        });

        // Provide user-friendly error messages based on status code
        if (response.status === 400) {
          const backendMessage = errorData.message || errorMessage;
          if (backendMessage.toLowerCase().includes('no file') || backendMessage.toLowerCase().includes('file')) {
            toast.error(backendMessage || 'No file was received by the server. The backend may expect a different field name.');
            logger.warn('400 Bad Request - file not received', {
              courseId: selectedCourse._id,
              backendMessage,
              fieldName: 'thumbnail',
              note: 'Backend may expect different field name'
            });
          } else {
            toast.error(backendMessage || 'Invalid request. Please check your file selection and try again.');
          }
        } else if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          const backendMessage = errorData.message || errorMessage;
          toast.error(backendMessage || 'You do not have permission to upload thumbnails for this course. Admin access may not be properly configured on the backend.');
          logger.warn('403 Forbidden when uploading thumbnail - possible backend authorization issue', {
            courseId: selectedCourse._id,
            backendMessage,
            note: 'Admin users should have permission to upload thumbnails for any course according to API documentation'
          });
        } else if (response.status === 404) {
          toast.error('Course not found. Please refresh and try again.');
        } else if (response.status === 413) {
          toast.error('Thumbnail file is too large. Please select a smaller image.');
        } else if (response.status === 415) {
          toast.error('Invalid file type. Please select an image file.');
        } else if (response.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error(errorMessage || 'Failed to upload thumbnail');
        }
        return;
      }

      // Success
      const result = await response.json().catch(() => ({}));
      logger.debug('Thumbnail uploaded successfully', { 
        courseId: selectedCourse._id,
        result
      });

      if (result.success !== false) {
        toast.success('Thumbnail uploaded successfully');
        setThumbnailModalOpen(false);
        setThumbnailFile(null);
        await refreshData();
      } else {
        throw new Error(result.error || 'Failed to upload thumbnail');
      }
    } catch (err) {
      // Catch any unexpected errors
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Unexpected error uploading thumbnail', error, {
        courseId: selectedCourse?._id
      });
      toast.error(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadVideo = async () => {
    if (!selectedCourse?._id || !videoFile) return;

    try {
      setSubmitting(true);
      const token = getApiToken();
      if (!token) {
        const error = new Error('No authentication token found');
        logger.error('Error uploading video', error, { courseId: selectedCourse._id });
        toast.error('Authentication required. Please log in again.');
        return;
      }

      // Validate file before creating FormData
      if (!(videoFile instanceof File) || videoFile.size === 0) {
        toast.error('Invalid file selected. Please select a valid video file.');
        setSubmitting(false);
        return;
      }

      // Validate video file format
      const fileName = videoFile.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1);
      const supportedFormats = ['mp4', 'webm', 'mov', 'm4v', 'mkv', 'flv', 'wmv', '3gp', 'avi'];
      const unsupportedFormats = ['rm', 'rmvb', 'vob', 'asf'];
      
      // Check if file extension is in unsupported list
      if (unsupportedFormats.includes(fileExtension)) {
        toast.error(`Unsupported video format: ${fileExtension.toUpperCase()}. Please use MP4, WebM, MOV, or other supported formats.`);
        logger.warn('Unsupported video format detected', {
          courseId: selectedCourse._id,
          fileName: videoFile.name,
          fileExtension,
          fileType: videoFile.type
        });
        setSubmitting(false);
        return;
      }

      // Check if file extension is in supported list or has a video MIME type
      const hasVideoMimeType = videoFile.type.startsWith('video/');
      if (!supportedFormats.includes(fileExtension) && !hasVideoMimeType) {
        toast.error(`Unsupported video format: ${fileExtension.toUpperCase()}. Supported formats: ${supportedFormats.join(', ').toUpperCase()}.`);
        logger.warn('Unsupported video format detected', {
          courseId: selectedCourse._id,
          fileName: videoFile.name,
          fileExtension,
          fileType: videoFile.type
        });
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('video', videoFile, videoFile.name || 'video.mp4');
      if (videoTitle) formData.append('title', videoTitle);
      if (videoDuration) formData.append('duration', videoDuration.toString());

      // Endpoint: POST /api/academy/courses/:id/videos
      const url = `${API_BASE_URL}${API_ENDPOINTS.academyCoursesVideos.replace('[id]', selectedCourse._id)}`;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };
      // Don't set Content-Type for FormData - browser will set it with boundary
      
      logger.debug('Uploading video', { 
        url, 
        courseId: selectedCourse._id, 
        fileName: videoFile.name,
        fileSize: videoFile.size,
        fileType: videoFile.type,
        videoTitle,
        videoDuration
      });

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData
        });
      } catch (networkError) {
        // Handle network errors (fetch failed)
        const error = networkError instanceof Error ? networkError : new Error(String(networkError));
        logger.error('Network error uploading video', error, {
          url,
          courseId: selectedCourse._id
        });
        toast.error('Network error: Failed to connect to server. Please check your connection and try again.');
        return;
      }

      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = 'Failed to upload video';
        let errorData: { error?: string; message?: string } = {};
        
        try {
          const responseText = await response.text();
          if (responseText) {
            try {
              errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch {
              // If not JSON, use the text as error message
              errorMessage = responseText || errorMessage;
            }
          }
        } catch (parseError) {
          logger.warn('Failed to parse error response', { parseError });
        }

        const error = new Error(errorMessage);
        logger.error('Error uploading video', error, {
          url,
          courseId: selectedCourse._id,
          status: response.status,
          statusText: response.statusText,
          errorData,
          fieldName: 'video'
        });

        // Provide user-friendly error messages based on status code
        if (response.status === 400) {
          const backendMessage = errorData.message || errorMessage;
          if (backendMessage.toLowerCase().includes('no file') || backendMessage.toLowerCase().includes('file')) {
            toast.error(backendMessage || 'No file was received by the server. The backend may expect a different field name.');
            logger.warn('400 Bad Request - file not received', {
              courseId: selectedCourse._id,
              backendMessage,
              fieldName: 'video',
              note: 'Backend may expect different field name'
            });
          } else {
            toast.error(backendMessage || 'Invalid request. Please check your file selection and try again.');
          }
        } else if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          const backendMessage = errorData.message || errorMessage;
          toast.error(backendMessage || 'You do not have permission to upload videos for this course. Admin access may not be properly configured on the backend.');
          logger.warn('403 Forbidden when uploading video - possible backend authorization issue', {
            courseId: selectedCourse._id,
            backendMessage,
            note: 'Admin users should have permission to upload videos for any course according to API documentation'
          });
        } else if (response.status === 404) {
          toast.error('Course not found. Please refresh and try again.');
        } else if (response.status === 413) {
          toast.error('Video file is too large. Please select a smaller video file.');
        } else if (response.status === 415) {
          toast.error('Invalid file type. Please select a video file.');
        } else if (response.status >= 500) {
          // Check if error is about unsupported video format
          const errorLower = errorMessage.toLowerCase();
          if (errorLower.includes('unsupported') && (errorLower.includes('format') || errorLower.includes('video'))) {
            const formatMatch = errorMessage.match(/format:\s*(\w+)/i);
            const format = formatMatch ? formatMatch[1] : 'unknown';
            toast.error(`Unsupported video format: ${format.toUpperCase()}. Please use MP4, WebM, MOV, or other supported formats.`);
            logger.warn('Backend rejected video format', {
              courseId: selectedCourse._id,
              fileName: videoFile.name,
              rejectedFormat: format,
              fileType: videoFile.type,
              backendError: errorMessage
            });
          } else {
            toast.error(errorMessage || 'Server error. Please try again later.');
          }
        } else {
          toast.error(errorMessage || 'Failed to upload video');
        }
        return;
      }

      // Success
      const result = await response.json().catch(() => ({}));
      logger.debug('Video uploaded successfully', { 
        courseId: selectedCourse._id,
        result
      });

      if (result.success !== false) {
        toast.success('Video uploaded successfully');
        setVideoModalOpen(false);
        setVideoFile(null);
        setVideoTitle("");
        setVideoDuration(0);
        await refreshData();
      } else {
        throw new Error(result.error || 'Failed to upload video');
      }
    } catch (err) {
      // Catch any unexpected errors
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Unexpected error uploading video', error, {
        courseId: selectedCourse?._id
      });
      toast.error(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Note: handleDeleteVideo is defined but not currently used in the UI
  // Uncomment and wire up to a delete button when needed
  // const handleDeleteVideo = async (courseId: string, videoId: string) => {
  //   if (!confirm('Are you sure you want to delete this video?')) return;
  //   // ... implementation
  // };

  // Fetch instructor details by ID
  const fetchInstructorById = useCallback(async (instructorId: string) => {
    if (!instructorId || !getApiToken()) return;

    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.usersById}/${instructorId}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (response.ok) {
        const result = await response.json();
        const user = result.data || result;
        
        if (user._id || user.id) {
          const instructor = {
            _id: user._id || user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || ''
          };
          setSelectedInstructor(instructor);
          setInstructorSearchTerm(`${instructor.firstName} ${instructor.lastName}`.trim() || instructor.email);
        }
      }
    } catch {
      // Silently fail - instructor might not exist
    }
  }, []);

  const openEditModal = async (course: Course) => {
    setSelectedCourse(course);
    
    const instructorId = typeof course.instructor === 'string' 
      ? course.instructor 
      : (typeof course.instructor === 'object' && course.instructor !== null && '_id' in course.instructor)
        ? (course.instructor as { _id?: string })._id || ""
        : "";

    setCourseFormData({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      instructor: instructorId,
      regularPrice: typeof course.pricing === 'object' ? course.pricing.regularPrice : 0,
      discountedPrice: typeof course.pricing === 'object' ? (course.pricing.discountedPrice ?? 0) : 0,
      currency: typeof course.pricing === 'object' ? course.pricing.currency || getDefaultCurrency(appSettings) : getDefaultCurrency(appSettings),
      hours: typeof course.duration === 'object' ? course.duration.hours : 0,
      weeks: typeof course.duration === 'object' ? (course.duration.weeks ?? 0) : 0,
      maxCapacity: course.enrollment?.maxCapacity || 0,
      isActive: course.isActive ?? true,
      tags: course.tags || [],
      prerequisites: course.prerequisites || [],
      learningOutcomes: course.learningOutcomes || []
    });

    // Fetch instructor details if instructor ID exists
    if (instructorId) {
      await fetchInstructorById(instructorId);
    } else {
      setSelectedInstructor(null);
      setInstructorSearchTerm('');
    }

    setEditModalOpen(true);
  };

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading academy courses..." />
      </div>
    );
  }

  if (error && !courses.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const categories: CourseCategory[] = ['cleaning', 'plumbing', 'electrical', 'moving', 'business', 'safety', 'certification'];
  const levels: CourseLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academy Management</h1>
          <p className="text-gray-600 text-sm">Manage courses, content, and enrollments</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              resetForm();
              setCreateModalOpen(true);
            }}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Course
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Courses</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalCourses || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0 ml-4">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Active Courses</p>
                <p className="text-lg font-bold text-gray-900">{stats.activeCourses || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg flex-shrink-0 ml-4">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Enrollments</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalEnrollments || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0 ml-4">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Average Rating</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0 ml-4">
                <BarChart3 className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="w-3 h-3 mr-1" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <div className="text-xs text-gray-500">
                {courses.length} course{courses.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Level</label>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Levels</option>
                  {levels.map(level => (
                    <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setLevelFilter('all');
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Courses</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-2 text-center text-xs text-gray-500">
                    No courses found
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        {course.thumbnail?.url ? (
                          <Image
                            src={course.thumbnail.url}
                            alt={course.title}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded object-cover mr-2"
                            unoptimized
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center mr-2">
                            <BookOpen className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-semibold text-gray-900">{course.title}</div>
                          <div className="text-xs text-gray-600 truncate max-w-xs">{course.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {course.category}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {course.level}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {typeof course.pricing === 'object' ? (
                        <>
                          {course.pricing.discountedPrice ? (
                            <>
                              <span className="line-through text-gray-400">
                                {formatCurrency(course.pricing.regularPrice, course.pricing.currency || getDefaultCurrency(appSettings), { appSettings })}
                              </span>
                              <span className="ml-2 text-green-600 font-medium">
                                {formatCurrency(course.pricing.discountedPrice, course.pricing.currency || getDefaultCurrency(appSettings), { appSettings })}
                              </span>
                            </>
                          ) : (
                            formatCurrency(course.pricing.regularPrice, course.pricing.currency || getDefaultCurrency(appSettings), { appSettings })
                          )}
                        </>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        course.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {course.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCourse(course);
                            setViewModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View course details"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openEditModal(course)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit course"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCourse(course);
                            setThumbnailModalOpen(true);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Upload Thumbnail"
                        >
                          <ImageIcon className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCourse(course);
                            setVideoModalOpen(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Upload Video"
                        >
                          <Video className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => course._id && handleDeleteCourse(course._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Course Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          resetForm();
        }}
        title="Create New Course"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={courseFormData.title}
              onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={courseFormData.description}
              onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={courseFormData.category}
                onChange={(e) => setCourseFormData({ ...courseFormData, category: e.target.value as CourseCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
              <select
                value={courseFormData.level}
                onChange={(e) => setCourseFormData({ ...courseFormData, level: e.target.value as CourseLevel })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {levels.map(level => (
                  <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
            <div ref={instructorAutosuggestRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={instructorSearchTerm}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setInstructorSearchTerm(newValue);
                    if (newValue === '') {
                      handleInstructorClear();
                    } else if (selectedInstructor) {
                      // If user starts typing and it doesn't match the selected instructor, clear selection
                      const selectedName = `${selectedInstructor.firstName} ${selectedInstructor.lastName}`.trim();
                      const selectedEmail = selectedInstructor.email;
                      if (newValue !== selectedName && newValue !== selectedEmail && !newValue.startsWith(selectedName) && !newValue.startsWith(selectedEmail)) {
                        setSelectedInstructor(null);
                        setCourseFormData({ ...courseFormData, instructor: '' });
                      }
                    }
                  }}
                  onFocus={() => {
                    if (instructorSearchTerm && instructorSearchTerm.length >= 2) {
                      if (instructorSuggestions.length > 0) {
                        setShowInstructorSuggestions(true);
                      } else if (!loadingInstructors) {
                        // Trigger search if we have a search term but no suggestions yet
                        fetchInstructors(instructorSearchTerm);
                      }
                    }
                  }}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search for instructor by name or email..."
                />
                {selectedInstructor && (
                  <button
                    type="button"
                    onClick={handleInstructorClear}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Suggestions Dropdown */}
              {showInstructorSuggestions && instructorSearchTerm.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {loadingInstructors ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      Searching...
                    </div>
                  ) : instructorSuggestions.length > 0 ? (
                    instructorSuggestions.map((instructor) => (
                      <div
                        key={instructor._id}
                        onClick={() => handleInstructorSelect(instructor)}
                        className="px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {instructor.firstName} {instructor.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{instructor.email}</div>
                        <div className="text-xs text-gray-400 mt-1">ID: {instructor._id}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No instructors found
                    </div>
                  )}
                </div>
              )}
              
              {selectedInstructor && (
                <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">
                    Selected: {selectedInstructor.firstName} {selectedInstructor.lastName}
                  </div>
                  <div className="text-xs text-blue-700">{selectedInstructor.email}</div>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Regular Price *</label>
              <input
                type="number"
                value={courseFormData.regularPrice}
                onChange={(e) => setCourseFormData({ ...courseFormData, regularPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discounted Price</label>
              <input
                type="number"
                value={courseFormData.discountedPrice}
                onChange={(e) => setCourseFormData({ ...courseFormData, discountedPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={courseFormData.currency}
                onChange={(e) => setCourseFormData({ ...courseFormData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={getDefaultCurrency(appSettings)}>{getDefaultCurrency(appSettings)}</option>
                <option value="USD">USD</option>
                <option value="PHP">PHP</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Hours) *</label>
              <input
                type="number"
                value={courseFormData.hours}
                onChange={(e) => setCourseFormData({ ...courseFormData, hours: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weeks</label>
              <input
                type="number"
                value={courseFormData.weeks}
                onChange={(e) => setCourseFormData({ ...courseFormData, weeks: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
            <input
              type="number"
              value={courseFormData.maxCapacity}
              onChange={(e) => setCourseFormData({ ...courseFormData, maxCapacity: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={courseFormData.isActive}
              onChange={(e) => setCourseFormData({ ...courseFormData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">Active</label>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => {
                setCreateModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateCourse}
              disabled={submitting || !courseFormData.title || !courseFormData.description}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          resetForm();
        }}
        title="Edit Course"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={courseFormData.title}
              onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={courseFormData.description}
              onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={courseFormData.category}
                onChange={(e) => setCourseFormData({ ...courseFormData, category: e.target.value as CourseCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
              <select
                value={courseFormData.level}
                onChange={(e) => setCourseFormData({ ...courseFormData, level: e.target.value as CourseLevel })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {levels.map(level => (
                  <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
            <div ref={instructorAutosuggestRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={instructorSearchTerm}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setInstructorSearchTerm(newValue);
                    if (newValue === '') {
                      handleInstructorClear();
                    } else if (selectedInstructor) {
                      // If user starts typing and it doesn't match the selected instructor, clear selection
                      const selectedName = `${selectedInstructor.firstName} ${selectedInstructor.lastName}`.trim();
                      const selectedEmail = selectedInstructor.email;
                      if (newValue !== selectedName && newValue !== selectedEmail && !newValue.startsWith(selectedName) && !newValue.startsWith(selectedEmail)) {
                        setSelectedInstructor(null);
                        setCourseFormData({ ...courseFormData, instructor: '' });
                      }
                    }
                  }}
                  onFocus={() => {
                    if (instructorSearchTerm && instructorSearchTerm.length >= 2) {
                      if (instructorSuggestions.length > 0) {
                        setShowInstructorSuggestions(true);
                      } else if (!loadingInstructors) {
                        // Trigger search if we have a search term but no suggestions yet
                        fetchInstructors(instructorSearchTerm);
                      }
                    }
                  }}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search for instructor by name or email..."
                />
                {selectedInstructor && (
                  <button
                    type="button"
                    onClick={handleInstructorClear}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Suggestions Dropdown */}
              {showInstructorSuggestions && instructorSearchTerm.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {loadingInstructors ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      Searching...
                    </div>
                  ) : instructorSuggestions.length > 0 ? (
                    instructorSuggestions.map((instructor) => (
                      <div
                        key={instructor._id}
                        onClick={() => handleInstructorSelect(instructor)}
                        className="px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {instructor.firstName} {instructor.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{instructor.email}</div>
                        <div className="text-xs text-gray-400 mt-1">ID: {instructor._id}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No instructors found
                    </div>
                  )}
                </div>
              )}
              
              {selectedInstructor && (
                <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">
                    Selected: {selectedInstructor.firstName} {selectedInstructor.lastName}
                  </div>
                  <div className="text-xs text-blue-700">{selectedInstructor.email}</div>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Regular Price *</label>
              <input
                type="number"
                value={courseFormData.regularPrice}
                onChange={(e) => setCourseFormData({ ...courseFormData, regularPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discounted Price</label>
              <input
                type="number"
                value={courseFormData.discountedPrice}
                onChange={(e) => setCourseFormData({ ...courseFormData, discountedPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={courseFormData.currency}
                onChange={(e) => setCourseFormData({ ...courseFormData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={getDefaultCurrency(appSettings)}>{getDefaultCurrency(appSettings)}</option>
                <option value="USD">USD</option>
                <option value="PHP">PHP</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Hours) *</label>
              <input
                type="number"
                value={courseFormData.hours}
                onChange={(e) => setCourseFormData({ ...courseFormData, hours: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weeks</label>
              <input
                type="number"
                value={courseFormData.weeks}
                onChange={(e) => setCourseFormData({ ...courseFormData, weeks: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
            <input
              type="number"
              value={courseFormData.maxCapacity}
              onChange={(e) => setCourseFormData({ ...courseFormData, maxCapacity: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={courseFormData.isActive}
              onChange={(e) => setCourseFormData({ ...courseFormData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">Active</label>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => {
                setEditModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateCourse}
              disabled={submitting || !courseFormData.title || !courseFormData.description}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Course'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Upload Thumbnail Modal */}
      <Modal
        isOpen={thumbnailModalOpen}
        onClose={() => {
          setThumbnailModalOpen(false);
          setThumbnailFile(null);
        }}
        title={`Upload Thumbnail - ${selectedCourse?.title || ''}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail Image</label>
            <FileUpload
              accept="image/*"
              files={thumbnailFile ? [thumbnailFile] : []}
              onFilesSelected={(files) => setThumbnailFile(files[0] || null)}
              onRemove={() => setThumbnailFile(null)}
              maxSize={10}
            />
            {thumbnailFile && (
              <div className="mt-3">
                <Image
                  src={URL.createObjectURL(thumbnailFile)}
                  alt="Preview"
                  width={800}
                  height={192}
                  className="w-full h-48 object-cover rounded"
                  unoptimized
                />
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => {
                setThumbnailModalOpen(false);
                setThumbnailFile(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadThumbnail}
              disabled={submitting || !thumbnailFile}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Uploading...' : 'Upload Thumbnail'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Upload Video Modal */}
      <Modal
        isOpen={videoModalOpen}
        onClose={() => {
          setVideoModalOpen(false);
          setVideoFile(null);
          setVideoTitle("");
          setVideoDuration(0);
        }}
        title={`Upload Video - ${selectedCourse?.title || ''}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video Title</label>
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Lesson title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
            <input
              type="number"
              value={videoDuration}
              onChange={(e) => setVideoDuration(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              placeholder="90"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Video File</label>
            <p className="text-xs text-gray-500 mb-2">Supported formats: MP4, WebM, MOV, M4V, MKV, FLV, WMV, 3GP, AVI</p>
            <FileUpload
              accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/x-matroska,video/x-flv,video/x-ms-wmv,video/3gpp,video/x-msvideo"
              files={videoFile ? [videoFile] : []}
              onFilesSelected={(files) => setVideoFile(files[0] || null)}
              onRemove={() => setVideoFile(null)}
              maxSize={500}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => {
                setVideoModalOpen(false);
                setVideoFile(null);
                setVideoTitle("");
                setVideoDuration(0);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadVideo}
              disabled={submitting || !videoFile}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Uploading...' : 'Upload Video'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Course Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedCourse(null);
        }}
        title={selectedCourse?.title || 'Course Details'}
        size="lg"
      >
        {selectedCourse && (
          <div className="space-y-4">
            {selectedCourse.thumbnail?.url && (
              <Image
                src={selectedCourse.thumbnail.url}
                alt={selectedCourse.title}
                width={800}
                height={192}
                className="w-full h-48 object-cover rounded"
                unoptimized
              />
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedCourse.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p className="mt-1 text-sm text-gray-900">{selectedCourse.category}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Level</h3>
                <p className="mt-1 text-sm text-gray-900">{selectedCourse.level}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Pricing</h3>
              <p className="mt-1 text-sm text-gray-900">
                {typeof selectedCourse.pricing === 'object' ? (
                  <>
                    Regular: {formatCurrency(
                      selectedCourse.pricing.regularPrice,
                      selectedCourse.pricing.currency || getDefaultCurrency(appSettings),
                      { appSettings }
                    )}
                    {selectedCourse.pricing.discountedPrice && (
                      <> | Discounted: {formatCurrency(
                        selectedCourse.pricing.discountedPrice,
                        selectedCourse.pricing.currency || getDefaultCurrency(appSettings),
                        { appSettings }
                      )}</>
                    )}
                  </>
                ) : (
                  'N/A'
                )}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Duration</h3>
              <p className="mt-1 text-sm text-gray-900">
                {typeof selectedCourse.duration === 'object' 
                  ? `${selectedCourse.duration.hours} hours${selectedCourse.duration.weeks ? `, ${selectedCourse.duration.weeks} weeks` : ''}`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1 text-sm text-gray-900">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  selectedCourse.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedCourse.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
            {selectedCourse.curriculum && selectedCourse.curriculum.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Curriculum</h3>
                <div className="space-y-2">
                  {selectedCourse.curriculum.map((module, idx) => (
                    <div key={idx} className="border-l-2 border-blue-500 pl-3">
                      <p className="text-sm font-medium text-gray-900">{module.module}</p>
                      {module.lessons && module.lessons.length > 0 && (
                        <ul className="mt-1 space-y-1">
                          {module.lessons.map((lesson, lessonIdx) => (
                            <li key={lessonIdx} className="text-xs text-gray-600">
                              • {lesson.title || 'Untitled Lesson'}
                              {lesson.duration && ` (${lesson.duration} min)`}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

