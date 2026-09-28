# Multi-project (multi-tenant) support

Plans for letting one Clerk login use the Lunettiq iPad app across multiple projects
(e.g. `lunettiq` + `lunettiq-demo`). Login-onward, mobile-JWT only. No API keys.

| File | Purpose |
|---|---|
| `00-shared-plan.md` | Shared source of truth: model, handshake, `my-projects` contract, ownership, sequencing, open questions. Both teams read this. |
| `01-ipad-plan.md` | iPad execution plan — file-by-file steps + PR breakdown. |
| `02-foundry-agent-prompt.md` | Copy-paste prompt for the Foundry agent to build the platform side. |

## The short version

- **Identity** = Clerk user (one login, works everywhere).
- **Project** = resolved by host per request; gated by `project_members`.
- **Missing piece** = `GET /api/platform/my-projects` so the app can discover which projects
  a user belongs to and each project's authoritative host.

## Status

- [x] Plans written
- [ ] Foundry: `my-projects` endpoint + demo seeding + shared-Clerk verification
- [x] iPad: runtime base URL + retire hardcoded slug
- [x] iPad: per-project DB isolation
- [ ] iPad: select-project + switch-store UX + demo strip
