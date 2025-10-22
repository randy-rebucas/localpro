"use client";

import { SectionError } from "@/components/ui/error";

export default function ActivityError() {
  return (
    <div className="lg:col-span-1">
      <SectionError 
        title="Failed to load activity"
        message="We couldn't load your recent activity. This might be a temporary issue."
      />
    </div>
  );
}
