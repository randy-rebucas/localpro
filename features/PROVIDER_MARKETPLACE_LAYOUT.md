# Provider Marketplace Layout Documentation

## Overview

This document provides a comprehensive analysis of the Provider Marketplace component layout structure, serving as a base layout reference for marketplace pages.

## Component Location

**File:** `src/components/marketplace/provider-marketplace.tsx`

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Background Container                       │
│  (min-h-screen bg-gradient-to-br from-slate-50...)          │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Max Width Container (7xl)                 │  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              Header Section                      │  │  │
│  │  │  ┌───────────────────────────────────────────┐ │  │  │
│  │  │  │  Back Button                               │ │  │  │
│  │  │  └───────────────────────────────────────────┘ │  │  │
│  │  │  ┌───────────────────────────────────────────┐ │  │  │
│  │  │  │  Icon | Title & Description | Action Btn  │ │  │  │
│  │  │  └───────────────────────────────────────────┘ │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │        Main Layout (Flex Row on Desktop)         │  │  │
│  │  │                                                   │  │  │
│  │  │  ┌──────────────┐  ┌─────────────────────────┐ │  │  │
│  │  │  │              │  │                         │ │  │  │
│  │  │  │   Filter     │  │    Main Content Area    │ │  │  │
│  │  │  │   Sidebar    │  │                         │ │  │  │
│  │  │  │              │  │  ┌───────────────────┐ │ │  │  │
│  │  │  │  (Desktop)   │  │  │ Mobile Filter Btn  │ │ │  │  │
│  │  │  │              │  │  └───────────────────┘ │ │  │  │
│  │  │  │              │  │  ┌───────────────────┐ │ │  │  │
│  │  │  │              │  │  │ Skills Carousel   │ │ │  │  │
│  │  │  │              │  │  │ (Conditional)     │ │ │  │  │
│  │  │  │              │  │  └───────────────────┘ │ │  │  │
│  │  │  │              │  │  ┌───────────────────┐ │ │  │  │
│  │  │  │              │  │  │  Controls Bar      │ │ │  │  │
│  │  │  │              │  │  │  (Sort & View)    │ │ │  │  │
│  │  │  │              │  │  └───────────────────┘ │ │  │  │
│  │  │  │              │  │  ┌───────────────────┐ │ │  │  │
│  │  │  │              │  │  │  Error State      │ │ │  │  │
│  │  │  │              │  │  │  (Conditional)    │ │ │  │  │
│  │  │  │              │  │  └───────────────────┘ │ │  │  │
│  │  │  │              │  │  ┌───────────────────┐ │ │  │  │
│  │  │  │              │  │  │  Provider Grid    │ │ │  │  │
│  │  │  │              │  │  │  (List/Grid View)  │ │ │  │  │
│  │  │  │              │  │  │  + Pagination     │ │ │  │  │
│  │  │  │              │  │  └───────────────────┘ │ │  │  │
│  │  │  └──────────────┘  └─────────────────────────┘ │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Background Container

```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
```

**Purpose:** Provides the page background with a subtle gradient.

**Styling:**
- `min-h-screen`: Ensures full viewport height
- Gradient: `from-slate-50 via-white to-emerald-50/20` for a clean, modern look

---

### 2. Max Width Container

```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
```

**Purpose:** Centers content and provides responsive padding.

**Responsive Breakpoints:**
- Mobile: `px-4 py-6`
- Tablet: `sm:px-6`
- Desktop: `lg:px-8 lg:py-10`

---

### 3. Header Section

```tsx
<div className="mb-8">
  {/* Back Button */}
  <div className="mb-4">
    <button onClick={handleBack}>
      <ArrowLeft /> Back to Marketplace
    </button>
  </div>
  
  {/* Title & Action */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
        <Users className="w-5 h-5" />
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Providers</h1>
        <p className="text-sm text-gray-500 mt-0.5">Discover trusted service providers in your area</p>
      </div>
    </div>
    <Link href="/marketplace">
      <Store /> Browse Services
    </Link>
  </div>
</div>
```

**Components:**

#### 3.1 Back Button
- **Purpose:** Navigation back to main marketplace
- **Styling:** Subtle button with hover effects
- **Accessibility:** Includes `aria-label`

#### 3.2 Header Content
- **Icon:** Users icon in gradient background (emerald-500 to teal-600)
- **Title:** "Providers" - responsive text size (2xl on mobile, 3xl on desktop)
- **Description:** Subtitle explaining the page purpose
- **Action Button:** Link to browse services with gradient styling

**Responsive Behavior:**
- Mobile: Stacked vertically
- Desktop: Horizontal layout with space-between

---

### 4. Main Layout Container

```tsx
<div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
```

**Purpose:** Creates the two-column layout (sidebar + main content).

**Responsive Behavior:**
- Mobile/Tablet: `flex-col` (stacked)
- Desktop: `flex-row` (side-by-side)

---

### 5. Filter Sidebar

```tsx
<ProviderFilterSidebar
  isOpen={filterDrawerOpen}
  onClose={handleCloseFilters}
  // ... filter props
/>
```

**Purpose:** Provides filtering options for providers.

**Behavior:**
- Desktop: Always visible sidebar
- Mobile: Drawer/modal that opens via button

**Location:** Left side on desktop, hidden on mobile

---

### 6. Main Content Area

```tsx
<div className="flex-1 min-w-0">
```

**Purpose:** Contains all main content with flexible width.

**Components (in order):**

#### 6.1 Mobile Filter Button
```tsx
<div className="lg:hidden mb-4">
  <button onClick={handleOpenFilters}>
    <Filter /> Filters
    {activeFiltersCount > 0 && <badge>{count}</badge>}
  </button>
</div>
```
- **Visibility:** Only on mobile/tablet (`lg:hidden`)
- **Features:** Shows active filter count badge

#### 6.2 Skills Carousel
```tsx
{filters.category && (
  <div className="mb-6">
    <SkillsCarousel />
  </div>
)}
```
- **Conditional:** Only shows when a category is selected
- **Purpose:** Allows filtering by specific skills within a category

#### 6.3 Controls Bar
```tsx
<div className="mb-6">
  <ProviderControlsBar
    sortBy={filters.sortBy}
    sortOrder={filters.sortOrder}
    viewMode={filters.viewMode}
  />
</div>
```
- **Features:**
  - Sort by dropdown (Date, Rating, Name, Status)
  - Sort order dropdown (Ascending/Descending)
  - View mode toggle (Grid/List)

#### 6.4 Error State
```tsx
{providersError && (
  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
    {/* Error message */}
  </div>
)}
```
- **Conditional:** Only displays when there's an error
- **Styling:** Red-themed error card

#### 6.5 Provider Grid
```tsx
<ProviderGrid
  providers={providers}
  loading={loadingProviders}
  hasActiveFilters={filters.hasActiveFilters}
  pagination={providersPagination}
  currentPage={filters.currentPage}
  onPageChange={handlePageChange}
  viewMode={filters.viewMode}
/>
```
- **Features:**
  - Grid or List view based on `viewMode`
  - Loading state handling
  - Pagination controls
  - Empty state handling

---

## State Management

### Filter State
Managed via `useProviderFilters` hook:
- `status`: Provider status filter
- `providerType`: Type of provider
- `location`: Location filter
- `category`: Selected category
- `categoryId`: Category ID
- `skills`: Array of selected skills
- `sortBy`: Sort field
- `sortOrder`: Sort direction
- `viewMode`: Grid or List view
- `currentPage`: Current page number

### UI State
- `filterDrawerOpen`: Controls mobile filter drawer visibility

### Computed Values
- `activeFiltersCount`: Memoized count of active filters for badge display

---

## Performance Optimizations

### Memoization
1. **Callbacks:**
   - `handlePageChange`: Memoized with `useCallback`
   - `handleOpenFilters`: Memoized with `useCallback`
   - `handleCloseFilters`: Memoized with `useCallback`
   - `handleBack`: Memoized with `useCallback`

2. **Computed Values:**
   - `activeFiltersCount`: Memoized with `useMemo`

### Benefits
- Prevents unnecessary re-renders
- Optimizes filter badge updates
- Improves scroll performance

---

## Responsive Design

### Breakpoints

| Breakpoint | Layout | Sidebar | Filter Button |
|------------|--------|---------|---------------|
| **Mobile** (< 1024px) | Stacked | Hidden (Drawer) | Visible |
| **Desktop** (≥ 1024px) | Side-by-side | Always visible | Hidden |

### Mobile Considerations
- Filter sidebar becomes a drawer/modal
- Header stacks vertically
- Controls bar adapts to smaller screens
- Grid switches to single column

---

## Accessibility Features

1. **ARIA Labels:**
   - Filter button: `aria-label="Open filters"`
   - Back button: `aria-label="Go back to marketplace"`

2. **Semantic HTML:**
   - Proper heading hierarchy (h1 for page title)
   - Button elements for interactive elements
   - Link elements for navigation

3. **Keyboard Navigation:**
   - All interactive elements are keyboard accessible
   - Focus states are visible

---

## Styling Guidelines

### Color Palette
- **Primary:** Emerald (emerald-500, emerald-600, emerald-700)
- **Background:** Slate-50, White, Emerald-50/20
- **Text:** Gray-900 (headings), Gray-600 (body), Gray-500 (subtle)
- **Borders:** Gray-200, Gray-300
- **Error:** Red-50, Red-200, Red-600, Red-800

### Spacing
- **Section gaps:** `gap-6 lg:gap-8`
- **Header margin:** `mb-8`
- **Component margins:** `mb-4`, `mb-6` (consistent spacing)

### Typography
- **Page Title:** `text-2xl sm:text-3xl font-bold`
- **Description:** `text-sm text-gray-500`
- **Section Headings:** `text-xl font-semibold`

---

## Usage Example

```tsx
import { ProviderMarketplace } from "@/components/marketplace/provider-marketplace";

export default function ProvidersPage() {
  const { data: session } = useSession();
  const userName = getUserName(session);

  return <ProviderMarketplace userName={userName} />;
}
```

---

## Key Design Principles

1. **Progressive Disclosure:** Filters hidden on mobile, revealed on demand
2. **Visual Hierarchy:** Clear header, organized content sections
3. **Consistent Spacing:** Uniform gaps and margins throughout
4. **Responsive First:** Mobile-optimized, enhanced for desktop
5. **Performance:** Memoized callbacks and computed values
6. **Accessibility:** ARIA labels and semantic HTML

---

## Related Components

- `ProviderFilterSidebar`: Filter controls
- `ProviderGrid`: Provider listing display
- `ProviderControlsBar`: Sort and view controls
- `SkillsCarousel`: Skill-based filtering

---

## Future Enhancements

Potential improvements:
1. Search functionality in header
2. Quick filter chips
3. Saved filter presets
4. Advanced sorting options
5. Provider comparison feature

---

## Version History

- **v1.0** - Initial layout with header section
  - Added header with back button, icon, title, description, and action button
  - Implemented responsive filter sidebar
  - Added mobile filter button with badge
  - Integrated controls bar and provider grid

---

## Notes

- This layout serves as a **base reference** for other marketplace pages
- Header section pattern can be reused across marketplace components
- Filter sidebar pattern is consistent with service marketplace
- All spacing and styling follows the design system

