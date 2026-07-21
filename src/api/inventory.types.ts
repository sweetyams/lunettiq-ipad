export interface Protection {
  id: string;
  productId: string;
  productName: string;
  reason: 'try_on_hold' | 'rx_in_progress';
  clientId?: string;
  clientName?: string;
  sessionId?: string;
  expiresAt: string;
  createdAt: string;
  createdBy: string;
}

export interface CreateProtectionPayload {
  productId: string;
  variantId?: string;
  reason: 'try_on_hold' | 'rx_in_progress';
  clientId?: string;
  sessionId?: string;
  expiresAt?: string; // ISO string, defaults to 48h from now
}

export interface BarcodeResolveResult {
  productId: string;
  variantId?: string;
  title: string;
  barcode: string;
}