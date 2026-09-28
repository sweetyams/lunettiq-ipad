# Seed request — give a founder multi-store iPad access (Option A)

**From:** iPad team
**To:** Foundry agent (owns `/Users/yann/Development/Foundry/foundry/`)
**Goal:** Let `willem@sweetyams.com` (founder) sign in on the iPad and **choose** which
store to use, across all iPad-capable stores.
**Approach:** Option A from the handoff — **grant membership**, no contract change. This
matches `03-foundry-handoff.md` §7/§10 (no "founder sees all" branch). The iPad side is
already built; this is purely Foundry seed data.

---

## Why seeding (not a code branch)

`GET /api/account/my-projects` returns only the caller's `project_members` rows. The iPad
shows a store picker when that list has ≥2 entries, and flags/hides stores that aren't
iPad-capable. So the founder gets a real chooser the moment they're a **member** of ≥2
iPad-capable stores. No `my-projects` change, no founder branch — exactly the handoff's
decision.

---

## What "iPad-capable" means (must be true for each store you seed)

A store only works in the iPad app if it has the modules the app depends on. At minimum:

- **`device-management` module enabled** + `deviceQuickSwitch.enabled` setting — required for
  the PIN lock / staff-roster. Without it the iPad shows a "not set up for iPad" banner.
  (Confirmed live: `staff-roster` on a store without it returns
  `{"error":{"code":"NOT_FOUND","message":"Module not enabled"}}`.)
- Storefront + scheduling modules — so products/appointments actually sync.

`lunettiq-demo` already has these (per handoff §4). `lunettiq` is the primary production
store. `sweetyams` / `bentspline` do **not** have `device-management` (that's why willem
currently hits the banner).

---

## The seed — do this

For **`willem@sweetyams.com`**, add `project_members` rows to every iPad-capable store you
want him to choose from. Concretely:

1. **Resolve willem's Clerk user id.** (We don't have it on the iPad side — benjamin's is
   `user_3GJcIVjU0f7GwuzgAfEOdll9I2c`, willem's is unknown to us.) Use the existing tooling:
   ```bash
   pnpm tsx scripts/seed-lunettiq-demo-members.ts --list
   ```
   to find/confirm his `user_...` id.

2. **Add him as a member of each iPad store.** Using the same script pattern referenced in
   the handoff (§6):
   ```bash
   # lunettiq-demo (already device-management-enabled)
   pnpm tsx scripts/seed-lunettiq-demo-members.ts --user=user_WILLEM --role=admin --force

   # lunettiq (production) — equivalent seed for the primary store
   #   (use whatever the lunettiq equivalent of the demo seed script / path is)
   #   add willem to project_members(project=lunettiq, user=user_WILLEM, role=owner|admin)
   ```
   Role: `owner` or `admin` is fine — his role is per-project and drives permissions, not
   iPad visibility.

3. **If a store you want him in lacks `device-management`** (e.g. you also want `sweetyams`
   in the picker), enable the `device-management` module + `deviceQuickSwitch.enabled`
   setting for that store first — otherwise the iPad will list it but flag it "not set up
   for iPad."

4. **Verify** with the account's own token:
   ```bash
   curl -H "Authorization: Bearer <willem_clerk_jwt>" \
        -H "X-Found-Surface: tablet" \
        https://lunettiq.bentspline.com/api/account/my-projects
   ```
   Expect `data.projects` to now list **both** `lunettiq` and `lunettiq-demo` (production
   first, then alphabetical), each with the correct `baseUrl` and `env`.

---

## What NOT to do

- **Do not** add a founder/platform "see all projects" branch to `my-projects`. That's the
  branch the handoff (§7/§10) deliberately declined. If you believe that's actually the
  right call for founders, treat it as a **separate policy decision** and raise it — don't
  fold it into this seed. (Governance questions it would open: who counts as founder, can a
  founder bind a device to a store they're not a member of, how is that audited.)

---

## Expected iPad behaviour after seeding (no iPad changes needed)

1. willem signs in → `my-projects` returns `lunettiq` + `lunettiq-demo`.
2. Because it's >1, the iPad shows the **select-project** picker (name, role, `env` badge,
   location count).
3. He picks one → that store's isolated DB opens, initial sync runs against its host, app
   enters Home. `lunettiq-demo` shows the demo strip.
4. He can **Change store** from More (or the lock screen) any time.
5. PIN unlock works because both stores have `device-management`.

---

## Report back

Reply with: willem's Clerk `user_...` id, the stores you seeded him into (+ roles), whether
any needed `device-management` enabled, and the `my-projects` curl output for his token. The
iPad needs no further changes once `my-projects` returns ≥2 iPad-capable stores for him.
