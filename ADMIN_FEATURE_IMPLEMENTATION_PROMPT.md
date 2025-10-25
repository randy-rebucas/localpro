# Admin Feature Implementation Prompt

## 🎯 Use this prompt when implementing new admin features

Copy and paste this prompt when working on new admin features to ensure consistent styling and patterns.

---

## 📋 Implementation Prompt

```
You are implementing a new admin feature for the LocalPro platform. Follow these styling guidelines based on the established audit page patterns to ensure consistency across all admin pages.

### 🎨 STYLING REQUIREMENTS

**Page Structure:**
- Use `space-y-4` for main container spacing
- Implement responsive design with mobile-first approach
- Follow the established component hierarchy

**Page Header Pattern:**
```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
      {pageTitle}
    </h1>
    <p className="text-gray-600 text-sm">{pageDescription}</p>
  </div>
  <div className="mt-2 sm:mt-0 flex items-center space-x-2">
    {/* Action buttons with proper styling */}
  </div>
</div>
```

**Stats Cards Pattern:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      <Icon className="w-5 h-5 text-blue-600" />
    </div>
  </div>
</div>
```

**Filter Section Pattern:**
```tsx
<div className="bg-white rounded shadow">
  <div className="px-4 py-3 border-b border-gray-200">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
      <div className="flex items-center space-x-2">
        <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <Filter className="w-3 h-3 mr-1" />
          {showFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>
    </div>
  </div>
  {/* Filter content */}
</div>
```

**Data Table Pattern:**
```tsx
<div className="bg-white rounded shadow overflow-hidden">
  <div className="px-4 py-3 border-b border-gray-200">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium text-gray-900">{tableTitle}</h3>
      {/* Sort controls */}
    </div>
  </div>
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            {columnHeader}
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        <tr className="hover:bg-gray-50">
          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
            {cellContent}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### 🎨 COLOR SCHEME
- **Primary**: Blue (`blue-500`, `blue-600`, `blue-700`)
- **Success**: Green (`green-500`, `green-600`)
- **Warning**: Yellow (`yellow-500`, `yellow-600`)
- **Error**: Red (`red-500`, `red-600`)
- **Info**: Purple (`purple-500`, `purple-600`)
- **Neutral**: Gray scale (`gray-50` to `gray-900`)

### 🔘 BUTTON STYLES

**Primary Action Button:**
```tsx
<button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 hover:shadow-md">
  <Icon className="w-4 h-4 mr-2" />
  Button Text
</button>
```

**Small Action Button:**
```tsx
<button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200">
  <Icon className="w-3 h-3 mr-1" />
  Button Text
</button>
```

### 🏷️ STATUS BADGES
```tsx
const getStatusColor = (status: string) => {
  switch (status) {
    case 'success': return 'text-green-600 bg-green-100';
    case 'warning': return 'text-yellow-600 bg-yellow-100';
    case 'error': return 'text-red-600 bg-red-100';
    case 'info': return 'text-blue-600 bg-blue-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

<span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
  {status}
</span>
```

### 📝 FORM ELEMENTS
```tsx
<label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
<input className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
<select className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
  <option value="">All Options</option>
</select>
```

### 🔄 LOADING & ERROR STATES

**Loading State:**
```tsx
<div className="min-h-screen flex items-center justify-center">
  <Loading size="xl" text="Loading content..." />
</div>
```

**Error State:**
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

### 📱 RESPONSIVE DESIGN
- Use `grid-cols-2 md:grid-cols-4` for stats cards
- Use `flex-col sm:flex-row` for responsive layouts
- Ensure proper mobile spacing with `gap-3` instead of `gap-6`

### 🎯 ICON SIZES
- **Small**: `w-3 h-3` (12px) - for buttons and inline elements
- **Medium**: `w-4 h-4` (16px) - for form elements
- **Large**: `w-5 h-5` (20px) - for stats cards
- **Extra Large**: `w-6 h-6` (24px) - for page headers

### ♿ ACCESSIBILITY REQUIREMENTS
- Include proper focus states: `focus:outline-none focus:ring-2 focus:ring-blue-500`
- Use semantic HTML elements
- Add proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers

### ✅ IMPLEMENTATION CHECKLIST
- [ ] Page header with gradient text and proper layout
- [ ] Stats cards with border-left accent and compact layout
- [ ] Responsive grid layouts using `gap-3`
- [ ] Proper table headers with sort controls
- [ ] Consistent button styling
- [ ] Compact form elements
- [ ] Status badge color functions
- [ ] Loading and error states
- [ ] Proper icon sizing
- [ ] Consistent spacing with `space-y-4`
- [ ] Mobile responsiveness
- [ ] Color consistency
- [ ] Accessibility features

### 🚀 REQUIRED IMPORTS
```tsx
import { 
  RefreshCw, 
  Filter, 
  Download, 
  Search,
  // Add other icons as needed
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
```

### 📋 COMPONENT STRUCTURE TEMPLATE
```tsx
export default function AdminFeaturePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading content..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Feature Title
          </h1>
          <p className="text-gray-600 text-sm">Feature description</p>
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

### 🎨 DESIGN PRINCIPLES
1. **Consistency**: Follow the audit page patterns exactly
2. **Professional**: Clean, modern, business-appropriate styling
3. **Accessible**: Proper focus states, ARIA labels, keyboard navigation
4. **Responsive**: Mobile-first design that works on all devices
5. **Performance**: Efficient CSS classes and optimized layouts

### 🚫 AVOID THESE PATTERNS
- Don't use `gap-6` - use `gap-3` instead
- Don't use large padding - use `p-3` instead of `p-6`
- Don't use `text-lg` for stats - use `text-lg` for main values, `text-xs` for labels
- Don't use `w-6 h-6` icons in stats cards - use `w-5 h-5`
- Don't use `px-6 py-4` for table cells - use `px-3 py-2`
- Don't use `rounded-lg` - use `rounded` for consistency
- Don't use `shadow-lg` - use `shadow` for subtlety

Remember: The audit page (`src/app/admin/audit/page.tsx`) is the gold standard. Match its styling patterns exactly for consistency across all admin pages.
```

---

## 🎯 How to Use This Prompt

1. **Copy the entire prompt above**
2. **Paste it when starting work on a new admin feature**
3. **Follow the patterns exactly as specified**
4. **Use the checklist to ensure nothing is missed**
5. **Reference the audit page for visual confirmation**

## 📚 Additional Resources

- **Style Guide**: `ADMIN_STYLE_GUIDE.md`
- **Component Patterns**: `ADMIN_COMPONENT_PATTERNS.md`
- **Implementation Guide**: `ADMIN_IMPLEMENTATION_GUIDE.md`
- **Reference Page**: `src/app/admin/audit/page.tsx`

This prompt ensures that every new admin feature will have consistent, professional styling that matches the established audit page patterns.
