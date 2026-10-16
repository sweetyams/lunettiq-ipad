export interface Prescription {
  id: string;
  clientId: string;
  clientName?: string;
  /** Lens type, when the record carries one (Foundry's Rx rows do not). */
  type?: 'single_vision' | 'progressive' | 'bifocal' | 'reading' | 'other';
  /** Foundry review status. */
  status?: 'submitted' | 'verified' | 'discrepancy' | 'expired';
  sphereOd?: number;
  cylinderOd?: number;
  axisOd?: number;
  addOd?: number;
  sphereOs?: number;
  cylinderOs?: number;
  axisOs?: number;
  addOs?: number;
  pdRight?: number;
  pdLeft?: number;
  prescribedBy?: string;
  clinicName?: string;
  prescribedAt?: string;
  expiresAt?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrescriptionPayload {
  clientId: string;
  type: Prescription['type'];
  sphereOd?: number;
  cylinderOd?: number;
  axisOd?: number;
  addOd?: number;
  sphereOs?: number;
  cylinderOs?: number;
  axisOs?: number;
  addOs?: number;
  pdRight?: number;
  pdLeft?: number;
  prescribedBy?: string;
  prescribedAt?: string;
  expiresAt?: string;
  notes?: string;
}

export interface UpdatePrescriptionPayload {
  verified?: boolean;
  notes?: string;
  // All Rx fields also updatable
  sphereOd?: number;
  cylinderOd?: number;
  axisOd?: number;
  addOd?: number;
  sphereOs?: number;
  cylinderOs?: number;
  axisOs?: number;
  addOs?: number;
  pdRight?: number;
  pdLeft?: number;
}