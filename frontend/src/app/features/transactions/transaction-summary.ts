import { Transaction } from './transaction.models';

export interface TransactionSummary {
  income: number;
  expense: number;
  balance: number;
}

export function calculateSummary(transactions: readonly Transaction[]): TransactionSummary {
  const income = transactions
    .filter((transaction) => transaction.type === 'INCOME')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const expense = transactions
    .filter((transaction) => transaction.type === 'EXPENSE')
    .reduce((total, transaction) => total + transaction.amount, 0);

  return {
    income,
    expense,
    balance: income - expense,
  };
}
