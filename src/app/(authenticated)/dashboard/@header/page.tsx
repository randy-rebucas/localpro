"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useAuth";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { 
  TrendingUp,
  Zap,
  Shield
} from "lucide-react";

export default function HeaderPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");
  const [user, setUser] = useState<{ 
    name?: string; 
    firstName?: string; 
    lastName?: string;
    role?: string;
    lastLogin?: string;
  } | null>(null);
  const { data: session, status } = useSession();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Set greeting based on time
  useEffect(() => {
    const hour = currentTime.getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 17) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, [currentTime]);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      if (!session?.user?.id || !getApiToken()) return;
      
      try {
        const url = `${API_BASE_URL}${API_ENDPOINTS.authMe}`;
        const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
        if (response.ok) {
          const userData = await response.json();
          const user = userData?.data || userData;
          setUser(user);
        }
      } catch (error) {
        logger.error("Failed to fetch user data", error instanceof Error ? error : new Error(String(error)));
      }
    };

    if (status === "authenticated" && session?.user?.id) {
      fetchUser();
    }
  }, [session, status]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.name) {
      return user.name;
    }
    if (session?.user?.name) {
      return session.user.name;
    }
    return "User";
  };

  return (
    <div className="mb-8">
      {/* Enhanced Page Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left side - Greeting and info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {greeting}, {getUserDisplayName()}! 👋
                </h2>
                <p className="text-gray-600 text-lg">
                  {formatDate(currentTime)} • {formatTime(currentTime)}
                </p>
              </div>
            </div>
            <p className="text-gray-600 text-base max-w-2xl">
              Welcome to your LocalPro dashboard. Access all your professional services, 
              track your activity, and manage your business in one place.
            </p>
          </div>

          {/* Right side - Quick stats only */}
          <div className="flex items-center space-x-4">
            {/* Quick stats */}
            <div className="hidden xl:flex items-center space-x-6">
              <div className="text-center">
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Online</span>
                </div>
                <p className="text-xs text-gray-500">Platform Status</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-blue-600">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">Active</span>
                </div>
                <p className="text-xs text-gray-500">All Services</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
