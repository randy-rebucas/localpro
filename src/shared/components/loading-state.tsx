"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  fullScreen = false,
  className = "",
}: LoadingStateProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? "min-h-screen" : "py-12"} ${className}`}>
      <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  );

  if (fullScreen) {
    return content;
  }

  return <Card className="p-8">{content}</Card>;
}

