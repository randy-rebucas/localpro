"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useAuth";
import { 
  TrendingUp,
  Zap,
  Shield
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";

interface HealthData {
  status: string;
  version?: string;
  environment?: string;
  maintenanceMode?: {
    enabled: boolean;
    message?: string;
  };
  features?: {
    [key: string]: boolean;
  };
  timestamp?: string;
}

interface PublicSettingsData {
  general?: {
    appName?: string;
    appVersion?: string;
    maintenanceMode?: {
      enabled: boolean;
      message?: string;
    };
  };
  features?: {
    [key: string]: {
      enabled: boolean;
      [key: string]: any;
    };
  };
}

export default function HeaderPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");
  const { data: session } = useSession();
  const [platformStatus, setPlatformStatus] = useState<string>("Online");
  const [activeServices, setActiveServices] = useState<number>(0);
  const [loading, setLoading] = useState(true);

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

  // Fetch quick stats from public endpoints
  useEffect(() => {
    const fetchQuickStats = async () => {
      try {
        setLoading(true);
        
        // Fetch both endpoints in parallel
        const [healthResponse, publicResponse] = await Promise.all([
          fetch(`${API_BASE_URL}${API_ENDPOINTS.settingsAppHealth}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }),
          fetch(`${API_BASE_URL}${API_ENDPOINTS.settingsAppPublic}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }),
        ]);

        let servicesCount = 0;

        // Process health data
        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          const health: HealthData = healthData?.data || healthData;
          
          // Determine platform status based on response structure
          // Priority: maintenanceMode > status field
          if (health.maintenanceMode?.enabled) {
            setPlatformStatus("Maintenance");
          } else if (health.status) {
            // Map status values to display-friendly text
            const statusMap: Record<string, string> = {
              "healthy": "Online",
              "degraded": "Degraded",
              "unhealthy": "Unhealthy",
              "down": "Offline",
            };
            // Capitalize first letter if status not in map
            const displayStatus = statusMap[health.status.toLowerCase()] 
              || health.status.charAt(0).toUpperCase() + health.status.slice(1);
            setPlatformStatus(displayStatus);
          } else {
            // Default fallback
            setPlatformStatus("Online");
          }

          // Count active services from health features object
          // Health endpoint structure: { "marketplace": true, "academy": true, ... }
          if (health.features && typeof health.features === 'object') {
            servicesCount = Object.values(health.features).filter(
              (enabled) => enabled === true
            ).length;
          }
        }

        // Process public settings as fallback for active services count
        // Public settings structure: { "marketplace": { "enabled": true, ... }, ... }
        // Only use if health endpoint didn't provide a count (servicesCount === 0)
        if (publicResponse.ok && servicesCount === 0) {
          const publicData = await publicResponse.json();
          const settings: PublicSettingsData = publicData?.data || publicData;
          
          // Count active services from settings features
          // Count top-level feature keys that have enabled: true
          // Exclude nested objects like payments.paypal (those are payment methods, not services)
          if (settings.features && typeof settings.features === 'object') {
            const enabledFeatures = Object.entries(settings.features)
              .filter(([key, feature]) => {
                // Handle object structure: { "enabled": true, ... }
                if (typeof feature === 'object' && feature !== null && 'enabled' in feature) {
                  return feature.enabled === true;
                }
                // Handle boolean structure (fallback)
                if (typeof feature === 'boolean') {
                  return feature === true;
                }
                return false;
              });
            
            servicesCount = enabledFeatures.length;
          }
        }

        setActiveServices(servicesCount);
      } catch (error) {
        // Silently fail - keep default values
        console.error("Failed to fetch quick stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuickStats();
  }, []);

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
    if (session?.user?.firstName) {
      return session.user.firstName;
    }
    if (session?.user?.name) {
      return session.user.name.split(" ")[0];
    }
    return "there";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "online":
        return "text-green-600";
      case "maintenance":
        return "text-yellow-600";
      case "degraded":
        return "text-orange-600";
      case "unhealthy":
      case "offline":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
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
                <div className={`flex items-center gap-1 ${getStatusColor(platformStatus)}`}>
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {loading ? "..." : platformStatus}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Platform Status</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-blue-600">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {loading ? "..." : activeServices > 0 ? `${activeServices}` : "Active"}
                  </span>
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
