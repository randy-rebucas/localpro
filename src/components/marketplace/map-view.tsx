"use client";

import React from "react";
import { Map } from "lucide-react";

export function MapView() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[600px] flex items-center justify-center">
      <div className="text-center">
        <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Map view coming soon</p>
      </div>
    </div>
  );
}

