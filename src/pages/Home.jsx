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

export default function Home() {
  const featured = useSelector(selectFeatured);
  const trending = useSelector(selectTrending);
  const newArrivals = useSelector(selectNewArrivals);
  const best = useSelector(selectBestSellers);
  const hp = useSelector(selectHomepageConfig);
  const sections = hp.sections || {};
  return (
    <>
      <SEO
        title="Premium Online Shopping in Pakistan"
        description="Kitchen, crockery, electronics, beauty & home essentials with COD delivery across Pakistan."
        url="https://alrafiq.pk/"
      />
      <HeroSlider />
      <CategoryGrid />
      {sections.featured?.enabled !== false && (
        <ProductRow
          eyebrow="Hand-picked"
          title="Featured Products"
          subtitle="Our editors' top picks this week."
          products={featured}
          viewAll="/shop?tag=featured"
        />
      )}
      <FlashSale />
      {sections.trending?.enabled !== false && (
        <ProductRow
          eyebrow="Hot right now"
          title="Trending Products"
          products={trending}
          viewAll="/shop?tag=trending"
        />
      )}
      <PromoBanners />
      {sections.newArrivals?.enabled !== false && (
        <ProductRow
          eyebrow="Just landed"
          title="New Arrivals"
          products={newArrivals}
          viewAll="/shop?tag=new-arrival"
        />
      )}
      {sections.bestSellers?.enabled !== false && (
        <ProductRow
          eyebrow="Loved by thousands"
          title="Best Sellers"
          products={best}
          viewAll={hp.bestSellersMode === 'auto' ? '/shop?sort=best-selling' : '/shop?tag=best-seller'}
        />
      )}
      <WhyChooseUs />
      <Testimonials />
      <Newsletter />
    </>
  );
}
