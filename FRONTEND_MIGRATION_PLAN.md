# Frontend API Constants Migration Plan

## Overview
This document outlines the step-by-step migration plan to convert all frontend components from hardcoded API URLs to the new constant-based API functions.

## Migration Strategy

### Phase 1: High-Priority Components (Week 1)
**Target:** Core user-facing pages with high traffic

#### 1.1 Dashboard Layout (`src/app/(dashboard)/layout.tsx`)
- **Current Issues:** 3 hardcoded URLs
- **Priority:** CRITICAL - affects all dashboard pages
- **Files to Update:**
  - User profile fetching
  - Search suggestions
  - Notification count

#### 1.2 Messages Page (`src/app/(dashboard)/messages/page.tsx`)
- **Current Issues:** 12 hardcoded URLs
- **Priority:** HIGH - core communication feature
- **Files to Update:**
  - Authentication checks
  - Conversation fetching
  - Message operations
  - Real-time features

#### 1.3 Marketplace Page (`src/app/(dashboard)/marketplace/page.tsx`)
- **Current Issues:** 2 hardcoded URLs
- **Priority:** HIGH - core business feature
- **Files to Update:**
  - Service fetching
  - Service creation

### Phase 2: Secondary Components (Week 2)
**Target:** Important but less critical components

#### 2.1 Ads Management (`src/app/(dashboard)/ads/page.tsx`)
- **Current Issues:** 2 hardcoded URLs
- **Priority:** MEDIUM
- **Files to Update:**
  - Ad fetching
  - Ad promotion

#### 2.2 Supplies Management
- **Files:** `src/app/(dashboard)/supplies/page.tsx`, `create/page.tsx`, `[id]/page.tsx`
- **Current Issues:** 4+ hardcoded URLs
- **Priority:** MEDIUM

#### 2.3 Rentals Management
- **Files:** `src/app/(dashboard)/rentals/page.tsx`, `create/page.tsx`, `[id]/page.tsx`
- **Current Issues:** 4+ hardcoded URLs
- **Priority:** MEDIUM

### Phase 3: Supporting Components (Week 3)
**Target:** Remaining components and utilities

#### 3.1 Profile Management
- **Files:** `src/components/edit-profile-form.tsx`, `src/hooks/useAuth.ts`
- **Current Issues:** 8+ hardcoded URLs
- **Priority:** LOW

#### 3.2 Admin Pages
- **Files:** `src/app/admin/*`
- **Current Issues:** 3+ hardcoded URLs
- **Priority:** LOW

## Migration Steps for Each Component

### Step 1: Import Required Functions
```typescript
// Add these imports to each component
import { 
  makeAuthenticatedRequestWithEndpoint,
  makeAuthenticatedRequestWithPath,
  buildApiUrl,
  handleApiRoute 
} from "@/lib/api-auth-utils";
```

### Step 2: Replace Hardcoded URLs
```typescript
// BEFORE (❌ Bad)
const response = await fetch('/api/ads');

// AFTER (✅ Good)
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'ads',
  { method: 'GET' }
);
```

### Step 3: Update Error Handling
```typescript
// BEFORE (❌ Bad)
try {
  const response = await fetch('/api/ads');
  if (!response.ok) {
    throw new Error('Failed to fetch ads');
  }
  const data = await response.json();
} catch (error) {
  console.error('Error:', error);
}

// AFTER (✅ Good)
try {
  const result = await handleApiRoute(async () => {
    const response = await makeAuthenticatedRequestWithEndpoint(
      request,
      'ads',
      { method: 'GET' }
    );
    return await response.json();
  }, "Fetch ads");
  
  if (result.error) {
    throw new Error(result.error);
  }
  
  const data = result.data;
} catch (error) {
  console.error('Error:', error);
}
```

## Component-Specific Migration Patterns

### Pattern 1: Simple GET Requests
```typescript
// For endpoints without parameters
const response = await makeAuthenticatedRequestWithEndpoint(
  request,
  'endpointName',
  { method: 'GET' }
);
```

### Pattern 2: GET Requests with Query Parameters
```typescript
// For endpoints with query parameters
const response = await makeAuthenticatedRequestWithPath(
  request,
  'endpointName',
  [],
  { param1: 'value1', param2: 'value2' },
  { method: 'GET' }
);
```

### Pattern 3: POST/PUT Requests with Body
```typescript
// For endpoints with request body
const response = await makeAuthenticatedRequestWithPath(
  request,
  'endpointName',
  [],
  {},
  {
    method: 'POST',
    body: JSON.stringify(data)
  }
);
```

### Pattern 4: Dynamic Path Parameters
```typescript
// For endpoints with path parameters
const response = await makeAuthenticatedRequestWithPath(
  request,
  'endpointName',
  [id, subId],
  {},
  { method: 'GET' }
);
```

## Testing Strategy

### Unit Testing
- Test each migrated component individually
- Mock the API functions to avoid external dependencies
- Verify error handling works correctly

### Integration Testing
- Test complete user flows
- Verify authentication works properly
- Check that error states are handled gracefully

### Regression Testing
- Ensure existing functionality still works
- Test with both authenticated and unauthenticated users
- Verify performance hasn't degraded

## Rollback Plan

### If Issues Arise
1. **Immediate:** Revert to previous commit
2. **Short-term:** Use feature flags to disable new patterns
3. **Long-term:** Fix issues and re-deploy

### Monitoring
- Monitor error rates after each deployment
- Track API response times
- Watch for authentication issues

## Success Metrics

### Completion Criteria
- [ ] All hardcoded URLs replaced with constants
- [ ] All `createAuthFetchOptions` usage removed
- [ ] Error handling standardized across components
- [ ] No linting errors related to hardcoded URLs
- [ ] All tests passing

### Quality Metrics
- [ ] 100% of API calls use constant-based functions
- [ ] Consistent error handling across all components
- [ ] No performance degradation
- [ ] Improved type safety

## Timeline

| Week | Focus | Deliverables |
|------|-------|-------------|
| 1 | High-priority components | Dashboard, Messages, Marketplace |
| 2 | Secondary components | Ads, Supplies, Rentals |
| 3 | Supporting components | Profile, Admin, Utilities |
| 4 | Testing & cleanup | Full testing, documentation |

## Risk Mitigation

### Technical Risks
- **Breaking changes:** Gradual migration with feature flags
- **Performance issues:** Monitor and optimize as needed
- **Authentication problems:** Thorough testing of auth flows

### Business Risks
- **User experience:** Careful testing of critical user flows
- **Data integrity:** Verify all API calls work correctly
- **Downtime:** Deploy during low-traffic periods

## Next Steps

1. **Start with Phase 1** - High-priority components
2. **Create feature branch** for migration work
3. **Set up monitoring** for API calls
4. **Begin with dashboard layout** as it affects all pages
5. **Test thoroughly** before moving to next component

This migration will significantly improve code maintainability, type safety, and consistency across the application.
