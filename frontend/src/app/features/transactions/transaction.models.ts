export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  category: string;
  description: string | null;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionPayload {
  type: TransactionType;
  amount: number;
  category: string;
  description: string | null;
  transactionDate: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  category?: string;
  month?: string;
}
