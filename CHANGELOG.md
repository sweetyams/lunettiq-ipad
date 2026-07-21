# Changelog

## [2026-07-21] — Design Drift Fixes

### Fixed
- Replaced hardcoded colors with design tokens across 5 components:
  - HandedToClientView: Fixed exit strip background and text styling to use proper design tokens
  - VerdictControl: Updated verdict colors to match design system (loved, liked, unsure, rejected)
  - AiStylistPanel: Replaced arbitrary bg-[#005D23] with bg-success token
  - DevErrorBoundary: Fixed hardcoded colors and small font sizes with proper token classes
  - ClientContextPanel: Replaced hardcoded icon color with text-text-muted class
- All changes maintain visual consistency while ensuring compliance with design system token usage

## [2026-07-21] — Accessibility Audit Fixes

### Fixed
- Added missing accessibilityLabel and accessibilityRole props to 45+ interactive elements across session, fitting, and UI components for VoiceOver compatibility
- Session files: EndSessionFlow.tsx, ProductBrowserPanel.tsx, SessionBanner.tsx, StartSessionButton.tsx
- Second Sight flow: camera permissions, photo capture, condition selection, grade selection, client decision buttons
- Custom Design flow: step navigation, photo management, material selection, date picker, form submission
- UI components: AppointmentCard check-in/session buttons, ClientRow selection, ConsentModal buttons, DevErrorBoundary retry buttons
- Client profile: interaction timeline, preferences editing, loyalty credit issuing, receipt resending buttons

## [2026-07-21] — Phase 5 & 6: Offline Sync, Push, Rx Workflows, Full API Coverage

### Added — Phase 5 (Critical Infrastructure)
- **Offline sync wiring** — `useInitialSync` now persists products/appointments to WatermelonDB via `database.batch()`. `useIncrementalSync` persists on 5min/24h intervals.
- **Offline fallback hooks** (`src/sync/useOfflineFallback.ts`) — `useOfflineProducts`, `useOfflineClients`, `useOfflineAppointments`, `useOfflineClient` read from WatermelonDB when network fails
- **Offline write hook** (`src/sync/useOfflineWrite.ts`) — `useOfflineMutation` enqueues to sync_queue when offline, calls API directly when online
- **SyncProvider reconnect** — triggers `SyncEngine.start()` and `PhotoUploadWorker.start()` on offline→online transition and app foreground
- **Push notifications** — `usePushSetup` hook registers Expo push token on login, deregisters on logout. `PushProvider` handles foreground notifications as toasts
- **Inventory protections** — `useCreateProtection`, `useExtendProtection`, `useReleaseProtection`, `useResolveBarcode` hooks
- **Shortlist with hold** — `useShortlistWithHold` creates 48h try_on_hold when shortlisting in fitting mode
- **Camera integration** — Fitting screen now renders real `CaptureView` component (was placeholder)
- **Idempotency keys** — `SyncEngine.executeRequest` includes `Authorization`, `X-Found-Surface`, `Idempotency-Key` headers. Uses `nanoid` for unique keys
- **Permission gating** — `usePermissions` hook reads Clerk JWT org_permissions. `PermissionGate` component for conditional rendering
- **Settings screen** — `app/(app)/more/settings.tsx` with sync status, cache stats, account info, force sync, about section

### Added — Phase 6 (Optical Workflows)
- **Loyalty Credits** — `useLoyaltyBalance`, `useIssueCredit` hooks + types
- **Rx Pipeline** — `useRxPipelineOrders`, `useRxPipelineCounts`, `useCreateRxOrder`, `useUpdateRxOrder` + pipeline list screen with state filters
- **Rx Approvals** — 13 hooks covering full state machine (claim, release, sign-off, return, reject, heartbeat, checklist, readiness) + approval queue screen
- **Prescriptions** — `usePrescriptions`, `usePrescription`, `useCreatePrescription`, `useUpdatePrescription` hooks
- **Multi-Pair** — 8 hooks for recommendations, questionnaires, insurance profiles, settings
- **Insurance Receipts** — `useReceipts`, `useReceipt`, `useSendReceipt`, `useRegenerateReceipt` hooks

### Changed
- `SyncProvider` now imports and triggers SyncEngine/PhotoUploadWorker (was passive connectivity check only)
- `SyncEngine.enqueue()` generates nanoid idempotency keys
- More screen navigation updated with Rx Pipeline and Rx Approvals (permission-gated)
- Fitting screen `SessionPhoto` type now includes `isShortlisted` and `holdId` fields

## [2026-07-21] — API Contract Alignment with Foundry Handoff

### Changed
- **Path prefixes fixed to match live Foundry routes:**
  - `/api/admin/clients/**` → `/api/clients/**` (legacy module, no admin prefix)
  - `/api/admin/inventory/**` → `/api/inventory/**` (legacy module, no admin prefix)
  - `/api/admin/loyalty/**` → `/api/loyalty/**` (legacy module, no admin prefix)
  - `/api/admin/media/upload` → `/api/media/upload` (photo uploads, no admin prefix)
- **Photo upload rewritten:** Replaced 3-step presigned R2 URL flow with single multipart `POST /api/media/upload` (Vercel Blob). Server normalizes images. No confirm step needed.
- **Auth retry logic:** Removed `skipCache` (doesn't exist in Clerk Expo). Now uses 1s delay + second `getToken()` call as the native pattern.
- **Steering file `10-foundry-api.md`** fully rewritten with complete endpoint reference.

### Added
- Rx Approvals module (13 routes) — remote optician review workflow
- Multi-Pair Recommendations module (8 routes) — insurance-aware suggestions
- Insurance Receipts module (4 routes) — PDF receipt view/send
- Prescriptions module (4 routes) — Rx record management
- Rx Pipeline module (5 routes) — Rx order state tracking
- Push Notifications module (2 routes) — Expo push token registration
- Configurator module (3 routes) — lens/frame configuration flows
- Second Sight module (4 routes) — trade-in intake CRUD
- Custom Designs module (4 routes) — design intake CRUD
- Wishlist Groups (3 routes) — multi-pair wishlist bundling
- Settings & Taxonomy (3 routes) — locations, filters, project settings
- Path prefix convention table documenting legacy vs admin vs storefront prefixes
- Idempotency details (endpoints wired, cache behavior, replay header)
- Rate limit documentation (200 req/min for tablet surface)
- Error code table with specific iPad actions per error

### Fixed
- `src/sync/PhotoUploadWorker.ts` — rewritten from presigned R2 to multipart upload
- `src/camera/BarcodeScanner.tsx` — `/api/admin/inventory/scan/resolve` → `/api/inventory/scan/resolve`
- `app/(app)/clients/[id].tsx` — 3 stale `/api/admin/clients/` paths
- `app/(app)/clients/index.tsx` — 2 stale `/api/admin/clients/` paths
- Steering files (03, 07, 11, 16) — path corrections throughout
- `README.md` — updated API surface section
- `src/camera/README.md` — upload docs + barcode scan path

## [2026-07-07] — Second Sight Trade-In Flow (SSI-01 through SSI-06)

### Added
- Complete Second Sight intake flow implementation (6 steps: Identify, Photos, Grade, Credit, Decision, Confirmation)
- `src/features/second-sight/second-sight.types.ts`: TypeScript interfaces, grade credit mapping ($75/$50/$25), tier multipliers (cult 1.15x, vault 1.25x)
- `src/features/second-sight/useSecondSightStore.ts`: Zustand wizard state managing 6-step flow, photo slots, grade selection, credit calculation
- `src/features/second-sight/SecondSightFlow.tsx`: Main wizard component with camera integration, step validation, API integration
- `src/api/useSecondSight.ts`: TanStack Query hooks for create, update, approval, credit issuance
- `app/(app)/more/second-sight.tsx`: Route screen accepting clientId/clientName/clientTier params
- `app/(app)/more/second-sight-demo.tsx`: Demo screen with sample clients for testing
- Camera capture using expo-camera with 4 required photo slots (Front, Left, Right, Lenses)
- Credit calculation with tier multipliers (essential 1.0x, cult 1.15x, vault 1.25x)
- Step validation preventing progression without required data
- Brand-compliant UI: navy/green palette, 44pt touch targets, 17pt min text, border-based depth

### Changed
- Updated `app/(app)/more/_layout.tsx` to include second-sight and second-sight-demo routes
- Migrated from deprecated Camera API to CameraView with useCameraPermissions hook

### Fixed
- Import paths for API integration between features and api directories
- TypeScript compilation issues with camera permissions and nullable types

## [2026-07-07] — SES-01 Session Workspace (Full Implementation)

### Added
- `src/features/session/SessionTopBar.tsx`: Session-specific TopBar with navy chip (live duration timer, client name), SyncIndicator, PrivacyToggle, "End session" ghost button, "Start fitting" green primary button
- `src/features/session/ProductBrowserPanel.tsx`: Embedded product browser for session context with "Browsing for {client}" header, 3-column grid, best-match sort using suggestions API scores, debounced search, stock/sort filters, infinite scroll
- Enhanced `src/features/session/ClientContextPanel.tsx`: Full data wiring with fit profile (face shape, frame/bridge width), preferences (from enrichment.customFields), frames tried this session (with verdict color icons), session notes with 30s autosave indicator, recent activity timeline (staff-only, last 5 interactions)
- `useSessionStore` now persisted via MMKV — session survives tab switches, app backgrounds, and restarts
- `WorkContext` type exported: `'idle' | 'session' | 'fitting'`
- Session lifecycle methods: `startSession(clientId, clientName)`, `endSession()`, `startFitting()`, `endFitting()`
- Generated session IDs (`ses_timestamp_random`)
- Session notes stored in state with `markNotesSaved()` autosave tracking

### Changed
- Rewrote `app/(app)/clients/[id]/session.tsx` from scaffold to full SES-01 workspace: SessionTopBar + split layout (flex-[762] products left, flex-[492] context right)
- `useSessionStore` migrated from basic Zustand to MMKV-persisted with full lifecycle and `clientName` storage
- `app/(app)/clients/[id]/fitting.tsx` updated to use new session store API (`startFitting`/`endFitting` instead of `setMode`)
- ConsentModal now displays actual client name from session store
- `app/(app)/products/[id].tsx` fixed to use `'idle'` instead of removed `'discovery'` mode
- Updated session barrel export (`src/features/session/index.ts`) with all new components and type exports

### Integration details
- Products panel fetches via `useProducts` + `useSuggestions(clientId)` → merged score map for fit sorting
- Client context panel fetches via `useClient(clientId)` + `useInteractions(clientId)`
- Session starts automatically when navigating to workspace (if not already active for this client)
- Back button preserves session — session persists across navigation
- Start fitting navigates to fitting screen with proper state transition
- End session shows EndSessionSheet, then resets store and navigates back
- Privacy mode: tier/orders/activity hidden in client-visible mode, prices hidden in product cards

## [2026-07-07] — Products Feature Complete (PRD-01 + PRD-02)

### Added
- `src/api/products.types.ts`: Full Foundry API types including `ProductViewHints`, `ScoredProduct`, `ProductInteraction`, `CreateProductInteractionParams`
- `src/api/useSuggestions.ts`: Hook for client fit scoring via `/api/admin/clients/{id}/suggestions`
- `src/api/useProductInteractions.ts`: Mutation hook for logging product interactions (viewed, tried_on, liked)
- `src/ui/FilterPillRow.tsx`: Horizontal-scroll multi-select pill filter with accessible states
- `src/ui/FitBadge.tsx`: Score-based fit indicator (Good fit ≥5, Close match ≥3)
- `src/ui/StockDot.tsx`: Color-coded stock dot (in/low/out)
- `app/(app)/products/index.tsx`: Full PRD-01 grid screen with 4/3-col responsive grid, debounced search, stock filters, sort options, session-aware "Best match" auto-sort, stale data timestamp, infinite scroll
- `app/(app)/products/[id].tsx`: Full PRD-02 detail screen with hero carousel (useWindowDimensions width), variant color chips, fit check band, dimensions table, inventory (staff-only), ActionBar with session-aware actions

### Changed
- `src/ui/ProductCard.tsx`: Enhanced with FitBadge, StockDot, owned state (70% opacity + badge), press animation
- `src/api/useProducts.ts`: Updated to match full Foundry response shape with ProductListResponse typing
- `src/api/index.ts`: Added all new product-related exports
- `src/ui/index.ts`: Added FilterPillRow, FitBadge, StockDot exports

### Integration details
- Products grid fetches from `/api/admin/products` with stock/search/offset params
- Suggestions API called when session active → scores merged into grid cards
- Product interactions logged on detail screen: 'viewed' on mount (once per session), 'tried_on' on fitting press, 'liked' on wishlist press
- Privacy mode: prices hidden in client mode (tap-to-reveal), inventory section staff-only
- Offline: TanStack Query cache (10min stale), "As of HH:MM" indicator, graceful degradation

## [2026-07-07] — HOME-01 Today Screen (Full Implementation)

### Added
- Full HOME-01 Today screen with real data integration
- `useRecentClients` hook — fetches 5 most recently updated clients via `GET /api/clients?sort=updatedAt&limit=5`
- `useActiveHolds` hook — fetches all active try-on holds via `GET /api/admin/inventory-protections?reason=try_on_hold` with graceful 404 handling
- `ActiveHoldsCard` component — shows active inventory holds with product name, variant, and expiry countdown; hidden in client-visible privacy mode
- `RecentClientsCard` component — displays 5 most recent clients with avatar initials, name, and relative time
- `QuickActionsGrid` component — 2×2 grid (Search clients, New client, Browse products, Second Sight) with proper accessibility labels
- `onLongPress` prop on `AppointmentCard` for context menu support
- Long-press context menu on appointments (Mark No-show, View profile)
- Pull-to-refresh on appointment list via RefreshControl
- Appointment sorting: in_progress first, then by start time, completed/no-show last

### Changed
- Rewrote `app/(app)/home/index.tsx` from placeholder to full-featured HOME-01 screen
- Updated `ClientSearchParams` type to support `sort` field
- Updated barrel exports in `src/ui/index.ts` and `src/api/index.ts`
- Check-in and Start session are separate actions per spec (Start session only available on in_progress appointments)

## [2026-07-07] — Full Appointments & Scheduling Feature

### Added
- Expanded `appointments.types.ts`: `AppointmentStatus` union, `AppointmentType`, `StaffSchedule`, `InventoryHold`, `IntakeFormType`, full `Appointment` interface with staffName, intakeFormType, reminderSentAt, reminderPreference, inventoryHoldCount
- New API hooks: `useTodayAppointments` (auto-date + 5min refetch), `useWeekAppointments` (7-day range), `useStaffSchedules`, `useAppointmentHolds`, `useCheckIn`, `useMarkNoShow`
- Full Appointments tab screen with iPad split layout (420px appointment list left, detail panel right)
- Today/Week view toggle in appointments header with stats row (active, upcoming, staff on duty)
- Week View screen with 7-day calendar strip, week navigation, appointment count badges, time-slot layout, staff sidebar
- `AppointmentDetailPanel` component: status badge, intake form hints, detail grid (time/date/staff/reminder), inventory holds (staff-only), notes (staff-only), action buttons (check-in, start session, view profile, mark no-show with confirmation), terminal state messaging
- `src/features/appointments/` directory with barrel export
- Home screen now shows today's appointments using `useTodayAppointments` with priority sorting
- "All Appointments" quick action on Home screen

### Changed
- Home screen displays real appointment cards instead of static empty state
- Appointments layout registers both index and week routes
- API barrel (`src/api/index.ts`) exports all new appointment hooks and types

## [2024-07-07] — Complete Clients Feature

### Added
- Complete Clients feature with iPad split-view layout
- Updated `src/api/clients.types.ts` to match actual Foundry API response format (using id instead of shopifyId)
- Updated `src/api/useClients.ts` to use correct API path `/api/clients` (not `/api/admin/clients`)
- New component: `ClientRow` for list display with avatar, name, email, and last activity
- Full clients list screen with debounced search (300ms), loading states, and error handling
- Complete client detail panel with contact info, order stats, tags, and action buttons

### Changed
- Button component now supports `className` prop for layout flexibility
- Client detail screen uses new Client type structure and proper currency formatting
- Removed privacy mode dependencies (using consistent design system colors)

### Fixed
- TypeScript compilation errors in client-related components
- Proper debounced search implementation with useEffect
- Button component variants now use design system color tokens

## [2024-07-07] — Privacy Toggle UI & ModeStrip

### Added
- New component: ModeStrip shows privacy mode at top (2px staff, 22px client with "CLIENT VIEW" text)
- New component: PrivacyToggle button with Eye/EyeOff icons, 44pt touch target
- New component: SyncIndicator shows connection status with colored dot + optional count badge  
- New component: TopBar reusable bar with title, session chip, sync indicator, and privacy toggle
- Updated ModeStrip integration in root layout to display at very top of app
- Added warning and blue color tokens to tailwind config

### Changed
- Updated UI barrel export to include new privacy and sync components

## [2024-07-07] — Appointments/Today Feature

### Added
- Appointments/Today feature (HOME-01 screen implementation)
- `src/api/appointments.types.ts` with appointment data types and list parameters
- `src/api/useAppointments.ts` with TanStack Query hooks for fetching and updating appointments
- `src/ui/AppointmentCard.tsx` component with status styling, privacy mode, and action buttons
- Updated `app/(app)/home/index.tsx` to show today's appointments in split-view layout
- Quick actions panel with navigation to clients, products, and new client creation
- Loading, error, and empty states for appointment list
- Pull-to-refresh functionality for appointment data
- Privacy mode support (hides client names and notes in client-visible mode)

### Changed
- Updated API barrel exports to include appointment hooks and types
- Updated UI barrel exports to include AppointmentCard component

## [2024-07-07] — Client Timeline (Interactions) Feature

### Added
- Client timeline feature displaying client interaction history
- `src/api/interactions.types.ts` with interaction data types
- `src/api/useInteractions.ts` with TanStack Query hooks for fetching and creating interactions
- `src/ui/TimelineEntry.tsx` component with privacy mode support and interaction type icons
- `src/features/session/ClientTimeline.tsx` with add note functionality and FlatList display
- Timeline sorted by occurredAt descending (most recent first)
- Add note functionality with TextInput and save/cancel actions
- Privacy mode filtering (internal notes hidden in client-visible mode)
- Loading, error, empty state handling following project patterns
- Lucide icons for different interaction types (MessageSquare, Phone, MapPin, Mail, etc.)
- Comprehensive test coverage for both components

### Changed
- Updated `src/api/index.ts` barrel to export interactions hooks and types
- Updated `src/ui/index.ts` barrel to export TimelineEntry component
- Fixed client profile screen to use correct `shopifyId` field from ClientProfile type

### Fixed
- Client profile screen references to use `shopifyId` instead of non-existent `id` field
- Button component usage to follow established patterns without className prop

## [2024-07-07] — Product Detail Screen

### Added
- Product detail screen at `app/(app)/products/[id].tsx` with full feature set
- Hero image carousel with horizontal scroll and empty state fallback
- Identity block with product title, vendor, and price (privacy-aware)
- Variant selector for color variants with chip-based UI
- Tap-to-reveal price functionality in client-visible mode
- Dimensions/details section for product metafields
- Staff-only inventory section with stock badges (In stock/Low stock/Out of stock)
- ActionBar with session-aware primary actions (Start session/Add to session)
- Privacy mode support (price hiding, inventory hiding in client mode)
- Loading, error, empty, and content state handling

### Changed
- Updated products layout to include [id] screen route

## [2024-07-07] — Authentication Implementation

### Added
- Login screen with Clerk email/password authentication
- Auth redirect screen pointing to login
- Token cache using expo-secure-store for persistent auth
- Root layout with auth state management and routing
- TypeScript definitions for NativeWind and environment variables
- Basic home screen placeholder
- API client integration with Clerk token getter

### Changed
- Updated root layout to handle authenticated vs unauthenticated states
- Added auth routing logic (redirect to login when not signed in, redirect to app when signed in)

### Fixed
- NativeWind TypeScript integration with proper type definitions
- Environment variable TypeScript definitions