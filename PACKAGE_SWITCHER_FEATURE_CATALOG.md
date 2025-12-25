# Package Switcher Feature Catalog (Frontend)

This document defines:

- The **backend feature catalog** (feature → API base paths) for gating and documentation.
- The **frontend package switcher packages** (what users pick as their “active package” in UI), which maps to real routes + app-settings feature keys.
- Optional **subscription tiers** (Basic/Pro/Enterprise) if you want to bundle multiple features under plans.

## Admin visibility rule

- **Mode**: `show+lock`
- **Meaning**: Admin-only features should be **visible** in the switcher, but **disabled/locked** for non-admin users.

Recommended UI behavior:
- If `feature.adminOnly === true` and the current user is **not** an admin, show the feature with a lock indicator and disable interactions.
- If the user **is** an admin, show normally.

## Source of truth (backend API base paths)

These feature → API mappings are derived from how routes are mounted in `src/server.js` (the backend’s route registry).

## Frontend package switcher packages (source of truth)

The actual package switcher value is stored as `activePackage` and is typed as `AppPackage` in:

- `src/contexts/package-switcher-context.tsx`

The **canonical mapping** of `AppPackage` → route/labels/feature keys lives in:

- `src/shared/config/package-registry.ts`

These are the **complete** current package IDs and their routes:

| AppPackage id | Route | Notes |
| --- | --- | --- |
| `marketplace` | `/marketplace` | Core browsing + bookings |
| `academy` | `/academy` | Courses |
| `ads` | `/ads` | Advertising |
| `supplies` | `/supplies` | Supplies marketplace |
| `rentals` | `/rentals` | Rentals marketplace |
| `finance` | `/finance` | Finance tools |
| `facility` | `/facility-care` | Facility Care (feature key differs) |
| `plus` | `/plus` | LocalPro Plus (feature key differs) |
| `jobs` | `/jobs` | Job Board (feature key differs) |
| `referrals` | `/referrals` | Referrals |

### Mapping: AppPackage → backend feature id + app-settings featureKey

The backend “feature catalog” IDs below don’t always match the frontend `AppPackage` IDs (e.g. `facilityCare` vs `facility`, `localproPlus` vs `plus`).
Use this mapping when building a single switcher UI that also respects feature flags.

```json
{
  "packageToFeature": {
    "marketplace": { "featureId": "marketplace", "route": "/marketplace", "appSettingsKey": "marketplace" },
    "academy": { "featureId": "academy", "route": "/academy", "appSettingsKey": "academy" },
    "ads": { "featureId": "ads", "route": "/ads", "appSettingsKey": "ads" },
    "supplies": { "featureId": "supplies", "route": "/supplies", "appSettingsKey": "supplies" },
    "rentals": { "featureId": "rentals", "route": "/rentals", "appSettingsKey": "rentals" },
    "finance": { "featureId": "finance", "route": "/finance", "appSettingsKey": "finance" },
    "facility": { "featureId": "facilityCare", "route": "/facility-care", "appSettingsKey": "facilityCare" },
    "plus": { "featureId": "localproPlus", "route": "/plus", "appSettingsKey": "localProPlus" },
    "jobs": { "featureId": "jobs", "route": "/jobs", "appSettingsKey": "jobBoard" },
    "referrals": { "featureId": "referrals", "route": "/referrals", "appSettingsKey": "referrals" }
  }
}
```

## Feature catalog (by API route group)

Each feature has:
- `id`: stable identifier for frontend gating
- `label`: display name
- `apiBasePaths`: backend base paths owned by the feature
- `adminOnly` (optional): indicates the feature is intended for admin roles only

### Default subscription tiers (optional)

If your business wants different tier names (e.g. `Free, Plus, Pro, Enterprise`), keep the same feature IDs and only change `packages`.

- **Basic**: core access for onboarding + marketplace + notifications
- **Pro**: adds messaging + maps + search + referrals + jobs
- **Enterprise**: adds most modules + payments + escrows + admin/ops tooling

## Copy/paste JSON (frontend config)

```json
{
  "adminDisplay": "show+lock",
  "features": [
    { "id": "auth", "label": "Authentication & Onboarding", "apiBasePaths": ["/api/auth"] },
    { "id": "marketplace", "label": "Marketplace (Services & Bookings)", "apiBasePaths": ["/api/marketplace"] },
    { "id": "academy", "label": "Academy", "apiBasePaths": ["/api/academy"] },
    { "id": "supplies", "label": "Supplies", "apiBasePaths": ["/api/supplies"] },
    { "id": "finance", "label": "Finance", "apiBasePaths": ["/api/finance"] },
    { "id": "rentals", "label": "Rentals", "apiBasePaths": ["/api/rentals"] },
    { "id": "ads", "label": "Advertising", "apiBasePaths": ["/api/ads"] },
    { "id": "facilityCare", "label": "Facility Care", "apiBasePaths": ["/api/facility-care"] },
    { "id": "trustVerification", "label": "Trust & Verification", "apiBasePaths": ["/api/trust-verification"] },
    { "id": "communication", "label": "Messaging (Conversations)", "apiBasePaths": ["/api/communication"] },
    { "id": "notifications", "label": "Notifications (FCM + In-app)", "apiBasePaths": ["/api/notifications"] },
    { "id": "maps", "label": "Maps & Location Tools", "apiBasePaths": ["/api/maps"] },
    { "id": "search", "label": "Global Search", "apiBasePaths": ["/api/search"] },
    { "id": "jobs", "label": "Job Board", "apiBasePaths": ["/api/jobs", "/api/job-categories"] },
    { "id": "referrals", "label": "Referrals", "apiBasePaths": ["/api/referrals"] },
    { "id": "agencies", "label": "Agencies", "apiBasePaths": ["/api/agencies"] },
    { "id": "localproPlus", "label": "LocalPro Plus (Subscriptions)", "apiBasePaths": ["/api/localpro-plus"] },
    { "id": "payments", "label": "Payments (PayPal/PayMaya)", "apiBasePaths": ["/api/paypal", "/api/paymaya"] },
    { "id": "escrows", "label": "Escrows", "apiBasePaths": ["/api/escrows", "/webhooks"] },

    { "id": "adminUsers", "label": "Admin: User Management", "apiBasePaths": ["/api/users"], "adminOnly": true },
    { "id": "adminProviders", "label": "Admin: Providers", "apiBasePaths": ["/api/providers"], "adminOnly": true },
    { "id": "adminSettings", "label": "Admin: Settings", "apiBasePaths": ["/api/settings"], "adminOnly": true },
    { "id": "adminAnalytics", "label": "Admin: Analytics", "apiBasePaths": ["/api/analytics"], "adminOnly": true },
    { "id": "adminAuditLogs", "label": "Admin: Audit Logs", "apiBasePaths": ["/api/audit-logs"], "adminOnly": true },
    { "id": "adminLogs", "label": "Admin: Logs", "apiBasePaths": ["/api/logs"], "adminOnly": true },
    { "id": "adminMonitoring", "label": "Admin: Monitoring", "apiBasePaths": ["/api/monitoring", "/api/database/optimization"], "adminOnly": true }
  ],
  "packages": [
    {
      "id": "basic",
      "label": "Basic",
      "featureIds": ["auth", "marketplace", "notifications"]
    },
    {
      "id": "pro",
      "label": "Pro",
      "featureIds": ["auth", "marketplace", "notifications", "communication", "maps", "search", "referrals", "jobs"]
    },
    {
      "id": "enterprise",
      "label": "Enterprise",
      "featureIds": [
        "auth", "marketplace", "notifications", "communication", "maps", "search", "referrals", "jobs",
        "academy", "supplies", "finance", "rentals", "ads", "facilityCare", "trustVerification",
        "agencies", "localproPlus", "payments", "escrows",
        "adminUsers", "adminProviders", "adminSettings", "adminAnalytics", "adminAuditLogs", "adminLogs", "adminMonitoring"
      ]
    }
  ]
}
```

## Implementation notes (frontend)

- The “package switcher” (`activePackage`) is a **single selected package** (see the table above). It’s not the same thing as subscription “packages/tiers”.
- Use `packages[].featureIds` to render which features are included in each tier.
- Use `feature.adminOnly` + `adminDisplay` to decide whether to show locked features.
- If you also need runtime enforcement, have the backend return a `user.subscriptionTier` and `user.roles[]`, then gate UI routes/features accordingly.


