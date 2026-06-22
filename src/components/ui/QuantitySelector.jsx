import { Minus, Plus } from 'lucide-react';

export default function QuantitySelector({ value, onChange, min = 1, max = 99 }) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="inline-flex items-center rounded-xl border border-ink-200 dark:border-white/10 overflow-hidden">
      <button onClick={dec} className="px-3 py-2 hover:bg-ink-100 dark:hover:bg-white/5" aria-label="Decrease">
        <Minus size={14} />
      </button>
      <input
        readOnly
        value={value}
        className="w-12 text-center bg-transparent text-sm font-semibold focus:outline-none"
      />
      <button onClick={inc} className="px-3 py-2 hover:bg-ink-100 dark:hover:bg-white/5" aria-label="Increase">
        <Plus size={14} />
      </button>
    </div>
  );
}
