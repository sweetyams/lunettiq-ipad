export interface Receipt {
  id: string;
  customerId: string;
  orderId?: string;
  amount: number;
  insurerName: string;
  pdfUrl: string; // signed URL
  status: 'generated' | 'sent' | 'viewed';
  sentAt?: string;
  createdAt: string;
}

export interface SendReceiptPayload {
  email?: string; // override client email
}