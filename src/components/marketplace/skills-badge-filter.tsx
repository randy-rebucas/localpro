"use client";

import React from "react";
import { X, Loader2 } from "lucide-react";
import { ProviderSkill } from "@/hooks/useProviderSkills";
import { cn } from "@/lib/utils";

interface SkillsBadgeFilterProps {
  skills: ProviderSkill[];
  selectedSkills: string[];
  onSkillToggle: (skillId: string) => void;
  onClearAll: () => void;
  loading?: boolean;
  error?: string | null;
  className?: string;
  showClearButton?: boolean;
  maxVisible?: number;
}

export function SkillsBadgeFilter({
  skills,
  selectedSkills,
  onSkillToggle,
  onClearAll,
  loading = false,
  error = null,
  className = "",
  showClearButton = true,
  maxVisible,
}: SkillsBadgeFilterProps) {
  // Sort skills by displayOrder if available, otherwise by name
  const sortedSkills = [...skills].sort((a, b) => {
    if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
      return a.displayOrder - b.displayOrder;
    }
    if (a.displayOrder !== undefined) return -1;
    if (b.displayOrder !== undefined) return 1;
    return a.name.localeCompare(b.name);
  });
  
  // Limit visible skills if maxVisible is set
  const visibleSkills = maxVisible ? sortedSkills.slice(0, maxVisible) : sortedSkills;
  const hasMore = maxVisible ? sortedSkills.length > maxVisible : false;

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-gray-600", className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading skills...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-sm text-red-600", className)}>
        {error}
      </div>
    );
  }

  if (skills.length === 0 && !loading && !error) {
    return (
      <div className={cn("text-sm text-gray-500", className)}>
        No skills available for this category.
      </div>
    );
  }

  const getCategoryColor = (skill: ProviderSkill): string => {
    // Try to get color from category metadata
    if (typeof skill.category === 'object' && skill.category?.metadata?.color) {
      return skill.category.metadata.color;
    }
    // Default color
    return "#4CAF50";
  };

  const isSelected = (skill: ProviderSkill): boolean => {
    // Check against both id and _id to handle different API response formats
    const skillId = skill.id || skill._id || skill.name;
    return Boolean(
      (skillId && selectedSkills.includes(skillId)) || 
      (skill.id && selectedSkills.includes(skill.id)) ||
      (skill._id && selectedSkills.includes(skill._id))
    );
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Clear all button */}
      {showClearButton && selectedSkills.length > 0 && (
        <button
          onClick={onClearAll}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors border border-gray-300"
          aria-label="Clear all selected skills"
        >
          <X className="w-3 h-3" />
          Clear ({selectedSkills.length})
        </button>
      )}

      {/* Skills badges */}
      {visibleSkills.map((skill) => {
        // Ensure we use ID for query params - prefer id or _id, only use name as last resort
        const skillId = skill.id || skill._id || skill.name;
        const selected = isSelected(skill);
        const categoryColor = getCategoryColor(skill);
        const icon = skill.metadata?.icon;

        return (
          <button
            key={skillId}
            onClick={() => {
              // Always pass the ID (id or _id) if available, otherwise name
              const idToUse = skill.id || skill._id || skill.name;
              onSkillToggle(idToUse);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all",
              "focus:outline-none focus:ring-2 focus:ring-offset-1",
              selected
                ? "bg-green-100 text-green-800 border-2 border-green-500 shadow-sm"
                : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            )}
            style={
              selected
                ? {
                    borderColor: categoryColor,
                    backgroundColor: `${categoryColor}15`,
                    color: categoryColor,
                  }
                : undefined
            }
            aria-label={`${selected ? "Deselect" : "Select"} skill: ${skill.name}`}
            aria-pressed={selected}
          >
            {icon && <span className="text-sm">{icon}</span>}
            <span>{skill.name}</span>
            {selected && (
              <X className="w-3 h-3 opacity-70" />
            )}
          </button>
        );
      })}

      {/* Show more indicator */}
      {hasMore && (
        <span className="text-xs text-gray-500 px-2">
          +{sortedSkills.length - (maxVisible || 0)} more
        </span>
      )}
    </div>
  );
}

