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
 * Get user roles array from session
 */
export function getUserRoles(session: SessionData | null): string[] {
  if (!session) return [];
  
  // Return roles array, default to ['client'] if empty
  if (session.roles && Array.isArray(session.roles) && session.roles.length > 0) {
    return session.roles;
  }
  
  // Default to client role if no roles specified
  return ['client'];
}

/**
 * Check if user has a specific role
 */
export function hasRole(session: SessionData | null, role: UserRole): boolean {
  const roles = getUserRoles(session);
  return roles.includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(session: SessionData | null, rolesToCheck: UserRole[]): boolean {
  const userRoles = getUserRoles(session);
  return rolesToCheck.some(role => userRoles.includes(role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(session: SessionData | null, rolesToCheck: UserRole[]): boolean {
  const userRoles = getUserRoles(session);
  return rolesToCheck.every(role => userRoles.includes(role));
}

/**
 * Check if user is a service provider (Provider, Agency Owner, Agency Admin, Admin)
 */
export function isServiceProvider(session: SessionData | null): boolean {
  return hasAnyRole(session, ['provider', 'agency_owner', 'agency_admin', 'admin']);
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
  return hasAnyRole(session, ['provider', 'supplier', 'instructor', 'agency_owner', 'agency_admin', 'admin']);
}

/**
 * Check if user has administrative privileges (Agency Owner, Agency Admin, Admin)
 */
export function isAdministrative(session: SessionData | null): boolean {
  return hasAnyRole(session, ['agency_owner', 'agency_admin', 'admin']);
}

/**
 * Get role-based permissions for a user (supports multi-role)
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

  const userRoles = getUserRoles(session);
  
  // Initialize permissions
  const permissions: RolePermissions = {
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

  // Aggregate permissions from all roles (OR logic - if any role has permission, grant it)
  userRoles.forEach(role => {
    switch (role) {
      case 'provider':
        permissions.canCreateServices = true;
        permissions.canCreateJobs = true;
        permissions.canCreateRentals = true;
        permissions.canViewAnalytics = true;
        break;

      case 'supplier':
        permissions.canCreateSupplies = true;
        permissions.canViewAnalytics = true;
        break;

      case 'instructor':
        permissions.canCreateCourses = true;
        permissions.canViewAnalytics = true;
        break;

      case 'agency_owner':
        permissions.canCreateServices = true;
        permissions.canCreateJobs = true;
        permissions.canCreateRentals = true;
        permissions.canManageAgency = true;
        permissions.canViewAnalytics = true;
        permissions.canManageUsers = true;
        break;

      case 'agency_admin':
        permissions.canCreateServices = true;
        permissions.canCreateJobs = true;
        permissions.canCreateRentals = true;
        permissions.canManageAgency = true;
        permissions.canViewAnalytics = true;
        permissions.canManageUsers = true;
        break;

      case 'admin':
        // Admin has all permissions
        permissions.canCreateServices = true;
        permissions.canCreateJobs = true;
        permissions.canCreateSupplies = true;
        permissions.canCreateCourses = true;
        permissions.canCreateRentals = true;
        permissions.canManageAgency = true;
        permissions.canAccessAdmin = true;
        permissions.canViewAnalytics = true;
        permissions.canManageUsers = true;
        permissions.canManagePlatform = true;
        break;
    }
  });

  return permissions;
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
