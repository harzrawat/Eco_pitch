export interface CreditBalance {
  userId: string;
  credits: number;
}

export type TransactionReason = "session_taught" | "session_taken" | "purchase" | string;

export interface CreditTransaction {
  transactionId: string;
  delta: number;
  reason: TransactionReason;
  refId: string | null;
  createdAt: string;
}

export interface CreditHistoryResponse {
  success: boolean;
  data: CreditTransaction[];
  total: number;
  page: number;
}
