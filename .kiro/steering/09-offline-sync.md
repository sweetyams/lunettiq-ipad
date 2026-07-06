---
inclusion: manual
---
# Offline Sync — WatermelonDB

Reference: "use #09-offline-sync"

## Architecture

```
Online:  TanStack Query → Foundry API → render
Offline: WatermelonDB (SQLite) → render + queue writes → sync on reconnect
```

WatermelonDB is the offline fallback, NOT the primary data source. When online, TanStack Query is authoritative.

## What's cached locally

### Always (small, refreshed daily)

- Full product catalogue (~200 frames, <5MB)
- Current staff profile + permissions
- Location metadata (hours, address, inventory snapshots)
- Tier configuration (credit multipliers, perks)

### Scoped (refreshed on access)

- Last 30 clients viewed by this SA (full profile + timeline + orders)
- Today's appointments + next 7 days
- Active sessions (open Second Sight intakes, custom designs in draft)
- Last 90 days of client photos (thumbnails only, referenced by URL)

### Purge rules

- Photos older than 7 days: remove from device (available via CDN when online)
- Client profiles not accessed in 30 days: drop from cache
- Product catalogue: full refresh every 24 hours

## Offline Write Queue

When offline, writes go to a local `sync_queue` table:

```typescript
interface QueuedWrite {
  id: string;             // local UUID
  operation: 'create' | 'update' | 'delete';
  entityType: string;     // 'session', 'photo', 'interaction', 'client'
  entityId: string;
  endpoint: string;       // Foundry API path
  method: 'POST' | 'PATCH' | 'DELETE';
  payload: object;        // full request body
  createdAt: number;      // timestamp
  attempts: number;
  lastAttemptAt: number | null;
  error: string | null;
}
```

### Drain rules

- On reconnect: drain queue in chronological order (FIFO)
- Retry failed writes 3 times with exponential backoff (1s, 4s, 16s)
- After 3 failures: mark as `failed`, surface in sync status UI
- Never reorder queue items — chronological integrity matters

### Write types

| Type | Queues offline? | Why |
|------|----------------|-----|
| Session create/update | ✅ Yes | SA-owned, no conflicts |
| Photo capture | ✅ Yes (upload queues separately) | Large payload, background |
| Second Sight intake | ✅ Yes | Photos + grade + notes |
| Client profile edits | ✅ Yes | Optimistic, newest-wins |
| Interaction timeline | ✅ Yes | Append-only |
| Appointment status | ✅ Yes | Simple state change |
| New client creation | ❌ Blocks | Requires server-side duplicate check |
| Credit adjustments | ❌ Blocks | Financial, requires live validation |
| Consent edits | ❌ Blocks | Regulatory, must be authoritative |

## Conflict Resolution

**Newest-wins with audit trail.**

If a client profile is edited on iPad offline at 10:00 and on web at 10:05:
- Web write wins (later timestamp)
- iPad's write is logged in Foundry's audit as "superseded"
- iPad shows a non-blocking notification: "Your edit to Marie's profile was superseded by a web edit"

**Exception:** Session objects always win. Sessions are SA-owned and context-specific — no other surface edits them concurrently.

## Sync Status UI

Top-right indicator (always visible):

| State | Display |
|-------|---------|
| Synced | Green dot |
| Pending writes | Yellow dot + count |
| Sync error | Red dot, tap for details |
| Offline > 2 hours | Amber banner: "Offline for 2+ hours — find WiFi to sync N pending changes" |

## Photo Upload (separate from write queue)

Photos upload via a background queue:
- On WiFi: immediately
- On cellular: queue, upload when WiFi available (configurable)
- Retry with exponential backoff on failure
- Local compressed copy (500px) available immediately for thumbnails
- Full resolution uploads to R2 via presigned URL from Foundry API

## Key Rules

1. **Never block UI for sync** — writes are optimistic, sync is background
2. **Never lose data** — offline writes persist across app restarts (SQLite)
3. **2-hour offline flag is advisory** — doesn't block work, just prompts connectivity
4. **Photos are the largest sync cost** — always compress, always background
5. **Session data is sacred** — never drop, never conflict-lose a session
