"use client";

import { useEffect, useState } from "react";
import { isAuthenticated, redirectToLogin } from "@/lib/client-api-utils";
import { useSession } from "@/hooks/useAuth";
import { logger } from "@/lib/logger";

/**
 * Debug component to test redirect functionality
 * This can be temporarily added to any page to debug redirect issues
 */
export function RedirectDebugger() {
  const { data: session, status } = useSession();
  const [debugInfo, setDebugInfo] = useState<{
    status: string;
    hasSession: boolean;
    userId: string | undefined;
    isAuthenticated: boolean;
    timestamp: string;
    cookies: string;
  }>({
    status: '',
    hasSession: false,
    userId: undefined,
    isAuthenticated: false,
    timestamp: '',
    cookies: 'N/A'
  });

  useEffect(() => {
    const info = {
      status,
      hasSession: !!session,
      userId: session?.user?.id,
      isAuthenticated: isAuthenticated(),
      timestamp: new Date().toISOString(),
      cookies: typeof document !== 'undefined' ? document.cookie : 'N/A'
    };
    
    setDebugInfo(info);
    logger.debug("Redirect Debug Info", info);

    // Test redirect conditions
    if (status === "unauthenticated") {
      logger.debug("Status: unauthenticated - should redirect");
    } else if (status === "authenticated" && !isAuthenticated()) {
      logger.warn("Status: authenticated but no API token - should redirect");
    } else if (status === "authenticated" && isAuthenticated()) {
      logger.debug("Status: authenticated with API token - should stay");
    } else {
      logger.debug("Status: loading or unknown - waiting");
    }
  }, [session, status]);

  const testRedirect = () => {
    logger.debug("Testing redirect");
    redirectToLogin();
  };

  const testWindowRedirect = () => {
    logger.debug("Testing window.location redirect");
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2">Redirect Debugger</h3>
      
      <div className="text-xs space-y-1 mb-3">
        <div><strong>Status:</strong> {debugInfo.status}</div>
        <div><strong>Has Session:</strong> {debugInfo.hasSession ? 'Yes' : 'No'}</div>
        <div><strong>User ID:</strong> {debugInfo.userId || 'None'}</div>
        <div><strong>Is Authenticated:</strong> {debugInfo.isAuthenticated ? 'Yes' : 'No'}</div>
        <div><strong>Time:</strong> {debugInfo.timestamp}</div>
      </div>

      <div className="space-y-2">
        <button
          onClick={testRedirect}
          className="w-full bg-primary text-white text-xs px-2 py-1 rounded hover:bg-primary/90"
        >
          Test redirectToLogin()
        </button>
        
        <button
          onClick={testWindowRedirect}
          className="w-full bg-accent text-white text-xs px-2 py-1 rounded hover:bg-accent/90"
        >
          Test window.location
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Check console for detailed logs
      </div>
    </div>
  );
}
