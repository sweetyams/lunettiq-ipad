import { Q } from '@nozbe/watermelondb';
import { nanoid } from 'nanoid';
import { database } from '@/src/db';
import { SyncQueue } from '@/src/db/models';
import { api } from '@/src/api/client';
import { useSyncStore } from './useSyncStore';

interface ProcessResult {
  success: boolean;
  shouldRetry: boolean;
  error?: string;
}

export class SyncEngine {
  private isRunning = false;
  private abortController: AbortController | null = null;
  private processingPromise: Promise<void> | null = null;
  private maxRetries = 10;
  private maxBackoffMs = 60000; // 60 seconds
  
  constructor() {
    this.updateQueueCount = this.updateQueueCount.bind(this);
  }
  
  /**
   * Start processing the sync queue
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return this.processingPromise || Promise.resolve();
    }
    
    this.isRunning = true;
    this.abortController = new AbortController();
    
    console.log('[SyncEngine] Starting queue processing');
    
    this.processingPromise = this.processQueue();
    return this.processingPromise;
  }
  
  /**
   * Stop processing the sync queue
   */
  stop(): void {
    if (!this.isRunning) return;
    
    console.log('[SyncEngine] Stopping queue processing');
    this.isRunning = false;
    this.abortController?.abort();
    this.abortController = null;
  }
  
  /**
   * Process all items in the sync queue
   */
  private async processQueue(): Promise<void> {
    try {
      useSyncStore.getState().setSyncStatus('syncing');
      await this.updateQueueCount();
      
      while (this.isRunning && !this.abortController?.signal.aborted) {
        const nextItem = await this.getNextQueueItem();
        
        if (!nextItem) {
          // No more items to process
          break;
        }
        
        await this.processQueueItem(nextItem);
        await this.updateQueueCount();
        
        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('[SyncEngine] Queue processing completed');
      useSyncStore.getState().setLastSyncAt(Date.now());
      
    } catch (error) {
      console.error('[SyncEngine] Queue processing error:', error);
      useSyncStore.getState().addError({
        type: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown sync error',
      });
    } finally {
      this.isRunning = false;
      this.processingPromise = null;
      useSyncStore.getState().setSyncStatus('idle');
      await this.updateQueueCount();
    }
  }
  
  /**
   * Get the next item to process from the queue
   * Priority order: high priority first, then chronological
   */
  private async getNextQueueItem(): Promise<SyncQueue | null> {
    return await database.collections
      .get<SyncQueue>('sync_queue')
      .query(
        Q.where('status', Q.oneOf(['pending', 'retrying'])),
        Q.where('attempts', Q.lt(this.maxRetries)),
        Q.sortBy('priority', Q.desc), // High priority first
        Q.sortBy('created_at', Q.asc), // Then chronological
        Q.take(1)
      )
      .fetch()
      .then(results => results[0] || null)
      .catch(() => null);
  }
  
  /**
   * Process a single queue item
   */
  private async processQueueItem(item: SyncQueue): Promise<void> {
    try {
      console.log(`[SyncEngine] Processing ${item.operation} ${item.entityType}:${item.entityId}`);
      
      // Update attempt count and last attempt time
      await database.write(async () => {
        await item.update(record => {
          record.attempts = item.attempts + 1;
          record.lastAttemptAt = new Date();
        });
      });
      
      // Check if we should retry (exponential backoff)
      if (item.attempts > 1 && item.lastAttemptAt) {
        const backoffMs = Math.min(
          1000 * Math.pow(2, item.attempts - 2), // 1s, 2s, 4s, 8s, 16s, etc.
          this.maxBackoffMs
        );
        const timeSinceLastAttempt = Date.now() - item.lastAttemptAt.getTime();
        
        if (timeSinceLastAttempt < backoffMs) {
          console.log(`[SyncEngine] Backing off for ${backoffMs - timeSinceLastAttempt}ms`);
          return; // Skip for now, will be picked up in next cycle
        }
      }
      
      const result = await this.executeRequest(item);
      
      if (result.success) {
        await database.write(async () => {
          await item.update(record => {
            record.status = 'complete';
          });
        });
        console.log(`[SyncEngine] ✓ Completed ${item.operation} ${item.entityType}:${item.entityId}`);
      } else if (result.shouldRetry && item.attempts < this.maxRetries) {
        await database.write(async () => {
          await item.update(record => {
            record.status = 'pending';
            record.error = result.error || 'Unknown error';
          });
        });
        console.log(`[SyncEngine] ⏳ Will retry ${item.operation} ${item.entityType}:${item.entityId} (attempt ${item.attempts})`);
      } else {
        await database.write(async () => {
          await item.update(record => {
            record.status = 'failed';
            record.error = result.error || 'Max retries exceeded';
          });
        });
        console.error(`[SyncEngine] ✗ Failed ${item.operation} ${item.entityType}:${item.entityId} permanently`);
        
        useSyncStore.getState().addError({
          type: result.shouldRetry ? 'server' : 'client',
          message: `Failed to sync ${item.entityType}: ${result.error}`,
        });
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await database.write(async () => {
        await item.update(record => {
          record.status = 'failed';
          record.error = errorMessage;
        });
      });
      
      useSyncStore.getState().addError({
        type: 'unknown',
        message: `Unexpected error syncing ${item.entityType}: ${errorMessage}`,
      });
      
      console.error(`[SyncEngine] ✗ Unexpected error processing ${item.entityType}:`, error);
    }
  }
  
  /**
   * Execute the API request for a queue item
   */
  private async executeRequest(item: SyncQueue): Promise<ProcessResult> {
    const BASE_URL = process.env.EXPO_PUBLIC_FOUNDRY_BASE_URL
      ?? (__DEV__ ? 'http://lunettiq.localhost:4000' : 'https://lunettiq.bentspline.com');

    try {
      // Get a fresh auth token
      const token = await api.getTokenForUpload();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Found-Surface': 'tablet',
        'Idempotency-Key': item.idempotencyKey || item.id,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Construct full URL from the stored endpoint path
      const url = item.endpoint.startsWith('http')
        ? item.endpoint
        : `${BASE_URL}${item.endpoint}`;

      // Make the API request
      const response = await fetch(url, {
        method: item.method,
        headers,
        body: item.payload ? JSON.stringify(item.payload) : undefined,
        signal: this.abortController?.signal,
      });

      // Check for idempotent replay (cached response from server)
      const isReplay = response.headers.get('X-Idempotent-Replay') === 'true';
      if (isReplay) {
        console.log(`[SyncEngine] Idempotent replay for ${item.entityType}:${item.entityId} — server returned cached response`);
      }
      
      // Handle response
      if (response.ok) {
        return { success: true, shouldRetry: false };
      }
      
      // Parse error response
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch {
        // Could not parse error response
      }
      
      // Determine if we should retry based on status code
      const shouldRetry = response.status >= 500 || response.status === 429;

      // 401: token may have expired — worth one retry with fresh token
      if (response.status === 401) {
        return { success: false, shouldRetry: true, error: 'Authentication expired' };
      }
      
      return {
        success: false,
        shouldRetry,
        error: errorMessage,
      };
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, shouldRetry: true, error: 'Request aborted' };
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      
      // Network errors should be retried
      return {
        success: false,
        shouldRetry: true,
        error: errorMessage,
      };
    }
  }
  
  /**
   * Update the pending writes count in the store
   */
  private async updateQueueCount(): Promise<void> {
    try {
      const count = await database.collections
        .get<SyncQueue>('sync_queue')
        .query(
          Q.where('status', Q.oneOf(['pending', 'retrying'])),
          Q.where('attempts', Q.lt(this.maxRetries))
        )
        .fetchCount();
      
      useSyncStore.getState().setPendingWrites(count);
    } catch (error) {
      console.error('[SyncEngine] Error updating queue count:', error);
    }
  }
  
  /**
   * Add a new item to the sync queue
   */
  async enqueue(
    operation: 'create' | 'update' | 'delete',
    entityType: string,
    entityId: string,
    endpoint: string,
    method: 'POST' | 'PATCH' | 'DELETE',
    payload?: object,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<void> {
    try {
      const idempotencyKey = nanoid();

      await database.write(async () => {
        const syncQueue = database.collections.get<SyncQueue>('sync_queue');
        await syncQueue.create((item) => {
          item.operation = operation;
          item.entityType = entityType;
          item.entityId = entityId;
          item.endpoint = endpoint;
          item.method = method;
          item.payload = (payload as Record<string, unknown>) || {};
          item.priority = priority;
          item.status = 'pending';
          item.attempts = 0;
          item.lastAttemptAt = undefined;
          item.error = undefined;
          item.idempotencyKey = idempotencyKey;
        });
      });
      
      await this.updateQueueCount();
      
      // Auto-start processing if we're online and auto-sync is enabled
      const state = useSyncStore.getState();
      if (state.isOnline && state.autoSyncEnabled && !this.isRunning) {
        this.start();
      }
      
    } catch (error) {
      console.error('[SyncEngine] Error enqueuing item:', error);
      throw error;
    }
  }
  
  /**
   * Clear all completed and failed items from the queue
   */
  async clearCompleted(): Promise<void> {
    try {
      const items = await database.collections
        .get<SyncQueue>('sync_queue')
        .query(Q.where('status', Q.oneOf(['completed', 'failed'])))
        .fetch();
      
      await database.write(async () => {
        for (const item of items) {
          await item.destroyPermanently();
        }
      });
      
      await this.updateQueueCount();
    } catch (error) {
      console.error('[SyncEngine] Error clearing completed items:', error);
    }
  }
  
  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    retrying: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    try {
      const [pending, retrying, completed, failed] = await Promise.all([
        database.collections.get<SyncQueue>('sync_queue')
          .query(Q.where('status', 'pending')).fetchCount(),
        database.collections.get<SyncQueue>('sync_queue')
          .query(Q.where('status', 'retrying')).fetchCount(),
        database.collections.get<SyncQueue>('sync_queue')
          .query(Q.where('status', 'completed')).fetchCount(),
        database.collections.get<SyncQueue>('sync_queue')
          .query(Q.where('status', 'failed')).fetchCount(),
      ]);
      
      return {
        pending,
        retrying,
        completed,
        failed,
        total: pending + retrying + completed + failed,
      };
    } catch (error) {
      console.error('[SyncEngine] Error getting stats:', error);
      return { pending: 0, retrying: 0, completed: 0, failed: 0, total: 0 };
    }
  }
}

// Global sync engine instance
export const syncEngine = new SyncEngine();