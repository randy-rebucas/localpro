"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useAuth";
import { 
  Shield, 
  Package, 
  GraduationCap, 
  Car, 
  Star, 
  Home, 
  Megaphone, 
  DollarSign,
  Search,
  User,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Activity
} from "lucide-react";

interface ServiceModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  services: string[];
  route: string;
}

const serviceModules: ServiceModule[] = [
  {
    id: "marketplace",
    name: "Marketplace",
    description: "Demand services",
    icon: <Shield className="w-8 h-8" />,
    color: "bg-gray-100 text-gray-700",
    services: ["Cleaning", "Plumbing", "Electrical", "Moving"],
    route: "/marketplace"
  },
  {
    id: "supplies",
    name: "Supplies & Materials",
    description: "Resources and goods",
    icon: <Package className="w-8 h-8" />,
    color: "bg-amber-100 text-amber-700",
    services: ["Cleaning supplies", "Tools", "Subscription kits"],
    route: "/supplies"
  },
  {
    id: "academy",
    name: "Academy",
    description: "Educational and certification services",
    icon: <GraduationCap className="w-8 h-8" />,
    color: "bg-green-100 text-green-700",
    services: ["Partner with TES", "Run courses", "Certification"],
    route: "/academy"
  },
  {
    id: "rentals",
    name: "Rentals",
    description: "Equipment and vehicle rentals",
    icon: <Car className="w-8 h-8" />,
    color: "bg-blue-100 text-blue-700",
    services: ["Tool and vehicle rentals"],
    route: "/rentals"
  },
  {
    id: "plus",
    name: "LocalPro Plus",
    description: "Premium tier subscription service",
    icon: <Star className="w-8 h-8" />,
    color: "bg-yellow-100 text-yellow-700",
    services: ["Premium subscriptions", "Providers", "Clients"],
    route: "/plus"
  },
  {
    id: "facility",
    name: "FacilityCare",
    description: "Facility-related services",
    icon: <Home className="w-8 h-8" />,
    color: "bg-emerald-100 text-emerald-700",
    services: ["Janitorial contracts", "Landscaping maintenance", "Pest control subscriptions"],
    route: "/facility"
  },
  {
    id: "ads",
    name: "Ads",
    description: "Advertising opportunities",
    icon: <Megaphone className="w-8 h-8" />,
    color: "bg-purple-100 text-purple-700",
    services: ["Advertising for hardware stores", "Suppliers", "Training schools"],
    route: "/ads"
  },
  {
    id: "finance",
    name: "Finance",
    description: "Financial services",
    icon: <DollarSign className="w-8 h-8" />,
    color: "bg-red-100 text-red-700",
    services: ["Salary advance", "Micro-loans", "Partner with fintech.company"],
    route: "/finance"
  }
];

export function Dashboard() {
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
  const [searchQuery] = useState("");
  const [recentActivity, setRecentActivity] = useState<unknown[]>([]);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Log session data to console
    console.log("=== SESSION DATA ===");
    console.log("Session:", session);
    console.log("Status:", status);
    
    if (session?.user) {
      console.log("User ID:", session.user.id);
      console.log("User Email:", session.user.email);
      console.log("User Name:", session.user.name);
      console.log("User Role:", session.user.role);
      console.log("User Phone:", session.user.phone);
      console.log("User First Name:", session.user.firstName);
      console.log("User Last Name:", session.user.lastName);
    }
    console.log("===================");

    // Fetch user data from custom API
    // Middleware ensures user is authenticated, so this should always succeed
    const fetchUser = async () => {
      try {
        if (session?.user?.id) {
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const userData = await response.json();
            console.log("=== USER DATA FROM API ===");
            console.log("User Data:", userData);
            console.log("User Data Keys:", Object.keys(userData));
            console.log("==========================");
            setUser(userData);
          } else {
            throw new Error(`Failed to fetch user data: ${response.status}`);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };


    // Fetch recent activity data
    const fetchRecentActivity = async () => {
      try {
        if (session?.user?.id) {
          const response = await fetch(`/api/logs/user/${session.user.id}/activity`);
          if (response.ok) {
            const activityData = await response.json();
            console.log("=== RECENT ACTIVITY DATA ===");
            console.log("Activity Data:", activityData);
            console.log("=============================");
            setRecentActivity(activityData);
          } else {
            console.warn("Failed to fetch recent activity:", response.status);
            // Set fallback activity data if API fails
            setRecentActivity([
              { id: 1, action: "Dashboard loaded", time: "Just now", icon: "dashboard" },
              { id: 2, action: "Profile viewed", time: "Recently", icon: "user" }
            ]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch recent activity:", error);
        // Set fallback activity data if API fails
        setRecentActivity([
          { id: 1, action: "Dashboard loaded", time: "Just now", icon: "dashboard" },
          { id: 2, action: "Profile viewed", time: "Recently", icon: "user" }
        ]);
      }
    };

    // Fetch user data and recent activity
    Promise.all([fetchUser(), fetchRecentActivity()]);
  }, [session, status]);


  const filteredModules = serviceModules.filter(module =>
    module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.services.some(service => service.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleModuleClick = (route: string) => {
    router.push(route);
  };

  // Helper function to get icon for activity type
  const getActivityIcon = (activityType: string) => {
    switch (activityType?.toLowerCase()) {
      case 'marketplace':
      case 'service':
        return <Shield className="w-4 h-4" />;
      case 'profile':
      case 'user':
        return <User className="w-4 h-4" />;
      case 'academy':
      case 'course':
        return <GraduationCap className="w-4 h-4" />;
      case 'supplies':
      case 'order':
        return <Package className="w-4 h-4" />;
      case 'rentals':
      case 'rental':
        return <Car className="w-4 h-4" />;
      case 'finance':
      case 'payment':
        return <DollarSign className="w-4 h-4" />;
      case 'dashboard':
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };


  return (
    <div>

        {/* Service Modules Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Service Modules</h3>
            <div className="text-sm text-gray-500">
              {filteredModules.length} of {serviceModules.length} services
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredModules.map((module) => (
              <div
                key={module.id}
                className="group bg-white rounded-xl shadow-sm p-4 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => handleModuleClick(module.route)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    {module.icon}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                
                <div className="mb-3">
                  <h3 className="text-base font-semibold text-gray-700 mb-1 group-hover:text-green-700 transition-colors">
                    {module.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {module.description}
                  </p>
                </div>
                
                <div className="space-y-1">
                  {module.services.slice(0, 3).map((service, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>
                      {service}
                    </div>
                  ))}
                  {module.services.length > 3 && (
                    <div className="text-xs text-gray-400">
                      +{module.services.length - 3} more services
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {filteredModules.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No services found</h3>
              <p className="text-gray-500">Try adjusting your search terms</p>
            </div>
          )}
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-700 mb-1">
                  Active Services
                </h3>
                <p className="text-2xl font-bold text-green-600 mb-1">8</p>
                <p className="text-sm text-gray-500">All modules available</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-700 mb-1">
                  User Role
                </h3>
                <p className="text-2xl font-bold text-blue-600 mb-1 capitalize">
                  {user?.role || "User"}
                </p>
                <p className="text-sm text-gray-500">Account type</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-right">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-purple-600">
                      {user?.profileCompleteness?.percentage || 0}%
                    </span>
                  </div>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-gray-700 mb-1">
                  Profile Completeness
                </h3>
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
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
                  <div className="mt-1">
                    <p className="text-xs text-gray-400">Missing: {user.profileCompleteness.missingFields.slice(0, 2).join(", ")}</p>
                    {user.profileCompleteness.missingFields.length > 2 && (
                      <p className="text-xs text-gray-400">+{user.profileCompleteness.missingFields.length - 2} more</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">Live</span>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-gray-700 mb-1">
                  Platform Status
                </h3>
                <p className="text-2xl font-bold text-green-600 mb-1">Online</p>
                <p className="text-sm text-gray-500">All systems operational</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h3>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 5).map((activity, index) => {
                    const activityObj = activity as Record<string, unknown>;
                    return (
                    <div key={(activityObj.id as string) || index} className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {getActivityIcon((activityObj.type as string) || (activityObj.icon as string) || 'default')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700">
                          {(activityObj.action as string) || (activityObj.description as string) || (activityObj.title as string) || 'Activity'}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {(activityObj.time as string) || (activityObj.timestamp as string) || (activityObj.createdAt as string) || 'Recently'}
                        </p>
                      </div>
                    </div>
                    );
                  })
                ) : (
                  <div className="text-center py-3">
                    <Activity className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
              {recentActivity.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <button className="w-full text-sm text-green-600 hover:text-green-700 font-medium flex items-center justify-center">
                    View all activity
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
