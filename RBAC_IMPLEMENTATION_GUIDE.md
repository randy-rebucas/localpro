# Role-Based Access Control (RBAC) Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing and using the role-based access control system in the LocalPro Super App.

## Implementation Status

✅ **Completed:**
- Role utility functions (`src/lib/role-utils.ts`)
- Role guard components (`src/components/role-guard.tsx`)
- Role-based navigation (`src/components/role-based-navigation.tsx`)
- Enhanced middleware with role checking (`src/middleware.ts`)
- Comprehensive documentation (`ROLE_BASED_ACCESS_CONTROL_DOCUMENTATION.md`)

## Quick Start

### 1. Using Role Guards in Components

```tsx
import { RoleGuard, AdminOnly, BusinessRoleOnly, ServiceProviderOnly } from '@/components/role-guard';

// Protect admin-only content
<AdminOnly fallback={<div>Access denied</div>}>
  <AdminDashboard />
</AdminOnly>

// Protect business role content
<BusinessRoleOnly>
  <AnalyticsDashboard />
</BusinessRoleOnly>

// Protect service provider content
<ServiceProviderOnly>
  <ServiceManagement />
</ServiceProviderOnly>

// Custom role checking
<RoleGuard 
  roles={['PROVIDER', 'AGENCY_OWNER']} 
  permissions={['create_service']}
  fallback={<div>Insufficient permissions</div>}
>
  <CreateServiceForm />
</RoleGuard>
```

### 2. Using Role Access Hook

```tsx
import { useRoleAccess } from '@/components/role-guard';

function MyComponent() {
  const {
    isProvider,
    isAdmin,
    canCreateServices,
    canViewAnalytics,
    // ... other role checks
  } = useRoleAccess();

  return (
    <div>
      {isProvider && <ProviderDashboard />}
      {canCreateServices && <CreateServiceButton />}
      {canViewAnalytics && <AnalyticsWidget />}
    </div>
  );
}
```

### 3. Using Role Utilities

```tsx
import { 
  getRolePermissions, 
  getRoleCapabilities, 
  canPerformAction 
} from '@/lib/role-utils';

function checkUserAccess(session) {
  const permissions = getRolePermissions(session);
  const capabilities = getRoleCapabilities(session);
  
  if (canPerformAction(session, 'create_service')) {
    // User can create services
  }
  
  if (permissions.canCreateServices) {
    // User has service creation permission
  }
}
```

## Implementation Details

### Role Hierarchy

```
ADMIN (Full access)
├── AGENCY_OWNER (Agency management + Provider capabilities)
├── AGENCY_ADMIN (Limited agency management + Provider capabilities)
├── PROVIDER (Service provider capabilities)
├── SUPPLIER (Supply management capabilities)
├── INSTRUCTOR (Educational content capabilities)
└── CLIENT (Basic user capabilities)
```

### Permission Matrix

| Role | Services | Jobs | Supplies | Courses | Rentals | Agency | Admin | Analytics |
|------|----------|------|----------|---------|---------|--------|-------|-----------|
| CLIENT | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| PROVIDER | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| SUPPLIER | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| INSTRUCTOR | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| AGENCY_OWNER | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| AGENCY_ADMIN | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Route Protection

The middleware automatically protects routes based on user roles:

- `/admin/*` - Admin only
- `/marketplace/create-service` - Service providers only
- `/marketplace/create-job` - Service providers only
- `/supplies/create` - Suppliers only
- `/academy/create-course` - Instructors only
- `/rentals/create` - Service providers only
- `/analytics` - Business roles only
- `/finance` - Business roles only
- `/agency/*` - Agency roles only

## Usage Examples

### 1. Protecting API Routes

```typescript
// In API route handler
import { getServerSession } from '@/lib/server-session';
import { canPerformAction } from '@/lib/role-utils';

export async function POST(request: NextRequest) {
  const session = await getServerSession(request);
  
  if (!canPerformAction(session, 'create_service')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }
  
  // Create service logic
}
```

### 2. Conditional UI Rendering

```tsx
import { useRoleAccess } from '@/components/role-guard';

function Dashboard() {
  const { 
    isProvider, 
    isSupplier, 
    isInstructor, 
    canCreateServices,
    canViewAnalytics 
  } = useRoleAccess();

  return (
    <div>
      {isProvider && <ServiceProviderDashboard />}
      {isSupplier && <SupplierDashboard />}
      {isInstructor && <InstructorDashboard />}
      {canCreateServices && <CreateServiceButton />}
      {canViewAnalytics && <AnalyticsWidget />}
    </div>
  );
}
```

### 3. Navigation Menu

```tsx
import { RoleBasedNavigation } from '@/components/role-based-navigation';

function Sidebar() {
  return (
    <nav>
      <RoleBasedNavigation />
    </nav>
  );
}
```

### 4. Form Protection

```tsx
import { RoleGuard } from '@/components/role-guard';

function CreateServicePage() {
  return (
    <RoleGuard 
      roles={['PROVIDER', 'AGENCY_OWNER', 'AGENCY_ADMIN', 'ADMIN']}
      fallback={<div>You don't have permission to create services</div>}
    >
      <CreateServiceForm />
    </RoleGuard>
  );
}
```

## Testing

### 1. Unit Tests

```typescript
import { getRolePermissions, canPerformAction } from '@/lib/role-utils';

describe('Role Utils', () => {
  test('Provider can create services', () => {
    const session = { role: 'PROVIDER' };
    expect(canPerformAction(session, 'create_service')).toBe(true);
  });

  test('Client cannot create services', () => {
    const session = { role: 'CLIENT' };
    expect(canPerformAction(session, 'create_service')).toBe(false);
  });
});
```

### 2. Integration Tests

```typescript
import { render, screen } from '@testing-library/react';
import { RoleGuard } from '@/components/role-guard';

test('RoleGuard shows content for authorized users', () => {
  render(
    <RoleGuard roles={['PROVIDER']}>
      <div>Protected Content</div>
    </RoleGuard>
  );
  
  // Test with provider role
  expect(screen.getByText('Protected Content')).toBeInTheDocument();
});
```

## Best Practices

### 1. Always Check Permissions

```tsx
// ✅ Good
<RoleGuard roles={['PROVIDER']}>
  <CreateServiceButton />
</RoleGuard>

// ❌ Bad
<CreateServiceButton />
```

### 2. Use Specific Role Checks

```tsx
// ✅ Good
const { canCreateServices } = useRoleAccess();
if (canCreateServices) {
  // Show create button
}

// ❌ Bad
if (session?.user?.role === 'PROVIDER') {
  // Too specific, doesn't account for other roles
}
```

### 3. Provide Fallback Content

```tsx
// ✅ Good
<RoleGuard 
  roles={['ADMIN']} 
  fallback={<div>Contact admin for access</div>}
>
  <AdminPanel />
</RoleGuard>

// ❌ Bad
<RoleGuard roles={['ADMIN']}>
  <AdminPanel />
</RoleGuard>
```

### 4. Use Permission-Based Checks

```tsx
// ✅ Good
const { canCreateServices } = useRoleAccess();

// ❌ Bad
const isProvider = session?.user?.role === 'PROVIDER';
```

## Troubleshooting

### Common Issues

1. **Role not recognized**: Ensure the role is properly set in the session
2. **Permission denied**: Check if the user has the required role/permission
3. **Route access denied**: Verify the middleware configuration
4. **UI not showing**: Check if the role guard is properly configured

### Debug Mode

```typescript
// Enable debug logging
const DEBUG_RBAC = process.env.NODE_ENV === 'development';

if (DEBUG_RBAC) {
  console.log('User role:', session?.user?.role);
  console.log('Permissions:', getRolePermissions(session));
  console.log('Capabilities:', getRoleCapabilities(session));
}
```

## Migration Guide

### From Basic Role Checking

```tsx
// Old way
const isProvider = session?.user?.role === 'PROVIDER';

// New way
const { isProvider } = useRoleAccess();
```

### From Manual Permission Checks

```tsx
// Old way
if (session?.user?.role === 'PROVIDER' || session?.user?.role === 'ADMIN') {
  // Show content
}

// New way
const { canCreateServices } = useRoleAccess();
if (canCreateServices) {
  // Show content
}
```

## Future Enhancements

1. **Granular Permissions**: More specific permission levels
2. **Role Hierarchies**: Parent-child role relationships
3. **Dynamic Permissions**: Runtime permission assignment
4. **Audit Logging**: Track role-based actions
5. **Permission Inheritance**: Automatic permission inheritance

## Support

For questions or issues with the RBAC implementation:

1. Check the documentation in `ROLE_BASED_ACCESS_CONTROL_DOCUMENTATION.md`
2. Review the utility functions in `src/lib/role-utils.ts`
3. Examine the guard components in `src/components/role-guard.tsx`
4. Test with the provided examples and test cases
