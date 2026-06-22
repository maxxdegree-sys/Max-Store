import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, Edit3, Trash2, ExternalLink, FileText } from 'lucide-react';
import { blogListApi, blogDeleteApi } from '../../api/client';
import BlogEditor from '../../components/admin/BlogEditor';

const statusBadge = {
  published: 'bg-brand-50 text-brand-700 ring-brand-200',
  draft:     'bg-ink-100 text-ink-700 ring-ink-200',
  scheduled: 'bg-amber-50 text-amber-700 ring-amber-200'
};

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('All');

  const load = () => {
    setLoading(true);
    blogListApi()
      .then((data) => setPosts(data.posts || []))
      .catch(() => toast.error('Failed to load blog posts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const list = useMemo(() => {
    let l = [...posts];
    if (filter !== 'All') l = l.filter((p) => (p.status || 'published') === filter);
    if (q) { const s = q.toLowerCase(); l = l.filter((p) => (p.title + (p.tags || []).join(' ') + (p.keywords || '')).toLowerCase().includes(s)); }
    return l.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [posts, q, filter]);

  const handleDelete = async (slug, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await blogDeleteApi(slug);
      setPosts((prev) => prev.filter((p) => p.slug !== slug));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  if (editing) {
    return (
      <BlogEditor
        post={editing === 'new' ? null : editing}
        onClose={(saved) => {
          setEditing(null);
          if (saved) load();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold">Blog &amp; SEO ({list.length})</h1>
          <p className="text-xs text-ink-500">AI-assisted blog CMS with real-time SEO scoring and schema generation.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search posts..." className="input pl-9 !py-2 !text-sm w-52" />
          </div>
          <button onClick={() => setEditing('new')} className="btn-primary !py-2 !px-4 text-sm"><Plus size={14} /> New post</button>
        </div>
      </header>

      <div className="flex items-center gap-2">
        {['All', 'published', 'draft', 'scheduled'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border capitalize ${filter === f ? 'bg-brand-500 text-white border-transparent' : 'bg-white dark:bg-ink-900 border-ink-200 dark:border-white/10'}`}>{f}</button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-ink-500 text-sm">Loading posts…</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-ink-100/60 dark:bg-white/5 text-left">
                <tr>{['Title', 'Status', 'Tags', 'Date', ''].map((h) => <th key={h} className="px-4 py-3 text-xs uppercase tracking-wider font-bold text-ink-500">{h}</th>)}</tr>
              </thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-ink-500"><FileText size={28} className="mx-auto opacity-40 mb-2" />No posts yet.</td></tr>}
                {list.map((p) => (
                  <tr key={p.slug} className="border-t border-ink-100 dark:border-white/10 hover:bg-ink-100/40 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.cover && <img src={p.cover} alt="" className="w-10 h-10 rounded-lg object-cover" loading="lazy" />}
                        <div className="font-medium line-clamp-1 max-w-xs">{p.title}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`badge ring-1 capitalize ${statusBadge[p.status || 'published']}`}>{p.status || 'published'}</span></td>
                    <td className="px-4 py-3 text-ink-500">{(p.tags || []).slice(0, 3).join(', ')}</td>
                    <td className="px-4 py-3 text-ink-500">{p.date}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" className="btn-ghost !p-2" title="View"><ExternalLink size={14} /></a>
                      <button onClick={() => setEditing(p)} className="btn-ghost !p-2"><Edit3 size={14} /></button>
                      <button onClick={() => handleDelete(p.slug, p.title)} className="btn-ghost !p-2 text-red-500"><Trash2 size={14} /></button>
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
