export interface MultiPairRecommendation {
  id: string;
  customerId: string;
  products: MultiPairProduct[];
  rationale: string;
  category: 'everyday' | 'computer' | 'sun' | 'sport' | 'reading';
  priority: number;
  accepted: boolean;
  acceptedAt?: string;
}

export interface MultiPairProduct {
  productId: string;
  productName: string;
  imageUrl?: string;
  reason: string;
  fitScore?: number;
}

export interface MultiPairQuestionnaire {
  id: string;
  customerId: string;
  responses: LifestyleResponses;
  completedBy: string | null;
  completedAt?: string;
  updatedAt?: string;
}

export interface InsuranceProfile {
  id: string;
  customerId: string;
  provider: string;
  policyNumber?: string;
  coverageAmount?: number;
  pairsAllowed: number;
  pairsUsed: number;
  renewalDate?: string;
  notes?: string;
}

export interface MultiPairSettings {
  enabled: boolean;
  maxRecommendations: number;
  categories: string[];
}

export interface SaveQuestionnairePayload {
  customerId: string;
  responses: LifestyleResponses;
}

/**
 * Structured lifestyle responses — must match the server's lifestyleResponsesSchema.
 * Keys correspond to QUESTIONNAIRE_FIELDS on the server.
 */
export interface LifestyleResponses {
  driving?: 'none' | 'occasional' | 'daily' | 'professional';
  screenTime?: 'minimal' | 'moderate' | 'heavy' | 'extreme';
  sports?: string[];
  hobbies?: string[];
  glareSensitivity?: 'none' | 'mild' | 'moderate' | 'severe';
  outdoorHours?: 'minimal' | 'moderate' | 'heavy';
  workEnvironment?: 'office' | 'outdoor' | 'mixed' | 'industrial';
  existingPairs?: number;
  lastSunglassPurchase?: string;
  primaryConcern?: 'vision' | 'style' | 'protection' | 'convenience';
}

export interface AcceptRecommendationPayload {
  recommendationId: string;
  productIds: string[];
}

export interface SaveInsurancePayload {
  customerId: string;
  provider: string;
  policyNumber?: string;
  coverageAmount?: number;
  pairsAllowed: number;
  pairsUsed?: number;
  renewalDate?: string;
  notes?: string;
}

export interface UpdateInsurancePayload {
  provider?: string;
  policyNumber?: string;
  coverageAmount?: number;
  pairsAllowed?: number;
  pairsUsed?: number;
  renewalDate?: string;
  notes?: string;
}