"use client";

import { RedirectDebugger } from "@/components/redirect-debugger";

/**
 * Temporary test page to debug redirect issues
 * Add this to your dashboard or any page to test redirects
 */
export default function RedirectTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Redirect Test Page</h1>
        <p className="text-gray-600 mb-6">
          This page helps debug redirect issues. Check the console for detailed logs.
        </p>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Open browser console to see debug logs</li>
            <li>Look for the debug panel in the bottom-right corner</li>
            <li>Check the status and authentication state</li>
            <li>Use the test buttons to manually trigger redirects</li>
            <li>If redirects don&apos;t work, check for JavaScript errors</li>
          </ol>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Common Issues:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• JavaScript errors preventing redirect execution</li>
            <li>• Browser blocking redirects due to popup blockers</li>
            <li>• React Router interfering with window.location redirects</li>
            <li>• Middleware or server-side redirects conflicting</li>
          </ul>
        </div>
      </div>
      
      {/* Debug component */}
      <RedirectDebugger />
    </div>
  );
}
