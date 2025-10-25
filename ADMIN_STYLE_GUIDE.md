# Admin Panel Style Guide

## Overview
This style guide is based on the comprehensive styling patterns found in `src/app/admin/audit/page.tsx` and should be applied consistently across all admin pages.

## Core Design Principles

### 1. Layout Structure
- **Container**: `space-y-4` for consistent vertical spacing
- **Responsive Design**: Mobile-first approach with responsive breakpoints
- **Grid System**: Consistent use of CSS Grid for layouts

### 2. Color Palette
- **Primary**: Blue (`blue-500`, `blue-600`, `blue-700`)
- **Success**: Green (`green-500`, `green-600`)
- **Warning**: Yellow (`yellow-500`, `yellow-600`)
- **Error**: Red (`red-500`, `red-600`)
- **Info**: Purple (`purple-500`, `purple-600`)
- **Neutral**: Gray scale (`gray-50` to `gray-900`)

### 3. Typography
- **Page Headers**: `text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent`
- **Section Headers**: `text-lg font-medium text-gray-900`
- **Body Text**: `text-sm text-gray-600`
- **Labels**: `text-xs font-medium text-gray-700`
- **Small Text**: `text-xs text-gray-500`

## Component Patterns

### 1. Page Header
```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
      Page Title
    </h1>
    <p className="text-gray-600 text-sm">Page description</p>
  </div>
  <div className="mt-2 sm:mt-0 flex items-center space-x-2">
    {/* Action buttons */}
  </div>
</div>
```

### 2. Stats Cards Grid
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500">Label</p>
        <p className="text-lg font-bold text-gray-900">Value</p>
        <p className="text-xs text-gray-500">Subtitle</p>
      </div>
      <IconComponent className="w-5 h-5 text-blue-600" />
    </div>
  </div>
</div>
```

### 3. Filter Section
```tsx
<div className="bg-white rounded shadow">
  <div className="px-4 py-3 border-b border-gray-200">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
      <div className="flex items-center space-x-2">
        {/* Filter buttons */}
      </div>
    </div>
  </div>
  {/* Filter content */}
</div>
```

### 4. Data Table
```tsx
<div className="bg-white rounded shadow overflow-hidden">
  <div className="px-4 py-3 border-b border-gray-200">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-gray-900">Table Title</h3>
      {/* Sort controls */}
    </div>
  </div>
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      {/* Table content */}
    </table>
  </div>
</div>
```

### 5. Action Buttons
```tsx
// Primary Action
<button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200">
  <Icon className="w-3 h-3 mr-1" />
  Button Text
</button>

// Secondary Action
<button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 hover:shadow-md">
  <Icon className="w-4 h-4 mr-2" />
  Button Text
</button>
```

### 6. Status Badges
```tsx
// Status Colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'success': return 'text-green-600 bg-green-100';
    case 'warning': return 'text-yellow-600 bg-yellow-100';
    case 'error': return 'text-red-600 bg-red-100';
    case 'info': return 'text-blue-600 bg-blue-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

// Usage
<span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
  {status}
</span>
```

### 7. Form Elements
```tsx
// Input Fields
<input
  type="text"
  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
  placeholder="Placeholder text"
/>

// Select Dropdowns
<select className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
  <option value="">All Options</option>
</select>

// Labels
<label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
```

### 8. Modal/Dialog
```tsx
<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
  <div className="relative top-10 mx-auto p-4 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded bg-white">
    <div className="mt-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Modal Title</h3>
        <button className="text-gray-400 hover:text-gray-600">
          <XCircle className="w-5 h-5" />
        </button>
      </div>
      {/* Modal content */}
    </div>
  </div>
</div>
```

## Spacing System

### Vertical Spacing
- **Page Level**: `space-y-4` or `space-y-6`
- **Section Level**: `space-y-3`
- **Component Level**: `space-y-2`

### Horizontal Spacing
- **Button Groups**: `space-x-2` or `space-x-3`
- **Form Elements**: `gap-3` or `gap-4`
- **Grid Items**: `gap-3` or `gap-4`

## Responsive Breakpoints

### Grid Layouts
- **Mobile**: `grid-cols-1`
- **Tablet**: `md:grid-cols-2` or `md:grid-cols-3`
- **Desktop**: `lg:grid-cols-4` or `lg:grid-cols-5`

### Flex Layouts
- **Mobile**: `flex-col`
- **Desktop**: `sm:flex-row`

## Icon Usage

### Icon Sizes
- **Small**: `w-3 h-3` (12px)
- **Medium**: `w-4 h-4` (16px)
- **Large**: `w-5 h-5` (20px)
- **Extra Large**: `w-6 h-6` (24px)

### Icon Colors
- **Primary**: `text-blue-600`
- **Success**: `text-green-600`
- **Warning**: `text-yellow-600`
- **Error**: `text-red-600`
- **Neutral**: `text-gray-400` or `text-gray-600`

## Loading States

### Full Page Loading
```tsx
<div className="min-h-screen flex items-center justify-center">
  <Loading size="xl" text="Loading content..." />
</div>
```

### Error States
```tsx
<div className="min-h-screen flex items-center justify-center">
  <div className="text-center">
    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
    <p className="text-gray-600">{error}</p>
    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
      Try Again
    </button>
  </div>
</div>
```

## Animation and Transitions

### Hover Effects
- **Cards**: `hover:shadow-lg transition-all duration-300`
- **Buttons**: `hover:bg-gray-50 transition-all duration-200`
- **Icons**: `group-hover:scale-110 transition-transform duration-200`

### Loading Animations
- **Spinner**: `animate-spin`
- **Pulse**: `animate-pulse`

## Accessibility

### Focus States
- **Buttons**: `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`
- **Inputs**: `focus:outline-none focus:ring-1 focus:ring-blue-500`

### Screen Reader Support
- Use semantic HTML elements
- Include proper ARIA labels
- Provide meaningful alt text for images

## Implementation Checklist

When creating new admin pages, ensure:

1. ✅ Use consistent spacing (`space-y-4` or `space-y-6`)
2. ✅ Apply proper color scheme (blue primary, semantic colors)
3. ✅ Include responsive design patterns
4. ✅ Use consistent typography hierarchy
5. ✅ Implement proper loading and error states
6. ✅ Add hover and focus states
7. ✅ Use semantic HTML structure
8. ✅ Include proper accessibility attributes
9. ✅ Follow the component patterns above
10. ✅ Test on different screen sizes

## Examples

### Complete Page Structure
```tsx
export default function AdminPage() {
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Page Title
          </h1>
          <p className="text-gray-600 text-sm">Page description</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {/* Action buttons */}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Stats cards */}
      </div>

      {/* Filters */}
      <div className="bg-white rounded shadow">
        {/* Filter content */}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        {/* Table content */}
      </div>
    </div>
  );
}
```

This style guide ensures consistency across all admin pages while maintaining the professional, clean aesthetic established in the audit page.
