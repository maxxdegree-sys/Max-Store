import { useSelector } from 'react-redux';
import { Truck, Phone, Mail, Sparkles, Tag, Gift, Star, Percent, Clock } from 'lucide-react';
import { selectAnnouncements } from '../../store/settingsSlice';

// Icon names stored in settings map to Lucide components here.
const ICONS = { Truck, Phone, Mail, Sparkles, Tag, Gift, Star, Percent, Clock };

export default function AnnouncementBar() {
  const messages = useSelector(selectAnnouncements);
  if (!messages.length) return null;

  return (
    <div className="bg-brand-gradient text-white text-xs sm:text-sm">
      <div className="container-px flex items-center justify-between gap-4 py-2">
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          <div className="flex animate-[marquee_30s_linear_infinite] gap-12 whitespace-nowrap">
            {[...messages, ...messages].map((m, i) => {
              const Icon = ICONS[m.icon] || Sparkles;
              return (
                <span key={i} className="inline-flex items-center gap-2">
                  <Icon size={14} className="opacity-90" />
                  {m.text}
                </span>
              );
            })}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <a href="/order-tracking" className="hover:underline">Track Order</a>
          <a href="/contact" className="hover:underline">Help</a>
        </div>
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </div>
  );
}
