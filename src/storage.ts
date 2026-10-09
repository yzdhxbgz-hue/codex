export type TransactionType = 'income' | 'expense';
export type Transaction = { id: string; amount: number; type: TransactionType; category: string; date: string; note: string };
const KEY = 'personal-bookkeeping-transactions';
export function loadTransactions(): Transaction[] {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as Transaction[] : []; } catch { return []; }
}
export function saveTransactions(items: Transaction[]): void { localStorage.setItem(KEY, JSON.stringify(items)); }
export function totals(items: Transaction[]) {
  const income = items.filter(x => x.type === 'income').reduce((s, x) => s + x.amount, 0);
  const expense = items.filter(x => x.type === 'expense').reduce((s, x) => s + x.amount, 0);
  return { income, expense, balance: income - expense };
}
