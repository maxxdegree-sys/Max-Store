import { useEffect, useState } from 'react';
import { Search, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPKR } from '../../utils/format';
import ExportMenu from '../../components/admin/ExportMenu';
import { customersListApi } from '../../api/client';

const statusColor = {
  VIP:    'bg-amber-50 text-amber-700 ring-amber-200',
  Active: 'bg-brand-50 text-brand-700 ring-brand-200',
  New:    'bg-sky-50 text-sky-700 ring-sky-200'
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    setLoading(true);
    customersListApi()
      .then((data) => setCustomers(data.customers || []))
      .catch(() => toast.error('Failed to load customers'))
      .finally(() => setLoading(false));
  }, []);

  const list = customers.filter((c) =>
    !q || (c.name + c.email + c.city).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-extrabold">Customers ({list.length})</h1>
        <div className="flex items-center gap-2">
          <ExportMenu entity="customers" filters={{}} />
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="input pl-9 !py-2 !text-sm w-64" />
          </div>
        </div>
      </header>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-ink-500 text-sm">Loading customers…</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-ink-100/60 dark:bg-white/5 text-left">
                <tr>{['Customer', 'Contact', 'City', 'Orders', 'Lifetime Spend', 'Since', 'Status'].map((h) => <th key={h} className="px-4 py-3 text-xs uppercase tracking-wider font-bold text-ink-500">{h}</th>)}</tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-500">No customers found.</td></tr>
                ) : list.map((c) => (
                  <tr key={c.id} className="border-t border-ink-100 dark:border-white/10 hover:bg-ink-100/40 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid place-items-center w-9 h-9 rounded-full bg-brand-gradient text-white text-xs font-bold">
                          {(c.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('')}
                        </div>
                        <div className="font-medium">{c.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-500 text-xs space-y-0.5">
                      <div className="inline-flex items-center gap-1"><Mail size={12} /> {c.email || '—'}</div><br />
                      <div className="inline-flex items-center gap-1"><Phone size={12} /> {c.phone || '—'}</div>
                    </td>
                    <td className="px-4 py-3">{c.city}</td>
                    <td className="px-4 py-3 font-semibold">{c.orders}</td>
                    <td className="px-4 py-3 font-semibold text-brand-700">{formatPKR(c.totalSpend)}</td>
                    <td className="px-4 py-3 text-ink-500">{c.createdAt ? String(c.createdAt).slice(0, 10) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ring-1 ${statusColor[c.type] || 'bg-ink-100 text-ink-700 ring-ink-200'}`}>{c.type || 'New'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
