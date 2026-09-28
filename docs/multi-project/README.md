# Multi-project (multi-tenant) support

Plans for letting one Clerk login use the Lunettiq iPad app across multiple projects
(e.g. `lunettiq` + `lunettiq-demo`). Login-onward, mobile-JWT only. No API keys.

| File | Purpose |
|---|---|
| `00-shared-plan.md` | Shared source of truth: model, handshake, `my-projects` contract, ownership, sequencing, open questions (all resolved). Both teams read this. |
| `01-ipad-plan.md` | iPad execution plan — file-by-file steps + PR breakdown. |
| `02-foundry-agent-prompt.md` | Copy-paste prompt for the Foundry agent to build the platform side. |
| `03-foundry-handoff.md` | Foundry → iPad report-back: final endpoint contract, device-per-tenant model, PIN scoping, phases (F1–F5 / P1–P6). **Lock the client contract against this.** |

## The short version

- **Identity** = Clerk user (one login, works everywhere).
- **Project** = resolved by host per request; gated by `project_members`.
- **The device is bound to ONE set tenant at a time** (changeable). Log in → Set Tenant →
  operate; PIN quick-switch and auto-lock are scoped to the set tenant.
- **The primitive** = `GET /api/account/my-projects` (NOT `/api/platform/*`) so the app can
  discover which projects a user belongs to and each project's authoritative host.

## Status

- [x] Plans written
- [x] Foundry: `my-projects` endpoint + demo seeding + shared-Clerk verification (built + DB-verified; **not yet deployed**)
- [ ] Foundry: deploy (`feat/my-projects-endpoint` → PR → merge) + real-HTTP curl proof
- [x] iPad: runtime base URL + retire hardcoded slug
- [x] iPad: per-project DB isolation
- [ ] iPad: select-project + switch-store UX + demo strip
