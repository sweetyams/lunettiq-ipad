---
inclusion: always
---
# Project Charter — Lunettiq iPad App

## What this project is

The in-store iPad app for Lunettiq — a premium eyewear brand in Montreal. Used by sales associates (SAs) with clients during fittings, consultations, and Second Sight trade-ins. Built with Expo (React Native), offline-first via WatermelonDB, consuming Foundry's REST API surface.

**This app is a pure Foundry API consumer.** It never writes to Shopify directly. All mutations flow through Foundry's `/api/admin/` and `/api/storefront/` endpoints. The platform handles business logic, audit, permissions — the iPad handles the experience.

## Target Device

iPad Pro 12.9" (6th gen+), handheld in leather case. Landscape primary, portrait supported. Apple Pencil 2 optional (for custom design sketches).

## The 7 Principles

1. **Two-person device.** Every screen works for both SA and client looking together. Privacy mode is one tap away.
2. **Offline-first.** Core workflows work without internet. Writes queue locally, sync on reconnect.
3. **Photo is the document.** Fittings are visual. Capture what the client wore. Every session creates timeline entries.
4. **No keyboard required.** Primary flows are tap/swipe. Typing is the last resort.
5. **API-first.** All data flows through Foundry API. Never bypass, never duplicate business logic.
6. **Accessible.** Large type (17pt min body, 28pt+ headings), high contrast (client may not have glasses), VoiceOver support.
7. **Brand-grade.** Dark navy (#0A153D), deep green (#005D23), warm off-white (#F5F2EC). Editorial photography quality. No emoji. No cheap interactions.

## Tech Stack (locked)

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Expo SDK 52+ | Managed workflow, EAS Build, OTA updates |
| Routing | Expo Router (file-based) | Mirrors Next.js patterns, typed |
| State (server) | TanStack Query | Cache, dedup, background refresh |
| State (local) | Zustand | Simple, fast, no boilerplate |
| Offline DB | WatermelonDB (SQLite) | Proven RN offline sync, fast queries |
| Auth | @clerk/clerk-expo | Same org as Foundry, biometric unlock |
| Camera | expo-camera | Burst capture, auto-enhance |
| Pencil | PencilKit (native module) | Apple Pencil sketching for custom designs |
| Media upload | Presigned R2 URLs from Foundry | Background upload queue |
| Styling | NativeWind (Tailwind for RN) | Brand consistency, same mental model |
| Testing | Vitest + React Native Testing Library | Fast, familiar |
| Build | EAS Build + TestFlight | Internal distribution |

## Three Modes

| Mode | Purpose | Client sees iPad? |
|------|---------|-------------------|
| **Discovery** | Walk-in browsing, no identified client | Sometimes |
| **Session** | Identified client — split view with profile + catalogue | Yes (client-visible mode) |
| **Fitting** | In-appointment — photo capture, comparison, notes | Yes (photos of themselves) |

## API Surface (Foundry)

All calls include:
- `Authorization: Bearer <clerk_token>`
- `X-Found-Surface: tablet`
- `Content-Type: application/json`

Base URL: `https://lunettiq.bentspline.com` (production) / `http://lunettiq.localhost:4000` (dev)

## When you're uncertain

If a request violates a principle, **stop and surface the conflict**:
- Asked to call Shopify directly → violates principle 5 (API-first)
- Asked to skip offline support → violates principle 2
- Asked to show sensitive data without privacy check → violates principle 1
- Asked to build a keyboard-heavy flow → violates principle 4
- Asked to use small type → violates principle 6

Propose the principled approach and confirm before proceeding.
