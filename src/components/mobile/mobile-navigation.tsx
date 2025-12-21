"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Search,
  MessageSquare,
  Bell,
  User,
  Menu,
  X,
  ShoppingCart,
  Heart,
  Settings,
  Wallet,
  Briefcase,
  BarChart3,
  Store,
  Package,
  GraduationCap,
  Car,
  Megaphone,
  DollarSign,
  Star,
  Calendar,
  Shield,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileNavigationProps {
  userRole?: string;
  unreadNotifications?: number;
  unreadMessages?: number;
}

const NAVIGATION_ITEMS = [
  {
    key: "dashboard",
    label: "Home",
    icon: Home,
    href: "/dashboard",
    roles: ["all"]
  },
  {
    key: "marketplace",
    label: "Marketplace",
    icon: Store,
    href: "/marketplace",
    roles: ["client", "provider", "admin"]
  },
  {
    key: "supplies",
    label: "Supplies",
    icon: Package,
    href: "/supplies",
    roles: ["client", "supplier", "admin"]
  },
  {
    key: "academy",
    label: "Academy",
    icon: GraduationCap,
    href: "/academy",
    roles: ["client", "instructor", "admin"]
  },
  {
    key: "rentals",
    label: "Rentals",
    icon: Car,
    href: "/rentals",
    roles: ["client", "provider", "admin"]
  },
  {
    key: "jobs",
    label: "Jobs",
    icon: Briefcase,
    href: "/jobs",
    roles: ["client", "provider", "admin"]
  },
  {
    key: "ads",
    label: "Ads",
    icon: Megaphone,
    href: "/ads",
    roles: ["client", "admin"]
  },
  {
    key: "finance",
    label: "Finance",
    icon: DollarSign,
    href: "/finance",
    roles: ["client", "provider", "admin"]
  },
  {
    key: "plus",
    label: "LocalPro Plus",
    icon: Star,
    href: "/plus",
    roles: ["client", "provider", "admin"]
  }
];

const QUICK_ACTIONS = [
  {
    key: "favorites",
    label: "Favorites",
    icon: Heart,
    href: "/favorites"
  },
  {
    key: "cart",
    label: "Cart",
    icon: ShoppingCart,
    href: "/cart"
  },
  {
    key: "bookings",
    label: "My Bookings",
    icon: Calendar,
    href: "/marketplace/my-bookings"
  },
  {
    key: "wallet",
    label: "Wallet",
    icon: Wallet,
    href: "/wallet"
  },
  {
    key: "profile",
    label: "Profile",
    icon: User,
    href: "/profile"
  },
  {
    key: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings"
  }
];

export function MobileNavigation({
  userRole = "client",
  unreadNotifications = 0,
  unreadMessages = 0
}: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter navigation items based on user role
  const filteredNavItems = NAVIGATION_ITEMS.filter(item =>
    item.roles.includes("all") || item.roles.includes(userRole)
  );

  // Handle touch gestures for menu
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    // Swipe left to open menu, swipe right to close
    if (isLeftSwipe && !isMenuOpen) {
      setIsMenuOpen(true);
    } else if (isRightSwipe && isMenuOpen) {
      setIsMenuOpen(false);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Close menu on navigation
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsMenuOpen(false);
  };

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {/* Quick Actions - Left */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative min-h-[44px] min-w-[44px]"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </Button>

            <Link href="/search">
              <Button
                variant="ghost"
                size="icon"
                className="relative min-h-[44px] min-w-[44px]"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Main Navigation - Center (3 main items) */}
          <div className="flex items-center space-x-1">
            {filteredNavItems.slice(0, 3).map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);

              return (
                <Link key={item.key} href={item.href}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "relative min-h-[44px] min-w-[44px] transition-colors",
                      isActive
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    )}
                    aria-label={item.label}
                  >
                    <Icon className="w-5 h-5" />
                    {item.key === "messages" && unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                        {unreadMessages > 99 ? "99+" : unreadMessages}
                      </span>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* User Actions - Right */}
          <div className="flex items-center space-x-1">
            <Link href="/messages">
              <Button
                variant="ghost"
                size="icon"
                className="relative min-h-[44px] min-w-[44px]"
                aria-label="Messages"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </Button>
            </Link>

            <Link href="/notifications">
              <Button
                variant="ghost"
                size="icon"
                className="relative min-h-[44px] min-w-[44px]"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Full Screen Menu Overlay */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="fixed inset-0 z-50 bg-white"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(false)}
              className="min-h-[44px] min-w-[44px]"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Menu Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Main Navigation */}
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Navigation
              </h3>
              <div className="space-y-1">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveRoute(item.href);

                  return (
                    <Button
                      key={item.key}
                      variant="ghost"
                      onClick={() => handleNavigation(item.href)}
                      className={cn(
                        "w-full justify-start min-h-[48px] px-3 text-left",
                        isActive
                          ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;

                  return (
                    <Button
                      key={action.key}
                      variant="outline"
                      onClick={() => handleNavigation(action.href)}
                      className="flex flex-col items-center justify-center min-h-[64px] p-3"
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-xs text-center">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Support */}
            <div className="p-4 border-t border-gray-200">
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation("/help-center")}
                  className="w-full justify-start min-h-[48px] px-3"
                >
                  <HelpCircle className="w-5 h-5 mr-3" />
                  Help Center
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation("/settings")}
                  className="w-full justify-start min-h-[48px] px-3"
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Footer with user info */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">User Profile</p>
                <p className="text-sm text-gray-500 capitalize">{userRole}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation("/profile")}
                className="min-h-[36px]"
              >
                View Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add bottom padding to page content to account for fixed navigation */}
      <style jsx global>{`
        .mobile-page-content {
          padding-bottom: 80px;
        }
      `}</style>
    </>
  );
}
