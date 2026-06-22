import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserCog, UserPlus, Trash2, Search, ShieldCheck, ShieldOff, Mail, Clock, LogIn, KeyRound } from 'lucide-react';
import {
  selectAdminUsers, addAdminUser, updateAdminUser, suspendUser, removeAdminUser
} from '../../store/adminUsersSlice';
import { logActivity } from '../../store/activitySlice';
import { selectUser, selectPermissions, impersonate } from '../../store/authSlice';
import { isExecutive, ROLE_PRESETS } from '../../utils/permissions';
import {
  teamList, teamAdd, teamUpdate, teamSetPassword, teamDelete, teamImpersonate, beginImpersonationToken
} from '../../api/client';
import RequirePermission from '../../components/admin/RequirePermission';
import UserEditDrawer from '../../components/admin/UserEditDrawer';

function AdminUsersInner() {
  const reduxUsers = useSelector(selectAdminUsers);
  const me = useSelector(selectUser);
  const exec = isExecutive(useSelector(selectPermissions));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [backendUsers, setBackendUsers] = useState(null);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [pwdFor, setPwdFor] = useState(null);
  const [pwdVal, setPwdVal] = useState('');

  const refresh = () => teamList().then((d) => setBackendUsers(d.users)).catch(() => {});
  useEffect(() => { refresh(); }, []);
  const usingBackend = !!backendUsers;
  const users = backendUsers || reduxUsers;

  const list = useMemo(() => {
    const s = q.toLowerCase();
    return users.filter((u) => (u.name + u.email + u.role + (u.department || '')).toLowerCase().includes(s));
  }, [users, q]);

  const openNew = () => setEditing({ id: '', name: '', email: '', department: '', password: '', role: 'Support Agent', permissions: [...ROLE_PRESETS['Support Agent'].permissions] });

  const save = async () => {
    if (!editing.name.trim()) return toast.error('Enter a name');
    if (!editing.email.trim()) return toast.error('Enter an email');
    const exists = users.some((u) => u.email.toLowerCase() === editing.email.trim().toLowerCase() && u.id !== editing.id);
    if (exists) return toast.error('A user with this email already exists');
    const body = { name: editing.name, email: editing.email, department: editing.department, role: editing.role, permissions: editing.permissions };
    try {
      if (usingBackend) {
        if (editing.id) await teamUpdate(editing.id, body);
        else await teamAdd({ ...body, password: editing.password });
        await refresh();
      } else if (editing.id) dispatch(updateAdminUser({ id: editing.id, ...body }));
      else dispatch(addAdminUser(editing));
      dispatch(logActivity({ userId: me?.uid, userName: me?.name, action: 'team', detail: (editing.id ? 'Updated user ' : 'Added user ') + editing.name }));
      toast.success(editing.id ? 'User updated' : 'User added');
      setEditing(null);
    } catch (e) { toast.error(e.message || 'Could not save'); }
  };

  const toggleSuspend = async (u) => {
    const status = u.status === 'active' ? 'suspended' : 'active';
    try { if (usingBackend) { await teamUpdate(u.id, { status }); await refresh(); } else dispatch(suspendUser(u.id)); toast.success(status === 'active' ? 'Reactivated' : 'Suspended'); }
    catch (e) { toast.error(e.message); }
  };
  const remove = async (u) => {
    if (!confirm('Remove ' + u.name + '?')) return;
    try { if (usingBackend) { await teamDelete(u.id); await refresh(); } else dispatch(removeAdminUser(u.id)); toast.success('Removed'); }
    catch (e) { toast.error(e.message); }
  };

  const enterAccount = async (u) => {
    if (u.id === me?.uid) return toast('That is already your account', { icon: 'i' });
    try {
      const r = await teamImpersonate(u.id);
      beginImpersonationToken(r.token);
      dispatch(impersonate({
        user: { uid: r.user.id, email: r.user.email, name: r.user.name, role: r.user.role, department: r.user.department, permissions: r.user.permissions, canImport: r.user.canImport, isAdmin: true },
        impersonator: me
      }));
      toast.success("Entered " + u.name + "'s account");
      navigate('/admin');
    } catch (e) {
      if (e.status === 404 || e.status === undefined) {
        dispatch(impersonate({ user: { uid: u.id, email: u.email, name: u.name, role: u.role, department: u.department, permissions: u.permissions, isAdmin: true }, impersonator: me }));
        toast.success('Viewing as ' + u.name + ' (local)');
        navigate('/admin');
      } else toast.error(e.message);
    }
  };

  const savePassword = async () => {
    if (pwdVal.length < 6) return toast.error('Password must be at least 6 characters');
    try { await teamSetPassword(pwdFor.id, pwdVal); toast.success('Password updated for ' + pwdFor.name); setPwdFor(null); setPwdVal(''); }
    catch (e) { toast.error(e.status === 401 || e.status === undefined ? 'Start the backend (npm run dev:all) to manage passwords' : e.message); }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2"><UserCog size={20} className="text-brand-700" /> Team &amp; Roles ({list.length})</h1>
          <p className="text-xs text-ink-500">Add members, set passwords, assign access, and enter any account as a super admin.{usingBackend ? '' : ' (Start the backend for passwords & secure login.)'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search team..." className="input pl-9 !py-2 !text-sm w-56" />
          </div>
          {exec && <button onClick={openNew} className="btn-primary !py-2 !px-4 text-sm"><UserPlus size={14} /> Add User</button>}
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-3">
        {list.map((u) => (
          <div key={u.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="grid place-items-center w-11 h-11 rounded-full bg-brand-gradient text-white text-xs font-bold shrink-0">
                  {u.name.split(' ').map((w) => w[0] || '').slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold flex items-center gap-2 flex-wrap">
                    {u.name}
                    <span className={`badge ${u.status === 'active' ? 'bg-brand-50 text-brand-700' : 'bg-rose-50 text-rose-700'}`}>{u.status}</span>
                    {u.id === me?.uid && <span className="badge bg-ink-100 text-ink-700">you</span>}
                  </div>
                  <div className="text-xs text-ink-500 inline-flex items-center gap-1"><Mail size={11} /> {u.email}</div>
                  <div className="text-xs text-ink-500 mt-0.5">{u.role}{u.department ? ` - ${u.department}` : ''}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {exec && u.id !== me?.uid && <button onClick={() => enterAccount(u)} className="btn-ghost !p-2" title="Enter this account"><LogIn size={14} className="text-brand-700" /></button>}
                {exec && <button onClick={() => { setPwdFor(u); setPwdVal(''); }} className="btn-ghost !p-2" title="Set password"><KeyRound size={14} /></button>}
                <button onClick={() => setEditing({ ...u, password: '' })} className="btn-ghost !p-2" title="Edit"><UserCog size={14} /></button>
                <button onClick={() => toggleSuspend(u)} className="btn-ghost !p-2" title={u.status === 'active' ? 'Suspend' : 'Reactivate'}>
                  {u.status === 'active' ? <ShieldOff size={14} className="text-amber-600" /> : <ShieldCheck size={14} className="text-brand-700" />}
                </button>
                {u.role !== 'Executive' && u.id !== me?.uid && <button onClick={() => remove(u)} className="btn-ghost !p-2 text-red-500" title="Remove"><Trash2 size={14} /></button>}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {u.permissions.map((p) => <span key={p} className="badge bg-ink-100 text-ink-700 capitalize">{p}</span>)}
            </div>
            <div className="mt-3 text-[11px] text-ink-500 inline-flex items-center gap-1"><Clock size={11} /> Last login: <b className="text-ink-700 dark:text-ink-200">{u.lastLogin || 'never'}</b></div>
          </div>
        ))}
      </div>

      {pwdFor && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPwdFor(null)} />
          <div className="relative card p-6 w-full max-w-sm space-y-3">
            <h3 className="font-bold flex items-center gap-2"><KeyRound size={16} /> Set password</h3>
            <p className="text-xs text-ink-500">New password for <b>{pwdFor.name}</b> ({pwdFor.email}).</p>
            <input type="password" className="input" value={pwdVal} onChange={(e) => setPwdVal(e.target.value)} placeholder="At least 6 characters" autoFocus />
            <div className="flex gap-2">
              <button onClick={savePassword} className="btn-primary flex-1">Save password</button>
              <button onClick={() => setPwdFor(null)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {editing && <UserEditDrawer editing={editing} setEditing={setEditing} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}

export default function AdminUsers() {
  return (
    <RequirePermission permission="team">
      <AdminUsersInner />
    </RequirePermission>
  );
}
