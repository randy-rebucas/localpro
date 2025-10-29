"use client";

import { useSession } from "@/hooks/useAuth";
import { isAuthenticated, clearAllAuthData } from "@/lib/client-api-utils";

export function AuthDebug() {
  const { data: session, status } = useSession();
  
  const handleClearAuth = () => {
    clearAllAuthData();
    window.location.reload();
  };
  
  const handleGoToAuth = () => {
    window.location.href = '/auth';
  };

  return (
    <div className="fixed top-4 right-4 bg-white p-4 border rounded-lg shadow-lg z-50 max-w-md">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="space-y-2 text-sm">
        <div><strong>Status:</strong> {status}</div>
        <div><strong>Has Session:</strong> {session ? 'Yes' : 'No'}</div>
        <div><strong>Has API Token:</strong> {isAuthenticated() ? 'Yes' : 'No'}</div>
        <div><strong>Cookies:</strong> {typeof document !== 'undefined' ? document.cookie : 'N/A'}</div>
      </div>
      <div className="mt-3 space-x-2">
        <button 
          onClick={handleClearAuth}
          className="px-3 py-1 bg-red-500 text-white rounded text-xs"
        >
          Clear Auth
        </button>
        <button 
          onClick={handleGoToAuth}
          className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
        >
          Go to Auth
        </button>
      </div>
    </div>
  );
}
