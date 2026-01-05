# 👾 Game Master

Gaming tournament organizer with elimination brackets and rankings. 100% client-side, no backend required. Perfect for gaming nights and home esports!

## Features

- **Two Tournament Modes**:
  - **Single Elimination**: Bracket tournament with automatic BYE handling
  - **Double Elimination**: Second chance through losers bracket
  - **Ladder**: Point-based or time-based ranking (speed runs!)

- **Participant Types**:
  - Individual players
  - Pairs (2 players)

- **Game Presets**: Mario Kart, Smash Bros, FIFA, Tetris, and 30+ more

- **Countdown Timer**: Built-in timer for speed run competitions

- **Export/Import**: Backup and restore your data in JSON format

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics 4 Measurement ID |

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
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 3. Post-Deployment

Submit sitemap to Google Search Console: `https://gamemaster.digital/sitemap.xml`

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
- All data is stored locally in your browser

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
- [ ] Test export/import backup
- [ ] Test restore from empty state
- [ ] Test ladder mode with point and time rankings
- [ ] Test bracket with 3, 5, 8 participants (BYE handling)
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
│           └── page.tsx  # Tournament detail
├── icon.tsx              # Dynamic PWA icon (Space Invader)
├── manifest.ts           # PWA manifest
├── sitemap.ts            # SEO sitemap
└── og-image.png/route.tsx # OpenGraph image

lib/
├── db.ts                 # IndexedDB operations
├── schemas.ts            # Zod schemas + types
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
├── CreateTournamentModal.tsx
├── TournamentCard.tsx
├── TournamentDraft.tsx
├── TournamentActive.tsx
├── TournamentCompleted.tsx
├── LadderView.tsx
├── BracketView.tsx
└── NowPlayingCard.tsx
```

## Troubleshooting

### BYEs not auto-advancing
- BYEs are auto-resolved at tournament start
- Check browser console for errors

## License

MIT
