import ProductGrid from '../product/ProductGrid';
import SectionHeader from '../ui/SectionHeader';

export default function ProductRow({ eyebrow, title, subtitle, products, viewAll }) {
  return (
    <section className="container-px py-10 sm:py-14">
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} viewAll={viewAll} />
      <ProductGrid products={products} />
    </section>
  );
}
