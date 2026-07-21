import { Model } from '@nozbe/watermelondb';
import { text, field, json, date, readonly } from '@nozbe/watermelondb/decorators';

export interface ProductDimensions {
  width: number;
  bridge: number;
  temple: number;
  lensHeight: number;
  lensWidth: number;
}

export interface ProductLocationStock {
  [locationId: string]: number;
}

export class Product extends Model {
  static table = 'products';

  @text('shopify_id') shopifyId!: string;
  @text('family_id') familyId!: string;
  @text('family_code') familyCode!: string;
  @text('title') title!: string;
  @text('vendor') vendor!: string;
  @text('handle') handle!: string;
  @text('type') type!: string;
  @text('material') material?: string;
  @text('shape') shape?: string;
  @text('colour') colour?: string;
  @text('colour_hex') colourHex?: string;
  @text('barcode') barcode?: string;
  @field('price') price!: number; // cents
  @field('compare_at_price') compareAtPrice?: number;
  @text('image_url') imageUrl?: string;
  @json('images', (json) => json) images!: string[];
  @json('dimensions', (json) => json) dimensions!: ProductDimensions;
  @json('tags', (json) => json) tags!: string[];
  @text('status') status!: string;
  @field('stock_level') stockLevel!: number;
  @json('location_stock_json', (json) => json) locationStock!: ProductLocationStock;
  @field('sort_order') sortOrder!: number;
  @readonly @date('synced_at') syncedAt!: Date;

  // Computed properties
  get displayPrice(): string {
    return `$${(this.price / 100).toFixed(2)}`;
  }

  get isInStock(): boolean {
    return this.stockLevel > 0;
  }

  get familyName(): string {
    return `${this.vendor} ${this.familyCode}`;
  }

  getStockForLocation(locationId: string): number {
    return this.locationStock[locationId] || 0;
  }
}