"use client";

import { useSession } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  BarChart3, 
  Users, 
  ShoppingCart, 
  BookOpen, 
  CreditCard, 
  Home, 
  Megaphone, 
  Shield, 
  MessageSquare, 
  Settings,
  TrendingUp,
  MapPin,
  DollarSign,
  Briefcase,
  Users2,
  FileText,
  AlertTriangle,
  Activity,
  Package
} from "lucide-react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const modules = [
    {
      name: "Marketplace",
      description: "Manage services, bookings, and reviews",
      icon: ShoppingCart,
      href: "/admin/marketplace",
      color: "bg-blue-500",
      stats: "1,234 services"
    },
    {
      name: "Supplies",
      description: "Manage supply products and orders",
      icon: Package,
      href: "/admin/supplies",
      color: "bg-green-500",
      stats: "567 products"
    },
    {
      name: "Academy",
      description: "Manage courses and enrollments",
      icon: BookOpen,
      href: "/admin/academy",
      color: "bg-purple-500",
      stats: "89 courses"
    },
    {
      name: "Finance",
      description: "Financial overview and transactions",
      icon: CreditCard,
      href: "/admin/finance",
      color: "bg-yellow-500",
      stats: "$12,345 revenue"
    },
    {
      name: "Rentals",
      description: "Manage rental items and bookings",
      icon: Home,
      href: "/admin/rentals",
      color: "bg-orange-500",
      stats: "234 rentals"
    },
    {
      name: "Ads",
      description: "Manage advertisements and campaigns",
      icon: Megaphone,
      href: "/admin/ads",
      color: "bg-pink-500",
      stats: "45 active ads"
    },
    {
      name: "Facility Care",
      description: "Manage facility care services",
      icon: Shield,
      href: "/admin/facility-care",
      color: "bg-indigo-500",
      stats: "123 services"
    },
    {
      name: "LocalPro Plus",
      description: "Manage subscription plans",
      icon: TrendingUp,
      href: "/admin/localpro-plus",
      color: "bg-teal-500",
      stats: "456 subscribers"
    },
    {
      name: "Trust Verification",
      description: "Manage user verification",
      icon: Shield,
      href: "/admin/trust-verification",
      color: "bg-red-500",
      stats: "789 verified"
    },
    {
      name: "Communication",
      description: "Messages and notifications",
      icon: MessageSquare,
      href: "/admin/communication",
      color: "bg-cyan-500",
      stats: "1,234 messages"
    },
    {
      name: "Analytics",
      description: "Platform analytics and insights",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "bg-violet-500",
      stats: "Real-time data"
    },
    {
      name: "Maps",
      description: "Location services and geocoding",
      icon: MapPin,
      href: "/admin/maps",
      color: "bg-emerald-500",
      stats: "Active"
    },
    {
      name: "PayPal",
      description: "PayPal payment management",
      icon: DollarSign,
      href: "/admin/paypal",
      color: "bg-blue-600",
      stats: "Connected"
    },
    {
      name: "PayMaya",
      description: "PayMaya payment management",
      icon: DollarSign,
      href: "/admin/paymaya",
      color: "bg-green-600",
      stats: "Connected"
    },
    {
      name: "Jobs",
      description: "Job postings and applications",
      icon: Briefcase,
      href: "/admin/jobs",
      color: "bg-amber-500",
      stats: "89 jobs"
    },
    {
      name: "Referrals",
      description: "Referral system management",
      icon: Users2,
      href: "/admin/referrals",
      color: "bg-lime-500",
      stats: "234 referrals"
    },
    {
      name: "Agencies",
      description: "Agency management",
      icon: Users,
      href: "/admin/agencies",
      color: "bg-slate-500",
      stats: "12 agencies"
    },
    {
      name: "Settings",
      description: "System settings and configuration",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-gray-500",
      stats: "Configured"
    },
    {
      name: "Error Monitoring",
      description: "System error tracking",
      icon: AlertTriangle,
      href: "/admin/error-monitoring",
      color: "bg-red-600",
      stats: "3 errors"
    },
    {
      name: "Audit Logs",
      description: "System audit trail",
      icon: FileText,
      href: "/admin/audit-logs",
      color: "bg-gray-600",
      stats: "45,678 logs"
    },
    {
      name: "Providers",
      description: "Service provider management",
      icon: Users,
      href: "/admin/providers",
      color: "bg-blue-700",
      stats: "567 providers"
    },
    {
      name: "Logs",
      description: "System logs and monitoring",
      icon: Activity,
      href: "/admin/logs",
      color: "bg-green-700",
      stats: "Real-time"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                LocalPro Back Office
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive platform management system
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Welcome back</p>
                <p className="font-medium text-gray-900">{session?.user?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">12,345</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Services</p>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">$45,678</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Growth</p>
                <p className="text-2xl font-bold text-gray-900">+12.5%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module) => (
            <a
              key={module.name}
              href={module.href}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 p-6 group"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${module.color} text-white`}>
                  <module.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                    {module.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {module.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {module.stats}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
