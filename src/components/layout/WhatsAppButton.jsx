import { MessageCircle } from 'lucide-react';
import { whatsappLink } from '../../utils/format';

export default function WhatsAppButton() {
  return (
    <a
      href={whatsappLink('Hi Maxx, I want to inquire about a product.')}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-30 group"
      aria-label="Chat on WhatsApp"
    >
      <span className="absolute inset-0 rounded-full bg-brand-500/60 animate-ping2 pointer-events-none" />
      <span className="relative grid place-items-center w-14 h-14 rounded-full bg-brand-500 text-white shadow-glow group-hover:bg-brand-600 transition">
        <MessageCircle size={26} fill="currentColor" />
      </span>
      <span className="hidden sm:block absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-ink-900 text-white text-xs font-medium px-3 py-1.5 opacity-0 group-hover:opacity-100 transition shadow-soft">
        Chat with us
      </span>
    </a>
  );
}
