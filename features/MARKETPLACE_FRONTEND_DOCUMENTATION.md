# Marketplace Frontend Documentation

## Overview

This document provides comprehensive frontend implementation guidance for the Marketplace feature in the LocalPro Super App. It covers component architecture, page structure, state management, API integration patterns, and user interface specifications.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Page Structure & Routes](#page-structure--routes)
3. [Component Organization](#component-organization)
4. [State Management](#state-management)
5. [API Integration](#api-integration)
6. [User Flows](#user-flows)
7. [UI Components](#ui-components)
8. [Form Handling](#form-handling)
9. [Error Handling](#error-handling)
10. [Performance Optimization](#performance-optimization)

---

## Architecture Overview

### Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useReducer, useContext)
- **Data Fetching**: Native Fetch API with custom hooks
- **Form Handling**: Controlled components with validation
- **Image Handling**: Next.js Image component with optimization
- **Icons**: Lucide React

### Project Structure

```
src/
├── app/
│   └── (authenticated)/
│       └── marketplace/
│           ├── page.tsx                    # Main marketplace browse page
│           ├── my-services/
│           │   └── page.tsx                # Provider's service listings
│           ├── my-bookings/
│           │   └── page.tsx                # User's booking history
│           ├── services/
│           │   ├── [id]/
│           │   │   ├── page.tsx           # Service detail page
│           │   │   └── book/
│           │   │       └── page.tsx       # Booking form page
│           │   └── create-service/
│           │       └── page.tsx            # Create service form
│           ├── bookings/
│           │   └── [id]/
│           │       └── page.tsx           # Booking detail page
│           └── providers/
│               └── [id]/
│                   └── page.tsx           # Provider profile page
├── components/
│   └── marketplace/
│       ├── service-card.tsx                # Service listing card
│       ├── booking-card.tsx               # Booking card component
│       ├── filter-sidebar.tsx              # Filter sidebar component
│       ├── controls-bar.tsx                # Sort/view controls
│       ├── location-autocomplete.tsx      # Location search component
│       └── payment-form.tsx                # Payment processing form
└── hooks/
    └── marketplace/
        ├── useServices.ts                  # Service data fetching
        ├── useBookings.ts                  # Booking data fetching
        └── useLocation.ts                  # Location services
```

---

## Page Structure & Routes

### Public Routes

#### `/marketplace` - Service Browse Page
**Purpose**: Main marketplace landing page for browsing all available services

**Features**:
- Service grid/list view with pagination
- Advanced filtering sidebar (category, location, price, rating)
- Search functionality
- Sort controls (price, rating, date, popularity)
- View mode toggle (grid/list)
- Category carousel/breadcrumbs
- Location-based search

**Layout Pattern**: Follows `PROVIDER_MARKETPLACE_LAYOUT.md`

**Key Components**:
- `ServiceFilterSidebar` - Filter controls
- `ServiceControlsBar` - Sort and view controls
- `ServiceGrid` / `ServiceList` - Service display components
- `Pagination` - Page navigation

#### `/marketplace/services/[id]` - Service Detail Page
**Purpose**: Display comprehensive service information

**Features**:
- Service header with title, description, pricing
- Image gallery
- Service details (features, requirements, packages, add-ons)
- Provider information sidebar
- Related services
- Booking CTA button
- Share and favorite functionality
- Reviews section

**Layout Pattern**: Follows `PROVIDER_MARKETPLACE_LAYOUT.md`

**Key Components**:
- `ServiceImageGallery` - Image carousel
- `ServiceDetails` - Service information sections
- `ProviderCard` - Provider information
- `ReviewList` - Reviews display
- `RelatedServices` - Similar services

#### `/marketplace/providers/[id]` - Provider Profile Page
**Purpose**: Display provider information and their services

**Features**:
- Provider profile header
- Provider statistics (rating, reviews, services count)
- Provider's service listings
- Provider reviews
- Contact information
- Verification badges

### Authenticated Routes

#### `/marketplace/my-services` - My Services (Provider)
**Purpose**: Provider's service management dashboard

**Features**:
- Service listings grid/list view
- Service status filters (active, paused, draft)
- Create service button
- Service statistics summary
- Quick actions (edit, delete, activate/deactivate)
- Filter and sort controls

**Layout Pattern**: Follows `PROVIDER_MARKETPLACE_LAYOUT.md`

**Key Components**:
- `ServiceFilterSidebar` - Status and category filters
- `ServiceControlsBar` - Sort and view controls
- `ServiceManagementCard` - Service card with actions
- `StatsSummary` - Service statistics

#### `/marketplace/create-service` - Create Service Form
**Purpose**: Multi-step form for creating new service listings

**Features**:
- Multi-step wizard (5-6 steps)
- Progress indicator
- Step validation
- Image upload
- AI-powered description generation
- Form auto-save (draft)
- Service preview

**Layout Pattern**: Follows `PROVIDER_MARKETPLACE_LAYOUT.md`

**Steps**:
1. Basic Information (title, description, category)
2. Pricing & Duration
3. Service Details (features, requirements, packages)
4. Availability & Location
5. Images & Status
6. Review & Submit

#### `/marketplace/my-bookings` - My Bookings
**Purpose**: User's booking history and management

**Features**:
- Booking list/grid view
- Status filters (pending, confirmed, in_progress, completed, cancelled)
- Date range filters
- Booking type filters (as client, as provider)
- Quick actions (view, cancel, review)
- Booking statistics

**Layout Pattern**: Follows `PROVIDER_MARKETPLACE_LAYOUT.md`

**Key Components**:
- `BookingFilterSidebar` - Status, type, date filters
- `BookingControlsBar` - Sort and view controls
- `BookingCard` - Booking display with actions

#### `/marketplace/bookings/[id]` - Booking Detail Page
**Purpose**: Detailed booking information and management

**Features**:
- Booking header with status and payment info
- Service details
- Booking information (date, time, location)
- Payment information breakdown
- Provider/client information sidebar
- Action buttons (cancel, review, message, call)
- Booking timeline
- Photo gallery (if uploaded)
- Invoice download

**Layout Pattern**: Follows `PROVIDER_MARKETPLACE_LAYOUT.md`

#### `/marketplace/services/[id]/book` - Booking Form
**Purpose**: Multi-step booking creation form

**Features**:
- Step 1: Service selection and date/time
- Step 2: Location and address
- Step 3: Additional requirements and notes
- Step 4: Payment method selection
- Step 5: Review and confirmation
- Payment processing integration
- Form validation

**Layout Pattern**: Follows `PROVIDER_MARKETPLACE_LAYOUT.md`

---

## Component Organization

### Reusable Components

#### ServiceCard
**Purpose**: Display service information in grid/list views

**Props**:
```typescript
interface ServiceCardProps {
  service: Service;
  viewMode: 'grid' | 'list';
  onFavorite?: (serviceId: string) => void;
  isFavorited?: boolean;
  showProvider?: boolean;
}
```

**Features**:
- Service image with fallback
- Title and description preview
- Pricing display
- Rating and review count
- Category badge
- Favorite button
- Quick view action

#### BookingCard
**Purpose**: Display booking information

**Props**:
```typescript
interface BookingCardProps {
  booking: Booking;
  viewMode: 'grid' | 'list';
  userRole: 'client' | 'provider';
  onStatusUpdate?: (bookingId: string, status: string) => void;
  onReview?: (bookingId: string) => void;
}
```

**Features**:
- Service information
- Booking date and time
- Status badge
- Payment status
- Quick actions based on role
- Status update buttons (for providers)

#### FilterSidebar
**Purpose**: Advanced filtering controls

**Props**:
```typescript
interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  categories: Category[];
  onClearFilters: () => void;
  isOpen: boolean;
  onClose: () => void;
}
```

**Features**:
- Category selection
- Location search with autocomplete
- Price range slider
- Rating filter
- Availability filters
- Clear all filters button
- Active filter count badge

#### ControlsBar
**Purpose**: Sort and view mode controls

**Props**:
```typescript
interface ControlsBarProps {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
  onSortChange: (sortBy: string, order: 'asc' | 'desc') => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  resultCount: number;
}
```

**Features**:
- Sort dropdown (price, rating, date, popularity)
- Sort order toggle (ascending/descending)
- View mode toggle (grid/list icons)
- Results count display

#### LocationAutocomplete
**Purpose**: Location search with autocomplete

**Props**:
```typescript
interface LocationAutocompleteProps {
  value: string;
  onChange: (location: Location) => void;
  placeholder?: string;
  onCoordinatesChange?: (coords: { lat: number; lng: number }) => void;
}
```

**Features**:
- Address autocomplete
- Coordinate detection
- Recent locations
- Current location button
- Map integration

---

## State Management

### Local Component State

Use React hooks for component-level state:

```typescript
// Filter state
const [filters, setFilters] = useState<FilterState>({
  category: '',
  location: '',
  priceRange: [0, 10000],
  rating: 0,
  search: ''
});

// View state
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
const [sortBy, setSortBy] = useState<string>('date');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

// Data state
const [services, setServices] = useState<Service[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [pagination, setPagination] = useState({
  page: 1,
  limit: 12,
  total: 0
});
```

### Custom Hooks

#### useServices
```typescript
function useServices(filters: FilterState, pagination: PaginationState) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchServices();
  }, [filters, pagination]);
  
  return { services, loading, error, refetch: fetchServices };
}
```

#### useBookings
```typescript
function useBookings(filters: BookingFilterState) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const updateStatus = async (bookingId: string, status: string) => {
    // Update booking status
  };
  
  return { bookings, loading, error, updateStatus };
}
```

### URL State Management

Use URL search params for shareable filter state:

```typescript
// Sync filters with URL
useEffect(() => {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.location) params.set('location', filters.location);
  router.push(`?${params.toString()}`);
}, [filters]);
```

---

## API Integration

### API Client Pattern

```typescript
// lib/api/marketplace.ts
export const marketplaceAPI = {
  // Services
  getServices: async (params: ServiceQueryParams) => {
    const query = new URLSearchParams(params);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.marketplaceServices}?${query}`,
      createAuthFetchOptions()
    );
    return response.json();
  },
  
  getServiceById: async (id: string) => {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.marketplaceServiceById}/${id}`,
      createAuthFetchOptions()
    );
    return response.json();
  },
  
  createService: async (serviceData: ServiceFormData) => {
    const formData = new FormData();
    // Append service data and images
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.marketplaceServices}`,
      createAuthFetchOptions({
        method: 'POST',
        body: formData
      })
    );
    return response.json();
  },
  
  // Bookings
  createBooking: async (bookingData: BookingFormData) => {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.marketplaceBookings}`,
      createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify(bookingData)
      })
    );
    return response.json();
  },
  
  updateBookingStatus: async (bookingId: string, status: string) => {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.marketplaceBookingStatus}/${bookingId}/status`,
      createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify({ status })
      })
    );
    return response.json();
  }
};
```

### Error Handling Pattern

```typescript
try {
  setLoading(true);
  setError(null);
  const data = await marketplaceAPI.getServices(filters);
  setServices(data.services || data.data || []);
} catch (err) {
  logger.error('Error fetching services', err);
  setError(err instanceof Error ? err.message : 'Failed to load services');
  showErrorToast('Failed to load services. Please try again.');
} finally {
  setLoading(false);
}
```

### Loading States

```typescript
if (loading) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading size="lg" text="Loading services..." />
        </div>
      </div>
    </div>
  );
}
```

---

## User Flows

### Service Discovery Flow

1. **Landing Page** (`/marketplace`)
   - User sees service grid/list
   - Applies filters (category, location, price)
   - Uses search functionality
   - Sorts results

2. **Service Detail** (`/marketplace/services/[id]`)
   - Views service information
   - Checks provider profile
   - Reviews ratings and reviews
   - Clicks "Book Now"

3. **Booking Form** (`/marketplace/services/[id]/book`)
   - Selects date and time
   - Enters location
   - Adds requirements
   - Selects payment method
   - Confirms booking

### Provider Service Management Flow

1. **My Services** (`/marketplace/my-services`)
   - Views all service listings
   - Filters by status
   - Clicks "Create Service"

2. **Create Service** (`/marketplace/create-service`)
   - Fills multi-step form
   - Uploads images
   - Uses AI description generator
   - Reviews and submits

3. **Service Detail** (Edit)
   - Views service performance
   - Updates service details
   - Manages bookings

### Booking Management Flow

1. **My Bookings** (`/marketplace/my-bookings`)
   - Views booking history
   - Filters by status/date
   - Clicks booking to view details

2. **Booking Detail** (`/marketplace/bookings/[id]`)
   - Views booking information
   - Updates status (provider)
   - Uploads photos
   - Processes payment
   - Leaves review (client)

---

## UI Components

### Layout Components

#### MarketplaceLayout
**Purpose**: Consistent layout wrapper for all marketplace pages

**Structure**:
```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
    {/* Header Section */}
    <Header />
    
    {/* Main Content */}
    <MainContent />
  </div>
</div>
```

#### Header Section
**Pattern**: Follows `PROVIDER_MARKETPLACE_LAYOUT.md`

```tsx
<div className="mb-8">
  {/* Back Button */}
  <div className="mb-4">
    <BackButton />
  </div>
  
  {/* Header Content */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex items-center gap-3">
      <Icon />
      <TitleAndDescription />
    </div>
    <ActionButtons />
  </div>
</div>
```

### Form Components

#### Multi-Step Form Pattern
```tsx
const [currentStep, setCurrentStep] = useState(1);
const [formData, setFormData] = useState<FormData>(initialData);

const handleNext = () => {
  if (validateStep(currentStep)) {
    setCurrentStep(prev => prev + 1);
  }
};

const handlePrevious = () => {
  setCurrentStep(prev => prev - 1);
};

const handleSubmit = async () => {
  if (validateStep(currentStep)) {
    await submitForm(formData);
  }
};
```

#### Form Validation
```typescript
const validateStep = (step: number): boolean => {
  const errors: Record<string, string> = {};
  
  switch (step) {
    case 1:
      if (!formData.title.trim()) errors.title = 'Title is required';
      if (!formData.description.trim()) errors.description = 'Description is required';
      break;
    // ... other steps
  }
  
  setFieldErrors(errors);
  return Object.keys(errors).length === 0;
};
```

---

## Form Handling

### Service Creation Form

**Steps**:
1. **Basic Information**
   - Title (required)
   - Description (required, AI-generated option)
   - Category (required)
   - Subcategory (conditional)

2. **Pricing & Duration**
   - Pricing type (hourly, fixed, per_sqft, per_item)
   - Base price (required)
   - Currency
   - Estimated duration (min/max hours)

3. **Service Details**
   - Features (array)
   - Requirements (array)
   - Service packages (optional)
   - Add-ons (optional)
   - Service type
   - Team size
   - Equipment/materials flags

4. **Availability & Location**
   - Service areas (array of cities)
   - Availability schedule
   - Timezone

5. **Images & Status**
   - Image upload (multiple)
   - Service status (active/inactive)

6. **Review & Submit**
   - Form summary
   - Validation check
   - Submit button

### Booking Form

**Steps**:
1. **Service & Schedule**
   - Service selection (pre-filled)
   - Date picker
   - Time selection
   - Duration confirmation

2. **Location**
   - Address input
   - Location autocomplete
   - Map selection (optional)
   - Coordinates capture

3. **Requirements**
   - Additional notes
   - Special requirements
   - Contact preferences

4. **Payment**
   - Payment method selection
   - Price breakdown
   - Payment processing

5. **Confirmation**
   - Booking summary
   - Terms acceptance
   - Final confirmation

---

## Error Handling

### Error Display Pattern

```tsx
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
    <div className="flex items-center gap-2">
      <AlertCircle className="w-5 h-5 text-red-600" />
      <p className="text-red-700 font-medium">{error}</p>
    </div>
  </div>
)}
```

### Field-Level Errors

```tsx
<div className="space-y-2">
  <Input
    label="Service Title"
    value={form.title}
    onChange={(e) => setForm({ ...form, title: e.target.value })}
    error={fieldErrors.title}
  />
  {fieldErrors.title && (
    <p className="text-sm text-red-600">{fieldErrors.title}</p>
  )}
</div>
```

### API Error Handling

```typescript
const handleAPIError = (error: unknown, defaultMessage: string) => {
  if (error instanceof Error) {
    logger.error('API Error', error);
    setError(error.message);
    showErrorToast(error.message);
  } else {
    logger.error('Unknown error', error);
    setError(defaultMessage);
    showErrorToast(defaultMessage);
  }
};
```

---

## Performance Optimization

### Image Optimization

```tsx
<Image
  src={serviceImage}
  alt={service.title}
  width={400}
  height={300}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority={isPriority}
  loading={isPriority ? 'eager' : 'lazy'}
  placeholder="blur"
  blurDataURL={blurDataUrl}
/>
```

### Data Fetching Optimization

```typescript
// Debounce search input
const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  }, 300),
  []
);

// Memoize filtered results
const filteredServices = useMemo(() => {
  return services.filter(service => {
    // Filter logic
  });
}, [services, filters]);

// Pagination
const paginatedServices = useMemo(() => {
  const start = (page - 1) * limit;
  const end = start + limit;
  return filteredServices.slice(start, end);
}, [filteredServices, page, limit]);
```

### Code Splitting

```typescript
// Lazy load heavy components
const ServiceDetailPage = lazy(() => import('./ServiceDetailPage'));
const BookingForm = lazy(() => import('./BookingForm'));

// Use Suspense
<Suspense fallback={<Loading />}>
  <ServiceDetailPage />
</Suspense>
```

---

## Accessibility

### ARIA Labels

```tsx
<button
  onClick={handleFavorite}
  aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
  aria-busy={isToggling}
>
  <Heart className={isFavorited ? 'fill-current' : ''} />
</button>
```

### Keyboard Navigation

```typescript
// Handle keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isFilterOpen) {
      setIsFilterOpen(false);
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isFilterOpen]);
```

### Focus Management

```typescript
// Focus management for modals
useEffect(() => {
  if (isOpen) {
    const firstInput = modalRef.current?.querySelector('input, button');
    firstInput?.focus();
  }
}, [isOpen]);
```

---

## Testing Considerations

### Component Testing

- Test filter state changes
- Test form validation
- Test API error handling
- Test loading states
- Test pagination
- Test responsive behavior

### Integration Testing

- Test complete booking flow
- Test service creation flow
- Test payment processing
- Test status updates
- Test review submission

---

## Best Practices

### 1. Consistent Layout Pattern
- Always follow `PROVIDER_MARKETPLACE_LAYOUT.md` for page structure
- Use consistent header pattern across all pages
- Maintain consistent spacing and padding

### 2. Error Handling
- Always display user-friendly error messages
- Log errors for debugging
- Provide retry mechanisms where appropriate

### 3. Loading States
- Show loading indicators for async operations
- Use skeleton screens for better UX
- Disable actions during loading

### 4. Form Validation
- Validate on blur and submit
- Show inline error messages
- Prevent submission with invalid data

### 5. Responsive Design
- Mobile-first approach
- Use responsive grid layouts
- Test on multiple screen sizes

### 6. Performance
- Optimize images
- Implement pagination
- Use memoization for expensive computations
- Lazy load heavy components

---

## Related Documentation

- `PROVIDER_MARKETPLACE_LAYOUT.md` - Layout structure and patterns
- `MARKETPLACE_FEATURES.md` - Backend API features
- Component-specific documentation in `src/components/marketplace/`

---

*This documentation should be updated as new features are added or patterns evolve.*

