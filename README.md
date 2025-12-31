# Mini Apps Monorepo

A Turborepo-based monorepo template for building and deploying "1 mini app per day" projects to Vercel. Each app is a standalone Next.js application with shared packages for UI components, internationalization, analytics, and browser storage.

## Features

- **Turborepo + npm workspaces** - Fast, efficient monorepo management
- **Next.js 15 App Router** - Modern React framework with TypeScript
- **Internationalization (ES/EN)** - Full i18n support with `next-intl` and localized routing
- **Theme Support** - Light, dark, and system themes with `next-themes`
- **Google Analytics GA4** - Optional analytics integration
- **Browser Persistence** - IndexedDB and localStorage helpers
- **Shared UI Components** - Reusable components across all apps
- **Static/Client-only** - No API routes by default

## Requirements

- **Node.js**: `>=24.0.0` (v24.12.0 LTS recommended)

> ℹ️ **Note**: This template requires Node.js 24 or later. Install with `nvm install 24 && nvm use 24`.

## Getting Started

### Installation

```bash
npm install
```

### Development

Run all apps in development mode:

```bash
npm run dev
```

Run a specific app:

```bash
npm run dev --workspace=whitelabel-demo
npm run dev --workspace=day1-mentoring
```

### Build

Build all apps:

```bash
npm run build
```

Build a specific app:

```bash
npm run build --workspace=whitelabel-demo
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## Project Structure

```
├── apps/
│   ├── whitelabel-demo/     # Full example app with all features
│   ├── day1-mentoring/      # Placeholder app
│   ├── day2-verbs/          # Placeholder app
│   ├── day3-qr/             # Placeholder app
│   ├── day4-bilbo/          # Placeholder app
│   ├── day5-medlabs/        # Placeholder app
│   ├── day6-recordme/       # Placeholder app
│   └── day7-jobkanban/      # Placeholder app
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── i18n/                # Internationalization utilities
│   ├── analytics/           # Google Analytics helpers
│   ├── storage/             # Browser persistence (IndexedDB/localStorage)
│   ├── config/              # Shared Tailwind and PostCSS configs
│   ├── eslint-config/       # Shared ESLint configuration
│   └── typescript-config/   # Shared TypeScript configuration
├── turbo.json               # Turborepo configuration
└── package.json             # Root package.json with workspaces
```

## Internationalization (i18n)

This template uses `next-intl` for internationalization with localized routing.

### Supported Locales

- Spanish (`es`) - Default
- English (`en`)

### URL Structure

All apps use locale-prefixed URLs:

- `/es/` - Spanish version
- `/en/` - English version

### Message Files

Messages are stored in JSON files:

- **Common messages**: `packages/i18n/messages/common/{locale}.json`
- **App-specific messages**: `apps/{app}/messages/{locale}.json`

Common messages are automatically merged with app-specific messages.

### Adding Translations

1. Add the key to both locale files (`en.json` and `es.json`)
2. Use `useTranslations()` hook to access the messages:

```tsx
import { useTranslations } from "next-intl";

function MyComponent() {
  const t = useTranslations("namespace");
  return <h1>{t("key")}</h1>;
}
```

## Theming

Theme support is provided by `next-themes` with three options:

- **System** - Follows OS preference
- **Light** - Light theme
- **Dark** - Dark theme

The theme toggle is visible on every page in the header.

### Tailwind Configuration

Tailwind is configured with `darkMode: "class"` to support theme switching.

## Google Analytics (GA4)

To enable Google Analytics:

1. Copy `.env.example` to `.env.local` in your app directory
2. Set your GA4 Measurement ID:

```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Tracking Events

Use the `trackEvent` function from `@miniapps/analytics`:

```tsx
import { trackEvent } from "@miniapps/analytics";

// Track an event
trackEvent("button_click", { button_name: "signup" });
```

## Browser Storage

The `@miniapps/storage` package provides browser persistence helpers.

### IndexedDB (Recommended)

```tsx
import { getJSON, setJSON, remove } from "@miniapps/storage";

// Save data
await setJSON("user-preferences", { theme: "dark" });

// Load data
const prefs = await getJSON("user-preferences");

// Remove data
await remove("user-preferences");
```

### localStorage (Fallback)

```tsx
import { local } from "@miniapps/storage";

// Save data
local.setJSON("user-preferences", { theme: "dark" });

// Load data
const prefs = local.getJSON("user-preferences");

// Remove data
local.remove("user-preferences");
```

## Creating a New Mini App

1. **Copy an existing app**:

```bash
cp -r apps/whitelabel-demo apps/my-new-app
```

2. **Update `package.json`**:
   - Change the `name` field
   - Update the dev port if needed

3. **Update messages**:
   - Edit `messages/en.json` and `messages/es.json`
   - Update app-specific translations

4. **Update metadata**:
   - Edit `app/[locale]/layout.tsx` to update title and description

5. **Create your app icon**:
   - Replace `app/icon.svg` with your custom icon

6. **Install dependencies**:

```bash
npm install
```

7. **Run the app**:

```bash
npm run dev --workspace=my-new-app
```

## Vercel Deployment

Each app can be deployed as a separate Vercel project.

### Setup

1. Create a new Vercel project
2. Connect your GitHub repository
3. Set the **Root Directory** to `apps/<app-name>` (e.g., `apps/whitelabel-demo`)
4. Set environment variables if needed:
   - `NEXT_PUBLIC_GA_ID` - Google Analytics ID (optional)

### Build Settings

Vercel will automatically detect the Next.js app. The recommended settings are:

- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Deploy Multiple Apps

To deploy multiple apps from the same repository:

1. Create a separate Vercel project for each app
2. Set the **Root Directory** for each project to the specific app folder
3. Optionally configure different environment variables per project

## Shared Packages

### @miniapps/ui

Shared UI components:

- `ThemeProvider` - Theme context provider
- `ThemeToggle` - Theme switching component
- `LocaleSwitcher` - Language switching component
- `AppShell` - App layout with header and footer
- `Header` - App header component
- `Footer` - App footer with contact link and copyright
- `Button` - Reusable button component
- `cn` - Utility for merging Tailwind classes

### @miniapps/i18n

Internationalization utilities:

- `locales` - Array of supported locales
- `defaultLocale` - Default locale
- `mergeMessages` - Merge common and app messages
- `getLocalizedPathname` - Get pathname for a locale

### @miniapps/analytics

Analytics utilities:

- `trackEvent` - Track GA4 events
- `GoogleAnalyticsScript` - GA4 script component

### @miniapps/storage

Browser storage utilities:

- `getJSON`, `setJSON`, `remove` - IndexedDB operations
- `local.getJSON`, `local.setJSON`, `local.remove` - localStorage operations

## License

MIT
