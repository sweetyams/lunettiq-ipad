export interface Client {
  shopifyCustomerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tags: string[];
  tier?: string;
  creditBalance?: number;
  metafields?: {
    fitProfile?: FitProfile;
    preferences?: Preferences;
  };
}

export interface FitProfile {
  faceShape?: string;
  frameWidth?: number;
  lensWidth?: number;
  bridge?: number;
  templeLength?: number;
}

export interface Preferences {
  shapes?: string[];
  materials?: string[];
  colors?: string[];
  avoid?: string[];
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  productType: string;
  tags: string[];
  images: { src: string }[];
  variants: Variant[];
}

export interface Variant {
  id: string;
  title: string;
  price: string;
  sku?: string;
  inventoryQuantity?: number;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName?: string;
  staffId: string;
  locationId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'fitting' | 'eye_exam' | 'second_sight' | 'custom_design' | 'consultation';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'no_show' | 'cancelled';
  notes?: string;
}

export interface Session {
  id: string;
  clientId: string;
  staffId: string;
  locationId: string;
  appointmentId?: string;
  startedAt: string;
  endedAt?: string;
  mode: 'discovery' | 'session' | 'fitting';
  outcome?: 'purchased' | 'shortlist_emailed' | 'second_visit_booked' | 'left_empty';
  framesTried: FrameTried[];
  shortlisted: string[];
  sessionNotes?: string;
}

export interface FrameTried {
  productId: string;
  variantId?: string;
  photos: string[];
  verdict?: 'loved' | 'liked' | 'unsure' | 'rejected';
  notes?: string;
}

export interface TryOnPhoto {
  id: string;
  sessionId: string;
  variantId?: string;
  uri: string;
  verdict?: 'loved' | 'liked' | 'unsure' | 'rejected';
  notes?: string;
}

export interface SecondSightIntake {
  id: string;
  clientId: string;
  frameId?: string;
  frameName?: string;
  grade: 'A' | 'B' | 'C';
  creditAmount: number;
  photos: string[];
  notes?: string;
  status: 'pending' | 'received' | 'approved' | 'rejected';
}

export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  payload: any;
  createdAt: string;
  attempts: number;
  error?: string;
}
