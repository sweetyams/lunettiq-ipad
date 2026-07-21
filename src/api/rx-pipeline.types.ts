export type RxOrderState = 'awaiting_rx' | 'ordered' | 'in_lab' | 'quality_check' | 'ready' | 'picked_up' | 'cancelled';

export interface RxOrder {
  id: string;
  clientId: string;
  clientName: string;
  prescriptionId?: string;
  productId?: string;
  productName?: string;
  state: RxOrderState;
  lab?: string;
  labOrderRef?: string;
  measurements?: RxMeasurements;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedReadyAt?: string;
}

export interface RxMeasurements {
  pd: { right: number; left: number };
  segHeight?: number;
  ocHeight?: number;
  pantoscopicTilt?: number;
  frameWrap?: number;
  vertexDistance?: number;
}

export interface RxPipelineCounts {
  awaiting_rx: number;
  ordered: number;
  in_lab: number;
  quality_check: number;
  ready: number;
  total: number;
}

export interface CreateRxOrderPayload {
  clientId: string;
  prescriptionId?: string;
  productId?: string;
  measurements?: RxMeasurements;
  notes?: string;
}

export interface UpdateRxOrderPayload {
  state?: RxOrderState;
  measurements?: RxMeasurements;
  notes?: string;
  lab?: string;
  labOrderRef?: string;
  estimatedReadyAt?: string;
}