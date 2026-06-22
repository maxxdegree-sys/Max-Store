import { Loader2, MapPin } from 'lucide-react';
import { useDeliveryLocationOptional } from '../../context/LocationContext.jsx';

export default function DeliveryLocationButton({ className = '', compact = false }) {
  const ctx = useDeliveryLocationOptional();
  if (!ctx) return null;

  const { label, openPicker, detecting } = ctx;

  return (
    <button
      type="button"
      onClick={openPicker}
      className={`inline-flex items-center gap-1.5 text-left transition hover:text-brand-700 ${className}`}
      title="Change delivery location"
    >
      {detecting ? (
        <Loader2 size={14} className="animate-spin shrink-0 text-brand-600" />
      ) : (
        <MapPin size={14} className="shrink-0 text-brand-600" />
      )}
      <span className="min-w-0">
        {!compact && <span className="block text-[10px] uppercase tracking-wide text-ink-400">Deliver to</span>}
        <span className={`block truncate font-semibold text-ink-700 dark:text-ink-100 ${compact ? 'text-xs' : 'text-sm'}`}>
          {detecting ? 'Detecting…' : label}
        </span>
      </span>
    </button>
  );
}
