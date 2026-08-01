import { Transaction, TransactionType } from './transaction.models';
import { calculateSummary } from './transaction-summary';

function transaction(type: TransactionType, amount: number): Transaction {
  return {
    id: 1,
    type,
    amount,
    category: 'Test',
    description: null,
    transactionDate: '2026-07-31',
    createdAt: '2026-07-31T08:00:00Z',
    updatedAt: '2026-07-31T08:00:00Z',
  };
}

describe('calculateSummary', () => {
  it('calculates income, expense, and balance from the loaded transactions', () => {
    expect(
      calculateSummary([
        transaction('INCOME', 1000000),
        transaction('EXPENSE', 125000),
        transaction('EXPENSE', 75000),
      ]),
    ).toEqual({
      income: 1000000,
      expense: 200000,
      balance: 800000,
    });
  });

  it('returns zero values for an empty list', () => {
    expect(calculateSummary([])).toEqual({
      income: 0,
      expense: 0,
      balance: 0,
    });
  });

  it('does not mutate the loaded transactions', () => {
    const transactions = [
      Object.freeze(transaction('EXPENSE', 125000)),
      Object.freeze(transaction('INCOME', 1000000)),
    ];
    const orderBeforeCalculation = [...transactions];

    calculateSummary(transactions);

    expect(transactions).toEqual(orderBeforeCalculation);
    expect(transactions[0]?.amount).toBe(125000);
    expect(transactions[1]?.amount).toBe(1000000);
  });
});
