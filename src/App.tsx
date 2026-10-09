import { useEffect, useMemo, useState } from 'react';
import { loadTransactions, saveTransactions, totals, type Transaction, type TransactionType } from './storage';

const categories = ['餐饮','交通','购物','住房','娱乐','工资','其他'];
const today = () => { const d = new Date(); const offset = d.getTimezoneOffset(); return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10); };
const emptyForm = { amount: '', type: 'expense' as TransactionType, category: '餐饮', date: today(), note: '' };

export default function App() {
  const [items, setItems] = useState<Transaction[]>(loadTransactions);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState('');
  useEffect(() => saveTransactions(items), [items]);
  const summary = useMemo(() => totals(items), [items]);
  const visible = useMemo(() => [...items].sort((a,b) => b.date.localeCompare(a.date)), [items]).filter(x => !filterDate || x.date === filterDate);
  function submit(e: React.FormEvent) {
    e.preventDefault(); const amount = Number(form.amount); if (!Number.isFinite(amount) || amount <= 0 || !form.date) return;
    if (editing) setItems(xs => xs.map(x => x.id === editing ? {...x, amount, type: form.type, category: form.category, date: form.date, note: form.note.trim()} : x));
    else setItems(xs => [...xs, { id: crypto.randomUUID(), amount, type: form.type, category: form.category, date: form.date, note: form.note.trim() }]);
    setEditing(null); setForm(emptyForm);
  }
  function edit(x: Transaction) { setEditing(x.id); setForm({amount:String(x.amount), type:x.type, category:x.category, date:x.date, note:x.note}); window.scrollTo({top:0, behavior:'smooth'}); }
  function remove(id: string) { setItems(xs => xs.filter(x => x.id !== id)); if (editing === id) { setEditing(null); setForm(emptyForm); } }
  return <main className="app">
    <header><div><p className="eyebrow">PERSONAL FINANCE</p><h1>个人记账</h1></div></header>
    <section className="summary"><div><span>总余额</span><strong>¥{summary.balance.toFixed(2)}</strong></div><div><span>总收入</span><strong className="income">¥{summary.income.toFixed(2)}</strong></div><div><span>总支出</span><strong className="expense">¥{summary.expense.toFixed(2)}</strong></div></section>
    <section className="card"><h2>{editing ? '编辑账目' : '添加账目'}</h2><form onSubmit={submit}>
      <label>金额<input inputMode="decimal" type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required /></label>
      <div className="row"><label>类型<select value={form.type} onChange={e=>setForm({...form,type:e.target.value as TransactionType})}><option value="expense">支出</option><option value="income">收入</option></select></label><label>分类<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label></div>
      <label>日期<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required /></label><label>备注<input value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="可选" /></label>
      <div className="actions"><button type="submit">{editing ? '保存修改' : '添加账目'}</button>{editing && <button type="button" className="secondary" onClick={()=>{setEditing(null);setForm(emptyForm)}}>取消</button>}</div>
    </form></section>
    <section className="card"><div className="list-head"><h2>账目</h2><input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} aria-label="按日期筛选" />{filterDate && <button className="link" onClick={()=>setFilterDate('')}>显示全部</button>}</div>
      {visible.length === 0 ? <p className="empty">暂无账目</p> : <div className="transactions">{visible.map(x=><article className="transaction" key={x.id}><div><b>{x.category}</b><small>{x.date}{x.note ? ` · ${x.note}` : ''}</small></div><div className={x.type}>{x.type === 'income' ? '+' : '-'}¥{x.amount.toFixed(2)}<div className="row-actions"><button onClick={()=>edit(x)}>编辑</button><button onClick={()=>remove(x.id)}>删除</button></div></div></article>)}</div>}
    </section>
  </main>;
}
