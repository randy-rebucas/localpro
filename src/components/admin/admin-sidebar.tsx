"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { preloadRoute } from "@/lib/route-splitting";
import { 
  X,
  Home,
  Store,
  Package,
  GraduationCap,
  Car,
  Megaphone,
  CreditCard,
  Users,
  BarChart3,
  Settings,
  MessageSquare,
  Shield,
  FileText,
  AlertTriangle,
  Briefcase,
  TrendingUp,
  Users2,
  ChevronDown,
  ChevronRight,
  Database,
  Target,
  Monitor,
  Crown
} from "lucide-react";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: SidebarItem[];
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const sidebarItems: SidebarItem[] = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: Home,
    },
    {
      name: "User Management",
      href: "/admin/users",
      icon: Users,
    },
    {
      name: "Marketplace",
      href: "/admin/marketplace",
      icon: Store,
    },
    {
      name: "Supplies",
      href: "/admin/supplies",
      icon: Package,
    },
    {
      name: "Academy",
      href: "/admin/academy",
      icon: GraduationCap,
    },
    {
      name: "Rentals",
      href: "/admin/rentals",
      icon: Car,
    },
    {
      name: "Ads",
      href: "/admin/ads",
      icon: Megaphone,
    },
    {
      name: "Finance",
      href: "/admin/finance",
      icon: CreditCard,
    },
    {
      name: "Subscriptions",
      href: "/admin/subscriptions",
      icon: Crown,
    },
    {
      name: "Communication",
      href: "/admin/communication",
      icon: MessageSquare,
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
    },
    {
      name: "Plus Management",
      href: "/admin/plus",
      icon: TrendingUp,
    },
    {
      name: "Jobs",
      href: "/admin/jobs",
      icon: Briefcase,
    },
    {
      name: "Providers",
      href: "/admin/providers",
      icon: Users2,
    },
    {
      name: "Error Monitoring",
      href: "/admin/errors",
      icon: AlertTriangle,
      badge: "3",
    },
    {
      name: "Audit Logs",
      href: "/admin/audit",
      icon: FileText,
    },
    {
      name: "System Logs",
      href: "/admin/logs",
      icon: Database
    },
    {
      name: "Trust Verification",
      href: "/admin/trust-verification",
      icon: Shield,
    },
    {
      name: "Referrals",
      href: "/admin/referrals",
      icon: Target,
    },
    {
      name: "Payment Processing",
      href: "/admin/payments",
      icon: CreditCard,
    },
    {
      name: "App Settings",
      href: "/admin/settings",
      icon: Settings,
    },
    {
      name: "System Health",
      href: "/admin/health",
      icon: Monitor,
    },
  ];

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isItemActive = (item: SidebarItem): boolean => {
    if (item.href === pathname) return true;
    if (item.children) {
      return item.children.some(child => child.href === pathname);
    }
    return false;
  };

  const renderSidebarItem = (item: SidebarItem, level: number = 0) => {
    const isActive = isItemActive(item);
    const isExpanded = expandedItems.includes(item.name);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.href} className={`${level > 0 ? 'ml-4' : ''}`}>
        <div className="flex items-center">
          <Link
            href={item.href}
            onMouseEnter={() => preloadRoute(item.href)}
            onFocus={() => preloadRoute(item.href)}
            className={`flex items-center px-2 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex-1 ${
              isActive
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-l-4 border-blue-500 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
            }`}
            onClick={() => {
              if (!hasChildren) {
                onClose();
              }
            }}
          >
            <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
            <span>{item.name}</span>
            {item.badge && (
              <span className="ml-auto bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
          
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(item.name)}
              className="p-2 hover:bg-gray-100 rounded transition-colors duration-200 ml-2"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-600 hover:text-gray-800" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600 hover:text-gray-800" />
              )}
            </button>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children?.map(child => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out border-r border-gray-200
        lg:translate-x-0 lg:z-30
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
                <p className="text-sm font-medium text-gray-600">LocalPro Management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-100 rounded transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {sidebarItems.map(item => renderSidebarItem(item))}
          </nav>
          
          {/* Footer */}
          <div className="p-3">
            <div className="text-xs font-medium text-gray-600">
              <p>LocalPro Admin v1.0</p>
              <p>© 2024 LocalPro</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
