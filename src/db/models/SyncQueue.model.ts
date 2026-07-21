import { Model } from '@nozbe/watermelondb';
import { text, field, json, date, readonly } from '@nozbe/watermelondb/decorators';

export type SyncOperation = 'create' | 'update' | 'delete';
export type SyncMethod = 'POST' | 'PATCH' | 'DELETE';
export type SyncPriority = 'high' | 'normal' | 'low';
export type SyncStatus = 'pending' | 'syncing' | 'failed' | 'complete';

export class SyncQueue extends Model {
  static table = 'sync_queue';

  @text('operation') operation!: SyncOperation;
  @text('entity_type') entityType!: string;
  @text('entity_id') entityId!: string;
  @text('endpoint') endpoint!: string;
  @text('method') method!: SyncMethod;
  @json('payload', (json) => json) payload!: Record<string, unknown>;
  @text('priority') priority!: SyncPriority;
  @field('attempts') attempts!: number;
  @readonly @date('last_attempt_at') lastAttemptAt?: Date;
  @text('error') error?: string;
  @text('status') status!: SyncStatus;
  @text('idempotency_key') idempotencyKey!: string;

  // Computed properties
  get isPending(): boolean {
    return this.status === 'pending';
  }

  get isSyncing(): boolean {
    return this.status === 'syncing';
  }

  get isFailed(): boolean {
    return this.status === 'failed';
  }

  get isComplete(): boolean {
    return this.status === 'complete';
  }

  get hasExceededRetries(): boolean {
    return this.attempts >= 3;
  }

  get canRetry(): boolean {
    return this.isFailed && !this.hasExceededRetries;
  }

  get nextRetryDelay(): number {
    // Exponential backoff: 1s, 4s, 16s
    return Math.pow(4, this.attempts) * 1000;
  }

  get isHighPriority(): boolean {
    return this.priority === 'high';
  }

  get shouldRetryNow(): boolean {
    if (!this.canRetry || !this.lastAttemptAt) return false;
    
    const now = Date.now();
    const timeSinceLastAttempt = now - this.lastAttemptAt.getTime();
    return timeSinceLastAttempt >= this.nextRetryDelay;
  }

  // Methods
  markAsSyncing(): void {
    this.status = 'syncing';
  }

  markAsComplete(): void {
    this.status = 'complete';
  }

  markAsFailed(error: string): void {
    this.status = 'failed';
    this.error = error;
    this.attempts += 1;
    this.lastAttemptAt = new Date();
  }

  retry(): void {
    if (this.canRetry) {
      this.status = 'pending';
      this.error = undefined;
    }
  }

  // Static factory methods
  static createSessionWrite(
    sessionId: string,
    clientId: string,
    payload: Record<string, unknown>,
    operation: SyncOperation = 'create'
  ): Partial<SyncQueue> {
    return {
      operation,
      entityType: 'session',
      entityId: sessionId,
      endpoint: operation === 'create' 
        ? `/api/clients/${clientId}/tryon-sessions` 
        : `/api/clients/${clientId}/tryon-sessions/${sessionId}`,
      method: operation === 'create' ? 'POST' : 'PATCH',
      payload,
      priority: 'high',
      attempts: 0,
      status: 'pending',
      idempotencyKey: `session-${sessionId}-${Date.now()}`,
    };
  }

  static createPhotoUpload(
    photoId: string,
    payload: Record<string, unknown>
  ): Partial<SyncQueue> {
    return {
      operation: 'create',
      entityType: 'photo',
      entityId: photoId,
      endpoint: '/api/admin/media/confirm',
      method: 'POST',
      payload,
      priority: 'normal',
      attempts: 0,
      status: 'pending',
      idempotencyKey: `photo-${photoId}-${Date.now()}`,
    };
  }

  static createInteraction(
    interactionId: string,
    clientId: string,
    payload: Record<string, unknown>
  ): Partial<SyncQueue> {
    return {
      operation: 'create',
      entityType: 'interaction',
      entityId: interactionId,
      endpoint: `/api/clients/${clientId}/interactions`,
      method: 'POST',
      payload,
      priority: 'normal',
      attempts: 0,
      status: 'pending',
      idempotencyKey: `interaction-${interactionId}-${Date.now()}`,
    };
  }

  static createClientUpdate(
    clientId: string,
    payload: Record<string, unknown>
  ): Partial<SyncQueue> {
    return {
      operation: 'update',
      entityType: 'client',
      entityId: clientId,
      endpoint: `/api/clients/${clientId}`,
      method: 'PATCH',
      payload,
      priority: 'normal',
      attempts: 0,
      status: 'pending',
      idempotencyKey: `client-${clientId}-${Date.now()}`,
    };
  }
}