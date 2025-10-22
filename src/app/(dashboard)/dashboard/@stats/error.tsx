"use client";

import { SectionError } from "@/components/ui/error";

export default function StatsError() {
  return (
    <div className="lg:col-span-2">
      <SectionError 
        title="Failed to load statistics"
        message="We couldn't load your dashboard statistics. This might be a temporary issue."
      />
    </div>
  );
}
