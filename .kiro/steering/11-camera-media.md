---
inclusion: manual
---
# Camera & Media

Reference: "use #11-camera-media"

## Photo Contexts

| Context | Purpose | Storage | Retention |
|---------|---------|---------|-----------|
| Fitting session | Client wearing frames | R2 + client account | 2 years |
| Second Sight | Frame condition docs | R2 | 5 years (Quebec norms) |
| Custom design | Inspiration/reference | R2 | Project life + 1 year |
| Custom design sketch | Apple Pencil output | R2 | Project life + 1 year |
| Client profile | Avatar | R2 | Account lifetime |

## Capture UI

Universal capture component (`src/camera/CaptureView.tsx`):

- Live viewfinder with subject-framing overlay
- Volume buttons as shutter (handheld shooting)
- Burst mode: 3 frames, auto-pick sharpest
- Tap to focus
- Post-capture: immediate annotation option (Pencil)

## Processing Pipeline

```
Capture (native camera)
  → Auto-crop to subject (face detection for fittings)
  → Light correction (brightness, white balance)
  → Compress: JPEG 80%, max 2048px longest edge
  → Strip EXIF (privacy — remove location, device info)
  → Generate 500px thumbnail (for offline grid display)
  → Queue upload to R2 via presigned URL
```

**No filters, no beauty smoothing.** Brand aesthetic depends on realism.

## Upload Flow

```typescript
// Multipart upload directly to Foundry — server normalizes (strips EXIF, auto-rotate, sRGB, caps 3200px)
const formData = new FormData();
formData.append('file', {
  uri: photo.localUri,
  type: 'image/jpeg',
  name: `session-${sessionId}-${Date.now()}.jpg`,
});
formData.append('context', 'fitting-session');
formData.append('sessionId', sessionId);
formData.append('clientId', clientId);

const result = await fetch(`${BASE_URL}/api/media/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Found-Surface': 'tablet',
    // Do NOT set Content-Type — let fetch set multipart boundary
  },
  body: formData,
});
// Returns: { data: { id, url, key }, error: null }
// No confirm step — media record is created and linked immediately
```

For PDFs/receipts (not photos): use `POST /api/admin/media/upload-url` for presigned URL pattern.

## Offline Photo Behavior

- Photos save locally immediately (compressed)
- Upload queues in background
- Thumbnail available for UI before upload completes
- Failed uploads retry with exponential backoff
- **Cap: 20 photos per session** (prevents runaway storage)

## Consent Model (3 layers)

1. **Capture consent** — per session, verbal confirmation, SA logs in app
2. **Storage consent** — persistent on client profile (revocable)
3. **Marketing use consent** — separate, explicit opt-in, never defaulted

```typescript
// Before first photo in a session
const consentConfirmed = await showConsentDialog({
  clientName: client.name,
  message: "Can we save photos of today's fitting to your account?",
});

if (!consentConfirmed) {
  // Photos captured but NOT stored beyond session
  // Auto-deleted on session end
}
```

## Photo ↔ Product Linking

Every fitting photo should be linked to a product. Three paths:

1. **Pre-select product** → capture → auto-linked
2. **Barcode scan** → product resolved → capture → auto-linked
3. **Capture first** → attribute later (before session end)

```typescript
interface SessionPhoto {
  id: string;
  localUri: string;
  r2Key: string | null;  // null until uploaded
  thumbnailUri: string;
  productId: string | null;
  variantId: string | null;
  verdict: 'loved' | 'liked' | 'unsure' | 'rejected' | null;
  notes: string;
  pencilAnnotations: string | null;  // SVG data
  clientVisible: boolean;
  capturedAt: number;
}
```

## Apple Pencil Integration

For custom design sketches and photo annotations:

```typescript
// src/pencil/AnnotationCanvas.tsx
// Wraps PencilKit via native module
// Saves as SVG (vector) + rasterized PNG (for email)
// Supports: pen, marker, eraser
// Input: optional background image (reference photo)
// Output: { svg: string, png: Blob }
```

Pencil support is V2 — app ships V1 without it. Architecture accounts for it but doesn't block.
