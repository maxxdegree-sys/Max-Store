import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { selectWishlist, removeFromWishlist } from '../store/wishlistSlice';
import { addToCart } from '../store/cartSlice';
import { formatPKR } from '../utils/format';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/seo/SEO';

export default function Wishlist() {
  const items = useSelector(selectWishlist);
  const dispatch = useDispatch();

  return (
    <>
      <SEO title="My Wishlist" />
      <Breadcrumbs items={[{ label: 'Wishlist' }]} />
      <div className="container-px pb-14">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-6 flex items-center gap-2">
          <Heart className="text-rose-500" /> Your Wishlist ({items.length})
        </h1>
        {items.length === 0 ? (
          <div className="card p-12 text-center">
            <Heart size={48} className="mx-auto text-ink-300 mb-4" />
            <p className="text-ink-500">Your wishlist is empty. Start adding items you love!</p>
            <Link to="/shop" className="btn-primary mt-4 inline-flex">Browse Products</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((it) => (
              <div key={it.id} className="card overflow-hidden group">
                <Link to={`/product/${it.slug}`} className="block aspect-square overflow-hidden">
                  <img src={it.image} alt={it.title} className="h-full w-full object-cover group-hover:scale-110 transition" />
                </Link>
                <div className="p-3">
                  <Link to={`/product/${it.slug}`} className="font-semibold text-sm line-clamp-2 hover:text-brand-700">{it.title}</Link>
                  <div className="text-brand-700 font-bold mt-1">{formatPKR(it.price)}</div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button onClick={() => dispatch(addToCart({ ...it, qty: 1 }))} className="btn-primary !py-2 !px-3 text-xs">
                      <ShoppingCart size={14} /> Add
                    </button>
                    <button onClick={() => dispatch(removeFromWishlist(it.id))} className="btn-ghost text-red-500 !py-2 !px-3 text-xs">
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
