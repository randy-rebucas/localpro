# Feature Switcher (Package Switcher) — Implementation Documentation

## Overview

The Feature Switcher (internally called "Package Switcher") allows users to set a preferred feature/package that they want quick access to. When a user selects a preferred feature, the app can automatically redirect them to that feature when they visit the home page or dashboard.

- **Storage key**: `localStorage["localpro_preferred_feature"]`
- **Sync mechanism**: Custom event `localpro:package-switcher:changed` (same-tab) + `storage` event (cross-tab) + backend API
- **Canonical hook**: `src/shared/hooks/usePreferredFeature.ts` (wrapper) or `src/contexts/package-switcher-context.tsx` (direct)
- **Context Provider**: `PackageSwitcherProvider` in `src/contexts/package-switcher-context.tsx`

## Architecture

### Core Components

#### 1. Package Switcher Context (`src/contexts/package-switcher-context.tsx`)

The central state management for the feature switcher. Provides:

- **State Management**: Manages `activePackage` state across the app
- **Storage Sync**: Syncs between localStorage, backend, and cross-tab updates
- **Event System**: Custom events for same-tab component synchronization
- **Error Handling**: Graceful fallbacks for storage failures

**Key Functions:**
- `readFromStorage()`: Reads from backend first, falls back to localStorage, then sessionStorage
- `writeToStorageSync()`: Writes to localStorage synchronously
- `normalizePackage()`: Validates package IDs against registry
- `setActivePackage()`: Updates state, localStorage, and syncs to backend
- `clearActivePackage()`: Clears the preference

**Storage Priority:**
1. Backend session preferences (via `getSessionPreferences()`)
2. localStorage (fast access)
3. sessionStorage (migration fallback)

#### 2. Preferred Feature Hook (`src/shared/hooks/usePreferredFeature.ts`)

Backward-compatible wrapper hook that provides a friendlier API:

```typescript
export function usePreferredFeature() {
  const {
    activePackage,
    setActivePackage,
    clearActivePackage,
    hasActivePackage,
    isLoading,
  } = usePackageSwitcher();

  return {
    preferredFeature: activePackage,
    setPreferredFeature: setActivePackage,
    clearPreferredFeature: clearActivePackage,
    hasPreferredFeature: hasActivePackage,
    isLoading,
  };
}
```

#### 3. Backend Sync (`src/lib/session-preferences.ts`)

Handles synchronization with the backend:

- `updatePackagePreference(pkg: AppPackage)`: Updates user settings via API
- `getSessionPreferences()`: Fetches roleView and package from backend
- Non-blocking: Backend sync happens asynchronously, localStorage is source of truth for UI

#### 4. Package Registry (`src/shared/config/package-registry.ts`)

Central registry of all available packages/features:

```typescript
export const PACKAGE_REGISTRY: Record<PackageId, PackageRegistryEntry> = {
  marketplace: {
    id: "marketplace",
    label: "Marketplace",
    route: "/marketplace",
    featureId: "marketplace",
    appSettingsKey: "marketplace",
  },
  // ... other packages
};
```

Each package entry includes:
- `id`: Package identifier
- `label`: Display name
- `route`: Primary route for the package
- `featureId`: Backend feature catalog ID
- `appSettingsKey`: Key used in app settings for feature gating

## Available Packages

The following packages are available in the system:

| Package ID | Label | Route | App Settings Key |
|------------|-------|-------|-------------------|
| `marketplace` | Marketplace | `/marketplace` | `marketplace` |
| `academy` | Academy | `/academy` | `academy` |
| `ads` | Ads | `/ads` | `ads` |
| `supplies` | Supplies | `/supplies` | `supplies` |
| `rentals` | Rentals | `/rentals` | `rentals` |
| `finance` | Finance | `/finance` | `finance` |
| `facility` | Facility Care | `/facility-care` | `facilityCare` |
| `plus` | LocalPro Plus | `/plus` | `localProPlus` |
| `jobs` | Jobs | `/jobs` | `jobBoard` |
| `referrals` | Referrals | `/referrals` | `referrals` |

## UI Components

### 1. GlobalHeader Integration

**Location**: `src/components/global-header.tsx`

The feature switcher is integrated into the global header as an icon button that opens a modal. The modal:
- Shows all available features based on app settings feature flags
- Allows users to select a preferred feature
- Automatically navigates to the selected feature's route

**Feature Gating**: Features are filtered based on `appSettings.features` to only show enabled features.

### 2. PreferredFeatureSelector

**Location**: `src/components/preferred-feature-selector.tsx`

Full-page selector component that displays:
- Current selection with edit/remove options
- Grid layout of all available features
- Feature cards with icons, names, and descriptions

**Note**: Currently has hardcoded enablement logic (only marketplace enabled). Should be updated to use app settings feature flags.

### 3. PreferredFeatureModal

**Location**: `src/components/preferred-feature-modal.tsx`

Modal dialog for feature selection:
- Filters features based on app settings
- Responsive grid layout
- Shows current selection
- Allows removal of preference
- Handles keyboard navigation (Escape to close)

### 4. PreferredFeaturePrompt

**Location**: `src/components/preferred-feature-prompt.tsx`

Non-intrusive prompt that appears when:
- User visits a feature route
- No preferred feature is set
- User hasn't dismissed the prompt for this feature in this session

**Behavior**:
- Session-based dismissal (stored in sessionStorage)
- Can be dismissed or accepted
- Only shows once per feature per session

### 5. Auto-Redirect

**Location**: `src/app/(authenticated)/layout.tsx`

Automatically redirects users to their preferred feature when:
- User is authenticated and loaded
- Has a preferred feature set
- Visits home page (`/`) or dashboard (`/dashboard`)
- Hasn't redirected yet in this session

**Implementation**:
```typescript
useEffect(() => {
  if (
    status === "authenticated" &&
    session &&
    !loading &&
    preferredFeature &&
    !preferredFeatureRedirectedRef.current
  ) {
    const isHomePage = pathname === "/" || pathname === "/dashboard";
    const featureRoute = preferredFeature ? PACKAGE_REGISTRY[preferredFeature]?.route : undefined;

    if (isHomePage && featureRoute && pathname !== featureRoute) {
      preferredFeatureRedirectedRef.current = true;
      router.push(featureRoute);
    }
  }
}, [status, session, loading, preferredFeature, pathname, router]);
```

## Usage Examples

### Basic Usage

```typescript
import { usePreferredFeature } from "@/shared/hooks/usePreferredFeature";

function MyComponent() {
  const { 
    preferredFeature, 
    setPreferredFeature, 
    hasPreferredFeature,
    isLoading 
  } = usePreferredFeature();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {hasPreferredFeature ? (
        <p>Your preferred feature: {preferredFeature}</p>
      ) : (
        <p>No preferred feature set</p>
      )}
      
      <button onClick={() => setPreferredFeature("marketplace")}>
        Set Marketplace as Preferred
      </button>
    </div>
  );
}
```

### Direct Hook Usage

```typescript
import { usePackageSwitcher } from "@/contexts/package-switcher-context";

function MyComponent() {
  const { 
    activePackage, 
    setActivePackage, 
    clearActivePackage,
    hasActivePackage,
    isLoading 
  } = usePackageSwitcher();

  // Use activePackage instead of preferredFeature
  // Use setActivePackage instead of setPreferredFeature
}
```

### Getting Package Information

```typescript
import { PACKAGE_REGISTRY, getPackageEntry } from "@/shared/config/package-registry";
import { usePreferredFeature } from "@/shared/hooks/usePreferredFeature";

function FeatureInfo() {
  const { preferredFeature } = usePreferredFeature();
  
  if (!preferredFeature) return null;
  
  const packageInfo = getPackageEntry(preferredFeature);
  
  return (
    <div>
      <h2>{packageInfo?.label}</h2>
      <p>Route: {packageInfo?.route}</p>
      <a href={packageInfo?.route}>Go to {packageInfo?.label}</a>
    </div>
  );
}
```

### Checking Feature Availability

```typescript
import { useAppSettings } from "@/hooks/useAppSettings";
import { PACKAGE_REGISTRY } from "@/shared/config/package-registry";

function FeatureList() {
  const { settings: appSettings } = useAppSettings();
  
  const isFeatureEnabled = (featureKey: string): boolean => {
    if (!appSettings?.features) return true;
    const features = appSettings.features as Record<string, unknown>;
    const feature = features[featureKey];
    if (feature === undefined) return true;
    if (typeof feature === 'boolean') return feature;
    if (typeof feature === 'object' && feature !== null) {
      return (feature as { enabled?: boolean }).enabled !== false;
    }
    return true;
  };
  
  const availableFeatures = Object.values(PACKAGE_REGISTRY).filter(
    pkg => isFeatureEnabled(pkg.appSettingsKey)
  );
  
  return (
    <div>
      {availableFeatures.map(pkg => (
        <div key={pkg.id}>{pkg.label}</div>
      ))}
    </div>
  );
}
```

## Data Flow

### Setting a Preferred Feature

1. **User Action**: User selects a feature in UI component
2. **Hook Call**: `setPreferredFeature(packageId)` is called
3. **Immediate Update**: 
   - `localStorage` is updated synchronously
   - Component state is updated
   - Custom event `localpro:package-switcher:changed` is dispatched
4. **Backend Sync**: `updatePackagePreference()` is called asynchronously
5. **Cross-Tab Sync**: `storage` event fires, updating other tabs

### Reading Preferred Feature

1. **Initial Load**: 
   - Provider reads from backend via `getSessionPreferences()`
   - Falls back to localStorage if backend fails
   - Falls back to sessionStorage for migration
2. **Runtime Access**: 
   - Components read from context state
   - State is kept in sync via events

### Cross-Tab Synchronization

When a user changes their preferred feature in one tab:

1. `localStorage` is updated
2. `storage` event fires in other tabs
3. Other tabs read the new value from localStorage
4. If cleared locally, tabs check backend for consistency
5. All tabs update their state accordingly

## API Reference

### `usePreferredFeature()`

Returns an object with:

- `preferredFeature: AppPackage | null` - The current preferred feature, or `null` if none set
- `setPreferredFeature: (pkg: AppPackage) => void` - Set the preferred feature
- `clearPreferredFeature: () => void` - Clear the preferred feature
- `hasPreferredFeature: boolean` - Whether a preferred feature is set
- `isLoading: boolean` - Whether the initial load is in progress

### `usePackageSwitcher()`

Returns an object with:

- `activePackage: AppPackage | null` - The current active package
- `setActivePackage: (pkg: AppPackage) => void` - Set the active package
- `clearActivePackage: () => void` - Clear the active package
- `hasActivePackage: boolean` - Whether an active package is set
- `isLoading: boolean` - Whether the initial load is in progress

### `getPackageEntry(id: AppPackage | null | undefined)`

Returns the package registry entry for the given package ID, or `null` if not found.

### `PACKAGE_REGISTRY`

Object containing all package definitions. Keys are package IDs, values are `PackageRegistryEntry` objects.

## Type Definitions

```typescript
export type AppPackage =
  | "marketplace"
  | "academy"
  | "ads"
  | "supplies"
  | "rentals"
  | "finance"
  | "facility"
  | "plus"
  | "jobs"
  | "referrals"
  | null;

export type PackageId = Exclude<AppPackage, null>;

export interface PackageRegistryEntry {
  id: PackageId;
  label: string;
  route: string;
  featureId: string;
  appSettingsKey: string;
}
```

## Error Handling

The implementation includes comprehensive error handling:

1. **Storage Errors**: 
   - Gracefully handles localStorage quota exceeded
   - Handles private browsing mode restrictions
   - Falls back to backend if localStorage fails

2. **Backend Errors**:
   - Non-blocking: UI updates immediately via localStorage
   - Backend sync happens asynchronously
   - Failures are logged but don't break the UI

3. **Invalid Package IDs**:
   - `normalizePackage()` validates against registry
   - Invalid IDs are normalized to `null`
   - Prevents invalid state

## Best Practices

### 1. Use the Preferred Feature Hook

For most use cases, use `usePreferredFeature()` instead of `usePackageSwitcher()` directly:

```typescript
// ✅ Good
const { preferredFeature, setPreferredFeature } = usePreferredFeature();

// ⚠️ Only if you need direct access
const { activePackage, setActivePackage } = usePackageSwitcher();
```

### 2. Check Loading State

Always check `isLoading` before using the preference:

```typescript
const { preferredFeature, isLoading } = usePreferredFeature();

if (isLoading) {
  return <Loading />;
}

// Safe to use preferredFeature now
```

### 3. Use Package Registry for Routes

Don't hardcode routes. Use the package registry:

```typescript
// ✅ Good
import { PACKAGE_REGISTRY } from "@/shared/config/package-registry";
const route = PACKAGE_REGISTRY[preferredFeature]?.route;

// ❌ Bad
const route = preferredFeature === "marketplace" ? "/marketplace" : "/";
```

### 4. Respect Feature Flags

Check app settings before showing features:

```typescript
const { settings: appSettings } = useAppSettings();
const isEnabled = isFeatureEnabled(pkg.appSettingsKey);
```

### 5. Handle Null Values

Always handle the case where no preference is set:

```typescript
const { preferredFeature, hasPreferredFeature } = usePreferredFeature();

if (!hasPreferredFeature) {
  return <PromptToSetPreference />;
}
```

## Integration Points

### Provider Setup

The `PackageSwitcherProvider` is set up in the root layout:

```typescript
// src/app/layout.tsx
<PackageSwitcherProvider>
  {/* App content */}
</PackageSwitcherProvider>
```

### Component Integration

Components that use the feature switcher:

- `src/components/global-header.tsx` - Header icon button and modal
- `src/components/preferred-feature-selector.tsx` - Full-page selector
- `src/components/preferred-feature-modal.tsx` - Modal dialog
- `src/components/preferred-feature-prompt.tsx` - Auto-prompt
- `src/app/(authenticated)/layout.tsx` - Auto-redirect logic

## Migration Notes

### From Old Implementation

The feature switcher maintains backward compatibility:

- Uses the same localStorage key: `localpro_preferred_feature`
- Maintains the same event name pattern
- Provides backward-compatible hook names

### Deprecated Components

- `FloatingFeatureSelector` - Deprecated, returns null. Functionality moved to GlobalHeader.

## Troubleshooting

### Preferred Feature Not Persisting

1. Check browser console for storage errors
2. Verify backend API is accessible
3. Check network tab for failed API calls
4. Verify user is authenticated

### Cross-Tab Sync Not Working

1. Ensure both tabs are on the same origin
2. Check that localStorage is enabled
3. Verify event listeners are properly set up

### Auto-Redirect Not Working

1. Check that user is authenticated
2. Verify preferred feature is set
3. Check that redirect hasn't already happened (ref prevents multiple redirects)
4. Verify route exists in `PACKAGE_REGISTRY`

## Testing

### Manual Testing Checklist

- [ ] Set preferred feature and verify it persists after refresh
- [ ] Change preferred feature in one tab, verify other tabs update
- [ ] Clear preferred feature and verify it's cleared everywhere
- [ ] Test auto-redirect on home/dashboard pages
- [ ] Test feature prompt appears when visiting feature routes
- [ ] Test feature modal opens from header icon
- [ ] Verify features are filtered based on app settings
- [ ] Test error handling (disable localStorage, network failure)

### Unit Testing

Test the context provider and hooks:

```typescript
import { renderHook, act } from '@testing-library/react';
import { usePreferredFeature } from '@/shared/hooks/usePreferredFeature';

test('sets preferred feature', () => {
  const { result } = renderHook(() => usePreferredFeature());
  
  act(() => {
    result.current.setPreferredFeature('marketplace');
  });
  
  expect(result.current.preferredFeature).toBe('marketplace');
  expect(result.current.hasPreferredFeature).toBe(true);
});
```

## Related Documentation

- [Role View Usage](./ROLE_VIEW_USAGE.md) - Similar pattern for role switching
- [App Settings Implementation](./APP_SETTINGS_IMPLEMENTATION.md) - Feature flag system
- [User Settings Implementation](./USER_SETTINGS_IMPLEMENTATION.md) - Backend settings sync

## Future Improvements

1. **Remove Deprecated Component**: Remove `FloatingFeatureSelector` import from authenticated layout
2. **Fix Hardcoded Enablement**: Update `PreferredFeatureSelector` to use app settings feature flags
3. **Add Analytics**: Track when users set/change preferred features
4. **Add Preferences Page**: Dedicated settings page for managing preferences
5. **Add Recent Features**: Show recently visited features as suggestions

