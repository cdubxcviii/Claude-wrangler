# Wrangler

Catch it. Snap it. Brag about it. Wrangler is a fishing app for you and your friends: photograph a catch, let AI identify the species and estimate length and weight, earn points for size and local rarity, and climb the leaderboard.

Built with Expo (React Native), so one codebase runs in the browser now and becomes the iOS and Android app later.

## What's in this version (browser test)

- **Feed**: Instagram-style posts with stories for the last 24 hours, emoji reactions (double-tap for 🔥), comments and secret-spot locations.
- **Log a catch**: take or upload a photo. AI suggests the species, length and weight, with alternatives and a confidence score. Everything is editable. Edited catches get an "Edited" tag so friends know.
- **Location**: GPS (or the photo's own GPS data) when available, otherwise a manual editor with search, spot name and region.
- **Points**: size × local rarity, plus bonuses. See below.
- **Auto conditions log**: weather, barometric pressure trend, wind and moon phase are saved with every catch. Your profile's Insights tab shows the conditions you catch the most in.
- **Fishdex**: 43 species to collect, personal bests, and badges.
- **Friends**: friend requests, a friends list and people search. Brag-worthy catches can notify all your friends.
- **Leaderboard**: weekly, 30-day and all-time standings, a podium, and Catch of the Week. Tournaments and mini-games are teased as "coming soon".

In the browser test, your friends and their activity are simulated, and all data is stored in your browser only.

## Points

```
size points = 200 × (weight ÷ species trophy weight), clamped to 10–400
total       = size × rarity + 50 (first of a species) + 25 (personal best)
              then +10% if released
rarity      = Common ×1 · Uncommon ×1.5 · Rare ×2 · Epic ×3 · Legendary ×5
```

Rarity is per species per region (for example, a muskie is Rare in the Great Lakes and Legendary in Texas). The tables are in `src/lib/species.ts` and the formula in `src/lib/points.ts`.

## Fish AI

`src/lib/ai.ts` picks one of three back ends:

1. **Claude in the browser link**: when Wrangler is opened from its Claude artifact link, photos go to Claude on the viewer's own Claude account. No API key is needed.
2. **Wrangler AI server** (`server/`): a tiny Node server that calls the Anthropic API with your key. Use it for local development and the phone app.
3. **Demo**: made-up but plausible estimates, so the flow can be tested offline.

```bash
cd server && npm install
ANTHROPIC_API_KEY=sk-ant-... npm start                       # http://localhost:8787
EXPO_PUBLIC_WRANGLER_API_URL=http://localhost:8787 npm run web   # in another terminal
```

## Run it

```bash
npm install
npm run web          # browser at http://localhost:8081
npm start            # Expo dev server; scan the QR code with Expo Go
npm run build:web    # static export plus dist/wrangler.html, a single-file page
npm run typecheck && npm run lint
```

## Project layout

```
src/app/            screens (Expo Router): tabs, catch/new, catch/[id], user/[id], species/[id], friends, activity, settings
src/components/     UI: CatchCard, CatchForm, FishArt (SVG fish illustrations), StoryViewer, pickers, ui kit
src/lib/            store (state + persistence), points, species, regions, ai, location, conditions, selectors, seed data
server/             Wrangler AI server (Claude via the Anthropic API)
scripts/            make-artifact.mjs packs the web export into one HTML file
```

## Road to the phone app

- Real accounts, a shared feed, friends and leaderboards on a hosted backend (Supabase or Firebase), replacing the simulated friends in `src/lib/seed.ts` and `src/lib/store.tsx`.
- Push notifications for brag-worthy catches (`expo-notifications`).
- Builds and store submission with EAS (`npx eas-cli@latest build`).
- Tournaments, ranked seasons and point-spending mini-games.
