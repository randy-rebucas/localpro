# E2E Test Setup Guide

> **Purpose**: Run and extend end-to-end tests for LocalPro Super App  
> **Framework**: Playwright

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure (Actual)](#project-structure-actual)
3. [Configuration](#configuration)
4. [Environment Variables](#environment-variables)
5. [Running Tests](#running-tests)
6. [Writing Tests](#writing-tests)
7. [CI/CD](#cicd)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# Install deps
pnpm install

# Install browsers (required on dev machines; CI uses --with-deps)
pnpm exec playwright install

# Copy env template (repo uses env.* files, not .env*)
cp env.e2e.example env.e2e

# Run E2E
pnpm test:e2e
```

---

## Project Structure (Actual)

```
localpro/
├── playwright.config.ts          # Playwright config (loads env.e2e; starts dev server for local baseURL)
├── env.e2e.example               # Tracked template for local E2E env
├── e2e/
│   ├── journeys/
│   │   ├── smoke.spec.ts         # Fast sanity check (home page renders)
│   │   └── client/
│   │       └── service-booking.spec.ts
│   ├── pages/                    # Page Objects (optional but recommended)
│   │   ├── auth.page.ts
│   │   ├── dashboard.page.ts
│   │   └── marketplace.page.ts
│   └── utils/
│       ├── api-helpers.ts
│       ├── helpers.ts
│       └── test-data-factory.ts
└── .github/workflows/e2e.yml     # CI E2E runner
```

---

## Configuration

### Playwright config location

Playwright reads the repo-root config:

- `playwright.config.ts`

Key behaviors:

- **`testDir`**: `e2e/journeys`
- **`baseURL`**: `E2E_BASE_URL` (defaults to `http://localhost:3000`)
- **Auto webServer**: only when baseURL is local (`localhost` / `127.0.0.1`), it runs `pnpm dev` and reuses existing server outside CI
- **Reports**: HTML, JSON, and JUnit

---

## Environment Variables

This repo ignores `.env*` in git, so E2E uses **tracked** `env.*` files.

### Local env file

1. Copy the template:

```bash
cp env.e2e.example env.e2e
```

2. Set values in `env.e2e` as needed.

### Common variables

- **`E2E_BASE_URL`**: where the app is running (local or deployed)
- **`E2E_CLIENT_PHONE` / `E2E_MOCK_SMS_CODE`**: only needed for auth-gated journeys (if your environment supports an SMS bypass/mock)

---

## Running Tests

Scripts already exist in `package.json`:

```bash
pnpm test:e2e          # all E2E tests
pnpm test:e2e:ui       # Playwright UI runner
pnpm test:e2e:headed   # run headed
pnpm test:e2e:debug    # debug mode
pnpm test:e2e:report   # open HTML report
pnpm test:e2e:client   # client journeys only
```

---

## Writing Tests

### Recommended selector strategy

The UI currently does **not** consistently expose `data-testid` attributes. Prefer Playwright’s resilient selectors:

- `page.getByRole(...)`
- `page.getByText(...)`
- `page.getByPlaceholder(...)`

If you want stricter and faster selectors over time, you can introduce `data-testid` in the app and migrate page objects to use them.

### Page Object Model (POM)

Page objects live in `e2e/pages/` (examples in this repo):

- `e2e/pages/auth.page.ts`
- `e2e/pages/marketplace.page.ts`

Keep these focused on **UI interactions**, not assertions.

### Example tests in this repo

- **Smoke**: `e2e/journeys/smoke.spec.ts`
- **Service booking (non-submitting)**: `e2e/journeys/client/service-booking.spec.ts`

---

## CI/CD

CI uses GitHub Actions: `.github/workflows/e2e.yml`.

To run against a deployed environment, set these repository secrets:

- `E2E_BASE_URL`
- (optional) `E2E_CLIENT_PHONE`
- (optional) `E2E_MOCK_SMS_CODE`

Artifacts:

- `playwright-report/` uploaded on every run (even on failure)

---

## Troubleshooting

### Browsers not installed

```bash
pnpm exec playwright install
```

### “No tests found”

- Ensure tests are under `e2e/journeys/`
- Ensure filenames end with `.spec.ts`

### Marketplace booking test is flaky / no services found

The booking journey depends on services being available from the API.

- If you’re offline or the backend is down, run only smoke:

```bash
pnpm test:e2e e2e/journeys/smoke.spec.ts
```

### Location autocomplete doesn’t suggest results

Autocomplete suggestions require a Google Maps API key (client-side). The booking journey **does not require** selecting a suggestion; it only needs the location text field to be non-empty.

