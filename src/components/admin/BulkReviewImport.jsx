import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  X, Upload, FileText, Download, CheckCircle2, AlertCircle, FileSpreadsheet
} from 'lucide-react';
import { reviewsBulkImportApi } from '../../api/client';
import { selectAllProducts } from '../../store/productsSlice';

// Simple CSV parser — handles quoted fields with commas + escaped quotes.
function parseCSV(text) {
  const rows = [];
  let cur = [], val = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { val += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { val += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ',') { cur.push(val); val = ''; }
      else if (c === '\n' || c === '\r') {
        if (val !== '' || cur.length) { cur.push(val); rows.push(cur); cur = []; val = ''; }
        if (c === '\r' && next === '\n') i++;
      }
      else { val += c; }
    }
  }
  if (val !== '' || cur.length) { cur.push(val); rows.push(cur); }
  return rows;
}

const REQUIRED = ['productId', 'rating', 'comment'];

const SAMPLE_CSV = `productId,userName,userEmail,rating,title,comment,date,verified,status
p1,Saima A.,saima@example.com,5,Excellent,"Worked perfectly out of the box. Very happy with my purchase.",2026-05-10,true,approved
p1,Kashif R.,,4,Good value,"Solid build quality and matches photos. Slight delay in shipping but worth it.",2026-05-08,false,approved
p2,Hira N.,hira@example.com,5,Boils fast,"Boils water in 3 minutes. Auto-shutoff is a nice safety feature.",2026-05-11,true,approved`;

export default function BulkReviewImport({ open, onClose }) {
  const products = useSelector(selectAllProducts);
  const [mode, setMode] = useState('paste');
  const [csv, setCsv] = useState('');
  const [defaultStatus, setDefaultStatus] = useState('approved');
  const validProductIds = useMemo(() => new Set(products.map((p) => p.id)), [products]);

  const { parsed, valid, invalid } = useMemo(() => {
    const text = csv.trim();
    if (!text) return { parsed: [], valid: [], invalid: [] };
    const rows = parseCSV(text);
    if (rows.length < 2) return { parsed: [], valid: [], invalid: [] };
    const hdr = rows[0].map((h) => h.trim());
    const dataRows = rows.slice(1).filter((r) => r.some((cell) => cell.trim() !== ''));
    const objs = dataRows.map((row) => {
      const obj = {};
      hdr.forEach((h, i) => { obj[h] = (row[i] || '').trim(); });
      return obj;
    });
    const v = [], iv = [];
    objs.forEach((o, idx) => {
      const errors = [];
      REQUIRED.forEach((f) => { if (!o[f]) errors.push(`Missing ${f}`); });
      if (o.productId && !validProductIds.has(o.productId)) errors.push(`Unknown productId "${o.productId}"`);
      if (o.rating) {
        const r = parseInt(o.rating, 10);
        if (Number.isNaN(r) || r < 1 || r > 5) errors.push('Rating must be 1-5');
      }
      if (o.status && !['approved', 'pending', 'rejected'].includes(o.status))
        errors.push('Status must be approved / pending / rejected');
      if (errors.length) iv.push({ row: idx + 2, data: o, errors });
      else v.push(o);
    });
    return { parsed: objs, valid: v, invalid: iv };
  }, [csv, validProductIds]);

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a .csv file');
      return;
    }
    const text = await f.text();
    setCsv(text);
    toast.success(`Loaded ${f.name}`);
  };

  const downloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'al-rafiq-reviews-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async () => {
    if (!valid.length) return toast.error('No valid rows to import');
    try {
      await reviewsBulkImportApi({ rows: valid, defaultStatus });
      toast.success(`Imported ${valid.length} review${valid.length === 1 ? '' : 's'}`);
      setCsv('');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Import failed');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white dark:bg-ink-900 shadow-2xl overflow-y-auto">
        <header className="sticky top-0 bg-white dark:bg-ink-900 z-10 flex items-center justify-between px-6 py-4 border-b border-ink-100 dark:border-white/10">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <FileSpreadsheet size={20} className="text-brand-700" /> Bulk Import Reviews
            </h2>
            <p className="text-xs text-ink-500">Paste a CSV or upload a .csv file. Preview before importing.</p>
          </div>
          <button onClick={onClose} className="btn-ghost !p-2"><X /></button>
        </header>

        <div className="p-6 space-y-5">
          <div className="inline-flex rounded-xl border border-ink-200 dark:border-white/10 p-1 bg-ink-100/50 dark:bg-white/5">
            <button
              onClick={() => setMode('paste')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${mode === 'paste' ? 'bg-white dark:bg-ink-900 shadow-card text-brand-700' : 'text-ink-500'}`}
            >
              <FileText size={14} className="inline mr-1" /> Paste CSV
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${mode === 'upload' ? 'bg-white dark:bg-ink-900 shadow-card text-brand-700' : 'text-ink-500'}`}
            >
              <Upload size={14} className="inline mr-1" /> Upload .csv
            </button>
          </div>

          <div className="rounded-xl bg-brand-50 dark:bg-brand-900/20 p-4 text-sm">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-brand-700">CSV format</div>
                <div className="text-xs text-ink-700 dark:text-ink-200 mt-1">
                  Required: <code className="font-mono">productId</code>, <code className="font-mono">rating</code>, <code className="font-mono">comment</code>.<br />
                  Optional: <code className="font-mono">userName</code>, <code className="font-mono">userEmail</code>, <code className="font-mono">title</code>, <code className="font-mono">date</code>, <code className="font-mono">status</code>, <code className="font-mono">verified</code>, <code className="font-mono">helpful</code>.
                </div>
              </div>
              <button onClick={downloadTemplate} className="btn-outline !py-1.5 text-xs whitespace-nowrap">
                <Download size={14} /> Download template
              </button>
            </div>
          </div>

          {mode === 'paste' ? (
            <label className="block">
              <div className="text-sm font-semibold mb-1">Paste your CSV</div>
              <textarea
                rows={9}
                className="input font-mono text-xs"
                placeholder={SAMPLE_CSV}
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
              />
            </label>
          ) : (
            <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 dark:border-white/10 p-10 cursor-pointer hover:border-brand-400 transition">
              <Upload size={36} className="text-ink-400 mb-2" />
              <div className="font-semibold">Click to upload a .csv file</div>
              <div className="text-xs text-ink-500 mt-1">Or drag and drop</div>
              <input type="file" accept=".csv,text/csv" className="sr-only" onChange={handleFile} />
            </label>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <label className="inline-flex items-center gap-2 text-sm">
              <span className="font-semibold">Default status:</span>
              <select
                value={defaultStatus}
                onChange={(e) => setDefaultStatus(e.target.value)}
                className="input !py-1.5 !px-3 text-sm w-auto"
              >
                <option value="approved">approved (live)</option>
                <option value="pending">pending (needs review)</option>
              </select>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-500">
                {valid.length} valid - {invalid.length} invalid - {parsed.length} total
              </span>
              <button
                onClick={doImport}
                disabled={!valid.length}
                className="btn-primary"
              >
                Import {valid.length || ''} review{valid.length === 1 ? '' : 's'}
              </button>
            </div>
          </div>

          {parsed.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-bold">Preview</div>

              {invalid.length > 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-900/20 p-3">
                  <div className="flex items-center gap-2 font-bold text-rose-700 text-sm">
                    <AlertCircle size={16} /> {invalid.length} row{invalid.length === 1 ? '' : 's'} cannot be imported
                  </div>
                  <ul className="mt-2 text-xs space-y-1">
                    {invalid.slice(0, 6).map((iv, i) => (
                      <li key={i} className="text-rose-800">
                        Row {iv.row}: {iv.errors.join(' - ')}
                      </li>
                    ))}
                    {invalid.length > 6 && <li className="text-rose-700 italic">...and {invalid.length - 6} more</li>}
                  </ul>
                </div>
              )}

              {valid.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="px-4 py-2.5 bg-brand-50 dark:bg-brand-900/20 text-sm font-bold text-brand-700 flex items-center gap-2">
                    <CheckCircle2 size={16} /> {valid.length} row{valid.length === 1 ? '' : 's'} ready to import
                  </div>
                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-xs">
                      <thead className="bg-ink-100/60 dark:bg-white/5 sticky top-0">
                        <tr>
                          {['Product', 'Reviewer', 'Rating', 'Title', 'Comment', 'Status'].map((h) => (
                            <th key={h} className="px-3 py-2 text-left font-bold text-ink-700 dark:text-ink-200">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {valid.slice(0, 30).map((r, i) => (
                          <tr key={i} className="border-t border-ink-100 dark:border-white/10">
                            <td className="px-3 py-2 font-mono">{r.productId}</td>
                            <td className="px-3 py-2">{r.userName || '-'}</td>
                            <td className="px-3 py-2">{r.rating}</td>
                            <td className="px-3 py-2 max-w-[140px] truncate">{r.title || '-'}</td>
                            <td className="px-3 py-2 max-w-[260px] truncate">{r.comment}</td>
                            <td className="px-3 py-2">{r.status || defaultStatus}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {valid.length > 30 && (
                      <div className="p-2 text-center text-xs text-ink-500 border-t border-ink-100 dark:border-white/10">
                        ...and {valid.length - 30} more rows
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
