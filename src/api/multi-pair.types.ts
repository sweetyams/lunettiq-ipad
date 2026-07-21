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
  answers: QuestionnaireAnswer[];
  completedAt?: string;
}

export interface QuestionnaireAnswer {
  questionId: string;
  questionText: string;
  answer: string | string[] | number;
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
  answers: { questionId: string; answer: string | string[] | number }[];
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