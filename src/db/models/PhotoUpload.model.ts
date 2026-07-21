import { Model } from '@nozbe/watermelondb';
import { text, field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import type { Relation } from '@nozbe/watermelondb';
import type { Session } from './Session.model';

export type PhotoContext = 'fitting' | 'second_sight' | 'custom_design' | 'profile';
export type PhotoVerdict = 'loved' | 'liked' | 'unsure' | 'rejected';
export type PhotoUploadStatus = 'pending' | 'uploading' | 'complete' | 'failed';

export class PhotoUpload extends Model {
  static table = 'photo_uploads';
  
  static associations = {
    local_sessions: { type: 'belongs_to', key: 'session_id' },
  } as const;

  @text('local_path') localPath!: string;
  @text('thumbnail_path') thumbnailPath?: string;
  @text('session_id') sessionId?: string;
  @text('context') context!: PhotoContext;
  @text('product_id') productId?: string;
  @text('product_name') productName?: string;
  @text('verdict') verdict?: PhotoVerdict;
  @text('notes') notes?: string;
  @text('r2_key') r2Key?: string;
  @text('r2_url') r2Url?: string;
  @readonly @date('uploaded_at') uploadedAt?: Date;
  @field('attempts') attempts!: number;
  @text('status') status!: PhotoUploadStatus;

  @relation('local_sessions', 'session_id') session?: Relation<Session>;

  // Computed properties
  get isPending(): boolean {
    return this.status === 'pending';
  }

  get isUploading(): boolean {
    return this.status === 'uploading';
  }

  get isComplete(): boolean {
    return this.status === 'complete';
  }

  get isFailed(): boolean {
    return this.status === 'failed';
  }

  get hasExceededRetries(): boolean {
    return this.attempts >= 3;
  }

  get canRetry(): boolean {
    return this.isFailed && !this.hasExceededRetries;
  }

  get isLinkedToProduct(): boolean {
    return !!this.productId;
  }

  get hasVerdict(): boolean {
    return !!this.verdict;
  }

  get displayUrl(): string {
    // Use thumbnail for UI, full resolution for viewing
    return this.thumbnailPath || this.localPath;
  }

  get uploadUrl(): string | null {
    return this.r2Url || null;
  }

  get fileSize(): Promise<number> {
    // Would need to implement file size check using Expo FileSystem
    return Promise.resolve(0);
  }

  get nextRetryDelay(): number {
    // Exponential backoff for failed uploads: 2s, 8s, 32s
    return Math.pow(4, this.attempts) * 2000;
  }

  // Methods
  markAsUploading(): void {
    this.status = 'uploading';
  }

  markAsComplete(r2Key: string, r2Url: string): void {
    this.status = 'complete';
    this.r2Key = r2Key;
    this.r2Url = r2Url;
    this.uploadedAt = new Date();
  }

  markAsFailed(): void {
    this.status = 'failed';
    this.attempts += 1;
  }

  retry(): void {
    if (this.canRetry) {
      this.status = 'pending';
    }
  }

  linkToProduct(productId: string, productName: string): void {
    this.productId = productId;
    this.productName = productName;
  }

  setVerdict(verdict: PhotoVerdict): void {
    this.verdict = verdict;
  }

  addNotes(notes: string): void {
    this.notes = notes;
  }

  // Static factory methods
  static createFittingPhoto(
    localPath: string,
    sessionId: string,
    thumbnailPath?: string
  ): Partial<PhotoUpload> {
    return {
      localPath,
      thumbnailPath,
      sessionId,
      context: 'fitting',
      attempts: 0,
      status: 'pending',
    };
  }

  static createSecondSightPhoto(
    localPath: string,
    thumbnailPath?: string
  ): Partial<PhotoUpload> {
    return {
      localPath,
      thumbnailPath,
      context: 'second_sight',
      attempts: 0,
      status: 'pending',
    };
  }

  static createCustomDesignPhoto(
    localPath: string,
    thumbnailPath?: string
  ): Partial<PhotoUpload> {
    return {
      localPath,
      thumbnailPath,
      context: 'custom_design',
      attempts: 0,
      status: 'pending',
    };
  }

  static createProfilePhoto(
    localPath: string,
    thumbnailPath?: string
  ): Partial<PhotoUpload> {
    return {
      localPath,
      thumbnailPath,
      context: 'profile',
      attempts: 0,
      status: 'pending',
    };
  }
}