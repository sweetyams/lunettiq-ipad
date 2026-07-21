## Method Card: Registry Pattern Over Conditional Rendering

**Type:** architecture
**Confidence:** high
**Scope:** admin, architecture

### Trigger
When multiple modules need to contribute UI elements (columns, fields, panels, widgets) to a shared surface.

### Observed User Move
When asked whether to use inline `ModuleSlot` (simpler, hardcoded but conditionally rendered) or a registry pattern (modules register contributions), the user chose the registry without hesitation — three times in one session (fields, columns, panels).

### Underlying Principle
When the question is "which modules contribute what to this surface?", the answer should live in the modules, not in the surface. The surface should be a renderer of registered contributions, not a knower of all possible modules.

### Applies When
- A shared admin page needs to show different content based on enabled modules
- The set of contributors will grow over time (new modules = new contributions)
- The pattern already exists in the codebase (dashboard widgets, nav registry)

### Reasoning
Conditional rendering (`if module X enabled, show Y`) creates a god-page that knows about every module. Registries invert this: each module declares what it contributes, and the page renders whatever's registered. This scales to N modules without touching the page code.

### Future Agent Behaviour
When a page needs module-conditional content:
1. Check if a registry pattern already exists for this surface type
2. If not, create one following the dashboard widget registry pattern: `register()`, `getForProject(enabledModules)`
3. Modules register their contributions in their own barrel files (side-effect imports)
4. The page imports from the registry and renders dynamically

Do NOT propose inline `ModuleSlot` wrapping hardcoded content when the contributions will grow.

### Counterbalance
For 1-2 fixed contributions that will never grow, a simple `ModuleSlot` is fine. Registries add indirection. If the set of contributors is closed and small, the registry is over-engineering.

### Risk If Overused
Everything becomes a registry. Simple pages that show one module-gated section get a full registry infrastructure. The indirection makes the code harder to trace.

### Trigger Questions
- Will more modules contribute to this surface in the future?
- Does a similar registry already exist in the codebase?
- Is the set of contributors open (growing) or closed (fixed)?

### Evidence Log
| Date | Session | Reinforced/Contradicted | Notes |
|---|---|---|---|
| 2026-05-21 | client-crm-canvas-design | Original | User chose registry pattern for client fields, client columns, AND client panels — all in one session. Explicitly said "don't hardcode it, create a system around it." |

### Related Patterns
- [Ask "What Layer?" Not "What Folder?"](./decision-cards.md) — the layer question often leads to the registry answer
- [Architectural Completeness Over Speed](./taste-and-judgement.md) — registries are the "complete" solution; inline conditionals are the "fast" solution

### Do Not Overapply
When there are only 1-2 contributors and no expectation of growth. When the page is tenant-specific and won't be shared.

### Decay / Review
Stable. Review if the registry pattern creates maintenance burden (too many small registration files).
