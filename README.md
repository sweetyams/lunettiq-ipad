# Lunettiq iPad App

In-store iPad app for Lunettiq sales associates. Expo (React Native), offline-first via WatermelonDB, consuming the Foundry platform API.

## What this is

A two-person device — SA and client look at the same screen during fittings, consultations, and trade-ins. Three modes:

| Mode | Purpose |
|------|---------|
| **Discovery** | Walk-in browsing, no identified client |
| **Session** | Identified client — split view with profile + catalogue |
| **Fitting** | In-appointment — photo capture, comparison, notes |

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Expo SDK 52, Expo Router |
| State (server) | TanStack Query |
| State (local) | Zustand |
| Offline DB | WatermelonDB (SQLite) |
| Auth | @clerk/clerk-expo (same org as Foundry web) |
| Camera | expo-camera (burst, auto-enhance) |
| Pencil | PencilKit native module (V2) |
| Styling | NativeWind (Tailwind for RN) |
| API | Foundry REST surface via Bearer token |

## Prerequisites

- Node.js 20+
- pnpm 9+
- Xcode 16+ (for iOS builds)
- Physical iPad Pro 12.9" (recommended) or Simulator
- Foundry dev server running (`cd ../foundry && pnpm dev`)
- Clerk account with Lunettiq org configured

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy env file
cp .env.example .env.local
# Fill in EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY and EXPO_PUBLIC_FOUNDRY_BASE_URL

# Start dev server (Expo Go)
pnpm dev

# Or with dev client (needed for WatermelonDB + camera)
pnpm prebuild
pnpm ios
```

## Project Structure

```
app/                          # Expo Router (file-based routing)
├── (auth)/                   # Login + biometric setup
├── (app)/                    # Main app (tabbed)
│   ├── home/                 # Today view + quick actions
│   ├── clients/              # Client list, profile, session
│   ├── products/             # Catalogue browser
│   ├── appointments/         # Calendar view
│   └── more/                 # Second Sight, Custom Designs, Settings
└── _layout.tsx               # Root providers

src/
├── api/                      # TanStack Query hooks + typed Foundry client
├── db/                       # WatermelonDB schema, models, sync engine
├── features/                 # Domain logic
│   ├── discovery/            # Walk-in mode
│   ├── session/              # Identified client mode
│   ├── fitting/              # Photo capture + comparison
│   ├── second-sight/         # Trade-in intake
│   ├── custom-design/        # Design capture + Pencil
│   └── privacy/              # Staff ↔ client-visible mode
├── camera/                   # Photo capture, burst, enhance, upload queue
├── pencil/                   # Apple Pencil annotation engine
├── sync/                     # Offline sync engine (WatermelonDB ↔ Foundry API)
└── ui/                       # Shared branded components
```

## API Surface

The app consumes Foundry's existing REST API:

```
Authorization: Bearer <clerk_token>
X-Found-Surface: tablet
```

Base URL: `https://lunettiq.bentspline.com` (prod) / `http://lunettiq.localhost:4000` (dev)

Key endpoints:
- `GET /api/admin/clients` — search, list
- `GET /api/admin/products` — catalogue browse
- `GET /api/admin/appointments` — today's calendar
- `POST /api/admin/interactions` — log timeline entries
- `POST /api/admin/second-sight` — trade-in intake
- `POST /api/admin/media/upload-url` — presigned R2 URLs for photos

## Kiro Agent

```bash
cd lunettiq-ipad
kiro-cli chat --agent ios-dev
```

Key commands:
- `"create feature {name}"` — phased buildflow
- `"use #10-foundry-api"` — API contract reference
- `"use #09-offline-sync"` — WatermelonDB patterns
- `"use #12-privacy-modes"` — staff vs client-visible rules
- `"use #14-debugging-triage"` — when things break

## Privacy Mode

One-tap toggle between staff and client-visible views. Client-visible hides: LTV, internal tags, dollar amounts, private notes, analytics. See `.kiro/steering/12-privacy-modes.md`.

## Offline Support

Core workflows work without internet. Writes queue locally, sync on reconnect. See `.kiro/steering/09-offline-sync.md`.

## Building

```bash
# Development build (TestFlight internal)
pnpm build:dev

# Preview build
pnpm build:preview

# Production
pnpm build:prod
```

## Phase Plan

| Phase | Scope | Timeline |
|-------|-------|----------|
| 1 | Shell + Auth + Clients | 2-3 weeks |
| 2 | Products + Sessions | 2-3 weeks |
| 3 | Fitting + Camera | 3-4 weeks |
| 4 | Second Sight + Custom Design | 2 weeks |
| 5 | Offline + Polish | 2-3 weeks |

## Related

- **Foundry** (`../foundry/`) — the platform API this app consumes
- **Previous/Lunettiq** (`../Previous/Lunettiq/`) — reference specs from the original CRM
- **iPad App Spec** — `../Previous/Lunettiq/data/lunettiq-ipad-app-spec.md` (the full 18-section spec)
