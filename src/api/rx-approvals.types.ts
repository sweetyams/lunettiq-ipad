export type ApprovalStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'returned';

export interface RxApproval {
  id: string;
  orderId: string;
  clientId: string;
  clientName: string;
  status: ApprovalStatus;
  submittedBy: string;
  submittedAt: string;
  claimedBy?: string;
  claimedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  signedOffBy?: string;
  signedOffAt?: string;
  snapshot: RxApprovalSnapshot;
  notes?: string;
  returnReason?: string;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RxApprovalSnapshot {
  prescription: {
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
  };
  measurements?: {
    segHeight?: number;
    ocHeight?: number;
    pantoscopicTilt?: number;
  };
  product?: {
    id: string;
    name: string;
    sku?: string;
  };
  lensType?: string;
  coatings?: string[];
}

export interface ApprovalSummary {
  submitted: number;
  in_review: number;
  approved: number;
  rejected: number;
  returned: number;
  total: number;
}

export interface ApprovalChecklist {
  items: { key: string; label: string; passed: boolean; required: boolean }[];
  allPassed: boolean;
}

export interface ReadinessCheck {
  ready: boolean;
  checks: { key: string; label: string; passed: boolean }[];
}

export interface SubmitApprovalPayload {
  orderId: string;
  notes?: string;
}

/** Foundry returnApprovalSchema. */
export interface ReturnPayload {
  reasons: { code: string; label: string }[];
  note: string;
}

/** Foundry rejectApprovalSchema. */
export interface RejectPayload {
  category: string;
  note: string;
}

/** Foundry signOffSchema: the optician re-authenticates (their PIN on the iPad) and attests. */
export interface SignOffPayload {
  reauth: { method: 'surface_pin' | 'clerk_stepup'; token: string };
  attestationVersion: string;
}

export interface CorrectionsPayload {
  corrections: Record<string, unknown>;
  notes?: string;
}