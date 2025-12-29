# Marketplace End-User Layout Optimization Guide

## Overview

This document provides comprehensive layout recommendations for optimizing the marketplace experience for end users. It builds upon the existing `MARKETPLACE_FRONTEND_DOCUMENTATION.md` and `PROVIDER_MARKETPLACE_LAYOUT.md` with a focus on user experience, conversion optimization, and modern marketplace design patterns.

## Table of Contents

1. [Core Layout Principles](#core-layout-principles)
2. [Homepage/Browse Page Layout](#homepagebrowse-page-layout)
3. [Service Detail Page Layout](#service-detail-page-layout)
4. [Booking Flow Layout](#booking-flow-layout)
5. [Mobile-First Considerations](#mobile-first-considerations)
6. [Visual Hierarchy & Information Architecture](#visual-hierarchy--information-architecture)
7. [Conversion Optimization](#conversion-optimization)
8. [Accessibility Enhancements](#accessibility-enhancements)

---

## Core Layout Principles

### 1. **Progressive Disclosure**
- Show essential information first, details on demand
- Use expandable sections for detailed information
- Collapsible filter sidebar on mobile
- Sticky header with key actions always visible

### 2. **Visual Scanning Patterns**
- Follow F-pattern and Z-pattern reading flows
- Place primary CTAs in high-attention zones
- Use visual weight to guide user attention
- Maintain consistent spacing rhythm

### 3. **Reduced Cognitive Load**
- Limit choices per screen (7±2 rule)
- Group related information visually
- Use clear visual hierarchy
- Provide clear feedback for all actions

### 4. **Trust Building Elements**
- Prominent ratings and reviews
- Verification badges visible early
- Clear pricing with no hidden fees
- Transparent provider information

---

## Homepage/Browse Page Layout

### Recommended Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    STICKY HEADER (Top Bar)                       │
│  [Logo] [Search Bar - Full Width] [Favorites] [Notifications]    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    HERO SECTION                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Welcome Message + Personalized Greeting                   │ │
│  │  "Find trusted services in [Location]"                     │ │
│  │  [Quick Location Selector]                                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  CATEGORY QUICK ACCESS (Horizontal Scroll)                │ │
│  │  [Icon] Plumbing  [Icon] Electrical  [Icon] Cleaning ...   │ │
│  │  Large touch targets, clear icons, category names          │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    MAIN CONTENT AREA                             │
│  ┌──────────────┐  ┌───────────────────────────────────────┐   │
│  │              │  │  QUICK FILTER CHIPS (Above Results)    │   │
│  │              │  │  [Price: $] [Rating: ⭐] [Available]   │   │
│  │   FILTER     │  │  [Clear All]                           │   │
│  │   SIDEBAR    │  └───────────────────────────────────────┘   │
│  │              │  ┌───────────────────────────────────────┐   │
│  │  (Desktop)   │  │  CONTROLS BAR (Sticky on Scroll)     │   │
│  │              │  │  [X Results] [Sort ▼] [Grid/List]     │   │
│  │              │  └───────────────────────────────────────┘   │
│  │              │  ┌───────────────────────────────────────┐   │
│  │              │  │  SERVICE GRID/LIST                    │   │
│  │              │  │  ┌─────┐ ┌─────┐ ┌─────┐            │   │
│  │              │  │  │Card │ │Card │ │Card │            │   │
│  │              │  │  └─────┘ └─────┘ └─────┘            │   │
│  │              │  │  ┌─────┐ ┌─────┐ ┌─────┐            │   │
│  │              │  │  │Card │ │Card │ │Card │            │   │
│  │              │  │  └─────┘ └─────┘ └─────┘            │   │
│  │              │  └───────────────────────────────────────┘   │
│  │              │  ┌───────────────────────────────────────┐   │
│  │              │  │  PAGINATION                            │   │
│  │              │  │  [< Prev] [1] [2] [3] ... [Next >]    │   │
│  │              │  └───────────────────────────────────────┘   │
│  └──────────────┘  └───────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Improvements

#### 1. **Sticky Search Header**
```tsx
<div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
    <div className="flex items-center gap-4">
      {/* Logo - Hidden on mobile, visible on desktop */}
      <Link href="/" className="hidden md:block">
        <Logo />
      </Link>
      
      {/* Search Bar - Takes priority */}
      <div className="flex-1">
        <SearchInput
          placeholder="Search services, providers, or categories..."
          value={searchQuery}
          onChange={handleSearch}
          onFocus={() => setShowSearchSuggestions(true)}
        />
        {/* Search suggestions dropdown */}
      </div>
      
      {/* Action Icons */}
      <div className="flex items-center gap-2">
        <FavoritesButton />
        <NotificationsButton />
        <UserMenu />
      </div>
    </div>
  </div>
</div>
```

**Benefits:**
- Always accessible search
- Consistent navigation
- Quick access to favorites and notifications

#### 2. **Hero Section with Category Quick Access**

```tsx
<div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-8 lg:py-12">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Personalized Greeting */}
    <div className="mb-6">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
        {userName ? `Welcome back, ${userName}!` : 'Find Trusted Services'}
      </h1>
      <p className="text-lg text-gray-600">
        Discover top-rated service providers in your area
      </p>
    </div>
    
    {/* Location Quick Selector */}
    <div className="mb-8">
      <LocationQuickSelect
        currentLocation={location}
        onLocationChange={handleLocationChange}
        showDetectLocation={true}
      />
    </div>
    
    {/* Category Carousel */}
    <div className="overflow-x-auto pb-4 -mx-4 px-4">
      <div className="flex gap-4 min-w-max">
        {categories.map(category => (
          <CategoryCard
            key={category.id}
            category={category}
            onClick={() => handleCategorySelect(category)}
            isSelected={selectedCategory?.id === category.id}
          />
        ))}
      </div>
    </div>
  </div>
</div>
```

**Category Card Design:**
```tsx
<div className={`
  flex flex-col items-center justify-center
  w-24 h-24 sm:w-28 sm:h-28
  rounded-2xl
  cursor-pointer
  transition-all duration-200
  ${isSelected 
    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg scale-105' 
    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-emerald-300 hover:shadow-md'
  }
`}>
  <Icon className="w-8 h-8 mb-2" />
  <span className="text-xs sm:text-sm font-medium text-center px-2">
    {category.name}
  </span>
</div>
```

#### 3. **Quick Filter Chips (Above Results)**

```tsx
{hasActiveFilters && (
  <div className="mb-4 flex flex-wrap items-center gap-2">
    <span className="text-sm text-gray-600 font-medium">Active filters:</span>
    {activeFilters.map(filter => (
      <FilterChip
        key={filter.key}
        label={filter.label}
        value={filter.value}
        onRemove={() => handleRemoveFilter(filter.key)}
      />
    ))}
    <button
      onClick={handleClearAllFilters}
      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
    >
      Clear all
    </button>
  </div>
)}
```

#### 4. **Sticky Controls Bar**

```tsx
<div className="sticky top-[73px] z-40 bg-white border-b border-gray-200 py-3 mb-4">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    {/* Results Count */}
    <div className="text-sm text-gray-600">
      Showing <span className="font-semibold text-gray-900">{resultCount}</span> services
      {selectedCategory && (
        <span> in <span className="font-semibold">{selectedCategory.name}</span></span>
      )}
    </div>
    
    {/* Controls */}
    <div className="flex items-center gap-3">
      {/* Sort Dropdown */}
      <Select
        value={sortBy}
        onChange={handleSortChange}
        options={sortOptions}
        className="min-w-[180px]"
      />
      
      {/* View Toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <ViewToggleButton mode="grid" active={viewMode === 'grid'} />
        <ViewToggleButton mode="list" active={viewMode === 'list'} />
      </div>
    </div>
  </div>
</div>
```

#### 5. **Enhanced Service Card Design**

```tsx
<div className="group relative bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
  {/* Image Section */}
  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
    <Image
      src={service.image}
      alt={service.title}
      fill
      className="object-cover group-hover:scale-105 transition-transform duration-300"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
    
    {/* Favorite Button - Top Right */}
    <button
      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        handleFavorite(service.id);
      }}
    >
      <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
    </button>
    
    {/* Badge Overlay - Top Left */}
    {service.isVerified && (
      <div className="absolute top-3 left-3">
        <Badge variant="verified">Verified</Badge>
      </div>
    )}
    
    {/* Price Badge - Bottom Left */}
    <div className="absolute bottom-3 left-3">
      <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold text-sm">
        {formatPrice(service.price)}
      </div>
    </div>
  </div>
  
  {/* Content Section */}
  <div className="p-4">
    {/* Title & Rating Row */}
    <div className="flex items-start justify-between gap-2 mb-2">
      <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
        {service.title}
      </h3>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium text-gray-700">
          {service.rating.toFixed(1)}
        </span>
      </div>
    </div>
    
    {/* Provider Info */}
    {showProvider && (
      <div className="flex items-center gap-2 mb-3">
        <Avatar src={service.provider.avatar} size="sm" />
        <span className="text-sm text-gray-600">{service.provider.name}</span>
      </div>
    )}
    
    {/* Description Preview */}
    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
      {service.description}
    </p>
    
    {/* Category & Location */}
    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
      <div className="flex items-center gap-1">
        <Tag className="w-3 h-3" />
        <span>{service.category}</span>
      </div>
      <div className="flex items-center gap-1">
        <MapPin className="w-3 h-3" />
        <span>{service.location}</span>
      </div>
    </div>
    
    {/* Action Button */}
    <button
      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors"
      onClick={() => router.push(`/marketplace/services/${service.id}`)}
    >
      View Details
    </button>
  </div>
</div>
```

**Key Card Features:**
- Large, high-quality images with hover effects
- Clear pricing visibility
- Rating prominently displayed
- Quick favorite action
- Verification badges
- Single clear CTA button
- Responsive touch targets (min 44x44px)

---

## Service Detail Page Layout

### Recommended Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    STICKY HEADER                                 │
│  [Back] [Share] [Favorite] [More Options]                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    HERO IMAGE GALLERY                            │
│  [Main Image - Large] [Thumbnail Strip Below]                   │
│  Full-width, high-quality, zoomable                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    MAIN CONTENT                                  │
│  ┌──────────────────────────┐  ┌─────────────────────────────┐  │
│  │                          │  │                             │  │
│  │  SERVICE INFORMATION     │  │  BOOKING SIDEBAR            │  │
│  │                          │  │  (Sticky on Desktop)       │  │
│  │  • Title & Rating        │  │                             │  │
│  │  • Provider Card         │  │  ┌───────────────────────┐ │  │
│  │  • Description           │  │  │  Price Card           │ │  │
│  │  • Key Features          │  │  │  [Book Now Button]   │ │  │
│  │  • Service Details       │  │  │  [Message Provider]   │ │  │
│  │  • Packages & Add-ons    │  │  │  [Save for Later]    │ │  │
│  │  • Requirements          │  │  └───────────────────────┘ │  │
│  │  • Availability          │  │  ┌───────────────────────┐ │  │
│  │  • Location & Coverage   │  │  │  Provider Info     │ │  │
│  │                          │  │  │  [View Profile]    │ │  │
│  │  REVIEWS SECTION         │  │  └───────────────────────┘ │  │
│  │  • Review Summary        │  │                             │  │
│  │  • Review List           │  │                             │  │
│  │  • Write Review CTA      │  │                             │  │
│  │                          │  │                             │  │
│  │  RELATED SERVICES        │  │                             │  │
│  │                          │  │                             │  │
│  └──────────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. **Sticky Action Header**

```tsx
<div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between py-3">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Back</span>
      </button>
      
      <div className="flex items-center gap-2">
        <ShareButton service={service} />
        <FavoriteButton serviceId={service.id} />
        <MoreOptionsMenu service={service} />
      </div>
    </div>
  </div>
</div>
```

#### 2. **Image Gallery with Zoom**

```tsx
<div className="relative w-full aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden mb-4">
  <Image
    src={selectedImage}
    alt={service.title}
    fill
    className="object-cover"
    priority
  />
  
  {/* Image Navigation */}
  <button
    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full hover:bg-white"
    onClick={handlePreviousImage}
  >
    <ChevronLeft className="w-5 h-5" />
  </button>
  <button
    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full hover:bg-white"
    onClick={handleNextImage}
  >
    <ChevronRight className="w-5 h-5" />
  </button>
  
  {/* Thumbnail Strip */}
  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
    <div className="flex gap-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
      {images.map((img, idx) => (
        <button
          key={idx}
          onClick={() => setSelectedImage(img)}
          className={`
            w-16 h-16 rounded overflow-hidden border-2 transition-all
            ${selectedImage === img ? 'border-emerald-500' : 'border-transparent'}
          `}
        >
          <Image src={img} alt={`${idx + 1}`} width={64} height={64} className="object-cover" />
        </button>
      ))}
    </div>
  </div>
</div>
```

#### 3. **Service Information Section**

```tsx
<div className="space-y-8">
  {/* Title & Rating Header */}
  <div>
    <div className="flex items-start justify-between gap-4 mb-3">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex-1">
        {service.title}
      </h1>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
        <div>
          <div className="text-xl font-semibold text-gray-900">
            {service.rating.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">
            ({service.reviewCount} reviews)
          </div>
        </div>
      </div>
    </div>
    
    {/* Provider Quick Info */}
    <ProviderQuickCard provider={service.provider} />
  </div>
  
  {/* Description */}
  <section>
    <h2 className="text-xl font-semibold text-gray-900 mb-3">About this service</h2>
    <div className="prose prose-gray max-w-none">
      <p className="text-gray-700 leading-relaxed">{service.description}</p>
    </div>
  </section>
  
  {/* Key Features - Visual Grid */}
  <section>
    <h2 className="text-xl font-semibold text-gray-900 mb-4">What's included</h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {service.features.map(feature => (
        <div key={feature.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm text-gray-700">{feature.name}</span>
        </div>
      ))}
    </div>
  </section>
  
  {/* Service Details - Expandable Sections */}
  <section>
    <Accordion>
      <AccordionItem title="Service Details">
        {/* Detailed information */}
      </AccordionItem>
      <AccordionItem title="Requirements">
        {/* Requirements list */}
      </AccordionItem>
      <AccordionItem title="Packages & Add-ons">
        {/* Packages display */}
      </AccordionItem>
      <AccordionItem title="Availability & Location">
        {/* Availability calendar and location map */}
      </AccordionItem>
    </Accordion>
  </section>
  
  {/* Reviews Section */}
  <section>
    <ReviewSection serviceId={service.id} />
  </section>
  
  {/* Related Services */}
  <section>
    <RelatedServices currentServiceId={service.id} categoryId={service.categoryId} />
  </section>
</div>
```

#### 4. **Sticky Booking Sidebar**

```tsx
<aside className="lg:sticky lg:top-24 h-fit">
  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
    {/* Price Card */}
    <div className="mb-6">
      <div className="text-3xl font-bold text-gray-900 mb-1">
        {formatPrice(service.price)}
      </div>
      <div className="text-sm text-gray-600">
        {service.pricingType === 'hourly' ? 'per hour' : 'fixed price'}
      </div>
      {service.estimatedDuration && (
        <div className="text-sm text-gray-600 mt-1">
          Estimated duration: {service.estimatedDuration}
        </div>
      )}
    </div>
    
    {/* Primary CTA */}
    <button
      onClick={() => router.push(`/marketplace/services/${service.id}/book`)}
      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-lg mb-3 transition-colors shadow-md hover:shadow-lg"
    >
      Book Now
    </button>
    
    {/* Secondary Actions */}
    <div className="space-y-2">
      <button className="w-full border border-gray-300 hover:border-emerald-300 text-gray-700 hover:text-emerald-700 font-medium py-2.5 rounded-lg transition-colors">
        Message Provider
      </button>
      <button className="w-full border border-gray-300 hover:border-emerald-300 text-gray-700 hover:text-emerald-700 font-medium py-2.5 rounded-lg transition-colors">
        Save for Later
      </button>
    </div>
    
    {/* Trust Indicators */}
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="space-y-3">
        <TrustIndicator icon={<ShieldCheck />} text="Verified Provider" />
        <TrustIndicator icon={<Clock />} text="Responds within 2 hours" />
        <TrustIndicator icon={<Star />} text={`${service.rating.toFixed(1)} average rating`} />
      </div>
    </div>
    
    {/* Provider Card */}
    <div className="mt-6 pt-6 border-t border-gray-200">
      <ProviderCard provider={service.provider} compact />
    </div>
  </div>
</aside>
```

---

## Booking Flow Layout

### Multi-Step Form Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROGRESS INDICATOR                            │
│  [●]────[○]────[○]────[○]────[○]                                │
│  Step 1  Step 2  Step 3  Step 4  Step 5                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    STEP CONTENT                                  │
│  ┌──────────────────────────┐  ┌─────────────────────────────┐  │
│  │                          │  │                             │  │
│  │  FORM FIELDS             │  │  BOOKING SUMMARY            │  │
│  │                          │  │  (Sticky Sidebar)           │  │
│  │  • Date Picker           │  │                             │  │
│  │  • Time Selection        │  │  Service Info               │  │
│  │  • Location Input        │  │  Selected Date/Time         │  │
│  │  • Additional Notes      │  │  Price Breakdown            │  │
│  │  • Payment Method        │  │  [Continue Button]          │  │
│  │                          │  │                             │  │
│  └──────────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    NAVIGATION BUTTONS                            │
│  [< Back]                                    [Continue >]        │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

1. **Progress Indicator**
   - Visual progress bar
   - Step numbers and labels
   - Completed steps highlighted
   - Estimated time remaining

2. **Sticky Summary Sidebar**
   - Always visible booking summary
   - Updates as user progresses
   - Price breakdown
   - Service details reminder

3. **Form Validation**
   - Real-time validation
   - Clear error messages
   - Inline field validation
   - Prevent progression with errors

4. **Auto-save Draft**
   - Save progress automatically
   - Resume from last step
   - Clear indication of saved state

---

## Mobile-First Considerations

### Mobile Layout Adaptations

#### 1. **Collapsible Filter Sidebar**
- Drawer/modal on mobile
- Full-screen overlay
- Swipe to dismiss
- Active filter count badge on trigger button

#### 2. **Bottom Navigation Bar**
```tsx
<div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden">
  <div className="flex items-center justify-around py-2">
    <NavButton icon={<Home />} label="Browse" active />
    <NavButton icon={<Search />} label="Search" />
    <NavButton icon={<Heart />} label="Saved" />
    <NavButton icon={<Calendar />} label="Bookings" />
    <NavButton icon={<User />} label="Profile" />
  </div>
</div>
```

#### 3. **Floating Action Button (FAB)**
- "Book Now" FAB on service detail pages
- Sticky at bottom of viewport
- Only on mobile
- Replaces sidebar booking card

#### 4. **Touch-Optimized Cards**
- Minimum 44x44px touch targets
- Larger spacing between cards
- Swipe gestures for actions
- Pull-to-refresh

#### 5. **Simplified Navigation**
- Hamburger menu for main navigation
- Breadcrumbs for deep pages
- Back button always visible
- Clear page titles

---

## Visual Hierarchy & Information Architecture

### Information Priority (Top to Bottom)

1. **Primary Actions** (Always Visible)
   - Search bar
   - Book Now button
   - Favorite button

2. **Key Information** (Above Fold)
   - Service title
   - Price
   - Rating
   - Primary image

3. **Supporting Information** (Scrollable)
   - Description
   - Features
   - Provider info
   - Reviews

4. **Detailed Information** (Expandable)
   - Full service details
   - Requirements
   - Terms and conditions

### Visual Weight Hierarchy

1. **High Priority** (Bold, Large, Color)
   - Primary CTAs
   - Prices
   - Ratings
   - Service titles

2. **Medium Priority** (Regular, Medium)
   - Descriptions
   - Category labels
   - Provider names

3. **Low Priority** (Light, Small)
   - Metadata
   - Timestamps
   - Secondary information

### Color Usage

- **Primary Actions**: Emerald-600 (green)
- **Secondary Actions**: Gray-700 with hover states
- **Ratings**: Yellow-400 (stars)
- **Verified Badges**: Blue-600
- **Error States**: Red-600
- **Success States**: Emerald-600

---

## Conversion Optimization

### 1. **Trust Signals**
- Verification badges prominently displayed
- Review count visible
- Response time indicators
- Years of experience badges

### 2. **Social Proof**
- Recent bookings count
- "X people viewed this today"
- "Popular in [location]"
- Review highlights

### 3. **Urgency Indicators**
- "Only 2 slots available this week"
- "Booked 5 times this month"
- Limited availability warnings

### 4. **Clear Pricing**
- No hidden fees
- Transparent breakdown
- Payment options visible
- Refund policy accessible

### 5. **Reduced Friction**
- Guest checkout option
- Saved payment methods
- Auto-fill location
- Quick booking for repeat customers

### 6. **Progressive Disclosure**
- Show essential info first
- Expandable details
- "Learn more" links
- FAQ sections

---

## Accessibility Enhancements

### 1. **Keyboard Navigation**
- All interactive elements keyboard accessible
- Logical tab order
- Skip links for main content
- Focus indicators visible

### 2. **Screen Reader Support**
- Semantic HTML
- ARIA labels for icons
- Live regions for dynamic content
- Alt text for all images

### 3. **Visual Accessibility**
- High contrast ratios (WCAG AA minimum)
- Text resizable up to 200%
- Focus indicators
- Color not sole indicator

### 4. **Motor Accessibility**
- Large touch targets (44x44px minimum)
- Adequate spacing between elements
- No time-limited interactions
- Error prevention

### Example: Accessible Service Card

```tsx
<article
  className="service-card"
  role="article"
  aria-labelledby={`service-title-${service.id}`}
>
  <div className="image-container">
    <Image
      src={service.image}
      alt={`${service.title} - ${service.category} service`}
      aria-describedby={`service-desc-${service.id}`}
    />
  </div>
  
  <div className="content">
    <h3 id={`service-title-${service.id}`} className="font-semibold">
      {service.title}
    </h3>
    
    <div
      role="img"
      aria-label={`Rating: ${service.rating} out of 5 stars`}
    >
      <StarRating value={service.rating} readOnly />
    </div>
    
    <p id={`service-desc-${service.id}`} className="description">
      {service.description}
    </p>
    
    <div className="price" aria-label={`Price: ${formatPrice(service.price)}`}>
      {formatPrice(service.price)}
    </div>
    
    <button
      onClick={() => handleViewDetails(service.id)}
      aria-label={`View details for ${service.title}`}
      className="cta-button"
    >
      View Details
    </button>
  </div>
</article>
```

---

## Performance Optimization

### 1. **Image Optimization**
- Next.js Image component
- Lazy loading below fold
- WebP format with fallbacks
- Responsive sizes
- Blur placeholders

### 2. **Code Splitting**
- Lazy load detail pages
- Route-based code splitting
- Component-level lazy loading
- Dynamic imports for heavy components

### 3. **Data Fetching**
- Server-side rendering for initial load
- Client-side fetching for filters
- Debounced search inputs
- Pagination for large lists
- Infinite scroll option

### 4. **Caching Strategy**
- Cache service listings
- Cache category data
- Cache user preferences
- Cache search results

---

## Implementation Checklist

### Homepage/Browse Page
- [ ] Sticky search header
- [ ] Hero section with category quick access
- [ ] Location quick selector
- [ ] Quick filter chips
- [ ] Sticky controls bar
- [ ] Enhanced service cards
- [ ] Mobile filter drawer
- [ ] Bottom navigation (mobile)

### Service Detail Page
- [ ] Sticky action header
- [ ] Image gallery with zoom
- [ ] Sticky booking sidebar
- [ ] Expandable detail sections
- [ ] Review section
- [ ] Related services
- [ ] Mobile FAB for booking

### Booking Flow
- [ ] Progress indicator
- [ ] Sticky summary sidebar
- [ ] Form validation
- [ ] Auto-save draft
- [ ] Payment integration
- [ ] Confirmation page

### General
- [ ] Responsive breakpoints tested
- [ ] Touch targets minimum 44x44px
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Loading states
- [ ] Error handling
- [ ] Performance optimization

---

## Related Documentation

- `MARKETPLACE_FRONTEND_DOCUMENTATION.md` - Technical implementation details
- `PROVIDER_MARKETPLACE_LAYOUT.md` - Base layout patterns
- `FEATURE_MAIN_PAGE_BASE_TEMPLATE.md` - Feature page template

---

*This guide should be updated as user testing reveals new insights and as marketplace UX patterns evolve.*

