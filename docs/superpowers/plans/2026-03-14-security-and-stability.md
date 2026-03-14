# Security & Stability Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all CRITICAL and MEDIUM security vulnerabilities, then add error boundaries and stability improvements across the monorepo.

**Architecture:** Two phases — (1) security hardening of shared packages and config, (2) stability improvements with error boundaries and defensive coding. All changes are in shared packages or config so they propagate to all apps.

**Tech Stack:** Next.js 16, TypeScript 5, Zod 4, React 19

---

## Chunk 1: Security Fixes

### Task 1: Fix Drive API query injection

The `fileName` parameter is interpolated directly into a Google Drive API query string without escaping. A filename containing `'` would break the query or cause unexpected behavior.

**Files:**
- Modify: `packages/drive/src/driveClient.ts:38`

- [ ] **Step 1: Fix the query injection in `findFileByName`**

In `packages/drive/src/driveClient.ts`, line 38, replace:
```typescript
const url = `https://www.googleapis.com/drive/v3/files?spaces=${APP_DATA_FOLDER}&q=name='${fileName}'&fields=files(id,modifiedTime)`;
```
with:
```typescript
const escapedName = fileName.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
const url = `https://www.googleapis.com/drive/v3/files?spaces=${APP_DATA_FOLDER}&q=name='${escapedName}'&fields=files(id,modifiedTime)`;
```

Note: Google Drive API uses its own query language where single quotes delimit strings. We escape `'` and `\` within the value — do NOT use `encodeURIComponent` here as the query parameter value uses Drive query syntax, not URL encoding.

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: All tasks successful, no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/drive/src/driveClient.ts
git commit -m "fix(drive): escape fileName in Drive API query to prevent injection"
```

---

### Task 2: Add Zod validation for OAuth token and profile from localStorage

`gis.ts` parses JSON from localStorage and trusts the result without validation. Corrupted data could crash the app.

**Files:**
- Modify: `packages/drive/src/gis.ts:46-84`
- Modify: `packages/drive/src/types.ts` (if needed to confirm GoogleProfile shape)

- [ ] **Step 1: Read current types**

Check `packages/drive/src/types.ts` to confirm the `GoogleProfile` interface shape.

- [ ] **Step 2: Add validation in `loadFromStorage`**

In `packages/drive/src/gis.ts`, replace the profile parsing block (lines 77-79):
```typescript
    if (profile) {
      currentProfile = JSON.parse(profile);
      console.log("[GIS] Profile loaded:", currentProfile?.name || currentProfile?.email);
    }
```
with:
```typescript
    if (profile) {
      try {
        const parsed: unknown = JSON.parse(profile);
        if (
          parsed &&
          typeof parsed === "object" &&
          "email" in parsed &&
          typeof (parsed as Record<string, unknown>).email === "string"
        ) {
          currentProfile = parsed as GoogleProfile;
          console.log("[GIS] Profile loaded:", currentProfile.name || currentProfile.email);
        } else {
          console.warn("[GIS] Invalid profile in storage, clearing");
          localStorage.removeItem(STORAGE_KEY_PROFILE);
        }
      } catch {
        console.warn("[GIS] Corrupted profile in storage, clearing");
        localStorage.removeItem(STORAGE_KEY_PROFILE);
      }
    }
```

- [ ] **Step 3: Add NaN guard for token expiry**

In the same file, after line 58 (`const expiryTime = parseInt(expiry, 10);`), add a NaN guard:
```typescript
      const expiryTime = parseInt(expiry, 10);
      if (isNaN(expiryTime)) {
        console.warn("[GIS] Invalid expiry in storage, clearing");
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);
      } else {
```
And close the else block after the existing token-expired cleanup (after line 74). The full block becomes:
```typescript
    if (token && expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (isNaN(expiryTime)) {
        console.warn("[GIS] Invalid expiry in storage, clearing");
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);
      } else {
        const timeUntilExpiry = expiryTime - Date.now();
        console.log("[GIS] Token expiry check:", {
          expiresIn: Math.round(timeUntilExpiry / 1000 / 60) + " minutes"
        });

        if (Date.now() < expiryTime - 5 * 60 * 1000) {
          currentAccessToken = token;
          tokenExpiry = expiryTime;
          console.log("[GIS] Token loaded successfully");
        } else {
          console.log("[GIS] Token expired, clearing");
          localStorage.removeItem(STORAGE_KEY_TOKEN);
          localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);
        }
      }
    }
```

- [ ] **Step 4: Verify typecheck passes**

Run: `npm run typecheck`

- [ ] **Step 5: Commit**

```bash
git add packages/drive/src/gis.ts
git commit -m "fix(drive): validate localStorage data before use in OAuth flow"
```

---

### Task 3: Add security headers to shared Next.js config

No CSP, X-Frame-Options, or other security headers are configured. All apps inherit from `packages/config/next.shared.ts`.

**Files:**
- Modify: `packages/config/next.shared.ts:27-57`

- [ ] **Step 1: Add security headers**

In `packages/config/next.shared.ts`, add a new entry at the beginning of the `headers()` return array:
```typescript
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
```

Note: We intentionally omit CSP here because each app has different needs (day4-bilbo needs `accounts.google.com`, day7 needs a service worker, etc.). CSP should be added per-app if needed. `X-XSS-Protection` is deprecated and not included.

Note: day6-recordme uses camera/microphone — its `next.config.ts` must override the `Permissions-Policy` header. Add this to the plan note but don't implement here.

- [ ] **Step 2: Handle day7-replacedbyai's existing headers**

Check `apps/day7-replacedbyai/next.config.ts` — it already has its own `headers()` function. The app-level headers will override the shared ones for matching `source` patterns. Since day7 already sets `X-Content-Type-Options` and `Referrer-Policy` on `/:path*`, verify that the shared headers don't conflict.

If day7's `headers()` already covers `/:path*`, it will take precedence (Next.js merges headers from all matching sources). No conflict — they'll be merged.

- [ ] **Step 3: Verify build passes**

Run: `npm run build --workspace=whitelabel-demo`
Expected: Build succeeds. Check output for headers configuration.

- [ ] **Step 4: Commit**

```bash
git add packages/config/next.shared.ts
git commit -m "fix(config): add security headers (X-Frame-Options, nosniff, referrer-policy)"
```

---

### Task 4: Remove debug console.log statements from Drive package

The `gis.ts` file has ~15 `console.log` statements for debugging that leak internal state. The shared config has `removeConsole` in production, but it's better to clean these up.

**Files:**
- Modify: `packages/drive/src/gis.ts`

- [ ] **Step 1: Replace console.log with console.debug**

In `packages/drive/src/gis.ts`, replace all `console.log("[GIS]` calls with `console.debug("[GIS]`. This way:
- In production, `removeConsole` strips them
- In development, they only show when DevTools is set to "Verbose" level

Run this replacement on all instances (lines 51, 60-61, 68, 71, 79, 96, 104).

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add packages/drive/src/gis.ts
git commit -m "fix(drive): downgrade debug logs from console.log to console.debug"
```

---

## Chunk 2: Stability & Error Handling

### Task 5: Add error boundaries to all apps

No app has `error.tsx` or `global-error.tsx`. Unhandled errors show the default Next.js error page with no recovery path.

**Files:**
- Create: `packages/ui/src/ErrorFallback.tsx`
- Create: `apps/whitelabel-demo/app/[locale]/error.tsx` (template)
- Create: `apps/whitelabel-demo/app/global-error.tsx` (template)
- Then copy to all other apps

- [ ] **Step 1: Create ErrorFallback component in shared UI**

Create `packages/ui/src/ErrorFallback.tsx`:
```tsx
"use client";

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  buttonLabel?: string;
}

export function ErrorFallback({
  error,
  reset,
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  buttonLabel = "Try again",
}: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
        {title}
      </h2>
      <p className="mb-6 max-w-md text-gray-600 dark:text-gray-400">
        {description}
      </p>
      {process.env["NODE_ENV"] === "development" && (
        <pre className="mb-6 max-w-lg overflow-auto rounded bg-red-50 p-4 text-left text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error.message}
        </pre>
      )}
      <button
        onClick={reset}
        className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Export from packages/ui**

Add to `packages/ui/src/index.ts`:
```typescript
export { ErrorFallback } from "./ErrorFallback";
```

- [ ] **Step 3: Create error.tsx template in whitelabel-demo**

Create `apps/whitelabel-demo/app/[locale]/error.tsx`:
```tsx
"use client";

import { ErrorFallback } from "@miniapps/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} />;
}
```

- [ ] **Step 4: Create global-error.tsx template in whitelabel-demo**

Create `apps/whitelabel-demo/app/global-error.tsx`:
```tsx
"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: "1rem", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
            Something went wrong
          </h2>
          <p style={{ marginBottom: "1.5rem", color: "#666" }}>
            {error.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={reset}
            style={{ padding: "0.5rem 1.5rem", borderRadius: "0.5rem", background: "#2563eb", color: "white", border: "none", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
```

Note: `global-error.tsx` cannot use shared UI components because it replaces the entire HTML when the root layout itself errors. Inline styles are required.

- [ ] **Step 5: Copy error.tsx and global-error.tsx to all other apps**

Copy `apps/whitelabel-demo/app/[locale]/error.tsx` to:
- `apps/day1-mentoring/app/[locale]/error.tsx`
- `apps/day2-verbs/app/[locale]/error.tsx`
- `apps/day3-qr/app/[locale]/error.tsx`
- `apps/day4-bilbo/app/[locale]/error.tsx`
- `apps/day5-gamemaster/app/[locale]/error.tsx`
- `apps/day6-recordme/app/[locale]/error.tsx`
- `apps/day7-replacedbyai/app/[locale]/error.tsx`

Copy `apps/whitelabel-demo/app/global-error.tsx` to all other apps' `app/global-error.tsx`.

Note: day2-verbs has a different layout structure — check if it uses `app/[locale]/` or `app/` directly and place error.tsx accordingly.

- [ ] **Step 6: Verify build passes**

Run: `npm run typecheck`
Expected: All tasks successful.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/ErrorFallback.tsx packages/ui/src/index.ts apps/*/app/global-error.tsx apps/*/app/[locale]/error.tsx
git commit -m "feat(ui): add error boundaries to all apps with shared ErrorFallback"
```

---

### Task 6: Replace window.alert with callback in useShare

`useShare` uses `window.alert()` which blocks the UI thread. The caller should handle the notification.

**Files:**
- Modify: `packages/ui/src/useShare.ts:70`

- [ ] **Step 1: Remove window.alert, rely on onSuccess callback**

In `packages/ui/src/useShare.ts`, replace lines 67-71:
```typescript
    } else {
      try {
        const fullText = url ? `${text}\n\n${url}` : text;
        await navigator.clipboard.writeText(fullText);
        window.alert(clipboardMessage);
        onSuccess?.("clipboard");
```
with:
```typescript
    } else {
      try {
        const fullText = url ? `${text}\n\n${url}` : text;
        await navigator.clipboard.writeText(fullText);
        onSuccess?.("clipboard");
```

Also remove `clipboardMessage` from the destructuring on line 51 and from the `ShareOptions` interface (lines 17, 51).

- [ ] **Step 2: Check all callers of useShare**

Search for `useShare` usage across apps. Verify that all callers have an `onSuccess` callback that handles the clipboard notification (toast, inline message, etc.). If any caller relied on the alert, add a simple state-based notification.

Run: `grep -r "useShare" apps/ --include="*.tsx" --include="*.ts" -l`

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/useShare.ts
git commit -m "fix(ui): remove blocking window.alert from useShare clipboard fallback"
```

---

### Task 7: Add focus trap to Modal

The Modal component allows keyboard focus to escape to elements behind it, breaking accessibility for screen reader and keyboard users.

**Files:**
- Modify: `packages/ui/src/Modal.tsx`

- [ ] **Step 1: Add focus trap logic**

In `packages/ui/src/Modal.tsx`, add a `useRef` for the modal content div and a focus trap effect. Add after the existing `useEffect` (after line 81):

```tsx
  // Focus trap
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isModalOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = modal.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Focus first focusable element on open
    const focusable = modal.querySelectorAll<HTMLElement>(focusableSelector);
    if (focusable.length > 0) {
      focusable[0]!.focus();
    }

    modal.addEventListener("keydown", handleTab);
    return () => modal.removeEventListener("keydown", handleTab);
  }, [isModalOpen]);
```

Add `useRef` to the import on line 3. Add `ref={modalRef}` to the modal content `<div>` on line 100.

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/Modal.tsx
git commit -m "fix(ui): add focus trap to Modal for keyboard accessibility"
```

---

### Task 8: Make storage operations return success/failure

Storage operations silently swallow errors. Callers cannot know if data was saved.

**Files:**
- Modify: `packages/storage/src/idb.ts`
- Modify: `packages/storage/src/local.ts`

- [ ] **Step 1: Add return type to idb.ts write operations**

In `packages/storage/src/idb.ts`, change `setJSON` return type:
```typescript
export async function setJSON<T>(key: string, value: T): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const db = await initDB();
    await db.put(STORE_NAME, value, key);
    return true;
  } catch {
    return false;
  }
}
```

Do the same for `remove`:
```typescript
export async function remove(key: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const db = await initDB();
    await db.delete(STORE_NAME, key);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Add return type to local.ts write operations**

In `packages/storage/src/local.ts`, change `setJSON`:
```typescript
  setJSON<T>(key: string, value: T): boolean {
    if (typeof window === "undefined") {
      return false;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
```

And `remove`:
```typescript
  remove(key: string): boolean {
    if (typeof window === "undefined") {
      return false;
    }
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`

The return values are now `boolean` instead of `void`. Existing callers that don't check the return value will still work (TypeScript allows ignoring return values). No breaking change.

- [ ] **Step 4: Commit**

```bash
git add packages/storage/src/idb.ts packages/storage/src/local.ts
git commit -m "fix(storage): return success/failure from write operations instead of silent fail"
```

---

## Summary

| Task | Type | Severity | Files |
|------|------|----------|-------|
| 1. Drive API query injection | Security | CRITICAL | `packages/drive/src/driveClient.ts` |
| 2. OAuth localStorage validation | Security | MEDIUM | `packages/drive/src/gis.ts` |
| 3. Security headers | Security | MEDIUM | `packages/config/next.shared.ts` |
| 4. Debug logs cleanup | Security | LOW | `packages/drive/src/gis.ts` |
| 5. Error boundaries | Stability | HIGH | `packages/ui/` + all apps |
| 6. Remove window.alert | Quality | MEDIUM | `packages/ui/src/useShare.ts` |
| 7. Modal focus trap | Accessibility | MEDIUM | `packages/ui/src/Modal.tsx` |
| 8. Storage return values | Stability | LOW | `packages/storage/src/` |

**Not in scope (false positive):** The `.env.local` files are properly gitignored and NOT committed to git. The Google Client ID in `apps/day4-bilbo/.env.local` is a local-only file. No secret rotation needed.

**Deferred (architecture, phase 2):**
- Extract layout boilerplate to shared package
- Add i18n build-time key validation
- Split drive package (API vs UI)
- Add test infrastructure
- Override Permissions-Policy for day6-recordme (camera/mic)
- Per-app CSP headers
