import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Tag, Copy } from 'lucide-react';
import { couponsListApi, couponCreateApi, couponDeleteApi } from '../../api/client';
import { formatPKR } from '../../utils/format';

const EMPTY_FORM = { code: '', percent: 10, minOrder: 1000, description: '' };

export default function AdminCoupons() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () => {
    setLoading(true);
    couponsListApi()
      .then((data) => setList(data.coupons || []))
      .catch(() => toast.error('Failed to load coupons'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!form.code) return toast.error('Enter a coupon code');
    try {
      const data = await couponCreateApi({
        code: form.code.toUpperCase(),
        percent: form.percent,
        minOrder: form.minOrder,
        description: form.description,
        active: true
      });
      setList((l) => [data.coupon, ...l]);
      setForm(EMPTY_FORM);
      toast.success('Coupon created');
    } catch (err) {
      toast.error(err.message || 'Failed to create coupon');
    }
  };

  const remove = async (id) => {
    try {
      await couponDeleteApi(id);
      setList((l) => l.filter((c) => c.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Coupon Management</h1>
      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-ink-500 text-sm">Loading coupons…</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-ink-100/60 dark:bg-white/5 text-left">
                <tr>{['Code', 'Discount', 'Min Order', 'Description', ''].map((h) => <th key={h} className="px-4 py-3 text-xs uppercase tracking-wider font-bold text-ink-500">{h}</th>)}</tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-ink-500">No coupons yet.</td></tr>
                ) : list.map((c) => (
                  <tr key={c.id} className="border-t border-ink-100 dark:border-white/10">
                    <td className="px-4 py-3 font-mono font-bold inline-flex items-center gap-2"><Tag size={14} className="text-brand-700" /> {c.code}</td>
                    <td className="px-4 py-3 font-semibold text-brand-700">{c.percent ?? 0}%</td>
                    <td className="px-4 py-3">{formatPKR(c.min_order ?? 0)}</td>
                    <td className="px-4 py-3 text-ink-500">{c.description}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { navigator.clipboard?.writeText(c.code); toast.success('Copied'); }} className="btn-ghost !p-2"><Copy size={14} /></button>
                      <button onClick={() => remove(c.id)} className="btn-ghost !p-2 text-red-500"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <form onSubmit={create} className="card p-5 space-y-3 h-fit">
          <h3 className="font-bold flex items-center gap-2"><Plus size={16} /> Create Coupon</h3>
          <label className="text-sm block"><div className="font-semibold mb-1">Code</div><input className="input uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm block"><div className="font-semibold mb-1">% Off</div><input type="number" className="input" value={form.percent} onChange={(e) => setForm({ ...form, percent: +e.target.value })} /></label>
            <label className="text-sm block"><div className="font-semibold mb-1">Min Order</div><input type="number" className="input" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: +e.target.value })} /></label>
          </div>
          <label className="text-sm block"><div className="font-semibold mb-1">Description</div><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <button className="btn-primary w-full">Create</button>
        </form>
      </div>
    </div>
  );
}
