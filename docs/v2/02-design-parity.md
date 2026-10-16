# Phase D — Design parity with the Foundry Builder

**Date:** 2026-10-16 · **Status:** proposal, phase added to [TASKS.md](TASKS.md)
**Goal:** every iPad screen and flow looks and behaves like it belongs next to the new Builder: white, quiet, precise, with status shown by small badges and dots, never by grey slabs or coloured edges.

---

## 1. What the Builder actually is

The Builder isn't a one-off skin. It's **Found UI**, Foundry's shared system (`foundry/src/app/globals.css`, `src/lib/ui/*`, `docs/found-ui-patterns.mdx`, `docs/design-system/authoring.md`). Its rules:

| Principle | How the Builder does it |
|---|---|
| **White first** | Page, cards, panels, inspectors are all `--background` / `--card` = white. Grey (`--muted` `#F7F7F7`) appears only in tiny accents: a selected segment, a hovered row, an input well. |
| **Depth from lines, not fills** | Hairline borders `--border` `#E4E4E7`. Elevation is a 1px ring plus a soft shadow (`shadow-raised`, `-float`, `-overlay`), never a grey background. |
| **Near-black is the action colour** | Primary buttons are `--primary` `#171717` ("Save & Publish"). Everything else is outline or ghost. One primary per view. |
| **Status is a small object** | `Badge` = tinted background + 1px inset ring + coloured text (success, warning, danger, info), or a 6–8px `StatusDot`. No coloured left borders, no full-width coloured strips. |
| **Quiet secondary text** | `--muted-foreground` `#71717A`, `--dim` (same at 60%). Uppercase micro-labels with letter spacing for section titles ("TYPOGRAPHY", "SPACING"). |
| **Compact, consistent controls** | Segmented controls (`EN \| FR`, `Visitor \| Signed in`), control heights from tokens, 8–10px radius, icon buttons in light toolbars, one dark floating toolbar. |
| **Composition over styling** | Pages compose `PageHeader`, `PageSection`, `SectionHeader`, `Toolbar`, `Badge`, `EmptyState`. Raw spacing/colour utilities are banned in page files and linted. |
| **Content is the hero** | Product photography edge to edge, captions in small type underneath (`Fig. 06 · May 7, 2026 · FIG-06`). Chrome stays out of the way. |

### Builder tokens, converted for React Native

Foundry defines these in OKLCH; React Native needs hex. Converted values:

| Role | Found UI token | Hex |
|---|---|---|
| Page / card | `--background`, `--card` | `#FFFFFF` |
| Text | `--foreground` | `#0A0A0A` |
| Primary action | `--primary` | `#171717` |
| Secondary text | `--muted-foreground` | `#71717A` |
| Subtle fill (accents only) | `--muted` | `#F7F7F7` |
| Hairline | `--border` | `#E4E4E7` |
| Focus ring | `--ring` | `#A1A1AA` |
| Success text / bg / ring | `--success*` | `#008053` / `#E6F7EE` / `#B1E1C9` |
| Warning text / bg / ring | `--warning*` | `#C76A18` / `#FCF3E2` / `#EDD5A3` |
| Info text / bg / ring | `--info*` | `#0077BA` / `#E7F5FF` / `#B2DAF9` |
| Danger | `--destructive` | `#E7000B` (badge: 10% bg, 20% ring) |

Font: the Builder uses **Inter**, with the Apple system font as its fallback. On the iPad we use the system font (SF Pro, which Inter is modelled on): it has real weights and Dynamic Type. Registering Inter's weights as separate font families would break bold and medium text everywhere.

---

## 2. Where the iPad is today

### Measured (static scan of `app/` + `src/`, 123 files with issues)

| Problem | Count | Why it matters |
|---|---|---|
| Grey surface fills (`bg-bg-surface`, `bg-bg-muted`, skeleton greys on cards) | **288** | Every card is a grey slab; the screen reads heavy and dated. The Builder uses white cards on white with hairlines. |
| Hardcoded hex colours | **305** | Bypasses tokens; colours drift per screen. |
| Text below 14px (`caption-md` 12px, raw 10–13px) | **266** | Too small for a client without glasses; also off the Builder scale. |
| Heavy brand-blue buttons (`bg-brand`) | **85** | Several full-width blue buttons per screen compete; the Builder has one near-black primary. |
| Classes that don't exist (`bg-warmGrey`, `bg-navy`, `bg-green/20`, `bg-muted`…) | **79** | Silently render nothing: missing badges, invisible states. Left over from the old palette. |
| `Alert.alert` system dialogs | **30** | Native grey iOS alerts break the visual language (also task 0.5). |
| Coloured left-edge status bars | **10** | "Old platform" status indication; replaced in the Builder by badges and dots. |
| No custom font loaded | — | Config names "General Sans" but nothing loads it; everything renders in the system font. |

### Shell (seen on every screen)

- **Demo strip:** full-width orange bar across the top. Builder equivalent is a small `draft`/status pill in the header.
- **Floating tab bar:** fine in principle (it's close to the Builder's dark floating toolbar), but red count bubbles on every tab are loud. Use quiet counts or dots.
- **Session bar:** solid black chrome band; should be a slim white header with a live dot, like the Builder's top bar.
- **Dev "Tools" gear and lock tab** float over content; the lock tab is a grey slab.

---

## 3. Screen and flow inventory

Every route and the main flows, with what's wrong and the target. "Pattern" = which shared component replaces the bespoke code.

| # | Screen / flow | Today | Target |
|---|---|---|---|
| D3.1 | **Floor** (`home/index`) | Grey appointment cards with orange left edge for "arrived"; full-width blue/black buttons on every card; four grey widget boxes on the right | White list of appointment rows (time · client · service · status badge) with one compact action each; right rail as white `PageSection`s; demo pill in header |
| D4.1 | **Clients list** (`clients/index`) | Grey selected row + blue left edge; giant black "?" avatar; grey secondary buttons; blue primary | Builder-style list (hairline rows, selected = subtle fill + bold); preview as white panel with `StatCard`s, outline buttons, one primary |
| D4.2 | **Client profile** (`clients/[id]` + Overview / Clinical / History / Relationships) | Every section a grey card; 12px text everywhere (39 small-text hits in `SupportingPanels`); dashed grey "gap" chips | `PageSection`s with `SectionHeader` (title + action), key-value rows, badges for tags; inspector-style left rail |
| D4.3 | **New client** (`clients/new`) | Grey form wells, blue CTA | Builder form layout: labelled fields, one primary |
| D4.4 | **Profile sheets** (Contact, Notes, Fit, Clinical notes, Prescription, Insurance, Lifestyle, Preferences, Tags, Link client, Multi-pair results) | Each sheet styled differently; grey inputs; hex colours | One `Sheet` pattern: header with title + close, sections, footer with primary |
| D5.1 | **Visit workspace** (`clients/[id]/session`) | Black chrome bar, grey product cards, grey right rail | Builder canvas: white catalogue grid with photography as hero (like the Builder's "Latest" grid), inspector-style right rail |
| D5.2 | **Fitting** (`clients/[id]/fitting`, CompareView, FrameDetailPopover, Consent) | Grey shelf, hex colours, mixed controls | Camera stays full-bleed; shelf + verdicts as white floating toolbar |
| D5.3 | **Handed to client** (`HandedToClientView`) | Mixed | Client-facing: larger type, Lunettiq brand, no staff chrome |
| D5.4 | **End visit** (`EndSessionSheet`, `EndSessionFlow`) | Grey outcome tiles, hex colours | Outcome as selectable white tiles with ring when selected; Builder stepper |
| D6.1 | **Schedule** today / week / staff (`appointments/*`) | Left-edge status, grey cells, blue buttons | White calendar grid, status dots, compact toolbar with `SegmentedControl` (Today / Week / Staff) |
| D6.2 | **Appointment sheets** (Create, Edit, Detail panel, Walk-in, Follow-up) | 12+ hex colours each, grey wells | `Sheet` pattern + form fields |
| D7.1 | **Products** list / detail / scanner (`products/*`) | Grey everywhere (16 fills on detail) | Photography-first grid and detail like the Builder canvas; spec rows as key-values |
| D7.2 | **Configurator + order summary** | Non-existent tokens (9) | Stepper + running total in a white side panel |
| D8.1 | **Orders** | White-ish but grey cards | White cards with hairlines, stage `Badge`, age `Badge` |
| D8.2 | **Follow-ups** | Grey rows + left edges (just built in 0.8) | White rows, due `Badge`, priority dot, formatted phone |
| D8.3 | **Review** | Same as Follow-ups | Same pattern; anomaly as danger `Badge` |
| D9.1 | **Profile / Store / Tools** (`profile/index`) | Grey grouped rows (iOS settings look), hex icons | Builder `SettingsPanel` rows, white |
| D9.2 | **Settings, Second Sight, Custom Design** (`more/*`) | Heaviest offenders (42 issues in CustomDesignFlow) | Same patterns; these are V3/V4 side paths, so lower priority |
| D9.3 | **Sign-in, PIN lock, store picker, initial sync** | Recently branded (0.3); PIN pad uses hex + StyleSheet | Tokens only; store picker as Builder list |
| D10 | **States**: loading, empty, error, toasts, 30 `Alert.alert` | Inconsistent; native alerts | `EmptyState`, `ErrorState`, toast and confirm `Sheet` patterns (absorbs task 0.5) |

---

## 4. Target system for the iPad

**One sentence:** *Builder chrome, Lunettiq content.* Staff-facing UI uses Found UI's neutral system exactly; client-facing moments (photography, handed mode, client view) carry the Lunettiq brand.

### Tokens (D0)

- Replace the colour block in `tailwind.config.js` and `design-tokens.fallback.ts` with the converted Found UI values above. Keep Lunettiq blue as `brand` for identity moments only.
- **Surfaces:** `bg-page` and `bg-surface` both white; new `bg-subtle` (`#F7F7F7`) for accents only.
- **Type scale for touch.** The Builder's 14px body is for a desktop editor at arm's length. The iPad keeps the same hierarchy, one step larger, with a 14px floor:
  - title 28
  - heading 20
  - section 17
  - body 16
  - caption 14
  - micro-label 13, uppercase, tracked (labels only)
- **Radius:** 10 for cards, 8 for controls, full for pills.
- **Elevation:** `raised`, `float` and `overlay` as React Native shadow presets plus a hairline. No grey backgrounds for depth.
- **Font:** system font (SF Pro) for UI and numbers; "General Sans" (configured, never loaded) removed.

### Components (D1), in `src/ui/kit/`

| Component | Builder source | Replaces |
|---|---|---|
| `Screen`, `PageHeader` (title, subtitle, actions, status pill) | `AdminPage`, `PageHeader` | 20+ hand-built headers, the orange demo strip |
| `Section` (+ `SectionHeader`: uppercase label, count, action) | `PageSection`, `SectionHeader` | Grey `Card`s |
| `Badge` (neutral, success, warning, danger, info, outline) + `StatusDot` | `Badge`, `StatusDot` | Left-edge bars, status pills built per screen |
| `Button` (primary, secondary/outline, ghost, danger; sm/md/lg) | `Button` | 85 `bg-brand` buttons |
| `SegmentedControl` | `SegmentedControl` | Filter pill rows, Today/Week/Staff |
| `ListRow` (leading avatar or icon, title, subtitle, trailing badge/value, chevron) | list rows | Client rows, follow-ups, review, settings rows |
| `KeyValue` rows | Inspector fields | Profile sections, product specs |
| `StatTile` | `StatCard` | Quick stats, Orders summary |
| `Avatar` (white with ring, initials) | — | Black/grey circles |
| `Sheet` (header, scroll body, footer) | dialogs | 15+ bespoke sheets |
| `EmptyState`, `ErrorState`, `Confirm` | same | `Alert.alert`, mixed states |
| `Toolbar` / floating dark toolbar | Builder bottom toolbar | Tab bar refinements, fitting shelf |

### Rules (enforced by extending `pnpm audit:design`)

1. No grey fills on cards, rows or panels. `bg-subtle` only on selected or pressed states and input wells.
2. Status is a `Badge` or `StatusDot`. Coloured borders on one side are banned.
3. One primary (near-black) button per view. Brand blue only for identity moments.
4. No text under 14px; micro-labels at 13px are labels only.
5. Screens compose kit components. Raw colours and hex in `app/` fail the audit, and class names must exist in the config.
6. No `Alert.alert`: confirmations are `Confirm` sheets, feedback is toasts.

---

## 5. Phase D tasks

Sequenced so later work (Sprint 1 visit spine) builds on the kit instead of being redone.

| # | Task | Covers |
|---|---|---|
| D0 | Tokens + Inter font + type scale + elevation presets | `tailwind.config.js`, `design-tokens.fallback.ts`, font loading |
| D1 | Kit components (table above) with a kit preview screen for review | `src/ui/kit/*` |
| D2 | App shell: header status pill instead of demo strip, quiet tab badges, slim session bar, lock tab | `_layout`, `DemoStrip`, `FloatingTabBar`, `SessionBar` |
| D3 | Floor | §3 D3.1 |
| D4 | Clients: list, profile + tabs, new client, all profile sheets | D4.1–D4.4 |
| D5 | Visit: workspace, fitting, handed mode, end visit | D5.1–D5.4 |
| D6 | Schedule + appointment sheets | D6.1–D6.2 |
| D7 | Products + configurator | D7.1–D7.2 |
| D8 | Orders, Follow-ups, Review | D8.1–D8.3 |
| D9 | Profile, settings, auth, store picker, side paths | D9.1–D9.3 |
| D10 | States, toasts, confirmations; remove all `Alert.alert` | D10 (absorbs S0 task 0.5) |
| D11 | Enforcement + visual QA: audit rules 1–6 failing on violations, before/after screenshots of every screen | whole app |

**Order of work:** D0 → D1 → D2 → D3 (Floor as the reference screen; review it before going wide) → D8 → D4 → D5 → D6 → D7 → D9 → D10 → D11.
