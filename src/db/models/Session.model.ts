import { Model } from '@nozbe/watermelondb';
import { text, field, json, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import type { Relation } from '@nozbe/watermelondb';
import type { Client } from './Client.model';

export interface FrameTried {
  productId: string;
  productName: string;
  variantId?: string;
  photoIds: string[];
  verdict?: 'loved' | 'liked' | 'unsure' | 'rejected';
  notes?: string;
  triedAt: number;
  shortlisted?: boolean;
}

export type SessionOutcome = 'purchased' | 'booked_next' | 'shortlist_review' | 'left_empty';

export class Session extends Model {
  static table = 'local_sessions';
  
  static associations = {
    clients: { type: 'belongs_to', key: 'client_id' },
  } as const;

  @text('client_id') clientId?: string;
  @text('client_name') clientName?: string;
  @text('staff_id') staffId!: string;
  @readonly @date('started_at') startedAt!: Date;
  @readonly @date('ended_at') endedAt?: Date;
  @text('outcome_tag') outcomeTag?: SessionOutcome;
  @json('frames_tried', (json) => json) framesTried!: FrameTried[];
  @text('session_notes') sessionNotes?: string;
  @readonly @date('consent_captured_at') consentCapturedAt?: Date;
  @field('consent_declined') consentDeclined!: boolean;
  @field('synced') synced!: boolean;
  @readonly @date('last_saved_at') lastSavedAt!: Date;
  @text('server_session_id') serverSessionId?: string;

  @relation('clients', 'client_id') client?: Relation<Client>;

  // Computed properties
  get duration(): number | null {
    if (!this.endedAt) return null;
    return this.endedAt.getTime() - this.startedAt.getTime();
  }

  get durationMinutes(): number | null {
    const duration = this.duration;
    return duration ? Math.round(duration / (1000 * 60)) : null;
  }

  get isActive(): boolean {
    return !this.endedAt;
  }

  get hasPhotos(): boolean {
    return this.framesTried.some(frame => frame.photoIds.length > 0);
  }

  get totalFramesTried(): number {
    return this.framesTried.length;
  }

  get shortlistedFrames(): FrameTried[] {
    return this.framesTried.filter(frame => frame.shortlisted);
  }

  get photoCount(): number {
    return this.framesTried.reduce((count, frame) => count + frame.photoIds.length, 0);
  }

  get hasConsent(): boolean {
    return !!this.consentCapturedAt && !this.consentDeclined;
  }

  get needsSync(): boolean {
    return !this.synced;
  }

  // Methods
  addFrameTried(frame: Omit<FrameTried, 'triedAt'>): FrameTried {
    const frameWithTimestamp: FrameTried = {
      ...frame,
      triedAt: Date.now(),
    };
    
    this.framesTried.push(frameWithTimestamp);
    return frameWithTimestamp;
  }

  updateFrameVerdict(productId: string, verdict: FrameTried['verdict']): void {
    const frame = this.framesTried.find(f => f.productId === productId);
    if (frame) {
      frame.verdict = verdict;
    }
  }

  shortlistFrame(productId: string): void {
    const frame = this.framesTried.find(f => f.productId === productId);
    if (frame) {
      frame.shortlisted = true;
    }
  }

  removeFromShortlist(productId: string): void {
    const frame = this.framesTried.find(f => f.productId === productId);
    if (frame) {
      frame.shortlisted = false;
    }
  }

  addPhotoToFrame(productId: string, photoId: string): void {
    const frame = this.framesTried.find(f => f.productId === productId);
    if (frame && !frame.photoIds.includes(photoId)) {
      frame.photoIds.push(photoId);
    }
  }
}