"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useAuth";
import { 
  Shield, 
  User, 
  TrendingUp,
  CheckCircle,
  Activity
} from "lucide-react";

export default function StatsPage() {
  const [user, setUser] = useState<{ 
    name?: string; 
    role?: string; 
    phone?: string; 
    firstName?: string; 
    lastName?: string;
    profileCompleteness?: {
      percentage: number;
      completedFields: number;
      totalFields: number;
      missingFields: string[];
      fields: Record<string, { completed: boolean; required: boolean }>;
    };
  } | null>(null);
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (session?.user?.id) {
          const response = await fetch(`/api/users/${session.user.id}`);
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    if (status === "authenticated" && session?.user?.id) {
      fetchUser();
    }
  }, [session, status]);

  return (
    <div className="lg:col-span-2">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Active Services
          </h3>
          <p className="text-3xl font-bold text-green-600 mb-1">8</p>
          <p className="text-sm text-gray-500">All modules available</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <CheckCircle className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            User Role
          </h3>
          <p className="text-3xl font-bold text-blue-600 mb-1 capitalize">
            {user?.role || "User"}
          </p>
          <p className="text-sm text-gray-500">Account type</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-right">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-purple-600">
                  {user?.profileCompleteness?.percentage || 0}%
                </span>
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Profile Completeness
          </h3>
          <div className="mb-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${user?.profileCompleteness?.percentage || 0}%` }}
              ></div>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {user?.profileCompleteness?.completedFields ? 
              `${user.profileCompleteness.completedFields}/${user.profileCompleteness.totalFields} fields` : 
              "Profile status"
            }
          </p>
          {user?.profileCompleteness?.missingFields && user.profileCompleteness.missingFields.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-400">Missing: {user.profileCompleteness.missingFields.slice(0, 2).join(", ")}</p>
              {user.profileCompleteness.missingFields.length > 2 && (
                <p className="text-xs text-gray-400">+{user.profileCompleteness.missingFields.length - 2} more</p>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">Live</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Platform Status
          </h3>
          <p className="text-3xl font-bold text-green-600 mb-1">Online</p>
          <p className="text-sm text-gray-500">All systems operational</p>
        </div>
      </div>
    </div>
  );
}
