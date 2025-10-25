"use client";

import { useSession, Session } from "@/hooks/useAuth";
import { ReactNode } from "react";
import { 
  hasRole, 
  isServiceProvider, 
  isBusinessRole, 
  isAdministrative,
  canPerformAction,
  UserRole 
} from "@/lib/role-utils";

// Helper function to convert Session to SessionData format for role-utils
function convertSessionToSessionData(session: Session | null) {
  if (!session?.user) return null;
  
  return {
    sessionId: '', // Not available in Session type
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    phone: session.user.phone,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
  };
}

interface RoleGuardProps {
  children: ReactNode;
  roles?: UserRole[];
  permissions?: string[];
  fallback?: ReactNode;
  requireAll?: boolean;
}

/**
 * RoleGuard component for protecting UI elements based on user roles and permissions
 */
export function RoleGuard({ 
  children, 
  roles = [], 
  permissions = [], 
  fallback = null, 
  requireAll = false 
}: RoleGuardProps) {
  const { data: session } = useSession();

  // If no roles or permissions specified, show content
  if (roles.length === 0 && permissions.length === 0) {
    return <>{children}</>;
  }

  const sessionData = convertSessionToSessionData(session);

  // Check role-based access
  if (roles.length > 0) {
    const hasRequiredRole = requireAll 
      ? roles.every(role => hasRole(sessionData, role))
      : roles.some(role => hasRole(sessionData, role));

    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // Check permission-based access
  if (permissions.length > 0) {
    const hasRequiredPermission = requireAll
      ? permissions.every(permission => canPerformAction(sessionData, permission))
      : permissions.some(permission => canPerformAction(sessionData, permission));

    if (!hasRequiredPermission) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * Higher-order component for role-based protection
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  roles?: UserRole[],
  permissions?: string[],
  fallback?: ReactNode
) {
  return function RoleGuardedComponent(props: P) {
    return (
      <RoleGuard roles={roles} permissions={permissions} fallback={fallback}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}

/**
 * Hook for role-based conditional rendering
 */
export function useRoleAccess() {
  const { data: session } = useSession();
  const sessionData = convertSessionToSessionData(session);

  return {
    // Role checks
    isClient: hasRole(sessionData, 'client'),
    isProvider: hasRole(sessionData, 'provider'),
    isSupplier: hasRole(sessionData, 'supplier'),
    isInstructor: hasRole(sessionData, 'instructor'),
    isAgencyOwner: hasRole(sessionData, 'agency_owner'),
    isAgencyAdmin: hasRole(sessionData, 'agency_admin'),
    isAdmin: hasRole(sessionData, 'admin'),
    
    // Capability checks
    isServiceProvider: isServiceProvider(sessionData),
    isBusinessRole: isBusinessRole(sessionData),
    isAdministrative: isAdministrative(sessionData),
    
    // Permission checks
    canCreateServices: canPerformAction(sessionData, 'create_service'),
    canCreateJobs: canPerformAction(sessionData, 'create_job'),
    canCreateSupplies: canPerformAction(sessionData, 'create_supply'),
    canCreateCourses: canPerformAction(sessionData, 'create_course'),
    canCreateRentals: canPerformAction(sessionData, 'create_rental'),
    canManageAgency: canPerformAction(sessionData, 'manage_agency'),
    canAccessAdmin: canPerformAction(sessionData, 'access_admin'),
    canViewAnalytics: canPerformAction(sessionData, 'view_analytics'),
    canManageUsers: canPerformAction(sessionData, 'manage_users'),
    canManagePlatform: canPerformAction(sessionData, 'manage_platform'),
  };
}

/**
 * Specific role guard components for common use cases
 */
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard roles={['admin']} fallback={fallback}>{children}</RoleGuard>;
}

export function BusinessRoleOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard roles={['provider', 'supplier', 'instructor', 'agency_owner', 'agency_admin', 'admin']} fallback={fallback}>{children}</RoleGuard>;
}

export function ServiceProviderOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard roles={['provider', 'agency_owner', 'agency_admin', 'admin']} fallback={fallback}>{children}</RoleGuard>;
}

export function AdministrativeOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard roles={['agency_owner', 'agency_admin', 'admin']} fallback={fallback}>{children}</RoleGuard>;
}

export function SupplierOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard roles={['supplier', 'admin']} fallback={fallback}>{children}</RoleGuard>;
}

export function InstructorOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <RoleGuard roles={['instructor', 'admin']} fallback={fallback}>{children}</RoleGuard>;
}
