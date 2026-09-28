# Multi-project (multi-tenant) support

Plans for letting one Clerk login use the Lunettiq iPad app across multiple projects
(e.g. `lunettiq` + `lunettiq-demo`). Login-onward, mobile-JWT only. No API keys.

| File | Purpose |
|---|---|
| `00-shared-plan.md` | Shared source of truth: model, handshake, `my-projects` contract, ownership, sequencing, open questions (all resolved). Both teams read this. |
| `01-ipad-plan.md` | iPad execution plan — file-by-file steps + PR breakdown. |
| `02-foundry-agent-prompt.md` | Copy-paste prompt for the Foundry agent to build the platform side. |
| `03-foundry-handoff.md` | Foundry → iPad report-back: final endpoint contract, device-per-tenant model, PIN scoping, phases (F1–F5 / P1–P6). **Lock the client contract against this.** |
| `04-capability-gap.md` | Contract gap: `my-projects` has no module/capability field, so the iPad can't pre-filter tenants that aren't set up for the app. Client-side workaround shipped; proposes adding `capabilities`/`ipadEnabled`. |
| `05-founder-seed-request.md` | Seed request for the Foundry agent: give a founder (`willem@sweetyams.com`) multi-store access by adding `project_members` rows (Option A — no contract change). |
| `06-device-location-scope.md` | Device-bound location (iPad A = Montreal, iPad B = Toronto): full iPad-side plan + phasing. Location is a device property, not a user property. |
| `07-device-location-foundry-requirements.md` | Foundry asks for device-location: confirm the locations endpoint, standardise how location rides on writes, fix empty `my-projects.locationIds`, permission + device-registry decisions. **Answer before building Phase 2+.** |

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
- [x] iPad P1: runtime base URL + retire hardcoded slug
- [x] iPad P2: per-project DB isolation
- [x] iPad P3: discovery gate + select-project screen
- [x] iPad P4: PIN unlock scoped to the set tenant (401/423 handling)
- [x] iPad P5: change-store in More (unsynced-changes guard)
- [x] iPad P6: demo/staging indicator strip
- [ ] End-to-end: two-membership test on-device (needs Foundry deploy)

All iPad phases (P1–P6) are implemented and pass the verify gate. Remaining work is on the
Foundry side (deploy + real-HTTP proof), after which the two-membership flow can be tested
on a device.
