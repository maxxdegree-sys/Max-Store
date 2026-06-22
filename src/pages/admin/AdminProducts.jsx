import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { Plus, Search, Edit3, Trash2, X } from 'lucide-react';
import { selectAllProducts, addProduct, updateProduct, deleteProduct, setProducts } from '../../store/productsSlice';
import { categories, categoryBySlug } from '../../data/categories';
import { formatPKR, slugify } from '../../utils/format';
import { productsListAdminApi, productAddApi, productUpdateApi, productDeleteApi, vendorsAdminList } from '../../api/client';
import ImportManager from '../../components/admin/ImportManager';
import ImageUploader from '../../components/admin/ImageUploader';
import ExportMenu from '../../components/admin/ExportMenu';
import ProductSeoBox from '../../components/admin/ProductSeoBox';
import StorefrontTagsEditor from '../../components/admin/StorefrontTagsEditor';
import { productSeoScore, seoBadgeClass } from '../../utils/productSeo';

const empty = { id: '', title: '', price: 0, mrp: 0, stock: 0, category: 'electronics', subcategory: '', brand: '', vendorId: null, images: [''], short: '', description: '', specs: {}, rating: 4.5, reviews: 0, sold: 0, tags: [], seo: {}, status: 'active' };

export default function AdminProducts() {
  const list = useSelector(selectAllProducts);
  const dispatch = useDispatch();
  const [q, setQ] = useState('');
  useEffect(() => {
    productsListAdminApi().then((d) => { if (Array.isArray(d?.products) && d.products.length) dispatch(setProducts(d.products)); }).catch(() => { /* not signed in / backend down - keep current */ });
  }, [dispatch]);
  const [editing, setEditing] = useState(null);
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    vendorsAdminList().then((d) => setVendors(d?.vendors || [])).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return list.filter((p) => p.title.toLowerCase().includes(s) || p.brand?.toLowerCase().includes(s) || p.category.includes(s));
  }, [q, list]);

  const saveTags = async (p, nextTags) => {
    if (JSON.stringify(p.tags || []) === JSON.stringify(nextTags)) return;
    try {
      const r = await productUpdateApi(p.id, { tags: nextTags });
      dispatch(updateProduct(r?.product || { ...p, tags: nextTags }));
      toast.success('Sections updated');
    } catch (err) {
      toast.error(err.message || 'Could not save tags');
    }
  };

  const saveRank = async (p, raw) => {
    const v = raw.trim();
    const newRank = v === '' ? null : Number(v);
    if (newRank !== null && !Number.isFinite(newRank)) return toast.error('Rank must be a number');
    if (newRank === (p.displayRank ?? null)) return;
    try {
      const r = await productUpdateApi(p.id, { displayRank: newRank });
      dispatch(updateProduct(r?.product || { ...p, displayRank: newRank }));
      toast.success(newRank === null ? 'Rank cleared' : 'Rank saved');
    } catch (err) {
      toast.error(err.message || 'Could not save rank. Make sure you are signed in with product access.');
    }
  };

  const saveStatus = async (p) => {
    const next = p.status === 'active' ? 'draft' : 'active';
    try {
      const r = await productUpdateApi(p.id, { status: next });
      dispatch(updateProduct(r?.product || { ...p, status: next }));
      toast.success(next === 'active' ? 'Published — now live on store' : 'Set to draft — hidden from store');
    } catch (err) {
      toast.error(err.message || 'Could not change status. Make sure you are signed in with product access.');
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!editing.title || !editing.price) return toast.error('Title & price are required');
    const body = { ...editing, slug: slugify(editing.title) };
    const isEdit = editing.id && list.some((p) => p.id === editing.id);
    try {
      if (isEdit) {
        const r = await productUpdateApi(editing.id, body);
        dispatch(updateProduct(r?.product || body));
        toast.success('Product updated');
      } else {
        const r = await productAddApi(body);
        dispatch(addProduct(r?.product || { ...body, id: 'p' + Date.now() }));
        toast.success('Product added');
      }
      setEditing(null);
    } catch (err) {
      // Surface the real reason (not signed in, no permission, validation, etc.)
      // and keep the editor open so nothing is silently "saved" only in the UI.
      toast.error(err.message || 'Could not save product. Make sure you are signed in with product access.');
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-extrabold">Products ({filtered.length})</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="input pl-9 !py-2 !text-sm w-64" />
          </div>
          <ExportMenu entity="products" filters={{}} />
          <ImportManager onImported={(prod) => dispatch(addProduct(prod))} />
          <button onClick={() => setEditing({ ...empty })} className="btn-primary !py-2 !px-4 text-sm"><Plus size={14} /> Add Product</button>
        </div>
      </header>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-100/60 dark:bg-white/5 text-left">
              <tr>
                {['Rank', 'Product', 'Status', 'Sections', 'Category', 'Brand', 'Vendor', 'Price', 'Stock', 'Rating', 'SEO', ''].map((h) => <th key={h} className="px-4 py-3 text-xs uppercase tracking-wider font-bold text-ink-500">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-ink-100 dark:border-white/10 hover:bg-ink-100/40 dark:hover:bg-white/5">
                  <td className="px-4 py-3 w-20">
                    <input
                      key={p.id + ':' + (p.displayRank ?? '')}
                      type="number"
                      min="1"
                      defaultValue={p.displayRank ?? ''}
                      placeholder="—"
                      title="Display rank: 1 shows first on the storefront. Leave blank for unranked."
                      className="input !py-1 !px-2 !text-sm w-16 text-center"
                      onBlur={(e) => saveRank(p, e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div className="font-medium line-clamp-1">{p.title}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => saveStatus(p)}
                      title={p.status === 'active' ? 'Live on store — click to set draft (hide)' : 'Draft — click to publish (show on store)'}
                      className={`badge cursor-pointer transition ${p.status === 'active' ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'}`}
                    >
                      {p.status === 'active' ? 'Active' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3 min-w-[140px]">
                    <StorefrontTagsEditor
                      tags={p.tags}
                      compact
                      onChange={(tags) => saveTags(p, tags)}
                    />
                  </td>
                  <td className="px-4 py-3 text-ink-500 capitalize">{p.category.replace(/-/g, ' ')}</td>
                  <td className="px-4 py-3">{p.brand}</td>
                  <td className="px-4 py-3 text-ink-500 text-xs">{vendors.find((v) => v.id === p.vendorId)?.name || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-brand-700">{formatPKR(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${p.stock < 10 ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' : 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'}`}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3">{p.rating} ★</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${seoBadgeClass(productSeoScore(p).score)}`}>{productSeoScore(p).score}</span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(p)} className="btn-ghost !p-2"><Edit3 size={14} /></button>
                    <button onClick={async () => {
                      if (!confirm('Delete product?')) return;
                      try {
                        await productDeleteApi(p.id);
                        dispatch(deleteProduct(p.id));
                        toast.success('Deleted');
                      } catch (err) {
                        toast.error(err.message || 'Could not delete. Make sure you are signed in with product access.');
                      }
                    }} className="btn-ghost !p-2 text-red-500"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <form onSubmit={save} className="absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-ink-900 shadow-2xl overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{editing.id && list.some((p) => p.id === editing.id) ? 'Edit Product' : 'New Product'}</h3>
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost !p-2"><X /></button>
            </div>
            <Input label="Title" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} />
            <Input label="Brand" value={editing.brand} onChange={(v) => setEditing({ ...editing, brand: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Price (PKR)" type="number" value={editing.price} onChange={(v) => setEditing({ ...editing, price: +v })} />
              <Input label="MRP (PKR)"   type="number" value={editing.mrp}   onChange={(v) => setEditing({ ...editing, mrp: +v })} />
              <Input label="Stock"       type="number" value={editing.stock} onChange={(v) => setEditing({ ...editing, stock: +v })} />
              <Input label="Units sold"  type="number" value={editing.sold ?? 0} onChange={(v) => setEditing({ ...editing, sold: +v })} title="Updated automatically when orders are delivered; editable for corrections." />
              <label className="text-sm"><div className="font-semibold mb-1">Status</div>
                <select className="input" value={editing.status || 'active'} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  <option value="active">Active (live on store)</option>
                  <option value="draft">Draft (hidden)</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="text-sm"><div className="font-semibold mb-1">Category</div>
                <select className="input" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value, subcategory: '' })}>
                  {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
              </label>
              <label className="text-sm"><div className="font-semibold mb-1">Sub-category</div>
                <select className="input" value={editing.subcategory || ''} onChange={(e) => setEditing({ ...editing, subcategory: e.target.value })}>
                  <option value="">— Any / not set —</option>
                  {(categoryBySlug(editing.category)?.subcategories || []).map((s) => (
                    <option key={s.slug} value={s.slug}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm sm:col-span-2"><div className="font-semibold mb-1">Vendor (supplier)</div>
                <select
                  className="input"
                  value={editing.vendorId || ''}
                  onChange={(e) => setEditing({ ...editing, vendorId: e.target.value || null })}
                >
                  <option value="">None — Maxx owned</option>
                  {vendors.filter((v) => v.status === 'active').map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <ImageUploader
              images={(editing.images || []).filter(Boolean)}
              onChange={(imgs) => setEditing({ ...editing, images: imgs.length ? imgs : [''] })}
              productId={editing.id && list.some((p) => p.id === editing.id) ? editing.id : null}
            />
            <label className="text-sm block"><div className="font-semibold mb-1">Short description</div>
              <textarea rows={2} className="input" value={editing.short} onChange={(e) => setEditing({ ...editing, short: e.target.value })} />
            </label>
            <label className="text-sm block"><div className="font-semibold mb-1">Full description</div>
              <textarea rows={4} className="input" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </label>
            <StorefrontTagsEditor
              tags={editing.tags}
              onChange={(tags) => setEditing({ ...editing, tags })}
            />
            <ProductSeoBox product={editing} onChange={(patch) => setEditing((e) => ({ ...e, ...patch }))} />
            <button className="btn-primary w-full !py-3">Save</button>
          </form>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }) {
  return (
    <label className="text-sm block">
      <div className="font-semibold mb-1">{label}</div>
      <input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
