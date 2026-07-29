# 2026-07-23 — Arrived Status Integration

## What Was Done

- Integrated Foundry's new `arrived` appointment status into the iPad app (9 files)
- Split `useCheckIn` into `useMarkArrived` (→ arrived) and `useStartAppointment` (→ in_progress)
- Added arrived status visuals: amber left-edge on card, amber badge, sort priority
- Updated Home screen, Appointments screen, WalkInButton, WatermelonDB model, offline fallback
- Fixed steering doc `#10-foundry-api`: PATCH→POST for transition endpoint, added full scheduling endpoint table
- Updated CHANGELOG

## Decisions Made

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Keep `useCheckIn` as deprecated alias | Prevents breakage in any code we missed; safe to remove next phase | Hard delete (risky), rename in-place (same) |
| Amber (`bg-warning`) for arrived badge/edge | Distinct from green (in_progress) and blue (brand). Amber = "waiting, needs attention." Matches STATUS_COLORS in Foundry admin. | Orange, different shade of green |
| `arrived` sorts between `in_progress` and `confirmed` | Arrived clients need prompt attention but active services take priority | Put arrived at top (too aggressive), leave with upcoming (loses visibility) |
| Walk-ins transition to `arrived` not `in_progress` | Walk-in means "client is here" not "service started." Aligns with new semantics. | Keep old behavior (skip arrived for walk-ins) |
| Two-step button flow on cards | Matches Foundry admin panel UX. SA sees "Arrived" → "Start" → "Start Session" | Single combined action (loses granularity Foundry now tracks) |

## Architecture / Design Notes

New state machine flow on iPad:

```
scheduled/confirmed → [Arrived btn] → arrived → [Start btn] → in_progress → [Start Session btn] → workspace
```

Component prop change:
```
AppointmentCard:
  - onCheckIn        → removed
  + onMarkArrived    → transitions to 'arrived'
  + onStartAppointment → transitions to 'in_progress'
  - onStartSession   → unchanged (navigates to session workspace)
```

Files touched:
| File | Change |
|---|---|
| `src/api/appointments.types.ts` | Added `'arrived'` to union |
| `src/api/useAppointments.ts` | New hooks + deprecated alias |
| `src/ui/AppointmentCard.tsx` | New props, styling, button logic |
| `src/features/appointments/AppointmentDetailPanel.tsx` | New props, status config, actions |
| `src/db/models/Appointment.model.ts` | Type + helper methods |
| `src/sync/useOfflineFallback.ts` | Computed properties |
| `app/(app)/home/index.tsx` | Hook wiring + sort |
| `app/(app)/appointments/index.tsx` | Hook wiring + sort + stats |
| `src/features/appointments/WalkInButton.tsx` | Migrated off deprecated hook |
| `src/api/index.ts` | Barrel exports |

## Findings

- **Foundry knowledge base is stale on scheduling types.** The indexed `scheduling/types.ts` still shows the old state machine without `arrived` or `in_progress`. The knowledge base should be refreshed after major Foundry changes.
- **The iPad had already anticipated `in_progress`** even though Foundry's old types didn't include it. Good foresight.
- **`POST /api/scheduling/{id}/notify`** exists in Foundry but has no iPad hook yet. Not urgent (admin panel covers it) but worth adding if iPad needs "Send directions" capability.
- **Steering doc #10 had PATCH for transition** but actual Foundry route is POST. The iPad code was already correct — only the doc was wrong.

## Open Questions

- Should the iPad show wait time (arrived_at → in_progress_at) on the appointment card? Foundry tracks it.
- Does Foundry return `arrivedAt` timestamp on the appointment object? If so, types need updating.
- Should `useCheckIn` deprecated alias be removed in the next release, or kept longer for safety?

## Next Steps

- Commit this work (10 modified files + CHANGELOG + steering doc)
- Refresh Foundry knowledge base to pick up new scheduling types
- Consider adding `useSendNotification` hook for `/api/scheduling/{id}/notify` (template picker)
- Phase 4–5 work: offline polish, Apple Pencil module, OTA update testing
