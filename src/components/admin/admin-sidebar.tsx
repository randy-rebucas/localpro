"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Activity,
  AlertTriangle,
  Building,
  Briefcase,
  TrendingUp,
  MapPin,
  DollarSign,
  Users2,
  ChevronDown,
  ChevronRight
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
      children: [
        { name: "All Users", href: "/admin/users", icon: Users },
        { name: "Providers", href: "/admin/users/providers", icon: Users },
        { name: "Suppliers", href: "/admin/users/suppliers", icon: Package },
        { name: "Instructors", href: "/admin/users/instructors", icon: GraduationCap },
        { name: "Agencies", href: "/admin/users/agencies", icon: Building },
      ],
    },
    {
      name: "Marketplace",
      href: "/admin/marketplace",
      icon: Store,
      children: [
        { name: "Services", href: "/admin/marketplace/services", icon: Store },
        { name: "Bookings", href: "/admin/marketplace/bookings", icon: Store },
        { name: "Reviews", href: "/admin/marketplace/reviews", icon: Store },
        { name: "Categories", href: "/admin/marketplace/categories", icon: Store },
      ],
    },
    {
      name: "Supplies",
      href: "/admin/supplies",
      icon: Package,
      children: [
        { name: "Products", href: "/admin/supplies/products", icon: Package },
        { name: "Orders", href: "/admin/supplies/orders", icon: Package },
        { name: "Categories", href: "/admin/supplies/categories", icon: Package },
        { name: "Inventory", href: "/admin/supplies/inventory", icon: Package },
      ],
    },
    {
      name: "Academy",
      href: "/admin/academy",
      icon: GraduationCap,
      children: [
        { name: "Courses", href: "/admin/academy/courses", icon: GraduationCap },
        { name: "Enrollments", href: "/admin/academy/enrollments", icon: GraduationCap },
        { name: "Instructors", href: "/admin/academy/instructors", icon: Users },
        { name: "Categories", href: "/admin/academy/categories", icon: GraduationCap },
      ],
    },
    {
      name: "Rentals",
      href: "/admin/rentals",
      icon: Car,
      children: [
        { name: "Items", href: "/admin/rentals/items", icon: Car },
        { name: "Bookings", href: "/admin/rentals/bookings", icon: Car },
        { name: "Categories", href: "/admin/rentals/categories", icon: Car },
      ],
    },
    {
      name: "Ads",
      href: "/admin/ads",
      icon: Megaphone,
      children: [
        { name: "All Ads", href: "/admin/ads", icon: Megaphone },
        { name: "Categories", href: "/admin/ads/categories", icon: Megaphone },
        { name: "Analytics", href: "/admin/ads/analytics", icon: BarChart3 },
      ],
    },
    {
      name: "Finance",
      href: "/admin/finance",
      icon: CreditCard,
      children: [
        { name: "Overview", href: "/admin/finance", icon: CreditCard },
        { name: "Transactions", href: "/admin/finance/transactions", icon: CreditCard },
        { name: "Withdrawals", href: "/admin/finance/withdrawals", icon: CreditCard },
        { name: "Reports", href: "/admin/finance/reports", icon: FileText },
      ],
    },
    {
      name: "Communication",
      href: "/admin/communication",
      icon: MessageSquare,
      children: [
        { name: "Messages", href: "/admin/communication/messages", icon: MessageSquare },
        { name: "Notifications", href: "/admin/communication/notifications", icon: MessageSquare },
        { name: "Announcements", href: "/admin/communication/announcements", icon: Megaphone },
      ],
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      children: [
        { name: "Overview", href: "/admin/analytics", icon: BarChart3 },
        { name: "Users", href: "/admin/analytics/users", icon: Users },
        { name: "Revenue", href: "/admin/analytics/revenue", icon: DollarSign },
        { name: "Performance", href: "/admin/analytics/performance", icon: TrendingUp },
      ],
    },
    {
      name: "System",
      href: "/admin/system",
      icon: Settings,
      children: [
        { name: "Settings", href: "/admin/settings", icon: Settings },
        { name: "Logs", href: "/admin/logs", icon: Activity },
        { name: "Health", href: "/admin/health", icon: Shield },
        { name: "Maps", href: "/admin/maps", icon: MapPin },
      ],
    },
    {
      name: "Plus Management",
      href: "/admin/plus",
      icon: TrendingUp,
      children: [
        { name: "Plans", href: "/admin/plus/plans", icon: TrendingUp },
        { name: "Subscriptions", href: "/admin/plus/subscriptions", icon: Users },
        { name: "Usage", href: "/admin/plus/usage", icon: BarChart3 },
      ],
    },
    {
      name: "Jobs",
      href: "/admin/jobs",
      icon: Briefcase,
      children: [
        { name: "All Jobs", href: "/admin/jobs", icon: Briefcase },
        { name: "Applications", href: "/admin/jobs/applications", icon: Briefcase },
        { name: "Categories", href: "/admin/jobs/categories", icon: Briefcase },
      ],
    },
    {
      name: "Providers",
      href: "/admin/providers",
      icon: Users2,
      children: [
        { name: "All Providers", href: "/admin/providers", icon: Users2 },
        { name: "Verification", href: "/admin/providers/verification", icon: Shield },
        { name: "Performance", href: "/admin/providers/performance", icon: BarChart3 },
      ],
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
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex-shrink-0 lg:sticky lg:top-0 lg:h-screen border-r border-gray-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
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
