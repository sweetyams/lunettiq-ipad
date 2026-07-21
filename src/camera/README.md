# Camera Integration Module

Complete camera integration for the Lunettiq iPad app with photo capture, processing, and upload queue management.

## Features

- ✅ **Live viewfinder** with rear camera default and front camera toggle
- ✅ **Face guide overlay** (30% opacity oval, disappears during capture)  
- ✅ **Burst mode** captures 3 frames rapidly, picks sharpest
- ✅ **Photo processing pipeline** - compress, thumbnail, strip EXIF
- ✅ **Offline upload queue** with background sync
- ✅ **Barcode scanning** for product identification
- ✅ **Permission handling** with graceful fallbacks
- ✅ **Photo limit enforcement** (20 photos per session)

## Components

### CaptureView

Main camera interface for photo capture during fitting sessions.

```tsx
import { CaptureView } from '@/src/camera';

function FittingSession() {
  const { capture } = usePhotoCapture({
    sessionId: 'session-123',
    context: 'fitting',
    maxPhotos: 20,
  });

  return (
    <CaptureView
      onCapture={capture}
      maxPhotos={20}
      currentCount={photoCount}
      disabled={isProcessing}
      showMirrorToggle={true}
      onClose={() => navigation.goBack()}
    />
  );
}
```

**Props:**
- `onCapture` - Called with captured photo and burst array
- `maxPhotos` - Maximum photos allowed (default: 20) 
- `currentCount` - Current photo count for UI display
- `disabled` - Disable capture button
- `showMirrorToggle` - Show front/back camera toggle
- `onClose` - Close button handler

### BarcodeScanner

Full-screen barcode scanner for product identification.

```tsx
import { BarcodeScanner } from '@/src/camera';

function ProductScanner() {
  const handleScan = (product: Product) => {
    console.log('Scanned product:', product.name);
    // Add to session or navigate to product detail
  };

  return (
    <BarcodeScanner
      onScan={handleScan}
      onClose={() => navigation.goBack()}
      onError={(error) => showAlert(error)}
    />
  );
}
```

**Props:**
- `onScan` - Called with resolved product data
- `onClose` - Close scanner handler
- `onError` - Error handling (optional)

## Hooks

### usePhotoCapture

Orchestrates the complete photo capture workflow.

```tsx
import { usePhotoCapture } from '@/src/camera';

function MyComponent() {
  const { 
    capture, 
    isProcessing, 
    error, 
    clearError, 
    photoCount 
  } = usePhotoCapture({
    sessionId: 'session-123',
    context: 'fitting',
    maxPhotos: 20,
    onPhotoAdded: (photoId) => {
      console.log('Photo added:', photoId);
    }
  });

  const handleCapture = async (photo) => {
    const result = await capture(photo);
    if (result) {
      console.log('Photo processed:', result.photoId);
    }
  };
}
```

**Options:**
- `sessionId` - Session ID for photo association
- `context` - Photo context ('fitting', 'second_sight', 'custom_design', 'profile')
- `maxPhotos` - Maximum photos per session
- `onPhotoAdded` - Callback when photo is successfully processed

**Returns:**
- `capture` - Function to process captured photos
- `isProcessing` - Boolean indicating processing state
- `error` - Error object if processing fails
- `clearError` - Function to clear error state
- `photoCount` - Current number of photos captured

### useSessionPhotos

Get photos for a specific session.

```tsx
import { useSessionPhotos } from '@/src/camera';

function PhotoGallery({ sessionId }: { sessionId: string }) {
  const { photos, isLoading, loadPhotos } = useSessionPhotos(sessionId);

  useEffect(() => {
    loadPhotos();
  }, [sessionId]);

  return (
    <FlatList
      data={photos}
      renderItem={({ item }) => (
        <Image source={{ uri: item.thumbnailPath }} />
      )}
    />
  );
}
```

## Photo Processing

The processing pipeline runs automatically on every captured photo:

1. **Compress** - JPEG 80% quality, max 2048px longest edge
2. **Generate thumbnail** - 500px compressed copy for UI
3. **Strip EXIF** - Remove location and device metadata for privacy
4. **Save to permanent location** - Document directory with unique filename
5. **Create database record** - WatermelonDB PhotoUpload entry
6. **Queue upload** - Add to background upload queue

### Manual Processing

```tsx
import { 
  compressPhoto, 
  generateThumbnail, 
  processCapture 
} from '@/src/camera';

// Process a single photo
const processed = await processCapture(photoUri);
console.log('Full size:', processed.fullUri);
console.log('Thumbnail:', processed.thumbnailUri);

// Individual operations
const compressed = await compressPhoto(photoUri);
const thumbnail = await generateThumbnail(photoUri);
```

## Upload Queue

Photos are uploaded via background queue with retry logic:

- **WiFi**: Uploads immediately
- **Cellular**: Queued until WiFi (configurable)
- **Failed uploads**: Exponential backoff retry (1s, 4s, 16s)
- **Progress tracking**: Via sync store

### Monitor Upload Status

```tsx
import { usePendingUploads, useRetryFailedUploads } from '@/src/camera';

function UploadStatus() {
  const { pendingCount, loadPendingCount } = usePendingUploads();
  const { retryFailed, isRetrying } = useRetryFailedUploads();

  return (
    <View>
      <Text>{pendingCount} photos pending upload</Text>
      <Button onPress={retryFailed} disabled={isRetrying}>
        Retry Failed Uploads
      </Button>
    </View>
  );
}
```

## Database Integration

Photos are stored in WatermelonDB as `PhotoUpload` records:

```typescript
interface PhotoUpload {
  id: string;
  localPath: string;          // Full resolution photo path
  thumbnailPath: string;      // 500px thumbnail path  
  sessionId?: string;         // Associated session
  context: PhotoContext;      // 'fitting' | 'second_sight' | etc.
  productId?: string;         // Linked product
  verdict?: PhotoVerdict;     // 'loved' | 'liked' | 'unsure' | 'rejected'
  notes?: string;            // User notes
  r2Key?: string;            // R2 storage key after upload
  r2Url?: string;            // CDN URL after upload
  status: PhotoUploadStatus;  // 'pending' | 'uploading' | 'complete' | 'failed'
  attempts: number;          // Retry count
}
```

## API Integration

### Barcode Resolution

```http
POST /api/inventory/scan/resolve
Content-Type: application/json
Authorization: Bearer <clerk_token>

{
  "barcode": "123456789012",
  "scanContext": "fitting"
}
```

**Response:**
```json
{
  "data": {
    "id": "prod_123",
    "name": "Ray-Ban Aviator Classic",
    "familyName": "Aviator",
    "collection": "Classic",
    "sku": "RB3025"
  },
  "error": null,
  "meta": { "requestId": "req_456" }
}
```

### Photo Upload

```http
POST /api/media/upload
Content-Type: multipart/form-data
Authorization: Bearer <clerk_token>
X-Found-Surface: tablet

-- form fields --
file: <binary jpeg>
context: "fitting-session"
sessionId: "session-123"
clientId: "client-456"
```

**Response:**
```json
{
  "data": {
    "id": "media_abc123",
    "url": "https://..../photos/session-123-1704067200-abc123.jpg",
    "key": "photos/session-123-1704067200-abc123.jpg"
  },
  "error": null,
  "meta": { "requestId": "req_789" }
}
```

## Error Handling

The camera module handles errors gracefully:

- **Permission denied** - Shows permission request screen
- **Camera unavailable** - Falls back to photo import (future)
- **Processing failed** - Retries with exponential backoff
- **Storage full** - Alerts user and prevents capture
- **Network errors** - Queues uploads for later retry

### Error Types

```typescript
interface PhotoCaptureError {
  code: 'permission_denied' | 'processing_failed' | 'storage_failed' | 'unknown';
  message: string;
}
```

## Configuration

### Photo Limits

```typescript
const MAX_PHOTOS_PER_SESSION = 20;  // Prevents runaway storage
const MAX_RETRIES = 3;              // Upload retry limit
const COMPRESSION_QUALITY = 0.8;     // JPEG quality (80%)
const MAX_DIMENSION = 2048;          // Max photo dimension
const THUMBNAIL_SIZE = 500;          // Thumbnail size
```

### Upload Settings

Photos upload based on connectivity:
- **WiFi**: Immediate upload
- **Cellular**: Configurable (default: WiFi only)
- **Offline**: Queued for next sync

## Testing

```bash
# Run camera tests
npm test src/camera/

# Test specific components
npm test CaptureView.test.tsx
npm test usePhotoCapture.test.ts
```

## Dependencies

- `expo-camera@~57.0.1` - Camera API
- `expo-image-manipulator@~57.0.2` - Image processing
- `expo-file-system@~57.0.0` - File management
- `@nozbe/watermelondb` - Local database
- `react-native-reanimated` - Animations

## Architecture

```
CaptureView (UI)
     ↓
usePhotoCapture (orchestration)
     ↓
photoProcessing (image ops)
     ↓
WatermelonDB (storage)
     ↓
PhotoUploadWorker (background sync)
```

The camera system follows the offline-first principle with immediate local storage and background cloud sync.