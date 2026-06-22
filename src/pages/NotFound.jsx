import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import SEO from '../components/seo/SEO';

export default function NotFound() {
  return (
    <>
      <SEO title="Page Not Found" />
      <div className="min-h-[70vh] grid place-items-center container-px py-16 text-center">
        <div>
          <div className="text-[110px] sm:text-[180px] font-extrabold leading-none bg-brand-gradient bg-clip-text text-transparent">404</div>
          <h2 className="text-2xl font-extrabold mt-2">Page not found</h2>
          <p className="text-ink-500 mt-2 max-w-md mx-auto">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
          <div className="mt-6 flex items-center gap-2 justify-center">
            <Link to="/" className="btn-primary"><Home size={16} /> Go Home</Link>
            <Link to="/shop" className="btn-outline"><Search size={16} /> Browse Shop</Link>
          </div>
        </div>
      </div>
    </>
  );
}
