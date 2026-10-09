// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

let container: HTMLDivElement;
let root: Root;

function renderApp() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<App />));
}

function setValue(element: HTMLInputElement | HTMLSelectElement, value: string) {
  const prototype = element instanceof HTMLSelectElement
    ? HTMLSelectElement.prototype
    : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  act(() => {
    setter?.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function click(button: HTMLButtonElement) {
  act(() => button.dispatchEvent(new MouseEvent('click', { bubbles: true })));
}

function addTransaction({ amount, type = 'expense', date = '2026-10-09', note = '' }: {
  amount: string; type?: 'income' | 'expense'; date?: string; note?: string;
}) {
  const inputs = container.querySelectorAll('form input');
  setValue(inputs[0] as HTMLInputElement, amount);
  setValue(container.querySelector('form select') as HTMLSelectElement, type);
  setValue(inputs[1] as HTMLInputElement, date);
  setValue(inputs[2] as HTMLInputElement, note);
  act(() => container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('crypto', { randomUUID: () => 'new-transaction-id' });
});

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});

describe('bookkeeping UI', () => {
  it('adds a transaction and updates income, expense and balance', () => {
    renderApp();
    addTransaction({ amount: '25.50', type: 'income', note: 'salary' });
    expect(container.textContent).toContain('¥25.50');
    expect(container.textContent).toContain('+¥25.50');
    expect(localStorage.getItem('personal-bookkeeping-transactions')).toContain('"amount":25.5');
  });

  it('edits a transaction without duplicating it and updates totals', () => {
    localStorage.setItem('personal-bookkeeping-transactions', JSON.stringify([
      { id: 'existing', amount: 20, type: 'expense', category: '餐饮', date: '2026-10-09', note: 'old' },
    ]));
    renderApp();
    click(Array.from(container.querySelectorAll('button')).find(button => button.textContent === '编辑')!);
    const amount = container.querySelector('form input') as HTMLInputElement;
    setValue(amount, '30');
    const inputs = container.querySelectorAll('form input');
    setValue(inputs[2] as HTMLInputElement, 'updated');
    act(() => container.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(container.querySelectorAll('.transaction')).toHaveLength(1);
    expect(container.textContent).toContain('-¥30.00');
    expect(container.textContent).not.toContain('old');
    expect(container.textContent).toContain('updated');
    const saved = JSON.parse(localStorage.getItem('personal-bookkeeping-transactions') || '[]');
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ amount: 30, note: 'updated' });
  });

  it('deletes a transaction and updates totals', () => {
    localStorage.setItem('personal-bookkeeping-transactions', JSON.stringify([
      { id: 'existing', amount: 20, type: 'expense', category: '餐饮', date: '2026-10-09', note: '' },
    ]));
    renderApp();
    click(Array.from(container.querySelectorAll('button')).find(button => button.textContent === '删除')!);
    expect(container.querySelectorAll('.transaction')).toHaveLength(0);
    expect(container.textContent).toContain('¥0.00');
    expect(JSON.parse(localStorage.getItem('personal-bookkeeping-transactions') || '[]')).toEqual([]);
  });

  it('filters by date and clearing the filter restores all transactions', () => {
    localStorage.setItem('personal-bookkeeping-transactions', JSON.stringify([
      { id: 'one', amount: 10, type: 'expense', category: '餐饮', date: '2026-10-08', note: 'first' },
      { id: 'two', amount: 20, type: 'expense', category: '交通', date: '2026-10-09', note: 'second' },
    ]));
    renderApp();
    setValue(container.querySelector('[aria-label="按日期筛选"]') as HTMLInputElement, '2026-10-09');
    expect(container.querySelectorAll('.transaction')).toHaveLength(1);
    expect(container.textContent).toContain('second');
    expect(container.textContent).not.toContain('first');
    click(Array.from(container.querySelectorAll('button')).find(button => button.textContent === '显示全部')!);
    expect(container.querySelectorAll('.transaction')).toHaveLength(2);
  });

  it('keeps transactions after the app is remounted', () => {
    renderApp();
    addTransaction({ amount: '18', note: 'persist me' });
    act(() => root.unmount());
    container.remove();
    renderApp();
    expect(container.textContent).toContain('persist me');
    expect(container.textContent).toContain('-¥18.00');
  });
});
