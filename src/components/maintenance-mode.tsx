"use client";

import { useAppSettings } from "@/hooks/useAppSettings";
import { AlertCircle, Clock } from "lucide-react";

export function MaintenanceMode() {
  const { settings } = useAppSettings();

  if (!settings?.general?.maintenanceMode?.enabled) {
    return null;
  }

  const maintenanceMode = settings.general.maintenanceMode;
  const estimatedEndTime = maintenanceMode.estimatedEndTime
    ? new Date(maintenanceMode.estimatedEndTime)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-8">
        <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
          Maintenance Mode
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {maintenanceMode.message || "The app is currently under maintenance. Please try again later."}
        </p>
        {estimatedEndTime && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
            <Clock className="w-4 h-4" />
            <span>
              Estimated completion: {estimatedEndTime.toLocaleString()}
            </span>
          </div>
        )}
        <div className="text-center text-sm text-gray-500">
          We apologize for any inconvenience. Thank you for your patience.
        </div>
      </div>
    </div>
  );
}

