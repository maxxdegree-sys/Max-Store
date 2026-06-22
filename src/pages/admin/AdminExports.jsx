import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Users, ShoppingCart, Boxes, History, ShieldCheck } from 'lucide-react';
import { selectPermissions } from '../../store/authSlice';
import { can } from '../../utils/permissions';
import { categories } from '../../data/categories';
import { api } from '../../api/client';
import RequirePermission from '../../components/admin/RequirePermission';
import ExportMenu from '../../components/admin/ExportMenu';

const fmt = (iso) => { try { return new Date(iso).toLocaleString(); } catch { return iso; } };

export default function AdminExports() {
  return (
    <RequirePermission permission="exports">
      <ExportCenter />
    </RequirePermission>
  );
}

function ExportCenter() {
  const perms = useSelector(selectPermissions);
  const [cust, setCust] = useState({ city: '', type: '', active: '' });
  const [ord, setOrd] = useState({ deliveryStatus: '', paymentStatus: '' });
  const [prod, setProd] = useState({ category: '', lowStock: '', maxPrice: '' });
  const [log, setLog] = useState([]);

  const loadLog = () => api('/exports').then((d) => setLog(d.log || [])).catch((e) => toast.error(e.message));
  useEffect(() => { loadLog(); }, []);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-extrabold">Export &amp; Download Center</h1>
        <p className="text-xs text-ink-500">Download records as Excel, CSV or watermarked PDF. Financial columns (cost, margin) are executive-only. Every download is logged.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-4">
        {can(perms, 'customers') && (
          <Card icon={Users} title="Customers">
            <Field label="City"><input className="input !py-2 !text-sm" value={cust.city} onChange={(e) => setCust({ ...cust, city: e.target.value })} placeholder="Any" /></Field>
            <Field label="Type">
              <select className="input !py-2 !text-sm" value={cust.type} onChange={(e) => setCust({ ...cust, type: e.target.value })}>
                <option value="">Any</option><option>VIP</option><option>Active</option><option>New</option>
              </select>
            </Field>
            <Field label="Status">
              <select className="input !py-2 !text-sm" value={cust.active} onChange={(e) => setCust({ ...cust, active: e.target.value })}>
                <option value="">All</option><option value="true">Active</option><option value="false">Inactive</option>
              </select>
            </Field>
            <ExportMenu entity="customers" filters={cust} label="Export customers" />
          </Card>
        )}

        {can(perms, 'orders') && (
          <Card icon={ShoppingCart} title="Orders">
            <Field label="Delivery status">
              <select className="input !py-2 !text-sm" value={ord.deliveryStatus} onChange={(e) => setOrd({ ...ord, deliveryStatus: e.target.value })}>
                <option value="">Any</option><option>Processing</option><option>In Transit</option><option>Delivered</option><option>Cancelled</option>
              </select>
            </Field>
            <Field label="Payment status">
              <select className="input !py-2 !text-sm" value={ord.paymentStatus} onChange={(e) => setOrd({ ...ord, paymentStatus: e.target.value })}>
                <option value="">Any</option><option>Paid</option><option>Pending</option><option>Refunded</option>
              </select>
            </Field>
            <ExportMenu entity="orders" filters={ord} label="Export orders" />
          </Card>
        )}

        {can(perms, 'products') && (
          <Card icon={Boxes} title="Products">
            <Field label="Category">
              <select className="input !py-2 !text-sm" value={prod.category} onChange={(e) => setProd({ ...prod, category: e.target.value })}>
                <option value="">All</option>
                {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Stock">
              <select className="input !py-2 !text-sm" value={prod.lowStock} onChange={(e) => setProd({ ...prod, lowStock: e.target.value })}>
                <option value="">All</option><option value="true">Low stock (&lt; 10)</option>
              </select>
            </Field>
            <Field label="Max price"><input type="number" className="input !py-2 !text-sm" value={prod.maxPrice} onChange={(e) => setProd({ ...prod, maxPrice: e.target.value })} placeholder="Any" /></Field>
            <ExportMenu entity="products" filters={prod} label="Export products" />
          </Card>
        )}
      </div>

      <div className="card p-5">
        <h3 className="font-bold flex items-center gap-2"><History size={16} /> Export audit log</h3>
        <p className="text-xs text-ink-500 mt-0.5 mb-3 flex items-center gap-1"><ShieldCheck size={12} /> Who downloaded what, when, and from where.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-ink-500 text-xs uppercase tracking-wider">
              <tr>{['When', 'User', 'Role', 'Records', 'Format', 'Count', 'IP'].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {log.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-ink-500">No exports recorded yet.</td></tr>}
              {log.map((e) => (
                <tr key={e.id} className="border-t border-ink-100 dark:border-white/10">
                  <td className="px-3 py-2 whitespace-nowrap">{fmt(e.at)}</td>
                  <td className="px-3 py-2 font-medium">{e.userName}</td>
                  <td className="px-3 py-2 text-ink-500">{e.role}</td>
                  <td className="px-3 py-2 capitalize">{e.entity}</td>
                  <td className="px-3 py-2 uppercase">{e.format}</td>
                  <td className="px-3 py-2">{e.count}</td>
                  <td className="px-3 py-2 text-ink-500 text-xs">{e.ip || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Card({ icon: Icon, title, children }) {
  return (
    <div className="card p-5 space-y-3">
      <h3 className="font-bold flex items-center gap-2"><span className="grid place-items-center w-8 h-8 rounded-lg bg-brand-50 text-brand-700"><Icon size={15} /></span> {title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="text-sm block">
      <div className="font-semibold mb-1 text-xs text-ink-500">{label}</div>
      {children}
    </label>
  );
}
