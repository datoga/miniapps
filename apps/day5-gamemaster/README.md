# 👾 Game Master

Gaming tournament organizer with elimination brackets and rankings. 100% client-side with optional Google Drive backup. Perfect for gaming nights and home esports!

## Features

- **Two Tournament Modes**:
  - **Single Elimination**: Bracket tournament with automatic BYE handling
  - **Ladder**: Point-based or time-based ranking (speed runs!)

- **Participant Types**:
  - Individual players
  - Pairs (2 players)
  - Teams (configurable size)

- **Game Presets**: Mario Kart, Smash Bros, FIFA, Tetris, and 30+ more

- **TV Mode**: Large typography, high contrast display designed for big screens

- **Countdown Timer**: Built-in timer for speed run competitions

- **Cloud Backup**: Optional Google Drive sync (appDataFolder - hidden from user)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No* | Google OAuth Client ID for Drive sync |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics 4 Measurement ID |

*Without `GOOGLE_CLIENT_ID`, the Drive sync option won't appear.

## Google Cloud Setup (for Drive Sync)

### 1. Create Project in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note the Project ID

### 2. Enable APIs

1. Go to **APIs & Services > Library**
2. Enable **Google Drive API**

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** (for users outside your organization)
3. Fill required fields:
   - **App name**: `Game Master`
   - **User support email**: your email
   - **Developer contact**: your email
4. Add scopes:
   - `../auth/drive.appdata` - Manage app-specific data
5. Add test users (while in Testing mode)

### 4. Create OAuth Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Select **Web application**
4. Add **Authorized JavaScript origins**:

| Environment | Origin |
|-------------|--------|
| Local dev | `http://localhost:3005` |
| Vercel | `https://gamemaster.digital` |
| Custom domain | `https://yourdomain.com` |

5. Copy the **Client ID**

## Vercel Deployment

### 1. Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import the monorepo from GitHub
3. Configure:
   - **Root Directory**: `apps/day5-gamemaster`
   - **Framework Preset**: Next.js
   - **Build Command**: (leave default)
   - **Output Directory**: (leave default)

### 2. Environment Variables

Add in Vercel Dashboard > Settings > Environment Variables:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 3. Post-Deployment

1. Add your Vercel domain to Google OAuth authorized origins
2. Submit sitemap to Google Search Console: `https://gamemaster.digital/sitemap.xml`

## Local Development

```bash
# From monorepo root
nvm use 24
npm install

# Run development server
npm run dev --workspace=tournament-manager
# App runs at http://localhost:3005

# Type check
npm run typecheck --workspace=tournament-manager

# Lint
npm run lint --workspace=tournament-manager

# Build
npm run build --workspace=tournament-manager
```

## Data Storage

- **Local**: IndexedDB (Dexie pattern with idb library)
- **Cloud**: Google Drive appDataFolder (hidden from user's Drive)
- **File**: `gamemaster.json`

## Sync Behavior

- **Pull**: Only when local database is empty AND Drive is connected
- **Push**: Debounced (3 seconds) after any database change
- **Conflict Resolution**: Last-write-wins (single device operation assumed)
- **Token**: In-memory only (never persisted)
- **Silent Reconnect**: Attempts background token refresh on load

## GA4 Events

Only 3 business events are tracked:

| Event | When | Parameters |
|-------|------|------------|
| `tournament_created` | New tournament created | `mode`, `participant_type` |
| `match_reported` | Match result submitted | `mode`, `tournament_id`, `round` (bracket only) |
| `first_value` | First meaningful action | (none) |

## Release Checklist

Before going live:

- [ ] Test offline functionality
- [ ] Test Drive connect/disconnect
- [ ] Test restore from empty state
- [ ] Test ladder mode with point and time rankings
- [ ] Test bracket with 3, 5, 8 participants (BYE handling)
- [ ] Test TV mode on secondary screen
- [ ] Verify PWA installability
- [ ] Verify theme toggle works
- [ ] Verify language switch works (EN/ES)
- [ ] Check GA events in DebugView (dev mode)

## Architecture

```
app/
├── [locale]/
│   ├── layout.tsx        # Root layout with providers
│   ├── page.tsx          # Landing page
│   ├── about/page.tsx    # About page
│   └── app/
│       ├── page.tsx      # Dashboard
│       └── t/[id]/
│           ├── page.tsx  # Tournament detail
│           └── tv/page.tsx # TV mode
├── icon.tsx              # Dynamic PWA icon (Space Invader)
├── manifest.ts           # PWA manifest
├── sitemap.ts            # SEO sitemap
└── og-image.png/route.tsx # OpenGraph image

lib/
├── db.ts                 # IndexedDB operations
├── schemas.ts            # Zod schemas + types
├── sync.ts               # Autosync manager (GIS + Drive)
├── ga.ts                 # GA4 tracking
├── games.ts              # Game presets catalog
└── domain/
    ├── tournaments.ts    # Tournament CRUD
    ├── participants.ts   # Participant CRUD
    ├── ladder.ts         # Ladder mode logic
    └── bracket.ts        # Single elim logic

components/
├── AppHeader.tsx
├── LandingPage.tsx
├── SyncProvider.tsx
├── SyncStatusIndicator.tsx
├── CreateTournamentModal.tsx
├── TournamentCard.tsx
├── TournamentDraft.tsx
├── TournamentActive.tsx
├── TournamentCompleted.tsx
├── TournamentTV.tsx
├── LadderView.tsx
├── BracketView.tsx
└── NowPlayingCard.tsx
```

## Troubleshooting

### "Google Client ID not configured"
- Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set
- Restart dev server after adding env vars

### "redirect_uri_mismatch"
- Add exact origin (with port) to Google OAuth authorized origins
- Wait 5 minutes after adding new origins

### "Access blocked"
- Add user to test users in Google Cloud Console
- Or publish the app for general access

### Drive sync shows "Needs reconnect"
- Token expired - click Reconnect to get new token
- This is expected behavior (tokens are not persisted)

### BYEs not auto-advancing
- BYEs are auto-resolved at tournament start
- Check browser console for errors

## License

MIT
