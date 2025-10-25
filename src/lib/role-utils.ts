import { SessionData } from './session';

export type UserRole = 
  | 'client' 
  | 'provider' 
  | 'supplier' 
  | 'instructor' 
  | 'agency_owner' 
  | 'agency_admin' 
  | 'admin';

export interface RolePermissions {
  canCreateServices: boolean;
  canCreateJobs: boolean;
  canCreateSupplies: boolean;
  canCreateCourses: boolean;
  canCreateRentals: boolean;
  canManageAgency: boolean;
  canAccessAdmin: boolean;
  canViewAnalytics: boolean;
  canManageUsers: boolean;
  canManagePlatform: boolean;
}

export interface RoleCapabilities {
  isBusinessRole: boolean;
  isServiceProvider: boolean;
  isAdministrative: boolean;
  isAdmin: boolean;
  canManageContent: boolean;
  canManageUsers: boolean;
  canAccessFinance: boolean;
  canAccessAnalytics: boolean;
}

/**
 * Check if user has a specific role
 */
export function hasRole(session: SessionData | null, role: UserRole): boolean {
  return session?.role === role;
}

/**
 * Check if user is a service provider (Provider, Agency Owner, Agency Admin, Admin)
 */
export function isServiceProvider(session: SessionData | null): boolean {
  if (!session) return false;
  return ['provider', 'agency_owner', 'agency_admin', 'admin'].includes(session.role);
}

/**
 * Check if user is a supplier
 */
export function isSupplier(session: SessionData | null): boolean {
  return hasRole(session, 'supplier');
}

/**
 * Check if user is an instructor
 */
export function isInstructor(session: SessionData | null): boolean {
  return hasRole(session, 'instructor');
}

/**
 * Check if user is an agency owner
 */
export function isAgencyOwner(session: SessionData | null): boolean {
  return hasRole(session, 'agency_owner');
}

/**
 * Check if user is an agency admin
 */
export function isAgencyAdmin(session: SessionData | null): boolean {
  return hasRole(session, 'agency_admin');
}

/**
 * Check if user is an admin
 */
export function isAdmin(session: SessionData | null): boolean {
  return hasRole(session, 'admin');
}

/**
 * Check if user has business role (Provider, Supplier, Instructor, Agency roles, Admin)
 */
export function isBusinessRole(session: SessionData | null): boolean {
  if (!session) return false;
  return ['provider', 'supplier', 'instructor', 'agency_owner', 'agency_admin', 'admin'].includes(session.role);
}

/**
 * Check if user has administrative privileges (Agency Owner, Agency Admin, Admin)
 */
export function isAdministrative(session: SessionData | null): boolean {
  if (!session) return false;
  return ['agency_owner', 'agency_admin', 'admin'].includes(session.role);
}

/**
 * Get role-based permissions for a user
 */
export function getRolePermissions(session: SessionData | null): RolePermissions {
  if (!session) {
    return {
      canCreateServices: false,
      canCreateJobs: false,
      canCreateSupplies: false,
      canCreateCourses: false,
      canCreateRentals: false,
      canManageAgency: false,
      canAccessAdmin: false,
      canViewAnalytics: false,
      canManageUsers: false,
      canManagePlatform: false,
    };
  }

  const role = session.role as UserRole;

  switch (role) {
    case 'client':
      return {
        canCreateServices: false,
        canCreateJobs: false,
        canCreateSupplies: false,
        canCreateCourses: false,
        canCreateRentals: false,
        canManageAgency: false,
        canAccessAdmin: false,
        canViewAnalytics: false,
        canManageUsers: false,
        canManagePlatform: false,
      };

    case 'provider':
      return {
        canCreateServices: true,
        canCreateJobs: true,
        canCreateSupplies: false,
        canCreateCourses: false,
        canCreateRentals: true,
        canManageAgency: false,
        canAccessAdmin: false,
        canViewAnalytics: true,
        canManageUsers: false,
        canManagePlatform: false,
      };

    case 'supplier':
      return {
        canCreateServices: false,
        canCreateJobs: false,
        canCreateSupplies: true,
        canCreateCourses: false,
        canCreateRentals: false,
        canManageAgency: false,
        canAccessAdmin: false,
        canViewAnalytics: true,
        canManageUsers: false,
        canManagePlatform: false,
      };

    case 'instructor':
      return {
        canCreateServices: false,
        canCreateJobs: false,
        canCreateSupplies: false,
        canCreateCourses: true,
        canCreateRentals: false,
        canManageAgency: false,
        canAccessAdmin: false,
        canViewAnalytics: true,
        canManageUsers: false,
        canManagePlatform: false,
      };

    case 'agency_owner':
      return {
        canCreateServices: true,
        canCreateJobs: true,
        canCreateSupplies: false,
        canCreateCourses: false,
        canCreateRentals: true,
        canManageAgency: true,
        canAccessAdmin: false,
        canViewAnalytics: true,
        canManageUsers: true,
        canManagePlatform: false,
      };

    case 'agency_admin':
      return {
        canCreateServices: true,
        canCreateJobs: true,
        canCreateSupplies: false,
        canCreateCourses: false,
        canCreateRentals: true,
        canManageAgency: true,
        canAccessAdmin: false,
        canViewAnalytics: true,
        canManageUsers: true,
        canManagePlatform: false,
      };

    case 'admin':
      return {
        canCreateServices: true,
        canCreateJobs: true,
        canCreateSupplies: true,
        canCreateCourses: true,
        canCreateRentals: true,
        canManageAgency: true,
        canAccessAdmin: true,
        canViewAnalytics: true,
        canManageUsers: true,
        canManagePlatform: true,
      };

    default:
      return {
        canCreateServices: false,
        canCreateJobs: false,
        canCreateSupplies: false,
        canCreateCourses: false,
        canCreateRentals: false,
        canManageAgency: false,
        canAccessAdmin: false,
        canViewAnalytics: false,
        canManageUsers: false,
        canManagePlatform: false,
      };
  }
}

/**
 * Get role-based capabilities for a user
 */
export function getRoleCapabilities(session: SessionData | null): RoleCapabilities {
  if (!session) {
    return {
      isBusinessRole: false,
      isServiceProvider: false,
      isAdministrative: false,
      isAdmin: false,
      canManageContent: false,
      canManageUsers: false,
      canAccessFinance: false,
      canAccessAnalytics: false,
    };
  }

  return {
    isBusinessRole: isBusinessRole(session),
    isServiceProvider: isServiceProvider(session),
    isAdministrative: isAdministrative(session),
    isAdmin: isAdmin(session),
    canManageContent: isBusinessRole(session),
    canManageUsers: isAdministrative(session),
    canAccessFinance: isBusinessRole(session),
    canAccessAnalytics: isBusinessRole(session),
  };
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(session: SessionData | null, route: string): boolean {
  if (!session) {
    // Public routes that don't require authentication
    const publicRoutes = ['/', '/about', '/contact', '/help', '/privacy', '/terms'];
    return publicRoutes.includes(route);
  }

  const permissions = getRolePermissions(session);
  const capabilities = getRoleCapabilities(session);

  // Admin routes
  if (route.startsWith('/admin')) {
    return permissions.canAccessAdmin;
  }

  // Business role routes
  if (route.startsWith('/marketplace/create-service') || route.startsWith('/marketplace/my-services')) {
    return permissions.canCreateServices;
  }

  if (route.startsWith('/marketplace/create-job') || route.startsWith('/marketplace/my-jobs')) {
    return permissions.canCreateJobs;
  }

  if (route.startsWith('/supplies/create') || route.startsWith('/supplies/my-supplies')) {
    return permissions.canCreateSupplies;
  }

  if (route.startsWith('/academy/create-course') || route.startsWith('/academy/my-created-courses')) {
    return permissions.canCreateCourses;
  }

  if (route.startsWith('/rentals/create') || route.startsWith('/rentals/my-rentals')) {
    return permissions.canCreateRentals;
  }

  // Analytics routes
  if (route.includes('/analytics')) {
    return capabilities.canAccessAnalytics;
  }

  // Finance routes
  if (route.includes('/finance')) {
    return capabilities.canAccessFinance;
  }

  // Default: allow access to authenticated users
  return true;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    client: 'Client',
    provider: 'Service Provider',
    supplier: 'Supplier',
    instructor: 'Instructor',
    agency_owner: 'Agency Owner',
    agency_admin: 'Agency Admin',
    admin: 'Administrator',
  };

  return roleNames[role] || role;
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    client: 'Regular users who can book services, purchase supplies, and use basic platform features.',
    provider: 'Service providers who offer marketplace services and manage their business.',
    supplier: 'Materials and equipment suppliers who provide supplies to the platform.',
    instructor: 'Educational content creators who create and manage academy courses.',
    agency_owner: 'Agency owners who manage agencies and their providers.',
    agency_admin: 'Agency administrators with limited agency management capabilities.',
    admin: 'Platform administrators with full system access.',
  };

  return descriptions[role] || 'Unknown role';
}

/**
 * Check if user can perform a specific action
 */
export function canPerformAction(session: SessionData | null, action: string): boolean {
  if (!session) return false;

  const permissions = getRolePermissions(session);

  switch (action) {
    case 'create_service':
      return permissions.canCreateServices;
    case 'create_job':
      return permissions.canCreateJobs;
    case 'create_supply':
      return permissions.canCreateSupplies;
    case 'create_course':
      return permissions.canCreateCourses;
    case 'create_rental':
      return permissions.canCreateRentals;
    case 'manage_agency':
      return permissions.canManageAgency;
    case 'access_admin':
      return permissions.canAccessAdmin;
    case 'view_analytics':
      return permissions.canViewAnalytics;
    case 'manage_users':
      return permissions.canManageUsers;
    case 'manage_platform':
      return permissions.canManagePlatform;
    default:
      return false;
  }
}
