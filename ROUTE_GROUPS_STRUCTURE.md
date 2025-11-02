# Next.js Route Groups Reorganization Plan

Based on [Next.js Route Groups convention](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups), this document outlines the proposed reorganization of the app directory structure.

## Current Structure ✅ COMPLETED

```
src/app/
├── (authenticated)/     # ✅ Renamed from (dashboard)
│   ├── layout.tsx
│   ├── dashboard/
│   ├── marketplace/
│   ├── supplies/
│   ├── rentals/
│   └── ... (all authenticated user pages)
├── (admin)/             # ✅ Admin route group
│   ├── layout.tsx
│   ├── users/
│   ├── marketplace/
│   ├── analytics/
│   └── ... (all admin pages)
├── (public)/            # ✅ Public pages route group
│   ├── about/
│   ├── auth/
│   ├── blog/
│   ├── contact/
│   └── ... (all public pages)
└── ...
```

**Status:** ✅ Reorganization complete! 
- `(dashboard)` renamed to `(authenticated)`
- `(admin)` route group created
- `(public)` route group created for public pages

## Proposed Structure Following Route Groups Convention

### Option 1: Simple Admin Route Group (Recommended)
Wrap admin in a route group while maintaining current URL structure:

```
src/app/
├── (dashboard)/              # Dashboard routes group
│   ├── layout.tsx
│   ├── marketplace/
│   ├── supplies/
│   └── ...
│
├── (admin)/                 # Admin routes group
│   ├── layout.tsx
│   ├── users/
│   ├── marketplace/
│   ├── analytics/
│   └── ...
│
├── (auth)/                  # Auth routes group
│   ├── layout.tsx
│   └── page.tsx
│
├── (marketing)/             # Public marketing pages
│   ├── about/
│   ├── contact/
│   ├── blog/
│   └── ...
│
└── layout.tsx               # Root layout
```

**URL Structure:** Unchanged
- `/admin/users` → still `/admin/users`
- `/dashboard` → still `/dashboard`

### Option 2: Feature-Based Admin Groups (Advanced)
Organize admin by functional areas:

```
src/app/
├── (dashboard)/
│   └── ...
│
├── (admin)/
│   ├── layout.tsx           # Admin root layout
│   │
│   ├── (admin-management)/  # User & provider management
│   │   ├── users/
│   │   ├── providers/
│   │   └── trust-verification/
│   │
│   ├── (admin-content)/     # Content management
│   │   ├── marketplace/
│   │   ├── jobs/
│   │   ├── academy/
│   │   └── ads/
│   │
│   ├── (admin-operations)/  # Supply chain
│   │   ├── supplies/
│   │   └── rentals/
│   │
│   ├── (admin-finance)/     # Financial management
│   │   ├── finance/
│   │   ├── payments/
│   │   └── plus/
│   │
│   ├── (admin-system)/      # System administration
│   │   ├── logs/
│   │   ├── audit/
│   │   ├── errors/
│   │   ├── analytics/
│   │   ├── communication/
│   │   ├── referrals/
│   │   └── settings/
│   │
│   └── page.tsx             # Admin dashboard
│
└── layout.tsx
```

## Migration Groups Reorganized by Route Groups

### Group A: (dashboard) Route Group
**Already organized ✅** - All dashboard pages are in `(dashboard)/`

**Remaining migrations:**
- `(dashboard)/layout.tsx` - 4 matches ⚠️ HIGH PRIORITY

### Group B: (admin) Route Group
**Needs reorganization** - Move `admin/` → `(admin)/`

#### B.1 (admin-management) Sub-group
**Purpose:** User and provider management
- `users/page.tsx` (6 matches - partially migrated ✅)
- `providers/page.tsx` (5 matches)
- `trust-verification/page.tsx` (5 matches)

#### B.2 (admin-content) Sub-group  
**Purpose:** Content and marketplace management
- `marketplace/page.tsx` (3 matches)
- `jobs/page.tsx` (5 matches)
- `academy/page.tsx` (2 matches)
- `ads/page.tsx` (3 matches)

#### B.3 (admin-operations) Sub-group
**Purpose:** Supply chain operations
- `supplies/page.tsx` (3 matches)
- `rentals/page.tsx` (1 match)

#### B.4 (admin-finance) Sub-group
**Purpose:** Financial and payment management
- `finance/page.tsx` (5 matches)
- `payments/page.tsx` (4 matches)
- `plus/page.tsx` (7 matches)

#### B.5 (admin-system) Sub-group
**Purpose:** System monitoring and configuration
- `logs/page.tsx` (9 matches) ⚠️ HIGH PRIORITY
- `audit/page.tsx` (4 matches)
- `errors/page.tsx` (5 matches)
- `analytics/page.tsx` (3 matches)
- `communication/page.tsx` (2 matches)
- `referrals/page.tsx` (3 matches)
- `settings/page.tsx` (3 matches)

#### B.6 Admin Root
- `page.tsx` (3 matches - partially migrated ✅)

### Group C: Core Infrastructure (Outside Route Groups)
**These are foundational files:**

#### C.1 Authentication Hook
- `src/hooks/useAuth.ts` (3 matches) ⚠️ CRITICAL
  - Used by all route groups
  - Must be migrated first

#### C.2 Utilities
- `src/components/token-expiry-example.tsx` (9 matches)
- `src/lib/client-api-utils.ts` (6 matches - deprecate after migration)

## Recommended Migration Path by Route Groups

### Phase 1: Core Infrastructure
1. `src/hooks/useAuth.ts` ⚠️ CRITICAL
2. `(dashboard)/layout.tsx` ⚠️ HIGH

### Phase 2: Reorganize Admin Structure
3. Move `admin/` → `(admin)/` (maintain URLs)
4. Optionally create sub-groups for better organization

### Phase 3: Admin Routes Migration
5. `(admin)/page.tsx` - Complete dashboard
6. `(admin-system)/logs/page.tsx` - Most complex (9 matches)
7. Batch migrate by sub-group:
   - `(admin-management)` - 3 files
   - `(admin-content)` - 4 files  
   - `(admin-operations)` - 2 files
   - `(admin-finance)` - 3 files
   - `(admin-system)` - 7 files

### Phase 4: Cleanup
8. Update or remove example files
9. Deprecate `client-api-utils.ts`

## Route Group Benefits

### 1. Organizational Clarity
- Groups pages by feature/team/concern
- Clear separation of admin vs dashboard vs marketing
- Easier navigation in codebase

### 2. Layout Sharing
- Each route group can have its own layout
- `(admin)/layout.tsx` applies to all admin routes
- `(dashboard)/layout.tsx` applies to all dashboard routes

### 3. Team Collaboration
- Teams can own specific route groups
- Easier code reviews by area
- Clear ownership boundaries

### 4. Conditional Features
- Route groups can have different features enabled
- Admin can have admin-specific UI components
- Dashboard can have user-specific features

## Implementation Notes

### Moving Files
When reorganizing:
1. **URLs remain unchanged** - Route groups don't affect URLs
2. **Update imports** - Components importing from old paths
3. **Update navigation** - Links remain the same
4. **Test routing** - Verify all routes still work

### Layout Hierarchy
```
Root Layout (app/layout.tsx)
  ├── (dashboard)/layout.tsx
  │   └── Dashboard pages
  ├── (admin)/layout.tsx
  │   └── Admin pages
  └── (marketing)/pages (no layout)
      └── Public pages
```

### Caveats from Next.js Docs
- **Full page load:** Navigating between route groups with different root layouts triggers full reload
- **Conflicting paths:** Routes in different groups cannot resolve to same URL
- **Top-level root layout:** If using multiple root layouts, home route (/) must be in a route group

## Current Status Summary

| Route Group | Status | Files Remaining | Priority |
|-------------|--------|-----------------|----------|
| `(dashboard)` | ✅ Organized | 1 file (layout.tsx) | HIGH |
| `admin` | ❌ Not grouped | 20 files | MEDIUM |
| Core Infrastructure | N/A | 3 files | CRITICAL |
| Utilities | N/A | 2 files | LOW |

## Action Items

### Immediate
1. ✅ Complete `(dashboard)/layout.tsx` migration
2. ✅ Migrate `src/hooks/useAuth.ts` 
3. ⏳ Reorganize `admin/` → `(admin)/` (optional, doesn't block migration)

### Next Steps
4. Migrate admin pages systematically by functional area
5. Test all routes after reorganization
6. Update documentation

---

**Reference:** [Next.js Route Groups Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups)

