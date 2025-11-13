# Job Filters Analysis for Provider View

## Overview
This document analyzes the requirements for implementing job filters in the provider view of the marketplace page.

## Current State

### Existing Components
1. **`useJobs` Hook** (`src/hooks/useJobs.ts`)
   - ✅ Supports: `category`, `subcategory`, `jobType`, `experienceLevel`, `location`, `isRemote`, `minSalary`, `maxSalary`, `status`, `search`, `page`, `limit`, `sortBy`, `sortOrder`
   - ❌ Missing: `company`, `featured`

2. **`JobCard` Component** (`src/components/shared/job-card.tsx`)
   - ✅ Exists and displays job information
   - ✅ Supports grid and list view modes

3. **Jobs Page** (`src/app/(authenticated)/marketplace/jobs/page.tsx`)
   - ✅ Exists but uses different filter structure
   - Uses: `search`, `category`, `location`, `budget`, `skills`, `availability`

## Required Filters (from Untitled-1)

```typescript
const {
  search,           // ✅ Already supported
  category,         // ✅ Already supported
  subcategory,      // ✅ Already supported
  jobType,          // ✅ Already supported
  experienceLevel,  // ✅ Already supported
  location,         // ✅ Already supported
  isRemote,         // ✅ Already supported
  minSalary,        // ✅ Already supported
  maxSalary,        // ✅ Already supported
  company,          // ❌ Need to add
  sortBy,           // ✅ Already supported (default: 'createdAt')
  sortOrder,        // ✅ Already supported (default: 'desc')
  featured          // ❌ Need to add
} = req.query;
```

## Implementation Plan

### 1. Update `useJobs` Hook
- Add `company?: string` parameter
- Add `featured?: boolean` parameter
- Update query params building to include these filters

### 2. Create `JobGrid` Component
- Similar structure to `ServiceGrid`
- Props:
  - `jobs?: Job[]`
  - `loading?: boolean`
  - `pagination?: Pagination | null`
  - `currentPage?: number`
  - `onPageChange?: (page: number) => void`
  - `viewMode?: 'grid' | 'list'`
  - `hasActiveFilters?: boolean`
- Features:
  - Display jobs using `JobCard` component
  - Support grid and list view modes
  - Pagination controls
  - Empty state when no jobs
  - Loading state

### 3. Create Job Filter Sidebar (Optional)
- Similar to `FilterSidebar` for services
- Filters:
  - Search input
  - Category dropdown
  - Subcategory dropdown
  - Job Type (full_time, part_time, contract, etc.)
  - Experience Level (entry, junior, mid, senior, etc.)
  - Location input
  - Remote toggle
  - Salary range slider
  - Company filter
  - Featured toggle
  - Clear filters button

### 4. Integrate into Marketplace Page
- Show `JobGrid` in provider view
- Replace or supplement `ServiceGrid` based on role view
- Add tab or toggle to switch between Services and Jobs views

## API Endpoint
- Base: `/api/jobs`
- Query params: All the filters listed above
- Response: `{ success, data: Job[], pagination }`

## Next Steps
1. ✅ Analyze current implementation
2. ⏳ Update `useJobs` hook
3. ⏳ Create `JobGrid` component
4. ⏳ Create job filter sidebar (optional)
5. ⏳ Integrate into marketplace page

