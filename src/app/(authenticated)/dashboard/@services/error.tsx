"use client";

import { SectionError } from "@/components/ui/error";

export default function ServicesError() {
  return (
    <div className="mb-8">
      <SectionError 
        title="Failed to load services"
        message="We couldn't load the service modules. This might be a temporary issue."
      />
    </div>
  );
}
