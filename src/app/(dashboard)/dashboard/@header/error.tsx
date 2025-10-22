"use client";

import { SectionError } from "@/components/ui/error";

export default function HeaderError() {
  return (
    <div className="mb-8">
      <SectionError 
        title="Failed to load header"
        message="We couldn't load the dashboard header. This might be a temporary issue."
      />
    </div>
  );
}
