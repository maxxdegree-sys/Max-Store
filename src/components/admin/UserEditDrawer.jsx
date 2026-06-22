import { X } from 'lucide-react';
import { PERMISSIONS, ROLE_PRESETS, ROLE_NAMES } from '../../utils/permissions';

// Add / edit a team member: profile, password (new users), role preset and
// per-section permission checkboxes.
export default function UserEditDrawer({ editing, setEditing, onSave, onClose }) {
  const applyRolePreset = (role) => setEditing((e) => ({ ...e, role, permissions: [...(ROLE_PRESETS[role]?.permissions || ['dashboard'])] }));
  const togglePerm = (key) => setEditing((e) => {
    const has = e.permissions.includes(key);
    return { ...e, permissions: has ? e.permissions.filter((k) => k !== key) : [...e.permissions, key], role: 'Custom' };
  });

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-ink-900 shadow-2xl overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">{editing.id ? 'Edit User' : 'Add Team Member'}</h2>
          <button onClick={onClose} className="btn-ghost !p-2"><X /></button>
        </div>
        <L label="Full name *"><input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></L>
        <L label="Email (used to log in) *"><input className="input" type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></L>
        {!editing.id && <L label="Password (for secure login)"><input className="input" type="password" value={editing.password} onChange={(e) => setEditing({ ...editing, password: e.target.value })} placeholder="leave blank for default 'changeme123'" /></L>}
        <L label="Department"><input className="input" value={editing.department} onChange={(e) => setEditing({ ...editing, department: e.target.value })} placeholder="e.g. Catalog, Customer Care" /></L>
        <L label="Role preset"><select className="input" value={editing.role} onChange={(e) => applyRolePreset(e.target.value)}>{ROLE_NAMES.map((r) => <option key={r} value={r}>{ROLE_PRESETS[r].label}</option>)}</select></L>
        <div>
          <div className="text-sm font-semibold mb-2">Department access (permissions)</div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {PERMISSIONS.map((p) => {
              const checked = editing.permissions.includes(p.key);
              const locked = p.key === 'dashboard';
              return (
                <label key={p.key} className={`flex items-start gap-2 rounded-xl border p-2.5 cursor-pointer ${checked ? 'border-brand-400 bg-brand-50/60 dark:bg-brand-900/20' : 'border-ink-200 dark:border-white/10'}`}>
                  <input type="checkbox" className="accent-brand-600 mt-0.5" checked={checked} disabled={locked} onChange={() => togglePerm(p.key)} />
                  <div><div className="text-sm font-semibold">{p.label}{locked && <span className="text-[10px] text-ink-500 ml-1">(always on)</span>}</div><div className="text-xs text-ink-500">{p.desc}</div></div>
                </label>
              );
            })}
          </div>
        </div>
        <button onClick={onSave} className="btn-primary w-full !py-3">{editing.id ? 'Save Changes' : 'Add User'}</button>
      </div>
    </div>
  );
}

function L({ label, children }) {
  return <label className="text-sm block"><div className="font-semibold mb-1">{label}</div>{children}</label>;
}
