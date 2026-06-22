import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crosshair, MapPin, Search, X } from 'lucide-react';
import {
  DEFAULT_LOCATION,
  formatDeliveryLabel,
  groupCitiesByProvince,
  PAKISTAN_CITIES,
  POPULAR_CITIES
} from '../../data/pakistanCities.js';
import { useDeliveryLocation } from '../../context/LocationContext.jsx';

export default function LocationPicker() {
  const { location, pickerOpen, closePicker, setLocation, detectLocation, detecting } = useDeliveryLocation();
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState(location);

  useEffect(() => {
    if (pickerOpen) setDraft(location);
  }, [pickerOpen, location]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PAKISTAN_CITIES;
    return PAKISTAN_CITIES.filter(
      (c) => c.city.toLowerCase().includes(q) || c.province.toLowerCase().includes(q)
    );
  }, [query]);

  const grouped = useMemo(() => groupCitiesByProvince(filtered), [filtered]);

  if (!pickerOpen) return null;

  const selectCity = (c) => {
    setDraft({ ...c, area: '', country: 'Pakistan', source: 'manual' });
  };

  const save = () => {
    setLocation(draft);
    closePicker();
    setQuery('');
  };

  const useGps = async () => {
    try {
      const loc = await detectLocation({ preferGps: true });
      setDraft(loc);
    } catch { /* toast shown in context */ }
  };

  const resetDefault = () => setDraft({ ...DEFAULT_LOCATION });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <div className="absolute inset-0 bg-black/50" onClick={closePicker} aria-hidden />
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-picker-title"
          className="relative w-full sm:max-w-lg max-h-[90vh] bg-white dark:bg-ink-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between gap-3 p-4 border-b border-ink-100 dark:border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-brand-50 text-brand-700">
                <MapPin size={18} />
              </span>
              <div className="min-w-0">
                <h2 id="location-picker-title" className="font-bold text-base">Delivery location</h2>
                <p className="text-xs text-ink-500 truncate">Currently: {formatDeliveryLabel(draft)}</p>
              </div>
            </div>
            <button type="button" onClick={closePicker} className="btn-ghost !p-2" aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto">
            <button
              type="button"
              onClick={useGps}
              disabled={detecting}
              className="w-full flex items-center justify-center gap-2 btn-primary !py-3 disabled:opacity-60"
            >
              <Crosshair size={18} className={detecting ? 'animate-spin' : ''} />
              {detecting ? 'Detecting location…' : 'Use my current location'}
            </button>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city…"
                className="input pl-9"
                autoFocus
              />
            </div>

            {!query && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-2">Popular cities</div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_CITIES.map((c) => (
                    <button
                      key={c.city}
                      type="button"
                      onClick={() => selectCity(c)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                        draft.city === c.city
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'border-ink-200 dark:border-white/15 hover:border-brand-400'
                      }`}
                    >
                      {c.city}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {grouped.map(([province, cities]) => (
                <div key={province}>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 mb-1.5">{province}</div>
                  <div className="grid grid-cols-2 gap-1">
                    {cities.map((c) => (
                      <button
                        key={c.city}
                        type="button"
                        onClick={() => selectCity(c)}
                        className={`text-left text-sm px-3 py-2 rounded-xl transition ${
                          draft.city === c.city
                            ? 'bg-brand-50 text-brand-800 font-semibold dark:bg-brand-900/40'
                            : 'hover:bg-ink-100 dark:hover:bg-white/5'
                        }`}
                      >
                        {c.city}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-ink-500 text-center py-4">No cities match your search.</p>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-ink-100 dark:border-white/10 flex gap-2">
            <button type="button" onClick={resetDefault} className="btn-ghost flex-1 text-sm">
              Reset to Kharian
            </button>
            <button type="button" onClick={save} className="btn-primary flex-1">
              Deliver here
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
