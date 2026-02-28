# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Turborepo + npm workspaces monorepo — "one mini app per day". Each app is a standalone Next.js 16 (App Router) application deployed to Vercel. All apps are static/client-only (no API routes, no server-side state).

## Prerequisites

```bash
nvm use 24    # Required — .nvmrc specifies Node 24
```

## Common Commands

```bash
npm run dev                              # All apps
npm run dev --workspace=day1-mentoring   # Single app
npm run build                            # Build all
npm run build --workspace=day1-mentoring # Build one
npm run typecheck                        # Type check all
npm run lint                             # Lint all
npm run format                           # Prettier format all
npm run clean                            # Clean everything including node_modules
```

All apps use `next dev --turbo --port <port>`.

**WARNING:** This repo auto-deploys to production on push. Never commit or push without explicit user request.

## Stack

- **Framework:** Next.js 16 App Router, React 19, TypeScript 5 (strict)
- **Styling:** Tailwind CSS 3 with `darkMode: "class"`, Geist font
- **i18n:** `next-intl` 4 — locales `es` (default) and `en`, locale-prefixed URLs
- **Theming:** `next-themes` — light/dark/system
- **Validation:** Zod — schema-first, infer types with `z.infer<typeof Schema>`
- **Storage:** IndexedDB (via `idb`) + localStorage through `@miniapps/storage`
- **Linting:** ESLint 9 flat config + Prettier
- **Monorepo:** Turborepo 2, npm 11

## Repository Structure

```
apps/
  whitelabel-demo/       # Reference template — copy for new apps (port 3000)
  day1-mentoring/        # Mentoring Tracker (3001)
  day2-verbs/            # VerbMaster (3002), pkg: verbmaster
  day3-qr/              # QR Library (3003)
  day4-bilbo/           # BilboTracker (3004), pkg: bilbotracker, has Google Drive sync
  day5-gamemaster/      # GameMaster (3005), pkg: tournament-manager
  day6-recordme/        # RecordMe (3006)
  day7-replacedbyai/    # Will AI Replace? (3007), has content pipeline + service worker

packages/
  ui/          # @miniapps/ui — shared React components (source TS, no build step)
  i18n/        # @miniapps/i18n — locale config, common messages, navigation helpers
  analytics/   # @miniapps/analytics — GA4 helpers
  storage/     # @miniapps/storage — IndexedDB + localStorage wrappers
  seo/         # @miniapps/seo — metadata, JSON-LD, sitemap, OG image
  drive/       # @miniapps/drive — Google Drive sync (day4-bilbo only)
  config/      # @miniapps/config — shared Tailwind, PostCSS, Next.js configs
  eslint-config/       # @miniapps/eslint-config — ESLint flat configs
  typescript-config/   # @miniapps/typescript-config — tsconfig presets
```

Note: some apps use a different package name than directory name (e.g., `day2-verbs` → `verbmaster`). Check `package.json` when using `--workspace`.

## Key Patterns

### i18n
All user-facing strings go in `messages/{locale}.json`. Common messages live in `packages/i18n/messages/common/`. Each app's `i18n/request.ts` merges common + app messages via `mergeMessages`. Use `useTranslations("namespace")` in components — never hardcode strings.

### Shared UI (`@miniapps/ui`)
Exports source TypeScript directly — apps transpile via `transpilePackages`. Always check here before creating new UI components. Key exports: `AppShell`, `Header`, `Footer`, `Button`, `Modal`, `ConfirmDialog`, `ThemeProvider`, `ThemeToggle`, `LocaleSwitcher`, `cn`.

### SEO
Every app layout uses `generateSEOMetadata`, `generateViewport`, and `generateJsonLd` from `@miniapps/seo`. Each app has `sitemap.ts`, `og-image.png/route.tsx` (edge runtime), `icon.tsx`, and `apple-icon.tsx`.

### PWA
Every app has `app/manifest.ts` with `start_url: "/?utm_source=pwa&utm_medium=installed"` for GA tracking, plus dynamic icons via `next/og` `ImageResponse`.

### App Configuration
Shared Next.js config from `@miniapps/config/next.shared` is extended in each app's `next.config.ts` with `withNextIntl`. Tailwind config extends `@miniapps/config/tailwind` with `primary` and `accent` color scales.

### TypeScript
- All apps extend `@miniapps/typescript-config/nextjs.json`
- Strict mode with `noUncheckedIndexedAccess`, `noImplicitReturns`, etc.
- Path alias `@/*` maps to app root
- Use `import type` for type-only imports (enforced by ESLint)
- Access env vars with bracket notation: `process.env["NEXT_PUBLIC_GA_ID"]`

## Deployment

Each app is its own Vercel project. The `vercel.json` runs `npm install` and `npm run build --workspace=<pkg-name>` from the repo root. The `--workspace` value must match the package name in `package.json`.

## New App Checklist

1. Copy `apps/whitelabel-demo` to `apps/my-new-app`
2. Update `package.json`: name and dev port (next available)
3. Update messages, layout metadata, manifest, icons, OG image, sitemap, robots.txt
4. Run `npm install` from repo root
5. Run `npm run dev --workspace=my-new-app`

## Agent Team Mode

When the user requests a feature or task that benefits from parallel work, use Agent Teams to orchestrate specialist teammates.

### Available Agents

| Agent | Role | When to Spawn |
|---|---|---|
| `sw-architect` | Architecture decisions, pattern review | Complex features, new packages, cross-app changes |
| `frontend` | UI implementation (React, Tailwind, i18n) | Any UI work |
| `backend` | Storage, service workers, data pipelines | Data layer, schemas, external APIs |
| `ux` | Accessibility, user flows, design review | New pages/flows, UI changes |
| `devops` | Build, deploy, monorepo config | New apps, build issues, config changes |
| `qa` | Typecheck, lint, build, i18n validation | After implementation is complete |
| `staff-engineer` | Final quality gate (approve/reject) | Always last, reviews all changes |

### Orchestration Rules

1. **Analyze the task** — decide which agents are needed (not every task needs all 7)
2. **Consult SW Architect first** if the task involves architecture decisions
3. **Create a task list** with clear dependencies before spawning teammates
4. **Spawn implementation agents** (frontend, backend, devops) in parallel with worktree isolation
5. **Spawn QA** after implementation completes — QA validates the output
6. **Spawn Staff Engineer last** — reviews everything, can approve or reject
7. **If rejected**, route feedback back to the relevant implementation agent for fixes, then re-review
8. **Report to the user** with a summary of what was built and any decisions made

### Task Sizing

- Each task should be self-contained: one agent, one concern
- Split by file ownership to avoid merge conflicts between parallel agents
- Frontend owns: components/, app/[locale]/ pages, messages/*.json
- Backend owns: lib/, storage schemas, service workers
- DevOps owns: config files, package.json, vercel.json, turbo.json

### Retrospective

After each feature is complete (Staff Engineer approved), run a retrospective:

1. **PO summarizes** what was built, how long the cycle took, and any issues encountered
2. **Each teammate reports:**
   - What went well
   - What blocked them or slowed them down
   - One improvement suggestion for the team process
3. **Team votes** on the top improvement to adopt (majority wins)
4. **PO records** the adopted improvement in `docs/retros/YYYY-MM-DD-<feature>.md` and updates the agent definitions or CLAUDE.md if the improvement changes a process

The retrospective is lightweight — each agent sends one message with their feedback, PO consolidates and proposes improvements, then broadcasts for a vote.
