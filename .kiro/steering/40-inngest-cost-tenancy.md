---
inclusion: manual
---
# Inngest Cost & Multi-Tenancy Standard

Reference: "use #40-inngest-cost-tenancy"

**Scope note.** Inngest functions live in the Foundry platform repo
(`/Users/yann/Development/Foundry/foundry/`), which is a hard no-touch directory
for the iPad agent (see `98-deploy-safety`). This file is *advisory*: it captures
the standard so recommendations stay consistent. Actual edits are made by the
Foundry agent / platform owner. The iPad app is a pure API consumer and never
defines Inngest functions.

---

## The one rule that decides everything

**Concurrency and throttling change *latency*. Only batching, debounce, and
rate-limiting change the *bill*.**

Inngest bills on run count + step count. A run that is blocked, sleeping, or
waiting does not count against a concurrency limit — concurrency only limits how
many steps execute at once. So tuning concurrency/priority/Key Queues fixes
noisy-neighbor delays but does **not** reduce spend. If the problem is "we're
getting killed on cost," the first question is always: *what is creating this
many runs and steps, and can we create fewer?*

| Lever | Reduces run/step count? | Fixes head-of-line blocking? | Notes |
|---|---|---|---|
| Concurrency (keyed) | No | Yes | Limits concurrent steps, not starts |
| Throttling | No | Partly | FIFO, enqueues excess starts for later |
| Priority | No | Yes | Reorders within a function |
| Key Queues | No | Yes (best) | Per-key fair scheduling |
| **Batching** | **Yes** | Indirectly | Many events → one run |
| **Debounce** | **Yes** | Indirectly | Collapses rapid duplicate triggers |
| **Rate limiting** | **Yes** | No | Skips excess events entirely |

## Plan-tier gates (verify before promising these)

- **Key Queues** (multi-tenant fair scheduling) — Enterprise-only, granted on
  request. Not a self-serve per-function toggle. Treat as a procurement
  dependency with a lead time, not a config change.
- **Priority** (`priority.run` CEL expression) — meaningful values are
  Enterprise; on lower tiers runs execute with no priority. Do not design a plan
  whose latency guarantees depend on priority unless the account is Enterprise.
- **Keyed concurrency, throttling, debounce, rate-limiting, batching** — available
  on standard paid tiers. These are the levers to reach for first.

Always confirm the current Foundry Inngest plan tier before recommending an
Enterprise-gated feature as "just turn it on."

## Multi-tenancy pattern

- **`projectSlug` is the canonical tenant key.** Use it as the concurrency key
  expression (`event.data.projectSlug`) so one store's bulk work is bounded
  independently of others.
- Avoid secondary keys (e.g. `shopifyProductId`) unless they guard a real
  correctness invariant (concurrent writes to the same entity). A high-cardinality
  secondary key multiplies contended key-groups and inflates concurrency-limit
  hits without buying isolation.
- Separate function *classes* by latency need:
  - **Latency-sensitive** (order webhooks, hot-leads) — must never sit behind bulk work.
  - **Bulk / backfill** (full resync, backfill windows, bulk sync) — long, fan-out heavy, tolerant of delay.

## Design checklist for any new or reviewed Inngest function

1. What triggers it, and how many runs does one real-world action create?
2. Is it fan-out? If so, can the fan-out be **batched** or run as a single
   run with internal iteration instead of N runs?
3. Can rapid repeated triggers be **debounced**?
4. Are excess/duplicate events safe to **rate-limit** (skip)?
5. Is it latency-sensitive or bulk? Set concurrency key = `projectSlug`.
6. Does it share a scope with a latency-sensitive function? If so, isolate.
7. Only after count is minimized: apply concurrency/priority for fairness.

## When advising on Foundry Inngest

Because the platform repo is off-limits, deliverables are: (a) the specific
config block changes in prose, (b) which plan tier each requires, (c) what to
measure before/after (run count, step count, concurrency-limit hits, webhook
delay p95). Never present a concurrency-only change as a cost fix.
