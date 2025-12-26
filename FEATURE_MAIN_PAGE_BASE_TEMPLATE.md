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
  - Optional promotional CTA section (role-based, e.g., "Become Agency" for providers)
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
  - `min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent/10/30 relative overflow-hidden`
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
  - Right-aligned button/Link (e.g. provider-only "Post Service")
  - Conditional rendering based on `roleView` (e.g., `{roleView === "provider" && ...}`)
  - Styling example: gradient background with shadow effects and hover scale
  - Use `flex-shrink-0` to prevent button from shrinking

### Quick links row (optional)

Use a lightweight "sub-nav row" under the header:

- Layout:
  - `flex flex-wrap items-center gap-4 sm:gap-6 border-b border-gray-200 pb-4`
- Links:
  - icon + label, with `hover:text-accent` transition-colors and icon scale on hover
  - Icon styling: `text-accent group-hover:scale-110 transition-transform`
  - Link styling: `text-gray-600 hover:text-accent transition-colors group`
  - Links can be conditionally rendered based on `roleView` (e.g., provider-only links)
  - Example links: Browse Services, Find Providers, My Services (provider-only), My Bookings, Support

### Optional promotional CTA section

After the quick links and before the main content, you can add role-based promotional CTAs:

- Example: "Become Agency" CTA for providers who are not agency owners/admins
- Conditional rendering: `{roleView === "provider" && !userRoles.includes("agency_owner") && !userRoles.includes("agency_admin") && ...}`
- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6`
- Styling:
  - Link wrapper: `block bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 border-2 border-purple-200 hover:border-purple-300 group`
  - Content layout: `flex items-center gap-4`
  - Icon container: `w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0`
  - Text content: title (`text-base font-semibold text-purple-900`), description (`text-sm text-purple-700`), CTA text with arrow icon

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

#### Container styling

- Main container:
  - `bg-white rounded-2xl shadow-lg border border-gray-100`
  - Desktop: `sticky top-24` (aligns with authenticated header)
  - Desktop width: `lg:w-[280px] flex-shrink-0`
  - Mobile: fixed drawer (`fixed right-0 top-0 h-full w-80 z-50`) with overlay (`bg-black/50 z-40`)

#### Header section

- Header container:
  - `bg-gradient-to-r from-accent/10 to-emerald-50 px-6 py-4 border-b border-accent/20`
- Header content:
  - Icon container: `w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-md`
  - Icon: white filter icon (`Filter` from `lucide-react`)
  - Title: `text-lg font-bold text-gray-900`
  - Subtitle: `text-xs text-gray-600` (e.g., "Refine your search")
  - Close button (mobile only): `lg:hidden` with X icon

#### Filter content area

- Main content container:
  - `p-6 space-y-8` (vertical spacing between filter groups)

#### Filter section structure

Each filter section follows this pattern:

- Section container: `space-y-3` or `space-y-4`
- Label row:
  - `flex items-center gap-2`
  - Icon: `w-4 h-4 text-accent` (from `lucide-react`)
  - Label: `text-sm font-semibold text-gray-900`
- Filter input/control: styled consistently (see individual filter types below)

#### Category filter

- Select dropdown:
  - `w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white`
  - Focus: `focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent`
  - First option: "All Categories" (empty value)
  - Loading state: show "Loading categories..." text

#### Location filter

- Input field:
  - `w-full px-4 py-2.5 pr-11 border-2 border-gray-200 rounded-xl text-sm`
  - Focus: `focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent`
  - Placeholder: "Enter location..."
- Pin button (detect location):
  - Position: `absolute right-2 top-1/2 -translate-y-1/2`
  - Styling: `w-9 h-9 rounded-lg bg-accent text-white hover:bg-accent/90`
  - Loading state: spinner animation when `detectingLocation` is true
- Location coordinates indicator:
  - `text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2`
  - Shows "Using your current location." when coordinates are set
- Radius slider (when coordinates are set):
  - Range input: `w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600`
  - Shows distance in km (e.g., "1 km" to "50 km")
  - Clear location button: `text-xs text-red-600 hover:text-red-700 hover:bg-red-50`

#### Price range filter

- Price display box:
  - Container: `bg-accent/5 rounded-xl px-4 py-3 border border-accent/20`
  - Layout: `flex items-center justify-between`
  - Divider: `w-px h-8 bg-accent/20`
  - Min/Max labels: `text-xs text-gray-500 mb-1`
  - Min/Max values: `text-base font-bold text-accent` (formatted currency)
- Dual range slider:
  - Container: `relative py-2`
  - Track background: `absolute inset-0 h-2 bg-gray-200 rounded-full`
  - Active range: `absolute h-2 bg-accent rounded-full` (dynamically positioned)
  - Slider inputs: custom styled with `slider-thumb` class
  - Thumb styling: 18px circle, `#16a34a` (accent green), white border, shadow
  - Minimum gap enforced to prevent thumbs from overlapping
  - Z-index management for proper thumb interaction

#### Rating filter

- Button group:
  - Container: `flex flex-wrap items-center gap-2`
  - Button styling:
    - Active: `bg-accent text-white shadow-md shadow-green-200`
    - Inactive: `bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200`
  - Common: `px-4 py-2.5 rounded-xl text-sm font-semibold transition-all`
  - Star icon: `w-4 h-4` (filled white when active, yellow when inactive)
  - Options: "All" (rating 0), 4+, 4.5+, 5+

#### Availability toggle

- Container:
  - `p-4 bg-gray-50 rounded-xl border-2 border-gray-200`
  - Layout: `flex items-center justify-between`
- Label section:
  - Title: `text-sm font-semibold text-gray-900 block`
  - Description: `text-xs text-gray-500`
- Toggle switch:
  - Container: `relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200`
  - Active: `bg-accent shadow-lg shadow-green-200`
  - Inactive: `bg-gray-300`
  - Thumb: `h-5 w-5 rounded-full bg-white shadow-md`
  - Active position: `translate-x-6`
  - Inactive position: `translate-x-1`

#### Clear filters button

- Styling:
  - `w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold`
  - Hover: `hover:bg-gray-200 border-2 border-transparent hover:border-gray-300`
  - Layout: `flex items-center justify-center gap-2`
  - Icon: X icon (`w-4 h-4`)
- Visibility:
  - Only shown when `hasActiveFilters` is true

#### General styling notes

- **Spacing**: Use `space-y-8` between major filter sections, `space-y-3` or `space-y-4` within sections
- **Dividers**: Avoid separator lines between sections; use spacing instead
- **Icons**: All filter icons use `text-accent` color and are `w-4 h-4`
- **Rounded corners**: Use `rounded-xl` for inputs and buttons, `rounded-2xl` for main container
- **Borders**: Use `border-2 border-gray-200` for inputs, `border border-gray-100` for container
- **Focus states**: Use `focus:ring-2 focus:ring-ring focus:border-transparent` for inputs

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
  - Page gradient (`bg-gradient-to-br from-gray-50 via-white to-accent/10/30`) + animated background blobs
  - Optional `<Broadcaster />`
  - Header (title, description, role-based CTA with conditional rendering)
  - Optional quick-links row (with role-based conditional links)
  - Optional promotional CTA section (role-based, e.g., "Become Agency" for providers)
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


