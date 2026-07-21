// Camera components
export { CaptureView } from './CaptureView';
export { BarcodeScanner } from './BarcodeScanner';

// Hooks
export { 
  usePhotoCapture,
  useSessionPhotos,
  usePendingUploads,
  useRetryFailedUploads,
} from './usePhotoCapture';

// Processing utilities
export {
  compressPhoto,
  generateThumbnail,
  stripExif,
  processCapture,
  processBurstCapture,
  generatePhotoFilename,
  savePhotoToPermanentLocation,
  cleanupTempPhoto,
  validatePhotoUri,
} from './photoProcessing';

// Types (re-export from dependencies for convenience)
export type { CameraCapturedPicture } from 'expo-camera';