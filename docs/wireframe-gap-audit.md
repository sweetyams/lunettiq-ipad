# Wireframe Gap Audit

Comparison of wireframe spec (lunettiq-ipad-client-wireframes.html) vs current implementation.

## Status Legend
- ✅ Done — implemented and working
- 🟡 Partial — exists but incomplete/broken
- ❌ Missing — not built yet

---

## 01 · CLI-01 — Client List + Preview

| Element | Status | Notes |
|---|---|---|
| 40/60 split view | ✅ | Working |
| Search by name/email/phone | ✅ | Debounced, working |
| Filter pills (All/Recent/VIP/CULT/VAULT/Incomplete) | 🟡 | Pills render but filter logic may not be wired for all |
| Client rows with avatar/name/email/time | ✅ | Working |
| Selected state (left border + bg) | ✅ | Working |
| Preview: Stats card (Orders/LTV/Last visit) | ✅ | Working |
| Preview: Profile gaps chips | 🟡 | Card exists but gap detection logic needs verification |
| Preview: Start session + Open profile actions | ✅ | Working |
| "+ New client" bottom button | ✅ | Working |
| Total count in header | ✅ | Working |

## 02 · CLI-02 — Profile Overview

| Element | Status | Notes |
|---|---|---|
| Fixed 300px left rail | ✅ | Working |
| Rail: Avatar + name + email | ✅ | Working |
| Rail: Quick stats (orders/LTV/member since) | ✅ | Via QuickStats component |
| Rail: Loyalty credits + "Issue courtesy credit" | ✅ | Via LoyaltyPanel |
| Rail: Rx Status | ✅ | Via RxStatus component |
| Tab bar (Overview/Clinical/History/Relationships) | ✅ | Fixed, no text jump |
| TopBar: Actions session-aware | ✅ | Just fixed |
| Overview: Contact card + Edit modal | ✅ | ProfileSectionCard + ProfileEditModal |
| Overview: Fit Profile card + Edit modal | ✅ | ProfileSectionCard + ProfileEditModal |
| Overview: Preferences card + Edit modal | ✅ | ProfileSectionCard + ProfileEditModal |
| Overview: Insurance card → sheet | ✅ | InsuranceFormSheet |
| Overview: Lifestyle card → sheet | ✅ | LifestyleQuestionnaireSheet |
| Overview: Wishlist card | 🟡 | Card renders but no "add to wishlist" action from profile |
| Overview: Multi-pair suggestions | ✅ | MultiPairResultsSheet |
| Overview: Tags & Segments + "Manage" | 🟡 | Shows tags but no add/remove tag modal |
| Overview: Internal Notes + "Add" | ✅ | ProfileEditModal for notes |
| Overview: Upcoming appointment | ❌ | Missing — wireframe shows "Book" action |
| Overview: "Subscribe to membership" CTA | 🟡 | Shows CTA but no subscription flow |

## 03 · CLI-02 — Section-Level Edit

| Element | Status | Notes |
|---|---|---|
| Entire card flips to form mode | ✅ | ProfileEditModal opens on edit |
| Save/Cancel at form footer | ✅ | In modal |
| Other cards stay in view mode | ✅ | Only one modal at a time |
| Contact editing (all fields at once) | ✅ | Working |
| Fit profile editing (all fields at once) | ✅ | Working |
| Preferences → opens sheet | ✅ | Working |

## 04 · CLI-02 — Clinical Tab

| Element | Status | Notes |
|---|---|---|
| Prescriptions list with expand | ✅ | PrescriptionsPanel |
| Verified/Unverified badge per Rx | 🟡 | Panel exists but badge logic needs verification |
| "+ Add Rx" action → Rx sheet | ✅ | PrescriptionSheet |
| OD/OS table display | ✅ | In PrescriptionSheet |
| Fit Profile card (same as overview) | ✅ | EnrichmentPanel |
| Sizing guidance (computed from measurements) | ❌ | Missing — should show frame size range |
| "Capture with LiDAR" button | ❌ | Missing — V2 feature, ok to skip |
| Clinical notes (staff only) | 🟡 | Shows in EnrichmentPanel's internal notes |

## 05 · Sheet — Add Prescription

| Element | Status | Notes |
|---|---|---|
| Source selector (manual/photo/import) | 🟡 | Selector exists but photo/import not functional |
| Type + Prescriber + dates | ✅ | Fields exist |
| OD/OS values table | ✅ | Built |
| PD binocular + monocular | ✅ | Fields exist |
| Photo attachment | ❌ | Placeholder only, no camera integration |
| Verification notice | ✅ | Shows "Unverified" explanation |

## 06 · Sheet — Insurance

| Element | Status | Notes |
|---|---|---|
| Provider + policy + coverage fields | ✅ | Working |
| Pairs allowed/used | ✅ | Working |
| Renewal date | ✅ | Working |
| Notes textarea | ✅ | Working |
| Live coverage summary (computed) | ✅ | Shows remaining pairs/coverage/days |
| **Form content visible (not empty)** | 🟡 | Fixed height issue, needs reload verification |

## 07 · Sheet — Lifestyle Questionnaire

| Element | Status | Notes |
|---|---|---|
| Staff mode toggle (one page) | ✅ | Working |
| Client guided mode toggle | 🟡 | Toggle exists but guided mode (one-question-per-step) not built |
| 7-9 questions with chip selection | ✅ | 9 questions with chips |
| Multi-select for sports/hobbies | ✅ | Just fixed |
| "N of N answered" footer | ✅ | Working |
| **Form content visible** | 🟡 | Fixed height issue, needs reload verification |

## 08 · Sheet — Preferences

| Element | Status | Notes |
|---|---|---|
| Shapes chip field | ✅ | Working |
| Materials chip field | ✅ | Working |
| Colours chip field | ✅ | Working |
| Brands chip field | ✅ | Working |
| Avoid (inverted styling, strikethrough) | ✅ | Working |
| "+ Other" inline text input | ✅ | Working |
| Notes textarea | ✅ | Working |

## 09 · CLI-02 — History Tab

| Element | Status | Notes |
|---|---|---|
| Unified timeline (orders + notes + visits interleaved) | 🟡 | InteractionsTimeline + OrdersPanel exist but aren't merged into one timeline |
| Filter pills (All/Orders/Try-ons/Notes/Visits) | ❌ | Missing — no type filter on history |
| "+ Add note" button | ❌ | Missing — no add-note modal from history tab |
| "Rx pipeline orders →" link | ❌ | Missing |
| Each entry: timestamp + title + body + attribution | ✅ | InteractionsTimeline handles this |

## 10 · Sheet — Multi-pair Suggestions

| Element | Status | Notes |
|---|---|---|
| Input readiness chips (Lifestyle ✓, Rx ✓, Insurance — missing) | ✅ | Working |
| Recommendation cards with reasoning | ✅ | Working |
| "Add to wishlist" / "Add to session" actions | 🟡 | Buttons exist but handlers incomplete |
| Regenerate button | ✅ | Working |
| Close button | ✅ | Working |

## 11 · SES-01 — Session Workspace

| Element | Status | Notes |
|---|---|---|
| Session bar (dark, timer, actions) | ✅ | Working |
| Product browser with search | 🟡 | Products should load now (fixed useProducts), needs verification |
| Sort pills (Best match/Newest/Price) | ✅ | Working |
| Fit filter chip | ❌ | Missing — should show computed size range from measurements |
| 3-column product grid | ✅ | FlatList with numColumns |
| "+" button per product card | ✅ | Adds to tray |
| Session rail: Client context | ✅ | Shows name/fit/preferences |
| Session rail: AI Stylist | 🟡 | UI exists but no real AI call |
| Session rail: Session tray with verdicts | ✅ | Working with verdict buttons |
| Session rail: Session notes | ✅ | Textarea working |
| "Hand to client" action | 🟡 | Button exists, handler is console.log |
| "Capture fitting photos" → FIT-01 | ✅ | Navigates to fitting screen |
| "End session" → End flow | ✅ | EndSessionSheet exists |
| "Create order from tray" | ❌ | Missing — no order creation flow |

## 12 · FIT-01 — Fitting Mode

| Element | Status | Notes |
|---|---|---|
| Full-bleed camera feed | 🟡 | CaptureView.tsx exists, screen exists at [id]/fitting.tsx |
| Shelf (bottom strip, horizontal scroll) | 🟡 | ShelfThumbnail component exists |
| Photo capture button | 🟡 | Exists in CaptureView |
| Barcode scanner toggle | ❌ | Missing in fitting context |
| "Compare" button (2+ selected) | 🟡 | CompareView.tsx exists |
| Photo count "14/20" | ❌ | Missing cap display |
| Link prompt after capture | ❌ | Missing — should prompt barcode/search to link product |
| Consent modal (first capture) | ✅ | ConsentModal exists |

## 13 · Missing Flows / Modals

| Flow | Status | Notes |
|---|---|---|
| Add Tag modal | ❌ | Need simple tag picker/input |
| Add Note modal (from history) | ❌ | Need note creation form |
| Session End flow (SES-02/03/04) | 🟡 | EndSessionSheet exists but may not cover outcome/summary/notes |
| Duplicate resolution (CLI-04) | ✅ | In new.tsx |
| "Book appointment" action | ❌ | Missing — no appointment booking flow |
| "Subscribe to membership" flow | ❌ | Missing — needs Shopify subscription integration |
| "Issue courtesy credit" modal | ❌ | Missing — needs credit issuance form |
| Sizing guidance (computed frame range) | ❌ | Missing |
| Hand-to-client mode (FIT-05) | 🟡 | HandedToClientView exists |

---

## Priority Actions

### Must fix now (broken/confusing):
1. ~~Double bar on profile~~ ✅ Fixed
2. Products not loading in session workspace — verify after reload
3. Sheet content not showing (height fix deployed, needs verification)

### Should build next:
4. Add Tag modal (simple text input + existing tag list)
5. Add Note modal (type selector + subject + body)
6. History tab filter pills
7. Unified timeline (merge interactions + orders into one chronological view)
8. Fit filter chip in session workspace (show "47–50□19–21" from measurements)
9. Sizing guidance card on Clinical tab

### Nice to have / V2:
10. Client guided mode for lifestyle (one question per step)
11. Photo attachment in Rx sheet
12. Order creation from session tray
13. Appointment booking flow
14. LiDAR capture
15. Full fitting flow with link prompt and photo cap display
