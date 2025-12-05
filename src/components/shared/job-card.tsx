"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Briefcase, Building2, Heart, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Job } from "@/types/jobs";
import { formatCurrency } from "@/lib/currency-utils";

interface JobCardProps {
  job: Job;
  viewMode?: "grid" | "list";
  onApply?: (jobId: string) => void;
}

export function JobCard({ job, viewMode = "list", onApply }: JobCardProps) {
  const router = useRouter();
  const isGrid = viewMode === "grid";

  return (
    <Card className={`overflow-hidden hover:shadow-xl hover:border-emerald-500/50 transition-all group relative ${isGrid ? "flex flex-col h-full" : "flex flex-row items-stretch"}`}>
      {/* Favorite Icon - Top Right */}
      <div className="absolute top-3 right-3 z-10">
        <div className="bg-slate-800 rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-slate-700">
          <Heart className="w-4 h-4 text-pink-400" />
        </div>
      </div>

      {/* Company Logo/Image */}
      <div className={`relative ${isGrid ? 'w-full h-48' : 'w-48 flex-shrink-0'} bg-slate-800 overflow-hidden ${isGrid ? '' : 'self-stretch'} flex items-center justify-center`}>
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
          <ImageIcon className="w-12 h-12 text-slate-600 mb-2" />
          <span className="text-xs text-slate-500 text-center px-2">No Image</span>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 p-4 flex flex-col ${isGrid ? 'min-h-0' : 'justify-between'}`}>
        <div>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold text-white">{job.title}</h3>
                {job.status && (
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    job.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                    job.status === "paused" ? "bg-amber-500/20 text-amber-400" :
                    "bg-slate-700 text-slate-400"
                  }`}>
                    {job.status}
                  </span>
                )}
              </div>
              
              {/* Company Name */}
              {job.company?.name && (
                <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-1">
                  <Building2 className="w-3 h-3" />
                  <span>{job.company.name}</span>
                </div>
              )}
              
              {/* Location */}
              {job.company?.location && (
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
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
            <p className="text-sm text-slate-400 line-clamp-2 mb-3">{job.description}</p>
          )}

          {/* Job Tags - Category, Type, Experience */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {job.category && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-medium">
                {typeof job.category === 'object' ? job.category.name : job.category}
              </span>
            )}
            {job.jobType && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md font-medium">
                {job.jobType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            )}
            {job.experienceLevel && (
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-md font-medium">
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
                  className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700"
                >
                  {skill}
                </span>
              ))}
              {job.requirements.skills.length > 3 && (
                <span className="text-xs text-slate-500 px-2 py-0.5">
                  +{job.requirements.skills.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Section - Salary and Actions */}
        <div className={isGrid ? 'mt-auto pt-4 border-t border-slate-800' : 'flex items-end justify-between gap-4'}>
          {/* Left Side - Salary */}
          <div className={isGrid ? 'w-full' : 'flex items-center gap-4 flex-wrap'}>
            {job.salary && (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className={`${isGrid ? 'text-2xl' : 'text-xl'} font-bold text-emerald-400`}>
                    {formatCurrency(job.salary.min || 0, 'PHP')}
                    {job.salary.max && ` - ${formatCurrency(job.salary.max, 'PHP')}`}
                  </span>
                  {job.salary.period && (
                    <span className="text-xs text-slate-500">/{job.salary.period}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - CTA Buttons */}
          <div className={`flex ${isGrid ? 'flex-col gap-2 w-full' : 'gap-2 flex-shrink-0'}`}>
            <button 
              onClick={() => router.push(`/jobs/${job._id}`)}
              className={`${isGrid ? 'w-full' : ''} px-4 py-2.5 bg-slate-800 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700 hover:text-white active:bg-slate-600 transition-all`}
            >
              View Details
            </button>
            {onApply && job.status === "active" && (
              <button 
                onClick={() => onApply(job._id || "")}
                className={`${isGrid ? 'w-full' : ''} px-4 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 active:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1`}
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

