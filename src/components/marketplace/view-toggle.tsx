"use client";

import React from "react";
import { Grid3x3, Map } from "lucide-react";

interface ViewToggleProps {
  viewMode: "grid" | "map";
  onViewChange: (mode: "grid" | "map") => void;
}

export function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
      <button
        onClick={() => onViewChange("grid")}
        className={`p-2 rounded-md transition-colors ${
          viewMode === "grid"
            ? "bg-accent/10 text-accent"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        title="Grid View"
        aria-label="Grid View"
      >
        <Grid3x3 className="w-5 h-5" />
      </button>
      <button
        onClick={() => onViewChange("map")}
        className={`p-2 rounded-md transition-colors ${
          viewMode === "map"
            ? "bg-accent/10 text-accent"
            : "text-gray-600 hover:bg-gray-100"
        }`}
        title="Map View"
        aria-label="Map View"
      >
        <Map className="w-5 h-5" />
      </button>
    </div>
  );
}

