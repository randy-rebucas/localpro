# Feature Switcher — Quick Reference

## Quick Start

```typescript
import { usePreferredFeature } from "@/shared/hooks/usePreferredFeature";

function MyComponent() {
  const { 
    preferredFeature,      // Current preference (AppPackage | null)
    setPreferredFeature,  // Set preference: (pkg: AppPackage) => void
    clearPreferredFeature, // Clear preference: () => void
    hasPreferredFeature,   // boolean
    isLoading             // boolean
  } = usePreferredFeature();
}
```

## Available Packages

| ID | Route | App Settings Key |
|----|-------|------------------|
| `marketplace` | `/marketplace` | `marketplace` |
| `academy` | `/academy` | `academy` |
| `ads` | `/ads` | `ads` |
| `supplies` | `/supplies` | `supplies` |
| `rentals` | `/rentals` | `rentals` |
| `finance` | `/finance` | `finance` |
| `facility` | `/facility-care` | `facilityCare` |
| `plus` | `/plus` | `localProPlus` |
| `jobs` | `/jobs` | `jobBoard` |
| `referrals` | `/referrals` | `referrals` |

## Common Patterns

### Get Package Info

```typescript
import { PACKAGE_REGISTRY, getPackageEntry } from "@/shared/config/package-registry";

const packageInfo = getPackageEntry(preferredFeature);
// Returns: { id, label, route, featureId, appSettingsKey } | null
```

### Navigate to Preferred Feature

```typescript
import { useRouter } from "next/navigation";
import { PACKAGE_REGISTRY } from "@/shared/config/package-registry";

const router = useRouter();
const { preferredFeature } = usePreferredFeature();

if (preferredFeature) {
  router.push(PACKAGE_REGISTRY[preferredFeature].route);
}
```

### Check if Feature is Enabled

```typescript
import { useAppSettings } from "@/hooks/useAppSettings";

const { settings: appSettings } = useAppSettings();
const isEnabled = appSettings?.features?.marketplace !== false;
```

## Storage

- **Key**: `localStorage["localpro_preferred_feature"]`
- **Event**: `localpro:package-switcher:changed` (same-tab)
- **Cross-tab**: `storage` event (automatic)

## Components

- **GlobalHeader**: Icon button opens modal
- **PreferredFeatureSelector**: Full-page selector
- **PreferredFeatureModal**: Modal dialog
- **PreferredFeaturePrompt**: Auto-prompt on feature routes

## Auto-Redirect

Users are automatically redirected to their preferred feature when:
- Visiting `/` or `/dashboard`
- Has a preferred feature set
- Only redirects once per session

## Files

- **Context**: `src/contexts/package-switcher-context.tsx`
- **Hook**: `src/shared/hooks/usePreferredFeature.ts`
- **Backend Sync**: `src/lib/session-preferences.ts`
- **Registry**: `src/shared/config/package-registry.ts`

## See Also

- [Full Documentation](./FEATURE_SWITCHER_IMPLEMENTATION.md)
- [Role View Usage](./ROLE_VIEW_USAGE.md)

