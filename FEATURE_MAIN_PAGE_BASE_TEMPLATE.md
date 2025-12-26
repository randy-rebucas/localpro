# Feature Main Page Base Template (Marketplace Layout)

This document defines the **base layout + styling contract** we use for “feature main pages” (e.g. Marketplace, Jobs, Providers, etc.). The Marketplace page is the reference implementation.

## Reference implementation

- **Page shell**: `src/app/(authenticated)/marketplace/page.tsx`
- **Main content (sidebar + controls + results + pagination)**: `src/components/marketplace/service-marketplace.tsx`
- **Filters sidebar**: `src/components/marketplace/filter-sidebar.tsx`
- **Results + grid/list + pagination UI**: `src/components/marketplace/service-grid.tsx`
- **Result item card**: `src/components/marketplace/service-card.tsx`

## Layout contract (high level)

Every feature main page should be composed as:

- **Shell layer (page.tsx)**
  - Animated background
  - Optional broadcaster (client-facing announcements)
  - Header section (title/description + role-based CTA)
  - Quick links row (optional, but recommended for modules with multiple sub-pages)
- **Body layer (feature component)**
  - Two-column layout: **filter sidebar (left)** + **main content (right)**
  - Main content includes:
    - Controls bar (Search | Sort | Display Mode in a single inline card)
    - Results (grid/list)
    - Pagination

## Shell layer

### Animated background

Use the “blurred floating circles” pattern on the page shell:

- Page wrapper:
  - `min-h-screen ... relative overflow-hidden`
- Background blob container:
  - `fixed inset-0 pointer-events-none -z-10`
- Floating animation:
  - Tailwind animation `animate-float` (defined in `tailwind.config.ts`)
  - Delay helpers like `animation-delay-2000` / `animation-delay-4000` (defined in `src/app/globals.css`)

### Broadcaster

Place `<Broadcaster />` at the top of the shell content (below the background, above the header). It is **self-gated** and will render only for client roles.

- Component: `src/components/broadcaster.tsx`
- Behavior:
  - Fetches active broadcasts
  - Sorts by sticky + priority
  - Dismiss persists in `localStorage`

### Header section

Use a consistent header container and typography:

- Container:
  - `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4`
- Title:
  - `text-3xl font-bold text-gray-900`
- Description:
  - `text-gray-600`
- Role-based CTA:
  - Right-aligned button/Link (e.g. provider-only “Post Service”)

### Quick links row (optional)

Use a lightweight “sub-nav row” under the header:

- Layout:
  - `flex flex-wrap items-center gap-4 sm:gap-6 border-b border-gray-200 pb-4`
- Links:
  - icon + label, with `hover:text-green-600` and icon scale on hover

## Body layer: sidebar + main content

### Two-column responsive layout

Standard structure:

- Page width container:
  - `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Columns:
  - `flex flex-col lg:flex-row gap-6 lg:gap-8`

### Filter sidebar (left)

Responsibilities:

- Desktop: visible, sticky
- Mobile: hidden by default, opens as a right-side drawer with an overlay

Key styling requirements:

- Sticky offset must align with the authenticated header:
  - `sticky top-24`

Marketplace filter UX reference:

- **Category**: category dropdown (`<select>`) with an “All Categories” option
- **Location**: inline location input with a right-side “pin” action for current location
- **Price**: dual range slider (min/max) with clamping + minimum gap so thumbs don’t overlap
- **Dividers**: avoid separator lines between sections; use spacing (`space-y-*`)

### Main content (right)

Must include the following blocks, in this order:

1. **Mobile filters button** (only on small screens)
2. **Controls bar** (unified card containing Search | Sort | Display Mode inline)
3. **Error state** (when API fails)
4. **Results**
5. **Pagination**

## Controls bar contract

The controls bar is the key reusable UI pattern for feature main pages.

### Layout structure

The controls bar uses a **single inline card** containing all controls in one row:

- Container: `bg-white rounded-lg border border-gray-200 shadow-sm p-4`
- Layout: `flex flex-col sm:flex-row items-start sm:items-center gap-4`
- Responsive: Stacks vertically on mobile, horizontal on desktop

### Width allocation

On desktop (`sm:` breakpoint and above), controls are allocated as follows:

- **Search**: `w-[70%]` (70% width)
- **Sort**: `w-[20%]` (20% width)
- **Display Mode**: `w-[10%]` (10% width)

### Required controls

1. **Search**:
   - A text input that maps to API param `search`
   - Search icon on the left (`lucide-react` `Search` icon)
   - Debounced updates (recommended) to avoid a request per keystroke
   - Optional inline clear action (X button on the right when input has value)
   - Keep the input UI in sync when filters are cleared/reset
   - Styling: `pl-9 pr-9` for icon spacing, standard input styling with focus ring

2. **Sort + order**:
   - `sortBy` dropdown: Compact select with shortened labels (e.g., "Date", "Price", "Rating", "Title")
   - `sortOrder` toggle: **Clickable icon button** (not a dropdown)
     - Uses `ArrowUp` icon for ascending
     - Uses `ArrowDown` icon for descending
     - Toggles between `asc` and `desc` on click
     - Styling: Matches select dropdown border/background, hover states
   - Layout: Side-by-side with `gap-1.5`, sort select uses `flex-1`, icon button is `flex-shrink-0`

3. **View toggle**:
   - `grid` / `list` mode toggle
   - Icon buttons (e.g., `Grid3x3` and `List` from `lucide-react`)
   - Background container: `bg-gray-100 rounded-lg p-1`
   - Active state: `bg-white text-emerald-600 shadow-sm`
   - Inactive state: `text-gray-600 hover:text-gray-900`

### Marketplace reference

- Search is wired end-to-end:
  - `useServiceFilters` includes `search` in `servicesParams`
  - `useMarketplaceServices` forwards `search` via query param `?search=...`
- Sort controls use compact design with icon-based order toggle
- All controls are contained in a single white card with consistent spacing

## Results contract (grid/list)

Requirements:

- Must support grid/list view modes via a single `viewMode` prop
- Must render:
  - Loading state
  - Empty state (with helpful messaging)
  - Results list
- Result items should be card-style “surfaces” (consistent border + shadow + hover)

Marketplace reference:

- `ServiceGrid` renders featured + regular sections, switches layout based on `viewMode`.
- `ServiceCard` is the shared result item for both grid + list.

## Pagination contract

Requirements:

- Show “Showing X to Y of Z results”
- Page buttons with a windowed range (e.g. 5 pages)
- Previous/Next buttons with disabled states

Marketplace reference:

- `ServiceGrid` handles pagination UI and calls `onPageChange(page)`; caller scrolls to top.

## Implementation checklist for new feature main pages

- **Shell**
  - Page gradient + animated background blobs
  - Optional `<Broadcaster />`
  - Header (title, description, role-based CTA)
  - Optional quick-links row
- **Body**
  - Two-column layout (`FilterSidebar` left, content right)
  - Sticky sidebar with `top-24`
  - Controls bar: Unified inline card with Search (70%) | Sort (20%) | Display Mode (10%)
  - Sort uses icon button for order toggle (ArrowUp/ArrowDown)
  - Results with empty/loading/error states
  - Pagination
- **Data**
  - Filters state hook produces `...Params` including `search`
  - Data hook forwards params to API query string and includes `search` in cache/dedup keys


