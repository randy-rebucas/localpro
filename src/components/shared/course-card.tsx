"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Clock, Users, GraduationCap, Play, Heart, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Course } from "@/types/courses";

interface CourseCardProps {
  course: Course;
  viewMode?: "grid" | "list";
  onEnroll?: (courseId: string) => void;
  onFavorite?: (courseId: string) => void;
}

export function CourseCard({ course, viewMode = "list", onEnroll, onFavorite }: CourseCardProps) {
  const router = useRouter();
  const isGrid = viewMode === "grid";

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow group relative ${isGrid ? "flex flex-col h-full" : "flex flex-row"}`}>
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <button
          onClick={() => onFavorite?.(course._id || "")}
          className="bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className="w-4 h-4 text-pink-500" />
        </button>
        <button className="bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
          <Share2 className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className={isGrid ? "" : "flex gap-4 flex-1"}>
        {course.thumbnail && (
          <div className={isGrid ? "relative h-48 w-full" : "relative h-32 w-32 flex-shrink-0"}>
            <Image
              src={course.thumbnail.url || "/placeholder.png"}
              alt={course.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        {!course.thumbnail && (
          <div className={`${isGrid ? "relative h-48 w-full" : "relative h-32 w-32 flex-shrink-0"} bg-gray-200 flex items-center justify-center`}>
            <GraduationCap className="w-12 h-12 text-gray-400" />
          </div>
        )}

        <div className="p-4 flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
            </div>
            {course.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">{course.rating.average?.toFixed(1) || 0}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            {course.category && (
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {course.category}
              </span>
            )}
            {course.level && (
              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                {course.level}
              </span>
            )}
          </div>

          {course.duration && (
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{course.duration.hours} hours</span>
              </div>
              {course.enrollment && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{course.enrollment.current || 0} enrolled</span>
                </div>
              )}
            </div>
          )}

          {course.pricing && (
            <div className="mb-2">
              <div className="flex items-center gap-2">
                {course.pricing.discountedPrice ? (
                  <>
                    <span className="text-lg font-bold">${course.pricing.discountedPrice}</span>
                    <span className="text-sm text-gray-500 line-through">${course.pricing.regularPrice}</span>
                  </>
                ) : (
                  <span className="text-lg font-bold">${course.pricing.regularPrice}</span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/marketplace/courses/${course._id}`)}
            >
              View Details
            </Button>
            {onEnroll && (
              <Button
                size="sm"
                onClick={() => onEnroll(course._id || "")}
                className="flex items-center gap-1"
              >
                <Play className="w-4 h-4" />
                Enroll
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

