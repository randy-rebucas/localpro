## Role View (Active Role) — App-wide Standard

This app uses a single persisted "active role view" to control which UI a multi-role user sees.

- **Storage key**: `localStorage["roleView"]`
- **Sync mechanism**: `window` event `roleViewChanged` (same-tab) + `storage` event (cross-tab)
- **Canonical hook**: `src/shared/hooks/useRoleView.ts`
- **Convenience hook (auto-reads session roles)**: `src/shared/hooks/useActiveRoleView.ts`

### Where `useRoleView` / `useActiveRoleView` is currently applied

#### Navigation / Shell
- **`src/components/global-header.tsx`**
  - Owns the role switch UI (Client/Provider/Supplier/Instructor/Agency/Admin).
  - Uses `useRoleView` to keep the active role consistent and broadcast changes.

#### Dashboard (role-based home)
- **`src/app/(authenticated)/dashboard/@stats/page.tsx`**: role-aware overview cards
- **`src/app/(authenticated)/dashboard/@activity/page.tsx`**: role-aware “Recent activity / Next steps”
- **`src/app/(authenticated)/dashboard/@services/page.tsx`**: role-aware “Recommended modules”

#### Marketplace
- **`src/app/(authenticated)/marketplace/page.tsx`**: role-aware UI (e.g. provider actions)

#### Profile / Account
- **`src/features/auth/components/edit-profile-form.tsx`**: role-aware form sections
- **`src/features/auth/components/user-profile.tsx`**: role-aware profile sections

### Deprecated / Legacy (avoid using for new code)
- **`src/hooks/useRoleView.ts`**: deprecated wrapper; re-exports from shared hook.
- **`src/contexts/role-view-context.tsx`**: legacy context implementation (currently not used).
- **`src/components/edit-profile-form.tsx`** and **`src/components/user-profile.tsx`**
  - deprecated shims; re-export the canonical feature components.


