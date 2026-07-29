# Foundry API Gaps — Clients Flow

This document tracks missing or incomplete Foundry API functionality needed to support the Clients flow hifi wireframes. Updated as implementation progresses.

> **Token source resolved (2026-07-29):** `GET /api/design/native` (v77f8561f) is the definitive source for all design tokens. The wireframe HTML declares different values (Roboto, #000EC7, etc.) but those are superseded by the live API. The iPad app's `tailwind.config.js` matches the API exactly.

## Priority Legend

- **P0**: Blocks wireframe implementation completely
- **P1**: Degraded experience without it, workarounds possible
- **P2**: Nice-to-have, enhances UX but not critical

---

## P0 — Critical Gaps

### 1. Profile Completeness Detection
**Wireframe needs:** Screen 01 filter by "Incomplete" profile, Screen 01 preview panel shows "Profile gaps"
**Current API:** No single endpoint returns completeness status
**Gap:** Need server-computed profile completeness analysis
**Proposed solution:** 
- Extend `GET /api/clients/{id}` to include `completeness` object
- Or new `GET /api/clients/{id}/completeness` endpoint
- Return: `{ missingRx: boolean, missingFit: boolean, missingLifestyle: boolean, missingInsurance: boolean, completenessScore: 0-100 }`
**Affected screens:** 01, 02

### 2. Unified Timeline Data
**Wireframe needs:** Screen 05 merged timeline with orders, try-ons, notes, visits, Rx events
**Current API:** `GET /api/clients/{id}/interactions` may not include all event types
**Gap:** Unclear if interactions endpoint includes orders, Rx updates, try-on sessions
**Proposed solution:**
- Verify interactions endpoint scope — does it return ALL timeline events?
- If not, extend to include orders, prescriptions, try-on sessions
- Ensure consistent timestamp field for chronological sorting
**Affected screens:** 05

### 3. Session Tray Verdicts Storage
**Wireframe needs:** Screen 13 session tray shows verdict per frame
**Current API:** Verdict storage location unclear — product-interactions or tryon-session sub-records?
**Gap:** Where do fitting session verdicts persist?
**Proposed solution:**
- Clarify if verdicts are stored in product-interactions or as part of tryon-sessions
- Ensure verdict data includes: loved/liked/unsure/rejected + notes + timestamp
**Affected screens:** 13

### 4. Order Creation from Session
**Wireframe needs:** Screen 13 "Create order from tray" button
**Current API:** No endpoint to create order from session/tray
**Gap:** Cannot convert session shortlist to order
**Proposed solution:**
- New `POST /api/clients/{id}/orders/from-session` endpoint
- Accept sessionId + selected items from tray
- Return order ID for handoff to fulfillment
**Affected screens:** 13

---

## P1 — Experience Degraders

### 5. Loyalty Tier Progression
**Wireframe needs:** Screen 02 shows "Next tier" with dollar amount away
**Current API:** `GET /api/loyalty/credits/{customerId}` returns balance but tier progression unclear
**Gap:** Missing tier thresholds and progression math
**Proposed solution:**
- Extend loyalty endpoint to include: `nextTier`, `amountToNextTier`, `currentTierBenefits`
- Or new `GET /api/loyalty/progression/{customerId}` endpoint
**Affected screens:** 02

### 6. Real-time Duplicate Detection
**Wireframe needs:** Screen 12 duplicate detection on field blur
**Current API:** `GET /api/clients/duplicates` exists but input format unclear
**Gap:** Does duplicates endpoint accept partial input for real-time matching?
**Proposed solution:**
- Verify duplicates endpoint supports query params like `?email=`, `?phone=` for partial matching
- Ensure <500ms response time for real-time UX
**Affected screens:** 12

### 7. Prescription Verification Status
**Wireframe needs:** Screen 04 Rx verification badge, "Signed off by [name]"
**Current API:** `GET /api/admin/prescriptions` model unclear on verification fields
**Gap:** Missing verification status, signer identity, verification timestamp
**Proposed solution:**
- Extend prescription model to include: `verified: boolean`, `verifiedBy: string`, `verifiedAt: timestamp`
- Ensure verification status is returned in client profile Rx data
**Affected screens:** 04

### 8. Insurance Household Queries
**Wireframe needs:** Screen 06 "Shared plan", Screen 08 "Shared with" household members
**Current API:** Multi-pair insurance endpoints exist but household querying unclear
**Gap:** Cannot query other members on same insurance plan
**Proposed solution:**
- Extend `GET /api/admin/multi-pair/insurance?customerId={id}` to include `householdMembers` array
- Include shared coverage calculations, aggregate usage
**Affected screens:** 06, 08

### 9. Fit Profile Measurements
**Wireframe needs:** Screen 04 "Temple length" and "Interpupillary distance" fields
**Current API:** `GET /api/clients/{id}/enrichment` includes face shape, frame width, notes
**Gap:** Missing specific measurements for temple length, IPD
**Proposed solution:**
- Extend enrichment model to include: `templeLength`, `interpupillaryDistance`, other key measurements
- Ensure measurements are in consistent units (mm)
**Affected screens:** 04

### 10. Questionnaire Structure
**Wireframe needs:** Screen 09 lifestyle questionnaire (questions + options)
**Current API:** Multi-pair questionnaire endpoints exist but structure unclear
**Gap:** Are questions/options returned by API or hardcoded in app?
**Proposed solution:**
- Ensure `GET /api/admin/multi-pair/questionnaires` returns full question structure
- Include: question text, option values, dependencies, validation rules
- Support both staff mode (all questions) and client mode (guided stepper)
**Affected screens:** 09

---

## P2 — Nice-to-Have Enhancements

### 11. Client Statistics
**Wireframe needs:** Screen 02 "Average order value", "Member since"
**Current API:** May be computed client-side from orders data
**Gap:** No pre-computed client statistics
**Proposed solution:**
- Extend `GET /api/clients/{id}` to include computed stats: `averageOrderValue`, `memberSince`, `totalSpent`
- Or accept client-side computation from orders endpoint
**Affected screens:** 02

### 12. Sizing Guidance
**Wireframe needs:** Screen 04 derived sizing range "47–50 □ 19–21"
**Current API:** Could be computed client-side from fit profile
**Gap:** No server-side sizing recommendations
**Proposed solution:**
- Accept client-side computation using fit profile + product dimensions
- Or add sizing guidance to enrichment endpoint response
**Affected screens:** 04

### 13. Relationship Tracking
**Wireframe needs:** Screen 06 "Household value" (aggregate LTV)
**Current API:** `GET /api/clients/{id}/links` exists for relationships
**Gap:** Missing household-level aggregations
**Proposed solution:**
- Extend links endpoint to include household financial aggregations
- Or compute client-side from linked client data
**Affected screens:** 06

### 14. Referral System
**Wireframe needs:** Screen 06 "Referred by", "Has referred", "Credits earned"
**Current API:** No referral tracking visible
**Gap:** Missing referral system entirely
**Proposed solution:**
- New referral endpoints if business requires this feature
- Include in client profile: referrer, referrals made, referral credits
**Affected screens:** 06

### 15. Rx Import from Orders
**Wireframe needs:** Screen 07 "Source: Import from order"
**Current API:** No clear path to extract Rx from historical order
**Gap:** Cannot pre-populate Rx form from order data
**Proposed solution:**
- New endpoint `GET /api/clients/{id}/orders/{orderId}/prescription` to extract Rx data
- Or extend orders endpoint to include Rx details when present
**Affected screens:** 07

### 16. Location Name Resolution
**Wireframe needs:** Home store shown as NAME, not ID
**Current API:** Enrichment has `homeLocationId` but wireframe needs name
**Gap:** Must resolve location ID to display name
**Proposed solution:**
- Ensure `GET /api/storefront/locations` provides location lookup table
- Or extend client response to include resolved location name
**Affected screens:** Multiple

### 17. Tag Management
**Wireframe needs:** Screen "+ Add tag" UI
**Current API:** Client search supports `tag` filter but tag vocabulary unclear
**Gap:** Tag creation/management workflow
**Proposed solution:**
- Clarify if tags are free-form or from predefined list
- If predefined: `GET /api/clients/tags` endpoint for vocabulary
- Tag CRUD: add/remove tags from client profile
**Affected screens:** Multiple

### 18. Language Preference
**Wireframe needs:** EN/FR toggle on client profile
**Current API:** Not clear if language is stored in client model
**Gap:** Client language preference storage
**Proposed solution:**
- Extend client model to include `language` field
- Support in create/update client endpoints
**Affected screens:** Multiple

### 19. Internal Notes Structure
**Wireframe needs:** Timeline-style internal notes vs single text field
**Current API:** Enrichment has `internalNotes` but structure unclear
**Gap:** Are internal notes free-form text or structured timeline entries?
**Proposed solution:**
- Clarify if internal notes are part of interactions timeline
- Or separate structured notes endpoint for staff-only timeline
**Affected screens:** Multiple

### 20. Brands Admired Field
**Wireframe needs:** Screen 10 "Brands admired" in preferences
**Current API:** Preferences model structure unclear
**Gap:** Missing brand preference field
**Proposed solution:**
- Extend `GET /api/clients/{id}/preferences` to include `brandsAdmired` array
- Support in preferences update endpoint
**Affected screens:** 10

### 21. Insurance Coverage Calculations
**Wireframe needs:** Screen 08 live coverage summary, Screen 11 insurance math per suggestion
**Current API:** Multi-pair recommendation endpoints exist but coverage math unclear
**Gap:** Real-time insurance coverage calculations
**Proposed solution:**
- Extend recommendation endpoints to include coverage/cost calculations per suggestion
- Include: pairs remaining, coverage remaining, renewal date
**Affected screens:** 08, 11

---

## Implementation Notes

This document should be reviewed with the Foundry team to:
1. Verify which gaps are actual vs. documentation incomplete
2. Prioritize P0 gaps for immediate implementation
3. Confirm data models match wireframe requirements
4. Plan API extensions vs. client-side computation tradeoffs

## Status Tracking

- [ ] Initial gap analysis complete
- [ ] Foundry team review scheduled
- [ ] P0 gaps assigned to implementation
- [ ] API extensions planned
- [ ] Client-side fallback strategies defined

---

*Last updated: 2026-07-29*