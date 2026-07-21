import { Model } from '@nozbe/watermelondb';
import { text, field, json, date, readonly } from '@nozbe/watermelondb/decorators';

export interface ClientEnrichment {
  faceShape?: 'round' | 'oval' | 'square' | 'heart' | 'oblong';
  frameWidth?: number;
  bridgeWidth?: number;
  customFields?: Record<string, unknown>;
}

export interface ClientPreferences {
  shapes?: string[];
  materials?: string[];
  colours?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
}

export class Client extends Model {
  static table = 'clients';

  @text('foundry_id') foundryId!: string;
  @text('first_name') firstName!: string;
  @text('last_name') lastName!: string;
  @text('email') email?: string;
  @text('phone') phone?: string;
  @text('status') status!: string;
  @text('lifecycle_stage') lifecycleStage?: string;
  @text('tier_tag') tierTag?: string;
  @field('order_count') orderCount!: number;
  @field('total_spent') totalSpent!: number; // cents
  @readonly @date('last_activity_at') lastActivityAt?: Date;
  @json('enrichment_json', (json) => json) enrichment!: ClientEnrichment;
  @json('preferences_json', (json) => json) preferences!: ClientPreferences;
  @json('tags', (json) => json) tags!: string[];
  @readonly @date('synced_at') syncedAt!: Date;

  // Computed properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get displayName(): string {
    return `${this.firstName} ${this.lastName.charAt(0)}.`;
  }

  get tier(): string {
    return this.tierTag || 'standard';
  }

  get lifetimeValue(): string {
    return `$${(this.totalSpent / 100).toFixed(2)}`;
  }

  get initials(): string {
    return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase();
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  get isVip(): boolean {
    return this.hasTag('VIP') || this.tier === 'cult';
  }
}