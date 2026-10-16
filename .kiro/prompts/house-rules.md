---
name: house-rules
description: "Quick reference of all project conventions — the cheat sheet"
---

# Lunettiq iPad — House Rules

## Colors (NativeWind tokens only)
Values come from Foundry's live Lunettiq tokens (`tailwind.config.js` + `DesignTokenProvider`); see `.kiro/steering/02-design-system.md`.
- `bg-bg-page` / `bg-bg-surface` — page and card backgrounds (white, warm grey)
- `bg-accent` + `text-accent-text` — the primary action per screen (near-black)
- `bg-brand` / `text-brand` — Lunettiq blue, identity moments only, used sparingly
- `bg-bg-inverse` / `chrome-*` — dark staff chrome (splash, lock, sign-in panel, session bar)
- `text-text-primary` / `text-text-muted` — body and secondary text; `border-border` for dividers
- Never hex/rgb literals — always via className tokens
- No shadows — border-based depth only

## Typography
- Body minimum: 17pt (client may not have glasses)
- Client-visible mode: 20pt body
- Fonts: Helvetica Now Display (headings), Helvetica Neue (body)
- Scale: displayLg(34) > displayMd(28) > headline(22) > body(17) > caption(14)

## Components
- All use NativeWind `className` — no inline styles
- All interactive elements: 44pt × 44pt minimum touch target
- All handle 4 states: loading, error, empty, content
- Props interface above component, named `{Component}Props`
- No default exports (except Expo Router pages)

## State
- Server state: TanStack Query (never Zustand for API data)
- Local state: Zustand (never TanStack Query for app state)
- Offline: WatermelonDB (fallback only, not primary source)
- One store per domain: `useSessionStore`, `usePrivacyStore`, `useSyncStore`

## API
- All through Foundry — never call Shopify directly
- Always include `X-Found-Surface: tablet`
- Handle 401 → re-auth, 404 → module disabled, 403 → permission denied
- Offline: fall back to WatermelonDB cache

## Privacy Mode
- Staff mode (default): everything visible
- Client-visible: hide LTV, tags, notes, prices, inventory, return rates
- Use `usePrivacyStore` + `<StaffOnly>` wrapper
- Every mode switch logged via API

## Offline
- Never block UI for sync
- Writes queue locally, drain on reconnect (FIFO)
- Cap: 20 photos per session
- 2-hour offline banner is advisory, doesn't block

## Files
- Screens: `app/(app)/{tab}/{screen}.tsx`
- Features: `src/features/{domain}/`
- Hooks: `src/api/use{Name}.ts`
- Stores: `src/features/{domain}/use{Name}Store.ts`
- Tests: `{Name}.test.tsx` co-located

## Git
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`
- ≤50 char subject, imperative mood
- Run `pnpm verify` before commit (enforced by hook)
- Prefer `git add <specific files>` over `git add .`
- Never `git stash`, never `git reset --hard`

## Performance
- FlatList for lists > 20 items (never ScrollView + map)
- Search debounced 300ms
- Photos: 500px thumbnails for grids, full only on zoom
- Cold start < 1.5s, transitions < 300ms

## Accessibility
- VoiceOver: every interactive element labeled
- Color: never rely on color alone
- Contrast: 4.5:1 body, 7:1 in client-visible mode
- Dynamic Type: all text scales

## One-Accent Rule
Green appears ONLY on the single most important action per screen.
Everything else is navy or neutral.
