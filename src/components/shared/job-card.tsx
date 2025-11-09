"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Briefcase, DollarSign, Building2, Heart, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Job } from "@/types/jobs";

interface JobCardProps {
  job: Job;
  viewMode?: "grid" | "list";
  onApply?: (jobId: string) => void;
  onFavorite?: (jobId: string) => void;
}

export function JobCard({ job, viewMode = "list", onApply, onFavorite }: JobCardProps) {
  const router = useRouter();
  const isGrid = viewMode === "grid";

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow group relative ${isGrid ? "flex flex-col h-full" : "flex flex-row"}`}>
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <button
          onClick={() => onFavorite?.(job._id || "")}
          className="bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className="w-4 h-4 text-pink-500" />
        </button>
        <button className="bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
          <Share2 className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className={isGrid ? "" : "flex gap-4 flex-1"}>
        {job.company?.logo && (
          <div className={isGrid ? "relative h-48 w-full" : "relative h-32 w-32 flex-shrink-0"}>
            <Image
              src={job.company.logo.url || "/placeholder.png"}
              alt={job.company.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        {!job.company?.logo && (
          <div className={`${isGrid ? "relative h-48 w-full" : "relative h-32 w-32 flex-shrink-0"} bg-gray-200 flex items-center justify-center`}>
            <Building2 className="w-12 h-12 text-gray-400" />
          </div>
        )}

        <div className="p-4 flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
              <p className="text-sm text-gray-600 mb-1">{job.company.name}</p>
              <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
            </div>
            {job.status && (
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                job.status === "active" ? "bg-green-100 text-green-800" :
                job.status === "paused" ? "bg-yellow-100 text-yellow-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {job.status}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            {job.category && (
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {job.category}
              </span>
            )}
            {job.jobType && (
              <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                {job.jobType.replace("_", " ")}
              </span>
            )}
            {job.experienceLevel && (
              <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                {job.experienceLevel}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
            {job.company?.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>
                  {job.company.location.city}, {job.company.location.state}
                  {job.isRemote && " (Remote)"}
                </span>
              </div>
            )}
            {job.salary && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>
                  ${job.salary.min?.toLocaleString()}
                  {job.salary.max && ` - $${job.salary.max.toLocaleString()}`}
                  {job.salary.period && `/${job.salary.period}`}
                </span>
              </div>
            )}
          </div>

          {job.requirements?.skills && job.requirements.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {job.requirements.skills.slice(0, 3).map((skill: string, idx: number) => (
                <span key={idx} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  {skill}
                </span>
              ))}
              {job.requirements.skills.length > 3 && (
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                  +{job.requirements.skills.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/marketplace/jobs/${job._id}`)}
            >
              View Details
            </Button>
            {onApply && job.status === "active" && (
              <Button
                size="sm"
                onClick={() => onApply(job._id || "")}
                className="flex items-center gap-1"
              >
                <Briefcase className="w-4 h-4" />
                Apply Now
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

