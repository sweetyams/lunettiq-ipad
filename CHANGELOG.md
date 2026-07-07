# Changelog

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