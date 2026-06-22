import { Link } from 'react-router-dom';
import {
  Facebook, Instagram, Linkedin, Mail,
  CreditCard, Truck, ShieldCheck, Headphones
} from 'lucide-react';
import Logo from '../ui/Logo';
import { BUSINESS } from '../../utils/format';

const SOCIAL = [
  { Icon: Facebook,       label: 'Facebook',  href: 'https://www.facebook.com/alrafiqshoppingcenter' },
  { Icon: Instagram,      label: 'Instagram', href: 'https://www.instagram.com/alrafiqshopping' },
  { Icon: Linkedin,       label: 'LinkedIn',  href: 'https://linkedin.com/company/maxx-shopping' }
];

export default function Footer() {
  return (
    <footer className="mt-16 bg-ink-900 text-ink-100">
      {/* Trust strip */}
      <div className="border-b border-white/10">
        <div className="container-px grid grid-cols-2 md:grid-cols-4 gap-6 py-8">
          {[
            { icon: Truck, t: 'Free Delivery', s: 'Across Pakistan on every order' },
            { icon: ShieldCheck, t: 'Secure Payment', s: 'COD & Bank Transfer' },
            { icon: Headphones, t: '7-Day Returns', s: 'Easy hassle-free returns' },
            { icon: Mail, t: 'Email Support', s: BUSINESS.email }
          ].map(({ icon: Icon, t, s }) => (
            <div key={t} className="flex items-center gap-3">
              <span className="grid place-items-center w-11 h-11 rounded-xl bg-brand-600/15 text-brand-400">
                <Icon size={22} />
              </span>
              <div>
                <div className="font-semibold text-sm">{t}</div>
                <div className="text-xs text-ink-300">{s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-px py-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <Logo className="h-12 w-12" />
            <div className="text-xs text-ink-300">Kharian, Punjab, Pakistan</div>
          </div>
          <p className="mt-4 text-sm text-ink-300 max-w-md">
            Pakistan&apos;s trusted premium marketplace for kitchen, home, electronics, beauty and imported products.
            Quality you can feel - at honest prices.
          </p>
          <div className="mt-5 flex items-center gap-3">
            {SOCIAL.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="grid place-items-center w-9 h-9 rounded-lg bg-white/10 hover:bg-brand-600 transition"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <FooterCol title="Shop">
          <Link to="/shop">All Products</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/category/kitchen-appliances">Kitchen Appliances</Link>
          <Link to="/category/electronics">Electronics</Link>
          <Link to="/category/imported-products">Imported</Link>
        </FooterCol>

        <FooterCol title="Help">
          <Link to="/faq">FAQ</Link>
          <Link to="/order-tracking">Track Order</Link>
          <Link to="/track-ticket">Track Ticket</Link>
          <Link to="/complaint">File a Complaint</Link>
          <Link to="/contact">Contact Support</Link>
        </FooterCol>

        <FooterCol title="Company">
          <Link to="/about">About Us</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms">Terms &amp; Conditions</Link>
          <a href="https://linkedin.com/company/maxx-shopping" target="_blank" rel="noopener noreferrer">Careers / B2B</a>
        </FooterCol>
      </div>

      <div className="border-t border-white/10">
        <div className="container-px py-8">
          <div className="flex items-start gap-3"><Mail className="text-brand-400 mt-1" size={18} /><div><div className="font-semibold text-sm">Email us</div><a href={`mailto:${BUSINESS.email}`} className="text-xs text-ink-300 hover:text-white">{BUSINESS.email}</a></div></div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-px py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-ink-300">
          <div>(c) {new Date().getFullYear()} Maxx. All rights reserved.</div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="opacity-70">We accept:</span>
            {['Cash on Delivery', 'Bank Transfer'].map((t) => (
              <span key={t} className="rounded-md bg-white/10 px-2 py-1 inline-flex items-center gap-1 font-semibold">
                <CreditCard size={12} /> {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }) {
  return (
    <div>
      <h4 className="font-bold text-sm uppercase tracking-wider mb-4">{title}</h4>
      <ul className="space-y-2 text-sm">
        {Array.isArray(children) ? children.map((c, i) => <li key={i} className="text-ink-300 hover:text-white transition">{c}</li>) :
          <li className="text-ink-300 hover:text-white transition">{children}</li>}
      </ul>
    </div>
  );
}
