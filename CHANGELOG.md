# Changelog

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