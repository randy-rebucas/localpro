"use client";

import { useState, useEffect } from "react";
import { 
  makeClientAuthenticatedRequestWithPathSafe,
  handleClientApiRoute,
  isAuthenticated
} from "@/lib/client-api-utils";
import { useTokenValidation } from "@/lib/token-validation";
import { useAuthErrorHandler } from "@/lib/auth-error-handler";
import { logger } from "@/lib/logger";

/**
 * Example component demonstrating how to handle expired tokens
 * This shows the recommended patterns for API calls with automatic token expiry handling
 */
export function TokenExpiryExample() {
  const [userData, setUserData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);

  const { validateToken, validateWithFallback, isLikelyExpired } = useTokenValidation();
  const { handleAuthError } = useAuthErrorHandler();

  // Example 1: Using the safe API wrapper (recommended)
  const fetchUserDataSafe = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await handleClientApiRoute(async () => {
        const response = await makeClientAuthenticatedRequestWithPathSafe(
          'usersById',
          ['current-user'], // Replace with actual user ID
          {},
          { method: 'GET' }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }
        
        return await response.json();
      }, "Fetch user data");

      if (result.error) {
        if (result.isAuthError) {
          logger.debug("Authentication error detected, token will be handled automatically");
          // The safe wrapper already handled the token expiry
          setError("Authentication expired. You will be redirected to login.");
        } else {
          setError(result.error);
        }
      } else {
        setUserData(result.data);
      }
    } catch (error) {
      logger.error("Unexpected error", error instanceof Error ? error : new Error(String(error)));
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Example 2: Manual token validation before API call
  const fetchUserDataWithValidation = async () => {
    setLoading(true);
    setError(null);

    try {
      // First validate the token
      const isValid = await validateWithFallback();
      if (!isValid) {
        setError("Token validation failed. You will be redirected to login.");
        return;
      }

      // Proceed with API call
      const result = await handleClientApiRoute(async () => {
        const response = await makeClientAuthenticatedRequestWithPathSafe(
          'usersById',
          ['current-user'],
          {},
          { method: 'GET' }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }
        
        return await response.json();
      }, "Fetch user data with validation");

      if (result.error) {
        setError(result.error);
      } else {
        setUserData(result.data);
      }
    } catch (error) {
      logger.error("Error fetching user data with validation", error instanceof Error ? error : new Error(String(error)));
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Example 3: Using auth error handler
  const fetchUserDataWithErrorHandler = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await handleClientApiRoute(async () => {
        const response = await makeClientAuthenticatedRequestWithPathSafe(
          'usersById',
          ['current-user'],
          {},
          { method: 'GET' }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }
        
        return await response.json();
      }, "Fetch user data with error handler");

      if (result.error) {
        // Use the auth error handler
        await handleAuthError(new Error(result.error), {
          redirectToLogin: false, // Don't redirect automatically
          fallbackAction: () => {
            setError("Authentication failed. Please try again.");
          }
        });
      } else {
        setUserData(result.data);
      }
    } catch (error) {
      logger.error("Error fetching user data with error handler", error instanceof Error ? error : new Error(String(error)));
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Check token status on component mount
  useEffect(() => {
    const checkTokenStatus = async () => {
      if (isAuthenticated()) {
        const isValid = await validateToken();
        setLastValidation(new Date());
        
        if (!isValid.isValid) {
          logger.warn("Token validation failed", undefined, { error: isValid.error });
        }
      }
    };

    checkTokenStatus();
  }, [validateToken]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Token Expiry Handling Examples</h1>
        <p className="text-gray-600 mb-6">
          This component demonstrates different ways to handle expired tokens in API calls.
        </p>

        {/* Token Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Token Status</h2>
          <div className="space-y-2 text-sm">
            <div>Authenticated: {isAuthenticated() ? "Yes" : "No"}</div>
            <div>Likely Expired: {isLikelyExpired() ? "Yes" : "No"}</div>
            <div>Last Validation: {lastValidation ? lastValidation.toLocaleTimeString() : "Never"}</div>
          </div>
        </div>

        {/* User Data Display */}
        {userData && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-green-800">User Data</h2>
            <pre className="text-sm text-green-700">
              {JSON.stringify(userData, null, 2)}
            </pre>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-red-800">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={fetchUserDataSafe}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Safe API Call"}
          </button>

          <button
            onClick={fetchUserDataWithValidation}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "With Validation"}
          </button>

          <button
            onClick={fetchUserDataWithErrorHandler}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "With Error Handler"}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">How to Use</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li><strong>Safe API Call:</strong> Uses automatic token expiry handling</li>
            <li><strong>With Validation:</strong> Validates token before making API call</li>
            <li><strong>With Error Handler:</strong> Uses custom error handling with fallback</li>
          </ul>
        </div>

        {/* Code Examples */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Code Examples</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <div>
              <strong>Safe API Call:</strong>
              <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
{`const response = await makeClientAuthenticatedRequestWithPathSafe(
  'usersById', [userId], {}, { method: 'GET' }
);`}
              </pre>
            </div>
            <div>
              <strong>Token Validation:</strong>
              <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
{`const isValid = await validateWithFallback();
if (!isValid) return; // Handles redirect automatically`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
