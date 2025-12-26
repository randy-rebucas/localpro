"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Store, 
  Calendar, 
  User, 
  Settings, 
  Bell, 
  HelpCircle,
  Plus,
  Megaphone,
  Truck,
  Package
} from "lucide-react";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
}

export default function Navigation() {
  const pathname = usePathname();

  const navigation: NavigationItem[] = [
    { name: "Home", href: "/marketplace", icon: Home },
    { name: "Marketplace", href: "/marketplace", icon: Store },
    { name: "Supplies", href: "/supplies", icon: Package },
    { name: "Rentals", href: "/rentals", icon: Truck },
    { name: "Ads", href: "/ads", icon: Megaphone },
    { name: "My Bookings", href: "/marketplace/bookings", icon: Calendar },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Help", href: "/help", icon: HelpCircle },
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/marketplace" className="text-xl font-bold text-accent">
                LocalPro
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== "/marketplace" && pathname?.startsWith(item.href));
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-accent text-gray-700"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              href="/supplies/create"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 transition-colors"
            >
              <Package className="w-4 h-4 mr-1" />
              List Supply
            </Link>
            <Link
              href="/rentals/create"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
            >
              <Truck className="w-4 h-4 mr-1" />
              List Rental
            </Link>
            <Link
              href="/marketplace/create-service"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-accent hover:bg-accent/90 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              List Service
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
