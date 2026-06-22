import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  Mail, Upload, Users, FileText, Send, Trash2, Plus, Download, Info, RefreshCw, Database
} from 'lucide-react';
import { sendBulkEmail } from '../../utils/notify';
import { logActivity } from '../../store/activitySlice';
import { selectUser } from '../../store/authSlice';
import RequirePermission from '../../components/admin/RequirePermission';
import {
  emailContactsApi, emailAddContactsApi, emailDeleteContactApi,
  emailCampaignsApi, emailCreateCampaignApi, emailUpdateCampaignApi, emailDeleteCampaignApi
} from '../../api/client';

function extractEmails(text) {
  if (!text) return [];
  const matches = text.match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g) || [];
  return [...new Set(matches.map((e) => e.trim().toLowerCase()))];
}

const TEMPLATES = [
  { name: 'Flash Sale', subject: 'Flash Sale at Maxx - up to 50% OFF', body: 'Assalam o Alaikum,\n\nOur biggest Flash Sale is live now with up to 50% OFF on kitchen, electronics and home essentials. Free delivery across Pakistan.\n\nShop now: https://alrafiq.pk/shop\n\n- Maxx' },
  { name: 'New Arrivals', subject: 'Just landed: New arrivals at Maxx', body: 'Assalam o Alaikum,\n\nFresh stock just arrived. Be the first to grab the new premium picks before they sell out.\n\nBrowse: https://alrafiq.pk/shop?tag=new-arrival\n\n- Maxx' },
  { name: 'Eid Offer', subject: 'Eid Mubarak - special Eid discounts inside', body: 'Eid Mubarak from Maxx!\n\nCelebrate with special Eid prices on gift hampers, crockery and home essentials. Order early to beat the rush.\n\nShop: https://alrafiq.pk\n\n- Maxx' }
];

function AdminEmailInner() {
  const dispatch = useDispatch();
  const me = useSelector(selectUser);
  const [raw, setRaw] = useState('');
  const [manual, setManual] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [contacts, setContacts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const recipients = useMemo(() => extractEmails(raw), [raw]);

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([
      emailContactsApi({ subscribed: 'true' }),
      emailCampaignsApi()
    ])
      .then(([cData, campData]) => {
        setContacts(cData.contacts || []);
        setCampaigns(campData.campaigns || []);
      })
      .catch(() => toast.error('Failed to load email data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addManual = () => {
    const found = extractEmails(manual);
    if (!found.length) return toast.error('No valid email found');
    setRaw((r) => (r ? r + '\n' : '') + found.join('\n'));
    setManual('');
  };

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    setRaw((r) => (r ? r + '\n' : '') + text);
    toast.success(`Loaded ${f.name}`);
  };

  const loadFromDb = () => {
    const emails = contacts.filter((c) => c.subscribed !== false).map((c) => c.email).filter(Boolean);
    if (!emails.length) return toast.error('No subscribed contacts in database');
    setRaw(emails.join('\n'));
    toast.success(`Loaded ${emails.length} contacts from database`);
  };

  const saveContactsToDb = async (emails) => {
    if (!emails.length) return;
    await emailAddContactsApi(emails.map((email) => ({ email, source: 'campaign' })));
    await refresh();
  };

  const removeContact = async (id) => {
    try {
      await emailDeleteContactApi(id);
      toast.success('Contact removed');
      refresh();
    } catch (e) {
      toast.error(e.message || 'Could not remove contact');
    }
  };

  const useTemplate = (t) => { setSubject(t.subject); setBody(t.body); toast.success(`Loaded "${t.name}" template`); };

  const downloadTemplate = () => {
    const blob = new Blob(['email\ncustomer1@example.com\ncustomer2@example.com\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'al-rafiq-email-list-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const send = async () => {
    if (!recipients.length) return toast.error('Import at least one email address');
    if (!subject.trim()) return toast.error('Enter a subject');
    if (body.trim().length < 10) return toast.error('Write your message');

    setSending(true);
    try {
      await saveContactsToDb(recipients);

      const { campaign } = await emailCreateCampaignApi({ subject: subject.trim(), body: body.trim() });

      const res = sendBulkEmail({ recipients, subject: subject.trim(), body: body.trim() });
      if (!res.ok) {
        await emailDeleteCampaignApi(campaign.id).catch(() => {});
        return toast.error('Could not send: ' + res.reason);
      }

      await emailUpdateCampaignApi(campaign.id, {
        status: 'sent',
        recipientCount: res.count,
        sentAt: new Date().toISOString()
      });

      dispatch(logActivity({
        userId: me?.uid,
        userName: me?.name,
        action: 'email',
        detail: `Sent campaign "${subject.trim()}" to ${res.count} contacts`
      }));

      toast.success(`Campaign saved and mail composer opened for ${res.count} recipients`);
      refresh();
    } catch (e) {
      toast.error(e.message || 'Could not send campaign');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2"><Mail size={20} className="text-brand-700" /> Email Campaigns</h1>
          <p className="text-xs text-ink-500">Contacts and campaigns are saved to the database. Sending still opens your mail app (BCC batches).</p>
        </div>
        <button onClick={refresh} disabled={loading} className="btn-outline !py-2 text-xs">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <div className="space-y-4">
          <section className="card p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><FileText size={16} /> Compose</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {TEMPLATES.map((t) => (
                <button key={t.name} onClick={() => useTemplate(t)} className="btn-outline !py-1.5 !px-3 text-xs">{t.name}</button>
              ))}
            </div>
            <label className="text-sm block mb-3"><div className="font-semibold mb-1">Subject</div>
              <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Flash Sale - up to 50% OFF" maxLength={150} />
            </label>
            <label className="text-sm block"><div className="font-semibold mb-1">Message</div>
              <textarea rows={10} className="input" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your email..." />
            </label>
          </section>

          <div className="rounded-xl bg-brand-50 dark:bg-brand-900/20 p-3 text-xs text-ink-700 dark:text-ink-200 flex items-start gap-2">
            <Info size={14} className="text-brand-700 mt-0.5 shrink-0" />
            <div>Recipients are saved to the contact list before send. Each campaign is recorded in the database with status, recipient count, and sent time. Your mail app opens with BCC batches (40 per message).</div>
          </div>

          <button onClick={send} disabled={sending} className="btn-primary w-full !py-3">
            <Send size={16} /> {sending ? 'Saving & sending…' : `Send to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'}`}
          </button>

          {campaigns.length > 0 && (
            <section className="card p-5">
              <h3 className="font-bold mb-3">Past campaigns ({campaigns.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {campaigns.map((c) => (
                  <div key={c.id} className="rounded-lg ring-1 ring-ink-200 dark:ring-white/10 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <b className="truncate">{c.subject}</b>
                      <span className={`badge text-[10px] capitalize ${c.status === 'sent' ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-600'}`}>{c.status}</span>
                    </div>
                    <div className="text-xs text-ink-500 mt-1">
                      {c.recipient_count || 0} recipients
                      {c.sent_at ? ` · ${String(c.sent_at).slice(0, 16).replace('T', ' ')}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <section className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2"><Users size={16} /> Recipients ({recipients.length})</h3>
              {recipients.length > 0 && <button onClick={() => setRaw('')} className="btn-ghost !p-1.5 text-red-500" title="Clear"><Trash2 size={14} /></button>}
            </div>

            <button onClick={loadFromDb} className="btn-outline w-full !py-2 text-xs mb-3">
              <Database size={14} /> Load subscribed contacts from DB ({contacts.length})
            </button>

            <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink-200 dark:border-white/10 p-4 cursor-pointer hover:border-brand-400 transition mb-3">
              <Upload size={22} className="text-ink-400 mb-1" />
              <div className="text-xs font-semibold">Upload .csv / .txt</div>
              <input type="file" accept=".csv,.txt,text/csv,text/plain" className="sr-only" onChange={handleFile} />
            </label>

            <div className="flex items-center gap-1 mb-3">
              <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Add single email" className="input !py-1.5 !text-xs" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addManual())} />
              <button onClick={addManual} className="btn-outline !py-1.5 !px-2"><Plus size={14} /></button>
            </div>

            <label className="text-xs block">
              <div className="font-semibold mb-1">Or paste a list (any separator)</div>
              <textarea rows={5} className="input font-mono !text-xs" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder={"a@x.com\nb@y.com, c@z.com"} />
            </label>

            <button onClick={downloadTemplate} className="btn-ghost !py-1.5 text-xs mt-2 w-full"><Download size={12} /> Download CSV template</button>
          </section>

          {recipients.length > 0 && (
            <section className="card p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">Parsed list</div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {recipients.slice(0, 100).map((e) => (
                  <div key={e} className="text-xs font-mono text-ink-700 dark:text-ink-200 truncate">{e}</div>
                ))}
                {recipients.length > 100 && <div className="text-xs text-ink-500 italic">...and {recipients.length - 100} more</div>}
              </div>
            </section>
          )}

          {contacts.length > 0 && (
            <section className="card p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">Saved contacts ({contacts.length})</div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {contacts.slice(0, 50).map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-xs">
                    <span className="font-mono truncate flex-1">{c.email}</span>
                    <button onClick={() => removeContact(c.id)} className="text-red-500 hover:text-red-700 shrink-0" title="Remove"><Trash2 size={12} /></button>
                  </div>
                ))}
                {contacts.length > 50 && <div className="text-xs text-ink-500 italic">...and {contacts.length - 50} more</div>}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function AdminEmail() {
  return (
    <RequirePermission permission="email">
      <AdminEmailInner />
    </RequirePermission>
  );
}
