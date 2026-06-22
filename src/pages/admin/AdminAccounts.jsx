import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Wallet, TrendingUp, TrendingDown, Clock, Plus, Trash2, X, Search, Filter,
  Download, Check, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../../data/accounts';
import { selectUser } from '../../store/authSlice';
import { formatPKR } from '../../utils/format';
import RequirePermission from '../../components/admin/RequirePermission';
import { transactionsListApi, transactionCreateApi, transactionDeleteApi, transactionUpdateApi } from '../../api/client';

const METHODS = ['Cash', 'Bank Transfer', 'COD', 'JazzCash', 'Easypaisa'];
const PIE_COLORS = ['#c41e1e', '#e62626', '#ff3131', '#ff5252', '#ff8a8a', '#f59e0b', '#fb7185', '#a78bfa'];

function AdminAccountsInner() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const me = useSelector(selectUser);
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [adding, setAdding] = useState(null);

  const load = () => {
    setLoading(true);
    transactionsListApi()
      .then((data) => setItems(data.transactions || []))
      .catch(() => toast.error('Failed to load transactions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const list = useMemo(() => {
    let l = [...items];
    if (typeFilter === 'income')  l = l.filter((t) => t.type === 'income');
    if (typeFilter === 'expense') l = l.filter((t) => t.type === 'expense');
    if (typeFilter === 'pending') l = l.filter((t) => t.status === 'pending');
    if (q) {
      const s = q.toLowerCase();
      l = l.filter((t) => ((t.description || '') + (t.category || '') + (t.reference || '') + (t.method || '')).toLowerCase().includes(s));
    }
    return l.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [items, q, typeFilter]);

  const totals = useMemo(() => {
    const income   = items.filter((t) => t.type === 'income'  && t.status === 'cleared').reduce((s, t) => s + Number(t.amount), 0);
    const expense  = items.filter((t) => t.type === 'expense' && t.status === 'cleared').reduce((s, t) => s + Number(t.amount), 0);
    const receivable = items.filter((t) => t.type === 'income' && t.status === 'pending').reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, net: income - expense, receivable };
  }, [items]);

  const expenseByCat = useMemo(() => {
    const map = {};
    items.filter((t) => t.type === 'expense' && t.status === 'cleared').forEach((t) => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [items]);

  const margin = totals.income > 0 ? Math.round((totals.net / totals.income) * 100) : 0;

  const openAdd = (type) => setAdding({
    type, category: type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
    description: '', amount: '', date: new Date().toISOString().slice(0, 10),
    method: 'Cash', status: 'cleared', reference: ''
  });

  const save = async () => {
    if (!adding.description.trim()) return toast.error('Enter a description');
    if (!adding.amount || Number(adding.amount) <= 0) return toast.error('Enter a valid amount');
    try {
      const data = await transactionCreateApi({ ...adding, amount: Number(adding.amount) });
      setItems((prev) => [data.transaction, ...prev]);
      toast.success('Transaction recorded');
      setAdding(null);
    } catch {
      toast.error('Failed to save transaction');
    }
  };

  const markCleared = async (id) => {
    try {
      const data = await transactionUpdateApi(id, { status: 'cleared' });
      setItems((prev) => prev.map((t) => t.id === id ? { ...t, ...data.transaction } : t));
      toast.success('Marked cleared');
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await transactionDeleteApi(id);
      setItems((prev) => prev.filter((t) => t.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const exportCsv = () => {
    const cols = ['date', 'type', 'category', 'description', 'amount', 'method', 'status', 'reference'];
    const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const rows = [cols.join(',')];
    [...items].sort((a, b) => (b.date || '').localeCompare(a.date || '')).forEach((t) => rows.push(cols.map((c) => esc(t[c])).join(',')));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `al-rafiq-accounts-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2"><Wallet size={20} className="text-brand-700" /> Accounts &amp; Finance</h1>
          <p className="text-xs text-ink-500">Income and commission post automatically when an order is <b>paid</b> and <b>shipped</b> (In Transit or Delivered). Other entries remain manual.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportCsv} className="btn-ghost !py-2 !px-3 text-sm"><Download size={14} /> Export</button>
          <button onClick={() => openAdd('expense')} className="btn-outline !py-2 !px-3 text-sm"><ArrowDownRight size={14} /> Add Expense</button>
          <button onClick={() => openAdd('income')} className="btn-primary !py-2 !px-3 text-sm"><ArrowUpRight size={14} /> Add Income</button>
        </div>
      </header>

      <div className="rounded-xl border border-brand-200 bg-brand-50 dark:bg-brand-900/20 dark:border-brand-800 px-4 py-3 text-sm text-brand-900 dark:text-brand-100">
        <b>Automated from orders:</b> When payment is <b>Paid</b> and delivery is <b>In Transit</b> or <b>Delivered</b>, product sales, shipping fees, and platform commission are recorded here automatically (reference = order ID). Cancelled/refunded orders remove those entries. Add rent, salaries, and other expenses manually.
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Income"            value={formatPKR(totals.income)}     tone="brand" icon={TrendingUp} />
        <StatCard label="Total Expenses"          value={formatPKR(totals.expense)}    tone="rose"  icon={TrendingDown} />
        <StatCard label="Net Profit"              value={formatPKR(totals.net)}        tone={totals.net >= 0 ? 'brand' : 'rose'} icon={Wallet} sub={`${margin}% margin`} />
        <StatCard label="Receivables (pending)"   value={formatPKR(totals.receivable)} tone="amber" icon={Clock} sub="COD in transit" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="font-bold mb-3">Expense Breakdown</h3>
          {expenseByCat.length === 0 ? (
            <div className="text-sm text-ink-500 py-10 text-center">No expenses recorded yet.</div>
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseByCat} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                      {expenseByCat.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatPKR(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 text-xs mt-2">
                {expenseByCat.map((e, i) => (
                  <div key={e.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="flex-1 truncate">{e.name}</span>
                    <span className="text-ink-500 tabular-nums">{formatPKR(e.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="font-bold mb-3">Profit &amp; Loss (current period)</h3>
          <dl className="text-sm divide-y divide-ink-100 dark:divide-white/10">
            <Row label="Gross income (cleared)" value={formatPKR(totals.income)} strong />
            <Row label="Pending receivables (COD)" value={formatPKR(totals.receivable)} muted />
            <Row label="Total expenses" value={`- ${formatPKR(totals.expense)}`} negative />
            <div className="flex items-center justify-between py-3">
              <dt className="font-extrabold">Net Profit</dt>
              <dd className={`font-extrabold text-lg ${totals.net >= 0 ? 'text-brand-700' : 'text-rose-600'}`}>{formatPKR(totals.net)}</dd>
            </div>
          </dl>
          <div className="mt-2 rounded-xl bg-ink-100/50 dark:bg-white/5 p-3 text-xs text-ink-500">
            Net profit margin: <b className={totals.net >= 0 ? 'text-brand-700' : 'text-rose-600'}>{margin}%</b>.
            Once pending COD orders clear, projected income becomes <b className="text-ink-700 dark:text-ink-200">{formatPKR(totals.income + totals.receivable)}</b>.
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Filter size={14} className="text-ink-500" />
          {[['all', 'All'], ['income', 'Income'], ['expense', 'Expenses'], ['pending', 'Pending']].map(([k, l]) => (
            <button key={k} onClick={() => setTypeFilter(k)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap ${typeFilter === k ? 'bg-brand-500 text-white border-transparent' : 'bg-white dark:bg-ink-900 border-ink-200 dark:border-white/10 hover:border-brand-300'}`}>{l}</button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ledger..." className="input pl-9 !py-2 !text-sm w-56" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-ink-500 text-sm">Loading transactions…</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-ink-100/60 dark:bg-white/5 text-left">
                <tr>{['Date', 'Type', 'Category', 'Description', 'Method', 'Amount', 'Status', ''].map((h) => <th key={h} className="px-4 py-3 text-xs uppercase tracking-wider font-bold text-ink-500">{h}</th>)}</tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-ink-500 text-sm">No transactions match your filter.</td></tr>
                ) : list.map((t) => (
                  <tr key={t.id} className="border-t border-ink-100 dark:border-white/10 hover:bg-ink-100/40 dark:hover:bg-white/5">
                    <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{t.date}</td>
                    <td className="px-4 py-3"><span className={`badge ${t.type === 'income' ? 'bg-brand-50 text-brand-700' : 'bg-rose-50 text-rose-700'}`}>{t.type}</span></td>
                    <td className="px-4 py-3 whitespace-nowrap">{t.category}</td>
                    <td className="px-4 py-3 min-w-[200px]">{t.description}{t.reference && <span className="text-ink-500"> ({t.reference})</span>}</td>
                    <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{t.method}</td>
                    <td className={`px-4 py-3 font-semibold whitespace-nowrap ${t.type === 'income' ? 'text-brand-700' : 'text-rose-600'}`}>{t.type === 'income' ? '+' : '-'} {formatPKR(t.amount)}</td>
                    <td className="px-4 py-3"><span className={`badge ${t.status === 'cleared' ? 'bg-brand-50 text-brand-700' : 'bg-amber-50 text-amber-700'}`}>{t.status}</span></td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {t.status === 'pending' && (
                        <button onClick={() => markCleared(t.id)} className="btn-ghost !p-2 text-brand-700" title="Mark cleared"><Check size={14} /></button>
                      )}
                      <button onClick={() => handleDelete(t.id)} className="btn-ghost !p-2 text-red-500" title="Delete"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {adding && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAdding(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-ink-900 shadow-2xl overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg capitalize">{adding.type === 'income' ? 'Add Income' : 'Add Expense'}</h2>
              <button onClick={() => setAdding(null)} className="btn-ghost !p-2"><X /></button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setAdding({ ...adding, type: 'income', category: INCOME_CATEGORIES[0] })} className={`rounded-xl border py-2 text-sm font-semibold ${adding.type === 'income' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-ink-200'}`}>Income</button>
              <button onClick={() => setAdding({ ...adding, type: 'expense', category: EXPENSE_CATEGORIES[0] })} className={`rounded-xl border py-2 text-sm font-semibold ${adding.type === 'expense' ? 'bg-rose-50 border-rose-400 text-rose-700' : 'border-ink-200'}`}>Expense</button>
            </div>

            <label className="text-sm block"><div className="font-semibold mb-1">Category</div>
              <select className="input" value={adding.category} onChange={(e) => setAdding({ ...adding, category: e.target.value })}>
                {(adding.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <label className="text-sm block"><div className="font-semibold mb-1">Description *</div>
              <input className="input" value={adding.description} onChange={(e) => setAdding({ ...adding, description: e.target.value })} placeholder="What was this for?" />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm block"><div className="font-semibold mb-1">Amount (PKR) *</div>
                <input type="number" className="input" value={adding.amount} onChange={(e) => setAdding({ ...adding, amount: e.target.value })} />
              </label>
              <label className="text-sm block"><div className="font-semibold mb-1">Date</div>
                <input type="date" className="input" value={adding.date} onChange={(e) => setAdding({ ...adding, date: e.target.value })} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm block"><div className="font-semibold mb-1">Method</div>
                <select className="input" value={adding.method} onChange={(e) => setAdding({ ...adding, method: e.target.value })}>
                  {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
              <label className="text-sm block"><div className="font-semibold mb-1">Status</div>
                <select className="input" value={adding.status} onChange={(e) => setAdding({ ...adding, status: e.target.value })}>
                  <option value="cleared">Cleared</option>
                  <option value="pending">Pending (receivable)</option>
                </select>
              </label>
            </div>

            <label className="text-sm block"><div className="font-semibold mb-1">Reference (optional)</div>
              <input className="input" value={adding.reference} onChange={(e) => setAdding({ ...adding, reference: e.target.value })} placeholder="e.g. ARS-1028, PO-330" />
            </label>

            <button onClick={save} className="btn-primary w-full !py-3">Save Transaction</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone, icon: Icon, sub }) {
  const palette = { brand: 'bg-brand-50 text-brand-700', rose: 'bg-rose-50 text-rose-700', amber: 'bg-amber-50 text-amber-700' };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-500 font-bold">{label}</div>
          <div className="text-xl font-extrabold mt-1">{value}</div>
          {sub && <div className="text-[11px] text-ink-500 mt-0.5">{sub}</div>}
        </div>
        <span className={`grid place-items-center w-10 h-10 rounded-xl ${palette[tone]}`}><Icon size={18} /></span>
      </div>
    </div>
  );
}

function Row({ label, value, strong, negative, muted }) {
  return (
    <div className="flex items-center justify-between py-2">
      <dt className={`${muted ? 'text-ink-500' : ''}`}>{label}</dt>
      <dd className={`font-semibold ${strong ? 'text-brand-700' : negative ? 'text-rose-600' : muted ? 'text-ink-500' : ''}`}>{value}</dd>
    </div>
  );
}

export default function AdminAccounts() {
  return (
    <RequirePermission permission="accounts">
      <AdminAccountsInner />
    </RequirePermission>
  );
}
