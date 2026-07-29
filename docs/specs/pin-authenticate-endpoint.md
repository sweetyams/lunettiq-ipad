# Foundry Endpoint Spec: PIN-as-Identity Authentication

## Overview

Replace the roster-based `verify-pin` flow (which requires `staffId`) with a single `authenticate` endpoint where the PIN alone identifies the staff member.

## Endpoint

```
POST /api/admin/device/authenticate
```

### Headers

```
Authorization: Bearer <clerk_session_token>   ← device owner's Clerk session
X-Found-Surface: tablet
Content-Type: application/json
```

### Request Body

```json
{
  "pin": "1234"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `pin` | string | yes | 4-digit numeric PIN |

### Success Response (200)

```json
{
  "data": {
    "staffId": "staff_abc123",
    "clerkUserId": "user_xyz789",
    "name": "Marie Dupont",
    "email": "marie@lunettiq.com",
    "role": "sales_associate",
    "imageUrl": "https://img.clerk.com/..."
  },
  "error": null,
  "meta": { "requestId": "req_..." }
}
```

### Error Responses

#### Invalid PIN (401)

```json
{
  "data": null,
  "error": {
    "code": "INVALID_PIN",
    "message": "Incorrect PIN",
    "details": {
      "remainingAttempts": 4
    }
  },
  "meta": { "requestId": "req_..." }
}
```

#### Locked (429)

After 5 failed attempts, lock for 5 minutes:

```json
{
  "data": null,
  "error": {
    "code": "LOCKED",
    "message": "Too many attempts",
    "details": {
      "lockedUntil": "2026-07-27T15:15:00.000Z"
    }
  },
  "meta": { "requestId": "req_..." }
}
```

## Implementation Notes

### PIN Uniqueness Constraint

PINs must be unique across all active staff within the same project/tenant. This is enforced at:
- **PIN creation time** (`POST /api/admin/device/set-pin`) — reject duplicate with 409 CONFLICT
- **DB level** — unique index on `(project_id, pin_hash)` where `status = 'active'`

### PIN Storage

- Hash PINs with bcrypt (cost 10) or argon2id
- Never store plaintext
- Lookup: iterate active staff, compare hash (small set — 5-20 staff max per project)
- Or: use a short-input-safe KDF and store as indexed hash for O(1) lookup

### Rate Limiting

Rate limit by **device/IP** (not by user, since we don't know the user yet):
- 5 attempts per 5-minute window
- After 5 failures → lock for 5 minutes
- Lock applies to the device, not a specific PIN

### Audit Log

Log every attempt:
```sql
INSERT INTO audit_log (project_id, action, surface, ip, success, staff_id, timestamp)
VALUES ($1, 'device_authenticate', 'tablet', $2, $3, $4, NOW())
```

`staff_id` is null on failed attempts (we don't know who it was).

### PIN Setup — Updated Constraint

The existing `set-pin` endpoint needs a uniqueness check:

```
POST /api/admin/device/set-pin
Body: { "pin": "5678" }

→ 200: { "data": { "success": true } }
→ 409: { "error": { "code": "PIN_TAKEN", "message": "This PIN is already in use. Choose another." } }
```

### Migration

If staff already have PINs set via the old flow, they continue to work. The only change is that the lookup no longer requires `staffId` — it searches all active staff PINs for a match.

## Capacity

4-digit PIN = 10,000 combinations. For a team of 5-15 staff, collision probability during setup is negligible. If the team grows beyond ~50 staff, consider requiring 6-digit PINs.
