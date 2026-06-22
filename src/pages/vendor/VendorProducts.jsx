import { useEffect, useState } from 'react';
import { Package, Search } from 'lucide-react';
import { vendorProductsApi } from '../../api/client';
import { formatPKR } from '../../utils/format';

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorProductsApi().then((d) => setProducts(d?.products || [])).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    const s = q.toLowerCase();
    return !s || (p.title || '').toLowerCase().includes(s) || (p.brand || '').toLowerCase().includes(s);
  });

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2"><Package size={20} className="text-brand-700" /> My Products ({filtered.length})</h1>
          <p className="text-sm text-ink-500">SKUs assigned to your vendor account.</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input className="input pl-9 !py-2 !text-sm w-56" placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </header>

      {loading ? <div className="text-ink-500">Loading...</div> : filtered.length === 0 ? (
        <div className="card p-6 text-sm text-ink-500">No products yet. Submit a <a href="/vendor/listing-requests" className="text-brand-700 font-semibold">new listing request</a> to propose one.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-100/60 dark:bg-white/5 text-left">
                <tr>{['Product', 'Brand', 'Category', 'Price', 'Stock', 'Status'].map((h) => <th key={h} className="px-4 py-3 text-xs uppercase tracking-wider font-bold text-ink-500">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-ink-100 dark:border-white/10">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] && <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                        <div className="font-medium line-clamp-1">{p.title}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-500">{p.brand || '-'}</td>
                    <td className="px-4 py-3 capitalize">{(p.category || '').replace(/-/g, ' ')}</td>
                    <td className="px-4 py-3 font-semibold text-brand-700">{formatPKR(p.price)}</td>
                    <td className="px-4 py-3"><span className={'badge ' + (Number(p.stock) < 10 ? 'bg-rose-50 text-rose-700' : 'bg-brand-50 text-brand-700')}>{p.stock}</span></td>
                    <td className="px-4 py-3"><span className="badge bg-ink-100 text-ink-700">{p.status || 'active'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
