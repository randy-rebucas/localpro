"use client";

import React, { useState } from "react";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: "select" | "multiselect" | "range" | "checkbox" | "search";
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
}

interface FilterPanelProps {
  filters: FilterGroup[];
  values: Record<string, unknown>;
  onChange: (filterId: string, value: unknown) => void;
  onReset?: () => void;
  className?: string;
}

export function FilterPanel({ filters, values, onChange, onReset, className = "" }: FilterPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(filters.map(f => f.id)));
  const [isOpen, setIsOpen] = useState(false);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const activeFilterCount = Object.values(values).filter(v => 
    v !== undefined && v !== null && v !== "" && 
    (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  return (
    <div className={className}>
      {/* Mobile Filter Toggle */}
      <div className="md:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                {activeFilterCount}
              </span>
            )}
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {/* Filter Panel */}
      <Card className={`p-4 ${isOpen ? "block" : "hidden md:block"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Filters</h3>
          {onReset && activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              <X className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {filters.map((filter) => (
            <div key={filter.id} className="border-b last:border-b-0 pb-4 last:pb-0">
              <button
                onClick={() => toggleGroup(filter.id)}
                className="w-full flex items-center justify-between mb-2"
              >
                <span className="font-medium text-sm">{filter.label}</span>
                {expandedGroups.has(filter.id) ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {expandedGroups.has(filter.id) && (
                <div className="mt-2">
                  {filter.type === "select" && filter.options && (
                    <Select
                      value={values[filter.id] || ""}
                      onChange={(e) => onChange(filter.id, e.target.value)}
                      options={[
                        { value: "", label: "All" },
                        ...filter.options
                      ]}
                    />
                  )}

                  {filter.type === "multiselect" && filter.options && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filter.options.map((option) => (
                        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(values[filter.id] || []).includes(option.value)}
                            onChange={(e) => {
                              const current = values[filter.id] || [];
                              const newValue = e.target.checked
                                ? [...current, option.value]
                                : current.filter((v: string) => v !== option.value);
                              onChange(filter.id, newValue);
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {filter.type === "range" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={values[filter.id]?.min || ""}
                          onChange={(e) => onChange(filter.id, {
                            ...(values[filter.id] || {}),
                            min: e.target.value ? Number(e.target.value) : undefined
                          })}
                          min={filter.min}
                          max={filter.max}
                          step={filter.step}
                        />
                        <span className="text-gray-500">-</span>
                        <Input
                          type="number"
                          placeholder="Max"
                          value={values[filter.id]?.max || ""}
                          onChange={(e) => onChange(filter.id, {
                            ...(values[filter.id] || {}),
                            max: e.target.value ? Number(e.target.value) : undefined
                          })}
                          min={filter.min}
                          max={filter.max}
                          step={filter.step}
                        />
                      </div>
                    </div>
                  )}

                  {filter.type === "search" && (
                    <Input
                      type="text"
                      placeholder={`Search ${filter.label.toLowerCase()}...`}
                      value={values[filter.id] || ""}
                      onChange={(e) => onChange(filter.id, e.target.value)}
                    />
                  )}

                  {filter.type === "checkbox" && filter.options && (
                    <div className="space-y-2">
                      {filter.options.map((option) => (
                        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={values[filter.id] === option.value}
                            onChange={(e) => onChange(filter.id, e.target.checked ? option.value : undefined)}
                            className="rounded"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

