"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Store, 
  Calendar, 
  BarChart3,
  Briefcase,
  Package,
  GraduationCap,
  Car,
  Megaphone
} from "lucide-react";
import { useRoleAccess } from "@/components/role-guard";

export default function MarketplaceNav() {
  const pathname = usePathname();
  const { 
    isSupplier, 
    isInstructor, 
    isAdmin,
    isServiceProvider,
    isBusinessRole
  } = useRoleAccess();

  const isActive = (href: string) => {
    if (href === "/marketplace") {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  // Define menu items with role-based access
  const menuItems = [
    // Browse Section
    {
      href: "/marketplace",
      label: "Browse Services",
      icon: Store,
      section: "browse",
      // All users can browse services
      visible: true,
      roles: ['client', 'provider', 'supplier', 'instructor', 'agency_owner', 'agency_admin', 'admin']
    },
    {
      href: "/marketplace/jobs",
      label: "Browse Jobs",
      icon: Briefcase,
      section: "browse",
      // Only service providers and business roles can browse jobs
      visible: isServiceProvider || isBusinessRole || isAdmin,
      roles: ['provider', 'agency_owner', 'agency_admin', 'admin']
    },
    {
      href: "/marketplace/supplies",
      label: "Browse Supplies",
      icon: Package,
      section: "browse",
      // All users can browse supplies
      visible: true,
      roles: ['client', 'provider', 'supplier', 'instructor', 'agency_owner', 'agency_admin', 'admin']
    },
    {
      href: "/marketplace/courses",
      label: "Browse Courses",
      icon: GraduationCap,
      section: "browse",
      // All users can browse courses
      visible: true,
      roles: ['client', 'provider', 'supplier', 'instructor', 'agency_owner', 'agency_admin', 'admin']
    },
    {
      href: "/marketplace/rentals",
      label: "Browse Rentals",
      icon: Car,
      section: "browse",
      // All users can browse rentals
      visible: true,
      roles: ['client', 'provider', 'supplier', 'instructor', 'agency_owner', 'agency_admin', 'admin']
    },
    {
      href: "/marketplace/ads",
      label: "Browse Ads",
      icon: Megaphone,
      section: "browse",
      // All users can browse ads
      visible: true,
      roles: ['client', 'provider', 'supplier', 'instructor', 'agency_owner', 'agency_admin', 'admin']
    },

    // My Section
    {
      href: "/marketplace/bookings",
      label: "My Bookings",
      icon: Calendar,
      section: "my",
      // All users can view their bookings
      visible: true,
      roles: ['client', 'provider', 'supplier', 'instructor', 'agency_owner', 'agency_admin', 'admin']
    },
    {
      href: "/marketplace/my-services",
      label: "My Services",
      icon: BarChart3,
      section: "my",
      // Only service providers can manage their services
      visible: isServiceProvider || isAdmin,
      roles: ['provider', 'agency_owner', 'agency_admin', 'admin']
    },
    {
      href: "/marketplace/my-supplies",
      label: "My Supplies",
      icon: Package,
      section: "my",
      // Only suppliers can manage their supplies
      visible: isSupplier || isAdmin,
      roles: ['supplier', 'admin']
    },
    {
      href: "/marketplace/my-courses",
      label: "My Courses",
      icon: GraduationCap,
      section: "my",
      // Only instructors can manage their courses
      visible: isInstructor || isAdmin,
      roles: ['instructor', 'admin']
    },
    {
      href: "/marketplace/my-rentals",
      label: "My Rentals",
      icon: Car,
      section: "my",
      // Only service providers can manage rentals
      visible: isServiceProvider || isAdmin,
      roles: ['provider', 'agency_owner', 'agency_admin', 'admin']
    },
    {
      href: "/marketplace/my-ads",
      label: "My Ads",
      icon: Megaphone,
      section: "my",
      // Only business roles can manage ads
      visible: isBusinessRole || isAdmin,
      roles: ['provider', 'supplier', 'instructor', 'agency_owner', 'agency_admin', 'admin']
    }
  ];

  // Filter visible menu items
  const visibleMenuItems = menuItems.filter(item => item.visible);

  // Separate items by section
  const browseItems = visibleMenuItems.filter(item => item.section === "browse");
  const myItems = visibleMenuItems.filter(item => item.section === "my");

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left side - Navigation Links */}
      <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
        {/* Browse Section */}
        {browseItems.length > 0 && (
          <div className="flex items-center space-x-1">
            {browseItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center ${
                    isActive(item.href)
                      ? "bg-green-100 text-green-700 shadow-sm border border-green-200"
                      : "text-gray-600 hover:text-gray-700 hover:bg-gray-50 hover:shadow-sm"
                  }`}
                >
                  <IconComponent className={`w-4 h-4 mr-2 transition-colors ${
                    isActive(item.href) ? "text-green-600" : "text-gray-400"
                  }`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Divider - only show if there are both browse and my sections */}
        {browseItems.length > 0 && myItems.length > 0 && (
          <div className="w-px h-6 bg-gray-200 mx-2"></div>
        )}

        {/* My Section */}
        {myItems.length > 0 && (
          <div className="flex items-center space-x-1">
            {myItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center ${
                    isActive(item.href)
                      ? "bg-green-100 text-green-700 shadow-sm border border-green-200"
                      : "text-gray-600 hover:text-gray-700 hover:bg-gray-50 hover:shadow-sm"
                  }`}
                >
                  <IconComponent className={`w-4 h-4 mr-2 transition-colors ${
                    isActive(item.href) ? "text-green-600" : "text-gray-400"
                  }`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
