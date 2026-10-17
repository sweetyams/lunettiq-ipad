# Phase D11 — visual QA (2026-10-17)

Simulator: iPad Pro 13", landscape, `lunettiq-demo` (seed re-run 2026-10-17). Every screen below is on the Found UI kit: white pages, hairline sections, one near-black primary per view, status as badges/dots, no coloured edges or grey slabs. `pnpm audit:design` reports no drift (rules now also fail on native `Alert` and non-existent `color-*` classes).

| # | Screen | Shot | Notes |
|---|---|---|---|
| 1 | Floor | ![](01-floor.jpg) | Primary is now **Walk-in** (New client can't succeed until Foundry adds `POST /api/clients`); "Schedule" secondary. Rows open the appointment in Schedule. |
| 2 | Clients | ![](02-clients.jpg) | 12 clients: **4 "No name yet" shells**, 2 created today during a test visit → Foundry P0 #4. |
| 3 | Client profile · Clinical | ![](03-client-profile-clinical.jpg) | Only the client's own Rx (was 8 from the whole store). |
| 4 | New client | ![](04-new-client-duplicates.jpg) | Live duplicate panel. Create blocked by Foundry. |
| 5 | Frames | ![](05-frames.jpg) | Restored tab; "Frames for Olivier" during a visit. |
| 6 | Frame detail | ![](06-frame-detail.jpg) | Add to tray (primary), Order with lenses, Save to wishlist. |
| 7 | Order summary | ![](07-order-summary.jpg) | Frame only (demo has no lens flow); client's Rx with status. Orders now reach Foundry. |
| 8 | Orders | ![](08-orders.jpg) | |
| 9 | Follow-ups | ![](09-follow-ups.jpg) | |
| 10 | Review | ![](10-review.jpg) | Anomaly as a danger badge. |
| 11a | Visit workspace | ![](11a-visit-workspace.jpg) | Tray with reactions; Order on loved frames. |
| 11b | Handed to client | ![](11b-handed-to-client.jpg) | Client-facing; EN/FR switch added after this shot; exit is PIN-gated. |
| 12 | Profile | ![](12-profile.jpg) | One settings page; App language added after this shot. |
| 13a | Schedule | ![](13a-schedule.jpg) | List + inspector. |
| 13b | Week | ![](13b-week.jpg) | Local-day grouping. |
| 13c | Book appointment | ![](13c-book-appointment.jpg) | Real free times; client pre-filled from a profile. |

## Open items found in QA

- **Foundry:** create-client endpoint, shell customers, roster, holds filter, lens flow for the demo (see `03-foundry-agent-prompt.md`).
- **To check on a device:** handed-mode exit asks for the PIN; End visit sheet end to end; one real order and prescription created against the demo store.
- **i18n:** staff screens are still English (client-facing ones are bilingual).
- Parked side paths (Second Sight, Custom Design) still use the old look and native alerts; they are unlinked until V3/V4.
