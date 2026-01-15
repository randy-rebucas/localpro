
# Copilot Instructions for LocalPro

This guide enables AI coding agents to work productively in the LocalPro codebase. It covers architecture, workflows, conventions, and integration points unique to this project.

## Architecture Overview

- **Frameworks:** Next.js 15 (App Router), React 19, TypeScript-first.
- **Frontend:** Next.js app calling an external REST API (`https://localpro-super-app.onrender.com` for production, `http://localhost:5000` for development).
- **Server-side logic:** Use `src/app` and `src/lib` for infrastructure and utilities.
- **Authentication:** Session cookies (encrypted JWT via `src/lib/session.ts`) or `api-token` (JWT from external API). Route-level checks and role-based access in `src/middleware.ts`.
- **Roles:** Provider, admin, supplier, instructor. Route protection and permission logic are centralized in `src/middleware.ts`.

## Developer Workflows

- **Install dependencies:** `pnpm install`
- **Run dev server:** `pnpm dev` (Next.js on :3000)
- **Build:** `pnpm build`
- **Start production server:** `pnpm start`
- **Lint:** `pnpm lint` (auto-fix: `pnpm lint:fix`)
- **Bundle analysis:** `pnpm analyze` (see `scripts/analyze-bundle.js`)
- **No test scripts by default:** Add minimal unit tests under `src/` and update `package.json` if introducing new testable features.

## Key Conventions & Patterns

- **Types:** Define/update types in `src/types` for new data shapes.
- **API calls:** Use fetch wrappers and SWR hooks in `src/lib/*` and `src/hooks`.
- **Session management:** Use helpers from `src/lib/session.ts` for cookies. Never hardcode cookie names.
- **Logging:** Use `import { logger } from '@/lib/logger'` and prefer `logger.error/info/debug` for structured logs and Sentry integration.
- **Images:** Allowed hosts are restricted in `next.config.ts` (`images.remotePatterns`). Update this when adding new image sources.
- **Error handling:** Sentry is configured via `next.config.ts` and `src/instrumentation.ts`. Maintain Sentry capture calls when updating error logic.

## Integration Points

- **External API:** All client fetches expect the canonical API endpoint. Check `README.md` and `docs/API_ENDPOINTS_WITH_ROLES.md` for endpoint details.
- **Session & Auth:** See `src/lib/session.ts` and `src/middleware.ts` for encryption, cookie helpers, and route protection.
- **Logging:** Centralized in `src/lib/logger.ts` for both server and client.
- **Feature documentation:** Reference `features/*/README.md` for module-specific details.

## When Editing Files

- Keep changes minimal and explain the reason in PRs.
- Update `README.md` or relevant feature docs for API or developer-visible changes.
- Run `pnpm lint` after edits and ensure no TypeScript errors.

## Examples

- **Auth logic:** See `src/middleware.ts` for bearer vs session handling and route patterns.
- **Session crypto:** See `src/lib/session.ts` for encryption and cookie helpers.
- **Logger usage:** See `src/lib/logger.ts` for structured logging.


If any section is unclear or missing important details, please provide feedback for further iteration.
