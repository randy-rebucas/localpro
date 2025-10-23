"use client";

import React from "react";
// import { Shield, Activity, Megaphone, Package } from "lucide-react";

interface LoadingStateProps {
  type?: "dashboard" | "services" | "activity" | "announcements" | "header" | "stats";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const getLoadingContent = (type: string, size: string) => {
  const sizeClasses = {
    sm: "h-32",
    md: "h-64", 
    lg: "h-96"
  };


  switch (type) {
    case "dashboard":
      return (
        <div className={`${sizeClasses[size as keyof typeof sizeClasses]} bg-white rounded-2xl shadow-sm p-6 animate-pulse`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl p-4">
                <div className="w-8 h-8 bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      );

    case "services":
      return (
        <div className={`${sizeClasses[size as keyof typeof sizeClasses]} bg-white rounded-2xl shadow-sm p-6 animate-pulse`}>
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
                  <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="h-3 bg-gray-200 rounded w-1/2"></div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "activity":
      return (
        <div className={`${sizeClasses[size as keyof typeof sizeClasses]} bg-white rounded-2xl shadow-sm p-6 animate-pulse`}>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="space-y-1">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "announcements":
      return (
        <div className={`${sizeClasses[size as keyof typeof sizeClasses]} bg-white rounded-2xl shadow-sm p-6 animate-pulse`}>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="space-y-1">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border-l-4 border-gray-200 bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "header":
      return (
        <div className={`${sizeClasses[size as keyof typeof sizeClasses]} bg-white rounded-2xl shadow-sm p-6 animate-pulse`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      );

    case "stats":
      return (
        <div className={`${sizeClasses[size as keyof typeof sizeClasses]} bg-white rounded-2xl shadow-sm p-6 animate-pulse`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div className={`${sizeClasses[size as keyof typeof sizeClasses]} bg-white rounded-2xl shadow-sm p-6 animate-pulse`}>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      );
  }
};

export default function LoadingState({ 
  type = "dashboard", 
  size = "md", 
  className = "" 
}: LoadingStateProps) {
  return (
    <div className={className}>
      {getLoadingContent(type, size)}
    </div>
  );
}

// Specialized loading components
export function DashboardLoadingState() {
  return (
    <div className="space-y-6">
      <LoadingState type="header" size="md" />
      <LoadingState type="services" size="lg" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoadingState type="announcements" size="md" />
        <LoadingState type="activity" size="md" />
      </div>
    </div>
  );
}

export function ServicesLoadingState() {
  return <LoadingState type="services" size="lg" />;
}

export function ActivityLoadingState() {
  return <LoadingState type="activity" size="md" />;
}

export function AnnouncementsLoadingState() {
  return <LoadingState type="announcements" size="md" />;
}

export function HeaderLoadingState() {
  return <LoadingState type="header" size="md" />;
}

export function StatsLoadingState() {
  return <LoadingState type="stats" size="md" />;
}
