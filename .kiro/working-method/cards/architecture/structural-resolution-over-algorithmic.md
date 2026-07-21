## Method Card: Structural Resolution Over Algorithmic Resolution

**Type:** architecture
**Confidence:** high
**Scope:** project-wide

### Trigger
When building a mapping between two entity sets that will be queried frequently at runtime (e.g., "which inventory item does this channel variant belong to?").

### Observed User Move
Rejected the multi-table JOIN resolution chain (variant → product → canonical → family_member → item — 4 hops, any null breaks it). Rejected the regex name-parsing fallback ("why is the data wrong? do we need better support on our own product tables for variants?"). Pushed toward: a single lookup table that IS the relationship, maintained by sync pipelines.

### Underlying Principle
When a relationship is queried frequently, it should be materialized as data (a mapping table), not computed algorithmically (a JOIN chain or regex parser). The mapping table is the canonical truth about the relationship. Pipelines maintain it; consumers read it in one hop.

### Applies When
- Two entity sets have a many-to-one relationship that's queried on every transaction
- The resolution path involves 3+ JOIN hops through intermediate tables
- The resolution involves parsing/regex/fuzzy matching that can break on input variation
- The mapping changes slowly (at sync/import time) but is read constantly (at event time)

### Reasoning
Multi-hop JOINs are fragile (any null in the chain = failure), slow (N queries per event), and opaque (debugging requires understanding 4 tables). Regex parsing is fragile by nature — typos, abbreviations, format changes all break it silently. A materialized mapping table is: debuggable (SELECT * WHERE variant = X), fast (indexed lookup), explicit (you can see every mapping), and maintainable (sync pipelines upsert it).

### Future Agent Behaviour
When building resolution between channel entities and internal entities:
1. Design a mapping table as the canonical relationship
2. Populate it at sync time (webhook handlers, bulk sync scripts)
3. Consumers do one indexed lookup — no multi-hop JOINs
4. If a mapping doesn't exist, the consumer gets null (captured anyway per capture-first-relate-second)
5. Make the table inspectable in admin for debugging

### Counterbalance
Not every JOIN should be materialized. If the relationship is only queried in batch analytics (not per-transaction), or the intermediate tables ARE the correct canonical model, a JOIN is fine. Materialize when: high-frequency reads + fragile chain + slow-changing relationships.

### Risk If Overused
Mapping tables that duplicate relationships already well-expressed by FKs create sync drift problems — two sources of truth that can disagree. Only materialize when the source chain is genuinely fragile or multi-hop.

### Trigger Questions
- How many hops does the resolution currently take?
- Can any hop return null, breaking the chain?
- Is the resolution queried per-event (high frequency) or per-report (low frequency)?
- Does the mapping change at event time or at sync time?

### Evidence Log
| Date | Session | Reinforced/Contradicted | Notes |
|---|---|---|---|
| 2026-06-05 | sales-resolution | Original | session: Shopify resolution required 4-table JOIN (variant → shopify_variants → canonical_products → product_family_members → inventory_items). Square resolution required regex name parsing from or... |

### Related Patterns
- [Capture First, Relate Second](../decision/capture-first-relate-second.md) — the consumer side of this pattern
- [Internal Identity Over External Reference](../architecture/internal-identity-over-external-reference.md) — the map bridges external IDs to internal identity

### Do Not Overapply
Simple FK relationships (order → customer, item → location) that are already one hop and never null. Denormalization for its own sake.

### Decay / Review
Stable. Review if the channel_variant_map creates sync drift problems or if Drizzle/DB gains better materialized-view support.
