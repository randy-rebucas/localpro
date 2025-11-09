"use client";

import React from "react";
import { Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
  gridCols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export function DataGrid<T>({
  items,
  renderItem,
  viewMode = "grid",
  onViewModeChange,
  loading = false,
  emptyMessage = "No items found",
  emptyIcon,
  className = "",
  gridCols = { mobile: 1, tablet: 2, desktop: 3 }
}: DataGridProps<T>) {
  if (loading) {
    return (
      <div className={`grid grid-cols-${gridCols.mobile} md:grid-cols-${gridCols.tablet} lg:grid-cols-${gridCols.desktop} gap-6 ${className}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-64"></div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        {emptyIcon}
        <p className="text-gray-600 mt-4">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {onViewModeChange && (
        <div className="flex justify-end mb-4 gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange("grid")}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div
        className={
          viewMode === "grid"
            ? `grid grid-cols-${gridCols.mobile} md:grid-cols-${gridCols.tablet} lg:grid-cols-${gridCols.desktop} gap-6`
            : "space-y-4"
        }
      >
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {renderItem(item, index)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

