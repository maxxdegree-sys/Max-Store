import { STOREFRONT_TAGS } from '../../constants/storefrontTags';

/** Checkbox group for homepage / shop section tags on a product. */
export default function StorefrontTagsEditor({ tags = [], onChange, compact = false }) {
  const set = new Set(tags || []);

  const toggle = (id) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {STOREFRONT_TAGS.map((t) => {
          const on = set.has(t.id);
          return (
            <button
              key={t.id}
              type="button"
              title={t.description}
              onClick={() => toggle(t.id)}
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ring-1 transition-colors ${
                on
                  ? 'bg-brand-50 text-brand-700 ring-brand-200'
                  : 'bg-ink-50 text-ink-400 ring-ink-100 hover:ring-brand-200'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="font-semibold text-sm">Storefront sections</div>
      <p className="text-xs text-ink-500">Choose which homepage rows and shop filters include this product. Use Rank in the products table to control order within each section.</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {STOREFRONT_TAGS.map((t) => (
          <label key={t.id} className="flex items-start gap-2 text-sm cursor-pointer rounded-lg border border-ink-100 dark:border-white/10 p-2.5 hover:bg-ink-50 dark:hover:bg-white/5">
            <input
              type="checkbox"
              checked={set.has(t.id)}
              onChange={() => toggle(t.id)}
              className="accent-brand-600 mt-0.5"
            />
            <span>
              <span className="font-medium">{t.label}</span>
              <span className="block text-xs text-ink-500">{t.description}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
