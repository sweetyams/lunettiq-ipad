## Method Card: Scope by Ownership, Not by Convenience

**Type:** architecture
**Confidence:** high
**Scope:** project-wide

### Trigger
When shared infrastructure (strings, settings, config) is being registered or categorized, and the question is "who owns this?"

### Observed User Move
After seeing Rhubarbe-specific strings (cake, catering, dietary) appearing on Jump's admin, the user rejected the "platform" catch-all scope. Forced a systematic re-scoping where every piece of shared data was assigned to its owning module — not the most convenient bucket.

### Underlying Principle
"Platform" is not a dumping ground. Shared infrastructure that is module-gated on the storefront must also be module-gated in the admin. If a feature only exists when a module is enabled, its configuration/text/settings belong to that module's scope — even if the code lives in a shared location.

### Applies When
- Registering strings, settings, or config that multiple tenants might use
- Deciding whether something is "platform" or "module" scoped
- Building admin UIs that show per-project configuration
- Any shared registry where items should be filtered by tenant capabilities

### Reasoning
Convenience scoping ("just put it in platform, everyone can see it") creates noise for tenants that don't have the feature. It also creates a false sense of universality — admins see options they can't use, which erodes trust in the admin UI. Module scoping ensures the admin surface matches the storefront surface.

### Future Agent Behaviour
When registering shared data (strings, settings, config):
1. Ask: "Does this only exist when module X is enabled?"
2. If yes → scope to that module, even if the code is in a shared file
3. If genuinely universal (every site needs it regardless of modules) → platform
4. Test: would a site with zero commerce modules need this? If no → not platform.

### Counterbalance
Over-scoping to modules can fragment things that are genuinely universal. "Loading…", "Close", "Back" are platform. Don't scope them to a module just because a module happens to use them. The test is: "would a site with NO optional modules still need this?"

### Risk If Overused
Every string gets its own module scope, creating dozens of tiny scopes that are hard to manage. Some strings genuinely serve multiple modules and platform is the correct home.

### Trigger Questions
- Would a site with zero optional modules need this?
- Does this only appear when a specific module is enabled?
- If I disable this module, should this string/setting disappear from the admin?

### Evidence
2026-05-22 storefront-string-registry: User caught Rhubarbe cake/catering/dietary strings appearing on Jump admin. Forced re-scoping of ~150 strings from "platform" to their owning modules.

### Do Not Overapply
When the item is genuinely universal (error pages, language switcher, form submit button). When a string is used by 3+ modules and no single module "owns" it.

### Decay / Review
Stable. Review if module boundaries change significantly or if a "shared" scope is introduced between platform and module.

### Evidence Log
| Date | Session | Reinforced/Contradicted | Notes |
|---|---|---|---|
| 2026-05-22 | storefront-string-registry | Original | User caught scope leakage, forced systematic re-scoping |
