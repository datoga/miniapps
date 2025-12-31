# Contributing to Mini Apps

## 🎯 Golden Rule

**Use `apps/whitelabel-demo` as your reference implementation.** This app demonstrates all features and patterns used in this monorepo.

## 🚀 Creating a New Mini App

### Step 1: Copy the template

```bash
cp -r apps/whitelabel-demo apps/my-new-app
```

### Step 2: Update package.json

```json
{
  "name": "my-new-app",
  "scripts": {
    "dev": "next dev --turbo --port 3008"  // Use unique port
  }
}
```

### Step 3: Update translations

Edit `messages/en.json` and `messages/es.json` with your app's content.

### Step 4: Update metadata

In `app/[locale]/layout.tsx`, update:
- `title`
- `description`
- App name passed to `<AppShell>`

### Step 5: Create your icon

Replace `app/icon.svg` and `app/apple-icon.svg` with your app's icon.

### Step 6: Install and run

```bash
npm install
npm run dev --workspace=my-new-app
```

## 📋 Code Standards

### ✅ Do

- Use TypeScript strict mode
- Use `import type` for type-only imports
- Use `useTranslations()` for ALL user-facing text
- Use shared packages (`@miniapps/ui`, `@miniapps/i18n`, etc.)
- Use Tailwind CSS with `dark:` variants
- Access env vars with brackets: `process.env["VAR_NAME"]`

### ❌ Don't

- Hardcode strings in components
- Use `any` type
- Create duplicate components (check `@miniapps/ui` first)
- Use inline styles
- Skip i18n for "temporary" text

## 📦 Shared Packages

| Package | Purpose | Key Exports |
|---------|---------|-------------|
| `@miniapps/ui` | UI Components | `AppShell`, `Header`, `Footer`, `Button`, `ThemeToggle`, `LocaleSwitcher` |
| `@miniapps/i18n` | Internationalization | `locales`, `defaultLocale`, `mergeMessages` |
| `@miniapps/analytics` | Google Analytics | `trackEvent`, `trackAppView`, `GoogleAnalyticsScript` |
| `@miniapps/storage` | Browser Storage | `getJSON`, `setJSON`, `remove` |

## 🔧 Development Commands

```bash
# Run specific app
npm run dev --workspace=my-app

# Run all apps
npm run dev

# Lint all
npm run lint

# Type check all
npm run typecheck

# Format all
npm run format

# Build specific app
npm run build --workspace=my-app
```

## 🚢 Deployment

1. Push to GitHub (auto-deploys on push)
2. Or manual: `vercel --prod`

Set `NEXT_PUBLIC_GA_ID` in Vercel Environment Variables for analytics.

## 📁 File Structure Reference

```
apps/whitelabel-demo/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx      # Root layout with providers
│   │   ├── page.tsx        # Home page
│   │   ├── get-started/    # Additional pages
│   │   └── ...
│   ├── globals.css         # Global styles + Tailwind
│   ├── icon.svg            # Favicon
│   └── apple-icon.svg      # Apple touch icon
├── components/             # App-specific components
├── messages/
│   ├── en.json             # English translations
│   └── es.json             # Spanish translations
├── i18n/request.ts         # i18n config
├── proxy.ts                # Locale routing middleware
├── next.config.ts          # Next.js config
├── tailwind.config.js      # Tailwind config (extends shared)
├── tsconfig.json           # TypeScript config (extends shared)
└── package.json
```

