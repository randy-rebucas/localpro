"use client";

import { useState, useEffect, useCallback } from "react";
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
  Eye
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { FileUpload } from "@/components/ui/file-upload";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { Course, CourseCategory, CourseLevel } from "@/types/academy";

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
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<CourseStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
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
    currency: "USD",
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

  const handleUploadThumbnail = async () => {
    if (!selectedCourse?._id || !thumbnailFile) return;

    try {
      setSubmitting(true);

      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('thumbnail', thumbnailFile);

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.academyCoursesThumbnail.replace('[id]', selectedCourse._id)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getApiToken()}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload thumbnail');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Thumbnail uploaded successfully');
        setThumbnailModalOpen(false);
        setThumbnailFile(null);
        await refreshData();
      } else {
        throw new Error(result.error || 'Failed to upload thumbnail');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error uploading thumbnail', error);
      toast.error(`Failed to upload thumbnail: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadVideo = async () => {
    if (!selectedCourse?._id || !videoFile) return;

    try {
      setSubmitting(true);

      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const formData = new FormData();
      formData.append('video', videoFile);
      if (videoTitle) formData.append('title', videoTitle);
      if (videoDuration) formData.append('duration', videoDuration.toString());

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.academyCoursesVideos.replace('[id]', selectedCourse._id)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getApiToken()}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload video');
      }

      const result = await response.json();
      
      if (result.success) {
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
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error uploading video', error);
      toast.error(`Failed to upload video: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // TODO: Implement video deletion functionality when needed
  // const handleDeleteVideo = async (courseId: string, videoId: string) => {
  //   if (!confirm('Are you sure you want to delete this video?')) return;
  //
  //   try {
  //     if (!getApiToken()) {
  //       throw new Error('Authentication required');
  //     }
  //
  //     const response = await fetch(
  //       `${API_BASE_URL}${API_ENDPOINTS.academyCoursesVideosById.replace('[id]', courseId).replace('[videoId]', videoId)}`,
  //       createAuthFetchOptions({
  //         method: 'DELETE'
  //       })
  //     );
  //
  //     if (!response.ok) {
  //       const errorData = await response.json().catch(() => ({}));
  //       throw new Error(errorData.error || 'Failed to delete video');
  //     }
  //
  //     const result = await response.json();
  //     
  //     if (result.success) {
  //       toast.success('Video deleted successfully');
  //       await refreshData();
  //     } else {
  //       throw new Error(result.error || 'Failed to delete video');
  //     }
  //   } catch (err) {
  //     const error = err instanceof Error ? err : new Error(String(err));
  //     logger.error('Error deleting video', error);
  //     toast.error(`Failed to delete video: ${error.message}`);
  //   }
  // };

  const resetForm = () => {
    setCourseFormData({
      title: "",
      description: "",
      category: "cleaning",
      level: "beginner",
      instructor: "",
      regularPrice: 0,
      discountedPrice: 0,
      currency: "USD",
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

  const openEditModal = (course: Course) => {
    setSelectedCourse(course);
    setCourseFormData({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      instructor: typeof course.instructor === 'string' 
        ? course.instructor 
        : (typeof course.instructor === 'object' && course.instructor !== null && '_id' in course.instructor)
          ? (course.instructor as { _id?: string })._id || ""
          : "",
      regularPrice: typeof course.pricing === 'object' ? course.pricing.regularPrice : 0,
      discountedPrice: typeof course.pricing === 'object' ? course.pricing.discountedPrice : undefined,
      currency: typeof course.pricing === 'object' ? course.pricing.currency || "USD" : "USD",
      hours: typeof course.duration === 'object' ? course.duration.hours : 0,
      weeks: typeof course.duration === 'object' ? course.duration.weeks : undefined,
      maxCapacity: course.enrollment?.maxCapacity || 0,
      isActive: course.isActive ?? true,
      tags: course.tags || [],
      prerequisites: course.prerequisites || [],
      learningOutcomes: course.learningOutcomes || []
    });
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
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              resetForm();
              setCreateModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourses || 0}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeCourses || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEnrollments || 0}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Levels</option>
              {levels.map(level => (
                <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No courses found
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {course.thumbnail?.url ? (
                          <img
                            src={course.thumbnail.url}
                            alt={course.title}
                            className="w-10 h-10 rounded object-cover mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center mr-3">
                            <BookOpen className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{course.title}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">{course.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {course.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {course.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof course.pricing === 'object' ? (
                        <>
                          {course.pricing.discountedPrice ? (
                            <>
                              <span className="line-through text-gray-400">${course.pricing.regularPrice}</span>
                              <span className="ml-2 text-green-600 font-medium">${course.pricing.discountedPrice}</span>
                            </>
                          ) : (
                            `$${course.pricing.regularPrice}`
                          )}
                        </>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        course.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {course.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCourse(course);
                            setViewModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(course)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCourse(course);
                            setThumbnailModalOpen(true);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Upload Thumbnail"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCourse(course);
                            setVideoModalOpen(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Upload Video"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => course._id && handleDeleteCourse(course._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructor ID</label>
            <input
              type="text"
              value={courseFormData.instructor}
              onChange={(e) => setCourseFormData({ ...courseFormData, instructor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="User ID of instructor"
            />
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
              <input
                type="text"
                value={courseFormData.currency}
                onChange={(e) => setCourseFormData({ ...courseFormData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="USD"
              />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructor ID</label>
            <input
              type="text"
              value={courseFormData.instructor}
              onChange={(e) => setCourseFormData({ ...courseFormData, instructor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="User ID of instructor"
            />
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
              <input
                type="text"
                value={courseFormData.currency}
                onChange={(e) => setCourseFormData({ ...courseFormData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="USD"
              />
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
                <img
                  src={URL.createObjectURL(thumbnailFile)}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded"
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
            <FileUpload
              accept="video/*"
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
              <img
                src={selectedCourse.thumbnail.url}
                alt={selectedCourse.title}
                className="w-full h-48 object-cover rounded"
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
                    Regular: ${selectedCourse.pricing.regularPrice}
                    {selectedCourse.pricing.discountedPrice && (
                      <> | Discounted: ${selectedCourse.pricing.discountedPrice}</>
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

