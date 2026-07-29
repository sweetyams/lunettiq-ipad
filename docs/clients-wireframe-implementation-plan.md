# Clients Flow Wireframe Implementation Plan

**Project:** Lunettiq iPad App  
**Target:** Match hifi wireframes (lunettiq-ipad-clients-hifi.html, 14 screens)  
**Created:** July 29, 2026

## Overview

This plan updates the existing Clients flow to match the detailed hifi wireframes. The app has solid foundations (working split views, client types, API hooks, basic components) but needs design token corrections and visual pattern alignment.

### Token Reconciliation (resolved 2026-07-29)

The wireframe HTML declares its own CSS variables that differ from the live Foundry API. **The Foundry API (`GET /api/design/native`, version `77f8561f`) is the definitive source.** Key differences:

| Token | Wireframe HTML | Foundry API (authoritative) |
|-------|---------------|----------------------------|
| Font | Roboto | General Sans (Fontshare, variable 200–700) |
| Brand | `#000EC7` | `#023891` |
| Accent | `#525252` | `#1D1F21` (dark — used for buttons) |
| bgSurface | `#FFFFFF` | `#F8F6F7` (warm grey) |
| bgMuted | `#F5F5F5` | `#F8F6F7` |
| textPrimary | `#171717` | `#1D1F21` |
| textSecondary | `#404040` | `rgba(29,31,33,0.65)` |
| textMuted | `#737373` | `rgba(29,31,33,0.45)` |
| border | `#D4D4D4` | `rgba(17,17,17,0.18)` |
| error | `#DC2626` | `#B42318` |
| success | `#16A34A` | `#067647` |

**Semantic note:** In Lunettiq's design system, `brand` is the identity blue (sparingly used for highlights) and `accent` is the dark interactive color (buttons, selected states). This inverts the typical "brand = primary button" convention. The wireframe's "Start session" brand-blue button maps to `accent` in the actual token set.

The wireframe's **layout, flow, and UX patterns** (split views, card anatomy, sheet architecture, tab structure) remain the implementation target. Only color/font values change to match the live API.

## Current State Assessment

### ✅ What's Working
- CLI-01 split list/preview structure
- CLI-02 profile with rail + tabs
- Core components: ProfileSectionCard, ProfileEditModal, EnrichmentPanel, PreferencesPanel
- All sheets: PrescriptionSheet, InsuranceFormSheet, LifestyleQuestionnaireSheet, etc.
- Session workspace basics
- Complete Client type definitions
- TanStack Query hooks for all endpoints

### ❌ What Needs Fixing
1. **Design tokens** — ✅ RESOLVED: tailwind.config.js now matches Foundry API v77f8561f
2. **Layout precision** — Wireframe specifies exact widths (452px, 328px)
3. **Visual patterns** — Missing card edit modes, rowkv, chip variants, field labels
4. **Component gaps** — Stat cards, profile gaps chips, session bar, product grid (pcard)
5. **Client View** — Needs larger type, green strip, verdict buttons

---

# Phase 0: Design Token Foundation ✅ COMPLETE
*tailwind.config.js matches Foundry API v77f8561f*

Resolved 2026-07-29. The tailwind config now uses the live Foundry API as the definitive source:

- **Font:** General Sans (Fontshare, variable 200–700) with Arial/Helvetica fallbacks
- **Type scale:** 20 levels from caption-xs (10px) to display-xxl (64px), plus `price` token
- **Colors:** All values match API response exactly (brand #023891, accent #1D1F21, etc.)
- **iPad semantics:** verdict, mode, chrome tokens derived from storefront values
- **Spacing/radius:** Unchanged (xs:4 through 2xl:48, sm:6 through full:9999)

**Key design decision:** The wireframe uses `brand` blue (#023891) for the primary CTA ("Start session").
In the Foundry token semantics, `accent` (#1D1F21 dark) is the button color and `brand` is sparingly
used for highlights. For the iPad app, we follow the wireframe's UX intent — the single primary action
per screen uses `brand` (blue), matching what the wireframe visually communicates as the most important
tap target. Secondary buttons use `accent` (dark) or ghost (border-only) styling.

---

# Phase 1: Core UI Components
*Atomic building blocks matching wireframe patterns*

## Tasks

### 1.1 Create flabel Component (S)
**File:** `src/ui/flabel.tsx`
```tsx
interface FlabelProps {
  children: React.ReactNode;
  required?: boolean;
}

// Uppercase + letter-spacing for form labels matching wireframes
```
**Classes:** `text-caption-sm uppercase tracking-wider text-color-text-secondary`

### 1.2 Create rowkv Component (S)
**File:** `src/ui/rowkv.tsx`
```tsx
interface RowkvProps {
  label: string;
  value: string | React.ReactNode;
  variant?: 'default' | 'compact';
}

// Key-value rows used throughout profile cards
```
**Classes:** Row with `py-2 flex justify-between`, label gets `text-color-text-secondary`, value gets `text-color-text-primary font-medium`

### 1.3 Update Chip Component (M)
**File:** `src/ui/Chip.tsx`
- Add variants matching wireframes:
  - `--on`: Selected state (bg-color-brand text-color-brand-text)
  - `--neg`: Avoid/error (bg-color-error text-white line-through)
  - `--add`: Add new item (border-dashed text-color-text-muted with + prefix)
- Ensure proper touch targets (44pt minimum)

### 1.4 Create StatCard Component (M)
**File:** `src/ui/StatCard.tsx`
```tsx
interface StatCardProps {
  stats: Array<{
    label: string;
    value: string | number;
    suffix?: string;
  }>;
}

// 3-column card with dividers matching wireframe profile stats
```
**Layout:** Grid with `divide-x divide-color-border`, each stat centered

### 1.5 Create ProfileGapChips Component (S)
**File:** `src/ui/ProfileGapChips.tsx`
```tsx
interface ProfileGapChipsProps {
  gaps: Array<{
    id: string;
    label: string;
    onClick: () => void;
  }>;
}

// Dashed border chips with + prefix for missing profile data
```
**Classes:** `border-dashed border-color-border text-color-text-muted`

### 1.6 Update Avatar Component (S)
**File:** `src/ui/Avatar.tsx`
- Add size variants: `xs` (24px), `sm` (32px), `md` (48px), `lg` (64px), `xl` (80px)
- Ensure tier badge overlay positioning works at all sizes
- Update with proper color tokens

### 1.7 Create SessionBar Component (M)
**File:** `src/ui/SessionBar.tsx`
```tsx
interface SessionBarProps {
  clientName: string;
  duration: string;
  isRecording?: boolean;
  onHandToClient: () => void;
  onCaptureFitting: () => void;
  onEndSession: () => void;
}

// Dark bar matching wireframe with pill + actions
```
**Classes:** `bg-color-bg-inverse text-color-text-inverse` with pill showing recording dot

### 1.8 Create pcard Component (Product Card) (M)
**File:** `src/ui/pcard.tsx`
```tsx
interface PcardProps {
  product: Product;
  onAddToSession?: () => void;
  showAddButton?: boolean;
  fitBadge?: 'good' | 'slight' | 'poor';
}

// Product card matching wireframe with image + add button
```
**Classes:** 280px width, image area with overlay add button on hover

---

# Phase 2: CLI-01 Client List + Preview
*Split view refinements matching wireframe proportions*

## Tasks

### 2.1 Update ClientListScreen Layout (M)
**File:** `app/(app)/clients/index.tsx`
- Fix split proportions to match wireframe: `w-list-panel` (452px) + `flex-1`
- Update filter pills to match wireframe variants (All/Recent/CULT/VAULT/Incomplete)
- Implement selected row styling: `bg-color-bg-muted border-l-4 border-color-brand`

### 2.2 Refine ClientRow Component (S)
**File:** `src/features/clients/ClientRow.tsx`
- Update typography to use proper scale (`text-body-lg` for name, `text-caption-md` for email/time)
- Ensure avatar size is `md` (48px)
- Add proper hover states with `bg-color-bg-surface-hover`

### 2.3 Update ClientPreviewPanel (M)
**File:** `src/features/clients/ClientPreviewPanel.tsx`
- Large avatar (`xl` size, 80px)
- Proper tier tag styling with brand colors
- StatCard integration for Orders/LTV/Last Visit
- ProfileGapChips for missing data
- Primary CTA: 'Start session' with `bg-color-brand` (one-accent rule)
- Secondary CTAs with ghost button styling

**Privacy Mode:** Hide LTV, show "credits available" instead of amount

---

# Phase 3: CLI-02 Profile
*Rail + tabs + all cards matching wireframe*

## Tasks

### 3.1 Update ProfileScreen Layout (M)
**File:** `app/(app)/clients/[id]/index.tsx`
- Fix rail width to `w-rail-panel` (328px)
- Update rail styling with proper spacing and colors
- Ensure tab navigation matches wireframe visual treatment

### 3.2 Enhance ProfileSectionCard (M)
**File:** `src/ui/ProfileSectionCard.tsx`
- Add edit mode styling: `card--edit` class with focus ring border
- Implement card__head (title + edit link), card__body, card__foot structure
- Add proper transitions between read/edit modes
- Use rowkv component for key-value displays

### 3.3 Update Contact Card (S)
**File:** `src/features/clients/ContactCard.tsx`
- Use rowkv components for contact info display
- Proper edit mode with form fields using flabel components
- Cancel + Save buttons in card footer

### 3.4 Enhance PreferencesCard (M)
**File:** `src/features/clients/PreferencesCard.tsx`
- Update chip display with proper variants (--on for selected, --neg for avoid)
- 5 groups: Shapes, Materials, Colours, Brands admired, Avoid
- Integrate with PreferencesSheet for editing

### 3.5 Create WishlistCard (M)
**File:** `src/features/clients/WishlistCard.tsx`
```tsx
// 3-column product thumbnail grid
// Uses pcard components in compact mode
// Links to wishlist management
```
**API Hook:** `useClientWishlist(clientId)`

### 3.6 Update TagsCard (S)
**File:** `src/features/clients/TagsCard.tsx`
- Chip display with proper spacing
- Privacy mode: hide internal tags in client-visible mode

### 3.7 Enhance InsuranceCard (M)
**File:** `src/features/clients/InsuranceCard.tsx`
- Empty state pattern matching wireframes
- Live coverage display when data exists
- Integration with InsuranceFormSheet

### 3.8 Create LifestyleCard (S)
**File:** `src/features/clients/LifestyleCard.tsx`
- Empty state linking to LifestyleQuestionnaireSheet
- Summary display when completed

### 3.9 Enhance MultiPairCard (M)
**File:** `src/features/clients/MultiPairCard.tsx`
- Readiness tags display
- Generate suggestions button (brand accent)
- Integration with MultiPairResultsSheet

### 3.10 Update Clinical Tab (M)
**File:** `src/features/clients/ClinicalTab.tsx`
- Rx table with OD/OS rows, proper column headers
- Verified/unverified badges
- Fit Profile section with face shape, measurements
- Sizing guidance derived calculations
- 'Capture with LiDAR' button integration

### 3.11 Update History Tab (M)
**File:** `src/features/clients/HistoryTab.tsx`
- Unified timeline with proper date column (76px width)
- Type filter pills matching wireframe
- Rx pipeline links
- Proper spacing and typography

### 3.12 Update Relationships Tab (S)
**File:** `src/features/clients/RelationshipsTab.tsx`
- Linked clients with avatar + relationship labels
- Segments chip display
- Referrals section with credit information

---

# Phase 4: Sheets (Modal Forms)
*All modal forms matching wireframe patterns*

## Tasks

### 4.1 Update PrescriptionSheet (M)
**File:** `src/features/clients/PrescriptionSheet.tsx`
- Source selector chips (manual/photo/import)
- OD/OS table with proper styling
- Photo upload area
- Unverified state explanation
- Form validation and submission

### 4.2 Update InsuranceFormSheet (M)
**File:** `src/features/clients/InsuranceFormSheet.tsx`
- All fields from wireframe (provider, policy, coverage, etc.)
- Linked clients chips display
- Live coverage summary card with computed values
- Proper form layout with flabel components

### 4.3 Update LifestyleQuestionnaireSheet (L)
**File:** `src/features/clients/LifestyleQuestionnaireSheet.tsx`
- Two modes: Staff (one page) / Hand to client (guided)
- 7 questions with multi-select chips
- Hand-to-client mode needs larger typography (client-visible rules)
- Proper question flow and validation

### 4.4 Update PreferencesSheet (M)
**File:** `src/features/clients/PreferencesSheet.tsx`
- 5 groups with chip selection
- '+ Other' functionality for custom entries
- Avoid section with proper --neg chip styling
- Notes textarea at bottom

### 4.5 Update MultiPairResultsSheet (L)
**File:** `src/features/clients/MultiPairResultsSheet.tsx`
- Input readiness tags at top
- Per suggestion: title, price, thumbnail, explanation
- Add to wishlist + Add to session buttons
- Insurance math calculations
- Excluded section for avoid items
- Footer actions: Close, Regenerate, Send to client

### 4.6 Create NewClientSheet with Duplicate Detection (L)
**File:** `src/features/clients/NewClientSheet.tsx`
```tsx
// Inline duplicate detection matching wireframe
// Warning-bordered comparison card
// Form with proper field layout
```
**API Hooks:** `useClientDuplicateCheck`, `useCreateClient`
**Features:** Real-time duplicate checking, confidence scoring

---

# Phase 5: SES-01 Session Workspace
*Session interface matching wireframe*

## Tasks

### 5.1 Update SessionWorkspace Layout (M)
**File:** `app/(app)/clients/[id]/session.tsx`
- Integrate SessionBar at top
- Split: product catalogue (left) + session rail (right)
- Dark session bar with client context

### 5.2 Update Session Product Catalogue (M)
**File:** `src/features/session/ProductCatalogue.tsx`
- Use pcard components in 4-column grid
- Search + sort chips integration
- Fit filter chip based on client profile
- Product scoring and recommendations

### 5.3 Update SessionRail (M)
**File:** `src/features/session/SessionRail.tsx`
- Client summary at top
- AI stylist integration
- Session tray with verdict tags
- Session notes with autosave
- 'Create order from tray' primary CTA

### 5.4 Update AI Stylist Integration (S)
**File:** `src/features/session/AIStyler.tsx`
- Match wireframe layout and interactions
- Integration with existing AI stylist API

---

# Phase 6: Client View + Privacy Mode
*Client-facing interface and privacy controls*

## Tasks

### 6.1 Create Client Fitting Review (L)
**File:** `src/features/fitting/ClientFittingReview.tsx`
```tsx
// Screen 14: CLIENT VIEW mode
// Green mode strip with "CLIENT VIEW" text
// Large heading 'Your fitting'
// 4-column photo grid with 280px tall placeholders
// Verdict prompt card with large buttons
```
**Classes:** 
- Mode strip: `bg-mode-client text-color-text-inverse`
- Larger typography: `text-heading-xl` for main heading
- Verdict buttons: Large touch targets, proper color coding

### 6.2 Update Privacy Mode Integration (M)
**Files:** Multiple components
- Ensure all client-facing screens use larger typography
- Hide sensitive data (LTV, internal tags, pricing) in client-visible mode
- Green mode strip for CLIENT VIEW
- Staff mode strip (2pt brand color)

### 6.3 Update PrivacyModeProvider (S)
**File:** `src/features/privacy/PrivacyModeProvider.tsx`
- Ensure proper state management for client view
- Hand-to-client functionality
- Biometric unlock for returning to staff mode

---

# Phase 7: Polish + Integration Testing
*Final refinements and testing*

## Tasks

### 7.1 Accessibility Review (M)
- All interactive elements meet 44pt minimum touch targets
- Text scales with Dynamic Type
- VoiceOver labels for all components
- Color contrast meets AAA in client-visible mode

### 7.2 Offline Behavior Testing (M)
- All components handle offline gracefully
- Proper loading states and error handling
- Sync queue integration for writes

### 7.3 Performance Optimization (S)
- Image optimization for product thumbnails
- List virtualization where needed
- Memory usage review

### 7.4 Integration Testing (L)
- End-to-end flow testing
- Privacy mode transitions
- Session persistence across tab switches
- Photo capture and upload flows

---

# Implementation Notes

## Design Token Usage
- Use semantic color tokens: `bg-color-brand`, `text-color-text-primary`
- Typography scale: `text-body-lg` for default body text, `text-heading-xl` for titles
- One-accent rule: `color-brand` only on single primary CTA per screen

## Privacy Mode Considerations
- All client-facing components must support larger typography
- Sensitive data (LTV, internal tags) hidden in client-visible mode
- Mode strips: staff (2pt brand), client (6pt success with label)

## Accessibility Requirements
- 44pt minimum touch targets
- 17pt minimum body text (20pt in client-visible mode)
- AAA contrast in client-visible mode
- VoiceOver support for all interactive elements

## API Integration
- All existing TanStack Query hooks remain unchanged
- New hooks needed: `useClientDuplicateCheck`, specialized wishlist hooks
- Offline sync for all write operations

## Component Reuse
- Maximize reuse of existing components (ProfileSectionCard, sheets)
- Build new components that can be reused across features
- Follow existing patterns for state management and API integration

## Estimated Timeline
- Phase 0: 2 days (design tokens)
- Phase 1: 5 days (core components)
- Phase 2: 3 days (client list)
- Phase 3: 8 days (profile screens)
- Phase 4: 10 days (sheets)
- Phase 5: 4 days (session)
- Phase 6: 5 days (client view)
- Phase 7: 3 days (polish)

**Total: ~40 days** (8 weeks for 2-person team)