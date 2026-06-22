import HeroSlider from '../components/home/HeroSlider';
import CategoryGrid from '../components/home/CategoryGrid';
import ProductRow from '../components/home/ProductRow';
import FlashSale from '../components/home/FlashSale';
import PromoBanners from '../components/home/PromoBanners';
import Testimonials from '../components/home/Testimonials';
import WhyChooseUs from '../components/home/WhyChooseUs';
import Newsletter from '../components/home/Newsletter';
import SEO from '../components/seo/SEO';
import { useSelector } from 'react-redux';
import { selectFeatured, selectTrending, selectNewArrivals, selectBestSellers } from '../store/productsSlice';
import { selectHomepageConfig } from '../store/settingsSlice';
import { resolveHomeOrder } from '../constants/homeBlocks';

export default function Home() {
  const featured = useSelector(selectFeatured);
  const trending = useSelector(selectTrending);
  const newArrivals = useSelector(selectNewArrivals);
  const best = useSelector(selectBestSellers);
  const hp = useSelector(selectHomepageConfig);
  const sections = hp.sections || {};

  // Each re-orderable block renders via its key. Product rows also honor their
  // enabled toggle from the "Homepage Product Rows" settings.
  const blocks = {
    categories:   () => <CategoryGrid />,
    flashSale:    () => <FlashSale />,
    promoBanners: () => <PromoBanners />,
    whyChooseUs:  () => <WhyChooseUs />,
    testimonials: () => <Testimonials />,
    newsletter:   () => <Newsletter />,
    featured: () => sections.featured?.enabled !== false && (
      <ProductRow
        eyebrow="Hand-picked"
        title="Featured Products"
        subtitle="Our editors' top picks this week."
        products={featured}
        viewAll="/shop?tag=featured"
      />
    ),
    trending: () => sections.trending?.enabled !== false && (
      <ProductRow
        eyebrow="Hot right now"
        title="Trending Products"
        products={trending}
        viewAll="/shop?tag=trending"
      />
    ),
    newArrivals: () => sections.newArrivals?.enabled !== false && (
      <ProductRow
        eyebrow="Just landed"
        title="New Arrivals"
        products={newArrivals}
        viewAll="/shop?tag=new-arrival"
      />
    ),
    bestSellers: () => sections.bestSellers?.enabled !== false && (
      <ProductRow
        eyebrow="Loved by thousands"
        title="Best Sellers"
        products={best}
        viewAll={hp.bestSellersMode === 'auto' ? '/shop?sort=best-selling' : '/shop?tag=best-seller'}
      />
    )
  };

  const order = resolveHomeOrder(hp.order);

  return (
    <>
      <SEO
        title="Premium Online Shopping in Pakistan"
        description="Kitchen, crockery, electronics, beauty & home essentials with COD delivery across Pakistan."
        url="https://alrafiq.pk/"
      />
      <HeroSlider />
      {order.map((key) => {
        const render = blocks[key];
        return render ? <div key={key}>{render()}</div> : null;
      })}
    </>
  );
}
