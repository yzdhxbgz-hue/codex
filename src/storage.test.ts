import { describe, expect, it } from 'vitest';
import { totals } from './storage';

describe('totals', () => {
  it('calculates income, expense and balance', () => {
    expect(totals([
      {id:'1',amount:100,type:'income',category:'工资',date:'2026-10-01',note:''},
      {id:'2',amount:35.5,type:'expense',category:'餐饮',date:'2026-10-02',note:''},
      {id:'3',amount:10,type:'expense',category:'交通',date:'2026-10-03',note:''}
    ])).toEqual({income:100, expense:45.5, balance:54.5});
  });
});
