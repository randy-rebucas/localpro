"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Briefcase, Building2, Heart, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Job } from "@/types/jobs";

interface JobCardProps {
  job: Job;
  viewMode?: "grid" | "list";
  onApply?: (jobId: string) => void;
}

export function JobCard({ job, viewMode = "list", onApply }: JobCardProps) {
  const router = useRouter();
  const isGrid = viewMode === "grid";

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow group relative ${isGrid ? "flex flex-col h-full" : "flex flex-row items-stretch"}`}>
      {/* Favorite Icon - Top Right */}
      <div className="absolute top-3 right-3 z-10">
        <div className="bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <Heart className="w-4 h-4 text-pink-500" />
        </div>
      </div>

      {/* Company Logo/Image */}
      <div className={`relative ${isGrid ? 'w-full h-48' : 'w-48 flex-shrink-0'} bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden ${isGrid ? '' : 'self-stretch'} flex items-center justify-center`}>
        {job.company?.logo?.url ? (
          <Image 
            src={job.company.logo.url} 
            alt={job.company.name || "Company logo"}
            fill
            className="object-cover"
            sizes="192px"
            unoptimized={job.company.logo.url.startsWith('http://localhost') || !job.company.logo.url.startsWith('http')}
          />
        ) : null}
        <div 
          className={`image-placeholder w-full h-full flex flex-col items-center justify-center ${isGrid ? 'h-48' : 'min-h-[12rem]'} ${job.company?.logo?.url ? 'hidden' : 'flex'}`}
        >
          <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
          <span className="text-xs text-gray-500 text-center px-2">No Image</span>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 p-4 flex flex-col ${isGrid ? 'min-h-0' : 'justify-between'}`}>
        <div>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold text-gray-900">{job.title}</h3>
                {job.status && (
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    job.status === "active" ? "bg-green-100 text-green-800" :
                    job.status === "paused" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {job.status}
                  </span>
                )}
              </div>
              
              {/* Company Name */}
              {job.company?.name && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                  <Building2 className="w-3 h-3" />
                  <span>{job.company.name}</span>
                </div>
              )}
              
              {/* Location */}
              {job.company?.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <MapPin className="w-3 h-3" />
                  <span>
                    {job.company.location.city}, {job.company.location.state}
                    {job.isRemote && " (Remote)"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{job.description}</p>
          )}

          {/* Job Tags - Category, Type, Experience */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {job.category && (
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-md font-medium">
                {String(job.category)}
              </span>
            )}
            {job.jobType && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                {job.jobType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            )}
            {job.experienceLevel && (
              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-medium">
                {job.experienceLevel.replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            )}
          </div>

          {/* Skills - Show first 2-3 skills */}
          {job.requirements?.skills && job.requirements.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {job.requirements.skills.slice(0, 3).map((skill: string, idx: number) => (
                <span
                  key={idx}
                  className="text-xs bg-gray-50 text-gray-700 px-2 py-0.5 rounded-md border border-gray-200"
                >
                  {skill}
                </span>
              ))}
              {job.requirements.skills.length > 3 && (
                <span className="text-xs text-gray-500 px-2 py-0.5">
                  +{job.requirements.skills.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Section - Salary and Actions */}
        <div className={isGrid ? 'mt-auto pt-4 border-t border-gray-100' : 'flex items-end justify-between gap-4'}>
          {/* Left Side - Salary */}
          <div className={isGrid ? 'w-full' : 'flex items-center gap-4 flex-wrap'}>
            {job.salary && (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className={`${isGrid ? 'text-2xl' : 'text-xl'} font-bold text-green-600`}>
                    ${job.salary.min?.toLocaleString()}
                    {job.salary.max && ` - $${job.salary.max.toLocaleString()}`}
                  </span>
                  {job.salary.period && (
                    <span className="text-xs text-gray-500">/{job.salary.period}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - CTA Buttons */}
          <div className={`flex ${isGrid ? 'flex-col gap-2 w-full' : 'gap-2 flex-shrink-0'}`}>
            <button 
              onClick={() => router.push(`/jobs/${job._id}`)}
              className={`${isGrid ? 'w-full' : ''} px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 active:bg-gray-300 transition-all`}
            >
              View Details
            </button>
            {onApply && job.status === "active" && (
              <button 
                onClick={() => onApply(job._id || "")}
                className={`${isGrid ? 'w-full' : ''} px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 active:bg-green-800 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1`}
              >
                <Briefcase className="w-4 h-4" />
                Apply Now
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

