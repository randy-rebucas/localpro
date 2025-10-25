"use client";

import { useSession } from "@/hooks/useAuth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Store, 
  Package, 
  GraduationCap, 
  Car, 
  Plus, 
  Settings, 
  MessageSquare, 
  Bell, 
  HelpCircle,
  BarChart3,
  CreditCard,
  Users,
  Shield,
  Briefcase,
  Building
} from "lucide-react";
import { useRoleAccess } from "./role-guard";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  permissions?: string[];
  badge?: string;
  children?: NavigationItem[];
}

export function RoleBasedNavigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const roleAccess = useRoleAccess();

  const navigationItems: NavigationItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "Marketplace",
      href: "/marketplace",
      icon: Store,
      children: [
        {
          name: "Browse Services",
          href: "/marketplace",
          icon: Store,
        },
        {
          name: "My Services",
          href: "/marketplace/my-services",
          icon: Store,
          roles: ["provider", "agency_owner", "agency_admin", "admin"],
        },
        {
          name: "Create Service",
          href: "/marketplace/create-service",
          icon: Plus,
          roles: ["provider", "agency_owner", "agency_admin", "admin"],
        },
        {
          name: "My Bookings",
          href: "/marketplace/my-bookings",
          icon: Store,
        },
        {
          name: "Jobs",
          href: "/marketplace/jobs",
          icon: Briefcase,
          children: [
            {
              name: "Browse Jobs",
              href: "/marketplace/jobs",
              icon: Briefcase,
            },
            {
              name: "My Jobs",
              href: "/marketplace/jobs/my-jobs",
              icon: Briefcase,
              roles: ["provider", "agency_owner", "agency_admin", "admin"],
            },
            {
              name: "Create Job",
              href: "/marketplace/create-job",
              icon: Plus,
              roles: ["provider", "agency_owner", "agency_admin", "admin"],
            },
            {
              name: "My Applications",
              href: "/marketplace/jobs/my-applications",
              icon: Briefcase,
            },
          ],
        },
      ],
    },
    {
      name: "Supplies",
      href: "/supplies",
      icon: Package,
      roles: ["supplier", "admin"],
      children: [
        {
          name: "Browse Supplies",
          href: "/supplies",
          icon: Package,
        },
        {
          name: "My Supplies",
          href: "/supplies/my-supplies",
          icon: Package,
          roles: ["supplier", "admin"],
        },
        {
          name: "Create Supply",
          href: "/supplies/create",
          icon: Plus,
          roles: ["supplier", "admin"],
        },
        {
          name: "My Orders",
          href: "/supplies/my-orders",
          icon: Package,
        },
      ],
    },
    {
      name: "Academy",
      href: "/academy",
      icon: GraduationCap,
      children: [
        {
          name: "Browse Courses",
          href: "/academy",
          icon: GraduationCap,
        },
        {
          name: "My Courses",
          href: "/academy/my-courses",
          icon: GraduationCap,
        },
        {
          name: "My Created Courses",
          href: "/academy/my-created-courses",
          icon: GraduationCap,
          roles: ["instructor", "admin"],
        },
        {
          name: "Create Course",
          href: "/academy/create-course",
          icon: Plus,
          roles: ["instructor", "admin"],
        },
      ],
    },
    {
      name: "Rentals",
      href: "/rentals",
      icon: Car,
      children: [
        {
          name: "Browse Rentals",
          href: "/rentals",
          icon: Car,
        },
        {
          name: "My Rentals",
          href: "/rentals/my-rentals",
          icon: Car,
          roles: ["provider", "agency_owner", "agency_admin", "admin"],
        },
        {
          name: "Create Rental",
          href: "/rentals/create",
          icon: Plus,
          roles: ["provider", "agency_owner", "agency_admin", "admin"],
        },
        {
          name: "My Bookings",
          href: "/rentals/my-bookings",
          icon: Car,
        },
      ],
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      roles: ["provider", "supplier", "instructor", "agency_owner", "agency_admin", "admin"],
    },
    {
      name: "Finance",
      href: "/finance",
      icon: CreditCard,
      roles: ["provider", "supplier", "instructor", "agency_owner", "agency_admin", "admin"],
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageSquare,
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
    {
      name: "Help",
      href: "/help",
      icon: HelpCircle,
    },
  ];

  // Admin-only navigation items
  const adminNavigationItems: NavigationItem[] = [
    {
      name: "Admin Dashboard",
      href: "/admin",
      icon: Shield,
      roles: ["admin"],
    },
    {
      name: "User Management",
      href: "/admin/users",
      icon: Users,
      roles: ["admin"],
    },
    {
      name: "Platform Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      roles: ["admin"],
    },
    {
      name: "System Settings",
      href: "/admin/settings",
      icon: Settings,
      roles: ["admin"],
    },
  ];

  // Agency management navigation items
  const agencyNavigationItems: NavigationItem[] = [
    {
      name: "Agency Management",
      href: "/agency",
      icon: Building,
      roles: ["agency_owner", "agency_admin", "admin"],
    },
    {
      name: "Agency Providers",
      href: "/agency/providers",
      icon: Users,
      roles: ["agency_owner", "agency_admin", "admin"],
    },
    {
      name: "Agency Analytics",
      href: "/agency/analytics",
      icon: BarChart3,
      roles: ["agency_owner", "agency_admin", "admin"],
    },
  ];

  const isItemVisible = (item: NavigationItem): boolean => {
    // Check role-based visibility
    if (item.roles && item.roles.length > 0) {
      if (!session?.user?.role || !item.roles.includes(session.user.role)) {
        return false;
      }
    }

    // Check permission-based visibility
    if (item.permissions && item.permissions.length > 0) {
      const hasPermission = item.permissions.some(permission => {
        switch (permission) {
          case 'create_service':
            return roleAccess.canCreateServices;
          case 'create_job':
            return roleAccess.canCreateJobs;
          case 'create_supply':
            return roleAccess.canCreateSupplies;
          case 'create_course':
            return roleAccess.canCreateCourses;
          case 'create_rental':
            return roleAccess.canCreateRentals;
          case 'manage_agency':
            return roleAccess.canManageAgency;
          case 'access_admin':
            return roleAccess.canAccessAdmin;
          case 'view_analytics':
            return roleAccess.canViewAnalytics;
          default:
            return false;
        }
      });

      if (!hasPermission) {
        return false;
      }
    }

    return true;
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    if (!isItemVisible(item)) {
      return null;
    }

    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.href} className={`${level > 0 ? 'ml-4' : ''}`}>
        <Link
          href={item.href}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <item.icon className="w-5 h-5 mr-3" />
          <span>{item.name}</span>
          {item.badge && (
            <span className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {item.badge}
            </span>
          )}
        </Link>
        
        {hasChildren && (
          <div className="mt-1 space-y-1">
            {item.children?.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="space-y-1">
      {/* Regular navigation items */}
      {navigationItems.map(item => renderNavigationItem(item))}
      
      {/* Agency management items */}
      {roleAccess.isAdministrative && (
        <>
          <div className="border-t border-gray-200 my-4"></div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Agency Management
          </div>
          {agencyNavigationItems.map(item => renderNavigationItem(item))}
        </>
      )}
      
      {/* Admin items */}
      {roleAccess.isAdmin && (
        <>
          <div className="border-t border-gray-200 my-4"></div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Administration
          </div>
          {adminNavigationItems.map(item => renderNavigationItem(item))}
        </>
      )}
    </nav>
  );
}
