import ProductCard from './ProductCard';

export default function ProductGrid({ products = [], cols = 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' }) {
  if (!products.length) {
    return (
      <div className="container-px py-20 text-center text-ink-500">
        <p className="font-medium">No products found.</p>
        <p className="text-sm">Try adjusting your filters or search keywords.</p>
      </div>
    );
  }
  return (
    <div className={`grid grid-cols-2 ${cols} gap-3 sm:gap-4`}>
      {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
    </div>
  );
}
