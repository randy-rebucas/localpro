import { 
  hasRole, 
  isServiceProvider, 
  isBusinessRole, 
  isAdministrative,
  getRolePermissions, 
  canPerformAction,
  canAccessRoute,
  getRoleDisplayName,
  getRoleDescription
} from '../role-utils';

// Mock session data
const mockSession = (role: string) => ({
  userId: '123',
  email: 'test@example.com',
  name: 'Test User',
  role,
  phone: '+1234567890',
  sessionId: 'session123'
});

describe('Role Utils', () => {
  describe('hasRole', () => {
    test('should return true for matching role', () => {
      const session = mockSession('provider');
      expect(hasRole(session, 'provider')).toBe(true);
    });

    test('should return false for non-matching role', () => {
      const session = mockSession('client');
      expect(hasRole(session, 'provider')).toBe(false);
    });

    test('should return false for null session', () => {
      expect(hasRole(null, 'provider')).toBe(false);
    });
  });

  describe('isServiceProvider', () => {
    test('should return true for provider role', () => {
      const session = mockSession('provider');
      expect(isServiceProvider(session)).toBe(true);
    });

    test('should return true for agency_owner role', () => {
      const session = mockSession('agency_owner');
      expect(isServiceProvider(session)).toBe(true);
    });

    test('should return true for agency_admin role', () => {
      const session = mockSession('agency_admin');
      expect(isServiceProvider(session)).toBe(true);
    });

    test('should return true for admin role', () => {
      const session = mockSession('admin');
      expect(isServiceProvider(session)).toBe(true);
    });

    test('should return false for client role', () => {
      const session = mockSession('client');
      expect(isServiceProvider(session)).toBe(false);
    });
  });

  describe('isBusinessRole', () => {
    test('should return true for business roles', () => {
      const businessRoles = ['provider', 'supplier', 'instructor', 'agency_owner', 'agency_admin', 'admin'];
      businessRoles.forEach(role => {
        const session = mockSession(role);
        expect(isBusinessRole(session)).toBe(true);
      });
    });

    test('should return false for client role', () => {
      const session = mockSession('client');
      expect(isBusinessRole(session)).toBe(false);
    });
  });

  describe('isAdministrative', () => {
    test('should return true for administrative roles', () => {
      const adminRoles = ['agency_owner', 'agency_admin', 'admin'];
      adminRoles.forEach(role => {
        const session = mockSession(role);
        expect(isAdministrative(session)).toBe(true);
      });
    });

    test('should return false for non-administrative roles', () => {
      const nonAdminRoles = ['client', 'provider', 'supplier', 'instructor'];
      nonAdminRoles.forEach(role => {
        const session = mockSession(role);
        expect(isAdministrative(session)).toBe(false);
      });
    });
  });

  describe('getRolePermissions', () => {
    test('should return correct permissions for provider', () => {
      const session = mockSession('provider');
      const permissions = getRolePermissions(session);
      
      expect(permissions.canCreateServices).toBe(true);
      expect(permissions.canCreateJobs).toBe(true);
      expect(permissions.canCreateSupplies).toBe(false);
      expect(permissions.canCreateCourses).toBe(false);
      expect(permissions.canCreateRentals).toBe(true);
      expect(permissions.canManageAgency).toBe(false);
      expect(permissions.canAccessAdmin).toBe(false);
      expect(permissions.canViewAnalytics).toBe(true);
      expect(permissions.canManageUsers).toBe(false);
      expect(permissions.canManagePlatform).toBe(false);
    });

    test('should return correct permissions for admin', () => {
      const session = mockSession('admin');
      const permissions = getRolePermissions(session);
      
      expect(permissions.canCreateServices).toBe(true);
      expect(permissions.canCreateJobs).toBe(true);
      expect(permissions.canCreateSupplies).toBe(true);
      expect(permissions.canCreateCourses).toBe(true);
      expect(permissions.canCreateRentals).toBe(true);
      expect(permissions.canManageAgency).toBe(true);
      expect(permissions.canAccessAdmin).toBe(true);
      expect(permissions.canViewAnalytics).toBe(true);
      expect(permissions.canManageUsers).toBe(true);
      expect(permissions.canManagePlatform).toBe(true);
    });

    test('should return correct permissions for client', () => {
      const session = mockSession('client');
      const permissions = getRolePermissions(session);
      
      expect(permissions.canCreateServices).toBe(false);
      expect(permissions.canCreateJobs).toBe(false);
      expect(permissions.canCreateSupplies).toBe(false);
      expect(permissions.canCreateCourses).toBe(false);
      expect(permissions.canCreateRentals).toBe(false);
      expect(permissions.canManageAgency).toBe(false);
      expect(permissions.canAccessAdmin).toBe(false);
      expect(permissions.canViewAnalytics).toBe(false);
      expect(permissions.canManageUsers).toBe(false);
      expect(permissions.canManagePlatform).toBe(false);
    });
  });

  describe('canPerformAction', () => {
    test('should allow provider to create services', () => {
      const session = mockSession('provider');
      expect(canPerformAction(session, 'create_service')).toBe(true);
    });

    test('should not allow client to create services', () => {
      const session = mockSession('client');
      expect(canPerformAction(session, 'create_service')).toBe(false);
    });

    test('should allow admin to access admin', () => {
      const session = mockSession('admin');
      expect(canPerformAction(session, 'access_admin')).toBe(true);
    });

    test('should not allow provider to access admin', () => {
      const session = mockSession('provider');
      expect(canPerformAction(session, 'access_admin')).toBe(false);
    });
  });

  describe('canAccessRoute', () => {
    test('should allow admin to access admin routes', () => {
      const session = mockSession('admin');
      expect(canAccessRoute(session, '/admin')).toBe(true);
      expect(canAccessRoute(session, '/admin/users')).toBe(true);
    });

    test('should not allow client to access admin routes', () => {
      const session = mockSession('client');
      expect(canAccessRoute(session, '/admin')).toBe(false);
    });

    test('should allow provider to access service creation routes', () => {
      const session = mockSession('provider');
      expect(canAccessRoute(session, '/marketplace/create-service')).toBe(true);
      expect(canAccessRoute(session, '/marketplace/my-services')).toBe(true);
    });

    test('should not allow client to access service creation routes', () => {
      const session = mockSession('client');
      expect(canAccessRoute(session, '/marketplace/create-service')).toBe(false);
    });

    test('should allow supplier to access supply creation routes', () => {
      const session = mockSession('supplier');
      expect(canAccessRoute(session, '/supplies/create')).toBe(true);
      expect(canAccessRoute(session, '/supplies/my-supplies')).toBe(true);
    });

    test('should not allow provider to access supply creation routes', () => {
      const session = mockSession('provider');
      expect(canAccessRoute(session, '/supplies/create')).toBe(false);
    });
  });

  describe('getRoleDisplayName', () => {
    test('should return correct display names', () => {
      expect(getRoleDisplayName('client')).toBe('Client');
      expect(getRoleDisplayName('provider')).toBe('Service Provider');
      expect(getRoleDisplayName('supplier')).toBe('Supplier');
      expect(getRoleDisplayName('instructor')).toBe('Instructor');
      expect(getRoleDisplayName('agency_owner')).toBe('Agency Owner');
      expect(getRoleDisplayName('agency_admin')).toBe('Agency Admin');
      expect(getRoleDisplayName('admin')).toBe('Administrator');
    });
  });

  describe('getRoleDescription', () => {
    test('should return correct descriptions', () => {
      expect(getRoleDescription('client')).toContain('Regular users');
      expect(getRoleDescription('provider')).toContain('Service providers');
      expect(getRoleDescription('admin')).toContain('Platform administrators');
    });
  });
});
