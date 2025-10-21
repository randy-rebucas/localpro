"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Store, 
  Calendar, 
  BarChart3,
  Plus,
  Briefcase
} from "lucide-react";

export default function MarketplaceNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/marketplace") {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left side - Navigation Links */}
      <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
        {/* Browse Section */}
        <div className="flex items-center space-x-1">
          <Link
            href="/marketplace"
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center ${
              isActive("/marketplace")
                ? "bg-green-100 text-green-700 shadow-sm border border-green-200"
                : "text-gray-600 hover:text-gray-700 hover:bg-gray-50 hover:shadow-sm"
            }`}
          >
            <Store className={`w-4 h-4 mr-2 transition-colors ${
              isActive("/marketplace") ? "text-green-600" : "text-gray-400"
            }`} />
            Browse Services
          </Link>
          
          <Link
            href="/marketplace/jobs"
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center ${
              isActive("/marketplace/jobs")
                ? "bg-green-100 text-green-700 shadow-sm border border-green-200"
                : "text-gray-600 hover:text-gray-700 hover:bg-gray-50 hover:shadow-sm"
            }`}
          >
            <Briefcase className={`w-4 h-4 mr-2 transition-colors ${
              isActive("/marketplace/jobs") ? "text-green-600" : "text-gray-400"
            }`} />
            Browse Jobs
          </Link>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-2"></div>

        {/* My Section */}
        <div className="flex items-center space-x-1">
          <Link
            href="/marketplace/bookings"
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center ${
              isActive("/marketplace/bookings")
                ? "bg-green-100 text-green-700 shadow-sm border border-green-200"
                : "text-gray-600 hover:text-gray-700 hover:bg-gray-50 hover:shadow-sm"
            }`}
          >
            <Calendar className={`w-4 h-4 mr-2 transition-colors ${
              isActive("/marketplace/bookings") ? "text-green-600" : "text-gray-400"
            }`} />
            My Bookings
          </Link>
          
          <Link
            href="/marketplace/my-services"
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center ${
              isActive("/marketplace/my-services")
                ? "bg-green-100 text-green-700 shadow-sm border border-green-200"
                : "text-gray-600 hover:text-gray-700 hover:bg-gray-50 hover:shadow-sm"
            }`}
          >
            <BarChart3 className={`w-4 h-4 mr-2 transition-colors ${
              isActive("/marketplace/my-services") ? "text-green-600" : "text-gray-400"
            }`} />
            My Services
          </Link>
        </div>
      </div>

      {/* Right side - Action Button */}
      <div className="flex-shrink-0 ml-4">
        <Link
          href="/marketplace/create-service"
          className="inline-flex items-center px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 hover:shadow-lg transition-all duration-200 whitespace-nowrap transform hover:scale-105 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Service
        </Link>
      </div>
    </div>
  );
}
