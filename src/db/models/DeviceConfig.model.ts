import { Model } from '@nozbe/watermelondb';
import { text, field, date, readonly } from '@nozbe/watermelondb/decorators';

export type PrivacyMode = 'staff' | 'client';

export class DeviceConfig extends Model {
  static table = 'device_config';

  @text('location_id') locationId!: string;
  @text('staff_id') staffId!: string;
  @readonly @date('last_full_sync_at') lastFullSyncAt?: Date;
  @readonly @date('last_incremental_sync_at') lastIncrementalSyncAt?: Date;
  @text('app_version') appVersion!: string;
  @field('upload_on_cellular') uploadOnCellular!: boolean;
  @text('privacy_mode') privacyMode!: PrivacyMode;

  // Computed properties
  get hasCompletedInitialSync(): boolean {
    return !!this.lastFullSyncAt;
  }

  get timeSinceLastSync(): number | null {
    const lastSync = this.lastIncrementalSyncAt || this.lastFullSyncAt;
    return lastSync ? Date.now() - lastSync.getTime() : null;
  }

  get hoursSinceLastSync(): number | null {
    const timeSince = this.timeSinceLastSync;
    return timeSince ? Math.round(timeSince / (1000 * 60 * 60)) : null;
  }

  get needsFullSync(): boolean {
    // Need full sync if it's been more than 24 hours or never synced
    const hours = this.hoursSinceLastSync;
    return !this.lastFullSyncAt || (hours !== null && hours > 24);
  }

  get isStaffMode(): boolean {
    return this.privacyMode === 'staff';
  }

  get isClientMode(): boolean {
    return this.privacyMode === 'client';
  }

  get shouldUploadPhotos(): boolean {
    // Upload photos if on WiFi, or if cellular uploads are enabled
    return this.uploadOnCellular; // Note: actual network check would be done in service layer
  }

  // Methods
  markFullSyncComplete(): void {
    this.lastFullSyncAt = new Date();
    this.lastIncrementalSyncAt = new Date();
  }

  markIncrementalSyncComplete(): void {
    this.lastIncrementalSyncAt = new Date();
  }

  togglePrivacyMode(): PrivacyMode {
    this.privacyMode = this.privacyMode === 'staff' ? 'client' : 'staff';
    return this.privacyMode;
  }

  setPrivacyMode(mode: PrivacyMode): void {
    this.privacyMode = mode;
  }

  enableCellularUploads(): void {
    this.uploadOnCellular = true;
  }

  disableCellularUploads(): void {
    this.uploadOnCellular = false;
  }

  updateAppVersion(version: string): void {
    this.appVersion = version;
  }

  updateStaff(staffId: string): void {
    this.staffId = staffId;
  }

  updateLocation(locationId: string): void {
    this.locationId = locationId;
  }

  // Static factory method
  static createDefault(
    locationId: string,
    staffId: string,
    appVersion: string
  ): Partial<DeviceConfig> {
    return {
      locationId,
      staffId,
      appVersion,
      uploadOnCellular: false, // Default to WiFi only
      privacyMode: 'staff', // Always start in staff mode
    };
  }

  // Singleton pattern helpers (only one config per device)
  static async getCurrent(database: any): Promise<DeviceConfig | null> {
    const configs = await database.collections.get('device_config').query().fetch();
    return configs[0] || null;
  }

  static async getOrCreate(
    database: any,
    locationId: string,
    staffId: string,
    appVersion: string
  ): Promise<DeviceConfig> {
    let config = await DeviceConfig.getCurrent(database);
    
    if (!config) {
      config = await database.write(async () => {
        return await database.collections.get('device_config').create((record: DeviceConfig) => {
          Object.assign(record, DeviceConfig.createDefault(locationId, staffId, appVersion));
        });
      });
    }
    
    return config!;
  }
}