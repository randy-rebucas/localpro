"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Star,
  Clock,
  Users,
  GraduationCap,
  Play,
  CheckCircle2,
  Award,
  BookOpen,
  Heart,
  Share2,
  Edit
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Course } from "@/types/courses";
import { useSession } from "@/hooks/useAuth";

interface CourseDetailProps {
  course: Course;
  onEnroll?: () => void;
  onEdit?: () => void;
  onFavorite?: () => void;
  enrollmentStatus?: "enrolled" | "in_progress" | "completed" | "dropped" | null;
}

export function CourseDetail({
  course,
  onEnroll,
  onEdit,
  onFavorite,
  enrollmentStatus,
}: CourseDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isInstructor = session?.user?.id === course.instructor;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Thumbnail */}
        <div className="md:w-1/2">
          {course.thumbnail ? (
            <div className="relative h-96 w-full rounded-lg overflow-hidden">
              <Image
                src={course.thumbnail.url || "/placeholder.png"}
                alt={course.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-96 w-full bg-gray-200 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-24 h-24 text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="md:w-1/2 space-y-4">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold">{course.title}</h1>
              <div className="flex gap-2">
                <button
                  onClick={onFavorite}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Heart className="w-5 h-5 text-pink-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <p className="text-gray-600">{course.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {course.category && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {course.category}
              </span>
            )}
            {course.level && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                {course.level}
              </span>
            )}
            {course.certification?.isAvailable && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-1">
                <Award className="w-3 h-3" />
                Certificate Available
              </span>
            )}
          </div>

          {course.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(course.rating?.average || 0)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="font-semibold">{course.rating.average?.toFixed(1)}</span>
              <span className="text-gray-600">
                ({course.rating.count || 0} reviews)
              </span>
            </div>
          )}

          {course.pricing && (
            <div className="flex items-baseline gap-2">
              {course.pricing.discountedPrice ? (
                <>
                  <span className="text-3xl font-bold">
                    ${course.pricing.discountedPrice}
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    ${course.pricing.regularPrice}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold">
                  ${course.pricing.regularPrice}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-gray-600">
            {course.duration && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{course.duration.hours} hours</span>
                {course.duration.weeks && <span>({course.duration.weeks} weeks)</span>}
              </div>
            )}
            {course.enrollment && (
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>
                  {course.enrollment.current || 0} / {course.enrollment.maxCapacity || "∞"} enrolled
                </span>
              </div>
            )}
          </div>

          {enrollmentStatus && (
            <div className={`px-4 py-2 rounded-lg ${
              enrollmentStatus === "completed" ? "bg-green-100 text-green-800" :
              enrollmentStatus === "in_progress" ? "bg-blue-100 text-blue-800" :
              "bg-gray-100 text-gray-800"
            }`}>
              <span className="font-semibold capitalize">{enrollmentStatus.replace("_", " ")}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {onEnroll && !isInstructor && !enrollmentStatus && (
              <Button onClick={onEnroll} size="lg" className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Enroll Now
              </Button>
            )}
            {onEdit && isInstructor && (
              <Button onClick={onEdit} variant="outline" size="lg" className="flex-1">
                <Edit className="w-4 h-4 mr-2" />
                Edit Course
              </Button>
            )}
            {enrollmentStatus === "enrolled" || enrollmentStatus === "in_progress" ? (
              <Button
                onClick={() => router.push(`/marketplace/courses/${course._id}`)}
                size="lg"
                className="flex-1"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Continue Learning
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {course.learningOutcomes && course.learningOutcomes.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Learning Outcomes</h2>
            <ul className="space-y-2">
              {course.learningOutcomes.map((outcome, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {course.prerequisites && course.prerequisites.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Prerequisites</h2>
            <ul className="space-y-2">
              {course.prerequisites.map((prerequisite, index) => (
                <li key={index} className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span>{prerequisite}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {course.certification && course.certification.isAvailable && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Certification
            </h2>
            <div className="space-y-2">
              <p className="font-semibold">{course.certification.name}</p>
              <p className="text-sm text-gray-600">Issued by: {course.certification.issuer}</p>
              {course.certification.validity && (
                <p className="text-sm text-gray-600">
                  Valid for {course.certification.validity} {course.certification.validity === 1 ? "year" : "years"}
                </p>
              )}
            </div>
          </Card>
        )}

        {course.enrollment && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Enrollment</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Enrollment</span>
                <span className="font-semibold">
                  {course.enrollment.current || 0} / {course.enrollment.maxCapacity || "∞"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`font-semibold ${
                  course.enrollment.isOpen ? "text-green-600" : "text-red-600"
                }`}>
                  {course.enrollment.isOpen ? "Open" : "Closed"}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Curriculum */}
      {course.curriculum && course.curriculum.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Curriculum</h2>
          <div className="space-y-4">
            {course.curriculum.map((module, moduleIndex) => (
              <div key={moduleIndex} className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold mb-2">{module.module}</h3>
                {module.lessons && module.lessons.length > 0 && (
                  <ul className="space-y-1 ml-4">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <li key={lessonIndex} className="flex items-center gap-2 text-sm text-gray-600">
                        <Play className="w-3 h-3" />
                        <span>
                          {lesson.title}
                          {lesson.duration && ` (${lesson.duration} min)`}
                          {lesson.isFree && (
                            <span className="ml-2 text-green-600">Free</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

