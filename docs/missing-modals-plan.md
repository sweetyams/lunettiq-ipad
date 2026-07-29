# Missing Modals & Edit Screens — Client Profile

## Overview

Every "Edit" / "Add" / action link in the client profile tabs needs to open a corresponding modal. Several are wired to sheets that already exist; others are no-ops (`() => {}`). This document catalogs what's missing and plans the implementation.

## Status Key

- ✅ Wired — opens an existing sheet/modal
- 🔲 No-op — `onPress={() => {}}` placeholder, needs implementation
- 🟡 Partial — handler exists but modal not fully built

---

## OverviewTab

| Card | Action | Status | Target |
|------|--------|--------|--------|
| Contact | Edit | 🔲 | `onEditSection('contact')` → needs **ContactEditSheet** |
| Preferences | Edit | ✅ | `onOpenSheet('preferences')` → PreferencesSheet |
| Wishlist | See all | 🔲 | No handler — needs navigation to wishlist view |
| Tags & segments | Manage | 🔲 | No handler — needs **TagManagementSheet** |
| Insurance | Add | ✅ | `onOpenSheet('insurance')` → InsuranceFormSheet |
| Lifestyle | Fill | ✅ | `onOpenSheet('lifestyle')` → LifestyleQuestionnaireSheet |
| Multi-pair | Generate | ✅ | `onOpenSheet('multipair')` → MultiPairResultsSheet |
| Upcoming | Book | 🔲 | No handler — needs navigation to appointment creation |
| Internal notes | Add | 🔲 | `onEditSection('notes')` → needs **NotesEditSheet** |

## ClinicalTab

| Card | Action | Status | Target |
|------|--------|--------|--------|
| Prescriptions | + Add prescription | ✅ | `onAddPrescription()` → PrescriptionSheet |
| Clinical notes | Add | 🔲 | `() => {}` → needs **ClinicalNotesSheet** |
| Fit profile | Edit | 🔲 | `() => {}` → needs **FitProfileEditSheet** |
| Sizing guidance | (none) | ✅ | Read-only, derived |
| Capture with LiDAR | button | 🔲 | `() => {}` → needs LiDAR flow (V2, placeholder OK) |

## HistoryTab

| Element | Action | Status | Target |
|---------|--------|--------|--------|
| + Add note | button | 🔲 | Needs **AddNoteSheet** (quick text + tag chips) |
| Rx pipeline → | button | 🔲 | Navigation to `/more/rx-pipeline` |
| Timeline entry | tap | 🔲 | Expand/detail popover (future) |

## RelationshipsTab

| Card | Action | Status | Target |
|------|--------|--------|--------|
| Linked clients | + Link a client | 🔲 | Needs **LinkClientSheet** (search + relationship picker) |
| Segments | Manage | 🔲 | Needs segment management (or just read-only for V1) |

## Parent Screen ([id].tsx)

| Element | Status | Notes |
|---------|--------|-------|
| `onEditSection` handler | 🔲 | Currently `() => {}` — needs to open edit sheets |
| `onOpenSheet` handler | ✅ | Works for insurance/lifestyle/multipair/prescription |
| Preferences from OverviewTab | ✅ | Already passes 'preferences' to onOpenSheet |

---

## Implementation Plan

### Phase A — Contact & Notes Edit (High Priority)

These are the most-used edit actions on the profile.

#### A1. ContactEditSheet
**File:** `src/features/client-profile/ContactEditSheet.tsx`
**Pattern:** Same as other sheets — uses Sheet component
**Fields:** First name, Last name, Email, Phone, Language (EN/FR chip toggle), Home store (chip selector)
**API:** `useUpdateClient` mutation (PATCH /api/clients/{id})
**Props:** `{ clientId: string; client: ClientProfile; visible: boolean; onClose: () => void }`

#### A2. NotesEditSheet  
**File:** `src/features/client-profile/NotesEditSheet.tsx`
**Pattern:** Sheet with single textarea + quick-tag chips
**Fields:** Notes textarea, quick-tag chips (follow up, price sensitive, bring spouse, size up)
**API:** `useUpdateEnrichment` mutation (PUT /api/clients/{id}/enrichment → internalNotes field)
**Props:** `{ clientId: string; currentNotes: string | null; visible: boolean; onClose: () => void }`

### Phase B — Clinical Edits (Medium Priority)

#### B1. FitProfileEditSheet
**File:** `src/features/client-profile/FitProfileEditSheet.tsx`
**Fields:** Face shape (chip selector), Frame width (mm), Bridge width (mm), Temple length (mm), IPD (mm)
**API:** `useUpdateEnrichment` mutation
**Props:** `{ clientId: string; visible: boolean; onClose: () => void }`

#### B2. ClinicalNotesSheet
**File:** `src/features/client-profile/ClinicalNotesSheet.tsx`
**Pattern:** Essentially same as NotesEditSheet but for clinical context
**Fields:** Note text, date, category
**API:** `useCreateInteraction` (type: 'note', direction: 'internal')

### Phase C — Relationship & Tag Management (Lower Priority)

#### C1. AddNoteSheet (History tab)
**File:** `src/features/client-profile/AddNoteSheet.tsx`  
**Pattern:** Quick note entry — textarea + tag chips + submit
**API:** `useCreateInteraction` (type: 'note')

#### C2. LinkClientSheet
**File:** `src/features/client-profile/LinkClientSheet.tsx`
**Pattern:** Client search + relationship type picker
**Fields:** Search input, relationship type chips (Spouse/Child/Parent/Sibling/Partner/Other)
**API:** Needs new endpoint or existing links endpoint (P1 API gap)

#### C3. TagManagementSheet
**File:** `src/features/client-profile/TagManagementSheet.tsx`
**Pattern:** Current tags as removable chips + text input to add new ones
**API:** `useUpdateClient` mutation (PATCH tags array)

### Phase D — Navigation Wiring (Quick)

These just need router.push calls, no new components:

| Action | Target |
|--------|--------|
| Wishlist "See all" | `/clients/${id}` with wishlist section expanded (or dedicated screen) |
| Upcoming "Book" | Open CreateAppointmentSheet with clientId pre-filled |
| Rx pipeline → | `router.push('/more/rx-pipeline')` |
| Capture with LiDAR | Show placeholder toast "LiDAR capture coming in V2" |

---

## Wiring Changes in [id].tsx

```tsx
// Replace the no-op:
onEditSection={() => {}}

// With:
const [editingSection, setEditingSection] = useState<string | null>(null);
onEditSection={(section) => setEditingSection(section)}

// Then render sheets:
{editingSection === 'contact' && <ContactEditSheet ... />}
{editingSection === 'notes' && <NotesEditSheet ... />}
```

## Priority Order

1. **ContactEditSheet** — most-used action, blocks basic profile editing
2. **FitProfileEditSheet** — needed for clinical workflow
3. **NotesEditSheet** — needed for session documentation
4. **AddNoteSheet** — needed for history tab
5. **TagManagementSheet** — lower priority, nice-to-have
6. **LinkClientSheet** — depends on API support
7. Navigation wiring — trivial, do alongside

## Estimated Effort

| Phase | Sheets | Est. |
|-------|--------|------|
| A (Contact + Notes) | 2 | 2 hours |
| B (Clinical edits) | 2 | 2 hours |
| C (Relationships/Tags) | 3 | 3 hours |
| D (Navigation wiring) | 0 | 30 min |
| **Total** | **7 new sheets** | **~1 day** |
