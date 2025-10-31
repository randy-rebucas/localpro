"use client";

import { useState } from "react";
import { useSession } from "@/hooks/useAuth";
import { isAuthenticated, clearAllAuthData } from "@/lib/client-api-utils";

export function AuthDebug() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();
  
  const handleClearAuth = () => {
    clearAllAuthData();
    window.location.reload();
  };
  
  const handleGoToAuth = () => {
    window.location.href = '/auth';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="bg-white p-4 border rounded-lg shadow-lg max-w-md mb-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Auth Debug</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-lg leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div><strong>Status:</strong> {status}</div>
            <div><strong>Has Session:</strong> {session ? 'Yes' : 'No'}</div>
            <div><strong>Has API Token:</strong> {isAuthenticated() ? 'Yes' : 'No'}</div>
            <div><strong>Cookies:</strong> {typeof document !== 'undefined' ? document.cookie : 'N/A'}</div>
          </div>
          <div className="mt-3 space-x-2">
            <button 
              onClick={handleClearAuth}
              className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              Clear Auth
            </button>
            <button 
              onClick={handleGoToAuth}
              className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              Go to Auth
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors text-sm font-medium"
        aria-label="Toggle Auth Debug"
      >
        {isOpen ? 'Hide Debug' : 'Auth Debug'}
      </button>
    </div>
  );
}
