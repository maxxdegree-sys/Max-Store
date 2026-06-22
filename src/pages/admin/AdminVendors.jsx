import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Store, Plus, Search, Trash2, KeyRound, ShieldCheck, ShieldOff, X, Mail, Phone, Clock } from 'lucide-react';
import { vendorsAdminList, vendorsAdminAdd, vendorsAdminUpdate, vendorsAdminSetPassword, vendorsAdminDelete } from '../../api/client';

const emptyForm = { name: '', email: '', contactName: '', phone: '', address: '', commissionPct: 10, notes: '', password: '' };

function AdminVendorsInner() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [pwdFor, setPwdFor] = useState(null);
  const [pwdVal, setPwdVal] = useState('');

  const refresh = () => vendorsAdminList().then((d) => setVendors(d?.vendors || [])).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { refresh(); }, []);

  const filtered = vendors.filter((v) => {
    const s = q.toLowerCase();
    return !s || ((v.name || '') + (v.email || '') + (v.contactName || '')).toLowerCase().includes(s);
  });

  const save = async () => {
    if (!editing.name.trim()) return toast.error('Name is required');
    if (!editing.email.trim()) return toast.error('Email is required');
    try {
      if (editing.id) {
        await vendorsAdminUpdate(editing.id, {
          name: editing.name, email: editing.email, contactName: editing.contactName,
          phone: editing.phone, address: editing.address, status: editing.status || 'active',
          commissionPct: Number(editing.commissionPct) || 0, notes: editing.notes
        });
        toast.success('Vendor updated');
      } else {
        if (!editing.password || editing.password.length < 6) return toast.error('Password must be at least 6 characters');
        await vendorsAdminAdd(editing);
        toast.success('Vendor added. They can sign in at /vendor/login');
      }
      setEditing(null); refresh();
    } catch (e) { toast.error(e.message || 'Could not save'); }
  };

  const toggleSuspend = async (v) => {
    const status = v.status === 'active' ? 'suspended' : 'active';
    try { await vendorsAdminUpdate(v.id, { status }); refresh(); toast.success(status === 'active' ? 'Reactivated' : 'Suspended'); }
    catch (e) { toast.error(e.message); }
  };
  const remove = async (v) => {
    if (!confirm('Remove vendor ' + v.name + '?')) return;
    try { await vendorsAdminDelete(v.id); refresh(); toast.success('Removed'); }
    catch (e) { toast.error(e.message); }
  };
  const savePwd = async () => {
    if (pwdVal.length < 6) return toast.error('Password must be at least 6 characters');
    try { await vendorsAdminSetPassword(pwdFor.id, pwdVal); toast.success('Password updated for ' + pwdFor.name); setPwdFor(null); setPwdVal(''); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2"><Store size={20} className="text-brand-700" /> Vendors / Suppliers ({filtered.length})</h1>
          <p className="text-xs text-ink-500">Supplier companies that list products on Maxx. Each gets its own login at <code>/vendor/login</code>.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vendors..." className="input pl-9 !py-2 !text-sm w-56" />
          </div>
          <button onClick={() => setEditing({ ...emptyForm })} className="btn-primary !py-2 !px-4 text-sm"><Plus size={14} /> Add Vendor</button>
        </div>
      </header>

      <div className="rounded-xl border border-brand-200 bg-brand-50 dark:bg-brand-900/20 px-4 py-3 text-sm text-brand-900 dark:text-brand-100">
        Platform commission uses <a href="/admin/commission" className="underline font-semibold">price slabs</a> (2%–10% on full product price). Vendors manage their own shipping and payment collection. Record commission income manually in Accounts.
      </div>

      {loading ? <div className="text-ink-500">Loading...</div> : (
        <div className="grid lg:grid-cols-2 gap-3">
          {filtered.length === 0 && <div className="card p-6 text-sm text-ink-500">No vendors yet. Click <b>+ Add Vendor</b> to create the first one.</div>}
          {filtered.map((v) => (
            <div key={v.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="grid place-items-center w-11 h-11 rounded-full bg-brand-gradient text-white text-xs font-bold shrink-0">
                    {(v.name || 'V').split(' ').map((w) => w[0] || '').slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold flex items-center gap-2 flex-wrap">{v.name}
                      <span className={'badge ' + (v.status === 'active' ? 'bg-brand-50 text-brand-700' : 'bg-rose-50 text-rose-700')}>{v.status}</span>
                    </div>
                    <div className="text-xs text-ink-500 inline-flex items-center gap-1"><Mail size={11} /> {v.email}</div>
                    {v.phone && <div className="text-xs text-ink-500 inline-flex items-center gap-1 mt-0.5"><Phone size={11} /> {v.phone}</div>}
                    <div className="text-xs text-ink-500 mt-0.5">Portal: manages shipping &amp; payments for their orders</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setPwdFor(v); setPwdVal(''); }} className="btn-ghost !p-2" title="Set password"><KeyRound size={14} /></button>
                  <button onClick={() => setEditing({ ...v, password: '' })} className="btn-ghost !p-2" title="Edit"><Store size={14} /></button>
                  <button onClick={() => toggleSuspend(v)} className="btn-ghost !p-2" title={v.status === 'active' ? 'Suspend' : 'Reactivate'}>
                    {v.status === 'active' ? <ShieldOff size={14} className="text-amber-600" /> : <ShieldCheck size={14} className="text-brand-700" />}
                  </button>
                  <button onClick={() => remove(v)} className="btn-ghost !p-2 text-red-500" title="Remove"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-ink-500 inline-flex items-center gap-1"><Clock size={11} /> Last login: <b className="text-ink-700 dark:text-ink-200">{v.lastLogin || v.last_login || 'never'}</b></div>
            </div>
          ))}
        </div>
      )}

      {pwdFor && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPwdFor(null)} />
          <div className="relative card p-6 w-full max-w-sm space-y-3">
            <h3 className="font-bold flex items-center gap-2"><KeyRound size={16} /> Set vendor password</h3>
            <p className="text-xs text-ink-500">New password for <b>{pwdFor.name}</b> ({pwdFor.email}).</p>
            <input type="password" className="input" value={pwdVal} onChange={(e) => setPwdVal(e.target.value)} placeholder="At least 6 characters" autoFocus />
            <div className="flex gap-2">
              <button onClick={savePwd} className="btn-primary flex-1">Save password</button>
              <button onClick={() => setPwdFor(null)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <form onSubmit={(e) => { e.preventDefault(); save(); }} className="absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-ink-900 shadow-2xl overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{editing.id ? 'Edit Vendor' : 'New Vendor'}</h3>
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost !p-2"><X /></button>
            </div>
            <Field label="Company name *"><input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Samsung" /></Field>
            <Field label="Login email *"><input type="email" className="input" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} placeholder="samsung@vendor.maxx.pk" /></Field>
            {!editing.id && <Field label="Initial password *"><input type="password" className="input" value={editing.password} onChange={(e) => setEditing({ ...editing, password: e.target.value })} placeholder="At least 6 characters" /></Field>}
            <Field label="Contact person"><input className="input" value={editing.contactName || ''} onChange={(e) => setEditing({ ...editing, contactName: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone"><input className="input" value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></Field>
              <Field label="Commission"><input className="input" disabled value="Price slabs (see Commission page)" title="Commission is calculated from product price slabs" /></Field>
            </div>
            <Field label="Address"><textarea rows={2} className="input" value={editing.address || ''} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></Field>
            <Field label="Internal notes"><textarea rows={2} className="input" value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></Field>
            <button className="btn-primary w-full !py-3">{editing.id ? 'Save changes' : 'Create vendor'}</button>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (<label className="block text-sm"><div className="font-semibold mb-1">{label}</div>{children}</label>);
}

export default AdminVendorsInner;
