export interface LoyaltyBalance {
  customerId: string;
  balance: number; // credits (not dollars)
  currency: string;
  ledger: LoyaltyLedgerEntry[];
}

export interface LoyaltyLedgerEntry {
  id: string;
  amount: number; // positive = earned, negative = spent
  reason: string;
  type: 'manual' | 'purchase' | 'referral' | 'second_sight' | 'redemption';
  createdAt: string;
  createdBy?: string;
}

export interface IssueCreditPayload {
  amount: number;
  reason: string;
  type: 'manual' | 'second_sight' | 'referral';
}