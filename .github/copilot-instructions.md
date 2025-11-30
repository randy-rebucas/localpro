This file gives concise, repository-specific guidance to an AI coding assistant working on LocalPro.

Keep responses actionable and repository-aware. When creating or modifying code, prefer minimal, low-risk changes and mention which files you edited.

Quick facts
- Framework: Next.js 15 (app router), React 19, TypeScript.
- Package manager: pnpm (package.json uses pnpm). Use scripts from `package.json` (dev/build/start/lint/analyze).
- External API (canonical): https://localpro-super-app.onrender.com — many client fetches expect this; development may use http://localhost:5000.

Where to look first
- High-level docs: `README.md` (root) — describes modules and API endpoints.
- App entry/config: `next.config.ts` (CSP, image remotePatterns, Sentry integration).
- Runtime middleware & auth: `src/middleware.ts` (auth rules, route protection, bearer vs session tokens).
- Session handling: `src/lib/session.ts` (encrypt/decrypt sessions, session cookie helpers, in-memory session store).
- Logging: `src/lib/logger.ts` (structured logger with Sentry integration; used across server and client).

Architecture notes an AI should use
- The app is primarily a Next.js frontend that calls an external REST API. The repo contains client-side server components and edge-aware code; prefer editing server-side files in `src/app` and `src/lib` for infra and utilities.
- Authentication flow: either a session cookie (encrypted JWT from `src/lib/session.ts`) or an `api-token` (JWT issued by external API). `src/middleware.ts` implements route-level checks and differentiates routes that require Bearer tokens vs session cookies. Respect these checks when adding routes or API handlers.
- Role-based access: middleware enforces role-based rules (provider/admin/supplier/instructor). Check `middleware.ts` before changing route names or permission logic.

Developer workflows & commands (explicit)
- Install: `pnpm install`
- Dev server: `pnpm dev` (runs `next dev`, listens on :3000)
- Build: `pnpm build` (Next.js build)
- Start production server: `pnpm start`
- Lint: `pnpm lint` and auto-fix with `pnpm lint:fix`
- Bundle analysis: `pnpm analyze` (runs `node scripts/analyze-bundle.js`)

Code patterns & conventions
- Typescript-first: add/update types under `src/types` when introducing new data shapes.
- API calls: client code uses the external REST API; check `src/lib/*` and `src/hooks` for SWR hooks and standardized fetch wrappers.
- Sessions: use `src/lib/session.ts` helpers to create/clear cookies. Do not hardcode cookie names; use `createSessionCookie`, `createApiTokenCookie`, `clearAllSessionCookies`.
- Logging: use `import { logger } from '@/lib/logger'` and prefer `logger.error/info/debug` instead of console.* to keep consistent structured logs and Sentry integration.
- Images: `next.config.ts` restricts allowed image hosts. If adding image hosts, update `images.remotePatterns`.

Testing & safety
- There are no test scripts in package.json; when adding functionality, include minimal unit tests under the repo testing conventions and update `package.json` scripts if needed.
- Sentry: configured via `next.config.ts` and `src/instrumentation.ts`. When touching error handling, keep Sentry capture calls in mind.

When you edit files
- Keep changes minimal and explain the reason in the PR description.
- Update `README.md` or relevant feature `README.md` under `features/` when you add/modify API surface or developer-visible behavior.
- Run `pnpm lint` after edits and ensure no TypeScript errors.

Examples to reference in code reviews
- Auth logic: `src/middleware.ts` — shows bearer vs session handling and route patterns.
- Session crypto: `src/lib/session.ts` — encryption, cookie helpers, and in-memory session lifecycle.
- Logger: `src/lib/logger.ts` — preferred structured logging for server and client.

If anything in this file seems incomplete or you need repo-level context I couldn't infer, ask a human for: environment variable values (SESSION_SECRET), CI/Sentry credentials, and backend API contract changes.

After making changes: ask the reviewer whether to add tests, update feature docs in `features/*/README.md`, or wire CI scripts.
