# Foundry-side agent prompt

Copy everything in the block below into the Foundry agent (the one that owns
`/Users/yann/Development/Foundry/foundry/`). It is self-contained.

---

```
You are working in the Foundry platform repo at /Users/yann/Development/Foundry/foundry/.

GOAL
Enable the Lunettiq iPad app to support multiple projects (tenants) per login — e.g. a staff
member whose Clerk account belongs to both `lunettiq` and `lunettiq-demo`. The iPad is a
login-onward, mobile-JWT caller. API keys are NOT part of this work.

The design is agreed and documented on the iPad side at:
  /Users/yann/Development/Foundry/lunettiq-ipad/docs/multi-project/00-shared-plan.md
Read it first. Your job is the Foundry half.

CONTEXT (already confirmed)
- The iPad authenticates with a Clerk mobile JWT: `Authorization: Bearer <token>`,
  `X-Found-Surface: tablet`.
- Project/tenant is resolved by host per request; access is gated by
  `project_members(projectId, userId)`.
- The iPad currently hardcodes one host and the slug `lunettiq`. It cannot discover which
  projects a user belongs to. That discovery endpoint is the core deliverable.

DELIVERABLES

1. New endpoint: GET /api/platform/my-projects
   - Auth: mobile-jwt only (reject cookie/api-key or return empty as appropriate — match
     existing platform-endpoint conventions in this repo).
   - Gate: membership only. It answers "which projects is THIS authenticated user a member
     of." Do NOT wrap it in requirePermission beyond resolving the Clerk user from the JWT.
   - Behaviour: resolve `clerkUserId` from the JWT `sub`, look up all `project_members` rows
     for that user, and for each return the project's authoritative host and the user's
     role/locations in that project.
   - Response shape (Foundry standard envelope { data, error, meta }):
     {
       "data": {
         "clerkUserId": "user_...",
         "projects": [
           {
             "slug": "lunettiq",
             "name": "Lunettiq",
             "baseUrl": "https://lunettiq.bentspline.com",
             "role": "optician",
             "locationIds": ["loc_..."],
             "primaryLocationId": "loc_...",
             "brandMark": "L",              // optional
             "env": "production"            // production | demo | staging
           }
         ]
       },
       "error": null,
       "meta": { "requestId": "..." }
     }
   - `baseUrl` MUST be the authoritative host Foundry maps to each project. The app never
     constructs hosts — it uses exactly what you return.
   - If the host mapping already lives somewhere (env, config table, tenant registry), reuse
     it; do not invent a second source of truth.

2. Cross-host reachability decision
   - Determine whether this endpoint can be served from a single platform bootstrap host that
     can see ALL of a user's memberships (preferred), or whether it must be called on a
     specific project host. Document the answer in a short note appended to the shared plan's
     "Open questions" section (question 2). The iPad needs one stable URL to call before it
     knows any project.

3. Seed the demo project
   - Ensure a `lunettiq-demo` project exists with its host mapped.
   - Add the target staff account(s) to `project_members` for `lunettiq-demo` with an
     appropriate role, so the two-membership case is testable.

4. Verify shared Clerk instance (HARD PREREQUISITE)
   - Confirm `lunettiq` and `lunettiq-demo` use the SAME Clerk instance (same publishable
     key / same user pool). If they do NOT, a single login cannot see both projects and the
     whole bootstrap approach must change — STOP and report this before building further.

5. (Optional) Distinct not-a-member error
   - When a valid JWT's user is not a member of the project for the requested host, return a
     distinct error code `NOT_A_MEMBER` (vs a 401 for expired/invalid auth) so the client can
     distinguish "wrong project" from "login expired."

CONSTRAINTS
- Follow this repo's existing patterns for platform endpoints, auth resolution (see
  src/proxy.ts and src/lib/platform/permissions.ts), and the standard response envelope.
- Do NOT introduce API-key auth for this path — mobile-jwt only.
- Do NOT change the iPad repo. If you find something the iPad must do, note it in a reply;
  the iPad work is already planned in 01-ipad-plan.md.
- Preserve audit attribution: this endpoint is read-only identity discovery; it should not
  mutate state.

VERIFICATION
- Add/adjust tests per repo conventions for the new endpoint: (a) user in 2 projects returns
  both with correct hosts/roles, (b) user in 1 project returns one, (c) user in 0 projects
  returns an empty list (not an error), (d) missing/invalid JWT is rejected.
- Run the repo's typecheck + test suite and report results.
- Manually verify with curl against the dev host, e.g.:
    curl -H "Authorization: Bearer <clerk_token>" \
         -H "X-Found-Surface: tablet" \
         http://lunettiq.localhost:4000/api/platform/my-projects

REPORT BACK
When done, reply with: the endpoint path + final response shape, the host-mapping source you
used, the answer to the bootstrap-host question, confirmation of the shared Clerk instance,
and whether NOT_A_MEMBER was added. The iPad team will lock its client contract against that.
```
