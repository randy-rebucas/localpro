# Example: ServiceMarketplace Component Documentation

This is an example of how component documentation should be structured. Use this as a template for documenting other components.

---

# ServiceMarketplace

## Overview

`ServiceMarketplace` is the main component that renders the service marketplace interface. It provides a two-column layout with a filter sidebar on the left and the main content area (service grid/list) on the right. This component handles service filtering, sorting, and display.

## Location

- **File:** `src/components/marketplace/service-marketplace.tsx`
- **Type:** Client Component (`"use client"`)
- **Exported:** `ServiceMarketplace`

## Props Interface

```typescript
interface ServiceMarketplaceProps {
  userName?: string;
}
```

## Props Description

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `userName` | `string` | No | Optional user name for personalization |

## Usage Example

```tsx
import { ServiceMarketplace } from "@/components/marketplace/service-marketplace";

export default function MarketplacePage() {
  const userName = getUserName(session);
  
  return (
    <ServiceMarketplace userName={userName} />
  );
}
```

## Component Structure

```
ServiceMarketplace
├── Background Container (gradient)
├── Max Width Container
│   └── Flex Container (lg:flex-row)
│       ├── FilterSidebar (left, desktop)
│       │   ├── Category Filter
│       │   ├── Location Filter
│       │   ├── Price Range
│       │   ├── Rating Filter
│       │   └── Availability Filter
│       └── Main Content Area (right)
│           ├── Mobile Filter Button (mobile only)
│           ├── Controls Bar
│           │   ├── Sort Controls
│           │   └── View Toggle (Grid/List)
│           ├── Error State (conditional)
│           └── ServiceGrid
│               ├── Featured Services
│               ├── Service Listings
│               └── Pagination
```

## Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│  Background: gradient-to-br from-slate-50 via-white...  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Max Width: 7xl, Centered                          │ │
│  │                                                       │ │
│  │  ┌──────────────┐  ┌─────────────────────────────┐ │ │
│  │  │              │  │                             │ │ │
│  │  │   Filter     │  │   Main Content              │ │ │
│  │  │   Sidebar    │  │                             │ │ │
│  │  │              │  │  [Mobile Filter Button]     │ │ │
│  │  │  (Desktop)   │  │  [Controls Bar]             │ │ │
│  │  │              │  │  [Service Grid/List]        │ │ │
│  │  │              │  │  [Pagination]                │ │ │
│  │  └──────────────┘  └─────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## State Management

### Local State
```typescript
const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
const [detectingLocation, setDetectingLocation] = useState(false);
```

### Filter State (via Hook)
```typescript
const filters = useServiceFilters({
  maxPrice,
  initialPriceRange: [0, maxPrice],
  limit: 10,
});
```

### Data Fetching
```typescript
const { 
  featuredServices, 
  services, 
  loading: loadingServices, 
  error: servicesError,
  pagination: servicesPagination 
} = useMarketplaceServices(filters.servicesParams);
```

## Hooks Used

| Hook | Purpose | Documentation |
|------|---------|---------------|
| `useServiceFilters` | Manage filter state | `03-hooks/useServiceFilters.md` |
| `useMarketplaceServices` | Fetch services | `03-hooks/useMarketplaceServices.md` |
| `useCategories` | Fetch categories | `03-hooks/useCategories.md` |
| `useMaxPrice` | Get max price | `03-hooks/useMaxPrice.md` |

## Key Features

### 1. Responsive Filter Sidebar
- **Desktop:** Always visible on the left
- **Mobile:** Hidden, accessible via drawer button
- **Tablet:** Slide-out drawer

### 2. Filter Management
- Category selection
- Location filtering (with geolocation)
- Price range slider
- Rating filter
- Availability toggle
- Active filter count badge

### 3. Service Display
- Grid/List view toggle
- Sort options (Date, Price, Rating, Title)
- Sort order (Ascending/Descending)
- Pagination
- Featured services section

### 4. Location Detection
- Browser geolocation API
- Reverse geocoding
- Loading state during detection

## Event Handlers

### Filter Management
```typescript
const handleOpenFilters = useCallback(() => {
  setFilterDrawerOpen(true);
}, []);

const handleCloseFilters = useCallback(() => {
  setFilterDrawerOpen(false);
}, []);
```

### Location Detection
```typescript
const handleDetectLocation = useCallback(() => {
  // Uses navigator.geolocation
  // Updates filter state with coordinates
  // Performs reverse geocoding
}, [filters]);
```

### Pagination
```typescript
const handlePageChange = useCallback((page: number) => {
  filters.setCurrentPage(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, [filters]);
```

## Styling

### Container
```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
```

### Layout
```tsx
<div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
  {/* Filter Sidebar */}
  {/* Main Content */}
</div>
```

### Responsive Behavior
- **Mobile:** Stacked layout (`flex-col`)
- **Desktop:** Side-by-side (`lg:flex-row`)
- **Gap:** `gap-6` on mobile, `gap-8` on desktop

## Responsive Design

### Breakpoints
- **Mobile:** `< 1024px` - Stacked layout, filter drawer
- **Desktop:** `≥ 1024px` - Side-by-side layout, always-visible sidebar

### Mobile-Specific Features
- Filter button with active count badge
- Drawer-based filter sidebar
- Full-width content area

## Accessibility

### ARIA Labels
```tsx
<button
  onClick={handleOpenFilters}
  aria-label="Open filters"
>
```

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Focus states are visible
- Tab order is logical

### Screen Reader Support
- Semantic HTML structure
- ARIA labels on interactive elements
- Status announcements for loading/error states

## Performance Optimizations

### Memoization
```typescript
// Memoized callbacks
const handleOpenFilters = useCallback(...);
const handleCloseFilters = useCallback(...);
const handlePageChange = useCallback(...);
const handleDetectLocation = useCallback(...);

// Memoized computed values
const activeFiltersCount = useMemo(() => {
  // Count active filters
}, [dependencies]);
```

### Benefits
- Prevents unnecessary re-renders
- Optimizes filter badge updates
- Improves scroll performance

## Error Handling

### Error Display
```tsx
{servicesError && (
  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
    <p className="text-sm font-medium text-red-800">
      Error loading services
    </p>
    <p className="text-xs text-red-600">
      {servicesError}
    </p>
  </div>
)}
```

### Error States
- Service loading errors
- Category loading errors
- Location detection errors (handled silently)

## Related Components

### Child Components
- `FilterSidebar` - Filter controls
- `ServiceGrid` - Service display
- `CategoriesCarousel` - Category selection (if used)

### Parent Components
- `MarketplacePage` - Uses this component

### Related Components
- `ProviderMarketplace` - Similar structure for providers
- `JobMarketplace` - Similar structure for jobs

## Related Hooks

- `useServiceFilters` - Filter state management
- `useMarketplaceServices` - Service data fetching
- `useCategories` - Category data
- `useMaxPrice` - Price utilities

## Related Documentation

- **Page:** `01-pages/marketplace-landing.md`
- **Filter Component:** `02-components/filter-components/filter-sidebar.md`
- **Service Grid:** `02-components/service-components/service-grid.md`
- **Filter Hook:** `03-hooks/useServiceFilters.md`
- **Data Fetching:** `06-patterns/data-fetching.md`

## Code Snippets

### Basic Usage
```tsx
import { ServiceMarketplace } from "@/components/marketplace/service-marketplace";

<ServiceMarketplace userName="John Doe" />
```

### With Custom Styling
```tsx
<div className="custom-wrapper">
  <ServiceMarketplace userName={userName} />
</div>
```

## Testing Considerations

### Unit Tests
- Component renders correctly
- Props are passed correctly
- State updates work

### Integration Tests
- Filter interactions
- Service loading
- Pagination
- Location detection

### E2E Tests
- Complete user flow
- Filter application
- Service selection

## Common Issues & Solutions

### Issue: Filters not applying
**Solution:** Check `filters.servicesParams` is correctly passed to `useMarketplaceServices`

### Issue: Location detection not working
**Solution:** Ensure browser permissions are granted and HTTPS is used

### Issue: Performance issues with many services
**Solution:** Ensure pagination is working and limit is set correctly

## Future Enhancements

Potential improvements:
1. Search functionality
2. Saved filter presets
3. Advanced sorting options
4. Map view integration
5. Service comparison feature

---

## Documentation Template

Use this structure for documenting other components:

```markdown
# ComponentName

## Overview
[Brief description]

## Location
- **File:** `src/components/marketplace/component-name.tsx`
- **Type:** Client/Server Component

## Props Interface
[TypeScript interface]

## Props Description
[Table of props]

## Usage Example
[Code example]

## Component Structure
[ASCII diagram or tree]

## State Management
[State details]

## Hooks Used
[Table of hooks]

## Key Features
[Feature list]

## Event Handlers
[Handler descriptions]

## Styling
[Styling details]

## Responsive Design
[Responsive behavior]

## Accessibility
[Accessibility features]

## Performance Optimizations
[Optimization details]

## Error Handling
[Error handling patterns]

## Related Components
[Links to related components]

## Related Hooks
[Links to hooks]

## Related Documentation
[Links to docs]

## Code Snippets
[Additional examples]

## Testing Considerations
[Testing notes]

## Common Issues & Solutions
[FAQ-style issues]

## Future Enhancements
[Potential improvements]
```

---

*This example demonstrates the level of detail and structure expected for component documentation.*

