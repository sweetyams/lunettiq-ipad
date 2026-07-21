# Second Sight Trade-In Feature

## Overview

Second Sight is Lunettiq's trade-in program where clients bring old frames and receive store credit based on condition grading. The intake flow guides staff through a 6-step process to document, grade, and process trade-ins.

## Files Created

### Types & State
- `src/features/second-sight/second-sight.types.ts` - TypeScript interfaces and constants
- `src/features/second-sight/useSecondSightStore.ts` - Zustand wizard state management
- `src/features/second-sight/useSecondSightStore.test.ts` - Unit tests for the store

### API Integration
- `src/api/useSecondSight.ts` - TanStack Query hooks for Foundry API

### Components
- `src/features/second-sight/SecondSightFlow.tsx` - Main wizard component
- `src/features/second-sight/index.ts` - Barrel export

### Screens
- `app/(app)/more/second-sight.tsx` - Route screen
- `app/(app)/more/second-sight-demo.tsx` - Demo/testing screen

## The 6-Step Flow

### Step 1: Identify Frame
- Brand/model text inputs
- Condition picker (Excellent/Good/Fair)
- Fallback free-text description

### Step 2: Photo Capture
- 4 required photos: Front, Left Side, Right Side, Lenses
- Uses expo-camera with proper permissions
- Each slot shows thumbnail after capture

### Step 3: Grade Selection
- Three grade options: A ($75), B ($50), C ($25)
- Visual cards with grade descriptions
- Single selection required

### Step 4: Credit Calculation
- Shows: Base credit × tier multiplier = final credit
- Displays client tier badge
- Manager override option (future)

### Step 5: Client Decision
- Two buttons: Accept or Decline
- Acceptance logs consent and issues credit
- Decline ends with no credit issued

### Step 6: Confirmation
- Success animation and final credit amount
- Returns to previous screen

## Credit Calculation

```typescript
const GRADE_CREDIT_MAP = {
  A: 7500, // $75
  B: 5000, // $50  
  C: 2500, // $25
};

const TIER_MULTIPLIERS = {
  essential: 1.0,
  cult: 1.15,
  vault: 1.25,
};

finalCredit = baseCredit * tierMultiplier
```

## API Endpoints

- `POST /api/second-sight` - Create intake with frame info + photos
- `PATCH /api/second-sight/{id}` - Update grade, credit, status
- `PATCH /api/second-sight/{id}/issue-credit` - Issue credit to client

## Usage

Navigate to `/more/second-sight` with params:
- `clientId` - Client identifier
- `clientName` - Display name
- `clientTier` - For credit multiplier calculation

Or test with `/more/second-sight-demo` for sample clients.

## Design Principles Applied

✅ **Brand colors** - Navy, green, off-white palette
✅ **44pt touch targets** - All buttons meet accessibility requirements
✅ **17pt minimum text** - Readable without glasses
✅ **Border-based depth** - No shadows, uses borders for elevation
✅ **One green accent** - Only the primary action uses green
✅ **Privacy mode ready** - Sensitive data can be hidden from client view
✅ **Offline support** - Writes queue locally, sync on reconnect

## Testing

```bash
cd /path/to/lunettiq-ipad
npm test src/features/second-sight/useSecondSightStore.test.ts
```

Tests cover:
- State initialization
- Step navigation validation
- Photo management
- Credit calculation with tier multipliers
- Store reset functionality