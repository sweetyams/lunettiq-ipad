## Method Card: Verify Data Is Real Before Building Its View

**Type:** workflow
**Confidence:** high
**Scope:** project-wide

### Trigger
When building a visualization, dashboard, or rich UI over a dataset — especially data derived/parsed/synced from another source.

### Observed User Move
During the Method Cards redesign, before any visual work, surfaced that the data was wrong (0 cards graduated, 70/88 showed 0 evidence) and insisted on fixing the sync/parse layer first: "the UI is showing broken data; nothing else matters until this is real."

### Underlying Principle
A polished view over incorrect data is worse than no view — it manufactures false confidence and hides the real problem behind aesthetics. Verify the underlying data is accurate before investing in how it's displayed.

### Applies When
- The data is parsed or derived (markdown → DB, scrape, ETL, aggregation)
- Counts, statuses, or relationships will drive UI states and decisions
- About to build charts, funnels, badges, or any data-bound visual

### Reasoning
Visualization amplifies whatever it's fed. If the parser misses 80% of evidence or never reads the graduation table, the funnel and badges confidently display zeros and the bug looks like a product state ("nothing graduated yet") rather than a data defect. Fixing data first means every downstream visual is trustworthy by construction.

### Future Agent Behaviour
Before building a data view, spot-check the data against the source: do counts match, do known records appear, are derived fields populated? Fix the data layer (parser, sync, query) before the presentation layer. Treat "0 of everything" or suspiciously uniform values as a parser smell, not a real state.

### Counterbalance
Don't block all UI work on perfect data — sometimes a rough view is exactly what reveals the data problem. The point is to verify *before trusting/shipping*, not to forbid exploratory rendering.

### Risk If Overused
Endless data-cleaning before any UI exists, when a quick view would have surfaced the issues faster.

### Trigger Questions
- Where does this data come from, and could the parse/sync be lossy?
- Do the aggregate numbers match a manual count of the source?
- Does "empty/zero" mean a real state or a missing field?

### Evidence
2026-05-30-method-steering-visual-platform: fixed evidence-date counting (18→86 cards with evidence) and README graduation parsing (0→4 graduated) before building lifecycle spine and type-distinct cards.

2026-06-01-cake-pricing-source-of-truth: pricing matrix showed $0.00 for all sizes because it read from `cake_pricing_grid.price` (deprecated column, always 0) instead of Shopify variant prices. Added fallback chain to backfill real prices on load.

### Do Not Overapply
Exploratory/throwaway views whose purpose is to expose data problems.

### Related Patterns
- [Audit Before Fix](./audit-before-fix.md) — measure the real state before acting
- [Foundation Before Features](./foundation-before-features.md) — correctness underneath before surface above

### Evidence Log
| Date | Session | Reinforced/Contradicted | Notes |
|---|---|---|---|
| 2026-05-30 | method-steering-visual-platform | Reinforced | Original — fixed evidence counting (18→86) and graduation parsing (0→4) before building lifecycle UI |
| 2026-06-01 | cake-pricing-source-of-truth | Reinforced | Pricing matrix showed $0.00 for all sizes — read from deprecated column (always 0) instead of Shopify variant prices |
| 2026-06-05 | planning-analytics-data-resolution-failure | **Severely reinforced** | Built 2,000+ lines of analytics/forecasting code on `sale_events` without checking that the resolution pipeline (`resolveInventoryItem`) actually produced matches for real tenant data. 11,046 orders → 7 sale_events. Granularity misconfigured (variant instead of color). Tests all passed because they mocked the resolver. A 5-minute diagnostic query would have caught it. |
| 2026-06-05 | sales-resolution-capture-first-relate-second | Reinforced | When fixing the resolution failure, each intermediate fix (name-parsing regex, per-row resolveInventoryItem) was validated against real data before proceeding. Led to discovering Square variation IDs ≠ catalog item IDs — a gap only visible through actual data probing. |

### Decay / Review
Stable.
| 2026-06-05 | inventory-count-verification-and-silent-data-loss | Reinforced | Count sessions committed "successfully" through the UI, but verification against the exported CSVs revealed 13 qty mismatches, 86 lifecycle failures, and 13 items that were created but never made it to the DB. The export (which came from the system itself) was the ground truth that exposed the write-path bugs. |
| 2026-06-08 | per-family-colour-merge | Reinforced | Preview showed 0 inventory for colour with 47 units. Queried `inventoryLevels` by `familyId+colour` (legacy path) instead of `member.itemId→levels.itemId` (real path). Schema supports both columns but only itemId has populated data. User caught it immediately because they knew the ground truth. |
| 2026-06-09 | identity-format-propagation-failure | Reinforced | Allergens saved in admin but invisible on storefront. `curl /api/storefront/products?scope=menu` returned `allergens: ['Dairy']` (missing 'Egg'). The diagnostic query revealed the config row existed but was keyed with a UUID-based GID that no reader would ever look up. Ground truth (storefront API output) exposed the write-path bug instantly. |

### Graduation
Graduated to steering `#82-working-method-digest` pattern #2 (2026-06-09). Card retained for full evidence history.
| 2026-06-21 | storefront-component-registry | **Severely reinforced** | Agent assumed color schemes didn't exist because no seed script was found (code grep). Went through 3 implementation iterations (color-scheme → select → color-scheme) before user forced a DB check. `SELECT value FROM settings WHERE key = 'designColorSchemes'` instantly confirmed both `callout-dark` and `callout-light` existed with correct token mappings. Then CSS output query (`/api/design/css`) revealed `var(--)` (invalid, from empty string in old save). One query at each step would have eliminated all wasted iterations. |
### Related Patterns
- [Trace Before Fixing](../reasoning/trace-before-fixing.md) — the reasoning discipline: trace root cause before acting
- [Fixing Display Before Tracing Data](../anti-pattern/fixing-display-before-tracing-data.md) — what happens when you skip verification
- [Mutating Data to Fix Display](../anti-pattern/mutating-data-to-fix-display.md) — what happens when you "fix" the wrong layer
