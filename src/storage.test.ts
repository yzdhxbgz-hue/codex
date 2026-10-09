import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadTransactions, saveTransactions, totals, type Transaction } from './storage';

const sample: Transaction[] = [
  { id: '1', amount: 100, type: 'income', category: '工资', date: '2026-10-01', note: '' },
  { id: '2', amount: 35.5, type: 'expense', category: '餐饮', date: '2026-10-02', note: '午餐' },
  { id: '3', amount: 10, type: 'expense', category: '交通', date: '2026-10-03', note: '' },
];

function mockLocalStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage = {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { data.set(key, String(value)); }),
    removeItem: vi.fn((key: string) => { data.delete(key); }),
    clear: vi.fn(() => data.clear()),
  };
  vi.stubGlobal('localStorage', storage);
  return { storage, data };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('totals', () => {
  it('calculates income, expense and balance', () => {
    expect(totals(sample)).toEqual({ income: 100, expense: 45.5, balance: 54.5 });
  });

  it('returns zero totals for an empty ledger', () => {
    expect(totals([])).toEqual({ income: 0, expense: 0, balance: 0 });
  });

  it('handles income-only and expense-only ledgers', () => {
    expect(totals([sample[0]])).toEqual({ income: 100, expense: 0, balance: 100 });
    expect(totals(sample.slice(1))).toEqual({ income: 0, expense: 45.5, balance: -45.5 });
  });
});

describe('transaction persistence', () => {
  it('returns an empty list when storage has no saved transactions', () => {
    mockLocalStorage();
    expect(loadTransactions()).toEqual([]);
  });

  it('saves transactions and loads the same data back', () => {
    mockLocalStorage();
    saveTransactions(sample);
    expect(loadTransactions()).toEqual(sample);
  });

  it('recovers to an empty list when saved JSON is malformed', () => {
    mockLocalStorage({ 'personal-bookkeeping-transactions': '{not valid json' });
    expect(loadTransactions()).toEqual([]);
  });
});
