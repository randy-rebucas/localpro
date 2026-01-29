
# LocalPro AI Coding Agent Instructions

This guide provides essential, actionable knowledge for AI coding agents working on the LocalPro codebase. It is designed to maximize productivity and minimize risk by surfacing project-specific architecture, workflows, and conventions.

## Big Picture Architecture
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript-first, Tailwind CSS for styling.
- **Backend:** All business logic and data are handled by an external REST API (`https://localpro-super-app.onrender.com`). The frontend acts as a client, with no direct DB access.
- **API Integration:** All client/server components fetch data via REST endpoints. See `src/lib/api.ts` and `src/hooks/` for fetch/SWR patterns.
- **Authentication:**
	- Session cookie (encrypted JWT, see `src/lib/session.ts`) or `api-token` (JWT from external API).
	- Route-level auth and role checks in `src/middleware.ts` (see patterns for Bearer vs session, and role-based access).
- **Role-based Access:** Roles (admin, provider, supplier, instructor, etc.) are enforced in middleware and reflected in UI/feature docs.
- **Logging:** Use `src/lib/logger.ts` for all logs (never use `console.*`). Logger integrates with Sentry and supports structured logs.
- **Session Handling:** Use helpers from `src/lib/session.ts` for all session/cookie logic. Never hardcode cookie names.
- **Types:** All new data shapes/types go in `src/types/` (or referenced feature folders).

## Developer Workflows
- **Install:** `pnpm install`
- **Dev server:** `pnpm dev` (http://localhost:3000)
- **Build:** `pnpm build`
- **Start:** `pnpm start`
- **Lint:** `pnpm lint` (auto-fix: `pnpm lint:fix`)
- **Bundle analysis:** `pnpm analyze`
- **E2E tests:** Playwright (`pnpm test:e2e`, see scripts in `package.json`)
- **Environment:** Set secrets in `.env.local` (see `README.md` for required vars).

## Project Conventions & Patterns
- **API Calls:** Use fetch wrappers in `src/lib/api.ts` and SWR hooks in `src/hooks/`. Always use `createAuthFetchOptions` for authenticated requests.
- **SWR:** All server state is managed with SWR (see `src/lib/swr-config.ts`). Do not use TanStack Query.
- **Session/Cookie:** Use `createSessionCookie`, `createApiTokenCookie`, `clearAllSessionCookies` from `src/lib/session.ts`.
- **Logging:** Always use `logger.error/info/debug` from `src/lib/logger.ts`.
- **Image Hosts:** If adding remote images, update `next.config.ts` (`images.remotePatterns`).
- **Types:** Add/update types in `src/types/` (or feature-specific types). Many types are re-exported for backward compatibility.
- **Feature Docs:** Each feature has a `features/<feature>/README.md` and related docs (API, data, usage, best practices).
- **Marketplace UI:** Follows the layout in `features/PROVIDER_MARKETPLACE_LAYOUT.md` and `features/MARKETPLACE_FRONTEND_DOCUMENTATION.md`.
- **Error Handling:** Use try/catch and log errors with `logger.error`. Show user-friendly messages in UI.
- **Role/Route Checks:** Always check `src/middleware.ts` before changing route names or permission logic.

## Integration Points
- **External API:** All business data and actions go through the canonical API. Never add direct DB or file storage logic.
- **Sentry:** Error monitoring is configured in `next.config.ts` and `src/instrumentation.ts`.
- **Environment:** All config is centralized in `src/lib/env.ts`.

## When Editing Files
- Keep changes minimal and explain the reason in the PR description.
- Update `README.md` or relevant `features/*/README.md` if you add/modify API or developer-visible behavior.
- Run `pnpm lint` and ensure no TypeScript errors after edits.

## Examples & References
- **Auth logic:** `src/middleware.ts` (route/role checks)
- **Session crypto:** `src/lib/session.ts` (encryption, cookie helpers)
- **Logger:** `src/lib/logger.ts` (structured logging)
- **API fetch:** `src/lib/api.ts`, `src/hooks/`
- **Marketplace UI:** `features/PROVIDER_MARKETPLACE_LAYOUT.md`, `features/MARKETPLACE_FRONTEND_DOCUMENTATION.md`

## If Anything Is Unclear
- If you need context not in this file (e.g., environment variable values, CI/Sentry credentials, backend API contract changes), ask a human reviewer.

---
After making changes: ask the reviewer whether to add tests, update feature docs in `features/*/README.md`, or wire CI scripts.
