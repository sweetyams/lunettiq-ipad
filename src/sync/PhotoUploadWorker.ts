import { Q } from '@nozbe/watermelondb';
import { database } from '@/src/db';
import { PhotoUpload } from '@/src/db/models';
import { api } from '@/src/api/client';
import { useSyncStore } from './useSyncStore';

const BASE_URL = process.env.EXPO_PUBLIC_FOUNDRY_BASE_URL
  ?? (__DEV__ ? 'http://lunettiq.localhost:4000' : 'https://lunettiq.bentspline.com');

interface UploadResult {
  success: boolean;
  shouldRetry: boolean;
  error?: string;
}

interface MediaUploadResponse {
  id: string;
  url: string;
  key: string;
}

export class PhotoUploadWorker {
  private isRunning = false;
  private abortController: AbortController | null = null;
  private processingPromise: Promise<void> | null = null;
  private maxConcurrentUploads = 2;
  private activeUploads = new Set<string>();
  private maxRetries = 5;
  private maxBackoffMs = 60000; // 60 seconds
  
  constructor() {
    this.updateUploadCount = this.updateUploadCount.bind(this);
  }
  
  /**
   * Start processing the upload queue
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return this.processingPromise || Promise.resolve();
    }
    
    const state = useSyncStore.getState();
    
    // Check if we can upload (online + wifi if required)
    if (!state.isOnline) {
      console.log('[PhotoUploadWorker] Skipping - offline');
      return;
    }
    
    if (state.wifiOnlyUploads && !state.isConnectedToWifi) {
      console.log('[PhotoUploadWorker] Skipping - WiFi-only mode and not on WiFi');
      return;
    }
    
    this.isRunning = true;
    this.abortController = new AbortController();
    
    console.log('[PhotoUploadWorker] Starting upload processing');
    
    this.processingPromise = this.processUploads();
    return this.processingPromise;
  }
  
  /**
   * Stop processing uploads
   */
  stop(): void {
    if (!this.isRunning) return;
    
    console.log('[PhotoUploadWorker] Stopping upload processing');
    this.isRunning = false;
    this.abortController?.abort();
    this.abortController = null;
    this.activeUploads.clear();
  }
  
  /**
   * Process uploads with concurrency control
   */
  private async processUploads(): Promise<void> {
    try {
      useSyncStore.getState().setSyncStatus('uploading');
      await this.updateUploadCount();
      
      while (this.isRunning && !this.abortController?.signal.aborted) {
        // Check if we can start more uploads
        if (this.activeUploads.size >= this.maxConcurrentUploads) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before checking again
          continue;
        }
        
        const nextUpload = await this.getNextUpload();
        
        if (!nextUpload) {
          // No more uploads to process or none ready
          if (this.activeUploads.size === 0) {
            break; // All done
          }
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for active uploads
          continue;
        }
        
        // Start upload in background (don't await)
        this.processUpload(nextUpload);
        
        // Small delay between starting uploads
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Wait for remaining active uploads to complete
      while (this.activeUploads.size > 0 && this.isRunning) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('[PhotoUploadWorker] Upload processing completed');
      
    } catch (error) {
      console.error('[PhotoUploadWorker] Upload processing error:', error);
      useSyncStore.getState().addError({
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown upload error',
      });
    } finally {
      this.isRunning = false;
      this.processingPromise = null;
      if (useSyncStore.getState().syncStatus === 'uploading') {
        useSyncStore.getState().setSyncStatus('idle');
      }
      await this.updateUploadCount();
    }
  }
  
  /**
   * Get the next upload to process
   */
  private async getNextUpload(): Promise<PhotoUpload | null> {
    try {
      return await database.collections
        .get<PhotoUpload>('photo_uploads')
        .query(
          Q.where('status', Q.oneOf(['pending', 'retrying'])),
          Q.where('attempts', Q.lt(this.maxRetries)),
          Q.sortBy('created_at', Q.asc), // FIFO
          Q.take(1)
        )
        .fetch()
        .then(results => results[0] || null)
        .catch(() => null);
    } catch (error) {
      console.error('[PhotoUploadWorker] Error fetching next upload:', error);
      return null;
    }
  }
  
  /**
   * Process a single upload (runs concurrently)
   */
  private async processUpload(upload: PhotoUpload): Promise<void> {
    this.activeUploads.add(upload.id);
    
    try {
      console.log(`[PhotoUploadWorker] Processing upload ${upload.id}`);
      
      // Update attempt count
      await database.write(async () => {
        await upload.update(record => {
          record.attempts = upload.attempts + 1;
        });
      });
      
      // Check backoff
      if (upload.attempts > 1) {
        const backoffMs = Math.min(
          1000 * Math.pow(2, upload.attempts - 2),
          this.maxBackoffMs
        );
        // Simple time-based backoff using attempt count
        // In production, would compare against a stored timestamp
        await new Promise(resolve => setTimeout(resolve, Math.min(backoffMs, 5000)));
      }
      
      const result = await this.executeUpload(upload);
      
      if (result.success) {
        await database.write(async () => {
          await upload.update(record => {
            record.status = 'complete';
            record.uploadedAt = new Date();
          });
        });
        console.log(`[PhotoUploadWorker] ✓ Completed upload ${upload.id}`);
      } else if (result.shouldRetry && upload.attempts < this.maxRetries) {
        await database.write(async () => {
          await upload.update(record => {
            record.status = 'pending';
          });
        });
        console.log(`[PhotoUploadWorker] ⏳ Will retry upload ${upload.id} (attempt ${upload.attempts})`);
      } else {
        await database.write(async () => {
          await upload.update(record => {
            record.status = 'failed';
          });
        });
        console.error(`[PhotoUploadWorker] ✗ Failed upload ${upload.id} permanently`);
        
        useSyncStore.getState().addError({
          type: result.shouldRetry ? 'server' : 'client',
          message: `Photo upload failed: ${result.error}`,
        });
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await database.write(async () => {
        await upload.update(record => {
          record.status = 'failed';
        });
      });
      
      console.error(`[PhotoUploadWorker] ✗ Unexpected error uploading ${upload.id}:`, error);
      
      useSyncStore.getState().addError({
        type: 'unknown',
        message: `Unexpected photo upload error: ${errorMessage}`,
      });
      
    } finally {
      this.activeUploads.delete(upload.id);
      await this.updateUploadCount();
    }
  }
  
  /**
   * Execute the actual upload process
   */
  private async executeUpload(upload: PhotoUpload): Promise<UploadResult> {
    try {
      // Multipart upload directly to Foundry (Vercel Blob)
      // Server normalizes: strips EXIF, auto-rotate, sRGB, caps 3200px
      const formData = new FormData();
      formData.append('file', {
        uri: upload.localPath,
        type: 'image/jpeg',
        name: `photo-${Date.now()}.jpg`,
      } as any);
      formData.append('context', upload.context);
      if (upload.sessionId) formData.append('sessionId', upload.sessionId);
      if (upload.productId) formData.append('productId', upload.productId);

      const token = await api.getTokenForUpload();
      if (!token) throw new Error('No auth token available');

      const response = await fetch(`${api.baseUrl}/api/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Found-Surface': 'tablet',
          // Do NOT set Content-Type — let fetch set multipart boundary
        },
        body: formData,
        signal: this.abortController?.signal,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      if (json.error) {
        throw new Error(json.error.message || 'Upload error');
      }

      // Response: { data: { id, url, key }, error: null }
      // No confirm step needed — media record is created and linked immediately
      
      return { success: true, shouldRetry: false };
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, shouldRetry: true, error: 'Upload aborted' };
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      
      // Determine if we should retry
      let shouldRetry = true;
      
      if (errorMessage.includes('404') || errorMessage.includes('400')) {
        shouldRetry = false; // Client errors shouldn't be retried
      }
      
      return {
        success: false,
        shouldRetry,
        error: errorMessage,
      };
    }
  }
  
  /**
   * Read photo file from local storage
   */
  private async readPhotoFile(localPath: string): Promise<Blob> {
    try {
      // Use fetch to read local file on React Native
      const response = await fetch(localPath);
      if (!response.ok) {
        throw new Error(`Could not read photo file: ${response.status}`);
      }
      return await response.blob();
    } catch (error) {
      throw new Error(`Failed to read photo file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Update the pending upload count in the store
   */
  private async updateUploadCount(): Promise<void> {
    try {
      const count = await database.collections
        .get<PhotoUpload>('photo_uploads')
        .query(
          Q.where('status', Q.oneOf(['pending', 'retrying'])),
          Q.where('attempts', Q.lt(this.maxRetries))
        )
        .fetchCount();
      
      useSyncStore.getState().setPendingUploads(count);
    } catch (error) {
      console.error('[PhotoUploadWorker] Error updating upload count:', error);
    }
  }
  
  /**
   * Add a new photo to the upload queue
   */
  async enqueue(
    localPath: string,
    sessionId?: string,
    productId?: string,
    verdict?: string,
    notes?: string,
    context: string = 'fitting-session'
  ): Promise<void> {
    try {
      await database.write(async () => {
        const uploads = database.collections.get<PhotoUpload>('photo_uploads');
        await uploads.create((upload) => {
          upload.localPath = localPath;
          upload.sessionId = sessionId;
          upload.productId = productId;
          upload.verdict = verdict as any;
          upload.notes = notes;
          upload.context = context as any;
          upload.status = 'pending';
          upload.attempts = 0;
        });
      });
      
      await this.updateUploadCount();
      
      // Auto-start if conditions are met
      const state = useSyncStore.getState();
      if (state.isOnline && (!state.wifiOnlyUploads || state.isConnectedToWifi) && !this.isRunning) {
        this.start();
      }
      
    } catch (error) {
      console.error('[PhotoUploadWorker] Error enqueuing photo:', error);
      throw error;
    }
  }
  
  /**
   * Get upload statistics
   */
  async getStats(): Promise<{
    pending: number;
    uploading: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    try {
      const [pending, completed, failed] = await Promise.all([
        database.collections.get<PhotoUpload>('photo_uploads')
          .query(Q.where('status', Q.oneOf(['pending', 'retrying']))).fetchCount(),
        database.collections.get<PhotoUpload>('photo_uploads')
          .query(Q.where('status', 'completed')).fetchCount(),
        database.collections.get<PhotoUpload>('photo_uploads')
          .query(Q.where('status', 'failed')).fetchCount(),
      ]);
      
      return {
        pending,
        uploading: this.activeUploads.size,
        completed,
        failed,
        total: pending + completed + failed + this.activeUploads.size,
      };
    } catch (error) {
      console.error('[PhotoUploadWorker] Error getting stats:', error);
      return { pending: 0, uploading: 0, completed: 0, failed: 0, total: 0 };
    }
  }
  
  /**
   * Clear completed and failed uploads
   */
  async clearCompleted(): Promise<void> {
    try {
      const items = await database.collections
        .get<PhotoUpload>('photo_uploads')
        .query(Q.where('status', Q.oneOf(['completed', 'failed'])))
        .fetch();
      
      await database.write(async () => {
        for (const item of items) {
          await item.destroyPermanently();
        }
      });
      
      await this.updateUploadCount();
    } catch (error) {
      console.error('[PhotoUploadWorker] Error clearing completed uploads:', error);
    }
  }
}

// Global photo upload worker instance
export const photoUploadWorker = new PhotoUploadWorker();