import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Heart, Truck, ShieldCheck, RefreshCw,
  Share2, Check, ChevronRight
} from 'lucide-react';
import { selectProductBySlug, selectAllProducts, updateProduct } from '../store/productsSlice';
import { addToCart } from '../store/cartSlice';
import { toggleWishlist, isInWishlist } from '../store/wishlistSlice';
import { addRecentlyViewed, selectRecentlyViewed } from '../store/productsSlice';
import { selectAvgRating, selectApprovedReviews, setProductReviews, mapDbReview } from '../store/reviewsSlice';
import { reviewsByProductApi, productGetBySlugApi } from '../api/client';
import { formatPKR, discountPercent } from '../utils/format';
import Rating from '../components/ui/Rating';
import Badge from '../components/ui/Badge';
import QuantitySelector from '../components/ui/QuantitySelector';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import ProductGrid from '../components/product/ProductGrid';
import SectionHeader from '../components/ui/SectionHeader';
import RatingSummary from '../components/product/RatingSummary';
import ReviewList from '../components/product/ReviewList';
import ReviewForm from '../components/product/ReviewForm';
import { categoryLabel } from '../data/categories';
import { buildProductPageSchema, productImageAlt } from '../utils/productSeo';
import SEO from '../components/seo/SEO';
import Loader from '../components/ui/Loader';
import NotFound from './NotFound';

export default function ProductDetail() {
  const { slug } = useParams();
  const product = useSelector(selectProductBySlug(slug));
  const allProducts = useSelector(selectAllProducts);
  const dispatch = useDispatch();
  const wished = useSelector(isInWishlist(product?.id || ''));
  const recent = useSelector(selectRecentlyViewed);
  const liveAvg = useSelector(selectAvgRating(product?.id || ''));
  const liveReviews = useSelector(selectApprovedReviews(product?.id || ''));
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState(product?.variants?.[0] || null);
  const [zoom, setZoom] = useState({ active: false, x: 0, y: 0 });
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!slug) return;
    if (product?.description) return;
    setFetching(true);
    productGetBySlugApi(slug)
      .then((d) => { if (d?.product) dispatch(updateProduct(d.product)); })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [slug, product?.description, dispatch]);

  useEffect(() => {
    if (product) dispatch(addRecentlyViewed(product));
    setActiveImg(0); setQty(1);
    setVariant(product?.variants?.[0] || null);
  }, [slug, product, dispatch]);

  // Load approved reviews for this product from the database.
  useEffect(() => {
    const id = product?.id;
    if (!id) return;
    reviewsByProductApi(id)
      .then((d) => dispatch(setProductReviews({ productId: id, reviews: (d?.reviews || []).map(mapDbReview) })))
      .catch(() => { /* keep whatever is cached */ });
  }, [product?.id, dispatch]);

  const related = useMemo(() => product ? allProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 5) : [], [product, allProducts]);

  if (fetching && !product) return <Loader fullScreen />;
  if (!product) return <NotFound />;
  const off = discountPercent(product.mrp, product.price);
  const inStock = (Number(product.stock) || 0) > 0;
  const images = product.images?.length ? product.images : ['https://placehold.co/800x800?text=No+Image'];

  const handleAdd = () => {
    dispatch(addToCart({ id: product.id, slug: product.slug, title: product.title, price: product.price, image: images[0], qty, variant }));
    toast.success('Added to cart!');
  };

  const displayRating = liveAvg || product.rating || 0;
  const displayReviews = liveReviews.length || product.reviews || 0;
  const schema = buildProductPageSchema(product, { rating: displayRating, reviewCount: displayReviews });
  const seoTitle = product.seo?.seoTitle || product.title;
  const seoDesc = product.seo?.metaDescription || product.short;

  const onMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setZoom({ active: true, x, y });
  };

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDesc}
        image={images[0]}
        url={`https://alrafiq.pk/product/${product.slug}`}
        schema={schema}
        type="product"
      />
      <Breadcrumbs items={[
        { to: '/shop', label: 'Shop' },
        ...(product.category ? [{ to: `/category/${product.category}`, label: categoryLabel(product.category, product.subcategory).split(' › ')[0] }] : []),
        ...(product.subcategory ? [{ to: `/category/${product.category}/${product.subcategory}`, label: categoryLabel(product.category, product.subcategory).split(' › ')[1] }] : []),
        { label: product.title }
      ]} />

      <div className="container-px pb-10 grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-10">
        {/* Gallery */}
        <div>
          <div
            className="relative aspect-square overflow-hidden rounded-2xl bg-ink-100 dark:bg-white/5 cursor-zoom-in"
            onMouseMove={onMouseMove}
            onMouseLeave={() => setZoom({ active: false, x: 0, y: 0 })}
          >
            <img
              src={images[activeImg] || images[0]}
              alt={productImageAlt(product, activeImg)}
              className="absolute inset-0 h-full w-full object-cover transition duration-300"
              style={zoom.active ? { transform: `scale(2)`, transformOrigin: `${zoom.x}% ${zoom.y}%` } : {}}
            />
            {off > 0 && <Badge variant="danger" className="absolute top-3 left-3">-{off}% OFF</Badge>}
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`aspect-square rounded-xl overflow-hidden ring-2 transition ${activeImg === i ? 'ring-brand-600' : 'ring-transparent hover:ring-brand-200'}`}
              >
                <img src={src} alt={productImageAlt(product, i)} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-brand-700">{product.brand}</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 leading-tight">{product.title}</h1>
          <div className="mt-2 flex items-center gap-3">
            <Rating
              value={liveReviews.length ? liveAvg : product.rating}
              count={liveReviews.length || product.reviews}
            />
            <span className="text-xs text-ink-500">| {product.sold}+ sold</span>
          </div>

          <div className="mt-5 flex items-end gap-3">
            <div className="text-3xl font-extrabold text-brand-700">{formatPKR(product.price)}</div>
            {off > 0 && <div className="text-ink-500 line-through">{formatPKR(product.mrp)}</div>}
            {off > 0 && <Badge variant="danger">Save {off}%</Badge>}
          </div>

          <p className="mt-4 text-sm text-ink-700 dark:text-ink-200 leading-relaxed">{product.short}</p>

          {product.variants?.length > 0 && (
            <div className="mt-5">
              <div className="text-sm font-semibold mb-2">Variant</div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v}
                    onClick={() => setVariant(v)}
                    className={`px-3 py-1.5 rounded-xl text-sm border ${variant === v ? 'bg-brand-50 border-brand-600 text-brand-700' : 'border-ink-200'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <div className="text-sm font-semibold">Qty</div>
            <QuantitySelector value={qty} onChange={setQty} max={Math.max(1, product.stock)} />
            {inStock ? (
              <span className="text-xs text-brand-600 font-semibold inline-flex items-center gap-1"><Check size={14} /> In stock ({product.stock})</span>
            ) : (
              <span className="text-xs text-rose-600 font-semibold">Out of stock</span>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button onClick={handleAdd} disabled={!inStock} className="btn-primary !py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"><ShoppingCart size={18} /> {inStock ? 'Add to Cart' : 'Unavailable'}</button>
            {inStock ? (
              <Link to="/checkout" onClick={handleAdd} className="btn !py-3 text-base bg-ink-900 text-white hover:bg-ink-700">Buy Now</Link>
            ) : (
              <button disabled className="btn !py-3 text-base bg-ink-900 text-white opacity-50 cursor-not-allowed">Buy Now</button>
            )}
          </div>

          <div className="mt-2">
            <button
              onClick={() => { dispatch(toggleWishlist({ id: product.id, slug: product.slug, title: product.title, price: product.price, image: images[0] })); toast.success(wished ? 'Removed from wishlist' : 'Added to wishlist'); }}
              className={`btn w-full !py-3 ${wished ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' : 'btn-outline'}`}
            >
              <Heart size={18} fill={wished ? 'currentColor' : 'none'} /> {wished ? 'Wishlisted' : 'Add to Wishlist'}
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[{ i: Truck, t: 'Fast Delivery', s: '1-3 days' }, { i: ShieldCheck, t: 'Quality Assured', s: 'Verified' }, { i: RefreshCw, t: '7-Day Return', s: 'No questions' }].map(({ i: Icon, t, s }) => (
              <div key={t} className="rounded-xl border border-ink-100 dark:border-white/10 p-3">
                <Icon className="mx-auto text-brand-700" size={20} />
                <div className="font-semibold text-xs mt-1">{t}</div>
                <div className="text-[11px] text-ink-500">{s}</div>
              </div>
            ))}
          </div>

          {/* Specs */}
          <div className="mt-6 card p-5">
            <h3 className="font-bold mb-3">Specifications</h3>
            <dl className="grid sm:grid-cols-2 gap-y-2 text-sm">
              {Object.entries(product.specs || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2 border-b border-dashed border-ink-100 dark:border-white/10 py-1.5">
                  <dt className="text-ink-500">{k}</dt><dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <button
            onClick={() => { navigator.share ? navigator.share({ title: product.title, url: window.location.href }) : toast('Copy link manually'); }}
            className="mt-4 btn-ghost text-sm"
          >
            <Share2 size={16} /> Share product
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="container-px pb-12">
        <div className="card p-6">
          <h3 className="font-bold text-lg mb-2">Product Description</h3>
          <p className="text-sm text-ink-700 dark:text-ink-200 leading-relaxed">{product.description}</p>
        </div>
      </div>

      {/* Reviews (live, moderated) */}
      <div className="container-px pb-12">
        <div className="card p-6">
          <h3 className="font-bold text-lg mb-4">Customer Reviews &amp; Ratings</h3>
          <RatingSummary productId={product.id} />
          <ReviewForm productId={product.id} />
          <ReviewList productId={product.id} />
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="container-px pb-12">
          <SectionHeader title="Related Products" viewAll={`/category/${product.category}`} />
          <ProductGrid products={related} />
        </section>
      )}

      {/* Recently viewed */}
      {recent.length > 1 && (
        <section className="container-px pb-16">
          <SectionHeader title="Recently Viewed" />
          <ProductGrid products={recent.filter((p) => p.id !== product.id)} />
        </section>
      )}
    </>
  );
}
