"use client";

import React from "react";
import { useProviderSkills } from "@/hooks/useProviderSkills";
import { SkillsBadgeFilter } from "./skills-badge-filter";

interface SkillsCarouselProps {
  category: string | null;
  selectedSkills: string[];
  onSkillToggle: (skillId: string) => void;
  onClearSkills: () => void;
  className?: string;
}

export function SkillsCarousel({
  category,
  selectedSkills,
  onSkillToggle,
  onClearSkills,
  className = "",
}: SkillsCarouselProps) {
  // Fetch skills for the selected category
  const { skills, loading: skillsLoading, error: skillsError } = useProviderSkills(
    category && category.trim() !== '' ? category : null
  );

  // Don't render if no category is selected
  if (!category || category.trim() === '') {
    return null;
  }

  return (
    <div className={`bg-white rounded-xl p-3 lg:p-4 shadow-sm border border-gray-200 ${className}`}>
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-0.5">Filter by Skills</h3>
        <p className="text-xs text-gray-500">
          Select skills to find providers with specific expertise
        </p>
      </div>
      <SkillsBadgeFilter
        skills={skills}
        selectedSkills={selectedSkills}
        onSkillToggle={onSkillToggle}
        onClearAll={onClearSkills}
        loading={skillsLoading}
        error={skillsError}
      />
    </div>
  );
}

