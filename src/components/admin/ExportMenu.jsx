import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, FileSpreadsheet, FileText, FileType, Loader2 } from 'lucide-react';
import { downloadExport } from '../../api/client';

// Dropdown that exports an entity (customers|orders|products) in 3 formats.
export default function ExportMenu({ entity, filters = {}, label = 'Export' }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState('');

  const run = async (fmt) => {
    setBusy(fmt);
    try {
      await downloadExport(entity, fmt, filters);
      toast.success(entity + ' exported (' + fmt.toUpperCase() + ')');
      setOpen(false);
    } catch (e) {
      toast.error(e.status === 401 ? 'Sign in to the backend to export' : (e.status === 403 ? 'You are not allowed to export this' : e.message));
    } finally { setBusy(''); }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="btn-outline !py-2 !px-3 text-sm"><Download size={14} /> {label}</button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 w-48 card p-1.5 shadow-xl">
            <Item icon={FileSpreadsheet} label="Excel (.xlsx)" busy={busy === 'xlsx'} onClick={() => run('xlsx')} />
            <Item icon={FileText} label="CSV" busy={busy === 'csv'} onClick={() => run('csv')} />
            <Item icon={FileType} label="PDF (watermarked)" busy={busy === 'pdf'} onClick={() => run('pdf')} />
          </div>
        </>
      )}
    </div>
  );
}

function Item({ icon: Icon, label, busy, onClick }) {
  return (
    <button onClick={onClick} disabled={!!busy} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-ink-100 dark:hover:bg-white/5 disabled:opacity-60">
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />} {label}
    </button>
  );
}
