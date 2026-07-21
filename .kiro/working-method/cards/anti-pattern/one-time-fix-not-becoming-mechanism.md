## Method Card: One-Time Fix Scripts That Don't Become The Mechanism

**Type:** anti-pattern
**Confidence:** high
**Scope:** project-wide

### Trigger
When fixing data issues with scripts or SQL that won't handle the same data arriving tomorrow.

### Observed Failure
Built a regex-based SQL script to resolve Square sale_events by parsing order line item names into SKUs. It resolved 64% of historical data — but would break on every new order with a typo, abbreviation, or non-standard name. The user caught it immediately: "are we sure that we do this the right way and not in a manual way that fixes things that will break next time?"

### Underlying Principle
If data needs a fix, the fix mechanism should be the same code path that handles new data. A one-time script that fixes today's data but doesn't prevent tomorrow's breakage creates perpetual maintenance debt. The correct fix is structural: build the ongoing mechanism, then run it against historical data as a backfill.

### The Anti-Pattern
1. Data is broken/missing for historical records
2. Write a one-time SQL script or regex to fix it
3. It works for current data shapes
4. New data arrives with slightly different shapes
5. Same problem reappears → need another fix script
6. Accumulate scripts instead of a solution

### Why It Happens
- One-time scripts are fast to write and gratifying (immediate results)
- The ongoing mechanism requires more design (sync pipelines, mapping tables, cron jobs)
- Time pressure favors "fix it now" over "fix it structurally"
- The difference between "resolved" and "working" is invisible until new data arrives

### Correct Behaviour
1. Design the ongoing mechanism first (how will this work for the NEXT order?)
2. Build it
3. Run it against historical data as a backfill
4. The backfill IS the mechanism running in catch-up mode, not a separate script

### Evidence Log
| Date | Session | Reinforced/Contradicted | Notes |
|---|---|---|---|
| 2026-06-05 | initial-capture | Original | Built regex name-parsing SQL to resolve Square sales ("Frame Colour - type" → UPPER(FRAME-COLOUR) → inventory_items.sku). Got 64% resolution. But "Prescritpion" (typo), "tort" vs "tortoise", "BLACK... |
| 2026-06-05 | initial-capture | Reinforced | Colour normalization tool. User explicitly wanted a mechanism (vocabulary table + alias detection + autocomplete) not a one-time rename script — because "tort" variants will keep arriving via handl... |
| 2026-06-05 | initial-capture | Reinforced | | Square SKU resolution — regex scripts vs channel_variant_map mechanism |
| |
| 2026-06-05 | initial-capture | Reinforced | | Colour normalization — vocabulary table vs one-time rename |
| |
| 2026-06-17 | initial-capture | Reinforced | | Tax exempt variant price — set at creation time, never synced on price change. Fixed by adding sync to both push and webhook handlers (the ongoing mechanism) | |

### Related Patterns
- [Verify Data Before Building Its View](../decision/verify-data-before-building-its-view.md) — catch data problems early
- [Capture First, Relate Second](../decision/capture-first-relate-second.md) — decouple storage from resolution

### Risk If Overused
Sometimes a true one-time migration IS the right tool (schema changes, format migrations that won't recur). The anti-pattern applies when the data shape will recur (new orders, new products, new variants) — not when it's a genuine one-time historical cleanup.

### Decay / Review
Stable.

### Graduated
Graduated to `.kiro/steering/82-working-method-digest.wf.md` (entry 13) on 2026-06-25.

### Related Patterns
- [Enforce Prevention Alongside Fix](../decision/enforce-prevention-alongside-fix.md) — the positive pattern: fix + steering rule + lint
- [Layer Prevention by Specificity](../reasoning/layer-prevention-by-specificity.md) — how to design the prevention layers
- [Three-Layer Enforcement Ladder](../reasoning/three-layer-enforcement-ladder.md) — the expressible → computable → enforceable ladder
