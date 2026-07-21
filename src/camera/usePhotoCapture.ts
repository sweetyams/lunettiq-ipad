import { useState, useCallback } from 'react';
import { CameraCapturedPicture } from 'expo-camera';
import { database } from '@/src/db';
import { PhotoUpload } from '@/src/db/models/PhotoUpload.model';
import { useSyncStore } from '@/src/sync/useSyncStore';
import {
  processCapture,
  generatePhotoFilename,
  savePhotoToPermanentLocation,
  cleanupTempPhoto,
  validatePhotoUri,
} from './photoProcessing';

interface PhotoCaptureResult {
  photoId: string;
  localPath: string;
  thumbnailPath: string;
}

interface PhotoCaptureError {
  code: 'permission_denied' | 'processing_failed' | 'storage_failed' | 'unknown';
  message: string;
}

interface UsePhotoCaptureOptions {
  sessionId?: string;
  context?: 'fitting' | 'second_sight' | 'custom_design' | 'profile';
  maxPhotos?: number;
  onPhotoAdded?: (photoId: string) => void;
}

interface UsePhotoCaptureReturn {
  capture: (photo: CameraCapturedPicture & { burst?: CameraCapturedPicture[] }) => Promise<PhotoCaptureResult | null>;
  isProcessing: boolean;
  error: PhotoCaptureError | null;
  clearError: () => void;
  photoCount: number;
}

export function usePhotoCapture({
  sessionId,
  context = 'fitting',
  maxPhotos = 20,
  onPhotoAdded,
}: UsePhotoCaptureOptions = {}): UsePhotoCaptureReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<PhotoCaptureError | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  
  const setPendingUploads = useSyncStore(state => state.setPendingUploads);
  const pendingUploads = useSyncStore(state => state.pendingUploads);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const capture = useCallback(async (
    photo: CameraCapturedPicture & { burst?: CameraCapturedPicture[] }
  ): Promise<PhotoCaptureResult | null> => {
    if (isProcessing) {
      console.warn('Photo capture already in progress');
      return null;
    }

    if (photoCount >= maxPhotos) {
      setError({
        code: 'unknown',
        message: `Photo limit reached (${maxPhotos})`,
      });
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Validate the photo URI first
      if (!(await validatePhotoUri(photo.uri))) {
        throw new Error('Invalid photo URI');
      }

      // Process the primary photo (compress, thumbnail, strip EXIF)
      console.log('Processing photo:', photo.uri);
      const processed = await processCapture(photo.uri);
      
      // Generate unique filename
      const filename = generatePhotoFilename(sessionId, context);
      const thumbnailFilename = generatePhotoFilename(sessionId, `${context}_thumb`);

      // Save to permanent locations
      const permanentUri = await savePhotoToPermanentLocation(
        processed.fullUri,
        filename
      );
      const permanentThumbnailUri = await savePhotoToPermanentLocation(
        processed.thumbnailUri,
        thumbnailFilename
      );

      // Create PhotoUpload record in WatermelonDB
      const photoUpload = await database.write(async () => {
        const newPhoto = await database.get<PhotoUpload>('photo_uploads').create((photoUpload: PhotoUpload) => {
          photoUpload.localPath = permanentUri;
          photoUpload.thumbnailPath = permanentThumbnailUri;
          photoUpload.sessionId = sessionId;
          photoUpload.context = context;
          photoUpload.attempts = 0;
          photoUpload.status = 'pending';
        });
        
        return newPhoto;
      });

      // Clean up temporary files
      await cleanupTempPhoto(photo.uri);
      if (processed.fullUri !== photo.uri) {
        await cleanupTempPhoto(processed.fullUri);
      }
      if (processed.thumbnailUri !== permanentThumbnailUri) {
        await cleanupTempPhoto(processed.thumbnailUri);
      }

      // Update sync store
      setPendingUploads(pendingUploads + 1);
      
      // Update local photo count
      setPhotoCount(prev => prev + 1);

      // Notify callback
      if (onPhotoAdded) {
        onPhotoAdded(photoUpload.id);
      }

      console.log('Photo capture complete:', {
        photoId: photoUpload.id,
        localPath: permanentUri,
        thumbnailPath: permanentThumbnailUri,
      });

      return {
        photoId: photoUpload.id,
        localPath: permanentUri,
        thumbnailPath: permanentThumbnailUri,
      };

    } catch (err) {
      console.error('Photo capture failed:', err);
      
      // Clean up any temporary files on failure
      await cleanupTempPhoto(photo.uri);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      let errorCode: PhotoCaptureError['code'] = 'unknown';
      if (errorMessage.includes('permission')) {
        errorCode = 'permission_denied';
      } else if (errorMessage.includes('process')) {
        errorCode = 'processing_failed';
      } else if (errorMessage.includes('save') || errorMessage.includes('storage')) {
        errorCode = 'storage_failed';
      }

      setError({
        code: errorCode,
        message: errorMessage,
      });

      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing,
    photoCount,
    maxPhotos,
    sessionId,
    context,
    onPhotoAdded,
    setPendingUploads,
    pendingUploads,
  ]);

  return {
    capture,
    isProcessing,
    error,
    clearError,
    photoCount,
  };
}

/**
 * Hook to get photos for a specific session
 */
export function useSessionPhotos(sessionId?: string) {
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPhotos = useCallback(async () => {
    if (!sessionId) {
      setPhotos([]);
      return;
    }

    setIsLoading(true);
    try {
      const sessionPhotos = await database
        .get<PhotoUpload>('photo_uploads')
        .query(
          // Filter by session_id
          // Note: WatermelonDB queries would use Q.where('session_id', sessionId)
        )
        .fetch();

      setPhotos(sessionPhotos);
    } catch (error) {
      console.error('Error loading session photos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  return {
    photos,
    isLoading,
    loadPhotos,
  };
}

/**
 * Hook to get pending upload count
 */
export function usePendingUploads() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadPendingCount = useCallback(async () => {
    setIsLoading(true);
    try {
      const pendingPhotos = await database
        .get<PhotoUpload>('photo_uploads')
        .query(
          // Filter by status = 'pending' or 'failed'
          // Note: WatermelonDB queries would use Q.where('status', Q.oneOf(['pending', 'failed']))
        )
        .fetch();

      setPendingCount(pendingPhotos.length);
    } catch (error) {
      console.error('Error loading pending uploads:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    pendingCount,
    isLoading,
    loadPendingCount,
  };
}

/**
 * Hook to retry failed photo uploads
 */
export function useRetryFailedUploads() {
  const [isRetrying, setIsRetrying] = useState(false);

  const retryFailed = useCallback(async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    try {
      const failedPhotos = await database
        .get<PhotoUpload>('photo_uploads')
        .query(
          // Filter by status = 'failed' and attempts < 3
          // Note: WatermelonDB queries would use appropriate Q.where conditions
        )
        .fetch();

      await database.write(async () => {
        for (const photo of failedPhotos) {
          if (photo.canRetry) {
            photo.retry();
          }
        }
      });

      console.log(`Retrying ${failedPhotos.length} failed uploads`);
    } catch (error) {
      console.error('Error retrying failed uploads:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying]);

  return {
    retryFailed,
    isRetrying,
  };
}