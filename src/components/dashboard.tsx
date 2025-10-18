"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/hooks/useAuth";
import { 
  Shield, 
  Package, 
  GraduationCap, 
  Car, 
  Star, 
  Home, 
  Megaphone, 
  DollarSign,
  Menu,
  X,
  User,
  LogOut
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const _router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Fetch user data from custom API
    // Middleware ensures user is authenticated, so this should always succeed
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [session, status]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center ml-4">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">P</span>
                </div>
                <h1 className="ml-3 text-xl font-semibold text-gray-900">
                  LocalPro Super App
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">{user?.name || "User"}</span>
              </div>
              <a
                href="/profile"
                className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </a>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || "User"}!
          </h2>
          <p className="text-gray-600">
            Access all your professional services in one place
          </p>
        </div>

        {/* Service Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {serviceModules.map((module) => (
            <div
              key={module.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                // Navigate to module route
                console.log(`Navigate to ${module.route}`);
              }}
            >
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center mr-4`}>
                  {module.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {module.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {module.description}
                  </p>
                </div>
              </div>
              
              <div className="space-y-1">
                {module.services.map((service, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    • {service}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Active Services
            </h3>
            <p className="text-3xl font-bold text-green-600">8</p>
            <p className="text-sm text-gray-500">All modules available</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              User Role
            </h3>
            <p className="text-3xl font-bold text-blue-600 capitalize">
              {user?.role || "User"}
            </p>
            <p className="text-sm text-gray-500">Account type</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Platform Status
            </h3>
            <p className="text-3xl font-bold text-green-600">Online</p>
            <p className="text-sm text-gray-500">All systems operational</p>
          </div>
        </div>
      </div>
    </div>
  );
}
