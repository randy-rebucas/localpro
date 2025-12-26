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

  const getSkillId = (skill: ProviderSkill): string => {
    // Prefer _id (ObjectId) over id, only use name as last resort
    return skill._id || skill.id || skill.name;
  };

  const isSelected = (skill: ProviderSkill): boolean => {
    const skillId = getSkillId(skill);
    return selectedSkills.includes(skillId);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Clear all button */}
      {showClearButton && selectedSkills.length > 0 && (
        <button
          onClick={onClearAll}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors border border-gray-300"
          aria-label="Clear all selected skills"
        >
          <X className="w-4 h-4" />
          Clear ({selectedSkills.length})
        </button>
      )}

      {/* Skills badges */}
      {visibleSkills.map((skill) => {
        // Ensure we use ID for query params - prefer _id (ObjectId) over id, only use name as last resort
        const skillId = getSkillId(skill);
        const selected = isSelected(skill);
        const categoryColor = getCategoryColor(skill);
        const icon = skill.metadata?.icon;

        return (
          <button
            key={skillId}
            onClick={() => {
              // Always pass the ID - prefer _id (ObjectId) for API queries
              onSkillToggle(skillId);
            }}
            className={cn(
              "group inline-flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold rounded-full transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-1",
              selected
                ? "bg-gradient-to-r from-accent to-accent text-white shadow-lg shadow-green-500/30 border-2 border-accent"
                : "bg-white text-gray-700 border border-gray-200 hover:border-accent hover:bg-accent/5 hover:shadow-md"
            )}
            style={
              selected
                ? {
                    background: `linear-gradient(to right, ${categoryColor}, ${categoryColor}dd)`,
                    borderColor: categoryColor,
                    boxShadow: `0 10px 15px -3px ${categoryColor}30`,
                  }
                : undefined
            }
            aria-label={`${selected ? "Deselect" : "Select"} skill: ${skill.name}`}
            aria-pressed={selected}
          >
            {icon && (
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200",
                selected ? "bg-white/20" : "bg-gray-100 group-hover:bg-accent/10"
              )}>
                <span className="text-base">{icon}</span>
              </div>
            )}
            <span>{skill.name}</span>
            {selected && (
              <X className="w-4 h-4 opacity-80" />
            )}
          </button>
        );
      })}

      {/* Show more indicator */}
      {hasMore && (
        <span className="text-sm text-gray-500 px-2">
          +{sortedSkills.length - (maxVisible || 0)} more
        </span>
      )}
    </div>
  );
}

