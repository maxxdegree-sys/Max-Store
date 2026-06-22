import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { addToCart } from '../../store/cartSlice';
import { toggleWishlist, isInWishlist } from '../../store/wishlistSlice';
import { formatPKR, discountPercent, imageThumbUrl } from '../../utils/format';
import Badge from '../ui/Badge';
import Rating from '../ui/Rating';

export default function ProductCard({ product, index = 0 }) {
  const dispatch = useDispatch();
  const wished = useSelector(isInWishlist(product.id));
  const off = discountPercent(product.mrp, product.price);
  const cover = product.images?.[0] || 'https://placehold.co/800x800?text=No+Image';
  const [src, setSrc] = useState(() => imageThumbUrl(cover));

  useEffect(() => {
    setSrc(imageThumbUrl(cover));
  }, [cover]);

  const handleAdd = (e) => {
    e.preventDefault();
    dispatch(addToCart({ id: product.id, slug: product.slug, title: product.title, price: product.price, image: cover }));
    toast.success(`Added to cart: ${product.title.split(' ').slice(0,3).join(' ')}…`);
  };

  const handleWish = (e) => {
    e.preventDefault();
    dispatch(toggleWishlist({ id: product.id, slug: product.slug, title: product.title, price: product.price, image: cover }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3) }}
      className="group card overflow-hidden hover:shadow-soft transition will-change-transform"
    >
      <div className="relative">
        <Link to={`/product/${product.slug}`} className="block aspect-square overflow-hidden bg-ink-100 dark:bg-white/5">
          <img
            loading="lazy"
            src={src}
            alt={product.title}
            onError={() => { if (src !== cover) setSrc(cover); }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {off > 0 && <Badge variant="danger">-{off}%</Badge>}
          {product.tags?.includes('new-arrival') && <Badge variant="info">NEW</Badge>}
          {product.tags?.includes('best-seller') && <Badge variant="warn">BEST SELLER</Badge>}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWish}
          className={`absolute top-2 right-2 grid place-items-center w-9 h-9 rounded-full glass hover:bg-white transition ${wished ? 'text-red-500' : 'text-ink-700'}`}
          aria-label="Wishlist"
        >
          <Heart size={16} fill={wished ? 'currentColor' : 'none'} />
        </button>

        {/* Hover quick actions */}
        <div className="absolute inset-x-2 bottom-2 flex gap-1 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition">
          <button onClick={handleAdd} className="btn-primary !py-2 !px-3 text-xs flex-1"><ShoppingCart size={14} /> Add</button>
          <Link to={`/product/${product.slug}`} className="grid place-items-center w-10 h-10 rounded-xl bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-100">
            <Eye size={14} />
          </Link>
        </div>
      </div>

      <div className="p-3 space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-ink-500 font-bold">{product.brand}</div>
        <Link to={`/product/${product.slug}`} className="block text-sm font-semibold line-clamp-2 hover:text-brand-700 leading-snug min-h-[2.5rem]">
          {product.title}
        </Link>
        <Rating value={product.rating} count={product.reviews} />
        <div className="flex items-baseline gap-2 pt-1">
          <div className="text-brand-700 font-extrabold">{formatPKR(product.price)}</div>
          {off > 0 && <div className="price-strike">{formatPKR(product.mrp)}</div>}
        </div>
        <div className="pt-1 text-[11px] text-ink-500">{product.sold}+ sold</div>
      </div>
    </motion.div>
  );
}
