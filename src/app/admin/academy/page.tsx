"use client";

import { useSession } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { makeClientAuthenticatedRequestWithEndpointSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { Loading } from "@/components/ui/loading";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  Play,
  Star,
  Clock,
  TrendingUp,
  RefreshCw,
  X,
  CheckCircle,
  Video,
  FileText,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface Instructor {
  _id: string;
  firstName: string;
  lastName: string;
  profile?: {
    bio: string;
  };
}

interface Duration {
  hours: number;
  weeks: number;
}

interface Pricing {
  regularPrice: number;
  currency: string;
}

interface Lesson {
  title: string;
  description: string;
  duration: number;
  type: string;
  isFree: boolean;
  _id: string;
}

interface Module {
  module: string;
  lessons: Lesson[];
  _id: string;
}

interface Certification {
  isAvailable: boolean;
  name: string;
  issuer: string;
  requirements: string[];
}

interface Enrollment {
  current: number;
  isOpen: boolean;
}

interface Rating {
  average: number;
  count: number;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  instructor: Instructor;
  level: string;
  duration: Duration;
  pricing: Pricing;
  curriculum: Module[];
  prerequisites: string[];
  learningOutcomes: string[];
  certification: Certification;
  enrollment: Enrollment;
  schedule: {
    sessions: {
      id: string;
      title: string;
      startTime: string;
      endTime: string;
      instructor: string;
      location: string;
      maxParticipants: number;
      enrolledCount: number;
    }[];
  };
  rating: Rating;
  isActive: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}


export default function AcademyAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);
  const [pagination, setPagination] = useState({
    count: 0,
    total: 0,
    page: 1,
    pages: 1
  });
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async (page = 1) => {
    try {
      setLoading(true);
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'academyCourses' as keyof typeof API_ENDPOINTS,
        { method: 'GET', query: { page: String(page) } }
      );
      const result = await response.json();
      
      if (result.success) {
        setCourses(result.data);
        setPagination({
          count: result.count || 0,
          total: result.total || 0,
          page: result.page || 1,
          pages: result.pages || 1
        });
        setError(null);
      } else {
        // console.error("Failed to fetch courses:", result);
        setCourses([]);
        setError("Failed to load courses. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <Loading text="Loading academy" fullScreen />;
  }

  if (!session) {
    return null;
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || course.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats from real data
  const totalEnrollments = courses.reduce((sum, course) => sum + (course.enrollment?.current || 0), 0);
  const activeStudents = courses.filter(course => course.isActive).length;
  const completionRate = courses.length > 0 ? Math.round((activeStudents / courses.length) * 100) : 0;

  const handleViewCurriculum = (course: Course) => {
    setSelectedCourse(course);
    setShowCurriculumModal(true);
  };

  const closeCurriculumModal = () => {
    setShowCurriculumModal(false);
    setSelectedCourse(null);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Academy Management
          </h1>
          <p className="text-gray-600 text-sm">Manage courses, enrollments, and learning progress</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 hover:shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Courses</p>
                <p className="text-lg font-bold text-gray-900">{courses.length}</p>
                <p className="text-xs text-gray-500">Available courses</p>
              </div>
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Enrollments</p>
                <p className="text-lg font-bold text-gray-900">{totalEnrollments.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total students</p>
              </div>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Active Courses</p>
                <p className="text-lg font-bold text-gray-900">{activeStudents}</p>
                <p className="text-xs text-gray-500">Currently active</p>
              </div>
              <Play className="w-5 h-5 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Active Rate</p>
                <p className="text-lg font-bold text-gray-900">{completionRate}%</p>
                <p className="text-xs text-gray-500">Active courses</p>
              </div>
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>


        {/* Filters and Search */}
        <div className="bg-white rounded shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
              <div className="flex items-center space-x-2">
                <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Filter className="w-3 h-3 mr-1" />
                  Show Filters
                </button>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="technical">Technical</option>
                  <option value="business">Business</option>
                  <option value="safety">Safety</option>
                  <option value="certification">Certification</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Courses</h3>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => fetchCourses(pagination.page)}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrollments
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center">
                    <div className="text-center">
                      <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No courses found</h3>
                      <p className="text-xs text-gray-500">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course, index) => (
                  <tr key={course._id || index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="flex items-center">
                        <div className="h-8 w-8 flex-shrink-0">
                          <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-xs font-medium text-gray-900">
                            {course.title}
                          </div>
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {course.description}
                          </div>
                          <div className="flex items-center mt-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-purple-600 bg-purple-100">
                              {course.category}
                            </span>
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-blue-600 bg-blue-100">
                              {course.level}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div>
                        <div className="text-xs font-medium text-gray-900">
                          {course.instructor?.firstName} {course.instructor?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          Instructor
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 text-gray-400 mr-1" />
                        <div>
                          <div className="text-xs font-medium">
                            {course.duration?.hours}h
                          </div>
                          <div className="text-xs text-gray-500">
                            {course.duration?.weeks} weeks
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div>
                        <div className="text-xs font-medium text-gray-900">
                          ${course.pricing?.regularPrice}
                        </div>
                        <div className="text-xs text-gray-500">
                          {course.pricing?.currency}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div>
                        <div className="text-xs font-medium text-gray-900">
                          {course.enrollment?.current || 0}
                        </div>
                        <div className="text-xs text-gray-500">
                          {course.enrollment?.isOpen ? 'Open' : 'Closed'}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="ml-1 text-xs text-gray-500">
                          {course.rating?.average || 0}
                        </span>
                        <span className="ml-1 text-xs text-gray-400">
                          ({course.rating?.count || 0})
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          course.isActive 
                            ? 'text-green-600 bg-green-100' 
                            : 'text-red-600 bg-red-100'
                        }`}>
                          {course.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {course.certification?.isAvailable && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-blue-600 bg-blue-100">
                            Certificate
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleViewCurriculum(course)}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          title="View Curriculum"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          <Edit className="w-3 h-3" />
                        </button>
                        <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
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
          
          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-700">
                  <span>
                    Showing {pagination.count} of {pagination.total} courses
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchCourses(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3 h-3 mr-1" />
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(pagination.pages - 4, pagination.page - 2)) + i;
                      if (pageNum > pagination.pages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => fetchCourses(pageNum)}
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            pageNum === pagination.page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => fetchCourses(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Curriculum Modal */}
        {showCurriculumModal && selectedCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Course Curriculum: {selectedCourse.title}
                </h3>
                <button
                  onClick={closeCurriculumModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Course Overview */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Instructor</h4>
                      <p className="text-sm text-gray-900">
                        {selectedCourse.instructor?.firstName} {selectedCourse.instructor?.lastName}
                      </p>
                      {selectedCourse.instructor?.profile?.bio && (
                        <p className="text-xs text-gray-600 mt-1">
                          {selectedCourse.instructor.profile.bio}
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Duration</h4>
                      <p className="text-sm text-gray-900">
                        {selectedCourse.duration?.hours} hours over {selectedCourse.duration?.weeks} weeks
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Level</h4>
                      <p className="text-sm text-gray-900 capitalize">{selectedCourse.level}</p>
                    </div>
                  </div>
                  
                  {selectedCourse.learningOutcomes && selectedCourse.learningOutcomes.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Learning Outcomes</h4>
                      <ul className="text-sm text-gray-900 space-y-1">
                        {selectedCourse.learningOutcomes.map((outcome, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {outcome}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Curriculum Modules */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Curriculum</h4>
                  {selectedCourse.curriculum && selectedCourse.curriculum.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCourse.curriculum.map((module, moduleIndex) => (
                        <div key={module._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-md font-medium text-gray-900">
                              Module {moduleIndex + 1}: {module.module}
                            </h5>
                            <span className="text-xs text-gray-500">
                              {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            {module.lessons.map((lesson) => (
                              <div key={lesson._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center">
                                  {lesson.type === 'video' ? (
                                    <Video className="w-4 h-4 text-blue-500 mr-2" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-gray-500 mr-2" />
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                                    <p className="text-xs text-gray-500">{lesson.description}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">
                                    {lesson.duration} min
                                  </span>
                                  {lesson.isFree && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-100">
                                      Free
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No curriculum available for this course.</p>
                  )}
                </div>

                {/* Certification Info */}
                {selectedCourse.certification?.isAvailable && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-md font-medium text-blue-900 mb-2">Certification Available</h4>
                    <p className="text-sm text-blue-800">
                      <strong>{selectedCourse.certification.name}</strong> by {selectedCourse.certification.issuer}
                    </p>
                    {selectedCourse.certification.requirements && selectedCourse.certification.requirements.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-blue-900">Requirements:</p>
                        <ul className="text-sm text-blue-800 mt-1">
                          {selectedCourse.certification.requirements.map((req, index) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle className="w-3 h-3 text-blue-600 mr-1 mt-0.5 flex-shrink-0" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end p-4 border-t border-gray-200">
                <button
                  onClick={closeCurriculumModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
