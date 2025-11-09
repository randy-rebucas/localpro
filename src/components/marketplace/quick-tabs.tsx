"use client";

import React from "react";

const quickTabs = [
  { id: "all", label: "All Services" },
  { id: "top-rated", label: "Top Rated" },
  { id: "nearby", label: "Nearby" },
  { id: "promos", label: "Promos" },
  { id: "new", label: "New Providers" },
];

interface QuickTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function QuickTabs({ activeTab, onTabChange }: QuickTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {quickTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === tab.id
              ? "bg-green-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

