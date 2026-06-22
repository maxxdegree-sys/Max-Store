import { Award, ShieldCheck, Truck, Smile } from 'lucide-react';
import { motion } from 'framer-motion';

const items = [
  { icon: Award,       title: 'Premium Quality', text: 'Hand-picked products from trusted brands & verified suppliers.' },
  { icon: Truck,       title: 'Fast Delivery',   text: '1-3 day delivery across major Pakistani cities with COD.' },
  { icon: ShieldCheck, title: 'Secure Shopping', text: 'Encrypted checkout, 7-day easy returns, and buyer protection.' },
  { icon: Smile,       title: 'Customer First',  text: 'Email support 7 days a week — real humans, fast replies.' }
];

export default function WhyChooseUs() {
  return (
    <section className="container-px py-12 sm:py-16">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="card p-6 hover:shadow-glow hover:-translate-y-1 transition"
          >
            <div className="grid place-items-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-700">
              <it.icon size={22} />
            </div>
            <h4 className="mt-4 font-bold">{it.title}</h4>
            <p className="text-sm text-ink-500 mt-1 leading-relaxed">{it.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
