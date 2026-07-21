export { Product } from './Product.model';
export type { ProductDimensions, ProductLocationStock } from './Product.model';

export { Client } from './Client.model';
export type { ClientEnrichment, ClientPreferences } from './Client.model';

export { Appointment } from './Appointment.model';
export type { AppointmentStatus } from './Appointment.model';

export { Session } from './Session.model';
export type { FrameTried, SessionOutcome } from './Session.model';

export { SyncQueue } from './SyncQueue.model';
export type { 
  SyncOperation, 
  SyncMethod, 
  SyncPriority, 
  SyncStatus 
} from './SyncQueue.model';

export { PhotoUpload } from './PhotoUpload.model';
export type { 
  PhotoContext, 
  PhotoVerdict, 
  PhotoUploadStatus 
} from './PhotoUpload.model';

export { DeviceConfig } from './DeviceConfig.model';
export type { PrivacyMode } from './DeviceConfig.model';