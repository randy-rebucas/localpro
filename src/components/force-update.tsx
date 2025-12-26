"use client";

import { useAppSettings } from "@/hooks/useAppSettings";
import { AlertCircle, Download } from "lucide-react";
import { useEffect, useState } from "react";

// This would typically come from your app's version system
const CURRENT_APP_VERSION = "1.0.0";

export function ForceUpdate() {
  const { settings } = useAppSettings();
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    if (!settings?.general?.forceUpdate?.enabled) {
      return;
    }

    const forceUpdate = settings.general.forceUpdate;
    const minVersion = forceUpdate.minVersion || "1.0.0";

    // Simple version comparison (you may want a more robust solution)
    const compareVersions = (current: string, minimum: string): boolean => {
      const currentParts = current.split(".").map(Number);
      const minimumParts = minimum.split(".").map(Number);

      for (let i = 0; i < Math.max(currentParts.length, minimumParts.length); i++) {
        const currentPart = currentParts[i] || 0;
        const minimumPart = minimumParts[i] || 0;

        if (currentPart < minimumPart) return true;
        if (currentPart > minimumPart) return false;
      }
      return false;
    };

    if (compareVersions(CURRENT_APP_VERSION, minVersion)) {
      setNeedsUpdate(true);
    }
  }, [settings]);

  if (!needsUpdate) {
    return null;
  }

  const forceUpdate = settings?.general?.forceUpdate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-8">
        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
          Update Required
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {forceUpdate?.message || "Please update to the latest version to continue using the app."}
        </p>
        <div className="space-y-3">
          <button
            onClick={() => {
              // Detect platform and redirect to appropriate app store
              const opera = 'opera' in window ? (window as { opera?: string }).opera : undefined;
              const userAgent = navigator.userAgent || navigator.vendor || opera || '';
              const msStream = 'MSStream' in window ? (window as { MSStream?: unknown }).MSStream : undefined;
              const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !msStream;
              const isAndroid = /android/i.test(userAgent);
              
              const appStoreUrl = isIOS 
                ? "https://apps.apple.com/app/localpro"
                : isAndroid
                ? "https://play.google.com/store/apps/details?id=com.localpro"
                : "https://apps.apple.com/app/localpro"; // Default to iOS
              
              window.location.href = appStoreUrl;
            }}
            className="w-full bg-accent hover:bg-accent/90 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Update Now
          </button>
          <p className="text-xs text-gray-500 text-center">
            Minimum version required: {forceUpdate?.minVersion || "1.0.0"}
          </p>
        </div>
      </div>
    </div>
  );
}

